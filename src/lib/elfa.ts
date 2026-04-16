export const ELFA_BASE = 'https://api.elfa.ai';
export const ELFA_KEY = process.env.ELFA_API_KEY || '';

if (!ELFA_KEY && typeof process !== 'undefined') {
  console.warn('[elfa] ELFA_API_KEY not set — social intelligence features will be unavailable');
}

export function elfaHeaders(): Record<string, string> {
  return { 'x-elfa-api-key': ELFA_KEY };
}
