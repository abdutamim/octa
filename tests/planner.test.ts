import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { JobsRepository } from '../electron/db/jobs'
import {
  compileBriefContent,
  Planner,
  type OctaPlan,
  type PlanCritique,
  type PlannerRunner,
  type PlannerRunnerRequest,
  validateCritique,
  validatePlan,
  validatePlanForExecution
} from '../electron/core/octa/planner'

const fixtureRoot = join(process.cwd(), 'tests', 'fixtures', 'planner')
let root: string | undefined
let jobs: JobsRepository | undefined

afterEach(() => {
  jobs?.close()
  jobs = undefined
  if (root) rmSync(root, { recursive: true, force: true })
  root = undefined
})

function planFor(
  request: PlannerRunnerRequest,
  summary: string,
  questions: OctaPlan['questions'] = [],
  language: OctaPlan['language'] = 'en'
): OctaPlan {
  return {
    plan_id: request.planId,
    language,
    summary,
    questions,
    assumptions: [],
    workflow: 'custom',
    steps: [{
      id: 's1',
      runner: 'codex-exec',
      prompt: 'Carry out the approved work and write the deliverable to ./out.',
      needs: [],
      gate: 'review',
      autonomy: 'assisted',
      acceptance: ['out/deliverable.md exists']
    }],
    deliverables: ['out/deliverable.md'],
    estimated_minutes: 20
  }
}

class FakeRunner {
  readonly calls: PlannerRunnerRequest[] = []
  constructor(private readonly mode: 'ambiguous' | 'complete' | 'weak' | 'always-revise' | 'invalid' | 'question-loop' | 'arabic-demo') {}

  async run(request: PlannerRunnerRequest): Promise<unknown> {
    this.calls.push(request)
    if (this.mode === 'invalid' && this.calls.length === 1) return 'not valid JSON'
    if (request.runner === 'claude-plan' && request.phase === 'draft') {
      if (this.mode === 'arabic-demo') {
        return planFor(request, 'هجهز مسودة خطة تسويق للمشروع بعد تحديد القرارات الأساسية.', [
          { id: 'q1', text: 'المشروع الجديد عبارة عن إيه بالضبط، وإيه المنتج أو الخدمة اللي بنسوّق لها؟', why: 'لازم نفهم العرض قبل اختيار الرسالة والقنوات.', options: [], blocking: true },
          { id: 'q2', text: 'مين الجمهور المستهدف أو العميل المثالي؟', why: 'الجمهور بيحدد الرسالة وأولوية القنوات.', options: [], blocking: true },
          { id: 'q3', text: 'إيه الهدف الأساسي من التسويق في المرحلة دي؟', why: 'من غير هدف واضح مش هنقدر نحدد مخرجات قابلة للمراجعة.', options: [], blocking: true },
          { id: 'q4', text: 'هنشتغل في أنهي سوق أو بلد، وبأي لغة؟', why: 'السوق واللغة بيغيروا البحث والرسائل والتنفيذ.', options: [], blocking: true },
          { id: 'q5', text: 'الميزانية والمدة الزمنية المتاحة قد إيه؟', why: 'الميزانية والموعد بيحددوا نطاق الخطة.', options: [], blocking: true },
          { id: 'q6', text: 'إيه القنوات المسموح نستخدمها، ومين صاحب الموافقة النهائية قبل النشر؟', why: 'أي نشر أو تواصل خارجي يحتاج حدود وقبول واضحين.', options: [], blocking: true }
        ], 'ar-EG')
      }
      if (this.mode === 'ambiguous' || this.mode === 'question-loop') {
        const rounds = [...request.prompt.matchAll(/question round (\d+)/gu)]
        const questionRound = Number(rounds.at(-1)?.[1] ?? 0)
        const questionId = this.mode === 'question-loop' ? `q${questionRound + 1}` : 'q1'
        return planFor(request, 'A plan waiting for decisions.', [{
          id: questionId,
          text: 'What is the audience, objective, and approval boundary?',
          why: 'The work cannot be scoped safely without these decisions.',
          options: ['B2B founders', 'Consumers'],
          blocking: true
        }])
      }
      if (this.mode === 'weak') return planFor(request, 'Weak plan with no audience definition.')
      return planFor(request, 'A complete plan for the supplied brief.')
    }
    if (request.runner === 'codex-critic') {
      if (this.mode === 'weak' && request.round === 1) {
        return {
          issues: ['The plan does not identify an audience.'],
          missing_questions: [],
          risks: ['The deliverable may be irrelevant without an audience.'],
          verdict: 'revise'
        } satisfies PlanCritique
      }
      if (this.mode === 'always-revise') {
        return {
          issues: ['Keep the acceptance criterion explicit.'],
          missing_questions: [],
          risks: [],
          verdict: 'revise'
        } satisfies PlanCritique
      }
      return { issues: [], missing_questions: [], risks: [], verdict: 'agree' } satisfies PlanCritique
    }
    const revised = planFor(request, this.mode === 'weak' ? 'Revised plan with a defined audience.' : 'A revised plan.')
    return {
      ...revised,
      replies: [{
        issue: this.mode === 'weak' ? 'The plan does not identify an audience.' : 'Keep the acceptance criterion explicit.',
        decision: 'accepted',
        reason: 'Fable added the missing detail to make the step testable.'
      }]
    }
  }
}

