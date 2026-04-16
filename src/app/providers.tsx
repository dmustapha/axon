'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { WSProvider } from '@/providers/ws-provider';
import { PriceProvider } from '@/providers/price-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from 'sonner';
import { WalletProvider } from '@/providers/wallet-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <WSProvider>
          <PriceProvider>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: 'hsl(25, 12%, 7%)',
                border: '1px solid hsl(25, 6%, 15%)',
                color: 'hsl(30, 12%, 90%)',
              },
            }}
          />
        </PriceProvider>
        </WSProvider>
      </ErrorBoundary>
    </QueryClientProvider>
    </WalletProvider>
  );
}
