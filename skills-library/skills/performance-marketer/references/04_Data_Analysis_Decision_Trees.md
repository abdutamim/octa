# References — Data Analysis and Funnel Diagnosis

## القاعدة
الأرقام لا تُقرأ منفردة. اقرأها كسلسلة رحلة.

```text
Reach → Impressions → Frequency → CTR → Outbound Clicks → LPV → View Content → Add to Cart → Initiate Checkout → Purchase → Confirmation → Delivery → Repeat Purchase
```

## On-Channel Metrics

### Reach
عدد الأشخاص الفريدين. لو قليل، فرص البيع محدودة.

### Impressions
عدد مرات الظهور. مع Reach قليل قد تعني تكرار زائد.

### Frequency
عدد مرات رؤية الشخص للإعلان. ارتفاعه مع CPA عالي يعني Fatigue محتمل.

### CTR
```text
CTR = Clicks / Impressions × 100
```
يقيس الجاذبية، وليس البيع وحده.

### CPM
```text
CPM = Spend / Impressions × 1000
```
يتأثر بالمزاد والجمهور والموسم والجودة.

## Off-Channel Metrics

### Outbound CTR
```text
Outbound CTR = Outbound Clicks / Impressions × 100
```
يقيس خروج الناس للموقع.

### Landing Page View Rate
```text
LPV Rate = LPV / Outbound Clicks × 100
```
لو منخفض:

- سرعة الصفحة.
- الرابط.
- التراكينج.
- عدم تحميل.

### View Content Gap
لو LPV عالي وView Content قليل:

- الصفحة لا تقود للمنتج.
- المنتج غير واضح.
- مشكلة التراكينج.

### Add to Cart Gap
لو VC عالي وATC قليل:

- السعر.
- عرض ضعيف.
- معلومات ناقصة.
- صور ضعيفة.
- شحن.
- ثقة.
- ضمان.

### Initiate Checkout Gap
لو ATC عالي وIC قليل:

- تكاليف مفاجئة.
- Checkout طويل.
- وسائل دفع محدودة.
- العميل يقارن.

### Purchase Gap
لو IC عالي وPurchase قليل:

- مشكلة دفع.
- خوف.
- شحن.
- ضمان.
- UX.
- Trust.

## Decision Tree

```text
CTR low → creative/hook/message/audience mismatch.
CTR high + LPV low → load speed/link/tracking.
LPV high + VC low → landing/product clarity.
VC high + ATC low → offer/price/trust/product info.
ATC high + IC low → checkout motivation/friction/costs.
IC high + Purchase low → payment/trust/final cost/delivery.
Purchase high + Delivery low → operations/shipping/confirmation.
Sales high + profit low → unit economics/AOV/CAC/returns.
```

## Profit Metrics

```text
Gross Revenue
- Product Cost
- Shipping Cost
- Payment Fees
- Returns/Refunds
- Ad Spend
- Agency/Team Cost
= Contribution Profit
```

ROAS alone is not profit.

---

## Benchmarks تقريبية للـ CTR (بحذر شديد)
مفيش نسبة مثالية — بتختلف حسب الـ Case/Industry/Objective وB2B vs B2C. أرقام "مقبولة" تسمعها (متاخدهاش معيار):
- Facebook Ads CTR ~ 2-3% | Google Ads CTR ~ 3-5% | Email CTR ~ 3.5% (وفي صناعات بتوصل 10%).
أشهر 3 عوامل تأثّر على الـ CTR مباشرة: **الـ Creative Asset، الـ Copy (Headline/CTA)، الـ Targeting**.

## OMTM & North Star & Pirate Funnel (Growth Metrics)
- **OMTM (One Metric That Matters)**: المقياس الوحيد اللي تركّز عليه في الوقت الحالي (مش معناه تهمل الباقي). بيركّز الفريق، بيخلق تأثير طويل المدى، ونتايج أسرع. **بيتغيّر حسب المرحلة** (كل 2-4 شهور)، وعادة نسبة/معدل مش رقم تراكمي، وبيغطّي مرحلة واحدة في الفانل.
- **North Star Metric**: المقياس الأساسي لنمو البيزنس كله، مش بيتغير إلا لو غيّرت نموذج العمل. أمثلة: Airbnb (الليالي المحجوزة)، Square (GPV)، Salesforce (السجلات لكل حساب).
- **Pirate Funnel (AARRR)**: Awareness → Acquisition → Activation → Revenue → Retention → Referral. حدّد الـ bottleneck فيه واختار الـ OMTM بناءً عليه.
- **إزاي تختار OMTM**: (1) حدّد مرحلة الشركة، (2) اكتشف الـ bottleneck في Pirate Funnel، (3) حط هدف قابل للقياس (مثلاً تقليل churn 20% خلال 3 شهور)، (4) تابع باستمرار وغيّره عند الحاجة.
