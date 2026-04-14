'use client';

import { useEffect, useRef } from 'react';
import type { Verdict } from '@/types';

interface VerdictBannerProps {
  verdict: Verdict | null;
  recommendation: string;
}

export function VerdictBanner({ verdict, recommendation }: VerdictBannerProps) {
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!verdict || !bannerRef.current) return;
    bannerRef.current.animate?.(
      [
        { transform: 'scale(0.85) translateY(6px)', opacity: 0 },
        { transform: 'scale(1.02) translateY(-2px)', opacity: 1 },
        { transform: 'scale(1) translateY(0)', opacity: 1 },
      ],
      { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
    );
  }, [verdict]);

  if (!verdict) return null;

  const isMarket = verdict === 'market_driven';
  const bg = isMarket ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
  const border = isMarket ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)';
  const color = isMarket ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)';
  const label = isMarket ? 'MARKET-DRIVEN' : 'MANIPULATION SUSPECTED';

  return (
    <div
      ref={bannerRef}
      style={{ borderRadius: 12, background: bg, border: `1px solid ${border}`, padding: '14px 18px', textAlign: 'center' }}
    >
      <span
        className="ax-verdict-large"
        style={{ background: 'var(--ax-gold-dim)', color: 'var(--ax-gold)', border: '1px solid rgba(201,149,58,0.25)' }}
      >
        {label}
      </span>
      <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ax-text-sec)' }}>
        {recommendation}
      </div>
    </div>
  );
}
