# References — Meta Account Structure & Scaling (2026 Updates)

⚠️ الملف ده فيه تفاصيل بتتغير مع أبديتات ميتا. اتأكد من أي رقم/إعداد قبل ما تبني عليه قرار كبير، وراجع مصادر ميتا الرسمية.

## 1. تغيير تعريف Attribution (Q1 — 3 مارس)
ميتا غيّرت تعريف **click-through attribution**. قبل كده كانت بتحسب أي تفاعل (Like/Save/Share/Comment/Profile tap/تكبير صورة) كأنه Click. دلوقتي:
- **click-through** = link click فعلي بس (دوس على CTA/لينك وخرج للموقع).
- باقي التفاعلات بقت **engage-through** (بدل engaged-view القديمة) وليها **1-day conversion window بس**.

**النتيجة**: لو شفتِ click-through ROAS نزل فجأة، مش لازم الأداء وقع — طريقة الحساب هي اللي اتغيرت. `click-through + engage-through` مجمّعين بيقربوا من الرقم القديم. بس جزء من مبيعات أيام 2-7 بعد التفاعل ممكن يختفي من الـ report لأن نافذة engage-through يوم واحد بس.

**إزاي تعرف الأكونت اتأثر؟** attribution settings → لو لقيتِ `7-day click, 1-day engage-through, 1-day view-through` وكلمة engage-through بدل engaged-view → أنت على النظام الجديد.

**القرار الأهم**: **متقارنيش أرقام بعد التحديث بأرقام قبله**. اعملي baseline جديد من تاريخ ظهور engage-through. القرارات الغلط هنا (قفل ads/تقليل budget/تغيير creative) ممكن تبوّظ أكونت كامل.

## 2. Entity IDs — ميتا ضد الإعلانات المتشابهة
ميتا بقت تعرف إن إعلانين شبه بعض قبل ما تصرفي دولار. لو عملتِ 10 إعلانات بنفس التصميم/الباكجراوند/المنتج وغيّرتِ headline أو لون بس → في 2026 ممكن تعتبرهم إعلان واحد ومايصرفوش. **مفهوم Creative Testing اتغيّر**: ميتا عايزة **creative مختلف بصرياً وهيكلياً** مش variations سطحية (Talking Head / UGC unboxing / Carousel social proof / split screen / founder story / product demo / before-after / meme / high production static / native Reel). **تنوّع الفورمات بقى أهم من تنوّع الزوايا أو حتى الشخصيات**.

## 3. Flex Ads → Multimedia Unit
Flex Ads رايحة للإلغاء/الاستبدال بـ multimedia ad unit. الفلسفة تفضل: تجيبي أفضل 3-5 winners مثبتين من CBO وتحطيهم في الوحدة المرنة عشان ميتا توسّعهم dynamically. **متديش ميتا إعلانات مش مثبتة في مرحلة scale متقدمة** — دي مرحلة winner scaling مش testing. لو عندك Flex Ads شغّالة سيبيها، بس متبنيش عليها جديد لحد ما الـ multimedia unit يوضح.

## 4. اختيار Attribution حسب حجم الأكونت
- **أكونت كبير** (~3000$/يوم أو أكتر، brand established): جرّبي **incremental attribution** (بتقيس الكونفيرجن اللي الإعلان أضافها فعلاً مش اللي كانت هتحصل كده كده). الطريقة: خدي top 5 ads، دوبليكيت في campaign على incremental، وشغّلي نفس الـ 5 على الـ attribution الحالي في campaign تانية، قارني أسبوعين، ولو ثابت ارفعي budget **بحد أقصى 20%/يوم**.
- **أكونت أصغر**: خليكي على **7-day click** (+ 1-day engage-through لو عايزة أرقام أقرب للقديم). عدّلي ROAS targets (مثلاً target 3.5 يبقى واقعياً 3.1-3.2 — ده measurement frame مش أداء وحش).
- استخدمي **Compare Attribution Settings** و **Breakdown by Attribution Setting** لتشوفي مصدر الكونفيرجن (click/engage/view).

## 5. Event Setup & Conversions API
اعتماد browser pixel لوحده ضعف (privacy/ad blockers/iOS). فعّلي **Conversions API** (server-side data = إشارات أوضح للـ purchases). لو فيه tracking issues مستمرة، شوفي first-party pixel. الأهم: CAPI متفعّلة وشغّالة صح — ميتا بتشتغل على signals، وكل ما الـ event data أوضح، الـ optimization أحسن.

