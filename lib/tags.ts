const TAG_REGEX = /#([a-zA-Z0-9À-ž_-+]+)/g

export const normalizeTag = (tag: string): string =>
  tag.replace(/^#+/, '').trim().toLowerCase()

export const extractTags = (text: string): string[] => {
  if (!text) return []
  const tags = new Set<string>()
  
  // Wir nutzen Array.from, um den Iterator in ein echtes Array zu verwandeln
  // Das löst das "downlevelIteration" Problem bei Vercel
  const matches = Array.from(text.matchAll(TAG_REGEX))
  
  matches.forEach(match => {
    const normalized = normalizeTag(match[1] || '')
    if (normalized) {
      tags.add(normalized)
    }
  })
  
  return Array.from(tags)
}