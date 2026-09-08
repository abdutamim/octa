import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { spawn } from 'node:child_process'
import { buildCodexExecArgv, parseCodexJsonLines, resolveCliBinary } from '../../jobs/runner'
import type {
  BuildPlan,
  BuildSpec,
  BuildSubtask,
  BuildWorkspace,
  CoderContextPack,
  CoderExecutor,
  CoderSessionRequest,
  CoderSessionResult,
  CommandRunner
} from './types'
import { dependencyOrder } from './spec'
import { defaultCommandRunner, workspaceGit } from './workspace'

export interface CoderOptions {
  buildId: string
  workspace: BuildWorkspace
  plan: BuildPlan
  spec?: BuildSpec
  specPath?: string
  planPath?: string
  commandRunner?: CommandRunner
  executor?: CoderExecutor
  maxRetries?: number
  savePlan?: (plan: BuildPlan) => Promise<void> | void
  onSubtask?: (subtask: BuildSubtask) => void
  onCommit?: (subtask: BuildSubtask, commitHash: string) => void
  onLog?: (message: string) => void
}

export interface CoderResult {
  completed: BuildSubtask[]
  failed?: BuildSubtask
  plan: BuildPlan
}

function sessionDirectory(workspace: BuildWorkspace): string {
  const path = join(workspace.metadataPath, 'memory')
  mkdirSync(path, { recursive: true })
  return path
}

function fileText(path: string | undefined, fallback: string): string {
  if (!path || !existsSync(path)) return fallback
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return fallback
  }
}

async function gitText(workspace: BuildWorkspace, args: string[], runner: CommandRunner): Promise<string> {
  try {
    const result = await workspaceGit(workspace, args, runner)
    return result.stdout.trim()
  } catch {
    return ''
  }
}

function recentSessionFiles(workspace: BuildWorkspace): string[] {
  const folders = [join(workspace.metadataPath, 'memory'), join(workspace.path, 'memory')]
  const paths: string[] = []
  for (const folder of folders) {
    if (!existsSync(folder)) continue
    for (const name of readdirSync(folder)) {
      if (!/^session[_-]/i.test(name) || !/\.json$/i.test(name)) continue
      const path = join(folder, name)
      try {
        if (statSync(path).isFile()) paths.push(path)
      } catch {
        // A session may disappear while a previous build is being cleaned up.
      }
    }
  }
  return [...new Set(paths)].sort((a, b) => b.localeCompare(a)).slice(0, 3)
}

export async function createContextPack(options: {
  workspace: BuildWorkspace
  subtask: BuildSubtask
  plan: BuildPlan
  spec?: BuildSpec
  specPath?: string
  planPath?: string
  commandRunner?: CommandRunner
}): Promise<CoderContextPack> {
  const runner = options.commandRunner ?? defaultCommandRunner
  const specFallback = options.spec ? JSON.stringify(options.spec, null, 2) : ''
  const planFallback = JSON.stringify(options.plan, null, 2)
  const filesFromPlan = options.plan.phases
    .flatMap((phase) => phase.subtasks)
    .filter((task) => task.status === 'completed')
    .flatMap((task) => task.filesTouched)
  const diffFiles = (await gitText(options.workspace, ['diff', '--name-only'], runner)).split(/\r?\n/).filter(Boolean)
  return {
    spec: fileText(options.specPath, specFallback),
    plan: fileText(options.planPath, planFallback),
    subtask: JSON.stringify(options.subtask, null, 2),
    recentSessions: recentSessionFiles(options.workspace).map((path) => fileText(path, '').slice(0, 12_000)),
    filesTouchedSoFar: [...new Set([...filesFromPlan, ...diffFiles])],
    diffSummary: await gitText(options.workspace, ['diff', '--stat'], runner)
  }
}

function coderPrompt(buildId: string, subtask: BuildSubtask, context: CoderContextPack): string {
  return [
    '<octa-build>',
    `Build: ${buildId}`,
    'You are Luna implementing exactly one native Octa build subtask.',
    'Work only in the supplied Git worktree. Do not invoke Octa Code, Python, or another agent.',
    'Read the spec and plan below. Edit only the requested files and any narrowly necessary adjacent files.',
    'Run the listed verification commands when possible. Do not publish, send, pay, or change files outside this worktree.',
    '</octa-build>',
    '',
    '# Spec',
    context.spec,
    '',
    '# Plan',
    context.plan,
    '',
    '# Current subtask',
    context.subtask,
    '',
    '# Last three session summaries',
    context.recentSessions.length > 0 ? context.recentSessions.join('\n\n---\n\n') : 'No prior session summaries.',
    '',
    '# Files touched so far',
    context.filesTouchedSoFar.length > 0 ? context.filesTouchedSoFar.join('\n') : 'No files have been changed yet.',
    '',
    '# Current diff summary',
    context.diffSummary || 'Working tree is clean.',
    '',
    'Return a concise summary of changes, commands run, and any remaining issue. Leave the implementation in the worktree.'
  ].join('\n')
}

