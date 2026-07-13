import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/** Verify admin password only. Client stores an unlocked flag locally after this succeeds. */
export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    return { ok: checkPassword(data.password) };
  });

const signalSchema = z.object({
  password: z.string().min(1),
  pair: z.string().min(1).max(20),
  market_type: z.enum(["crypto", "forex"]),
  direction: z.enum(["buy", "sell"]),
  entry_price: z.number().positive(),
  tp1: z.number().positive().nullable(),
  tp2: z.number().positive().nullable(),
  tp3: z.number().positive().nullable(),
  sl: z.number().positive(),
  note: z.string().max(500).nullable(),
});

export const createSignal = createServerFn({ method: "POST" })
  .inputValidator((raw) => signalSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) throw new Error("رمز ادمین اشتباه است");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { password: _pw, ...row } = data;
    void _pw;
    const { error } = await supabaseAdmin.from("signals").insert(row);
    if (error) throw new Error(error.message);
    // Fire-and-forget push notification to all subscribers.
    try {
      const { sendPushToAll } = await import("./webpush.server");
      await sendPushToAll();
    } catch (e) {
      console.error("push send failed", e);
    }
    return { ok: true };
  });

const updateStatusSchema = z.object({
  password: z.string().min(1),
  id: z.string().uuid(),
  status: z.enum(["active", "tp1", "tp2", "tp3", "sl", "closed"]),
});

export const updateSignalStatus = createServerFn({ method: "POST" })
  .inputValidator((raw) => updateStatusSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) throw new Error("رمز ادمین اشتباه است");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { status: string; closed_at: string | null } = {
      status: data.status,
      closed_at: data.status === "active" ? null : new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("signals").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deleteSchema = z.object({ password: z.string().min(1), id: z.string().uuid() });

export const deleteSignal = createServerFn({ method: "POST" })
  .inputValidator((raw) => deleteSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) throw new Error("رمز ادمین اشتباه است");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("signals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const tweetSchema = z.object({ password: z.string().min(1), content: z.string().min(1).max(1000) });

export const createTweet = createServerFn({ method: "POST" })
  .inputValidator((raw) => tweetSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) throw new Error("رمز ادمین اشتباه است");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tweets").insert({ content: data.content });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTweet = createServerFn({ method: "POST" })
  .inputValidator((raw) => deleteSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) throw new Error("رمز ادمین اشتباه است");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tweets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });