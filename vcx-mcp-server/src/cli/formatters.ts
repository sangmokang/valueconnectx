import {
  welcomeBanner, sectionHeader, divider, dashboardRow,
  positionCard, positionCardCompact,
  coffeeChatCard, coffeeChatCompact,
  ceoSessionCard, anonymousPostCard, memberCard,
  successMsg,
  labelValue, commandHelp, subHeader,
} from "./components.js";
import { ICONS, c, bold, dim, tierBadge } from "./theme.js";
import type { Position, CoffeeChat, CeoSession, AnonymousPost, Member, UserProfile } from "../types.js";

// ─── Dashboard Formatter ────────────────────────────────────────────

export function formatDashboard(profile: UserProfile): string {
  const lines = [
    welcomeBanner(profile.member.name, profile.member.tier),
    "",
    dashboardRow([
      { label: "Matched Positions", value: profile.matchedPositions, icon: ICONS.match },
      { label: "Notifications", value: profile.unreadNotifications, icon: ICONS.notification },
      { label: "Coffee Chats", value: profile.pendingCoffeeChats, icon: ICONS.coffeechat },
    ]),
    "",
    divider(),
    "",
    `  ${c("slate", "Available commands:")}`,
    "",
    commandHelp("positions", "Browse AI-matched job positions"),
    commandHelp("coffee-chat", "Browse & write coffee chat stories"),
    commandHelp("ceo-sessions", "Browse CEO coffee chat sessions"),
    commandHelp("anonymous", "Browse anonymous board"),
    commandHelp("members", "Search member directory"),
    commandHelp("profile", "View & edit your profile"),
    commandHelp("benefits", "View membership benefits"),
    "",
    divider(),
    dim(c("slate", `  ${ICONS.vcx} ValueConnect X v0.1.0 · "Integrity · Growth · Impact"`)),
    "",
  ];
  return lines.join("\n");
}

// ─── Position List Formatter ────────────────────────────────────────

export function formatPositionList(positions: Position[], query?: string): string {
  const header = query
    ? `${ICONS.search} Positions matching "${query}"`
    : `${ICONS.position} Open Positions`;

  const stats = [
    `${c("gold", bold(String(positions.length)))} ${c("slate", "positions")}`,
    `${c("success", bold(String(positions.filter(p => p.isExclusive48h).length)))} ${c("slate", "exclusive")}`,
    `${c("info", bold(String(Math.round(positions.reduce((a, p) => a + p.aiMatchScore, 0) / positions.length))))} ${c("slate", "avg match")}`,
  ].join(c("borderColor", "  │  "));

  const lines = [
    sectionHeader(header),
    "",
    `  ${stats}`,
    "",
    divider(),
    "",
    ...positions.map((p, i) => {
      const result = positionCardCompact(p);
      const sep = i < positions.length - 1 ? `\n${c("borderColor", `  ${ICONS.horizontalLine.repeat(66)}`)}` : "";
      return result + sep;
    }),
    "",
    divider(),
    dim(c("slate", `  Use vcx_position_detail(id) to view full details`)),
    "",
  ];
  return lines.join("\n");
}

export function formatPositionDetail(pos: Position): string {
  return [
    sectionHeader("Position Detail"),
    "",
    positionCard(pos),
    "",
    subHeader("How to proceed"),
    `  ${c("slateLight", `1. Express interest ${c("gold", ICONS.arrow)} We'll connect you with a headhunter within 48h`)}`,
    `  ${c("slateLight", `2. Your profile remains confidential until you approve`)}`,
    "",
  ].join("\n");
}

// ─── Coffee Chat Formatter ──────────────────────────────────────────

export function formatCoffeeChatList(chats: CoffeeChat[], filter?: string): string {
  const header = filter
    ? `${ICONS.coffeechat} Coffee Chats · ${filter}`
    : `${ICONS.coffeechat} Coffee Chat Stories`;

  const lines = [
    sectionHeader(header),
    "",
    `  ${c("slate", `Stories are posted by members seeking meaningful conversations.`)}`,
    `  ${c("slate", `Apply via secret comment ${c("gold", ICONS.arrow)} Author selects who to meet.`)}`,
    "",
    divider(),
    "",
    ...chats.map((chat, i) => {
      const result = coffeeChatCompact(chat);
      const sep = i < chats.length - 1 ? `\n${c("borderColor", `  ${ICONS.horizontalLine.repeat(66)}`)}` : "";
      return result + sep;
    }),
    "",
    divider(),
    "",
  ];
  return lines.join("\n");
}

export function formatCoffeeChatDetail(chat: CoffeeChat): string {
  return [
    sectionHeader("Coffee Chat Story"),
    "",
    coffeeChatCard(chat),
    "",
    subHeader("How it works"),
    `  ${c("slateLight", `1. Write a secret comment introducing yourself`)}`,
    `  ${c("slateLight", `2. Only the author can see your application`)}`,
    `  ${c("slateLight", `3. If selected, contact info is shared mutually`)}`,
    "",
  ].join("\n");
}

// ─── CEO Session Formatter ──────────────────────────────────────────

