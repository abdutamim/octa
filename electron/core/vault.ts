import {
  appendFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile
} from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import type { VaultHit } from '../types'

function yamlScalar(value: unknown): string {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)
  if (value === null || value === undefined) return '""'
  const text = String(value)
  return `"${text.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

function yamlValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(yamlScalar).join(', ')}]`
  return yamlScalar(value)
}

export function noteFrontmatter(values: Record<string, unknown>): string {
  return `---\n${Object.entries(values)
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join('\n')}\n---\n`
}

export class Vault {
  readonly root: string

  constructor(root: string) {
    this.root = resolve(root)
  }

  private async safePath(relativePath: string, allowMissing = false): Promise<string> {
    if (!relativePath.trim() || isAbsolute(relativePath)) {
      throw new Error('Vault paths must be relative.')
    }
    const target = resolve(this.root, relativePath)
    const fromRoot = relative(this.root, target)
    if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
      throw new Error('Path is outside the vault.')
    }

    const parts = fromRoot.split(/[\\/]/).filter(Boolean)
    let current = this.root
    for (let index = 0; index < parts.length - (allowMissing ? 0 : 1); index += 1) {
      current = resolve(current, parts[index])
      try {
        if ((await lstat(current)).isSymbolicLink()) {
          throw new Error('Symbolic links are not allowed in vault paths.')
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT' && allowMissing) break
        throw error
      }
    }
    return target
  }

  async search(query: string, limit = 20): Promise<VaultHit[]> {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return []
    const hits: VaultHit[] = []

    const walk = async (directory: string): Promise<void> => {
      if (hits.length >= limit) return
      const entries = await readdir(directory, { withFileTypes: true })
      for (const entry of entries) {
        if (hits.length >= limit) break
        if (entry.name === '.git' || entry.name === '.obsidian') continue
        const absolute = resolve(directory, entry.name)
        if (entry.isSymbolicLink()) continue
        if (entry.isDirectory()) {
          await walk(absolute)
          continue
        }
        if (!entry.isFile() || !entry.name.toLocaleLowerCase().endsWith('.md')) continue
        const content = await readFile(absolute, 'utf8')
        const index = content.toLocaleLowerCase().indexOf(needle)
        if (index < 0 && !entry.name.toLocaleLowerCase().includes(needle)) continue
        const excerptStart = Math.max(0, index < 0 ? 0 : index - 80)
        hits.push({
          path: relative(this.root, absolute).replaceAll('\\', '/'),
          title: entry.name.slice(0, -3),
          excerpt: content.slice(excerptStart, excerptStart + 240).replace(/\s+/g, ' ').trim()
        })
      }
    }

    await walk(this.root)
    return hits
  }

  async read(relativePath: string): Promise<string> {
    return readFile(await this.safePath(relativePath), 'utf8')
  }

  /**
   * Overwrites a note the app owns and regenerates. Unlike createNote this is
   * deliberately destructive — it backs the generated task board, which is a
   * projection of the database and must not accumulate suffixed copies.
   * Never point this at a note a human writes by hand.
   */
  async writeNote(relativePath: string, contents: string): Promise<void> {
    const target = await this.safePath(relativePath, true)
    await mkdir(resolve(target, '..'), { recursive: true })
    await writeFile(target, contents.endsWith('\n') ? contents : `${contents}\n`, 'utf8')
  }

  /** Stores a captured image inside the vault and returns its relative path. */
  async writeBinary(relativePath: string, contents: Buffer): Promise<string> {
    const target = await this.safePath(relativePath, true)
    await mkdir(resolve(target, '..'), { recursive: true })
    await writeFile(target, contents)
    return relativePath
  }

  async append(relativePath: string, markdown: string): Promise<void> {
    const target = await this.safePath(relativePath, true)
    await mkdir(resolve(target, '..'), { recursive: true })
    await appendFile(target, markdown, 'utf8')
  }

  async createNote(
    folder: string,
    title: string,
    frontmatter: Record<string, unknown>,
    body: string,
    // Regenerated notes (one per day, derived from the database) should replace
    // themselves. Suffixing them to "-2", "-3" left the newest copy invisible to
    // anything that looks the note up by its expected name.
    options: { replace?: boolean } = {}
  ): Promise<string> {
    const cleanTitle = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim() || 'Untitled'
    const folderPath = await this.safePath(folder, true)
    await mkdir(folderPath, { recursive: true })
    const now = new Date().toISOString()
    const metadata = {
      title: cleanTitle,
      type: 'note',
      tags: [],
      created: now,
      updated: now,
      ...frontmatter
    }

    if (options.replace) {
      const relativePath = `${folder.replaceAll('\\', '/')}/${cleanTitle}.md`
      const target = await this.safePath(relativePath, true)
      await writeFile(target, `${noteFrontmatter(metadata)}\n${body.trim()}\n`, 'utf8')
      return relativePath
    }

    for (let suffix = 1; suffix < 10_000; suffix += 1) {
      const name = suffix === 1 ? cleanTitle : `${cleanTitle}-${suffix}`
      const relativePath = `${folder.replaceAll('\\', '/')}/${name}.md`
      const target = await this.safePath(relativePath, true)
      try {
        await writeFile(target, `${noteFrontmatter(metadata)}\n${body.trim()}\n`, {
          encoding: 'utf8',
          flag: 'wx'
        })
        return relativePath
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      }
    }
    throw new Error('Could not choose a unique note name.')
  }
}
