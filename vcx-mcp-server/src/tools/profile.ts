import { CURRENT_USER, MEMBERS } from "../data/mock.js";
import {
  formatDashboard, formatProfile, formatMemberList, formatBenefits,
  formatWriteSuccess,
} from "../cli/formatters.js";

export function getDashboard(): string {
  return formatDashboard(CURRENT_USER);
}

export function getProfile(): string {
  return formatProfile(CURRENT_USER);
}

export function searchMembers(args: { query?: string; tier?: string }): string {
  let members = [...MEMBERS];

  if (args.tier) {
    members = members.filter(
      (m) => m.tier.toLowerCase() === args.tier!.toLowerCase()
    );
  }
  if (args.query) {
    const q = args.query.toLowerCase();
    members = members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.expertise.some((e) => e.toLowerCase().includes(q))
    );
  }

  if (members.length === 0) {
    return "No members found matching your search.";
  }

  return formatMemberList(members, args.query);
}

export function writeIntroduction(args: {
  bio: string;
  expertise: string[];
}): string {
  return formatWriteSuccess("Self Introduction", `Updated profile for ${CURRENT_USER.member.name}`);
}

export function getBenefits(args: { tier?: string }): string {
  const tier = (args.tier?.toUpperCase() === "INTRO" ? "INTRO" : "CORE") as "CORE" | "INTRO";
  return formatBenefits(tier);
}
