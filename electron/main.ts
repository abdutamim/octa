import { app, BrowserWindow, ipcMain, Notification, screen, shell } from 'electron'
import { mkdirSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { GeminiClient } from './cloud/gemini'
import {
  DEFAULT_GEMINI_LIVE_MODEL,
  GeminiLiveSession,
  type PcmAudioOutput,
  resolveGeminiLiveModel
} from './cloud/gemini-live'
import { GeminiVoiceFallback } from './cloud/gemini-tts'
import { VoiceController } from './core/dictation'
import { CompanyBrain } from './core/octa/brain'
import { IntakeInterview } from './core/octa/intake'
import { BuildManager, type BuildStartRequest } from './core/octa/build'
import {
  runGuidedInstall,
  runHealthChecks,
  type GuidedInstallKind,
  type HealthReport
} from './core/octa/health'
import {
  Planner,
  compileBrief,
  type PlannerAnswerRequest,
  type PlannerPlanRequest,
  type PlannerResult
} from './core/octa/planner'
import { Notifier } from './core/notify'
import { requireAiAuth, resolveAiAuth } from './cloud/vertex'
import { SettingsRepository } from './db/settings'
import { JobsRepository } from './db/jobs'
import { JobRunner, type JobSpec } from './core/jobs/runner'
import { ConversationRepository } from './core/voice/conversation'
import { WorkflowGateRegistry } from './core/voice/workflow-gate'
import { createWakeWordDetector } from './core/wake-word'
import { GlobalTriggerManager } from './input/trigger'
import { SkillRegistry, type SkillListOptions } from './core/skills/registry'
import {
  RESEARCH_LOGIN_SITES,
  ResearchManager,
  type ResearchLoginSite,
  type ResearchStartRequest,
  type ResearchStartResponse
} from './core/octa/research'
import type {
  AiTestResult,
  AppSettings,
  JobRecord,
  JobStartResponse,
  RendererState,
  VoiceAudioEvent,
  VoiceState,
  VoiceTranscriptEvent
} from './types'
import { voiceAudioEvent } from './core/dictation'
import {
  RecurringScheduler,
  WorkflowRunner,
  seedRecurringJobs,
  type WorkflowGateActionRequest,
  type WorkflowStartRequest,
  type WorkflowStartResponse
} from './core/octa/workflows'

export const DEFAULT_OCTA_HOME = 'C:\\Octa'

export function resolveOctaHome(environment: NodeJS.ProcessEnv = process.env): string {
  const configured = environment.OCTA_HOME?.trim()
  return configured || DEFAULT_OCTA_HOME
}

const octaHome = resolveOctaHome()
mkdirSync(octaHome, { recursive: true })
app.setPath('userData', octaHome)

let mainWindow: BrowserWindow | undefined
let overlayWindow: BrowserWindow | undefined
let repository: SettingsRepository | undefined
let jobsRepository: JobsRepository | undefined
let jobRunner: JobRunner | undefined
let skillsRegistry: SkillRegistry | undefined
let researchManager: ResearchManager | undefined
let notifier: Notifier | undefined
let brain: CompanyBrain | undefined
let intake: IntakeInterview | undefined
let planner: Planner | undefined
let conversations: ConversationRepository | undefined
let workflowGates: WorkflowGateRegistry | undefined
let voiceController: VoiceController | undefined
let triggerManager: GlobalTriggerManager | undefined
let voiceAudioOutput: PcmAudioOutput | undefined
let buildManager: BuildManager | undefined
let workflows: WorkflowRunner | undefined
let recurringScheduler: RecurringScheduler | undefined
let ipcRegistered = false

function broadcast(channel: string, payload: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload)
  }
}

function loadRenderer(window: BrowserWindow, overlay = false): void {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL
  if (rendererUrl) {
    const url = new URL(rendererUrl)
    if (overlay) url.searchParams.set('overlay', '1')
    void window.loadURL(url.toString())
    return
  }
  void window.loadFile(join(__dirname, '../renderer/index.html'), overlay ? { query: { overlay: '1' } } : undefined)
}

function smokeOutputPath(): string | undefined {
  const argument = process.argv.find((value) => value.startsWith('--smoke-output='))
  const path = argument?.slice('--smoke-output='.length).trim()
  return path || undefined
}

function runSmokeTest(): void {
  const output = smokeOutputPath()
  if (!output) {
    process.exit(2)
    return
  }
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, JSON.stringify({
    ok: true,
    failures: [],
    version: app.getVersion(),
    product: 'Octa Assistant'
  }, null, 2), 'utf8')
  // The smoke path intentionally bypasses Electron shutdown hooks. Packaged
  // Chromium helper processes can otherwise keep a child-process harness
  // alive after the result has already been written.
  process.exit(0)
}

