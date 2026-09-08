import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type BrowserContext, type Page } from 'playwright'

export const RESEARCH_LOGIN_SITES = ['facebook', 'x', 'reddit'] as const
export type ResearchLoginSite = (typeof RESEARCH_LOGIN_SITES)[number]

export const RESEARCH_BROWSER_MIN_INTERVAL_MS = 4_000
export const RESEARCH_SOCIAL_PAGE_LIMIT = 200
export const RESEARCH_CHALLENGE_BACKOFF_MS = 24 * 60 * 60 * 1_000

export interface ResearchSettingsStore {
  getValue<T>(key: string): T | undefined
  setValue(key: string, value: unknown): void
}

export interface BrowserChallengeEvent {
  type: 'browser:challenge'
  site: string
  domain: string
  url: string
  reason: string
  backoffUntil: string
  timestamp: string
}

export interface ResearchBrowserSiteStatus {
  loggedIn: boolean
  challengeBackoffUntil: string | null
  lastLoginAt: string | null
}

export interface ResearchBrowserStatus {
  profilePath: string
  playwrightBrowsersPath: string
  sites: Record<string, ResearchBrowserSiteStatus>
}

export interface ResearchBrowserPaths {
  profilePath: string
  playwrightBrowsersPath: string
  screenshotPath: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  domain: string
}

export interface PageReadResult {
  markdown: string
  screenshot_path: string
  url: string
  title?: string
}

export interface CrawledPage extends PageReadResult {
  links: string[]
  technology: string[]
  analytics: string[]
}

export interface CrawlResult {
  startUrl: string
  pages: CrawledPage[]
  truncated: boolean
}

export interface ScrollCollectResult extends PageReadResult {
  pages: number
}

export interface TranscriptResult {
  transcript: string
  language: string
  url: string
}

export interface RedditResult {
  title: string
  url: string
  subreddit: string
  author: string
  score: number
  comments: number
  selftext: string
  createdAt: string | null
}

export interface ComposerTargetDescriptor {
  tagName?: string
  role?: string
  text?: string
  ariaLabel?: string
  placeholder?: string
  className?: string
  id?: string
  insideComposer?: boolean
  contentEditable?: boolean
}

export interface DomainPacingLimiterOptions {
  minIntervalMs?: number
  now?: () => number
  sleep?: (milliseconds: number, signal?: AbortSignal) => Promise<void>
}

function defaultSleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }
    const timer = setTimeout(resolve, milliseconds)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    }, { once: true })
  })
}

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
}

function domainFromUrl(value: string): string {
  try {
    return normalizeHost(new URL(value).hostname)
  } catch {
    return normalizeHost(value)
  }
}

/** Enforces at most one page navigation per domain in the configured interval. */
export class DomainPacingLimiter {
  private readonly lastRequestAt = new Map<string, number>()
  private readonly minIntervalMs: number
  private readonly now: () => number
  private readonly sleep: (milliseconds: number, signal?: AbortSignal) => Promise<void>

  constructor(options: DomainPacingLimiterOptions = {}) {
    this.minIntervalMs = Math.max(0, Math.trunc(options.minIntervalMs ?? RESEARCH_BROWSER_MIN_INTERVAL_MS))
    this.now = options.now ?? Date.now
    this.sleep = options.sleep ?? defaultSleep
  }

  async wait(domain: string, signal?: AbortSignal): Promise<void> {
    const key = normalizeHost(domain)
    if (!key) throw new Error('A domain is required for pacing.')
    const previous = this.lastRequestAt.get(key)
    const delay = previous === undefined ? 0 : Math.max(0, previous + this.minIntervalMs - this.now())
    if (delay > 0) await this.sleep(delay, signal)
    if (signal?.aborted) throw signal.reason
    this.lastRequestAt.set(key, this.now())
  }

  clear(domain?: string): void {
    if (domain) this.lastRequestAt.delete(normalizeHost(domain))
    else this.lastRequestAt.clear()
  }

  lastRequest(domain: string): number | undefined {
    return this.lastRequestAt.get(normalizeHost(domain))
  }
}

