import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Target, Shield, CheckCircle2, XCircle, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Sparkline } from "@/components/Sparkline";
import { PushToggle } from "@/components/PushToggle";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { getPairLogo } from "@/lib/pair-logos";
import { signalsQuery, type Signal } from "@/lib/queries";
import { fmtPrice, timeAgoFa, toPersianNum } from "@/lib/format";
import { useBinancePrices, pairToBinanceSymbol } from "@/hooks/useBinancePrices";
import { useForexPrices } from "@/hooks/useForexPrices";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(signalsQuery),
  component: SignalsPage,
});

type Filter = "all" | "crypto" | "forex";

function SignalsPage() {
  const { data: signals } = useSuspenseQuery(signalsQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const queryClient = useQueryClient();

  // Realtime: refetch on any change
  useEffect(() => {
    const channel = supabase
      .channel("signals-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "signals" }, () => {
        queryClient.invalidateQueries({ queryKey: ["signals"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filtered = useMemo(
    () => (filter === "all" ? signals : signals.filter((s) => s.market_type === filter)),
    [signals, filter],
  );

  const cryptoSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          signals
            .filter((s) => s.market_type === "crypto")
            .map((s) => pairToBinanceSymbol(s.pair))
            .filter((v): v is string => Boolean(v)),
        ),
      ),
    [signals],
  );
  const livePrices = useBinancePrices(cryptoSymbols);

  const forexPairs = useMemo(
    () =>
      Array.from(
        new Set(signals.filter((s) => s.market_type === "forex").map((s) => s.pair)),
      ),
    [signals],
  );
  const forexPrices = useForexPrices(forexPairs);

  return (
    <AppShell
      title="سیگنال‌ها"
      right={<PushToggle />}
    >
      {/* Filter pills */}
      <div className="mb-4">
        <SegmentedTabs
          value={filter}
          onChange={(k) => setFilter(k)}
          tabs={[
            { k: "all", l: "همه" },
            { k: "crypto", l: "کریپتو", icon: <span dir="ltr">₿</span> },
            { k: "forex", l: "فارکس", icon: <span dir="ltr">€</span> },
          ] as const}
        />
      </div>

      {/* Signal list */}
      <div key={filter} className="space-y-3 pb-4 animate-fade-in">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((s, i) => {
            const sym = pairToBinanceSymbol(s.pair);
            const live =
              s.market_type === "crypto" && sym
                ? livePrices[sym]
                : forexPrices[s.pair];
            return (
              <div key={s.id} style={{ animationDelay: `${i * 80}ms` }} className="animate-card-in">
                <SignalCard signal={s} live={live} />
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">هنوز سیگنالی ثبت نشده.</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Signal["status"] }) {
  const map: Record<Signal["status"], { label: string; className: string; Icon: typeof CheckCircle2 }> = {
    active: { label: "فعال", className: "bg-primary/10 text-primary", Icon: Clock },
    tp1: { label: "TP۱ خورد", className: "bg-success-soft text-success", Icon: CheckCircle2 },
    tp2: { label: "TP۲ خورد", className: "bg-success-soft text-success", Icon: CheckCircle2 },
    tp3: { label: "TP۳ خورد", className: "bg-success-soft text-success", Icon: CheckCircle2 },
    sl: { label: "SL خورد", className: "bg-danger-soft text-danger", Icon: XCircle },
    closed: { label: "بسته شد", className: "bg-muted text-muted-foreground", Icon: Clock },
  };
  const { label, className, Icon } = map[status];
  return (
    <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " + className}>
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      {label}
    </span>
  );
}

function SignalCard({ signal, live }: { signal: Signal; live?: { price: number; change: number } }) {
  const isBuy = signal.direction === "buy";
  const currentPrice = live?.price ?? signal.entry_price;
  const changePct = live ? live.change : 0;
  const color = isBuy ? "oklch(0.66 0.17 152)" : "oklch(0.63 0.22 27)";

  // Flash price cell on tick
  const prevPriceRef = useRef<number | undefined>(currentPrice);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    const prev = prevPriceRef.current;
    if (prev !== undefined && currentPrice !== prev) {
      setFlash(currentPrice > prev ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 900);
      prevPriceRef.current = currentPrice;
      return () => clearTimeout(t);
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  // Fake trend based on direction; replaced by real WS candle history later.
  const trend = useMemo(() => {
    const arr: number[] = [];
    const start = signal.entry_price;
    for (let i = 0; i < 20; i++) {
      const drift = isBuy ? i * 0.005 : -i * 0.005;
      const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.006;
      arr.push(start * (1 + drift + noise));
    }
    return arr;
  }, [signal.entry_price, isBuy]);

  return (
    <article className={
      "card-elevated rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:card-float hover:-translate-y-0.5 " +
      (signal.status === "active" ? "animate-glow-pulse" : "")
    }>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="hover-scale">
            <PairIcon pair={signal.pair} market={signal.market_type} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-foreground">{signal.pair}</h3>
              <span
                className={
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold animate-badge-pop " +
                  (isBuy ? "bg-success-soft text-success" : "bg-danger-soft text-danger")
                }
              >
                {isBuy ? (
                  <TrendingUp className="h-3 w-3 animate-arrow-up" />
                ) : (
                  <TrendingDown className="h-3 w-3 animate-arrow-down" />
                )}
                {isBuy ? "خرید" : "فروش"}
              </span>
              {signal.status === "active" && <span className="live-dot" aria-label="live" />}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              <span className="inline-block ltr:direction-ltr">{timeAgoFa(signal.created_at)}</span>
            </p>
          </div>
        </div>
        <StatusBadge status={signal.status} />
      </div>

      {/* Price + sparkline */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className={
          "rounded-lg px-2 py-1 -mx-2 " +
          (flash === "up" ? "animate-flash-up" : flash === "down" ? "animate-flash-down" : "")
        }>
          <div className="text-[11px] text-muted-foreground">قیمت فعلی</div>
          <div dir="ltr" className="text-xl font-bold tabular-nums text-foreground transition-colors">
            {fmtPrice(currentPrice)}
          </div>
          {live && (
            <div dir="ltr" className={"text-xs font-medium tabular-nums animate-pill-slide " + (changePct >= 0 ? "text-success" : "text-danger")}>
              {changePct >= 0 ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
            </div>
          )}
        </div>
        <Sparkline values={trend} color={color} className="h-10 w-28" />
      </div>

      {/* TP / SL grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PriceRow icon={Target} label="TP۱" value={signal.tp1} tone="success" />
        <PriceRow icon={Target} label="TP۲" value={signal.tp2} tone="success" />
        <PriceRow icon={Target} label="TP۳" value={signal.tp3} tone="success" />
        <PriceRow icon={Shield} label="ورود" value={signal.entry_price} tone="muted" />
      </div>
      <div className="mt-2">
        <PriceRow icon={Shield} label="حد ضرر (SL)" value={signal.sl} tone="danger" full />
      </div>

      {signal.note && (
        <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-[13px] leading-relaxed text-muted-foreground">
          {signal.note}
        </p>
      )}
    </article>
  );
}

function PriceRow({
  icon: Icon,
  label,
  value,
  tone,
  full,
}: {
  icon: typeof Target;
  label: string;
  value: number | null;
  tone: "success" | "danger" | "muted";
  full?: boolean;
}) {
  const toneCls =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : "text-muted-foreground";
  const dotCls =
    tone === "success" ? "bg-success" : tone === "danger" ? "bg-danger" : "bg-muted-foreground";
  return (
    <div
      className={
        "flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-2 " +
        (full ? "col-span-2" : "")
      }
    >
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={"h-1.5 w-1.5 rounded-full " + dotCls} />
        {label}
      </span>
      <span dir="ltr" className={"tabular-nums text-sm font-semibold " + toneCls}>
        {fmtPrice(value)}
      </span>
    </div>
  );
}

function PairIcon({ pair, market }: { pair: string; market: "crypto" | "forex" }) {
  const { primary, secondary, base } = getPairLogo(pair, market);
  const fallbackGrad =
    market === "crypto" ? "from-primary to-blue-500" : "from-emerald-400 to-cyan-500";

  if (!primary) {
    return (
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${fallbackGrad} text-white shadow-md shadow-primary/10`}
      >
        <span className="text-[11px] font-black tracking-tight" dir="ltr">
          {base.slice(0, 3)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-11 w-11">
      <img
        src={primary}
        alt={base}
        loading="lazy"
        className="h-11 w-11 rounded-full bg-white object-contain p-0.5 shadow-md shadow-primary/10 ring-1 ring-border/60"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      {secondary && (
        <img
          src={secondary}
          alt=""
          loading="lazy"
          className="absolute -bottom-0.5 -left-1 h-5 w-5 rounded-full bg-white object-contain p-[1px] shadow ring-1 ring-border/60"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}

// Suppress unused warnings for helper.
void toPersianNum;
