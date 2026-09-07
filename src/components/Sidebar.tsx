import { Cloud, Languages, Settings2, Sparkles } from 'lucide-react'
import type { Locale, TranslationKey } from '../i18n'
import { t } from '../i18n'

export type Page = 'settings'

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

      <nav aria-label={label('settings')}>
        <button
          className={`nav-item ${page === 'settings' ? 'active' : ''}`}
          onClick={() => onChange('settings')}
          type="button"
        >
          <Settings2 size={18} />
          <span>{label('settings')}</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="cloud-badge">
          <Cloud size={17} />
          <div>
            <strong>{label('cloudStatus')}</strong>
            <span>{label('cloudStatusDetail')}</span>
          </div>
          <Sparkles size={14} />
        </div>
        <button
          className="locale-button"
          onClick={onToggleLocale}
          type="button"
          title={label('languageHint')}
        >
          <Languages size={16} />
          <span>{label('language')}</span>
        </button>
      </div>
    </aside>
  )
}
