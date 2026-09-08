import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { buildCodexExecArgv, buildCodexReviewArgv, parseCodexJsonLines, resolveCliBinary } from '../../jobs/runner'
import type {
  BuildPlan,
  BuildReviewResult,
  BuildSpec,
  BuildSubtask,
  BuildWorkspace,
  CoderExecutor,
  CoderSessionResult,
  CommandRunner,
  QaLoopEntry,
  QaResult,
  TestRun
} from './types'
import { commitSubtask, defaultCoderExecutor } from './coder'
import { defaultCommandRunner, projectCommand, workspaceGit } from './workspace'

export interface QaReviewRequest {
  buildId: string
  workspace: BuildWorkspace
  spec: BuildSpec
  plan: BuildPlan
  acceptance: string[]
  tests: TestRun[]
  loop: number
}

export interface QaFixRequest extends QaReviewRequest {
  review: BuildReviewResult
}

export type QaReviewer = (request: QaReviewRequest) => Promise<BuildReviewResult>
export type QaFixer = (request: QaFixRequest) => Promise<CoderSessionResult>

export interface QaOptions {
  buildId: string
  workspace: BuildWorkspace
  spec: BuildSpec
  plan: BuildPlan
  testCommand?: string
  commandRunner?: CommandRunner
  reviewer?: QaReviewer
  fixer?: QaFixer
  maxLoops?: number
  qaRoot?: string
  onLoop?: (entry: QaLoopEntry) => void
  onLog?: (message: string) => void
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    verdict: { enum: ['pass', 'revise'] },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { message: { type: 'string' } },
        required: ['message']
      }
    }
  },
  required: ['verdict', 'issues']
}

function normalizeReview(value: unknown): BuildReviewResult {
  const record = typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const verdict = record.verdict === 'pass' ? 'pass' : 'revise'
  const issuesValue = Array.isArray(record.issues) ? record.issues : []
  const issues = issuesValue.flatMap((item) => {
    if (typeof item === 'string') return [{ message: item }]
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return []
    const issue = item as Record<string, unknown>
    const message = typeof issue.message === 'string'
      ? issue.message
      : typeof issue.detail === 'string' ? issue.detail : typeof issue.criterion === 'string' ? issue.criterion : 'Sol requested a revision.'
    return [{
      message,
      severity: issue.severity === 'low' || issue.severity === 'medium' || issue.severity === 'high' || issue.severity === 'critical' ? issue.severity : undefined,
      acceptance: typeof issue.acceptance === 'string' ? issue.acceptance : typeof issue.criterion === 'string' ? issue.criterion : undefined,
      file: typeof issue.file === 'string' ? issue.file : undefined,
      suggestion: typeof issue.suggestion === 'string' ? issue.suggestion : undefined
    }]
  })
  return { verdict, issues, summary: typeof record.summary === 'string' ? record.summary : undefined }
}

function acceptanceFor(spec: BuildSpec, plan: BuildPlan): string[] {
  return [...new Set([
    ...spec.acceptance,
    ...plan.acceptance,
    ...plan.phases.flatMap((phase) => phase.subtasks.flatMap((task) => task.acceptance))
  ])]
}

function reviewPrompt(request: QaReviewRequest): string {
  return [
    '<octa-build-qa>',
    `Build: ${request.buildId}`,
    'You are Sol, a read-only QA reviewer. Review the current worktree against every acceptance criterion below.',
    'Do not modify files. Return only JSON with verdict pass or revise, issues[], and an optional summary.',
    '</octa-build-qa>',
    '',
    '# Spec',
    JSON.stringify(request.spec, null, 2),
    '',
    '# Plan',
    JSON.stringify(request.plan, null, 2),
    '',
    '# Acceptance criteria',
    request.acceptance.map((item) => `- ${item}`).join('\n'),
    '',
    `# Project tests (QA loop ${request.loop})`,
    request.tests.length > 0 ? request.tests.map((test) => `${test.passed ? 'PASS' : 'FAIL'} ${test.command}\n${test.output.slice(-8_000)}`).join('\n\n') : 'No project test command was detected.',
    '',
    'Inspect the implementation, not just the test output. Identify the acceptance criterion and file for each issue.'
  ].join('\n')
}