## 6. Customer Exclusions في Prospecting = non-negotiable
Prospecting المفروض يستهدف ناس جدد، لكن ميتا بتميل تعرض للي اشتروا قبل (أسهل conversion) → ROAS يبان حلو بس ده recycling مش growth. اعملي **3 طبقات exclusions**:
1. **CSV uploads**: customer list من Shopify/Klaviyo → custom audience → استبعديها من كل prospecting. حدّثيها شهرياً على الأقل (أسبوعياً لو spend عالي).
2. **Email-based exclusions** (purchasers/repeat/subscribers) sync مع ميتا.
3. **Pixel-based purchaser audiences** (كل اللي عملوا Purchase) بـ window 180 يوم — safety net.
Overlap بينهم مفيش مشكلة، التكرار حماية.
- **Partnership campaigns**: استبعدي purchasers برضه (بس format نفسه بيقلل returning-customer seepage). **Reactivation campaigns**: مفيش exclusions (الهدف past buyers).

## 7. Brand Type — بيحدد الـ Testing Framework
- **Aesthetic Brands** (fashion/jewelry/home decor): بتبيع emotion & identity. نظّمي testing **حسب product category** (ABO لكل line: فساتين/شنط/إكسسوارات/مجوهرات...). كل category لها visual language ودوافع شراء مختلفة.
- **Utility Brands** (supplements/gear/tech/problem-solving): بتبيع حل مشكلة. نظّمي testing **حسب persona أو benefit angle**.
السؤال الحاسم: العميل بيشتري عشان يحس/يبان بشكل معين؟ ولا عشان يحل مشكلة؟ الإجابة بتحدد الـ structure.

## 8. ليه الـ Structure ده شغّال — أنظمة ميتا
- **GEM (GPU Embedding Model)**: بيعالج الكريتيف real-time (visuals + text + ألوان + وشوش + حركة + فورمات + إحساس) ويطابقه مع users. إعلان واحد لكل الناس = بتضيّعي قدرة GEM على الـ matching الذكي.
- **Andromeda**: retrieval system بيدوّر وسط مليارات users. بيشتغل أحسن مع data و creative variation أكتر (ABO = المعمل بيدّي signals، CBO = المصنع بيركّز budget ورا اللي بيـ convert).
- **Sequential Learning**: ميتا بتتعلم على مستوى الأكونت كله. تشغيل نفس الإعلان (بنفس Post ID) في testing و scaling مش مشكلة — الـ overlap ممكن يكون data points أكتر مش هدر، بشرط structure نضيف.

## 9. Campaign Architecture
قسّمي الأكونت لـ campaigns بوظائف مختلفة (مش campaign واحدة، ومش 30 شبه بعض):

- **Testing (ABO)**: محرك الكريتيف. budget على مستوى ad set عشان كل test ياخد spend كفاية. bidding: lowest cost، event: Purchase، attribution: 7-day click (أو incremental)، targeting: broad (age/gender/country بس)، placements: Advantage+، formats: 1:1 و 4:5 و 9:16، exclusions على كل prospecting، Advantage+ creative enhancements: minimal (عشان تعرفي نجح بفكرتك مش بتعديل ميتا). لازم product catalogs & site links مظبوطين.
  - **Creative Mix داخل Testing**: 50% video / 30% static / 20% carousel. Production style: **70% native / 30% produced** (native = يحس طبيعي، بيرفع الـ hold rate).
- **Scaling (CBO)**: لما creative يطلع top 10-20% أو one SD فوق المتوسط، انقليه بـ **Post ID** (مش upload جديد — عشان تحافظي على social proof والـ learnings). ROAS goal (لو الأسعار مختلفة) أو CPA goal (لو volume عند تكلفة ثابتة). Bid caps مرهقة — سيبيها للأكونتات الكبيرة بس. سكيل: +20% كل 2-3 أيام؛ لو ROAS نزل تحت target استني 3-5 أيام؛ لو نزل 30%+ لمدة 5 أيام متواصلة وقفي.
- **Partnership (ABO)**: كل creator ad set لوحده (عشان تتحكمي في budget كل واحد — Partnership فيها fixed costs). بعد ما يثبتوا → CBO. **متخليش creators جداد يدخلوا CBO مع بعض** (التست لوحده والاسكيل مع بعضه). جرّبي 3-5 content pieces لكل creator قبل الحكم.
- **Catalog**: ديناميك product ads من الكاتالوج (مهم للإيكومرس — images/titles/availability/pricing مظبوطين).
- **Bottom of Funnel**: بس لو AOV عالي جداً/purchase cycle طويل. targeting: 180-day ATC/LPV/engagers، budget صغير (cleanup مش scale).
- **Reactivation**: lapsed customers، مفيش exclusions، creative مختلف ("وحشتونا/restock/bundle خاص").
- **Reach/ATC**: بناء top-of-funnel قبل events كبيرة (رمضان/بلاك فرايداي/عيد/launch). ATC للأصغر، Reach للي بيصرف 100K$+ شهرياً.

