export type ThemeMode = 'dark' | 'light'
export type Locale = 'ar' | 'en'
export type AiProvider = 'gemini' | 'vertex'
export type TranscriptionLanguage = 'auto' | 'ar' | 'en'

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
  vaultPath: string
  photoshopPath: string
  braveSearchApiKey: string
  theme: ThemeMode
  locale: Locale
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
  vaultPath: '',
  photoshopPath: '',
  braveSearchApiKey: '',
  theme: 'dark',
  locale: 'ar'
}

export interface RendererState {
  settings: AppSettings
}

export interface VaultHit {
  path: string
  title: string
  excerpt: string
}
