import { createTestAdminClient as getAdminClient } from "../../src/lib/testing/database";

// ── Admin 헬퍼 ────────────────────────────────────────────────────────────────

export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function hasPeerCoffeechatSchema(): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("peer_coffee_chats")
    .select("id")
    .limit(1);
  return !error;
}

export async function hasApplicationSchema(): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("peer_coffee_applications")
    .select("id")
    .limit(1);
  return !error;
}

// 테스트용 host 멤버를 보장합니다 (E2E_USER_EMAIL 계정)
export async function ensureHostMember(): Promise<string | null> {
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

export async function seedPeerCoffeechat(): Promise<SeedCoffeechat | null> {
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
export async function seedAcceptedApplication(
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

export async function cleanupCoffeechat(chatId: string): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;
  // 신청 먼저 삭제 (FK 제약)
  await admin
    .from("peer_coffee_applications")
    .delete()
    .eq("chat_id", chatId);
  await admin.from("peer_coffee_chats").delete().eq("id", chatId);
}
