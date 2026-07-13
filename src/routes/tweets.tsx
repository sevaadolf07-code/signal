import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Heart, MessageCircle, Share2, BadgeCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { tweetsQuery } from "@/lib/queries";
import { timeAgoFa } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tweets")({
  head: () => ({
    meta: [
      { title: "توییت‌ها | سیگنال پالس" },
      { name: "description", content: "تحلیل‌ها و توییت‌های لحظه‌ای ادمین سیگنال پالس." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(tweetsQuery),
  component: TweetsPage,
});

function TweetsPage() {
  const { data: tweets } = useSuspenseQuery(tweetsQuery);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("tweets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tweets" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tweets"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <AppShell
      title="توییت‌ها"
      right={
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
      }
    >
      <div className="space-y-3 pb-4">
        {tweets.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
            هنوز توییتی ثبت نشده.
          </div>
        ) : (
          tweets.map((t, i) => (
            <article
              key={t.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="card-elevated animate-fade-in rounded-2xl border border-border/60 bg-card p-4"
            >
              <header className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-500 text-lg font-black text-primary-foreground">
                    س
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-bold text-foreground">سیگنال پالس</h3>
                      <BadgeCheck className="h-4 w-4 fill-primary text-primary-foreground" />
                    </div>
                    <p dir="ltr" className="text-[11px] text-muted-foreground">
                      @signalpulse
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground">{timeAgoFa(t.created_at)}</span>
              </header>

              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-7 text-foreground">
                {t.content}
              </p>

              <footer className="mt-3 flex items-center justify-around border-t border-border/50 pt-3 text-muted-foreground">
                <button aria-label="لایک" className="group flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors hover:bg-danger-soft hover:text-danger">
                  <Heart className="h-4 w-4 transition-transform group-hover:scale-110" strokeWidth={1.8} />
                  <span className="text-xs">۰</span>
                </button>
                <button aria-label="نظر" className="flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors hover:bg-primary/10 hover:text-primary">
                  <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
                  <span className="text-xs">۰</span>
                </button>
                <button aria-label="اشتراک" className="flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors hover:bg-success-soft hover:text-success">
                  <Share2 className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </footer>
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}