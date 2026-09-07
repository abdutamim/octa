import { basename, dirname } from 'node:path'
import { Vault } from '../vault'

export const INTAKE_STATE_KEY = 'intake.state'

export type IntakeBlock = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type IntakeMode = 'company' | 'client'

export interface IntakeQuestion {
  id: string
  number: number
  block: IntakeBlock
  translationKey: string
  arabic: string
}

export const INTAKE_QUESTIONS: readonly IntakeQuestion[] = [
  { id: 'companyServices', number: 1, block: 'A', translationKey: 'intakeQuestion1', arabic: 'تميم بتعمل إيه بالظبط دلوقتي، ولمين؟ (خدمة خدمة)' },
  { id: 'companyPitch', number: 2, block: 'A', translationKey: 'intakeQuestion2', arabic: 'إيه اللي بتقوله للعميل في أول 30 ثانية عشان يفهم إنت مين؟' },
  { id: 'bestAndWorstClients', number: 3, block: 'A', translationKey: 'intakeQuestion3', arabic: 'مين أفضل 3 عملاء اشتغلت معاهم وليه كانوا أفضل؟ ومين أسوأ 3 وليه؟' },
  { id: 'outOfScope', number: 4, block: 'A', translationKey: 'intakeQuestion4', arabic: 'إيه الحاجات اللي مش بتشتغلها أبداً؟' },
  { id: 'offers', number: 5, block: 'B', translationKey: 'intakeQuestion5', arabic: 'كل خدمة: اسمها، بتشمل إيه، مدتها، سعرها، طريقة الدفع، الضمان لو فيه.' },
  { id: 'ticketRange', number: 6, block: 'B', translationKey: 'intakeQuestion6', arabic: 'أعلى تذكرة بعتها، وأقل واحدة. الأكتر تكراراً.' },
  { id: 'negotiation', number: 7, block: 'B', translationKey: 'intakeQuestion7', arabic: 'إيه اللي بيتفاوض عليه العميل دايماً؟' },
  { id: 'idealClient', number: 8, block: 'C', translationKey: 'intakeQuestion8', arabic: 'صف العميل اللي لو جالك 10 زيه السنة دي تبقى مبسوط: صناعته، حجمه، مين بياخد القرار، بيدور عليك امتى.' },
  { id: 'objections', number: 9, block: 'C', translationKey: 'intakeQuestion9', arabic: 'إيه أكتر 5 اعتراضات بتسمعها؟ وبترد عليهم إزاي؟' },
  { id: 'badFit', number: 10, block: 'C', translationKey: 'intakeQuestion10', arabic: 'مين العميل اللي لازم ترفضه؟' },
  { id: 'brandPersonality', number: 11, block: 'D', translationKey: 'intakeQuestion11', arabic: 'لو براندك شخص، شكله إيه وبيتكلم إزاي؟ 3 صفات لازم تبان و3 لازم متبانش.' },
  { id: 'words', number: 12, block: 'D', translationKey: 'intakeQuestion12', arabic: 'كلمات ممنوعة، وكلمات لازم تتقال بالإنجليزي مش بالعربي.' },
  { id: 'postExamples', number: 13, block: 'D', translationKey: 'intakeQuestion13', arabic: 'مثال بوست حبيته جداً، ومثال بوست مكسوف منه.' },
  { id: 'clientJourney', number: 14, block: 'E', translationKey: 'intakeQuestion14', arabic: 'العميل بيدخل إزاي من أول رسالة لحد ما يدفع؟ (خطوة خطوة)' },
  { id: 'delivery', number: 15, block: 'E', translationKey: 'intakeQuestion15', arabic: 'التسليم بيتم إزاي؟ التعديلات؟ كام مرة؟' },
  { id: 'invoicing', number: 16, block: 'E', translationKey: 'intakeQuestion16', arabic: 'الفواتير: بتتطلع امتى، بأي عملة، الدفع بعد كام يوم، بتفكّر العميل إزاي؟' },
  { id: 'tools', number: 17, block: 'E', translationKey: 'intakeQuestion17', arabic: 'الأدوات اللي بتستخدمها وحساباتها (Notion، Meta، Obsidian، Photoshop...).' },
  { id: 'goals', number: 18, block: 'F', translationKey: 'intakeQuestion18', arabic: 'الرقم اللي عايز توصله في 90 يوم، وفي سنة.' },
  { id: 'timeEaters', number: 19, block: 'F', translationKey: 'intakeQuestion19', arabic: 'أكتر حاجة بتاكل وقتك ومش بتحب تعملها.' },
  { id: 'octaPriority', number: 20, block: 'F', translationKey: 'intakeQuestion20', arabic: 'لو Octa هيعمل حاجة واحدة بس صح، تبقى إيه؟' }
] as const