async function defaultReviewer(request: QaReviewRequest): Promise<BuildReviewResult> {
  const executable = resolveCliBinary('codex')
  if (!executable) return { verdict: 'revise', issues: [{ message: 'Codex CLI was not found; QA could not run Sol.' }] }
  const schemaPath = join(request.workspace.metadataPath, 'qa-review.schema.json')
  mkdirSync(request.workspace.metadataPath, { recursive: true })
  writeFileSync(schemaPath, `${JSON.stringify(REVIEW_SCHEMA, null, 2)}\n`, 'utf8')
  const child = spawn(executable, buildCodexReviewArgv({ workspace: request.workspace.path, outputSchema: schemaPath }), {
    cwd: request.workspace.path,
    env: process.env,
    shell: false,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  })
  let stdout = ''
  let stderr = ''
  return new Promise<BuildReviewResult>((resolvePromise) => {
    let settled = false
    const finish = (value: BuildReviewResult): void => {
      if (settled) return
      settled = true
      resolvePromise(value)
    }
    child.stdout?.on('data', (chunk: Buffer | string) => { stdout += String(chunk) })
    child.stderr?.on('data', (chunk: Buffer | string) => { stderr += String(chunk) })
    child.once('error', (error) => finish({ verdict: 'revise', issues: [{ message: `${error.message}${stderr ? `\n${stderr}` : ''}` }] }))
    child.once('close', (code) => {
      const candidates = stdout.split(/\r?\n/).flatMap((line) => {
        if (!line.trim()) return []
        try { return [JSON.parse(line) as unknown] } catch { return [] }
      })
      let value: unknown = candidates.at(-1)
      const text = parseCodexJsonLines(stdout).filter((event) => event.type === 'text').map((event) => event.type === 'text' ? event.text : '').join('\n')
      if (!value && text) {
        try { value = JSON.parse(text) as unknown } catch { /* Sol may have returned prose; preserve the useful error below. */ }
      }
      if (value) finish(normalizeReview(value))
      else finish({ verdict: 'revise', issues: [{ message: code === 0 ? 'Sol did not return a structured QA result.' : stderr || `Sol exited with code ${code ?? 'unknown'}` }] })
    })
    child.stdin?.end(reviewPrompt(request), 'utf8')
  })
}

function fixerPrompt(request: QaFixRequest): string {
  return [
    '<octa-build-qa-fix>',
    `Build: ${request.buildId}`,
    'You are Luna fixing a failed Sol QA loop. Work in this worktree and address every issue below.',
    'Keep the original scope and acceptance criteria. Run the project tests after editing. Do not invoke Octa Code or Python.',
    '',
    '# Sol review',
    JSON.stringify(request.review, null, 2),
    '',
    '# Acceptance criteria',
    request.acceptance.map((item) => `- ${item}`).join('\n'),
    '',
    '# Test output',
    request.tests.map((test) => `${test.passed ? 'PASS' : 'FAIL'} ${test.command}\n${test.output}`).join('\n\n') || 'No test command was detected.'
  ].join('\n')
}

