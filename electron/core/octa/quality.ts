export const QUALITY_SKILLS = ['copy-editing', 'stop-slop', 'fact-checker'] as const

export type QualitySkill = (typeof QUALITY_SKILLS)[number]

export interface QualityStepInput {
  text: string
  language: string
  outward: boolean
  sourcesPath?: string
}

export interface StepResult {
  /** The edited text returned by the skill step. */
  text: string
  /** Human-readable changes made by the skill step. */
  changes: string[]
}

export type StepRunner = (skill: string, input: QualityStepInput) => Promise<StepResult>

export interface QualityChainOptions {
  language: string
  outward: boolean
  sourcesPath?: string
  /** Injected until the real job runner from spec 001 is available. */
  runStep?: StepRunner
}

export interface QualityPassRecord {
  skill: QualitySkill
  input: QualityStepInput
  output: StepResult
  text: string
  changes: string[]
}

export interface QualityChangeRecord {
  skill: QualitySkill
  change: string
}

export interface QualityChainResult {
  text: string
  /** Flattened change list, in the same order as the executed steps. */
  changes: string[]
  /** Per-step records, including the input, edited output, and changes. */
  passes: QualityPassRecord[]
  /** Alias useful to callers that think of the chain as job steps. */
  steps: QualityPassRecord[]
  /** The same changes with their originating skill retained. */
  changeLog: QualityChangeRecord[]
  language: string
  outward: boolean
  sourcesPath?: string
  skipped: boolean
  ok: boolean
  blocked: boolean
  failures: string[]
}

function emptyResult(text: string, options: QualityChainOptions): QualityChainResult {
  return {
    text,
    changes: [],
    passes: [],
    steps: [],
    changeLog: [],
    language: options.language,
    outward: options.outward,
    ...(options.sourcesPath ? { sourcesPath: options.sourcesPath } : {}),
    skipped: !options.outward,
    ok: true,
    blocked: false,
    failures: []
  }
}

/**
 * Run the outward quality chain in its fixed order. Internal drafts are left
 * untouched; callers mark a deliverable outward when it is ready for review.
 *
 * The optional third argument keeps the function convenient for callers that
 * want to inject a runner positionally; the preferred form is options.runStep.
 */
export async function qualityChain(
  text: string,
  options: QualityChainOptions,
  injectedRunStep?: StepRunner
): Promise<QualityChainResult> {
  if (!options.outward) return emptyResult(text, options)

  const runStep = options.runStep ?? injectedRunStep
  if (!runStep) {
    throw new TypeError('qualityChain requires an injected runStep for outward output.')
  }

  let currentText = text
  const passes: QualityPassRecord[] = []
  const changes: string[] = []
  const changeLog: QualityChangeRecord[] = []

  for (const skill of QUALITY_SKILLS) {
    const input: QualityStepInput = {
      text: currentText,
      language: options.language,
      outward: options.outward,
      ...(options.sourcesPath ? { sourcesPath: options.sourcesPath } : {})
    }
    const output = await runStep(skill, input)
    const pass: QualityPassRecord = {
      skill,
      input,
      output,
      text: output.text,
      changes: [...output.changes]
    }
    passes.push(pass)
    changes.push(...pass.changes)
    changeLog.push(...pass.changes.map((change) => ({ skill, change })))
    currentText = output.text
  }

  return {
    text: currentText,
    changes,
    passes,
    steps: passes,
    changeLog,
    language: options.language,
    outward: options.outward,
    ...(options.sourcesPath ? { sourcesPath: options.sourcesPath } : {}),
    skipped: false,
    ok: true,
    blocked: false,
    failures: []
  }
}