function outputFilePath(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('An output file path is required.')
  const configuredHome = repository?.getSettings().octaHomePath || DEFAULT_OCTA_HOME
  const root = resolve(configuredHome)
  const target = resolve(value)
  const distance = relative(root, target)
  if (distance === '..' || distance.startsWith(`..${sep}`) || isAbsolute(distance)) {
    throw new Error('Output files must stay inside the Octa home folder.')
  }
  return target
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1_180,
    height: 780,
    minWidth: 900,
    minHeight: 620,
    title: 'Octa Assistant',
    backgroundColor: '#110a10',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  loadRenderer(window)
  return window
}

function createOverlayWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 360,
    height: 84,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  loadRenderer(window, true)
  return window
}

function attachMainWindow(window: BrowserWindow): void {
  mainWindow = window
  window.on('hide', () => updateVoiceOverlay(voiceController?.currentState ?? defaultVoiceState()))
  window.on('show', () => updateVoiceOverlay(voiceController?.currentState ?? defaultVoiceState()))
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = undefined
    if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.close()
  })
}

function defaultVoiceState(): VoiceState {
  return { phase: 'idle', source: null, transcript: '', language: null, model: null }
}

function updateVoiceOverlay(state: VoiceState): void {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  const hidden = !mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()
  if (!hidden || state.phase === 'idle') {
    overlayWindow.hide()
    return
  }
  try {
    const workArea = screen.getPrimaryDisplay().workArea
    const x = Math.max(workArea.x, workArea.x + workArea.width - 380)
    const y = Math.max(workArea.y, workArea.y + workArea.height - 110)
    overlayWindow.setPosition(x, y, false)
    overlayWindow.showInactive()
  } catch {
    // Electron can briefly reject display queries while a monitor is changing.
  }
}

function emitVoiceState(state: VoiceState): void {
  broadcast('voice:state', state)
  updateVoiceOverlay(state)
}

function emitVoiceTranscript(event: VoiceTranscriptEvent): void {
  broadcast('voice:transcript', event)
}

function emitVoiceAudio(event: VoiceAudioEvent): void {
  broadcast('voice:audio', event)
}

function normalizeSettingsUpdate(update: Partial<AppSettings>): Partial<AppSettings> {
  const next = { ...update }
  if (update.pushToTalkKey !== undefined && update.hotkey === undefined) next.hotkey = update.pushToTalkKey
  if (update.hotkey !== undefined && update.pushToTalkKey === undefined) next.pushToTalkKey = update.hotkey
  return next
}

function rendererState(): RendererState {
  if (!repository) throw new Error('Settings storage is unavailable.')
  return {
    settings: repository.getSettings(),
    firstRun: repository.getValue<boolean>('firstRunCompleted') !== true,
    version: app.getVersion()
  }
}

function guidedInstallKind(value: unknown): GuidedInstallKind {
  if (value === 'python' || value === 'playwright') return value
  throw new Error('The guided install is invalid.')
}

function requireBrain(): CompanyBrain {
  if (!brain) throw new Error('Company brain is unavailable.')
  return brain
}

function requireIntake(): IntakeInterview {
  if (!intake) throw new Error('Company intake is unavailable.')
  return intake
}

function requireSkillsRegistry(): SkillRegistry {
  if (!skillsRegistry) throw new Error('Skills registry is unavailable.')
  return skillsRegistry
}

function requirePlanner(): Planner {
  if (!planner) throw new Error('Planner is unavailable.')
  return planner
}

function requireBuildManager(): BuildManager {
  if (!buildManager) throw new Error('Build pipeline is unavailable.')
  return buildManager
}

function buildStartRequest(value: unknown): BuildStartRequest {
  if (!value || typeof value !== 'object') throw new Error('A build request is required.')
  const input = value as Partial<BuildStartRequest>
  const request = typeof input.request === 'string' ? input.request : typeof input.brief === 'string' ? input.brief : ''
  if (!request.trim()) throw new Error('A build request is required.')
  return {
    id: typeof input.id === 'string' ? input.id : undefined,
    request,
    projectPath: typeof input.projectPath === 'string' ? input.projectPath : undefined,
    mode: input.mode === 'direct' || input.mode === 'isolated' ? input.mode : undefined,
    direct: typeof input.direct === 'boolean' ? input.direct : undefined,
    targetBranch: typeof input.targetBranch === 'string' ? input.targetBranch : undefined,
    complexity: input.complexity === 'small' || input.complexity === 'medium' || input.complexity === 'large' ? input.complexity : undefined,
    language: input.language === 'ar-EG' || input.language === 'en' || input.language === 'mixed' ? input.language : undefined,
    register: typeof input.register === 'boolean' ? input.register : undefined,
    registrationKind: input.registrationKind === 'skill' || input.registrationKind === 'project' ? input.registrationKind : undefined
  }
}

