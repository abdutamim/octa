import { watch, existsSync, readFileSync, type FSWatcher } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import type { AppSettings } from '../../types'
import { parseSkillFrontmatter, readSkillFrontmatter, type SkillFrontmatter } from './frontmatter'
import { runnerForSkill, CLAUDE_SKILL_FOLDERS, type SkillExecutorRunner } from './policy'

export type SkillVerdict = 'core' | 'keep' | 'reference' | 'client' | 'merge' | 'drop'
export type SkillAutonomy = 'auto' | 'assisted' | 'led'

/** Public registry shape. It intentionally excludes source machine paths. */
export interface Skill {
  name: string
  folder: string
  department: string
  verdict: SkillVerdict
  autonomy: SkillAutonomy
  use: string
  description: string
  runner: SkillExecutorRunner
}

export interface SkillListOptions {
  department?: string
  query?: string
  includeReference?: boolean
}

export interface SkillRegistryOptions {
  /** Explicit library root. It takes precedence over settings. */
  skillsLibraryPath?: string
  /** Repository root used when the setting is empty. */
  repoPath?: string
  settings?: Pick<AppSettings, 'skillsLibraryPath'>
  getSettings?: () => Pick<AppSettings, 'skillsLibraryPath'>
  watch?: boolean
  onChange?: (skills: Skill[]) => void
  onError?: (error: Error) => void
}

