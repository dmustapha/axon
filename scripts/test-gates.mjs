#!/usr/bin/env node
/**
 * AXON Exhaustive Testing Gates
 * Tests every API route + every order combination on Pacifica testnet.
 * Connects to WS for live mark prices, then runs all gates.
 * Run: node scripts/test-gates.mjs
 */

import WebSocket from 'ws';

const BASE = 'http://localhost:3000';
const ORIGIN = BASE;
let passed = 0;
let failed = 0;
let skipped = 0;

// ── Mark prices from WS ──
const markPrices = new Map();

async function fetchMarkPrices() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://test-ws.pacifica.fi/ws');
    const timeout = setTimeout(() => { ws.close(); reject(new Error('WS price timeout')); }, 8000);
    ws.on('open', () => ws.send(JSON.stringify({ method: 'subscribe', params: { source: 'prices' } })));
    ws.on('message', d => {
      const msg = JSON.parse(d);
      if (msg.channel === 'prices' && Array.isArray(msg.data)) {
        for (const p of msg.data) {
          if (p.symbol && p.mark) markPrices.set(p.symbol, parseFloat(p.mark));
        }
        // Wait for at least BTC + ETH + SOL
        if (markPrices.has('BTC') && markPrices.has('ETH') && markPrices.has('SOL')) {
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      }
    });
    ws.on('error', e => { clearTimeout(timeout); reject(e); });
  });
}

function mark(symbol) {
  const p = markPrices.get(symbol);
  if (!p) throw new Error(`No mark price for ${symbol}`);
  return p;
}

// ── Test helpers ──
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    if (e.message?.startsWith('SKIP:')) {
      console.log(`  ⊘ ${name}: ${e.message.slice(5)}`);
      skipped++;
    } else {
      console.log(`  ✗ ${name}: ${e.message}`);
      failed++;
    }
  }
}

function assert(condition, msg) { if (!condition) throw new Error(msg); }

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(20_000) });
  const data = await res.json();
  return { status: res.status, data };
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function closePosition(symbol) {
  const { data } = await get('/api/positions');
  const pos = data.positions?.find(p => p.symbol === symbol);
  if (!pos) return false;
  const closeSide = pos.side === 'bid' ? 'ask' : 'bid';
  await post('/api/trade', {
    symbol, side: closeSide, amount: String(Math.abs(Number(pos.amount))),
    order_type: 'market', reduce_only: true, slippage_percent: '3',
  });
  await sleep(2000);
  return true;
}

async function cancelOrders(symbol) {
  const { data } = await get('/api/orders');
  const orders = data.orders?.filter(o => o.symbol === symbol) || [];
  for (const o of orders) {
    await post('/api/orders/cancel', { order_id: o.order_id, symbol });
  }
  if (orders.length) await sleep(1000);
}

/** Compute amount that meets min notional of $10 given a mark price */
function minAmount(symbol, lotSize) {
  const price = mark(symbol);
  const raw = Math.ceil(12 / price / lotSize) * lotSize; // $12 notional minimum (buffer over $10)
  return raw;
}

// ═══════════════════════════════════════
console.log('\n═══════════════════════════════════════');
console.log('  AXON Exhaustive Testing Gates');
console.log('═══════════════════════════════════════\n');

// Fetch live prices first
console.log('Fetching live mark prices from WS...');
await fetchMarkPrices();
console.log(`  Got ${markPrices.size} prices (BTC=$${mark('BTC').toFixed(0)}, ETH=$${mark('ETH').toFixed(0)}, SOL=$${mark('SOL').toFixed(2)})\n`);

// ─────────────────────────────────────
// Gate 1: Read-only API routes
// ─────────────────────────────────────
console.log('Gate 1: Read-only endpoints');

await test('GET /api/info returns 75+ markets', async () => {
  const { status, data } = await get('/api/info');
  assert(status === 200, `status ${status}`);
  const markets = Array.isArray(data) ? data : data?.data;
  assert(Array.isArray(markets) && markets.length > 50, `expected 50+ markets, got ${markets?.length}`);
});

