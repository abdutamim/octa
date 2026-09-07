# Motion — Animation & Micro-interactions

## Laws
- Every user action gets a response: hover, press, loading, success confirmation. A copy button needs a "Copied" chip sliding up, not just a hover state.
- Motion must add clarity or direct the eye to the message/product — never motion for its own sake. Animation draws attention BECAUSE it moves; it should never demonstrate complexity.
- A good layout looks strong before any animation — never rely on motion to rescue structure.
- Subtle > flashy. Simple + well-executed always beats complex. If effects slow load or navigation, cut them.
- Almost never linear easing — real things accelerate and decelerate. The curve sets the tone: snappy/performant, springy/fun, slow/smooth.
- Build an animation visual identity: 1–2 motion motifs repeated across the site, not one-off tricks.
- The captivation formula: structure + rhythm + ONE well-built surprise per page (expanding modal, unfolding section, hidden hover). Break the scroll rhythm deliberately once — that's what gets remembered.
- Scroll-jacking: very sparingly, if ever. A single well-built hover demo can carry a landing page.
- Any mouse-dependent effect ships with a tablet/mobile fallback.

## Numbers that work
- Signature premium easing: `expo.inOut` (≈ cubic-bezier(0.87, 0, 0.13, 1)), duration ~1.3s for big moves.
- Stagger: 0.2s between items, 0.6s duration each.
- Micro-spring (avatar name-tags, tooltips): 500ms, stiffness ~550–636, damping 24–40.
- Delayed tooltips: 1000ms delay on hover-in (only intentional hovers), instant out.
- Small hovers/presses: 150–300ms. Click = slight scale-down "pressing" state.

## The catalogue (5 types: entrance, hover/click, scroll, looped, mouse-follow)
### Entrance / load
- Preloader: keep SHORT; as the panel slides up (−100% Y, 1.3s expo.inOut), the content underneath moves simultaneously (parallax hand-off) — static content under a moving preloader looks broken. Then navbar fades 0.3s.
- Slide-up reveal: pre-offset element down a few px + opacity 0 → animate to place. Reads as slide, not fade.
- Decorative elements: rotate+pop for small items; fly in from off-screen then slow bob for large; move+rotate for cards. Never robotic linear fades.
- Staggered slide-up of screenshots on load; text pre-offset +100% of its own height inside a mask, slides up as preloader leaves.

### Hover / click
- Button text swap: mask container, text slides up, duplicate slides in from below. Kills the need for hover color inventing.
- Card hover: image zoom-out + CTA pop; blur + enlarge + reveal text; arrow icon fade-in.
- Name-tag pills on avatars, slight tilt, spring in.
- Focus glow: duplicate rect behind, bright stroke on top copy, ~24px blur on the bottom copy.
- Keyboard-shortcut hints as animated key-caps with success feedback.
- Text-hover popouts: hovering keywords pops a small image — explains without more copy.

### Scroll
- Highlight-text on scroll: two near-identical gradient stops, text as mask, slide gradient across with scroll; stagger lines.
- Parallax on margin decorations = cheap 3D.
- Section hand-offs: hero elements slide off + text blurs while the next section slides over the top — the hero becomes background. Fixes hard breaks between sections.
- Stacked cards sliding up on scroll (3–5 items); logo marquee with edge fade + progressive blur.
- Word-level text animation: a word becomes a progress bar, gets check-boxed, or is replaced by a bouncing symbol — text is 80% of the site, animate IT.

### Looped
- Minimal and SLOW: icon drawing a path, slow readable vertical marquee, feature images rotating on a timer, subtle image zoom in/out. Complicated loops distract.
- Loading: skeleton shimmer where content will slot exactly; 3 bouncing dots; rotating star. AI responses stream word-by-word.

### Mouse-follow
- CTA magnetizing to cursor; container centered on cursor with tuned snap. Use sparingly + always a touch fallback.

## Mobile motion semantics
- Sheet sliding up from bottom = temporary action; screen sliding in from the side = progress in a flow. Direction situates the user.
- Popover physics: background zooms out + shifts as the sheet rises; reverses on dismiss.
- Page transition: the tapped card expands to full screen, content fades up+in, elastic snap at the end. New content follows the swipe direction. Tapped thumbnail becomes the next page's hero (continuity).
- Swiped cards need momentum/bounce; rear cards must move DURING the drag, not after.
- Swipe-back: outgoing layer moves ~35% sideways then returns in parallel (iOS feel).
- Every gesture has a button fallback (Gmail: swipe-to-delete OR tap+delete). Long-press = mobile right-click: blur the rest, zoom the pressed element, show actions.
- Onboarding is the best moment to be captivating.

## Optimistic UI
- Act instantly assuming server success (Gmail delete, Apple Mail trash) — no awkward pauses. Perceived speed is a design feature.
