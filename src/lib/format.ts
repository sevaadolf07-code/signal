// Persian number formatting utilities.

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianNum(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function fmtPrice(value: number | string | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "—";
  // Auto-adjust decimals for tiny forex values
  const d = Math.abs(num) < 10 ? Math.max(digits, 4) : digits;
  return num.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function timeAgoFa(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "لحظاتی پیش";
  if (min < 60) return `${toPersianNum(min)} دقیقه پیش`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${toPersianNum(hr)} ساعت پیش`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${toPersianNum(day)} روز پیش`;
  const mo = Math.floor(day / 30);
  return `${toPersianNum(mo)} ماه پیش`;
}