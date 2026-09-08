import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  FileSignature,
  FileText,
  Palette,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  UserPlus,
  Users
} from 'lucide-react'
import type {
  ClientRecord,
  DocumentBrand,
  DocumentKind,
  DocumentRecord,
  InvoiceCurrency,
  InvoiceRecord
} from '../../electron/types'
import { BrandEditor } from './BrandEditor'
import { DocumentEditor } from './DocumentEditor'

const KINDS: Array<{ kind: DocumentKind; label: string; icon: typeof FileText }> = [
  { kind: 'proposal', label: 'Proposals', icon: FileText },
  { kind: 'contract', label: 'Contracts', icon: FileSignature },
  { kind: 'invoice', label: 'Invoices', icon: ReceiptText }
]

function currency(minor: number, code: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(minor / 100)
}

/** Blank starting content per document type, so a new draft is never an empty page. */
function starterFields(kind: DocumentKind, client: ClientRecord, reference: string): Record<string, unknown> {
  if (kind === 'contract') {
    return {
      reference,
      clientName: client.name,
      clientDetails: client.email || '',
      projectName: '',
      subject: '',
      scopeIn: 'تصميم الواجهات\nبرمجة الصفحات',
      scopeOut: 'كتابة المحتوى\nالاستضافة والدومين',
      phases: [
        { title: 'استلام المتطلبات', detail: 'جلسة تحديد النطاق.' },
        { title: 'التصميم والاعتماد', detail: 'تسليم التصميم ومراجعتان.' },
        { title: 'التطوير والربط', detail: 'برمجة الواجهات.' },
        { title: 'الاختبار والتسليم', detail: 'اختبار ثم تسليم نهائي.' }
      ],
      amountMinor: 0,
      currency: 'EGP',
      paymentTerms: '٥٠٪ مقدمًا، و٥٠٪ عند التسليم.',
      revisions: 'مراجعتان مجانيتان لكل مرحلة.',
      deliverables: 'الكود المصدري\nملفات التصميم',
      startAt: Date.now(),
      durationDays: 30
    }
  }
  return {
    reference,
    clientName: client.name,
    title: '',
    titleAccent: '',
    understanding: '',
    objectives: [
      { title: '', detail: '' },
      { title: '', detail: '' }
    ],
    scope: [{ title: 'التصميم والواجهة', items: '' }],
    plan: [
      { title: 'التحليل', detail: '' },
      { title: 'التصميم', detail: '' },
      { title: 'التطوير', detail: '' },
      { title: 'التسليم', detail: '' }
    ],
    clientNeeds: '',
    includes: '',
    excludes: '',
    amountMinor: 0,
    currency: 'EGP',
    durationDays: 30,
    nextStep: 'باعتماد هذا العرض نبدأ خلال ٤٨ ساعة.'
  }
}