export const INTAKE_BLOCKS: Readonly<Record<IntakeBlock, readonly IntakeQuestion[]>> = {
  A: INTAKE_QUESTIONS.slice(0, 4),
  B: INTAKE_QUESTIONS.slice(4, 7),
  C: INTAKE_QUESTIONS.slice(7, 10),
  D: INTAKE_QUESTIONS.slice(10, 13),
  E: INTAKE_QUESTIONS.slice(13, 17),
  F: INTAKE_QUESTIONS.slice(17, 20)
}

export interface IntakeState {
  mode: IntakeMode
  currentQuestion: number
  answers: Record<string, string>
  completed: boolean
  clientSlug?: string
  startedAt: string
  updatedAt: string
}

export interface IntakeSettingsStore {
  getValue<T>(key: string): T | undefined
  setValue(key: string, value: unknown): void
}

export interface IntakeWriterOptions {
  vaultPath?: string
  knowledgePath?: string
  answers: Record<string, unknown>
}

export interface ClientIntakeOptions {
  vaultPath?: string
  knowledgePath?: string
  name?: string
  slug?: string
  answers?: Record<string, unknown>
  [key: string]: unknown
}

export interface IntakeStartOptions {
  mode?: IntakeMode
  client?: string
  reset?: boolean
}

export interface IntakeAnswerOptions {
  answer: string
  questionId?: string
}

export interface IntakeAnswerResult extends IntakeState {
  state: IntakeState
  nextQuestion: IntakeQuestion | null
  writtenFiles: string[]
}

class MemorySettingsStore implements IntakeSettingsStore {
  private readonly values = new Map<string, unknown>()

  getValue<T>(key: string): T | undefined {
    return this.values.get(key) as T | undefined
  }

  setValue(key: string, value: unknown): void {
    this.values.set(key, value)
  }
}

function answerText(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map(answerText).filter(Boolean).join('\n')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${answerText(item)}`)
      .filter((line) => !line.endsWith(': '))
      .join('\n')
  }
  return String(value).trim()
}

function questionCandidates(question: IntakeQuestion): string[] {
  return [
    question.id,
    String(question.number),
    `q${question.number}`,
    `question${question.number}`,
    `intakeQuestion${question.number}`
  ]
}

function findRawAnswer(answers: Record<string, unknown>, question: IntakeQuestion): unknown {
  for (const candidate of questionCandidates(question)) {
    const value = answers[candidate]
    if (value !== undefined) return value
  }
  const normalizedCandidates = new Set(questionCandidates(question).map((candidate) => candidate.toLocaleLowerCase().replace(/[^a-z0-9]/g, '')))
  for (const [key, value] of Object.entries(answers)) {
    const normalized = key.toLocaleLowerCase().replace(/[^a-z0-9]/g, '')
    if (normalizedCandidates.has(normalized)) return value
  }
  return undefined
}

function findAnswer(answers: Record<string, unknown>, question: IntakeQuestion): string {
  return answerText(findRawAnswer(answers, question))
}

function heading(title: string, arabic: string, sections: Array<[string, string]>): string {
  const body = sections
    .map(([label, value]) => `## ${label}\n${value || '—'}`)
    .join('\n\n')
  return `# ${title} / ${arabic}\n\n${body}\n`
}

function slugify(value: string, fallback: string): string {
  const slug = value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

interface OfferRecord {
  name: string
  details: string
}

function offerRecords(value: unknown): OfferRecord[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).map(([name, details]) => ({
      name: name.trim() || 'Offer',
      details: answerText(details)
    }))
  }

  const raw = answerText(value)
  if (!raw) return [{ name: 'Offer 1', details: '' }]
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, '').replace(/^\d+[.)]\s*/, ''))
    .filter(Boolean)
  const records = lines.length > 1 ? lines : [raw]
  return records.map((line, index) => {
    const match = line.match(/^(.+?)\s*(?::|\||—|–|-)>?\s*(.+)$/)
    if (match) return { name: match[1].trim(), details: match[2].trim() }
    return { name: records.length === 1 ? 'Offer 1' : `Offer ${index + 1}`, details: line }
  })
}

