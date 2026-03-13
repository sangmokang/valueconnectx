#!/usr/bin/env node
/**
 * VCX CLI - Standalone CLI for ValueConnect X
 * Run directly: npx tsx src/bin/vcx.ts [command]
 */
import { banner, welcomeBanner, divider, sectionHeader } from "../cli/components.js";
import { ANSI, ICONS, c, bold, dim } from "../cli/theme.js";
import {
  formatDashboard, formatPositionList, formatPositionDetail,
  formatCoffeeChatList, formatCoffeeChatDetail,
  formatCeoSessionList, formatAnonymousList,
  formatMemberList, formatProfile, formatBenefits,
} from "../cli/formatters.js";
import { CURRENT_USER, POSITIONS, COFFEE_CHATS, CEO_SESSIONS, ANONYMOUS_POSTS, MEMBERS } from "../data/mock.js";

const args = process.argv.slice(2);
const command = args[0] || "dashboard";

function printHelp(): void {
  const lines = [
    banner(),
    `  ${c("offWhite", bold("VCX CLI"))} ${c("slate", "v0.1.0")}`,
    `  ${c("slateLight", "Command-line access to ValueConnect X")}`,
    "",
    sectionHeader("Commands"),
    "",
    `  ${c("gold", "dashboard")}          ${c("slateLight", "Your personal dashboard (default)")}`,
    `  ${c("gold", "positions")}          ${c("slateLight", "Browse AI-matched job positions")}`,
    `  ${c("gold", "position")} ${c("slate", "<id>")}      ${c("slateLight", "View position details")}`,
    `  ${c("gold", "coffee-chats")}       ${c("slateLight", "Browse coffee chat stories")}`,
    `  ${c("gold", "coffee-chat")} ${c("slate", "<id>")}   ${c("slateLight", "View coffee chat details")}`,
    `  ${c("gold", "ceo-sessions")}       ${c("slateLight", "Browse CEO coffee chat sessions")}`,
    `  ${c("gold", "anonymous")}          ${c("slateLight", "Browse anonymous board")}`,
    `  ${c("gold", "members")}            ${c("slateLight", "Search member directory")}`,
    `  ${c("gold", "profile")}            ${c("slateLight", "View your profile")}`,
    `  ${c("gold", "benefits")}           ${c("slateLight", "View membership benefits")}`,
    `  ${c("gold", "help")}               ${c("slateLight", "Show this help message")}`,
    "",
    sectionHeader("MCP Integration"),
    "",
    `  ${c("slateLight", "Add to Claude Code / Cursor / any MCP client:")}`,
    "",
    `  ${c("slate", "{")}`,
    `    ${c("gold", '"mcpServers"')}: {`,
    `      ${c("gold", '"valueconnectx"')}: {`,
    `        ${c("slate", '"command"')}: "npx",`,
    `        ${c("slate", '"args"')}: ["tsx", "${c("slateLight", "path/to/vcx-mcp-server/src/index.ts")}"]`,
    `      }`,
    `    }`,
    `  ${c("slate", "}")}`,
    "",
    divider(),
    dim(c("slate", `  ${ICONS.vcx} Invite-Only · AI-Native Talent Network`)),
    "",
  ];
  console.log(lines.join("\n"));
}

function run(): void {
  switch (command) {
    case "dashboard":
    case "home":
      console.log(formatDashboard(CURRENT_USER));
      break;

    case "positions":
    case "jobs":
      console.log(formatPositionList(POSITIONS, args[1]));
      break;

    case "position":
    case "job": {
      const id = args[1] || "p-001";
      const pos = POSITIONS.find((p) => p.id === id);
      if (!pos) {
        console.log(c("error", `Position "${id}" not found.`));
        break;
      }
      console.log(formatPositionDetail(pos));
      break;
    }

    case "coffee-chats":
    case "chats":
      console.log(formatCoffeeChatList(COFFEE_CHATS, args[1]));
      break;

    case "coffee-chat":
    case "chat": {
      const id = args[1] || "cc-001";
      const chat = COFFEE_CHATS.find((cc) => cc.id === id);
      if (!chat) {
        console.log(c("error", `Coffee chat "${id}" not found.`));
        break;
      }
      console.log(formatCoffeeChatDetail(chat));
      break;
    }

    case "ceo-sessions":
    case "ceo":
      console.log(formatCeoSessionList(CEO_SESSIONS));
      break;

    case "anonymous":
    case "anon":
      console.log(formatAnonymousList(ANONYMOUS_POSTS, args[1]));
      break;

    case "members":
    case "directory":
      console.log(formatMemberList(MEMBERS, args[1]));
      break;

    case "profile":
    case "me":
      console.log(formatProfile(CURRENT_USER));
      break;

    case "benefits":
      console.log(formatBenefits((args[1]?.toUpperCase() || "CORE") as "CORE" | "INTRO"));
      break;

    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;

    default:
      console.log(c("error", `Unknown command: "${command}"`));
      console.log(c("slateLight", `Run "vcx help" for available commands.`));
      break;
  }
}

run();