export function ClientsPage({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [brands, setBrands] = useState<DocumentBrand[]>([])
  const [selected, setSelected] = useState<string>()
  const [tab, setTab] = useState<DocumentKind>('proposal')
  const [editing, setEditing] = useState<DocumentRecord>()
  const [brandPanel, setBrandPanel] = useState(false)
  const [newClient, setNewClient] = useState('')
  const [error, setError] = useState('')
  const firstLoad = useRef(true)

  const load = useCallback(async () => {
    const [nextClients, nextInvoices, nextDocuments, nextBrands] = await Promise.all([
      window.octa.billing.clients(),
      window.octa.billing.invoices(),
      window.octa.documents.list(),
      window.octa.brands.list()
    ])
    setClients(nextClients)
    setInvoices(nextInvoices)
    setDocuments(nextDocuments)
    setBrands(nextBrands)
    if (firstLoad.current && nextClients[0]) {
      setSelected(nextClients[0].id)
      firstLoad.current = false
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (action: Promise<unknown>): Promise<void> => {
    try {
      setError('')
      await action
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  const client = clients.find((entry) => entry.id === selected)
  const clientInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.clientId === selected),
    [invoices, selected]
  )
  const clientDocuments = useMemo(
    () => documents.filter((doc) => doc.clientId === selected && doc.kind === tab),
    [documents, selected, tab]
  )

  const createDocument = async (): Promise<void> => {
    if (!client) return
    const reference = await window.octa.documents.nextReference(tab)
    const brand = brands.find((entry) => entry.isDefault) ?? brands[0]
    const record: DocumentRecord = {
      id: '',
      kind: tab,
      clientId: client.id,
      clientName: client.name,
      brandId: brand?.id ?? '',
      reference,
      title: tab === 'contract' ? 'عقد جديد' : 'عرض جديد',
      fields: starterFields(tab, client, reference),
      overrides: {},
      createdAt: 0,
      updatedAt: 0,
      pdfPath: null
    }
    const saved = await window.octa.documents.save(record)
    await load()
    setEditing(saved)
  }

  if (editing) {
    return (
      <DocumentEditor
        record={editing}
        brands={brands}
        onClose={() => {
          setEditing(undefined)
          void load()
        }}
      />
    )
  }

  return (
    <div className="page">
      <header className="compact-heading">
        <div>
          <span className="eyebrow">CLIENT OPERATIONS</span>
          <h1>Clients</h1>
        </div>
        <div className="heading-actions">
          <button className="text-button" onClick={() => setBrandPanel(!brandPanel)}>
            <Palette size={15} /> Brands
          </button>
          <button className="text-button" onClick={onBack}>
            <ArrowLeft size={15} /> Back
          </button>
        </div>
      </header>

      {error && <p className="inline-error">{error}</p>}

      {brandPanel && (
        <BrandEditor
          brands={brands}
          onSaved={(next) => setBrands(next)}
          onClose={() => setBrandPanel(false)}
        />
      )}

      <div className="clients-layout">
        <aside className="clients-list glass">
          <div className="section-title">
            <h3>
              <Users size={15} /> Clients
            </h3>
            <span>{clients.length}</span>
          </div>
          <div className="clients-scroll">
            {clients.map((entry) => (
              <button
                key={entry.id}
                className={entry.id === selected ? 'active' : ''}
                onClick={() => setSelected(entry.id)}
              >
                <strong dir="auto">{entry.name}</strong>
                <span>{entry.email || '—'}</span>
              </button>
            ))}
            {clients.length === 0 && <p className="task-column-empty">No clients yet.</p>}
          </div>
          <div className="clients-add">
            <input
              value={newClient}
              onChange={(event) => setNewClient(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || !newClient.trim()) return
                void run(window.octa.billing.saveClient({ name: newClient.trim() }))
                setNewClient('')
              }}
              placeholder="New client name"
              dir="auto"
            />
            <button
              className="secondary-button"
              disabled={!newClient.trim()}
              onClick={() => {
                void run(window.octa.billing.saveClient({ name: newClient.trim() }))
                setNewClient('')
              }}
            >
              <UserPlus size={14} />
            </button>
          </div>
        </aside>

        <section className="clients-detail">
          {!client ? (
            <div className="glass empty-state">
              <Users size={26} />
              <h3>Pick a client</h3>
              <p>Proposals, contracts and invoices all live under the client they belong to.</p>
            </div>
          ) : (
            <>
              <header className="client-head glass">
                <div>
                  <h2 dir="auto">{client.name}</h2>
                  <span>{client.email || 'No email on file'}</span>
                </div>
                <button
                  className="text-button danger"
                  onClick={() => {
                    if (window.confirm(`Delete ${client.name}?`)) {
                      void run(window.octa.billing.deleteClient(client.id))
                      setSelected(undefined)
                    }
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </header>

              <div className="mode-picker doc-tabs" role="radiogroup" aria-label="Document type">
                {KINDS.map(({ kind, label, icon: Icon }) => (
                  <button
                    key={kind}
                    className={tab === kind ? 'active' : ''}
                    role="radio"
                    aria-checked={tab === kind}
                    onClick={() => setTab(kind)}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {tab === 'invoice' ? (
                <section className="glass doc-list">
                  {clientInvoices.length === 0 && (
                    <p className="task-column-empty">No invoices for this client yet.</p>
                  )}
                  {clientInvoices.map((invoice) => (
                    <article key={invoice.id}>
                      <div>
                        <strong>{invoice.number}</strong>
                        <span>{currency(invoice.total, invoice.currency)}</span>
                      </div>
                      <span className={`status-pill ${invoice.status}`}>{invoice.status}</span>
                      <div className="doc-actions">
                        {invoice.storedStatus !== 'sent' && invoice.storedStatus !== 'paid' && (
                          <button
                            className="text-button"
                            onClick={() =>
                              void run(window.octa.billing.setStatus(invoice.id, 'sent'))
                            }
                          >
                            Mark sent
                          </button>
                        )}
                        {invoice.storedStatus !== 'paid' && (
                          <button
                            className="text-button"
                            onClick={() =>
                              void run(window.octa.billing.setStatus(invoice.id, 'paid'))
                            }
                          >
                            <Check size={13} /> Mark paid
                          </button>
                        )}
                        <button
                          className="text-button"
                          onClick={async () => {
                            const path = await window.octa.billing.pdf(invoice.id)
                            await window.octa.billing.openPdf(path)
                          }}
                        >
                          PDF
                        </button>
                        <button
                          className="text-button danger"
                          onClick={() => {
                            if (window.confirm(`Delete invoice ${invoice.number}?`)) {
                              void run(window.octa.billing.deleteInvoice(invoice.id))
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </article>
                  ))}
                </section>
              ) : (
                <section className="glass doc-list">
                  <div className="doc-list-head">
                    <button className="primary-button compact" onClick={() => void createDocument()}>
                      <Plus size={13} /> New {tab}
                    </button>
                  </div>
                  {clientDocuments.length === 0 && (
                    <p className="task-column-empty">Nothing here yet.</p>
                  )}
                  {clientDocuments.map((doc) => (
                    <article key={doc.id}>
                      <div>
                        <strong dir="auto">{doc.title || doc.reference}</strong>
                        <span>{doc.reference}</span>
                      </div>
                      <span className="doc-date">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="doc-actions">
                        <button className="text-button" onClick={() => setEditing(doc)}>
                          Open
                        </button>
                        {doc.pdfPath && (
                          <button
                            className="text-button"
                            onClick={() => void window.octa.documents.openPdf(doc.pdfPath!)}
                          >
                            PDF
                          </button>
                        )}
                        <button
                          className="text-button danger"
                          onClick={() => {
                            if (window.confirm(`Delete ${doc.reference}?`)) {
                              void run(window.octa.documents.remove(doc.id))
                            }
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export { currency as formatClientCurrency, Save }
