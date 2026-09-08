import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../electron/types'
import { VoiceController } from '../electron/core/dictation'
import { ReadBackApprovalGate, VOICE_APPROVAL_TTL_MS } from '../electron/core/voice/readback'

describe('voice approval read-back gate', () => {
  it('accepts approve only for the exact payload within sixty seconds', async () => {
    let now = 10_000
    const speak = vi.fn<(text: string) => void>()
    const gate = new ReadBackApprovalGate(() => now)
    const payload = { invoice: 'INV-7', total: 1250, currency: 'EGP' }

    expect(gate.approve('موافق')).toMatchObject({ approved: false, reason: 'readback-required' })
    await gate.readBack(payload, 'Invoice INV-7 — EGP 1,250', speak, 'gate-7')
    expect(speak).toHaveBeenCalledWith('Invoice INV-7 — EGP 1,250')
    expect(gate.approve('موافق', { currency: 'EGP', total: 1250, invoice: 'INV-7' })).toMatchObject({
      approved: true,
      gateId: 'gate-7',
      channel: 'voice'
    })

    expect(gate.approve('approve', { invoice: 'INV-8', total: 1250, currency: 'EGP' })).toMatchObject({
      approved: false,
      reason: 'payload-mismatch'
    })
    now += VOICE_APPROVAL_TTL_MS + 1
    expect(gate.approve('approve', payload)).toMatchObject({ approved: false, reason: 'expired' })
  })

  it('routes a valid spoken approval to the workflow gate with the voice channel', async () => {
    const detector = {
      frameLength: 512,
      start: vi.fn(),
      feedPcm: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn()
    }
    const approveGate = vi.fn(() => ({
      gateId: 'gate-voice',
      payload: { action: 'publish' },
      channel: 'voice' as const,
      status: 'approved' as const,
      approvedAt: new Date().toISOString()
    }))
    const controller = new VoiceController({
      settings: () => DEFAULT_SETTINGS,
      detector,
      createSession: () => ({
        open: vi.fn(),
        sendPcm: vi.fn(),
        sendText: vi.fn(),
        interrupt: vi.fn(),
        close: vi.fn()
      }),
      fallback: { speak: vi.fn() },
      approveGate
    })

    await controller.readBackPayload({ action: 'publish' }, 'Publish the approved payload.', 'gate-voice')
    const result = await controller.approveTranscript('approve')
    expect(result).toMatchObject({ approved: true, channel: 'voice', gateId: 'gate-voice' })
    expect(approveGate).toHaveBeenCalledWith({
      gateId: 'gate-voice',
      payload: { action: 'publish' },
      channel: 'voice'
    })
  })
})
