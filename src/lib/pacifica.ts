import { PACIFICA_REST_URL } from './constants';
import { signRequest } from './signing';

/**
 * GET request to Pacifica REST API (no auth needed).
 */
export async function pacificaGet<T>(path: string): Promise<T> {
  const res = await fetch(`${PACIFICA_REST_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pacifica GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
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
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pacifica POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}
