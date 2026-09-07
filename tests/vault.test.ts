import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { noteFrontmatter, Vault } from '../electron/core/vault'

const directories: string[] = []

async function tempVault(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'octa-vault-'))
  directories.push(path)
  return path
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

describe('Vault', () => {
  it('rejects traversal and absolute paths before reading', async () => {
    const vault = new Vault(await tempVault())
    await expect(vault.read('../secret.md')).rejects.toThrow('outside')
    await expect(vault.read('C:\\Windows\\secret.md')).rejects.toThrow('relative')
  })

  it('never clobbers an existing note', async () => {
    const root = await tempVault()
    await mkdir(join(root, '00 Inbox'))
    await writeFile(join(root, '00 Inbox', 'Idea.md'), 'original')
    const vault = new Vault(root)

    const created = await vault.createNote('00 Inbox', 'Idea', { type: 'idea' }, 'new')

    expect(created).toBe('00 Inbox/Idea-2.md')
    expect(await readFile(join(root, '00 Inbox', 'Idea.md'), 'utf8')).toBe('original')
  })

  it('writes the vault frontmatter keys and preserves arrays', () => {
    const yaml = noteFrontmatter({
      title: 'اختبار',
      type: 'note',
      tags: ['arabic', 'test'],
      created: '2026-07-29',
      updated: '2026-07-29'
    })
    expect(yaml).toContain('title: "اختبار"')
    expect(yaml).toContain('tags: ["arabic", "test"]')
  })
})
