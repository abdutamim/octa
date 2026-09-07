# 02 — Research engine (the 100-source rule)

Applies to every research job: dream buyer persona, competitors, market map,
pricing benchmarks, a topic Bedo wants to think about, a client's industry.
The runner refuses a research result that does not meet this protocol.

## 1. Targets

| Metric | Minimum | Notes |
|---|---|---|
| Distinct sources read | **100** | a source = one URL actually fetched and read, not a search snippet |
| Distinct domains | 40 | max 8 pages from any one domain count toward the 100 |
| Languages | **five always: Arabic (MSA + Egyptian), English, French, German, Russian** | every research job searches all five; the scout adds Turkish, Spanish, Chinese, Italian... when the market or competitors live there. Target ≥10 sources per language; a language that returns nothing relevant after 15 queries is logged as "no material" and does not fail the gate |
| Source types | ≥5 of: official sites, docs, reviews, forums (Reddit, Facebook groups, Arabic forums), news, academic/reports, social (X, LinkedIn, TikTok, YouTube transcripts), marketplaces, job posts, app stores | forums and reviews are where the persona language lives |
| Freshness | ≥30% from the last 12 months | dated in the ledger |
| Contradictions | logged | when sources disagree, both are kept and flagged |

## 2. Protocol (the scout follows this exactly)

1. **Frame.** Restate the question, the decision it serves, and what "done" looks like.
2. **Language plan.** Start from the fixed five (ar, en, fr, de, ru), add any other language the topic lives in, and say why. Write 15–30 queries per language, written natively in that language (not translated word for word), including slang and local terms (Egyptian Arabic search terms differ from MSA; German and Russian forums use their own product names).
3. **Harvest.** Run the queries across web search, Reddit (`old.reddit.com` + `/search.json`), YouTube (transcripts), app stores, review sites, marketplaces, LinkedIn/X where public. Facebook groups are read through screenshots Bedo provides or public pages only; the scout never logs in.
4. **Ledger as you go.** Append every fetched source to `evidence/sources.jsonl` immediately (schema below). Save the extracted text to `evidence/pages/<n>.md`.
5. **Extract.** For each source: 3–10 claims, each with a quote (≤25 words), language, date, and a confidence tag.
6. **Cross-check.** Cluster claims; count independent confirmations; mark single-source claims as such.
7. **Gap check.** If any target in section 1 is unmet, go back to step 3 with new queries. Do not stop at 100 if the last 20 sources still added new claims; stop when 20 consecutive sources add nothing new (saturation) or at the budget.
8. **Report.** `evidence/report.md` in Bedo's language with: answer first, then themes ranked by (frequency × intensity), persona/competitor tables, verbatim customer language (bilingual), contradictions, what is still unknown, and the full source list.

## 3. Ledger schema (`sources.jsonl`, one line per source)

```json
{ "n": 37, "url": "...", "domain": "...", "title": "...", "lang": "ar-EG", "type": "forum",
  "published": "2026-03-12", "fetched": "2026-09-05T20:11:00Z", "words": 1840,
  "claims": [ { "text": "...", "quote": "...", "confidence": "high|medium|low", "topic": "pricing" } ],
  "relevance": 0.8, "notes": "..." }
```

`evidence.schema.json` (for `--output-schema`) wraps `{ frame, language_plan[], sources[], themes[], contradictions[], unknowns[], report_path }`.

## 4. Persona job (dream buyer persona)

Runs the protocol with these mandatory source types: forums/reviews in the
customer's language, competitor reviews (1–3 star and 5 star), job posts (for
B2B), support threads, social comments. Output uses the 32-field Buyer Persona
Sheet from `performance-marketer` (references/02_Dream_Buyer_Persona.md) and
the VOC section of `customer-research`. Each field cites source numbers.

## 5. Competitor job

Input: names or URLs, or "find them" (then step 3 discovers ≥15 candidates
first and Bedo picks or the planner picks top 5–8). Per competitor: site,
pricing, positioning, reviews across languages, ads library (Meta Ad Library
public pages), social presence, hiring signals, changelog. Output uses the
`competitor-profiling` template plus the 15-step analysis in
`performance-marketer`'s competitor addendum. Then `competitors` skill can
turn it into pages if the workflow asks.

## 6. Tools the scout uses (decisions D3, D5)

- **Layer 1:** Codex built-in web search (verify the feature flag name in
  spec 004).
- **Layer 2, the research browser:** a persistent Playwright Chromium
  profile at `C:\Octa\browser\research`. The owner logs in once to Facebook,
  X, and any site that needs it (Octa opens the window and waits, the same
  way Codex and Claude ask for login). The scout drives it through the
  `octa-tools` MCP server: `search(query, lang, engine)` over Google / Bing /
  DuckDuckGo result pages, `open(url) → markdown + screenshot`,
  `scroll_collect(url, n)` for feeds and groups, `youtube_transcript(url)`,
  `reddit_search(query)` via public JSON. Read-only: the browser tool has no
  post, like, comment, or message actions at all. Rate limits: ≤1 page every
  4 s per domain, ≤200 pages per social site per job. Facebook and X content
  is read from the logged-in session only when the job explicitly lists
  them as source types.
- **Layer 3:** Brave Search API free tier as a fallback when the browser is
  blocked or captchaed. Captchas are shown to the owner to solve; Octa never
  solves them.
- Hacker News API, app-store pages, Wayback for dead pages.
- Account risk (D5): the owner accepts that automated reading from a
  logged-in Facebook/X session can get the account flagged. Octa uses a
  dedicated profile, human-like pacing, and stops a site for 24 h on the
  first challenge.

## 7. Quality gates enforced by the runner (not by the model)

- Count distinct URLs in `sources.jsonl` ≥ 100 and domains ≥ 40, else `failed: depth`.
- Every claim in the report references a source number that exists.
- Language plan includes ar, en, fr, de, ru; ≥10 sources in each language that has material; languages marked "no material" carry the 15 queries that were tried.
- Report is in the conversation language.
