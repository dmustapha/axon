'use client';

import { useMemo, useRef, useEffect } from 'react';
import { usePrices } from '@/hooks/use-prices';
import { useMarketSpecs } from '@/hooks/use-market-data';
import { formatPrice, formatVolume } from '@/lib/format';
import type { MarketCategory, MarketPrice } from '@/types';
import { getCategory } from '@/lib/constants';

interface PriceGridProps {
  category: MarketCategory | 'all';
  search: string;
  onSelectMarket: (symbol: string) => void;
  selectedMarket: string | null;
}

function pctChange(mark: string, yesterday: string): number {
  const m = parseFloat(mark);
  const y = parseFloat(yesterday);
  if (!y || !m) return 0;
  const pct = ((m - y) / y) * 100;
  // Pacifica testnet returns yesterday_price=1 for low-activity markets
  if (Math.abs(pct) > 100) return 0;
  return pct;
}

export function PriceGrid({ category, search, onSelectMarket, selectedMarket }: PriceGridProps) {
  const { prices, getPriceDirection } = usePrices();
  const { data: specs } = useMarketSpecs();
  const flashRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Filter and sort
  const rows = useMemo(() => {
    const arr = Array.from(prices.values());
    return arr
      .filter((p) => {
        if (category !== 'all' && getCategory(p.symbol) !== category) return false;
        if (search && !p.symbol.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => parseFloat(b.volume_24h) - parseFloat(a.volume_24h));
  }, [prices, category, search]);

  // Cleanup flash timeouts on unmount
  useEffect(() => {
    return () => {
      for (const t of flashRefs.current.values()) clearTimeout(t);
      flashRefs.current.clear();
    };
  }, []);

  // Flash animation on price change
  useEffect(() => {
    for (const p of rows) {
      const dir = getPriceDirection(p.symbol, p.mark);
      if (dir === 'none') continue;
      const row = rowRefs.current.get(p.symbol);
      if (!row) continue;

      // Clear previous flash
      const prev = flashRefs.current.get(p.symbol);
      if (prev) clearTimeout(prev);

      row.classList.remove('ax-flash-up', 'ax-flash-down');
      // Force reflow
      void row.offsetWidth;
      row.classList.add(dir === 'up' ? 'ax-flash-up' : 'ax-flash-down');

      flashRefs.current.set(
        p.symbol,
        setTimeout(() => row.classList.remove('ax-flash-up', 'ax-flash-down'), 600),
      );
    }
  }, [rows, getPriceDirection]);

  if (!rows.length) {
    if (prices.size === 0) {
      return (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="ax-skeleton" style={{ height: 28, width: '100%' }} />
          ))}
        </div>
      );
    }
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
        No markets match your filter.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Symbol', 'Price', '24h %', 'Funding', 'Vol', 'Open Int.'].map((h) => (
              <th
                key={h}
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  background: 'var(--ax-panel)',
                  textAlign: h === 'Symbol' ? 'left' : 'right',
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
          {rows.map((p) => {
            const change = pctChange(p.mark, p.yesterday_price);
            const isSelected = p.symbol === selectedMarket;
            return (
              <tr
                key={p.symbol}
                ref={(el) => { if (el) rowRefs.current.set(p.symbol, el); }}
                onClick={() => onSelectMarket(p.symbol)}
                className={`ax-row-hover ${isSelected ? 'ax-row-selected' : ''}`}
                style={{
                  cursor: 'pointer',
                  borderBottom: '1px solid hsla(25, 6%, 15%, 0.4)',
                }}
              >
                <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 12 }}>{p.symbol}</td>
                <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12 }}>
                  {formatPrice(p.mark)}
                </td>
                <td
                  className={`ax-mono ${change >= 0 ? 'ax-glow-green' : 'ax-glow-red'}`}
                  style={{
                    padding: '6px 10px',
                    textAlign: 'right',
                    fontSize: 12,
                  }}
                >
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </td>
                <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 11, color: 'var(--ax-text-sec)' }}>
                  {(parseFloat(p.funding) * 100).toFixed(4)}%
                </td>
                <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 11, color: 'var(--ax-text-sec)' }}>
                  ${formatVolume(p.volume_24h)}
                </td>
                <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 11, color: 'var(--ax-text-sec)' }}>
                  ${formatVolume(p.open_interest)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