function requireWorkflows(): WorkflowRunner {
  if (!workflows) throw new Error('Workflow runner is unavailable.')
  return workflows
}

function workflowStartRequest(value: unknown): WorkflowStartRequest {
  if (!value || typeof value !== 'object') throw new Error('A workflow request is required.')
  const request = value as Partial<WorkflowStartRequest>
  if (typeof request.workflow !== 'string' || !request.workflow.trim()) throw new Error('A workflow name is required.')
  if (request.brief === undefined) throw new Error('A workflow brief is required.')
  return {
    workflow: request.workflow.trim(),
    brief: request.brief,
    planId: typeof request.planId === 'string' ? request.planId : request.planId === null ? null : undefined,
    language: typeof request.language === 'string' ? request.language : undefined,
    autonomy: request.autonomy === 'led' || request.autonomy === 'assisted' || request.autonomy === 'auto' ? request.autonomy : undefined,
    timeBudgetMs: typeof request.timeBudgetMs === 'number' ? request.timeBudgetMs : undefined,
    inputTokenBudget: typeof request.inputTokenBudget === 'number' ? request.inputTokenBudget : undefined
  }
}

function workflowRunId(value: unknown): string {
  const candidate = typeof value === 'object' && value !== null && 'runId' in value
    ? (value as { runId?: unknown }).runId
    : value
  if (typeof candidate !== 'string' || !candidate.trim()) throw new Error('A workflow run id is required.')
  return candidate.trim()
}

function workflowGateRequest(value: unknown): WorkflowGateActionRequest {
  if (!value || typeof value !== 'object') throw new Error('A workflow gate request is required.')
  const request = value as Partial<WorkflowGateActionRequest>
  if (typeof request.runId !== 'string' || !request.runId.trim()) throw new Error('A workflow run id is required.')
  return {
    runId: request.runId.trim(),
    stepId: typeof request.stepId === 'string' ? request.stepId.trim() : undefined,
    payload: typeof request.payload === 'string' ? request.payload : undefined,
    approvedBy: typeof request.approvedBy === 'string' ? request.approvedBy : undefined,
    comment: typeof request.comment === 'string' ? request.comment : undefined,
    reason: typeof request.reason === 'string' ? request.reason : undefined
  }
}

async function configureBrain(settings: AppSettings): Promise<void> {
  if (!repository) throw new Error('Settings storage is unavailable.')
  brain?.close()
  brain = new CompanyBrain({
    vaultPath: settings.vaultPath,
    octaHome: settings.octaHomePath,
    database: repository.getDatabase()
  })
  intake = new IntakeInterview({ vaultPath: settings.vaultPath, settings: repository })
  await brain.start()
}

function proposalId(value: unknown): number {
  const candidate = typeof value === 'object' && value !== null && 'id' in value
    ? (value as { id?: unknown }).id
    : value
  const id = typeof candidate === 'number' ? candidate : Number(candidate)
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('A valid proposal id is required.')
  return id
}

function requireResearchManager(): ResearchManager {
  if (!researchManager) throw new Error('Research engine is unavailable.')
  return researchManager
}

function researchSite(value: unknown): ResearchLoginSite {
  const candidate = typeof value === 'object' && value !== null && 'site' in value
    ? (value as { site?: unknown }).site
    : value
  if (typeof candidate !== 'string' || !(RESEARCH_LOGIN_SITES as readonly string[]).includes(candidate)) {
    throw new Error(`Research login site must be one of: ${RESEARCH_LOGIN_SITES.join(', ')}.`)
  }
  return candidate as ResearchLoginSite
}

function researchChallengeSite(value: unknown): string {
  const candidate = typeof value === 'object' && value !== null && 'site' in value
    ? (value as { site?: unknown }).site
    : value
  if (typeof candidate !== 'string' || !/^[a-zA-Z0-9._-]{1,255}$/.test(candidate.trim())) {
    throw new Error('Research challenge site is invalid.')
  }
  return candidate.trim()
}

function researchStartRequest(value: unknown): ResearchStartRequest {
  if (!value || typeof value !== 'object') throw new Error('A research request is required.')
  const request = value as Partial<ResearchStartRequest>
  if (typeof request.task !== 'string' || !request.task.trim()) throw new Error('A research task is required.')
  return {
    task: request.task,
    conversationLanguage: typeof request.conversationLanguage === 'string' ? request.conversationLanguage : undefined,
    extraLanguages: Array.isArray(request.extraLanguages) ? request.extraLanguages.filter((item): item is string => typeof item === 'string') : undefined,
    budgetMinutes: typeof request.budgetMinutes === 'number' ? request.budgetMinutes : undefined,
    budgetMs: typeof request.budgetMs === 'number' ? request.budgetMs : undefined,
    preset: request.preset === 'persona' || request.preset === 'competitor' ? request.preset : undefined,
    languagePlan: request.languagePlan,
    jobId: typeof request.jobId === 'string' ? request.jobId : undefined
  }
}

