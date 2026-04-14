'use client';

import { usePositions } from '@/hooks/use-positions';
import { useMarketPrices } from '@/hooks/use-market-data';
import type { Position } from '@/types';

interface PositionDisplayProps {
  onAnalyze: (position: Position) => void;
}

function formatPnl(pnl: string): { text: string; color: string } {
  const n = parseFloat(pnl);
  if (n >= 0) return { text: `+$${n.toFixed(2)}`, color: 'var(--ax-green-bright)' };
  return { text: `-$${Math.abs(n).toFixed(2)}`, color: 'var(--ax-red-bright)' };
}

export function PositionDisplay({ onAnalyze }: PositionDisplayProps) {
  const { data: positions, isLoading } = usePositions();
  const { prices } = useMarketPrices();

  // Merge live prices with positions
  const enriched = (positions || []).map((p) => {
    const live = prices.get(p.symbol);
    if (!live) return p;
    const mark = parseFloat(live.mark);
    const entry = parseFloat(p.entry_price);
    const size = parseFloat(p.size);
    const pnl = p.side === 'long' ? (mark - entry) * size : (entry - mark) * size;
    return { ...p, mark_price: live.mark, unrealized_pnl: pnl.toFixed(2) };
  });

  if (isLoading) {
    return <div style={{ padding: 16, color: 'var(--ax-text-muted)', fontSize: 13 }}>Loading positions...</div>;
  }

  if (!enriched.length) {
    return <div style={{ padding: 16, color: 'var(--ax-text-muted)', fontSize: 13 }}>No open positions</div>;
  }

  return (
    <div style={{ overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Market', 'Side', 'Size', 'Entry', 'Mark', 'PnL', 'Margin %', ''].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: h === 'Market' || h === 'Side' ? 'left' : 'right',
                  padding: '6px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--ax-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderBottom: '1px solid var(--ax-border)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enriched.map((p, i) => {
            const pnl = formatPnl(p.unrealized_pnl);
            const isNearLiq = p.margin_ratio < 15;
            return (
              <tr
                key={`${p.symbol}-${p.side}-${i}`}
                style={{ borderBottom: '1px solid rgba(35, 35, 53, 0.4)' }}
              >
                <td style={{ padding: '8px 10px', fontWeight: 600, fontSize: 12 }}>{p.symbol}</td>
                <td
                  style={{
                    padding: '8px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: p.side === 'long' ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)',
                  }}
                >
                  {p.side.toUpperCase()}
                </td>
                <td className="ax-mono" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>
                  {p.size}
                </td>
                <td className="ax-mono" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                  {parseFloat(p.entry_price).toFixed(2)}
                </td>
                <td className="ax-mono" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>
                  {parseFloat(p.mark_price).toFixed(2)}
                </td>
                <td className="ax-mono" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: pnl.color }}>
                  {pnl.text}
                </td>
                <td
                  className="ax-mono"
                  style={{
                    padding: '8px 10px',
                    textAlign: 'right',
                    fontSize: 12,
                    color: isNearLiq ? 'var(--ax-red-bright)' : 'var(--ax-text-sec)',
                    fontWeight: isNearLiq ? 600 : 400,
                  }}
                >
                  {p.margin_ratio.toFixed(1)}%
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                  <button
                    onClick={() => onAnalyze(p)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 500,
                      borderRadius: 4,
                      border: '1px solid var(--ax-gold)',
                      background: 'var(--ax-gold-dim)',
                      color: 'var(--ax-gold)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Analyze
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
