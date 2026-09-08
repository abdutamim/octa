import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import type {
  BuildMode,
  BuildWorkspace,
  CommandResult,
  CommandRunner,
  ProjectDetection
} from './types'

export interface WorkspaceOptions {
  id: string
  octaHome?: string
  projectPath?: string
  mode?: BuildMode
  direct?: boolean
  targetBranch?: string
  commandRunner?: CommandRunner
  now?: () => Date
}

export interface WorkspaceCommandOptions {
  env?: NodeJS.ProcessEnv
  timeoutMs?: number
}

function executable(command: string): string {
  if (process.platform !== 'win32') return command
  if (command === 'gh') return command
  if (!['npm', 'pnpm', 'yarn', 'bun', 'claude', 'codex'].includes(command)) return command
  return `${command}.cmd`
}

export const defaultCommandRunner: CommandRunner = (command, args, options) => new Promise<CommandResult>((resolvePromise) => {
  // Windows package managers are .cmd shims. Node cannot launch those shims
  // with shell:false on every supported Windows runtime, so use the native
  // command shell only for this fixed allow-list of package-manager names.
  const packageManagerCommand = process.platform === 'win32' && ['npm', 'pnpm', 'yarn', 'bun'].includes(command)
  const child = spawn(packageManagerCommand ? command : executable(command), args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    shell: packageManagerCommand,
    windowsHide: true
  })
  let stdout = ''
  let stderr = ''
  let settled = false
  let timer: NodeJS.Timeout | undefined
  const finish = (result: CommandResult): void => {
    if (settled) return
    settled = true
    if (timer) clearTimeout(timer)
    resolvePromise(result)
  }
  child.stdout?.on('data', (chunk: Buffer | string) => { stdout += String(chunk) })
  child.stderr?.on('data', (chunk: Buffer | string) => { stderr += String(chunk) })
  child.on('error', (error) => finish({ code: -1, stdout, stderr: `${stderr}${error.message}`, signal: undefined }))
  child.on('close', (code, signal) => finish({ code: code ?? -1, stdout, stderr, signal: signal ?? undefined }))
  if (options.timeoutMs && options.timeoutMs > 0) {
    timer = setTimeout(() => {
      child.kill()
      finish({ code: -1, stdout, stderr: `${stderr}\nCommand timed out.`, signal: 'SIGTERM' })
    }, options.timeoutMs)
  }
})

function safeId(value: string): string {
  const cleaned = value.toLocaleLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  if (!cleaned) throw new Error('A build id is required.')
  return cleaned
}

function readPackage(root: string): Record<string, unknown> | undefined {
  const path = join(root, 'package.json')
  if (!existsSync(path)) return undefined
  try {
    const value: unknown = JSON.parse(readFileSync(path, 'utf8'))
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined
  } catch {
    return undefined
  }
}