function parseAgentSummary(output: string): string {
  const messages = parseCodexJsonLines(output).filter((event) => event.type === 'text').map((event) => event.type === 'text' ? event.text : '')
  return (messages.join('\n').trim() || output.trim()).slice(-12_000)
}

export const defaultCoderExecutor: CoderExecutor = async (request) => {
  const executable = resolveCliBinary('codex')
  if (!executable) return { status: 'failed', error: 'Codex CLI was not found. Install it and sign in before starting a build.' }
  mkdirSync(request.workspace.metadataPath, { recursive: true })
  writeFileSync(join(request.workspace.metadataPath, 'coder-result.schema.json'), `${JSON.stringify({
    type: 'object',
    additionalProperties: false,
    properties: { status: { type: 'string' }, summary: { type: 'string' }, commands: { type: 'array', items: { type: 'string' } } },
    required: ['status', 'summary', 'commands']
  }, null, 2)}\n`, 'utf8')
  const child = spawn(executable, request.argv, {
    cwd: request.workspace.path,
    env: process.env,
    shell: false,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  })
  let stdout = ''
  let stderr = ''
  return new Promise<CoderSessionResult>((resolvePromise) => {
    let settled = false
    const finish = (result: CoderSessionResult): void => {
      if (settled) return
      settled = true
      resolvePromise(result)
    }
    child.stdout?.on('data', (chunk: Buffer | string) => { stdout += String(chunk) })
    child.stderr?.on('data', (chunk: Buffer | string) => { stderr += String(chunk) })
    child.once('error', (error) => finish({ status: 'failed', error: `${error.message}${stderr ? `\n${stderr}` : ''}` }))
    child.once('close', (code) => {
      const summary = parseAgentSummary(stdout)
      if (code !== 0) finish({ status: 'failed', output: stdout, summary, error: stderr || `Codex exited with code ${code ?? 'unknown'}` })
      else finish({ status: 'completed', output: stdout, summary })
    })
    child.stdin?.end(request.prompt, 'utf8')
  })
}

async function commitSubtask(
  workspace: BuildWorkspace,
  buildId: string,
  description: string,
  runner: CommandRunner
): Promise<string> {
  await workspaceGit(workspace, ['add', '-A', '--', '.', ':(exclude).octa-build', ':(exclude)memory', ':(exclude)spec.md', ':(exclude)plan.json', ':(exclude)debate.md'], runner, {
    env: { GIT_AUTHOR_NAME: 'Octa', GIT_AUTHOR_EMAIL: 'octa@localhost', GIT_COMMITTER_NAME: 'Octa', GIT_COMMITTER_EMAIL: 'octa@localhost' }
  })
  await workspaceGit(workspace, ['commit', '--allow-empty', '-m', `build/${buildId}: ${description}`], runner, {
    env: { GIT_AUTHOR_NAME: 'Octa', GIT_AUTHOR_EMAIL: 'octa@localhost', GIT_COMMITTER_NAME: 'Octa', GIT_COMMITTER_EMAIL: 'octa@localhost' }
  })
  return gitText(workspace, ['rev-parse', 'HEAD'], runner)
}

export { commitSubtask }
export const commitPerSubtask = commitSubtask

