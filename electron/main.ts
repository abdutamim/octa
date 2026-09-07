import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { GeminiClient } from './cloud/gemini'
import { Notifier } from './core/notify'
import { requireAiAuth } from './cloud/vertex'
import { SettingsRepository } from './db/settings'
import type { AiTestResult, AppSettings, RendererState } from './types'

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
let notifier: Notifier | undefined
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

function registerIpc(): void {
  if (ipcRegistered) return
  ipcRegistered = true

  ipcMain.handle('app:state', (): RendererState => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    return { settings: repository.getSettings() }
  })

  ipcMain.handle('settings:update', (_event, update: Partial<AppSettings>): AppSettings => {
    if (!repository) throw new Error('Settings storage is unavailable.')
    const next = repository.setSettings(update)
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
  repository?.checkpoint()
  repository?.close()
  repository = undefined
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
