'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CourtroomPhase } from '@/types';

interface JudgePanelProps {
  phase: CourtroomPhase;
  narration: string;
  children: ReactNode;
}

export function JudgePanel({ phase, narration, children }: JudgePanelProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!narration) {
      setDisplayedText('');
      setShowCursor(false);
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedText(narration);
      setShowCursor(false);
      return;
    }

    setShowCursor(true);
    setDisplayedText('');
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setDisplayedText(narration.slice(0, i));
      if (i >= narration.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setShowCursor(false);
      }
    }, 22);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [narration]);

  const courtStatus =
    phase === 'filing' ? 'Case filed'
    : phase === 'evidence' ? 'Gathering evidence...'
    : phase === 'analysis' ? 'Analyzing evidence...'
    : phase === 'deliberation' ? 'Delivering opinion...'
    : phase === 'quality_checks' ? 'Assessing confidence...'
    : phase === 'verdict' ? 'Rendering verdict'
    : phase === 'complete' ? 'Case closed'
    : 'Awaiting case';

  return (
    <article
      className="ax-panel ax-judge-glow ax-judge-pulse"
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--ax-gold-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            ⚖️
          </div>
          <div>
            <h3 className="ax-serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ax-gold)', margin: 0 }}>
              The Judge
            </h3>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              AI Liquidation Arbiter · {courtStatus}
            </span>
          </div>
        </div>
        {phase !== 'idle' && (
          <span style={{
            padding: '3px 12px', borderRadius: 16,
            background: 'var(--ax-gold-dim)',
            border: '1px solid rgba(201,149,58,0.25)',
            color: 'var(--ax-gold)', fontSize: 11, fontWeight: 600, letterSpacing: '.06em',
          }}>
            PRESIDING
          </span>
        )}
      </div>

      {/* Children: QualityChecks + VerdictBanner */}
      {children}

      {/* Judge Narration */}
      {(phase !== 'idle') && (
        <div>
          <p style={{ fontSize: 10, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6, margin: 0 }}>
            Judge's Opinion
          </p>
          <div className="ax-judge-box">
            <div className="ax-judge-text">
              {displayedText || (phase === 'filing' ? 'Case filed. Reviewing evidence...' : '...')}
              {showCursor && <span className="ax-typewriter-cursor" />}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
