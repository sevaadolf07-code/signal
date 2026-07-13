import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { FOREX_TO_TD } from "./twelvedata-map";

type Quote = { price: number; change: number };
type QuotesResult = { quotes: Record<string, Quote> };

const inputSchema = z.object({ symbols: z.array(z.string()).max(30) });

export const getForexQuotes = createServerFn({ method: "GET" })
  .inputValidator((raw) => inputSchema.parse(raw))
  .handler(async ({ data }): Promise<QuotesResult> => {
    const key = process.env.TWELVEDATA_API_KEY;
    if (!key || data.symbols.length === 0) return { quotes: {} };

    const mapped = data.symbols
      .map((s) => ({ orig: s.toUpperCase(), td: FOREX_TO_TD[s.toUpperCase()] }))
      .filter((m) => m.td);
    if (mapped.length === 0) return { quotes: {} };

    const tdSyms = Array.from(new Set(mapped.map((m) => m.td)));
    const url =
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(tdSyms.join(","))}` +
      `&apikey=${encodeURIComponent(key)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) return { quotes: {} };
      const json = (await res.json()) as Record<string, unknown>;
      const rows: Record<string, Record<string, unknown>> =
        tdSyms.length === 1
          ? { [tdSyms[0]]: json as Record<string, unknown> }
          : (json as Record<string, Record<string, unknown>>);

      const quotes: Record<string, Quote> = {};
      for (const { orig, td } of mapped) {
        const row = rows[td];
        if (!row) continue;
        const close = typeof row.close === "string" ? parseFloat(row.close) : NaN;
        const pct = typeof row.percent_change === "string" ? parseFloat(row.percent_change) : 0;
        if (Number.isFinite(close)) quotes[orig] = { price: close, change: Number.isFinite(pct) ? pct : 0 };
      }
      return { quotes };
    } catch {
      return { quotes: {} };
    }
  });