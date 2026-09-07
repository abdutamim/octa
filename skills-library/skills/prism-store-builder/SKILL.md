---
name: prism-store-builder
description: Convert an approved client HTML design into a PRISM-based Shopify theme. Use this whenever the user wants to turn a design (an HTML file, a mockup, or an approved client comp) into a working Shopify store, onboard a new client onto the PRISM theme, build a client storefront, or apply a client's brand to PRISM. Trigger this for phrases like "build this client's store", "turn this HTML into a theme", "convert this design to Shopify", "onboard [client] onto PRISM", "make a store from this mockup", or any time an HTML design plus a request to produce a Shopify theme appears together. Works inside the PRISM theme repository.
---

# PRISM Store Builder

Converts a client's approved HTML design (multi-page) plus their product data into a working, fully-editable Shopify theme built on the PRISM base theme. This skill encodes the team's repeatable client-delivery workflow so every build follows the same safe, high-quality path.

## Core principles (read before building)

1. **Never touch the clean base.** All client work happens on a dedicated git branch. The `main` branch must always stay a pristine PRISM. This is non-negotiable — it protects every other client.
2. **Nothing hardcoded.** Every text, image, color, and link the client might change must be editable from the Shopify theme editor (section settings + blocks). If a merchant can't edit it without code, it's built wrong.
3. **Reuse before rebuild.** PRISM already ships 50+ original sections and 19 JS modules. Map the design to what exists first; only build new sections when the design genuinely needs something PRISM lacks.
4. **Never invent content.** Use the real text and prices from the client's inputs. If something is missing, insert a clear placeholder and flag it in a list at the end — never fabricate prices, reviews, or copy.
5. **Show the plan before building.** After reading inputs and mapping the design, stop and show the user before writing files. This keeps them in control.

## Expected inputs

The PRISM theme itself is fetched automatically in Step 0 (cloned from `github.com/outfred/prism-theme` if not already present) — the user does not need to supply it.

The user will provide (usually as files in the repo root):
- An **HTML design file** — typically 5 pages: homepage, product, collection, about, contact (but handle any number).
- A **products file** — CSV/JSON/text with the client's product names, prices, descriptions.
- Optionally a **client-images/** folder with product imagery.
- Optionally a **client-revisions.md** file, or revisions written directly in the request.

If any expected input is missing, ask for it before building — don't guess what the client sells.

## The workflow

Work through these steps in order. Stop at the checkpoints.

### Step 0 — Get the PRISM theme, then branch (always first)

**First, make sure the PRISM theme is present.** Check the current directory for a PRISM theme (look for `config/settings_data.json` plus the PRISM sections like `sections/prism-*.liquid`). If it is NOT here:
```
git clone https://github.com/outfred/prism-theme.git
cd prism-theme
```
If the current directory already IS the PRISM theme, skip the clone.

**Then create a client branch** so `main` stays a pristine PRISM:
```
git checkout main
git pull        # ensure the base is current
git checkout -b client/<client-slug>
```
Confirm you're on the client branch before any edit. If `main` has uncommitted changes, flag it and ask how to proceed.

### Step 1 — Read the inputs

Read the HTML design, the products file, and scan client-images/. Report what you found: how many pages in the HTML, how many products, how many images. Confirm this matches what the user expects.

### Step 2 — Map the design to PRISM (CHECKPOINT — show before building)

Go page by page, section by section through the HTML. For each section, classify it:
- **Reuse** — an existing PRISM section covers it → configure to match.
- **Extend** — close to a PRISM section but needs changes → extend that section.
- **Build new** — genuinely new → build a new section, namespaced, fully editable.

Produce a mapping table (HTML section → PRISM section → reuse/extend/build) and the design-token plan (Step 3). **Stop and show the user this plan before writing any files.** See `references/section-mapping.md` for how PRISM's sections map to common design patterns.

### Step 3 — Extract design tokens

From the HTML, pull exact values and apply them as the active theme settings:
- **Colors** → set up a PRISM color scheme with the exact hex values.
- **Typography** → heading + body fonts. They must be Shopify-available fonts; if a font isn't available, choose the closest match and tell the user which and why.
- **Buttons** → radius, padding.
- **Spacing** → section padding rhythm.

### Step 4 — Build the page templates

Build each page as a proper OS 2.0 JSON template with the mapped sections in order:
- `templates/index.json` (homepage)
- `templates/product.json`
- `templates/collection.json`
- `templates/page.about.json`
- `templates/page.contact.json`

(Adjust to the actual pages in the HTML.)

### Step 5 — Add the client's content

Structure the products from the products file, wire images to the right products, and fill in the real text from the HTML. Use clear placeholders for anything missing and collect them in a flag list — never fabricate.

### Step 6 — Optional PRISM features

Enable ONLY the features the user explicitly requests. Do not turn on anything unasked. The full catalog of toggleable features and how to enable each is in `references/feature-catalog.md`. If the user hasn't said which features they want, show them the catalog list and ask.

### Step 7 — Client revisions

Apply revisions from the request and/or a `client-revisions.md` file if present. If there are none, skip.

### Step 8 — Verify (CHECKPOINT — report at the end)

- Run `shopify theme check` → must be 0 errors.
- Confirm every section is editable in the theme editor (spot-check for hardcoded content).
- Confirm the pages render and match the HTML.
- Give a summary: what was reused, what was built new, which features were enabled, and every placeholder/missing item you flagged.

## Handoff (when the build is approved)

Push to the client's store as an unpublished theme so they can preview before going live:
```
shopify theme push --store <client-store>.myshopify.com --unpublished
```

Branch management between clients:
- New client → `git checkout main` then start at Step 0 again.
- Return to a past client → `git checkout client/<client-slug>`.

## What this skill is NOT for

- Building the PRISM base theme itself (that's already built).
- Submitting PRISM to the Theme Store.
- Designing the HTML from scratch — this skill starts from an *approved* design. If the user needs the design created first, do that separately, then use this skill to convert it.
