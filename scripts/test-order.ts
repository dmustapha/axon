import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { readFileSync } from 'fs';

// Load .env.local manually
const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    process.env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}

const REST_URL = process.env.NEXT_PUBLIC_PACIFICA_REST_URL || 'https://test-api.pacifica.fi/api/v1';
const PRIVATE_KEY = process.env.PACIFICA_PRIVATE_KEY!;
// Main frontend wallet public key (from Pacifica UI header)
const MAIN_ACCOUNT = process.env.PACIFICA_PUBLIC_KEY!;

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

function signWithAgent(type: string, payload: Record<string, unknown>) {
  const keyBytes = bs58.decode(PRIVATE_KEY);
  const secretKey = keyBytes.length === 64 ? keyBytes : nacl.sign.keyPair.fromSeed(keyBytes).secretKey;
  const agentPubkey = bs58.encode(nacl.sign.keyPair.fromSecretKey(secretKey).publicKey);

  const timestamp = Date.now();
  const header = { type, timestamp, expiry_window: 5000 };
  const data = { ...header, data: payload };
  const message = JSON.stringify(sortJsonKeys(data));
  const sig = nacl.sign.detached(new TextEncoder().encode(message), secretKey);

  return {
    body: {
      account: MAIN_ACCOUNT,        // main wallet
      agent_wallet: agentPubkey,     // agent key signs
      signature: bs58.encode(sig),
      timestamp,
      expiry_window: 5000,
      ...payload,
    },
  };
}

async function test() {
  console.log('Testing with agent key pattern...');
  console.log('Main account:', MAIN_ACCOUNT);
  console.log('');

  // 1. Set leverage for BTC
  const lev = signWithAgent('update_leverage', { symbol: 'BTC', leverage: 10 });
  const levRes = await fetch(`${REST_URL}/account/leverage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lev.body),
  });
  console.log('Set leverage:', levRes.status, await levRes.json());

  // 2. Market order
  const order = signWithAgent('create_market_order', {
    symbol: 'BTC',
    side: 'bid',
    amount: '0.001',
    reduce_only: false,
    slippage_percent: '5.0',
    client_order_id: crypto.randomUUID(),
  });
  const orderRes = await fetch(`${REST_URL}/orders/create_market`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order.body),
  });
  console.log('Market order:', orderRes.status, await orderRes.text());
}

test().catch(console.error);
