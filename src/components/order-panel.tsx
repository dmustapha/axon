'use client';

import { useState, useMemo, useEffect } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { usePrices } from '@/hooks/use-prices';
import { useMarketSpecs } from '@/hooks/use-market-data';
import { usePositions } from '@/hooks/use-positions';
import { useAccount } from '@/hooks/use-account';
import { toast } from 'sonner';
import { formatVolume, formatPrice } from '@/lib/format';
import { calcPnl } from '@/lib/pnl';
import type { OrderType, OrderSide, TradeSuggestion } from '@/types';

interface OrderPanelProps {
  selectedMarket: string | null;
  pendingSuggestion?: TradeSuggestion | null;
  onSuggestionApplied?: () => void;
  walletConnected?: boolean;
}

export function OrderPanel({ selectedMarket, pendingSuggestion, onSuggestionApplied, walletConnected = true }: OrderPanelProps) {
  const { placeOrder, isSubmitting } = useOrders();
  const { prices } = usePrices();
  const { data: specs } = useMarketSpecs();
  const { data: positions } = usePositions();
  const { data: account } = useAccount();
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [side, setSide] = useState<OrderSide>('bid');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState('10');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  // Apply trade suggestion from copilot
  useEffect(() => {
    if (!pendingSuggestion) return;
    setSide(pendingSuggestion.side === 'long' ? 'bid' : 'ask');
    if (pendingSuggestion.entry) {
      setPrice(pendingSuggestion.entry);
      setOrderType('limit');
    }
    if (pendingSuggestion.takeProfit) setTakeProfit(pendingSuggestion.takeProfit);
    if (pendingSuggestion.stopLoss) setStopLoss(pendingSuggestion.stopLoss);
    onSuggestionApplied?.();
  }, [pendingSuggestion, onSuggestionApplied]);

  const symbol = selectedMarket || 'BTC';
  const currentPrice = prices.get(symbol);
  const spec = specs?.find((s) => s.symbol === symbol);
  const maxLev = spec?.max_leverage || 50;

  const estimatedLiq = useMemo(() => {
    if (!currentPrice || !leverage) return null;
    const entry = parseFloat(currentPrice.mark);
    const lev = parseInt(leverage);
    if (!entry || !lev) return null;
    const liqDist = entry / lev;
    return side === 'bid' ? entry - liqDist : entry + liqDist;
  }, [currentPrice, leverage, side]);

  const sizeInAsset = useMemo(() => {
    if (!currentPrice || !amount) return null;
    const entry = parseFloat(currentPrice.mark);
    const amt = parseFloat(amount);
    if (!entry || !amt) return null;
    return amt / entry;
  }, [currentPrice, amount]);

  if (selectedMarket && !currentPrice) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="ax-skeleton" style={{ height: 20, width: '60%' }} />
        <div className="ax-skeleton" style={{ height: 36, width: '100%' }} />
        <div className="ax-skeleton" style={{ height: 36, width: '100%' }} />
        <div className="ax-skeleton" style={{ height: 36, width: '100%' }} />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    const result = await placeOrder({
      symbol,
      side,
      amount,
      order_type: orderType,
      price: orderType !== 'market' ? price : undefined,
      reduce_only: false,
      slippage_percent: orderType === 'market' ? '0.5' : undefined,
      leverage: parseInt(leverage),
    });

    // Only set TP/SL if order succeeded (C4)
    if (result && (takeProfit || stopLoss)) {
      try {
        const tpslRes = await fetch('/api/positions/tpsl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, take_profit: takeProfit || undefined, stop_loss: stopLoss || undefined }),
        });
        if (!tpslRes.ok) {
          toast.error('TP/SL may not have been set — check positions');
        }
      } catch {
        toast.error('TP/SL may not have been set — check positions');
      }
    }

    setAmount('');
    setPrice('');
    setTakeProfit('');
    setStopLoss('');
  }

  const markPrice = currentPrice ? parseFloat(currentPrice.mark) : 0;
  const fmtPrice = formatPrice(markPrice);
  const yesterdayNum = currentPrice ? parseFloat(currentPrice.yesterday_price) : 0;
  const change24h = currentPrice && yesterdayNum
    ? ((parseFloat(currentPrice.mark) - yesterdayNum) / yesterdayNum * 100)
    : 0;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Market Header — compact */}
      <div className="ax-section-header" style={{
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{symbol}-PERP</span>
          <span className={`ax-mono ${change24h >= 0 ? 'ax-glow-green' : 'ax-glow-red'}`} style={{ fontSize: 14, fontWeight: 700 }}>
            ${fmtPrice}
          </span>
          <span className={change24h >= 0 ? 'ax-glow-green' : 'ax-glow-red'} style={{ fontSize: 11, fontWeight: 500 }}>
            {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: 'var(--ax-text-sec)' }}>
          {currentPrice && (
            <>
              <span>Funding <span className="ax-mono" style={{ color: 'var(--ax-text)' }}>{(parseFloat(currentPrice.funding) * 100).toFixed(3)}%</span></span>
              <span>Vol <span className="ax-mono" style={{ color: 'var(--ax-text)' }}>${formatCompact(currentPrice.volume_24h)}</span></span>
              <span>Open Int. <span className="ax-mono" style={{ color: 'var(--ax-text)' }}>${formatCompact(currentPrice.open_interest)}</span></span>
            </>
          )}
        </div>
      </div>

      {/* Order Form */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflow: 'auto', minHeight: 0 }}>
        {/* Row 1: Order Type + Side */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="ax-toggle-group" style={{ flex: 1 }}>
            {(['market', 'limit', 'stop'] as OrderType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={orderType === t ? 'active' : ''}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flex: 1, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--ax-border)' }}>
            <button
              type="button"
              onClick={() => setSide('bid')}
              style={{
                flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: side === 'bid' ? 'var(--ax-green-dim)' : 'transparent',
                color: side === 'bid' ? 'var(--ax-green-bright)' : 'var(--ax-text-muted)',
                borderRight: '1px solid var(--ax-border)',
                transition: 'color 150ms, background-color 150ms',
              }}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => setSide('ask')}
              style={{
                flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: side === 'ask' ? 'var(--ax-red-dim)' : 'transparent',
                color: side === 'ask' ? 'var(--ax-red-bright)' : 'var(--ax-text-muted)',
                transition: 'color 150ms, background-color 150ms',
              }}
            >
              Short
            </button>
          </div>
        </div>

        {/* Row 2: Amount + Price + Leverage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label className="ax-label">Amount (USD)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v); }}
              placeholder={spec ? `Min ${spec.min_order_size}` : '0.01'}
              className="ax-input"
            />
          </div>
          <div>
            <label className="ax-label">Price <span style={{ textTransform: 'none', opacity: 0.5 }}>(limit/stop)</span></label>
            <input
              type="text"
              value={price}
              onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setPrice(v); }}
              placeholder="Market price"
              className="ax-input"
              disabled={orderType === 'market'}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="ax-label" style={{ marginBottom: 0 }}>Leverage</label>
              <span className="ax-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-accent)' }}>{leverage}x</span>
            </div>
            <div style={{ position: 'relative', height: 6, background: 'var(--ax-surface)', borderRadius: 3, marginTop: 8 }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${(parseInt(leverage) / maxLev) * 100}%`,
                borderRadius: 3, background: 'var(--ax-accent)',
                transition: 'width 200ms ease-out',
              }} />
              {/* Visible thumb dot */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: `${(parseInt(leverage) / maxLev) * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--ax-accent)',
                border: '2px solid var(--ax-bg)',
                boxShadow: '0 0 6px hsla(35, 100%, 55%, 0.5)',
                pointerEvents: 'none',
                transition: 'left 200ms ease-out',
              }} />
              <input
                type="range"
                min="1"
                max={maxLev}
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                style={{
                  position: 'absolute', top: -4, left: 0, width: '100%', height: 14,
                  opacity: 0, cursor: 'pointer',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--ax-text-muted)' }}>
              <span>1x</span><span>10x</span><span>25x</span><span>{maxLev}x</span>
            </div>
          </div>
        </div>

        {/* Row 2b: TP/SL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="ax-label">Take Profit</label>
            <input
              type="text"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="TP price"
              className="ax-input"
            />
          </div>
          <div>
            <label className="ax-label">Stop Loss</label>
            <input
              type="text"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="SL price"
              className="ax-input"
            />
          </div>
        </div>

        {/* Row 3: Preview + Account */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
          <div className="ax-surface-card">
            <div className="ax-label" style={{ marginBottom: 8, fontWeight: 600 }}>Order Preview</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Row label="Est. Entry" value={markPrice ? `$${fmtPrice}` : '—'} />
              <Row label="Size" value={sizeInAsset ? `${sizeInAsset.toFixed(4)} ${symbol}` : '—'} />
              <Row label="Liq. Price" value={estimatedLiq ? `$${estimatedLiq.toFixed(2)}` : '—'} color="var(--ax-red-bright)" />
              <Row label={`Fees (${((account?.fee_level ?? 0.06) / 100).toFixed(3)}%)`} value={amount ? `$${(parseFloat(amount) * (account?.fee_level ?? 0.06) / 10000).toFixed(2)}` : '—'} />
            </div>
          </div>
          <div className="ax-surface-card">
            <div className="ax-label" style={{ marginBottom: 8, fontWeight: 600 }}>Account</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(() => {
                const pos = positions || [];
                const totalMargin = pos.reduce((s, p) => s + parseFloat(p.margin || '0'), 0);
                const totalPnl = pos.reduce((s, p) => {
                  const live = prices.get(p.symbol);
                  if (!live) return s + parseFloat(p.unrealized_pnl || '0');
                  return s + calcPnl(p.side, parseFloat(live.mark), parseFloat(p.entry_price), parseFloat(p.size));
                }, 0);
                const balance = account?.balance ? parseFloat(account.balance) : 0;
                return (
                  <>
                    <Row label="Balance" value={`$${balance.toLocaleString()}`} bold />
                    <Row label="Margin Used" value={`$${totalMargin.toFixed(2)}`} />
                    <Row label="Unrealized" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`} color={totalPnl >= 0 ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)'} bold />
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Submit Button — full width */}
        <button
          type="submit"
          disabled={!walletConnected || !amount || isSubmitting || (orderType !== 'market' && !price)}
          className={`ax-btn ${side === 'bid' ? 'ax-btn-long' : 'ax-btn-short'}`}
          style={{
            width: '100%',
            padding: '12px 0',
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 8,
            marginTop: 'auto',
            opacity: !walletConnected || !amount || isSubmitting || (orderType !== 'market' && !price) ? 0.4 : 1,
          }}
        >
          {!walletConnected ? 'Connect Wallet to Trade' : isSubmitting ? 'Placing...' : `${side === 'bid' ? 'Long' : 'Short'} ${symbol}-PERP`}
        </button>
      </div>
    </form>
  );
}

function Row({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: 'var(--ax-text-sec)' }}>{label}</span>
      <span className="ax-mono" style={{ color: color || 'var(--ax-text)', fontWeight: bold ? 600 : 400 }}>{value}</span>
    </div>
  );
}

const formatCompact = (val: string) => formatVolume(val);
