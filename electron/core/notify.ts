import type { AppSettings } from '../types'

export interface NotifyOptions {
  title: string
  body: string
  priority?: 'low' | 'default' | 'high'
  tags?: string[]
  clickUrl?: string
  /** ntfy action buttons. URLs are identifiers only; the app still verifies the gate payload. */
  actions?: NotifyAction[]
}

export interface NotifyAction {
  action: 'view' | 'http' | 'broadcast'
  label: string
  url?: string
  clear?: boolean
}

interface NotifierRuntime {
  fetch: typeof fetch
  showLocalNotification: (options: NotifyOptions) => boolean
}

const defaultRuntime: NotifierRuntime = {
  fetch: globalThis.fetch,
  showLocalNotification: () => false
}

export class Notifier {
  private readonly runtime: NotifierRuntime

  constructor(
    private readonly getSettings: () => AppSettings,
    runtime: Partial<NotifierRuntime> = {}
  ) {
    this.runtime = { ...defaultRuntime, ...runtime }
  }

  async send(options: NotifyOptions): Promise<boolean> {
    let localShown = false
    try {
      localShown = this.runtime.showLocalNotification(options)
    } catch {
      // A Windows toast is a convenience path; ntfy should still get its chance.
    }

    try {
      const settings = this.getSettings()
      const topic = settings.ntfyTopic.trim()
      if (!topic) return localShown

      const server = new URL(settings.ntfyServer)
      if (server.protocol !== 'https:' && server.protocol !== 'http:') return false
      const target = `${server.toString().replace(/\/+$/, '')}/${encodeURIComponent(topic)}`
      const headers: Record<string, string> = {
        Title: options.title,
        Priority: options.priority ?? 'default'
      }
      if (options.tags?.length) headers.Tags = options.tags.join(',')
      if (options.clickUrl) headers.Click = options.clickUrl
      if (options.actions?.length) {
        headers.Actions = options.actions.map((action) => {
          const parts = [action.action, action.label]
          if (action.url) parts.push(action.url)
          if (action.clear) parts.push('clear=true')
          return parts.join(', ')
        }).join('; ')
      }

      const response = await this.runtime.fetch(target, {
        method: 'POST',
        headers,
        body: options.body
      })
      return response.ok
    } catch {
      return false
    }
  }
}
