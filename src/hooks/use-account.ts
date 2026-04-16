'use client';

import { useQuery } from '@tanstack/react-query';

interface AccountData {
  balance: string | null;
  equity: string | null;
  fee_level: number | null;
  margin_used: string | null;
}

export function useAccount() {
  return useQuery({
    queryKey: ['account', 'info'],
    queryFn: async (): Promise<AccountData> => {
      const res = await fetch('/api/account');
      if (!res.ok) throw new Error(`Failed to fetch account (${res.status})`);
      return res.json();
    },
    refetchInterval: 10_000,
    staleTime: 10_000,
  });
}
