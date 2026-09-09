import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, FileDown, Loader2, Save } from 'lucide-react'
import type { DocumentBrand, DocumentRecord } from '../../electron/types'
import type { Locale, TranslationKey } from '../i18n'
import { t } from '../i18n'

/** Fields that must stay structured — they drive money, dates and page counts. */
interface FieldSpec {
  key: string
  label: TranslationKey
  type: 'text' | 'number' | 'money' | 'date' | 'multiline'
  hint?: TranslationKey
}

const CONTRACT_FIELDS: FieldSpec[] = [
  { key: 'projectName', label: 'documentProject', type: 'text' },
  { key: 'clientDetails', label: 'documentClientDetails', type: 'text' },
  { key: 'subject', label: 'documentAgreementSubject', type: 'multiline' },
  { key: 'amountMinor', label: 'documentProjectValue', type: 'money' },
  { key: 'durationDays', label: 'documentDurationDays', type: 'number' },
  { key: 'startAt', label: 'documentStartDate', type: 'date' },
  { key: 'scopeIn', label: 'documentScopeIn', type: 'multiline', hint: 'documentLineHint' },
  { key: 'scopeOut', label: 'documentScopeOut', type: 'multiline', hint: 'documentLineHint' },
  { key: 'deliverables', label: 'documentDeliverables', type: 'multiline', hint: 'documentLineHint' }
]

const PROPOSAL_FIELDS: FieldSpec[] = [
  { key: 'title', label: 'documentProposalTitle', type: 'text' },
  { key: 'titleAccent', label: 'documentTitleAccent', type: 'text' },
  { key: 'understanding', label: 'documentUnderstanding', type: 'multiline' },
  { key: 'amountMinor', label: 'documentProposalValue', type: 'money' },
  { key: 'durationDays', label: 'documentDurationDays', type: 'number' },
  { key: 'clientNeeds', label: 'documentClientNeeds', type: 'multiline', hint: 'documentLineHint' },
  { key: 'includes', label: 'documentIncludes', type: 'multiline', hint: 'documentLineHint' },
  { key: 'excludes', label: 'documentExcludes', type: 'multiline', hint: 'documentLineHint' }
]

function documentKindLabel(kind: DocumentRecord['kind'], locale: Locale): string {
  return t(kind === 'contract' ? 'documentContract' : kind === 'invoice' ? 'documentInvoice' : 'documentProposal', locale)
}

