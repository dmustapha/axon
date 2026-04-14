'use client';

import { useState, useMemo } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { useMarketPrices, useMarketSpecs } from '@/hooks/use-market-data';
import type { OrderType, OrderSide } from '@/types';

interface OrderPanelProps {
  selectedMarket: string | null;
}

export function OrderPanel({ selectedMarket }: OrderPanelProps) {
  const { placeOrder, isSubmitting } = useOrders();
  const { prices } = useMarketPrices();
  const { data: specs } = useMarketSpecs();
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [side, setSide] = useState<OrderSide>('bid');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState('10');

  const symbol = selectedMarket || 'BTC';
  const currentPrice = prices.get(symbol);
  const spec = specs?.find((s) => s.symbol === symbol);

  const estimatedLiq = useMemo(() => {
    if (!currentPrice || !amount || !leverage) return null;
    const entry = parseFloat(currentPrice.mark);
    const lev = parseInt(leverage);
    if (!entry || !lev) return null;
    const liqDist = entry / lev;
    return side === 'bid' ? entry - liqDist : entry + liqDist;
  }, [currentPrice, amount, leverage, side]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    await placeOrder({
      symbol,
      side,
      amount,
      order_type: orderType,
      price: orderType !== 'market' ? price : undefined,
      reduce_only: false,
      slippage_percent: orderType === 'market' ? '0.5' : undefined,
      leverage: parseInt(leverage),
    });

    setAmount('');
    setPrice('');
  }

  const panelStyle: React.CSSProperties = {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    padding: '0 10px',
    borderRadius: 6,
    background: 'var(--ax-surface)',
    border: '1px solid var(--ax-border)',
    color: 'var(--ax-text)',
    fontSize: 13,
    fontFamily: 'var(--font-data)',
    outline: 'none',
  };

  return (
    <form onSubmit={handleSubmit} style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{symbol}</span>
        {currentPrice && (
          <span className="ax-mono" style={{ fontSize: 13, color: 'var(--ax-text-sec)' }}>
            ${parseFloat(currentPrice.mark).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>

      {/* Order Type Toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--ax-surface)', borderRadius: 6, padding: 2 }}>
        {(['market', 'limit', 'stop'] as OrderType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setOrderType(t)}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: orderType === t ? 'var(--ax-border-bright)' : 'transparent',
              color: orderType === t ? 'var(--ax-text)' : 'var(--ax-text-muted)',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Side Toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          onClick={() => setSide('bid')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            background: side === 'bid' ? 'var(--ax-green-dim)' : 'var(--ax-surface)',
            color: side === 'bid' ? 'var(--ax-green-bright)' : 'var(--ax-text-muted)',
          }}
        >
          Long
        </button>
        <button
          type="button"
          onClick={() => setSide('ask')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            background: side === 'ask' ? 'var(--ax-red-dim)' : 'var(--ax-surface)',
            color: side === 'ask' ? 'var(--ax-red-bright)' : 'var(--ax-text-muted)',
          }}
        >
          Short
        </button>
      </div>

      {/* Amount */}
      <div>
        <label style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Amount
        </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={spec ? `Min: ${spec.min_order_size}` : '0.01'}
          style={inputStyle}
        />
      </div>

      {/* Price (limit/stop only) */}
      {orderType !== 'market' && (
        <div>
          <label style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Price
          </label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price"
            style={inputStyle}
          />
        </div>
      )}

      {/* Leverage */}
      <div>
        <label style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Leverage: {leverage}x
        </label>
        <input
          type="range"
          min="1"
          max={spec?.max_leverage || 50}
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
          style={{ width: '100%', accentColor: 'var(--ax-blue)' }}
        />
      </div>

      {/* Preview */}
      {currentPrice && amount && (
        <div style={{ padding: 10, background: 'var(--ax-surface)', borderRadius: 6, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ax-text-sec)' }}>
            <span>Est. Entry</span>
            <span className="ax-mono">${parseFloat(currentPrice.mark).toFixed(2)}</span>
          </div>
          {estimatedLiq && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ax-red-bright)', marginTop: 4 }}>
              <span>Liq. Price</span>
              <span className="ax-mono">${estimatedLiq.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!amount || isSubmitting}
        style={{
          width: '100%',
          padding: '10px 0',
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 8,
          border: 'none',
          cursor: isSubmitting ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          background: side === 'bid' ? 'var(--ax-green)' : 'var(--ax-red)',
          color: '#fff',
          opacity: !amount || isSubmitting ? 0.4 : 1,
        }}
      >
        {isSubmitting ? 'Placing...' : `${side === 'bid' ? 'Long' : 'Short'} ${symbol}`}
      </button>
    </form>
  );
}
