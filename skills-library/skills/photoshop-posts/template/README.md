# القالب — نظام ستوريات آركيدوت كما شُحن

ده مش كود تجريبي — ده النظام اللي اتسلّم فعلاً لعميل سعودي (3 ستوريات 1080×1920
بنص عربي حي). انسخه لمشروع العميل الجديد وعدّل:

| ملف | اللي بيتعدّل لكل براند | اللي بيفضل زي ما هو |
|---|---|---|
| story.html | التوكنز والألوان والخط واللوجو والبادچات + التصميم نفسه | أوضاع `?notext` `?rects` `?layer` وخريطة `DEF` |
| layout.json | كل القيم | أسماء المفاتيح لو عدّلت الإديتور معاها |
| prompts.json | الكوبي والبرومبتات والتواصل | شكل الهيكل |
| psd.py | قايمة `LAYERS` | الباقي |
| livetext.py | `PS_FONT` و `HIDE_FOR` | الباقي |
| check.py | قايمة العناصر المقاسة | منطق القياس |
| serve.py / editor.html / psdwriter.py / export.py / render.sh | — | كله |
| stories.jobs.json | مثال حي لملف jobs بتاع retext.py | — |

التشغيل: `py serve.py` (بورت 8912) → صمّم → `bash render.sh` →
`py check.py` → `py psd.py` → `py livetext.py` → تسليم.
النسخ بعد تعديل الماستر: `py <photoshop-driver>/scripts/retext.py jobs.json --run --verify`
