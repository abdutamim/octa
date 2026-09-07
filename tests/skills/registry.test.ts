import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { parseSkillFrontmatter, readSkillFrontmatter } from '../../electron/core/skills/frontmatter'
import { createSkillTools } from '../../electron/core/skills/tools'
import { SkillRegistry } from '../../electron/core/skills/registry'
import type { JobHandle } from '../../electron/core/jobs/runner'

const libraryPath = join(process.cwd(), 'skills-library')
let registry: SkillRegistry | undefined
let temporaryDirectory: string | undefined

afterEach(() => {
  registry?.close()
  registry = undefined
  if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true })
  temporaryDirectory = undefined
})

function writeLibrary(entry: Record<string, unknown>, markdown?: string): string {
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'octa-skills-'))
  mkdirSync(join(temporaryDirectory, 'skills', String(entry.folder)), { recursive: true })
  writeFileSync(join(temporaryDirectory, 'MANIFEST.json'), JSON.stringify({ skills: [entry] }, null, 2), 'utf8')
  if (markdown !== undefined) {
    writeFileSync(join(temporaryDirectory, 'skills', String(entry.folder), 'SKILL.md'), markdown, 'utf8')
  }
  return temporaryDirectory
}

describe('SKILL.md frontmatter', () => {
  it('parses the selected fields from five real library skills', () => {
    const names = ['web-perf', 'frontend-ui-polisher', 'photoshop-driver', 'carousel-forge', 'turnstile-spin']
    for (const name of names) {
      const parsed = readSkillFrontmatter(join(libraryPath, 'skills', name, 'SKILL.md'))
      expect(parsed.name).toBe(name)
      expect(parsed.description.length).toBeGreaterThan(20)
      expect(Array.isArray(parsed.allowedTools)).toBe(true)
    }

    const polisher = readSkillFrontmatter(join(libraryPath, 'skills', 'frontend-ui-polisher', 'SKILL.md'))
    expect(polisher.allowedTools).toEqual(['Bash(npx impeccable *)'])
    expect(polisher.argumentHint).toBe('[{{command_hint}}] [target]')

    const folded = readSkillFrontmatter(join(libraryPath, 'skills', 'photoshop-driver', 'SKILL.md'))
    expect(folded.description).toContain('Drive Photoshop from the terminal')
    expect(folded.description).not.toContain('\n')
  })

  it('reads a Claude runner marker and keeps list values as strings', () => {
    const parsed = parseSkillFrontmatter(`---\nname: custom\ndescription: Custom skill\nrunner: claude\nallowed-tools:\n  - Read\n  - Bash(node *)\n---\n\n# Custom`)
    expect(parsed).toEqual({
      name: 'custom',
      description: 'Custom skill',
      allowedTools: ['Read', 'Bash(node *)'],
      runner: 'claude'
    })
  })
})

