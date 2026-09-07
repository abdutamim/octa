import type { ChatMessage, ChatProvider, ToolCall, ToolDefinition } from './chat'

// Errors that mean "this provider is out of capacity", as opposed to a genuine
// problem with the request. Only these are worth retrying on another provider —
// retrying a malformed request would just burn the fallback's quota too.
function isCapacityError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    /\b429\b/.test(message) ||
    /rate limit/i.test(message) ||
    /quota/i.test(message) ||
    /spending cap/i.test(message) ||
    /exceeded/i.test(message) ||
    /\b(?:500|502|503|504)\b/.test(message) ||
    /overloaded|unavailable/i.test(message)
  )
}

export interface FallbackEvent {
  from: string
  to: string
  reason: string
}

// Tries the primary provider and falls back to the secondary when the primary is
// out of capacity. This is what keeps the app usable when the Gemini billing cap
// is hit — previously that took down dictation cleanup, the daily brief, the
// assistant and screenshot reading all at once, silently.
export class FallbackChatProvider implements ChatProvider {
  constructor(
    private readonly primary: { name: string; provider: ChatProvider },
    private readonly secondary: { name: string; provider: () => ChatProvider | undefined },
    private readonly onFallback?: (event: FallbackEvent) => void
  ) {}

  async send(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    signal?: AbortSignal
  ): Promise<{ text: string; calls: ToolCall[] }> {
    try {
      return await this.primary.provider.send(messages, tools, signal)
    } catch (error) {
      if (!isCapacityError(error)) throw error
      const backup = this.secondary.provider()
      if (!backup) throw error
      const reason = error instanceof Error ? error.message : String(error)
      this.onFallback?.({ from: this.primary.name, to: this.secondary.name, reason })
      return backup.send(messages, tools, signal)
    }
  }
}

export { isCapacityError }
