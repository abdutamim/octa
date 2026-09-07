import { describe, expect, it, beforeEach } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  aiAuthMissingMessage,
  authFingerprint,
  clearVertexTokenCache,
  createTransport,
  resolveAiAuth,
  type AiAuth
} from '../electron/cloud/vertex'
import { isCapacityError } from '../electron/cloud/fallback-chat'
import { DEFAULT_SETTINGS } from '../electron/types'

function writeServiceAccountKey(overrides: Record<string, unknown> = {}): string {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const dir = mkdtempSync(join(tmpdir(), 'vertex-test-'))
  const path = join(dir, 'sa-key.json')
  writeFileSync(
    path,
    JSON.stringify({
      type: 'service_account',
      project_id: 'test-project-123',
      client_email: 'svc@test-project-123.iam.gserviceaccount.com',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
      token_uri: 'https://oauth2.googleapis.com/token',
      ...overrides
    })
  )
  return path
}

function tokenFetcher(
  calls: { count: number },
  accessToken = 'test-token'
): typeof fetch {
  return (async (url: RequestInfo | URL) => {
    if (String(url).includes('oauth2.googleapis.com/token')) {
      calls.count += 1
      return new Response(JSON.stringify({ access_token: accessToken, expires_in: 3600 }), {
        status: 200
      })
    }
    throw new Error(`unexpected fetch: ${String(url)}`)
  }) as typeof fetch
}

describe('resolveAiAuth', () => {
  it('prefers the API key when the provider is gemini', () => {
    const auth = resolveAiAuth({ ...DEFAULT_SETTINGS, geminiApiKey: ' abc ' })
    expect(auth).toEqual({ kind: 'api-key', apiKey: 'abc' })
  })

  it('returns null when nothing is configured', () => {
    expect(resolveAiAuth(DEFAULT_SETTINGS)).toBeNull()
    expect(resolveAiAuth({ ...DEFAULT_SETTINGS, aiProvider: 'vertex' })).toBeNull()
  })

  it('builds vertex auth with a global default location', () => {
    const auth = resolveAiAuth({
      ...DEFAULT_SETTINGS,
      aiProvider: 'vertex',
      vertexKeyPath: 'C:\\keys\\sa.json',
      vertexLocation: '  '
    })
    expect(auth).toEqual({
      kind: 'vertex',
      keyPath: 'C:\\keys\\sa.json',
      projectId: '',
      location: 'global'
    })
  })

  it('names the missing credential per provider', () => {
    expect(aiAuthMissingMessage(DEFAULT_SETTINGS)).toMatch(/Gemini API key/)
    expect(aiAuthMissingMessage({ ...DEFAULT_SETTINGS, aiProvider: 'vertex' })).toMatch(
      /service-account/
    )
  })
})

describe('authFingerprint', () => {
  it('is stable per configuration and distinct across providers', () => {
    const a: AiAuth = { kind: 'api-key', apiKey: 'k1' }
    const v: AiAuth = { kind: 'vertex', keyPath: 'p', projectId: 'x', location: 'global' }
    expect(authFingerprint(a)).toBe(authFingerprint({ kind: 'api-key', apiKey: 'k1' }))
    expect(authFingerprint(a)).not.toBe(authFingerprint(v))
  })
})

describe('api-key transport', () => {
  const transport = createTransport({ kind: 'api-key', apiKey: ' secret ' })

  it('targets generativelanguage.googleapis.com with the x-goog-api-key header', async () => {
    expect(transport.nativeUrl('gemini-3.5-flash')).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent'
    )
    expect(await transport.nativeHeaders()).toEqual({ 'x-goog-api-key': 'secret' })
    expect(transport.openaiChatUrl()).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
    )
    expect(transport.openaiModel('gemini-3.5-flash-lite')).toBe('gemini-3.5-flash-lite')
    expect(await transport.openaiHeaders()).toEqual({ Authorization: 'Bearer secret' })
  })

  it('keeps the Files API available', () => {
    expect(transport.uploadUrl()).toBe(
      'https://generativelanguage.googleapis.com/upload/v1beta/files'
    )
    expect(transport.fileUrl('files/abc')).toBe(
      'https://generativelanguage.googleapis.com/v1beta/files/abc'
    )
  })
})

describe('vertex transport', () => {
  beforeEach(() => clearVertexTokenCache())

  it('builds global URLs with no region prefix and the google/ model prefix', () => {
    const keyPath = writeServiceAccountKey()
    const transport = createTransport(
      { kind: 'vertex', keyPath, projectId: '', location: 'global' },
      tokenFetcher({ count: 0 })
    )
    expect(transport.nativeUrl('gemini-3.5-flash')).toBe(
      'https://aiplatform.googleapis.com/v1/projects/test-project-123/locations/global/publishers/google/models/gemini-3.5-flash:generateContent'
    )
    expect(transport.openaiChatUrl()).toBe(
      'https://aiplatform.googleapis.com/v1/projects/test-project-123/locations/global/endpoints/openapi/chat/completions'
    )
    expect(transport.openaiModel('gemini-3.5-flash-lite')).toBe('google/gemini-3.5-flash-lite')
  })

  it('prefixes the host for regional locations and honours an explicit project', () => {
    const keyPath = writeServiceAccountKey()
    const transport = createTransport(
      { kind: 'vertex', keyPath, projectId: 'override-proj', location: 'us-central1' },
      tokenFetcher({ count: 0 })
    )
    expect(transport.nativeUrl('gemini-3.5-flash')).toBe(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/override-proj/locations/us-central1/publishers/google/models/gemini-3.5-flash:generateContent'
    )
  })

  it('has no Files API', () => {
    const keyPath = writeServiceAccountKey()
    const transport = createTransport(
      { kind: 'vertex', keyPath, projectId: '', location: 'global' },
      tokenFetcher({ count: 0 })
    )
    expect(transport.uploadUrl()).toBeNull()
    expect(transport.fileUrl('files/abc')).toBeNull()
  })

  it('mints one bearer token and caches it across header calls', async () => {
    const keyPath = writeServiceAccountKey()
    const calls = { count: 0 }
    const transport = createTransport(
      { kind: 'vertex', keyPath, projectId: '', location: 'global' },
      tokenFetcher(calls, 'tok-1')
    )
    expect(await transport.nativeHeaders()).toEqual({ Authorization: 'Bearer tok-1' })
    expect(await transport.openaiHeaders()).toEqual({ Authorization: 'Bearer tok-1' })
    expect(calls.count).toBe(1)
  })

  it('reports auth failures without tripping the capacity-fallback matcher', async () => {
    const keyPath = writeServiceAccountKey()
    const failing = (async () =>
      new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid JWT.' }), {
        status: 400
      })) as unknown as typeof fetch
    const transport = createTransport(
      { kind: 'vertex', keyPath, projectId: '', location: 'global' },
      failing
    )
    const error = await transport.nativeHeaders().then(
      () => undefined,
      (reason) => reason as Error
    )
    expect(error?.message).toMatch(/Vertex authentication failed/)
    expect(isCapacityError(error)).toBe(false)
  })

  it('rejects a key file without a usable project id', () => {
    const keyPath = writeServiceAccountKey({ project_id: undefined })
    expect(() =>
      createTransport(
        { kind: 'vertex', keyPath, projectId: '', location: 'global' },
        tokenFetcher({ count: 0 })
      )
    ).toThrow(/project id is missing/)
  })
})
