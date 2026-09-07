/* Starter content. Replace all of it.
   Read the skill first. The short version:
     · the KIT above is this brand's silhouette — check it fits the brand
       BEFORE writing copy. → references/grammar.md
     · three colours only — set them in brand.css, never in style.css
     · one accent word per slide
     · run probe.mjs on every photo BEFORE you write coordinates here
     · never put copy on a face; the CTA slide has no photo
     · write vibe.json before generating any image

   Writing direction is detected from the copy. Force it per post with
   `latin: true, rtl: false`. → references/scripts-rtl.md                */

const BRAND = {
  handle: "@YOURHANDLE",
  site: "yoursite.com",
  sign: "",                 // optional signature glyph, bottom-right
  railLeft: "2026",
  railRight: "TOPIC",       // the rail is always LTR — keep it Latin
};

window.POSTS = [
  {
    ...BRAND,
    id: "01",
    slug: "first-post",
    title: "First post",

    slides: [
      {
        type: "promise",        // type-led cover, no photo needed
        plain: true,
        at: { t: 262, l: 78, r: 78 },
        /* 170 is the largest Cover-register size that survives the NARROWEST
           shell (passe, which eats 2×--matte off the column). Once you have
           picked your shell, push it back up — 121px is the floor for anything
           that opens a deck. → references/scale.md */
        hsize: 170,
        lines: [
          { text: "Your hook", accent: true },
          { text: "goes here." },
        ],
      },
      {
        type: "teach",          // designed background — no coverage problems
        step: "1",
        kicker: "the mirror",
        at: { t: 240, l: 78, r: 78 },
        hsize: 110,
        lines: [
          { text: "One idea" },
          { text: "per slide.", accent: true, in: 1 },
        ],
        ruleT: 646,
        bodyAt: { t: 712, l: 78, w: 830 },
        body:
          "Two sentences maximum. A third means a second idea, which means a second slide.",
      },
      {
        type: "grid",           // the slide that earns the save
        step: "2",
        kicker: "the payload",
        at: { t: 140, l: 78, r: 78 },
        hsize: 104,
        lines: [
          { text: "Four points," },
          { text: "one glance.", accent: true, in: 1 },
        ],
        gridAt: { t: 420, l: 72, r: 72 },
        hooks: [
          { name: "Label", text: "One sentence someone can act on today." },
          { name: "Label", text: "Concrete beats abstract, every time." },
          { name: "Label", text: "Name the thing. Do not describe it." },
          { name: "Label", text: "If you can cut it, it was filler." },
        ],
      },
      {
        type: "cta",
        bare: true,             // no photo behind the ask. See law 3.
        pre: "Want the full thing?",
        lead: "comment the word",
        key: "KEYWORD",
        post: "and I'll send it over. Free, no strings.",
      },
    ],
  },
];
