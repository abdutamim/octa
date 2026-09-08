import { describe, expect, it, vi } from 'vitest'
import {
  GeminiApiError,
  GeminiClient,
  isGeminiRateLimitError
} from '../electron/cloud/gemini'

function mockFetch(response: Response): typeof fetch {
  return vi.fn(async () => response) as unknown as typeof fetch
}

describe('Gemini cleanup pipeline', () => {
  it('streams cleanup deltas into the review callback', async () => {
    const stream = [
      'data: {"choices":[{"delta":{"content":"Hello "}}]}',
      '',
      'data: {"choices":[{"delta":{"content":"world."}}]}',
      '',
      'data: [DONE]',
      '',
      ''
    ].join('\n')
    const fetcher = mockFetch(
      new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
    )
    const client = new GeminiClient('test_api_key', fetcher)
    const updates: string[] = []

    const result = await client.cleanup('hello world', (text) => updates.push(text))

    expect(result).toBe('Hello world.')
    expect(updates).toEqual(['Hello ', 'Hello world.'])
    const [url, init] = vi.mocked(fetcher).mock.calls[0]
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test_api_key' })
    const body = JSON.parse(init?.body as string) as { model: string; stream: boolean }
    expect(body.model).toBe('gemini-3.5-flash-lite')
    expect(body.stream).toBe(true)
  })

  it('surfaces HTTP 429 as a rate-limit error with retry timing', async () => {
    const client = new GeminiClient(
      'test_api_key',
      mockFetch(
        new Response(JSON.stringify({ error: { message: 'Too many requests' } }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'retry-after': '3'
          }
        })
      )
    )

    const error = await client.cleanup('hello world', () => undefined).catch((value: unknown) => value)

    expect(error).toBeInstanceOf(GeminiApiError)
    expect(isGeminiRateLimitError(error)).toBe(true)
    expect((error as GeminiApiError).retryAfter).toBe('3')
    expect((error as Error).message).toContain('rate limit')
  })

  it('rejects an empty API key before making a request', () => {
    expect(() => new GeminiClient('')).toThrow('Add your Gemini API key in Settings first.')
  })
})

describe('Gemini transcription', () => {
  it('sends audio to generateContent and returns the transcript text', async () => {
    const fetcher = mockFetch(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '  هنعمل commit كمان  ' }] } }]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const client = new GeminiClient('test_api_key', fetcher)
    const audio = new Uint8Array([1, 2, 3, 4]).buffer

    const result = await client.transcribe(audio, {
      mimeType: 'audio/webm;codecs=opus',
      dictionary: ['commit'],
      language: 'auto'
    })

    expect(result).toBe('هنعمل commit كمان')
    const [url, init] = vi.mocked(fetcher).mock.calls[0]
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent'
    )
    expect(init?.headers).toMatchObject({ 'x-goog-api-key': 'test_api_key' })
    const body = JSON.parse(init?.body as string) as {
      contents: Array<{ parts: Array<{ text?: string; inline_data?: { mime_type: string } }> }>
    }
    const inline = body.contents[0].parts.find((part) => part.inline_data)
    expect(inline?.inline_data?.mime_type).toBe('audio/webm')
  })

  it('transcribes a small uploaded file inline and allows an empty result', async () => {
    const fetcher = mockFetch(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'مرحبا world' }] } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    )
    const client = new GeminiClient('test_api_key', fetcher)

    const result = await client.transcribeMedia(Buffer.from([1, 2, 3, 4]), 'audio/mp3')

    expect(result).toBe('مرحبا world')
    // A single inline request — the Files API is not used for small files.
    expect(vi.mocked(fetcher).mock.calls).toHaveLength(1)
    const [url, init] = vi.mocked(fetcher).mock.calls[0]
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent'
    )
    const body = JSON.parse(init?.body as string) as {
      contents: Array<{ parts: Array<{ inline_data?: { mime_type: string } }> }>
    }
    expect(body.contents[0].parts.find((p) => p.inline_data)?.inline_data?.mime_type).toBe('audio/mp3')
  })

  it('surfaces an HTTP error from the transcription endpoint', async () => {
    const client = new GeminiClient(
      'test_api_key',
      mockFetch(
        new Response(JSON.stringify({ error: { message: 'bad audio' } }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    )
    const audio = new Uint8Array([1, 2, 3, 4]).buffer

    const error = await client
      .transcribe(audio, { mimeType: 'audio/webm', dictionary: [], language: 'auto' })
      .catch((value: unknown) => value)

    expect(error).toBeInstanceOf(GeminiApiError)
    expect((error as GeminiApiError).status).toBe(400)
  })
})

describe('Gemini voice fallback TTS', () => {
  it('requests native audio from the configured fallback model', async () => {
    const fetcher = mockFetch(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AQID' } }] } }]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const client = new GeminiClient('test_api_key', fetcher)
    const result = await client.synthesizeSpeech('Read this payload back.')

    expect(new Uint8Array(result.audio)).toEqual(new Uint8Array([1, 2, 3]))
    expect(result.mimeType).toBe('audio/pcm;rate=24000')
    const [url, init] = vi.mocked(fetcher).mock.calls[0]
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent')
    const body = JSON.parse(init?.body as string) as { generationConfig: { responseModalities: string[] } }
    expect(body.generationConfig.responseModalities).toEqual(['AUDIO'])
  })
})
