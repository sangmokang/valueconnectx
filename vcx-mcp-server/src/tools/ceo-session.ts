import { CEO_SESSIONS } from "../data/mock.js";
import { formatCeoSessionList, formatWriteSuccess } from "../cli/formatters.js";

export function browseCeoSessions(args: {
  format?: string;
  industry?: string;
}): string {
  let sessions = [...CEO_SESSIONS];

  if (args.format) {
    sessions = sessions.filter(
      (s) => s.format.toLowerCase() === args.format!.toLowerCase()
    );
  }
  if (args.industry) {
    const ind = args.industry.toLowerCase();
    sessions = sessions.filter((s) => s.industry.toLowerCase().includes(ind));
  }

  if (sessions.length === 0) {
    return "No CEO coffee chat sessions found matching your criteria.";
  }

  return formatCeoSessionList(sessions);
}

export function applyCeoSession(args: {
  sessionId: string;
  motivation: string;
}): string {
  const session = CEO_SESSIONS.find((s) => s.id === args.sessionId);
  if (!session) {
    return `CEO session "${args.sessionId}" not found.`;
  }
  if (session.remainingSlots === 0) {
    return `This session is fully booked. No remaining slots.`;
  }
  return formatWriteSuccess(
    "CEO Session Application",
    `Applied to ${session.ceoName}'s session at ${session.company}`
  );
}
