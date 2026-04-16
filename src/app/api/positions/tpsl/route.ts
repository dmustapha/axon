import { NextRequest, NextResponse } from 'next/server';
import { pacificaPost } from '@/lib/pacifica';
import { checkOrigin } from '@/lib/origin-check';

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error_code: -1, message: 'Forbidden' }, { status: 403 });
  }
  try {
    const { symbol, side, take_profit, stop_loss } = await req.json();
    if (!symbol) {
      return NextResponse.json({ error_code: -1, message: 'Symbol required' }, { status: 400 });
    }

    const payload: Record<string, unknown> = { symbol };
    if (side) payload.side = side;
    // Pacifica expects TP/SL as { stop_price: string } structs
    if (take_profit != null && take_profit !== '') {
      payload.take_profit = typeof take_profit === 'object' ? take_profit : { stop_price: String(take_profit) };
    }
    if (stop_loss != null && stop_loss !== '') {
      payload.stop_loss = typeof stop_loss === 'object' ? stop_loss : { stop_price: String(stop_loss) };
    }

    const data = await pacificaPost('/positions/tpsl', 'set_position_tpsl', payload);
    return NextResponse.json(data);
  } catch (e) {
    console.error('[positions/tpsl]', e);
    return NextResponse.json(
      { error_code: -1, message: 'Failed to set TP/SL' },
      { status: 500 },
    );
  }
}
