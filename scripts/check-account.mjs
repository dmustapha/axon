import nacl from 'tweetnacl';
import bs58 from 'bs58';

const PRIVATE_KEY = '3CA4uDKjD7JzsErmSmtTvvSbjsigZNYu4XzAkHpWdbkXx4YooH8j51fuUNcpaQ8Zt75Mk6aiYJNsiDCTv91UBDNr';
const PUBLIC_KEY = 'EkJbDEimRZiYeFPT3bBWjSS8H23hEpnRXx6m26ACvTq7';
const REST_URL = 'https://test-api.pacifica.fi/api/v1';

const secretKey = bs58.decode(PRIVATE_KEY);
const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
const walletPubkey = bs58.encode(keyPair.publicKey);

console.log('Wallet pubkey:', walletPubkey);
console.log('Account (exchange):', PUBLIC_KEY);

function sortKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj).sort().reduce((r, k) => { r[k] = sortKeys(obj[k]); return r; }, {});
}

function signRequest(type, params) {
  const timestamp = Date.now();
  const payload = { ...params, account: PUBLIC_KEY, agent_wallet: walletPubkey, timestamp };
  const sorted = sortKeys(payload);
  const message = new TextEncoder().encode(JSON.stringify(sorted));
  const signature = nacl.sign.detached(message, secretKey);
  return { ...sorted, signature: bs58.encode(signature) };
}

// Check account info
async function main() {
  console.log('\n--- Account Info ---');
  try {
    const body = signRequest('get_account_info', {});
    const res = await fetch(`${REST_URL}/account/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 500));
  } catch (e) {
    console.error('Error:', e.message);
  }

  // Try faucet endpoint
  console.log('\n--- Faucet Attempt ---');
  for (const path of ['/faucet', '/faucet/mint', '/account/faucet', '/testnet/faucet']) {
    try {
      const res = await fetch(`${REST_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: PUBLIC_KEY, token: 'USDP', amount: 10000 }) });
      console.log(`${path}: ${res.status}`);
      if (res.status !== 404) {
        const text = await res.text();
        console.log('  Response:', text.substring(0, 300));
      }
    } catch (e) {
      console.log(`${path}: error - ${e.message}`);
    }
  }

  // Try deposit endpoint
  console.log('\n--- Deposit Info ---');
  for (const path of ['/account/deposit', '/account/deposit_address', '/deposit', '/account/deposit_info']) {
    try {
      const body = signRequest('deposit', {});
      const res = await fetch(`${REST_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      console.log(`${path}: ${res.status}`);
      if (res.status !== 404) {
        const text = await res.text();
        console.log('  Response:', text.substring(0, 300));
      }
    } catch (e) {
      console.log(`${path}: error - ${e.message}`);
    }
  }

  // Try unsigned GET endpoints for info
  console.log('\n--- Exchange Config ---');
  for (const path of ['/config', '/exchange/config', '/system/config']) {
    try {
      const res = await fetch(`${REST_URL}${path}`);
      console.log(`${path}: ${res.status}`);
      if (res.status !== 404) {
        const text = await res.text();
        console.log('  Response:', text.substring(0, 500));
      }
    } catch (e) {
      console.log(`${path}: error - ${e.message}`);
    }
  }
}

main();