function registerIpc(): void {
  if (ipcRegistered) return
  ipcRegistered = true

  ipcMain.handle('app:state', (): RendererState => {
    return rendererState()
  })

  ipcMain.handle('first-run:complete', (): RendererState => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    repository.setValue('firstRunCompleted', true)
    return rendererState()
  })

  ipcMain.handle('health:run', async (): Promise<HealthReport> => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    return runHealthChecks(repository.getSettings(), {
      browserStatus: () => {
        const status = researchManager?.status().browser
        if (!status) throw new Error('Research browser is unavailable.')
        return status
      }
    })
  })

  ipcMain.handle('health:install', async (event, value: unknown) => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    const kind = guidedInstallKind(value)
    const settings = repository.getSettings()
    return runGuidedInstall(kind, settings.octaHomePath, {
      onOutput: (text, stream) => {
        if (!event.sender.isDestroyed()) event.sender.send('health:install-output', { kind, stream, text })
      }
    })
  })

  ipcMain.handle('settings:update', async (_event, update: Partial<AppSettings>): Promise<AppSettings> => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    const before = repository.getSettings()
    const normalized = normalizeSettingsUpdate(update)
    let next = repository.setSettings(normalized)
    if (
      before.geminiApiKey !== next.geminiApiKey &&
      next.geminiApiKey.trim() &&
      !next.geminiLiveModelOverride.trim()
    ) {
      await resolveGeminiLiveModel({
        apiKey: next.geminiApiKey,
        storedModel: next.geminiLiveModel,
        onSelectedModel: (model) => {
          repository?.setSettings({ geminiLiveModel: model })
        }
      })
      next = repository.getSettings()
    }
    if (!brain || update.vaultPath !== undefined || update.octaHomePath !== undefined) {
      await configureBrain(next)
    }
    if (update.skillsLibraryPath !== undefined) skillsRegistry?.reload()
    if (triggerManager && Object.keys(normalized).some((key) =>
      key === 'pushToTalkEnabled' || key === 'pushToTalkKey' || key === 'hotkey' ||
      key === 'triggerType' || key === 'mouseButton'
    )) {
      triggerManager.update(next)
    }
    if (voiceController && Object.keys(normalized).some((key) =>
      key === 'wakeWordEnabled' || key === 'wakeWordModelPath' || key === 'wakeWordSensitivity'
    )) {
      await voiceController.replaceDetector(await createWakeWordDetector(next))
    }
    if (voiceController && voiceAudioOutput && Object.keys(normalized).some((key) =>
      key === 'aiProvider' || key === 'geminiApiKey' || key === 'vertexKeyPath' ||
      key === 'vertexProjectId' || key === 'vertexLocation'
    )) {
      const auth = resolveAiAuth(next)
      voiceController.replaceFallback(auth ? new GeminiVoiceFallback(auth, voiceAudioOutput) : undefined)
    }
    broadcast('settings:changed', next)
    return next
  })

  ipcMain.handle('voice:state', (): VoiceState => voiceController?.currentState ?? defaultVoiceState())
  ipcMain.handle('voice:toggle', async (): Promise<VoiceState> => {
    await voiceController?.pushToTalk()
    return voiceController?.currentState ?? defaultVoiceState()
  })
  ipcMain.handle('voice:push-to-talk', async (): Promise<VoiceState> => {
    await voiceController?.pushToTalk()
    return voiceController?.currentState ?? defaultVoiceState()
  })
  ipcMain.handle('voice:stop', (): VoiceState => {
    voiceController?.stopSession()
    return voiceController?.currentState ?? defaultVoiceState()
  })
  ipcMain.handle('voice:interrupt', async (): Promise<VoiceState> => {
    await voiceController?.interrupt()
    return voiceController?.currentState ?? defaultVoiceState()
  })
  ipcMain.on('voice:pcm', (_event, value: unknown) => {
    if (!voiceController) return
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) voiceController.feedPcm(value)
  })
  ipcMain.on('voice:microphone-error', (_event, message: unknown) => {
    const text = typeof message === 'string' ? message.slice(0, 512) : 'Microphone access failed.'
    broadcast('voice:message', text)
  })
  ipcMain.handle('voice:readback', async (_event, value: unknown): Promise<void> => {
    if (!value || typeof value !== 'object') throw new Error('A voice read-back is required.')
    const request = value as { payload?: unknown; text?: unknown; gateId?: unknown }
    if (typeof request.text !== 'string' || !request.text.trim()) throw new Error('Read-back text is required.')
    await voiceController?.readBackPayload(
      request.payload,
      request.text,
      typeof request.gateId === 'string' ? request.gateId : undefined
    )
  })
  ipcMain.handle('voice:approve', async (_event, transcript: unknown) => {
    if (!voiceController) throw new Error('Voice is unavailable.')
    return voiceController.approveTranscript(typeof transcript === 'string' ? transcript : '')
  })

  ipcMain.handle('ai:test', async (): Promise<AiTestResult> => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    const settings = repository.getSettings()
    const auth = requireAiAuth(settings)
    const started = Date.now()
    await new GeminiClient(auth).testConnection()
    return {
      provider: auth.kind === 'vertex' ? 'Vertex AI' : 'Gemini API',
      model: 'gemini-3.5-flash',
      latencyMs: Date.now() - started
    }
  })

  ipcMain.handle('notify:test', () =>
    notifier?.send({
      title: 'Octa Assistant / أوكتا',
      body: 'Notifications are connected / الإشعارات متصلة',
      tags: ['octa']
    }) ?? false
  )

  ipcMain.handle('brain:proposals', (_event, status?: string) => {
    const allowed = status === 'pending' || status === 'approved' || status === 'rejected' ? status : undefined
    return requireBrain().listProposals(allowed)
  })

  ipcMain.handle('brain:approve', async (_event, value: unknown) => {
    const selected = requireBrain().approveProposal(proposalId(value))
    return requireBrain().applyProposal(selected)
  })

  ipcMain.handle('brain:reject', (_event, value: unknown) =>
    requireBrain().rejectProposal(proposalId(value))
  )

  ipcMain.handle('brain:status', () => requireBrain().status())

  ipcMain.handle('intake:next', (_event, options?: { mode?: 'company' | 'client'; client?: string; reset?: boolean }) =>
    requireIntake().next(options)
  )

  ipcMain.handle('intake:answer', (_event, input: { answer: string; questionId?: string } | string) =>
    requireIntake().answer(input)
  )

  ipcMain.handle('intake:state', () => requireIntake().getState())
  ipcMain.handle('skills:list', (_event, options?: SkillListOptions) =>
    requireSkillsRegistry().listSkills(options)
  )
  ipcMain.handle('skills:get', (_event, name: string) =>
    requireSkillsRegistry().getSkill(name) ?? null
  )

  ipcMain.handle('planner:plan', async (_event, request: PlannerPlanRequest): Promise<PlannerResult> => {
    const settings = repository?.getSettings()
    if (!settings) throw new Error('Settings storage is unavailable.')
    const language = request.language ?? conversations?.getLanguage(request.conversationId) ?? undefined
    const options = {
      homePath: settings.octaHomePath,
      skillsLibraryPath: settings.skillsLibraryPath || undefined,
      conversationId: request.conversationId,
      planId: request.planId,
      language,
      client: request.client,
      maxDebateRounds: request.maxDebateRounds,
      maxQuestionRounds: request.maxQuestionRounds
    }
    const brief = request.brief?.trim()
      ? request.brief
      : await compileBrief(
          request.conversation ?? [],
          request.attachments ?? [],
          requireBrain(),
          { homePath: settings.octaHomePath, planId: request.planId, language }
        )
    return requirePlanner().plan(brief, options)
  })

  ipcMain.handle('planner:answer', (_event, request: PlannerAnswerRequest): Promise<PlannerResult> =>
    requirePlanner().answer(request.planId, request.answers)
  )

  ipcMain.handle('planner:approve', (_event, value: string | { planId: string; approvedBy?: string }): Promise<PlannerResult> => {
    const planId = typeof value === 'string' ? value : value.planId
    const approvedBy = typeof value === 'string' ? 'owner' : value.approvedBy ?? 'owner'
    return requirePlanner().approve(planId, approvedBy)
  })

  ipcMain.handle('planner:get', (_event, planId: string): PlannerResult | null =>
    requirePlanner().get(planId)
  )

  ipcMain.handle('build:start', (_event, value: unknown) =>
    requireBuildManager().start(buildStartRequest(value))
  )

  ipcMain.handle('build:status', (_event, value?: unknown) => {
    const id = typeof value === 'string'
      ? value
      : value && typeof value === 'object' && 'id' in value && typeof (value as { id?: unknown }).id === 'string'
        ? (value as { id: string }).id
        : undefined
    return requireBuildManager().status(id)
  })

  ipcMain.handle('build:resume', (_event, value: string | { id: string }) =>
    requireBuildManager().resume(typeof value === 'string' ? value : value.id)
  )

  ipcMain.handle('build:merge', (_event, value: string | { id: string; strategy?: 'merge' | 'pr'; targetPath?: string }) => {
    const request = typeof value === 'string' ? { id: value } : value
    return requireBuildManager().merge(request.id, { strategy: request.strategy, targetPath: request.targetPath })
  })

  ipcMain.handle('build:discard', (_event, value: string | { id: string }) =>
    requireBuildManager().discard(typeof value === 'string' ? value : value.id)
  )

  ipcMain.handle('build:review', (_event, value: string | { id: string }) =>
    requireBuildManager().review(typeof value === 'string' ? value : value.id)
  )

  ipcMain.handle('build:analyze', (_event, value?: unknown) => {
    const input = value && typeof value === 'object' ? value as Record<string, unknown> : {}
    return requireBuildManager().analyze({
      id: typeof input.id === 'string' ? input.id : undefined,
      projectPath: typeof input.projectPath === 'string' ? input.projectPath : undefined,
      brief: typeof input.brief === 'string' ? input.brief : undefined,
      competitorBrief: typeof input.competitorBrief === 'string' ? input.competitorBrief : undefined,
      ideationPasses: Array.isArray(input.ideationPasses)
        ? input.ideationPasses.filter((item): item is 'code-quality' | 'security' | 'performance' | 'ux' | 'documentation' => ['code-quality', 'security', 'performance', 'ux', 'documentation'].includes(String(item)))
        : undefined
    })
  })

  ipcMain.handle('jobs:start', (_event, spec: JobSpec): JobStartResponse => {
    if (!jobRunner) throw new Error('Job runner is unavailable.')
    const handle = jobRunner.startJob(spec)
    return { id: handle.id, folder: handle.folder }
  })

  ipcMain.handle('jobs:cancel', async (_event, value: string | { id: string }): Promise<boolean> => {
    if (!jobRunner) throw new Error('Job runner is unavailable.')
    const id = typeof value === 'string' ? value : value.id
    return jobRunner.cancel(id)
  })

  ipcMain.handle('jobs:list', (_event, options?: { status?: string; limit?: number }): JobRecord[] => {
    if (!jobsRepository) throw new Error('Job storage is unavailable.')
    return jobsRepository.listJobs(options)
  })

  ipcMain.handle('jobs:get', (_event, id: string): JobRecord | null => {
    if (!jobsRepository) throw new Error('Job storage is unavailable.')
    return jobsRepository.getJob(id) ?? null
  })

  ipcMain.handle('jobs:approve', (_event, value: string | { id: string; approvedBy?: string }): JobRecord | null => {
    if (!jobsRepository) throw new Error('Job storage is unavailable.')
    const id = typeof value === 'string' ? value : value.id
    const approvedBy = typeof value === 'string' ? 'owner' : value.approvedBy ?? 'owner'
    const job = jobsRepository.approveJob(id, approvedBy)
    if (job) broadcast('jobs:events', {
      type: 'done',
      jobId: job.id,
      timestamp: new Date().toISOString(),
      status: job.status
    })
    return job ?? null
  })

  ipcMain.handle('workflows:list', () => requireWorkflows().list())

  ipcMain.handle('workflows:get', (_event, value: string) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error('A workflow or run id is required.')
    return requireWorkflows().get(value.trim())
  })

  ipcMain.handle('workflows:start', (_event, value: unknown): WorkflowStartResponse => {
    const request = workflowStartRequest(value)
    const handle = requireWorkflows().start(request)
    return { runId: handle.runId, workflow: request.workflow, folder: handle.folder }
  })

  ipcMain.handle('workflows:resume', (_event, value: unknown): WorkflowStartResponse => {
    const runId = workflowRunId(value)
    const handle = requireWorkflows().resume(runId)
    const run = requireWorkflows().getRun(runId)
    return { runId: handle.runId, workflow: run?.workflow ?? '', folder: handle.folder }
  })

  ipcMain.handle('workflows:gate:approve', (_event, value: unknown) =>
    requireWorkflows().approveGate(workflowGateRequest(value))
  )

  ipcMain.handle('workflows:gate:reject', (_event, value: unknown) =>
    requireWorkflows().rejectGate(workflowGateRequest(value))
  )

  ipcMain.handle('workflows:gate:comment', (_event, value: unknown) =>
    requireWorkflows().commentGate(workflowGateRequest(value))
  )

  ipcMain.handle('workflows:save', (_event, value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('A workflow name and plan are required.')
    const request = value as { name?: unknown; plan?: unknown; definition?: unknown }
    if (typeof request.name !== 'string' || !request.name.trim()) throw new Error('A workflow name is required.')
    const source = request.definition ?? request.plan
    return requireWorkflows().saveAsWorkflow(request.name, source)
  })

  ipcMain.handle('research:start', (_event, value: unknown): ResearchStartResponse => {
    const request = researchStartRequest(value)
    const handle = requireResearchManager().start(request.task, {
      conversationLanguage: request.conversationLanguage,
      extraLanguages: request.extraLanguages,
      budgetMinutes: request.budgetMinutes,
      budgetMs: request.budgetMs,
      preset: request.preset,
      languagePlan: request.languagePlan,
      jobId: request.jobId
    })
    return { id: handle.id, folder: handle.folder }
  })

  ipcMain.handle('research:status', (_event, value?: unknown) => {
    const id = typeof value === 'string' && value.trim() ? value.trim() : undefined
    return requireResearchManager().status(id)
  })

  const resolveChallenge = (_event: Electron.IpcMainInvokeEvent, value: unknown) =>
    requireResearchManager().challengeResolved(researchChallengeSite(value))
  const startLogin = (_event: Electron.IpcMainInvokeEvent, value: unknown) =>
    requireResearchManager().loginStart(researchSite(value))
  const finishLogin = (_event: Electron.IpcMainInvokeEvent, value: unknown) =>
    requireResearchManager().loginDone(researchSite(value))
  ipcMain.handle('research:challenge:resolved', resolveChallenge)
  ipcMain.handle('challenge:resolved', resolveChallenge)
  ipcMain.handle('research:login:start', startLogin)
  ipcMain.handle('login:start', startLogin)
  ipcMain.handle('research:login:done', finishLogin)
  ipcMain.handle('login:done', finishLogin)

  ipcMain.handle('files:read', async (_event, value: unknown): Promise<string> =>
    readFile(outputFilePath(value), 'utf8')
  )

  ipcMain.handle('files:open', async (_event, value: unknown): Promise<string> =>
    shell.openPath(outputFilePath(value))
  )

  ipcMain.on('window:minimize', (event) => BrowserWindow.fromWebContents(event.sender)?.minimize())
  ipcMain.on('window:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window?.isMaximized()) window.unmaximize()
    else window?.maximize()
  })
  ipcMain.on('window:close', (event) => BrowserWindow.fromWebContents(event.sender)?.close())
}

