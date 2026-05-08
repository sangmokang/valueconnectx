import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── 환경 변수 로더 ─────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);
      process.env[key] ||= value;
    }
  } catch {
    // CI는 환경변수를 직접 주입한다.
  }
}

function getAdminClient() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── 테스트용 초대 레코드 픽스처 ───────────────────────────────────────────────

interface SeedInviteOpts {
  email: string;
  inviteeName?: string;
  inviteeCompany?: string;
  inviteeTitle?: string;
}

interface SeededInvite {
  id: string;
  rawToken: string;
  tokenHash: string;
  email: string;
}

/**
 * vcx_invites 에 테스트용 레코드를 직접 삽입한다.
 * token_hash 는 SHA-256(rawToken) — lib/invite 의 hashToken 과 동일 로직.
 */
async function seedInvite(opts: SeedInviteOpts): Promise<SeededInvite | null> {
  const admin = getAdminClient();
  if (!admin) return null;

  // 랜덤 토큰 생성 (hex 48자 → 검증 route 와 동일 길이)
  const rawToken = Array.from(
    { length: 48 },
    () => Math.floor(Math.random() * 16).toString(16)
  ).join("");

  // SHA-256 해시 (Web Crypto API via Node.js global)
  const encoder = new TextEncoder();
  const data = encoder.encode(rawToken);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const tokenHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 만료는 24시간 후
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await admin
    .from("vcx_invites")
    .insert({
      email: opts.email,
      invited_by: null,
      invited_by_name: "P2-S1 E2E 테스트",
      member_tier: "core",
      token_hash: tokenHash,
      expires_at: expiresAt,
      status: "pending",
      invitee_name: opts.inviteeName ?? null,
      invitee_company: opts.inviteeCompany ?? null,
      invitee_title: opts.inviteeTitle ?? null,
    })
    .select("id")
    .single();

  if (error || !invite) return null;
  return { id: invite.id, rawToken, tokenHash, email: opts.email };
}

/** 테스트 완료 후 생성한 초대·멤버 레코드를 정리한다 */
async function cleanupInvite(id: string, email: string): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;
  await admin.from("vcx_members").delete().eq("email", email);
  await admin.from("vcx_invites").delete().eq("id", id);
}

async function hasInviteSeedFields(): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;
  // invitee_name 컬럼이 존재하는지 확인 (migration 030 이후)
  const { error } = await admin
    .from("vcx_invites")
    .select("invitee_name, invitee_company, invitee_title")
    .limit(1);
  return !error;
}

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

