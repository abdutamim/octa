import { runResearch } from '../electron/core/octa/research'

const task = 'dream buyer persona لعيادة أسنان في القاهرة'
const handle = runResearch(task, {
  homePath: process.env.OCTA_HOME?.trim() || 'C:\\Octa',
  conversationLanguage: 'ar',
  budgetMinutes: 15,
  preset: 'persona',
  onEvent: (event) => {
    if (event.type === 'tool' && event.phase === 'start') console.error(`[research] ${event.name}`)
    if (event.type === 'error') console.error(`[research] ${event.message}`)
    if (event.type === 'browser:challenge') console.error(`[research] challenge ${event.site}`)
  }
})

const result = await handle.promise
console.log(JSON.stringify({
  jobId: result.jobId,
  folder: result.folder,
  status: result.status,
  sourceCount: result.sourceCount,
  domainCount: result.domainCount,
  languagePlan: result.languagePlan,
  reportPath: result.reportPath,
  sourcesPath: result.sourcesPath,
  failures: result.gate.failures
}, null, 2))
