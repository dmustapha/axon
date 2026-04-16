import { NextResponse } from 'next/server';
import { pacificaAccountGet } from '@/lib/pacifica';

export async function GET() {
  try {
    const data = await pacificaAccountGet<Record<string, unknown>>('/account');
    return NextResponse.json({
      balance: data.balance ?? null,
      equity: data.account_equity ?? null,
      fee_level: data.fee_level ?? null,
      margin_used: data.total_margin_used ?? null,
      available_to_spend: data.available_to_spend ?? null,
      positions_count: data.positions_count ?? 0,
      orders_count: data.orders_count ?? 0,
    });
  } catch (e) {
    console.error('[account]', e);
    return NextResponse.json({ balance: null, equity: null, fee_level: null, margin_used: null }, { status: 502 });
  }
}
