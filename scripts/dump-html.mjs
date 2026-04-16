const html = await fetch('https://test-app.pacifica.fi').then(r => r.text());
console.log(html.substring(0, 5000));
console.log('\n\n--- LAST 2000 chars ---\n');
console.log(html.substring(Math.max(0, html.length - 2000)));
console.log('\n\nTotal length:', html.length);
