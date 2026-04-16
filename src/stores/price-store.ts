import type { MarketPrice, WsMessage } from '@/types';

type Listener = () => void;

// Module-level singleton state
let priceMap = new Map<string, MarketPrice>();
const prevPriceMap = new Map<string, string>();
const listeners = new Set<Listener>();
let initCount = 0;

function emitChange() {
  for (const fn of [...listeners]) fn();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getSnapshot(): Map<string, MarketPrice> {
  return priceMap;
}

const emptyMap = new Map<string, MarketPrice>();
export function getServerSnapshot(): Map<string, MarketPrice> {
  return emptyMap;
}

export function getPriceDirection(symbol: string, currentMark: string): 'up' | 'down' | 'none' {
  const prev = prevPriceMap.get(symbol);
  if (!prev) return 'none';
  const c = parseFloat(currentMark);
  const p = parseFloat(prev);
  if (c > p) return 'up';
  if (c < p) return 'down';
  return 'none';
}

export function initPriceListener(
  wsSub: (source: string) => void,
  wsUnsub: (source: string) => void,
  wsAddListener: (fn: (msg: WsMessage) => void) => () => void,
): () => void {
  initCount++;
  if (initCount > 1) return () => { initCount--; };

  wsSub('prices');

  const unsub = wsAddListener((msg) => {
    if (msg.channel !== 'prices') return;
    const arr = msg.data as MarketPrice[];
    if (!Array.isArray(arr)) return;

    // Save previous marks for direction detection
    for (const p of arr) {
      const old = priceMap.get(p.symbol);
      if (old) prevPriceMap.set(p.symbol, old.mark);
    }

    // Create new map reference so useSyncExternalStore detects change
    const next = new Map(priceMap);
    for (const p of arr) next.set(p.symbol, p);
    priceMap = next;

    emitChange();
  });

  return () => {
    wsUnsub('prices');
    unsub();
    initCount--;
  };
}
