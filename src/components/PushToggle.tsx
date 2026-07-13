import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { currentSubscription, disablePush, enablePush, pushSupported } from "@/lib/push-client";

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    setSupported(true);
    currentSubscription().then((s) => setOn(!!s));
  }, []);

  async function toggle() {
    if (!supported) {
      toast.error("این مرورگر از اعلان‌ها پشتیبانی نمی‌کند");
      return;
    }
    setBusy(true);
    try {
      if (on) {
        await disablePush();
        setOn(false);
        toast.success("اعلان‌ها خاموش شد");
      } else {
        await enablePush();
        setOn(true);
        toast.success("اعلان‌ها فعال شد ✅");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در تنظیم اعلان");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      aria-label={on ? "خاموش کردن اعلان‌ها" : "فعال‌سازی اعلان‌ها"}
      onClick={toggle}
      disabled={busy}
      className={
        "rounded-full p-2 transition-colors " +
        (on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")
      }
    >
      {on ? <Bell className="h-5 w-5" strokeWidth={2} /> : <BellOff className="h-5 w-5" strokeWidth={1.8} />}
    </button>
  );
}