function writerRoot(options: { vaultPath?: string; knowledgePath?: string }): { vault: Vault; prefix: string } {
  if (options.knowledgePath?.trim()) {
    const knowledgePath = options.knowledgePath.trim()
    return { vault: new Vault(dirname(knowledgePath)), prefix: basename(knowledgePath) }
  }
  if (!options.vaultPath?.trim()) throw new Error('A vault path is required for intake writing.')
  return { vault: new Vault(options.vaultPath), prefix: 'knowledge' }
}

async function writeKnowledgeFile(vault: Vault, prefix: string, relativePath: string, contents: string): Promise<string> {
  await vault.writeNote(`${prefix}/${relativePath}`, contents)
  return `${prefix}/${relativePath}`
}

export async function writeIntakeFiles(options: IntakeWriterOptions): Promise<string[]>
export async function writeIntakeFiles(vaultPath: string, answers: Record<string, unknown>): Promise<string[]>
export async function writeIntakeFiles(
  optionsOrVaultPath: IntakeWriterOptions | string,
  positionalAnswers?: Record<string, unknown>
): Promise<string[]> {
  const options: IntakeWriterOptions = typeof optionsOrVaultPath === 'string'
    ? { vaultPath: optionsOrVaultPath, answers: positionalAnswers ?? {} }
    : optionsOrVaultPath
  const answers = options.answers
  const { vault, prefix } = writerRoot(options)
  const question = (number: number): IntakeQuestion => INTAKE_QUESTIONS[number - 1]
  const value = (number: number): string => findAnswer(answers, question(number))
  const files: string[] = []

  files.push(await writeKnowledgeFile(vault, prefix, 'company.md', heading('Company', 'الشركة', [
    ['What we do / بنعمل إيه', value(1)],
    ['First 30 seconds / أول 30 ثانية', value(2)],
    ['Best and worst clients / أفضل وأسوأ العملاء', value(3)],
    ['Out of scope / خارج نطاق الشغل', value(4)],
    ['Goals / الأهداف', value(18)],
    ['Time eaters / الحاجات اللي بتاكل الوقت', value(19)],
    ['Octa priority / أولوية Octa', value(20)]
  ])))

  const offers = offerRecords(findRawAnswer(answers, question(5)))
  const usedOfferSlugs = new Set<string>()
  for (let index = 0; index < offers.length; index += 1) {
    const offer = offers[index]
    const baseSlug = slugify(offer.name, `offer-${index + 1}`)
    let offerSlug = baseSlug
    let suffix = 2
    while (usedOfferSlugs.has(offerSlug)) offerSlug = `${baseSlug}-${suffix++}`
    usedOfferSlugs.add(offerSlug)
    files.push(await writeKnowledgeFile(vault, prefix, `offers/${offerSlug}.md`, heading(offer.name, 'العرض', [
      ['Details / التفاصيل', offer.details]
    ])))
  }

  files.push(await writeKnowledgeFile(vault, prefix, 'icp.md', heading('Ideal customer profile', 'العميل المثالي', [
    ['Ideal client / العميل المثالي', value(8)],
    ['Objections / الاعتراضات', value(9)],
    ['Bad fit / العميل اللي نرفضه', value(10)]
  ])))

  files.push(await writeKnowledgeFile(vault, prefix, 'voice.md', heading('Voice', 'الصوت', [
    ['Brand personality / شخصية البراند', value(11)],
    ['Words / الكلمات', value(12)],
    ['Post examples / أمثلة البوستات', value(13)]
  ])))

  const sops: Array<[string, string, string]> = [
    ['client-journey.md', 'Client journey / رحلة العميل', value(14)],
    ['delivery.md', 'Delivery and revisions / التسليم والتعديلات', value(15)],
    ['invoicing.md', 'Invoicing / الفواتير', value(16)],
    ['tools.md', 'Tools and accounts / الأدوات والحسابات', value(17)]
  ]
  for (const [file, title, contents] of sops) {
    files.push(await writeKnowledgeFile(vault, prefix, `sops/${file}`, heading(title, 'إجراء تشغيلي', [['Answer / الإجابة', contents]])))
  }

  files.push(await writeKnowledgeFile(vault, prefix, 'pricing.md', heading('Pricing', 'الأسعار', [
    ['Offers and service pricing / أسعار الخدمات والعروض', value(5)],
    ['Ticket range / نطاق التذاكر', value(6)],
    ['Negotiation / التفاوض', value(7)]
  ])))

  return files
}

