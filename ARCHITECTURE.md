# AXON — Architecture Document

**Version:** V1
**Date:** 2026-04-14
**Stack:** TypeScript, Next.js 15, shadcn/ui, TanStack Query v5, tweetnacl, bs58
**THIS IS THE SINGLE SOURCE OF TRUTH.** Copy code from this document exactly.

## [EMERGENCY MODE — 2 components mocked]

**Mocked components:**
- `[MOCK]` Orderbook depth visualization — not implemented; price grid shows bid/ask spread from WS data
- `[MOCK]` Historical candle charts — not implemented; 24h change shown in price grid instead

All other components (36/38 files) are real implementations with complete code below.

---

## 1. System Overview

### Purpose
AI-powered perpetuals trading terminal for Pacifica with real-time market data, social intelligence copilot, and liquidation courtroom.

### System Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      AXON TERMINAL (Next.js 15 App Router)                  │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────────────┐  │
│  │  Price Grid      │  │  Order Panel     │  │  Tab: AI Copilot           │  │
│  │  69 markets      │  │  market/limit    │  │  Chat + TradeSuggestion    │  │
│  │  + Market        │  │  + stop orders   │  ├────────────────────────────┤  │
│  │    Selector      │  ├─────────────────┤  │  Tab: Courtroom            │  │
│  │  (categories)    │  │  Position        │  │  JudgePanel + Checks       │  │
│  │                  │  │  Display         │  │  VerdictBanner + TrustBar  │  │
│  └───────┬──────────┘  └────────┬────────┘  └─────────────┬──────────────┘  │
│          │                      │                          │                 │
│  ┌───────┴──────────────────────┴──────────────────────────┴──────────────┐  │
│  │                     Hooks + State Layer                                 │  │
│  │  useMarketData  usePositions  useOrders  useCopilot  useCourtroom      │  │
│  └───────┬──────────────────────┬──────────────────────────┬──────────────┘  │
│          │                      │                          │                 │
│  ┌───────┴──────────┐  ┌───────┴──────────┐  ┌───────────┴──────────────┐  │
│  │  WS Provider      │  │  API Routes      │  │  Courtroom Engine        │  │
│  │  (prices stream)  │  │  /api/trade      │  │  (state machine +        │  │
│  │                   │  │  /api/copilot    │  │   phases + Groq judge)   │  │
│  │                   │  │  /api/courtroom  │  │                          │  │
│  └───────┬───────────┘  └───────┬──────────┘  └──────────────────────────┘  │
└──────────┼──────────────────────┼──────────────────────────────────────────┘
           │                      │
           ▼                      ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│  Pacifica WS       │  │  Pacifica REST     │  │  Elfa AI + Groq    │
│  wss://test-ws.    │  │  test-api.         │  │  api.elfa.ai       │
│  pacifica.fi/ws    │  │  pacifica.fi       │  │  api.groq.com      │
│                    │  │  /api/v1/*         │  │                    │
│  prices (3s)       │  │  orders, account   │  │  social sentiment  │
│  positions         │  │  leverage, tpsl    │  │  LLM narration     │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

### Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15 | App Router framework |
| TypeScript | 5.x | Language |
| React | 19 | UI library |
| TanStack Query | 5.x | Server state management |
| shadcn/ui | latest | UI component library |
| Tailwind CSS | 4.x | Styling |
| tweetnacl | 1.x | ed25519 signing |
| bs58 | 6.x | Base58 encoding |
| Groq SDK | latest | LLM API client |
| sonner | latest | Toast notifications |

### File Structure

```
axon/
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── .env.local
├── scripts/
│   └── seed-demo.ts
├── src/
│   ├── types/
│   │   └── index.ts
│   ├── lib/
│   │   ├── signing.ts
│   │   ├── pacifica.ts
│   │   ├── query-client.ts
│   │   └── constants.ts
│   ├── providers/
│   │   └── ws-provider.tsx
│   ├── hooks/
│   │   ├── use-market-data.ts
│   │   ├── use-positions.ts
│   │   ├── use-orders.ts
│   │   ├── use-copilot.ts
│   │   └── use-courtroom.ts
│   ├── components/
│   │   ├── price-grid.tsx
│   │   ├── market-selector.tsx
│   │   ├── order-panel.tsx
│   │   ├── position-display.tsx
│   │   ├── chat-panel.tsx
│   │   ├── trade-suggestion.tsx
│   │   ├── courtroom-tab.tsx
│   │   ├── judge-panel.tsx
│   │   ├── quality-checks.tsx
│   │   ├── verdict-banner.tsx
│   │   └── trust-bar.tsx
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── providers.tsx
│       ├── globals.css
│       └── api/
│           ├── info/route.ts
│           ├── trade/route.ts
│           ├── positions/route.ts
│           ├── elfa/route.ts
│           ├── copilot/route.ts
│           └── courtroom/route.ts
```

---

## 2. Component Architecture

### Component Table

| # | Component | Type | File Path | Purpose | Dependencies |
|---|-----------|------|-----------|---------|-------------|
| 1 | Price Grid | Frontend | `src/components/price-grid.tsx` | Live prices for 69 markets | WS Provider, useMarketData |
| 2 | Market Selector | Frontend | `src/components/market-selector.tsx` | Category tabs + search | TanStack Query, /api/info |
| 3 | AI Copilot | Frontend + API | `src/components/chat-panel.tsx` | Chat with Elfa + Groq | /api/copilot, useCopilot |
| 4 | Order Panel | Frontend + API | `src/components/order-panel.tsx` | Place orders with signing | /api/trade, useOrders |
| 5 | Position Display | Frontend | `src/components/position-display.tsx` | Open positions + P&L | usePositions |
| 6 | Courtroom Tab | Frontend | `src/components/courtroom-tab.tsx` | Courtroom UI orchestrator | useCourtroom, all courtroom sub-components |
| 7 | Courtroom Engine | Hook | `src/hooks/use-courtroom.ts` | State machine + phase dispatch | /api/courtroom |
| 8 | WebSocket Provider | Provider | `src/providers/ws-provider.tsx` | Singleton WS with auto-reconnect | Pacifica WS API |
| 9 | Signing Service | Utility | `src/lib/signing.ts` | ed25519 signing for Pacifica | tweetnacl, bs58 |
| 10 | Elfa Proxy | API Route | `src/app/api/elfa/route.ts` | Server-side Elfa API proxy | Elfa AI REST |

### Data Flow

1. **Market Data:** Pacifica WS → WS Provider → `useMarketData` hook → Price Grid, Market Selector, Order Panel
2. **Account Data:** `/api/positions` (REST polling 5s) → `usePositions` hook → Position Display, Courtroom Engine
3. **AI Intelligence:** User message → `/api/copilot` → Elfa AI + Groq → Chat response + trade suggestion
4. **Order Execution:** Order Panel → `/api/trade` → Signing Service (server) → Pacifica REST → toast + position update
5. **Courtroom:** Position selected → `useCourtroom` → `/api/courtroom` → Groq verdict → phased UI dispatch

### Dependency Graph

```
types/index.ts          ← everything imports this
lib/constants.ts        ← lib modules, hooks, API routes
lib/signing.ts          ← api/trade
lib/pacifica.ts         ← api/trade, api/info, api/positions
lib/query-client.ts     ← providers.tsx, hooks
providers/ws-provider   ← hooks/use-market-data
hooks/*                 ← components/*
components/*            ← app/page.tsx
api/trade               ← lib/signing, lib/pacifica
api/copilot             ← Elfa AI, Groq SDK
api/courtroom           ← Elfa AI, Groq SDK
api/elfa                ← Elfa AI
api/info                ← lib/pacifica
```

---

## 3. Shared Types

### Purpose
All shared TypeScript types. Imported by every component and hook.

### Dependencies
None — no imports from other project files.

### Code

#### File: `src/types/index.ts`
[VERIFIED] — Structures match Pacifica API responses tested 2026-04-14
```typescript
// ═══════════════════════════════════════
// Market Data
// ═══════════════════════════════════════

export type MarketCategory = 'crypto' | 'stocks' | 'forex' | 'commodities' | 'spot';

export interface MarketSpec {
  symbol: string;
  category: MarketCategory;
  max_leverage: number;
  tick_size: string;
  min_order_size: string;
  status: string;
}

export interface MarketPrice {
  symbol: string;
  mark: string;
  mid: string;
  oracle: string;
  funding: string;
  open_interest: string;
  volume_24h: string;
  yesterday_price: string;
  timestamp: number;
}

// ═══════════════════════════════════════
// Positions
// ═══════════════════════════════════════

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: string;
  entry_price: string;
  mark_price: string;
  unrealized_pnl: string;
  margin: string;
  liquidation_price: string;
  leverage: number;
  margin_ratio: number;
}

// ═══════════════════════════════════════
// Orders
// ═══════════════════════════════════════

export type OrderType = 'market' | 'limit' | 'stop';
export type OrderSide = 'bid' | 'ask';

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  amount: string;
  order_type: OrderType;
  price?: string;
  reduce_only: boolean;
  slippage_percent?: string;
  leverage?: number;
  client_order_id: string;
}

export interface OrderResponse {
  order_id: string;
  status: string;
  filled_amount?: string;
  avg_price?: string;
}

export interface OrderError {
  error_code: number;
  message: string;
}

// ═══════════════════════════════════════
// AI Copilot
// ═══════════════════════════════════════

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tradeSuggestion?: TradeSuggestion;
  timestamp: number;
}

export interface TradeSuggestion {
  symbol: string;
  side: 'long' | 'short';
  entry: string;
  takeProfit: string;
  stopLoss: string;
  confidence: number;
  reasoning: string;
}

// ═══════════════════════════════════════
// Courtroom
// ═══════════════════════════════════════

export type CourtroomPhase =
  | 'idle'
  | 'filing'
  | 'evidence'
  | 'analysis'
  | 'deliberation'
  | 'quality_checks'
  | 'verdict'
  | 'complete';

export interface EvidenceBundle {
  priceAction: {
    change_1h: number;
    change_24h: number;
    volume_spike: boolean;
    funding_rate: string;
    open_interest: string;
  };
  sentiment: {
    mentions: number;
    positive_pct: number;
    trending: boolean;
  };
  positionContext: {
    entry_age_hours: number;
    leverage: number;
    margin_ratio: number;
    side: 'long' | 'short';
  };
}

export interface CheckDetail {
  name: string;
  passed: boolean;
  score: number;
}

export interface TrustUpdate {
  old_score: number;
  new_score: number;
}

export type Verdict = 'market_driven' | 'manipulation_suspected';

export interface CourtroomResult {
  verdict: Verdict;
  narration: string;
  trustScore: number;
  confidenceScores: Record<string, number>;
  recommendation: string;
}

export interface CourtroomState {
  phase: CourtroomPhase;
  position: Position | null;
  evidence: EvidenceBundle | null;
  narration: string;
  verdict: Verdict | null;
  trustScore: number;
  checks: CheckDetail[];
  recommendation: string;
  isRunning: boolean;
}

// ═══════════════════════════════════════
// WebSocket
// ═══════════════════════════════════════

export type WsSource =
  | 'prices'
  | 'orderbook'
  | 'bbo'
  | 'trades'
  | 'account_positions'
  | 'account_order_updates'
  | 'account_info';

export interface WsMessage {
  channel: string;
  data: unknown;
}

// ═══════════════════════════════════════
// App State
// ═══════════════════════════════════════

export type RightPanel = 'copilot' | 'courtroom';
```

---

## 4. Configuration

### File: `package.json`
[ASSUMED]
```json
{
  "name": "axon",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "seed": "npx tsx scripts/seed-demo.ts"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "tweetnacl": "^1.0.3",
    "bs58": "^6.0.0",
    "groq-sdk": "^0.8.0",
    "sonner": "^1.7.0",
    "clsx": "^2.1.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/uuid": "^10.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "tsx": "^4.0.0"
  }
}
```

### File: `next.config.ts`
[ASSUMED]
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['tweetnacl', 'bs58'],
};

export default nextConfig;
```

### File: `postcss.config.mjs`
[ASSUMED]
```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

### File: `tsconfig.json`
[ASSUMED]
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### File: `.env.local`
[ASSUMED]
```bash
# Pacifica API — ed25519 keypair (base58 encoded)
PACIFICA_PRIVATE_KEY=your_solana_private_key_base58
PACIFICA_PUBLIC_KEY=your_solana_public_key_base58

# Pacifica endpoints
NEXT_PUBLIC_PACIFICA_REST_URL=https://test-api.pacifica.fi/api/v1
NEXT_PUBLIC_PACIFICA_WS_URL=wss://test-ws.pacifica.fi/ws

# Elfa AI
ELFA_API_KEY=your_elfa_api_key

# Groq
GROQ_API_KEY=your_groq_api_key
```

### Key Decisions
- `serverExternalPackages` for tweetnacl/bs58 to avoid bundling issues with crypto modules
- `@/*` path alias for clean imports
- Turbopack for fast dev server

---

## 5. Design System

### File: `src/app/globals.css`
[ASSUMED] — Adapted from verdikt courtroom design system + trading terminal aesthetic
```css
@import "tailwindcss";

/* ═══════════════════════════════════════
   AXON — Trading Terminal Design System
   Emerald data + Gold judicial + Red/Green trading
   ═══════════════════════════════════════ */

