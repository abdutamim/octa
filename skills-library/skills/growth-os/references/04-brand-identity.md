# 04 — Brand Identity

## Naming

Criteria: sayable out loud · spellable after hearing once · short · available
handle · does not box you in if you expand.

| Type | Example pattern | Best for |
|---|---|---|
| Descriptive | says what it does | local, service, early trust |
| Personal | founder's name | personal brand, consulting |
| Abstract | invented word | product, scale, trademark safety |
| Compound | two real words joined | tech, D2C |

---

## Logo

| Type | Description | Use when |
|---|---|---|
| Wordmark | styled name only | name is short and distinctive |
| Lettermark | initials | long name |
| Icon + wordmark | symbol beside text | needs an app icon / avatar |
| Emblem | text inside a shape | heritage, food, local |

### Unbreakable rules
```
✓ Design in black and white FIRST. If it fails in mono, color will not save it.
✓ Must read at 24 × 24 px (favicon / profile avatar).
✓ Produce three lockups: horizontal, square, icon-only.
✗ No gradients, no drop shadows, no 3D bevels, no stock clip art.
✗ No more than two visual ideas in one mark.
```

### Logo generation prompt template
```
A [type] logo for [name], a [category] serving [audience].
Style: [3 adjectives from vibe.json]. Geometry: [geometric | organic | angular].
Single color, flat vector, solid black on white, no gradient, no shadow,
no text effects, high contrast, legible at small size, centered, generous margin.
```

---

## Color

**60 / 30 / 10** · maximum **4 colors** total · text contrast **≥ 4.5:1**.

- 60% ground (background)
- 30% ink (text and structure)
- 10% accent (one accent per composition, never two)

| Family | Common association |
|---|---|
| Blue | trust, stability, tech, finance |
| Green | growth, health, nature, calm |
| Red | urgency, appetite, energy |
| Black + gold | luxury, exclusivity |
| Beige / earth | craft, fashion, warmth, natural |
| Purple | creativity, premium, spiritual |

**Arab-market nuances to check before locking:**
- White + gold reads as luxury and formality.
- Green carries both religious and natural connotations — confirm which is intended.
- Beige and earth tones read as fashion and craft, not as "cheap".
- High-saturation neon reads as discount / youth commerce.

---

## Typography

- **Two typefaces maximum.** One display, one text. A single well-chosen family
  with multiple weights is also acceptable.
- **For Arabic: build hierarchy with weight, not size.** Arabic script loses
  legibility fast when scaled down and gets noisy when scaled up. Size ratio
  between levels should stay between **1.1:1 and 1.9:1**; do the rest with weight.
- Never apply positive letter-spacing to Arabic.
- Choose a family with a genuine bold and a genuine light — no faux bold.

---

## vibe.json

Lock the identity in a machine-readable file so every asset is reproducible.

```json
{
  "name": "",
  "adjectives": ["", "", ""],
  "palette": {
    "ground": "#",
    "ink": "#",
    "accent": "#",
    "muted": "#"
  },
  "type": {
    "display": { "family": "", "weight": 700 },
    "text": { "family": "", "weight": 400 }
  },
  "geometry": "geometric | organic | angular",
  "corner_radius": 0,
  "photo_direction": {
    "lighting": "",
    "framing": "",
    "grade": ""
  },
  "anti_style": [
    "no gradients",
    "no stock handshake photos",
    "no drop shadows",
    "no more than one accent per composition"
  ]
}
```

**`anti_style` is the most important field.** Defining what is forbidden keeps a
brand consistent far more reliably than defining what is allowed.

---

## Moodboard

9–12 reference images, plus a separate **"forbidden" board** of 4–6 images that
look close but are wrong. The contrast board is what makes the direction legible
to a designer or an image model.

---

## Profile (the highest-leverage asset)

Every visitor decides in ~5 seconds. Optimize in this order:

1. **Photo** — face, clear, high contrast, same crop everywhere.
2. **Name field** — `Name | what you do for whom` (this field is searchable).
3. **Bio, 3 lines** — who you help · the outcome · the CTA.
4. **Link** — one destination, matching the current offer.

**Highlight order:** `Start Here · Work · Results · Testimonials · Services · Free Value`

---

## Output: Brand Sheet

```markdown
**Name & rationale** · **Logo direction** (type + 3 concepts + prompt)
**Palette** (4 hex + 60/30/10 roles) · **Type** (2 families + weights)
**vibe.json** (filled) · **Moodboard brief** · **Anti-style list**
**Profile copy** (name field, 3-line bio, link, highlight order)
```
