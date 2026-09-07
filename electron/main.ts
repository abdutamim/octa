import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { GeminiClient } from './cloud/gemini'
import { CompanyBrain } from './core/octa/brain'
import { IntakeInterview } from './core/octa/intake'
import { Notifier } from './core/notify'
import { requireAiAuth } from './cloud/vertex'
import { SettingsRepository } from './db/settings'
import { JobsRepository } from './db/jobs'
import { JobRunner, type JobSpec } from './core/jobs/runner'
import type { AiTestResult, AppSettings, JobRecord, JobStartResponse, RendererState } from './types'

export const DEFAULT_OCTA_HOME = 'C:\\Octa'

export function resolveOctaHome(environment: NodeJS.ProcessEnv = process.env): string {
  const configured = environment.OCTA_HOME?.trim()
  return configured || DEFAULT_OCTA_HOME
}

const octaHome = resolveOctaHome()
mkdirSync(octaHome, { recursive: true })
app.setPath('userData', octaHome)

let mainWindow: BrowserWindow | undefined
let repository: SettingsRepository | undefined
let jobsRepository: JobsRepository | undefined
let jobRunner: JobRunner | undefined
let notifier: Notifier | undefined
let brain: CompanyBrain | undefined
let intake: IntakeInterview | undefined
let ipcRegistered = false

function broadcast(channel: string, payload: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload)
  }
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

  const rendererUrl = process.env.ELECTRON_RENDERER_URL
  if (rendererUrl) {
    void window.loadURL(rendererUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return window
}

function requireBrain(): CompanyBrain {
  if (!brain) throw new Error('Company brain is unavailable.')
  return brain
}

function requireIntake(): IntakeInterview {
  if (!intake) throw new Error('Company intake is unavailable.')
  return intake
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

function registerIpc(): void {
  if (ipcRegistered) return
  ipcRegistered = true

  ipcMain.handle('app:state', (): RendererState => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    return { settings: repository.getSettings() }
  })

  ipcMain.handle('settings:update', async (_event, update: Partial<AppSettings>): Promise<AppSettings> => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    const next = repository.setSettings(update)
    if (!brain || update.vaultPath !== undefined || update.octaHomePath !== undefined) {
      await configureBrain(next)
    }
    broadcast('settings:changed', next)
    return next
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
  jobRunner = new JobRunner({
    jobs: jobsRepository,
    getSettings: () => {
      if (!repository) throw new Error('Settings storage is unavailable.')
      return repository.getSettings()
    },
    onEvent: (event) => broadcast('jobs:events', event)
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
  await configureBrain(repository.getSettings())
  registerIpc()
  mainWindow = createWindow()
}

app.whenReady().then(() => start()).catch((error: unknown) => {
  console.error('[startup] Octa could not start:', error)
  app.exit(1)
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
})

app.on('before-quit', () => {
  brain?.close()
  brain = undefined
  intake = undefined
  repository?.checkpoint()
  jobsRepository?.checkpoint()
  repository?.close()
  jobsRepository?.close()
  repository = undefined
  jobsRepository = undefined
  jobRunner = undefined
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
