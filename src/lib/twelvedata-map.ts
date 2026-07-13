/** Map display pair to TwelveData symbol. */
export const FOREX_TO_TD: Record<string, string> = {
  "XAU/USD": "XAU/USD",
  "XAG/USD": "XAG/USD",
  UKOIL: "UKOIL",
  USOIL: "USOIL",
  US30: "DJI",
  NAS100: "IXIC",
  DXY: "DXY",
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDCAD: "USD/CAD",
  USDJPY: "USD/JPY",
  USDCHF: "USD/CHF",
  AUDUSD: "AUD/USD",
  NZDUSD: "NZD/USD",
};

export function pairToTwelveDataSymbol(pair: string): string | null {
  return FOREX_TO_TD[pair.toUpperCase()] ?? null;
}