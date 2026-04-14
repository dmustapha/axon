'use client';

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
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--ax-border)' }}>
      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 2 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => onCategoryChange(c.value)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: category === c.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: category === c.value ? 'var(--ax-blue)' : 'var(--ax-text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search markets..."
        style={{
          marginLeft: 'auto',
          width: 160,
          height: 32,
          padding: '0 10px',
          borderRadius: 6,
          background: 'var(--ax-surface)',
          border: '1px solid var(--ax-border)',
          color: 'var(--ax-text)',
          fontSize: 12,
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </div>
  );
}
