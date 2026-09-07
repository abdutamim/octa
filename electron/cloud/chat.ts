export interface ToolDefinition {
  name: string
  description: string
  parameters: object
  execute(args: Record<string, unknown>): Promise<unknown>
  requiresConfirmation?: boolean
  confirmationLabel?: (args: Record<string, unknown>) => string
}

export interface ChatMessage {
  role: 'user' | 'model' | 'tool'
  content: string
  toolName?: string
}

export interface ToolCall {
  name: string
  args: Record<string, unknown>
}

export interface ChatProvider {
  send(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    signal?: AbortSignal
  ): Promise<{ text: string; calls: ToolCall[] }>
}
