import { readFileSync } from 'node:fs'

/**
 * The small, deliberately dependency-free subset of YAML used by SKILL.md
 * frontmatter. Skill files only need scalars, folded/literal blocks, and
 * string lists for the runner contract.
 */
export interface SkillFrontmatter {
  name: string
  description: string
  allowedTools: string[]
  argumentHint?: string
  runner?: string
}

interface BlockResult {
  value: string
  nextIndex: number
}

function indentation(line: string): number {
  let count = 0
  for (const character of line) {
    if (character === ' ') count += 1
    else if (character === '\t') count += 2
    else break
  }
  return count
}

function scalar(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (typeof parsed === 'string') return parsed
    } catch {
      // Fall through and remove the quotes. A malformed optional scalar
      // should not make an otherwise usable skill disappear from the list.
    }
    return trimmed.slice(1, -1)
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'")
  }
  return trimmed
}

function readBlock(lines: string[], startIndex: number, folded: boolean): BlockResult {
  const block: string[] = []
  let minimumIndent = Number.POSITIVE_INFINITY
  let index = startIndex

  while (index < lines.length) {
    const line = lines[index]
    if (line.trim() === '') {
      block.push('')
      index += 1
      continue
    }
    const lineIndent = indentation(line)
    if (lineIndent === 0) break
    minimumIndent = Math.min(minimumIndent, lineIndent)
    block.push(line)
    index += 1
  }

  if (!Number.isFinite(minimumIndent)) return { value: '', nextIndex: index }

  const dedented = block.map((line) => {
    if (line === '') return ''
    return line.slice(Math.min(minimumIndent, indentation(line)))
  })

  if (!folded) return { value: dedented.join('\n').trim(), nextIndex: index }

  let output = ''
  for (const line of dedented) {
    if (line.trim() === '') {
      output += '\n'
      continue
    }
    if (output && !output.endsWith('\n')) output += ' '
    output += line.trim()
  }
  return { value: output.trim(), nextIndex: index }
}

interface ListResult {
  values: string[]
  nextIndex: number
  found: boolean
}

function readList(lines: string[], startIndex: number): ListResult {
  const values: string[] = []
  let index = startIndex
  let found = false

  while (index < lines.length) {
    const line = lines[index]
    if (line.trim() === '') {
      index += 1
      continue
    }
    const match = line.match(/^\s*-\s*(.*)$/)
    if (match && indentation(line) > 0) {
      values.push(scalar(match[1]))
      found = true
      index += 1
      continue
    }
    if (indentation(line) > 0) {
      // This is a nested map/value belonging to an unknown frontmatter key.
      // It is not part of the string-list contract.
      index += 1
      continue
    }
    break
  }

  return { values, nextIndex: index, found }
}

function skipIndented(lines: string[], startIndex: number): number {
  let index = startIndex
  while (index < lines.length) {
    const line = lines[index]
    if (line.trim() !== '' && indentation(line) === 0) break
    index += 1
  }
  return index
}

function extractYaml(markdown: string): string | undefined {
  const normalized = markdown.replace(/^\uFEFF/, '')
  const lines = normalized.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return undefined
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (closingIndex < 0) throw new Error('SKILL.md frontmatter is missing its closing --- marker.')
  return lines.slice(1, closingIndex).join('\n')
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** Parse the YAML frontmatter fields used by the skill registry and runners. */
export function parseSkillFrontmatter(markdown: string): SkillFrontmatter {
  const yaml = extractYaml(markdown)
  const values: Record<string, string | string[]> = {}
  if (yaml !== undefined) {
    const lines = yaml.split('\n')
    let index = 0
    while (index < lines.length) {
      const line = lines[index]
      if (line.trim() === '' || line.trim().startsWith('#')) {
        index += 1
        continue
      }
      const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/)
      if (!match || indentation(line) !== 0) {
        index += 1
        continue
      }

      const key = match[1]
      const rawValue = match[2].trim()
      const blockMarker = rawValue.match(/^([>|])[+-]?$/)
      if (blockMarker) {
        const block = readBlock(lines, index + 1, blockMarker[1] === '>')
        values[key] = block.value
        index = block.nextIndex
        continue
      }
      if (rawValue === '') {
        const list = readList(lines, index + 1)
        if (list.found) {
          values[key] = list.values
          index = list.nextIndex
        } else {
          index = skipIndented(lines, index + 1)
        }
        continue
      }
      values[key] = scalar(rawValue)
      index += 1
    }
  }

  const allowedValue = values['allowed-tools']
  const allowedTools = Array.isArray(allowedValue)
    ? allowedValue.filter((value): value is string => typeof value === 'string' && Boolean(value.trim())).map((value) => value.trim())
    : stringValue(allowedValue)?.split(',').map((value) => value.trim()).filter(Boolean) ?? []

  const argumentHint = stringValue(values['argument-hint'])
  const runner = stringValue(values.runner)
  return {
    name: stringValue(values.name) ?? '',
    description: stringValue(values.description) ?? '',
    allowedTools,
    ...(argumentHint ? { argumentHint } : {}),
    ...(runner ? { runner } : {})
  }
}

export function readSkillFrontmatter(path: string): SkillFrontmatter {
  return parseSkillFrontmatter(readFileSync(path, 'utf8'))
}

// Friendly aliases for callers that do not need to know the SKILL.md naming.
export const parseFrontmatter = parseSkillFrontmatter
export const parseSkillMarkdownFrontmatter = parseSkillFrontmatter
