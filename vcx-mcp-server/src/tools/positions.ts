import { POSITIONS } from "../data/mock.js";
import { formatPositionList, formatPositionDetail, formatInterestExpressed } from "../cli/formatters.js";

export function searchPositions(args: {
  category?: string;
  keyword?: string;
  minScore?: number;
  exclusiveOnly?: boolean;
}): string {
  let results = [...POSITIONS];

  if (args.category) {
    results = results.filter(
      (p) => p.category.toLowerCase() === args.category!.toLowerCase()
    );
  }
  if (args.keyword) {
    const kw = args.keyword.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.company.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw) ||
        p.tags.some((t) => t.toLowerCase().includes(kw))
    );
  }
  if (args.minScore) {
    results = results.filter((p) => p.aiMatchScore >= args.minScore!);
  }
  if (args.exclusiveOnly) {
    results = results.filter((p) => p.isExclusive48h);
  }

  results.sort((a, b) => b.aiMatchScore - a.aiMatchScore);

  if (results.length === 0) {
    return "No positions found matching your criteria.";
  }

  return formatPositionList(results, args.keyword);
}

export function getPositionDetail(args: { positionId: string }): string {
  const pos = POSITIONS.find((p) => p.id === args.positionId);
  if (!pos) {
    return `Position "${args.positionId}" not found. Use vcx_search_positions to browse available positions.`;
  }
  return formatPositionDetail(pos);
}

export function expressInterest(args: { positionId: string; message?: string }): string {
  const pos = POSITIONS.find((p) => p.id === args.positionId);
  if (!pos) {
    return `Position "${args.positionId}" not found.`;
  }
  return formatInterestExpressed(pos.title, pos.company);
}
