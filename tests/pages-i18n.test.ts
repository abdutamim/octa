/// <reference path="../src/global.d.ts" />

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { ClientRecord, DocumentBrand, DocumentRecord, TaskRecord } from '../electron/types'
import type { OctaApi } from '../electron/preload'
import { BrandEditor } from '../src/components/BrandEditor'
import { ClientsPage } from '../src/components/ClientsPage'
import { DocumentEditor } from '../src/components/DocumentEditor'
import { TasksPage } from '../src/components/TasksPage'

const client: ClientRecord = {
  id: 'client-1',
  name: 'Acme Studio',
  email: 'hello@example.com',
  phone: '',
  vaultNote: null,
  createdAt: Date.parse('2026-09-01T08:00:00.000Z'),
  notionPageId: null
}

const brand: DocumentBrand = {
  id: 'brand-1',
  label: 'Octa Studio',
  name: 'OCTA STUDIO',
  tagline: 'A useful studio',
  website: 'octa.example',
  signatureName: 'Octa',
  signatureRole: 'Studio',
  signatureImage: null,
  signatureWidthMm: 50,
  accent: '#9d78d2',
  isDefault: true
}

const record: DocumentRecord = {
  id: 'doc-1',
  kind: 'contract',
  clientId: client.id,
  clientName: client.name,
  brandId: brand.id,
  reference: 'CON-0001',
  title: 'اتفاق مشروع',
  fields: {
    projectName: 'تحديث موقع',
    clientDetails: client.email,
    subject: '',
    amountMinor: 0,
    durationDays: 30,
    startAt: Date.parse('2026-09-01T12:00:00.000Z'),
    scopeIn: '',
    scopeOut: '',
    deliverables: ''
  },
  overrides: {},
  createdAt: Date.parse('2026-09-01T08:00:00.000Z'),
  updatedAt: Date.parse('2026-09-01T08:00:00.000Z'),
  pdfPath: null
}

const task: TaskRecord = {
  id: 'task-1',
  title: 'Prepare the brief',
  notes: '',
  project: 'Octa',
  status: 'doing',
  priority: 1,
  dueAt: null,
  estimateMinutes: 25,
  trackedSeconds: 90,
  runningSince: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  completedAt: null,
  source: 'manual',
  vaultNote: null
}

const api = {
  tasks: {
    list: vi.fn(async () => [task]),
    create: vi.fn(async () => task),
    update: vi.fn(async () => task),
    remove: vi.fn(async () => true),
    start: vi.fn(async () => task),
    stop: vi.fn(async () => task),
    running: vi.fn(async () => task),
    projects: vi.fn(async () => ['Octa'])
  },
  billing: {
    clients: vi.fn(async () => [client]),
    saveClient: vi.fn(async () => client),
    invoices: vi.fn(async () => []),
    createInvoice: vi.fn(async () => { throw new Error('not used') }),
    setStatus: vi.fn(async () => []),
    deleteInvoice: vi.fn(async () => []),
    deleteClient: vi.fn(async () => []),
    pdf: vi.fn(async () => 'C:\\Octa\\invoice.pdf'),
    openPdf: vi.fn(async () => '')
  },
  brands: {
    list: vi.fn(async () => [brand]),
    save: vi.fn(async () => [brand]),
    remove: vi.fn(async () => []),
    pickSignature: vi.fn(async () => null)
  },
  documents: {
    list: vi.fn(async () => [record]),
    get: vi.fn(async () => record),
    nextReference: vi.fn(async () => 'CON-0002'),
    save: vi.fn(async () => record),
    remove: vi.fn(async () => true),
    preview: vi.fn(async () => '<p>preview</p>'),
    exportPdf: vi.fn(async () => 'C:\\Octa\\document.pdf'),
    openPdf: vi.fn(async () => '')
  },
  onTasksChanged: vi.fn(() => () => undefined)
} as unknown as OctaApi

vi.stubGlobal('window', { octa: api })

const oldEnglishLiterals = [
  'CLIENT OPERATIONS',
  'Clients',
  'Brands',
  'Back',
  'No clients yet.',
  'New client name',
  'Pick a client',
  'Proposals, contracts and invoices all live under the client they belong to.',
  'No email on file',
  'Delete',
  'Document type',
  'Contracts',
  'Invoices',
  'No invoices for this client yet.',
  'Mark sent',
  'Mark paid',
  'New proposal',
  'Nothing here yet.',
  'Open',
  'Doing',
  'To do',
  'Inbox',
  'Done',
  'Today',
  'Tomorrow',
  'overdue',
  'What needs doing?',
  'New task title',
  'Details',
  'Add task',
  'Project',
  'Priority',
  'Due date',
  'Estimate',
  'minutes',
  'Reopen task',
  'Complete task',
  'Stop timing',
  'Start timing',
  'Delete task',
  'WORK',
  'Tasks',
  'tracked',
  'Back home',
  'Search tasks',
  'Filter by project',
  'All projects',
  'Clear filters',
  'Nothing here',
  'Fields',
  'Document preview',
  'Rendering…',
  'Save brand',
  'Choose image',
  'Use for new documents'
]

function render(component: React.ReactElement): string {
  return renderToStaticMarkup(component)
}

describe('Tasks and client work pages', () => {
  it.each(['ar', 'en'] as const)('renders Tasks in %s with its page direction', (locale) => {
    const html = render(createElement(TasksPage, { locale, onBack: () => undefined }))
    expect(html).toContain(`dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`)
    expect(html).toContain(locale === 'ar' ? 'المهام' : 'Tasks')
    expect(html).toContain(locale === 'ar' ? 'بيتعمل دلوقتي' : 'Doing')
    expect(html).toContain(locale === 'ar' ? 'الوارد' : 'Inbox')
    if (locale === 'ar') {
      expect(html).toContain('دوّر في المهام')
      expect(html).toContain('مفيش حاجة هنا')
      for (const literal of oldEnglishLiterals) expect(html).not.toContain(literal)
    }
  })

  it.each(['ar', 'en'] as const)('renders Clients in %s with its empty state', (locale) => {
    const html = render(createElement(ClientsPage, { locale, onBack: () => undefined }))
    expect(html).toContain(`dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`)
    expect(html).toContain(locale === 'ar' ? 'العملاء' : 'Clients')
    expect(html).toContain(locale === 'ar' ? 'مفيش عملاء لسه.' : 'No clients yet.')
    expect(html).toContain(locale === 'ar' ? 'اختار عميل' : 'Pick a client')
    if (locale === 'ar') for (const literal of oldEnglishLiterals) expect(html).not.toContain(literal)
  })

  it('keeps document and brand editor chrome bilingual in Arabic', () => {
    const documentHtml = render(createElement(DocumentEditor, {
      brands: [brand],
      locale: 'ar',
      onClose: () => undefined,
      record
    }))
    const brandHtml = render(createElement(BrandEditor, {
      brands: [],
      locale: 'ar',
      onClose: () => undefined,
      onSaved: () => undefined
    }))
    const html = `${documentHtml}${brandHtml}`
    expect(html).toContain('البيانات الأساسية')
    expect(html).toContain('هويات المستندات')
    for (const literal of oldEnglishLiterals) expect(html).not.toContain(literal)
  })
})
