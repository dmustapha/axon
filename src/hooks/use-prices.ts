'use client';

import { useSyncExternalStore } from 'react';
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  getPriceDirection,
} from '@/stores/price-store';

export function usePrices() {
  const prices = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { prices, getPriceDirection };
}
