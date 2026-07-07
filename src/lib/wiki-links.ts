export function extractWikiLinks(text: string) {
  const links = new Set<string>();
  const matches = text.matchAll(/\[\[([^\]]+)\]\]/g);

  for (const match of matches) {
    const target = match[1]?.split("|")[0]?.trim();
    if (target) links.add(normalizeWikiTitle(target));
  }

  return Array.from(links);
}

export function normalizeWikiTitle(title: string) {
  return title.replace(/\.md$/i, "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function markdownToPlainText(content: string) {
  return content.replace(/[#*_`>\-[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

export function unresolvedWikiLinks(text: string, targetTitles: string[]) {
  const targets = new Set(targetTitles.map(normalizeWikiTitle));
  return extractWikiLinks(text).filter((title) => !targets.has(title));
}

export function wikiLinkSnippet(text: string, targetTitle: string) {
  const escapedTitle = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`\\[\\[${escapedTitle}(?:\\|[^\\]]+)?\\]\\]`, "i"));
  if (!match || match.index === undefined) return text.slice(0, 160).trim();
  const start = Math.max(0, match.index - 80);
  const end = Math.min(text.length, match.index + match[0].length + 80);
  return `${start > 0 ? "..." : ""}${text.slice(start, end).replace(/\s+/g, " ").trim()}${end < text.length ? "..." : ""}`;
}