test.describe("Phase 2 Slice — P2-S1: Cold Start 자동화 (초대 시드 필드)", () => {
  // TC-1: verify 응답에 inviteeName/inviteeCompany/inviteeTitle 포함 ────────────

  test("TC-1: /api/invites/verify/[token] 응답에 inviteeName·inviteeCompany·inviteeTitle 이 포함된다", async ({
    request,
  }) => {
    test.skip(
      !(await hasInviteSeedFields()),
      "SUPABASE_SERVICE_ROLE_KEY 미설정 또는 migration 030 미적용으로 건너뜁니다."
    );

    const email = `p2s1-tc1-${Date.now()}@e2e.test`;
    const seeded = await seedInvite({
      email,
      inviteeName: "홍길동",
      inviteeCompany: "ValueConnect",
      inviteeTitle: "CTO",
    });
    test.skip(!seeded, "초대 레코드 삽입 실패로 건너뜁니다.");

    try {
      const res = await request.get(
        `/api/invites/verify/${seeded!.rawToken}`
      );
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(body.valid).toBe(true);
      expect(body.inviteeName).toBe("홍길동");
      expect(body.inviteeCompany).toBe("ValueConnect");
      expect(body.inviteeTitle).toBe("CTO");
      // 기존 필드도 확인
      expect(body.email).toBe(email);
      expect(typeof body.memberTier).toBe("string");
    } finally {
      await cleanupInvite(seeded!.id, email);
    }
  });

  // TC-2: /invite/accept?token= 접근 시 name/company/title pre-fill ───────────

  test("TC-2: /invite/accept?token=<valid> 에서 이름·회사·직책 input 이 pre-fill 값으로 렌더된다", async ({
    page,
  }) => {
    test.skip(
      !(await hasInviteSeedFields()),
      "SUPABASE_SERVICE_ROLE_KEY 미설정 또는 migration 030 미적용으로 건너뜁니다."
    );

    const email = `p2s1-tc2-${Date.now()}@e2e.test`;
    const seeded = await seedInvite({
      email,
      inviteeName: "김테스트",
      inviteeCompany: "테스트컴퍼니",
      inviteeTitle: "VP Engineering",
    });
    test.skip(!seeded, "초대 레코드 삽입 실패로 건너뜁니다.");

    try {
      await page.goto(`/invite/accept?token=${seeded!.rawToken}`);

      // 폼 렌더 대기 — verifyToken 비동기 완료 후 step='form' 으로 전환됨
      await expect(
        page.getByPlaceholder("홍길동")
      ).toBeVisible({ timeout: 15000 });

      // pre-fill 값 검증
      await expect(page.getByPlaceholder("홍길동")).toHaveValue("김테스트");
      await expect(page.getByPlaceholder("회사명")).toHaveValue("테스트컴퍼니");
      await expect(
        page.getByPlaceholder("CTO, 시니어 엔지니어 등")
      ).toHaveValue("VP Engineering");
    } finally {
      await cleanupInvite(seeded!.id, email);
    }
  });

  // TC-3: 수락 제출 후 vcx_members 에 company/title 저장됨 ───────────────────

  test("TC-3: 초대 수락 제출 후 vcx_members 레코드에 company·title 이 저장된다", async ({
    page,
  }) => {
    test.skip(
      !(await hasInviteSeedFields()),
      "SUPABASE_SERVICE_ROLE_KEY 미설정 또는 migration 030 미적용으로 건너뜁니다."
    );

    const email = `p2s1-tc3-${Date.now()}@e2e.test`;
    const password = "P2S1-E2E-test-pass!";
    const seeded = await seedInvite({
      email,
      inviteeName: "박검증",
      inviteeCompany: "시드컴퍼니",
      inviteeTitle: "시니어 엔지니어",
    });
    test.skip(!seeded, "초대 레코드 삽입 실패로 건너뜁니다.");

    const admin = getAdminClient()!;

    try {
      await page.goto(`/invite/accept?token=${seeded!.rawToken}`);

      // 폼 로드 대기
      await expect(
        page.getByPlaceholder("홍길동")
      ).toBeVisible({ timeout: 15000 });

      // 필수 필드 입력 (pre-fill 된 값 그대로 사용, 비밀번호만 입력)
      await page.getByPlaceholder("••••••••").first().fill(password);
      await page.getByPlaceholder("••••••••").nth(1).fill(password);

      // 제출
      await page.getByRole("button", { name: "계정 생성하기" }).click();

      // /onboarding 또는 /login 으로 리다이렉트됨
      await expect(page).toHaveURL(/\/(onboarding|login)/, {
        timeout: 15000,
      });

      // admin client 로 vcx_members 직접 조회
      const { data: member, error } = await admin
        .from("vcx_members")
        .select("name, current_company, title")
        .eq("email", email)
        .single();

      expect(error).toBeNull();
      expect(member).not.toBeNull();
      expect(member!.name).toBe("박검증");
      // invitee_company → current_company pre-seed
      expect(member!.current_company).toBe("시드컴퍼니");
      // invitee_title → title pre-seed
      expect(member!.title).toBe("시니어 엔지니어");
    } finally {
      // auth user 도 정리
      const { data: users } = await admin.auth.admin.listUsers();
      const authUser = users?.users?.find((u) => u.email === email);
      if (authUser) {
        await admin.auth.admin.deleteUser(authUser.id);
      }
      await cleanupInvite(seeded!.id, email);
    }
  });

  // TC-4: /api/invites/direct 동일 이메일 재호출 → 409 idempotent ───────────

  test("TC-4: admin이 /api/invites/direct로 동일 이메일을 재초대하면 첫 호출은 201, 두 번째는 409를 반환한다", async ({
    request,
  }) => {
    test.skip(
      !(await hasInviteSeedFields()),
      "SUPABASE_SERVICE_ROLE_KEY 미설정 또는 migration 030 미적용으로 건너뜁니다."
    );

    const admin = getAdminClient()!;

    // E2E admin 계정 로그인 — system_role in ('admin','super_admin') 필요
    const adminEmail =
      process.env.E2E_ADMIN_EMAIL ?? process.env.E2E_USER_EMAIL ?? "test@valueconnectx.com";
    const adminPassword =
      process.env.E2E_ADMIN_PASSWORD ?? process.env.E2E_USER_PASSWORD ?? "testpass123!";

    const { data: signInData, error: signInError } =
      await admin.auth.signInWithPassword({ email: adminEmail, password: adminPassword });

    if (signInError || !signInData.session) {
      test.skip(true, "E2E admin 계정 로그인 불가 — 건너뜁니다.");
      return;
    }

    // admin 권한 확인 (system_role)
    const { data: roleRow } = await admin
      .from("vcx_members")
      .select("system_role")
      .eq("id", signInData.session.user.id)
      .single();
    if (
      !roleRow ||
      !["admin", "super_admin"].includes((roleRow as { system_role?: string }).system_role ?? "")
    ) {
      test.skip(true, "E2E 계정에 admin 권한이 없어 건너뜁니다.");
      return;
    }

    const accessToken = signInData.session.access_token;
    const email = `p2s1-tc4-${Date.now()}@e2e.test`;
    const payload = {
      email,
      member_tier: "core",
      invitee_name: "중복방지 테스트",
      invitee_company: "ValueConnect",
      invitee_title: "Engineer",
    };

    let firstInviteId: string | null = null;

    try {
      // 첫 번째 호출 → 201 (생성)
      const firstRes = await request.post(`/api/invites/direct`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: payload,
      });
      expect([200, 201]).toContain(firstRes.status());
      const firstBody = (await firstRes.json()) as { data?: { id?: string } };
      firstInviteId = firstBody.data?.id ?? null;
      expect(firstInviteId).not.toBeNull();

      // 두 번째 호출 (동일 페이로드) → 409 (중복 차단)
      const secondRes = await request.post(`/api/invites/direct`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: payload,
      });
      expect(secondRes.status()).toBe(409);
      const secondBody = (await secondRes.json()) as { error?: string };
      expect(typeof secondBody.error).toBe("string");
      expect((secondBody.error ?? "").length).toBeGreaterThan(0);
      // 한국어 에러 문구에 "초대" 또는 "멤버" 키워드 포함 (구현 메시지 기준)
      expect(secondBody.error).toMatch(/초대|멤버/);
    } finally {
      // 생성된 초대와 잔여 레코드 정리
      await admin.from("vcx_invites").delete().eq("email", email);
      await admin.from("vcx_members").delete().eq("email", email);
    }
  });
});
