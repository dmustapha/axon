'use client';

import { useMarketSpecs } from '@/hooks/use-market-data';
import type { MarketCategory } from '@/types';

const CATEGORIES: { label: string; value: MarketCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Stocks', value: 'stocks' },
  { label: 'Forex', value: 'forex' },
  { label: 'Commodities', value: 'commodities' },
  { label: 'Spot', value: 'spot' },
];

interface MarketSelectorProps {
  category: MarketCategory | 'all';
  onCategoryChange: (cat: MarketCategory | 'all') => void;
  search: string;
  onSearchChange: (q: string) => void;
}

export function MarketSelector({ category, onCategoryChange, search, onSearchChange }: MarketSelectorProps) {
  const { data: specs } = useMarketSpecs();
  return (
    <div className="ax-section-header" style={{ padding: '10px 12px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>Markets</h2>
        <span style={{ fontSize: 10, color: 'var(--ax-text-muted)' }}>{specs?.length ?? '—'} pairs</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => onCategoryChange(c.value)}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: category === c.value ? 600 : 400,
              borderRadius: 4,
              border: category === c.value ? '1px solid hsla(35, 90%, 55%, 0.2)' : '1px solid transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: category === c.value ? 'var(--ax-accent-dim)' : 'transparent',
              color: category === c.value ? 'var(--ax-accent)' : 'var(--ax-text-muted)',
              transition: 'color 150ms',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search markets..."
        className="ax-input"
        style={{ height: 30, fontSize: 12 }}
      />
    </div>
  );
}