interface ManifestRecord {
  skills?: unknown
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function stringField(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function verdictField(value: unknown): SkillVerdict {
  const candidate = stringField(value)
  return ['core', 'keep', 'reference', 'client', 'merge', 'drop'].includes(candidate)
    ? candidate as SkillVerdict
    : 'keep'
}

function autonomyField(value: unknown): SkillAutonomy {
  const candidate = stringField(value)
  return ['auto', 'assisted', 'led'].includes(candidate) ? candidate as SkillAutonomy : 'assisted'
}

function manifestEntries(value: unknown, manifestPath: string): Array<Record<string, unknown>> {
  const root = record(value) as ManifestRecord | undefined
  if (!root || !Array.isArray(root.skills)) {
    throw new Error(`Skills manifest ${manifestPath} must contain a skills array.`)
  }
  return root.skills.map((item, index) => {
    const entry = record(item)
    if (!entry || !stringField(entry.name) || !stringField(entry.folder)) {
      throw new Error(`Skills manifest ${manifestPath} has an invalid entry at index ${index}.`)
    }
    return entry
  })
}

function skillMarkdownPath(libraryPath: string, folder: string): string {
  const skillsRoot = resolve(join(libraryPath, 'skills'))
  const candidate = resolve(skillsRoot, folder)
  const relativePath = relative(skillsRoot, candidate)
  if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || relativePath.includes(':')) {
    throw new Error(`Skill folder "${folder}" must stay inside ${skillsRoot}.`)
  }
  return join(candidate, 'SKILL.md')
}

function safeFrontmatter(path: string): SkillFrontmatter | undefined {
  if (!existsSync(path)) return undefined
  try {
    return readSkillFrontmatter(path)
  } catch {
    return undefined
  }
}

function publicEntry(entry: Record<string, unknown>, libraryPath: string): Skill {
  const name = stringField(entry.name)
  const folder = stringField(entry.folder)
  const frontmatter = safeFrontmatter(skillMarkdownPath(libraryPath, folder))
  return {
    name,
    folder,
    department: stringField(entry.department, 'other'),
    verdict: verdictField(entry.verdict),
    autonomy: autonomyField(entry.autonomy),
    use: stringField(entry.use),
    description: stringField(entry.description),
    runner: runnerForSkill(folder, frontmatter?.runner, stringField(entry.runner))
  }
}

function readManifest(libraryPath: string): Skill[] {
  const manifestPath = join(libraryPath, 'MANIFEST.json')
  if (!existsSync(manifestPath)) {
    throw new Error(`Skills manifest was not found at ${manifestPath}.`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Skills manifest ${manifestPath} is not valid JSON: ${detail}`)
  }
  return manifestEntries(parsed, manifestPath).map((entry) => publicEntry(entry, libraryPath))
}

export function defaultSkillsLibraryPath(repoPath = process.cwd()): string {
  return resolve(repoPath, 'skills-library')
}

/** Load a library once without creating a watcher. */
export function loadSkillManifest(libraryPath: string): Skill[] {
  return readManifest(resolve(libraryPath))
}

export class SkillRegistry {
  private readonly options: SkillRegistryOptions
  private entries: Skill[] = []
  private currentLibraryPath: string
  private currentManifestPath = ''
  private watcher?: FSWatcher
  private watchedLibraryPath?: string
  private reloadTimer?: ReturnType<typeof setTimeout>
  private _lastError?: Error

  constructor(options: SkillRegistryOptions = {}) {
    this.options = options
    this.currentLibraryPath = this.resolveLibraryPath()
    this.reload()
  }

  get libraryPath(): string {
    return this.currentLibraryPath
  }

  get manifestPath(): string {
    return this.currentManifestPath
  }

  get watching(): boolean {
    return this.watcher !== undefined
  }

  get lastError(): Error | undefined {
    return this._lastError
  }

  /** Reload the manifest and move the watcher if the configured path changed. */
  reload(): Skill[] {
    const libraryPath = this.resolveLibraryPath()
    const entries = readManifest(libraryPath)
    this.currentLibraryPath = libraryPath
    this.currentManifestPath = join(libraryPath, 'MANIFEST.json')
    this.entries = entries
    this._lastError = undefined
    if (this.options.watch !== false) this.startWatching(libraryPath)
    const visible = this.listSkills({ includeReference: true })
    this.options.onChange?.(visible)
    return visible
  }

  listSkills(options: SkillListOptions = {}): Skill[] {
    const department = options.department?.trim().toLocaleLowerCase()
    const query = options.query?.trim().toLocaleLowerCase()
    const includeReference = options.includeReference === true
    return this.entries
      .filter((skill) => skill.verdict !== 'drop' && skill.verdict !== 'merge')
      .filter((skill) => includeReference || skill.verdict !== 'reference')
      .filter((skill) => !department || skill.department.toLocaleLowerCase() === department)
      .filter((skill) => {
        if (!query) return true
        return [skill.name, skill.folder, skill.department, skill.use, skill.description]
          .some((value) => value.toLocaleLowerCase().includes(query))
      })
      .map((skill) => ({ ...skill }))
  }

  getSkill(name: string): Skill | undefined {
    const requestedName = name.trim()
    if (!requestedName) return undefined
    const skill = this.entries.find((entry) => entry.name === requestedName)
    return skill ? { ...skill } : undefined
  }

  resolveSkillDir(name: string): string {
    const requestedName = name.trim()
    const skill = this.getSkill(requestedName)
    if (!skill) throw new Error(`Skill "${requestedName}" was not found in ${this.manifestPath}.`)
    if (skill.verdict === 'drop' || skill.verdict === 'merge') {
      throw new Error(`Skill "${requestedName}" is not runnable (verdict: ${skill.verdict}).`)
    }
    const markdownPath = skillMarkdownPath(this.currentLibraryPath, skill.folder)
    const directory = resolve(markdownPath, '..')
    if (!existsSync(markdownPath)) {
      throw new Error(`Skill "${requestedName}" folder is missing: ${directory} (expected SKILL.md).`)
    }
    return directory
  }

  runnerFor(name: string): SkillExecutorRunner {
    const skill = this.getSkill(name)
    if (!skill) throw new Error(`Skill "${name.trim()}" was not found in ${this.manifestPath}.`)
    const frontmatter = safeFrontmatter(skillMarkdownPath(this.currentLibraryPath, skill.folder))
    return runnerForSkill(skill.folder, frontmatter?.runner, skill.runner)
  }

  close(): void {
    if (this.reloadTimer) clearTimeout(this.reloadTimer)
    this.reloadTimer = undefined
    this.watcher?.close()
    this.watcher = undefined
    this.watchedLibraryPath = undefined
  }

  private resolveLibraryPath(): string {
    const configured = this.options.skillsLibraryPath?.trim()
    const fromGetter = this.options.getSettings?.().skillsLibraryPath?.trim()
    const fromSettings = this.options.settings?.skillsLibraryPath?.trim()
    return resolve(configured || fromGetter || fromSettings || defaultSkillsLibraryPath(this.options.repoPath))
  }

  private startWatching(libraryPath: string): void {
    if (this.watcher && this.watchedLibraryPath === libraryPath) return
    this.watcher?.close()
    this.watcher = undefined
    this.watchedLibraryPath = undefined
    try {
      this.watcher = watch(libraryPath, { persistent: false }, (_event, filename) => {
        const changed = !filename || String(filename).toLocaleLowerCase() === 'manifest.json'
        if (changed) this.scheduleReload()
      })
      this.watchedLibraryPath = libraryPath
    } catch (error) {
      this.reportError(error)
    }
  }

  private scheduleReload(): void {
    if (this.reloadTimer) clearTimeout(this.reloadTimer)
    this.reloadTimer = setTimeout(() => {
      this.reloadTimer = undefined
      try {
        this.reload()
      } catch (error) {
        this.reportError(error)
      }
    }, 75)
  }

  private reportError(error: unknown): void {
    const normalized = error instanceof Error ? error : new Error(String(error))
    this._lastError = normalized
    this.options.onError?.(normalized)
  }
}

export { CLAUDE_SKILL_FOLDERS }

let defaultRegistry: SkillRegistry | undefined

export function configureSkillRegistry(options: SkillRegistryOptions = {}): SkillRegistry {
  defaultRegistry?.close()
  defaultRegistry = new SkillRegistry(options)
  return defaultRegistry
}

export function getSkillRegistry(): SkillRegistry {
  if (!defaultRegistry) defaultRegistry = new SkillRegistry()
  return defaultRegistry
}

export function closeSkillRegistry(): void {
  defaultRegistry?.close()
  defaultRegistry = undefined
}

export function listSkills(options: SkillListOptions = {}): Skill[] {
  return getSkillRegistry().listSkills(options)
}

export function getSkill(name: string): Skill | undefined {
  return getSkillRegistry().getSkill(name)
}

export function resolveSkillDir(name: string): string {
  return getSkillRegistry().resolveSkillDir(name)
}

export function runnerFor(name: string): SkillExecutorRunner {
  return getSkillRegistry().runnerFor(name)
}
