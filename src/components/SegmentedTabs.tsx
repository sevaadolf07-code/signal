import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Tab<K extends string> = {
  k: K;
  l: string;
  icon?: React.ReactNode;
};

export function SegmentedTabs<K extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly Tab<K>[];
  value: K;
  onChange: (k: K) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = btnRefs.current[value];
    const container = containerRef.current;
    if (!el || !container) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill({ x: r.left - c.left, w: r.width });
  }, [value, tabs.length]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center gap-1 rounded-full bg-secondary p-1 overflow-hidden",
        className,
      )}
    >
      {/* Sliding pill */}
      {pill && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-primary shadow-md shadow-primary/30"
          style={{
            transform: `translateX(${pill.x}px)`,
            width: pill.w,
            left: 0,
            transition: ready
              ? "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
          }}
        />
      )}
      {/* Glow trailing effect */}
      {pill && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full opacity-40 blur-md"
          style={{
            transform: `translateX(${pill.x}px)`,
            width: pill.w,
            left: 0,
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--primary) 60%, transparent), color-mix(in oklab, var(--primary) 30%, transparent))",
            transition: ready
              ? "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), width 520ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
          }}
        />
      )}
      {tabs.map((t) => {
        const active = t.k === value;
        return (
          <button
            key={t.k}
            ref={(el) => {
              btnRefs.current[t.k] = el;
            }}
            onClick={() => onChange(t.k)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium press-scale transition-colors duration-300",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-1.5 transition-transform duration-300",
                active ? "scale-105" : "scale-100",
              )}
            >
              {t.icon}
              {t.l}
            </span>
          </button>
        );
      })}
    </div>
  );
}