function packageManager(root: string): ProjectDetection['packageManager'] {
  if (existsSync(join(root, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(root, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(root, 'bun.lockb')) || existsSync(join(root, 'bun.lock'))) return 'bun'
  return 'npm'
}

function hasDependency(packageJson: Record<string, unknown> | undefined, name: string): boolean {
  if (!packageJson) return false
  for (const group of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const values = packageJson[group]
    if (typeof values === 'object' && values !== null && name in values) return true
  }
  return false
}

function packageScript(packageJson: Record<string, unknown> | undefined, name: string): boolean {
  const scripts = packageJson?.scripts
  return typeof scripts === 'object' && scripts !== null && name in scripts
}

function packageCommand(manager: ProjectDetection['packageManager'], script: string): string {
  if (manager === 'pnpm') return `pnpm ${script}`
  if (manager === 'yarn') return `yarn ${script}`
  if (manager === 'bun') return `bun ${script}`
  return script === 'test' ? 'npm test' : `npm run ${script}`
}

export function detectProject(projectPath = process.cwd()): ProjectDetection {
  const root = resolve(projectPath)
  const files = existsSync(root) && statSync(root).isDirectory() ? readdirSync(root) : []
  const packageJson = readPackage(root)
  const manager = packageJson ? packageManager(root) : undefined
  const astro = hasDependency(packageJson, 'astro') || files.some((file) => /^astro\.config\./.test(file))
  const next = hasDependency(packageJson, 'next') || files.some((file) => /^next\.config\./.test(file))
  const python = existsSync(join(root, 'pyproject.toml')) || existsSync(join(root, 'requirements.txt')) || existsSync(join(root, 'setup.py'))
  let type: ProjectDetection['type'] = 'unknown'
  if (astro) type = 'astro'
  else if (next) type = 'next'
  else if (packageJson) type = 'node'
  else if (python) type = 'python'
  const testCommand = packageJson && packageScript(packageJson, 'test')
    ? packageCommand(manager, 'test')
    : python
      ? existsSync(join(root, 'pytest.ini')) || existsSync(join(root, 'tests')) ? 'python -m pytest' : 'python -m compileall .'
      : undefined
  const buildCommand = packageJson && packageScript(packageJson, 'build') ? packageCommand(manager, 'build') : undefined
  const startCommand = packageJson && packageScript(packageJson, 'start') ? packageCommand(manager, 'start') : undefined
  return { type, root, packageManager: manager, testCommand, buildCommand, startCommand, files }
}

async function runCommand(
  runner: CommandRunner,
  command: string,
  args: string[],
  cwd: string,
  options: WorkspaceCommandOptions = {}
): Promise<CommandResult> {
  return runner(command, args, { cwd, env: options.env, timeoutMs: options.timeoutMs })
}

async function git(
  runner: CommandRunner,
  cwd: string,
  args: string[],
  options: WorkspaceCommandOptions = {}
): Promise<CommandResult> {
  const result = await runCommand(runner, 'git', args, cwd, options)
  if (result.code !== 0) {
    throw new Error(`git ${args.join(' ')} failed (${result.code}): ${result.stderr || result.stdout}`)
  }
  return result
}

export async function currentBranch(projectPath: string, runner: CommandRunner = defaultCommandRunner): Promise<string> {
  const result = await git(runner, projectPath, ['branch', '--show-current'])
  return result.stdout.trim() || 'main'
}

async function existingWorktree(
  projectPath: string,
  workspacePath: string,
  runner: CommandRunner
): Promise<{ branch: string } | undefined> {
  try {
    const result = await git(runner, projectPath, ['worktree', 'list', '--porcelain'])
    const blocks = result.stdout.split(/\r?\n\r?\n/)
    const wanted = resolve(workspacePath).toLocaleLowerCase()
    for (const block of blocks) {
      const pathLine = block.split(/\r?\n/).find((line) => line.startsWith('worktree '))
      if (!pathLine || resolve(pathLine.slice('worktree '.length)).toLocaleLowerCase() !== wanted) continue
      const branchLine = block.split(/\r?\n/).find((line) => line.startsWith('branch '))
      return { branch: branchLine?.slice('branch refs/heads/'.length) || '' }
    }
  } catch {
    return undefined
  }
  return undefined
}

export async function createWorkspace(options: WorkspaceOptions): Promise<BuildWorkspace> {
  const id = safeId(options.id)
  const projectPath = resolve(options.projectPath ?? process.cwd())
  const octaHome = resolve(options.octaHome ?? 'C:\\Octa')
  const buildRoot = join(octaHome, 'builds', id)
  const mode: BuildMode = options.direct || options.mode === 'direct' ? 'direct' : 'isolated'
  const runner = options.commandRunner ?? defaultCommandRunner
  const targetBranch = options.targetBranch ?? await currentBranch(projectPath, runner)
  const branch = `build/${id}`
  let workspacePath = mode === 'direct' ? projectPath : buildRoot
  mkdirSync(join(octaHome, 'builds'), { recursive: true })
  mkdirSync(buildRoot, { recursive: true })
  if (mode === 'isolated') {
    const existing = await existingWorktree(projectPath, workspacePath, runner)
    if (existing) {
      workspacePath = resolve(workspacePath)
    } else if (existsSync(join(workspacePath, '.git'))) {
      const status = await runCommand(runner, 'git', ['status', '--porcelain'], workspacePath)
      if (status.code !== 0) throw new Error(`The existing build workspace is not a Git worktree: ${workspacePath}`)
    } else {
      const add = await runCommand(runner, 'git', ['worktree', 'add', '-b', branch, workspacePath, targetBranch], projectPath)
      if (add.code !== 0) throw new Error(`Could not create build worktree: ${add.stderr || add.stdout}`)
    }
  }
  const metadataPath = join(buildRoot, '.octa-build')
  mkdirSync(metadataPath, { recursive: true })
  return {
    id,
    mode,
    projectPath,
    path: resolve(workspacePath),
    branch: mode === 'direct' ? targetBranch : branch,
    targetBranch,
    buildRoot: resolve(buildRoot),
    metadataPath: resolve(metadataPath),
    project: detectProject(projectPath),
    createdAt: (options.now ?? (() => new Date()))().toISOString()
  }
}

export async function workspaceGit(
  workspace: BuildWorkspace,
  args: string[],
  runner: CommandRunner = defaultCommandRunner,
  options: WorkspaceCommandOptions = {}
): Promise<CommandResult> {
  return git(runner, workspace.path, args, options)
}

export async function removeWorkspace(
  workspace: BuildWorkspace,
  options: { commandRunner?: CommandRunner; deleteBranch?: boolean } = {}
): Promise<void> {
  if (workspace.mode === 'direct') return
  const runner = options.commandRunner ?? defaultCommandRunner
  const removed = await runCommand(runner, 'git', ['worktree', 'remove', '--force', workspace.path], workspace.projectPath)
  if (removed.code !== 0 && existsSync(join(workspace.path, '.git'))) {
    throw new Error(`Could not remove build worktree: ${removed.stderr || removed.stdout}`)
  }
  if (options.deleteBranch !== false) {
    const branch = await runCommand(runner, 'git', ['branch', '-D', workspace.branch], workspace.projectPath)
    if (branch.code !== 0 && !branch.stderr.toLocaleLowerCase().includes('not found')) {
      throw new Error(`Could not delete build branch: ${branch.stderr || branch.stdout}`)
    }
  }
}

export async function projectCommand(
  command: string | undefined,
  cwd: string,
  runner: CommandRunner = defaultCommandRunner,
  timeoutMs?: number
): Promise<CommandResult | undefined> {
  if (!command?.trim()) return undefined
  const parts = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((part) => part.replace(/^(["']).*\1$/, (value) => value.slice(1, -1))) ?? []
  const [program, ...args] = parts
  if (!program) return undefined
  return runCommand(runner, program, args, cwd, { timeoutMs })
}
