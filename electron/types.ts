export type ThemeMode = 'dark' | 'light'
export type Locale = 'ar' | 'en'
export type AiProvider = 'gemini' | 'vertex'
export type TranscriptionLanguage = 'auto' | 'ar' | 'en'
export type TriggerType = 'keyboard' | 'mouse'
export type MouseTriggerButton = 3 | 4 | 5
export type VoiceLanguage = 'ar-EG' | 'en' | 'mixed'
export type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

export interface VoiceState {
  phase: VoicePhase
  source: 'wake-word' | 'push-to-talk' | null
  transcript: string
  language: VoiceLanguage | null
  model: string | null
  error?: string
}

export interface VoiceTranscriptEvent {
  text: string
  final: boolean
  source: 'user' | 'assistant'
  languageHint?: string
}

export interface VoiceAudioEvent {
  data: string
  mimeType: string
}

export type JobRunnerName =
  | 'claude-plan'
  | 'claude-skill'
  | 'codex-exec'
  | 'codex-scout'
  | 'codex-critic'
  | 'codex-review'
  | 'octa-code'
  | 'workflow'
  | 'gemini-inline'

/** Final job states plus the transient state shown while a subprocess runs. */
export type JobStatus = 'running' | 'ok' | 'failed' | 'needs_approval' | 'needs_input' | 'cancelled' | 'stale'
export type JobAutonomy = 'led' | 'assisted' | 'auto'
export type JobGate = 'none' | 'review' | 'approve'

export interface JobOutput {
  path: string
  type: string
  title: string
}

export interface JobMetrics {
  source_count: number
  languages?: string[]
  tokens_in: number
  tokens_out: number
  seconds: number
  cost_usd?: number
}

export interface JobResult {
  job_id: string
  step_id: string
  status: Exclude<JobStatus, 'running'>
  outputs: JobOutput[]
  sources: string
  metrics: JobMetrics
  questions: unknown[]
  notes: string
}

export interface JobRecord {
  id: string
  workflowRunId: string | null
  planId: string | null
  workflow: string | null
  stepId: string | null
  skill: string | null
  runner: JobRunnerName | string
  department: string | null
  status: JobStatus
  autonomy: JobAutonomy | null
  gate: JobGate | null
  input: unknown
  result: unknown
  review: unknown
  sourceCount: number
  cost: unknown
  startedAt: string | null
  finishedAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  error: string | null
  state: unknown
  gatePayload: unknown
  gateCreatedAt: string | null
  gateExpiresAt: string | null
  gateDecision: string | null
  gateComments: string | null
  attempt: number
}

export interface JobStartRequest {
  id?: string
  workflowRunId?: string | null
  runner: JobRunnerName
  skill?: string
  input?: unknown
  acceptance?: readonly string[]
  acceptanceCriteria?: readonly string[]
  prompt?: string
  brief?: string
  planId?: string | null
  workflow?: string | null
  stepId?: string | null
  department?: string | null
  autonomy?: JobAutonomy
  gate?: JobGate
  language?: string
  timeBudgetMs?: number
  inputTokenBudget?: number
  maxRetries?: number
  retryDelayMs?: number
  /** Workflow orchestration keeps review in spec 006 so it can persist gate state. */
  skipReview?: boolean
}

export interface JobStartResponse {
  id: string
  folder: string
}

export interface JobTextEvent {
  type: 'text'
  jobId: string
  timestamp: string
  text: string
}

export interface JobToolEvent {
  type: 'tool'
  jobId: string
  timestamp: string
  name: string
  phase?: 'start' | 'complete'
  input?: unknown
  output?: unknown
}

export interface JobUsageEvent {
  type: 'usage'
  jobId: string
  timestamp: string
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  costUsd?: number
}

export interface JobErrorEvent {
  type: 'error'
  jobId: string
  timestamp: string
  message: string
  code?: string | number
}

export interface JobDoneEvent {
  type: 'done'
  jobId: string
  timestamp: string
  status: Exclude<JobStatus, 'running'>
  result?: JobResult
}

export type JobEvent = JobTextEvent | JobToolEvent | JobUsageEvent | JobErrorEvent | JobDoneEvent

export interface AiTestResult {
  provider: string
  model: string
  latencyMs: number
}

/** Settings that belong to the Octa foundation and are safe to expose to the renderer. */
export interface AppSettings {
  geminiApiKey: string
  groqApiKey: string
  aiProvider: AiProvider
  vertexKeyPath: string
  vertexProjectId: string
  vertexLocation: string
  ntfyTopic: string
  ntfyServer: string
  octaHomePath: string
  skillsLibraryPath: string
  vaultPath: string
  photoshopPath: string
  braveSearchApiKey: string
  theme: ThemeMode
  locale: Locale
  /** The most recently selected native-audio model returned by the model list. */
  geminiLiveModel: string
  /** A non-empty value wins over automatic model selection. */
  geminiLiveModelOverride: string
  wakeWordEnabled: boolean
  wakeWordModelPath: string
  wakeWordSensitivity: number
  pushToTalkEnabled: boolean
  pushToTalkKey: string
  /** Compatibility alias used by the copied global trigger module. */
  hotkey: string
  triggerType: TriggerType
  mouseButton: MouseTriggerButton
  wakeGreeting: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  groqApiKey: '',
  aiProvider: 'gemini',
  vertexKeyPath: '',
  vertexProjectId: '',
  vertexLocation: 'global',
  ntfyTopic: '',
  ntfyServer: 'https://ntfy.sh',
  octaHomePath: 'C:\\Octa',
  skillsLibraryPath: '',
  vaultPath: '',
  photoshopPath: '',
  braveSearchApiKey: '',
  theme: 'dark',
  locale: 'ar',
  geminiLiveModel: '',
  geminiLiveModelOverride: '',
  wakeWordEnabled: true,
  wakeWordModelPath: 'C:\\Octa\\models\\octa.onnx',
  wakeWordSensitivity: 0.55,
  pushToTalkEnabled: true,
  pushToTalkKey: 'CommandOrControl+Alt+Space',
  hotkey: 'CommandOrControl+Alt+Space',
  triggerType: 'keyboard',
  mouseButton: 4,
  wakeGreeting: 'إيه يا عميل، عايز إيه؟'
}

export interface RendererState {
  settings: AppSettings
}

export interface VaultHit {
  path: string
  title: string
  excerpt: string
}