function createPlanner(runner: PlannerRunner, options: { maxQuestionRounds?: number } = {}): Planner {
  root = mkdtempSync(join(tmpdir(), 'octa-planner-'))
  jobs = new JobsRepository(':memory:')
  return new Planner({
    runner,
    jobs,
    homePath: root,
    skillsLibraryPath: join(process.cwd(), 'skills-library'),
    maxQuestionRounds: options.maxQuestionRounds
  })
}

describe('brief compilation', () => {
  it('keeps the last 40 turns, lists attachment paths, and injects the spec 005 brain', async () => {
    root = mkdtempSync(join(tmpdir(), 'octa-brief-'))
    const conversation = Array.from({ length: 45 }, (_, index) => ({
      role: 'user' as const,
      content: `turn ${index + 1}`
    }))
    const result = await compileBriefContent(
      conversation,
      [{ path: 'C:\\Projects\\brief.pdf', name: 'brief.pdf' }, 'C:\\Projects\\logo.png'],
      { loadBrain: async () => 'COMPANY BRAIN CONTEXT' },
      { homePath: root, planId: 'brief-test' }
    )

    expect(result.content).toContain('turn 6')
    expect(result.content).not.toContain('turn 5')
    expect(result.content).toContain('C:\\Projects\\brief.pdf')
    expect(result.content).toContain('C:\\Projects\\logo.png')
    expect(result.content).toContain('COMPANY BRAIN CONTEXT')
    expect(result.path).toBe(join(root, 'jobs', 'brief-test', 'brief.md'))
  })
})

