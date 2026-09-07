import type {
  ChatMessage,
  ChatProvider,
  ToolCall,
  ToolDefinition
} from './chat'
import { GeminiApiError } from './gemini'
import { createTransport, type AiAuth, type GeminiTransport } from './vertex'

// Gemini 2.5 retires from 2026-10-16. 3.5 Flash is the replacement; verified to
// return function calls correctly with thinking disabled.
const CHAT_MODEL = 'gemini-3.5-flash'
const CHAT_TIMEOUT_MS = 120_000

interface GeminiPart {
  text?: unknown
  functionCall?: {
    name?: unknown
    args?: unknown
  }
}

function toolResponse(message: ChatMessage): object {
  try {
    const parsed = JSON.parse(message.content) as unknown
    return typeof parsed === 'object' && parsed !== null ? parsed : { result: parsed }
  } catch {
    return { result: message.content }
  }
}

function contents(messages: ChatMessage[]): object[] {
  return messages.map((message) => {
    if (message.role === 'tool') {
      return {
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: message.toolName ?? 'unknown_tool',
              response: toolResponse(message)
            }
          }
        ]
      }
    }
    return {
      role: message.role === 'model' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }
  })
}

/**
 * Gemini accepts a subset of JSON Schema and rejects the whole request — every
 * tool, not just the offending one — if it sees a keyword it does not know. One
 * `exclusiveMinimum` on a single parameter was enough to make every question the
 * assistant was asked fail with a 400.
 *
 * Unknown keywords are dropped rather than translated: a numeric bound is a nice
 * hint for the model, but the tools validate their own arguments anyway, so
 * losing the hint is harmless while losing the request is not.
 */
const SUPPORTED_SCHEMA_KEYS = new Set([
  'type',
  'format',
  'description',
  'nullable',
  'enum',
  'items',
  'properties',
  'required',
  'minimum',
  'maximum',
  'minItems',
  'maxItems',
  'propertyOrdering'
])

export function sanitizeSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeSchema)
  if (typeof value !== 'object' || value === null) return value

  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(source)) {
    if (key === 'properties' && typeof entry === 'object' && entry !== null) {
      // Property NAMES are arbitrary; only their schemas get filtered.
      const properties: Record<string, unknown> = {}
      for (const [name, schema] of Object.entries(entry as Record<string, unknown>)) {
        properties[name] = sanitizeSchema(schema)
      }
      result.properties = properties
      continue
    }
    if (!SUPPORTED_SCHEMA_KEYS.has(key)) continue
    result[key] = sanitizeSchema(entry)
  }

  // exclusiveMinimum/exclusiveMaximum carry a real constraint, so keep the
  // closest thing Gemini understands rather than silently widening the range.
  if (typeof source.exclusiveMinimum === 'number' && result.minimum === undefined) {
    result.minimum = source.exclusiveMinimum
  }
  if (typeof source.exclusiveMaximum === 'number' && result.maximum === undefined) {
    result.maximum = source.exclusiveMaximum
  }
  return result
}

async function responseError(response: Response): Promise<GeminiApiError> {
  const raw = await response.text().catch(() => '')
  let detail = raw
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: unknown } }
    if (typeof parsed.error?.message === 'string') detail = parsed.error.message
  } catch {
    // The raw response is still more useful than hiding the provider's reason.
  }
  return new GeminiApiError(
    `Gemini chat failed (${response.status})${detail ? `: ${detail}` : '.'}`,
    response.status,
    response.headers.get('retry-after') ?? undefined
  )
}

export class GeminiChatProvider implements ChatProvider {
  private readonly transport: GeminiTransport

  constructor(auth: string | AiAuth, private readonly fetcher: typeof fetch = fetch) {
    if (typeof auth === 'string') {
      if (!auth.trim()) throw new Error('Add your Gemini API key in Settings first.')
      auth = { kind: 'api-key', apiKey: auth }
    }
    this.transport = createTransport(auth, fetcher)
  }

  async send(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    signal?: AbortSignal
  ): Promise<{ text: string; calls: ToolCall[] }> {
    const timeout = AbortSignal.timeout(CHAT_TIMEOUT_MS)
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout
    const response = await this.fetcher(
      this.transport.nativeUrl(CHAT_MODEL),
      {
        method: 'POST',
        headers: {
          ...(await this.transport.nativeHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents(messages),
          // Vertex validates the proto strictly: a tool entry whose
          // functionDeclarations list is empty has "no tool type set" and the
          // whole request fails with 400 (the AI Studio endpoint tolerated it).
          // Callers with no tools — the daily brief, inbox classification —
          // therefore send no tools key at all.
          ...(tools.length > 0
            ? {
                tools: [
                  {
                    functionDeclarations: tools.map((tool) => ({
                      name: tool.name,
                      description: tool.description,
                      parameters: sanitizeSchema(tool.parameters)
                    }))
                  }
                ]
              }
            : {}),
          systemInstruction: {
            parts: [
              {
                text: 'You are the Octa Assistant. Answer in the language the user used. Use tools for factual personal data instead of guessing. Keep answers concise.'
              }
            ]
          },
          generationConfig: {
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 }
          }
        }),
        signal: requestSignal
      }
    )
    if (!response.ok) throw await responseError(response)
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>
    }
    const parts = payload.candidates?.[0]?.content?.parts ?? []
    const text = parts
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim()
    const calls = parts.flatMap((part): ToolCall[] => {
      const name = part.functionCall?.name
      if (typeof name !== 'string' || !name) return []
      const args = part.functionCall?.args
      return [
        {
          name,
          args:
            typeof args === 'object' && args !== null && !Array.isArray(args)
              ? (args as Record<string, unknown>)
              : {}
        }
      ]
    })
    return { text, calls }
  }
}
