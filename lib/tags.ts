const TAG_REGEX = /#([a-zA-Z0-9À-ž_-]+)/g

export const normalizeTag = (tag: string): string =>
  tag.replace(/^#+/, '').trim().toLowerCase()

// Hier wurde der Name von extractTags zu extractTagsFromText geändert
export const extractTagsFromText = (text: string): string[] => {
  if (!text) return []
  const tags = new Set<string>()
  
  const matches = Array.from(text.matchAll(TAG_REGEX))
  
  matches.forEach(match => {
    const normalized = normalizeTag(match[1] || '')
    if (normalized) {
      tags.add(normalized)
    }
  })
  
  return Array.from(tags)
}