export function formatCeoSessionList(sessions: CeoSession[]): string {
  const active = sessions.filter(s => s.remainingSlots > 0).length;
  const totalSlots = sessions.reduce((a, s) => a + s.totalSlots, 0);
  const remaining = sessions.reduce((a, s) => a + s.remainingSlots, 0);

  const lines = [
    sectionHeader(`${ICONS.ceo} CEO Coffee Chat Sessions`),
    "",
    dashboardRow([
      { label: "Active Sessions", value: active, icon: ICONS.ceo },
      { label: "Total Slots", value: totalSlots, icon: ICONS.users },
      { label: "Remaining", value: remaining, icon: ICONS.clock },
    ]),
    "",
    divider(),
    "",
    ...sessions.map((s) => ceoSessionCard(s) + "\n"),
    divider(),
    dim(c("slate", `  CEOs reach out to you ${c("gold", ICONS.arrow)} Apply to sessions you're interested in`)),
    "",
  ];
  return lines.join("\n");
}

// ─── Anonymous Board Formatter ──────────────────────────────────────

export function formatAnonymousList(posts: AnonymousPost[], category?: string): string {
  const header = category
    ? `${ICONS.anonymous} Anonymous Board · ${category}`
    : `${ICONS.anonymous} Anonymous Board`;

  const categories = ["All", "Career", "Salary", "Conflict", "Job Change", "Burnout", "Leadership"];

  const lines = [
    sectionHeader(header),
    "",
    `  ${c("slate", "Categories:")} ${categories.map(cat => c("slateLight", cat)).join(c("borderColor", " │ "))}`,
    "",
    divider(),
    "",
    ...posts.map((p) => anonymousPostCard(p) + "\n"),
    divider(),
    dim(c("slate", `  Anonymous but verified ${c("gold", ICONS.arrow)} Only authenticated members can post`)),
    "",
  ];
  return lines.join("\n");
}

// ─── Member Directory Formatter ─────────────────────────────────────

export function formatMemberList(members: Member[], query?: string): string {
  const header = query
    ? `${ICONS.user} Members matching "${query}"`
    : `${ICONS.user} Member Directory`;

  const lines = [
    sectionHeader(header),
    "",
    `  ${c("slate", "Your profile is visible only to you and ValueConnect X.")}`,
    "",
    divider(),
    "",
    ...members.map((m) => memberCard(m) + "\n"),
    divider(),
    "",
  ];
  return lines.join("\n");
}

// ─── Profile Formatter ─────────────────────────────────────────────

export function formatProfile(profile: UserProfile): string {
  const m = profile.member;
  const lines = [
    sectionHeader(`${ICONS.user} My Profile`),
    "",
    `  ${c("offWhite", bold(m.name))} ${tierBadge(m.tier)}`,
    "",
    labelValue("Title", `${m.title} @ ${m.company}`),
    labelValue("Expertise", m.expertise.join(", ")),
    labelValue("Joined", m.joinedAt),
    "",
    divider(),
    "",
    subHeader("Activity Summary"),
    "",
    labelValue("Matched Positions", String(profile.matchedPositions)),
    labelValue("Pending Coffee Chats", String(profile.pendingCoffeeChats)),
    labelValue("Active Applications", String(profile.activeApplications)),
    labelValue("Unread Notifications", String(profile.unreadNotifications)),
    "",
  ];
  return lines.join("\n");
}

// ─── Benefits Formatter ─────────────────────────────────────────────

export function formatBenefits(tier: "CORE" | "INTRO"): string {
  const benefits = [
    {
      name: "Self-Introduction Reward",
      desc: "Introduce yourself → Headhunting success → KRW 5M",
      core: true, intro: true,
    },
    {
      name: "Referral Commission",
      desc: "Refer talent → Success → 30% of placement fee (KRW 6~15M)",
      core: true, intro: false,
    },
    {
      name: "Exclusive Market Data",
      desc: "Monthly briefing on salary bands, offer trends, market insights",
      core: true, intro: false,
    },
    {
      name: "Coffee Chat Network",
      desc: "Write stories + apply via secret comments (full P2P access)",
      core: "Write + Apply", intro: "Apply only",
    },
    {
      name: "CEO Coffee Chat",
      desc: "Apply to CEO sessions. 3-5 sessions monthly",
      core: "Priority", intro: "Available",
    },
    {
      name: "AI-Matched Positions",
      desc: "Score 80+ positions only. EXCLUSIVE 48H priority access",
      core: "48H Priority", intro: "Available",
    },
  ];

  const lines = [
    sectionHeader(`${ICONS.star} Membership Benefits · ${tier}`),
    "",
    ...benefits.map((b) => {
      const access = tier === "CORE"
        ? (typeof b.core === "string" ? c("gold", b.core) : b.core ? c("success", ICONS.check) : c("error", ICONS.cross))
        : (typeof b.intro === "string" ? c("info", b.intro) : b.intro ? c("success", ICONS.check) : c("error", ICONS.cross));

      return [
        `  ${access} ${c("offWhite", bold(b.name))}`,
        `     ${c("slateLight", b.desc)}`,
      ].join("\n");
    }),
    "",
    divider(),
    "",
  ];
  return lines.join("\n");
}

// ─── Write Confirmation ─────────────────────────────────────────────

export function formatWriteSuccess(type: string, title: string): string {
  return [
    "",
    successMsg(`${type} posted successfully!`),
    "",
    labelValue("Title", title),
    labelValue("Status", c("success", "Published")),
    "",
    dim(c("slate", `  Your post is now visible to other members.`)),
    "",
  ].join("\n");
}

export function formatInterestExpressed(position: string, company: string): string {
  return [
    "",
    successMsg("Interest expressed!"),
    "",
    labelValue("Position", position),
    labelValue("Company", company),
    labelValue("Next Step", c("gold", "Headhunter will contact you within 48h")),
    "",
    dim(c("slate", `  Your profile remains confidential until you approve sharing.`)),
    "",
  ].join("\n");
}
