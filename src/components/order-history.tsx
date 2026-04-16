'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';

interface Order {
  order_id: string;
  symbol: string;
  side: string;
  order_type: string;
  amount: string;
  price?: string;
  status: string;
  created_at?: number;
}

export function OrderHistory() {
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancel(orderId: string, symbol: string) {
    setCancellingId(orderId);
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, symbol }),
      });
      if (res.ok) {
        toast.success('Order cancelled');
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      } else {
        toast.error('Failed to cancel order');
      }
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'open'],
    queryFn: async (): Promise<Order[]> => {
      const res = await fetch('/api/orders');
      if (!res.ok) return [];
      const d = await res.json();
      return (d.orders || []) as Order[];
    },
    refetchInterval: 5000,
    staleTime: 5000,
  });

  if (isLoading) {
    return (
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="ax-skeleton" style={{ height: 24, width: '100%' }} />
        ))}
      </div>
    );
  }

  const orders = data || [];

  if (!orders.length) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 12 }}>
        No open orders
      </div>
    );
  }

  return (
    <div style={{ fontSize: 11 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 50px 50px 70px 60px 28px',
        padding: '4px 8px', color: 'var(--ax-text-muted)', fontWeight: 600,
        borderBottom: '1px solid var(--ax-border)',
      }}>
        <span>Market</span><span>Side</span><span>Type</span><span>Price</span><span>Amount</span><span />
      </div>
      {orders.map((o) => (
        <div key={o.order_id} className="ax-row-hover" style={{
          display: 'grid', gridTemplateColumns: '1fr 50px 50px 70px 60px 28px',
          padding: '6px 8px', borderBottom: '1px solid var(--ax-border)',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 600 }}>{o.symbol}</span>
          <span style={{ color: o.side === 'bid' ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)', fontWeight: 600 }}>
            {o.side === 'bid' ? 'Long' : 'Short'}
          </span>
          <span style={{ color: 'var(--ax-text-sec)' }}>{o.order_type}</span>
          <span className="ax-mono">{o.price ? formatPrice(o.price) : 'MKT'}</span>
          <span className="ax-mono">{o.amount}</span>
          <button
            onClick={() => handleCancel(o.order_id, o.symbol)}
            disabled={cancellingId === o.order_id}
            title="Cancel order"
            style={{
              width: 22, height: 22, borderRadius: 4, border: '1px solid hsla(355, 70%, 55%, 0.3)',
              background: 'hsla(355, 70%, 55%, 0.1)', color: 'var(--ax-red-bright)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: cancellingId === o.order_id ? 0.4 : 1,
              transition: 'background-color 150ms',
            }}
          >
            {cancellingId === o.order_id ? '...' : '×'}
          </button>
        </div>
      ))}
    </div>
  );
}
