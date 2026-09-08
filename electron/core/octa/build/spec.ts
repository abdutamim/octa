import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { PlannerResult } from '../planner'
import { getPlanner } from '../planner'
import type {
  BuildComplexity,
  BuildPhase,
  BuildPhaseType,
  BuildPlan,
  BuildPlannerOptions,
  BuildSpec,
  BuildSubtask,
  BuildSubtaskStatus
} from './types'

export interface BuildSpecResult {
  spec: BuildSpec
  plan: BuildPlan
  specPath: string
  planPath: string
  debatePath: string
  plannerResult?: PlannerResult
}

interface RawRecord {
  [key: string]: unknown
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
}

function asRecords(value: unknown): RawRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function valueAt(record: RawRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key]
  }
  return undefined
}

function safeId(value: string): string {
  const cleaned = value.toLocaleLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return cleaned || 'build'
}

export function assessComplexity(request: string, explicit?: BuildComplexity): BuildComplexity {
  if (explicit) return explicit
  const text = request.toLocaleLowerCase()
  const largeSignals = [
    'platform', 'migration', 'multi-service', 'multiple services', 'authentication', 'integration',
    'dashboard', 'marketplace', 'workflow', 'عدة صفحات', 'نظام', 'منصة'
  ]
  const mediumSignals = [
    'page', 'pages', 'api', 'database', 'component', 'feature', 'tool', 'site',
    'صفحة', 'أداة', 'موقع'
  ]
  if (largeSignals.some((signal) => text.includes(signal)) || request.length > 450) return 'large'
  if (mediumSignals.some((signal) => text.includes(signal)) || request.length > 120) return 'medium'
  return 'small'
}

export function phaseCountForComplexity(complexity: BuildComplexity): number {
  if (complexity === 'large') return 4
  if (complexity === 'medium') return 2
  return 1
}

function phaseType(number: number, count: number): BuildPhaseType {
  if (count === 1) return 'implementation'
  if (number === 1) return 'setup'
  if (number === count) return 'integration'
  return 'implementation'
}

function phaseName(number: number, count: number): string {
  if (count === 1) return 'Implementation'
  if (number === 1) return 'Setup and foundations'
  if (number === count) return 'Integration and verification'
  return number === 2 ? 'Core implementation' : 'Hardening and integration'
}

function rawPlannerResult(value: unknown): { plan?: RawRecord; result?: PlannerResult } {
  if (!isRecord(value)) return {}
  if (isRecord(value.plan)) return { plan: value.plan, result: value as unknown as PlannerResult }
  if (isRecord(value.plan_json)) return { plan: value.plan_json }
  if (isRecord(value.output)) return rawPlannerResult(value.output)
  return { plan: value }
}

function plannerSteps(plan: RawRecord): RawRecord[] {
  return asRecords(valueAt(plan, 'steps', 'subtasks', 'tasks'))
}

function subtaskId(raw: RawRecord, index: number): string {
  return safeId(asString(valueAt(raw, 'id', 'step_id', 'subtask_id'), `subtask-${index + 1}`))
}

function subtaskFiles(raw: RawRecord): string[] {
  const input = isRecord(raw.input) ? raw.input : {}
  return [...new Set([
    ...asStrings(valueAt(raw, 'filesTouched', 'files_touched', 'files_to_touch', 'files')),
    ...asStrings(valueAt(raw, 'files_to_modify', 'filesToModify')),
    ...asStrings(valueAt(raw, 'files_to_create', 'filesToCreate')),
    ...asStrings(valueAt(input, 'filesTouched', 'files_touched', 'files_to_touch', 'files')),
    ...asStrings(valueAt(input, 'files_to_modify', 'filesToModify')),
    ...asStrings(valueAt(input, 'files_to_create', 'filesToCreate'))
  ])]
}

function subtaskAcceptance(raw: RawRecord, rootAcceptance: string[]): string[] {
  const input = isRecord(raw.input) ? raw.input : {}
  const values = [
    ...asStrings(valueAt(raw, 'acceptance', 'acceptance_criteria', 'success_criteria')),
    ...asStrings(valueAt(input, 'acceptance', 'acceptance_criteria', 'success_criteria'))
  ]
  return values.length > 0 ? [...new Set(values)] : rootAcceptance.slice(0, 3)
}

