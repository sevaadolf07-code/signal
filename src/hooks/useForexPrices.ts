import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getForexQuotes } from "@/lib/twelvedata.functions";

export function useForexPrices(
  pairs: string[],
): Record<string, { price: number; change: number } | undefined> {
  const fn = useServerFn(getForexQuotes);
  const key = Array.from(new Set(pairs)).sort().join(",");

  const { data } = useQuery({
    queryKey: ["forex-prices", key],
    queryFn: () => fn({ data: { symbols: key.split(",").filter(Boolean) } }),
    enabled: key.length > 0,
    refetchInterval: 30_000,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

  return data?.quotes ?? {};
}