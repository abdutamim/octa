# Profile — Tamim (@tamim.work)

The default profile. Load it for any @tamim.work / tamim.works work. For any
other brand, copy `_client-template.md` and fill it from a 22 audit — never
reuse this file's numbers for a client.

## Identity
- Abdo Tamim — Shopify/full-stack dev. Sells **مواقع ومتاجر بتبيع** — stores
  and landing pages that convert, not just look expensive.
- Working proof line (keep current as it grows): «حِداشَر مَشْروع، مَبْني مِن الصِّفْر».
- Audience: Egyptian + Gulf store owners and founders. Masri with English
  technical terms kept in English (checkout, speed, landing).
- DM keyword CTAs in play: «ابعت REVIEW» · «ابعت بيلد».

## Voice
- Masri, direct, craftsman-confident. No hype, no فصحى in casual content,
  no AI-slop phrasing (07's banned list applies hard here).
- Captions publish via the Node pipeline only (see 24 — UTF-8 trap).

## Look — editorial-cinematic system
`social-v3/DESIGN-SYSTEM.md` is law for this brand. Working tokens:
- Canvas: 1080×1350 posts · 1080×1920 reels.
- Palette: acid `#c8f24f` (single accent, EN/editorial) · mint `#3ee6a4`
  (kinetic reels) · ink `#121407` · paper `#f7f5ef` · navy `#0d1b5e` + mint
  `#4ddec6` (the Arabic blue family).
- Type: EN — Inter-Black / Instrument Serif / Playfair / Anton. AR — Lifta
  (heavy) / Qahwa (elegant) / Bukra (mid). Fonts live in `social-v3/fonts/`
  and the v2 set.
- Top bar on every post: `JULY ©2026 · TAMIM.WORKS · <CATEGORY>`.
- Grain overlay on generated imagery; scrim gradients under type.
- Face refs: `social-v4/assets/me.png` + `headshot.png` (face-lock preset).
- Current vibe (`social-v4/vibe.json`): Kodak Portra 400 · single hard amber
  practical from low left · warm amber / near-black grade only · 50mm shallow ·
  locked camera · subject low off-centre with the upper third left empty for
  type. One vibe per set.

## Voice-over identity
- Gemini TTS voice `Charon`, script lines written **with tashkeel**, one API
  call per script (`social-v2/video/tts.mjs`).

## Plant & accounts
- Carousels: `tamim-carousel` skill (cafe-clone renderer). Visual craft law:
  `carousel-forge`.
- Images: `social-v2/gen.mjs` + `social-v4/` vibe system. Key = brand-faces in
  `social-v2/.env`.
- Reels: `social-v2/video/` (Remotion) · Omni clips: `social-v3/omni.mjs`.
- Publish: `scheduler/` → `tamim.works/social-media` → IG @tamim.work.
  Slots 13:00 / 18:00 / 21:00 `+03:00`.

## Offer ladder (16's frame — current state, edit as offers evolve)
- Entry: REVIEW audit via DM keyword (free — fills the pipeline).
- Core: متجر / لاندنج build (the business).
- Aspirational: full brand + store system for a serious client (anchor; keep
  one visible case).