function subtaskVerification(raw: RawRecord, fallback: string[]): string[] {
  const input = isRecord(raw.input) ? raw.input : {}
  const direct = [
    ...asStrings(valueAt(raw, 'verificationCommands', 'verification_commands', 'commands')),
    ...asStrings(valueAt(input, 'verificationCommands', 'verification_commands', 'commands'))
  ]
  const verification = asRecords(valueAt(raw, 'verification'))
  const verificationInput = asRecords(valueAt(input, 'verification'))
  for (const item of [...verification, ...verificationInput]) {
    const command = asString(valueAt(item, 'command', 'cmd'))
    if (command) direct.push(command)
  }
  return [...new Set(direct.length > 0 ? direct : fallback)]
}

function dependencyIds(raw: RawRecord): string[] {
  const input = isRecord(raw.input) ? raw.input : {}
  return [...new Set([
    ...asStrings(valueAt(raw, 'dependencies', 'dependsOn', 'depends_on', 'needs')),
    ...asStrings(valueAt(input, 'dependencies', 'dependsOn', 'depends_on', 'needs'))
  ].map(safeId))]
}

function normalizeSubtask(
  raw: RawRecord,
  index: number,
  phaseId: string,
  phaseNumber: number,
  rootAcceptance: string[],
  verification: string[]
): BuildSubtask {
  const id = subtaskId(raw, index)
  const input = isRecord(raw.input) ? raw.input : {}
  const filesTouched = subtaskFiles(raw)
  const statusValue = asString(valueAt(raw, 'status')).toLocaleLowerCase()
  const status: BuildSubtaskStatus = statusValue === 'completed' || statusValue === 'in_progress' || statusValue === 'failed' || statusValue === 'blocked' || statusValue === 'stuck'
    ? statusValue
    : 'pending'
  const description = asString(valueAt(raw, 'description', 'title', 'prompt'), asString(raw.prompt, `Implement subtask ${index + 1}`))
  return {
    id,
    description,
    status,
    phaseId,
    phase: phaseNumber,
    dependencies: dependencyIds(raw),
    needs: dependencyIds(raw),
    filesTouched,
    files_to_modify: asStrings(valueAt(raw, 'files_to_modify', 'filesToModify', 'filesTouched')),
    files_to_create: asStrings(valueAt(raw, 'files_to_create', 'filesToCreate')),
    acceptance: subtaskAcceptance(raw, rootAcceptance),
    verificationCommands: subtaskVerification(raw, verification),
    verification: subtaskVerification(raw, verification).map((command) => ({ type: 'command' as const, command })),
    expectedOutput: asString(valueAt(raw, 'expectedOutput', 'expected_output')) || undefined,
    sessionId: asString(valueAt(raw, 'sessionId', 'session_id')) || undefined,
    commitHash: asString(valueAt(raw, 'commitHash', 'commit_hash')) || undefined
  }
}

function distribute<T>(items: T[], count: number): T[][] {
  const buckets: T[][] = Array.from({ length: count }, () => [])
  items.forEach((item, index) => {
    const bucket = Math.min(count - 1, Math.floor((index * count) / Math.max(1, items.length)))
    buckets[bucket].push(item)
  })
  return buckets
}

function normalizePhase(raw: RawRecord, number: number, count: number, rootAcceptance: string[], verification: string[], allSteps: RawRecord[]): BuildPhase {
  const id = safeId(asString(valueAt(raw, 'id', 'phase_id'), `phase-${number}`))
  const rawSubtasks = asRecords(valueAt(raw, 'subtasks', 'steps', 'tasks'))
  const subtasks = rawSubtasks.map((item, index) => normalizeSubtask(item, index, id, number, rootAcceptance, verification))
  if (subtasks.length === 0 && number === 1 && allSteps.length > 0) {
    subtasks.push(...allSteps.map((item, index) => normalizeSubtask(item, index, id, number, rootAcceptance, verification)))
  }
  const dependsOn = [...new Set(asStrings(valueAt(raw, 'dependsOn', 'depends_on', 'dependencies')).map(safeId))]
  return {
    id,
    phase: number,
    name: asString(valueAt(raw, 'name', 'title'), phaseName(number, count)),
    type: (asString(valueAt(raw, 'type'), phaseType(number, count)) as BuildPhaseType),
    dependsOn,
    depends_on: dependsOn,
    parallelSafe: valueAt(raw, 'parallelSafe', 'parallel_safe') !== false,
    subtasks
  }
}