/** Limits pages per social site for one research job. */
export class SocialPageBudget {
  private readonly pageCounts = new Map<string, number>()
  private readonly maxPages: number

  constructor(maxPages = RESEARCH_SOCIAL_PAGE_LIMIT) {
    this.maxPages = Math.max(1, Math.trunc(maxPages))
  }

  consume(jobId: string, site: string): number {
    const key = `${jobId.trim() || 'default'}:${normalizeHost(site)}`
    const current = this.pageCounts.get(key) ?? 0
    if (current >= this.maxPages) {
      throw new Error(`Social site page budget exceeded for ${site} (${this.maxPages} pages per job).`)
    }
    const next = current + 1
    this.pageCounts.set(key, next)
    return next
  }

  count(jobId: string, site: string): number {
    return this.pageCounts.get(`${jobId.trim() || 'default'}:${normalizeHost(site)}`) ?? 0
  }

  clear(jobId?: string): void {
    if (!jobId) {
      this.pageCounts.clear()
      return
    }
    const prefix = `${jobId.trim() || 'default'}:`
    for (const key of this.pageCounts.keys()) if (key.startsWith(prefix)) this.pageCounts.delete(key)
  }
}

const COMPOSER_MARKER_PATTERN = /composer|compose|status[-_ ]?(?:box|editor)|post[-_ ]?(?:box|editor)|tweet[-_ ]?(?:box|editor)|write[-_ ]?(?:a )?(post|message)|message[-_ ]?box|comment[-_ ]?box|reply[-_ ]?box|contenteditable/i
const OUTWARD_ACTION_PATTERN = /post|publish|send|comment|reply|like|love|share|follow|subscribe|retweet|repost|tweet|message|submit|نشر|انشر|إرسال|ارسال|تعليق|رد|إعجاب|إعادة نشر|مشاركة|متابعة|إرسال رسالة/i

function descriptorValues(target: ComposerTargetDescriptor | unknown): ComposerTargetDescriptor {
  if (!target || typeof target !== 'object') return {}
  const value = target as Record<string, unknown>
  return {
    tagName: typeof value.tagName === 'string' ? value.tagName : undefined,
    role: typeof value.role === 'string' ? value.role : undefined,
    text: typeof value.text === 'string' ? value.text : typeof value.textContent === 'string' ? value.textContent : undefined,
    ariaLabel: typeof value.ariaLabel === 'string' ? value.ariaLabel : typeof value['aria-label'] === 'string' ? value['aria-label'] : undefined,
    placeholder: typeof value.placeholder === 'string' ? value.placeholder : undefined,
    className: typeof value.className === 'string' ? value.className : undefined,
    id: typeof value.id === 'string' ? value.id : undefined,
    insideComposer: value.insideComposer === true,
    contentEditable: value.contentEditable === true || value.contenteditable === true
  }
}

/** Return true when a DOM target could publish or send content. */
export function isComposerControl(target: ComposerTargetDescriptor | unknown): boolean {
  const descriptor = descriptorValues(target)
  const tagName = descriptor.tagName?.toLowerCase() ?? ''
  const role = descriptor.role?.toLowerCase() ?? ''
  const text = [descriptor.text, descriptor.ariaLabel, descriptor.placeholder, descriptor.className, descriptor.id]
    .filter(Boolean)
    .join(' ')
  const isButton = tagName === 'button' || role === 'button' || role === 'menuitem' || role === 'submit'
  const composerArea = descriptor.insideComposer === true || descriptor.contentEditable === true || COMPOSER_MARKER_PATTERN.test(text)
  if (composerArea && isButton) return true
  if (isButton && OUTWARD_ACTION_PATTERN.test(text)) return true
  if (descriptor.contentEditable === true && OUTWARD_ACTION_PATTERN.test(text)) return true
  return false
}

export const composerBlockingHeuristic = isComposerControl
export const isReadOnlyControl = isComposerControl

export function assertReadOnlyTarget(target: ComposerTargetDescriptor | unknown): void {
  if (isComposerControl(target)) throw new Error('Read-only research browser blocked a composer or outward-action control.')
}

