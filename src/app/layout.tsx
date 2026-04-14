import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AXON — AI Trading Terminal for Pacifica',
  description: 'AI-powered perpetuals trading terminal with social intelligence copilot and liquidation courtroom.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
