/**
 * Progressive shrinking JSON parser — tries strict parse first,
 * then searches for the largest valid JSON object in the string.
 */
export function parseJsonPermissive<T = Record<string, unknown>>(raw: string, fallback: T): T {
  const stripped = raw.trim().replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '');
  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf('{');
    if (start !== -1) {
      for (let end = stripped.lastIndexOf('}'); end > start; end = stripped.lastIndexOf('}', end - 1)) {
        try {
          return JSON.parse(stripped.slice(start, end + 1));
        } catch { /* try smaller */ }
      }
    }
    return fallback;
  }
}