**Consolidation (Q2)**: ادمجي الـ campaigns المتشابهة. الأكونتات اللي بتكسب حاطة spend أكتر ورا bets أقل، مش موزّعة على 12 campaign (ده بيضعّف الـ signal والـ learning).

## 10. Ad Naming Convention
`Product | Persona | Angle | Concept | Format | Production`
مثال: `BabyWalker_NewMom_SafeFirst_FirstStepsAtHome_Video_Native`
- **Product**: الفئة (Gold Ring / Hair Serum).
- **Persona**: نفسية/سلوكية مش demographic (NewMom / SensitiveSkinGirl / GiftBuyer).
- **Angle**: الحجة البيعية (SavesTime / DoctorRecommended / SafeForKids).
- **Concept**: اللي بيحصل بصرياً بدون صوت (CloseUpHand / MorningRoutine / BeforeAfterSplit).
- **Format**: البنية (TalkingHead / Carousel / SplitScreen / UsVsThem / Demo).
- **Production**: Native / LowProd / HighProd.
كده الـ testing بيتحوّل من عشوائية لـ machine للتعلّم (تعرفي أي persona/angle/format/production بيكسب).

## 11. Cascade Targeting (حجم التغيير)
- تغيير كبير محتاج → اختبري **Market Segment** جديد (brides بدل بنات عموماً).
- تحسين متوسط → **Persona** جديدة داخل نفس segment.
- optimization بسيط → **Angle** جديد داخل نفس persona.
(ناس كتير بتغيّر hooks/copy وهي محتاجة تغيّر segment كامل.)

## 12. Creative Volume Math
كل creative محتاج ~1000 impressions/يوم عشان يدّي signal معناه.
`Max Creatives = (Daily Budget / CPM) × 1000 ÷ 1000`
مثال: budget 2000$ و CPM 30$ → ~66,667 impressions → ~66 creative. budget 500$ و CPM 40$ → ~12 creative max. متغرقيش الخوارزمية بـ 80 creative وحسابك بيصرف 300$/يوم — batches أقل = signal أوضح = قرارات أسرع.

## 13. توزيع الـ Budget (لأكونتات 50K$+/شهر)
Testing ABO: 30-40% | Scaling CBO: 25-35% | Partnership: 20-40% | Catalog: 5-10% | BOF: 3-5% | Reactivation: 3-5% | Reach/ATC: 5-10%. أكبر buckets لازم تكون Testing و Partnerships (دول بيخلقوا growth و learning).

## 14. CPMR — قياس الوصول الحقيقي
`CPMR = CPM × Frequency` = تكلفة الوصول لـ 1000 حساب فريد. CPM لوحده ممكن يبان كويس وإنت بتدفعي عشان نفس الناس تشوف الإعلان 5 مرات. لو CPMR بيزيد أسبوعياً و frequency ثابتة → السوق أغلى/منافسة أعلى. لو frequency بتزيد و CPMR ثابت → audience saturation → refresh creative / توسيع targeting / partnerships / formats جديدة.

## 15. Creative Fatigue (مؤشرات)
CTR نزل عن أول 7 أيام بـ 20%+ | Frequency/creative فوق 4 | CPA بيطلع | ROAS بينزل | Spend شغّال بس الكفاءة بتتآكل. وازني بين proven و experimental creative على مستوى campaign. (تفاصيل الـ Creative Engine في `07_Creative_Angles.md`.)

## 16. تحليل الأكونت بالـ AI
استخدمي Manus/Claude/غيره لتسريع التشخيص (مش للـ setup). prompts مفيدة: "طلّع net new reach report آخر 30 يوم" / "قسّم reach vs impressions by campaign" / "flag أي prospecting فوق frequency 3 وأي retargeting فوق 8" / "creative fatigue analysis: creatives اللي CTR نزلت 20%+ عن أول 7 أيام" / "full account health check: CPM trends، saturation، funnel efficiency، top 3 actions للأسبوع".