export class SiteBackoffError extends Error {
  constructor(
    message: string,
    readonly site: string,
    readonly backoffUntil: string
  ) {
    super(message)
    this.name = 'SiteBackoffError'
  }
}

export function researchBrowserPaths(octaHome: string): ResearchBrowserPaths {
  return {
    profilePath: join(octaHome, 'browser', 'research'),
    playwrightBrowsersPath: join(octaHome, 'browser', 'playwright'),
    screenshotPath: join(octaHome, 'browser', 'research', 'screenshots')
  }
}

function socialSiteForHost(host: string): string | undefined {
  const normalized = normalizeHost(host)
  if (normalized === 'facebook.com' || normalized.endsWith('.facebook.com')) return 'facebook'
  if (normalized === 'x.com' || normalized === 'twitter.com' || normalized.endsWith('.x.com')) return 'x'
  if (normalized === 'reddit.com' || normalized.endsWith('.reddit.com')) return 'reddit'
  if (normalized === 'youtube.com' || normalized.endsWith('.youtube.com') || normalized === 'youtu.be') return 'youtube'
  if (normalized === 'tiktok.com' || normalized.endsWith('.tiktok.com')) return 'tiktok'
  if (normalized === 'linkedin.com' || normalized.endsWith('.linkedin.com')) return 'linkedin'
  return undefined
}

function loginUrl(site: ResearchLoginSite): string {
  switch (site) {
    case 'facebook': return 'https://www.facebook.com/login/'
    case 'x': return 'https://x.com/i/flow/login'
    case 'reddit': return 'https://www.reddit.com/login/'
  }
}

function asDate(value: unknown): Date | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value)
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }
  return undefined
}

type PersistentContextFactory = (
  userDataDir: string,
  options: Parameters<typeof chromium.launchPersistentContext>[1]
) => Promise<BrowserContext>

export interface ResearchBrowserOptions {
  octaHome: string
  jobId?: string
  jobFolder?: string
  settings?: ResearchSettingsStore
  limiter?: DomainPacingLimiter
  socialBudget?: SocialPageBudget
  now?: () => Date
  onChallenge?: (event: BrowserChallengeEvent) => void
  launchPersistentContext?: PersistentContextFactory
}

export class ResearchBrowser {
  private readonly paths: ResearchBrowserPaths
  private readonly jobId: string
  private readonly jobFolder?: string
  private readonly settings?: ResearchSettingsStore
  private readonly limiter: DomainPacingLimiter
  private readonly socialBudget: SocialPageBudget
  private readonly now: () => Date
  private readonly onChallenge?: (event: BrowserChallengeEvent) => void
  private readonly launchPersistentContext: PersistentContextFactory
  private context?: BrowserContext
  private contextHeadless?: boolean
  private readonly loginPages = new Map<string, Page>()
  private readonly loginWaiters = new Map<string, { resolve: (status: ResearchBrowserStatus) => void; reject: (error: unknown) => void }>()

  constructor(options: ResearchBrowserOptions) {
    this.paths = researchBrowserPaths(options.octaHome)
    this.jobId = options.jobId?.trim() || 'default'
    this.jobFolder = options.jobFolder
    this.settings = options.settings
    this.limiter = options.limiter ?? new DomainPacingLimiter()
    this.socialBudget = options.socialBudget ?? new SocialPageBudget()
    this.now = options.now ?? (() => new Date())
    this.onChallenge = options.onChallenge
    this.launchPersistentContext = options.launchPersistentContext ?? ((userDataDir, launchOptions) => chromium.launchPersistentContext(userDataDir, launchOptions))
  }

  getPaths(): ResearchBrowserPaths {
    return { ...this.paths }
  }

  async ensureContext(headed = false): Promise<BrowserContext> {
    if (this.context && this.contextHeadless === !headed) return this.context
    if (this.context) {
      await this.context.close()
      this.context = undefined
    }
    mkdirSync(this.paths.profilePath, { recursive: true })
    mkdirSync(this.paths.playwrightBrowsersPath, { recursive: true })
    mkdirSync(this.paths.screenshotPath, { recursive: true })
    process.env.PLAYWRIGHT_BROWSERS_PATH = this.paths.playwrightBrowsersPath
    this.context = await this.launchPersistentContext(this.paths.profilePath, {
      headless: !headed,
      viewport: { width: 1_440, height: 960 },
      acceptDownloads: false
    })
    this.contextHeadless = !headed
    return this.context
  }

