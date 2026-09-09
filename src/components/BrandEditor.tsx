import { useState } from 'react'
import { Check, ImagePlus, Plus, Star, Trash2, X } from 'lucide-react'
import type { DocumentBrand } from '../../electron/types'
import type { Locale } from '../i18n'
import { t } from '../i18n'

function blankBrand(locale: Locale): DocumentBrand {
  return {
    id: '',
    label: t('brandNamePlaceholder', locale),
    name: t('brandNamePlaceholder', locale),
    tagline: t('brandTaglinePlaceholder', locale),
    website: '',
    signatureName: t('brandSignatureNamePlaceholder', locale),
    signatureRole: t('brandSignatureRolePlaceholder', locale),
    signatureImage: null,
    signatureWidthMm: 50,
    accent: '#9d78d2',
    isDefault: false
  }
}

/**
 * Brands are what make the documents usable by someone who is not Abdullah:
 * the name, signature and colour printed on every page are stored per brand
 * rather than compiled into the templates.
 */
export function BrandEditor({
  brands,
  locale,
  onSaved,
  onClose
}: {
  brands: DocumentBrand[]
  locale: Locale
  onSaved: (brands: DocumentBrand[]) => void
  onClose: () => void
}): React.JSX.Element {
  const [draft, setDraft] = useState<DocumentBrand>(brands[0] ?? blankBrand(locale))
  const [error, setError] = useState('')

  const run = async (action: Promise<DocumentBrand[]>): Promise<void> => {
    try {
      setError('')
      onSaved(await action)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  const set = (patch: Partial<DocumentBrand>): void => setDraft({ ...draft, ...patch })

  return (
    <section className="brand-panel glass" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header>
        <div className="section-title">
          <h3>{t('brandEditorTitle', locale)}</h3>
          <span className="count-chip">{brands.length}</span>
        </div>
        <button className="text-button" onClick={onClose} type="button">
          <X size={14} aria-hidden="true" /> {t('brandClose', locale)}
        </button>
      </header>

      {error && <p className="inline-error">{error}</p>}

      <div className="brand-switcher">
        {brands.map((brand) => (
          <button
            key={brand.id}
            className={brand.id === draft.id ? 'active' : ''}
            onClick={() => setDraft(brand)}
            type="button"
          >
            {brand.isDefault && <Star size={11} aria-hidden="true" />}
            {brand.label}
          </button>
        ))}
        <button className="brand-new" onClick={() => setDraft(blankBrand(locale))} type="button">
          <Plus size={13} aria-hidden="true" /> {t('brandNew', locale)}
        </button>
      </div>

      <div className="brand-grid">
        <label className="editor-field">
          <span>{t('brandInternalLabel', locale)}</span>
          <input
            value={draft.label}
            placeholder={t('brandNamePlaceholder', locale)}
            onChange={(event) => set({ label: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>{t('brandWordmark', locale)}</span>
          <input
            value={draft.name}
            placeholder={t('brandNamePlaceholder', locale)}
            onChange={(event) => set({ name: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>{t('brandTagline', locale)}</span>
          <input
            value={draft.tagline}
            placeholder={t('brandTaglinePlaceholder', locale)}
            onChange={(event) => set({ tagline: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>{t('brandWebsite', locale)}</span>
          <input value={draft.website} onChange={(event) => set({ website: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>{t('brandSignatureName', locale)}</span>
          <input
            dir="auto"
            value={draft.signatureName}
            placeholder={t('brandSignatureNamePlaceholder', locale)}
            onChange={(event) => set({ signatureName: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>{t('brandSignatureRole', locale)}</span>
          <input
            dir="auto"
            value={draft.signatureRole}
            placeholder={t('brandSignatureRolePlaceholder', locale)}
            onChange={(event) => set({ signatureRole: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>{t('brandAccentColour', locale)}</span>
          <div className="brand-colour">
            <input
              type="color"
              value={draft.accent}
              onChange={(event) => set({ accent: event.target.value })}
            />
            <input value={draft.accent} onChange={(event) => set({ accent: event.target.value })} />
          </div>
        </label>
        <label className="editor-field">
          <span>{t('brandSignatureWidth', locale).replace('{width}', String(draft.signatureWidthMm))}</span>
          <input
            type="range"
            min={15}
            max={90}
            step={1}
            value={draft.signatureWidthMm}
            onChange={(event) => set({ signatureWidthMm: Number(event.target.value) })}
          />
        </label>
      </div>

      <div className="brand-signature">
        <div className="brand-signature-preview">
          {draft.signatureImage ? (
            <img
              src={draft.signatureImage}
              alt={t('brandSignatureAlt', locale)}
              style={{ width: `${draft.signatureWidthMm * 3.78}px` }}
            />
          ) : (
            /* The documents fall back to the bundled signature, so claiming the
               line prints empty would contradict what actually comes out. */
             <span>{t('brandBundledSignature', locale)}</span>
          )}
        </div>
        <div className="brand-signature-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={async () => {
              const image = await window.octa.brands.pickSignature()
              if (image) set({ signatureImage: image })
            }}
          >
            <ImagePlus size={14} aria-hidden="true" /> {t('brandChooseImage', locale)}
          </button>
          {draft.signatureImage && (
            <button className="text-button" onClick={() => set({ signatureImage: null })} type="button">
              {t('brandRemoveImage', locale)}
            </button>
          )}
        </div>
      </div>

      <footer className="brand-actions">
        <label className="brand-default">
          <input
            type="checkbox"
            checked={draft.isDefault}
            onChange={(event) => set({ isDefault: event.target.checked })}
          />
          {t('brandUseForNewDocuments', locale)}
        </label>
        <button className="primary-button compact" onClick={() => void run(window.octa.brands.save(draft))} type="button">
          <Check size={13} aria-hidden="true" /> {t('brandSave', locale)}
        </button>
        {draft.id && (
          <button
            className="text-button danger"
            type="button"
            onClick={() => {
              if (window.confirm(t('brandDeleteConfirm', locale).replace('{label}', draft.label))) {
                void run(window.octa.brands.remove(draft.id))
              }
            }}
          >
            <Trash2 size={13} aria-hidden="true" /> {t('brandDelete', locale)}
          </button>
        )}
      </footer>
    </section>
  )
}
