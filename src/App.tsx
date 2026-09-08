import { useEffect, useState } from 'react'
import type { AppSettings, AppUpdate } from '../electron/types'
import { DEFAULT_SETTINGS } from '../electron/types'
import { applyLocale, type Locale } from './i18n'
import { t } from './i18n'
import { SettingsPage } from './components/SettingsPage'
import { FirstRun } from './components/FirstRun'
import { HealthPage } from './components/HealthPage'
import { BrainPage } from './components/BrainPage'
import { JobsPage } from './components/JobsPage'
import { MapPage } from './components/MapPage'
import { SkillsPage } from './components/SkillsPage'
import { OctaPage } from './components/OctaPage'
import { WorkflowsPage } from './components/WorkflowsPage'
import { BuildsPage } from './components/BuildsPage'
import { TasksPage } from './components/TasksPage'
import { ClientsPage } from './components/ClientsPage'
import { Sidebar, type Page } from './components/Sidebar'
import { VoiceBar } from './components/VoiceBar'
import { VoiceAudioPlayback } from './components/VoiceAudioPlayback'
import { VoiceInputBridge } from './components/VoiceInputBridge'

function UpdateBanner({
  update,
  locale,
  onOpen
}: {
  update: AppUpdate
  locale: Locale
  onOpen: (url: string) => Promise<void>
}): React.JSX.Element | null {
  if (update.status !== 'available' || !update.downloadUrl || !update.latestVersion) return null
  const version = update.latestVersion.replace(/^v/i, '')
  return (
    <aside className="update-banner" role="status">
      <div className="update-banner-copy">
        <strong>{t('updateAvailable', locale).replace('{version}', version)}</strong>
        <span>{t('updateBannerDetail', locale)}</span>
      </div>
      <a
        className="update-banner-link"
        href={update.downloadUrl}
        onClick={(event) => {
          event.preventDefault()
          void onOpen(update.downloadUrl!)
        }}
        rel="noreferrer"
        target="_blank"
      >
        {t('updateDownload', locale)}
      </a>
    </aside>
  )
}

export function App(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [page, setPage] = useState<Page>('octa')
  const [loading, setLoading] = useState(true)
  const [firstRun, setFirstRun] = useState(true)
  const [showFirstRun, setShowFirstRun] = useState(false)
  const [version, setVersion] = useState('0.1.0')
  const [update, setUpdate] = useState<AppUpdate | null>(null)
  const locale: Locale = settings.locale

  useEffect(() => {
    applyLocale(locale)
    document.documentElement.dataset.theme = settings.theme
  }, [locale, settings.theme])

  useEffect(() => {
    let active = true
    void window.octa.state().then((state) => {
      if (!active) return
      setSettings(state.settings)
      setFirstRun(state.firstRun)
      setShowFirstRun(state.firstRun)
      setVersion(state.version)
      setLoading(false)
    }).catch(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => window.octa.onSettingsChanged(setSettings), [])

  useEffect(() => {
    let active = true
    void window.octa.update.check().then((result) => {
      if (active) setUpdate(result)
    }).catch(() => {
      // An unavailable network must not block the desktop app.
    })
    return () => {
      active = false
    }
  }, [])

  const updateSettings = async (update: Partial<AppSettings>): Promise<AppSettings> => {
    const next = await window.octa.settings.update(update)
    setSettings(next)
    return next
  }

  const toggleLocale = (): void => {
    void updateSettings({ locale: locale === 'ar' ? 'en' : 'ar' })
  }

  const runHealth = (): Promise<import('../electron/core/octa/health').HealthReport> => window.octa.health.run()
  const installHealthDependency = (kind: import('../electron/core/octa/health').GuidedInstallKind): Promise<import('../electron/core/octa/health').GuidedInstallResult> => window.octa.health.install(kind)
  const onHealthInstallOutput = (listener: Parameters<typeof window.octa.health.onInstallOutput>[0]): (() => void) => window.octa.health.onInstallOutput(listener)

  const completeFirstRun = async (): Promise<void> => {
    const state = await window.octa.firstRun.complete()
    setSettings(state.settings)
    setFirstRun(state.firstRun)
    setShowFirstRun(false)
  }

  if (loading) {
    return (
      <div className="app-loading">
        <span className="brand-mark" aria-label={t('brandName', locale)}>
          <i />
          <i />
          <i />
        </span>
      </div>
    )
  }

  if (showFirstRun) {
    return (
      <FirstRun
        locale={locale}
        onCancel={() => setShowFirstRun(false)}
        onComplete={completeFirstRun}
        onInstall={installHealthDependency}
        onInstallOutput={onHealthInstallOutput}
        onRunHealth={runHealth}
        onUpdate={updateSettings}
        required={firstRun}
        settings={settings}
      />
    )
  }

  return (
    <div className="app-shell">
      <VoiceAudioPlayback />
      <VoiceInputBridge enabled={settings.wakeWordEnabled || settings.pushToTalkEnabled} />
      <div className="workspace">
        <Sidebar page={page} locale={locale} onChange={setPage} onToggleLocale={toggleLocale} />
        <section className="content">
          {update && <UpdateBanner update={update} locale={locale} onOpen={(url) => window.octa.update.open(url)} />}
          <VoiceBar locale={locale} />
          {page === 'octa' && <OctaPage locale={locale} />}
          {page === 'settings' && (
            <SettingsPage
              settings={settings}
              locale={locale}
              onUpdate={updateSettings}
              onAiTest={() => window.octa.ai.test()}
              onNotifyTest={() => window.octa.notify.test()}
              onOpenFirstRun={() => setShowFirstRun(true)}
              version={version}
            />
          )}
          {page === 'health' && (
            <HealthPage
              locale={locale}
              onInstall={installHealthDependency}
              onInstallOutput={onHealthInstallOutput}
              onOpenSetup={() => setShowFirstRun(true)}
              onRun={runHealth}
              settings={settings}
            />
          )}
          {page === 'brain' && <BrainPage locale={locale} />}
          {page === 'map' && <MapPage locale={locale} />}
          {page === 'jobs' && <JobsPage locale={locale} />}
          {page === 'tasks' && <TasksPage onBack={() => setPage('octa')} />}
          {page === 'clients' && <ClientsPage onBack={() => setPage('octa')} />}
          {page === 'workflows' && <WorkflowsPage locale={locale} />}
          {page === 'skills' && <SkillsPage locale={locale} />}
          {page === 'builds' && <BuildsPage locale={locale} />}
        </section>
      </div>
    </div>
  )
}
