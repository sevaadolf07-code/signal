import { useEffect, useState } from "react";

/**
 * Subscribe to Binance combined miniTicker streams for a list of symbols.
 * symbols must be uppercase like "BTCUSDT". Free & keyless.
 */
export function useBinancePrices(symbols: string[]): Record<string, { price: number; change: number } | undefined> {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number } | undefined>>({});
  const key = symbols.join(",");

  useEffect(() => {
    if (typeof window === "undefined" || symbols.length === 0) return;
    const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const d = msg.data;
        if (!d || !d.s) return;
        setPrices((p) => ({
          ...p,
          [d.s]: { price: parseFloat(d.c), change: parseFloat(d.P) },
        }));
      } catch {}
    };
    return () => {
      try {
        ws.close();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return prices;
}

/** Convert a display pair like "BTC/USDT" to a Binance stream symbol. */
export function pairToBinanceSymbol(pair: string): string | null {
  const clean = pair.replace("/", "").toUpperCase();
  // Only crypto pairs ending in USDT/BUSD/USDC are supported here.
  if (/USDT$|BUSD$|USDC$|BTC$/.test(clean)) return clean;
  return null;
}