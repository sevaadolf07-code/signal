import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitial());
    setMounted(true);
  }, []);

  const toggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const doc = document.documentElement;
    const { clientX: x, clientY: y } = e;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const apply = () => {
      doc.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("theme", next);
      } catch {}
      setTheme(next);
    };

    // Fallback for browsers without View Transitions API
    // @ts-expect-error - startViewTransition is not typed on Document yet
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply();
      return;
    }

    // Telegram-style circular reveal
    // @ts-expect-error - startViewTransition experimental
    const transition = doc.startViewTransition(() => apply());
    await transition.ready;

    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];

    doc.animate(
      { clipPath: next === "dark" ? clipPath : [...clipPath].reverse() },
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        pseudoElement: next === "dark" ? "::view-transition-new(root)" : "::view-transition-old(root)",
      },
    );
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "روشن کردن تم" : "تیره کردن تم"}
      className="press-scale relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
    >
      <span className="relative block h-5 w-5">
        <Sun
          className={
            "absolute inset-0 h-5 w-5 transition-all duration-500 " +
            (mounted && theme === "dark"
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100")
          }
          strokeWidth={2.2}
        />
        <Moon
          className={
            "absolute inset-0 h-5 w-5 transition-all duration-500 " +
            (mounted && theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0")
          }
          strokeWidth={2.2}
        />
      </span>
    </button>
  );
}