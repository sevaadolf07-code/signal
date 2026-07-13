// Maps trading pair symbols to TradingView's public symbol-logo CDN.
// TradingView serves these SVGs at s3-symbol-logo.tradingview.com.

const TV = "https://s3-symbol-logo.tradingview.com";

const CRYPTO_SLUG: Record<string, string> = {
  BTC: "xtvcbtc",
  ETH: "xtvceth",
  SOL: "xtvcsol",
  BNB: "xtvcbnb",
  XRP: "xtvcxrp",
  SUI: "xtvcsui",
  DOGE: "xtvcdoge",
  SHIB: "xtvcshib",
  PEPE: "xtvcpepe",
  USDT: "xtvcusdt",
  GRAM: "xtvcgram",
  PUMP: "xtvcpump",
};

const COUNTRY: Record<string, string> = {
  USD: "US",
  EUR: "EU",
  GBP: "GB",
  JPY: "JP",
  CHF: "CH",
  CAD: "CA",
  AUD: "AU",
  NZD: "NZ",
};

// Special forex-market symbols: metals, oils, indices.
const SPECIAL: Record<string, string> = {
  XAU: `${TV}/metal/gold--big.svg`,
  XAG: `${TV}/metal/silver--big.svg`,
  UKOIL: `${TV}/provider/brent-crude-oil--big.svg`,
  USOIL: `${TV}/provider/crude-oil--big.svg`,
  US30: `${TV}/indices/dow-jones-30--big.svg`,
  NAS100: `${TV}/indices/nasdaq-100--big.svg`,
  DXY: `${TV}/indices/us-dollar-index--big.svg`,
};

function splitPair(pair: string): [string, string | null] {
  const p = pair.toUpperCase();
  if (p.includes("/")) {
    const [a, b] = p.split("/");
    return [a, b ?? null];
  }
  // 6-letter forex like EURUSD
  if (p.length === 6 && COUNTRY[p.slice(0, 3)] && COUNTRY[p.slice(3, 6)]) {
    return [p.slice(0, 3), p.slice(3, 6)];
  }
  return [p, null];
}

export type PairLogo = {
  primary: string | null;
  secondary: string | null;
  base: string;
};

export function getPairLogo(pair: string, market: "crypto" | "forex"): PairLogo {
  const [base, quote] = splitPair(pair);

  if (market === "crypto") {
    const baseSlug = CRYPTO_SLUG[base];
    const quoteSlug = quote ? CRYPTO_SLUG[quote] : null;
    return {
      primary: baseSlug ? `${TV}/crypto/${baseSlug.toUpperCase()}.svg` : null,
      secondary: quoteSlug ? `${TV}/crypto/${quoteSlug.toUpperCase()}.svg` : null,
      base,
    };
  }

  // forex
  if (SPECIAL[base]) {
    return { primary: SPECIAL[base], secondary: null, base };
  }
  const baseFlag = COUNTRY[base] ? `${TV}/country/${COUNTRY[base]}.svg` : null;
  const quoteFlag = quote && COUNTRY[quote] ? `${TV}/country/${COUNTRY[quote]}.svg` : null;
  return { primary: baseFlag, secondary: quoteFlag, base };
}