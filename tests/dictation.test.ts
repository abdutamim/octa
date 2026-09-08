import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, type VoiceState } from '../electron/types'
import { VoiceController } from '../electron/core/dictation'
import type { GeminiLiveEvent } from '../electron/cloud/gemini-live'
import type { WakeWordDetector, WakeWordHit } from '../electron/core/wake-word'

class FakeDetector implements WakeWordDetector {
  readonly frameLength = 512
  private callback: ((hit: WakeWordHit) => void) | undefined
  frames = 0

  start(callback: (hit: WakeWordHit) => void): void {
    this.callback = callback
  }

  feedPcm(): void {
    this.frames += 1
  }

  fire(): void {
    this.callback?.({ keywordIndex: 0, timestamp: Date.now() })
  }

  stop(): void {
    this.callback = undefined
  }
}

class FakeSession {
  readonly sentAudio: ArrayBuffer[] = []
  readonly sentText: string[] = []
  readonly interrupt = vi.fn()
  readonly close = vi.fn()
  private opened = false
  constructor(private readonly onEvent: (event: GeminiLiveEvent) => void) {}

  open(): void {
    this.opened = true
  }

  sendPcm(audio: ArrayBuffer): void {
    if (!this.opened) throw new Error('not open')
    this.sentAudio.push(audio)
  }

  sendText(text: string): void {
    this.sentText.push(text)
  }

  emit(event: GeminiLiveEvent): void {
    this.onEvent(event)
  }
}

function pcm(values: number[]): ArrayBuffer {
  const output = new Int16Array(values)
  return output.buffer
}

describe('voice dictation controller', () => {
  it('keeps microphone frames local until a fake detector fires, then opens Live', async () => {
    const detector = new FakeDetector()
    const sessions: FakeSession[] = []
    const states: VoiceState[] = []
    const settings = { ...DEFAULT_SETTINGS, geminiLiveModel: 'gemini-test-live' }
    const controller = new VoiceController({
      settings: () => settings,
      detector,
      createSession: ({ onEvent }) => {
        const session = new FakeSession(onEvent)
        sessions.push(session)
        return session
      },
      onState: (state) => states.push(state)
    })

    await controller.start()
    controller.feedPcm(pcm([0, 0, 0, 0]))
    expect(detector.frames).toBe(1)
    expect(sessions).toHaveLength(0)
    detector.fire()
    await vi.waitFor(() => expect(sessions).toHaveLength(1))
    await vi.waitFor(() => expect(sessions[0]?.sentText).toEqual(['إيه يا عميل، عايز إيه؟']))
    expect(controller.currentState.phase).toBe('listening')
    expect(sessions[0].sentText).toEqual(['إيه يا عميل، عايز إيه؟'])
    expect(states.some((state) => state.phase === 'listening')).toBe(true)

    controller.feedPcm(pcm([100, -100, 100, -100]))
    expect(sessions[0].sentAudio).toHaveLength(1)
    controller.dispose()
  })

  it('barge-in interrupts local playback when speech arrives', async () => {
    const detector = new FakeDetector()
    let session: FakeSession | undefined
    const controller = new VoiceController({
      settings: () => ({ ...DEFAULT_SETTINGS, geminiLiveModel: 'live-test' }),
      detector,
      createSession: ({ onEvent }) => {
        session = new FakeSession(onEvent)
        return session
      }
    })
    await controller.start()
    detector.fire()
    await vi.waitFor(() => expect(session).toBeDefined())
    session!.emit({ type: 'audio', data: Buffer.from([1, 2]), mimeType: 'audio/pcm;rate=24000' })
    expect(controller.currentState.phase).toBe('speaking')
    controller.feedPcm(pcm([20_000, -20_000, 20_000, -20_000]))
    await vi.waitFor(() => expect(session!.interrupt).toHaveBeenCalledOnce())
    controller.dispose()
  })
})
