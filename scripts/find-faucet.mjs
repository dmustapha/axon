// Try to find the faucet API on the testnet app
const APP_URL = 'https://test-app.pacifica.fi';
const API_URL = 'https://test-api.pacifica.fi';

async function probe(url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    return { status: res.status, ok: res.ok };
  } catch (e) {
    return { status: 'ERR', ok: false, error: e.message };
  }
}

async function main() {
  // Probe testnet app for API routes (it's a Next.js app)
  const appPaths = [
    '/api/faucet',
    '/api/mint',
    '/api/testnet/faucet',
    '/api/auth/register',
    '/api/account/create',
    '/api/token/mint',
  ];

  console.log('--- Probing testnet app API routes ---');
  for (const p of appPaths) {
    const r = await probe(`${APP_URL}${p}`, 'POST', { wallet: '6zjjTGCtMRSS5mCmyJcejaoR6WKpqaEoNuSw9mw3a73G', token: 'USDP' });
    console.log(`POST ${p}: ${r.status}`);
  }
  for (const p of appPaths) {
    const r = await probe(`${APP_URL}${p}`);
    console.log(`GET ${p}: ${r.status}`);
  }

  // Probe API server for non /api/v1 paths
  console.log('\n--- Probing API server root paths ---');
  const apiPaths = [
    '/faucet',
    '/api/faucet',
    '/api/v2/faucet',
    '/testnet/faucet',
    '/mint',
  ];
  for (const p of apiPaths) {
    const r = await probe(`${API_URL}${p}`, 'POST', { wallet: '6zjjTGCtMRSS5mCmyJcejaoR6WKpqaEoNuSw9mw3a73G' });
    console.log(`POST ${API_URL}${p}: ${r.status}`);
  }

  // Check if app has a _next/data endpoint we can probe
  console.log('\n--- Checking Next.js build manifest ---');
  const manifestRes = await fetch(`${APP_URL}/_next/data/`).catch(() => null);
  if (manifestRes) console.log('Build manifest:', manifestRes.status);

  // Try fetching the main JS chunk to find API calls
  console.log('\n--- Fetching app HTML for script URLs ---');
  const html = await fetch(APP_URL).then(r => r.text());
  const scripts = [...html.matchAll(/src="([^"]*\.js[^"]*)"/g)].map(m => m[1]);
  console.log('Script URLs found:', scripts.length);
  scripts.slice(0, 5).forEach(s => console.log(' ', s));
}

main();
