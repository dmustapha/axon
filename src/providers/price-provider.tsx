'use client';

import { useEffect } from 'react';
import { useWS } from '@/providers/ws-provider';
import { initPriceListener } from '@/stores/price-store';

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const { subscribe, unsubscribe, addListener } = useWS();

  useEffect(() => {
    return initPriceListener(subscribe, unsubscribe, addListener);
  }, [subscribe, unsubscribe, addListener]);

  return <>{children}</>;
}
