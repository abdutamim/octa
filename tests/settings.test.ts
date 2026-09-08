import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { DEFAULT_SETTINGS } from '../electron/types'
import { SettingsRepository } from '../electron/db/settings'

let repository: SettingsRepository | undefined
let temporaryDirectory: string | undefined

afterEach(() => {
  repository?.close()
  repository = undefined
  if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true })
  temporaryDirectory = undefined
})

describe('SQLite app settings', () => {
  it('returns the safe defaults for a new database', () => {
    repository = new SettingsRepository(':memory:')
    expect(repository.getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('creates and reopens a file-backed database in its parent directory', () => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'octa-settings-'))
    const databasePath = join(temporaryDirectory, 'nested', 'octa.db')
    repository = new SettingsRepository(databasePath)
    repository.setSettings({ octaHomePath: 'D:\\Octa' })
    repository.close()
    repository = new SettingsRepository(databasePath)

    expect(existsSync(databasePath)).toBe(true)
    expect(repository.getSettings().octaHomePath).toBe('D:\\Octa')
  })

  it('round-trips the requested credentials, paths, and preferences', () => {
    repository = new SettingsRepository(':memory:')
    const next = repository.setSettings({
      geminiApiKey: ' gemini-test ',
      vertexProjectId: 'project-123',
      vertexKeyPath: 'C:\\keys\\vertex.json',
      groqApiKey: ' groq-test ',
      ntfyTopic: ' private-topic ',
      octaHomePath: 'D:\\Octa',
      updateRepository: 'abdutamim/octa',
      skillsLibraryPath: 'D:\\Octa\\skills-library',
      vaultPath: 'D:\\Vault',
      photoshopPath: 'C:\\Photoshop.exe',
      braveSearchApiKey: ' brave-test ',
      locale: 'en',
      theme: 'light'
    })

    expect(next).toMatchObject({
      geminiApiKey: 'gemini-test',
      vertexProjectId: 'project-123',
      vertexKeyPath: 'C:\\keys\\vertex.json',
      groqApiKey: 'groq-test',
      ntfyTopic: 'private-topic',
      octaHomePath: 'D:\\Octa',
      updateRepository: 'abdutamim/octa',
      skillsLibraryPath: 'D:\\Octa\\skills-library',
      vaultPath: 'D:\\Vault',
      photoshopPath: 'C:\\Photoshop.exe',
      braveSearchApiKey: 'brave-test',
      locale: 'en',
      theme: 'light'
    })
  })

  it('persists the voice model, wake-word, and trigger settings', () => {
    repository = new SettingsRepository(':memory:')
    const next = repository.setSettings({
      geminiLiveModelOverride: 'gemini-live-custom',
      wakeWordModelPath: 'D:\\Octa\\models\\octa.onnx',
      wakeWordSensitivity: 0.72,
      pushToTalkEnabled: false,
      pushToTalkKey: 'CommandOrControl+Shift+V',
      triggerType: 'keyboard',
      wakeGreeting: 'Ready?'
    })
    expect(next).toMatchObject({
      geminiLiveModelOverride: 'gemini-live-custom',
      wakeWordModelPath: 'D:\\Octa\\models\\octa.onnx',
      wakeWordSensitivity: 0.72,
      pushToTalkEnabled: false,
      pushToTalkKey: 'CommandOrControl+Shift+V',
      hotkey: 'CommandOrControl+Shift+V',
      wakeGreeting: 'Ready?'
    })
  })

  it('migrates the copied trigger hotkey into the PTT setting', () => {
    repository = new SettingsRepository(':memory:')
    repository.setSettings({ hotkey: 'CommandOrControl+Shift+M' })
    expect(repository.getSettings()).toMatchObject({
      hotkey: 'CommandOrControl+Shift+M',
      pushToTalkKey: 'CommandOrControl+Shift+M'
    })
  })

  it('rejects unsafe ntfy URLs and ignores unknown keys', () => {
    repository = new SettingsRepository(':memory:')
    repository.setSettings({ ntfyServer: 'file:///private', ntfyTopic: 'x'.repeat(400) })
    expect(repository.getSettings().ntfyServer).toBe(DEFAULT_SETTINGS.ntfyServer)
    expect(repository.getSettings().ntfyTopic).toHaveLength(256)
    repository.setSettings({ unexpected: 'secret' } as never)
    expect(repository.getSettings()).not.toHaveProperty('unexpected')
  })
})
