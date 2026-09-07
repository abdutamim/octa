import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod/v4'
import { join } from 'node:path'
import { SettingsRepository } from '../../db/settings'
import {
  createResearchBrowser,
  type RedditResult,
  type ResearchBrowser,
  type ResearchBrowserOptions,
  type ResearchSettingsStore,
  type SearchResult
} from './browser'
import type { PageReadResult, ScrollCollectResult, TranscriptResult } from './browser'

export const MCP_SERVER_NAME = 'octa-tools'
export const MCP_SERVER_VERSION = '0.1.0'

export const MCP_TOOL_NAMES = [
  'search',
  'open',
  'fetch_markdown',
  'scroll_collect',
  'youtube_transcript',
  'reddit_search',
  'brave_search'
] as const

export type McpToolName = (typeof MCP_TOOL_NAMES)[number]

/** JSON Schema mirrors for tests, diagnostics, and clients that do not load Zod. */
export const MCP_TOOL_SCHEMAS = {
  search: {
    type: 'object',
    additionalProperties: false,
    properties: {
      query: { type: 'string', minLength: 1 },
      lang: { type: 'string', minLength: 2 },
      engine: { type: 'string', enum: ['google', 'bing', 'ddg'], default: 'google' }
    },
    required: ['query', 'lang']
  },
  open: {
    type: 'object',
    additionalProperties: false,
    properties: { url: { type: 'string', format: 'uri' } },
    required: ['url']
  },
  fetch_markdown: {
    type: 'object',
    additionalProperties: false,
    properties: { url: { type: 'string', format: 'uri' } },
    required: ['url']
  },
  scroll_collect: {
    type: 'object',
    additionalProperties: false,
    properties: {
      url: { type: 'string', format: 'uri' },
      n: { type: 'integer', minimum: 1, maximum: 200, default: 5 }
    },
    required: ['url', 'n']
  },
  youtube_transcript: {
    type: 'object',
    additionalProperties: false,
    properties: { url: { type: 'string', format: 'uri' } },
    required: ['url']
  },
  reddit_search: {
    type: 'object',
    additionalProperties: false,
    properties: { query: { type: 'string', minLength: 1 } },
    required: ['query']
  },
  brave_search: {
    type: 'object',
    additionalProperties: false,
    properties: {
      query: { type: 'string', minLength: 1 },
      lang: { type: 'string', minLength: 2 }
    },
    required: ['query', 'lang']
  }
} as const

export interface BraveResult {
  title: string
  url: string
  description: string
  domain: string
}

export interface BraveSearchOutput {
  query: string
  lang: string
  results: BraveResult[]
}

export interface SearchOutput {
  query: string
  lang: string
  engine: 'google' | 'bing' | 'ddg'
  results: SearchResult[]
}

export interface RedditSearchOutput {
  query: string
  results: RedditResult[]
}

export interface OctaMcpServerOptions {
  browser?: ResearchBrowser
  browserFactory?: () => ResearchBrowser | Promise<ResearchBrowser>
  browserOptions?: Omit<ResearchBrowserOptions, 'octaHome'>
  octaHome?: string
  jobId?: string
  jobFolder?: string
  braveApiKey?: string
  fetch?: typeof globalThis.fetch
}

export interface OctaToolHandlers {
  search(query: string, lang: string, engine?: 'google' | 'bing' | 'ddg'): Promise<SearchOutput>
  open(url: string): Promise<PageReadResult>
  scrollCollect(url: string, n: number): Promise<ScrollCollectResult>
  youtubeTranscript(url: string): Promise<TranscriptResult>
  redditSearch(query: string): Promise<RedditSearchOutput>
  braveSearch?: (query: string, lang: string) => Promise<BraveSearchOutput>
}

export interface OctaMcpServerRuntime {
  server: McpServer
  handlers: OctaToolHandlers
  toolNames: McpToolName[]
}

