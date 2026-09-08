# Octa Assistant — second Windows machine

Octa stores keys in the local SQLite settings table, not in `.env` or the
repository. Runtime data stays in `C:\Octa` unless you choose another folder.

## العربية — إعداد جهاز Bedo Mousa

1. **ثبّت الأساسيات.** نزّل مُثبّت `Octa-Assistant-Setup-0.1.0.exe` من
   `https://github.com/abdutamim/octa/releases/latest` وشغّله. ثبّت Node.js 22 وGit و`uv` وClaude Code وCodex CLI
   من المصادر الرسمية، ثم افتح Octa. ثبّت Python 3.12 وChromium من زري
   التثبيت الموجّهين داخل فحص الصحة؛ `ffmpeg` مضمّن. Photoshop اختياري.
2. **سجّل الدخول للأدوات.** في PowerShell شغّل `claude auth login --claudeai`،
   أكمل تسجيل الدخول في المتصفح، ثم تحقق بـ`claude --version`. شغّل
   `codex login` وأكمل المتصفح ثم `codex login status`؛ إذا تعذر فتح المتصفح
   استخدم `codex login --device-auth`. لا تحتاج إلى Claude API key أو
   OpenAI API key.
3. **أدخل المفاتيح في معالج Octa.** أنشئ مفتاح Gemini من
   `https://aistudio.google.com/app/apikey` والصقه في **Gemini AI Studio key**.
   اختياريًا: فعّل Vertex AI في Google Cloud، أنشئ Service Account ونزّل JSON،
   ثم اختر Vertex وأدخل Project ID ومسار JSON فقط. أنشئ مفتاح Brave الاختياري
   من `https://api.search.brave.com/app/keys`. ثبّت تطبيق ntfy، أنشئ topic
   خاصًا، وأدخل اسمه (و`https://ntfy.sh` أو خادمك)؛ عامل الـtopic ككلمة مرور.
4. **اضبط المجلدات.** اترك Octa home على `C:\Octa`. أنشئ/افتح Vault جديدًا
   في Obsidian، مثل `C:\Users\Bedo Mousa\Documents\Octa-Vault`، واختره في
   **Vault path**. لا تضع الـVault أو المفاتيح في Git.
5. **متصفح البحث.** في صفحة تسجيلات الدخول افتح Facebook أو X أو Reddit عند
   الحاجة، سجّل الدخول بنفسك، ثم اضغط **I finished login**. المتصفح دائم
   للقراءة فقط ولا ينشر أو يرسل رسائل.
6. **Photoshop والصحة.** أدخل المسار الكامل لـ`Photoshop.exe` إن كان مثبتًا؛
   وإلا اتركه فارغًا ليستخدم Octa بديل PSD. أصلح الصفوف الحمراء واضغط الفحص
   مرة أخرى حتى يصبح جدول الصحة أخضر، ثم أنهِ المعالج.
7. **أول intake.** افتح **Brain → Start intake** وأجب عن الأسئلة العشرين عن
   خدمات Bedo والتسويق العقاري والعملاء والأسلوب والأسعار. بعد الحفظ راجع
   `knowledge/company.md` و`icp.md` و`voice.md` و`pricing.md` داخل الـVault.

## English — Bedo Mousa setup

1. **Install the basics.** Download `Octa-Assistant-Setup-0.1.0.exe` from
   `https://github.com/abdutamim/octa/releases/latest` and run it. Install Node.js 22, Git, `uv`, Claude Code, and
   Codex CLI from their official sources, then open Octa. Use the health page’s
   guided buttons to install Python 3.12 and Chromium; `ffmpeg` is bundled.
   Photoshop is optional.
2. **Sign in to the CLIs.** In PowerShell run `claude auth login --claudeai`,
   finish the browser flow, and verify with `claude --version`. Run
   `codex login`, finish the browser flow, then verify with `codex login status`;
   use `codex login --device-auth` if the browser cannot open. No Claude API
   key or OpenAI API key is needed.
3. **Enter keys in Octa’s wizard.** Create a Gemini key at
   `https://aistudio.google.com/app/apikey` and paste it into **Gemini AI Studio
   key**. Optional Vertex: enable Vertex AI in Google Cloud, create a service
   account, download its JSON, choose Vertex, and enter the project ID plus the
   JSON path only. Optional Brave: create a key at
   `https://api.search.brave.com/app/keys`. Install ntfy, create a private topic,
   and enter its name plus `https://ntfy.sh` (or your server); treat the topic as
   a password.
4. **Choose folders.** Keep Octa home at `C:\Octa`. Create/open an Obsidian
   vault such as `C:\Users\Bedo Mousa\Documents\Octa-Vault` and select it as
   **Vault path**. Never put the vault or keys in Git.
5. **Research browser.** Open Facebook, X, or Reddit from the login step only
   when needed, sign in yourself, and click **I finished login**. The persistent
   profile is read-only and never posts or sends messages.
6. **Photoshop and health.** Enter the full `Photoshop.exe` path if installed;
   otherwise leave it blank and use the PSD fallback. Fix red rows and rerun the
   check until the final health table is green, then finish the wizard.
7. **First intake.** Open **Brain → Start intake** and answer the 20 questions
   about Bedo’s services, real-estate marketing, clients, voice, and pricing.
   Review `knowledge/company.md`, `icp.md`, `voice.md`, and `pricing.md` in the
   vault after saving.

If the repository is moved or forked, change the GitHub `owner/repo` value in
Settings so the in-app update check follows the new public releases.
