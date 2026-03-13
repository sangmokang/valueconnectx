import { ANSI, ICONS, SPACING, c, bold, dim, matchScoreColor, tierBadge } from "./theme.js";
import type { Position, CoffeeChat, CeoSession, AnonymousPost, Member } from "../types.js";

const TERM_WIDTH = 72;

// ─── Box Drawing ────────────────────────────────────────────────────

export function box(content: string, title?: string, width = TERM_WIDTH): string {
  const lines = content.split("\n");
  const innerWidth = width - 4;

  const top = title
    ? `${c("borderColor", ICONS.cornerTL + ICONS.horizontalLine)} ${c("gold", bold(title))} ${c("borderColor", ICONS.horizontalLine.repeat(Math.max(0, innerWidth - title.length - 2)) + ICONS.cornerTR)}`
    : c("borderColor", ICONS.cornerTL + ICONS.horizontalLine.repeat(width - 2) + ICONS.cornerTR);

  const bottom = c("borderColor", ICONS.cornerBL + ICONS.horizontalLine.repeat(width - 2) + ICONS.cornerBR);

  const body = lines
    .map((line) => {
      const stripped = stripAnsi(line);
      const pad = Math.max(0, innerWidth - stripped.length);
      return `${c("borderColor", ICONS.verticalBar)} ${line}${" ".repeat(pad)} ${c("borderColor", ICONS.verticalBar)}`;
    })
    .join("\n");

  return `${top}\n${body}\n${bottom}`;
}

export function divider(char = ICONS.horizontalLine, width = TERM_WIDTH): string {
  return c("borderColor", char.repeat(width));
}

export function sectionHeader(title: string): string {
  const line = c("borderColor", ICONS.horizontalLine.repeat(3));
  return `\n${line} ${c("gold", bold(title))} ${c("borderColor", ICONS.horizontalLine.repeat(Math.max(0, TERM_WIDTH - title.length - 6)))}`;
}

export function subHeader(title: string): string {
  return `${c("slate", ICONS.bullet)} ${c("offWhite", bold(title))}`;
}

// ─── Banner ─────────────────────────────────────────────────────────

export function banner(): string {
  const art = [
    "",
    `${ANSI.bold}${ANSI.gold}  ╦  ╦╔═╗╦  ╦ ╦╔═╗  ╔═╗╔═╗╔╗╔╔╗╔╔═╗╔═╗╔╦╗  ═╗ ╦${ANSI.reset}`,
    `${ANSI.bold}${ANSI.gold}  ╚╗╔╝╠═╣║  ║ ║║╣   ║  ║ ║║║║║║║║╣ ║   ║    ╔╩╦╝${ANSI.reset}`,
    `${ANSI.bold}${ANSI.gold}   ╚╝ ╩ ╩╩═╝╚═╝╚═╝  ╚═╝╚═╝╝╚╝╝╚╝╚═╝╚═╝ ╩   ╩ ╚═${ANSI.reset}`,
    "",
    `${ANSI.dim}${ANSI.slateLight}  Invite-Only ${ANSI.gold}${ICONS.vcx}${ANSI.reset}${ANSI.dim}${ANSI.slateLight} AI-Native Talent Network${ANSI.reset}`,
    `${ANSI.dim}${ANSI.slate}  ${ICONS.horizontalLine.repeat(48)}${ANSI.reset}`,
    "",
  ];
  return art.join("\n");
}

export function welcomeBanner(memberName: string, tier: "CORE" | "INTRO"): string {
  const lines = [
    banner(),
    `  ${c("offWhite", `Welcome back, ${bold(memberName)}`)} ${tierBadge(tier)}`,
    `  ${dim(c("slate", "Integrity · Growth · Impact"))}`,
    "",
    divider(),
  ];
  return lines.join("\n");
}

// ─── Dashboard ──────────────────────────────────────────────────────

