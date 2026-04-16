'use client';

import { useMemo, useState } from 'react';
import { usePrices } from '@/hooks/use-prices';
import { useMarketSpecs } from '@/hooks/use-market-data';
import { formatPrice as fmtPrice, formatCompact } from '@/lib/format';

type SortKey = 'change' | 'volume' | 'funding' | 'oi';

export function AnalyticsView() {
  const { prices } = usePrices();
  const { data: specs } = useMarketSpecs();
  const [sortBy, setSortBy] = useState<SortKey>('volume');

  const markets = useMemo(() => {
    const arr = Array.from(prices.values()).map((p) => {
      const mark = parseFloat(p.mark);
      const yesterday = parseFloat(p.yesterday_price);
      const change = yesterday ? ((mark - yesterday) / yesterday) * 100 : 0;
      const vol = parseFloat(p.volume_24h);
      const oi = parseFloat(p.open_interest);
      const funding = parseFloat(p.funding) * 100;
      return { ...p, change, vol, oi, funding, mark };
    });

    arr.sort((a, b) => {
      if (sortBy === 'change') return Math.abs(b.change) - Math.abs(a.change);
      if (sortBy === 'volume') return b.vol - a.vol;
      if (sortBy === 'funding') return Math.abs(b.funding) - Math.abs(a.funding);
      return b.oi - a.oi;
    });

    return arr;
  }, [prices, sortBy]);

  const topGainers = useMemo(() => [...markets].sort((a, b) => b.change - a.change).slice(0, 5), [markets]);
  const topLosers = useMemo(() => [...markets].sort((a, b) => a.change - b.change).slice(0, 5), [markets]);
  const highFunding = useMemo(() => [...markets].sort((a, b) => Math.abs(b.funding) - Math.abs(a.funding)).slice(0, 5), [markets]);
  const totalVol = useMemo(() => markets.reduce((s, m) => s + m.vol, 0), [markets]);
  const totalOI = useMemo(() => markets.reduce((s, m) => s + m.oi, 0), [markets]);
  const avgFunding = useMemo(() => markets.length ? markets.reduce((s, m) => s + m.funding, 0) / markets.length : 0, [markets]);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
      {/* Overview Stats */}
      <div className="ax-stat-grid">
        <OverviewCard label="Total Markets" value={`${markets.length}`} sub={`${specs?.length || 0} available`} />
        <OverviewCard label="24h Volume" value={`$${formatBig(totalVol)}`} />
        <OverviewCard label="Total Open Interest" value={`$${formatBig(totalOI)}`} />
        <OverviewCard label="Avg Funding Rate" value={`${avgFunding.toFixed(4)}%`} glow={avgFunding >= 0 ? 'green' : 'red'} />
      </div>

      {/* Top Movers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* Top Gainers */}
        <div className="ax-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ax-section-header">
            <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-green-bright)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
              Top Gainers
            </h3>
          </div>
          <div style={{ padding: '4px 0' }}>
            {topGainers.map((m) => (
              <MoverRow key={m.symbol} symbol={m.symbol} value={`+${m.change.toFixed(2)}%`} price={m.mark} glow="green" />
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="ax-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ax-section-header">
            <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-red-bright)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
              Top Losers
            </h3>
          </div>
          <div style={{ padding: '4px 0' }}>
            {topLosers.map((m) => (
              <MoverRow key={m.symbol} symbol={m.symbol} value={`${m.change.toFixed(2)}%`} price={m.mark} glow="red" />
            ))}
          </div>
        </div>

        {/* High Funding */}
        <div className="ax-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ax-section-header">
            <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-gold)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
              Highest Funding
            </h3>
          </div>
          <div style={{ padding: '4px 0' }}>
            {highFunding.map((m) => (
              <MoverRow key={m.symbol} symbol={m.symbol} value={`${m.funding.toFixed(4)}%`} price={m.mark} glow={m.funding >= 0 ? 'green' : 'red'} />
            ))}
          </div>
        </div>
      </div>

      {/* Volume Distribution Bar Chart */}
      <div className="ax-card" style={{ padding: 16 }}>
        <div className="ax-section-header" style={{ margin: '-16px -16px 12px', padding: '8px 16px' }}>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
            Volume Distribution (24h)
          </h3>
        </div>
        {(() => {
          const top10 = markets.slice(0, 10);
          const maxVol = top10.length > 0 ? top10[0].vol : 1;
          return top10.map((m) => {
            const pct = maxVol > 0 ? (m.vol / maxVol) * 100 : 0;
            return (
              <div key={m.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 50, fontSize: 11, fontWeight: 600 }}>{m.symbol}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--ax-surface)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--ax-blue)', borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
                <span className="ax-mono" style={{ width: 70, fontSize: 10, textAlign: 'right', color: 'var(--ax-text-sec)' }}>${formatBig(m.vol)}</span>
              </div>
            );
          });
        })()}
      </div>

      {/* Full Market Table */}
      <div className="ax-card" style={{ flex: 1, minHeight: 300, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="ax-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
            All Markets
          </h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { key: 'volume' as const, label: 'Volume' },
              { key: 'change' as const, label: 'Change' },
              { key: 'funding' as const, label: 'Funding' },
              { key: 'oi' as const, label: 'OI' },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                style={{
                  padding: '2px 8px', fontSize: 10, fontWeight: sortBy === s.key ? 600 : 400,
                  borderRadius: 3, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: sortBy === s.key ? 'var(--ax-accent-dim)' : 'transparent',
                  color: sortBy === s.key ? 'var(--ax-accent)' : 'var(--ax-text-muted)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Market', 'Price', '24h Change', 'Funding', 'Volume 24h', 'Open Interest', 'Vol/OI Ratio'].map((h) => (
                  <th key={h} style={{
                    position: 'sticky', top: 0, zIndex: 1, background: 'var(--ax-panel)',
                    textAlign: h === '#' || h === 'Market' ? 'left' : 'right',
                    padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--ax-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--ax-border)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {markets.map((m, i) => {
                const ratio = m.oi > 0 ? m.vol / m.oi : 0;
                return (
                  <tr key={m.symbol} className="ax-row-hover" style={{ borderBottom: '1px solid hsla(25, 6%, 15%, 0.4)' }}>
                    <td style={{ padding: '5px 10px', fontSize: 10, color: 'var(--ax-text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '5px 10px', fontWeight: 600, fontSize: 12 }}>{m.symbol}</td>
                    <td className="ax-mono" style={{ padding: '5px 10px', textAlign: 'right', fontSize: 12 }}>
                      ${formatPrice(m.mark)}
                    </td>
                    <td className={`ax-mono ${m.change >= 0 ? 'ax-glow-green' : 'ax-glow-red'}`} style={{ padding: '5px 10px', textAlign: 'right', fontSize: 12 }}>
                      {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
                    </td>
                    <td className="ax-mono" style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11, color: m.funding >= 0 ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}>
                      {m.funding >= 0 ? '+' : ''}{m.funding.toFixed(4)}%
                    </td>
                    <td className="ax-mono" style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11, color: 'var(--ax-text-sec)' }}>
                      ${formatBig(m.vol)}
                    </td>
                    <td className="ax-mono" style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11, color: 'var(--ax-text-sec)' }}>
                      ${formatBig(m.oi)}
                    </td>
                    <td className="ax-mono" style={{ padding: '5px 10px', textAlign: 'right', fontSize: 11, color: ratio > 3 ? 'var(--ax-gold)' : 'var(--ax-text-muted)' }}>
                      {ratio.toFixed(2)}x
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ label, value, sub, glow }: { label: string; value: string; sub?: string; glow?: 'green' | 'red' }) {
  const glowClass = glow === 'green' ? 'ax-glow-green' : glow === 'red' ? 'ax-glow-red' : '';
  return (
    <div className="ax-card" style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
      <div className={`ax-mono ${glowClass}`} style={{ fontSize: 16, fontWeight: 700, color: glowClass ? undefined : 'var(--ax-text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function MoverRow({ symbol, value, price, glow }: { symbol: string; value: string; price: number; glow: 'green' | 'red' }) {
  return (
    <div className="ax-row-hover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 12 }}>{symbol}</span>
        <span className="ax-mono" style={{ fontSize: 11, color: 'var(--ax-text-sec)' }}>${formatPrice(price)}</span>
      </div>
      <span className={`ax-mono ${glow === 'green' ? 'ax-glow-green' : 'ax-glow-red'}`} style={{ fontSize: 12, fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

const formatBig = (n: number) => formatCompact(n);
const formatPrice = (n: number) => fmtPrice(n);
