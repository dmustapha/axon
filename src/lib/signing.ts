import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Recursively sort all object keys alphabetically.
 * Arrays are preserved in order; primitives pass through.
 */
function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortJsonKeys(obj[key]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Derive the Pacifica account address from the private key.
 */
export function getAccountAddress(): string {
  const privateKeyBase58 = process.env.PACIFICA_PRIVATE_KEY;
  if (!privateKeyBase58) throw new Error('PACIFICA_PRIVATE_KEY not set');
  const keyBytes = bs58.decode(privateKeyBase58);
  const secretKey =
    keyBytes.length === 64
      ? keyBytes
      : nacl.sign.keyPair.fromSeed(keyBytes).secretKey;
  return bs58.encode(nacl.sign.keyPair.fromSecretKey(secretKey).publicKey);
}

/**
 * Sign a Pacifica API request.
 *
 * Signing flow (matches Python SDK exactly):
 * 1. Build header: { type, timestamp, expiry_window }
 * 2. Merge: { ...header, data: payload }
 * 3. Recursive sort all keys alphabetically
 * 4. Compact JSON: JSON.stringify (no whitespace)
 * 5. Sign: nacl.sign.detached(message, secretKey)
 * 6. Encode: bs58(signature)
 *
 * Request body is FLAT: { account, signature, timestamp, expiry_window, ...payload }
 */
export function signRequest(
  type: string,
  payload: Record<string, unknown>,
): {
  account: string;
  signature: string;
  timestamp: number;
  expiry_window: number;
} & Record<string, unknown> {
  const privateKeyBase58 = process.env.PACIFICA_PRIVATE_KEY;
  if (!privateKeyBase58) throw new Error('PACIFICA_PRIVATE_KEY not set');

  const keyBytes = bs58.decode(privateKeyBase58);
  const secretKey =
    keyBytes.length === 64
      ? keyBytes
      : nacl.sign.keyPair.fromSeed(keyBytes).secretKey;

  // Derive public key from private key — this IS the account
  const publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;
  const account = bs58.encode(publicKey);

  const timestamp = Date.now();
  const expiry_window = 5_000;

  const header = { type, timestamp, expiry_window };
  const data = { ...header, data: payload };
  const sorted = sortJsonKeys(data);
  const message = JSON.stringify(sorted);
  const messageBytes = new TextEncoder().encode(message);
  const sig = nacl.sign.detached(messageBytes, secretKey);

  return {
    account,
    signature: bs58.encode(sig),
    timestamp,
    expiry_window,
    ...payload,
  };
}
