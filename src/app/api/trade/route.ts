import { NextRequest, NextResponse } from 'next/server';
import { signRequest } from '@/lib/signing';
import { PACIFICA_REST_URL } from '@/lib/constants';
import type { OrderRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest = await req.json();
    const { symbol, side, amount, order_type, price, reduce_only, slippage_percent, client_order_id } = body;

    // Determine endpoint and signing type
    let path: string;
    let type: string;
    const payload: Record<string, unknown> = {
      symbol,
      side,
      amount,
      reduce_only,
      client_order_id,
    };

    if (order_type === 'market') {
      path = '/orders/create_market';
      type = 'create_market_order';
      if (slippage_percent) payload.slippage_percent = slippage_percent;
    } else {
      path = '/orders/create';
      type = 'create_order';
      payload.order_type = order_type;
      if (price) payload.price = price;
    }

    const signed = signRequest(type, payload);

    const res = await fetch(`${PACIFICA_REST_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signed),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error_code: -1, message: (e as Error).message },
      { status: 500 },
    );
  }
}