  async close(): Promise<void> {
    for (const waiter of this.loginWaiters.values()) waiter.reject(new Error('Research browser closed before login confirmation.'))
    this.loginWaiters.clear()
    if (this.context) await this.context.close()
    this.context = undefined
    this.contextHeadless = undefined
    this.loginPages.clear()
  }

  status(): ResearchBrowserStatus {
    const sites: Record<string, ResearchBrowserSiteStatus> = {}
    for (const site of RESEARCH_LOGIN_SITES) {
      sites[site] = {
        loggedIn: this.settings?.getValue<boolean>(this.loginKey(site)) === true,
        challengeBackoffUntil: this.backoffUntil(site)?.toISOString() ?? null,
        lastLoginAt: this.settings?.getValue<string>(this.loginAtKey(site)) ?? null
      }
    }
    return {
      profilePath: this.paths.profilePath,
      playwrightBrowsersPath: this.paths.playwrightBrowsersPath,
      sites
    }
  }

  async startLogin(site: ResearchLoginSite): Promise<ResearchBrowserStatus> {
    return this.loginFlow(site, { waitForConfirmation: false })
  }

  /** Opens a headed login window and waits for the owner to confirm in-app. */
  async loginFlow(
    site: ResearchLoginSite,
    options: { waitForConfirmation?: boolean; confirmation?: Promise<void> } = {}
  ): Promise<ResearchBrowserStatus> {
    const context = await this.ensureContext(true)
    const page = context.pages()[0] ?? await context.newPage()
    this.loginPages.set(site, page)
    try {
      await page.goto(loginUrl(site), { waitUntil: 'domcontentloaded', timeout: 45_000 })
    } catch (error) {
      // A login page can remain usable when a navigation timeout occurs; leave it open for the owner.
      if (!page.url()) throw error
    }
    if (options.waitForConfirmation === false) return this.status()
    if (options.confirmation) {
      await options.confirmation
      return this.confirmLogin(site)
    }
    return new Promise<ResearchBrowserStatus>((resolve, reject) => {
      this.loginWaiters.set(site, { resolve, reject })
    })
  }

  confirmLogin(site: ResearchLoginSite): ResearchBrowserStatus {
    const timestamp = this.now().toISOString()
    this.settings?.setValue(this.loginKey(site), true)
    this.settings?.setValue(this.loginAtKey(site), timestamp)
    const status = this.status()
    const waiter = this.loginWaiters.get(site)
    if (waiter) {
      this.loginWaiters.delete(site)
      waiter.resolve(status)
    }
    return status
  }

  resolveChallenge(site: string): ResearchBrowserStatus {
    this.settings?.setValue(this.backoffKey(site), null)
    return this.status()
  }

