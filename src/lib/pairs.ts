export type MarketType = "crypto" | "forex";

export const CRYPTO_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "SUI/USDT",
  "DOGE/USDT",
  "GRAM/USDT",
  "SHIB/USDT",
  "PEPE/USDT",
  "PUMP/USDT",
] as const;

export const FOREX_PAIRS = [
  "XAU/USD",
  "XAG/USD",
  "UKOIL",
  "USOIL",
  "US30",
  "NAS100",
  "DXY",
  "EURUSD",
  "GBPUSD",
  "USDCAD",
  "USDJPY",
  "USDCHF",
  "AUDUSD",
  "NZDUSD",
] as const;

export const PAIRS_BY_MARKET: Record<MarketType, readonly string[]> = {
  crypto: CRYPTO_PAIRS,
  forex: FOREX_PAIRS,
};