import { Workflow } from 'lucide-react'
import type { Locale, TranslationKey } from '../i18n'
import { t } from '../i18n'

export function WorkflowsPage({ locale }: { locale: Locale }): React.JSX.Element {
  const label = (key: TranslationKey): string => t(key, locale)
  return (
    <main className="page workflows-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">{label('workflowsEyebrow')}</span>
          <h1>{label('workflowsTitle')}</h1>
          <p>{label('workflowsIntro')}</p>
        </div>
      </header>
      <section className="glass workflows-empty" aria-labelledby="workflows-empty-title">
        <Workflow size={24} aria-hidden="true" />
        <h2 id="workflows-empty-title">{label('workflowsEmptyTitle')}</h2>
        <p>{label('workflowsEmptyDetail')}</p>
      </section>
    </main>
  )
}
