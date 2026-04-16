import { NextResponse } from 'next/server';
import { pacificaAccountGet } from '@/lib/pacifica';

interface RawPosition {
  symbol: string;
  side: string;
  amount: string;
  entry_price: string;
  margin: string;
  funding: string;
  isolated: boolean;
  liquidation_price: string;
  leverage?: number;
  created_at: number;
  updated_at: number;
}

function normalize(raw: RawPosition) {
  return {
    symbol: raw.symbol,
    side: raw.side === 'bid' ? 'long' : 'short',
    size: raw.amount,
    entry_price: raw.entry_price,
    mark_price: raw.entry_price, // will be overridden by live WS price on frontend
    unrealized_pnl: '0',
    margin: raw.margin,
    liquidation_price: raw.liquidation_price,
    leverage: raw.leverage ?? 1,
    margin_ratio: 100,
  };
}

export async function GET() {
  try {
    const data = await pacificaAccountGet<RawPosition[]>('/positions');
    const positions = (Array.isArray(data) ? data : []).map(normalize);
    return NextResponse.json({ positions });
  } catch (e) {
    console.error('[positions]', e);
    return NextResponse.json({ positions: [] }, { status: 502 });
  }
}
