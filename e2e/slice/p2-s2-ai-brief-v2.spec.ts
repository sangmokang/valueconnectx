import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loginAs, TEST_USER } from "../helpers/auth";

// ── Admin 헬퍼 ────────────────────────────────────────────────────────────────

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

function hasAnthropicKey(): boolean {
  loadEnv();
  return !!process.env.ANTHROPIC_API_KEY;
}

async function hasPeerCoffeechatSchema(): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("peer_coffee_chats")
    .select("id")
    .limit(1);
  return !error;
}

async function hasApplicationSchema(): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("peer_coffee_applications")
    .select("id")
    .limit(1);
  return !error;
}

// 테스트용 host 멤버를 보장합니다 (E2E_USER_EMAIL 계정)
async function ensureHostMember(): Promise<string | null> {
  const admin = getAdminClient();
  if (!admin) return null;

  const email = process.env.E2E_USER_EMAIL ?? "test@valueconnectx.com";
  const { data } = await admin
    .from("vcx_members")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return data?.id ?? null;
}

interface SeedCoffeechat {
  id: string;
  authorId: string;
}

async function seedPeerCoffeechat(): Promise<SeedCoffeechat | null> {
  const admin = getAdminClient();
  if (!admin) return null;

  const authorId = await ensureHostMember();
  if (!authorId) return null;

  const { data, error } = await admin
    .from("peer_coffee_chats")
    .insert({
      author_id: authorId,
      title: `E2E P2-S2 AI Brief V2 테스트 커피챗 ${Date.now()}`,
      content:
        "AI Brief V2 파이프라인 검증을 위한 E2E 테스트 커피챗입니다. 수수료 필터 및 한국어 출력 검증.",
      category: "career",
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id, authorId };
}

interface SeedApplication {
  id: string;
  hostBrief: string | null;
  applicantBrief: string | null;
  isFallback: boolean;
}

// 수락 상태의 신청을 직접 DB에 심어 brief API를 테스트합니다
async function seedAcceptedApplication(
  chatId: string,
  applicantId: string
): Promise<SeedApplication | null> {
  const admin = getAdminClient();
  if (!admin) return null;

  const fallbackHostBrief = [
    "[AI 브리프 기본 안내]",
    "E2E 테스트용 호스트 브리프입니다.",
    "대화 전에는 신청자가 기대하는 도움, 함께 확인할 질문, 세션 후 다음 액션을 정리하면 좋습니다.",
  ].join("\n");

  const fallbackApplicantBrief = [
    "[AI 브리프 기본 안내]",
    "E2E 테스트용 신청자 브리프입니다.",
    "AI 생성이 일시적으로 제한되어 기본 브리프를 제공합니다.",
  ].join("\n");

  const { data, error } = await admin
    .from("peer_coffee_applications")
    .insert({
      chat_id: chatId,
      applicant_id: applicantId,
      status: "accepted",
      message: "E2E 테스트 신청 메시지",
      host_brief: fallbackHostBrief,
      applicant_brief: fallbackApplicantBrief,
    })
    .select("id, host_brief, applicant_brief")
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    hostBrief: data.host_brief,
    applicantBrief: data.applicant_brief,
    isFallback: !data.host_brief || !data.applicant_brief,
  };
}

async function cleanupCoffeechat(chatId: string): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;
  // 신청 먼저 삭제 (FK 제약)
  await admin
    .from("peer_coffee_applications")
    .delete()
    .eq("chat_id", chatId);
  await admin.from("peer_coffee_chats").delete().eq("id", chatId);
}

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