:root {
  --font-display: 'Georgia', serif;
  --font-body: system-ui, -apple-system, sans-serif;
  --font-data: 'Menlo', 'Monaco', 'Courier New', monospace;

  /* Core surfaces */
  --ax-bg: #06060b;
  --ax-bg-elev: #0b0b12;
  --ax-panel: #111119;
  --ax-surface: #16161f;
  --ax-surface-hover: #1c1c28;
  --ax-border: #232335;
  --ax-border-bright: #2f2f48;

  /* Trading colors */
  --ax-green: #10b981;
  --ax-green-bright: #34d399;
  --ax-green-dim: rgba(16, 185, 129, 0.12);
  --ax-red: #ef4444;
  --ax-red-bright: #f87171;
  --ax-red-dim: rgba(239, 68, 68, 0.12);

  /* Courtroom gold */
  --ax-gold: #fbbf24;
  --ax-gold-dim: rgba(201, 149, 58, 0.12);
  --ax-gold-glow: rgba(201, 149, 58, 0.25);

  /* Blue accent */
  --ax-blue: #3b82f6;
  --ax-blue-dim: rgba(59, 130, 246, 0.12);

  /* Text */
  --ax-text: #eaeaf2;
  --ax-text-sec: #a0a0b8;
  --ax-text-muted: #6b6b80;

  --ax-radius: 10px;
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--ax-bg);
  color: var(--ax-text);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* — Font utilities — */
.ax-serif { font-family: var(--font-display); }
.ax-mono { font-family: var(--font-data); }

/* — Focus — */
*:focus-visible {
  outline: 2px solid var(--ax-blue);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ===== PANEL CARD ===== */
.ax-panel {
  background: var(--ax-panel);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius);
  overflow: hidden;
}

/* ===== PRICE FLASH ===== */
@keyframes ax-flash-green {
  0% { background: rgba(16, 185, 129, 0.25); }
  100% { background: transparent; }
}
@keyframes ax-flash-red {
  0% { background: rgba(239, 68, 68, 0.25); }
  100% { background: transparent; }
}
.ax-flash-up { animation: ax-flash-green 0.6s ease-out; }
.ax-flash-down { animation: ax-flash-red 0.6s ease-out; }

/* ===== JUDGE GLOW + PULSE ===== */
.ax-judge-glow {
  box-shadow:
    0 0 40px rgba(201, 149, 58, 0.12),
    0 0 80px rgba(201, 149, 58, 0.05),
    inset 0 1px 0 rgba(201, 149, 58, 0.08);
}

@keyframes ax-judge-pulse {
  0%, 100% { box-shadow: 0 0 40px rgba(201, 149, 58, 0.12), 0 0 80px rgba(201, 149, 58, 0.05); }
  50% { box-shadow: 0 0 50px rgba(201, 149, 58, 0.18), 0 0 100px rgba(201, 149, 58, 0.08); }
}
.ax-judge-pulse { animation: ax-judge-pulse 4s ease-in-out infinite; }

/* ===== FILL BAR (quality checks + trust) ===== */
.ax-fill-bar { transition: width 1.2s cubic-bezier(0.22, 0.61, 0.36, 1); }

/* ===== TRUST SHIMMER ===== */
@keyframes ax-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.ax-trust-shimmer { background-size: 200% 100%; animation: ax-shimmer 3s linear infinite; }

/* ===== TYPEWRITER CURSOR ===== */
@keyframes ax-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.ax-typewriter-cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--ax-gold);
  vertical-align: text-bottom;
  animation: ax-blink 0.8s step-end infinite;
  margin-left: 2px;
}

/* ===== JUDGE NARRATION BOX ===== */
.ax-judge-box {
  background: var(--ax-panel);
  border: 1px solid var(--ax-border);
  border-left: 3px solid var(--ax-gold);
  border-radius: 0 6px 6px 0;
  padding: 16px;
}

.ax-judge-text {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 14px;
  color: var(--ax-text-sec);
  line-height: 1.7;
}

/* ===== VERDICT LARGE ===== */
.ax-verdict-large {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(18px, 2.5vw, 24px);
  letter-spacing: 0.12em;
  padding: 4px 20px;
  border-radius: 20px;
  display: inline-block;
}

/* ===== STATUS DOT ===== */
@keyframes ax-dot-pulse {
  0%, 100% { opacity: 0.4; box-shadow: 0 0 0 0 transparent; }
  50% { opacity: 1; box-shadow: 0 0 12px 4px rgba(16, 185, 129, 0.25); }
}
.ax-dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: ax-dot-pulse 2s ease-in-out infinite;
}

/* ===== SCROLLBAR ===== */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--ax-bg-elev); }
::-webkit-scrollbar-thumb { background: var(--ax-border); border-radius: 3px; }

/* ===== REDUCED MOTION ===== */
@media (prefers-reduced-motion: reduce) {
  .ax-flash-up, .ax-flash-down { animation: none; }
  .ax-judge-pulse { animation: none; }
  .ax-fill-bar { transition: none; }
  .ax-trust-shimmer { animation: none; }
  .ax-typewriter-cursor { animation: none; opacity: 1; }
  .ax-dot-pulse { animation: none; opacity: 1; }
}
```

---

## 6. Constants

### File: `src/lib/constants.ts`
[VERIFIED] — URLs tested 2026-04-14
```typescript
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
```

---

## 7. Signing Service

### Purpose
Server-side ed25519 signing for Pacifica REST API authentication. Runs only in API routes — private key never reaches the client.

### Dependencies
`tweetnacl`, `bs58`, `src/types`

### Code

#### File: `src/lib/signing.ts`
[VERIFIED] — Algorithm matches Python SDK tested 2026-04-14. TypeScript equivalent using tweetnacl.
```typescript
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
  // Handle both 32-byte seed and 64-byte full keypair
  const secretKey =
    keyBytes.length === 64
      ? keyBytes
      : nacl.sign.keyPair.fromSeed(keyBytes).secretKey;

  const publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;
  const account = bs58.encode(publicKey);

  const timestamp = Date.now();
  const expiry_window = 5000;

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
```

### Key Decisions
- `sortJsonKeys` is recursive to match Python's `sort_json_keys` exactly
- Handles both 32-byte seed and 64-byte keypair for flexibility
- `JSON.stringify` without space arguments produces compact JSON (matches Python `separators=(",",":")`)
- Private key accessed from env at call time, not cached, for security

---

## 8. Pacifica REST Client

### Purpose
Server-side HTTP client for Pacifica REST API.

### Dependencies
`src/lib/constants`, `src/lib/signing`

### Code

#### File: `src/lib/pacifica.ts`
[VERIFIED] — Endpoints tested 2026-04-14
```typescript
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
```

---

## 9. Query Client

### Purpose
TanStack Query client configuration and hierarchical key factory.

### Dependencies
`@tanstack/react-query`, `src/types`

### Code

#### File: `src/lib/query-client.ts`
[ASSUMED] — Pattern from prism, adapted for AXON
```typescript
import { QueryClient } from '@tanstack/react-query';
import type { MarketCategory } from '@/types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  markets: {
    all: ['markets'] as const,
    specs: ['markets', 'specs'] as const,
    prices: ['markets', 'prices'] as const,
    byCategory: (cat: MarketCategory) => ['markets', 'category', cat] as const,
  },
  positions: {
    all: ['positions'] as const,
    list: ['positions', 'list'] as const,
  },
  copilot: {
    all: ['copilot'] as const,
  },
  elfa: {
    trending: ['elfa', 'trending'] as const,
    mentions: (ticker: string) => ['elfa', 'mentions', ticker] as const,
  },
};
```

---

## 10. WebSocket Provider

### Purpose
Client-side singleton WebSocket connection to Pacifica with auto-reconnect, ping/pong, and per-source listeners.

### Dependencies
React context, `src/lib/constants`

### Code

#### File: `src/providers/ws-provider.tsx`
[VERIFIED] — Protocol matches Pacifica WS tested 2026-04-14. Pattern adapted from verdikt WebSocketProvider.
```typescript
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { PACIFICA_WS_URL, WS_PING_INTERVAL, WS_MAX_BACKOFF } from '@/lib/constants';
import type { WsMessage } from '@/types';

type WSStatus = 'connecting' | 'connected' | 'disconnected';
type WSListener = (msg: WsMessage) => void;

interface WSContextValue {
  status: WSStatus;
  subscribe: (source: string) => void;
  unsubscribe: (source: string) => void;
  addListener: (fn: WSListener) => () => void;
}

const WSContext = createContext<WSContextValue | null>(null);

