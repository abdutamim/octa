# PRISM Feature Catalog

The optional features PRISM can enable on a client store. Enable **only** what the client explicitly requests. Each entry notes what it does and where it lives so you can wire it correctly.

## How to use this file
When the user asks for a feature, find it here, enable its section/snippet/JS, and expose its settings in the theme editor. If the user hasn't specified features, present this list and ask which they want.

## Conversion features

| Feature | What it does | Where it lives |
|---------|-------------|----------------|
| **Countdown timer** | Urgency timer, section-level or product-level | `prism-countdown` section + `prism-countdown.js` |
| **Trust badges** | Icon + text badges (free shipping, secure payment, returns) | `prism-trust-badges` section |
| **Sticky add-to-cart** | Fixed ATC bar appearing on scroll past the main button | `prism-sticky-atc` + `prism-sticky-atc.js` (product block) |
| **Free-shipping progress bar** | Progress toward a free-shipping threshold | `prism-free-shipping-bar` + `prism-free-shipping-bar.js` (cart drawer) |
| **Recently viewed** | Auto-tracked recently viewed products | `prism-recently-viewed` + `prism-recently-viewed.js` |
| **Newsletter popup** | Timed/exit-intent signup with frequency cap | `prism-newsletter-popup` + `prism-newsletter-popup.js` |
| **Social proof** | Merchant-configured sales/viewer notifications | `prism-social-proof` (keep honest — merchant data only) |
| **Promo banner** | Full-width promo with CTA + optional countdown | `prism-promo-banner` |

## Product / discovery features

| Feature | What it does | Where it lives |
|---------|-------------|----------------|
| **Size chart** | Popup size chart per product/collection | `prism-size-chart` snippet (product block) |
| **Back-in-stock notify** | Email signup for out-of-stock variants | `prism-back-in-stock` snippet (product block) |
| **Mega menu** | Multi-column dropdown with images | header mega-menu (configure in header settings) |
| **Collection tools** | Grid/list toggle + infinite scroll | `prism-collection-tools` + `prism-collection-tools.js` |
| **Breadcrumbs** | Auto-generated breadcrumb nav | `prism-breadcrumbs` snippet (in layout) |
| **Complementary products** | "Complete the look" via recommendations API | `prism-complementary` section |

## Content / merchandising features

| Feature | What it does | Where it lives |
|---------|-------------|----------------|
| **Lookbook** | Editorial masonry grid | `prism-lookbook` + `prism-lookbook.js` |
| **Before/after slider** | Draggable image comparison | `prism-before-after` + `prism-before-after.js` |
| **Marquee ticker** | Scrolling text strip | `prism-marquee` |
| **Promo bento grid** | Asymmetric collection grid | `prism-promo-bento` |
| **Timeline** | Milestones / steps | `prism-timeline` |
| **Testimonials** | Customer quote slider | `prism-testimonials` |
| **Logo list** | Partner/press logos, infinite scroll | `prism-logo-list` |
| **Team / about** | Team member grid | `prism-team` |
| **Map** | Store locator | `prism-map` |

## Advanced features (build/extend if requested — these are more involved)

These were identified as high-demand but not all are pre-built. If requested, check whether a PRISM section already exists; if not, build it on the branch and note the effort to the user.

| Feature | Notes |
|---------|-------|
| **Wishlist** | High demand. localStorage-based, needs a wishlist page + add/remove UI. Build if requested. |
| **Product comparison** | Side-by-side table up to ~4 products. Build if requested. |
| **Quiz / product finder** | Multi-step form with product recommendation. Basic version buildable; advanced needs more logic. |
| **Shoppable hotspots** | Product hotspots over lookbook images. Extends `prism-lookbook`. |
| **Dark mode toggle** | Customer-facing light/dark switch. Build if requested. |
| **RTL support** | Right-to-left for Arabic/Hebrew. High-value differentiator. Requires CSS logical properties pass. |
| **Estimated delivery date** | Shows expected delivery on the product page. Build if requested. |

## Rule
Default state for every feature is OFF. Only the ones the user names get enabled. When in doubt, ask rather than assume.
