import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Planner } from '../planner'
import type { ResearchManager } from '../research'
import type { SkillRegistry } from '../../skills/registry'
import type {
  BuildComplexity,
  BuildEvent,
  BuildPlan,
  BuildSpec,
  BuildState,
  BuildStatus,
  BuildSubtask,
  BuildWorkspace,
  CoderExecutor,
  CommandRunner,
  QaResult,
  RegistrationResult
} from './types'
import { runAnalysis, type AnalysisOptions, type AnalysisResult } from './analysis'
import { runCoder } from './coder'
import { discardBuild, mergeBuild, reviewBuild, type ConflictResolver, type MergeResult } from './merge'
import { runQa, type QaFixer, type QaReviewer } from './qa'
import { RecoveryManager } from './recovery'
import { registerBuiltOutput, type SkillCreator } from './register'
import { renderBuildSpecMarkdown, writeBuildSpec } from './spec'
import { createWorkspace, defaultCommandRunner } from './workspace'
import type { BuildPlannerOptions } from './types'

export interface BuildStartRequest {
  id?: string
  request?: string
  brief?: string
  projectPath?: string
  mode?: 'isolated' | 'direct'
  direct?: boolean
  targetBranch?: string
  complexity?: BuildComplexity
  language?: 'ar-EG' | 'en' | 'mixed'
  register?: boolean
  registrationKind?: 'skill' | 'project'
}

export interface BuildManagerOptions {
  homePath?: string
  projectPath?: string
  skillsLibraryPath?: string
  knowledgePath?: string
  planner?: Planner | BuildPlannerOptions['planner']
  research?: ResearchManager
  registry?: SkillRegistry
  commandRunner?: CommandRunner
  coderExecutor?: CoderExecutor
  qaReviewer?: QaReviewer
  qaFixer?: QaFixer
  conflictResolver?: ConflictResolver
  skillCreator?: SkillCreator
  onEvent?: (event: BuildEvent) => void
}

export interface BuildStartResponse {
  id: string
  status: BuildStatus
  workspacePath: string
  branch: string
  specPath: string
  planPath: string
}

function safeId(value: string): string {
  const result = value.toLocaleLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return result.slice(0, 96) || `build-${Date.now()}`
}

function requestText(request: BuildStartRequest): string {
  return (request.request ?? request.brief ?? '').trim()
}

function now(): string {
  return new Date().toISOString()
}

function statePath(buildRoot: string): string {
  return join(buildRoot, '.octa-build', 'build.json')
}

