'use client';

import { useOrderbook } from '@/hooks/use-orderbook';
import { formatPrice, formatVolume } from '@/lib/format';

interface OrderbookDisplayProps {
  symbol: string | null;
}

export function OrderbookDisplay({ symbol }: OrderbookDisplayProps) {
  const data = useOrderbook(symbol);

  if (!data || (!data.bids.length && !data.asks.length)) {
    if (symbol) {
      return (
        <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="ax-skeleton" style={{ height: 18, width: '100%' }} />
          ))}
        </div>
      );
    }
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 12 }}>
        Select a market
      </div>
    );
  }

  const maxTotal = Math.max(
    data.bids[data.bids.length - 1]?.total || 0,
    data.asks[data.asks.length - 1]?.total || 0,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: 11 }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        padding: '4px 8px',
        fontSize: 9,
        fontWeight: 600,
        color: 'var(--ax-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        <span>Price</span>
        <span style={{ textAlign: 'right' }}>Size</span>
        <span style={{ textAlign: 'right' }}>Total</span>
      </div>

      {/* Asks (reversed — lowest ask at bottom) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', minHeight: 0 }}>
        {[...data.asks].reverse().map((level) => (
          <div
            key={`ask-${level.price}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              padding: '1px 8px',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: `${(level.total / maxTotal) * 100}%`,
              background: 'hsla(355, 70%, 55%, 0.08)',
              pointerEvents: 'none',
            }} />
            <span className="ax-mono" style={{ color: 'var(--ax-red-bright)', position: 'relative' }}>
              {formatOBPrice(level.price)}
            </span>
            <span className="ax-mono" style={{ textAlign: 'right', color: 'var(--ax-text-sec)', position: 'relative' }}>
              {formatOBSize(level.size)}
            </span>
            <span className="ax-mono" style={{ textAlign: 'right', color: 'var(--ax-text-muted)', position: 'relative' }}>
              {formatOBSize(level.total)}
            </span>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div style={{
        padding: '4px 8px',
        borderTop: '1px solid var(--ax-border)',
        borderBottom: '1px solid var(--ax-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--ax-surface)',
      }}>
        <span className="ax-mono ax-glow-accent" style={{ fontWeight: 700, fontSize: 13 }}>
          {formatOBPrice(data.midPrice)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--ax-text-muted)' }}>
          Spread: <span className="ax-mono" style={{ color: 'var(--ax-text-sec)' }}>{data.spread.toFixed(2)}</span>
          {' '}(<span className="ax-mono">{data.spreadPct.toFixed(3)}%</span>)
        </span>
      </div>

      {/* Bids */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {data.bids.map((level) => (
          <div
            key={`bid-${level.price}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              padding: '1px 8px',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: `${(level.total / maxTotal) * 100}%`,
              background: 'hsla(145, 65%, 48%, 0.08)',
              pointerEvents: 'none',
            }} />
            <span className="ax-mono" style={{ color: 'var(--ax-green-bright)', position: 'relative' }}>
              {formatOBPrice(level.price)}
            </span>
            <span className="ax-mono" style={{ textAlign: 'right', color: 'var(--ax-text-sec)', position: 'relative' }}>
              {formatOBSize(level.size)}
            </span>
            <span className="ax-mono" style={{ textAlign: 'right', color: 'var(--ax-text-muted)', position: 'relative' }}>
              {formatOBSize(level.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const formatOBPrice = (n: number) => formatPrice(n);
const formatOBSize = (n: number) => formatVolume(n);
