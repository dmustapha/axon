import { NextResponse } from 'next/server';
import { pacificaPost } from '@/lib/pacifica';

export async function GET() {
  try {
    const data = await pacificaPost('/account/positions', 'get_positions', {});
    return NextResponse.json(data);
  } catch (e) {
    // Return empty positions on error (account may not exist yet)
    return NextResponse.json({ positions: [] });
  }
}
