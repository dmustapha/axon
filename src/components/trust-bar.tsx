'use client';

import { useEffect, useRef, useState } from 'react';

interface TrustBarProps {
  score: number;
  visible: boolean;
}

const MAX_SCORE = 800;

function getTier(score: number): string {
  if (score >= 700) return 'HIGH CONFIDENCE';
  if (score >= 400) return 'MODERATE';
  return 'LOW CONFIDENCE';
}

export function TrustBar({ score, visible }: TrustBarProps) {
  const fillRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef<HTMLSpanElement | null>(null);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!visible || score === 0) return;
    setDisplayScore(score);

    fillRef.current?.animate?.(
      [
        { filter: 'brightness(2)', boxShadow: '0 0 40px rgba(16,185,129,0.4)' },
        { filter: 'brightness(1)', boxShadow: '0 0 0 transparent' },
      ],
      { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );

    valueRef.current?.animate?.(
      [
        { transform: 'scale(1.25)', textShadow: '0 0 16px rgba(52,211,153,0.6)' },
        { transform: 'scale(1)', textShadow: '0 0 0 transparent' },
      ],
      { duration: 500, easing: 'ease-out' },
    );
  }, [score, visible]);

  if (!visible) return null;

  const pct = Math.min((displayScore / MAX_SCORE) * 100, 100);
  const tier = getTier(displayScore);

  return (
    <div className="ax-panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 className="ax-serif" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Trust Score</h4>
        <span style={{
          padding: '3px 12px', borderRadius: 16,
          background: 'var(--ax-gold-dim)',
          border: '1px solid rgba(201,149,58,0.2)',
          color: 'var(--ax-gold)', fontSize: 11, fontWeight: 500,
          fontFamily: 'var(--font-data)',
        }}>
          {tier}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 10 }}>
        <span ref={valueRef} className="ax-mono" style={{ fontSize: 36, fontWeight: 500, lineHeight: 1 }}>
          {displayScore}
        </span>
        <span style={{ color: 'var(--ax-text-muted)', fontSize: 14, marginBottom: 4 }}>/ 800</span>
      </div>

      <div style={{ height: 8, background: 'var(--ax-surface)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
        <div
          ref={fillRef}
          className="ax-fill-bar ax-trust-shimmer"
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 4,
            background: 'linear-gradient(90deg,#059669,#34d399,#fbbf24,#34d399,#059669)',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ax-text-muted)' }}>
        <span>0</span>
        <span>400</span>
        <span style={{ color: 'var(--ax-green-bright)', fontWeight: 500 }}>700</span>
        <span>800</span>
      </div>
    </div>
  );
}
