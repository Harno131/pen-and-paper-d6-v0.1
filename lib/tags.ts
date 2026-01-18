const TAG_REGEX = /#([a-zA-Z0-9À-ž_-]+)/g

export const normalizeTag = (tag: string): string =>
  tag.replace(/^#+/, '').trim().toLowerCase()

export const extractTagsFromText = (text: string): string[] => {
  if (!text) return []
  const tags = new Set<string>()
  for (const match of text.matchAll(TAG_REGEX)) {
    const normalized = normalizeTag(match[1] || '')
    if (normalized) {
      tags.add(normalized)
    }
  }
  return Array.from(tags)
}
