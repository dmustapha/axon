'use client';

import { useQuery } from '@tanstack/react-query';

interface TrendingToken {
  token: string;
  current_count: number;
  previous_count: number;
  change_percent: number;
}

export function useTrending() {
  return useQuery({
    queryKey: ['elfa', 'trending'],
    queryFn: async (): Promise<TrendingToken[]> => {
      const res = await fetch('/api/elfa?endpoint=/v2/aggregations/trending-tokens&limit=8&timeWindow=24h');
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.tokens || data?.data || []) as TrendingToken[];
    },
    refetchInterval: 60_000,
    staleTime: 60_000,
  });
}
