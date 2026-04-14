export const PACIFICA_REST_URL =
  process.env.NEXT_PUBLIC_PACIFICA_REST_URL || 'https://test-api.pacifica.fi/api/v1';

export const PACIFICA_WS_URL =
  process.env.NEXT_PUBLIC_PACIFICA_WS_URL || 'wss://test-ws.pacifica.fi/ws';

export const WS_PING_INTERVAL = 30_000;
export const WS_MAX_BACKOFF = 30_000;
export const POSITION_POLL_INTERVAL = 5_000;
export const MARKET_CACHE_TIME = 5 * 60 * 1000;

// Market categories derived from GET /info analysis
export const CATEGORY_MAP: Record<string, import('@/types').MarketCategory> = {
  // Crypto (default for most symbols)
  BTC: 'crypto', ETH: 'crypto', SOL: 'crypto', XRP: 'crypto', HYPE: 'crypto',
  LINK: 'crypto', ADA: 'crypto', DOGE: 'crypto', LTC: 'crypto', AVAX: 'crypto',
  TRUMP: 'crypto', SUI: 'crypto', BNB: 'crypto', AAVE: 'crypto', CRV: 'crypto',
  kBONK: 'crypto', TON: 'crypto', UNI: 'crypto', BCH: 'crypto', XMR: 'crypto',
  ARB: 'crypto', FARTCOIN: 'crypto', kPEPE: 'crypto', ENA: 'crypto', PENGU: 'crypto',
  WIF: 'crypto', VIRTUAL: 'crypto', ICP: 'crypto', ZK: 'crypto', STRK: 'crypto',
  WLFI: 'crypto', ZRO: 'crypto', LIT: 'crypto', PUMP: 'crypto', ZORA: 'crypto',
  ASTER: 'crypto', '2Z': 'crypto', MON: 'crypto', PIPPIN: 'crypto',
  WHITEWHALE: 'crypto', MEGA: 'crypto', BP: 'crypto', LINEA: 'crypto', PROVE: 'crypto',
  JUP: 'crypto', NEAR: 'crypto', TAO: 'crypto', CRCL: 'crypto', LDO: 'crypto',
  ZEC: 'crypto', PAXG: 'crypto',

  // Stocks
  NVDA: 'stocks', TSLA: 'stocks', GOOGL: 'stocks', PLTR: 'stocks', HOOD: 'stocks',
  SPY: 'stocks', QQQ: 'stocks', SP500: 'stocks',

  // Forex
  EURUSD: 'forex', GBPUSD: 'forex', USDJPY: 'forex', USDKRW: 'forex',

  // Commodities
  XAU: 'commodities', XAG: 'commodities', CL: 'commodities', COPPER: 'commodities',
  NATGAS: 'commodities', PLATINUM: 'commodities', URNM: 'commodities',

  // Spot
  'SOL-USDC': 'spot', 'BTC-USDC': 'spot', 'ETH-USDC': 'spot',
};

export function getCategory(symbol: string): import('@/types').MarketCategory {
  return CATEGORY_MAP[symbol] || 'crypto';
}
