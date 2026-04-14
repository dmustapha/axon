'use client';

import type { TradeSuggestion } from '@/types';

interface TradeSuggestionCardProps {
  suggestion: TradeSuggestion;
  onExecute: (suggestion: TradeSuggestion) => void;
}

export function TradeSuggestionCard({ suggestion, onExecute }: TradeSuggestionCardProps) {
  const isLong = suggestion.side === 'long';

  return (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        background: isLong ? 'var(--ax-green-dim)' : 'var(--ax-red-dim)',
        border: `1px solid ${isLong ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: isLong ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}>
          {suggestion.side.toUpperCase()} {suggestion.symbol}
        </span>
        <span className="ax-mono" style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
          {(suggestion.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[
          { label: 'Entry', value: suggestion.entry },
          { label: 'TP', value: suggestion.takeProfit, color: 'var(--ax-green-bright)' },
          { label: 'SL', value: suggestion.stopLoss, color: 'var(--ax-red-bright)' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>{label}</div>
            <div className="ax-mono" style={{ fontSize: 12, color: color || 'var(--ax-text)' }}>${value}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'var(--ax-text-sec)', margin: '0 0 8px' }}>{suggestion.reasoning}</p>

      <button
        onClick={() => onExecute(suggestion)}
        style={{
          width: '100%',
          padding: '6px 0',
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          background: isLong ? 'var(--ax-green)' : 'var(--ax-red)',
          color: '#fff',
        }}
      >
        Execute Trade
      </button>
    </div>
  );
}
