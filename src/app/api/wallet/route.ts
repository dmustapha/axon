import { NextResponse } from 'next/server';
import { getAccountAddress } from '@/lib/signing';

export async function GET() {
  try {
    const address = getAccountAddress();
    return NextResponse.json({
      address: address.slice(0, 6) + '...' + address.slice(-4),
      full_address: address,
      connected: true,
    });
  } catch {
    return NextResponse.json({ address: null, connected: false });
  }
}