describe('skill registry', () => {
  it('loads 87 visible skills and keeps reference skills behind includeReference', () => {
    const before = readFileSync(join(libraryPath, 'MANIFEST.json'), 'utf8')
    registry = new SkillRegistry({ skillsLibraryPath: libraryPath, watch: false })

    const visible = registry.listSkills()
    expect(visible).toHaveLength(87)
    expect(visible.filter((skill) => skill.verdict === 'core')).toHaveLength(31)
    expect(visible.filter((skill) => skill.verdict === 'keep')).toHaveLength(55)
    expect(visible.filter((skill) => skill.verdict === 'client')).toHaveLength(1)
    expect(visible.some((skill) => skill.verdict === 'reference')).toBe(false)
    expect(visible.some((skill) => skill.verdict === 'drop' || skill.verdict === 'merge')).toBe(false)

    const withReference = registry.listSkills({ includeReference: true })
    expect(withReference).toHaveLength(102)
    expect(withReference.filter((skill) => skill.verdict === 'reference')).toHaveLength(15)
    expect(withReference.some((skill) => skill.verdict === 'drop' || skill.verdict === 'merge')).toBe(false)
    expect(withReference.find((skill) => skill.name === 'stop-slop')).toMatchObject({
      name: 'stop-slop',
      folder: 'stop-slop',
      department: 'marketing',
      runner: 'codex-exec'
    })
    expect(readFileSync(join(libraryPath, 'MANIFEST.json'), 'utf8')).toBe(before)
  })

  it('filters by department and query and maps the documented Claude folders', () => {
    registry = new SkillRegistry({ skillsLibraryPath: libraryPath, watch: false })
    expect(registry.listSkills({ department: 'DESIGN' }).every((skill) => skill.department === 'design')).toBe(true)
    expect(registry.listSkills({ query: 'Core Web Vitals' }).map((skill) => skill.name)).toContain('web-perf')

    for (const name of [
      'web-perf',
      'frontend-ui-polisher',
      'skill-creator',
      'photoshop-driver',
      'photoshop-posts',
      'carousel-forge',
      'carousel-studio',
      'tamim-carousel',
      'growth-os',
      'turnstile-spin',
      'mcp-server-builder'
    ]) {
      expect(registry.runnerFor(name)).toBe('claude-skill')
    }
    expect(registry.runnerFor('copywriting')).toBe('codex-exec')
    expect(registry.getSkill('agents-sdk')?.verdict).toBe('reference')
  })

  it('uses a frontmatter Claude marker for a skill outside the folder set', () => {
    const root = writeLibrary({
      name: 'custom',
      folder: 'custom',
      department: 'engineering',
      verdict: 'keep',
      autonomy: 'assisted',
      use: 'Test skill',
      description: 'A test skill.'
    }, `---\nname: custom\ndescription: A test skill.\nrunner: claude\n---\n\n# Custom`)
    registry = new SkillRegistry({ skillsLibraryPath: root, watch: false })
    expect(registry.getSkill('custom')?.runner).toBe('claude-skill')
    expect(registry.runnerFor('custom')).toBe('claude-skill')
  })

  it('reloads the manifest when the watched file changes', async () => {
    const root = writeLibrary({
      name: 'first',
      folder: 'first',
      department: 'engineering',
      verdict: 'keep',
      autonomy: 'assisted',
      use: 'First test skill',
      description: 'The first test skill.'
    }, `---\nname: first\ndescription: The first test skill.\n---\n\n# First`)
    registry = new SkillRegistry({ skillsLibraryPath: root })
    expect(registry.watching).toBe(true)

    const manifest = {
      skills: [{
        name: 'second',
        folder: 'second',
        department: 'engineering',
        verdict: 'keep',
        autonomy: 'assisted',
        use: 'Second test skill',
        description: 'The second test skill.'
      }]
    }
    mkdirSync(join(root, 'skills', 'second'), { recursive: true })
    writeFileSync(join(root, 'skills', 'second', 'SKILL.md'), '---\nname: second\ndescription: The second test skill.\n---\n\n# Second', 'utf8')
    writeFileSync(join(root, 'MANIFEST.json'), JSON.stringify(manifest), 'utf8')

    await new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 1_500
      const check = (): void => {
        if (registry?.getSkill('second')) {
          resolve()
          return
        }
        if (Date.now() >= deadline) {
          reject(new Error('The skill manifest watcher did not reload in time.'))
          return
        }
        setTimeout(check, 25)
      }
      check()
    })
    expect(registry.getSkill('first')).toBeUndefined()
  })

  it('reports a clear error when the manifest folder is missing', () => {
    const root = writeLibrary({
      name: 'missing',
      folder: 'missing',
      department: 'engineering',
      verdict: 'keep',
      autonomy: 'assisted',
      use: 'Test missing folder',
      description: 'A test skill with no folder.'
    })
    registry = new SkillRegistry({ skillsLibraryPath: root, watch: false })
    expect(() => registry!.resolveSkillDir('missing')).toThrow(/missing.*SKILL\.md/i)
    expect(existsSync(join(root, 'skills', 'missing', 'SKILL.md'))).toBe(false)
  })
})

describe('skill assistant tools', () => {
  it('lists skills and starts run_skill through the runner adapter', async () => {
    registry = new SkillRegistry({ skillsLibraryPath: libraryPath, watch: false })
    const handle = {
      id: 'job-1',
      jobId: 'job-1',
      folder: 'C:\\Octa\\jobs\\job-1',
      promise: Promise.resolve(undefined as never),
      result: Promise.resolve(undefined as never),
      events: new EventEmitter(),
      onEvent: () => () => undefined,
      cancel: async () => true
    } as JobHandle
    const runSkill = vi.fn(() => handle)
    const [listTool, runTool] = createSkillTools({ registry, runSkill })

    const result = await listTool.execute({ department: 'marketing', query: 'copy' })
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'copy-editing', department: 'marketing' }),
      expect.objectContaining({ name: 'copywriting', department: 'marketing' })
    ]))

    await expect(runTool.execute({ name: 'stop-slop', input: { text: 'hello' } })).resolves.toMatchObject({
      id: 'job-1',
      runner: 'codex-exec',
      name: 'stop-slop'
    })
    expect(runSkill).toHaveBeenCalledWith(expect.objectContaining({
      name: 'stop-slop',
      input: { text: 'hello' },
      runner: 'codex-exec',
      skillsLibraryPath: libraryPath
    }), undefined)
  })
})