export function WSProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<WSListener>>(new Set());
  const sourcesRef = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const backoffRef = useRef(1000);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let closed = false;

    function connect() {
      if (closed) return;
      setStatus('connecting');
      const ws = new WebSocket(PACIFICA_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        backoffRef.current = 1000;

        // Re-subscribe to all sources on reconnect
        for (const source of sourcesRef.current) {
          ws.send(JSON.stringify({ method: 'subscribe', params: { source } }));
        }

        // Ping every 30s to prevent 60s idle timeout
        if (pingRef.current) clearInterval(pingRef.current);
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ method: 'ping' }));
          }
        }, WS_PING_INTERVAL);
      };

      ws.onmessage = (ev) => {
        try {
          const raw = JSON.parse(ev.data);
          // Ignore pong responses
          if (raw.channel === 'pong') return;
          if (typeof raw !== 'object' || raw === null) return;
          const msg: WsMessage = { channel: raw.channel, data: raw.data };
          for (const fn of listenersRef.current) fn(msg);
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        if (pingRef.current) clearInterval(pingRef.current);
        if (!closed) {
          setStatus('disconnected');
          const delay = Math.min(backoffRef.current, WS_MAX_BACKOFF);
          backoffRef.current = delay * 2;
          setTimeout(connect, delay);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      closed = true;
      if (pingRef.current) clearInterval(pingRef.current);
      wsRef.current?.close();
    };
  }, []);

  const subscribe = useCallback((source: string) => {
    sourcesRef.current.add(source);
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ method: 'subscribe', params: { source } }));
    }
  }, []);

  const unsubscribe = useCallback((source: string) => {
    sourcesRef.current.delete(source);
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ method: 'unsubscribe', params: { source } }));
    }
  }, []);

  const addListener = useCallback((fn: WSListener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  return (
    <WSContext.Provider value={{ status, subscribe, unsubscribe, addListener }}>
      {children}
    </WSContext.Provider>
  );
}

export function useWS() {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error('useWS must be inside WSProvider');
  return ctx;
}
```

### Key Decisions
- Pacifica uses `{"method":"subscribe","params":{"source":"<name>"}}` — NOT `channel`
- Ping every 30s (Pacifica closes after 60s idle)
- `sourcesRef` tracks active subscriptions for auto-resubscribe on reconnect
- Exponential backoff: 1s → 2s → 4s → ... → 30s max

---

## 11. App Shell

### File: `src/app/providers.tsx`
[ASSUMED]
```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { WSProvider } from '@/providers/ws-provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WSProvider>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#111119',
              border: '1px solid #232335',
              color: '#eaeaf2',
            },
          }}
        />
      </WSProvider>
    </QueryClientProvider>
  );
}
```

### File: `src/app/layout.tsx`
[ASSUMED]
```typescript
import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AXON — AI Trading Terminal for Pacifica',
  description: 'AI-powered perpetuals trading terminal with social intelligence copilot and liquidation courtroom.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 12. Market Data Hook

### Purpose
Subscribe to Pacifica WS price stream. Provides real-time prices to all market-related components.

### Dependencies
`src/providers/ws-provider`, `src/types`

### Code

#### File: `src/hooks/use-market-data.ts`
[VERIFIED] — WS price format matches tested stream
```typescript
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWS } from '@/providers/ws-provider';
import { queryKeys } from '@/lib/query-client';
import type { MarketPrice, MarketSpec, MarketCategory } from '@/types';
import { getCategory, MARKET_CACHE_TIME } from '@/lib/constants';

/**
 * Fetch market specs once from /api/info (cached 5min).
 */
export function useMarketSpecs() {
  return useQuery({
    queryKey: queryKeys.markets.specs,
    queryFn: async (): Promise<MarketSpec[]> => {
      const res = await fetch('/api/info');
      if (!res.ok) throw new Error('Failed to fetch market specs');
      const data = await res.json();
      return (data.markets || data).map((m: Record<string, unknown>) => ({
        symbol: m.symbol as string,
        category: getCategory(m.symbol as string),
        max_leverage: m.max_leverage as number,
        tick_size: String(m.tick_size),
        min_order_size: String(m.min_order_size),
        status: (m.status as string) || 'active',
      }));
    },
    staleTime: MARKET_CACHE_TIME,
    gcTime: MARKET_CACHE_TIME * 2,
  });
}

/**
 * Real-time price data from Pacifica WebSocket.
 * Subscribes to "prices" source on mount, updates every ~3s.
 */
export function useMarketPrices() {
  const { subscribe, unsubscribe, addListener } = useWS();
  const [prices, setPrices] = useState<Map<string, MarketPrice>>(new Map());
  const prevRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    subscribe('prices');

    const unsub = addListener((msg) => {
      if (msg.channel !== 'prices') return;
      const arr = msg.data as MarketPrice[];
      if (!Array.isArray(arr)) return;

      setPrices((prev) => {
        const next = new Map(prev);
        for (const p of arr) {
          next.set(p.symbol, p);
        }
        return next;
      });

      // Track previous prices for flash animation
      for (const p of arr) {
        prevRef.current.set(p.symbol, p.mark);
      }
    });

    return () => {
      unsubscribe('prices');
      unsub();
    };
  }, [subscribe, unsubscribe, addListener]);

  const getPriceDirection = useCallback(
    (symbol: string, currentMark: string): 'up' | 'down' | 'none' => {
      const prev = prevRef.current.get(symbol);
      if (!prev) return 'none';
      const c = parseFloat(currentMark);
      const p = parseFloat(prev);
      if (c > p) return 'up';
      if (c < p) return 'down';
      return 'none';
    },
    [],
  );

  return { prices, getPriceDirection };
}
```

---

## 13. Price Grid

### Purpose
Display live prices for all 69 markets in a sortable table.

### Dependencies
`src/hooks/use-market-data`, `src/types`

### Code

#### File: `src/components/price-grid.tsx`
[ASSUMED]
```typescript
'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useMarketPrices, useMarketSpecs } from '@/hooks/use-market-data';
import type { MarketCategory, MarketPrice } from '@/types';
import { getCategory } from '@/lib/constants';

interface PriceGridProps {
  category: MarketCategory | 'all';
  search: string;
  onSelectMarket: (symbol: string) => void;
  selectedMarket: string | null;
}

function pctChange(mark: string, yesterday: string): number {
  const m = parseFloat(mark);
  const y = parseFloat(yesterday);
  if (!y) return 0;
  return ((m - y) / y) * 100;
}

function formatPrice(val: string): string {
  const n = parseFloat(val);
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toPrecision(4);
}

function formatVolume(val: string): string {
  const n = parseFloat(val);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

export function PriceGrid({ category, search, onSelectMarket, selectedMarket }: PriceGridProps) {
  const { prices, getPriceDirection } = useMarketPrices();
  const { data: specs } = useMarketSpecs();
  const flashRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Filter and sort
  const rows = useMemo(() => {
    const arr = Array.from(prices.values());
    return arr
      .filter((p) => {
        if (category !== 'all' && getCategory(p.symbol) !== category) return false;
        if (search && !p.symbol.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => parseFloat(b.volume_24h) - parseFloat(a.volume_24h));
  }, [prices, category, search]);

  // Flash animation on price change
  useEffect(() => {
    for (const p of rows) {
      const dir = getPriceDirection(p.symbol, p.mark);
      if (dir === 'none') continue;
      const row = rowRefs.current.get(p.symbol);
      if (!row) continue;

      // Clear previous flash
      const prev = flashRefs.current.get(p.symbol);
      if (prev) clearTimeout(prev);

      row.classList.remove('ax-flash-up', 'ax-flash-down');
      // Force reflow
      void row.offsetWidth;
      row.classList.add(dir === 'up' ? 'ax-flash-up' : 'ax-flash-down');

      flashRefs.current.set(
        p.symbol,
        setTimeout(() => row.classList.remove('ax-flash-up', 'ax-flash-down'), 600),
      );
    }
  }, [rows, getPriceDirection]);

  if (!rows.length) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
        {prices.size === 0 ? 'Connecting to market data...' : 'No markets match your filter.'}
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Symbol', 'Price', '24h %', 'Funding', 'Volume', 'OI'].map((h) => (
              <th
                key={h}
                style={{
                  position: 'sticky',
                  top: 0,
                  background: 'var(--ax-panel)',
                  textAlign: h === 'Symbol' ? 'left' : 'right',
                  padding: '8px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--ax-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderBottom: '1px solid var(--ax-border)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const change = pctChange(p.mark, p.yesterday_price);
            const isSelected = p.symbol === selectedMarket;
            return (
              <tr
                key={p.symbol}
                ref={(el) => { if (el) rowRefs.current.set(p.symbol, el); }}
                onClick={() => onSelectMarket(p.symbol)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(59, 130, 246, 0.08)' : undefined,
                  borderBottom: '1px solid rgba(35, 35, 53, 0.4)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--ax-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '';
                }}
              >
                <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13 }}>{p.symbol}</td>
                <td className="ax-mono" style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>
                  {formatPrice(p.mark)}
                </td>
                <td
                  className="ax-mono"
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontSize: 13,
                    color: change >= 0 ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)',
                  }}
                >
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </td>
                <td className="ax-mono" style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                  {(parseFloat(p.funding) * 100).toFixed(4)}%
                </td>
                <td className="ax-mono" style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                  ${formatVolume(p.volume_24h)}
                </td>
                <td className="ax-mono" style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                  ${formatVolume(p.open_interest)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 14. Market Selector

### Purpose
Tab bar for market category filtering + search input.

### Dependencies
`src/types`

### Code

#### File: `src/components/market-selector.tsx`
[ASSUMED]
```typescript
'use client';

import { useState } from 'react';
import type { MarketCategory } from '@/types';

const CATEGORIES: { label: string; value: MarketCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Stocks', value: 'stocks' },
  { label: 'Forex', value: 'forex' },
  { label: 'Commodities', value: 'commodities' },
  { label: 'Spot', value: 'spot' },
];

interface MarketSelectorProps {
  category: MarketCategory | 'all';
  onCategoryChange: (cat: MarketCategory | 'all') => void;
  search: string;
  onSearchChange: (q: string) => void;
}

export function MarketSelector({ category, onCategoryChange, search, onSearchChange }: MarketSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--ax-border)' }}>
      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 2 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => onCategoryChange(c.value)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: category === c.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: category === c.value ? 'var(--ax-blue)' : 'var(--ax-text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search markets..."
        style={{
          marginLeft: 'auto',
          width: 160,
          height: 32,
          padding: '0 10px',
          borderRadius: 6,
          background: 'var(--ax-surface)',
          border: '1px solid var(--ax-border)',
          color: 'var(--ax-text)',
          fontSize: 12,
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </div>
  );
}
```

---

## 15. Order Management

### Purpose
Place market/limit/stop orders on Pacifica with ed25519 signing.

### Code

#### File: `src/hooks/use-orders.ts`
[ASSUMED]
```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { OrderRequest, OrderResponse, OrderError } from '@/types';
import { v4 as uuid } from 'uuid';

