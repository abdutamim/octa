# 18 — Media Buying

Mechanics of running paid social, Meta-first, distilled from a 9-hour Egyptian media-buying course (Ahmed Helal, ConvertX — agency doing 7-figure EGP monthly for local e-com). Strategy, funnel stages, and CAC math live in ref 10 — this file owns the buttons, numbers, and kill/scale rules. Currency = EGP, market = Egypt e-com unless noted.

## The job in one line

A media buyer connects a value provider (the product) to the prospect on the publisher (Meta) — you buy ad space and place the product in front of the person already scrolling there. The skill hierarchy: business understanding > marketing psychology > tools. Buyers who only stare at the dashboard get filtered out of the market.

## Account structure (Business Portfolio)

Treat the Business Portfolio (= Business Manager) as one company with 4 departments. Never run a serious brand off a personal ad account (no partners, no pixel sharing, one page).

| Department | Contains | Notes |
|---|---|---|
| Users | People, Partners | People = invite by email, full or scoped access, optional expiry date. Partner = add by Business ID, grant per-asset access only |
| Accounts | Pages, ad accounts, IG, WhatsApp | Ad account: set timezone + currency at creation — unchangeable. One page belongs to ONE portfolio |
| Data sources | Pixel/datasets, catalog, custom conversions | Catalog auto-syncs from Shopify |
| Billing | Payment methods, spend activity | See tax table below |

**Payment + tax (Egypt):** prepaid (Fawry/local card, top up first) = 14% VAT if no tax registration ID — enter TRN/UIN to avoid it. Postpaid (debit/credit billed after spend) = 24% (14% + 10% currency provision). Default to prepaid.

## Campaign structure

```
Campaign (objective, budget if CBO)
└─ Ad sets (one targeting/audience each)
   └─ Ads (one creative each, 3–5 per ad set)
```

Name everything by funnel stage + type + event: `TOF - Conversion - Purchases - ABO`. If you can't tell what a campaign is from its name, you are not organized enough to read its data.

**Objectives — the bucket theory.** Meta pre-sorts users into behavioral buckets: website purchasers, message-buyers, photo engagers, video watchers. The objective picks the bucket. Engagement objective delivers engagers, not buyers — "I ran engagement and got messages but no sales" is the #1 beginner complaint and it is working as designed. Rules:

