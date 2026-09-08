import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { buildCodexExecArgv, resolveCliBinary } from '../../jobs/runner'
import type { BuildPlan, BuildSpec, BuildWorkspace, CommandResult, CommandRunner } from './types'
import { defaultCommandRunner, removeWorkspace, workspaceGit } from './workspace'

export interface ConflictPreview {
  hasConflicts: boolean
  files: string[]
  diffSummary: string
  mergeTree: string
}

export interface BuildReviewSummary {
  buildId: string
  branch: string
  targetBranch: string
  changedFiles: string[]
  diffStat: string
  commits: string
  summary: string
}

export interface MergeOptions {
  workspace: BuildWorkspace
  buildId: string
  targetPath?: string
  targetBranch?: string
  strategy?: 'merge' | 'pr'
  commandRunner?: CommandRunner
  conflictResolver?: ConflictResolver
  title?: string
  body?: string
}

export interface ConflictResolutionRequest {
  buildId: string
  workspace: BuildWorkspace
  targetPath: string
  targetBranch: string
  branch: string
  files: string[]
  mergeTree: string
}

export type ConflictResolver = (request: ConflictResolutionRequest) => Promise<boolean>

export interface MergeResult {
  strategy: 'merge' | 'pr'
  merged: boolean
  branch: string
  targetBranch: string
  conflicts: string[]
  pullRequestUrl?: string
  output?: string
}

async function rawGit(runner: CommandRunner, cwd: string, args: string[]): Promise<CommandResult> {
  return runner('git', args, { cwd, env: undefined, timeoutMs: undefined })
}

function changedNames(text: string): string[] {
  return [...new Set(text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split(/\s+/)
    return parts.at(-1) ?? line
  }))]
}

export async function previewConflicts(options: {
  workspace: BuildWorkspace
  targetBranch?: string
  commandRunner?: CommandRunner
}): Promise<ConflictPreview> {
  const runner = options.commandRunner ?? defaultCommandRunner
  const targetBranch = options.targetBranch ?? options.workspace.targetBranch
  const range = `${targetBranch}...${options.workspace.branch}`
  const names = await rawGit(runner, options.workspace.projectPath, ['diff', '--name-only', range])
  const stat = await rawGit(runner, options.workspace.projectPath, ['diff', '--stat', range])
  const tree = await rawGit(runner, options.workspace.projectPath, ['merge-tree', targetBranch, options.workspace.branch])
  const output = `${tree.stdout}\n${tree.stderr}`
  const conflicts = changedNames(names.stdout).filter((file) => output.includes(file))
  const explicitConflict = /(^|\n)(<{7}|={7}|>{7}|CONFLICT\b|both modified)/m.test(output)
  return {
    hasConflicts: explicitConflict || conflicts.length > 0,
    files: conflicts.length > 0 ? conflicts : explicitConflict ? changedNames(names.stdout) : [],
    diffSummary: stat.stdout.trim(),
    mergeTree: output.trim()
  }
}

export async function reviewBuild(options: {
  buildId: string
  workspace: BuildWorkspace
  targetBranch?: string
  commandRunner?: CommandRunner
}): Promise<BuildReviewSummary> {
  const runner = options.commandRunner ?? defaultCommandRunner
  const targetBranch = options.targetBranch ?? options.workspace.targetBranch
  const range = `${targetBranch}...${options.workspace.branch}`
  const [names, stat, commits] = await Promise.all([
    rawGit(runner, options.workspace.projectPath, ['diff', '--name-status', range]),
    rawGit(runner, options.workspace.projectPath, ['diff', '--stat', range]),
    rawGit(runner, options.workspace.projectPath, ['log', '--oneline', `${targetBranch}..${options.workspace.branch}`])
  ])
  const changedFiles = names.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => line.replace(/^\S+\s+/, ''))
  return {
    buildId: options.buildId,
    branch: options.workspace.branch,
    targetBranch,
    changedFiles,
    diffStat: stat.stdout.trim(),
    commits: commits.stdout.trim(),
    summary: `${changedFiles.length} changed file(s), ${commits.stdout.split(/\r?\n/).filter(Boolean).length} build commit(s).`
  }
}

async function defaultConflictResolver(request: ConflictResolutionRequest): Promise<boolean> {
  const executable = resolveCliBinary('codex')
  if (!executable) return false
  const schemaPath = join(request.workspace.metadataPath, 'merge-resolution.schema.json')
  mkdirSync(request.workspace.metadataPath, { recursive: true })
  writeFileSync(schemaPath, `${JSON.stringify({ type: 'object', additionalProperties: false, properties: {}, required: [] }, null, 2)}\n`, 'utf8')
  const prompt = [
    '<octa-build-merge>',
    `Build ${request.buildId} has merge conflicts. You are Luna resolving them.`,
    'Work in the target checkout and resolve every conflict while preserving the build acceptance criteria.',
    'Do not discard either side silently. Run a focused verification, leave no conflict markers, and do not invoke Octa Code or Python.',
    `Build branch: ${request.branch}`,
    `Target branch: ${request.targetBranch}`,
    `Files: ${request.files.join(', ') || 'see git status'}`,
    '',
    request.mergeTree
  ].join('\n')
  const child = spawn(executable, buildCodexExecArgv({ workspace: request.targetPath, outputSchema: schemaPath }), {
    cwd: request.targetPath,
    env: process.env,
    shell: false,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  })
  let stderr = ''
  return new Promise<boolean>((resolvePromise) => {
    let settled = false
    const finish = (value: boolean): void => {
      if (settled) return
      settled = true
      resolvePromise(value)
    }
    child.stderr?.on('data', (chunk: Buffer | string) => { stderr += String(chunk) })
    child.once('error', () => finish(false))
    child.once('close', (code) => finish(code === 0 && !stderr.toLocaleLowerCase().includes('error')))
    child.stdin?.end(prompt, 'utf8')
  })
}

