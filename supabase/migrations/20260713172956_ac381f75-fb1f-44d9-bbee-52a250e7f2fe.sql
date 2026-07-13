
-- Signals table
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pair TEXT NOT NULL,
  market_type TEXT NOT NULL CHECK (market_type IN ('crypto','forex')),
  direction TEXT NOT NULL CHECK (direction IN ('buy','sell')),
  entry_price NUMERIC NOT NULL,
  tp1 NUMERIC,
  tp2 NUMERIC,
  tp3 NUMERIC,
  sl NUMERIC NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','tp1','tp2','tp3','sl','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

GRANT SELECT ON public.signals TO anon, authenticated;
GRANT ALL ON public.signals TO service_role;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view signals" ON public.signals FOR SELECT USING (true);

-- Tweets table
CREATE TABLE public.tweets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tweets TO anon, authenticated;
GRANT ALL ON public.tweets TO service_role;
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tweets" ON public.tweets FOR SELECT USING (true);

-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.push_subscriptions TO anon, authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.push_subscriptions FOR INSERT WITH CHECK (true);

-- Enable realtime for signals & tweets so UI updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tweets;

-- Seed a few demo signals and tweets so the UI has something to show before admin adds real ones
INSERT INTO public.signals (pair, market_type, direction, entry_price, tp1, tp2, tp3, sl, note, status) VALUES
('BTC/USDT', 'crypto', 'buy', 67500, 68200, 69500, 71200, 65000, 'شکست مقاومت کلیدی؛ حجم ورودی بالا.', 'tp1'),
('ETH/USDT', 'crypto', 'buy', 3650, 3720, 3820, 3950, 3540, 'ساختار صعودی در تایم ۴ ساعته.', 'active'),
('SOL/USDT', 'crypto', 'sell', 178.5, 172, 168, 162, 184, 'واگرایی منفی در RSI روزانه.', 'active'),
('EUR/USD', 'forex', 'sell', 1.08245, 1.07950, 1.07620, 1.07200, 1.08680, 'تضعیف یورو در برابر داده‌های اشتغال آمریکا.', 'tp2'),
('GBP/USD', 'forex', 'buy', 1.27350, 1.27650, 1.28000, 1.28450, 1.26900, 'حمایت کلیدی حفظ شد.', 'closed');

INSERT INTO public.tweets (content) VALUES
('تحلیل بیت‌کوین: بعد از تثبیت بالای ۶۷,۵۰۰ دلار، نشانه‌های صعودی قوی نشون می‌ده. تارگت بعدی ۷۲,۰۰۰ دلار. مدیریت سرمایه فراموش نشه. 🔥'),
('در بازار فارکس، دلار آمریکا در حال تضعیف در برابر سبدی از ارزهای اصلی هست. اگر داده‌های تورمی آمریکا مطابق پیش‌بینی‌ها باشه، EUR/USD ممکنه تا ۱.۰۹۵۰ رشد کنه.'),
('نمودار ۴ ساعته اتریوم: قیمت بالای محدوده حمایتی کلیدی در حال نوسانه. عبور از ۳,۸۵۰ دلار می‌تونه مسیر رو تا ۴,۲۵۰ دلار باز کنه.');
