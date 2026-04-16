import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const PROGRAM_ID = new PublicKey('PCFA5iYgmqK6MqPhWNKg7Yv7auX7VZ4Cx7T1eJyrAMH');
const CENTRAL_STATE = new PublicKey('9Gdmhq4Gv1LnNMp7aiS1HSVd7pNnXNMsbuXALCQRmGjY');

async function main() {
  // Read central state data
  const info = await connection.getAccountInfo(CENTRAL_STATE);
  if (!info) { console.log('Central state not found'); return; }

  console.log('Central state data length:', info.data.length);
  console.log('Raw hex:', info.data.toString('hex'));

  // Parse the data - try to extract public keys (32 bytes each)
  const data = info.data;
  let offset = 8; // Skip 8-byte discriminator

  // Try to read pubkeys from the data
  const keys = [];
  while (offset + 32 <= data.length) {
    const keyBytes = data.slice(offset, offset + 32);
    const key = new PublicKey(keyBytes);
    keys.push({ offset, key: key.toBase58() });
    offset += 32;
  }

  console.log('\nExtracted pubkeys:');
  for (const k of keys) {
    console.log(`  offset ${k.offset}: ${k.key}`);
    // Check if this account exists
    try {
      const acct = await connection.getAccountInfo(new PublicKey(k.key));
      if (acct) {
        console.log(`    EXISTS - owner: ${acct.owner.toBase58()}, data: ${acct.data.length} bytes, executable: ${acct.executable}`);
      } else {
        console.log('    NOT FOUND');
      }
    } catch (e) {
      console.log(`    ERROR: ${e.message}`);
    }
  }

  // Also check for PDAs
  console.log('\n=== Checking common PDAs ===');
  const pdas = [
    ['vault', Buffer.from('vault')],
    ['central_state', Buffer.from('central_state')],
    ['config', Buffer.from('config')],
  ];
  for (const [label, seed] of pdas) {
    try {
      const [pda] = PublicKey.findProgramAddressSync([seed], PROGRAM_ID);
      console.log(`PDA "${label}": ${pda.toBase58()}`);
      const acct = await connection.getAccountInfo(pda);
      if (acct) {
        console.log(`  EXISTS - owner: ${acct.owner.toBase58()}, data: ${acct.data.length} bytes`);
      } else {
        console.log('  NOT FOUND');
      }
    } catch (e) {
      console.log(`PDA "${label}": ERROR - ${e.message}`);
    }
  }

  // Find program accounts
  console.log('\n=== All accounts owned by Pacifica program ===');
  const programAccounts = await connection.getProgramAccounts(PROGRAM_ID);
  console.log(`Found ${programAccounts.length} accounts`);
  for (const pa of programAccounts) {
    console.log(`  ${pa.pubkey.toBase58()}: ${pa.account.data.length} bytes, lamports: ${pa.account.lamports}`);
  }
}

main();
