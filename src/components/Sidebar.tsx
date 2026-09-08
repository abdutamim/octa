import { Brain, Cloud, GitBranch, Hammer, Languages, Library, ListTodo, Settings2, Sparkles, Users, Workflow } from 'lucide-react'
import type { Locale, TranslationKey } from '../i18n'
import { t } from '../i18n'

export type Page = 'octa' | 'jobs' | 'tasks' | 'clients' | 'workflows' | 'skills' | 'brain' | 'map' | 'builds' | 'settings'

export function Sidebar({
  page,
  locale,
  onChange,
  onToggleLocale
}: {
  page: Page
  locale: Locale
  onChange: (page: Page) => void
  onToggleLocale: () => void
}): React.JSX.Element {
  const label = (key: TranslationKey): string => t(key, locale)
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div>
          <strong>{label('brandName')}</strong>
          <span>{label('brandSubtitle')}</span>
        </div>
      </div>

      <nav aria-label={label('primaryNavigation')}>
        <button
          aria-current={page === 'octa' ? 'page' : undefined}
          className={`nav-item ${page === 'octa' ? 'active' : ''}`}
          onClick={() => onChange('octa')}
          type="button"
        >
          <Sparkles size={18} aria-hidden="true" />
          <span>{label('octaNav')}</span>
        </button>
        <button
          aria-current={page === 'jobs' ? 'page' : undefined}
          className={`nav-item ${page === 'jobs' ? 'active' : ''}`}
          onClick={() => onChange('jobs')}
          type="button"
        >
          <ListTodo size={18} aria-hidden="true" />
          <span>{label('jobs')}</span>
        </button>
        <button
          aria-current={page === 'tasks' ? 'page' : undefined}
          className={`nav-item ${page === 'tasks' ? 'active' : ''}`}
          onClick={() => onChange('tasks')}
          type="button"
        >
          <ListTodo size={18} aria-hidden="true" />
          <span>{label('tasksNav')}</span>
        </button>
        <button
          aria-current={page === 'clients' ? 'page' : undefined}
          className={`nav-item ${page === 'clients' ? 'active' : ''}`}
          onClick={() => onChange('clients')}
          type="button"
        >
          <Users size={18} aria-hidden="true" />
          <span>{label('clientsNav')}</span>
        </button>
        <button
          aria-current={page === 'workflows' ? 'page' : undefined}
          className={`nav-item ${page === 'workflows' ? 'active' : ''}`}
          onClick={() => onChange('workflows')}
          type="button"
        >
          <Workflow size={18} aria-hidden="true" />
          <span>{label('workflows')}</span>
        </button>
        <button
          aria-current={page === 'skills' ? 'page' : undefined}
          className={`nav-item ${page === 'skills' ? 'active' : ''}`}
          onClick={() => onChange('skills')}
          type="button"
        >
          <Library size={18} aria-hidden="true" />
          <span>{label('skills')}</span>
        </button>
        <button
          aria-current={page === 'brain' ? 'page' : undefined}
          className={`nav-item ${page === 'brain' ? 'active' : ''}`}
          onClick={() => onChange('brain')}
          type="button"
        >
          <Brain size={18} aria-hidden="true" />
          <span>{label('brainNav')}</span>
        </button>
        <button
          className={`nav-item ${page === 'map' ? 'active' : ''}`}
          onClick={() => onChange('map')}
          type="button"
        >
          <GitBranch size={18} aria-hidden="true" />
          <span>{label('map')}</span>
        </button>
        <button
          className={`nav-item ${page === 'builds' ? 'active' : ''}`}
          onClick={() => onChange('builds')}
          type="button"
        >
          <Hammer size={18} aria-hidden="true" />
          <span>{label('builds')}</span>
        </button>
        <button
          aria-current={page === 'settings' ? 'page' : undefined}
          className={`nav-item ${page === 'settings' ? 'active' : ''}`}
          onClick={() => onChange('settings')}
          type="button"
        >
          <Settings2 size={18} aria-hidden="true" />
          <span>{label('settings')}</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="cloud-badge">
          <Cloud size={17} aria-hidden="true" />
          <div>
            <strong>{label('cloudStatus')}</strong>
            <span>{label('cloudStatusDetail')}</span>
          </div>
          <Sparkles size={14} aria-hidden="true" />
        </div>
        <button
          className="locale-button"
          onClick={onToggleLocale}
          type="button"
          title={label('languageHint')}
        >
          <Languages size={16} aria-hidden="true" />
          <span>{label('language')}</span>
        </button>
      </div>
    </aside>
  )
}