  async search(query: string, lang: string, engine: 'google' | 'bing' | 'ddg' = 'google'): Promise<SearchResult[]> {
    const trimmed = query.trim()
    if (!trimmed) throw new Error('Search query is required.')
    const encoded = encodeURIComponent(trimmed)
    const language = encodeURIComponent(lang.trim() || 'en')
    const url = engine === 'bing'
      ? `https://www.bing.com/search?q=${encoded}&setlang=${language}`
      : engine === 'ddg'
        ? `https://html.duckduckgo.com/html/?q=${encoded}&kl=${language}`
        : `https://www.google.com/search?q=${encoded}&hl=${language}`
    const page = await this.navigate(url)
    const candidates = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map((anchor) => ({
      title: (anchor.textContent ?? '').trim(),
      url: (anchor as HTMLAnchorElement).href,
      snippet: (anchor.parentElement?.textContent ?? '').trim()
    })))
    const engineHosts = new Set(['google.com', 'www.google.com', 'bing.com', 'www.bing.com', 'duckduckgo.com', 'html.duckduckgo.com'])
    const results: SearchResult[] = []
    const seen = new Set<string>()
    for (const candidate of candidates) {
      let parsed: URL
      try {
        parsed = new URL(candidate.url)
      } catch {
        continue
      }
      const domain = domainFromUrl(parsed.toString())
      if (!/^https?:$/.test(parsed.protocol) || engineHosts.has(domain) || seen.has(parsed.toString())) continue
      const title = candidate.title.replace(/\s+/g, ' ').trim()
      if (!title || title.length < 2) continue
      seen.add(parsed.toString())
      results.push({
        title,
        url: parsed.toString(),
        snippet: candidate.snippet.replace(/\s+/g, ' ').trim().slice(0, 1_000),
        domain
      })
      if (results.length >= 50) break
    }
    return results
  }

  async open(url: string): Promise<PageReadResult> {
    const page = await this.navigate(url)
    const title = await page.title().catch(() => '')
    const body = await this.pageText(page)
    const markdown = `# ${title || url}\n\n${body}`.trim()
    const screenshotPath = await this.screenshot(page, url)
    return { markdown, screenshot_path: screenshotPath, url: page.url() || url, title: title || undefined }
  }

  /**
   * Read-only same-origin crawl used by the website review workflow. Every
   * visited page goes through the normal pacing/challenge checks and gets its
   * own full-page screenshot, so the evidence pack is reproducible and never
   * reaches a composer or an outward-action control.
   */
  async crawl(url: string, maxPages = 200): Promise<CrawlResult> {
    const start = new URL(url)
    if (!['http:', 'https:'].includes(start.protocol)) throw new Error('Website crawl requires an HTTP(S) URL.')
    const rootHost = normalizeHost(start.hostname)
    const limit = Math.max(1, Math.min(200, Math.trunc(maxPages)))
    const queue = [start.toString()]
    const seen = new Set<string>()
    const pages: CrawledPage[] = []

    while (queue.length > 0 && pages.length < limit) {
      const current = queue.shift()!
      if (seen.has(current)) continue
      seen.add(current)
      const page = await this.navigate(current)
      const title = await page.title().catch(() => '')
      const body = await this.pageText(page)
      const evidence = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'))
          .map((anchor) => (anchor as HTMLAnchorElement).href)
          .filter(Boolean)
        const technology = [
          ...Array.from(document.querySelectorAll('meta[name="generator"], meta[name="framework"]'))
            .map((meta) => meta.getAttribute('content') ?? ''),
          ...Array.from(document.querySelectorAll('script[src]'))
            .map((script) => (script as HTMLScriptElement).src)
            .filter((src) => /next|nuxt|astro|gatsby|wordpress|shopify|react|vue|gtag|analytics/i.test(src))
        ]
        const analytics = Array.from(document.scripts)
          .map((script) => script.src || script.textContent || '')
          .filter((source) => /gtag|google-analytics|googletagmanager|plausible|matomo|segment|hotjar|clarity/i.test(source))
        return { links, technology, analytics }
      }).catch(() => ({ links: [], technology: [], analytics: [] }))
      const screenshotPath = await this.screenshot(page, current)
      const resolved = page.url() || current
      const crawled: CrawledPage = {
        markdown: `# ${title || resolved}\n\n${body}`.trim(),
        screenshot_path: screenshotPath,
        url: resolved,
        title: title || undefined,
        links: [...new Set(evidence.links)],
        technology: [...new Set(evidence.technology.filter(Boolean))],
        analytics: [...new Set(evidence.analytics.filter(Boolean))]
      }
      pages.push(crawled)

      for (const link of crawled.links) {
        if (queue.length + pages.length >= limit) break
        try {
          const candidate = new URL(link, resolved)
          candidate.hash = ''
          if (!['http:', 'https:'].includes(candidate.protocol)) continue
          if (normalizeHost(candidate.hostname) !== rootHost) continue
          const normalized = candidate.toString()
          if (!seen.has(normalized) && !queue.includes(normalized)) queue.push(normalized)
        } catch {
          // Ignore malformed or non-URL hrefs in public HTML.
        }
      }
    }
    return { startUrl: start.toString(), pages, truncated: queue.length > 0 }
  }

  async scrollCollect(url: string, n: number): Promise<ScrollCollectResult> {
    const page = await this.navigate(url)
    const site = socialSiteForHost(domainFromUrl(url))
    // `navigate` already consumes the first social page. Keep the total at
    // 200 even when callers ask for 200 scroll chunks.
    const maxScrolls = site ? RESEARCH_SOCIAL_PAGE_LIMIT - 1 : RESEARCH_SOCIAL_PAGE_LIMIT
    const count = Math.max(site ? 0 : 1, Math.min(maxScrolls, Math.trunc(n)))
    const chunks: string[] = []
    for (let index = 0; index < count; index += 1) {
      if (site) this.socialBudget.consume(this.jobId, site)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(250)
      chunks.push(await this.pageText(page))
    }
    const title = await page.title().catch(() => '')
    const screenshotPath = await this.screenshot(page, url)
    const markdown = `# ${title || url}\n\n${[...new Set(chunks)].join('\n\n')}`.trim()
    return { markdown, screenshot_path: screenshotPath, url: page.url() || url, title: title || undefined, pages: count + 1 }
  }

  async youtubeTranscript(url: string): Promise<TranscriptResult> {
    const page = await this.navigate(url)
    const player = await page.evaluate(() => {
      const candidate = (globalThis as { ytInitialPlayerResponse?: unknown }).ytInitialPlayerResponse
      return candidate
    })
    const tracks = ((player as { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: Array<{ baseUrl?: string; languageCode?: string }> } } } | null)?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [])
      .filter((track): track is { baseUrl: string; languageCode?: string } => typeof track.baseUrl === 'string' && track.baseUrl.length > 0)
    if (tracks.length === 0) return { transcript: '', language: '', url: page.url() || url }
    const track = tracks[0]
    let xml = ''
    try {
      xml = await page.evaluate(async (trackUrl) => fetch(trackUrl).then((response) => response.text()), track.baseUrl)
    } catch {
      return { transcript: '', language: track.languageCode ?? '', url: page.url() || url }
    }
    const transcript = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi)]
      .map((match) => match[1]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim())
      .filter(Boolean)
      .join(' ')
    return { transcript, language: track.languageCode ?? '', url: page.url() || url }
  }

  async redditSearch(query: string): Promise<RedditResult[]> {
    const trimmed = query.trim()
    if (!trimmed) throw new Error('Reddit search query is required.')
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(trimmed)}&raw_json=1&limit=100`
    this.assertAvailable('reddit')
    await this.limiter.wait(domainFromUrl(url))
    this.socialBudget.consume(this.jobId, 'reddit')
    const response = await fetch(url, { headers: { 'User-Agent': 'OctaResearch/0.1 (read-only)' } })
    const responseText = await response.text()
    const challenge = response.status === 403 || response.status === 429
      ? `HTTP ${response.status}`
      : responseText.match(/captcha|recaptcha|turnstile|verify you are human|unusual traffic|security check|challenge|robot check|access denied|blocked/i)?.[0]
    if (challenge) {
      const event = this.emitChallenge('reddit', 'reddit.com', url, challenge)
      throw new SiteBackoffError(`Reddit search challenge detected.`, 'reddit', event.backoffUntil)
    }
    if (!response.ok) throw new Error(`Reddit search failed with HTTP ${response.status}.`)
    let payload: { data?: { children?: Array<{ data?: Record<string, unknown> }> } }
    try {
      payload = JSON.parse(responseText) as { data?: { children?: Array<{ data?: Record<string, unknown> }> } }
    } catch {
      throw new Error('Reddit search returned an unreadable response.')
    }
    return (payload.data?.children ?? []).flatMap((child) => {
      const item = child.data
      if (!item) return []
      return [{
        title: typeof item.title === 'string' ? item.title : '',
        url: typeof item.permalink === 'string' ? `https://www.reddit.com${item.permalink}` : typeof item.url === 'string' ? item.url : '',
        subreddit: typeof item.subreddit_name_prefixed === 'string' ? item.subreddit_name_prefixed : typeof item.subreddit === 'string' ? `r/${item.subreddit}` : '',
        author: typeof item.author === 'string' ? item.author : '',
        score: typeof item.score === 'number' ? item.score : 0,
        comments: typeof item.num_comments === 'number' ? item.num_comments : 0,
        selftext: typeof item.selftext === 'string' ? item.selftext : '',
        createdAt: typeof item.created_utc === 'number' ? new Date(item.created_utc * 1_000).toISOString() : null
      }]
    }).filter((item) => item.title && item.url)
  }

  private async navigate(url: string): Promise<Page> {
    const host = domainFromUrl(url)
    const site = socialSiteForHost(host)
    this.assertAvailable(site ?? host)
    await this.limiter.wait(host)
    if (site) this.socialBudget.consume(this.jobId, site)
    const context = await this.ensureContext(false)
    const page = context.pages()[0] ?? await context.newPage()
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    } catch (error) {
      const challenge = await this.challengeReason(page)
      if (challenge) {
        this.emitChallenge(site ?? host, host, url, challenge)
        throw new SiteBackoffError(`Research browser challenge detected for ${host}.`, site ?? host, this.backoffUntil(site ?? host)?.toISOString() ?? this.now().toISOString())
      }
      throw error
    }
    const challenge = await this.challengeReason(page)
    if (challenge) {
      const event = this.emitChallenge(site ?? host, host, url, challenge)
      throw new SiteBackoffError(`Research browser challenge detected for ${host}.`, site ?? host, event.backoffUntil)
    }
    return page
  }

  private async pageText(page: Page): Promise<string> {
    return page.evaluate(() => {
      const copy = document.body?.cloneNode(true) as HTMLElement | null
      copy?.querySelectorAll('script, style, noscript, svg').forEach((node) => node.remove())
      return copy?.innerText?.replace(/\n{3,}/g, '\n\n').trim() ?? ''
    })
  }

  private async screenshot(page: Page, url: string): Promise<string> {
    const digest = createHash('sha256').update(`${url}:${this.now().toISOString()}`).digest('hex').slice(0, 16)
    const path = join(this.paths.screenshotPath, `${digest}.png`)
    try {
      await page.screenshot({ path, fullPage: true })
      return path
    } catch {
      return ''
    }
  }

  private async challengeReason(page: Page): Promise<string | undefined> {
    const title = await page.title().catch(() => '')
    const body = await page.locator('body').innerText({ timeout: 5_000 }).catch(() => '')
    const text = `${title}\n${body}`
    const match = text.match(/captcha|recaptcha|turnstile|verify you are human|unusual traffic|security check|challenge|robot check|access denied|blocked/i)
    return match?.[0]
  }

  private assertAvailable(site: string): void {
    const backoff = this.backoffUntil(site)
    if (backoff && backoff.getTime() > this.now().getTime()) {
      throw new SiteBackoffError(`Research browser is backing off ${site} until ${backoff.toISOString()}.`, site, backoff.toISOString())
    }
  }

  private emitChallenge(site: string, domain: string, url: string, reason: string): BrowserChallengeEvent {
    const backoffUntil = new Date(this.now().getTime() + RESEARCH_CHALLENGE_BACKOFF_MS)
    this.settings?.setValue(this.backoffKey(site), backoffUntil.toISOString())
    const event: BrowserChallengeEvent = {
      type: 'browser:challenge',
      site,
      domain,
      url,
      reason,
      backoffUntil: backoffUntil.toISOString(),
      timestamp: this.now().toISOString()
    }
    this.onChallenge?.(event)
    if (this.jobFolder) {
      const path = join(this.jobFolder, 'browser-events.jsonl')
      mkdirSync(this.jobFolder, { recursive: true })
      appendFileSync(path, `${JSON.stringify(event)}\n`, 'utf8')
    }
    return event
  }

  private backoffUntil(site: string): Date | undefined {
    return asDate(this.settings?.getValue(this.backoffKey(site)))
  }

  private loginKey(site: string): string { return `research.browser.login.${site}` }
  private loginAtKey(site: string): string { return `research.browser.login_at.${site}` }
  private backoffKey(site: string): string { return `research.browser.backoff.${site}` }
}

export function createResearchBrowser(options: ResearchBrowserOptions): ResearchBrowser {
  return new ResearchBrowser(options)
}
