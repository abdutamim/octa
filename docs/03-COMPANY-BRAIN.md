# 03 — Company brain

The shared context every job reads first. Lives in the Obsidian vault
(source of truth) under `knowledge/`, mirrored read-only to
`%USERPROFILE%\Octa\knowledge\` for jobs.

## 1. Layout

```
knowledge/
  company.md          who Tamim is, services, prices, guarantees, voice, positioning
  offers/<name>.md    one file per productized offer (from the offers skill)
  icp.md              ideal customers, anti-personas, buying triggers, objections
  voice.md            brand personality sliders, we-are / we-are-not, banned words, Arabic/English rules
  sops/<name>.md      how Bedo does recurring things (onboarding, invoicing, revisions, delivery)
  pricing.md          price list, payment terms, currencies
  clients/<slug>.md   per client: brand, contacts, offers sold, history, do/don't
  projects/<slug>.md  per project: goal, status, links, decisions
  personas/<slug>.md  research outputs (dream buyer personas) with source ledgers
  competitors/<slug>.md
  decisions.md        dated decisions Bedo has made (fed by think-project workflow)
  glossary.md         Egyptian Arabic ↔ English terms Octa should use
```

Rule: jobs never write into `knowledge/` directly. They propose edits; the
`vault-librarian` agent applies them after approval. `bedo-brand-engine`
shows what a fully written `clients/<slug>.md` looks like.

## 2. Intake interview (run once, then whenever something changes)

Octa asks these by voice, in Arabic, one block at a time, and writes the
answers into the files above. Bedo can also paste existing documents and Octa
extracts the answers. Skip what already exists in `BrandEditor` and `clients`.

**A. الشركة**
1. تميم بتعمل إيه بالظبط دلوقتي، ولمين؟ (خدمة خدمة)
2. إيه اللي بتقوله للعميل في أول 30 ثانية عشان يفهم إنت مين؟
3. مين أفضل 3 عملاء اشتغلت معاهم وليه كانوا أفضل؟ ومين أسوأ 3 وليه؟
4. إيه الحاجات اللي مش بتشتغلها أبداً؟

**B. العروض والأسعار**
5. كل خدمة: اسمها، بتشمل إيه، مدتها، سعرها، طريقة الدفع، الضمان لو فيه.
6. أعلى تذكرة بعتها، وأقل واحدة. الأكتر تكراراً.
7. إيه اللي بيتفاوض عليه العميل دايماً؟

**C. العميل المثالي**
8. صف العميل اللي لو جالك 10 زيه السنة دي تبقى مبسوط: صناعته، حجمه، مين بياخد القرار، بيدور عليك امتى.
9. إيه أكتر 5 اعتراضات بتسمعها؟ وبترد عليهم إزاي؟
10. مين العميل اللي لازم ترفضه؟

**D. الصوت**
11. لو براندك شخص، شكله إيه وبيتكلم إزاي؟ 3 صفات لازم تبان و3 لازم متبانش.
12. كلمات ممنوعة، وكلمات لازم تتقال بالإنجليزي مش بالعربي.
13. مثال بوست حبيته جداً، ومثال بوست مكسوف منه.

**E. الشغل اليومي**
14. العميل بيدخل إزاي من أول رسالة لحد ما يدفع؟ (خطوة خطوة)
15. التسليم بيتم إزاي؟ التعديلات؟ كام مرة؟
16. الفواتير: بتتطلع امتى، بأي عملة، الدفع بعد كام يوم، بتفكّر العميل إزاي؟
17. الأدوات اللي بتستخدمها وحساباتها (Notion، Meta، Obsidian، Photoshop...).

**F. الأهداف**
18. الرقم اللي عايز توصله في 90 يوم، وفي سنة.
19. أكتر حاجة بتاكل وقتك ومش بتحب تعملها.
20. لو Octa هيعمل حاجة واحدة بس صح، تبقى إيه؟

## 3. Per-client intake (short, run when a client is added)

Name, brand assets folder, contacts and roles, what they bought, current
project and deadline, their audience in one line, their voice differences from
Tamim's, hard don'ts, approval person, invoicing details, links (site, socials,
ad accounts, Notion).

## 4. How the brain is injected

`knowledge/company.md` + `voice.md` + `icp.md` always (≈3–5k tokens). The
client file when the job names a client. `offers/` and `pricing.md` for sales
and invoice jobs. `personas/` and `competitors/` for marketing jobs. Never the
whole folder.

## 5. Freshness

`consolidate-memory` style pass monthly: the planner lists contradictions
between `knowledge/` and recent `job_runs` outputs and proposes edits.
`decisions.md` gets one dated line per decision Bedo makes in a think session.
