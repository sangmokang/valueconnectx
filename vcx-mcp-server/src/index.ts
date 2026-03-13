#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { searchPositions, getPositionDetail, expressInterest } from "./tools/positions.js";
import { browseCoffeeChats, getCoffeeChatDetail, writeStory, applyToCoffeeChat } from "./tools/coffee-chat.js";
import { browseCeoSessions, applyCeoSession } from "./tools/ceo-session.js";
import { browseAnonymous, writeAnonymousPost } from "./tools/anonymous.js";
import { getDashboard, getProfile, searchMembers, writeIntroduction, getBenefits } from "./tools/profile.js";

const server = new McpServer({
  name: "valueconnectx",
  version: "0.1.0",
});

// ─── Dashboard & Profile ────────────────────────────────────────────

server.tool(
  "vcx_dashboard",
  "Show your VCX dashboard - matched positions, notifications, pending coffee chats, and available commands",
  {},
  async () => ({ content: [{ type: "text", text: getDashboard() }] })
);

server.tool(
  "vcx_my_profile",
  "View your VCX profile - name, tier, expertise, activity summary",
  {},
  async () => ({ content: [{ type: "text", text: getProfile() }] })
);

server.tool(
  "vcx_benefits",
  "View membership benefits for Core or Intro tier - rewards, access levels, exclusive features",
  { tier: z.enum(["CORE", "INTRO"]).optional().describe("Tier to view benefits for (default: your tier)") },
  async (args) => ({ content: [{ type: "text", text: getBenefits(args) }] })
);

// ─── Position Tools ─────────────────────────────────────────────────

server.tool(
  "vcx_search_positions",
  "Search AI-matched job positions. Filter by category, keyword, minimum match score, or exclusive-only. Results sorted by AI match score.",
  {
    category: z.enum(["Engineering", "Product", "Business", "Sales", "Finance", "People"]).optional().describe("Job category filter"),
    keyword: z.string().optional().describe("Search keyword (company, title, skill, tag)"),
    minScore: z.number().min(0).max(100).optional().describe("Minimum AI match score (default: 80)"),
    exclusiveOnly: z.boolean().optional().describe("Show only EXCLUSIVE 48H positions"),
  },
  async (args) => ({ content: [{ type: "text", text: searchPositions(args) }] })
);

server.tool(
  "vcx_position_detail",
  "View full details of a specific job position including description, quotes, AI match score, and how to proceed",
  {
    positionId: z.string().describe("Position ID (e.g., p-001)"),
  },
  async (args) => ({ content: [{ type: "text", text: getPositionDetail(args) }] })
);

server.tool(
  "vcx_express_interest",
  "Express interest in a job position. A headhunter will contact you within 48 hours. Your profile stays confidential until you approve.",
  {
    positionId: z.string().describe("Position ID to express interest in"),
    message: z.string().optional().describe("Optional personal message to the headhunter"),
  },
  async (args) => ({ content: [{ type: "text", text: expressInterest(args) }] })
);

// ─── Coffee Chat Tools ──────────────────────────────────────────────

server.tool(
  "vcx_browse_coffee_chats",
  "Browse coffee chat stories posted by members. Filter by tier (CORE/INTRO) or keyword. Members post stories about their challenges and seek meaningful conversations.",
  {
    filter: z.string().optional().describe("Filter by tier (CORE/INTRO) or keyword"),
  },
  async (args) => ({ content: [{ type: "text", text: browseCoffeeChats(args) }] })
);

server.tool(
  "vcx_coffee_chat_detail",
  "View full details of a coffee chat story including the author's situation and how to apply",
  {
    chatId: z.string().describe("Coffee chat ID (e.g., cc-001)"),
  },
  async (args) => ({ content: [{ type: "text", text: getCoffeeChatDetail(args) }] })
);

server.tool(
  "vcx_write_coffee_chat",
  "Write a coffee chat story (CORE members only). Share your situation, challenge, or topic you want to discuss. Other members can apply via secret comments.",
  {
    title: z.string().describe("Story title - what you want to talk about"),
    body: z.string().describe("Your situation, challenge, or context (be genuine and specific)"),
    tags: z.array(z.string()).describe("Relevant tags (e.g., ['PM', 'AI', 'Career'])"),
  },
  async (args) => ({ content: [{ type: "text", text: writeStory(args) }] })
);

server.tool(
  "vcx_apply_coffee_chat",
  "Apply to a coffee chat via secret comment. Only the story author can see your application. If selected, contact info is shared mutually.",
  {
    chatId: z.string().describe("Coffee chat ID to apply to"),
    introduction: z.string().describe("Your self-introduction and why you want to connect"),
  },
  async (args) => ({ content: [{ type: "text", text: applyToCoffeeChat(args) }] })
);

// ─── CEO Session Tools ──────────────────────────────────────────────

server.tool(
  "vcx_browse_ceo_sessions",
  "Browse CEO coffee chat sessions. CEOs post sessions to meet talent directly. Filter by format (online/offline) or industry.",
  {
    format: z.enum(["online", "offline"]).optional().describe("Session format filter"),
    industry: z.string().optional().describe("Industry filter (e.g., Gaming, Fintech, AI)"),
  },
  async (args) => ({ content: [{ type: "text", text: browseCeoSessions(args) }] })
);

server.tool(
  "vcx_apply_ceo_session",
  "Apply to a CEO coffee chat session. Your identity is revealed to the CEO only after they accept your application.",
  {
    sessionId: z.string().describe("CEO session ID (e.g., ceo-001)"),
    motivation: z.string().describe("Why you want to meet this CEO - be specific about shared interests"),
  },
  async (args) => ({ content: [{ type: "text", text: applyCeoSession(args) }] })
);

// ─── Anonymous Board Tools ──────────────────────────────────────────

server.tool(
  "vcx_browse_anonymous",
  "Browse the anonymous board. Categories: Career, Salary, Conflict, Job Change, Burnout, Leadership. Posts are anonymous but only verified members can write.",
  {
    category: z.string().optional().describe("Category filter (Career, Salary, Conflict, Job Change, Burnout, Leadership)"),
  },
  async (args) => ({ content: [{ type: "text", text: browseAnonymous(args) }] })
);

server.tool(
  "vcx_write_anonymous",
  "Write an anonymous post. Your identity is never revealed. Categories: Career, Salary, Conflict, Job Change, Burnout, Leadership.",
  {
    category: z.string().describe("Post category"),
    title: z.string().describe("Post title"),
    body: z.string().describe("Post content - share your genuine concern or question"),
  },
  async (args) => ({ content: [{ type: "text", text: writeAnonymousPost(args) }] })
);

// ─── Member Directory Tools ─────────────────────────────────────────

server.tool(
  "vcx_search_members",
  "Search the member directory. Find members by name, company, title, or expertise. Your searches are private.",
  {
    query: z.string().optional().describe("Search query (name, company, title, expertise)"),
    tier: z.enum(["CORE", "INTRO"]).optional().describe("Filter by membership tier"),
  },
  async (args) => ({ content: [{ type: "text", text: searchMembers(args) }] })
);

server.tool(
  "vcx_write_introduction",
  "Write or update your self-introduction on the member directory. Make it genuine - this is how other members discover you.",
  {
    bio: z.string().describe("Your self-introduction text"),
    expertise: z.array(z.string()).describe("Your expertise tags (max 5)"),
  },
  async (args) => ({ content: [{ type: "text", text: writeIntroduction(args) }] })
);

// ─── Start Server ───────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("VCX MCP Server error:", err);
  process.exit(1);
});
