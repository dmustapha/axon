import { NextRequest, NextResponse } from 'next/server';
import { signRequest } from '@/lib/signing';
import { PACIFICA_REST_URL } from '@/lib/constants';
import { checkOrigin } from '@/lib/origin-check';

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error_code: -1, message: 'Forbidden' }, { status: 403 });
  }
  try {
    const { order_id, symbol } = await req.json();
    if (!order_id || !symbol) {
      return NextResponse.json({ error_code: -1, message: 'Missing order_id or symbol' }, { status: 400 });
    }
    const signed = signRequest('cancel_order', { order_id, symbol });
    const res = await fetch(`${PACIFICA_REST_URL}/orders/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify(signed),
    });
    if (!res.ok) {
      return NextResponse.json({ error_code: -1, message: 'Failed to cancel order' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('[orders/cancel]', e);
    return NextResponse.json({ error_code: -1, message: 'Failed to cancel order' }, { status: 500 });
  }
}