const SEARCH_RESULT_Z = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  domain: z.string()
})
const PAGE_READ_RESULT_Z = z.object({
  markdown: z.string(),
  screenshot_path: z.string(),
  url: z.string(),
  title: z.string().optional()
})
const SCROLL_RESULT_Z = PAGE_READ_RESULT_Z.extend({ pages: z.number().int() })
const TRANSCRIPT_RESULT_Z = z.object({ transcript: z.string(), language: z.string(), url: z.string() })
const REDDIT_RESULT_Z = z.object({
  title: z.string(),
  url: z.string(),
  subreddit: z.string(),
  author: z.string(),
  score: z.number(),
  comments: z.number(),
  selftext: z.string(),
  createdAt: z.string().nullable()
})
const BRAVE_RESULT_Z = z.object({ title: z.string(), url: z.string(), description: z.string(), domain: z.string() })

function runtimeHome(options: OctaMcpServerOptions): string {
  return options.octaHome?.trim() || process.env.OCTA_HOME?.trim() || 'C:\\Octa'
}

function loadBraveKey(options: OctaMcpServerOptions): string {
  if (options.braveApiKey !== undefined) return options.braveApiKey.trim()
  const fromEnvironment = process.env.OCTA_BRAVE_SEARCH_API_KEY?.trim()
  if (fromEnvironment) return fromEnvironment
  const home = runtimeHome(options)
  const databasePath = join(home, 'octa.db')
  try {
    const settings = new SettingsRepository(databasePath)
    const key = settings.getSettings().braveSearchApiKey.trim()
    settings.close()
    return key
  } catch {
    return ''
  }
}

function openBrowserSettings(home: string): ResearchSettingsStore | undefined {
  try {
    // Keep this repository open for the lifetime of the stdio server so
    // challenge back-offs raised by the worker are durable in SQLite.
    return new SettingsRepository(join(home, 'octa.db'))
  } catch {
    return undefined
  }
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase() } catch { return '' }
}

function jsonText(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function structured<T>(value: T): { content: [{ type: 'text'; text: string }]; structuredContent: Record<string, unknown> } {
  return { content: [{ type: 'text', text: jsonText(value) }], structuredContent: value as unknown as Record<string, unknown> }
}

function toolError(error: unknown): { isError: true; content: [{ type: 'text'; text: string }] } {
  return {
    isError: true,
    content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }]
  }
}

