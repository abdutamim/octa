# Section Mapping Guide

How to map common HTML design patterns to PRISM sections. Use this during Step 2 (mapping) so you reuse PRISM's existing sections instead of rebuilding.

## Mapping philosophy
For every block in the client's HTML, find the closest PRISM section. Most designs are combinations of patterns PRISM already covers. Build new only when the pattern is genuinely absent.

## Common patterns → PRISM sections

| HTML design pattern | PRISM section to use | Notes |
|---------------------|---------------------|-------|
| Full-width hero with headline + CTA | `image-banner` | Supports image/video bg, overlay, text position |
| Hero with rotating slides | `slideshow` | Multiple slides, autoplay |
| Split hero (image one side, text other) | `image-with-text` | Asymmetric layout |
| Scrolling announcement/ticker | `prism-marquee` | Scrolling text strip |
| Product grid ("our products", "shop") | `featured-collection` | Configurable columns, quick-add |
| Multiple collection cards/links | `collection-list` | Visual collection navigation |
| Asymmetric "bento" promo grid | `prism-promo-bento` | Mixed-size promo panels |
| Brand story / about block | `image-with-text` or `rich-text` | Text + optional image |
| Editorial image grid / lookbook | `prism-lookbook` | Masonry; hotspots if extended |
| Before/after comparison | `prism-before-after` | Draggable slider |
| Customer reviews / quotes | `prism-testimonials` | Quote slider with ratings |
| Trust/feature icons row | `prism-trust-badges` | Icon + label + sub |
| Stats row (numbers) | `multicolumn` | Configure as stat columns |
| Logo strip (press/partners) | `prism-logo-list` | Grayscale, infinite scroll |
| FAQ accordion | `collapsible-content` | Expandable rows |
| Multi-column features | `multicolumn` | Icon + heading + text columns |
| Step-by-step / timeline | `prism-timeline` | Numbered milestones |
| Team members | `prism-team` | Member grid |
| Newsletter signup (inline) | `newsletter` or `email-signup-banner` | Native customer form |
| Newsletter (popup/modal) | `prism-newsletter-popup` | Timed/exit-intent |
| Contact form | `contact-form` | Native Shopify form |
| Map / location | `prism-map` | Store locator |
| Rich text / long copy | `rich-text` | Headings + paragraphs |
| Video embed | `video` | Shopify/YouTube/Vimeo |
| Custom one-off markup | `custom-liquid` | Last resort for unique blocks |

## Page-level mapping

| Page | Base template | Key sections |
|------|--------------|--------------|
| Homepage | `index.json` | hero, featured-collection, image-with-text, testimonials, newsletter |
| Product | `product.json` | media gallery, variant picker, ATC, related products |
| Collection | `collection.json` | facets/filtering, product grid, collection-tools |
| About | `page.about.json` | image-with-text, timeline, team, rich-text |
| Contact | `page.contact.json` | contact-form, map, rich-text |

## When to build new
Build a new section only when:
- The pattern doesn't match anything above, AND
- It can't be achieved by configuring/extending an existing section.

When you build new: namespace it (`prism-<name>` or a client prefix), give it a complete `{% schema %}` with editable settings and blocks, make it responsive and accessible, and keep it consistent with PRISM's design-token system (CSS custom properties). Never hardcode the content.

## Token consistency
Whatever sections you use, they must all read from the same theme color scheme and typography settings extracted in Step 3 — so the whole store feels like one brand, not a patchwork.