function normalizePlan(rawPlan: RawRecord, buildId: string, request: string, explicitComplexity?: BuildComplexity): BuildPlan {
  const summary = asString(valueAt(rawPlan, 'summary', 'overview'), request)
  const acceptance = [...new Set([
    ...asStrings(valueAt(rawPlan, 'acceptance', 'finalAcceptance', 'final_acceptance', 'success_criteria')),
    ...asStrings(valueAt(rawPlan, 'acceptance_criteria'))
  ])]
  const complexityValue = asString(valueAt(rawPlan, 'complexity')).toLocaleLowerCase()
  const complexity: BuildComplexity = explicitComplexity ?? (complexityValue === 'small' || complexityValue === 'medium' || complexityValue === 'large'
    ? complexityValue
    : assessComplexity(request))
  const count = phaseCountForComplexity(complexity)
  const rawPhases = asRecords(valueAt(rawPlan, 'phases'))
  const rawSteps = plannerSteps(rawPlan)
  const phaseSteps = rawPhases.flatMap((phase) => asRecords(valueAt(phase, 'subtasks', 'steps', 'tasks')))
  const sourceSteps = rawSteps.length > 0 ? rawSteps : phaseSteps
  const verification = [...new Set(asStrings(valueAt(rawPlan, 'verificationCommands', 'verification_commands', 'verification')))]
  const effectiveVerification = verification.length > 0 ? verification : ['npm test']
  const effectiveAcceptance = acceptance.length > 0 ? acceptance : ['The requested change is implemented and verified.']
  let phases: BuildPhase[]
  const useRawPhases = rawPhases.length === count && (phaseSteps.length > 0 || rawSteps.length === 0)
  if (useRawPhases) {
    phases = rawPhases.map((phase, index) => normalizePhase(phase, index + 1, rawPhases.length, effectiveAcceptance, effectiveVerification, []))
  } else {
    // Complexity is the source of truth for the number of phases. If a
    // planner returns a different phase shape, retain its subtasks but
    // redistribute them into the selected complexity buckets.
    const buckets = distribute(sourceSteps, count)
    phases = buckets.map((bucket, index) => {
      const id = `phase-${index + 1}`
      const sourcePhase = rawPhases[index] ?? {}
      const phase: RawRecord = { ...sourcePhase, id, name: phaseName(index + 1, count), type: phaseType(index + 1, count), subtasks: bucket }
      return normalizePhase(phase, index + 1, count, effectiveAcceptance, effectiveVerification, [])
    })
  }
  if (rawSteps.length === 0 && phases.every((phase) => phase.subtasks.length === 0)) {
    const first = phases[0] ?? normalizePhase({}, 1, 1, effectiveAcceptance, effectiveVerification, [])
    first.subtasks.push(normalizeSubtask({ id: 'implement-request', description: request }, 0, first.id, first.phase, effectiveAcceptance, effectiveVerification))
    phases = [first, ...phases.slice(1)]
  }
  // Normalize IDs and dependencies once more so plans from either the old
  // phase model or the current planner have one deterministic execution graph.
  const phaseIds = new Set(phases.map((phase) => phase.id))
  phases.forEach((phase, phaseIndex) => {
    if (phaseIndex > 0 && phase.dependsOn.length === 0) phase.dependsOn = [phases[phaseIndex - 1].id]
    phase.depends_on = phase.dependsOn
    for (const task of phase.subtasks) {
      task.phaseId = phase.id
      task.phase = phase.phase
      task.dependencies = [...new Set((task.dependencies ?? []).filter((dependency) => dependency !== task.id))]
      task.needs = task.dependencies
    }
    phase.dependsOn = phase.dependsOn.filter((dependency) => phaseIds.has(dependency))
    phase.depends_on = phase.dependsOn
  })
  return {
    planId: asString(valueAt(rawPlan, 'planId', 'plan_id'), buildId),
    feature: asString(valueAt(rawPlan, 'feature', 'title'), request),
    summary,
    complexity,
    workflowType: asString(valueAt(rawPlan, 'workflowType', 'workflow', 'workflow_type'), 'custom'),
    phases,
    acceptance: effectiveAcceptance,
    finalAcceptance: effectiveAcceptance,
    assumptions: asStrings(valueAt(rawPlan, 'assumptions')),
    questions: asStrings(valueAt(rawPlan, 'questions', 'openQuestions', 'open_questions')),
    deliverables: asStrings(valueAt(rawPlan, 'deliverables')),
    estimatedMinutes: typeof valueAt(rawPlan, 'estimatedMinutes', 'estimated_minutes') === 'number'
      ? valueAt(rawPlan, 'estimatedMinutes', 'estimated_minutes') as number
      : undefined,
    sourcePlannerPlan: rawPlan
  }
}