async function braveSearchRequest(
  query: string,
  lang: string,
  apiKey: string,
  request: typeof globalThis.fetch
): Promise<BraveSearchOutput> {
  const trimmed = query.trim()
  if (!trimmed) throw new Error('Brave search query is required.')
  if (!apiKey) throw new Error('Brave Search is not configured. Add a key in Settings.')
  const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(trimmed)}&search_lang=${encodeURIComponent(lang.trim() || 'en')}&count=20`
  const response = await request(searchUrl, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': apiKey
    }
  })
  if (!response.ok) throw new Error(`Brave Search failed with HTTP ${response.status}.`)
  const payload = await response.json() as { query?: { original?: string }; web?: { results?: Array<{ title?: string; url?: string; description?: string }> } }
  const results = (payload.web?.results ?? []).flatMap((item) => {
    if (typeof item.title !== 'string' || typeof item.url !== 'string') return []
    return [{
      title: item.title,
      url: item.url,
      description: typeof item.description === 'string' ? item.description : '',
      domain: domainOf(item.url)
    }]
  })
  return { query: payload.query?.original ?? trimmed, lang: lang.trim() || 'en', results }
}

export function createOctaToolHandlers(options: OctaMcpServerOptions = {}): OctaToolHandlers {
  let browserPromise: Promise<ResearchBrowser> | undefined
  const browserSettings = options.browserOptions?.settings ?? (options.browser ? undefined : openBrowserSettings(runtimeHome(options)))
  const getBrowser = async (): Promise<ResearchBrowser> => {
    if (options.browser) return options.browser
    if (!browserPromise) {
      browserPromise = options.browserFactory
        ? Promise.resolve(options.browserFactory())
        : Promise.resolve(createResearchBrowser({
            octaHome: runtimeHome(options),
            jobId: options.jobId ?? process.env.OCTA_RESEARCH_JOB_ID,
            jobFolder: options.jobFolder ?? process.env.OCTA_RESEARCH_JOB_DIR,
            ...options.browserOptions,
            settings: browserSettings
          }))
    }
    return browserPromise
  }

  const handlers: OctaToolHandlers = {
    async search(query, lang, engine = 'google'): Promise<SearchOutput> {
      const results = await (await getBrowser()).search(query, lang, engine)
      return { query, lang, engine, results }
    },
    open: (url) => getBrowser().then((browser) => browser.open(url)),
    scrollCollect: (url, n) => getBrowser().then((browser) => browser.scrollCollect(url, n)),
    youtubeTranscript: (url) => getBrowser().then((browser) => browser.youtubeTranscript(url)),
    async redditSearch(query): Promise<RedditSearchOutput> {
      const results = await (await getBrowser()).redditSearch(query)
      return { query, results }
    }
  }
  const braveKey = loadBraveKey(options)
  if (braveKey) handlers.braveSearch = (query, lang) => braveSearchRequest(query, lang, braveKey, options.fetch ?? globalThis.fetch)
  return handlers
}

export function createMcpServer(options: OctaMcpServerOptions = {}): OctaMcpServerRuntime {
  const handlers = createOctaToolHandlers(options)
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION })

  const safe = async <T>(work: () => Promise<T>): Promise<ReturnType<typeof structured<T>> | ReturnType<typeof toolError>> => {
    try { return structured(await work()) } catch (error) { return toolError(error) }
  }

  const registerOpen = (name: 'open' | 'fetch_markdown'): void => {
    server.registerTool(name, {
      description: 'Open one public page in the persistent read-only research browser and return markdown plus a screenshot path.',
      inputSchema: { url: z.string().url() },
      outputSchema: PAGE_READ_RESULT_Z.shape
    }, async ({ url }) => safe(() => handlers.open(url)))
  }

  server.registerTool('search', {
    description: 'Search Google, Bing, or DuckDuckGo through the persistent research browser and parse result pages.',
    inputSchema: {
      query: z.string().min(1),
      lang: z.string().min(2),
      engine: z.enum(['google', 'bing', 'ddg']).default('google')
    },
    outputSchema: {
      query: z.string(),
      lang: z.string(),
      engine: z.enum(['google', 'bing', 'ddg']),
      results: z.array(SEARCH_RESULT_Z)
    }
  }, async ({ query, lang, engine }) => safe(() => handlers.search(query, lang, engine)))
  registerOpen('open')
  registerOpen('fetch_markdown')
  server.registerTool('scroll_collect', {
    description: 'Collect read-only text while scrolling a page. No composer or outward-action controls are clicked.',
    inputSchema: { url: z.string().url(), n: z.number().int().min(1).max(200).default(5) },
    outputSchema: SCROLL_RESULT_Z.shape
  }, async ({ url, n }) => safe(() => handlers.scrollCollect(url, n)))
  server.registerTool('youtube_transcript', {
    description: 'Read public YouTube captions without interacting with the video or its controls.',
    inputSchema: { url: z.string().url() },
    outputSchema: TRANSCRIPT_RESULT_Z.shape
  }, async ({ url }) => safe(() => handlers.youtubeTranscript(url)))
  server.registerTool('reddit_search', {
    description: 'Search Reddit through its public JSON endpoint.',
    inputSchema: { query: z.string().min(1) },
    outputSchema: { query: z.string(), results: z.array(REDDIT_RESULT_Z) }
  }, async ({ query }) => safe(() => handlers.redditSearch(query)))
  if (handlers.braveSearch) {
    server.registerTool('brave_search', {
      description: 'Use the configured Brave Search API as a fallback when browser search is blocked.',
      inputSchema: { query: z.string().min(1), lang: z.string().min(2) },
      outputSchema: { query: z.string(), lang: z.string(), results: z.array(BRAVE_RESULT_Z) }
    }, async ({ query, lang }) => safe(() => handlers.braveSearch!(query, lang)))
  }

  const toolNames = MCP_TOOL_NAMES.filter((name) => name !== 'brave_search' || Boolean(handlers.braveSearch)) as McpToolName[]
  return { server, handlers, toolNames }
}

export async function startMcpServer(options: OctaMcpServerOptions = {}): Promise<void> {
  const runtime = createMcpServer(options)
  const transport = new StdioServerTransport()
  await runtime.server.connect(transport)
  console.error(`[${MCP_SERVER_NAME}] stdio server ready (${runtime.toolNames.join(', ')})`)
}

if (process.env.OCTA_MCP_SERVER === '1') {
  void startMcpServer().catch((error: unknown) => {
    console.error('[octa-tools] server error:', error)
    process.exitCode = 1
  })
}