async function writeSessionSummary(
  options: CoderOptions,
  subtask: BuildSubtask,
  result: CoderSessionResult,
  sessionNumber: number,
  runner: CommandRunner,
  commitHash?: string
): Promise<void> {
  const summary = {
    sessionId: result.sessionId ?? `session-${sessionNumber}`,
    buildId: options.buildId,
    subtaskId: subtask.id,
    status: result.status,
    summary: result.summary ?? result.output ?? result.error ?? '',
    subtasks_completed: options.plan.phases.flatMap((phase) => phase.subtasks).filter((task) => task.status === 'completed').map((task) => task.id),
    discoveries: {
      files_understood: subtask.filesTouched,
      patterns_found: [],
      gotchas_encountered: result.error ? [result.error] : []
    },
    what_worked: result.status === 'completed' ? ['Luna session completed.'] : [],
    what_failed: result.status === 'failed' ? [result.error ?? 'The session failed.'] : [],
    recommendations: result.status === 'completed' ? ['Use this commit as the next context baseline.'] : ['Resume this subtask after reviewing the failure.'],
    changedFiles: result.changedFiles ?? [],
    commands: result.commands ?? [],
    commitHash,
    timestamp: new Date().toISOString()
  }
  const folder = sessionDirectory(options.workspace)
  const base = `session_${String(sessionNumber).padStart(3, '0')}`
  writeFileSync(join(folder, `${base}.json`), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  writeFileSync(join(folder, `${base}.md`), [
    `# Session ${sessionNumber}: ${subtask.id}`,
    '',
    `Status: ${result.status}`,
    `Commit: ${commitHash ?? 'none'}`,
    '',
    summary.summary,
    '',
    '## Files',
    ...(summary.changedFiles.length > 0 ? summary.changedFiles.map((file) => `- ${file}`) : ['- None reported.']),
    '',
    '## Recommendations',
    ...summary.recommendations.map((item) => `- ${item}`),
    ''
  ].join('\n'), 'utf8')
}

async function changedFiles(workspace: BuildWorkspace, runner: CommandRunner): Promise<string[]> {
  const output = await gitText(workspace, ['show', '--format=', '--name-only', 'HEAD'], runner)
  return [...new Set(output.split(/\r?\n/).map((file) => file.trim()).filter(Boolean).map((file) => relative(workspace.path, join(workspace.path, file)).replaceAll('\\', '/')))]
}

export async function runCoder(options: CoderOptions): Promise<CoderResult> {
  const runner = options.commandRunner ?? defaultCommandRunner
  const executor = options.executor ?? defaultCoderExecutor
  const maxRetries = Math.max(1, options.maxRetries ?? 3)
  const ordered = dependencyOrder(options.plan)
  const completed: BuildSubtask[] = []
  let sessionNumber = recentSessionFiles(options.workspace).length + 1
  for (const subtask of ordered) {
    if (subtask.status === 'completed') {
      completed.push(subtask)
      continue
    }
    if (subtask.status === 'blocked' || subtask.status === 'stuck') continue
    const dependencies = new Set([...(subtask.dependencies ?? []), ...(subtask.needs ?? [])])
    if ([...dependencies].some((id) => !completed.some((item) => item.id === id) && !options.plan.phases.flatMap((phase) => phase.subtasks).some((item) => item.id === id && item.status === 'completed'))) {
      subtask.status = 'blocked'
      subtask.error = 'A dependency did not complete.'
      await options.savePlan?.(options.plan)
      options.onSubtask?.(subtask)
      return { completed, failed: subtask, plan: options.plan }
    }
    subtask.status = 'in_progress'
    subtask.startedAt = new Date().toISOString()
    subtask.attempts = (subtask.attempts ?? 0) + 1
    await options.savePlan?.(options.plan)
    options.onSubtask?.(subtask)
    const contextPack = await createContextPack({
      workspace: options.workspace,
      subtask,
      plan: options.plan,
      spec: options.spec,
      specPath: options.specPath,
      planPath: options.planPath,
      commandRunner: runner
    })
    const request: CoderSessionRequest = {
      buildId: options.buildId,
      workspace: options.workspace,
      subtask,
      contextPack,
      prompt: coderPrompt(options.buildId, subtask, contextPack),
      argv: buildCodexExecArgv({ workspace: options.workspace.path, outputSchema: join(options.workspace.metadataPath, 'coder-result.schema.json') })
    }
    let result: CoderSessionResult
    try {
      result = await executor(request)
    } catch (error) {
      result = { status: 'failed', error: error instanceof Error ? error.message : String(error) }
    }
    result.sessionId = result.sessionId ?? randomUUID()
    result.changedFiles = result.changedFiles ?? await changedFiles(options.workspace, runner)
    if (result.status !== 'completed') {
      subtask.status = (subtask.attempts ?? 0) >= maxRetries ? 'stuck' : 'failed'
      subtask.failedAt = new Date().toISOString()
      subtask.error = result.error ?? 'Luna failed to complete the subtask.'
      await writeSessionSummary(options, subtask, result, sessionNumber, runner)
      sessionNumber += 1
      await options.savePlan?.(options.plan)
      options.onSubtask?.(subtask)
      options.onLog?.(`${subtask.id}: ${subtask.error}`)
      return { completed, failed: subtask, plan: options.plan }
    }
    try {
      const hash = await commitSubtask(options.workspace, options.buildId, subtask.description, runner)
      subtask.commitHash = hash
      options.onCommit?.(subtask, hash)
      subtask.status = 'completed'
      subtask.completedAt = new Date().toISOString()
      subtask.actualOutput = result.summary ?? result.output
      await writeSessionSummary(options, subtask, result, sessionNumber, runner, hash)
      completed.push(subtask)
      options.onLog?.(`${subtask.id}: committed ${hash}`)
    } catch (error) {
      subtask.status = (subtask.attempts ?? 0) >= maxRetries ? 'stuck' : 'failed'
      subtask.failedAt = new Date().toISOString()
      subtask.error = error instanceof Error ? error.message : String(error)
      await writeSessionSummary(options, subtask, { ...result, status: 'failed', error: subtask.error }, sessionNumber, runner)
      await options.savePlan?.(options.plan)
      options.onSubtask?.(subtask)
      return { completed, failed: subtask, plan: options.plan }
    }
    sessionNumber += 1
    await options.savePlan?.(options.plan)
    options.onSubtask?.(subtask)
  }
  return { completed, plan: options.plan }
}