function toDateInput(ms: unknown): string {
  const value = Number(ms)
  if (!Number.isFinite(value)) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export function DocumentEditor({
  record,
  brands,
  locale,
  onClose
}: {
  record: DocumentRecord
  brands: DocumentBrand[]
  locale: Locale
  onClose: () => void
}): React.JSX.Element {
  const [draft, setDraft] = useState<DocumentRecord>(record)
  const [html, setHtml] = useState('')
  const [rendering, setRendering] = useState(true)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const frame = useRef<HTMLIFrameElement>(null)

  const specs = draft.kind === 'contract' ? CONTRACT_FIELDS : PROPOSAL_FIELDS
  const isInvoice = draft.kind === 'invoice'

  const render = useCallback(async (next: DocumentRecord) => {
    setRendering(true)
    try {
      setHtml(await window.octa.documents.preview(next))
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setRendering(false)
    }
  }, [])

  // Re-render on a short delay so typing in a field does not fire a render per
  // keystroke, which would make the preview flicker and steal focus.
  useEffect(() => {
    const timer = setTimeout(() => void render(draft), 250)
    return () => clearTimeout(timer)
  }, [draft, render])

  /**
   * Collects text the user edited directly on the page. The document is rendered
   * with a data-slot on every editable node, so reading them back gives the
   * overrides without parsing the layout.
   */
  const harvestOverrides = useCallback((): Record<string, string> => {
    const doc = frame.current?.contentDocument
    if (!doc) return draft.overrides
    const next: Record<string, string> = { ...draft.overrides }
    for (const node of Array.from(doc.querySelectorAll('[data-slot]'))) {
      const name = node.getAttribute('data-slot')
      if (!name) continue
      const text = (node as HTMLElement).innerText.replace(/ /g, ' ').trimEnd()
      next[name] = text
    }
    return next
  }, [draft.overrides])

  const save = async (): Promise<void> => {
    setBusy(t('documentSaving', locale))
    try {
      const next = { ...draft, overrides: harvestOverrides() }
      const stored = await window.octa.documents.save(next)
      setDraft(stored)
      setSaved(true)
      setTimeout(() => setSaved(false), 1_600)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy('')
    }
  }

  const exportPdf = async (): Promise<void> => {
    setBusy(t('documentBuildingPdf', locale))
    try {
      const next = { ...draft, overrides: harvestOverrides() }
      const stored = await window.octa.documents.save(next)
      const path = await window.octa.documents.exportPdf(stored)
      setDraft({ ...stored, pdfPath: path })
      await window.octa.documents.openPdf(path)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy('')
    }
  }

  const setField = (key: string, value: unknown): void =>
    setDraft((current) => ({ ...current, fields: { ...current.fields, [key]: value } }))

  const brand = useMemo(
    () => brands.find((entry) => entry.id === draft.brandId) ?? brands[0],
    [brands, draft.brandId]
  )

  return (
    <div className="page editor-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="compact-heading">
        <div>
          <span className="eyebrow">{draft.reference}</span>
          <h1>{documentKindLabel(draft.kind, locale)}</h1>
        </div>
        <div className="heading-actions">
          <select
            value={draft.brandId}
            onChange={(event) => setDraft({ ...draft, brandId: event.target.value })}
            aria-label={t('documentBrand', locale)}
          >
            {brands.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
          <button className="secondary-button" onClick={() => void save()} disabled={Boolean(busy)} type="button">
            {saved ? <Check size={14} aria-hidden="true" /> : <Save size={14} aria-hidden="true" />} {saved ? t('documentSaved', locale) : t('documentSave', locale)}
          </button>
          <button className="primary-button compact" onClick={() => void exportPdf()} disabled={Boolean(busy)} type="button">
            <FileDown size={14} aria-hidden="true" /> {t('documentExportPdf', locale)}
          </button>
          <button className="text-button" onClick={onClose} type="button">
            <ArrowLeft size={15} aria-hidden="true" /> {t('documentBack', locale)}
          </button>
        </div>
      </header>

      {error && <p className="inline-error">{error}</p>}
      {busy && <p className="capture-busy">{busy}</p>}

      <div className="editor-layout">
        <aside className="editor-fields glass">
          <div className="section-title">
            <h3>{t('documentFields', locale)}</h3>
            <span>{brand?.label}</span>
          </div>
          <p className="editor-hint">
            {t('documentFieldsHint', locale)}
          </p>

          <label className="editor-field">
            <span>{t('documentTitle', locale)}</span>
            <input
              value={draft.title}
              dir="auto"
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>

          {isInvoice ? (
            <p className="task-column-empty">
               {t('documentInvoiceHint', locale)}
            </p>
          ) : (
            specs.map((spec) => {
              const value = draft.fields[spec.key]
              if (spec.type === 'multiline') {
                return (
                  <label className="editor-field" key={spec.key}>
                    <span>
                      {t(spec.label, locale)}
                      {spec.hint ? <small> · {t(spec.hint, locale)}</small> : null}
                    </span>
                    <textarea
                      rows={4}
                      dir="auto"
                      value={String(value ?? '')}
                      onChange={(event) => setField(spec.key, event.target.value)}
                    />
                  </label>
                )
              }
              if (spec.type === 'money') {
                return (
                  <label className="editor-field" key={spec.key}>
                    <span>{t(spec.label, locale)}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={Number(value ?? 0) / 100}
                      onChange={(event) =>
                        setField(spec.key, Math.round(Number(event.target.value) * 100))
                      }
                    />
                  </label>
                )
              }
              if (spec.type === 'date') {
                return (
                  <label className="editor-field" key={spec.key}>
                    <span>{t(spec.label, locale)}</span>
                    <input
                      type="date"
                      value={toDateInput(value)}
                      onChange={(event) =>
                        setField(spec.key, new Date(`${event.target.value}T12:00:00`).getTime())
                      }
                    />
                  </label>
                )
              }
              return (
                <label className="editor-field" key={spec.key}>
                  <span>{t(spec.label, locale)}</span>
                  <input
                    type={spec.type === 'number' ? 'number' : 'text'}
                    dir="auto"
                    value={String(value ?? '')}
                    onChange={(event) =>
                      setField(
                        spec.key,
                        spec.type === 'number' ? Number(event.target.value) : event.target.value
                      )
                    }
                  />
                </label>
              )
            })
          )}
        </aside>

        <section className="editor-preview">
          <div className="editor-preview-bar">
            <span>
              {rendering ? (
                <>
                   <Loader2 size={13} className="spin" aria-hidden="true" /> {t('documentRendering', locale)}
                </>
              ) : (
                t('documentPreviewHint', locale)
              )}
            </span>
          </div>
          <iframe
            ref={frame}
            className="editor-frame"
            title={t('documentPreviewTitle', locale)}
            sandbox="allow-same-origin"
            srcDoc={html}
          />
        </section>
      </div>
    </div>
  )
}
