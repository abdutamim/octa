import { createHash } from 'node:crypto'

export const VOICE_APPROVAL_TTL_MS = 60_000

export type SpeakFunction = (text: string) => void | Promise<void>

export interface ReadBackRecord {
  payloadKey: string
  payloadText: string
  payload: unknown
  gateId: string | null
  spokenAt: number
  expiresAt: number
}

export type ApprovalResult =
  | { approved: true; gateId: string | null; payload: unknown; channel: 'voice' }
  | { approved: false; reason: 'not-approval' | 'readback-required' | 'expired' | 'payload-mismatch' }

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonical(entry)])
  )
}

export function serializePayload(payload: unknown): string {
  if (typeof payload === 'string') return payload
  const encoded = JSON.stringify(canonical(payload))
  return encoded ?? String(payload)
}

export function payloadKey(payload: unknown): string {
  return createHash('sha256').update(serializePayload(payload), 'utf8').digest('hex')
}

export function isApprovalPhrase(text: string): boolean {
  const normalized = text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[.!؟?،,؛;:]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
  return /^(?:approve|approved|yes[, ]+approve|موافق|موافقة|أوافق|اوافق)$/u.test(normalized)
}

/** Enforces the exact-payload, 60-second voice approval rule. */
export class ReadBackApprovalGate {
  private lastReadBack: ReadBackRecord | undefined

  constructor(private readonly clock: () => number = Date.now) {}

  get current(): ReadBackRecord | null {
    return this.lastReadBack ? { ...this.lastReadBack } : null
  }

  async readBack(
    payload: unknown,
    text: string,
    speak?: SpeakFunction,
    gateId?: string
  ): Promise<ReadBackRecord> {
    const payloadText = text.trim() || serializePayload(payload)
    if (speak) await speak(payloadText)
    return this.recordReadBack(payload, payloadText, gateId)
  }

  recordReadBack(payload: unknown, text: string, gateId?: string, spokenAt = this.clock()): ReadBackRecord {
    const record: ReadBackRecord = {
      payloadKey: payloadKey(payload),
      payloadText: text,
      payload,
      gateId: gateId?.trim() || null,
      spokenAt,
      expiresAt: spokenAt + VOICE_APPROVAL_TTL_MS
    }
    this.lastReadBack = record
    return { ...record }
  }

  approve(transcript: string, payload?: unknown, at = this.clock()): ApprovalResult {
    if (!isApprovalPhrase(transcript)) return { approved: false, reason: 'not-approval' }
    const record = this.lastReadBack
    if (!record) return { approved: false, reason: 'readback-required' }
    if (at > record.expiresAt) return { approved: false, reason: 'expired' }
    if (payload !== undefined && payloadKey(payload) !== record.payloadKey) {
      return { approved: false, reason: 'payload-mismatch' }
    }
    return {
      approved: true,
      gateId: record.gateId,
      payload: payload ?? record.payload,
      channel: 'voice'
    }
  }

  clear(): void {
    this.lastReadBack = undefined
  }
}

export const ApproveAfterReadBackGate = ReadBackApprovalGate