const CLIENT_FIELDS: ReadonlyArray<{ key: string; label: string; aliases: readonly string[] }> = [
  { key: 'name', label: 'Name / الاسم', aliases: ['name', 'clientName', '1'] },
  { key: 'brandAssetsFolder', label: 'Brand assets folder / مجلد أصول البراند', aliases: ['brandAssetsFolder', 'brandAssets', 'assets', '2'] },
  { key: 'contactsRoles', label: 'Contacts and roles / جهات الاتصال والأدوار', aliases: ['contactsRoles', 'contacts', 'roles', '3'] },
  { key: 'whatTheyBought', label: 'What they bought / اللي اشتروه', aliases: ['whatTheyBought', 'bought', 'offer', '4'] },
  { key: 'projectDeadline', label: 'Current project and deadline / المشروع الحالي والموعد النهائي', aliases: ['projectDeadline', 'currentProject', 'deadline', '5'] },
  { key: 'audience', label: 'Audience / الجمهور', aliases: ['audience', '6'] },
  { key: 'voiceDifferences', label: "Voice differences / اختلاف الصوت عن تميم", aliases: ['voiceDifferences', 'voice', '7'] },
  { key: 'hardDonts', label: "Hard don'ts / الممنوعات الصريحة", aliases: ['hardDonts', 'donts', '8'] },
  { key: 'approvalPerson', label: 'Approval person / الشخص المسؤول عن الموافقة', aliases: ['approvalPerson', 'approver', '9'] },
  { key: 'invoicingDetails', label: 'Invoicing details / تفاصيل الفواتير', aliases: ['invoicingDetails', 'invoicing', '10'] },
  { key: 'links', label: 'Links / الروابط', aliases: ['links', 'site', 'socials', '11'] }
]

function clientValue(options: ClientIntakeOptions, answers: Record<string, unknown>, aliases: readonly string[]): string {
  for (const alias of aliases) {
    if (options[alias] !== undefined) return answerText(options[alias])
    if (answers[alias] !== undefined) return answerText(answers[alias])
  }
  return ''
}

export function clientSlug(value: string): string {
  return slugify(value, 'client')
}

export async function writeClientIntake(options: ClientIntakeOptions): Promise<string>
export async function writeClientIntake(vaultPath: string, name: string, answers?: Record<string, unknown>): Promise<string>
export async function writeClientIntake(
  optionsOrVaultPath: ClientIntakeOptions | string,
  positionalName?: string,
  positionalAnswers: Record<string, unknown> = {}
): Promise<string> {
  const options: ClientIntakeOptions = typeof optionsOrVaultPath === 'string'
    ? { vaultPath: optionsOrVaultPath, name: positionalName, answers: positionalAnswers }
    : optionsOrVaultPath
  const answers = options.answers ?? {}
  const name = answerText(options.name ?? answers.name ?? answers.clientName)
  if (!name) throw new Error('A client name is required.')
  const slug = clientSlug(answerText(options.slug) || name)
  const sections = CLIENT_FIELDS.map((field) => [field.label, field.key === 'name' ? name : clientValue(options, answers, field.aliases)] as [string, string])
  const { vault, prefix } = writerRoot(options)
  return writeKnowledgeFile(vault, prefix, `clients/${slug}.md`, heading(name, 'العميل', sections))
}

function stateKey(mode: IntakeMode, client?: string): string {
  return mode === 'client' && client ? `${INTAKE_STATE_KEY}.client.${clientSlug(client)}` : INTAKE_STATE_KEY
}

