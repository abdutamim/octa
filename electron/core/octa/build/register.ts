import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { spawn } from 'node:child_process'
import { buildClaudeSkillArgv, resolveCliBinary } from '../../jobs/runner'
import type { SkillRegistry } from '../../skills/registry'
import type { BuildPlan, BuildSpec, RegistrationResult } from './types'

export interface SkillCreatorRequest {
  name: string
  directory: string
  brief: string
  spec: BuildSpec
  plan: BuildPlan
}

export type SkillCreator = (request: SkillCreatorRequest) => Promise<boolean>

export interface RegisterOptions {
  buildId: string
  brief: string
  spec: BuildSpec
  plan: BuildPlan
  kind?: 'skill' | 'project'
  name?: string
  skillsLibraryPath?: string
  knowledgePath?: string
  registry?: SkillRegistry
  skillCreator?: SkillCreator
}

function slug(value: string): string {
  const result = value.toLocaleLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, '-').replace(/^-+|-+$/g, '')
  return result || `octa-build-${value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

function inferName(brief: string, spec: BuildSpec): string {
  const text = `${brief} ${spec.title}`.toLocaleLowerCase()
  if (text.includes('word count') || text.includes('word-count') || text.includes('كلمات')) return 'word-count'
  return slug(spec.title || brief).slice(0, 80)
}

function skillMarkdown(name: string, brief: string, spec: BuildSpec, plan: BuildPlan): string {
  return [
    '---',
    `name: ${name}`,
    `description: ${brief.replace(/\r?\n/g, ' ').trim()}`,
    'metadata:',
    '  version: 1.0.0',
    '  runner: codex-exec',
    '---',
    '',
    `# ${spec.title || name}`,
    '',
    'This skill was registered by the native Octa build pipeline.',
    'هذه المهارة سُجلت بواسطة خط بناء Octa الأصلي.',
    '',
    '## User request',
    '',
    brief.trim(),
    '',
    '## Behaviour',
    '',
    'Read the user-provided input, perform only the requested transformation, and explain the result clearly.',
    'اقرأ الملف أو المدخل الذي يحدده المستخدم، نفّذ التحويل المطلوب فقط، واشرح النتيجة بوضوح.',
    '',
    '## Acceptance',
    '',
    ...(spec.acceptance.length > 0 ? spec.acceptance : plan.acceptance).map((item) => `- ${item}`),
    '',
    '## Safety',
    '',
    'Do not overwrite the source file without explicit confirmation. Keep paths inside the user-selected workspace.',
    'لا تستبدل الملف الأصلي من دون تأكيد صريح، وحافظ على المسارات داخل مساحة العمل التي يحددها المستخدم.',
    ''
  ].join('\n')
}

function manifestEntry(name: string, brief: string): Record<string, unknown> {
  return {
    name,
    folder: name,
    department: 'tools',
    verdict: 'client',
    autonomy: 'assisted',
    use: brief,
    description: brief,
    runner: 'codex-exec'
  }
}

function skillCreatorCandidates(): string[] {
  return [
    process.env.OCTA_SKILL_CREATOR_PATH,
    join(process.env.USERPROFILE ?? '', '.codex', 'skills', '.system', 'skill-creator'),
    join(process.env.USERPROFILE ?? '', '.claude', 'skills', 'skill-creator')
  ].filter((value, index, all): value is string => Boolean(value?.trim()) && all.indexOf(value) === index)
}

