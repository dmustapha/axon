'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useMarketPrices, useMarketSpecs } from '@/hooks/use-market-data';
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
  if (!y) return 0;
  return ((m - y) / y) * 100;
}

function formatPrice(val: string): string {
  const n = parseFloat(val);
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toPrecision(4);
}

function formatVolume(val: string): string {
  const n = parseFloat(val);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

export function PriceGrid({ category, search, onSelectMarket, selectedMarket }: PriceGridProps) {
  const { prices, getPriceDirection } = useMarketPrices();
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
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
        {prices.size === 0 ? 'Connecting to market data...' : 'No markets match your filter.'}
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Symbol', 'Price', '24h %', 'Funding', 'Volume', 'OI'].map((h) => (
              <th
                key={h}
                style={{
                  position: 'sticky',
                  top: 0,
                  background: 'var(--ax-panel)',
                  textAlign: h === 'Symbol' ? 'left' : 'right',
                  padding: '8px 12px',
                  fontSize: 11,
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
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : undefined,
                  borderBottom: '1px solid rgba(35, 35, 53, 0.4)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--ax-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '';
                }}
              >
                <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13 }}>{p.symbol}</td>
                <td className="ax-mono" style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>
                  {formatPrice(p.mark)}
                </td>
                <td
                  className="ax-mono"
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: 13,
                    color: change >= 0 ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)',
                  }}
                >
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </td>
                <td className="ax-mono" style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                  {(parseFloat(p.funding) * 100).toFixed(4)}%
                </td>
                <td className="ax-mono" style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                  ${formatVolume(p.volume_24h)}
                </td>
                <td className="ax-mono" style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
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
