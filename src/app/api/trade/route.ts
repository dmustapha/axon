import { NextRequest, NextResponse } from 'next/server';
import { signRequest } from '@/lib/signing';
import { PACIFICA_REST_URL } from '@/lib/constants';
import { checkOrigin } from '@/lib/origin-check';
import type { OrderRequest } from '@/types';

// Cache market info for lot_size rounding
let marketInfoCache: Record<string, { lot_size: string }> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getLotSize(symbol: string): Promise<number> {
  if (!marketInfoCache || Date.now() - cacheTime > CACHE_TTL) {
    try {
      const res = await fetch(`${PACIFICA_REST_URL}/info`, { signal: AbortSignal.timeout(5000) });
      const json = await res.json();
      const markets = json.data || json;
      marketInfoCache = {};
      for (const m of markets) {
        marketInfoCache[m.symbol] = { lot_size: m.lot_size };
      }
      cacheTime = Date.now();
    } catch {
      return 0.00001; // safe default
    }
  }
  const lot = marketInfoCache[symbol]?.lot_size;
  return lot ? parseFloat(lot) : 0.00001;
}

function roundToLot(amount: number, lotSize: number): string {
  const decimals = Math.max(0, -Math.floor(Math.log10(lotSize)));
  const rounded = Math.floor(amount / lotSize) * lotSize;
  return rounded.toFixed(decimals);
}

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error_code: -1, message: 'Forbidden' }, { status: 403 });
  }
  try {
    const body: OrderRequest = await req.json();
    const { symbol, side, amount, order_type, price, reduce_only, slippage_percent, client_order_id, leverage } = body;

    if (!symbol || !side || !amount || !order_type) {
      return NextResponse.json({ error_code: -1, message: 'Missing required fields' }, { status: 400 });
    }
    if (!['bid', 'ask'].includes(side)) {
      return NextResponse.json({ error_code: -1, message: 'Invalid side' }, { status: 400 });
    }
    if (!['market', 'limit', 'stop'].includes(order_type)) {
      return NextResponse.json({ error_code: -1, message: 'Invalid order type' }, { status: 400 });
    }
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error_code: -1, message: 'Invalid amount' }, { status: 400 });
    }

    // Round amount to market's lot_size
    const lotSize = await getLotSize(symbol);
    const roundedAmount = roundToLot(amountNum, lotSize);
    if ((order_type === 'limit' || order_type === 'stop') && !price) {
      return NextResponse.json({ error_code: -1, message: 'Price required for limit/stop orders' }, { status: 400 });
    }

    // Set leverage before placing order (if provided)
    if (leverage && leverage > 0 && leverage <= 200) {
      const levSigned = signRequest('update_leverage', { symbol, leverage });
      const levRes = await fetch(`${PACIFICA_REST_URL}/account/leverage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify(levSigned),
      });
      // 422 is expected if leverage is already set to this value
      if (!levRes.ok && levRes.status !== 422) {
        return NextResponse.json(
          { error_code: -1, message: 'Failed to set leverage' },
          { status: 500 },
        );
      }
    } else if (leverage && leverage > 200) {
      return NextResponse.json({ error_code: -1, message: 'Leverage must be 1-200x' }, { status: 400 });
    }

    // Validate price for non-market orders (M5)
    if (order_type !== 'market') {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return NextResponse.json({ error_code: -1, message: 'Invalid price' }, { status: 400 });
      }
    }

    // Determine endpoint and signing type
    let path: string;
    let type: string;
    const payload: Record<string, unknown> = {
      symbol,
      side,
      amount: roundedAmount,
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
      if (price) payload.price = price;
      payload.tif = body.tif || 'GTC';
    }

    const signed = signRequest(type, payload);

    const res = await fetch(`${PACIFICA_REST_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify(signed),
    });

    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      // Pacifica sometimes returns non-JSON error text
      if (!res.ok) {
        console.error(`[trade] Pacifica ${res.status}: ${text}`);
        return NextResponse.json(
          { error_code: -1, message: text || 'Order rejected by exchange' },
          { status: res.status },
        );
      }
      return NextResponse.json({ error_code: -1, message: 'Unexpected response from exchange' }, { status: 502 });
    }

    if (!res.ok) {
      const errMsg = typeof data?.error === 'string' ? data.error : typeof data?.message === 'string' ? data.message : 'Order rejected by exchange';
      console.error(`[trade] Pacifica ${res.status}: ${errMsg}`);
      return NextResponse.json(
        { error_code: data?.error_code ?? data?.code ?? -1, message: errMsg },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('[trade]', e);
    return NextResponse.json(
      { error_code: -1, message: 'Order failed. Please try again.' },
      { status: 500 },
    );
  }
}
