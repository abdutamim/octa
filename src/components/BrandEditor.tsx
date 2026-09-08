import { useState } from 'react'
import { Check, ImagePlus, Plus, Star, Trash2, X } from 'lucide-react'
import type { DocumentBrand } from '../../electron/types'

const BLANK: DocumentBrand = {
  id: '',
  label: 'New brand',
  name: 'YOUR NAME',
  tagline: 'BUSINESS DOCUMENT SYSTEM',
  website: 'example.com',
  signatureName: 'الاسم',
  signatureRole: 'الصفة',
  signatureImage: null,
  signatureWidthMm: 50,
  accent: '#f25b1b',
  isDefault: false
}

/**
 * Brands are what make the documents usable by someone who is not Abdullah:
 * the name, signature and colour printed on every page are stored per brand
 * rather than compiled into the templates.
 */
export function BrandEditor({
  brands,
  onSaved,
  onClose
}: {
  brands: DocumentBrand[]
  onSaved: (brands: DocumentBrand[]) => void
  onClose: () => void
}): React.JSX.Element {
  const [draft, setDraft] = useState<DocumentBrand>(brands[0] ?? BLANK)
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
    <section className="brand-panel glass">
      <header>
        <div className="section-title">
          <h3>Document brands</h3>
          <span className="count-chip">{brands.length}</span>
        </div>
        <button className="text-button" onClick={onClose}>
          <X size={14} /> Close
        </button>
      </header>

      {error && <p className="inline-error">{error}</p>}

      <div className="brand-switcher">
        {brands.map((brand) => (
          <button
            key={brand.id}
            className={brand.id === draft.id ? 'active' : ''}
            onClick={() => setDraft(brand)}
          >
            {brand.isDefault && <Star size={11} />}
            {brand.label}
          </button>
        ))}
        <button className="brand-new" onClick={() => setDraft({ ...BLANK })}>
          <Plus size={13} /> New
        </button>
      </div>

      <div className="brand-grid">
        <label className="editor-field">
          <span>Label (internal)</span>
          <input value={draft.label} onChange={(event) => set({ label: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Wordmark</span>
          <input value={draft.name} onChange={(event) => set({ name: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Tagline</span>
          <input value={draft.tagline} onChange={(event) => set({ tagline: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Website</span>
          <input value={draft.website} onChange={(event) => set({ website: event.target.value })} />
        </label>
        <label className="editor-field">
          <span>Signature name</span>
          <input
            dir="auto"
            value={draft.signatureName}
            onChange={(event) => set({ signatureName: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Signature role</span>
          <input
            dir="auto"
            value={draft.signatureRole}
            onChange={(event) => set({ signatureRole: event.target.value })}
          />
        </label>
        <label className="editor-field">
          <span>Accent colour</span>
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
          <span>Signature width · {draft.signatureWidthMm}mm</span>
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
              alt="Signature"
              style={{ width: `${draft.signatureWidthMm * 3.78}px` }}
            />
          ) : (
            /* The documents fall back to the bundled signature, so claiming the
               line prints empty would contradict what actually comes out. */
            <span>Using the bundled signature. Choose an image to replace it.</span>
          )}
        </div>
        <div className="brand-signature-actions">
          <button
            className="secondary-button"
            onClick={async () => {
              const image = await window.octa.brands.pickSignature()
              if (image) set({ signatureImage: image })
            }}
          >
            <ImagePlus size={14} /> Choose image
          </button>
          {draft.signatureImage && (
            <button className="text-button" onClick={() => set({ signatureImage: null })}>
              Remove
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
          Use for new documents
        </label>
        <button className="primary-button compact" onClick={() => void run(window.octa.brands.save(draft))}>
          <Check size={13} /> Save brand
        </button>
        {draft.id && (
          <button
            className="text-button danger"
            onClick={() => {
              if (window.confirm(`Delete brand "${draft.label}"?`)) {
                void run(window.octa.brands.remove(draft.id))
              }
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </footer>
    </section>
  )
}