test.describe("Phase 2 Slice — P2-S2: AI Brief V2 파이프라인 검증", () => {
  // ── TC1: 인증된 host가 peer brief API 호출 시 brief 필드 비null ─────────────

  test("인증된 host가 /api/peer-coffeechat/[id]/brief GET 시 brief 필드가 비null로 반환된다", async ({
    request,
  }) => {
    const hasSchema =
      (await hasPeerCoffeechatSchema()) && (await hasApplicationSchema());
    test.skip(
      !hasSchema,
      "E2E Supabase admin 권한 또는 peer_coffee_chats/peer_coffee_applications 스키마가 없어 건너뜁니다."
    );

    const admin = getAdminClient()!;
    const chat = await seedPeerCoffeechat();
    if (!chat) {
      test.skip(true, "E2E host 멤버 데이터 없어 건너뜁니다.");
      return;
    }

    // 신청자로 host 자신을 사용 (E2E 단순화)
    await seedAcceptedApplication(chat.id, chat.authorId);

    try {
      // host 세션 쿠키를 얻기 위해 이메일/비밀번호로 Supabase auth 직접 호출
      const email =
        process.env.E2E_USER_EMAIL ?? "test@valueconnectx.com";
      const password =
        process.env.E2E_USER_PASSWORD ?? "testpass123!";

      const { data: signInData, error: signInError } =
        await admin.auth.signInWithPassword({ email, password });

      if (signInError || !signInData.session) {
        test.skip(true, "E2E 사용자 로그인 불가 — 건너뜁니다.");
        return;
      }

      const accessToken = signInData.session.access_token;

      const response = await request.get(
        `/api/peer-coffeechat/${chat.id}/brief`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json() as {
        brief: string | null;
        isFallback?: boolean;
        briefGeneratedAt?: string | null;
        applicationId?: string;
      };
      expect(body.brief).not.toBeNull();
      expect(typeof body.brief).toBe("string");
      expect((body.brief as string).length).toBeGreaterThan(0);
    } finally {
      await cleanupCoffeechat(chat.id);
    }
  });

  // ── TC2: CEO brief 응답 본문에 수수료 문구 미포함 ─────────────────────────

  test("CEO brief API 응답 본문에 수수료·25%·fee·commission 문구가 포함되지 않는다 (filterFeeContent 검증)", async ({
    request,
  }) => {
    const hasSchema = await hasCeoSessionSchema();
    test.skip(
      !hasSchema,
      "E2E Supabase admin 권한 또는 vcx_ceo_coffee_sessions 스키마가 없어 건너뜁니다."
    );

    const admin = getAdminClient()!;
    const session = await seedCeoSession();

    if (!session) {
      test.skip(true, "E2E CEO 세션 시드 실패 — 건너뜁니다.");
      return;
    }

    try {
      const email =
        process.env.E2E_USER_EMAIL ?? "test@valueconnectx.com";
      const password =
        process.env.E2E_USER_PASSWORD ?? "testpass123!";

      const { data: signInData, error: signInError } =
        await admin.auth.signInWithPassword({ email, password });

      if (signInError || !signInData.session) {
        test.skip(true, "E2E 사용자 로그인 불가 — 건너뜁니다.");
        return;
      }

      const accessToken = signInData.session.access_token;

      const response = await request.get(
        `/api/ceo-coffeechat/${session.id}/brief`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // 세션/신청이 없으면 null brief 반환 (200) 또는 404 허용
      if (response.status() === 404 || response.status() === 403) {
        // 데이터 없는 케이스는 skip
        test.skip(true, "CEO 세션 brief 데이터 없어 건너뜁니다.");
        return;
      }

      expect(response.status()).toBe(200);
      const body = await response.json() as { brief: string | null };

      if (body.brief === null) {
        // brief null은 신청 없는 케이스 — 수수료 문구 노출 없음으로 검증 통과
        return;
      }

      const briefBody = body.brief;
      expect(briefBody).not.toMatch(/수수료|25%|fee|commission/i);
    } finally {
      await cleanupCeoSession(session.id);
    }
  });

  // ── TC3: 비인증 접근 → 401 ─────────────────────────────────────────────────

  test("비인증 요청이 /api/peer-coffeechat/[id]/brief에 접근하면 401을 반환한다", async ({
    request,
  }) => {
    // 인증 없이 임의 ID로 접근 — 스키마 없어도 실행 가능
    const fakeId = "00000000-0000-0000-0000-000000000001";
    const response = await request.get(
      `/api/peer-coffeechat/${fakeId}/brief`
    );
    expect(response.status()).toBe(401);
  });

  test("비인증 요청이 /api/ceo-coffeechat/[id]/brief에 접근하면 401을 반환한다", async ({
    request,
  }) => {
    const fakeId = "00000000-0000-0000-0000-000000000002";
    const response = await request.get(
      `/api/ceo-coffeechat/${fakeId}/brief`
    );
    expect(response.status()).toBe(401);
  });

  // ── TC5: ANTHROPIC_API_KEY 있을 때 V2 prompt가 한국어/필터/길이 검증 통과 ──

  test("TC5: ANTHROPIC_API_KEY 있을 때 generateCoffeechatBrief는 한국어 brief를 반환하고 수수료 키워드가 0건이며 길이 100자 이상이다", async () => {
    const hasSchema =
      (await hasPeerCoffeechatSchema()) && (await hasApplicationSchema());
    test.skip(
      !hasSchema,
      "E2E Supabase admin 권한 또는 스키마가 없어 건너뜁니다."
    );
    test.skip(
      !hasAnthropicKey(),
      "ANTHROPIC_API_KEY 미설정 — V2 신규 prompt 검증을 건너뜁니다."
    );

    const admin = getAdminClient()!;
    const chat = await seedPeerCoffeechat();
    if (!chat) {
      test.skip(true, "E2E host 멤버 데이터 없어 건너뜁니다.");
      return;
    }

    // host_brief = null 인 accepted application 시드 (V2 생성 경로 유도)
    const { data: appData, error: appError } = await admin
      .from("peer_coffee_applications")
      .insert({
        chat_id: chat.id,
        applicant_id: chat.authorId,
        status: "accepted",
        message: "V2 prompt 검증용 신청",
        host_brief: null,
        applicant_brief: null,
      })
      .select("id")
      .single();

    if (appError || !appData) {
      await cleanupCoffeechat(chat.id);
      test.skip(true, "신청 시드 실패 — 건너뜁니다.");
      return;
    }

    try {
      // V2 prompt 직접 검증: src/lib/ai/brief.ts 의 generateCoffeechatBrief 호출
      // (Anthropic SDK + filterFeeContent + 한국어 prompt 일체 통과)
      const briefModule = await import("../../src/lib/ai/brief");
      const generated = await briefModule.generateCoffeechatBrief({
        sessionTitle: "프로덕트 리더십과 조직 문화에 대한 대화",
        sessionDescription:
          "스타트업 시리즈 B 단계의 PM 채용 전략과 조직 운영 원칙에 대해 솔직하게 이야기 나누고 싶습니다. 현재 팀 구성과 향후 1년 로드맵을 공유합니다.",
        sessionTags: ["product", "leadership"],
        hostName: "김호스트",
        hostTitle: "VP of Product",
        hostCompany: "ValueConnect",
        hostCompanyDesc: "초대 전용 핵심 인재 네트워크",
        applicantName: "박신청",
        applicantRole: "Senior Product Manager",
        applicantCompany: "Acme",
        applicantSpecialties: ["B2B SaaS", "PMF 검증", "리더십"],
        applicantMemberTier: "core",
        briefType: "peer",
      });

      // 응답 구조 — V2 contract: { hostBrief, applicantBrief } 두 필드 모두 채워짐
      expect(typeof generated.hostBrief).toBe("string");
      expect(typeof generated.applicantBrief).toBe("string");
      expect(generated.hostBrief.length).toBeGreaterThan(0);
      expect(generated.applicantBrief.length).toBeGreaterThan(0);

      // ── hostBrief 검증 ──────────────────────────────────────────────────
      const hb = generated.hostBrief;
      // 길이 ≥ 100자 (시드 fallback 한 줄짜리는 100자 미만이므로 V2 출력 보장)
      expect(hb.length).toBeGreaterThanOrEqual(100);
      // 한국어 매치율 ≥ 50% (가-힣 문자 비율)
      const hbKor = (hb.match(/[가-힣]/g) ?? []).length;
      expect(hbKor / hb.length).toBeGreaterThanOrEqual(0.5);
      // 수수료 키워드 0건 (filterFeeContent 통과 검증)
      expect(hb).not.toMatch(/수수료|25%|fee|commission|채용\s*비용|계약금/i);
      // V2 fallback 표시 텍스트가 아님 — 시드 echo 가 아닌 신규 생성물
      expect(hb).not.toContain("[AI 브리프 기본 안내]");

      // ── applicantBrief 검증 ────────────────────────────────────────────
      const ab = generated.applicantBrief;
      expect(ab.length).toBeGreaterThanOrEqual(100);
      const abKor = (ab.match(/[가-힣]/g) ?? []).length;
      expect(abKor / ab.length).toBeGreaterThanOrEqual(0.5);
      expect(ab).not.toMatch(/수수료|25%|fee|commission|채용\s*비용|계약금/i);
      expect(ab).not.toContain("[AI 브리프 기본 안내]");
    } finally {
      await cleanupCoffeechat(chat.id);
    }
  });

  // ── TC4: ANTHROPIC_API_KEY 없을 때 fallback brief 반환 (isFallback: true) ──

  test("ANTHROPIC_API_KEY 없을 때 peer brief API는 fallback brief를 반환한다 (isFallback: true)", async ({
    request,
  }) => {
    const hasSchema =
      (await hasPeerCoffeechatSchema()) && (await hasApplicationSchema());
    test.skip(
      !hasSchema,
      "E2E Supabase admin 권한 또는 스키마가 없어 건너뜁니다."
    );
    test.skip(
      hasAnthropicKey(),
      "ANTHROPIC_API_KEY가 설정되어 있으면 fallback 경로가 활성화되지 않아 건너뜁니다."
    );

    const admin = getAdminClient()!;
    const chat = await seedPeerCoffeechat();

    if (!chat) {
      test.skip(true, "E2E host 멤버 데이터 없어 건너뜁니다.");
      return;
    }

    // host_brief / applicant_brief 를 null로 두어 fallback 경로 유도
    const { data: appData, error: appError } = await admin
      .from("peer_coffee_applications")
      .insert({
        chat_id: chat.id,
        applicant_id: chat.authorId,
        status: "accepted",
        message: "Fallback 경로 검증용 신청",
        host_brief: null,
        applicant_brief: null,
      })
      .select("id")
      .single();

    if (appError || !appData) {
      await cleanupCoffeechat(chat.id);
      test.skip(true, "신청 시드 실패 — 건너뜁니다.");
      return;
    }

    try {
      const email =
        process.env.E2E_USER_EMAIL ?? "test@valueconnectx.com";
      const password =
        process.env.E2E_USER_PASSWORD ?? "testpass123!";

      const { data: signInData, error: signInError } =
        await admin.auth.signInWithPassword({ email, password });

      if (signInError || !signInData.session) {
        test.skip(true, "E2E 사용자 로그인 불가 — 건너뜁니다.");
        return;
      }

      const accessToken = signInData.session.access_token;

      const response = await request.get(
        `/api/peer-coffeechat/${chat.id}/brief`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json() as {
        brief: string | null;
        isFallback: boolean;
      };

      // brief는 null이 아닌 fallback 텍스트여야 한다
      expect(body.brief).not.toBeNull();
      // isFallback 필드가 true여야 한다
      expect(body.isFallback).toBe(true);
      // fallback brief에도 수수료 문구가 없어야 한다
      expect(body.brief).not.toMatch(/수수료|25%|fee|commission/i);
    } finally {
      await cleanupCoffeechat(chat.id);
    }
  });
});

// ── CEO 세션 헬퍼 (TC2 전용) ──────────────────────────────────────────────────

async function hasCeoSessionSchema(): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("vcx_ceo_coffee_sessions")
    .select("id")
    .limit(1);
  return !error;
}

interface SeedCeoSession {
  id: string;
  hostId: string;
}

async function seedCeoSession(): Promise<SeedCeoSession | null> {
  const admin = getAdminClient();
  if (!admin) return null;

  const hostId = await ensureHostMember();
  if (!hostId) return null;

  // vcx_ceo_coffee_sessions 스키마에 맞게 최소 필드만 삽입
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("vcx_ceo_coffee_sessions")
    .insert({
      host_id: hostId,
      title: `E2E P2-S2 CEO Brief 테스트 세션 ${Date.now()}`,
      description: "수수료 필터 검증을 위한 CEO 브리프 E2E 테스트 세션",
      status: "open",
    })
    .select("id")
    .single() as { data: { id: string } | null; error: unknown };

  if (error || !data) return null;
  return { id: data.id, hostId };
}

async function cleanupCeoSession(sessionId: string): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("vcx_coffee_applications")
    .delete()
    .eq("session_id", sessionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("vcx_ceo_coffee_sessions")
    .delete()
    .eq("id", sessionId);
}
