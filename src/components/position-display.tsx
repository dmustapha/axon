'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { usePositions } from '@/hooks/use-positions';
import { usePrices } from '@/hooks/use-prices';
import { OrderHistory } from '@/components/order-history';
import { calcPnl } from '@/lib/pnl';
import type { Position } from '@/types';

interface PositionDisplayProps {
  onAnalyze: (position: Position) => void;
}

function formatPnl(pnl: string): { text: string; color: string } {
  const n = parseFloat(pnl);
  if (isNaN(n)) return { text: '$0.00', color: 'var(--ax-text-sec)' };
  if (n >= 0) return { text: `+$${n.toFixed(2)}`, color: 'var(--ax-green-bright)' };
  return { text: `-$${Math.abs(n).toFixed(2)}`, color: 'var(--ax-red-bright)' };
}

export function PositionDisplay({ onAnalyze }: PositionDisplayProps) {
  const [tab, setTab] = useState<'positions' | 'orders'>('positions');
  const { data: positions, isLoading } = usePositions();
  const { prices } = usePrices();
  const queryClient = useQueryClient();

  const enriched = useMemo(() => (positions || []).map((p) => {
    const live = prices.get(p.symbol);
    if (!live) return p;
    const pnl = calcPnl(p.side, parseFloat(live.mark), parseFloat(p.entry_price), parseFloat(p.size));
    return { ...p, mark_price: live.mark, unrealized_pnl: pnl.toFixed(2) };
  }), [positions, prices]);

  const [closingId, setClosingId] = useState<string | null>(null);

  async function handleClose(p: Position) {
    const id = `${p.symbol}-${p.side}`;
    setClosingId(id);
    try {
      const closeSide = p.side === 'long' ? 'ask' : 'bid';
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: p.symbol, side: closeSide, amount: p.size,
          order_type: 'market', reduce_only: true, client_order_id: crypto.randomUUID(),
          slippage_percent: '1',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Closing ${p.symbol} position`);
        queryClient.invalidateQueries({ queryKey: ['positions'] });
      } else {
        toast.error(`Failed to close position: ${data?.message || 'Unknown error'}`);
      }
    } catch {
      toast.error('Failed to close position');
    } finally {
      setClosingId(null);
    }
  }

  const posCount = enriched.length;

  const tabBar = (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--ax-border)', flexShrink: 0 }}>
      {(['positions', 'orders'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          style={{
            flex: 1, padding: '6px 0', fontSize: 10, fontWeight: tab === t ? 600 : 500,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: tab === t ? 'var(--ax-text)' : 'var(--ax-text-muted)',
            borderBottom: tab === t ? '2px solid var(--ax-accent)' : '2px solid transparent',
            transition: 'color 150ms',
          }}
        >
          {t === 'positions' ? `Positions (${posCount})` : 'Orders'}
        </button>
      ))}
    </div>
  );

  if (tab === 'orders') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {tabBar}
        <OrderHistory />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {tabBar}
        <div style={{ padding: 16, color: 'var(--ax-text-muted)', fontSize: 12 }}>Loading positions...</div>
      </div>
    );
  }

  if (!posCount) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {tabBar}
        <div style={{ padding: 16, color: 'var(--ax-text-muted)', fontSize: 12 }}>No open positions — place a trade to get started</div>
      </div>
    );
  }

  // Calculate total PnL
  const totalPnl = enriched.reduce((sum, p) => sum + parseFloat(p.unrealized_pnl || '0'), 0);
  const totalFmt = formatPnl(totalPnl.toFixed(2));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {tabBar}
      <div style={{ overflowX: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Market', 'Side', 'Size', 'Entry', 'Mark', 'PnL', 'Margin %', ''].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: h === 'Market' || h === 'Side' ? 'left' : 'right',
                  padding: '5px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--ax-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
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
            const isNearLiq = (p.margin_ratio ?? 100) < 15;
            return (
              <tr
                key={`${p.symbol}-${p.side}-${i}`}
                className="ax-row-hover"
                style={{ borderTop: '1px solid hsla(25, 6%, 15%, 0.4)' }}
              >
                <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 12 }}>{p.symbol}</td>
                <td style={{ padding: '6px 10px', fontSize: 12 }}>
                  <span className={`ax-badge ${p.side === 'long' ? 'ax-badge-green' : 'ax-badge-red'}`}>
                    {p.side.toUpperCase()}
                  </span>
                  {' '}
                  <span style={{ fontSize: 10, color: 'var(--ax-text-muted)' }}>{p.leverage}x</span>
                </td>
                <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12 }}>
                  ${parseFloat(p.size).toLocaleString()}
                </td>
                <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                  ${(parseFloat(p.entry_price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12 }}>
                  ${(parseFloat(p.mark_price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className={`ax-mono ${parseFloat(p.unrealized_pnl) >= 0 ? 'ax-glow-green' : 'ax-glow-red'}`} style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                  {pnl.text}
                </td>
                <td
                  className="ax-mono"
                  style={{
                    padding: '6px 10px',
                    textAlign: 'right',
                    fontSize: 12,
                    color: isNearLiq ? 'var(--ax-red-bright)' : 'var(--ax-text-sec)',
                    fontWeight: isNearLiq ? 700 : 400,
                  }}
                >
                  {(p.margin_ratio ?? 0).toFixed(1)}%
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleClose(p)}
                    disabled={closingId === `${p.symbol}-${p.side}`}
                    className="ax-badge ax-badge-red"
                    style={{
                      border: '1px solid hsla(355, 70%, 55%, 0.2)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      opacity: closingId === `${p.symbol}-${p.side}` ? 0.5 : 1,
                      transition: 'background-color 150ms',
                    }}
                  >
                    {closingId === `${p.symbol}-${p.side}` ? '...' : 'Close'}
                  </button>
                  <button
                    onClick={() => onAnalyze(p)}
                    className="ax-badge ax-badge-gold ax-btn-analyze"
                    style={{
                      border: '1px solid hsla(42, 85%, 58%, 0.2)',
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
    </div>
  );
}
