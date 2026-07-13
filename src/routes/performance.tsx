import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Target, ShieldAlert, BarChart3, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Sparkline } from "@/components/Sparkline";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { signalsQuery, type Signal } from "@/lib/queries";
import { toPersianNum } from "@/lib/format";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "عملکرد سیگنال‌ها | سیگنال پالس" },
      { name: "description", content: "گزارش شفاف عملکرد سیگنال‌های کریپتو و فارکس: نرخ موفقیت، TP و SL." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(signalsQuery),
  component: PerformancePage,
});

type Market = "crypto" | "forex";

function PerformancePage() {
  const { data: signals } = useSuspenseQuery(signalsQuery);
  const [market, setMarket] = useState<Market>("crypto");

  const subset = useMemo(() => signals.filter((s) => s.market_type === market), [signals, market]);
  const stats = useMemo(() => computeStats(subset), [subset]);

  return (
    <AppShell title="عملکرد">
      {/* Market tabs */}
      <div className="mb-4">
        <SegmentedTabs
          value={market}
          onChange={(k) => setMarket(k)}
          tabs={[
            { k: "crypto", l: "کریپتو", icon: <span dir="ltr">₿</span> },
            { k: "forex", l: "فارکس", icon: <span dir="ltr">€</span> },
          ] as const}
        />
      </div>

      {/* Hero: success ring */}
      <div className="card-elevated animate-fade-in mb-4 flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5">
        <SuccessRing value={stats.winRate} />
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">نرخ موفقیت {market === "crypto" ? "کریپتو" : "فارکس"}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span dir="ltr" className="text-3xl font-black tabular-nums text-foreground">
                {toPersianNum(stats.winRate)}
              </span>
              <span className="text-lg font-bold text-muted-foreground">٪</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[11px] font-medium text-success">
            <TrendingUp className="h-3 w-3" />
            {toPersianNum(stats.total)} سیگنال بررسی شده
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatCard icon={Target} label="TP" value={stats.tpHits} tone="success" />
        <StatCard icon={ShieldAlert} label="SL" value={stats.slHits} tone="danger" />
        <StatCard icon={BarChart3} label="کل" value={stats.total} tone="primary" />
      </div>

      {/* Best pairs */}
      <div className="card-elevated animate-fade-in rounded-2xl border border-border/60 bg-card p-4">
        <h3 className="mb-3 text-sm font-bold text-foreground">بهترین جفت‌ارزها</h3>
        <ul className="space-y-2">
          {stats.bestPairs.length === 0 ? (
            <li className="rounded-xl bg-secondary/60 p-4 text-center text-xs text-muted-foreground">
              هنوز داده کافی وجود ندارد
            </li>
          ) : (
            stats.bestPairs.map((p) => (
              <li
                key={p.pair}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 p-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span dir="ltr">{p.pair}</span>
                </div>
                <Sparkline
                  values={p.trend}
                  color={p.rate >= 50 ? "oklch(0.66 0.17 152)" : "oklch(0.63 0.22 27)"}
                  className="h-6 w-20 opacity-90"
                />
                <span
                  dir="ltr"
                  className={
                    "min-w-[3.5rem] rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums " +
                    (p.rate >= 50 ? "bg-success-soft text-success" : "bg-danger-soft text-danger")
                  }
                >
                  {p.rate >= 50 ? "+" : "-"}
                  {Math.abs(p.rate)}%
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </AppShell>
  );
}

function computeStats(list: Signal[]) {
  const closed = list.filter((s) => s.status !== "active");
  const tp = list.filter((s) => s.status === "tp1" || s.status === "tp2" || s.status === "tp3").length;
  const sl = list.filter((s) => s.status === "sl").length;
  const denom = tp + sl;
  const winRate = denom === 0 ? 0 : Math.round((tp / denom) * 100);

  const byPair = new Map<string, { hits: number; miss: number }>();
  list.forEach((s) => {
    const entry = byPair.get(s.pair) ?? { hits: 0, miss: 0 };
    if (s.status === "tp1" || s.status === "tp2" || s.status === "tp3") entry.hits++;
    else if (s.status === "sl") entry.miss++;
    byPair.set(s.pair, entry);
  });
  const bestPairs = Array.from(byPair.entries())
    .map(([pair, v]) => {
      const total = v.hits + v.miss;
      const rate = total === 0 ? 0 : Math.round(((v.hits - v.miss) / total) * 100);
      const trend = Array.from({ length: 10 }, (_, i) => 50 + rate * 0.5 + Math.sin(i + pair.length) * 6);
      return { pair, rate, trend };
    })
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 4);

  return { total: list.length, tpHits: tp, slHits: sl, winRate, closedCount: closed.length, bestPairs };
}

function SuccessRing({ value }: { value: number }) {
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(0.94 0.02 240)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.2,0.8,0.2,1)" }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.66 0.14 236)" />
            <stop offset="100%" stopColor="oklch(0.72 0.17 200)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Target;
  label: string;
  value: number;
  tone: "success" | "danger" | "primary";
}) {
  const toneCls =
    tone === "success"
      ? "text-success bg-success-soft"
      : tone === "danger"
        ? "text-danger bg-danger-soft"
        : "text-primary bg-primary/10";
  return (
    <div className="card-elevated flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card p-3 text-center">
      <span className={"inline-flex h-8 w-8 items-center justify-center rounded-full " + toneCls}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span dir="ltr" className="text-lg font-black tabular-nums text-foreground">
        {toPersianNum(value)}
      </span>
    </div>
  );
}