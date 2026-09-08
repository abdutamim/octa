import Database from 'better-sqlite3'
import { DATABASE_BUSY_TIMEOUT_MS } from './busy-timeout'
import { randomUUID } from 'node:crypto'
import type { DocumentBrand, DocumentKind, DocumentRecord } from '../types'
import { DEFAULT_BRAND } from '../types'

interface BrandRow {
  id: string
  label: string
  name: string
  tagline: string
  website: string
  signature_name: string
  signature_role: string
  signature_image: string | null
  signature_width_mm: number
  accent: string
  is_default: number
}

interface DocumentRow {
  id: string
  kind: DocumentKind
  client_id: string | null
  client_name: string
  brand_id: string
  reference: string
  title: string
  fields: string
  overrides: string
  created_at: number
  updated_at: number
  pdf_path: string | null
}

function parseObject(value: string): Record<string, never> {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export class DocumentRepository {
  private readonly database: Database.Database

  constructor(path: string) {
    this.database = new Database(path, { timeout: DATABASE_BUSY_TIMEOUT_MS })
    this.database.pragma('journal_mode = WAL')
    this.database.pragma('synchronous = FULL')
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS document_brands (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        name TEXT NOT NULL,
        tagline TEXT NOT NULL,
        website TEXT NOT NULL,
        signature_name TEXT NOT NULL,
        signature_role TEXT NOT NULL,
        signature_image TEXT,
        signature_width_mm REAL NOT NULL DEFAULT 50,
        accent TEXT NOT NULL DEFAULT '#f25b1b',
        is_default INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        client_id TEXT,
        client_name TEXT NOT NULL,
        brand_id TEXT NOT NULL,
        reference TEXT NOT NULL,
        title TEXT NOT NULL,
        fields TEXT NOT NULL DEFAULT '{}',
        overrides TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        pdf_path TEXT
      );
      CREATE INDEX IF NOT EXISTS documents_client_idx ON documents(client_id, kind);
    `)
    this.seedDefaultBrand()
  }

  // Without a brand the document generators have no name to print, so the app
  // ships with one rather than rendering a blank header on first run.
  private seedDefaultBrand(): void {
    const count = this.database.prepare('SELECT COUNT(*) AS n FROM document_brands').get() as {
      n: number
    }
    if (count.n > 0) return
    this.saveBrand({ ...DEFAULT_BRAND, id: randomUUID() })
  }

  private brand(row: BrandRow): DocumentBrand {
    return {
      id: row.id,
      label: row.label,
      name: row.name,
      tagline: row.tagline,
      website: row.website,
      signatureName: row.signature_name,
      signatureRole: row.signature_role,
      signatureImage: row.signature_image,
      signatureWidthMm: row.signature_width_mm,
      accent: row.accent,
      isDefault: row.is_default === 1
    }
  }

  listBrands(): DocumentBrand[] {
    return (
      this.database
        .prepare('SELECT * FROM document_brands ORDER BY is_default DESC, label')
        .all() as BrandRow[]
    ).map((row) => this.brand(row))
  }

  getBrand(id: string): DocumentBrand | undefined {
    const row = this.database.prepare('SELECT * FROM document_brands WHERE id = ?').get(id) as
      | BrandRow
      | undefined
    return row ? this.brand(row) : undefined
  }

  defaultBrand(): DocumentBrand {
    const row = this.database
      .prepare('SELECT * FROM document_brands ORDER BY is_default DESC, label LIMIT 1')
      .get() as BrandRow | undefined
    if (row) return this.brand(row)
    const seeded = { ...DEFAULT_BRAND, id: randomUUID() }
    this.saveBrand(seeded)
    return seeded
  }

  saveBrand(brand: DocumentBrand): DocumentBrand {
    const record = {
      id: brand.id || randomUUID(),
      label: brand.label.trim().slice(0, 120) || 'Untitled',
      name: brand.name.trim().slice(0, 120),
      tagline: brand.tagline.trim().slice(0, 160),
      website: brand.website.trim().slice(0, 200),
      signature_name: brand.signatureName.trim().slice(0, 120),
      signature_role: brand.signatureRole.trim().slice(0, 200),
      signature_image: brand.signatureImage,
      // Below ~15mm the signature is unreadable; above ~90mm it escapes its card.
      signature_width_mm: Math.min(90, Math.max(15, Number(brand.signatureWidthMm) || 50)),
      accent: /^#[0-9a-f]{6}$/i.test(brand.accent) ? brand.accent : DEFAULT_BRAND.accent,
      is_default: brand.isDefault ? 1 : 0
    }
    const apply = this.database.transaction(() => {
      // Exactly one default, always: two would make "which brand" ambiguous at
      // the moment a document is created.
      if (record.is_default === 1) {
        this.database.prepare('UPDATE document_brands SET is_default = 0').run()
      }
      this.database
        .prepare(
          `INSERT INTO document_brands (
             id, label, name, tagline, website, signature_name, signature_role,
             signature_image, signature_width_mm, accent, is_default
           ) VALUES (
             @id, @label, @name, @tagline, @website, @signature_name, @signature_role,
             @signature_image, @signature_width_mm, @accent, @is_default
           )
           ON CONFLICT(id) DO UPDATE SET
             label=excluded.label, name=excluded.name, tagline=excluded.tagline,
             website=excluded.website, signature_name=excluded.signature_name,
             signature_role=excluded.signature_role, signature_image=excluded.signature_image,
             signature_width_mm=excluded.signature_width_mm, accent=excluded.accent,
             is_default=excluded.is_default`
        )
        .run(record)
    })
    apply()
    return this.getBrand(record.id)!
  }

  removeBrand(id: string): boolean {
    // Deleting the last brand would leave documents with no identity to print.
    const remaining = this.database.prepare('SELECT COUNT(*) AS n FROM document_brands').get() as {
      n: number
    }
    if (remaining.n <= 1) throw new Error('At least one brand must exist.')
    const removed = this.database.prepare('DELETE FROM document_brands WHERE id = ?').run(id)
      .changes > 0
    if (removed && !this.database.prepare('SELECT 1 FROM document_brands WHERE is_default = 1').get()) {
      const next = this.database.prepare('SELECT id FROM document_brands LIMIT 1').get() as {
        id: string
      }
      this.database.prepare('UPDATE document_brands SET is_default = 1 WHERE id = ?').run(next.id)
    }
    return removed
  }

  private document(row: DocumentRow): DocumentRecord {
    return {
      id: row.id,
      kind: row.kind,
      clientId: row.client_id,
      clientName: row.client_name,
      brandId: row.brand_id,
      reference: row.reference,
      title: row.title,
      fields: parseObject(row.fields),
      overrides: parseObject(row.overrides),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      pdfPath: row.pdf_path
    }
  }

  /** Sequential per kind and year: INV-2026-001, CT-2026-001, PR-2026-001. */
  nextReference(kind: DocumentKind, now = Date.now()): string {
    const prefix = kind === 'invoice' ? 'INV' : kind === 'contract' ? 'CT' : 'PR'
    const year = new Date(now).getFullYear()
    const row = this.database
      .prepare(
        `SELECT reference FROM documents
         WHERE kind = ? AND reference LIKE ?
         ORDER BY reference DESC LIMIT 1`
      )
      .get(kind, `${prefix}-${year}-%`) as { reference: string } | undefined
    const last = row ? Number(row.reference.split('-').pop()) : 0
    const next = Number.isFinite(last) ? last + 1 : 1
    return `${prefix}-${year}-${String(next).padStart(3, '0')}`
  }

  save(input: Omit<DocumentRecord, 'createdAt' | 'updatedAt'> & { id?: string }): DocumentRecord {
    const now = Date.now()
    const existing = input.id ? this.get(input.id) : undefined
    const record = {
      id: input.id || randomUUID(),
      kind: input.kind,
      client_id: input.clientId,
      client_name: input.clientName.trim().slice(0, 200),
      brand_id: input.brandId,
      reference: input.reference.trim().slice(0, 60),
      title: input.title.trim().slice(0, 300),
      fields: JSON.stringify(input.fields ?? {}),
      overrides: JSON.stringify(input.overrides ?? {}),
      created_at: existing?.createdAt ?? now,
      updated_at: now,
      pdf_path: input.pdfPath
    }
    this.database
      .prepare(
        `INSERT INTO documents (
           id, kind, client_id, client_name, brand_id, reference, title,
           fields, overrides, created_at, updated_at, pdf_path
         ) VALUES (
           @id, @kind, @client_id, @client_name, @brand_id, @reference, @title,
           @fields, @overrides, @created_at, @updated_at, @pdf_path
         )
         ON CONFLICT(id) DO UPDATE SET
           kind=excluded.kind, client_id=excluded.client_id, client_name=excluded.client_name,
           brand_id=excluded.brand_id, reference=excluded.reference, title=excluded.title,
           fields=excluded.fields, overrides=excluded.overrides,
           updated_at=excluded.updated_at, pdf_path=excluded.pdf_path`
      )
      .run(record)
    return this.get(record.id)!
  }

  get(id: string): DocumentRecord | undefined {
    const row = this.database.prepare('SELECT * FROM documents WHERE id = ?').get(id) as
      | DocumentRow
      | undefined
    return row ? this.document(row) : undefined
  }

  list(filter: { clientId?: string; kind?: DocumentKind } = {}): DocumentRecord[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}
    if (filter.clientId) {
      clauses.push('client_id = @clientId')
      params.clientId = filter.clientId
    }
    if (filter.kind) {
      clauses.push('kind = @kind')
      params.kind = filter.kind
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    return (
      this.database
        .prepare(`SELECT * FROM documents ${where} ORDER BY updated_at DESC`)
        .all(params) as DocumentRow[]
    ).map((row) => this.document(row))
  }

  remove(id: string): boolean {
    return this.database.prepare('DELETE FROM documents WHERE id = ?').run(id).changes > 0
  }

  close(): void {
    this.database.close()
  }
}
