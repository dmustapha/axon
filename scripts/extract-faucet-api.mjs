// Fetch the testnet app page and extract JS bundle URLs, then search for faucet API calls
const APP_URL = 'https://test-app.pacifica.fi';

async function main() {
  // Fetch the HTML
  const html = await fetch(APP_URL).then(r => r.text());

  // Extract all script sources
  const scripts = [];
  for (const match of html.matchAll(/(?:src|href)="([^"]*(?:\.js|_next\/[^"]*)[^"]*)"/g)) {
    scripts.push(match[1]);
  }

  // Also look for inline script data
  const inlineScripts = [];
  for (const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
    if (match[1].trim().length > 0) {
      inlineScripts.push(match[1].substring(0, 500));
    }
  }

  console.log('Script URLs:', scripts.length);
  scripts.forEach(s => console.log(' ', s));

  console.log('\nInline scripts:', inlineScripts.length);
  inlineScripts.forEach((s, i) => console.log(`\n--- Inline ${i} ---\n${s.substring(0, 300)}`));

  // Fetch each JS bundle and search for faucet/mint/deposit keywords
  for (const src of scripts) {
    const url = src.startsWith('http') ? src : `${APP_URL}${src}`;
    try {
      const js = await fetch(url).then(r => r.text());

      // Search for relevant patterns
      const patterns = [
        /faucet/gi,
        /mint.*usdp/gi,
        /\/api\/.*faucet/gi,
        /request_faucet/gi,
        /claim.*token/gi,
        /deposit/gi,
        /register.*account/gi,
      ];

      let found = false;
      for (const pattern of patterns) {
        const matches = js.match(pattern);
        if (matches) {
          if (!found) {
            console.log(`\n=== ${src} (${(js.length/1024).toFixed(0)}KB) ===`);
            found = true;
          }
          // Find context around each match
          let idx = 0;
          for (let i = 0; i < Math.min(matches.length, 3); i++) {
            idx = js.indexOf(matches[i], idx);
            if (idx >= 0) {
              const ctx = js.substring(Math.max(0, idx - 80), Math.min(js.length, idx + 120));
              console.log(`  [${pattern.source}] ...${ctx.replace(/\n/g, ' ')}...`);
              idx += matches[i].length;
            }
          }
        }
      }
    } catch (e) {
      console.log(`Failed to fetch ${url}: ${e.message}`);
    }
  }
}

main();
