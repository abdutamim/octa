import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { OperationsRepository } from '../electron/db/operations'

const directories: string[] = []

async function repository(): Promise<{ path: string; repository: OperationsRepository }> {
  const path = await mkdtemp(join(tmpdir(), 'tamim-ops-'))
  directories.push(path)
  return { path, repository: new OperationsRepository(join(path, 'ops.db')) }
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

describe('operations storage', () => {
  it('updates a duplicate URL instead of creating a second link', async () => {
    const { repository: operations } = await repository()
    operations.upsertLink({
      url: 'https://example.com/',
      title: 'First',
      summary: 'One',
      tags: [],
      project: '',
      notePath: null,
      readable: true
    })
    operations.upsertLink({
      url: 'https://example.com/',
      title: 'Updated',
      summary: 'Two',
      tags: ['saved'],
      project: '',
      notePath: null,
      readable: true
    })

    expect(operations.listLinks()).toHaveLength(1)
    expect(operations.listLinks()[0].title).toBe('Updated')
    operations.close()
  })

  it('numbers invoices sequentially per year inside storage transactions', async () => {
    const { repository: operations } = await repository()
    const client = operations.saveClient({ name: 'Client' })
    const input = {
      clientId: client.id,
      currency: 'USD' as const,
      issuedAt: new Date('2026-06-01T12:00:00').getTime(),
      dueAt: new Date('2026-06-15T12:00:00').getTime(),
      items: [{ description: 'Build', qty: 1, unitPrice: 125_000 }]
    }

    expect(operations.createInvoice(input).number).toBe('2026-001')
    expect(operations.createInvoice(input).number).toBe('2026-002')
    operations.close()
  })

  it('rejects floating point minor units before an invoice reaches SQLite', async () => {
    const { repository: operations } = await repository()
    const client = operations.saveClient({ name: 'Client' })

    expect(() => operations.createInvoice({
      clientId: client.id,
      currency: 'EGP',
      issuedAt: Date.now(),
      dueAt: Date.now() + 1_000,
      items: [{ description: 'Work', qty: 1, unitPrice: 10.5 }]
    })).toThrow('integer minor units')
    operations.close()
  })

})
