import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, LogOut, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { signalsQuery, tweetsQuery, type Signal } from "@/lib/queries";
import {
  verifyAdminPassword,
  createSignal,
  updateSignalStatus,
  deleteSignal,
  createTweet,
  deleteTweet,
} from "@/lib/admin.functions";
import { timeAgoFa } from "@/lib/format";
import { PAIRS_BY_MARKET } from "@/lib/pairs";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "پنل ادمین | سیگنال پالس" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(signalsQuery),
      context.queryClient.ensureQueryData(tweetsQuery),
    ]);
  },
  component: AdminPage,
});

const PW_KEY = "sp_admin_pw";

function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(PW_KEY) : null;
    if (saved) setPassword(saved);
  }, []);

  if (!password) return <UnlockScreen onUnlock={setPassword} />;
  return <AdminDashboard password={password} onLock={() => {
    sessionStorage.removeItem(PW_KEY);
    setPassword(null);
  }} />;
}

function UnlockScreen({ onUnlock }: { onUnlock: (pw: string) => void }) {
  const verify = useServerFn(verifyAdminPassword);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    try {
      const res = await verify({ data: { password: pw } });
      if (res.ok) {
        sessionStorage.setItem(PW_KEY, pw);
        onUnlock(pw);
      } else {
        setErr(true);
      }
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="پنل ادمین">
      <div className="card-elevated animate-scale-in mt-6 rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-center text-lg font-bold text-foreground">ورود مدیر</h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          رمز مدیریت را وارد کنید تا به پنل دسترسی پیدا کنید.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="password"
            autoFocus
            dir="ltr"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="رمز عبور"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-primary/40 focus:border-primary focus:ring-2"
          />
          {err && <p className="text-center text-xs text-danger">رمز اشتباه است</p>}
          <button
            type="submit"
            disabled={busy || !pw}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "در حال بررسی…" : "ورود"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

function AdminDashboard({ password, onLock }: { password: string; onLock: () => void }) {
  const { data: signals } = useSuspenseQuery(signalsQuery);
  const { data: tweets } = useSuspenseQuery(tweetsQuery);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"signal" | "tweet">("signal");

  const refetchSignals = () => qc.invalidateQueries({ queryKey: ["signals"] });
  const refetchTweets = () => qc.invalidateQueries({ queryKey: ["tweets"] });

  return (
    <AppShell
      title="پنل ادمین"
      left={
        <button aria-label="خروج" onClick={onLock} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
          <LogOut className="h-5 w-5" strokeWidth={1.8} />
        </button>
      }
    >
      <div className="mb-4 flex items-center gap-2 rounded-full bg-secondary p-1">
        {(
          [
            { k: "signal" as const, l: "سیگنال جدید" },
            { k: "tweet" as const, l: "توییت جدید" },
          ]
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={
              "flex-1 rounded-full py-2 text-sm font-medium transition-all " +
              (tab === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground")
            }
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "signal" ? (
        <SignalForm password={password} onDone={refetchSignals} />
      ) : (
        <TweetForm password={password} onDone={refetchTweets} />
      )}

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-bold text-foreground">مدیریت سیگنال‌ها</h3>
        <ul className="space-y-2">
          {signals.map((s) => (
            <SignalRow key={s.id} signal={s} password={password} onDone={refetchSignals} />
          ))}
        </ul>
      </section>

      <section className="mt-6 pb-4">
        <h3 className="mb-2 text-sm font-bold text-foreground">مدیریت توییت‌ها</h3>
        <ul className="space-y-2">
          {tweets.map((t) => (
            <li key={t.id} className="card-elevated flex items-start gap-2 rounded-xl border border-border/50 bg-card p-3">
              <p className="flex-1 text-[13px] leading-6 text-foreground">{t.content}</p>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-muted-foreground">{timeAgoFa(t.created_at)}</span>
                <DangerButton
                  onClick={async () => {
                    if (!confirm("حذف این توییت؟")) return;
                    try {
                      await deleteTweet({ data: { password, id: t.id } });
                      toast.success("حذف شد");
                      refetchTweets();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "خطا");
                    }
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function DangerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="حذف"
      className="rounded-full p-1.5 text-danger hover:bg-danger-soft"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function SignalRow({ signal, password, onDone }: { signal: Signal; password: string; onDone: () => void }) {
  const setStatus = async (status: Signal["status"]) => {
    try {
      await updateSignalStatus({ data: { password, id: signal.id, status } });
      toast.success("بروزرسانی شد");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا");
    }
  };
  return (
    <li className="card-elevated rounded-xl border border-border/50 bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" dir="ltr">{signal.pair}</span>
            <span className={"rounded-full px-2 py-0.5 text-[10px] " + (signal.direction === "buy" ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
              {signal.direction === "buy" ? "خرید" : "فروش"}
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{signal.status}</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{timeAgoFa(signal.created_at)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="TP خورد"
            onClick={() => setStatus("tp1")}
            className="rounded-full p-1.5 text-success hover:bg-success-soft"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            aria-label="SL خورد"
            onClick={() => setStatus("sl")}
            className="rounded-full p-1.5 text-danger hover:bg-danger-soft"
          >
            <XCircle className="h-4 w-4" />
          </button>
          <DangerButton
            onClick={async () => {
              if (!confirm("حذف این سیگنال؟")) return;
              try {
                await deleteSignal({ data: { password, id: signal.id } });
                toast.success("حذف شد");
                onDone();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "خطا");
              }
            }}
          />
        </div>
      </div>
    </li>
  );
}

function SignalForm({ password, onDone }: { password: string; onDone: () => void }) {
  const [form, setForm] = useState({
    pair: "BTC/USDT",
    market_type: "crypto" as "crypto" | "forex",
    direction: "buy" as "buy" | "sell",
    entry_price: "",
    tp1: "",
    tp2: "",
    tp3: "",
    sl: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createSignal({
        data: {
          password,
          pair: form.pair.trim().toUpperCase(),
          market_type: form.market_type,
          direction: form.direction,
          entry_price: Number(form.entry_price),
          tp1: form.tp1 ? Number(form.tp1) : null,
          tp2: form.tp2 ? Number(form.tp2) : null,
          tp3: form.tp3 ? Number(form.tp3) : null,
          sl: Number(form.sl),
          note: form.note.trim() || null,
        },
      });
      toast.success("سیگنال ثبت شد");
      setForm({ ...form, entry_price: "", tp1: "", tp2: "", tp3: "", sl: "", note: "" });
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ثبت");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-elevated space-y-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">جفت‌ارز</label>
          <select
            dir="ltr"
            value={form.pair}
            onChange={(e) => setForm({ ...form, pair: e.target.value })}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {PAIRS_BY_MARKET[form.market_type].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">بازار</label>
          <select
            value={form.market_type}
            onChange={(e) => {
              const mt = e.target.value as "crypto" | "forex";
              setForm({ ...form, market_type: mt, pair: PAIRS_BY_MARKET[mt][0] });
            }}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="crypto">کریپتو</option>
            <option value="forex">فارکس</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">جهت</label>
          <div className="flex overflow-hidden rounded-xl border border-input">
            {(["buy", "sell"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm({ ...form, direction: d })}
                className={
                  "flex-1 py-2 text-sm font-bold transition-colors " +
                  (form.direction === d
                    ? d === "buy" ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground"
                    : "bg-background text-muted-foreground")
                }
              >
                {d === "buy" ? "خرید" : "فروش"}
              </button>
            ))}
          </div>
        </div>
        <Field label="قیمت ورود" placeholder="0.00" dir="ltr" value={form.entry_price} onChange={(v) => setForm({ ...form, entry_price: v })} type="number" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Field label="TP۱" placeholder="0.00" dir="ltr" value={form.tp1} onChange={(v) => setForm({ ...form, tp1: v })} type="number" />
        <Field label="TP۲" placeholder="0.00" dir="ltr" value={form.tp2} onChange={(v) => setForm({ ...form, tp2: v })} type="number" />
        <Field label="TP۳" placeholder="0.00" dir="ltr" value={form.tp3} onChange={(v) => setForm({ ...form, tp3: v })} type="number" />
      </div>

      <Field label="حد ضرر (SL)" placeholder="0.00" dir="ltr" value={form.sl} onChange={(v) => setForm({ ...form, sl: v })} type="number" />

      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground">توضیحات (اختیاری)</label>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          rows={3}
          placeholder="یادداشت تحلیلی…"
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <button
        type="submit"
        disabled={busy || !form.pair || !form.entry_price || !form.sl}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {busy ? "در حال ثبت…" : "ثبت سیگنال"}
      </button>
    </form>
  );
}

function TweetForm({ password, onDone }: { password: string; onDone: () => void }) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createTweet({ data: { password, content: content.trim() } });
      toast.success("توییت منتشر شد");
      setContent("");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card-elevated space-y-3 rounded-2xl border border-border/60 bg-card p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="تحلیل بازار…"
        className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={busy || !content.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {busy ? "در حال ارسال…" : "انتشار توییت"}
      </button>
    </form>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-muted-foreground">{props.label}</label>
      <input
        type={props.type ?? "text"}
        dir={props.dir}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        step="any"
        className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}