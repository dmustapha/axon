import nacl from 'tweetnacl';
import bs58 from 'bs58';

const PRIVATE_KEY = '3CA4uDKjD7JzsErmSmtTvvSbjsigZNYu4XzAkHpWdbkXx4YooH8j51fuUNcpaQ8Zt75Mk6aiYJNsiDCTv91UBDNr';
const PUBLIC_KEY = 'EkJbDEimRZiYeFPT3bBWjSS8H23hEpnRXx6m26ACvTq7';
const REST = 'https://test-api.pacifica.fi/api/v1';

const secretKey = bs58.decode(PRIVATE_KEY);
const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey);
const walletPubkey = bs58.encode(keyPair.publicKey);

function sortKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj).sort().reduce((r, k) => { r[k] = sortKeys(obj[k]); return r; }, {});
}

function sign(type, params) {
  const ts = Date.now();
  const payload = { ...params, account: PUBLIC_KEY, agent_wallet: walletPubkey, timestamp: ts };
  const sorted = sortKeys(payload);
  const msg = new TextEncoder().encode(JSON.stringify(sorted));
  const sig = nacl.sign.detached(msg, secretKey);
  return { ...sorted, signature: bs58.encode(sig) };
}

async function main() {
  // Try register/create account endpoints
  const endpoints = [
    ['/account/register', 'register'],
    ['/account/create', 'create_account'],
    ['/register', 'register'],
    ['/account/register_agent', 'register_agent'],
    ['/account/activate', 'activate'],
    ['/account/register', 'register_account'],
    ['/agent/register', 'register_agent'],
    ['/agent/create', 'create_agent'],
  ];

  for (const [path, type] of endpoints) {
    try {
      const body = sign(type, { referral_code: 'Pacifica' });
      const res = await fetch(REST + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      console.log(`${path} (${type}): ${res.status}`);
      if (res.status !== 404) {
        const t = await res.text();
        console.log('  ', t.substring(0, 300));
      }
    } catch (e) {
      console.log(`${path}: ERR - ${e.message}`);
    }
  }

  // Also try with just wallet key (no separate account key)
  console.log('\n--- With wallet as account ---');
  function sign2(type, params) {
    const ts = Date.now();
    const payload = { ...params, account: walletPubkey, agent_wallet: walletPubkey, timestamp: ts };
    const sorted = sortKeys(payload);
    const msg = new TextEncoder().encode(JSON.stringify(sorted));
    const sig = nacl.sign.detached(msg, secretKey);
    return { ...sorted, signature: bs58.encode(sig) };
  }

  for (const [path, type] of [['/account/register', 'register'], ['/account/info', 'get_account_info']]) {
    try {
      const body = sign2(type, {});
      const res = await fetch(REST + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      console.log(`${path} (wallet as account): ${res.status}`);
      const t = await res.text();
      console.log('  ', t.substring(0, 300));
    } catch (e) {
      console.log(`${path}: ERR - ${e.message}`);
    }
  }
}

main();