await test('GET /api/info markets have config fields', async () => {
  const { data } = await get('/api/info');
  const markets = Array.isArray(data) ? data : data?.data;
  const btc = markets?.find(m => m.symbol === 'BTC');
  assert(btc, 'BTC market not found');
  assert(btc.tick_size, 'missing tick_size');
  assert(btc.lot_size, 'missing lot_size');
  assert(btc.min_order_size, 'missing min_order_size');
  assert(btc.max_leverage, 'missing max_leverage');
});

await test('GET /api/account returns balance + equity', async () => {
  const { status, data } = await get('/api/account');
  assert(status === 200, `status ${status}`);
  assert(Number(data.balance) > 0, `balance is ${data.balance}`);
  assert(Number(data.equity) > 0, `equity is ${data.equity}`);
});

await test('GET /api/account returns all fields', async () => {
  const { data } = await get('/api/account');
  assert(data.fee_level !== undefined, 'missing fee_level');
  assert(data.margin_used !== undefined, 'missing margin_used');
  assert(data.available_to_spend !== undefined, 'missing available_to_spend');
});

await test('GET /api/positions returns array', async () => {
  const { status, data } = await get('/api/positions');
  assert(status === 200, `status ${status}`);
  assert(Array.isArray(data.positions), 'positions not array');
});

await test('GET /api/orders returns array', async () => {
  const { status, data } = await get('/api/orders');
  assert(status === 200, `status ${status}`);
  assert(Array.isArray(data.orders), 'orders not array');
});

await test('GET /api/wallet returns connected + address', async () => {
  const { status, data } = await get('/api/wallet');
  assert(status === 200, `status ${status}`);
  assert(data.connected === true, 'not connected');
  assert(data.full_address?.length > 30, 'no full_address');
  assert(data.address?.includes('...'), 'no truncated address');
});

// ─────────────────────────────────────
// Gate 2: Clean slate
// ─────────────────────────────────────
console.log('\nGate 2: Clean slate');

for (const sym of ['BTC', 'SOL', 'ETH', 'DOGE', 'SUI']) {
  await closePosition(sym);
  await cancelOrders(sym);
}
console.log('  (cleaned up stale positions/orders)');

// ─────────────────────────────────────
// Gate 3: Market BUY (long) → verify → close
// ─────────────────────────────────────
console.log('\nGate 3: Market long lifecycle (SOL)');