async function start(): Promise<void> {
  repository = new SettingsRepository(join(octaHome, 'octa.db'))
  jobsRepository = new JobsRepository(join(octaHome, 'octa.db'))
  skillsRegistry = new SkillRegistry({
    getSettings: () => {
      if (!repository) throw new Error('Settings storage is unavailable.')
      return repository.getSettings()
    },
    onChange: (skills) => broadcast('skills:changed', skills),
    onError: (error) => console.error('[skills] manifest reload failed:', error.message)
  })
  jobRunner = new JobRunner({
    jobs: jobsRepository,
    getSettings: () => {
      if (!repository) throw new Error('Settings storage is unavailable.')
      return repository.getSettings()
    },
    onEvent: (event) => {
      broadcast('jobs:events', event)
      if (event.type !== 'done' || !event.result) return
      const resultText = event.result.notes.trim() ||
        (event.result.questions.length > 0 ? JSON.stringify(event.result.questions) : '') ||
        `Job ${event.jobId} finished with status ${event.status}.`
      if (event.status === 'needs_approval') {
        void voiceController?.readBackPayload(
          { kind: 'job-result', jobId: event.jobId, result: event.result },
          resultText,
          event.jobId
        ).catch((error: unknown) => console.error('[voice] job read-back failed:', error))
      } else {
        void voiceController?.speak(resultText).catch((error: unknown) => {
          console.error('[voice] job result speech failed:', error)
        })
      }
    }
  })
  researchManager = new ResearchManager({
    runner: jobRunner,
    jobs: jobsRepository,
    getSettings: () => {
      if (!repository) throw new Error('Settings storage is unavailable.')
      return repository.getSettings()
    },
    settings: repository,
    onEvent: (event) => broadcast('research:events', event),
    onChallenge: (event) => broadcast('browser:challenge', event)
  })
  notifier = new Notifier(() => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    return repository.getSettings()
  }, {
    showLocalNotification: (options) => {
      if (!Notification.isSupported()) return false
      const notification = new Notification({ title: options.title, body: options.body })
      if (options.clickUrl) notification.on('click', () => void shell.openExternal(options.clickUrl!))
      notification.show()
      return true
    }
  })

  conversations = new ConversationRepository(repository.getDatabase())
  workflowGates = new WorkflowGateRegistry()
  const initialSettings = repository.getSettings()
  if (initialSettings.geminiApiKey.trim()) {
    await resolveGeminiLiveModel({
      apiKey: initialSettings.geminiApiKey,
      override: initialSettings.geminiLiveModelOverride,
      storedModel: initialSettings.geminiLiveModel,
      onSelectedModel: (model) => {
        repository?.setSettings({ geminiLiveModel: model })
      }
    })
  }

  const wakeDetector = await createWakeWordDetector(initialSettings)
  const audioOutput = {
    play: (data: Buffer, mimeType: string): void => emitVoiceAudio(voiceAudioEvent(data, mimeType)),
    stop: (): void => broadcast('voice:audio-stop', undefined),
    clear: (): void => broadcast('voice:audio-stop', undefined)
  }
  voiceAudioOutput = audioOutput
  const fallbackAuth = resolveAiAuth(initialSettings)
  voiceController = new VoiceController({
    settings: () => {
      if (!repository) throw new Error('Settings storage is unavailable.')
      return repository.getSettings()
    },
    detector: wakeDetector,
    conversation: conversations,
    conversationId: 'default',
    fallback: fallbackAuth ? new GeminiVoiceFallback(fallbackAuth, audioOutput) : undefined,
    createSession: ({ model, onEvent }) => {
      if (!repository) throw new Error('Settings storage is unavailable.')
      const settings = repository.getSettings()
      if (!settings.geminiApiKey.trim()) throw new Error('Add a Gemini AI Studio key before starting voice.')
      return new GeminiLiveSession({
        apiKey: settings.geminiApiKey,
        model: settings.geminiLiveModelOverride.trim() || settings.geminiLiveModel.trim() || model || DEFAULT_GEMINI_LIVE_MODEL,
        audioOutput,
        onEvent
      })
    },
    onState: emitVoiceState,
    onTranscript: emitVoiceTranscript,
    onMessage: (message) => broadcast('voice:message', message),
    approveGate: (request) => {
      if (!workflowGates) throw new Error('Workflow gates are unavailable.')
      return workflowGates.approve(request)
    }
  })
  triggerManager = new GlobalTriggerManager(
    () => void voiceController?.pushToTalk(),
    join(initialSettings.octaHomePath, 'tools', 'mouse-hook.exe')
  )
  triggerManager.update(initialSettings)
  await voiceController.start()

  await configureBrain(initialSettings)
  planner = new Planner({
    jobs: jobsRepository,
    jobRunner,
    homePath: repository.getSettings().octaHomePath,
    skillsLibraryPath: repository.getSettings().skillsLibraryPath || undefined,
    onEvent: (event) => {
      broadcast(event.type, event)
      if (event.type !== 'planner:questions' || event.questions.length === 0) return
      const text = event.questions.map((question) => question.text.trim()).filter(Boolean).join('\n')
      if (!text) return
      void voiceController?.readBackPayload(
        { kind: 'planner-questions', planId: event.planId, questions: event.questions },
        text,
        `planner:${event.planId}`
      ).catch((error: unknown) => console.error('[voice] planner read-back failed:', error))
    }
  })
  buildManager = new BuildManager({
    homePath: repository.getSettings().octaHomePath,
    projectPath: process.cwd(),
    skillsLibraryPath: repository.getSettings().skillsLibraryPath || skillsRegistry.libraryPath,
    registry: skillsRegistry,
    research: researchManager,
    planner,
    onEvent: (event) => broadcast('build:events', event)
  })
  workflows = new WorkflowRunner({
    jobs: jobsRepository,
    jobRunner,
    homePath: repository.getSettings().octaHomePath,
    getSettings: () => {
      if (!repository) throw new Error('Settings storage is unavailable.')
      return repository.getSettings()
    },
    notifier,
    onEvent: (event) => broadcast(event.type, event)
  })
  workflows.seedLaunchWorkflows()
  if (jobsRepository.listRecurringJobs().length === 0) seedRecurringJobs(jobsRepository)
  recurringScheduler = new RecurringScheduler({
    jobs: jobsRepository,
    workflows,
    onEvent: (message) => console.warn(`[recurring] ${message}`)
  })
  recurringScheduler.start()
  void workflows.resumePending()
  registerIpc()
  attachMainWindow(createWindow())
  overlayWindow = createOverlayWindow()
}

app.whenReady().then(() => process.argv.includes('--smoke-test') ? runSmokeTest() : start()).catch((error: unknown) => {
  console.error('[startup] Octa could not start:', error)
  app.exit(1)
})

app.on('activate', () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    attachMainWindow(createWindow())
    if (!overlayWindow || overlayWindow.isDestroyed()) overlayWindow = createOverlayWindow()
  }
})

app.on('before-quit', () => {
  triggerManager?.dispose()
  triggerManager = undefined
  voiceController?.dispose()
  voiceController = undefined
  voiceAudioOutput = undefined
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.close()
  overlayWindow = undefined
  recurringScheduler?.stop()
  recurringScheduler = undefined
  void workflows?.close()
  workflows = undefined
  void researchManager?.close()
  researchManager = undefined
  brain?.close()
  brain = undefined
  intake = undefined
  planner?.close()
  planner = undefined
  buildManager = undefined
  repository?.checkpoint()
  jobsRepository?.checkpoint()
  repository?.close()
  jobsRepository?.close()
  skillsRegistry?.close()
  repository = undefined
  jobsRepository = undefined
  jobRunner = undefined
  skillsRegistry = undefined
  conversations = undefined
  workflowGates = undefined
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
