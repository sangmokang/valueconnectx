import { ANONYMOUS_POSTS } from "../data/mock.js";
import { formatAnonymousList, formatWriteSuccess } from "../cli/formatters.js";

const VALID_CATEGORIES = [
  "Career", "Salary", "Conflict", "Job Change", "Burnout", "Leadership",
];

export function browseAnonymous(args: { category?: string }): string {
  let posts = [...ANONYMOUS_POSTS];

  if (args.category) {
    const cat = args.category.toLowerCase();
    posts = posts.filter((p) => p.category.toLowerCase().includes(cat));
  }

  if (posts.length === 0) {
    return "No posts found in this category.";
  }

  return formatAnonymousList(posts, args.category);
}

export function writeAnonymousPost(args: {
  category: string;
  title: string;
  body: string;
}): string {
  const validCat = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === args.category.toLowerCase()
  );
  if (!validCat) {
    return `Invalid category "${args.category}". Valid categories: ${VALID_CATEGORIES.join(", ")}`;
  }
  return formatWriteSuccess("Anonymous Post", args.title);
}