export async function mergeBuild(options: MergeOptions): Promise<MergeResult> {
  const runner = options.commandRunner ?? defaultCommandRunner
  const targetBranch = options.targetBranch ?? options.workspace.targetBranch
  const strategy = options.strategy ?? 'merge'
  if (strategy === 'pr') {
    const title = options.title ?? `Octa build ${options.buildId}`
    const body = options.body ?? `Native Octa build branch: ${options.workspace.branch}`
    const result = await runner('gh', ['pr', 'create', '--head', options.workspace.branch, '--base', targetBranch, '--title', title, '--body', body], {
      cwd: options.workspace.projectPath,
      env: undefined,
      timeoutMs: undefined
    })
    if (result.code !== 0) throw new Error(`Could not create pull request: ${result.stderr || result.stdout}`)
    const url = result.stdout.trim().split(/\r?\n/).find((line) => /^https?:\/\//.test(line.trim()))
    return { strategy, merged: false, branch: options.workspace.branch, targetBranch, conflicts: [], pullRequestUrl: url, output: result.stdout.trim() }
  }
  const preview = await previewConflicts({ workspace: options.workspace, targetBranch, commandRunner: runner })
  const targetPath = options.targetPath ?? options.workspace.projectPath
  if (preview.hasConflicts) {
    const mergeStart = await rawGit(runner, targetPath, ['merge', '--no-commit', '--no-ff', options.workspace.branch, '-m', `build/${options.buildId}: merge`])
    if (mergeStart.code !== 0) {
      const mergeStatus = await rawGit(runner, targetPath, ['status', '--porcelain'])
      if (!/^(UU|AA|DD|AU|UA|DU|UD)\s/m.test(mergeStatus.stdout)) {
        throw new Error(`Could not start the conflict merge: ${mergeStart.stderr || mergeStart.stdout}`)
      }
    }
    const resolver = options.conflictResolver ?? defaultConflictResolver
    let resolved = false
    try {
      resolved = await resolver({
        buildId: options.buildId,
        workspace: options.workspace,
        targetPath,
        targetBranch,
        branch: options.workspace.branch,
        files: preview.files,
        mergeTree: preview.mergeTree
      })
    } catch (error) {
      await rawGit(runner, targetPath, ['merge', '--abort'])
      throw error
    }
    if (!resolved) {
      await rawGit(runner, targetPath, ['merge', '--abort'])
      throw new Error(`Merge conflicts require human resolution: ${preview.files.join(', ')}`)
    }
    const add = await rawGit(runner, targetPath, ['add', '-A'])
    if (add.code !== 0) {
      await rawGit(runner, targetPath, ['merge', '--abort'])
      throw new Error(`Could not stage resolved files: ${add.stderr || add.stdout}`)
    }
    const unresolved = await rawGit(runner, targetPath, ['diff', '--cached', '--name-only', '--diff-filter=U'])
    const stagedDiff = await rawGit(runner, targetPath, ['diff', '--cached'])
    if (unresolved.stdout.trim() || /(^|\n)(<{7}|={7}|>{7})/m.test(stagedDiff.stdout)) {
      await rawGit(runner, targetPath, ['merge', '--abort'])
      throw new Error('The AI resolver left unresolved merge conflicts.')
    }
    const commit = await rawGit(runner, targetPath, ['commit', '-m', `build/${options.buildId}: merge resolved`])
    if (commit.code !== 0) {
      await rawGit(runner, targetPath, ['merge', '--abort'])
      throw new Error(`Could not commit the conflict resolution: ${commit.stderr || commit.stdout}`)
    }
  } else {
    const merged = await rawGit(runner, targetPath, ['merge', '--no-ff', options.workspace.branch, '-m', `build/${options.buildId}: merge`])
    if (merged.code !== 0) throw new Error(`Could not merge build branch: ${merged.stderr || merged.stdout}`)
  }
  return { strategy, merged: true, branch: options.workspace.branch, targetBranch, conflicts: preview.files }
}

export async function discardBuild(
  workspace: BuildWorkspace,
  options: { commandRunner?: CommandRunner } = {}
): Promise<void> {
  await removeWorkspace(workspace, { commandRunner: options.commandRunner, deleteBranch: true })
}
