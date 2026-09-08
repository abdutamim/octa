import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import type { VoiceLanguage } from '../../types'
import { detectConversationLanguage } from './language'

export type ConversationRole = 'user' | 'assistant' | 'system'

export interface ConversationTurnRecord {
  id: number
  conversationId: string
  role: ConversationRole
  content: string
  language: VoiceLanguage | null
  languageHint: string | null
  createdAt: string
}

export interface ConversationRecord {
  id: string
  language: VoiceLanguage
  updatedAt: string
}

function validLanguage(value: unknown): VoiceLanguage {
  return value === 'ar-EG' || value === 'en' || value === 'mixed' ? value : 'mixed'
}

function now(): string {
  return new Date().toISOString()
}

/** SQLite conversation memory shared with the planner and the voice front. */
export class ConversationRepository {
  constructor(private readonly database: Database.Database) {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        language TEXT NOT NULL DEFAULT 'mixed',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS conversation_turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        language TEXT,
        language_hint TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_conversation_turns_conversation
        ON conversation_turns(conversation_id, id);
    `)
  }

  ensure(conversationId: string = randomUUID()): ConversationRecord {
    const id = conversationId.trim()
    if (!id) throw new Error('Conversation id is required.')
    const timestamp = now()
    this.database
      .prepare(
        `INSERT INTO conversations (id, language, updated_at) VALUES (?, 'mixed', ?)
         ON CONFLICT(id) DO NOTHING`
      )
      .run(id, timestamp)
    const record = this.get(id)
    if (!record) throw new Error(`Conversation ${id} could not be created.`)
    return record
  }

  append(
    conversationId: string,
    role: ConversationRole,
    content: string,
    languageHint?: string
  ): ConversationTurnRecord {
    const id = conversationId.trim()
    const text = content.trim()
    if (!id || !text) throw new Error('Conversation id and content are required.')
    const language = role === 'user' ? detectConversationLanguage(text, languageHint) : null
    const timestamp = now()
    const transaction = this.database.transaction(() => {
      this.ensure(id)
      this.database
        .prepare(
          `INSERT INTO conversation_turns
             (conversation_id, role, content, language, language_hint, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(id, role, text, language, languageHint?.trim() || null, timestamp)
      if (language) {
        this.database
          .prepare('UPDATE conversations SET language = ?, updated_at = ? WHERE id = ?')
          .run(language, timestamp, id)
      } else {
        this.database
          .prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
          .run(timestamp, id)
      }
    })
    transaction()
    const row = this.database
      .prepare('SELECT id, conversation_id, role, content, language, language_hint, created_at FROM conversation_turns WHERE conversation_id = ? ORDER BY id DESC LIMIT 1')
      .get(id) as {
        id: number
        conversation_id: string
        role: string
        content: string
        language: string | null
        language_hint: string | null
        created_at: string
      } | undefined
    if (!row) throw new Error('Conversation turn was not stored.')
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role === 'assistant' || row.role === 'system' ? row.role : 'user',
      content: row.content,
      language: row.language ? validLanguage(row.language) : null,
      languageHint: row.language_hint,
      createdAt: row.created_at
    }
  }

  get(conversationId: string): ConversationRecord | null {
    const row = this.database
      .prepare('SELECT id, language, updated_at FROM conversations WHERE id = ?')
      .get(conversationId.trim()) as { id: string; language: string; updated_at: string } | undefined
    return row
      ? { id: row.id, language: validLanguage(row.language), updatedAt: row.updated_at }
      : null
  }

  getLanguage(conversationId: string | null | undefined): VoiceLanguage | null {
    if (!conversationId?.trim()) return null
    return this.get(conversationId)?.language ?? null
  }

  listTurns(conversationId: string, limit = 200): ConversationTurnRecord[] {
    const rows = this.database
      .prepare('SELECT id, conversation_id, role, content, language, language_hint, created_at FROM conversation_turns WHERE conversation_id = ? ORDER BY id ASC LIMIT ?')
      .all(conversationId.trim(), Math.max(1, Math.min(1_000, Math.trunc(limit)))) as Array<{
        id: number
        conversation_id: string
        role: string
        content: string
        language: string | null
        language_hint: string | null
        created_at: string
      }>
    return rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role === 'assistant' || row.role === 'system' ? row.role : 'user',
      content: row.content,
      language: row.language ? validLanguage(row.language) : null,
      languageHint: row.language_hint,
      createdAt: row.created_at
    }))
  }
}
