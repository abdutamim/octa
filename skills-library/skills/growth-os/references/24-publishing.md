# 24 — Publishing

Rendered assets → Instagram, through the Meta Graph API pipeline in
`scheduler/` (inside `C:\Users\Admin\Desktop\Tamim Portfolio\`). Carousel
publishing is live and battle-tested. This file is the contract.

## Hard rule — the confirmation gate

Never publish a post the user has not explicitly approved in the current
conversation. Before any publish call, show: the final rendered slides, the
exact caption, and the slot. Get a clear yes. **One approval = one post** — no
batch approvals, no "publish the rest like the last one".

## The pipeline

| Piece | File | Job |
|---|---|---|
| Calendar | `scheduler/config.mjs` | `SCHEDULE`: `{id, slides, when}` — times carry explicit `+03:00` so GitHub's UTC runners resolve them correctly |
| Captions | `scheduler/captions.mjs` | `CAPTIONS[id]` — Arabic-safe because Node `URLSearchParams` encodes UTF-8 correctly |
| Publisher | `scheduler/publish.mjs` | Graph API v21: upload children by URL → carousel container → poll `status_code` to `FINISHED` (20 × 3s) → `media_publish` |
| Runner | `scheduler/run.mjs` | CI: picks the **earliest due unpublished** post, one per run (auto catch-up), writes `state.json`; the workflow commits it back |
| State | `scheduler/state.json` | `published[id] = {mediaId, at, manual?}` — the only thing preventing double-posts |

**Hosting contract:** slides must be live at
`https://www.tamim.works/social-media/{id}-{nn}.jpg` before the slot — `nn` is
the 1-based, zero-padded slide number (`W1D01A-01.jpg`). The API fetches by
URL; nothing is uploaded from disk.

**Credentials:** `META_PAGE_TOKEN` + `META_IG_BUSINESS_ID`. In CI they are
GitHub Secrets. For a manual local publish, set them as env vars in
**PowerShell** and run the runner. Never write them into files.

## Publishing a new batch

1. Render finals as JPG, named `{id}-{nn}.jpg`. IDs follow `W{week}D{day}{slot}`
   (slots A/B/C = 13:00 / 18:00 / 21:00 `+03:00` — the tested cadence).
2. Deploy them to the site's `/social-media/` folder.
3. Append entries: caption → `CAPTIONS[id]`, slot → `SCHEDULE`.
4. CI publishes each due post on its next run and commits `state.json`.
5. Immediate manual publish: run `run.mjs` locally (PowerShell + env vars). It
   records state, so CI will not double-post. If a post was published outside
   the runner, add it to `state.json` by hand with `"manual": true`.

## Encoding — the two traps

- Arabic captions travel ONLY through Node (`URLSearchParams`). git-bash curl
  mangles UTF-8 — never hand-post a caption with it.
- Arabic filenames on disk: manipulate with PowerShell, not git-bash
  `cp`/`find`.

## Reels

`publish.mjs` handles `CAROUSEL` only today. Reels go out manually for now.
When volume justifies it, extend it with `media_type=REELS` + a hosted MP4 URL
(same container → poll → publish dance). Do not pretend this exists already.

## After publishing

Log the media id and slot. The weekly rhythm in 15 reads the numbers; the
90-day audit in 12/15 decides what gets doubled down or killed. Publishing
without reading results a week later is half a pipeline.

## Use with
09 (the plan that fills the calendar) · 13 (gates before anything ships) ·
20 (rendering + naming) · `profiles/` (per-brand accounts and hosting).
