'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { WSProvider } from '@/providers/ws-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WSProvider>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#111119',
              border: '1px solid #232335',
              color: '#eaeaf2',
            },
          }}
        />
      </WSProvider>
    </QueryClientProvider>
  );
}
