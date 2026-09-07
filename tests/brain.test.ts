import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import Database from 'better-sqlite3'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CompanyBrain, estimateBrainTokens } from '../electron/core/octa/brain'

const directories: string[] = []
const brains: CompanyBrain[] = []
const databases: Database.Database[] = []

async function fixture(): Promise<{ root: string; vault: string; octa: string; knowledge: string }> {
  const root = await mkdtemp(join(tmpdir(), 'octa-brain-'))
  directories.push(root)
  const vault = join(root, 'vault')
  const octa = join(root, 'octa')
  const knowledge = join(vault, 'knowledge')
  await mkdir(knowledge, { recursive: true })
  return { root, vault, octa, knowledge }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function waitFor(check: () => Promise<boolean>, timeout = 2_500): Promise<void> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await check()) return
    await delay(40)
  }
  throw new Error('Timed out waiting for the brain mirror.')
}

afterEach(async () => {
  for (const brain of brains.splice(0)) brain.close()
  for (const database of databases.splice(0)) database.close()
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
describe('company brain mirror and injection', () => {
  it('copies knowledge initially and mirrors debounced source changes one way', async () => {
    const { vault, octa, knowledge } = await fixture()
    await mkdir(join(knowledge, 'offers'), { recursive: true })
    await writeFile(join(knowledge, 'company.md'), 'company-v1')
    await writeFile(join(knowledge, 'offers', 'site.md'), 'site-offer')

    const brain = new CompanyBrain({ vaultPath: vault, octaHome: octa, debounceMs: 35 })
    brains.push(brain)
    await brain.start()
    expect(await readFile(join(octa, 'knowledge', 'company.md'), 'utf8')).toBe('company-v1')

    await writeFile(join(knowledge, 'company.md'), 'company-v2')
    await waitFor(async () => (await readFile(join(octa, 'knowledge', 'company.md'), 'utf8')) === 'company-v2')

    await writeFile(join(octa, 'knowledge', 'job-output.md'), 'job output')
    await delay(120)
    await expect(readFile(join(knowledge, 'job-output.md'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('selects only the requested brain sections and marks capped text', async () => {
    const { vault, octa, knowledge } = await fixture()
    await mkdir(join(knowledge, 'clients'), { recursive: true })
    await mkdir(join(knowledge, 'offers'), { recursive: true })
    await mkdir(join(knowledge, 'personas'), { recursive: true })
    await mkdir(join(knowledge, 'competitors'), { recursive: true })
    await writeFile(join(knowledge, 'company.md'), 'COMPANY')
    await writeFile(join(knowledge, 'voice.md'), 'VOICE')
    await writeFile(join(knowledge, 'icp.md'), 'ICP')
    await writeFile(join(knowledge, 'clients', 'acme.md'), 'CLIENT')
    await writeFile(join(knowledge, 'offers', 'website.md'), 'OFFER')
    await writeFile(join(knowledge, 'pricing.md'), 'PRICING')
    await writeFile(join(knowledge, 'personas', 'buyer.md'), 'PERSONA')
    await writeFile(join(knowledge, 'competitors', 'rival.md'), 'COMPETITOR')

    const brain = new CompanyBrain({ vaultPath: vault, octaHome: octa })
    brains.push(brain)
    const sales = await brain.loadBrain({ client: 'Acme', kinds: ['sales'] })
    expect(sales).toContain('COMPANY')
    expect(sales).toContain('VOICE')
    expect(sales).toContain('ICP')
    expect(sales).toContain('CLIENT')
    expect(sales).toContain('OFFER')
    expect(sales).toContain('PRICING')
    expect(sales).not.toContain('PERSONA')
    expect(sales).not.toContain('COMPETITOR')

    const marketing = await brain.loadBrain({ kinds: ['marketing'] })
    expect(marketing).toContain('PERSONA')
    expect(marketing).toContain('COMPETITOR')
    expect(marketing).not.toContain('OFFER')
    expect(marketing).not.toContain('PRICING')

    await writeFile(join(knowledge, 'company.md'), 'long '.repeat(500))
    const capped = await brain.loadBrain({ tokenCap: 50 })
    expect(capped).toContain('[truncated]')
    expect(estimateBrainTokens(capped)).toBeLessThanOrEqual(50)
  })
})

describe('brain proposals', () => {
  it('keeps edits pending and writes to the vault only after approval', async () => {
    const { vault, octa, knowledge } = await fixture()
    await writeFile(join(knowledge, 'company.md'), 'original')
    const database = new Database(':memory:')
    databases.push(database)
    const brain = new CompanyBrain({ vaultPath: vault, octaHome: octa, database })
    brains.push(brain)

    const proposal = brain.proposeBrainEdit({
      targetFile: 'company.md',
      diffOrContent: 'approved content',
      sourceJob: 'job-42'
    })
    expect(proposal.status).toBe('pending')
    expect(brain.listProposals('pending')).toHaveLength(1)
    await expect(brain.applyProposal(proposal.id)).rejects.toThrow('approved')
    expect(await readFile(join(knowledge, 'company.md'), 'utf8')).toBe('original')

    brain.approveProposal(proposal.id)
    await brain.applyProposal(proposal.id)
    expect(await readFile(join(knowledge, 'company.md'), 'utf8')).toBe('approved content\n')
    expect(brain.getProposal(proposal.id)?.status).toBe('approved')

    const rejected = brain.proposeBrainEdit('new.md', 'never written')
    brain.rejectProposal(rejected.id)
    await expect(brain.applyProposal(rejected.id)).rejects.toThrow('approved')
    await expect(readFile(join(knowledge, 'new.md'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })
})
