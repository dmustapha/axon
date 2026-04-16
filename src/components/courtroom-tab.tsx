'use client';

import { useEffect, useRef } from 'react';
import { useCourtroom } from '@/hooks/use-courtroom';
import { usePositions } from '@/hooks/use-positions';
import { JudgePanel } from './judge-panel';
import { QualityChecks } from './quality-checks';
import { VerdictBanner } from './verdict-banner';
import { TrustBar } from './trust-bar';
import type { Position } from '@/types';

interface CourtroomTabProps {
  externalPosition?: Position | null;
  copilotContext?: string;
}

export function CourtroomTab({ externalPosition, copilotContext }: CourtroomTabProps) {
  const { state, analyzeLiquidation, reset } = useCourtroom();
  const { data: positions } = usePositions();

  // Find positions near liquidation (< 15% margin)
  const atRiskPositions = (positions || []).filter((p) => p.margin_ratio < 15);

  const autoStartedRef = useRef<string | null>(null);

  function handleAnalyze(position: Position) {
    reset();
    analyzeLiquidation(position, copilotContext);
  }

  // Auto-start if external position passed (useEffect prevents render-time side effects)
  useEffect(() => {
    if (externalPosition && state.phase === 'idle' && autoStartedRef.current !== `${externalPosition.symbol}-${externalPosition.side}`) {
      autoStartedRef.current = `${externalPosition.symbol}-${externalPosition.side}`;
      reset();
      analyzeLiquidation(externalPosition, copilotContext);
    }
  }, [externalPosition, state.phase, reset, analyzeLiquidation, copilotContext]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, height: '100%', overflowY: 'auto' }}>
      {/* Position Selector (only when idle) */}
      {state.phase === 'idle' && (
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Select Position to Analyze
          </h4>
          {atRiskPositions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {atRiskPositions.map((p, i) => (
                <button
                  key={`${p.symbol}-${i}`}
                  onClick={() => handleAnalyze(p)}
                  className="ax-row-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--ax-surface)',
                    border: '1px solid var(--ax-border)',
                    color: 'var(--ax-text)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    boxShadow: 'inset 0 1px 2px hsla(25, 20%, 2%, 0.4)',
                  }}
                >
                  <span>
                    <strong>{p.symbol}</strong>{' '}
                    <span style={{ color: p.side === 'long' ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}>
                      {p.side.toUpperCase()}
                    </span>
                  </span>
                  <span style={{ color: 'var(--ax-red-bright)', fontWeight: 600 }}>
                    {(p.margin_ratio ?? 0).toFixed(1)}% margin
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
              {(positions || []).length > 0
                ? 'No positions near liquidation. Select any position from the Positions panel using the Analyze button.'
                : 'Place a trade first, then analyze your position here for manipulation detection.'}
            </div>
          )}
        </div>
      )}

      {/* Judge Panel (active during analysis) */}
      {state.phase !== 'idle' && (
        <>
          {/* Position being analyzed */}
          {state.position && (
            <div style={{
              padding: 10,
              borderRadius: 8,
              background: 'var(--ax-surface)',
              border: '1px solid var(--ax-border)',
              fontSize: 12,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>
                <strong>{state.position.symbol}</strong>{' '}
                <span style={{ color: state.position.side === 'long' ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}>
                  {state.position.side.toUpperCase()}
                </span>{' '}
                {state.position.leverage}x
              </span>
              <span className="ax-mono" style={{ color: 'var(--ax-text-sec)' }}>
                Margin: {(state.position.margin_ratio ?? 0).toFixed(1)}%
              </span>
            </div>
          )}

          {/* Evidence progress */}
          {(state.phase === 'evidence' || state.phase === 'analysis') && (
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--ax-surface)', border: '1px solid var(--ax-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                {state.phase === 'evidence' ? 'Collecting Evidence' : 'Analyzing Evidence'}
              </div>
              {['Price Action', 'Social Sentiment', 'Position Context'].map((item, i) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div
                    className="ax-dot-pulse"
                    style={{
                      background: state.phase === 'analysis' || i < 2 ? 'var(--ax-green)' : 'var(--ax-border)',
                      animation: state.phase === 'evidence' && i >= 2 ? 'none' : undefined,
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--ax-text-sec)' }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          <JudgePanel phase={state.phase} narration={state.narration}>
            {state.checks.length > 0 && <QualityChecks checks={state.checks} />}
            <VerdictBanner verdict={state.verdict} recommendation={state.recommendation} />
          </JudgePanel>

          <TrustBar score={state.trustScore} visible={state.phase === 'verdict' || state.phase === 'complete'} />

          {/* Reset button */}
          {state.phase === 'complete' && (
            <button
              onClick={reset}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                border: '1px solid var(--ax-border)',
                background: 'transparent',
                color: 'var(--ax-text-sec)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                alignSelf: 'center',
              }}
            >
              Analyze Another Position
            </button>
          )}
        </>
      )}
    </div>
  );
}