export function statCard(label: string, value: string | number, icon: string): string {
  return `${c("gold", icon)} ${c("offWhite", bold(String(value)))} ${c("slate", label)}`;
}

export function dashboardRow(stats: Array<{ label: string; value: string | number; icon: string }>): string {
  return stats.map((s) => statCard(s.label, s.value, s.icon)).join(c("borderColor", "  │  "));
}

// ─── Position Card ──────────────────────────────────────────────────

export function positionCard(pos: Position): string {
  const scoreColor = matchScoreColor(pos.aiMatchScore);
  const exclusive = pos.isExclusive48h ? ` ${c("gold", `${ICONS.exclusive} EXCLUSIVE 48H`)}` : "";
  const tags = pos.tags.map((t) => c("slate", `#${t}`)).join(" ");

  const lines = [
    `${c("slate", pos.level)} ${c("borderColor", ICONS.dot)} ${c("slateLight", pos.industry)}${exclusive}`,
    `${c("offWhite", bold(pos.company))}`,
    `${c("white", bold(pos.title))}`,
    "",
    c("slateLight", truncate(pos.description, 140)),
    "",
    ...pos.quotes.map((q) => c("slate", italic(`"${q}"`))),
    "",
    `${tags}`,
    "",
    `${scoreColor}${ICONS.match} AI MATCH: ${ANSI.bold}${pos.aiMatchScore}${ANSI.reset}  ${c("slateLight", pos.location)} ${c("borderColor", ICONS.dot)} ${c("slate", pos.postedAt)}`,
  ];

  return box(lines.join("\n"), `${ICONS.position} POSITION`);
}

export function positionCardCompact(pos: Position): string {
  const scoreColor = matchScoreColor(pos.aiMatchScore);
  const exclusive = pos.isExclusive48h ? `${c("gold", ` ${ICONS.exclusive}`)}` : "";
  return [
    `  ${scoreColor}${pos.aiMatchScore}${ANSI.reset} ${c("offWhite", bold(pos.title))}${exclusive}`,
    `     ${c("slateLight", pos.company)} ${c("borderColor", ICONS.dot)} ${c("slate", pos.industry)} ${c("borderColor", ICONS.dot)} ${c("slate", pos.location)}`,
  ].join("\n");
}

// ─── Coffee Chat Card ───────────────────────────────────────────────

export function coffeeChatCard(chat: CoffeeChat): string {
  const tags = chat.tags.map((t) => c("slate", `#${t}`)).join(" ");
  const lines = [
    `${c("offWhite", bold(chat.author.name))} ${c("borderColor", ICONS.dot)} ${c("slateLight", chat.author.title)} @${chat.author.company} ${tierBadge(chat.author.tier)}`,
    "",
    `${c("white", bold(`"${chat.title}"`))}`,
    "",
    c("slateLight", truncate(chat.body, 160)),
    "",
    tags,
    "",
    `${c("slate", chat.postedAt)} ${c("borderColor", ICONS.dot)} ${c("gold", `${ICONS.lock} ${chat.secretApplyCount}`)}`
  ];
  return box(lines.join("\n"), `${ICONS.coffeechat} COFFEE CHAT`);
}

export function coffeeChatCompact(chat: CoffeeChat): string {
  return [
    `  ${tierBadge(chat.author.tier)} ${c("offWhite", bold(chat.author.name))} ${c("borderColor", ICONS.dot)} ${c("slate", chat.author.title)}`,
    `     ${c("white", `"${truncate(chat.title, 50)}"`)}`  ,
    `     ${c("slate", chat.postedAt)} ${c("borderColor", ICONS.dot)} ${c("gold", `${chat.secretApplyCount}`)}`,
  ].join("\n");
}

// ─── CEO Session Card ───────────────────────────────────────────────

