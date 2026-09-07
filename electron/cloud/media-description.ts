/** Minimal media response shape retained by the copied Gemini client. */
export interface MediaDescription {
  contents?: string
  speakers?: number
  speech_clarity?: string
  languages?: string[]
  notes?: string
}

/** Pull a JSON object out of a model response that may include prose or fences. */
export function parseMediaDescription(raw: string): MediaDescription | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0]) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as MediaDescription) : null
  } catch {
    return null
  }
}
