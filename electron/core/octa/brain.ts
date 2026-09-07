import Database from 'better-sqlite3'
import { watch, type FSWatcher } from 'node:fs'
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  rm
} from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { Vault } from '../vault'

export const BRAIN_TOKEN_CAP = 6_000
export const DEFAULT_BRAIN_DEBOUNCE_MS = 100

export type BrainKind = 'sales' | 'invoice' | 'marketing' | string
export type ProposalStatus = 'pending' | 'approved' | 'rejected'

export interface BrainLoadOptions {
  client?: string
  kinds?: BrainKind | readonly BrainKind[]
  tokenCap?: number
}

export interface BrainConfig {
  vaultPath: string
  octaHome: string
  database?: Database.Database
  databasePath?: string
  debounceMs?: number
  tokenCap?: number
}

export interface StandaloneBrainOptions extends BrainLoadOptions {
  vaultPath?: string
  octaHome?: string
  database?: Database.Database
  databasePath?: string
  debounceMs?: number
}

export interface BrainProposal {
  id: number
  targetFile: string
  diffOrContent: string
  sourceJob: string | null
  status: ProposalStatus
  createdAt: string
}

export interface BrainStatus {
  files: string[]
  proposals: BrainProposal[]
  mirrorPath: string
  watching: boolean
}

export interface BrainEditInput {
  targetFile?: string
  target_file?: string
  diffOrContent?: string
  diff_or_content?: string
  sourceJob?: string | null
  source_job?: string | null
}

interface BrainProposalRow {
  id: number
  target_file: string
  diff_or_content: string
  source_job: string | null
  status: ProposalStatus
  created_at: string
}

function isNodeError(error: unknown, code: string): boolean {
  return (error as NodeJS.ErrnoException).code === code
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await lstat(path)).isDirectory()
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) return false
    throw error
  }
}

async function removeEntry(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true })
}

/** Mirrors a directory without following source symlinks. */
async function mirrorDirectory(source: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true })
  let sourceEntries: import('node:fs').Dirent[]
  try {
    const sourceStats = await lstat(source)
    if (sourceStats.isSymbolicLink() || !sourceStats.isDirectory()) {
      throw Object.assign(new Error('Knowledge source is not a directory.'), { code: 'ENOENT' })
    }
    sourceEntries = await readdir(source, { withFileTypes: true })
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) {
      const destinationEntries = await readdir(destination, { withFileTypes: true }).catch(() => [])
      await Promise.all(destinationEntries.map((entry) => removeEntry(resolve(destination, entry.name))))
      return
    }
    throw error
  }

  const names = new Set<string>()
  for (const entry of sourceEntries) {
    names.add(entry.name)
    const sourceEntry = resolve(source, entry.name)
    const destinationEntry = resolve(destination, entry.name)

    if (entry.isSymbolicLink()) {
      // Knowledge is mirrored read-only. A link could point outside the vault,
      // so it is deliberately absent from the job mirror.
      await removeEntry(destinationEntry)
      continue
    }

    if (entry.isDirectory()) {
      if (!(await isDirectory(destinationEntry))) {
        await removeEntry(destinationEntry)
      }
      await mirrorDirectory(sourceEntry, destinationEntry)
      continue
    }

    if (!entry.isFile()) {
      await removeEntry(destinationEntry)
      continue
    }

    try {
      const destinationStats = await lstat(destinationEntry)
      if (destinationStats.isDirectory() || destinationStats.isSymbolicLink()) await removeEntry(destinationEntry)
    } catch (error) {
      if (!isNodeError(error, 'ENOENT')) throw error
    }
    await mkdir(dirname(destinationEntry), { recursive: true })
    await copyFile(sourceEntry, destinationEntry)
  }

  const destinationEntries = await readdir(destination, { withFileTypes: true })
  await Promise.all(
    destinationEntries
      .filter((entry) => !names.has(entry.name))
      .map((entry) => removeEntry(resolve(destination, entry.name)))
  )
}

async function markdownFiles(root: string): Promise<string[]> {
  const files: string[] = []
  const walk = async (directory: string): Promise<void> => {
    let entries: import('node:fs').Dirent[]
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch (error) {
      if (isNodeError(error, 'ENOENT')) return
      throw error
    }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === '.obsidian' || entry.isSymbolicLink()) continue
      const absolute = resolve(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(absolute)
      } else if (entry.isFile() && entry.name.toLocaleLowerCase().endsWith('.md')) {
        files.push(absolute)
      }
    }
  }
  await walk(root)
  return files.sort((left, right) => left.localeCompare(right))
}

