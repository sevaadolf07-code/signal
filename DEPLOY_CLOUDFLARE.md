# راهنمای دیپلوی روی Cloudflare Workers

این پروژه با **TanStack Start + Nitro** ساخته شده و به‌صورت پیش‌فرض برای Cloudflare Workers خروجی می‌گیره. برای دیپلوی فقط چند قدم نیازه.

---

## پیش‌نیازها

- حساب کاربری در [Cloudflare](https://dash.cloudflare.com) (پلن رایگان کافیه).
- نصب Node.js نسخهٔ ۲۰ یا بالاتر (یا Bun).
- کلید و آدرس بک‌اند (Supabase / Lovable Cloud) که تو `.env` پروژه هست.

---

## قدم ۱ — نصب Wrangler

Wrangler ابزار رسمی کلادفلر برای دیپلوی Workers هست:

```bash
npm install -g wrangler
# یا با bun:
bun add -g wrangler
```

بعد یک بار وارد حسابت شو:

```bash
wrangler login
```

یه صفحه در مرورگر باز می‌شه؛ اجازه بده و برگرد به ترمینال.

---

## قدم ۲ — نصب dependencies و build پروژه

```bash
bun install        # یا: npm install
bun run build      # یا: npm run build
```

خروجی build توی پوشهٔ `.output/` ساخته می‌شه:

```
.output/
├── server/index.mjs   ← فایل اصلی Worker
└── public/            ← فایل‌های استاتیک (JS، CSS، تصاویر)
```

فایل `wrangler.toml` توی روت پروژه از قبل این مسیرها رو مشخص کرده.

---

## قدم ۳ — تنظیم نام و دامنه

فایل `wrangler.toml` رو باز کن و اگه دلت خواست `name` رو عوض کن:

```toml
name = "signal-pulse"     # این می‌شه: signal-pulse.<account>.workers.dev
```

می‌تونی بعد از دیپلوی هم از پنل Cloudflare یه دامنهٔ اختصاصی وصل کنی.

---

## قدم ۴ — ست کردن Secrets (متغیرهای محرمانه)

این‌ها **کلید‌های سرور** هستن و نباید توی کد یا Git باشن. با Wrangler یکی یکی بذارشون:

```bash
wrangler secret put SUPABASE_URL
# مقدار: https://<project-ref>.supabase.co

wrangler secret put SUPABASE_PUBLISHABLE_KEY
# مقدار: sb_publishable_...

wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# مقدار: کلید service role

wrangler secret put TWELVEDATA_API_KEY
# مقدار: ed3ae71830054e569cc2d1ecfc145ada

wrangler secret put LOVABLE_API_KEY
# در صورت استفاده از Lovable AI

wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put VAPID_SUBJECT
# در صورت استفاده از Push Notifications
```

هر بار که دستور بزنی، مقدار رو ازت می‌پرسه و پیست می‌کنی.

برای متغیرهایی که سمت مرورگر لازمن (VITE_*)، توی `.env` پروژه بذارشون و بعد `bun run build` بگیر — این‌ها موقع build داخل باندل embed می‌شن:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_PROJECT_ID=<ref>
```

---

## قدم ۵ — دیپلوی

```bash
wrangler deploy
```

چند ثانیه بعد یه URL بهت می‌ده مثل:

```
https://signal-pulse.<your-account>.workers.dev
```

باز کن و اپ باید بالا بیاد ✅

---

## قدم ۶ — دامنهٔ اختصاصی (اختیاری)

۱. توی داشبورد Cloudflare برو **Workers & Pages → پروژه‌ت → Settings → Domains & Routes**.
۲. **Add Custom Domain** رو بزن و دامنهٔ خودت مثل `signals.example.com` رو وارد کن.
۳. اگه دامنه توی Cloudflare هست، DNS خودش تنظیم می‌شه. اگه جای دیگه‌ست، CNAME که بهت می‌ده رو اضافه کن.
۴. SSL خودکار می‌شه.

---

## قدم ۷ — دیدن لاگ‌های زنده

```bash
wrangler tail
```

هر خطای runtime تو ترمینال چاپ می‌شه.

---

## قدم ۸ — آپدیت‌های بعدی

هر بار که کد رو عوض کردی:

```bash
bun run build
wrangler deploy
```

یا اگه از CI/CD (GitHub Actions) استفاده می‌کنی، این دو خط رو توی workflow بذار.

---

## نکات مهم

- **Realtime / WebSocket Supabase**: چون سمت مرورگر اجرا می‌شه، مشکلی نداره.
- **Edge Functions Supabase**: مستقل از Worker دیپلوی می‌شن؛ Worker فقط UI و server functions پروژه رو سرو می‌کنه.
- **حجم Worker**: پلن رایگان تا ۱۰MB فشرده رو قبول می‌کنه — این پروژه خیلی زیر این حدّه.
- **CPU time**: پلن رایگان روزانه ۱۰۰هزار درخواست + ۱۰ms CPU/req. برای اکثر اپ‌های سیگنال کافیه.
- **متغیرهای Node**: `nodejs_compat` تو `wrangler.toml` فعاله، پس `Buffer`، `crypto`، `process` کار می‌کنن.
- **`sharp` / `puppeteer` / `child_process`**: کار **نمی‌کنن** روی Worker. اگه لازم شد از REST API یا Edge Function استفاده کن.

---

## اشکال‌زدایی سریع

| خطا | راه‌حل |
| --- | --- |
| `Missing SUPABASE_URL` | با `wrangler secret put SUPABASE_URL` دوباره ست کن. |
| `Script size exceeds limit` | Dependencies اضافه رو پاک کن یا پلن Paid فعال کن. |
| صفحهٔ سفید بدون خطا | `wrangler tail` بزن و لاگ SSR رو ببین. |
| `Unauthorized` روی server function | مطمئن شو `VITE_SUPABASE_PUBLISHABLE_KEY` هنگام build ست بوده. |

---

موفق باشی 🚀