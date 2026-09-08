import type { ReadBackApprovalGate } from './readback'

export interface WorkflowGateApproveRequest {
  gateId: string
  payload: unknown
  channel: 'in-app' | 'ntfy' | 'voice'
}

export interface WorkflowGateApproval extends WorkflowGateApproveRequest {
  status: 'approved'
  approvedAt: string
}

function gateId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('A workflow gate id is required.')
  return value.trim().slice(0, 256)
}

/** Minimal gate port used by spec 007 until the full workflow runner owns it. */
export class WorkflowGateRegistry {
  private readonly approvals = new Map<string, WorkflowGateApproval>()

  approve(request: WorkflowGateApproveRequest): WorkflowGateApproval {
    if (request.channel !== 'in-app' && request.channel !== 'ntfy' && request.channel !== 'voice') {
      throw new Error('The workflow approval channel is invalid.')
    }
    const approval: WorkflowGateApproval = {
      gateId: gateId(request.gateId),
      payload: request.payload,
      channel: request.channel,
      status: 'approved',
      approvedAt: new Date().toISOString()
    }
    this.approvals.set(approval.gateId, approval)
    return { ...approval }
  }

  get(gateIdValue: string): WorkflowGateApproval | null {
    return this.approvals.get(gateIdValue.trim()) ?? null
  }
}

export type VoiceGateApprover = (
  request: WorkflowGateApproveRequest
) => WorkflowGateApproval | Promise<WorkflowGateApproval>

export function approvalRequestFromReadBack(
  gate: ReadBackApprovalGate,
  result: { gateId: string | null; payload: unknown }
): WorkflowGateApproveRequest | null {
  if (!result.gateId) return null
  return { gateId: result.gateId, payload: result.payload, channel: 'voice' }
}