function normalizeKinds(kinds: BrainLoadOptions['kinds']): string[] {
  const values = kinds === undefined ? [] : Array.isArray(kinds) ? kinds : [kinds]
  return values
    .map((kind) => String(kind).trim().toLocaleLowerCase())
    .filter(Boolean)
}

function includesKind(kinds: readonly string[], values: readonly string[]): boolean {
  return kinds.some((kind) => values.some((value) => kind === value || kind.includes(value)))
}

function slugifyClient(value: string): string {
  const clean = value.trim().replace(/\.md$/i, '')
  if (!clean) throw new Error('A client name is required.')
  const slug = clean
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  if (!slug || slug === '.' || slug === '..') throw new Error('Invalid client name.')
  return slug
}

/** Returns a path rooted below knowledge/, rejecting traversal and absolutes. */
export function normalizeKnowledgePath(targetFile: string): string {
  const candidate = targetFile.trim().replaceAll('\\', '/')
  if (!candidate || isAbsolute(candidate) || /^[A-Za-z]:\//.test(candidate)) {
    throw new Error('Brain paths must be relative to knowledge/.')
  }
  const withoutPrefix = candidate.replace(/^knowledge\//i, '')
  const normalized = withoutPrefix.split('/').filter(Boolean)
  if (
    normalized.length === 0 ||
    normalized.some((part) => part === '.' || part === '..') ||
    normalized.some((part) => part.includes('\u0000'))
  ) {
    throw new Error('Brain path is outside knowledge/.')
  }
  return `knowledge/${normalized.join('/')}`
}

export function estimateBrainTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function capBrainText(text: string, tokenCap: number): string {
  const cap = Math.max(1, Math.floor(tokenCap))
  if (estimateBrainTokens(text) <= cap) return text
  const marker = '\n\n[truncated]\n'
  const maxCharacters = Math.max(1, cap * 4 - marker.length)
  return `${text.slice(0, maxCharacters).trimEnd()}${marker}`
}

function proposalFromRow(row: BrainProposalRow): BrainProposal {
  return {
    id: row.id,
    targetFile: row.target_file,
    diffOrContent: row.diff_or_content,
    sourceJob: row.source_job,
    status: row.status,
    createdAt: row.created_at
  }
}

export function ensureBrainProposalSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS brain_proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_file TEXT NOT NULL,
      diff_or_content TEXT NOT NULL,
      source_job TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

export class CompanyBrain {
  readonly vaultPath: string
  readonly octaHome: string
  readonly mirrorPath: string
  readonly tokenCap: number

  private readonly database?: Database.Database
  private readonly ownsDatabase: boolean
  private readonly debounceMs: number
  private watcher?: FSWatcher
  private debounceTimer?: NodeJS.Timeout
  private syncPromise?: Promise<void>

  constructor(config: BrainConfig)
  constructor(vaultPath: string, octaHome: string, database?: Database.Database | string)
  constructor(
    configOrVaultPath: BrainConfig | string,
    positionalOctaHome?: string,
    positionalDatabase?: Database.Database | string
  ) {
    const config: BrainConfig = typeof configOrVaultPath === 'string'
      ? {
          vaultPath: configOrVaultPath,
          octaHome: positionalOctaHome ?? 'C:\\Octa',
          ...(typeof positionalDatabase === 'string' ? { databasePath: positionalDatabase } : { database: positionalDatabase })
        }
      : configOrVaultPath
    this.vaultPath = config.vaultPath.trim() ? resolve(config.vaultPath) : ''
    this.octaHome = resolve(config.octaHome)
    this.mirrorPath = resolve(this.octaHome, 'knowledge')
    this.tokenCap = config.tokenCap ?? BRAIN_TOKEN_CAP
    this.debounceMs = Math.max(10, config.debounceMs ?? DEFAULT_BRAIN_DEBOUNCE_MS)

    if (config.database) {
      this.database = config.database
      this.ownsDatabase = false
    } else if (config.databasePath) {
      this.database = new Database(config.databasePath)
      this.ownsDatabase = true
    } else {
      this.ownsDatabase = false
    }
    if (this.database) ensureBrainProposalSchema(this.database)
  }

  /** Performs the initial one-way vault → job mirror and starts watching it. */
  async start(): Promise<void> {
    await this.syncNow()
    this.closeWatcher()

    if (!this.vaultPath) return
    const sourceKnowledge = resolve(this.vaultPath, 'knowledge')
    const watchRoot = (await isDirectory(sourceKnowledge))
      ? sourceKnowledge
      : (await isDirectory(this.vaultPath) ? this.vaultPath : '')
    if (!watchRoot) return

    try {
      this.watcher = watch(watchRoot, { recursive: true }, () => this.scheduleSync())
    } catch {
      // Recursive watching is unavailable on some Node/platform combinations.
      // A top-level fallback still handles the common Windows vault changes.
      this.watcher = watch(watchRoot, () => this.scheduleSync())
    }
  }

  async sync(): Promise<void> {
    await this.syncNow()
  }

  async syncNow(): Promise<void> {
    if (this.syncPromise) return this.syncPromise
    this.syncPromise = this.performSync()
    try {
      await this.syncPromise
    } finally {
      this.syncPromise = undefined
    }
  }

  private async performSync(): Promise<void> {
    await mkdir(this.mirrorPath, { recursive: true })
    if (!this.vaultPath) {
      await mirrorDirectory(resolve(this.octaHome, '__empty-knowledge-source__'), this.mirrorPath)
      return
    }
    await mirrorDirectory(resolve(this.vaultPath, 'knowledge'), this.mirrorPath)
  }

  private scheduleSync(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined
      void this.syncNow().catch((error: unknown) => {
        console.error('[brain] knowledge mirror failed:', error)
      })
    }, this.debounceMs)
    this.debounceTimer.unref?.()
  }

  private closeWatcher(): void {
    this.watcher?.close()
    this.watcher = undefined
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = undefined
  }

  close(): void {
    this.closeWatcher()
    if (this.ownsDatabase) this.database?.close()
  }

  stop(): void {
    this.close()
  }

  get isWatching(): boolean {
    return Boolean(this.watcher)
  }

  async listFiles(): Promise<string[]> {
    const files = await markdownFiles(this.mirrorPath)
    return files.map((file) => relative(this.mirrorPath, file).replaceAll(sep, '/'))
  }

  async status(): Promise<BrainStatus> {
    return {
      files: await this.listFiles(),
      proposals: this.listProposals(),
      mirrorPath: this.mirrorPath,
      watching: this.isWatching
    }
  }

  async loadBrain(options: BrainLoadOptions = {}): Promise<string> {
    // A load is also safe before start(), and makes a just-created fixture
    // immediately visible without waiting for the OS watcher.
    await this.syncNow()

    const relativeFiles = ['company.md', 'voice.md', 'icp.md']
    const kinds = normalizeKinds(options.kinds)
    if (options.client) relativeFiles.push(`clients/${slugifyClient(options.client)}.md`)
    if (includesKind(kinds, ['sales', 'invoice'])) {
      relativeFiles.push('pricing.md')
      relativeFiles.push(...(await markdownFiles(resolve(this.mirrorPath, 'offers'))).map((file) => relative(this.mirrorPath, file).replaceAll(sep, '/')))
    }
    if (includesKind(kinds, ['marketing', 'persona', 'competitor'])) {
      relativeFiles.push(...(await markdownFiles(resolve(this.mirrorPath, 'personas'))).map((file) => relative(this.mirrorPath, file).replaceAll(sep, '/')))
      relativeFiles.push(...(await markdownFiles(resolve(this.mirrorPath, 'competitors'))).map((file) => relative(this.mirrorPath, file).replaceAll(sep, '/')))
    }

    const uniqueFiles = [...new Set(relativeFiles)]
    const sections: string[] = ['# Company brain']
    for (const relativeFile of uniqueFiles) {
      try {
        const content = await readFile(resolve(this.mirrorPath, relativeFile), 'utf8')
        sections.push(`\n## knowledge/${relativeFile}\n${content.trim()}`)
      } catch (error) {
        if (!isNodeError(error, 'ENOENT')) throw error
      }
    }

    return capBrainText(sections.join('\n'), options.tokenCap ?? this.tokenCap)
  }

  private requireDatabase(): Database.Database {
    if (!this.database) throw new Error('Brain proposal storage is unavailable.')
    return this.database
  }

  getProposal(id: number): BrainProposal | undefined {
    const row = this.requireDatabase()
      .prepare('SELECT id, target_file, diff_or_content, source_job, status, created_at FROM brain_proposals WHERE id = ?')
      .get(id) as BrainProposalRow | undefined
    return row ? proposalFromRow(row) : undefined
  }

  listProposals(status?: ProposalStatus): BrainProposal[] {
    const database = this.requireDatabase()
    const rows = (status
      ? database.prepare('SELECT id, target_file, diff_or_content, source_job, status, created_at FROM brain_proposals WHERE status = ? ORDER BY id DESC').all(status)
      : database.prepare('SELECT id, target_file, diff_or_content, source_job, status, created_at FROM brain_proposals ORDER BY id DESC').all()) as BrainProposalRow[]
    return rows.map(proposalFromRow)
  }

  proposeBrainEdit(input: BrainEditInput | string, diffOrContent?: string, sourceJob?: string | null): BrainProposal {
    const values: BrainEditInput = typeof input === 'string'
      ? { targetFile: input, diffOrContent, sourceJob }
      : input
    const targetFile = values.targetFile ?? values.target_file
    const content = values.diffOrContent ?? values.diff_or_content
    if (!targetFile?.trim()) throw new Error('A brain target file is required.')
    if (typeof content !== 'string') throw new Error('Brain proposal content is required.')
    const normalizedTarget = normalizeKnowledgePath(targetFile)
    const result = this.requireDatabase()
      .prepare('INSERT INTO brain_proposals (target_file, diff_or_content, source_job, status) VALUES (?, ?, ?, \'pending\')')
      .run(normalizedTarget, content, values.sourceJob ?? values.source_job ?? null)
    const proposal = this.getProposal(Number(result.lastInsertRowid))
    if (!proposal) throw new Error('Could not create brain proposal.')
    return proposal
  }

  approveProposal(id: number): BrainProposal {
    const result = this.requireDatabase()
      .prepare("UPDATE brain_proposals SET status = 'approved' WHERE id = ? AND status = 'pending'")
      .run(id)
    if (result.changes === 0) {
      const existing = this.getProposal(id)
      if (!existing) throw new Error('Brain proposal was not found.')
      if (existing.status === 'rejected') throw new Error('Rejected brain proposals cannot be approved.')
    }
    const proposal = this.getProposal(id)
    if (!proposal) throw new Error('Brain proposal was not found.')
    return proposal
  }

  rejectProposal(id: number): BrainProposal {
    const result = this.requireDatabase()
      .prepare("UPDATE brain_proposals SET status = 'rejected' WHERE id = ? AND status = 'pending'")
      .run(id)
    if (result.changes === 0) {
      const existing = this.getProposal(id)
      if (!existing) throw new Error('Brain proposal was not found.')
      if (existing.status === 'approved') throw new Error('Approved brain proposals cannot be rejected.')
    }
    const proposal = this.getProposal(id)
    if (!proposal) throw new Error('Brain proposal was not found.')
    return proposal
  }

  /** Applies only an already-approved proposal to the source-of-truth vault. */
  async applyProposal(id: number | BrainProposal): Promise<BrainProposal> {
    const proposal = this.getProposal(typeof id === 'number' ? id : id.id)
    if (!proposal) throw new Error('Brain proposal was not found.')
    if (proposal.status !== 'approved') {
      throw new Error('Brain proposal must be approved before it can be applied.')
    }
    if (!this.vaultPath) throw new Error('A vault path is required to apply brain proposals.')
    const target = normalizeKnowledgePath(proposal.targetFile)
    await new Vault(this.vaultPath).writeNote(target, proposal.diffOrContent)
    return this.getProposal(proposal.id) ?? proposal
  }
}

