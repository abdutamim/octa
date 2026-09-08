import type { PlanStep, PlannerResult, PlannerRunner } from '../planner'

export type BuildComplexity = 'small' | 'medium' | 'large'
export type BuildMode = 'isolated' | 'direct'
export type BuildProjectType = 'node' | 'python' | 'astro' | 'next' | 'unknown'
export type BuildPhaseType = 'setup' | 'implementation' | 'investigation' | 'integration' | 'cleanup'
export type BuildSubtaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked' | 'stuck'
export type BuildStatus = 'planning' | 'ready' | 'coding' | 'qa' | 'ready_to_merge' | 'merged' | 'discarded' | 'failed' | 'stuck'

export interface BuildVerification {
  type?: 'command' | 'manual' | 'api' | 'browser' | 'none'
  command?: string
  expected?: string
  description?: string
}

export interface BuildSubtask {
  id: string
  description: string
  status: BuildSubtaskStatus
  phaseId?: string
  phase?: number
  dependencies: string[]
  /** Alias retained in persisted plans for compatibility with old plan files. */
  needs?: string[]
  filesTouched: string[]
  files_to_modify?: string[]
  files_to_create?: string[]
  acceptance: string[]
  verificationCommands: string[]
  verification?: BuildVerification[]
  expectedOutput?: string
  actualOutput?: string
  sessionId?: string
  commitHash?: string
  attempts?: number
  startedAt?: string
  completedAt?: string
  failedAt?: string
  error?: string
}

export interface BuildPhase {
  id: string
  phase: number
  name: string
  type: BuildPhaseType
  dependsOn: string[]
  /** Alias retained in persisted plans for compatibility with old plan files. */
  depends_on?: string[]
  parallelSafe: boolean
  subtasks: BuildSubtask[]
}

export interface BuildPlan {
  planId: string
  feature: string
  summary: string
  complexity: BuildComplexity
  workflowType: string
  phases: BuildPhase[]
  acceptance: string[]
  /** Alias retained in persisted plans for compatibility with old plan files. */
  finalAcceptance?: string[]
  assumptions: string[]
  questions: string[]
  deliverables: string[]
  estimatedMinutes?: number
  sourcePlannerPlan?: unknown
}

export interface BuildSpec {
  buildId: string
  title: string
  overview: string
  objective: string
  complexity: BuildComplexity
  workflowType: string
  requirements: string[]
  acceptance: string[]
  filesTouched: string[]
  verificationCommands: string[]
  assumptions: string[]
  openQuestions: string[]
  language: string
}

export interface ProjectDetection {
  type: BuildProjectType
  root: string
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'
  testCommand?: string
  buildCommand?: string
  startCommand?: string
  files: string[]
}

export interface BuildWorkspace {
  id: string
  mode: BuildMode
  projectPath: string
  path: string
  branch: string
  targetBranch: string
  buildRoot: string
  metadataPath: string
  project: ProjectDetection
  createdAt: string
}

export interface BuildState {
  id: string
  request: string
  status: BuildStatus
  mode: BuildMode
  projectPath: string
  workspacePath: string
  buildRoot: string
  branch: string
  targetBranch: string
  specPath: string
  planPath: string
  spec: BuildSpec
  plan: BuildPlan
  workspace: BuildWorkspace
  register?: boolean
  registrationKind?: 'skill' | 'project'
  currentPhase?: string
  currentSubtask?: string
  qa?: QaResult
  registration?: RegistrationResult
  error?: string
  createdAt: string
  updatedAt: string
}

export interface CommandResult {
  code: number
  stdout: string
  stderr: string
  signal?: string
}

export type CommandRunner = (
  command: string,
  args: string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv; timeoutMs?: number }
) => Promise<CommandResult>

export interface CoderContextPack {
  spec: string
  plan: string
  subtask: string
  recentSessions: string[]
  filesTouchedSoFar: string[]
  diffSummary: string
}

export interface CoderSessionRequest {
  buildId: string
  workspace: BuildWorkspace
  subtask: BuildSubtask
  contextPack: CoderContextPack
  prompt: string
  argv: string[]
}

export interface CoderSessionResult {
  status: 'completed' | 'failed'
  sessionId?: string
  output?: string
  summary?: string
  changedFiles?: string[]
  commands?: string[]
  error?: string
}

export type CoderExecutor = (request: CoderSessionRequest) => Promise<CoderSessionResult>

export interface TestRun {
  command: string
  passed: boolean
  skipped?: boolean
  output: string
  durationMs: number
}

export interface BuildReviewIssue {
  severity?: 'low' | 'medium' | 'high' | 'critical'
  acceptance?: string
  message: string
  file?: string
  suggestion?: string
}

export interface BuildReviewResult {
  verdict: 'pass' | 'revise'
  issues: BuildReviewIssue[]
  summary?: string
}

export interface QaLoopEntry {
  loop: number
  review: BuildReviewResult
  tests: TestRun[]
  fixerRun?: CoderSessionResult
  timestamp: string
}

export interface QaResult {
  passed: boolean
  loops: number
  maxLoops: number
  history: QaLoopEntry[]
  finalReview?: BuildReviewResult
  finalTests: TestRun[]
  error?: string
}

export interface RegistrationResult {
  kind: 'skill' | 'project'
  name: string
  path: string
  registryPath?: string
  method: 'claude-skill' | 'native-skill-folder' | 'project-entry'
}

export interface BuildEvent {
  type: 'build:status' | 'build:phase' | 'build:subtask' | 'build:qa' | 'build:log' | 'build:error'
  buildId: string
  status?: BuildStatus
  phaseId?: string
  subtaskId?: string
  message?: string
  payload?: unknown
  timestamp: string
}

export interface BuildPlannerOptions {
  buildId: string
  request: string | PlanStep
  projectPath?: string
  outputDir?: string
  homePath?: string
  complexity?: BuildComplexity
  language?: 'ar-EG' | 'en' | 'mixed'
  planner?: {
    plan(input: string, options: { profile: 'spec'; homePath?: string; language?: 'ar-EG' | 'en' | 'mixed'; maxDebateRounds?: number }): Promise<PlannerResult | BuildPlan | unknown>
  }
  plannerRunner?: PlannerRunner
}
