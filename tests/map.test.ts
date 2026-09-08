import { afterEach, describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { SkillRegistry } from '../electron/core/skills/registry'
import type { JobRecord } from '../electron/types'
import {
  MAP_DEPARTMENTS,
  MAP_STATUS_COLORS,
  buildSkillRunForm,
  lastOutputsForSkill,
  layoutMap,
  latestJobBySkill,
  mapJobStatus,
  skillStatus,
  statusColor
} from '../src/components/map'

const libraryPath = join(process.cwd(), 'skills-library')
let registry: SkillRegistry | undefined

afterEach(() => {
  registry?.close()
  registry = undefined
})

function testJob(
  id: string,
  skill: string,
  status: JobRecord['status'],
  startedAt: string,
  result: unknown = null
): JobRecord {
  return {
    id,
    planId: null,
    workflow: null,
    stepId: null,
    skill,
    runner: 'codex-exec',
    department: 'marketing',
    status,
    autonomy: 'assisted',
    gate: 'none',
    input: {},
    result,
    review: null,
    sourceCount: 0,
    cost: null,
    startedAt,
    finishedAt: status === 'running' ? null : startedAt,
    approvedBy: null,
    approvedAt: null,
    error: null,
    workflowRunId: null,
    state: null,
    gatePayload: null,
    gateCreatedAt: null,
    gateExpiresAt: null,
    gateDecision: null,
    gateComments: null,
    attempt: 1,
  }
}

describe('skill map layout', () => {
  it('keeps all 87 visible skills and produces deterministic radial coordinates', () => {
    registry = new SkillRegistry({ skillsLibraryPath: libraryPath, watch: false })
    const skills = registry.listSkills()
    const startedAt = performance.now()
    const first = layoutMap(skills)
    const reversed = layoutMap([...skills].reverse())
    const layoutMilliseconds = performance.now() - startedAt

    expect(first.skills).toHaveLength(87)
    expect(first.departments.map((node) => node.label)).toEqual([...MAP_DEPARTMENTS])
    expect(first.nodes).toHaveLength(1 + MAP_DEPARTMENTS.length + 87)
    expect(first.links).toHaveLength(MAP_DEPARTMENTS.length + 87)
    expect(layoutMilliseconds).toBeLessThan(1_000)
    expect(first.skills.map(({ id, x, y }) => ({ id, x, y }))).toEqual(
      reversed.skills.map(({ id, x, y }) => ({ id, x, y }))
    )
    expect(first.center.label).toBe('Octa brain')
  })
})

describe('skill map status mapping', () => {
  it('assigns a distinct color to every visual state and uses the latest run', () => {
    const statuses = ['never', 'ok', 'failed', 'needs_approval', 'running'] as const
    expect(new Set(statuses.map((status) => statusColor(status))).size).toBe(statuses.length)
    for (const status of statuses) expect(statusColor(status)).toBe(MAP_STATUS_COLORS[status])

    const jobs = [
      testJob('old', 'copywriting', 'ok', '2026-09-01T10:00:00.000Z'),
      testJob('new', 'copywriting', 'failed', '2026-09-02T10:00:00.000Z'),
      testJob('live', 'frontend-ui-polisher', 'running', '2026-09-03T10:00:00.000Z')
    ]
    expect(latestJobBySkill(jobs).get('copywriting')?.id).toBe('new')
    expect(skillStatus('copywriting', jobs)).toBe('failed')
    expect(skillStatus('frontend-ui-polisher', jobs)).toBe('running')
    expect(skillStatus('missing', jobs)).toBe('never')
    expect(mapJobStatus('needs_input')).toBe('failed')
  })

  it('returns the three newest output files for a skill', () => {
    const jobs = [
      testJob('older', 'copywriting', 'ok', '2026-09-01T10:00:00.000Z', {
        outputs: [{ path: 'out/one.md', type: 'markdown', title: 'One' }, { path: 'out/two.md', type: 'markdown', title: 'Two' }]
      }),
      testJob('newer', 'copywriting', 'ok', '2026-09-02T10:00:00.000Z', {
        outputs: [{ path: 'out/three.md', type: 'markdown', title: 'Three' }, { path: 'out/four.md', type: 'markdown', title: 'Four' }]
      })
    ]
    expect(lastOutputsForSkill('copywriting', jobs)).toEqual([
      { path: 'out/three.md', type: 'markdown', title: 'Three' },
      { path: 'out/four.md', type: 'markdown', title: 'Four' },
      { path: 'out/one.md', type: 'markdown', title: 'One' }
    ])
  })
})

describe('skill map run forms', () => {
  it('generates description and argument-hint fields from three real skills', () => {
    registry = new SkillRegistry({ skillsLibraryPath: libraryPath, watch: false })
    const names = ['frontend-ui-polisher', 'speckit-specify', 'speckit-checklist']
    const hints = [
      '[{{command_hint}}] [target]',
      'Describe the feature you want to specify',
      'Domain or focus area for the checklist'
    ]

    names.forEach((name, index) => {
      const skill = registry?.getSkill(name)
      if (!skill) throw new Error(`Expected real skill ${name}`)
      const form = buildSkillRunForm(skill)
      expect(form.skill).toBe(name)
      expect(form.description).toBe(skill.description)
      expect(form.argumentHint).toBe(hints[index])
      expect(form.fields).toEqual([{ name: 'text', type: 'textarea', placeholder: hints[index] }])
    })
  })
})
