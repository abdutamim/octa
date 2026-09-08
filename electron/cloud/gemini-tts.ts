import { Buffer } from 'node:buffer'
import type { AiAuth } from './vertex'
import { GeminiClient } from './gemini'
import type { PcmAudioOutput } from './gemini-live'

export interface GeminiVoiceFallbackOptions {
  voiceName?: string
  language?: 'auto' | 'ar' | 'en'
}

/** Unary STT/TTS path used while Gemini Live is unavailable. */
export class GeminiVoiceFallback {
  private readonly client: GeminiClient

  constructor(
    auth: string | AiAuth,
    private readonly audioOutput: PcmAudioOutput,
    fetcher: typeof fetch = fetch
  ) {
    this.client = new GeminiClient(auth, fetcher)
  }

  async speak(text: string, options: GeminiVoiceFallbackOptions = {}): Promise<void> {
    const result = await this.client.synthesizeSpeech(
      text,
      { voiceName: options.voiceName },
    )
    await this.audioOutput.play(Buffer.from(result.audio), result.mimeType)
  }

  async transcribe(
    audio: ArrayBuffer,
    options: GeminiVoiceFallbackOptions = {},
    signal?: AbortSignal
  ): Promise<string> {
    return this.client.transcribe(
      audio,
      {
        mimeType: 'audio/wav',
        dictionary: [],
        language: options.language ?? 'auto'
      },
      signal
    )
  }

  stop(): void | Promise<void> {
    return this.audioOutput.stop?.()
  }
}
