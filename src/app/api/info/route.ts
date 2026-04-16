import { NextResponse } from 'next/server';
import { PACIFICA_REST_URL } from '@/lib/constants';

export async function GET() {
  try {
    const res = await fetch(`${PACIFICA_REST_URL}/info`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Pacifica /info: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error('[info]', e);
    return NextResponse.json({ markets: [] }, { status: 502 });
  }
}
