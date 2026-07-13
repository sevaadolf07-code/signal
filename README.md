# سیگنال پالس — راهنمای کامل

اپلیکیشن PWA سیگنال کریپتو و فارکس با پنل ادمین، ساخته شده روی TanStack Start + React 19 + Lovable Cloud (Supabase). قابل نصب روی iOS/Android به عنوان اپ نیتیو.

## 📋 قابلیت‌ها

- ✅ **سیگنال‌ها**: کارت‌های زیبا با TP1/TP2/TP3/SL، وضعیت زنده، نمودار مینی
- ✅ **قیمت لحظه‌ای کریپتو**: اتصال مستقیم به Binance WebSocket (رایگان، بدون کلید)
- ✅ **توییت‌های ادمین**: فید تحلیلی مثل توییتر
- ✅ **عملکرد**: نرخ موفقیت با تب جدا برای کریپتو و فارکس
- ✅ **پنل ادمین**: `/admin` — اضافه/حذف سیگنال و توییت، تغییر وضعیت (TP/SL)
- ✅ **PWA**: قابل نصب روی گوشی (Add to Home Screen)
- ✅ **RTL کامل** با فونت Vazirmatn و اعداد فارسی
- ⏳ نوتیف پوش (در حال توسعه)
- ⏳ فارکس با TwelveData (کلید API لازم)

## 🔑 رمز پنل ادمین

رمز پیش‌فرض: `admin1234`

**⚠️ حتماً تغییرش بدید:**
1. در Lovable برید به بخش تنظیمات → Secrets
2. مقدار `ADMIN_PASSWORD` رو به یه رمز قوی تغییر بدید
3. پنل رو در `/admin` باز کنید و با رمز جدید وارد بشید

## 🚀 دیپلوی روی Cloudflare Pages

### مرحله ۱: اتصال به GitHub

1. توی Lovable روی دکمه **GitHub** (بالای صفحه، در منوی +) کلیک کنید
2. **Connect project** رو بزنید
3. اکانت GitHub رو Authorize کنید (اپ Lovable دسترسی می‌گیره)
4. **Create Repository** بزنید — یه ریپو خصوصی ساخته می‌شه با کد پروژه

حالا هر تغییری که در Lovable بدید، خودکار به GitHub push می‌شه.

### مرحله ۲: اتصال Cloudflare Pages به GitHub

1. برید به [dash.cloudflare.com](https://dash.cloudflare.com) و وارد اکانت شوید
2. از منوی سمت چپ: **Workers & Pages** → **Create** → تب **Pages** → **Connect to Git**
3. اکانت GitHub رو انتخاب کنید و اجازه دسترسی به ریپو رو بدید
4. ریپوی پروژه رو انتخاب کنید و **Begin setup** بزنید

### مرحله ۳: تنظیمات Build

در صفحه تنظیمات Cloudflare Pages این مقادیر رو بذارید:

| فیلد | مقدار |
|---|---|
| Framework preset | **None** |
| Build command | `bun install && bun run build` |
| Build output directory | `.output/public` |
| Root directory | `/` |
| Node.js version | `20` |

### مرحله ۴: متغیرهای محیطی (Environment Variables)

در همون صفحه Cloudflare Pages، بخش **Environment variables** رو باز کنید و این‌ها رو اضافه کنید (هم برای Production هم Preview):

| نام | مقدار |
|---|---|
| `VITE_SUPABASE_URL` | از فایل `.env` پروژه کپی کنید |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | از فایل `.env` پروژه کپی کنید |
| `VITE_SUPABASE_PROJECT_ID` | از فایل `.env` پروژه کپی کنید |
| `SUPABASE_URL` | همون مقدار `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | همون مقدار `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ در Lovable در دسترس نیست — رد کنید |
| `ADMIN_PASSWORD` | رمز ادمین دلخواه (مثلاً `MyStr0ngPass!`) |

**نکته:** برای دیدن مقادیر Supabase در Lovable برید به فایل `.env` (روی نوار سمت چپ کد اپ).

### مرحله ۵: دیپلوی

1. **Save and Deploy** بزنید
2. حدود ۲-۳ دقیقه صبر کنید تا Build کامل بشه
3. یه لینک `https://your-project.pages.dev` می‌گیرید

### مرحله ۶: دامنه اختصاصی (اختیاری)

1. در Cloudflare Pages → پروژه → **Custom domains** → **Set up a custom domain**
2. دامنه‌تون رو وارد کنید (مثلاً `signals.mydomain.com`)
3. Cloudflare خودکار DNS رو تنظیم می‌کنه اگه دامنه در همون اکانت باشه

### مرحله ۷: نصب روی گوشی

**iOS (Safari):**
1. لینک اپ رو در Safari باز کنید
2. دکمه Share (مستطیل با فلش) → **Add to Home Screen**
3. آیکون روی هوم‌اسکرین می‌شینه، مثل اپ نیتیو باز می‌شه

**Android (Chrome):**
1. لینک رو باز کنید
2. یه بنر پایین صفحه میاد **Install app** — بزنید
3. یا از منوی سه‌نقطه → **Install app**

## 🗂 ساختار پروژه

```
src/
  routes/
    __root.tsx          # Layout اصلی، فونت، meta
    index.tsx           # صفحه سیگنال‌ها
    tweets.tsx          # فید توییت‌ها
    performance.tsx     # داشبورد عملکرد
    admin.tsx           # پنل ادمین
  components/
    AppShell.tsx        # هدر + منوی پایین
    BottomNav.tsx       # ناوبری شناور
    Sparkline.tsx       # نمودار مینی
  hooks/
    useBinancePrices.ts # اتصال WebSocket به Binance
  lib/
    admin.functions.ts  # server functions ادمین
    queries.ts          # کوئری‌های TanStack Query
    format.ts           # اعداد فارسی، فرمت قیمت
public/
  manifest.webmanifest  # تنظیمات PWA
  icon-512.png          # آیکون اپ
```

## 🔌 منابع داده

- **کریپتو (رایگان، بدون کلید):** `wss://stream.binance.com:9443/stream?streams=btcusdt@ticker`
- **فارکس (نیاز به کلید):** TwelveData — ثبت‌نام در [twelvedata.com](https://twelvedata.com)، بعد کلید رو در Lovable Secrets با نام `TWELVEDATA_API_KEY` ذخیره کنید (فعلاً پیاده‌سازی نشده)

## 🔔 نوتیف پوش (پیش‌رو)

این قابلیت روی PWA کار می‌کنه:
- ✅ **Android:** پوش نوتیف کامل، حتی وقتی اپ بسته‌ست
- ⚠️ **iOS:** فقط iOS 16.4+ و بعد از Add to Home Screen

زیرساخت آماده (جدول `push_subscriptions`)، اما ارسال نوتیف در نسخه‌های بعدی اضافه می‌شه.

## 🐛 عیب‌یابی

- **صفحه سفید بعد از deploy:** بررسی کنید همه environment variables تنظیم شده باشن
- **رمز ادمین کار نمی‌کنه:** `ADMIN_PASSWORD` باید در Cloudflare Environment ست شده باشه
- **قیمت‌ها آپدیت نمی‌شن:** کنسول مرورگر رو باز کنید و ببینید WebSocket به Binance وصل شده یا نه
- **PWA نصب نمی‌شه:** HTTPS لازمه — روی `.lovable.app` یا Cloudflare Pages خودکار فعاله

## 📄 لایسنس

این پروژه برای استفاده شخصی ساخته شده. کتابخانه‌های استفاده‌شده همه MIT هستن."# signal" 
