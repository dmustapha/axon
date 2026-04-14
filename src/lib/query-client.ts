import { QueryClient } from '@tanstack/react-query';
import type { MarketCategory } from '@/types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  markets: {
    all: ['markets'] as const,
    specs: ['markets', 'specs'] as const,
    prices: ['markets', 'prices'] as const,
    byCategory: (cat: MarketCategory) => ['markets', 'category', cat] as const,
  },
  positions: {
    all: ['positions'] as const,
    list: ['positions', 'list'] as const,
  },
  copilot: {
    all: ['copilot'] as const,
  },
  elfa: {
    trending: ['elfa', 'trending'] as const,
    mentions: (ticker: string) => ['elfa', 'mentions', ticker] as const,
  },
};
