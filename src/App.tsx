import { useEffect, useState } from 'react'
import type { AppSettings } from '../electron/types'
import { DEFAULT_SETTINGS } from '../electron/types'
import { applyLocale, type Locale } from './i18n'
import { t } from './i18n'
import { SettingsPage } from './components/SettingsPage'
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

export function App(): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [page, setPage] = useState<Page>('octa')
  const [loading, setLoading] = useState(true)
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
      setLoading(false)
    }).catch(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => window.octa.onSettingsChanged(setSettings), [])

  const updateSettings = async (update: Partial<AppSettings>): Promise<AppSettings> => {
    const next = await window.octa.settings.update(update)
    setSettings(next)
    return next
  }

  const toggleLocale = (): void => {
    void updateSettings({ locale: locale === 'ar' ? 'en' : 'ar' })
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

  return (
    <div className="app-shell">
      <VoiceAudioPlayback />
      <VoiceInputBridge enabled={settings.wakeWordEnabled || settings.pushToTalkEnabled} />
      <div className="workspace">
        <Sidebar page={page} locale={locale} onChange={setPage} onToggleLocale={toggleLocale} />
        <section className="content">
          <VoiceBar locale={locale} />
          {page === 'octa' && <OctaPage locale={locale} />}
          {page === 'settings' && (
            <SettingsPage
              settings={settings}
              locale={locale}
              onUpdate={updateSettings}
              onAiTest={() => window.octa.ai.test()}
              onNotifyTest={() => window.octa.notify.test()}
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
