import Database from 'better-sqlite3'
import { DATABASE_BUSY_TIMEOUT_MS } from './busy-timeout'
import { randomUUID } from 'node:crypto'
import type {
  ClientRecord,
  InvoiceCurrency,
  InvoiceItem,
  InvoiceRecord,
  InvoiceStoredStatus,
  SavedLink
} from '../types'

interface LinkRow {
  id: string
  url: string
  title: string
  summary: string
  tags: string
  project: string
  created_at: number
  note_path: string | null
  readable: number
}

interface ClientRow {
  id: string
  name: string
  email: string
  phone: string
  vault_note: string | null
  created_at: number
  notion_page_id: string | null
}

interface InvoiceRow {
  id: string
  client_id: string
  client_name: string
  number: string
  currency: InvoiceCurrency
  issued_at: number
  due_at: number
  status: InvoiceStoredStatus
  notes: string
  payment_link: string
  project_note: string | null
  notion_page_id: string | null
}

export interface InvoiceSendRecord {
  id: string
  invoiceId: string
  number: string
  channel: string
  message: string
  attachment: string
  approvedAt: string
  sentAt: string
}


function jsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export class OperationsRepository {
  private readonly database: Database.Database

  constructor(path: string) {
    this.database = new Database(path, { timeout: DATABASE_BUSY_TIMEOUT_MS })
    this.database.pragma('journal_mode = WAL')
    this.database.pragma('synchronous = FULL')
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        tags TEXT NOT NULL,
        project TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        note_path TEXT,
        readable INTEGER NOT NULL DEFAULT 1
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS links_fts USING fts5(
        title, url, summary, tags, content='links', content_rowid='rowid'
      );
      CREATE TRIGGER IF NOT EXISTS links_ai AFTER INSERT ON links BEGIN
        INSERT INTO links_fts(rowid, title, url, summary, tags)
        VALUES (new.rowid, new.title, new.url, new.summary, new.tags);
      END;
      CREATE TRIGGER IF NOT EXISTS links_ad AFTER DELETE ON links BEGIN
        INSERT INTO links_fts(links_fts, rowid, title, url, summary, tags)
        VALUES ('delete', old.rowid, old.title, old.url, old.summary, old.tags);
      END;
      CREATE TRIGGER IF NOT EXISTS links_au AFTER UPDATE ON links BEGIN
        INSERT INTO links_fts(links_fts, rowid, title, url, summary, tags)
        VALUES ('delete', old.rowid, old.title, old.url, old.summary, old.tags);
        INSERT INTO links_fts(rowid, title, url, summary, tags)
        VALUES (new.rowid, new.title, new.url, new.summary, new.tags);
      END;
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        vault_note TEXT,
        created_at INTEGER NOT NULL,
        notion_page_id TEXT
      );
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id),
        number TEXT NOT NULL UNIQUE,
        currency TEXT NOT NULL CHECK(currency IN ('EGP', 'USD')),
        issued_at INTEGER NOT NULL,
        due_at INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('draft', 'sent', 'paid')),
        notes TEXT NOT NULL,
        payment_link TEXT NOT NULL,
        project_note TEXT,
        notion_page_id TEXT
      );
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        qty INTEGER NOT NULL,
        unit_price INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS invoice_sequences (
        year INTEGER PRIMARY KEY,
        last_number INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS invoice_sends (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        number TEXT NOT NULL,
        channel TEXT NOT NULL,
        message TEXT NOT NULL,
        attachment TEXT NOT NULL,
        approved_at TEXT NOT NULL,
        sent_at TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS invoice_sends_invoice_idx ON invoice_sends(invoice_id, sent_at);
      CREATE TABLE IF NOT EXISTS brief_runs (
        day TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        note_path TEXT
      );
      CREATE TABLE IF NOT EXISTS notion_mirrors (
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        notion_page_id TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(entity_type, entity_id)
      );
    `)
  }

  private link(row: LinkRow): SavedLink {
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      summary: row.summary,
      tags: jsonArray(row.tags),
      project: row.project,
      createdAt: row.created_at,
      notePath: row.note_path,
      readable: row.readable === 1
    }
  }

  upsertLink(input: Omit<SavedLink, 'id' | 'createdAt'>): SavedLink {
    const existing = this.database.prepare('SELECT id, created_at FROM links WHERE url = ?').get(input.url) as
      | { id: string; created_at: number }
      | undefined
    const record = {
      id: existing?.id ?? randomUUID(),
      url: input.url,
      title: input.title,
      summary: input.summary,
      tags: JSON.stringify(input.tags),
      project: input.project,
      created_at: existing?.created_at ?? Date.now(),
      note_path: input.notePath,
      readable: input.readable ? 1 : 0
    }
    this.database.prepare(`
      INSERT INTO links (id, url, title, summary, tags, project, created_at, note_path, readable)
      VALUES (@id, @url, @title, @summary, @tags, @project, @created_at, @note_path, @readable)
      ON CONFLICT(url) DO UPDATE SET
        title=excluded.title, summary=excluded.summary, tags=excluded.tags,
        project=excluded.project, note_path=excluded.note_path, readable=excluded.readable
    `).run(record)
    return this.link(this.database.prepare('SELECT * FROM links WHERE id = ?').get(record.id) as LinkRow)
  }

  listLinks(query = '', tag = ''): SavedLink[] {
    const normalized = query.trim()
    let rows: LinkRow[]
    if (normalized) {
      const terms = normalized.split(/\s+/).filter(Boolean).map((term) => `"${term.replaceAll('"', '""')}"`).join(' ')
      rows = this.database.prepare(`
        SELECT links.* FROM links_fts
        JOIN links ON links.rowid = links_fts.rowid
        WHERE links_fts MATCH ?
        ORDER BY links.created_at DESC
      `).all(terms) as LinkRow[]
    } else {
      rows = this.database.prepare('SELECT * FROM links ORDER BY created_at DESC').all() as LinkRow[]
    }
    return rows.map((row) => this.link(row)).filter((link) => !tag || link.tags.includes(tag))
  }

  listProjects(vaultRoot: string): string[] {
    void vaultRoot
    return []
  }

  private client(row: ClientRow): ClientRecord {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      vaultNote: row.vault_note,
      createdAt: row.created_at,
      notionPageId: row.notion_page_id
    }
  }

  saveClient(input: { id?: string; name: string; email?: string; phone?: string; vaultNote?: string | null }): ClientRecord {
    const record = {
      id: input.id ?? randomUUID(),
      name: input.name.trim(),
      email: input.email?.trim() ?? '',
      phone: input.phone?.trim() ?? '',
      vault_note: input.vaultNote ?? null,
      created_at: Date.now()
    }
    this.database.prepare(`
      INSERT INTO clients (id, name, email, phone, vault_note, created_at)
      VALUES (@id, @name, @email, @phone, @vault_note, @created_at)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, email=excluded.email,
        phone=excluded.phone, vault_note=excluded.vault_note
    `).run(record)
    return this.client(this.database.prepare('SELECT * FROM clients WHERE id = ?').get(record.id) as ClientRow)
  }

  listClients(query = ''): ClientRecord[] {
    const rows = query.trim()
      ? this.database.prepare('SELECT * FROM clients WHERE name LIKE ? ORDER BY name').all(`%${query.trim()}%`)
      : this.database.prepare('SELECT * FROM clients ORDER BY name').all()
    return (rows as ClientRow[]).map((row) => this.client(row))
  }

  getClient(id: string): ClientRecord | undefined {
    const row = this.database.prepare('SELECT * FROM clients WHERE id = ?').get(id) as ClientRow | undefined
    return row ? this.client(row) : undefined
  }

  private invoice(row: InvoiceRow): InvoiceRecord {
    const items = this.database.prepare(
      'SELECT id, description, qty, unit_price AS unitPrice FROM invoice_items WHERE invoice_id = ? ORDER BY rowid'
    ).all(row.id) as Array<InvoiceItem & { id: string }>
    const overdue = row.status !== 'paid' && row.due_at < Date.now()
    return {
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      number: row.number,
      currency: row.currency,
      issuedAt: row.issued_at,
      dueAt: row.due_at,
      status: overdue ? 'overdue' : row.status,
      storedStatus: row.status,
      notes: row.notes,
      paymentLink: row.payment_link,
      projectNote: row.project_note,
      items,
      total: items.reduce((total, item) => total + item.qty * item.unitPrice, 0),
      notionPageId: row.notion_page_id
    }
  }

  createInvoice(input: {
    clientId: string
    currency: InvoiceCurrency
    issuedAt: number
    dueAt: number
    status?: InvoiceStoredStatus
    notes?: string
    paymentLink?: string
    projectNote?: string | null
    items: InvoiceItem[]
  }): InvoiceRecord {
    if (!Number.isInteger(input.issuedAt) || !Number.isInteger(input.dueAt)) throw new Error('Invoice dates are invalid.')
    if (!input.items.length) throw new Error('An invoice needs at least one item.')
    for (const item of input.items) {
      if (!Number.isInteger(item.qty) || item.qty <= 0 || !Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
        throw new Error('Invoice amounts must be positive integer minor units.')
      }
    }

    return this.database.transaction(() => {
      const client = this.database.prepare('SELECT * FROM clients WHERE id = ?').get(input.clientId) as ClientRow | undefined
      if (!client) throw new Error('Client not found.')
      const year = new Date(input.issuedAt).getFullYear()
      this.database.prepare(`
        INSERT INTO invoice_sequences (year, last_number) VALUES (?, 1)
        ON CONFLICT(year) DO UPDATE SET last_number = last_number + 1
      `).run(year)
      const sequence = this.database.prepare('SELECT last_number FROM invoice_sequences WHERE year = ?').get(year) as { last_number: number }
      const id = randomUUID()
      const number = `${year}-${String(sequence.last_number).padStart(3, '0')}`
      this.database.prepare(`
        INSERT INTO invoices (
          id, client_id, number, currency, issued_at, due_at, status,
          notes, payment_link, project_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        input.clientId,
        number,
        input.currency,
        input.issuedAt,
        input.dueAt,
        input.status ?? 'draft',
        input.notes ?? '',
        input.paymentLink ?? '',
        input.projectNote ?? null
      )
      const insertItem = this.database.prepare(
        'INSERT INTO invoice_items (id, invoice_id, description, qty, unit_price) VALUES (?, ?, ?, ?, ?)'
      )
      for (const item of input.items) {
        insertItem.run(randomUUID(), id, item.description.trim(), item.qty, item.unitPrice)
      }
      return this.getInvoice(id)!
    })()
  }

  getInvoice(id: string): InvoiceRecord | undefined {
    const row = this.database.prepare(`
      SELECT invoices.*, clients.name AS client_name
      FROM invoices JOIN clients ON clients.id = invoices.client_id
      WHERE invoices.id = ?
    `).get(id) as InvoiceRow | undefined
    return row ? this.invoice(row) : undefined
  }

  listInvoices(): InvoiceRecord[] {
    const rows = this.database.prepare(`
      SELECT invoices.*, clients.name AS client_name
      FROM invoices JOIN clients ON clients.id = invoices.client_id
      ORDER BY issued_at DESC
    `).all() as InvoiceRow[]
    return rows.map((row) => this.invoice(row))
  }

  /**
   * Moves an invoice between draft, sent and paid. Without this every invoice
   * stayed a draft forever, silently became "overdue" after its due date, and
   * kept reappearing in the Daily Brief with no way to clear it.
   */
  setInvoiceStatus(id: string, status: InvoiceStoredStatus): InvoiceRecord {
    if (!['draft', 'sent', 'paid'].includes(status)) throw new Error('Unknown invoice status.')
    const changed = this.database
      .prepare('UPDATE invoices SET status = ? WHERE id = ?')
      .run(status, id).changes
    if (changed === 0) throw new Error('Invoice not found.')
    return this.getInvoice(id)!
  }

  recordInvoiceSend(input: Omit<InvoiceSendRecord, 'id'>): InvoiceSendRecord {
    const id = randomUUID()
    const invoice = this.getInvoice(input.invoiceId)
    if (!invoice) throw new Error('Invoice not found.')
    this.database.prepare(`
      INSERT INTO invoice_sends (id, invoice_id, number, channel, message, attachment, approved_at, sent_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.invoiceId,
      invoice.number,
      input.channel.trim() || 'email',
      input.message,
      input.attachment,
      input.approvedAt,
      input.sentAt,
      Date.now()
    )
    return { id, ...input, number: invoice.number }
  }

  listInvoiceSends(invoiceId?: string): InvoiceSendRecord[] {
    const rows = (invoiceId
      ? this.database.prepare('SELECT id, invoice_id, number, channel, message, attachment, approved_at, sent_at FROM invoice_sends WHERE invoice_id = ? ORDER BY sent_at DESC').all(invoiceId)
      : this.database.prepare('SELECT id, invoice_id, number, channel, message, attachment, approved_at, sent_at FROM invoice_sends ORDER BY sent_at DESC').all()) as Array<{
        id: string
        invoice_id: string
        number: string
        channel: string
        message: string
        attachment: string
        approved_at: string
        sent_at: string
      }>
    return rows.map((row) => ({
      id: row.id,
      invoiceId: row.invoice_id,
      number: row.number,
      channel: row.channel,
      message: row.message,
      attachment: row.attachment,
      approvedAt: row.approved_at,
      sentAt: row.sent_at
    }))
  }

  deleteInvoice(id: string): boolean {
    const remove = this.database.transaction(() => {
      this.database.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id)
      return this.database.prepare('DELETE FROM invoices WHERE id = ?').run(id).changes > 0
    })
    return remove()
  }

  deleteClient(id: string): boolean {
    // Refuse rather than orphan invoices behind a foreign key error the user
    // would see as an unexplained failure.
    const invoices = this.database
      .prepare('SELECT COUNT(*) AS n FROM invoices WHERE client_id = ?')
      .get(id) as { n: number }
    if (invoices.n > 0) {
      throw new Error(`This client has ${invoices.n} invoice(s). Delete those first.`)
    }
    return this.database.prepare('DELETE FROM clients WHERE id = ?').run(id).changes > 0
  }

  deleteLink(id: string): boolean {
    return this.database.prepare('DELETE FROM links WHERE id = ?').run(id).changes > 0
  }

  overdueInvoices(): InvoiceRecord[] {
    return this.listInvoices().filter((invoice) => invoice.status === 'overdue')
  }

  markBrief(day: string, notePath: string | null): boolean {
    return this.database.prepare(
      'INSERT OR IGNORE INTO brief_runs (day, created_at, note_path) VALUES (?, ?, ?)'
    ).run(day, Date.now(), notePath).changes > 0
  }

  updateBrief(day: string, notePath: string): void {
    this.database.prepare('UPDATE brief_runs SET note_path = ? WHERE day = ?').run(notePath, day)
  }

  clearBrief(day: string): void {
    this.database.prepare('DELETE FROM brief_runs WHERE day = ?').run(day)
  }

  // The note filename is not derivable from the day: the vault appends -2, -3
  // when a name is taken, so the stored path is the only reliable pointer.
  briefNotePath(day: string): string | undefined {
    return (
      this.database.prepare('SELECT note_path FROM brief_runs WHERE day = ?').get(day) as
        | { note_path: string | null }
        | undefined
    )?.note_path ?? undefined
  }

  hasBrief(day: string): boolean {
    return Boolean(this.database.prepare('SELECT 1 FROM brief_runs WHERE day = ?').get(day))
  }

  notionPage(entityType: string, entityId: string): string | undefined {
    return (this.database.prepare(
      'SELECT notion_page_id FROM notion_mirrors WHERE entity_type = ? AND entity_id = ?'
    ).get(entityType, entityId) as { notion_page_id: string } | undefined)?.notion_page_id
  }

  setNotionPage(entityType: string, entityId: string, pageId: string): void {
    this.database.prepare(`
      INSERT INTO notion_mirrors (entity_type, entity_id, notion_page_id, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(entity_type, entity_id) DO UPDATE SET
        notion_page_id=excluded.notion_page_id, updated_at=excluded.updated_at
    `).run(entityType, entityId, pageId, Date.now())
  }

  close(): void {
    this.database.close()
  }
}
