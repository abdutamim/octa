import { mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { JobRunner } from '../electron/core/jobs/runner'
import { WorkflowRunner } from '../electron/core/octa/workflows'
import { JobsRepository } from '../electron/db/jobs'
import { DEFAULT_SETTINGS, type AppSettings } from '../electron/types'

const target = process.argv[2]?.toUpperCase() === 'W4' ? 'W4' : 'W6'
const homePath = resolve(process.env.OCTA_WORKFLOW_DEMO_HOME?.trim() || join('C:\\Octa', 'spec006-workflow-demo'))
mkdirSync(homePath, { recursive: true })
const settings: AppSettings = {
  ...DEFAULT_SETTINGS,
  octaHomePath: homePath,
  skillsLibraryPath: resolve(process.cwd(), 'skills-library')
}
const jobs = new JobsRepository(join(homePath, 'octa.db'))
const jobRunner = new JobRunner({
  jobs,
  homePath,
  getSettings: () => settings,
  onEvent: (event) => {
    if (event.type === 'error') console.error(`[${target}] ${event.message}`)
    if (event.type === 'tool' && event.phase === 'start') console.error(`[${target}] ${event.name}`)
  }
})
const workflows = new WorkflowRunner({
  jobs,
  jobRunner,
  homePath,
  getSettings: () => settings,
  onEvent: (event) => {
    if (event.type === 'workflow:step') console.error(`[${target}] ${event.stepId}: ${event.status}`)
    if (event.type === 'workflow:gate') console.error(`[${target}] gate ${event.stepId}: ${event.status}`)
  }
})
workflows.seedLaunchWorkflows()

const brief = target === 'W4'
  ? {
      text: 'هل أعمل موقعي بـ Astro ولا Next',
      site_shape: 'موقع تسويقي عام يعتمد على المحتوى والمدونة، مع تفاعلات بسيطة ومن دون تسجيل دخول أو لوحة تحكم في النسخة الأولى.'
    }
  : { text: 'What are the practical tradeoffs of Astro versus Next.js for a small content-heavy marketing site in 2026?' }
const handle = workflows.start(target, brief, {
  language: target === 'W4' ? 'ar' : 'en',
  timeBudgetMs: 10 * 60 * 1_000,
  inputTokenBudget: 4_000_000
})
let result = target === 'W4' ? workflows.getRun(handle.runId) : null
if (target === 'W4') {
  while (!result || (result.status === 'running' && !result.currentGate)) {
    await new Promise<void>((resolvePromise) => setTimeout(resolvePromise, 250))
    result = workflows.getRun(handle.runId)
  }
}
if (!result) result = await handle.promise
console.log(JSON.stringify({
  target,
  runId: result.runId,
  folder: result.folder,
  status: result.status,
  currentGate: result.currentGate,
  steps: result.steps.map((step) => ({ id: step.id, status: step.status, jobId: step.jobId, output: step.output, error: step.error }))
}, null, 2))
if (target !== 'W4' || !result.currentGate) await workflows.close()
jobs.checkpoint()
jobs.close()
