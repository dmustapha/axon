'use client';

import { useMemo } from 'react';
import { usePositions } from '@/hooks/use-positions';
import { usePrices } from '@/hooks/use-prices';
import { useAccount } from '@/hooks/use-account';
import { calcPnl } from '@/lib/pnl';

export function PortfolioView() {
  const { data: positions, isLoading } = usePositions();
  const { prices } = usePrices();
  const { data: account } = useAccount();

  const enriched = useMemo(() => {
    return (positions || []).map((p) => {
      const live = prices.get(p.symbol);
      if (!live) return { ...p, currentPnl: parseFloat(p.unrealized_pnl) };
      const pnl = calcPnl(p.side, parseFloat(live.mark), parseFloat(p.entry_price), parseFloat(p.size));
      return { ...p, currentPnl: pnl, mark_price: live.mark };
    });
  }, [positions, prices]);

  const totalPnl = enriched.reduce((s, p) => s + p.currentPnl, 0);
  const totalMargin = enriched.reduce((s, p) => s + parseFloat(p.margin), 0);
  const totalSize = enriched.reduce((s, p) => s + parseFloat(p.size), 0);
  const longCount = enriched.filter((p) => p.side === 'long').length;
  const shortCount = enriched.filter((p) => p.side === 'short').length;

  const accountBalance = account?.balance ? parseFloat(account.balance) : 0;
  const equity = accountBalance + totalPnl;
  const marginUsedPct = equity > 0 ? (totalMargin / equity) * 100 : 0;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
      {/* Account Summary Cards */}
      <div className="ax-stat-grid">
        <StatCard label="Account Equity" value={`$${equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
        <StatCard
          label="Unrealized PnL"
          value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`}
          glow={totalPnl >= 0 ? 'green' : 'red'}
        />
        <StatCard label="Total Exposure" value={`$${totalSize.toLocaleString('en-US', { minimumFractionDigits: 0 })}`} />
        <StatCard
          label="Margin Usage"
          value={`${marginUsedPct.toFixed(1)}%`}
          glow={marginUsedPct > 80 ? 'red' : marginUsedPct > 50 ? 'gold' : 'green'}
        />
      </div>

      {/* Position Breakdown */}
      <div className="ax-breakout-grid">
        {/* Allocation Chart (text-based) */}
        <div className="ax-card" style={{ padding: 16 }}>
          <div className="ax-section-header" style={{ margin: '-16px -16px 12px', padding: '8px 16px' }}>
            <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
              Position Allocation
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="ax-glow-green" style={{ fontSize: 24, fontWeight: 700 }}>{longCount}</div>
              <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Longs</div>
            </div>
            <div style={{ width: 1, background: 'var(--ax-border)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div className="ax-glow-red" style={{ fontSize: 24, fontWeight: 700 }}>{shortCount}</div>
              <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Shorts</div>
            </div>
          </div>
          {/* Bar chart per position */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {enriched.map((p, i) => {
              const pct = totalSize > 0 ? (parseFloat(p.size) / totalSize) * 100 : 0;
              return (
                <div key={`${p.symbol}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 40, fontSize: 11, fontWeight: 600 }}>{p.symbol}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--ax-surface)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, width: `${pct}%`,
                      background: p.side === 'long' ? 'var(--ax-green)' : 'var(--ax-red)',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <span className="ax-mono" style={{ fontSize: 10, color: 'var(--ax-text-sec)', width: 40, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Health */}
        <div className="ax-card" style={{ padding: 16 }}>
          <div className="ax-section-header" style={{ margin: '-16px -16px 12px', padding: '8px 16px' }}>
            <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
              Account Health
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <HealthRow label="Balance" value={`$${accountBalance.toLocaleString()}`} />
            <HealthRow label="Unrealized PnL" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`} color={totalPnl >= 0 ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)'} />
            <HealthRow label="Equity" value={`$${equity.toFixed(2)}`} bold />
            <div style={{ height: 1, background: 'var(--ax-border)', margin: '4px 0' }} />
            <HealthRow label="Margin Used" value={`$${totalMargin.toFixed(2)}`} />
            <HealthRow label="Available Margin" value={`$${(equity - totalMargin).toFixed(2)}`} color="var(--ax-green-bright)" />
            <HealthRow label="Margin Level" value={`${marginUsedPct.toFixed(1)}%`} color={marginUsedPct > 80 ? 'var(--ax-red-bright)' : 'var(--ax-text)'} bold />
            {/* Margin bar */}
            <div style={{ height: 8, background: 'var(--ax-surface)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${Math.min(marginUsedPct, 100)}%`,
                background: marginUsedPct > 80 ? 'var(--ax-red)' : marginUsedPct > 50 ? 'var(--ax-gold)' : 'var(--ax-green)',
                boxShadow: marginUsedPct > 80 ? '0 0 12px hsla(355, 70%, 55%, 0.4)' : 'none',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Full Positions Table */}
      <div className="ax-card" style={{ flex: 1, minHeight: 200, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="ax-section-header" style={{ flexShrink: 0 }}>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
            Open Positions ({enriched.length})
          </h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 12 }}>Loading...</div>
          ) : !enriched.length ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 12 }}>No open positions</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Market', 'Side', 'Size', 'Entry', 'Mark', 'Liq. Price', 'PnL', 'ROE %', 'Margin'].map((h) => (
                    <th key={h} style={{
                      position: 'sticky', top: 0, zIndex: 1, background: 'var(--ax-panel)',
                      textAlign: h === 'Market' || h === 'Side' ? 'left' : 'right',
                      padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--ax-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--ax-border)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.map((p, i) => {
                  const roe = parseFloat(p.margin) > 0 ? (p.currentPnl / parseFloat(p.margin)) * 100 : 0;
                  return (
                    <tr key={`${p.symbol}-${p.side}-${i}`} className="ax-row-hover" style={{ borderBottom: '1px solid hsla(25, 6%, 15%, 0.4)' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: 12 }}>{p.symbol}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <span className={`ax-badge ${p.side === 'long' ? 'ax-badge-green' : 'ax-badge-red'}`}>
                          {p.side.toUpperCase()} {p.leverage}x
                        </span>
                      </td>
                      <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12 }}>
                        ${parseFloat(p.size).toLocaleString()}
                      </td>
                      <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                        ${parseFloat(p.entry_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12 }}>
                        ${parseFloat(p.mark_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12, color: 'var(--ax-red-bright)' }}>
                        ${parseFloat(p.liquidation_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`ax-mono ${p.currentPnl >= 0 ? 'ax-glow-green' : 'ax-glow-red'}`} style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                        {p.currentPnl >= 0 ? '+' : ''}${p.currentPnl.toFixed(2)}
                      </td>
                      <td className={`ax-mono ${roe >= 0 ? 'ax-glow-green' : 'ax-glow-red'}`} style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                        {roe >= 0 ? '+' : ''}{roe.toFixed(2)}%
                      </td>
                      <td className="ax-mono" style={{ padding: '6px 10px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                        ${parseFloat(p.margin).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, glow }: { label: string; value: string; glow?: 'green' | 'red' | 'gold' }) {
  const glowClass = glow === 'green' ? 'ax-glow-green' : glow === 'red' ? 'ax-glow-red' : glow === 'gold' ? 'ax-glow-gold' : '';
  return (
    <div className="ax-card" style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
      <div className={`ax-mono ${glowClass}`} style={{ fontSize: 16, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function HealthRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: 'var(--ax-text-sec)' }}>{label}</span>
      <span className="ax-mono" style={{ color: color || 'var(--ax-text)', fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}
