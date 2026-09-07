import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import type { ChatMessage, ChatProvider, ToolCall, ToolDefinition } from './chat'

// Drives the locally-installed Codex CLI (`codex exec`) as a subprocess. This is
// the only sanctioned way to reach ChatGPT-subscription models: the subscription
// grants no API key, and its OAuth tokens belong to the CLI. Everything runs
// locally against the user's own signed-in CLI.
//
// Trade-off vs Gemini: a call costs ~10-25 s instead of ~1-2 s, because every
// invocation boots a fresh agent session. Good for unattended work (the 8am daily
// brief); usable but slow for interactive chat, where it serves as the fallback
// when Gemini is rate-limited or over its spending cap.

const CODEX_TIMEOUT_MS = 300_000

// Strict structured-output mode requires additionalProperties:false everywhere,
// so tool arguments travel as a JSON *string* rather than a free-form object.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    calls: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          argsJson: { type: 'string' }
        },
        required: ['name', 'argsJson'],
        additionalProperties: false
      }
    }
  },
  required: ['text', 'calls'],
  additionalProperties: false
}

export class CodexUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CodexUnavailableError'
  }
}

// npm global installs put codex.cmd on PATH, but a packaged Electron app does not
// always inherit the user's full PATH, so check the usual npm prefix too.
export function resolveCodexBinary(): string | undefined {
  const candidates: string[] = []
  const appData = process.env.APPDATA
  if (appData) {
    candidates.push(join(appData, 'npm', 'codex.cmd'), join(appData, 'npm', 'codex'))
  }
  for (const entry of (process.env.PATH ?? '').split(delimiter)) {
    if (!entry) continue
    candidates.push(join(entry, 'codex.cmd'), join(entry, 'codex.exe'), join(entry, 'codex'))
  }
  return candidates.find((candidate) => existsSync(candidate))
}

export function isCodexAvailable(): boolean {
  return resolveCodexBinary() !== undefined
}

function renderPrompt(messages: ChatMessage[], tools: ToolDefinition[]): string {
  const parts: string[] = []
  if (tools.length > 0) {
    parts.push(
      'You are an assistant that can call tools. Available tools:',
      ...tools.map(
        (tool) =>
          `- ${tool.name}: ${tool.description}\n  parameters (JSON Schema): ${JSON.stringify(tool.parameters)}`
      ),
      '',
      'If tools are needed, return them in calls[] with argsJson as a JSON string of the arguments, and leave text empty.',
      'If no tool is needed, answer the user directly in text and leave calls empty.',
      'Answer from the conversation only. Do not read or modify files, and do not run commands.',
      ''
    )
  } else {
    parts.push('Answer directly. Do not read or modify files, and do not run commands.', '')
  }

  parts.push('Conversation:')
  for (const message of messages) {
    if (message.role === 'tool') {
      parts.push(`[tool result: ${message.toolName ?? 'unknown'}]\n${message.content}`)
    } else {
      parts.push(`${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
    }
  }
  return parts.join('\n')
}

export class CodexChatProvider implements ChatProvider {
  constructor(private readonly binary = resolveCodexBinary()) {}

  async send(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    signal?: AbortSignal
  ): Promise<{ text: string; calls: ToolCall[] }> {
    const binary = this.binary
    if (!binary) {
      throw new CodexUnavailableError(
        'Codex CLI was not found. Install it with "npm i -g @openai/codex" and sign in with "codex login".'
      )
    }

    const workDir = join(tmpdir(), `octa-codex-${randomUUID()}`)
    await mkdir(workDir, { recursive: true })
    const schemaPath = join(workDir, 'schema.json')
    const outputPath = join(workDir, 'out.json')
    const cleanup = (): Promise<void> =>
      rm(workDir, { recursive: true, force: true }).then(
        () => undefined,
        () => undefined
      )

    try {
      await writeFile(schemaPath, JSON.stringify(RESPONSE_SCHEMA), 'utf8')
      await this.runCodex(binary, workDir, schemaPath, outputPath, renderPrompt(messages, tools), signal)

      const raw = await readFile(outputPath, 'utf8').catch(() => '')
      if (!raw.trim()) throw new Error('Codex returned an empty response.')

      const parsed = JSON.parse(raw) as {
        text?: unknown
        calls?: Array<{ name?: unknown; argsJson?: unknown }>
      }
      const calls: ToolCall[] = (parsed.calls ?? [])
        .filter((call): call is { name: string; argsJson: string } =>
          typeof call?.name === 'string' && typeof call.argsJson === 'string'
        )
        .map((call) => {
          let args: Record<string, unknown> = {}
          try {
            const decoded = JSON.parse(call.argsJson) as unknown
            if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
              args = decoded as Record<string, unknown>
            }
          } catch {
            // A malformed argument blob is better treated as "no arguments" than
            // as a hard failure of the whole turn.
          }
          return { name: call.name, args }
        })

      return { text: typeof parsed.text === 'string' ? parsed.text : '', calls }
    } finally {
      await cleanup()
    }
  }

  private runCodex(
    binary: string,
    workDir: string,
    schemaPath: string,
    outputPath: string,
    prompt: string,
    signal?: AbortSignal
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason)
        return
      }
      const child = spawn(
        binary,
        [
          'exec',
          '--skip-git-repo-check',
          '--sandbox',
          'read-only',
          '--cd',
          workDir,
          '--output-schema',
          schemaPath,
          '--output-last-message',
          outputPath,
          '-'
        ],
        { windowsHide: true, shell: binary.endsWith('.cmd') }
      )

      let stderr = ''
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString()
      })
      let stdout = ''
      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString()
      })

      const timer = setTimeout(() => {
        child.kill()
        reject(new Error('Codex timed out.'))
      }, CODEX_TIMEOUT_MS)
      const onAbort = (): void => {
        child.kill()
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      const done = (): void => {
        clearTimeout(timer)
        signal?.removeEventListener('abort', onAbort)
      }

      child.on('error', (error) => {
        done()
        reject(error)
      })
      child.on('close', (code) => {
        done()
        if (code === 0) {
          resolve()
          return
        }
        // Codex reports API problems as an ERROR line on stdout rather than a
        // non-zero-only stderr, so surface whichever carries the detail.
        const detail = /"message":\s*"([^"]+)"/.exec(`${stdout}\n${stderr}`)?.[1]
        reject(new Error(detail ? `Codex failed: ${detail}` : `Codex exited with code ${code}.`))
      })

      child.stdin?.end(prompt)
    })
  }
}