async function defaultFixer(request: QaFixRequest): Promise<CoderSessionResult> {
  const subtask: BuildSubtask = {
    id: `qa-fix-${request.loop}`,
    description: `QA fix loop ${request.loop}`,
    status: 'in_progress',
    dependencies: [],
    filesTouched: [],
    acceptance: request.acceptance,
    verificationCommands: request.tests.map((test) => test.command)
  }
  return defaultCoderExecutor({
    buildId: request.buildId,
    workspace: request.workspace,
    subtask,
    contextPack: {
      spec: JSON.stringify(request.spec, null, 2),
      plan: JSON.stringify(request.plan, null, 2),
      subtask: JSON.stringify(subtask, null, 2),
      recentSessions: [],
      filesTouchedSoFar: [],
      diffSummary: JSON.stringify(request.review, null, 2)
    },
    prompt: fixerPrompt(request),
    argv: buildCodexExecArgv({ workspace: request.workspace.path, outputSchema: join(request.workspace.metadataPath, 'coder-result.schema.json') })
  })
}

async function runTests(command: string | undefined, cwd: string, runner: CommandRunner): Promise<TestRun[]> {
  if (!command?.trim()) return []
  const started = Date.now()
  try {
    const result = await projectCommand(command, cwd, runner)
    return [{
      command,
      passed: result?.code === 0,
      output: `${result?.stdout ?? ''}${result?.stderr ? `\n${result.stderr}` : ''}`.trim(),
      durationMs: Date.now() - started
    }]
  } catch (error) {
    return [{ command, passed: false, output: error instanceof Error ? error.message : String(error), durationMs: Date.now() - started }]
  }
}

export async function runQa(options: QaOptions): Promise<QaResult> {
  const runner = options.commandRunner ?? defaultCommandRunner
  const reviewer = options.reviewer ?? defaultReviewer
  const fixer = options.fixer ?? defaultFixer
  const maxLoops = Math.max(1, Math.min(3, Math.trunc(options.maxLoops ?? 3)))
  const acceptance = acceptanceFor(options.spec, options.plan)
  const history: QaLoopEntry[] = []
  const qaRoot = options.qaRoot ?? join(options.workspace.metadataPath, 'qa')
  mkdirSync(qaRoot, { recursive: true })
  let finalReview: BuildReviewResult | undefined
  let finalTests: TestRun[] = []
  for (let loop = 1; loop <= maxLoops; loop += 1) {
    finalTests = await runTests(options.testCommand ?? options.workspace.project.testCommand ?? options.workspace.project.buildCommand, options.workspace.path, runner)
    const review = await reviewer({
      buildId: options.buildId,
      workspace: options.workspace,
      spec: options.spec,
      plan: options.plan,
      acceptance,
      tests: finalTests,
      loop
    })
    finalReview = review
    const testsPass = finalTests.every((test) => test.passed || test.skipped)
    const entry: QaLoopEntry = { loop, review, tests: finalTests, timestamp: new Date().toISOString() }
    if (review.verdict === 'pass' && testsPass) {
      history.push(entry)
      writeFileSync(join(qaRoot, `loop-${loop}.json`), `${JSON.stringify(entry, null, 2)}\n`, 'utf8')
      options.onLoop?.(entry)
      return { passed: true, loops: loop, maxLoops, history, finalReview, finalTests }
    }
    if (loop < maxLoops) {
      const fixerRun = await fixer({
        buildId: options.buildId,
        workspace: options.workspace,
        spec: options.spec,
        plan: options.plan,
        acceptance,
        tests: finalTests,
        loop,
        review
      })
      entry.fixerRun = fixerRun
      if (fixerRun.status === 'completed') {
        try {
          await commitSubtask(options.workspace, options.buildId, `QA fix loop ${loop}`, runner)
        } catch (error) {
          options.onLog?.(`QA fix loop ${loop} could not commit: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }
    history.push(entry)
    writeFileSync(join(qaRoot, `loop-${loop}.json`), `${JSON.stringify(entry, null, 2)}\n`, 'utf8')
    options.onLoop?.(entry)
    options.onLog?.(`QA loop ${loop}: ${review.verdict}`)
  }
  return {
    passed: false,
    loops: history.length,
    maxLoops,
    history,
    finalReview,
    finalTests,
    error: 'QA did not pass within the three-loop cap.'
  }
}
