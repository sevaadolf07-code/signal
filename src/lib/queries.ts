import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Signal = {
  id: string;
  pair: string;
  market_type: "crypto" | "forex";
  direction: "buy" | "sell";
  entry_price: number;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  sl: number;
  note: string | null;
  status: "active" | "tp1" | "tp2" | "tp3" | "sl" | "closed";
  created_at: string;
  closed_at: string | null;
};

export type Tweet = {
  id: string;
  content: string;
  created_at: string;
};

export const signalsQuery = queryOptions({
  queryKey: ["signals"],
  queryFn: async (): Promise<Signal[]> => {
    const { data, error } = await supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Signal[];
  },
});

export const tweetsQuery = queryOptions({
  queryKey: ["tweets"],
  queryFn: async (): Promise<Tweet[]> => {
    const { data, error } = await supabase
      .from("tweets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Tweet[];
  },
});