describe('Fable/Astra planning debate', () => {
  it('mirrors the Arabic demo brief and asks six blocking questions', async () => {
    const planner = createPlanner(new FakeRunner('arabic-demo'))
    const result = await planner.plan('اعمل ماركتنج لمشروع جديد')
    expect(result.status).toBe('needs_input')
    expect(result.plan.language).toBe('ar-EG')
    expect(result.questions.filter((question) => question.blocking)).toHaveLength(6)
  })

  it('asks at least one blocking question for each of five ambiguous briefs', async () => {
    const files = ['ambiguous-a.md', 'ambiguous-b.md', 'ambiguous-c.md', 'ambiguous-d.md', 'ambiguous-e.md']
    for (const file of files) {
      const runner = new FakeRunner('ambiguous')
      const planner = createPlanner(runner)
      const result = await planner.plan(readFileSync(join(fixtureRoot, file), 'utf8'))
      expect(result.status, file).toBe('needs_input')
      expect(result.questions.filter((question) => question.blocking), file).not.toHaveLength(0)
    }
  })

  it('returns zero questions for a complete brief', async () => {
    const planner = createPlanner(new FakeRunner('complete'))
    const result = await planner.plan(readFileSync(join(fixtureRoot, 'complete.md'), 'utf8'))
    expect(result.status).toBe('ok')
    expect(result.questions).toHaveLength(0)
    expect(jobs?.getPlan(result.planId)).toMatchObject({ id: result.planId, status: 'draft' })
  })

  it('changes a weak plan after Astra critique within two rounds and records the reason', async () => {
    const runner = new FakeRunner('weak')
    const planner = createPlanner(runner)
    const result = await planner.plan('A weak marketing brief')
    expect(result.round).toBeLessThanOrEqual(2)
    expect(result.plan.summary).toContain('Revised plan')
    expect(result.debateMarkdown).toContain('The plan does not identify an audience.')
    expect(result.debateMarkdown).toContain('Revised plan with a defined audience.')
    expect(readFileSync(result.debatePath, 'utf8')).toBe(result.debateMarkdown)
    expect(jobs?.getPlan(result.planId)?.plan).toMatchObject({ summary: 'Revised plan with a defined audience.' })
  })

  it('retries invalid JSON once with the validation error appended', async () => {
    const runner = new FakeRunner('invalid')
    const planner = createPlanner(runner)
    const result = await planner.plan('A complete brief')
    expect(result.status).toBe('ok')
    expect(runner.calls[1]?.prompt).toContain('Validation error from Octa')
    expect(runner.calls.filter((call) => call.phase === 'draft')).toHaveLength(2)
  })

  it('caps an unresolved debate at four Astra rounds', async () => {
    const runner = new FakeRunner('always-revise')
    const planner = createPlanner(runner)
    const result = await planner.plan('A complete brief')
    expect(result.round).toBe(4)
    expect(runner.calls.filter((call) => call.runner === 'codex-critic')).toHaveLength(4)
    expect(result.debate).toHaveLength(4)
    expect(result.plan.assumptions.some((assumption) => assumption.includes('Debate cap'))).toBe(true)
  })

  it('runs at most three answer rounds, then changes blocking questions into approval assumptions', async () => {
    const planner = createPlanner(new FakeRunner('question-loop'))
    let result = await planner.plan('An ambiguous brief')
    expect(result.status).toBe('needs_input')
    result = await planner.answer(result.planId, { q1: 'The owner approved B2B founders and a review-only deliverable.' })
    result = await planner.answer(result.planId, { q2: 'The budget and deadline remain open.' })
    result = await planner.answer(result.planId, { q3: 'Proceed with the stated assumptions.' })
    expect(result.status).toBe('needs_approval')
    expect(result.plan.questions.every((question) => !question.blocking)).toBe(true)
    expect(result.plan.assumptions.some((assumption) => assumption.includes('Assumption awaiting explicit approval'))).toBe(true)
    expect(jobs?.getPlan(result.planId)).toMatchObject({ status: 'needs_approval', questionRound: 3 })
  })
})

describe('planner schema validators', () => {
  it('accepts the runtime plan and critique shapes and rejects incomplete JSON', () => {
    const validPlan = planFor({ planId: 'schema', runner: 'claude-plan', phase: 'draft', round: 0, workspace: '', schemaPath: '', prompt: '', systemPrompt: '' }, 'valid')
    expect(validatePlan(validPlan).valid).toBe(true)
    expect(validatePlan({ ...validPlan, estimated_minutes: '20' }).valid).toBe(false)
    expect(validateCritique({ issues: [], missing_questions: [], risks: [], verdict: 'agree' }).valid).toBe(true)
    expect(validateCritique({ issues: [], missing_questions: [], verdict: 'agree' }).valid).toBe(false)
  })

  it('enforces the skill registry exception and rejects unsourced summary numbers', () => {
    const validPlan = planFor({ planId: 'execution-schema', runner: 'claude-plan', phase: 'draft', round: 0, workspace: '', schemaPath: '', prompt: '', systemPrompt: '' }, 'valid')
    expect(validatePlanForExecution(validPlan, { skillsLibraryPath: join(process.cwd(), 'skills-library') }).valid).toBe(true)
    expect(validatePlanForExecution({
      ...validPlan,
      summary: 'Reach 100 users',
      steps: [{ ...validPlan.steps[0], runner: 'claude-skill', skill: 'missing-skill', prompt: undefined }]
    }, { skillsLibraryPath: join(process.cwd(), 'skills-library') }).valid).toBe(false)
  })
})
