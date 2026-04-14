'use client';

import { useEffect, useRef } from 'react';
import type { CheckDetail } from '@/types';

const CHECK_LABELS: Record<string, string> = {
  'Price Action': 'Market Pressure',
  'Sentiment': 'Social Intelligence',
  'Position Context': 'Risk Assessment',
};

interface QualityChecksProps {
  checks: CheckDetail[];
}

export function QualityChecks({ checks }: QualityChecksProps) {
  const fillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animatedRef = useRef<Set<number>>(new Set());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (checks.length === 0) {
      animatedRef.current.clear();
      fillRefs.current.forEach((el) => {
        if (el) el.style.width = '0%';
      });
      return;
    }

    checks.forEach((check, i) => {
      if (animatedRef.current.has(i)) return;
      const fill = fillRefs.current[i];
      if (!fill) return;

      animatedRef.current.add(i);
      const pct = check.score;
      const t = setTimeout(() => {
        fill.style.width = `${pct}%`;
        fill.style.background = check.passed ? '#10b981' : '#f87171';
      }, i * 200);
      timersRef.current.push(t);
    });

    return () => timersRef.current.forEach(clearTimeout);
  }, [checks]);

  const passed = checks.filter((c) => c.passed).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
          Confidence Assessment
        </h4>
        <span className="ax-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-green-bright)' }}>
          {checks.length > 0 ? `${passed}/${checks.length}` : '—'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {checks.map((check, i) => (
          <div key={check.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: 'var(--ax-text-sec)' }}>
                {CHECK_LABELS[check.name] || check.name}
              </span>
              <span
                className="ax-mono"
                style={{ fontSize: 12, color: check.passed ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}
              >
                {check.score}%
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--ax-surface)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                ref={(el) => { fillRefs.current[i] = el; }}
                className="ax-fill-bar"
                style={{ height: '100%', width: '0%', borderRadius: 3 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
