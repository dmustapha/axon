import { NextResponse } from 'next/server';
import { pacificaAccountGet } from '@/lib/pacifica';

export async function GET() {
  try {
    const data = await pacificaAccountGet<unknown[]>('/orders');
    return NextResponse.json({ orders: Array.isArray(data) ? data : [] });
  } catch (e) {
    console.error('[orders]', e);
    return NextResponse.json({ orders: [] }, { status: 502 });
  }
}
