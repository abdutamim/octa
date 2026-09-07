import { readFileSync, statSync } from 'node:fs'
import { createSign } from 'node:crypto'
import type { AppSettings } from '../types'

/**
 * Vertex AI transport for the same Gemini models the app already uses.
 *
 * Why this exists: an AI Studio key (`geminiApiKey`) bills on the Gemini
 * Developer API's own quota track. The identical models called through Vertex
 * bill to a GCP project instead, where cloud credits apply — so when the AI
 * Studio limit is exhausted, switching the provider keeps every feature alive
 * without touching model choices or prompts.
 *
 * Two things differ from the API-key world and shape this module:
 * - Auth is a short-lived OAuth access token minted from a service-account
 *   key (RS256 JWT via node:crypto — no SDK dependency), cached per key file
 *   because cloud clients are constructed fresh on every request.
 * - Gemini 3.x publisher models are served ONLY from the `global` location.
 *   Regional endpoints like `us-central1` return HTTP 404 for them, so
 *   `global` is the default and the host is built without a region prefix.
 */

export type AiAuth =
  | { kind: 'api-key'; apiKey: string }
  | { kind: 'vertex'; keyPath: string; projectId: string; location: string }

type AiAuthSettings = Pick<
  AppSettings,
  'aiProvider' | 'geminiApiKey' | 'vertexKeyPath' | 'vertexProjectId' | 'vertexLocation'
>

/** Which credentials the selected provider actually has, or null if unset. */
export function resolveAiAuth(settings: AiAuthSettings): AiAuth | null {
  if (settings.aiProvider === 'vertex') {
    const keyPath = settings.vertexKeyPath.trim()
    if (!keyPath) return null
    return {
      kind: 'vertex',
      keyPath,
      projectId: settings.vertexProjectId.trim(),
      location: settings.vertexLocation.trim() || 'global'
    }
  }
  const apiKey = settings.geminiApiKey.trim()
  return apiKey ? { kind: 'api-key', apiKey } : null
}

export function aiAuthMissingMessage(settings: AiAuthSettings): string {
  return settings.aiProvider === 'vertex'
    ? 'Select your Vertex service-account key file in Settings first.'
    : 'Add your Gemini API key in Settings first.'
}

export function requireAiAuth(settings: AiAuthSettings): AiAuth {
  const auth = resolveAiAuth(settings)
  if (!auth) throw new Error(aiAuthMissingMessage(settings))
  return auth
}

/**
 * Stable identity of a credential configuration. Used instead of the raw key
 * for cache invalidation (the assistant keeps its provider until this changes)
 * — a minted OAuth token rotates hourly and must not thrash that cache.
 */
export function authFingerprint(auth: AiAuth): string {
  return auth.kind === 'api-key'
    ? `api-key:${auth.apiKey}`
    : `vertex:${auth.keyPath}|${auth.projectId}|${auth.location}`
}

interface ServiceAccountKey {
  client_email: string
  private_key: string
  project_id?: string
  token_uri?: string
}

const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token'
const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
// Refresh well before the 1-hour expiry so a token never dies mid-request —
// a long media transcription can run for many minutes on one token.
const TOKEN_MARGIN_MS = 10 * 60_000

function loadServiceAccountKey(keyPath: string): ServiceAccountKey {
  let raw: string
  try {
    raw = readFileSync(keyPath, 'utf8')
  } catch {
    throw new Error(`Vertex service-account key file could not be read: ${keyPath}`)
  }
  let parsed: Partial<ServiceAccountKey>
  try {
    parsed = JSON.parse(raw) as Partial<ServiceAccountKey>
  } catch {
    throw new Error('Vertex service-account key file is not valid JSON.')
  }
  if (typeof parsed.client_email !== 'string' || typeof parsed.private_key !== 'string') {
    throw new Error('Vertex service-account key file is missing client_email or private_key.')
  }
  return parsed as ServiceAccountKey
}

interface CachedToken {
  token: string
  expiresAt: number
}

// Cloud clients are throwaway (one per request), so the token cache lives at
// module level, keyed by key file path. The pending map deduplicates minting
// when several requests race on a cold cache.
const tokenCache = new Map<string, CachedToken>()
const pendingTokens = new Map<string, Promise<CachedToken>>()

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

async function mintAccessToken(key: ServiceAccountKey, fetcher: typeof fetch): Promise<CachedToken> {
  // iat is backdated slightly so minor clock skew never invalidates the JWT.
  const now = Math.floor(Date.now() / 1000) - 30
  const tokenUri = key.token_uri ?? DEFAULT_TOKEN_URI
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: CLOUD_PLATFORM_SCOPE,
      aud: tokenUri,
      iat: now,
      exp: now + 3600
    })
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const assertion = `${header}.${claims}.${signer.sign(key.private_key, 'base64url')}`

  const response = await fetcher(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    }),
    signal: AbortSignal.timeout(30_000)
  })
  const raw = await response.text().catch(() => '')
  let payload: { access_token?: unknown; expires_in?: unknown; error?: unknown; error_description?: unknown } = {}
  try {
    payload = JSON.parse(raw) as typeof payload
  } catch {
    // The status code alone still identifies the failure below.
  }
  if (!response.ok || typeof payload.access_token !== 'string') {
    const detail =
      typeof payload.error_description === 'string'
        ? payload.error_description
        : typeof payload.error === 'string'
          ? payload.error
          : raw.slice(0, 200)
    // Deliberately worded so isCapacityError() never mistakes an auth failure
    // for a capacity problem and burns a fallback call on it.
    throw new Error(`Vertex authentication failed (status ${response.status})${detail ? `: ${detail}` : '.'}`)
  }
  const lifetimeMs =
    typeof payload.expires_in === 'number' && Number.isFinite(payload.expires_in)
      ? payload.expires_in * 1000
      : 3600_000
  return { token: payload.access_token, expiresAt: Date.now() + lifetimeMs - TOKEN_MARGIN_MS }
}