export function normalizeBuildPlan(value: unknown, options: { buildId: string; request: string; complexity?: BuildComplexity } = { buildId: 'build', request: '' }): BuildPlan {
  const raw = rawPlannerResult(value).plan ?? {}
  return normalizePlan(raw, options.buildId, options.request, options.complexity)
}

function allSubtasks(plan: BuildPlan): BuildSubtask[] {
  return plan.phases.flatMap((phase) => phase.subtasks)
}

function phaseForSubtask(plan: BuildPlan, task: BuildSubtask): BuildPhase | undefined {
  return plan.phases.find((phase) => phase.id === task.phaseId || phase.subtasks.some((item) => item.id === task.id))
}

/** Stable topological ordering used by the coder and exposed for tests/UI. */
export function dependencyOrder(plan: BuildPlan): BuildSubtask[] {
  const tasks = allSubtasks(plan)
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const edges = new Map<string, Set<string>>()
  const indegree = new Map<string, number>(tasks.map((task) => [task.id, 0]))
  const addEdge = (from: string, to: string): void => {
    if (!byId.has(from) || !byId.has(to) || from === to) return
    const targets = edges.get(from) ?? new Set<string>()
    if (targets.has(to)) return
    targets.add(to)
    edges.set(from, targets)
    indegree.set(to, (indegree.get(to) ?? 0) + 1)
  }
  for (const task of tasks) {
    for (const dependency of [...(task.dependencies ?? []), ...(task.needs ?? [])]) {
      const dependencyTask = byId.get(safeId(dependency))
      if (dependencyTask) addEdge(dependencyTask.id, task.id)
    }
    const phase = phaseForSubtask(plan, task)
    for (const dependencyPhaseId of phase?.dependsOn ?? []) {
      const dependencyPhase = plan.phases.find((item) => item.id === dependencyPhaseId)
      for (const dependencyTask of dependencyPhase?.subtasks ?? []) addEdge(dependencyTask.id, task.id)
    }
  }
  const ready = tasks.filter((task) => (indegree.get(task.id) ?? 0) === 0).map((task) => task.id)
  const ordered: BuildSubtask[] = []
  while (ready.length > 0) {
    const id = ready.shift()!
    const task = byId.get(id)
    if (!task) continue
    ordered.push(task)
    for (const target of edges.get(id) ?? []) {
      const next = (indegree.get(target) ?? 0) - 1
      indegree.set(target, next)
      if (next === 0) ready.push(target)
    }
  }
  if (ordered.length !== tasks.length) throw new Error('Build plan contains a dependency cycle.')
  return ordered
}