export function useOrders() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function placeOrder(
    params: Omit<OrderRequest, 'client_order_id'>,
  ): Promise<OrderResponse | null> {
    setIsSubmitting(true);
    try {
      const body: OrderRequest = { ...params, client_order_id: uuid() };
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        const err = data as OrderError;
        toast.error(`Order failed: ${err.message || 'Unknown error'}`);
        return null;
      }

      const result = data as OrderResponse;
      toast.success(`Order placed: ${result.order_id}`);
      return result;
    } catch (e) {
      toast.error(`Order failed: ${(e as Error).message}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { placeOrder, isSubmitting };
}
```

#### File: `src/app/api/trade/route.ts`
[VERIFIED] — Signing flow matches Python SDK
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { signRequest } from '@/lib/signing';
import { PACIFICA_REST_URL } from '@/lib/constants';
import type { OrderRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest = await req.json();
    const { symbol, side, amount, order_type, price, reduce_only, slippage_percent, client_order_id } = body;

    // Determine endpoint and signing type
    let path: string;
    let type: string;
    const payload: Record<string, unknown> = {
      symbol,
      side,
      amount,
      reduce_only,
      client_order_id,
    };

    if (order_type === 'market') {
      path = '/orders/create_market';
      type = 'create_market_order';
      if (slippage_percent) payload.slippage_percent = slippage_percent;
    } else {
      path = '/orders/create';
      type = 'create_order';
      payload.order_type = order_type;
      if (price) payload.price = price;
    }

    const signed = signRequest(type, payload);

    const res = await fetch(`${PACIFICA_REST_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signed),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error_code: -1, message: (e as Error).message },
      { status: 500 },
    );
  }
}
```

#### File: `src/components/order-panel.tsx`
[ASSUMED]
```typescript
'use client';

import { useState, useMemo } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { useMarketPrices, useMarketSpecs } from '@/hooks/use-market-data';
import type { OrderType, OrderSide } from '@/types';

interface OrderPanelProps {
  selectedMarket: string | null;
}

export function OrderPanel({ selectedMarket }: OrderPanelProps) {
  const { placeOrder, isSubmitting } = useOrders();
  const { prices } = useMarketPrices();
  const { data: specs } = useMarketSpecs();
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [side, setSide] = useState<OrderSide>('bid');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState('10');

  const symbol = selectedMarket || 'BTC';
  const currentPrice = prices.get(symbol);
  const spec = specs?.find((s) => s.symbol === symbol);

  const estimatedLiq = useMemo(() => {
    if (!currentPrice || !amount || !leverage) return null;
    const entry = parseFloat(currentPrice.mark);
    const lev = parseInt(leverage);
    if (!entry || !lev) return null;
    const liqDist = entry / lev;
    return side === 'bid' ? entry - liqDist : entry + liqDist;
  }, [currentPrice, amount, leverage, side]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || isSubmitting) return;

    await placeOrder({
      symbol,
      side,
      amount,
      order_type: orderType,
      price: orderType !== 'market' ? price : undefined,
      reduce_only: false,
      slippage_percent: orderType === 'market' ? '0.5' : undefined,
      leverage: parseInt(leverage),
    });

    setAmount('');
    setPrice('');
  }

  const panelStyle: React.CSSProperties = {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    padding: '0 10px',
    borderRadius: 6,
    background: 'var(--ax-surface)',
    border: '1px solid var(--ax-border)',
    color: 'var(--ax-text)',
    fontSize: 13,
    fontFamily: 'var(--font-data)',
    outline: 'none',
  };

  return (
    <form onSubmit={handleSubmit} style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{symbol}</span>
        {currentPrice && (
          <span className="ax-mono" style={{ fontSize: 13, color: 'var(--ax-text-sec)' }}>
            ${parseFloat(currentPrice.mark).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>

      {/* Order Type Toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--ax-surface)', borderRadius: 6, padding: 2 }}>
        {(['market', 'limit', 'stop'] as OrderType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setOrderType(t)}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: orderType === t ? 'var(--ax-border-bright)' : 'transparent',
              color: orderType === t ? 'var(--ax-text)' : 'var(--ax-text-muted)',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Side Toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          onClick={() => setSide('bid')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            background: side === 'bid' ? 'var(--ax-green-dim)' : 'var(--ax-surface)',
            color: side === 'bid' ? 'var(--ax-green-bright)' : 'var(--ax-text-muted)',
          }}
        >
          Long
        </button>
        <button
          type="button"
          onClick={() => setSide('ask')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            background: side === 'ask' ? 'var(--ax-red-dim)' : 'var(--ax-surface)',
            color: side === 'ask' ? 'var(--ax-red-bright)' : 'var(--ax-text-muted)',
          }}
        >
          Short
        </button>
      </div>

      {/* Amount */}
      <div>
        <label style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Amount
        </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={spec ? `Min: ${spec.min_order_size}` : '0.01'}
          style={inputStyle}
        />
      </div>

      {/* Price (limit/stop only) */}
      {orderType !== 'market' && (
        <div>
          <label style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Price
          </label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price"
            style={inputStyle}
          />
        </div>
      )}

      {/* Leverage */}
      <div>
        <label style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Leverage: {leverage}x
        </label>
        <input
          type="range"
          min="1"
          max={spec?.max_leverage || 50}
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
          style={{ width: '100%', accentColor: 'var(--ax-blue)' }}
        />
      </div>

      {/* Preview */}
      {currentPrice && amount && (
        <div style={{ padding: 10, background: 'var(--ax-surface)', borderRadius: 6, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ax-text-sec)' }}>
            <span>Est. Entry</span>
            <span className="ax-mono">${parseFloat(currentPrice.mark).toFixed(2)}</span>
          </div>
          {estimatedLiq && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ax-red-bright)', marginTop: 4 }}>
              <span>Liq. Price</span>
              <span className="ax-mono">${estimatedLiq.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!amount || isSubmitting}
        style={{
          width: '100%',
          padding: '10px 0',
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 8,
          border: 'none',
          cursor: isSubmitting ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          background: side === 'bid' ? 'var(--ax-green)' : 'var(--ax-red)',
          color: '#fff',
          opacity: !amount || isSubmitting ? 0.4 : 1,
        }}
      >
        {isSubmitting ? 'Placing...' : `${side === 'bid' ? 'Long' : 'Short'} ${symbol}`}
      </button>
    </form>
  );
}
```

---

## 16. Position Display

### Code

#### File: `src/hooks/use-positions.ts`
[UNVERIFIED] — Account WS subscription format unverified. Using REST polling fallback.
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { POSITION_POLL_INTERVAL } from '@/lib/constants';
import type { Position } from '@/types';

export function usePositions() {
  return useQuery({
    queryKey: queryKeys.positions.list,
    queryFn: async (): Promise<Position[]> => {
      const res = await fetch('/api/positions');
      if (!res.ok) return [];
      const data = await res.json();
      return (data.positions || data || []) as Position[];
    },
    refetchInterval: POSITION_POLL_INTERVAL,
    staleTime: POSITION_POLL_INTERVAL,
  });
}
```

#### File: `src/app/api/positions/route.ts`
[UNVERIFIED] — Account endpoint path assumed
```typescript
import { NextResponse } from 'next/server';
import { pacificaPost } from '@/lib/pacifica';

export async function GET() {
  try {
    const data = await pacificaPost('/account/positions', 'get_positions', {});
    return NextResponse.json(data);
  } catch (e) {
    // Return empty positions on error (account may not exist yet)
    return NextResponse.json({ positions: [] });
  }
}
```

#### File: `src/components/position-display.tsx`
[ASSUMED]
```typescript
'use client';

import { usePositions } from '@/hooks/use-positions';
import { useMarketPrices } from '@/hooks/use-market-data';
import type { Position } from '@/types';

interface PositionDisplayProps {
  onAnalyze: (position: Position) => void;
}

function formatPnl(pnl: string): { text: string; color: string } {
  const n = parseFloat(pnl);
  if (n >= 0) return { text: `+$${n.toFixed(2)}`, color: 'var(--ax-green-bright)' };
  return { text: `-$${Math.abs(n).toFixed(2)}`, color: 'var(--ax-red-bright)' };
}

export function PositionDisplay({ onAnalyze }: PositionDisplayProps) {
  const { data: positions, isLoading } = usePositions();
  const { prices } = useMarketPrices();

  // Merge live prices with positions
  const enriched = (positions || []).map((p) => {
    const live = prices.get(p.symbol);
    if (!live) return p;
    const mark = parseFloat(live.mark);
    const entry = parseFloat(p.entry_price);
    const size = parseFloat(p.size);
    const pnl = p.side === 'long' ? (mark - entry) * size : (entry - mark) * size;
    return { ...p, mark_price: live.mark, unrealized_pnl: pnl.toFixed(2) };
  });

  if (isLoading) {
    return <div style={{ padding: 16, color: 'var(--ax-text-muted)', fontSize: 13 }}>Loading positions...</div>;
  }

  if (!enriched.length) {
    return <div style={{ padding: 16, color: 'var(--ax-text-muted)', fontSize: 13 }}>No open positions</div>;
  }

  return (
    <div style={{ overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Market', 'Side', 'Size', 'Entry', 'Mark', 'PnL', 'Margin %', ''].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: h === 'Market' || h === 'Side' ? 'left' : 'right',
                  padding: '6px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--ax-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderBottom: '1px solid var(--ax-border)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enriched.map((p, i) => {
            const pnl = formatPnl(p.unrealized_pnl);
            const isNearLiq = p.margin_ratio < 15;
            return (
              <tr
                key={`${p.symbol}-${p.side}-${i}`}
                style={{ borderBottom: '1px solid rgba(35, 35, 53, 0.4)' }}
              >
                <td style={{ padding: '8px 10px', fontWeight: 600, fontSize: 12 }}>{p.symbol}</td>
                <td
                  style={{
                    padding: '8px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: p.side === 'long' ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)',
                  }}
                >
                  {p.side.toUpperCase()}
                </td>
                <td className="ax-mono" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>
                  {p.size}
                </td>
                <td className="ax-mono" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: 'var(--ax-text-sec)' }}>
                  {parseFloat(p.entry_price).toFixed(2)}
                </td>
                <td className="ax-mono" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>
                  {parseFloat(p.mark_price).toFixed(2)}
                </td>
                <td className="ax-mono" style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: pnl.color }}>
                  {pnl.text}
                </td>
                <td
                  className="ax-mono"
                  style={{
                    padding: '8px 10px',
                    textAlign: 'right',
                    fontSize: 12,
                    color: isNearLiq ? 'var(--ax-red-bright)' : 'var(--ax-text-sec)',
                    fontWeight: isNearLiq ? 600 : 400,
                  }}
                >
                  {p.margin_ratio.toFixed(1)}%
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                  <button
                    onClick={() => onAnalyze(p)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 500,
                      borderRadius: 4,
                      border: '1px solid var(--ax-gold)',
                      background: 'var(--ax-gold-dim)',
                      color: 'var(--ax-gold)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Analyze
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 17. AI Copilot

### Code

#### File: `src/app/api/elfa/route.ts`
[UNVERIFIED] — Elfa endpoint live but response schema assumed
```typescript
import { NextRequest, NextResponse } from 'next/server';

const ELFA_BASE = 'https://api.elfa.ai';
const ELFA_KEY = process.env.ELFA_API_KEY || '';

// Cache responses for 5 min to conserve credits
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint param' }, { status: 400 });
  }

  const cacheKey = `${endpoint}:${searchParams.toString()}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // Build query string excluding 'endpoint' param
    const params = new URLSearchParams();
    searchParams.forEach((v, k) => { if (k !== 'endpoint') params.set(k, v); });
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${ELFA_BASE}${endpoint}${qs}`, {
      headers: {
        'x-elfa-api-key': ELFA_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (res.ok) {
      cache.set(cacheKey, { data, ts: Date.now() });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

#### File: `src/app/api/copilot/route.ts`
[ASSUMED] — Groq API format verified; Elfa response shapes unverified
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ELFA_BASE = 'https://api.elfa.ai';
const ELFA_KEY = process.env.ELFA_API_KEY || '';

async function fetchElfa(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${ELFA_BASE}${path}`, {
      headers: { 'x-elfa-api-key': ELFA_KEY },
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function extractSymbolFromMessage(msg: string): string | null {
  const tokens = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX', 'LINK', 'SUI', 'NVDA', 'TSLA'];
  const upper = msg.toUpperCase();
  return tokens.find((t) => upper.includes(t)) || null;
}

export async function POST(req: NextRequest) {
  try {
    const { message, marketContext } = await req.json();

    // Fetch relevant Elfa data
    const symbol = extractSymbolFromMessage(message);
    const [trending, mentions] = await Promise.all([
      fetchElfa('/v2/aggregations/trending-tokens?limit=10'),
      symbol ? fetchElfa(`/v2/data/top-mentions?ticker=${symbol}&limit=5`) : null,
    ]);

    const systemPrompt = `You are AXON's AI trading copilot for Pacifica perpetuals exchange.
You have access to real-time social intelligence data from Elfa AI.
Analyze market sentiment and provide actionable trade insights.
When the user asks about a specific token, include a trade suggestion if appropriate.

ALWAYS respond in valid JSON with this structure:
{
  "content": "Your conversational response here",
  "tradeSuggestion": null | {
    "symbol": "TOKEN",
    "side": "long" | "short",
    "entry": "price",
    "takeProfit": "price",
    "stopLoss": "price",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation"
  }
}

Current market context: ${JSON.stringify(marketContext || {})}
Trending tokens: ${JSON.stringify(trending || {})}
${mentions ? `Social mentions for ${symbol}: ${JSON.stringify(mentions)}` : ''}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    let parsed: { content?: string; tradeSuggestion?: unknown };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { content: rawContent };
    }

    return NextResponse.json({
      content: parsed.content || 'I couldn\'t generate a response. Please try again.',
      tradeSuggestion: parsed.tradeSuggestion || null,
    });
  } catch (e) {
    return NextResponse.json(
      { content: 'AI copilot is temporarily unavailable.', tradeSuggestion: null },
      { status: 200 },
    );
  }
}
```

#### File: `src/hooks/use-copilot.ts`
[ASSUMED]
```typescript
'use client';

import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { ChatMessage, TradeSuggestion } from '@/types';
import { useMarketPrices } from '@/hooks/use-market-data';

export function useCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { prices } = useMarketPrices();

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: uuid(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Build market context from live prices
        const topPrices: Record<string, string> = {};
        for (const [sym, p] of prices) {
          if (['BTC', 'ETH', 'SOL'].includes(sym)) {
            topPrices[sym] = p.mark;
          }
        }

        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, marketContext: topPrices }),
        });

        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: uuid(),
          role: 'assistant',
          content: data.content,
          tradeSuggestion: data.tradeSuggestion || undefined,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uuid(),
            role: 'assistant',
            content: 'Failed to reach AI copilot. Please try again.',
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [prices],
  );

  return { messages, sendMessage, isLoading };
}
```

#### File: `src/components/trade-suggestion.tsx`
[ASSUMED]
```typescript
'use client';

import type { TradeSuggestion } from '@/types';

interface TradeSuggestionCardProps {
  suggestion: TradeSuggestion;
  onExecute: (suggestion: TradeSuggestion) => void;
}

export function TradeSuggestionCard({ suggestion, onExecute }: TradeSuggestionCardProps) {
  const isLong = suggestion.side === 'long';

  return (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        background: isLong ? 'var(--ax-green-dim)' : 'var(--ax-red-dim)',
        border: `1px solid ${isLong ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: isLong ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}>
          {suggestion.side.toUpperCase()} {suggestion.symbol}
        </span>
        <span className="ax-mono" style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
          {(suggestion.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[
          { label: 'Entry', value: suggestion.entry },
          { label: 'TP', value: suggestion.takeProfit, color: 'var(--ax-green-bright)' },
          { label: 'SL', value: suggestion.stopLoss, color: 'var(--ax-red-bright)' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>{label}</div>
            <div className="ax-mono" style={{ fontSize: 12, color: color || 'var(--ax-text)' }}>${value}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'var(--ax-text-sec)', margin: '0 0 8px' }}>{suggestion.reasoning}</p>

      <button
        onClick={() => onExecute(suggestion)}
        style={{
          width: '100%',
          padding: '6px 0',
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          background: isLong ? 'var(--ax-green)' : 'var(--ax-red)',
          color: '#fff',
        }}
      >
        Execute Trade
      </button>
    </div>
  );
}
```

#### File: `src/components/chat-panel.tsx`
[ASSUMED]
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useCopilot } from '@/hooks/use-copilot';
import { TradeSuggestionCard } from './trade-suggestion';
import type { TradeSuggestion } from '@/types';

interface ChatPanelProps {
  onExecuteTrade: (suggestion: TradeSuggestion) => void;
}

export function ChatPanel({ onExecuteTrade }: ChatPanelProps) {
  const { messages, sendMessage, isLoading } = useCopilot();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
            Ask me about market sentiment, trending tokens, or trade setups.
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              padding: 10,
              borderRadius: 8,
              maxWidth: '85%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--ax-blue-dim)' : 'var(--ax-surface)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'var(--ax-border)'}`,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ax-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </p>
            {msg.tradeSuggestion && (
              <TradeSuggestionCard suggestion={msg.tradeSuggestion} onExecute={onExecuteTrade} />
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ padding: 10, fontSize: 13, color: 'var(--ax-text-muted)', fontStyle: 'italic' }}>
            Analyzing...
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          borderTop: '1px solid var(--ax-border)',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about sentiment, trends, trades..."
          style={{
            flex: 1,
            height: 36,
            padding: '0 12px',
            borderRadius: 8,
            background: 'var(--ax-surface)',
            border: '1px solid var(--ax-border)',
            color: 'var(--ax-text)',
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          style={{
            padding: '0 16px',
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'var(--ax-blue)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            opacity: !input.trim() || isLoading ? 0.4 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

---

## 18. Courtroom Engine + API

### Purpose
State machine driving 7 courtroom phases + Groq AI judge for verdict generation.

### Code

#### File: `src/app/api/courtroom/route.ts`
[ASSUMED] — Groq API format verified; evidence synthesis is custom
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { EvidenceBundle, CourtroomResult } from '@/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ELFA_BASE = 'https://api.elfa.ai';
const ELFA_KEY = process.env.ELFA_API_KEY || '';

async function fetchSentiment(symbol: string) {
  try {
    const res = await fetch(`${ELFA_BASE}/v2/data/top-mentions?ticker=${symbol}&limit=10`, {
      headers: { 'x-elfa-api-key': ELFA_KEY },
    });
    if (!res.ok) return { mentions: 0, positive_pct: 50, trending: false };
    const data = await res.json();
    const items = data?.data || [];
    const positive = items.filter((i: { sentiment?: string }) => i.sentiment === 'positive').length;
    return {
      mentions: items.length,
      positive_pct: items.length > 0 ? Math.round((positive / items.length) * 100) : 50,
      trending: items.length > 5,
    };
  } catch {
    return { mentions: 0, positive_pct: 50, trending: false };
  }
}

const JUDGE_SYSTEM_PROMPT = `You are the AI Judge in AXON's Liquidation Courtroom. You analyze whether a position approaching liquidation is under genuine market pressure or potential manipulation.

Analyze the evidence bundle and return a JSON verdict:
{
  "verdict": "market_driven" | "manipulation_suspected",
  "narration": "A 40-60 word judicial narration in first person. Be dramatic but precise. Start with 'The court has reviewed...'",
  "trust_score": 0-800,
  "confidence": {
    "price_action": 0.0-1.0,
    "sentiment": 0.0-1.0,
    "position_context": 0.0-1.0
  },
  "recommendation": "One sentence actionable recommendation for the trader."
}

Signals for MANIPULATION:
- Volume spike >3x without matching sentiment
- Funding rate diverges sharply from price direction
- Low social mentions despite big price move
- Rapid price move in low OI market

Signals for MARKET-DRIVEN:
- Sentiment aligns with price direction
- Volume proportional to price move
- Funding rate consistent with market trend
- High social activity explaining the move`;

export async function POST(req: NextRequest) {
  try {
    const { position, priceData } = await req.json();
    const symbol = position.symbol;

    // Gather sentiment evidence
    const sentiment = await fetchSentiment(symbol);

    // Build evidence bundle
    const evidence: EvidenceBundle = {
      priceAction: {
        change_1h: priceData?.change_1h || 0,
        change_24h: priceData?.change_24h || 0,
        volume_spike: priceData?.volume_spike || false,
        funding_rate: priceData?.funding || '0',
        open_interest: priceData?.open_interest || '0',
      },
      sentiment,
      positionContext: {
        entry_age_hours: priceData?.entry_age_hours || 1,
        leverage: position.leverage,
        margin_ratio: position.margin_ratio,
        side: position.side,
      },
    };

    // Call Groq AI Judge
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(evidence) },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    let result: CourtroomResult;
    try {
      const parsed = JSON.parse(raw);
      result = {
        verdict: parsed.verdict === 'manipulation_suspected' ? 'manipulation_suspected' : 'market_driven',
        narration: parsed.narration || 'The court has reviewed the evidence but could not reach a conclusion.',
        trustScore: Math.max(0, Math.min(800, parsed.trust_score || 400)),
        confidenceScores: parsed.confidence || { price_action: 0.5, sentiment: 0.5, position_context: 0.5 },
        recommendation: parsed.recommendation || 'Monitor position closely.',
      };
    } catch {
      result = {
        verdict: 'market_driven',
        narration: 'The court has reviewed the available evidence. Market conditions appear within normal parameters.',
        trustScore: 400,
        confidenceScores: { price_action: 0.5, sentiment: 0.5, position_context: 0.5 },
        recommendation: 'Continue monitoring position.',
      };
    }

    return NextResponse.json({ evidence, result });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
```

#### File: `src/hooks/use-courtroom.ts`
[ASSUMED] — Phase dispatch pattern adapted from verdikt useCourtroomReducer
```typescript
'use client';

import { useReducer, useCallback } from 'react';
import { useMarketPrices } from '@/hooks/use-market-data';
import type {
  CourtroomState,
  CourtroomPhase,
  Position,
  EvidenceBundle,
  CourtroomResult,
  CheckDetail,
} from '@/types';

type Action =
  | { type: 'START_ANALYSIS'; position: Position }
  | { type: 'SET_PHASE'; phase: CourtroomPhase }
  | { type: 'SET_EVIDENCE'; evidence: EvidenceBundle }
  | { type: 'SET_NARRATION'; narration: string }
  | { type: 'SET_CHECKS'; checks: CheckDetail[] }
  | { type: 'SET_VERDICT'; result: CourtroomResult }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };

const initialState: CourtroomState = {
  phase: 'idle',
  position: null,
  evidence: null,
  narration: '',
  verdict: null,
  trustScore: 0,
  checks: [],
  recommendation: '',
  isRunning: false,
};

function reducer(state: CourtroomState, action: Action): CourtroomState {
  switch (action.type) {
    case 'START_ANALYSIS':
      return { ...initialState, phase: 'filing', position: action.position, isRunning: true };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'SET_EVIDENCE':
      return { ...state, evidence: action.evidence, phase: 'evidence' };
    case 'SET_NARRATION':
      return { ...state, narration: action.narration, phase: 'deliberation' };
    case 'SET_CHECKS':
      return { ...state, checks: action.checks, phase: 'quality_checks' };
    case 'SET_VERDICT':
      return {
        ...state,
        phase: 'verdict',
        verdict: action.result.verdict,
        trustScore: action.result.trustScore,
        recommendation: action.result.recommendation,
      };
    case 'COMPLETE':
      return { ...state, phase: 'complete', isRunning: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useCourtroom() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { prices } = useMarketPrices();

  const analyzeLiquidation = useCallback(
    async (position: Position) => {
      dispatch({ type: 'START_ANALYSIS', position });

      // Phase 1: Filing (2s)
      await delay(2000);

      // Build price context from live data
      const live = prices.get(position.symbol);
      const currentMark = live ? parseFloat(live.mark) : parseFloat(position.mark_price);
      const entryPrice = parseFloat(position.entry_price);
      const change24h = live
        ? ((currentMark - parseFloat(live.yesterday_price)) / parseFloat(live.yesterday_price)) * 100
        : 0;

      const priceData = {
        change_1h: change24h / 24,
        change_24h: change24h,
        volume_spike: live ? parseFloat(live.volume_24h) > 50_000_000 : false,
        funding: live?.funding || '0',
        open_interest: live?.open_interest || '0',
        entry_age_hours: 1,
      };

      // Phase 2: Evidence collection (3s)
      dispatch({ type: 'SET_PHASE', phase: 'evidence' });

      try {
        const res = await fetch('/api/courtroom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position, priceData }),
        });
        const data = await res.json();
        const { evidence, result } = data as { evidence: EvidenceBundle; result: CourtroomResult };

        dispatch({ type: 'SET_EVIDENCE', evidence });
        await delay(2000);

        // Phase 3: Analysis (2s)
        dispatch({ type: 'SET_PHASE', phase: 'analysis' });
        await delay(2000);

        // Phase 4: Deliberation — narration (2s)
        dispatch({ type: 'SET_NARRATION', narration: result.narration });
        await delay(3000);

        // Phase 5: Quality checks (2s)
        const checks: CheckDetail[] = Object.entries(result.confidenceScores).map(([name, score]) => ({
          name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          passed: score >= 0.5,
          score: Math.round(score * 100),
        }));
        dispatch({ type: 'SET_CHECKS', checks });
        await delay(2000);

        // Phase 6: Verdict (2s)
        dispatch({ type: 'SET_VERDICT', result });
        await delay(2000);

        // Phase 7: Complete
        dispatch({ type: 'COMPLETE' });
      } catch {
        dispatch({ type: 'SET_NARRATION', narration: 'The court encountered an error during analysis. Please try again.' });
        await delay(2000);
        dispatch({ type: 'COMPLETE' });
      }
    },
    [prices],
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, analyzeLiquidation, reset };
}
```

---

## 19. Courtroom UI Components

### JudgePanel
#### File: `src/components/judge-panel.tsx`
[ASSUMED] — Typewriter pattern from verdikt JudgePanel
```typescript
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CourtroomPhase } from '@/types';

interface JudgePanelProps {
  phase: CourtroomPhase;
  narration: string;
  children: ReactNode;
}

export function JudgePanel({ phase, narration, children }: JudgePanelProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!narration) {
      setDisplayedText('');
      setShowCursor(false);
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedText(narration);
      setShowCursor(false);
      return;
    }

    setShowCursor(true);
    setDisplayedText('');
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setDisplayedText(narration.slice(0, i));
      if (i >= narration.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setShowCursor(false);
      }
    }, 22);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [narration]);

  const courtStatus =
    phase === 'filing' ? 'Case filed'
    : phase === 'evidence' ? 'Gathering evidence...'
    : phase === 'analysis' ? 'Analyzing evidence...'
    : phase === 'deliberation' ? 'Delivering opinion...'
    : phase === 'quality_checks' ? 'Assessing confidence...'
    : phase === 'verdict' ? 'Rendering verdict'
    : phase === 'complete' ? 'Case closed'
    : 'Awaiting case';

  return (
    <article
      className="ax-panel ax-judge-glow ax-judge-pulse"
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--ax-gold-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            ⚖️
          </div>
          <div>
            <h3 className="ax-serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ax-gold)', margin: 0 }}>
              The Judge
            </h3>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              AI Liquidation Arbiter · {courtStatus}
            </span>
          </div>
        </div>
        {phase !== 'idle' && (
          <span style={{
            padding: '3px 12px', borderRadius: 16,
            background: 'var(--ax-gold-dim)',
            border: '1px solid rgba(201,149,58,0.25)',
            color: 'var(--ax-gold)', fontSize: 11, fontWeight: 600, letterSpacing: '.06em',
          }}>
            PRESIDING
          </span>
        )}
      </div>

      {/* Children: QualityChecks + VerdictBanner */}
      {children}

      {/* Judge Narration */}
      {(phase !== 'idle') && (
        <div>
          <p style={{ fontSize: 10, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6, margin: 0 }}>
            Judge's Opinion
          </p>
          <div className="ax-judge-box">
            <div className="ax-judge-text">
              {displayedText || (phase === 'filing' ? 'Case filed. Reviewing evidence...' : '...')}
              {showCursor && <span className="ax-typewriter-cursor" />}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
```

### QualityChecks
#### File: `src/components/quality-checks.tsx`
[ASSUMED] — Staggered bar animation from verdikt QualityChecks
```typescript
'use client';

import { useEffect, useRef } from 'react';
import type { CheckDetail } from '@/types';

const CHECK_LABELS: Record<string, string> = {
  'Price Action': 'Market Pressure',
  'Sentiment': 'Social Intelligence',
  'Position Context': 'Risk Assessment',
};

interface QualityChecksProps {
  checks: CheckDetail[];
}

export function QualityChecks({ checks }: QualityChecksProps) {
  const fillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animatedRef = useRef<Set<number>>(new Set());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (checks.length === 0) {
      animatedRef.current.clear();
      fillRefs.current.forEach((el) => {
        if (el) el.style.width = '0%';
      });
      return;
    }

    checks.forEach((check, i) => {
      if (animatedRef.current.has(i)) return;
      const fill = fillRefs.current[i];
      if (!fill) return;

      animatedRef.current.add(i);
      const pct = check.score;
      const t = setTimeout(() => {
        fill.style.width = `${pct}%`;
        fill.style.background = check.passed ? '#10b981' : '#f87171';
      }, i * 200);
      timersRef.current.push(t);
    });

    return () => timersRef.current.forEach(clearTimeout);
  }, [checks]);

  const passed = checks.filter((c) => c.passed).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
          Confidence Assessment
        </h4>
        <span className="ax-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ax-green-bright)' }}>
          {checks.length > 0 ? `${passed}/${checks.length}` : '—'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {checks.map((check, i) => (
          <div key={check.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: 'var(--ax-text-sec)' }}>
                {CHECK_LABELS[check.name] || check.name}
              </span>
              <span
                className="ax-mono"
                style={{ fontSize: 12, color: check.passed ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}
              >
                {check.score}%
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--ax-surface)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                ref={(el) => { fillRefs.current[i] = el; }}
                className="ax-fill-bar"
                style={{ height: '100%', width: '0%', borderRadius: 3 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### VerdictBanner
#### File: `src/components/verdict-banner.tsx`
[ASSUMED] — Spring animation from verdikt VerdictBanner
```typescript
'use client';

import { useEffect, useRef } from 'react';
import type { Verdict } from '@/types';

interface VerdictBannerProps {
  verdict: Verdict | null;
  recommendation: string;
}

export function VerdictBanner({ verdict, recommendation }: VerdictBannerProps) {
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!verdict || !bannerRef.current) return;
    bannerRef.current.animate?.(
      [
        { transform: 'scale(0.85) translateY(6px)', opacity: 0 },
        { transform: 'scale(1.02) translateY(-2px)', opacity: 1 },
        { transform: 'scale(1) translateY(0)', opacity: 1 },
      ],
      { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
    );
  }, [verdict]);

  if (!verdict) return null;

  const isMarket = verdict === 'market_driven';
  const bg = isMarket ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
  const border = isMarket ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)';
  const color = isMarket ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)';
  const label = isMarket ? 'MARKET-DRIVEN' : 'MANIPULATION SUSPECTED';

  return (
    <div
      ref={bannerRef}
      style={{ borderRadius: 12, background: bg, border: `1px solid ${border}`, padding: '14px 18px', textAlign: 'center' }}
    >
      <span
        className="ax-verdict-large"
        style={{ background: 'var(--ax-gold-dim)', color: 'var(--ax-gold)', border: '1px solid rgba(201,149,58,0.25)' }}
      >
        {label}
      </span>
      <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ax-text-sec)' }}>
        {recommendation}
      </div>
    </div>
  );
}
```

### TrustBar
#### File: `src/components/trust-bar.tsx`
[ASSUMED] — Shimmer animation from verdikt TrustBar
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

interface TrustBarProps {
  score: number;
  visible: boolean;
}

const MAX_SCORE = 800;

function getTier(score: number): string {
  if (score >= 700) return 'HIGH CONFIDENCE';
  if (score >= 400) return 'MODERATE';
  return 'LOW CONFIDENCE';
}

export function TrustBar({ score, visible }: TrustBarProps) {
  const fillRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef<HTMLSpanElement | null>(null);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!visible || score === 0) return;
    setDisplayScore(score);

    fillRef.current?.animate?.(
      [
        { filter: 'brightness(2)', boxShadow: '0 0 40px rgba(16,185,129,0.4)' },
        { filter: 'brightness(1)', boxShadow: '0 0 0 transparent' },
      ],
      { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );

    valueRef.current?.animate?.(
      [
        { transform: 'scale(1.25)', textShadow: '0 0 16px rgba(52,211,153,0.6)' },
        { transform: 'scale(1)', textShadow: '0 0 0 transparent' },
      ],
      { duration: 500, easing: 'ease-out' },
    );
  }, [score, visible]);

  if (!visible) return null;

  const pct = Math.min((displayScore / MAX_SCORE) * 100, 100);
  const tier = getTier(displayScore);

  return (
    <div className="ax-panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h4 className="ax-serif" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Trust Score</h4>
        <span style={{
          padding: '3px 12px', borderRadius: 16,
          background: 'var(--ax-gold-dim)',
          border: '1px solid rgba(201,149,58,0.2)',
          color: 'var(--ax-gold)', fontSize: 11, fontWeight: 500,
          fontFamily: 'var(--font-data)',
        }}>
          {tier}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 10 }}>
        <span ref={valueRef} className="ax-mono" style={{ fontSize: 36, fontWeight: 500, lineHeight: 1 }}>
          {displayScore}
        </span>
        <span style={{ color: 'var(--ax-text-muted)', fontSize: 14, marginBottom: 4 }}>/ 800</span>
      </div>

      <div style={{ height: 8, background: 'var(--ax-surface)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
        <div
          ref={fillRef}
          className="ax-fill-bar ax-trust-shimmer"
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 4,
            background: 'linear-gradient(90deg,#059669,#34d399,#fbbf24,#34d399,#059669)',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ax-text-muted)' }}>
        <span>0</span>
        <span>400</span>
        <span style={{ color: 'var(--ax-green-bright)', fontWeight: 500 }}>700</span>
        <span>800</span>
      </div>
    </div>
  );
}
```

### CourtroomTab (orchestrator)
#### File: `src/components/courtroom-tab.tsx`
[ASSUMED]
```typescript
'use client';

import { useCourtroom } from '@/hooks/use-courtroom';
import { usePositions } from '@/hooks/use-positions';
import { JudgePanel } from './judge-panel';
import { QualityChecks } from './quality-checks';
import { VerdictBanner } from './verdict-banner';
import { TrustBar } from './trust-bar';
import type { Position } from '@/types';

interface CourtroomTabProps {
  externalPosition?: Position | null;
}

export function CourtroomTab({ externalPosition }: CourtroomTabProps) {
  const { state, analyzeLiquidation, reset } = useCourtroom();
  const { data: positions } = usePositions();

  // Find positions near liquidation (< 15% margin)
  const atRiskPositions = (positions || []).filter((p) => p.margin_ratio < 15);

  function handleAnalyze(position: Position) {
    reset();
    analyzeLiquidation(position);
  }

  // Auto-start if external position passed
  if (externalPosition && state.phase === 'idle') {
    handleAnalyze(externalPosition);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12, height: '100%', overflowY: 'auto' }}>
      {/* Position Selector (only when idle) */}
      {state.phase === 'idle' && (
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Select Position to Analyze
          </h4>
          {atRiskPositions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {atRiskPositions.map((p, i) => (
                <button
                  key={`${p.symbol}-${i}`}
                  onClick={() => handleAnalyze(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--ax-surface)',
                    border: '1px solid var(--ax-border)',
                    color: 'var(--ax-text)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                  }}
                >
                  <span>
                    <strong>{p.symbol}</strong>{' '}
                    <span style={{ color: p.side === 'long' ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}>
                      {p.side.toUpperCase()}
                    </span>
                  </span>
                  <span style={{ color: 'var(--ax-red-bright)', fontWeight: 600 }}>
                    {p.margin_ratio.toFixed(1)}% margin
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
              No positions near liquidation.
              {(positions || []).length > 0 && ' Select any position from the Positions panel using the Analyze button.'}
            </div>
          )}
        </div>
      )}

      {/* Judge Panel (active during analysis) */}
      {state.phase !== 'idle' && (
        <>
          {/* Position being analyzed */}
          {state.position && (
            <div style={{
              padding: 10,
              borderRadius: 8,
              background: 'var(--ax-surface)',
              border: '1px solid var(--ax-border)',
              fontSize: 12,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>
                <strong>{state.position.symbol}</strong>{' '}
                <span style={{ color: state.position.side === 'long' ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}>
                  {state.position.side.toUpperCase()}
                </span>{' '}
                {state.position.leverage}x
              </span>
              <span className="ax-mono" style={{ color: 'var(--ax-text-sec)' }}>
                Margin: {state.position.margin_ratio.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Evidence progress */}
          {(state.phase === 'evidence' || state.phase === 'analysis') && (
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--ax-surface)', border: '1px solid var(--ax-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                {state.phase === 'evidence' ? 'Collecting Evidence' : 'Analyzing Evidence'}
              </div>
              {['Price Action', 'Social Sentiment', 'Position Context'].map((item, i) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div
                    className="ax-dot-pulse"
                    style={{
                      background: state.phase === 'analysis' || i < 2 ? 'var(--ax-green)' : 'var(--ax-border)',
                      animation: state.phase === 'evidence' && i >= 2 ? 'none' : undefined,
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--ax-text-sec)' }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          <JudgePanel phase={state.phase} narration={state.narration}>
            {state.checks.length > 0 && <QualityChecks checks={state.checks} />}
            <VerdictBanner verdict={state.verdict} recommendation={state.recommendation} />
          </JudgePanel>

          <TrustBar score={state.trustScore} visible={state.phase === 'verdict' || state.phase === 'complete'} />

          {/* Reset button */}
          {state.phase === 'complete' && (
            <button
              onClick={reset}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                border: '1px solid var(--ax-border)',
                background: 'transparent',
                color: 'var(--ax-text-sec)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                alignSelf: 'center',
              }}
            >
              Analyze Another Position
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

---

## 20. Market Info API Route

#### File: `src/app/api/info/route.ts`
[VERIFIED] — GET /info returns 69 markets
```typescript
import { NextResponse } from 'next/server';
import { PACIFICA_REST_URL } from '@/lib/constants';

export async function GET() {
  try {
    const res = await fetch(`${PACIFICA_REST_URL}/info`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Pacifica /info: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ markets: [] }, { status: 200 });
  }
}
```

---

## 21. Main Page Layout

#### File: `src/app/page.tsx`
[ASSUMED]
```typescript
'use client';

import { useState, useCallback } from 'react';
import { useWS } from '@/providers/ws-provider';
import { PriceGrid } from '@/components/price-grid';
import { MarketSelector } from '@/components/market-selector';
import { OrderPanel } from '@/components/order-panel';
import { PositionDisplay } from '@/components/position-display';
import { ChatPanel } from '@/components/chat-panel';
import { CourtroomTab } from '@/components/courtroom-tab';
import type { MarketCategory, Position, TradeSuggestion, RightPanel } from '@/types';

export default function Home() {
  const { status } = useWS();
  const [selectedMarket, setSelectedMarket] = useState<string | null>('BTC');
  const [category, setCategory] = useState<MarketCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [rightPanel, setRightPanel] = useState<RightPanel>('copilot');
  const [courtroomPosition, setCourtroomPosition] = useState<Position | null>(null);

  const handleAnalyze = useCallback((position: Position) => {
    setCourtroomPosition(position);
    setRightPanel('courtroom');
  }, []);

  const handleExecuteTrade = useCallback((suggestion: TradeSuggestion) => {
    setSelectedMarket(suggestion.symbol);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ax-bg)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: 48,
          borderBottom: '1px solid var(--ax-border)',
          background: 'var(--ax-bg-elev)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.08em' }}>
            <span style={{ color: 'var(--ax-green-bright)' }}>AX</span>
            <span style={{ color: 'var(--ax-text)' }}>ON</span>
          </h1>
          <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
            AI Trading Terminal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className={status === 'connected' ? 'ax-dot-pulse' : ''}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background:
                status === 'connected' ? 'var(--ax-green)' :
                status === 'connecting' ? 'var(--ax-gold)' : 'var(--ax-red)',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
            {status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Main Content — 3 columns */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px 380px', overflow: 'hidden' }}>
        {/* Column 1: Markets */}
        <div style={{ borderRight: '1px solid var(--ax-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <MarketSelector
            category={category}
            onCategoryChange={setCategory}
            search={search}
            onSearchChange={setSearch}
          />
          <PriceGrid
            category={category}
            search={search}
            onSelectMarket={setSelectedMarket}
            selectedMarket={selectedMarket}
          />
        </div>

        {/* Column 2: Trading */}
        <div style={{ borderRight: '1px solid var(--ax-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid var(--ax-border)', flex: '0 0 auto' }}>
            <OrderPanel selectedMarket={selectedMarket} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ax-border)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>
                Positions
              </h3>
            </div>
            <PositionDisplay onAnalyze={handleAnalyze} />
          </div>
        </div>

        {/* Column 3: Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--ax-border)', flexShrink: 0 }}>
            {([
              { key: 'copilot' as const, label: 'AI Copilot' },
              { key: 'courtroom' as const, label: 'Courtroom' },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRightPanel(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: rightPanel === tab.key ? 'var(--ax-panel)' : 'transparent',
                  color: rightPanel === tab.key
                    ? (tab.key === 'courtroom' ? 'var(--ax-gold)' : 'var(--ax-blue)')
                    : 'var(--ax-text-muted)',
                  borderBottom: rightPanel === tab.key
                    ? `2px solid ${tab.key === 'courtroom' ? 'var(--ax-gold)' : 'var(--ax-blue)'}`
                    : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {rightPanel === 'copilot' ? (
              <ChatPanel onExecuteTrade={handleExecuteTrade} />
            ) : (
              <CourtroomTab externalPosition={courtroomPosition} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 22. Internal API Contracts

### Route: GET /api/info
- **Auth:** None
- **Response (200):**
  ```json
  { "markets": [{ "symbol": "BTC", "max_leverage": 50, "tick_size": "0.1", "min_order_size": "0.001", "status": "active" }] }
  ```

### Route: POST /api/trade
- **Auth:** None (signing happens server-side)
- **Request:**
  ```json
  { "symbol": "BTC", "side": "bid", "amount": "0.1", "order_type": "market", "reduce_only": false, "slippage_percent": "0.5", "client_order_id": "uuid" }
  ```
- **Response (200):**
  ```json
  { "order_id": "uuid", "status": "filled", "filled_amount": "0.1", "avg_price": "63500.50" }
  ```
- **Errors:**
  | Code | Condition |
  |:----:|-----------|
  | 422 | INSUFFICIENT_BALANCE, ORDER_NOT_FOUND, etc. |
  | 500 | Signing failure or network error |

### Route: GET /api/elfa?endpoint=/v2/aggregations/trending-tokens&limit=10
- **Auth:** None (API key server-side)
- **Response (200):** Proxied Elfa response (cached 5min)

### Route: POST /api/copilot
- **Auth:** None
- **Request:**
  ```json
  { "message": "What's trending?", "marketContext": { "BTC": "63500", "ETH": "3200" } }
  ```
- **Response (200):**
  ```json
  { "content": "AI response text", "tradeSuggestion": null | { "symbol": "SOL", "side": "long", "entry": "180", "takeProfit": "195", "stopLoss": "170", "confidence": 0.72, "reasoning": "..." } }
  ```

### Route: POST /api/courtroom
- **Auth:** None
- **Request:**
  ```json
  { "position": { "symbol": "ETH", "side": "short", "leverage": 5, "margin_ratio": 8.5, ... }, "priceData": { "change_1h": -2.1, "change_24h": -8.5, "volume_spike": true, "funding": "0.001", "open_interest": "5000000" } }
  ```
- **Response (200):**
  ```json
  { "evidence": { ... }, "result": { "verdict": "market_driven", "narration": "The court has reviewed...", "trustScore": 650, "confidenceScores": { "price_action": 0.85, "sentiment": 0.72, "position_context": 0.68 }, "recommendation": "Reduce position size." } }
  ```

### Route: GET /api/positions
- **Auth:** None (signing server-side)
- **Response (200):**
  ```json
  { "positions": [{ "symbol": "BTC", "side": "long", "size": "0.05", "entry_price": "63000", "mark_price": "63460", "unrealized_pnl": "23", "margin": "630", "liquidation_price": "56700", "leverage": 10, "margin_ratio": 72.5 }] }
  ```

---

## 23. Integration Map

| From | To | Protocol | Credential (env var) | Health Check | Priority |
|------|----|:--------:|---------------------|:------------:|:--------:|
| WS Provider | Pacifica WS | WebSocket | — (public) | `{"method":"ping"}` → `{"channel":"pong"}` | CRITICAL |
| /api/info | Pacifica REST | HTTP GET | — (public) | `curl $REST_URL/info` → 200 | CRITICAL |
| /api/trade | Pacifica REST | HTTP POST | `PACIFICA_PRIVATE_KEY` | Sign + POST /orders/create_market | CRITICAL |
| /api/elfa | Elfa AI | HTTP GET | `ELFA_API_KEY` | `curl -H 'x-elfa-api-key: $KEY' api.elfa.ai/v2/aggregations/trending-tokens?limit=1` | STANDARD |
| /api/copilot | Groq | HTTP POST | `GROQ_API_KEY` | POST /chat/completions with test message | STANDARD |
| /api/courtroom | Groq + Elfa | HTTP | `GROQ_API_KEY`, `ELFA_API_KEY` | Same as copilot + elfa | STANDARD |
| /api/positions | Pacifica REST | HTTP POST | `PACIFICA_PRIVATE_KEY` | Sign + POST /account/positions | STANDARD |

---

## 24. Testing Strategy — Acceptance Criteria

### Acceptance Criteria

| Feature | Criteria | Judge Priority |
|---------|----------|:--------------:|
| Live price streaming | 69 markets visible, updating every ~3s, no UI jank | HIGH |
| Market category filter | Click Crypto/Stocks/Forex/Commodities → grid filters correctly | HIGH |
| Order placement | Market order on BTC → confirmation toast + position appears | HIGH |
| AI Copilot chat | "What's trending?" → returns token list with sentiment data | HIGH |
| Courtroom analysis | Click Analyze → full 7-phase animation → verdict + trust score | HIGH |
| WebSocket reconnect | Kill WS → auto-reconnects within 30s → prices resume | MED |
| Trade suggestion | Copilot returns trade setup → Execute button pre-fills order | MED |
| Position near liquidation | < 15% margin positions highlighted red | MED |
| Error handling | Invalid order → error toast with message | LOW |

### Test Scenarios (HIGH-priority features)

#### Live Price Streaming
| Scenario | Input | Expected Output |
|----------|-------|----------------|
| Happy path | App loads | 69 rows in price grid, prices update every 3s |
| Filter | Click "Stocks" tab | Only NVDA, TSLA, GOOGL, PLTR, HOOD, SPY, QQQ, SP500 visible |
| Search | Type "SOL" | Only SOL and SOL-USDC visible |

#### Order Placement
| Scenario | Input | Expected Output |
|----------|-------|----------------|
| Market long | BTC, 0.01, Long, Market | Toast "Order placed: {id}" |
| Limit short | ETH, 0.1, Short, Limit, $3000 | Toast with order ID |
| Insufficient | Amount > balance | Toast "INSUFFICIENT_BALANCE" |

#### Courtroom Analysis
| Scenario | Input | Expected Output |
|----------|-------|----------------|
| Full flow | Click Analyze on position | 7 phases animate sequentially (~15s total), verdict + trust score displayed |
| Groq failure | API timeout | Fallback narration "The court encountered an error..." |

---

## 25. Security Considerations

### Assets at Risk
| Asset | Value | Where Stored |
|-------|-------|-------------|
| Pacifica private key | Full trading authority | `.env.local` (server only) |
| Elfa API key | 20K credits | `.env.local` (server only) |
| Groq API key | LLM access | `.env.local` (server only) |

### Attack Surfaces
| Surface | Attack Vector | Exposure Level |
|---------|--------------|:--------------:|
| /api/trade | Malicious order params | MED — server validates via Pacifica |
| /api/copilot | Prompt injection via user message | LOW — Groq system prompt constrains |
| Client WebSocket | Malformed WS messages | LOW — JSON parse in try/catch |

### Security Invariants
- [ ] Private keys NEVER reach the client (only in API routes via `process.env`)
- [ ] All signing happens server-side in `/api/trade`
- [ ] Elfa API key hidden behind `/api/elfa` proxy
- [ ] No `NEXT_PUBLIC_` prefix on any secret env var
- [ ] User input sanitized before passing to Groq (JSON.stringify escapes)

---

## 26. Performance Budgets

| Component | Metric | Budget | Test Method |
|-----------|--------|:------:|-------------|
| Price Grid | Render 69 rows | < 16ms | React DevTools Profiler |
| WS message processing | Parse + update state | < 5ms | Performance.now() |
| /api/trade | End-to-end | < 2000ms | curl timing |
| /api/copilot | End-to-end | < 5000ms | curl timing |
| /api/courtroom | End-to-end | < 5000ms | curl timing |
| Full page | First Contentful Paint | < 1500ms | Lighthouse |
| Full page | Time to Interactive | < 3000ms | Lighthouse |

---

## 27. Deployment Sequence

| Step | Action | Command | Verify |
|:---:|--------|---------|--------|
| 1 | Install dependencies | `pnpm install` | No errors |
| 2 | Set env vars | Copy `.env.local` with real keys | All 6 vars set |
| 3 | Init shadcn | `pnpm dlx shadcn@latest init` | Components dir created |
| 4 | Dev server | `pnpm dev` | http://localhost:3000 loads |
| 5 | Verify WS | Check green dot in header | "Live" status |
| 6 | Verify prices | 69 markets in grid | Prices updating |
| 7 | Verify signing | Place test order | Toast with order ID |
| 8 | Verify Elfa | Ask copilot "What's trending?" | Returns token list |
| 9 | Verify courtroom | Analyze any position | Full 7-phase flow completes |
| 10 | Build | `pnpm build` | No errors |
| 11 | Deploy | `vercel deploy` | Production URL live |

### Dependencies
- Step 7 requires funded Pacifica testnet wallet
- Step 8 requires claimed Elfa API key
- Steps 1-6 can run with just WS URL (no auth needed)

---

## 28. Demo Seed Script

#### File: `scripts/seed-demo.ts`
[ASSUMED] — Uses signing service to create demo positions
```typescript
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const REST_URL = process.env.NEXT_PUBLIC_PACIFICA_REST_URL || 'https://test-api.pacifica.fi/api/v1';
const PRIVATE_KEY = process.env.PACIFICA_PRIVATE_KEY!;

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortJsonKeys(obj[key]);
      return acc;
    }, {});
  }
  return value;
}

function signAndPost(type: string, payload: Record<string, unknown>) {
  const keyBytes = bs58.decode(PRIVATE_KEY);
  const secretKey = keyBytes.length === 64 ? keyBytes : nacl.sign.keyPair.fromSeed(keyBytes).secretKey;
  const publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;
  const account = bs58.encode(publicKey);

  const timestamp = Date.now();
  const header = { type, timestamp, expiry_window: 5000 };
  const data = { ...header, data: payload };
  const message = JSON.stringify(sortJsonKeys(data));
  const sig = nacl.sign.detached(new TextEncoder().encode(message), secretKey);

  return {
    body: { account, signature: bs58.encode(sig), timestamp, expiry_window: 5000, ...payload },
    account,
  };
}

async function seed() {
  console.log('Seeding demo state...\n');

  // 1. Set leverage for BTC to 10x
  const levBTC = signAndPost('update_leverage', { symbol: 'BTC', leverage: 10 });
  const r1 = await fetch(`${REST_URL}/account/leverage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(levBTC.body),
  });
  console.log(`BTC leverage 10x: ${r1.status}`);

  // 2. Open BTC long (0.05 BTC)
  const btcOrder = signAndPost('create_market_order', {
    symbol: 'BTC',
    side: 'bid',
    amount: '0.05',
    reduce_only: false,
    slippage_percent: '1.0',
    client_order_id: crypto.randomUUID(),
  });
  const r2 = await fetch(`${REST_URL}/orders/create_market`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(btcOrder.body),
  });
  const d2 = await r2.json();
  console.log(`BTC long 0.05: ${r2.status}`, d2);

  // 3. Set leverage for ETH to 5x
  const levETH = signAndPost('update_leverage', { symbol: 'ETH', leverage: 5 });
  const r3 = await fetch(`${REST_URL}/account/leverage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(levETH.body),
  });
  console.log(`ETH leverage 5x: ${r3.status}`);

  // 4. Open ETH short (0.5 ETH)
  const ethOrder = signAndPost('create_market_order', {
    symbol: 'ETH',
    side: 'ask',
    amount: '0.5',
    reduce_only: false,
    slippage_percent: '1.0',
    client_order_id: crypto.randomUUID(),
  });
  const r4 = await fetch(`${REST_URL}/orders/create_market`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ethOrder.body),
  });
  const d4 = await r4.json();
  console.log(`ETH short 0.5: ${r4.status}`, d4);

  console.log('\nSeed complete. Verify positions at https://test-app.pacifica.fi');
}

seed().catch(console.error);
```
