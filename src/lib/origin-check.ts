import { NextRequest } from 'next/server';

/** CSRF protection: reject POST requests from foreign origins. */
export function checkOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser clients (curl, etc.)
  const host = req.headers.get('host') || '';
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}