/** Run the installed skill-creator as the documented claude-skill runner. */
export const defaultSkillCreator: SkillCreator = async (request) => {
  const skillPath = skillCreatorCandidates().find((candidate) => existsSync(join(candidate, 'SKILL.md')))
  const executable = resolveCliBinary('claude')
  if (!skillPath || !executable) return false
  const prompt = [
    `Create or update the skill named "${request.name}" in the current workspace.`,
    'Write a complete SKILL.md for the requested built tool, preserving the supplied acceptance criteria.',
    'Keep the skill bilingual when the request is bilingual. Do not invoke Python or Octa Code and do not take outward actions.',
    '',
    '# User request',
    request.brief,
    '',
    '# Build spec',
    JSON.stringify(request.spec, null, 2),
    '',
    '# Build plan',
    JSON.stringify(request.plan, null, 2)
  ].join('\n')
  const child = spawn(executable, buildClaudeSkillArgv({ workspace: request.directory, skillPath }), {
    cwd: request.directory,
    env: process.env,
    shell: false,
    windowsHide: true,
    stdio: ['pipe', 'ignore', 'pipe']
  })
  let stderr = ''
  return new Promise<boolean>((resolvePromise) => {
    child.stderr?.on('data', (chunk: Buffer | string) => { stderr += String(chunk) })
    child.once('error', () => resolvePromise(false))
    child.once('close', (code) => resolvePromise(code === 0 && existsSync(join(request.directory, 'SKILL.md')) && !stderr.toLocaleLowerCase().includes('error')))
    child.stdin?.end(prompt, 'utf8')
  })
}

function updateManifest(libraryPath: string, name: string, brief: string): string {
  const manifestPath = join(libraryPath, 'MANIFEST.json')
  if (!existsSync(manifestPath)) throw new Error(`Skills manifest was not found at ${manifestPath}.`)
  const parsed: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('The skills manifest must be a JSON object.')
  const manifest = parsed as Record<string, unknown>
  const skills = Array.isArray(manifest.skills) ? manifest.skills.filter((item) => typeof item === 'object' && item !== null && !Array.isArray(item)) as Record<string, unknown>[] : []
  const entry = manifestEntry(name, brief)
  const existing = skills.findIndex((item) => item.name === name || item.folder === name)
  if (existing >= 0) skills[existing] = { ...skills[existing], ...entry }
  else skills.push(entry)
  manifest.skills = skills
  const temporary = `${manifestPath}.tmp-${process.pid}`
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  // rename is deliberately kept in the same directory so a registry watcher
  // never observes a half-written manifest.
  renameSync(temporary, manifestPath)
  return manifestPath
}

export async function registerBuiltOutput(options: RegisterOptions): Promise<RegistrationResult> {
  const kind = options.kind ?? 'skill'
  const name = options.name ? slug(options.name) : inferName(options.brief, options.spec)
  if (kind === 'project') {
    const root = resolve(options.knowledgePath ?? 'C:\\Octa\\knowledge')
    const projects = join(root, 'projects')
    mkdirSync(projects, { recursive: true })
    const path = join(projects, `${name}.md`)
    writeFileSync(path, [
      `# ${options.spec.title || name}`,
      '',
      `Build ID: ${options.buildId}`,
      '',
      options.brief.trim(),
      '',
      '## Acceptance',
      '',
      ...options.spec.acceptance.map((item) => `- ${item}`),
      ''
    ].join('\n'), 'utf8')
    return { kind, name, path, method: 'project-entry' }
  }
  const libraryPath = resolve(options.skillsLibraryPath ?? 'C:\\Octa\\skills-library')
  const skillsRoot = join(libraryPath, 'skills')
  const directory = resolve(skillsRoot, name)
  const relativeDirectory = relative(resolve(skillsRoot), directory)
  if (relativeDirectory === '..' || relativeDirectory.startsWith(`..${sep}`) || relativeDirectory.includes(':')) throw new Error('A registered skill must stay inside the skills library.')
  mkdirSync(directory, { recursive: true })
  const brief = options.brief.trim()
  const path = join(directory, 'SKILL.md')
  const createdBySkillCreator = await (options.skillCreator ?? defaultSkillCreator)({ name, directory, brief, spec: options.spec, plan: options.plan })
  if (!createdBySkillCreator || !existsSync(path)) writeFileSync(path, skillMarkdown(name, brief, options.spec, options.plan), 'utf8')
  const registryPath = updateManifest(libraryPath, name, brief)
  options.registry?.reload()
  return { kind, name, path, registryPath, method: createdBySkillCreator ? 'claude-skill' : 'native-skill-folder' }
}
