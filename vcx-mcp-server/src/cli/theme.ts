// VCX CLI Design System
// Inspired by Claude Code's terminal aesthetics
// Color palette: Deep Navy + Off-White + Gold accent

export const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  strikethrough: "\x1b[9m",

  // VCX Brand Colors (256-color / truecolor)
  navy: "\x1b[38;2;15;23;42m",
  navyBg: "\x1b[48;2;15;23;42m",
  deepNavy: "\x1b[38;2;8;12;28m",
  deepNavyBg: "\x1b[48;2;8;12;28m",
  slate: "\x1b[38;2;100;116;139m",
  slateLight: "\x1b[38;2;148;163;184m",
  offWhite: "\x1b[38;2;241;245;249m",
  offWhiteBg: "\x1b[48;2;241;245;249m",
  white: "\x1b[38;2;255;255;255m",
  whiteBg: "\x1b[48;2;255;255;255m",

  // Gold accent
  gold: "\x1b[38;2;234;179;8m",
  goldBg: "\x1b[48;2;234;179;8m",
  goldDim: "\x1b[38;2;161;128;21m",
  amber: "\x1b[38;2;245;158;11m",

  // Semantic Colors
  success: "\x1b[38;2;34;197;94m",
  successBg: "\x1b[48;2;34;197;94m",
  error: "\x1b[38;2;239;68;68m",
  errorBg: "\x1b[48;2;239;68;68m",
  warning: "\x1b[38;2;234;179;8m",
  info: "\x1b[38;2;59;130;246m",
  infoBg: "\x1b[48;2;59;130;246m",

  // Tier Colors
  core: "\x1b[38;2;234;179;8m",
  coreBg: "\x1b[48;2;234;179;8m",
  intro: "\x1b[38;2;147;197;253m",
  introBg: "\x1b[48;2;147;197;253m",

  // Match Score Gradient
  matchHigh: "\x1b[38;2;34;197;94m",
  matchMid: "\x1b[38;2;234;179;8m",
  matchLow: "\x1b[38;2;239;68;68m",

  // Background variants
  cardBg: "\x1b[48;2;30;41;59m",
  surfaceBg: "\x1b[48;2;15;23;42m",
  borderColor: "\x1b[38;2;51;65;85m",
} as const;

export const ICONS = {
  vcx: "◆",
  bullet: "›",
  check: "✓",
  cross: "✗",
  arrow: "→",
  arrowLeft: "←",
  star: "★",
  starEmpty: "☆",
  diamond: "◇",
  dot: "·",
  ellipsis: "…",
  lock: "⊘",
  unlock: "○",
  fire: "▲",
  clock: "◷",
  search: "⊙",
  user: "◉",
  users: "◉◉",
  mail: "✉",
  pin: "⊕",
  tag: "#",
  exclusive: "⚡",
  match: "◈",
  coffeechat: "☕",
  anonymous: "◐",
  ceo: "◆",
  position: "◇",
  notification: "●",
  separator: "─",
  verticalBar: "│",
  cornerTL: "╭",
  cornerTR: "╮",
  cornerBL: "╰",
  cornerBR: "╯",
  teeRight: "├",
  teeLeft: "┤",
  cross_line: "┼",
  horizontalLine: "─",
  doubleLine: "═",
} as const;

export const SPACING = {
  indent: "  ",
  doubleIndent: "    ",
  tripleIndent: "      ",
} as const;

export function c(color: keyof typeof ANSI, text: string): string {
  return `${ANSI[color]}${text}${ANSI.reset}`;
}

export function bold(text: string): string {
  return `${ANSI.bold}${text}${ANSI.reset}`;
}

export function dim(text: string): string {
  return `${ANSI.dim}${text}${ANSI.reset}`;
}

export function italic(text: string): string {
  return `${ANSI.italic}${text}${ANSI.reset}`;
}

export function matchScoreColor(score: number): string {
  if (score >= 90) return ANSI.matchHigh;
  if (score >= 80) return ANSI.matchMid;
  return ANSI.matchLow;
}

export function tierColor(tier: "CORE" | "INTRO"): string {
  return tier === "CORE" ? ANSI.core : ANSI.intro;
}

export function tierBadge(tier: "CORE" | "INTRO"): string {
  if (tier === "CORE") {
    return `${ANSI.bold}${ANSI.core}[CORE]${ANSI.reset}`;
  }
  return `${ANSI.bold}${ANSI.intro}[INTRO]${ANSI.reset}`;
}