export function readySubtasks(plan: BuildPlan): BuildSubtask[] {
  const ordered = dependencyOrder(plan)
  const completed = new Set(allSubtasks(plan).filter((task) => task.status === 'completed').map((task) => task.id))
  return ordered.filter((task) => {
    if (task.status !== 'pending' && task.status !== 'failed' && task.status !== 'in_progress') return false
    const dependencies = new Set([...(task.dependencies ?? []), ...(task.needs ?? [])].map(safeId))
    if ([...dependencies].some((dependency) => !completed.has(dependency))) return false
    const phase = phaseForSubtask(plan, task)
    return (phase?.dependsOn ?? []).every((phaseId) => {
      const dependencyPhase = plan.phases.find((item) => item.id === phaseId)
      return (dependencyPhase?.subtasks ?? []).every((item) => completed.has(item.id))
    })
  })
}

function markdownList(items: string[], fallback: string): string {
  return (items.length > 0 ? items : [fallback]).map((item) => `- ${item}`).join('\n')
}

export function renderBuildSpecMarkdown(spec: BuildSpec, plan: BuildPlan): string {
  const phaseSections = plan.phases.map((phase) => {
    const tasks = phase.subtasks.map((task) => {
      const dependencies = task.dependencies.length > 0 ? task.dependencies.join(', ') : 'none'
      return [
        `### ${task.id}: ${task.description}`,
        `- Dependencies: ${dependencies}`,
        `- Files: ${task.filesTouched.length > 0 ? task.filesTouched.join(', ') : 'to be determined during implementation'}`,
        '- Acceptance:',
        markdownList(task.acceptance, 'The subtask is complete.'),
        '- Verification:',
        markdownList(task.verificationCommands, 'Run the project test command.')
      ].join('\n')
    }).join('\n\n')
    return [`## Phase ${phase.phase}: ${phase.name}`, `Type: ${phase.type}`, `Depends on: ${phase.dependsOn.join(', ') || 'none'}`, '', tasks].join('\n')
  }).join('\n\n')
  return [
    `# ${spec.title}`,
    '',
    `- Build ID: ${spec.buildId}`,
    `- Complexity: ${spec.complexity}`,
    `- Workflow: ${spec.workflowType}`,
    `- Language: ${spec.language}`,
    '',
    '## Overview',
    '',
    spec.overview,
    '',
    '## Objective',
    '',
    spec.objective,
    '',
    '## Requirements',
    '',
    markdownList(spec.requirements, 'Implement the requested build.'),
    '',
    '## Files touched',
    '',
    markdownList(spec.filesTouched, 'The coder must identify files before editing.'),
    '',
    '## Acceptance criteria',
    '',
    markdownList(spec.acceptance, 'The requested result works in the detected project.'),
    '',
    '## Verification commands',
    '',
    markdownList(spec.verificationCommands, 'Run the project test command.'),
    '',
    '## Assumptions and open questions',
    '',
    markdownList([...spec.assumptions, ...spec.openQuestions], 'No unresolved questions were supplied.'),
    '',
    '## Implementation plan',
    '',
    phaseSections,
    ''
  ].join('\n')
}

function flattenPlanFiles(plan: BuildPlan): string[] {
  return [...new Set(plan.phases.flatMap((phase) => phase.subtasks.flatMap((task) => task.filesTouched)))]
}

function plannerInput(request: string, options: BuildPlannerOptions): string {
  const projectHint = options.projectPath ? `\n\nProject root to inspect: ${resolve(options.projectPath)}` : ''
  return `Native Octa build request:\n\n${request.trim()}${projectHint}\n\nReturn an implementation plan suitable for one Luna codex-exec session per subtask. Use concrete files, dependencies, acceptance criteria, and verification commands. This build is isolated by Git worktree and must never invoke Octa Code or Python.`
}

function requestText(input: BuildPlannerOptions['request']): string {
  if (typeof input === 'string') return input.trim()
  const inputText = input.input ? JSON.stringify(input.input, null, 2) : ''
  return [input.prompt, inputText, ...input.acceptance.map((item) => `Acceptance: ${item}`)]
    .filter((item): item is string => Boolean(item?.trim()))
    .join('\n\n')
    .trim() || `Implement plan step ${input.id}`
}

