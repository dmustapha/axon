import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Known mainnet addresses from deposit.py
const MAINNET_PROGRAM = 'PCFA5iYgmqK6MqPhWNKg7Yv7auX7VZ4Cx7T1eJyrAMH';
const MAINNET_CENTRAL_STATE = '9Gdmhq4Gv1LnNMp7aiS1HSVd7pNnXNMsbuXALCQRmGjY';
const MAINNET_VAULT = '72R843XwZxqWhsJceARQQTTbYtWy6Zw9et2YV4FpRHTa';
const MAINNET_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Our wallet
const WALLET = '6zjjTGCtMRSS5mCmyJcejaoR6WKpqaEoNuSw9mw3a73G';
const ACCOUNT = 'EkJbDEimRZiYeFPT3bBWjSS8H23hEpnRXx6m26ACvTq7';

async function checkAccount(label, address) {
  try {
    const info = await connection.getAccountInfo(new PublicKey(address));
    if (info) {
      console.log(`${label} (${address}): EXISTS`);
      console.log(`  Owner: ${info.owner.toBase58()}`);
      console.log(`  Lamports: ${info.lamports}`);
      console.log(`  Data length: ${info.data.length}`);
      console.log(`  Executable: ${info.executable}`);
    } else {
      console.log(`${label} (${address}): NOT FOUND on devnet`);
    }
  } catch (e) {
    console.log(`${label}: ERROR - ${e.message}`);
  }
}

async function main() {
  console.log('=== Checking known addresses on Solana DEVNET ===\n');

  await checkAccount('Mainnet Program', MAINNET_PROGRAM);
  await checkAccount('Mainnet Central State', MAINNET_CENTRAL_STATE);
  await checkAccount('Mainnet Vault', MAINNET_VAULT);
  await checkAccount('Mainnet USDC Mint', MAINNET_USDC_MINT);
  await checkAccount('Our Wallet', WALLET);
  await checkAccount('Exchange Account', ACCOUNT);

  // Check wallet balance
  console.log('\n=== Wallet Balance ===');
  const balance = await connection.getBalance(new PublicKey(WALLET));
  console.log(`SOL balance: ${balance / 1e9} SOL`);

  // Check recent transactions for our wallet to find Pacifica program
  console.log('\n=== Recent Transactions ===');
  try {
    const sigs = await connection.getSignaturesForAddress(new PublicKey(WALLET), { limit: 5 });
    for (const sig of sigs) {
      console.log(`TX: ${sig.signature} (${new Date(sig.blockTime * 1000).toISOString()})`);
    }
  } catch (e) {
    console.log('No recent transactions');
  }

  // Search for token accounts
  console.log('\n=== Token Accounts ===');
  try {
    const tokenAccounts = await connection.getTokenAccountsByOwner(new PublicKey(WALLET), {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });
    console.log(`Found ${tokenAccounts.value.length} token accounts`);
    for (const ta of tokenAccounts.value) {
      console.log(`  ${ta.pubkey.toBase58()}: ${ta.account.data.length} bytes`);
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

main();
