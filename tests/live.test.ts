import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createRealtimeAudioMessage,
  createGeminiLiveSetup,
  frameGeminiLiveMessage,
  GeminiLiveSession,
  parseGeminiLiveMessage,
  selectNewestNativeAudioModel,
  type GeminiModelDescription,
  type LiveWebSocket
} from '../electron/cloud/gemini-live'

const fixture = (name: string): string =>
  readFileSync(join(process.cwd(), 'tests', 'fixtures', 'live', name), 'utf8')

describe('Gemini Live framing', () => {
  it('frames raw PCM in the official realtimeInput.audio shape', () => {
    const message = createRealtimeAudioMessage(new Uint8Array([1, 2, 3, 4]).buffer)
    expect(message).toEqual({
      realtimeInput: {
        audio: { data: 'AQIDBA==', mimeType: 'audio/pcm;rate=16000' }
      }
    })
    expect(frameGeminiLiveMessage(message)).toBe(JSON.stringify(message))
  })

  it('builds a native-audio setup with the language mirror persona', () => {
    const setup = createGeminiLiveSetup({ model: 'gemini-test-live', language: 'mixed' })
    expect(setup).toMatchObject({
      setup: {
        model: 'models/gemini-test-live',
        generationConfig: {
          responseModalities: ['AUDIO'],
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      }
    })
    expect(JSON.stringify(setup)).toContain('بنفس لغة المستخدم')
  })

  it('parses recorded audio, output transcript, interruption, and setup frames', () => {
    const audio = parseGeminiLiveMessage(fixture('server-audio.json'))
    expect(audio).toContainEqual(expect.objectContaining({ type: 'audio', mimeType: 'audio/pcm;rate=24000' }))
    expect(audio).toContainEqual(expect.objectContaining({ type: 'transcript', source: 'assistant', text: 'أهلاً', final: true }))
    expect(parseGeminiLiveMessage(fixture('server-interrupted.json'))).toEqual([
      { type: 'interrupted' },
      { type: 'turn-complete' }
    ])
    expect(parseGeminiLiveMessage(fixture('setup-complete.json'))).toEqual([{ type: 'setup-complete' }])
  })

  it('chooses the newest Arabic-capable live model and ignores non-live models', () => {
    const models: GeminiModelDescription[] = [
      { name: 'models/gemini-3.5-flash', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.1-flash-live-preview-09-2026', supportedGenerationMethods: ['bidiGenerateContent'], languages: ['en', 'ar'] },
      { name: 'models/gemini-3.1-flash-live-preview-08-2026', supportedGenerationMethods: ['bidiGenerateContent'], languages: ['en', 'ar'] }
    ]
    expect(selectNewestNativeAudioModel(models)).toBe('gemini-3.1-flash-live-preview-09-2026')
  })

  it('sends setup before realtime PCM and becomes ready on setupComplete', async () => {
    class FakeSocket implements LiveWebSocket {
      readyState = 0
      readonly sent: string[] = []
      private readonly listeners = new Map<string, Array<(event: unknown) => void>>()

      addEventListener(type: string, listener: (event: unknown) => void): void {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
      }

      removeEventListener(): void {}

      send(data: string): void {
        this.sent.push(data)
      }

      close(): void {
        this.readyState = 3
      }

      open(): void {
        this.readyState = 1
        for (const listener of this.listeners.get('open') ?? []) listener({})
      }

      message(data: string): void {
        for (const listener of this.listeners.get('message') ?? []) listener({ data })
      }
    }

    const socket = new FakeSocket()
    const session = new GeminiLiveSession({
      apiKey: 'test-key',
      model: 'gemini-test-live',
      socketFactory: () => socket
    })
    const opening = session.open()
    socket.open()
    expect(JSON.parse(socket.sent[0])).toMatchObject({ setup: { model: 'models/gemini-test-live' } })
    socket.message(JSON.stringify({ setupComplete: {} }))
    await opening
    session.sendPcm(new Uint8Array([1, 2]).buffer)
    expect(JSON.parse(socket.sent[1])).toEqual(createRealtimeAudioMessage(new Uint8Array([1, 2]).buffer))
    expect(session.ready).toBe(true)
    session.close()
  })
})
