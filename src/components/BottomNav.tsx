import { Link, useRouterState } from "@tanstack/react-router";
import { Radio, MessageCircle, BarChart3, User } from "lucide-react";

const tabs = [
  { to: "/", label: "سیگنال‌ها", icon: Radio },
  { to: "/tweets", label: "توییت‌ها", icon: MessageCircle },
  { to: "/performance", label: "عملکرد", icon: BarChart3 },
  { to: "/admin", label: "ادمین", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 w-[min(92%,420px)]"
      aria-label="ناوبری اصلی"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="glass-nav card-float flex items-center justify-around rounded-full border border-border/60 px-2 py-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="group relative flex flex-1 items-center justify-center"
            >
              <span
                className={
                  "flex items-center gap-1.5 rounded-full px-3 py-2 transition-all duration-300 " +
                  (active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-100"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary")
                }
              >
                <Icon
                  className={active ? "h-5 w-5" : "h-[22px] w-[22px]"}
                  strokeWidth={active ? 2.4 : 1.7}
                />
                <span
                  className={
                    "overflow-hidden text-[13px] font-medium transition-all duration-300 " +
                    (active ? "max-w-[80px] opacity-100" : "max-w-0 opacity-0")
                  }
                >
                  {label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}