- E-commerce with a website → **Sales (conversion)** campaigns, event = Purchase. Always. Occasionally ATC for a specific play, never as default.
- Leads objective → real estate, courses, anything closed by phone/DM.
- Awareness/Traffic → only for big brands with cash flow buying market share, or traffic-for-retargeting plays. A small brand running awareness is burning money (ref 10's rule: ads scale what works).
- Conversion campaigns fetch the whole funnel anyway (views, ATC, purchases) — you do not need to "walk the funnel" with separate objectives.

## Pixel + events

1. Events Manager → Connect data → Web → create dataset.
2. Shopify: install the Facebook & Instagram app → connect account → pick Business Portfolio → data-sharing level **Maximum** → select the pixel.
3. Verify with the **Meta Pixel Helper** Chrome extension + Test Events (browse the site, watch PageView/ViewContent/AddToCart/InitiateCheckout/Purchase fire).

The pixel exists to show you WHERE the funnel leaks. No pixel = no diagnosis = no spend.

**Attribution setting:** default **7-day click / 1-day view**. Switch to **1-day click / 1-day view** during short high-intent windows (Black Friday, Valentine's, رمضان/العيد offers) where people buy same-day.

## Targeting in the AI era

Interest stacking is dead (instructor ran ~1.5 years without interest targeting except audience tests while scaling). The algorithm targets from four signals you control — feed them deliberately:

| Signal | Do |
|---|---|
| Creative | Show ONLY the product you sell. A t-shirt ad showing a full outfit gets delivered to outfit buyers. AI scans the image contents |
| Ad copy | Write keywords that name the audience/context: neighborhood names, "لبس الجامعة", occasion words. AI reads the text |
| Product | Premium audience needs a premium product + packaging. You target class A by making the thing class A wants — often class B buying the class-A lifestyle |
| Website | Full product descriptions — AI crawls the landing page too |

Ad-set defaults: **broad** (no detailed targeting), age trimmed only after breakdown data (e.g., 18–34 if 35+ never buys), gender only if the product demands it. When you DO use detailed targeting: **stack** = OR (clothing ∪ online shoppers), **flex/define ("and must also match")** = AND (clothing ∩ engaged shoppers) — AND narrows hard, use for premium niches. Set language (English UK/US first for EN copy).

**Placements:** manual. Facebook + Instagram feeds/reels/stories only. Kill Audience Network, Messenger, Threads. Never run "Instagram only because it's cooler" — Facebook has more placements and routinely lower CPP even for 2–3k EGP products.

## Audiences: cold / warm / hot

Real account numbers — same product, three temperatures:

| Audience | CPP (EGP) | Play |
|---|---|---|
| Cold (new) | 105 | Build credibility first: value, testimonials, UGC. Never hard-sell cold |
| Hot (deep-funnel: ATC/IC droppers) | 50 | Retargeting campaign, direct-sales creative + urgency/FOMO |
| Existing customers | 30–38 | Retention beats acquisition ~3:1. WhatsApp/email + offers, not full-price re-acquisition |

Custom audiences to build day one: site visitors 90d · ViewContent · ATC · IC · purchasers · IG engagers. Uncheck "use as suggestion" when attaching, or Meta treats it as a hint, not a boundary. Lookalike from purchasers = the expansion audience. **Exclude** purchasers of the last ~10 days from prospecting so frequency money isn't burned on people who just bought.

## Budgets: ABO vs CBO

| | ABO (ad-set budget) | CBO (campaign budget / "Advantage campaign budget") |
|---|---|---|
| Control | You fix spend per ad set | Meta distributes across ad sets by performance |
| Use for | **Testing** — every variant gets its fair spend | **Scaling** — winners in one campaign, big budget, let it allocate |

CBO hybrid: set a **minimum spend limit** per ad set (e.g., 1,500 budget, 5 ad sets, min 200 each — the free 500 flows to the best performer). Daily budget when open-ended; lifetime budget when the campaign has fixed start/end (offers) — lifetime + CBO + longer window + tight budget is a known cheap-CPP pattern. Turn OFF the "+5% budget" advantage toggle.

## Ad level

- **Dark ads** (Create Ad in Ads Manager, not published on page) — default. Hides your winners from competitors who bot-spam comment sections; protects organic reach. Use Existing Post only to accumulate social proof on one post.
- **Advantage+ catalog ads** when SKU count is high: pulls images/price/stock from the catalog, auto-pauses out-of-stock items. Advantage+ catalog **carousel** was the instructor's best recent format.
- Formats: single image/video, carousel, collection (banner + catalog below), flexible (Meta shows each user the format they convert on).
- Headline = offer or product name **+ price**. Price in the ad pre-filters traffic — clicks that arrive already accept the price.
- CTA for e-com: Shop Now / Order Now / Get Offer. Nothing else.
- Promo code field: attach it so the code auto-applies from the ad.
- Advantage+ enhancements: ON → adapt-to-placement, price/offer CTA badge. OFF → generated backgrounds, highlight-carousel card, comment surfacing, visual touch-ups. Test music.

## Testing methodology

Mindset: **you are not burning money, you are buying data.** Before any test answer three questions in writing: (1) what exactly am I testing, (2) which KPI decides pass/fail, (3) what must I walk away knowing.

- Test creatives and products above all — audience and strategy tests come later. Ship product+creative together (the creative IS the product presentation).
- ABO, one variable per ad set, 3–5 genuinely different creatives (angles, not colors — ref 10).
- Judge on CPP and ROAS for conversion campaigns; CTR/outbound CTR are the early smoke signals.
- **Never edit a winning campaign.** Any change = new campaign. Editing resets learning.
- Testing never ends. There is no "testing phase then scaling phase" — you run both permanently, always holding backup campaigns (product life cycle kills every winner eventually; every hook dies).
- Winner example from the account shown: creative "C6" at CPP 34 EGP / ROAS 24x — that is what a winner looks like before it gets the scale budget.

**Creative supply chain** (what feeds tests): UGC (normal customers filming feedback — top ad type now), EGC (owner/employee on camera), IGC/PR (influencers), photoshoots, styling videos, offer statics (price before/after + «العرض لمدة 24 ساعة» urgency), value tips, storytelling on the founder's personal brand (not the brand page — if brand = storytelling only, the brand dies when the stories stop). Trending audio can roughly halve CPP by lifting CTR and dropping CPM. PR math: one mega-influencer fee = ~5 micro-influencers (25–50k followers) = 5 videos you also re-run as ads; mega-influencer PR is how premium pricing gets its public justification.

## Reading the dashboard (fashion/e-com Egypt benchmarks)

| Metric | Healthy | Off → diagnosis → action |
|---|---|---|
| CTR (link) | 1–5% (>5% elite) | <1% → creative not attractive → new creative/format/angle. Fix at AD level |
| CPC | 0.5–3 EGP | >3 → weak creative or audience too narrow → new creative, broaden |
| CPM | 30–120 EGP | >120 → auction competition on this audience → new angles or new audience pocket. Fix at AD-SET level |
| Frequency | 1–2 | >2 → same people re-hit → exclude buyers, refresh audience. OK to exceed only in retargeting |
| ROAS | fashion avg 6–10 | Below YOUR break-even ROAS → check ad → ad set → campaign → then zoom out (new competitor undercutting, wrong season, broken site) |
| Bounce rate | low | High → slow site, ad-page mismatch, missing size chart |

Escalation ladder when ROAS drops: Ad (creative) → Ad set (targeting/CPM) → Campaign → outside the dashboard (price war, seasonality, website UX, cheap-looking free theme). Think like a business, not like an ads panel.

**Funnel minimum rates** (from traffic in): 60% engaged visitors → 50% of those reach product page → 15% ATC → 50% of ATC initiate checkout → 50–80% of IC purchase. Overall CR: 1% = fine, 1–4% = strong. Below any minimum = that stage is the bottleneck (do not pass this gate until the leaking stage is named — full symptom table in ref 10).

High ATC + low purchase, checklist in order: shipping cost shock · thin product details/description · no size chart (guesswork kills orders) · no reviews · missing payment methods · checkout too long (Shopify: Releasit COD Form — name, phone, address, governorate only; set per-governorate shipping rates) · no visible return/exchange policy · photos don't show the product from all angles.

## Breakdowns → smart scaling

Breakdown every campaign by: age, gender, region, device, time (hour/day), platform, placement. Then act:

- Platform: FB 9 orders ROAS 20 vs IG 5 orders ROAS 7 → cut IG **only if** it's below break-even ROAS; above break-even, leave it running.
- Age: 18–24 CPP 57, 35+ never buys → set 18–34.
- Hours: orders cluster 4pm–11pm → pump budget there, cut 12–4pm.
- Region: high CTR + cheap CPC governorates get the spend.

**Scaling is allocation, not just more budget.** Five levers, in the instructor's preference order:

1. **AOV**: bundles (buy 2 get 1, buy 2 = free shipping), upsell/cross-sell at cart, post-purchase 5-minute countdown offer — double revenue at the same ad spend.
2. **Creative volume**: many ads, many angles (his brands run 150–200 live ads).
3. **Duplication**: duplicate winning ad sets/campaigns (horizontal).
4. **Budget** (vertical): raise on winners; expect ROAS to fall as spend rises.
5. **Push & punishment**: ad set at ROAS 60, break-even 7 → push budget in big steps and ride it down toward ~10, punishing (cutting) weak hours/placements/ad sets. Exploit potential to its floor, never below break-even.

Winner product → check which sizes/colors sold → restock proportional to demand (ABC analysis on Shopify: A = fast movers get budget + stock priority). RFM-segment customers (champions get VIP offers, dormant get a strong win-back offer).

## The numbers before spend

Costs that must be in the sheet before pricing/judging ROAS: COGS · marketing (ads + creators + agency fee) · operations (packing, confirmation, moderators) · platform fees · **returns ~20%** (healthy fashion rate in Egypt — most owners forget it) · ad tax 14%/24%. From that: break-even point and **break-even ROAS** — the one number you watch while scaling. Pricing methods: cost × 1.5–3 to hit target margin, value-based, competitor-band (price between the min and max of 2 direct + 2 indirect competitors — pull their live ads, scripts, CTAs, and prices from Meta Ad Library; long-running ads = winning ads), or **LTV-based** (best for new brands: accept thin first-order profit, profit on repeat orders at 30–38 CPP):

```
AOV        = total paid ÷ number of orders
Gross LTV  = AOV × purchase frequency × customer lifetime
Net LTV    = Gross LTV − CAC − COGS      ← the real number
```

CAC math and max-allowable-CAC gate: ref 10.

## Beginner mistakes (kill list)

- Wrong objective for the goal (engagement expecting sales).
- Awareness campaigns on a no-cash-flow brand.
- Editing live winners / judging after 6 hours / no backup campaigns.
- Instagram-only placements; Audience Network left on.
- Selling cold audiences with hot-audience copy.
- No exclusions → frequency 3+ on people who already bought.
- ROAS worship without knowing break-even ROAS; forgetting returns and ad tax.
- Scaling = raising budget only, into an unbroken-down account.
- One campaign, one product, no restock plan for the winner.

## Seasonal calendar (Egypt e-com)

| Quarter | Sell into |
|---|---|
| Q1 | New Year, winter clearance, Valentine's (Feb 14), Mother's Day (Mar 21) |
| Q2 | العيد الصغير + الكبير (peak demand — prepare offers early), summer drop, Sahel/beach season |
| Q3 | Summer clearance, back-to-school |
| Q4 | **Black Friday** (November) — fashion's biggest window; offers to 70%, bundle mechanics. Unprepared = the year's biggest loss |

Plan each quarter's offers before it starts; pump spend when demand spikes, punish spend in dead weeks.

## Use with

Ref 10 (funnel chain, CAC math, creative angles, zero-budget plan) · Ref 17 (offer construction for the ads) · Ref 16 (landing/store conversion the traffic lands on).