export function ceoSessionCard(session: CeoSession): string {
  const formatBadge = session.format === "offline"
    ? c("success", "OFFLINE")
    : c("info", "ONLINE");

  const slotColor = session.remainingSlots <= 1 ? ANSI.error : session.remainingSlots <= 2 ? ANSI.warning : ANSI.success;
  const slots = `${slotColor}${session.remainingSlots}/${session.totalSlots}${ANSI.reset}`;

  const lines = [
    `${c("offWhite", bold(session.ceoName))} ${c("borderColor", ICONS.dot)} ${c("slateLight", session.ceoTitle)} ${c("borderColor", ICONS.dot)} ${c("slateLight", session.company)}`,
    `${c("slate", session.industry)} ${c("borderColor", ICONS.dot)} ${c("slate", session.companySize)}`,
    `${formatBadge} ${c("borderColor", ICONS.dot)} ${c("slateLight", `${session.duration}min`)} ${c("borderColor", ICONS.dot)} ${c("slateLight", session.schedule)}`,
    "",
    c("slateLight", truncate(session.description, 160)),
    "",
    `${c("slate", `joined ${session.postedAt}`)} ${c("borderColor", ICONS.dot)} ${slots} slots`,
  ];
  return box(lines.join("\n"), `${ICONS.ceo} CEO SESSION`);
}

// ─── Anonymous Post Card ────────────────────────────────────────────

export function anonymousPostCard(post: AnonymousPost): string {
  const reactions = Object.entries(post.reactions)
    .map(([emoji, count]) => `${emoji} ${count}`)
    .join("  ");

  const lines = [
    `${c("gold", post.category)} ${c("borderColor", ICONS.dot)} ${c("slate", post.postedAt)} ${c("borderColor", ICONS.dot)} ${c("slate", `${post.views}`)}`,
    "",
    `${c("white", bold(`"${post.title}"`))}`,
    "",
    c("slateLight", truncate(post.body, 160)),
    "",
    `${c("slateLight", reactions)} ${c("borderColor", ICONS.dot)} ${c("slate", `${post.commentCount}`)}`,
  ];
  return box(lines.join("\n"), `${ICONS.anonymous} ANONYMOUS`);
}

// ─── Member Card ────────────────────────────────────────────────────

export function memberCard(member: Member): string {
  const tags = member.expertise.map((t) => c("info", `${t}`)).join(c("borderColor", " · "));
  const lines = [
    `${c("offWhite", bold(member.name))} ${tierBadge(member.tier)}`,
    `${c("slateLight", member.title)} ${c("borderColor", ICONS.dot)} ${c("slateLight", member.company)}`,
    tags,
    `${c("slate", `joined ${member.joinedAt}`)}`,
  ];
  if (member.bio) {
    lines.push("", c("slateLight", truncate(member.bio, 140)));
  }
  return box(lines.join("\n"), `${ICONS.user} MEMBER`);
}

// ─── Notification / Status ──────────────────────────────────────────

export function successMsg(text: string): string {
  return `${c("success", `${ICONS.check} ${text}`)}`;
}

export function errorMsg(text: string): string {
  return `${c("error", `${ICONS.cross} ${text}`)}`;
}

export function warningMsg(text: string): string {
  return `${c("warning", `${ICONS.fire} ${text}`)}`;
}

export function infoMsg(text: string): string {
  return `${c("info", `${ICONS.search} ${text}`)}`;
}

// ─── List / Table ───────────────────────────────────────────────────

export function labelValue(label: string, value: string): string {
  return `  ${c("slate", label + ":")} ${c("offWhite", value)}`;
}

export function numberedList(items: string[]): string {
  return items.map((item, i) => `  ${c("gold", `${String(i + 1).padStart(2)}.`)} ${item}`).join("\n");
}

// ─── Help / Command Reference ───────────────────────────────────────

export function commandHelp(cmd: string, description: string): string {
  return `  ${c("gold", cmd.padEnd(28))} ${c("slateLight", description)}`;
}

// ─── Utilities ──────────────────────────────────────────────────────

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + ICONS.ellipsis;
}
