import { describe, expect, it, vi } from 'vitest'
import { GeminiChatProvider } from '../electron/cloud/gemini-chat'

describe('Gemini chat provider', () => {
  it('parses function-call parts into provider-neutral calls', async () => {
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  { text: 'Let me check.' },
                  {
                    functionCall: {
                      name: 'get_network_usage',
                      args: { period: 'today' }
                    }
                  }
                ]
              }
            }
          ]
        }),
        { status: 200 }
      )
    )
    const provider = new GeminiChatProvider('test-key', fetcher)

    const response = await provider.send(
      [{ role: 'user', content: 'How much data today?' }],
      [
        {
          name: 'get_network_usage',
          description: 'usage',
          parameters: { type: 'object' },
          execute: async () => undefined
        }
      ]
    )

    expect(response).toEqual({
      text: 'Let me check.',
      calls: [{ name: 'get_network_usage', args: { period: 'today' } }]
    })
  })

  it('sends no tools key at all when the caller has no tools', async () => {
    // Vertex rejects `tools: [{ functionDeclarations: [] }]` with HTTP 400
    // ("tool_type must have one initialized field"); the daily brief and inbox
    // classification call without tools, and were failing on every run.
    const fetcher = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'brief' }] } }] }), {
          status: 200
        })
    )
    const provider = new GeminiChatProvider('test-key', fetcher)

    await provider.send([{ role: 'user', content: 'Write the brief.' }], [])

    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)) as Record<string, unknown>
    expect(body).not.toHaveProperty('tools')
    expect(body.contents).toBeDefined()
  })
})