async function vertexAccessToken(keyPath: string, fetcher: typeof fetch): Promise<string> {
  // The mtime in the cache key drops the cached token when the key file is
  // replaced in place, so a rotated service account takes effect immediately.
  let cacheKey = keyPath
  try {
    cacheKey = `${keyPath}|${statSync(keyPath).mtimeMs}`
  } catch {
    // Unreadable file: fall through so loadServiceAccountKey reports it.
  }
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.token

  let pending = pendingTokens.get(cacheKey)
  if (!pending) {
    pending = mintAccessToken(loadServiceAccountKey(keyPath), fetcher).finally(() =>
      pendingTokens.delete(cacheKey)
    )
    pendingTokens.set(cacheKey, pending)
  }
  const fresh = await pending
  tokenCache.set(cacheKey, fresh)
  return fresh.token
}

/** Test seam: forget cached tokens (also useful after a key file is replaced). */
export function clearVertexTokenCache(): void {
  tokenCache.clear()
}

/**
 * Everything that differs between the Gemini Developer API and Vertex for one
 * request: where to POST, how to authenticate, and how the OpenAI-compat
 * surface names models. The Gemini clients own everything else (prompts,
 * bodies, parsing, errors), so both providers share one code path.
 */
export interface GeminiTransport {
  readonly provider: 'gemini' | 'vertex'
  /** URL for a native `:generateContent` call on the given model. */
  nativeUrl(model: string): string
  nativeHeaders(): Promise<Record<string, string>>
  openaiChatUrl(): string
  /** Vertex addresses publisher models as `google/<model>` on that surface. */
  openaiModel(model: string): string
  openaiHeaders(): Promise<Record<string, string>>
  /** Resumable Files API — Gemini Developer API only; null on Vertex. */
  uploadUrl(): string | null
  /** Status URL for an uploaded file name (e.g. `files/abc`); null on Vertex. */
  fileUrl(name: string): string | null
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_API_UPLOAD = 'https://generativelanguage.googleapis.com/upload/v1beta/files'

function apiKeyTransport(apiKey: string): GeminiTransport {
  const key = apiKey.trim()
  const native = { 'x-goog-api-key': key }
  const bearer = { Authorization: `Bearer ${key}` }
  return {
    provider: 'gemini',
    nativeUrl: (model) => `${GEMINI_API_BASE}/models/${model}:generateContent`,
    nativeHeaders: () => Promise.resolve(native),
    openaiChatUrl: () => `${GEMINI_API_BASE}/openai/chat/completions`,
    openaiModel: (model) => model,
    openaiHeaders: () => Promise.resolve(bearer),
    uploadUrl: () => GEMINI_API_UPLOAD,
    fileUrl: (name) => `${GEMINI_API_BASE}/${name}`
  }
}

function vertexTransport(
  auth: Extract<AiAuth, { kind: 'vertex' }>,
  fetcher: typeof fetch
): GeminiTransport {
  const location = auth.location || 'global'
  // Both values are embedded in the request URL (location even in the host
  // name); reject anything that could redirect the bearer token elsewhere.
  if (!/^[a-z0-9-]+$/.test(location)) {
    throw new Error(`Vertex location looks invalid: ${JSON.stringify(location)}. Use "global".`)
  }
  if (auth.projectId && !/^[A-Za-z0-9._-]+$/.test(auth.projectId)) {
    throw new Error('Vertex project id contains characters that are not allowed.')
  }
  // `global` has no region prefix on the host; regional locations do.
  const host =
    location === 'global'
      ? 'https://aiplatform.googleapis.com'
      : `https://${location}-aiplatform.googleapis.com`
  const projectId = auth.projectId || loadServiceAccountKey(auth.keyPath).project_id
  if (!projectId) {
    throw new Error(
      'Vertex project id is missing — set it in Settings or use a key file that contains project_id.'
    )
  }
  const base = `${host}/v1/projects/${projectId}/locations/${location}`
  const headers = async (): Promise<Record<string, string>> => ({
    Authorization: `Bearer ${await vertexAccessToken(auth.keyPath, fetcher)}`
  })
  return {
    provider: 'vertex',
    nativeUrl: (model) => `${base}/publishers/google/models/${model}:generateContent`,
    nativeHeaders: headers,
    openaiChatUrl: () => `${base}/endpoints/openapi/chat/completions`,
    openaiModel: (model) => `google/${model}`,
    openaiHeaders: headers,
    uploadUrl: () => null,
    fileUrl: () => null
  }
}

export function createTransport(auth: AiAuth, fetcher: typeof fetch = fetch): GeminiTransport {
  return auth.kind === 'api-key' ? apiKeyTransport(auth.apiKey) : vertexTransport(auth, fetcher)
}