function plannerOutput(value: unknown): PlannerResult | undefined {
  return isRecord(value) && isRecord(value.plan) && typeof value.planId === 'string'
    ? value as unknown as PlannerResult
    : undefined
}

function fallbackPlannerPlan(request: string, complexity: BuildComplexity): RawRecord {
  return {
    plan_id: 'fallback',
    language: /[\u0600-\u06ff]/.test(request) ? 'ar-EG' : 'en',
    feature: request,
    summary: request,
    workflow: 'custom',
    assumptions: ['The requested files and project conventions will be confirmed by Luna in the worktree.'],
    questions: [],
    complexity,
    acceptance: ['The requested outcome is implemented.', 'The project verification command passes.'],
    steps: [{
      id: 'implement-request',
      description: request,
      runner: 'codex-exec',
      prompt: request,
      needs: [],
      gate: 'none',
      autonomy: 'auto',
      acceptance: ['The requested outcome is implemented.', 'The project verification command passes.'],
      input: { files_to_touch: [], verification_commands: ['npm test'] }
    }]
  }
}

export async function writeBuildSpec(options: BuildPlannerOptions): Promise<BuildSpecResult> {
  const request = requestText(options.request)
  if (!request) throw new Error('A build request is required.')
  const buildId = safeId(options.buildId)
  const outputDir = resolve(options.outputDir ?? join(options.homePath ?? 'C:\\Octa', 'builds', buildId))
  mkdirSync(outputDir, { recursive: true })
  const planner = options.planner ?? getPlanner()
  let result: unknown
  let plannerError = ''
  try {
    result = await planner.plan(plannerInput(request, options), {
      profile: 'spec',
      homePath: options.homePath,
      language: options.language,
      maxDebateRounds: 4
    })
  } catch (error) {
    plannerError = error instanceof Error ? error.message : String(error)
    result = fallbackPlannerPlan(request, assessComplexity(request, options.complexity))
  }
  const normalized = normalizeBuildPlan(result, { buildId, request, complexity: options.complexity })
  const plan: BuildPlan = { ...normalized, planId: buildId }
  const plannerResult = plannerOutput(result)
  const spec: BuildSpec = {
    buildId,
    title: plan.feature || request,
    overview: plan.summary || request,
    objective: request,
    complexity: plan.complexity,
    workflowType: plan.workflowType,
    requirements: [request, ...plan.deliverables].filter((item, index, items) => items.indexOf(item) === index),
    acceptance: plan.acceptance,
    filesTouched: flattenPlanFiles(plan),
    verificationCommands: [...new Set(plan.phases.flatMap((phase) => phase.subtasks.flatMap((task) => task.verificationCommands)))],
    assumptions: plan.assumptions,
    openQuestions: plan.questions,
    language: options.language ?? 'mixed'
  }
  const specPath = join(outputDir, 'spec.md')
  const planPath = join(outputDir, 'plan.json')
  const debatePath = join(outputDir, 'debate.md')
  writeFileSync(specPath, renderBuildSpecMarkdown(spec, plan), 'utf8')
  writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8')
  const debate = plannerResult?.debateMarkdown ?? (isRecord(result) && typeof result.debateMarkdown === 'string' ? result.debateMarkdown : '')
  writeFileSync(debatePath, debate || `# Fable / Astra build debate\n\nThe configured planner was unavailable, so Octa wrote a deterministic native fallback plan for Luna.\n\nPlanner error: ${plannerError || 'No transcript was returned.'}\n`, 'utf8')
  return { spec, plan, specPath, planPath, debatePath, plannerResult }
}

export async function specFromPlanStep(step: BuildPlannerOptions['request'], options: Omit<BuildPlannerOptions, 'request'>): Promise<BuildSpecResult> {
  return writeBuildSpec({ ...options, request: step })
}

export function loadBuildPlan(path: string): BuildPlan {
  if (!existsSync(path)) throw new Error(`Build plan was not found: ${path}`)
  const value: unknown = JSON.parse(readFileSync(path, 'utf8'))
  return normalizeBuildPlan(value, { buildId: 'build', request: 'Loaded build plan' })
}
