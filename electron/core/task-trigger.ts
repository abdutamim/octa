/**
 * Turning a dictation into a task when it ends with a spoken phrase.
 *
 * The hard requirement is NOT recall, it is precision. Bedo also dictates voice
 * notes to friends through this same pipeline, so a false positive hijacks a real
 * message and sends nothing. That is why the default triggers are full phrases
 * rather than a keyword like "task", and why a bare mention of the word never
 * fires.
 */

export const DEFAULT_TASK_TRIGGERS = [
  'خلي دي تاسك في السيستم',
  'حط دي تاسك في السيستم',
  'add this to my system'
]

/**
 * Arabic speech-to-text varies in ways that are not meaningful here: hamza forms,
 * taa marbuta, tatweel, diacritics, and Arabic-Indic digits all move around
 * between recognitions of the same sentence. Comparing normalised text keeps a
 * trigger working when Gemini spells it slightly differently.
 */
export function normalizeForMatch(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ؤئ]/g, 'ء')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLocaleLowerCase()
}

export interface TriggerMatch {
  /** The dictation with the trigger phrase removed. */
  text: string
  trigger: string
}

/**
 * Looks for any configured trigger in the transcript. Checked against both the
 * raw and cleaned transcripts by the caller, because the cleanup pass can reword
 * the sentence the trigger lives in.
 */
export function matchTaskTrigger(
  transcript: string,
  triggers: readonly string[] = DEFAULT_TASK_TRIGGERS
): TriggerMatch | undefined {
  const haystack = normalizeForMatch(transcript)
  if (!haystack) return undefined

  for (const trigger of triggers) {
    const needle = normalizeForMatch(trigger)
    // A one-word trigger would fire on ordinary speech; require a real phrase.
    if (!needle || needle.split(' ').length < 2) continue
    const index = haystack.indexOf(needle)
    if (index < 0) continue
    return { text: stripTrigger(transcript, trigger), trigger }
  }
  return undefined
}

/**
 * Removes the trigger from the ORIGINAL text rather than the normalised copy, so
 * the resulting task keeps its real spelling, punctuation and script.
 */
function stripTrigger(original: string, trigger: string): string {
  const words = trigger.split(/\s+/).filter(Boolean).length
  const tokens = original.split(/(\s+)/)
  const wordIndexes: number[] = []
  tokens.forEach((token, index) => {
    if (token.trim()) wordIndexes.push(index)
  })

  for (let start = 0; start + words <= wordIndexes.length; start += 1) {
    const from = wordIndexes[start]
    const to = wordIndexes[start + words - 1]
    const candidate = tokens.slice(from, to + 1).join('')
    if (normalizeForMatch(candidate) === normalizeForMatch(trigger)) {
      const remainder = [...tokens.slice(0, from), ...tokens.slice(to + 1)].join('')
      return tidy(remainder)
    }
  }
  return tidy(original)
}

function tidy(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.،:؛-]+/, '')
    .replace(/[\s,،:؛-]+$/, '')
    .trim()
}

/** A task title has to fit on one line; the rest becomes the task's notes. */
export function splitTitleAndNotes(text: string): { title: string; notes: string } {
  const trimmed = text.trim()
  if (!trimmed) return { title: '', notes: '' }
  const firstBreak = trimmed.search(/[\n.。!?؟]/)
  if (firstBreak > 0 && firstBreak <= 120) {
    return {
      title: trimmed.slice(0, firstBreak).trim(),
      notes: trimmed.slice(firstBreak + 1).trim()
    }
  }
  if (trimmed.length <= 120) return { title: trimmed, notes: '' }
  const cut = trimmed.lastIndexOf(' ', 120)
  const boundary = cut > 40 ? cut : 120
  return { title: trimmed.slice(0, boundary).trim(), notes: trimmed.slice(boundary).trim() }
}
