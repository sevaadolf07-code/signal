import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";

export function AppShell({
  title,
  right,
  left,
  children,
}: {
  title: ReactNode;
  right?: ReactNode;
  left?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background pb-28">
      <header className="sticky top-0 z-40 glass-nav border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="w-10 flex justify-start">{right}</div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
          <div className="w-10 flex justify-end">{left ?? <ThemeToggle />}</div>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 pt-4 animate-fade-in">{children}</main>
      <BottomNav />
    </div>
  );
}