export class Brain extends CompanyBrain {}

export const createBrain = (config: BrainConfig): CompanyBrain => new CompanyBrain(config)

let defaultBrain: CompanyBrain | undefined

export function configureBrain(config: BrainConfig): CompanyBrain {
  defaultBrain?.close()
  defaultBrain = new CompanyBrain(config)
  return defaultBrain
}

export function getConfiguredBrain(): CompanyBrain | undefined {
  return defaultBrain
}

function requireConfiguredBrain(): CompanyBrain {
  if (!defaultBrain) throw new Error('Company brain is not configured.')
  return defaultBrain
}

/** Convenience entry point for the planner and later specs. */
export async function loadBrain(options: StandaloneBrainOptions = {}): Promise<string> {
  const configured = getConfiguredBrain()
  if (configured && options.vaultPath === undefined && options.octaHome === undefined && options.database === undefined && options.databasePath === undefined) {
    return configured.loadBrain(options)
  }

  const brain = new CompanyBrain({
    vaultPath: options.vaultPath ?? process.env.OCTA_VAULT_PATH ?? '',
    octaHome: options.octaHome ?? process.env.OCTA_HOME ?? 'C:\\Octa',
    database: options.database,
    databasePath: options.databasePath,
    debounceMs: options.debounceMs,
    tokenCap: options.tokenCap
  })
  try {
    return await brain.loadBrain(options)
  } finally {
    brain.close()
  }
}

export function proposeBrainEdit(input: BrainEditInput | string, diffOrContent?: string, sourceJob?: string | null): BrainProposal {
  return requireConfiguredBrain().proposeBrainEdit(input, diffOrContent, sourceJob)
}

export function applyApprovedBrainProposal(id: number | BrainProposal): Promise<BrainProposal> {
  return requireConfiguredBrain().applyProposal(id)
}

// Kept as a named alias for callers that use the task wording directly.
export const applyProposal = applyApprovedBrainProposal
