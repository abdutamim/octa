import { describe, expect, it, vi } from 'vitest'
import {
  MCP_SERVER_NAME,
  MCP_TOOL_NAMES,
  MCP_TOOL_SCHEMAS,
  createMcpServer,
  createOctaToolHandlers
} from '../electron/core/octa/mcp-server'
import type { ResearchBrowser } from '../electron/core/octa/browser'

function fakeBrowser(): ResearchBrowser {
  return {
    search: vi.fn(async (query: string, lang: string, engine = 'google') => [{ title: query, url: 'https://example.test/result', snippet: lang, domain: engine }]),
    open: vi.fn(async (url: string) => ({ markdown: '# Result', screenshot_path: '', url })),
    scrollCollect: vi.fn(async (url: string, n: number) => ({ markdown: '# Result', screenshot_path: '', url, pages: n })),
    youtubeTranscript: vi.fn(async (url: string) => ({ transcript: 'captions', language: 'en', url })),
    redditSearch: vi.fn(async () => [])
  } as unknown as ResearchBrowser
}

describe('octa-tools MCP server', () => {
  it('exposes the required schemas and tool names', () => {
    expect(MCP_SERVER_NAME).toBe('octa-tools')
    expect(MCP_TOOL_NAMES).toEqual(expect.arrayContaining([
      'search',
      'open',
      'scroll_collect',
      'youtube_transcript',
      'reddit_search',
      'brave_search'
    ]))
    expect(MCP_TOOL_SCHEMAS.search.required).toEqual(['query', 'lang'])
    expect(MCP_TOOL_SCHEMAS.search.properties.engine.enum).toEqual(['google', 'bing', 'ddg'])
    expect(MCP_TOOL_SCHEMAS.open.required).toEqual(['url'])
    expect(MCP_TOOL_SCHEMAS.scroll_collect.properties.n.maximum).toBe(200)
  })

  it('registers Brave only when a key is available and delegates browser tools', async () => {
    const browser = fakeBrowser()
    const withoutBrave = createMcpServer({ browser })
    expect(withoutBrave.toolNames).not.toContain('brave_search')

    const handlers = createOctaToolHandlers({ browser })
    const search = await handlers.search('dentist Cairo', 'ar', 'bing')
    expect(search.engine).toBe('bing')
    expect(browser.search).toHaveBeenCalledWith('dentist Cairo', 'ar', 'bing')

    const fetch = vi.fn(async () => new Response(JSON.stringify({
      query: { original: 'fallback' },
      web: { results: [{ title: 'Fallback', url: 'https://fallback.test', description: 'description' }] }
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    const withBrave = createMcpServer({ browser, braveApiKey: 'test-key', fetch })
    expect(withBrave.toolNames).toContain('brave_search')
    expect(withBrave.handlers.braveSearch).toBeDefined()
    await expect(withBrave.handlers.braveSearch?.('fallback', 'en')).resolves.toMatchObject({
      query: 'fallback',
      results: [{ domain: 'fallback.test' }]
    })
    expect(fetch).toHaveBeenCalledOnce()
  })
})