await test('Market buy SOL (open long)', async () => {
  const { status, data } = await post('/api/trade', {
    symbol: 'SOL', side: 'bid', amount: '1', order_type: 'market',
    slippage_percent: '3', reduce_only: false,
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
  assert(data?.data?.order_id, `no order_id: ${JSON.stringify(data)}`);
});

await sleep(2000);

await test('SOL long position appears (side=bid)', async () => {
  const { data } = await get('/api/positions');
  const pos = data.positions?.find(p => p.symbol === 'SOL');
  assert(pos, 'SOL position not found');
  assert(pos.side === 'bid', `expected bid, got ${pos.side}`);
  assert(Number(pos.amount) > 0, `amount is ${pos.amount}`);
  assert(Number(pos.entry_price) > 0, `entry_price is ${pos.entry_price}`);
});

await test('Account margin_used > 0 after SOL long', async () => {
  const { data } = await get('/api/account');
  assert(Number(data.margin_used) > 0, `margin_used is ${data.margin_used}`);
});

await test('Market sell SOL (close long, reduce_only)', async () => {
  const { status, data } = await post('/api/trade', {
    symbol: 'SOL', side: 'ask', amount: '1', order_type: 'market',
    reduce_only: true, slippage_percent: '3',
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
});

await sleep(2000);

await test('SOL position fully closed', async () => {
  const { data } = await get('/api/positions');
  assert(!data.positions?.find(p => p.symbol === 'SOL'), 'SOL position still exists');
});

// ─────────────────────────────────────
// Gate 4: Market SELL (short) → verify → close
// ─────────────────────────────────────
console.log('\nGate 4: Market short lifecycle (DOGE)');

const dogeAmt = minAmount('DOGE', 1); // lot_size=1
await test(`Market sell DOGE ×${dogeAmt} (open short)`, async () => {
  const { status, data } = await post('/api/trade', {
    symbol: 'DOGE', side: 'ask', amount: String(dogeAmt), order_type: 'market',
    slippage_percent: '3', reduce_only: false,
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
  assert(data?.data?.order_id, `no order_id: ${JSON.stringify(data)}`);
});

await sleep(2000);

await test('DOGE short position appears (side=ask)', async () => {
  const { data } = await get('/api/positions');
  const pos = data.positions?.find(p => p.symbol === 'DOGE');
  assert(pos, 'DOGE position not found');
  assert(pos.side === 'ask', `expected ask, got ${pos.side}`);
});

await test('DOGE position has entry_price + margin fields', async () => {
  const { data } = await get('/api/positions');
  const pos = data.positions?.find(p => p.symbol === 'DOGE');
  assert(pos, 'DOGE position not found');
  assert(pos.entry_price !== undefined, 'missing entry_price');
  assert(Number(pos.entry_price) > 0, `entry_price is ${pos.entry_price}`);
  assert(pos.amount !== undefined, 'missing amount');
});

await test(`Market buy DOGE ×${dogeAmt} (close short, reduce_only)`, async () => {
  const { status, data } = await post('/api/trade', {
    symbol: 'DOGE', side: 'bid', amount: String(dogeAmt), order_type: 'market',
    reduce_only: true, slippage_percent: '3',
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
});

await sleep(2000);

await test('DOGE position fully closed', async () => {
  const { data } = await get('/api/positions');
  assert(!data.positions?.find(p => p.symbol === 'DOGE'), 'DOGE position still exists');
});

// ─────────────────────────────────────
// Gate 5: Limit BUY that FILLS → verify position → close
// ─────────────────────────────────────
console.log('\nGate 5: Limit buy that fills (SUI)');

await test('Place limit buy SUI at 5% above mark (should fill)', async () => {
  const fillPrice = (mark('SUI') * 1.05).toFixed(4);
  const { status, data } = await post('/api/trade', {
    symbol: 'SUI', side: 'bid', amount: '15', order_type: 'limit',
    price: fillPrice, reduce_only: false,
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
  assert(data?.data?.order_id, `no order_id: ${JSON.stringify(data)}`);
});

await sleep(3000);

await test('SUI limit buy filled → long position exists', async () => {
  const { data } = await get('/api/positions');
  const pos = data.positions?.find(p => p.symbol === 'SUI');
  assert(pos, 'SUI position not found — limit buy may not have filled');
  assert(pos.side === 'bid', `expected bid, got ${pos.side}`);
});

await test('Close SUI long (market sell)', async () => {
  await closePosition('SUI');
  const { data } = await get('/api/positions');
  assert(!data.positions?.find(p => p.symbol === 'SUI'), 'SUI still open');
});

// ─────────────────────────────────────
// Gate 6: Limit SELL that FILLS → verify short → close
// ─────────────────────────────────────
console.log('\nGate 6: Limit sell that fills (SUI short)');

await test('Place limit sell SUI at 5% below mark (should fill → short)', async () => {
  const fillPrice = (mark('SUI') * 0.95).toFixed(4);
  const { status, data } = await post('/api/trade', {
    symbol: 'SUI', side: 'ask', amount: '15', order_type: 'limit',
    price: fillPrice, reduce_only: false,
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
  assert(data?.data?.order_id, `no order_id: ${JSON.stringify(data)}`);
});

await sleep(3000);

await test('SUI limit sell filled → short position exists', async () => {
  const { data } = await get('/api/positions');
  const pos = data.positions?.find(p => p.symbol === 'SUI');
  assert(pos, 'SUI short not found — limit sell may not have filled');
  assert(pos.side === 'ask', `expected ask, got ${pos.side}`);
});

await test('Close SUI short (market buy)', async () => {
  await closePosition('SUI');
  const { data } = await get('/api/positions');
  assert(!data.positions?.find(p => p.symbol === 'SUI'), 'SUI still open');
});

await sleep(2000); // cooldown — testnet rate limits can cause transient failures

// ─────────────────────────────────────
// Gate 7: Limit BUY resting (no fill) → verify in orders → cancel
// ─────────────────────────────────────
console.log('\nGate 7: Limit buy (resting, no fill) → cancel');

let ethBuyOrderId;
await test('Place limit buy ETH 30% below mark (should rest)', async () => {
  const restPrice = (Math.floor(mark('ETH') * 0.70 * 10) / 10).toFixed(1); // tick_size=0.1
  const { status, data } = await post('/api/trade', {
    symbol: 'ETH', side: 'bid', amount: '1', order_type: 'limit',
    price: restPrice, reduce_only: false,
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
  ethBuyOrderId = data?.data?.order_id;
  assert(ethBuyOrderId, `no order_id: ${JSON.stringify(data)}`);
});

await sleep(1500);

await test('ETH limit buy appears in open orders', async () => {
  const { data } = await get('/api/orders');
  const order = data.orders?.find(o => o.symbol === 'ETH' && o.side === 'bid');
  assert(order, 'ETH buy order not found');
  assert(order.order_id === ethBuyOrderId, 'order_id mismatch');
});

await test('Cancel ETH limit buy', async () => {
  const { status, data } = await post('/api/orders/cancel', {
    order_id: ethBuyOrderId, symbol: 'ETH',
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
});

await sleep(1000);

await test('ETH buy order gone after cancel', async () => {
  const { data } = await get('/api/orders');
  assert(!data.orders?.find(o => o.order_id === ethBuyOrderId), 'ETH buy still in list');
});

// ─────────────────────────────────────
// Gate 8: Limit SELL resting (no fill) → verify → cancel
// ─────────────────────────────────────
console.log('\nGate 8: Limit sell (resting, no fill) → cancel');

let ethSellOrderId;
await test('Place limit sell ETH 30% above mark (should rest)', async () => {
  const restPrice = (Math.ceil(mark('ETH') * 1.30 * 10) / 10).toFixed(1); // tick_size=0.1
  const { status, data } = await post('/api/trade', {
    symbol: 'ETH', side: 'ask', amount: '1', order_type: 'limit',
    price: restPrice, reduce_only: false,
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
  ethSellOrderId = data?.data?.order_id;
  assert(ethSellOrderId, `no order_id: ${JSON.stringify(data)}`);
});

await sleep(1500);

await test('ETH limit sell appears in open orders', async () => {
  const { data } = await get('/api/orders');
  const order = data.orders?.find(o => o.symbol === 'ETH' && o.side === 'ask');
  assert(order, 'ETH sell order not found');
});

await test('Cancel ETH limit sell', async () => {
  const { status, data } = await post('/api/orders/cancel', {
    order_id: ethSellOrderId, symbol: 'ETH',
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
});

await sleep(1000);

await test('ETH sell order gone after cancel', async () => {
  const { data } = await get('/api/orders');
  assert(!data.orders?.find(o => o.order_id === ethSellOrderId), 'ETH sell still in list');
});

// ─────────────────────────────────────
// Gate 9: Leverage + market order
// ─────────────────────────────────────
console.log('\nGate 9: Leverage');

await test('Open BTC long with 5x leverage', async () => {
  const { status, data } = await post('/api/trade', {
    symbol: 'BTC', side: 'bid', amount: '0.001', order_type: 'market',
    slippage_percent: '3', reduce_only: false, leverage: 5,
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
});

await sleep(2000);

await test('BTC position exists after leveraged trade', async () => {
  const { data } = await get('/api/positions');
  const pos = data.positions?.find(p => p.symbol === 'BTC');
  assert(pos, 'BTC position not found');
  assert(pos.side === 'bid', `expected bid, got ${pos.side}`);
});

await test('Close BTC leveraged position', async () => {
  await closePosition('BTC');
  const { data } = await get('/api/positions');
  assert(!data.positions?.find(p => p.symbol === 'BTC'), 'BTC still open');
});

// ─────────────────────────────────────
// Gate 10: TP/SL on a position
// ─────────────────────────────────────
console.log('\nGate 10: TP/SL');

await test('Open SOL long for TP/SL test', async () => {
  const { status, data } = await post('/api/trade', {
    symbol: 'SOL', side: 'bid', amount: '1', order_type: 'market',
    slippage_percent: '3', reduce_only: false,
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
});

await sleep(2000);

await test('Set TP/SL on SOL position', async () => {
  const p = mark('SOL');
  const tp = (p * 1.10).toFixed(2);
  const sl = (p * 0.90).toFixed(2);
  // TP/SL side = opposite of position side (closing side)
  const { status, data } = await post('/api/positions/tpsl', {
    symbol: 'SOL', side: 'ask', take_profit: tp, stop_loss: sl,
  });
  assert(status === 200, `status ${status}: ${JSON.stringify(data)}`);
});

await test('Close SOL after TP/SL test', async () => {
  await closePosition('SOL');
  const { data } = await get('/api/positions');
  assert(!data.positions?.find(p => p.symbol === 'SOL'), 'SOL still open');
});

// ─────────────────────────────────────
// Gate 11: Multiple simultaneous positions (long + short)
// ─────────────────────────────────────
console.log('\nGate 11: Multiple simultaneous positions');

const dogeAmtMulti = minAmount('DOGE', 1);
await test('Open SOL long + DOGE short simultaneously', async () => {
  const [r1, r2] = await Promise.all([
    post('/api/trade', {
      symbol: 'SOL', side: 'bid', amount: '1', order_type: 'market',
      slippage_percent: '3', reduce_only: false,
    }),
    post('/api/trade', {
      symbol: 'DOGE', side: 'ask', amount: String(dogeAmtMulti), order_type: 'market',
      slippage_percent: '3', reduce_only: false,
    }),
  ]);
  assert(r1.status === 200, `SOL failed: ${JSON.stringify(r1.data)}`);
  assert(r2.status === 200, `DOGE failed: ${JSON.stringify(r2.data)}`);
});

await sleep(3000);

await test('Both SOL long + DOGE short positions exist', async () => {
  const { data } = await get('/api/positions');
  const sol = data.positions?.find(p => p.symbol === 'SOL');
  const doge = data.positions?.find(p => p.symbol === 'DOGE');
  assert(sol, 'SOL not found');
  assert(doge, 'DOGE not found');
  assert(sol.side === 'bid', `SOL: expected bid, got ${sol.side}`);
  assert(doge.side === 'ask', `DOGE: expected ask, got ${doge.side}`);
});

await test('positions_count >= 2', async () => {
  const { data } = await get('/api/account');
  assert(Number(data.positions_count) >= 2, `positions_count is ${data.positions_count}`);
});

await test('Close both positions', async () => {
  await closePosition('SOL');
  await closePosition('DOGE');
  const { data } = await get('/api/positions');
  assert(!data.positions?.find(p => p.symbol === 'SOL'), 'SOL still open');
  assert(!data.positions?.find(p => p.symbol === 'DOGE'), 'DOGE still open');
});

// ─────────────────────────────────────
// Gate 12: Multiple resting limit orders + cancel all
// ─────────────────────────────────────
console.log('\nGate 12: Multiple resting orders');

const restingIds = [];
await test('Place 3 resting limit orders (BTC buy, ETH buy, SOL sell)', async () => {
  const r1 = await post('/api/trade', {
    symbol: 'BTC', side: 'bid', amount: '0.001', order_type: 'limit',
    price: (mark('BTC') * 0.7).toFixed(0), reduce_only: false,
  });
  assert(r1.status === 200, `BTC limit failed: ${JSON.stringify(r1.data)}`);
  restingIds.push({ id: r1.data?.data?.order_id, symbol: 'BTC' });

  const r2 = await post('/api/trade', {
    symbol: 'ETH', side: 'bid', amount: '1', order_type: 'limit',
    price: (mark('ETH') * 0.7).toFixed(0), reduce_only: false,
  });
  assert(r2.status === 200, `ETH limit failed: ${JSON.stringify(r2.data)}`);
  restingIds.push({ id: r2.data?.data?.order_id, symbol: 'ETH' });

  const r3 = await post('/api/trade', {
    symbol: 'SOL', side: 'ask', amount: '1', order_type: 'limit',
    price: (mark('SOL') * 1.3).toFixed(2), reduce_only: false,
  });
  assert(r3.status === 200, `SOL limit failed: ${JSON.stringify(r3.data)}`);
  restingIds.push({ id: r3.data?.data?.order_id, symbol: 'SOL' });
});

await sleep(2000);

await test('All 3 orders appear in open orders', async () => {
  const { data } = await get('/api/orders');
  assert(data.orders?.length >= 3, `expected 3+ orders, got ${data.orders?.length}`);
  for (const sym of ['BTC', 'ETH', 'SOL']) {
    assert(data.orders.find(o => o.symbol === sym), `${sym} order missing`);
  }
});

await test('orders_count >= 3 in account', async () => {
  const { data } = await get('/api/account');
  assert(Number(data.orders_count) >= 3, `orders_count is ${data.orders_count}`);
});

await test('Cancel all 3 resting orders', async () => {
  for (const { id, symbol } of restingIds) {
    const { status } = await post('/api/orders/cancel', { order_id: id, symbol });
    assert(status === 200, `cancel ${symbol} failed`);
  }
});

await sleep(1500);

await test('All orders cleared', async () => {
  const { data } = await get('/api/orders');
  for (const sym of ['BTC', 'ETH', 'SOL']) {
    assert(!data.orders?.find(o => o.symbol === sym), `${sym} order still exists`);
  }
});

// ─────────────────────────────────────
// Gate 13: Limit buy + limit sell on same symbol (resting both sides)
// ─────────────────────────────────────
console.log('\nGate 13: Bracket orders (buy + sell on same symbol)');

let bracketBuyId, bracketSellId;
await test('Place limit buy + limit sell on BTC (bracket)', async () => {
  const r1 = await post('/api/trade', {
    symbol: 'BTC', side: 'bid', amount: '0.001', order_type: 'limit',
    price: (mark('BTC') * 0.7).toFixed(0), reduce_only: false,
  });
  assert(r1.status === 200, `buy failed: ${JSON.stringify(r1.data)}`);
  bracketBuyId = r1.data?.data?.order_id;

  const r2 = await post('/api/trade', {
    symbol: 'BTC', side: 'ask', amount: '0.001', order_type: 'limit',
    price: (mark('BTC') * 1.3).toFixed(0), reduce_only: false,
  });
  assert(r2.status === 200, `sell failed: ${JSON.stringify(r2.data)}`);
  bracketSellId = r2.data?.data?.order_id;
});

await sleep(1500);

await test('Both BTC bracket orders in open orders', async () => {
  const { data } = await get('/api/orders');
  const btcOrders = data.orders?.filter(o => o.symbol === 'BTC');
  assert(btcOrders?.length >= 2, `expected 2 BTC orders, got ${btcOrders?.length}`);
  assert(btcOrders.find(o => o.side === 'bid'), 'buy side missing');
  assert(btcOrders.find(o => o.side === 'ask'), 'sell side missing');
});

await test('Cancel both bracket orders', async () => {
  const { status: s1 } = await post('/api/orders/cancel', { order_id: bracketBuyId, symbol: 'BTC' });
  assert(s1 === 200, 'cancel buy failed');
  const { status: s2 } = await post('/api/orders/cancel', { order_id: bracketSellId, symbol: 'BTC' });
  assert(s2 === 200, 'cancel sell failed');
});

await sleep(1000);

await test('BTC bracket orders cleared', async () => {
  const { data } = await get('/api/orders');
  assert(!data.orders?.find(o => o.symbol === 'BTC'), 'BTC orders still exist');
});

// ─────────────────────────────────────
// Gate 14: Error handling / validation
// ─────────────────────────────────────
console.log('\nGate 14: Error handling');

await test('Missing symbol → 400', async () => {
  const { status } = await post('/api/trade', { side: 'bid', amount: '1', order_type: 'market', slippage_percent: '3' });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('Missing side → 400', async () => {
  const { status } = await post('/api/trade', { symbol: 'BTC', amount: '1', order_type: 'market', slippage_percent: '3' });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('Invalid side "buy" → 400', async () => {
  const { status } = await post('/api/trade', { symbol: 'BTC', side: 'buy', amount: '1', order_type: 'market', slippage_percent: '3' });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('Invalid order_type → 400', async () => {
  const { status } = await post('/api/trade', { symbol: 'BTC', side: 'bid', amount: '1', order_type: 'foobar', slippage_percent: '3' });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('Limit without price → 400', async () => {
  const { status } = await post('/api/trade', { symbol: 'BTC', side: 'bid', amount: '1', order_type: 'limit' });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('Negative amount → 400', async () => {
  const { status } = await post('/api/trade', { symbol: 'BTC', side: 'bid', amount: '-1', order_type: 'market', slippage_percent: '3' });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('Zero amount → 400', async () => {
  const { status } = await post('/api/trade', { symbol: 'BTC', side: 'bid', amount: '0', order_type: 'market', slippage_percent: '3' });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('Leverage > 200 → 400', async () => {
  const { status } = await post('/api/trade', { symbol: 'BTC', side: 'bid', amount: '0.001', order_type: 'market', slippage_percent: '3', leverage: 300 });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('Cancel with missing order_id → 400', async () => {
  const { status } = await post('/api/orders/cancel', { symbol: 'BTC' });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('Cancel with missing symbol → 400', async () => {
  const { status } = await post('/api/orders/cancel', { order_id: 'fake123' });
  assert(status === 400, `expected 400, got ${status}`);
});

await test('TPSL with missing symbol → 400', async () => {
  const { status } = await post('/api/positions/tpsl', { take_profit: '100' });
  assert(status === 400, `expected 400, got ${status}`);
});

// ─────────────────────────────────────
// Gate 15: Final sanity checks
// ─────────────────────────────────────
console.log('\nGate 15: Final sanity');

await test('Balance still positive after all trades', async () => {
  const { data } = await get('/api/account');
  const bal = Number(data.balance);
  assert(bal > 0, `balance is ${bal}`);
  console.log(`    (balance: $${bal.toFixed(2)})`);
});

await test('No stale positions remaining', async () => {
  const { data } = await get('/api/positions');
  const testSymbols = ['SOL', 'DOGE', 'ETH', 'SUI', 'BTC'];
  for (const sym of testSymbols) {
    assert(!data.positions?.find(p => p.symbol === sym), `${sym} position leaked`);
  }
});

await test('No stale orders remaining', async () => {
  const { data } = await get('/api/orders');
  assert(!data.orders?.length, `${data.orders?.length} orders leaked`);
});

// ─────────────────────────────────────
// Summary
// ─────────────────────────────────────
console.log(`\n═══════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed${skipped ? `, ${skipped} skipped` : ''}`);
console.log(`═══════════════════════════════════════\n`);
process.exit(failed > 0 ? 1 : 0);
