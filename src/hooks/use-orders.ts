'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { OrderRequest, OrderResponse, OrderError } from '@/types';
import { v4 as uuid } from 'uuid';

export function useOrders() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function placeOrder(
    params: Omit<OrderRequest, 'client_order_id'>,
  ): Promise<OrderResponse | null> {
    setIsSubmitting(true);
    try {
      const body: OrderRequest = { ...params, client_order_id: uuid() };
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        const err = data as OrderError;
        toast.error(`Order failed: ${err.message || 'Unknown error'}`);
        return null;
      }

      const result = data as OrderResponse;
      toast.success(`Order placed: ${result.order_id}`);
      return result;
    } catch (e) {
      toast.error(`Order failed: ${(e as Error).message}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { placeOrder, isSubmitting };
}