function writeState(state: BuildState): void {
  mkdirSync(join(state.buildRoot, '.octa-build'), { recursive: true })
  writeFileSync(statePath(state.buildRoot), `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

function readState(path: string): BuildState | undefined {
  if (!existsSync(path)) return undefined
  try {
    const value: unknown = JSON.parse(readFileSync(path, 'utf8'))
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as BuildState : undefined
  } catch {
    return undefined
  }
}

function allSubtasks(plan: BuildPlan): BuildSubtask[] {
  return plan.phases.flatMap((phase) => phase.subtasks)
}

function applyProjectVerification(plan: BuildPlan, command: string | undefined): void {
  if (!command?.trim()) return
  for (const task of allSubtasks(plan)) {
    task.verificationCommands = [...new Set(task.verificationCommands.filter((item) => item !== 'npm test').concat(command))]
    task.verification = task.verificationCommands.map((item) => ({ type: 'command' as const, command: item }))
  }
}

function applyProjectVerificationToSpec(spec: BuildSpec, command: string | undefined): void {
  if (!command?.trim()) return
  spec.verificationCommands = [...new Set(spec.verificationCommands.filter((item) => item !== 'npm test').concat(command))]
}

function plannerAdapter(planner: BuildManagerOptions['planner']): BuildPlannerOptions['planner'] | undefined {
  if (!planner) return undefined
  const candidate = planner as Planner & NonNullable<BuildPlannerOptions['planner']>
  return {
    plan: (input, options) => candidate.plan(input, options)
  }
}

export class BuildManager {
  private readonly homePath: string
  private readonly defaultProjectPath: string
  private readonly skillsLibraryPath?: string
  private readonly knowledgePath?: string
  private readonly options: BuildManagerOptions
  private readonly runner: CommandRunner
  private readonly active = new Map<string, Promise<BuildState>>()

  constructor(options: BuildManagerOptions = {}) {
    this.options = options
    this.homePath = resolve(options.homePath ?? 'C:\\Octa')
    this.defaultProjectPath = resolve(options.projectPath ?? process.cwd())
    this.skillsLibraryPath = options.skillsLibraryPath ?? options.registry?.libraryPath
    this.knowledgePath = options.knowledgePath
    this.runner = options.commandRunner ?? defaultCommandRunner
  }

  private emit(event: Omit<BuildEvent, 'timestamp'>): void {
    this.options.onEvent?.({ ...event, timestamp: now() })
  }

  private save(state: BuildState): void {
    state.updatedAt = now()
    writeState(state)
  }

  private load(id: string): BuildState {
    const safe = safeId(id)
    const root = join(this.homePath, 'builds', safe)
    const state = readState(statePath(root))
    if (!state) throw new Error(`Build "${safe}" was not found.`)
    return state
  }

  async start(request: BuildStartRequest): Promise<BuildStartResponse> {
    const text = requestText(request)
    if (!text) throw new Error('A build request is required.')
    const id = safeId(request.id ?? `${text.slice(0, 42)}-${randomUUID().slice(0, 8)}`)
    const workspace = await createWorkspace({
      id,
      octaHome: this.homePath,
      projectPath: request.projectPath ?? this.defaultProjectPath,
      mode: request.mode,
      direct: request.direct,
      targetBranch: request.targetBranch,
      commandRunner: this.runner
    })
    this.emit({ type: 'build:status', buildId: id, status: 'planning', message: 'Creating the Fable/Astra native build specification.' })
    const specResult = await writeBuildSpec({
      buildId: id,
      request: text,
      projectPath: workspace.projectPath,
      outputDir: workspace.buildRoot,
      homePath: this.homePath,
      complexity: request.complexity,
      language: request.language,
      planner: plannerAdapter(this.options.planner)
    })
    const projectVerification = workspace.project.testCommand ?? workspace.project.buildCommand
    applyProjectVerification(specResult.plan, projectVerification)
    applyProjectVerificationToSpec(specResult.spec, projectVerification)
    writeFileSync(specResult.specPath, renderBuildSpecMarkdown(specResult.spec, specResult.plan), 'utf8')
    writeFileSync(specResult.planPath, `${JSON.stringify(specResult.plan, null, 2)}\n`, 'utf8')
    const state: BuildState = {
      id,
      request: text,
      status: 'ready',
      mode: workspace.mode,
      projectPath: workspace.projectPath,
      workspacePath: workspace.path,
      buildRoot: workspace.buildRoot,
      branch: workspace.branch,
      targetBranch: workspace.targetBranch,
      specPath: specResult.specPath,
      planPath: specResult.planPath,
      spec: specResult.spec,
      plan: specResult.plan,
      workspace,
      register: request.register,
      registrationKind: request.registrationKind,
      createdAt: now(),
      updatedAt: now()
    }
    this.save(state)
    this.emit({ type: 'build:status', buildId: id, status: 'ready', payload: state })
    const execution = this.execute(state)
    this.active.set(id, execution)
    void execution.finally(() => this.active.delete(id))
    return { id, status: state.status, workspacePath: state.workspacePath, branch: state.branch, specPath: state.specPath, planPath: state.planPath }
  }

  private async execute(state: BuildState): Promise<BuildState> {
    try {
      state.status = 'coding'
      this.save(state)
      this.emit({ type: 'build:status', buildId: state.id, status: state.status })
      const coder = await runCoder({
        buildId: state.id,
        workspace: state.workspace,
        plan: state.plan,
        spec: state.spec,
        specPath: state.specPath,
        planPath: state.planPath,
        commandRunner: this.runner,
        executor: this.options.coderExecutor,
        onCommit: (subtask, hash) => {
          try { new RecoveryManager({ workspace: state.workspace, plan: state.plan, commandRunner: this.runner }).recordGoodCommit(hash, subtask.id, subtask.description) } catch { /* state persistence is best effort during a running build */ }
        },
        savePlan: (plan) => { state.plan = plan; this.save(state) },
        onSubtask: (subtask) => {
          state.currentPhase = subtask.phaseId
          state.currentSubtask = subtask.id
          this.save(state)
          this.emit({ type: 'build:subtask', buildId: state.id, phaseId: subtask.phaseId, subtaskId: subtask.id, payload: subtask })
        },
        onLog: (message) => this.emit({ type: 'build:log', buildId: state.id, message })
      })
      state.plan = coder.plan
      if (coder.failed) {
        state.status = coder.failed.status === 'stuck' ? 'stuck' : 'failed'
        state.error = coder.failed.error ?? 'A build subtask failed.'
        this.save(state)
        this.emit({ type: 'build:error', buildId: state.id, status: state.status, subtaskId: coder.failed.id, message: state.error })
        return state
      }
      state.status = 'qa'
      this.save(state)
      this.emit({ type: 'build:status', buildId: state.id, status: state.status })
      const qa = await runQa({
        buildId: state.id,
        workspace: state.workspace,
        spec: state.spec,
        plan: state.plan,
        testCommand: state.workspace.project.testCommand ?? state.workspace.project.buildCommand,
        commandRunner: this.runner,
        reviewer: this.options.qaReviewer,
        fixer: this.options.qaFixer,
        onLoop: (entry) => {
          const partial: QaResult = { passed: false, loops: entry.loop, maxLoops: 3, history: [entry], finalTests: entry.tests, finalReview: entry.review }
          state.qa = state.qa ? { ...state.qa, history: [...state.qa.history, entry], loops: entry.loop, finalTests: entry.tests, finalReview: entry.review } : partial
          this.save(state)
          this.emit({ type: 'build:qa', buildId: state.id, payload: entry })
        },
        onLog: (message) => this.emit({ type: 'build:log', buildId: state.id, message })
      })
      state.qa = qa
      if (!qa.passed) {
        state.status = 'failed'
        state.error = qa.error ?? 'QA did not pass.'
        this.save(state)
        this.emit({ type: 'build:error', buildId: state.id, status: state.status, message: state.error, payload: qa })
        return state
      }
      state.status = 'ready_to_merge'
      this.save(state)
      this.emit({ type: 'build:status', buildId: state.id, status: state.status, payload: qa })
      const requestLower = state.request.toLocaleLowerCase()
      const shouldRegister = state.register ?? (requestLower.includes('tool') || requestLower.includes('skill') || requestLower.includes('word count') || state.request.includes('كلمات'))
      if (shouldRegister) {
        try {
          const registration = await registerBuiltOutput({
            buildId: state.id,
            brief: state.request,
            spec: state.spec,
            plan: state.plan,
            kind: state.registrationKind ?? (state.request.toLocaleLowerCase().includes('project') ? 'project' : 'skill'),
            skillsLibraryPath: this.skillsLibraryPath,
            knowledgePath: this.knowledgePath,
            registry: this.options.registry,
            skillCreator: this.options.skillCreator
          })
          state.registration = registration
          this.save(state)
          this.emit({ type: 'build:log', buildId: state.id, message: `Registered ${registration.kind}: ${registration.name}` })
        } catch (error) {
          this.emit({ type: 'build:error', buildId: state.id, message: `Registration failed: ${error instanceof Error ? error.message : String(error)}` })
        }
      }
      return state
    } catch (error) {
      state.status = 'failed'
      state.error = error instanceof Error ? error.message : String(error)
      this.save(state)
      this.emit({ type: 'build:error', buildId: state.id, status: state.status, message: state.error })
      return state
    }
  }

  async wait(id: string): Promise<BuildState> {
    const running = this.active.get(safeId(id))
    if (running) return running
    return this.load(id)
  }

  status(id?: string): BuildState | BuildState[] {
    if (id) return this.load(id)
    return this.list()
  }

  list(): BuildState[] {
    const root = join(this.homePath, 'builds')
    if (!existsSync(root)) return []
    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => readState(statePath(join(root, entry.name))))
      .filter((state): state is BuildState => state !== undefined)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async resume(id: string): Promise<BuildStartResponse> {
    const state = this.load(id)
    const workspace = await createWorkspace({
      id: state.id,
      octaHome: this.homePath,
      projectPath: state.projectPath,
      mode: state.mode,
      targetBranch: state.targetBranch,
      commandRunner: this.runner
    })
    state.workspace = workspace
    state.workspacePath = workspace.path
    state.branch = workspace.branch
    const recovery = new RecoveryManager({ workspace, plan: state.plan, commandRunner: this.runner, maxRetries: 3 })
    recovery.resumeFromLastCommit(state.plan)
    state.status = 'ready'
    state.error = undefined
    this.save(state)
    const execution = this.execute(state)
    this.active.set(state.id, execution)
    void execution.finally(() => this.active.delete(state.id))
    return { id: state.id, status: state.status, workspacePath: state.workspacePath, branch: state.branch, specPath: state.specPath, planPath: state.planPath }
  }

  async review(id: string): Promise<ReturnType<typeof reviewBuild>> {
    const state = this.load(id)
    return reviewBuild({ buildId: id, workspace: state.workspace, targetBranch: state.targetBranch, commandRunner: this.runner })
  }

  async merge(id: string, options: { strategy?: 'merge' | 'pr'; targetPath?: string } = {}): Promise<MergeResult> {
    const state = this.load(id)
    const result = await mergeBuild({
      buildId: id,
      workspace: state.workspace,
      targetPath: options.targetPath,
      targetBranch: state.targetBranch,
      strategy: options.strategy,
      commandRunner: this.runner,
      conflictResolver: this.options.conflictResolver,
      title: state.spec.title,
      body: state.spec.overview
    })
    if (result.merged) {
      state.status = 'merged'
      this.save(state)
      this.emit({ type: 'build:status', buildId: id, status: state.status, payload: result })
    }
    return result
  }

  async discard(id: string): Promise<{ id: string; status: 'discarded' }> {
    const state = this.load(id)
    await discardBuild(state.workspace, { commandRunner: this.runner })
    state.status = 'discarded'
    this.save(state)
    this.emit({ type: 'build:status', buildId: id, status: 'discarded' })
    return { id, status: 'discarded' }
  }

  async analyze(options: Omit<AnalysisOptions, 'projectPath' | 'outputDir'> & { id?: string; projectPath?: string } = {}): Promise<AnalysisResult> {
    const projectPath = resolve(options.projectPath ?? this.defaultProjectPath)
    const outputDir = options.id
      ? join(this.homePath, 'builds', safeId(options.id), '.octa-build', 'analysis')
      : join(this.homePath, 'analysis')
    return runAnalysis({
      ...options,
      projectPath,
      outputDir,
      research: options.research ?? this.options.research
    })
  }

  recovery(id: string): RecoveryManager {
    const state = this.load(id)
    return new RecoveryManager({ workspace: state.workspace, plan: state.plan, commandRunner: this.runner, maxRetries: 3 })
  }
}

export * from './analysis'
export * from './coder'
export * from './merge'
export * from './qa'
export * from './recovery'
export * from './register'
export * from './spec'
export * from './types'
export * from './workspace'
