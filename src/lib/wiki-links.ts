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