function validState(raw: unknown): raw is IntakeState {
  if (!raw || typeof raw !== 'object') return false
  const candidate = raw as Partial<IntakeState>
  return (
    (candidate.mode === 'company' || candidate.mode === 'client') &&
    typeof candidate.currentQuestion === 'number' &&
    candidate.currentQuestion >= 1 &&
    candidate.currentQuestion <= INTAKE_QUESTIONS.length + 1 &&
    typeof candidate.answers === 'object' &&
    candidate.answers !== null &&
    typeof candidate.completed === 'boolean' &&
    typeof candidate.startedAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

export class IntakeInterview {
  private readonly settings: IntakeSettingsStore
  private readonly vaultPath: string
  private mode: IntakeMode
  private client?: string
  private activeStateKey: string

  constructor(options: { vaultPath: string; settings?: IntakeSettingsStore; mode?: IntakeMode; client?: string })
  constructor(settings: IntakeSettingsStore, vaultPath: string, mode?: IntakeMode, client?: string)
  constructor(
    optionsOrSettings: { vaultPath: string; settings?: IntakeSettingsStore; mode?: IntakeMode; client?: string } | IntakeSettingsStore,
    positionalVaultPath?: string,
    positionalMode: IntakeMode = 'company',
    positionalClient?: string
  ) {
    if ('getValue' in optionsOrSettings) {
      this.settings = optionsOrSettings
      this.vaultPath = positionalVaultPath ?? ''
      this.mode = positionalMode
      this.client = positionalClient
    } else {
      this.settings = optionsOrSettings.settings ?? new MemorySettingsStore()
      this.vaultPath = optionsOrSettings.vaultPath
      this.mode = optionsOrSettings.mode ?? 'company'
      this.client = optionsOrSettings.client
    }
    this.activeStateKey = stateKey(this.mode, this.client)
  }

  getState(): IntakeState | null {
    const raw = this.settings.getValue<unknown>(this.activeStateKey)
    return validState(raw) ? raw : null
  }

  state(): IntakeState | null {
    return this.getState()
  }

  start(options: IntakeStartOptions = {}): IntakeState {
    if (options.mode) this.mode = options.mode
    if (options.client !== undefined) this.client = options.client
    this.activeStateKey = stateKey(this.mode, this.client)
    const existing = this.getState()
    if (existing && !options.reset) return existing
    const now = new Date().toISOString()
    const next: IntakeState = {
      mode: this.mode,
      currentQuestion: 1,
      answers: {},
      completed: false,
      ...(this.mode === 'client' && this.client ? { clientSlug: clientSlug(this.client) } : {}),
      startedAt: now,
      updatedAt: now
    }
    this.settings.setValue(this.activeStateKey, next)
    return next
  }

  next(options?: IntakeStartOptions): IntakeQuestion | null {
    let state = this.getState()
    if (
      !state ||
      options?.reset ||
      (options?.mode && options.mode !== state.mode) ||
      (options?.client !== undefined && clientSlug(options.client) !== state.clientSlug)
    ) {
      this.start(options)
      state = this.getState()
    }
    if (!state || state.completed || state.currentQuestion > INTAKE_QUESTIONS.length) return null
    return INTAKE_QUESTIONS[state.currentQuestion - 1] ?? null
  }

  async answer(input: IntakeAnswerOptions | string, questionId?: string): Promise<IntakeAnswerResult> {
    let state = this.getState()
    if (!state) {
      this.start()
      state = this.getState()
    }
    if (!state || state.completed) throw new Error('The intake interview is already complete.')
    const question = INTAKE_QUESTIONS[state.currentQuestion - 1]
    if (!question) throw new Error('There is no remaining intake question.')
    const answer = typeof input === 'string' ? input : input.answer
    const suppliedQuestionId = typeof input === 'string' ? questionId : input.questionId
    if (typeof answer !== 'string') throw new Error('An intake answer is required.')
    if (suppliedQuestionId && !questionCandidates(question).includes(suppliedQuestionId)) {
      throw new Error('The answer does not match the current intake question.')
    }

    const nextState: IntakeState = {
      ...state,
      answers: { ...state.answers, [question.id]: answer.trim() },
      currentQuestion: state.currentQuestion + 1,
      completed: state.currentQuestion === INTAKE_QUESTIONS.length,
      updatedAt: new Date().toISOString()
    }
    let writtenFiles: string[] = []
    if (nextState.completed && nextState.mode === 'company') {
      writtenFiles = await writeIntakeFiles({ vaultPath: this.vaultPath, answers: nextState.answers })
    } else if (nextState.completed && nextState.mode === 'client' && this.client) {
      writtenFiles = [await writeClientIntake({ vaultPath: this.vaultPath, name: this.client, answers: nextState.answers })]
    }
    this.settings.setValue(this.activeStateKey, nextState)
    const nextQuestion = nextState.completed ? null : INTAKE_QUESTIONS[nextState.currentQuestion - 1] ?? null
    return { ...nextState, state: nextState, nextQuestion, writtenFiles }
  }
}

export const Intake = IntakeInterview
export const IntakeManager = IntakeInterview
export const questions = INTAKE_QUESTIONS

export function createIntakeInterview(options: { vaultPath: string; settings?: IntakeSettingsStore; mode?: IntakeMode; client?: string }): IntakeInterview {
  return new IntakeInterview(options)
}

export const writeCompanyBrain = writeIntakeFiles
export const writeBrainFromIntake = writeIntakeFiles
