import { PACIFICA_REST_URL } from './constants';
import { signRequest, getAccountAddress } from './signing';

/**
 * GET request to Pacifica REST API (no auth needed).
 */
export async function pacificaGet<T>(path: string): Promise<T> {
  const res = await fetch(`${PACIFICA_REST_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pacifica GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * GET request with account query param (account info, positions, orders).
 */
export async function pacificaAccountGet<T>(path: string): Promise<T> {
  const account = getAccountAddress();
  const res = await fetch(`${PACIFICA_REST_URL}${path}?account=${account}`, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pacifica GET ${path} failed: ${res.status} ${text}`);
  }
  const json = await res.json() as { success: boolean; data: T };
  return json.data;
}

/**
 * POST request to Pacifica REST API (signed).
 */
export async function pacificaPost<T>(
  path: string,
  type: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const body = signRequest(type, payload);
  const res = await fetch(`${PACIFICA_REST_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pacifica POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}
