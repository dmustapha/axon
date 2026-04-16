import nacl from 'tweetnacl';
import bs58 from 'bs58';

const privateKeyBase58 = '3CA4uDKjD7JzsErmSmtTvvSbjsigZNYu4XzAkHpWdbkXx4YooH8j51fuUNcpaQ8Zt75Mk6aiYJNsiDCTv91UBDNr';
const keyBytes = bs58.decode(privateKeyBase58);
const secretKey = keyBytes.length === 64 ? keyBytes : nacl.sign.keyPair.fromSeed(keyBytes).secretKey;
const publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;
const wallet = bs58.encode(publicKey);

function sortJsonKeys(value) {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => { acc[key] = sortJsonKeys(value[key]); return acc; }, {});
  }
  return value;
}

function signAndBuild(type, payload, account) {
  const timestamp = Date.now();
  const expiry_window = 30000;
  const header = { type, timestamp, expiry_window };
  const data = { ...header, data: payload };
  const sorted = sortJsonKeys(data);
  const message = JSON.stringify(sorted);
  const sig = nacl.sign.detached(new TextEncoder().encode(message), secretKey);

  return {
    account,
    agent_wallet: wallet,
    signature: bs58.encode(sig),
    timestamp,
    expiry_window,
    ...payload,
  };
}

const REST = 'https://test-api.pacifica.fi/api/v1';

// Test 1: wallet as account
console.log('=== Test 1: Derived wallet as account ===');
console.log('Account:', wallet);
let body = signAndBuild('get_account_info', {}, wallet);
let res = await fetch(`${REST}/account/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
console.log('Status:', res.status);
console.log('Response:', await res.text());

// Test 2: original public key as account
console.log('\n=== Test 2: EkJbD... as account ===');
body = signAndBuild('get_account_info', {}, 'EkJbDEimRZiYeFPT3bBWjSS8H23hEpnRXx6m26ACvTq7');
res = await fetch(`${REST}/account/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
console.log('Status:', res.status);
console.log('Response:', await res.text());

// Test 3: wallet as account, no agent_wallet field
console.log('\n=== Test 3: wallet as account, same as agent_wallet ===');
body = signAndBuild('get_account_info', {}, wallet);
delete body.agent_wallet;
res = await fetch(`${REST}/account/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
console.log('Status:', res.status);
console.log('Response:', await res.text());
