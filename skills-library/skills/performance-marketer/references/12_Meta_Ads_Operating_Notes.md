# References — Meta Ads Operating Notes

## Campaign Objective

- Sales: شراء/تحويل.
- Leads: بيانات.
- Engagement/Messages: رسائل وتفاعل.

## Structure

```text
Campaign → Ad Set → Ad
```

## Naming

لا تبدأ بدون Naming واضح.

```text
Campaign: PH1_EGY_20-45_Sales_Product_Date
AdSet: Broad_EGY_20-45_AllPlacements
Ad: UGC01_PainHook_CopyA_Video01
```

## ABO/CBO

- ABO للاختبار.
- CBO للتوزيع والسكيل بعد وجود إشارات.

## Targeting

- Broad.
- Single Interest.
- Stack.
- Narrow.
- Custom.
- Lookalike.
- Retargeting.

## Tracking

- Pixel.
- Events.
- Domain.
- UTM.
- GA4.

## Budget Timing

يفضل جدولة الحملات من بداية يوم جديد بدل تشغيل منتصف اليوم حتى لا يضغط الميزانية في ساعات قليلة.

## Breakdown

حلل:

- Creative.
- Text.
- Headline.
- Placement.
- Age.
- Gender.
- Device.

## Do not worship the dashboard

لا تجعل Meta يقرر الاستراتيجية بدلًا منك. أعطه عرضًا ورسالة وكرياتيف قويًا وهو يوزع.

---

## Meta Ads Analysis — تحليل صح مش مقاييس سطحية
ناس كتير بتركّز على CTR/CPM/CPC بس. التحليل الصح بيخليك تكبّر بذكاء بدون هدر.

**أهم 4 مقاييس (الحملة ناجحة ولا لأ؟)**: Amount Spent، Purchases، **CPP** (لو أعلى من هامش الربح = مش مربح)، **ROAS**. ملحوظة: **في مصر ومعظم الخليج، ROAS 2 غالباً خسران — استهدف 4+** (المراجع الأجنبية بتقول 2). لو الإعلان صرف كتير أول ساعات والنتايج لسه مش ظاهرة، الميديا باير اللي فاهم behavior الأكونت هو اللي يحكم إذا دي علامة خطر.

**مقاييس الجمهور/الوصول**: Impressions، Reach (فريد)، **Frequency** (لو أعلى من 5 في آخر أسبوع = بتضرب على نفس الناس؛ الـ high ticket ممكن يزيد عن 2 بدون مشكلة).

**مقاييس التفاعل**: **Unique Outbound CTR** (الأنقى للخروج الفعلي للموقع)، CPC (لو CTR قليل وCPC عالي = الإعلان مش بيشد).

**مقاييس الفيديو**: **Hook Rate** (أول 3 ثواني)، **Hold Rate** (أول 15 ثانية)، Average Play Time. لو Hook عالي وHold قليل = بيشد بس الناس بتزهق بسرعة → عدّل البداية/قصّر.

**التفاعل الاجتماعي**: Post Shares (ميتا بتعتبر الـ share من أقوى إشارات النجاح).

**الأدوات**: Ads Manager كفاية لو الميزانية أقل من 10,000$/شهر؛ فيه GA/Looker للـ reporting، وأدوات زي Motion/Triple Whale/Northbeam.

**اتخاذ القرار**: اسأل دايماً "إيه اللي شغّال؟ وليه شغّال؟". فرز الحملات من الأعلى إنفاقاً، دوّر على أعلى مشتريات بأقل تكلفة، وأي ROAS فوق target يستاهل زيادة تدريجية. متقعش في فخ "ليه الإعلان ده مش شغّال؟" — دوّر على **الأنماط المتكررة** في الإعلانات الناجحة وضاعفها.

**بعد التحليل**: لو ناجح → الكوبي رايتر يجرّب نفس الفورمات بـ msg جديد، والميديا باير يعمل scaling (زيادة تدريجية 20% كل يومين أو Horizontal Scaling). لو فاشل → وقفه (مش ناقصة خساير)، وبلّغ الكوبي رايتر يعمل audit للـ msg. الخلاصة السريعة: CTR ضعيف→الهوك؛ CPC عالي→الجمهور/الكوبي؛ CR ضعيف→العرض/الوضوح/urgency؛ CPM عالي→لغة الجمهور/كريتيف جديد؛ ROAS ضعيف→القيمة/Social Proof. (Account structure و scaling المتقدم في `22_Meta_Account_Structure_2026.md`.)
