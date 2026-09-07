import { contextBridge, ipcRenderer } from 'electron'
import type { BrainProposal, BrainStatus, ProposalStatus } from './core/octa/brain'
import type { BrowserChallengeEvent, ResearchBrowserStatus } from './core/octa/browser'
import type { IntakeAnswerResult, IntakeQuestion, IntakeStartOptions, IntakeState } from './core/octa/intake'
import type { Skill, SkillListOptions } from './core/skills/registry'
import type {
  PlannerAnswerRequest,
  PlannerEvent,
  PlannerPlanRequest,
  PlannerResult
} from './core/octa/planner'
import type {
  ResearchLoginSite,
  ResearchStartRequest,
  ResearchStartResponse,
  ResearchStatusResponse
} from './core/octa/research'
import type {
  AiTestResult,
  AppSettings,
  JobEvent,
  JobRecord,
  JobStartRequest,
  JobStartResponse,
  RendererState
} from './types'

const api = {
  state: (): Promise<RendererState> => ipcRenderer.invoke('app:state'),
  settings: {
    update: (update: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke('settings:update', update)
  },
  ai: {
    test: (): Promise<AiTestResult> => ipcRenderer.invoke('ai:test')
  },
  notify: {
    test: (): Promise<boolean> => ipcRenderer.invoke('notify:test')
  },
  brain: {
    proposals: (status?: ProposalStatus): Promise<BrainProposal[]> =>
      ipcRenderer.invoke('brain:proposals', status),
    approve: (id: number): Promise<BrainProposal> => ipcRenderer.invoke('brain:approve', id),
    reject: (id: number): Promise<BrainProposal> => ipcRenderer.invoke('brain:reject', id),
    status: (): Promise<BrainStatus> => ipcRenderer.invoke('brain:status')
  },
  intake: {
    next: (options?: IntakeStartOptions): Promise<IntakeQuestion | null> =>
      ipcRenderer.invoke('intake:next', options),
    answer: (input: { answer: string; questionId?: string } | string): Promise<IntakeAnswerResult> =>
      ipcRenderer.invoke('intake:answer', input),
    state: (): Promise<IntakeState | null> => ipcRenderer.invoke('intake:state')
  },
  skills: {
    list: (options?: SkillListOptions): Promise<Skill[]> => ipcRenderer.invoke('skills:list', options),
    get: (name: string): Promise<Skill | null> => ipcRenderer.invoke('skills:get', name)
  },
  planner: {
    plan: (request: PlannerPlanRequest): Promise<PlannerResult> => ipcRenderer.invoke('planner:plan', request),
    answer: (request: PlannerAnswerRequest): Promise<PlannerResult> => ipcRenderer.invoke('planner:answer', request),
    approve: (planId: string, approvedBy?: string): Promise<PlannerResult> =>
      ipcRenderer.invoke('planner:approve', { planId, approvedBy }),
    get: (planId: string): Promise<PlannerResult | null> => ipcRenderer.invoke('planner:get', planId),
    onQuestions: (listener: (event: Extract<PlannerEvent, { type: 'planner:questions' }>) => void): (() => void) => {
      const wrapped = (_event: Electron.IpcRendererEvent, plannerEvent: Extract<PlannerEvent, { type: 'planner:questions' }>): void => listener(plannerEvent)
      ipcRenderer.on('planner:questions', wrapped)
      return () => ipcRenderer.removeListener('planner:questions', wrapped)
    },
    onRound: (listener: (event: Extract<PlannerEvent, { type: 'planner:round' }>) => void): (() => void) => {
      const wrapped = (_event: Electron.IpcRendererEvent, plannerEvent: Extract<PlannerEvent, { type: 'planner:round' }>): void => listener(plannerEvent)
      ipcRenderer.on('planner:round', wrapped)
      return () => ipcRenderer.removeListener('planner:round', wrapped)
    }
  },
  jobs: {
    start: (spec: JobStartRequest): Promise<JobStartResponse> => ipcRenderer.invoke('jobs:start', spec),
    cancel: (id: string): Promise<boolean> => ipcRenderer.invoke('jobs:cancel', id),
    list: (options?: { status?: string; limit?: number }): Promise<JobRecord[]> => ipcRenderer.invoke('jobs:list', options),
    get: (id: string): Promise<JobRecord | null> => ipcRenderer.invoke('jobs:get', id),
    approve: (id: string, approvedBy?: string): Promise<JobRecord | null> =>
      ipcRenderer.invoke('jobs:approve', { id, approvedBy }),
    onEvent: (listener: (event: JobEvent) => void): (() => void) => {
      const wrapped = (_event: Electron.IpcRendererEvent, jobEvent: JobEvent): void => listener(jobEvent)
      ipcRenderer.on('jobs:events', wrapped)
      return () => ipcRenderer.removeListener('jobs:events', wrapped)
    }
  },
  research: {
    start: (request: ResearchStartRequest): Promise<ResearchStartResponse> =>
      ipcRenderer.invoke('research:start', request),
    status: (jobId?: string): Promise<ResearchStatusResponse> =>
      ipcRenderer.invoke('research:status', jobId),
    challengeResolved: (site: string): Promise<ResearchBrowserStatus> =>
      ipcRenderer.invoke('research:challenge:resolved', { site }),
    loginStart: (site: ResearchLoginSite): Promise<ResearchBrowserStatus> =>
      ipcRenderer.invoke('research:login:start', { site }),
    loginDone: (site: ResearchLoginSite): Promise<ResearchBrowserStatus> =>
      ipcRenderer.invoke('research:login:done', { site }),
    onChallenge: (listener: (event: BrowserChallengeEvent) => void): (() => void) => {
      const wrapped = (_event: Electron.IpcRendererEvent, browserEvent: BrowserChallengeEvent): void => listener(browserEvent)
      ipcRenderer.on('browser:challenge', wrapped)
      return () => ipcRenderer.removeListener('browser:challenge', wrapped)
    }
  },
  window: {
    minimize: (): void => ipcRenderer.send('window:minimize'),
    maximize: (): void => ipcRenderer.send('window:maximize'),
    close: (): void => ipcRenderer.send('window:close')
  },
  onSettingsChanged: (listener: (settings: AppSettings) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, settings: AppSettings): void => listener(settings)
    ipcRenderer.on('settings:changed', wrapped)
    return () => ipcRenderer.removeListener('settings:changed', wrapped)
  }
}

contextBridge.exposeInMainWorld('octa', api)

export type OctaApi = typeof api
