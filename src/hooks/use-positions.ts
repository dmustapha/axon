'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { POSITION_POLL_INTERVAL } from '@/lib/constants';
import type { Position } from '@/types';

export function usePositions() {
  return useQuery({
    queryKey: queryKeys.positions.list,
    queryFn: async (): Promise<Position[]> => {
      const res = await fetch('/api/positions');
      if (!res.ok) return [];
      const data = await res.json();
      return (data.positions || data || []) as Position[];
    },
    refetchInterval: POSITION_POLL_INTERVAL,
    staleTime: POSITION_POLL_INTERVAL,
  });
}
