import { COFFEE_CHATS } from "../data/mock.js";
import { formatCoffeeChatList, formatCoffeeChatDetail, formatWriteSuccess } from "../cli/formatters.js";

export function browseCoffeeChats(args: { filter?: string }): string {
  let chats = [...COFFEE_CHATS];

  if (args.filter) {
    const f = args.filter.toLowerCase();
    if (f === "core" || f === "intro") {
      chats = chats.filter((c) => c.author.tier.toLowerCase() === f);
    } else {
      chats = chats.filter(
        (c) =>
          c.title.toLowerCase().includes(f) ||
          c.tags.some((t) => t.toLowerCase().includes(f))
      );
    }
  }

  if (chats.length === 0) {
    return "No coffee chat stories found matching your filter.";
  }

  return formatCoffeeChatList(chats, args.filter);
}

export function getCoffeeChatDetail(args: { chatId: string }): string {
  const chat = COFFEE_CHATS.find((c) => c.id === args.chatId);
  if (!chat) {
    return `Coffee chat "${args.chatId}" not found. Use vcx_browse_coffee_chats to see available stories.`;
  }
  return formatCoffeeChatDetail(chat);
}

export function writeStory(args: {
  title: string;
  body: string;
  tags: string[];
}): string {
  return formatWriteSuccess("Coffee Chat Story", args.title);
}

export function applyToCoffeeChat(args: {
  chatId: string;
  introduction: string;
}): string {
  const chat = COFFEE_CHATS.find((c) => c.id === args.chatId);
  if (!chat) {
    return `Coffee chat "${args.chatId}" not found.`;
  }
  return formatWriteSuccess(
    "Secret Application",
    `Applied to "${chat.title}" by ${chat.author.name}`
  );
}
