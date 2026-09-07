import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { IntakeInterview, INTAKE_BLOCKS, INTAKE_QUESTIONS, writeClientIntake, writeIntakeFiles } from '../electron/core/octa/intake'
import { SettingsRepository } from '../electron/db/settings'
import { en } from '../src/i18n/en'

const directories: string[] = []
const repositories: SettingsRepository[] = []

async function tempVault(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'octa-intake-'))
  directories.push(root)
  return root
}

afterEach(async () => {
  for (const repository of repositories.splice(0)) repository.close()
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
const answers: Record<string, string> = {
  companyServices: 'Websites and launch campaigns',
  companyPitch: 'I build useful websites for growing teams.',
  bestAndWorstClients: 'Best: Acme. Worst: projects without a decision maker.',
  outOfScope: 'Unpaid emergency work.',
  offers: 'Website build: strategy, design, and delivery | 4 weeks | $3,000',
  ticketRange: '$5,000 highest; $500 lowest; $3,000 most frequent.',
  negotiation: 'Scope and payment timing.',
  idealClient: 'A decisive B2B founder with a small marketing team.',
  objections: 'Price, timing, trust, scope, and internal approval.',
  badFit: 'A client who wants unlimited revisions.',
  brandPersonality: 'Clear, warm, direct; never vague, cold, or boastful.',
  words: 'Avoid hype; use strategy and conversion in English.',
  postExamples: 'Loved the practical teardown; embarrassed by the vague announcement.',
  clientJourney: 'Message, call, proposal, deposit, kickoff.',
  delivery: 'Weekly delivery with two revision rounds.',
  invoicing: 'Invoice at kickoff in USD; payment due in 7 days; send one reminder.',
  tools: 'Notion, Meta, Obsidian, Photoshop.',
  goals: '$30k in 90 days and $150k in one year.',
  timeEaters: 'Chasing approvals.',
  octaPriority: 'Turn plans into finished work.'
}

describe('intake interview and writer', () => {
  it('keeps the exact Arabic questions grouped A–F and translates them in i18n', () => {
    expect(INTAKE_QUESTIONS).toHaveLength(20)
    expect(Object.fromEntries(Object.entries(INTAKE_BLOCKS).map(([key, value]) => [key, value.length]))).toEqual({
      A: 4,
      B: 3,
      C: 3,
      D: 3,
      E: 4,
      F: 3
    })
    expect(INTAKE_QUESTIONS[0].arabic).toBe('تميم بتعمل إيه بالظبط دلوقتي، ولمين؟ (خدمة خدمة)')
    expect(en.intakeQuestion1).toBe('What exactly do you do right now, and for whom? (service by service)')
    expect(en.intakeQuestion20).toContain('Octa')
  })

  it('writes the expected company brain layout and resumes from SQLite settings', async () => {
    const vaultPath = await tempVault()
    const written = await writeIntakeFiles({ vaultPath, answers })
    expect(written).toContain('knowledge/company.md')
    expect(written).toContain('knowledge/icp.md')
    expect(written).toContain('knowledge/voice.md')
    expect(written).toContain('knowledge/pricing.md')
    expect(written).toContain('knowledge/offers/website-build.md')
    expect(written).toContain('knowledge/sops/client-journey.md')
    expect(written).toContain('knowledge/sops/delivery.md')
    expect(written).toContain('knowledge/sops/invoicing.md')
    expect(written).toContain('knowledge/sops/tools.md')
    expect(await readFile(join(vaultPath, 'knowledge', 'company.md'), 'utf8')).toContain(answers.companyPitch)
    expect(await readFile(join(vaultPath, 'knowledge', 'pricing.md'), 'utf8')).toContain(answers.ticketRange)

    const repository = new SettingsRepository(':memory:')
    repositories.push(repository)
    const interview = new IntakeInterview({ vaultPath, settings: repository })
    expect(interview.next()?.number).toBe(1)
    await interview.answer('saved first answer')
    const resumed = new IntakeInterview({ vaultPath, settings: repository })
    expect(resumed.getState()?.currentQuestion).toBe(2)
    expect(resumed.next()?.number).toBe(2)
  })

  it('writes a safe per-client file with the short intake fields', async () => {
    const vaultPath = await tempVault()
    const path = await writeClientIntake({
      vaultPath,
      name: 'Acme & Co',
      answers: {
        brandAssetsFolder: 'C:\\Brands\\Acme',
        contactsRoles: 'Mona — approval',
        whatTheyBought: 'Website build',
        projectDeadline: 'Launch by 2026-10-01',
        audience: 'Property developers',
        voiceDifferences: 'More formal than Tamim',
        hardDonts: 'No unapproved claims',
        approvalPerson: 'Mona',
        invoicingDetails: 'USD, net 7',
        links: 'https://acme.example'
      }
    })
    expect(path).toBe('knowledge/clients/acme-co.md')
    const content = await readFile(join(vaultPath, 'knowledge', 'clients', 'acme-co.md'), 'utf8')
    expect(content).toContain('Property developers')
    expect(content).toContain('No unapproved claims')
    expect(await readdir(join(vaultPath, 'knowledge', 'clients'))).toEqual(['acme-co.md'])
  })
})
