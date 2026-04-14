import nacl from 'tweetnacl';
import bs58 from 'bs58';

const REST_URL = process.env.NEXT_PUBLIC_PACIFICA_REST_URL || 'https://test-api.pacifica.fi/api/v1';
const PRIVATE_KEY = process.env.PACIFICA_PRIVATE_KEY!;

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortJsonKeys(obj[key]);
      return acc;
    }, {});
  }
  return value;
}

function signAndPost(type: string, payload: Record<string, unknown>) {
  const keyBytes = bs58.decode(PRIVATE_KEY);
  const secretKey = keyBytes.length === 64 ? keyBytes : nacl.sign.keyPair.fromSeed(keyBytes).secretKey;
  const publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;
  const account = bs58.encode(publicKey);

  const timestamp = Date.now();
  const header = { type, timestamp, expiry_window: 5000 };
  const data = { ...header, data: payload };
  const message = JSON.stringify(sortJsonKeys(data));
  const sig = nacl.sign.detached(new TextEncoder().encode(message), secretKey);

  return {
    body: { account, signature: bs58.encode(sig), timestamp, expiry_window: 5000, ...payload },
    account,
  };
}

async function seed() {
  console.log('Seeding demo state...\n');

  // 1. Set leverage for BTC to 10x
  const levBTC = signAndPost('update_leverage', { symbol: 'BTC', leverage: 10 });
  const r1 = await fetch(`${REST_URL}/account/leverage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(levBTC.body),
  });
  console.log(`BTC leverage 10x: ${r1.status}`);

  // 2. Open BTC long (0.05 BTC)
  const btcOrder = signAndPost('create_market_order', {
    symbol: 'BTC',
    side: 'bid',
    amount: '0.05',
    reduce_only: false,
    slippage_percent: '1.0',
    client_order_id: crypto.randomUUID(),
  });
  const r2 = await fetch(`${REST_URL}/orders/create_market`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(btcOrder.body),
  });
  const d2 = await r2.json();
  console.log(`BTC long 0.05: ${r2.status}`, d2);

  // 3. Set leverage for ETH to 5x
  const levETH = signAndPost('update_leverage', { symbol: 'ETH', leverage: 5 });
  const r3 = await fetch(`${REST_URL}/account/leverage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(levETH.body),
  });
  console.log(`ETH leverage 5x: ${r3.status}`);

  // 4. Open ETH short (0.5 ETH)
  const ethOrder = signAndPost('create_market_order', {
    symbol: 'ETH',
    side: 'ask',
    amount: '0.5',
    reduce_only: false,
    slippage_percent: '1.0',
    client_order_id: crypto.randomUUID(),
  });
  const r4 = await fetch(`${REST_URL}/orders/create_market`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ethOrder.body),
  });
  const d4 = await r4.json();
  console.log(`ETH short 0.5: ${r4.status}`, d4);

  console.log('\nSeed complete. Verify positions at https://test-app.pacifica.fi');
}

seed().catch(console.error);
