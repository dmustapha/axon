# AXON Implementation Plan

**Project:** AXON — AI Social Trading Terminal with Liquidation Courtroom
**Hackathon:** Pacifica Hackathon 2026
**Deadline:** April 16, 2026 (2 days remaining)
**Stack:** TypeScript, Next.js 15, shadcn/ui, TanStack Query v5, tweetnacl, bs58
**Architecture Doc:** `ARCHITECTURE.md` (THE source of truth for all code)

## [EMERGENCY MODE — 2 components mocked]

**Mocked components (excluded from build phases):**
- `[MOCK]` Orderbook depth visualization — placeholder only, no build task
- `[MOCK]` Historical candle charts — placeholder only, no build task

All 38 files in this plan are real implementations. Mocked features are display-only placeholders requiring no code.

---

## How to Use This Plan

1. Read in order. Do not skip phases. Do not reorder tasks.
2. Every phase has a GATE checklist. Verify every item before proceeding.
3. When you see 🔀 (decision point), test BOTH paths and follow the one that matches.
4. Copy code from ARCHITECTURE.md — do not improvise.
5. Commit after every task using the specified commit messages.
6. Save credentials to `.env.local` immediately.
7. If something fails and isn't covered by a decision tree: STOP. Report the error. Do not guess.
8. **VERIFY-MILESTONE tasks are mandatory** — they appear at phase boundaries and cannot be skipped. Failure stops the plan.
9. **seed-demo.ts** must be implemented before any demo-related phase.

---

## Phase Overview

| Phase | Purpose | Est. Time | Depends On |
|:---:|---------|-----------|-----------|
| 0 | Project scaffolding + config | 30min | — |
| 1 | Core infrastructure (types, signing, WS, query) | 45min | Phase 0 |
| 2 | Terminal UI (price grid, market selector, order panel) | 1.5h | Phase 1 |
| 3 | Position management + AI Copilot | 1.5h | Phase 2 |
| 4 | Courtroom module (engine + UI) | 2h | Phase 3 |
| 5 | Main page assembly + polish | 1h | Phase 4 |
| 6 | Seed script + integration verification | 45min | Phase 5 |
| 7 | Demo prep + recording | 2h | Phase 6 |
| **Total** | | **~10h** | |

---

## Phase 0: Project Scaffolding

**Purpose:** Create Next.js 15 project with all dependencies and config files.
**Estimated time:** 30 minutes

### Task 0.1: Create Next.js Project

**Files:**
- Create: project root `axon/` (from ARCHITECTURE.md Section 1 — File Structure)

**Steps:**

1. Create project directory
   ```bash
   cd ~/hackathon-toolkit/pacifica
   pnpm create next-app axon --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
   ```
   Expected:
   ```
   Success! Created axon at ~/hackathon-toolkit/pacifica/axon
   ```

2. Navigate into project
   ```bash
   cd ~/hackathon-toolkit/pacifica/axon
   ```

3. Install dependencies (from ARCHITECTURE.md Section 4 — package.json)
   ```bash
   pnpm add @tanstack/react-query tweetnacl bs58 groq-sdk sonner clsx uuid
   pnpm add -D @types/uuid tsx
   ```

4. Initialize git
   ```bash
   git init && git add -A && git commit -m "init: scaffold Next.js 15 project"
   ```

### Task 0.2: Configure Project Files

**Files:**
- Modify: `next.config.ts` (from ARCHITECTURE.md Section 4)
- Modify: `postcss.config.mjs` (from ARCHITECTURE.md Section 4)
- Modify: `tsconfig.json` (from ARCHITECTURE.md Section 4)
- Create: `.env.local` (from ARCHITECTURE.md Section 4)

**Steps:**

1. Replace `next.config.ts` with ARCHITECTURE.md Section 4 code exactly:
   ```typescript
   import type { NextConfig } from 'next';
   const nextConfig: NextConfig = {
     serverExternalPackages: ['tweetnacl', 'bs58'],
   };
   export default nextConfig;
   ```

2. Replace `postcss.config.mjs` with ARCHITECTURE.md Section 4 code exactly

3. Verify `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }` — add if missing

4. Create `.env.local` from ARCHITECTURE.md Section 4:
   ```bash
   PACIFICA_PRIVATE_KEY=your_solana_private_key_base58
   PACIFICA_PUBLIC_KEY=your_solana_public_key_base58
   NEXT_PUBLIC_PACIFICA_REST_URL=https://test-api.pacifica.fi/api/v1
   NEXT_PUBLIC_PACIFICA_WS_URL=wss://test-ws.pacifica.fi/ws
   ELFA_API_KEY=your_elfa_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

#### 🔀 Decision Point: Env Var Setup

Run: `cat .env.local | wc -l`
Expected: `6` (or more with blank lines)

✅ **If file exists with 6+ lines:** Continue to Task 0.3.

🔀 **If `.env.local` not created:**
1. Create it manually with the template above
2. Re-verify

5. Add typecheck script to `package.json`:
   ```json
   "typecheck": "tsc --noEmit"
   ```

**Commit:**
```bash
git add next.config.ts postcss.config.mjs tsconfig.json package.json
git commit -m "config: project configuration files from Architecture §4"
```

### Task 0.3: Setup Design System

**Files:**
- Modify: `src/app/globals.css` (from ARCHITECTURE.md Section 5)

**Steps:**

1. Replace `src/app/globals.css` with the COMPLETE design system from ARCHITECTURE.md Section 5 — all CSS custom properties, panel cards, price flash animations, judge glow/pulse, fill bar, trust shimmer, typewriter cursor, verdict large, status dot, scrollbar, and reduced motion media query.

2. Verify CSS loads:
   ```bash
   pnpm dev &
   sleep 3
   curl -s http://localhost:3000 | head -20
   kill %1
   ```

**Commit:**
```bash
git add src/app/globals.css
git commit -m "style: AXON trading terminal design system from Architecture §5"
```

### Phase 0 Gate

Before proceeding to Phase 1, verify:
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm run typecheck` passes (or only has warnings from default files)
- [ ] `.env.local` exists with all 6 variables
- [ ] `globals.css` contains `--ax-bg`, `--ax-gold`, `ax-flash-up` classes
- [ ] All commits made for Phase 0

**If any check fails: DO NOT proceed. Fix the failing check first.**

---

## Phase 1: Core Infrastructure

**Purpose:** Build the foundation layer — shared types, signing service, REST client, WebSocket provider, query client.
**Estimated time:** 45 minutes

### Task 1.1: Shared Types

**Files:**
- Create: `src/types/index.ts` (from ARCHITECTURE.md Section 3)

**Steps:**

1. Create `src/types/` directory:
   ```bash
   mkdir -p src/types
   ```

2. Copy the COMPLETE `src/types/index.ts` from ARCHITECTURE.md Section 3 exactly — all types: `MarketCategory`, `MarketSpec`, `MarketPrice`, `Position`, `OrderType`, `OrderSide`, `OrderRequest`, `OrderResponse`, `OrderError`, `ChatMessage`, `TradeSuggestion`, `CourtroomPhase`, `EvidenceBundle`, `CheckDetail`, `TrustUpdate`, `Verdict`, `CourtroomResult`, `CourtroomState`, `WsSource`, `WsMessage`, `RightPanel`.

3. Verify:
   ```bash
   pnpm run typecheck
   ```
   Expected: no type errors in `src/types/index.ts`

**Commit:**
```bash
git add src/types/index.ts
git commit -m "feat(types): shared TypeScript types from Architecture §3"
```

### Task 1.2: Constants

**Files:**
- Create: `src/lib/constants.ts` (from ARCHITECTURE.md Section 6)

**Steps:**

1. Create `src/lib/` directory:
   ```bash
   mkdir -p src/lib
   ```

2. Copy the COMPLETE `src/lib/constants.ts` from ARCHITECTURE.md Section 6 exactly — includes `PACIFICA_REST_URL`, `PACIFICA_WS_URL`, `WS_PING_INTERVAL`, `WS_MAX_BACKOFF`, `POSITION_POLL_INTERVAL`, `MARKET_CACHE_TIME`, `CATEGORY_MAP` (all 69 markets), and `getCategory()` function.

**Commit:**
```bash
git add src/lib/constants.ts
git commit -m "feat(lib): constants and market category map from Architecture §6"
```

### Task 1.3: Signing Service

**Files:**
- Create: `src/lib/signing.ts` (from ARCHITECTURE.md Section 7)

**Steps:**

1. Copy the COMPLETE `src/lib/signing.ts` from ARCHITECTURE.md Section 7 exactly — includes `sortJsonKeys()` recursive function and `signRequest()` function.

2. Verify types:
   ```bash
   pnpm run typecheck
   ```

#### 🔀 Decision Point: Signing Service Compilation

Run: `pnpm run typecheck 2>&1 | grep signing`
Expected: No errors

✅ **If no errors:** Continue to Task 1.4.

🔀 **If you get `Cannot find module 'tweetnacl'` or `'bs58'`:**
1. Check `node_modules/tweetnacl` exists: `ls node_modules/tweetnacl`
2. If missing: `pnpm add tweetnacl bs58`
3. If type errors: add `// @ts-ignore` above problematic import temporarily, then fix
4. Re-run typecheck

🔀 **If you get `Type error: bs58.decode is not a function` at runtime (later):**
1. bs58 v6 uses named exports: change to `import { encode, decode } from 'bs58'`
2. Update all `bs58.encode` → `encode`, `bs58.decode` → `decode`
3. Re-run typecheck

⛔ **If tweetnacl signing produces wrong signatures (tested in Phase 6):**
1. Verify key format: `console.log(keyBytes.length)` — must be 32 or 64
2. Verify message format: `console.log(message)` — must match Python SDK exactly
3. If still wrong: fall back to calling Python signing script via `child_process.execSync`

**Commit:**
```bash
git add src/lib/signing.ts
git commit -m "feat(signing): ed25519 signing service from Architecture §7"
```

### Task 1.4: Pacifica REST Client

**Files:**
- Create: `src/lib/pacifica.ts` (from ARCHITECTURE.md Section 8)

**Steps:**

1. Copy the COMPLETE `src/lib/pacifica.ts` from ARCHITECTURE.md Section 8 — includes `pacificaGet<T>()` and `pacificaPost<T>()` functions.

**Commit:**
```bash
git add src/lib/pacifica.ts
git commit -m "feat(lib): Pacifica REST client from Architecture §8"
```

### Task 1.5: Query Client

**Files:**
- Create: `src/lib/query-client.ts` (from ARCHITECTURE.md Section 9)

**Steps:**

1. Copy the COMPLETE `src/lib/query-client.ts` from ARCHITECTURE.md Section 9 — includes `queryClient` instance and `queryKeys` factory with `markets`, `positions`, `copilot`, `elfa` namespaces.

**Commit:**
```bash
git add src/lib/query-client.ts
git commit -m "feat(lib): TanStack Query client and key factory from Architecture §9"
```

### Task 1.6: WebSocket Provider

**Files:**
- Create: `src/providers/ws-provider.tsx` (from ARCHITECTURE.md Section 10)

**Steps:**

1. Create `src/providers/` directory:
   ```bash
   mkdir -p src/providers
   ```

2. Copy the COMPLETE `src/providers/ws-provider.tsx` from ARCHITECTURE.md Section 10 — includes `WSProvider` component with auto-connect, ping/pong, exponential backoff, subscribe/unsubscribe, listener management, and `useWS()` hook.

3. Verify no type errors:
   ```bash
   pnpm run typecheck
   ```

**Commit:**
```bash
git add src/providers/ws-provider.tsx
git commit -m "feat(ws): WebSocket provider with auto-reconnect from Architecture §10"
```

### Task 1.7: App Shell (Providers + Layout)

**Files:**
- Create: `src/app/providers.tsx` (from ARCHITECTURE.md Section 11)
- Modify: `src/app/layout.tsx` (from ARCHITECTURE.md Section 11)

**Steps:**

1. Create `src/app/providers.tsx` from ARCHITECTURE.md Section 11 — wraps `QueryClientProvider`, `WSProvider`, and `Toaster` (sonner).

2. Replace `src/app/layout.tsx` with ARCHITECTURE.md Section 11 code — imports `Providers`, `globals.css`, sets metadata.

3. Verify:
   ```bash
   pnpm run typecheck
   ```

**Commit:**
```bash
git add src/app/providers.tsx src/app/layout.tsx
git commit -m "feat(app): providers and layout shell from Architecture §11"
```

### Phase 1 Gate

Before proceeding to Phase 2, verify:
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] All 7 files created: `types/index.ts`, `lib/constants.ts`, `lib/signing.ts`, `lib/pacifica.ts`, `lib/query-client.ts`, `providers/ws-provider.tsx`, `app/providers.tsx`
- [ ] `layout.tsx` wraps children in `<Providers>`
- [ ] `pnpm dev` starts and renders a page (even if blank)
- [ ] All commits made for Phase 1

**If any check fails: DO NOT proceed. Fix the failing check first.**

---

## Phase 2: Terminal UI — Markets + Orders

**Purpose:** Build the market data layer and trading UI — price grid, market selector, order panel, and supporting API routes.
**Estimated time:** 1.5 hours

### Task 2.1: Market Data Hook

**Files:**
- Create: `src/hooks/use-market-data.ts` (from ARCHITECTURE.md Section 12)

**Steps:**

1. Create `src/hooks/` directory:
   ```bash
   mkdir -p src/hooks
   ```

2. Copy the COMPLETE `src/hooks/use-market-data.ts` from ARCHITECTURE.md Section 12 — includes `useMarketSpecs()` (TanStack Query, fetches `/api/info`, caches 5min) and `useMarketPrices()` (WS subscription, `prices` Map state, `getPriceDirection` callback).

**Commit:**
```bash
git add src/hooks/use-market-data.ts
git commit -m "feat(hooks): market data hook with WS price streaming from Architecture §12"
```

### Task 2.2: Market Info API Route

**Files:**
- Create: `src/app/api/info/route.ts` (from ARCHITECTURE.md Section 20)

**Steps:**

1. Create API route directories:
   ```bash
   mkdir -p src/app/api/info src/app/api/trade src/app/api/positions src/app/api/elfa src/app/api/copilot src/app/api/courtroom
   ```

2. Copy the COMPLETE `src/app/api/info/route.ts` from ARCHITECTURE.md Section 20 — GET handler that proxies Pacifica REST `/info` with 300s revalidate.

3. Verify:
   ```bash
   pnpm dev &
   sleep 3
   curl -s http://localhost:3000/api/info | head -c 200
   kill %1
   ```
   Expected: JSON with market data (or `{"markets":[]}` if API is down)

#### 🔀 Decision Point: Pacifica REST /info

Run: `curl -s https://test-api.pacifica.fi/api/v1/info | head -c 200`
Expected: JSON with `markets` array containing 69 entries

✅ **If 200 with market data:** Continue.

🔀 **If 404 or timeout:**
1. Try mainnet: `curl -s https://api.pacifica.fi/api/v1/info | head -c 200`
2. If mainnet works: update `NEXT_PUBLIC_PACIFICA_REST_URL` in `.env.local`
3. If both fail: Pacifica API is down. Cache last known response. Continue building UI with mock data.

⛔ **If Pacifica is fully down (both testnet + mainnet):**
1. Create `src/lib/mock-data.ts` with 10 sample markets
2. Modify `/api/info/route.ts` to return mock data as fallback
3. Flag in BUILD-REPORT.md: "Pacifica REST unavailable at build time"

**Commit:**
```bash
git add src/app/api/info/route.ts
git commit -m "feat(api): market info proxy route from Architecture §20"
```

### Task 2.3: Price Grid Component

**Files:**
- Create: `src/components/price-grid.tsx` (from ARCHITECTURE.md Section 13)

**Steps:**

1. Create `src/components/` directory:
   ```bash
   mkdir -p src/components
   ```

2. Copy the COMPLETE `src/components/price-grid.tsx` from ARCHITECTURE.md Section 13 — includes `PriceGridProps`, `pctChange()`, `formatPrice()`, `formatVolume()`, `PriceGrid` component with flash animation refs, filtering, sorting by volume, sticky headers, row selection highlighting.

**Commit:**
```bash
git add src/components/price-grid.tsx
git commit -m "feat(ui): price grid with flash animations from Architecture §13"
```

### Task 2.4: Market Selector Component

**Files:**
- Create: `src/components/market-selector.tsx` (from ARCHITECTURE.md Section 14)

**Steps:**

1. Copy the COMPLETE `src/components/market-selector.tsx` from ARCHITECTURE.md Section 14 — includes `CATEGORIES` array (All, Crypto, Stocks, Forex, Commodities, Spot), tab buttons with active state, search input.

**Commit:**
```bash
git add src/components/market-selector.tsx
git commit -m "feat(ui): market category selector from Architecture §14"
```

### Task 2.5: Order Management (Hook + API Route + Component)

**Files:**
- Create: `src/hooks/use-orders.ts` (from ARCHITECTURE.md Section 15)
- Create: `src/app/api/trade/route.ts` (from ARCHITECTURE.md Section 15)
- Create: `src/components/order-panel.tsx` (from ARCHITECTURE.md Section 15)

**Steps:**

1. Copy `src/hooks/use-orders.ts` from ARCHITECTURE.md Section 15 — `useOrders()` hook with `placeOrder()` and `isSubmitting` state.

2. Copy `src/app/api/trade/route.ts` from ARCHITECTURE.md Section 15 — POST handler that determines endpoint path + signing type based on `order_type`, calls `signRequest()`, forwards to Pacifica REST.

3. Copy `src/components/order-panel.tsx` from ARCHITECTURE.md Section 15 — full order form with type toggle (market/limit/stop), side toggle (Long/Short), amount input, price input (limit/stop), leverage slider, order preview with estimated liquidation price, submit button.

4. Verify types:
   ```bash
   pnpm run typecheck
   ```

#### 🔀 Decision Point: Signing Compilation

Run: `pnpm run typecheck 2>&1 | grep -i error | head -5`
Expected: No errors

✅ **If clean:** Continue.

🔀 **If `bs58` import errors:**
1. Check bs58 version: `cat node_modules/bs58/package.json | grep version`
2. If v6+: `bs58` uses named exports. Change all `import bs58 from 'bs58'` to `import * as bs58 from 'bs58'` or `import { encode, decode } from 'bs58'`
3. Update both `signing.ts` and `seed-demo.ts`

**Commit:**
```bash
git add src/hooks/use-orders.ts src/app/api/trade/route.ts src/components/order-panel.tsx
git commit -m "feat(trading): order management hook, API route, and panel from Architecture §15"
```

### Phase 2 Gate

Before proceeding to Phase 3, verify:
- [ ] `pnpm run typecheck` passes
- [ ] `/api/info` returns market data (or mock fallback)
- [ ] All 5 new files created: `use-market-data.ts`, `api/info/route.ts`, `price-grid.tsx`, `market-selector.tsx`, `use-orders.ts` + `api/trade/route.ts` + `order-panel.tsx`
- [ ] All commits made for Phase 2

---

## Phase 3: Position Management + AI Copilot

**Purpose:** Add position display with REST polling, Elfa AI proxy, and copilot chat with Groq synthesis.
**Estimated time:** 1.5 hours

### Task 3.1: Position Display (Hook + API Route + Component)

**Files:**
- Create: `src/hooks/use-positions.ts` (from ARCHITECTURE.md Section 16)
- Create: `src/app/api/positions/route.ts` (from ARCHITECTURE.md Section 16)
- Create: `src/components/position-display.tsx` (from ARCHITECTURE.md Section 16)

**Steps:**

1. Copy `src/hooks/use-positions.ts` from ARCHITECTURE.md Section 16 — `usePositions()` hook with TanStack Query, refetchInterval 5s.

2. Copy `src/app/api/positions/route.ts` from ARCHITECTURE.md Section 16 — GET handler that calls `pacificaPost('/account/positions', 'get_positions', {})`, returns empty on error.

3. Copy `src/components/position-display.tsx` from ARCHITECTURE.md Section 16 — position table with live price merge, PnL coloring, margin % warning at <15%, Analyze button per row.

#### 🔀 Decision Point: Account Positions Endpoint

**Note:** The positions REST endpoint path is [UNVERIFIED]. The correct path may differ.

Run (after Phase 5 assembly, or test now if keys are set):
```bash
curl -s http://localhost:3000/api/positions
```
Expected: `{"positions":[]}` or array of positions

✅ **If 200 with positions or empty array:** Continue.

🔀 **If 500 error or unexpected response:**
1. Check Pacifica API docs/Discord for correct account endpoint path
2. Try alternatives: `/account/state`, `/account/info`, `/positions`
3. Update `api/positions/route.ts` with correct path
4. If no account endpoint found: return empty positions array, flag for wire phase

⛔ **If no account REST endpoint exists at all:**
1. Positions will only work after WS account subscription is verified
2. For now: return `[]` — positions display shows "No open positions"
3. This is acceptable for demo if seed-demo.ts creates positions visible in courtroom

**Commit:**
```bash
git add src/hooks/use-positions.ts src/app/api/positions/route.ts src/components/position-display.tsx
git commit -m "feat(positions): position display with REST polling from Architecture §16"
```

### Task 3.2: Elfa AI Proxy Route

**Files:**
- Create: `src/app/api/elfa/route.ts` (from ARCHITECTURE.md Section 17)

**Steps:**

1. Copy `src/app/api/elfa/route.ts` from ARCHITECTURE.md Section 17 — GET handler with in-memory cache (5min TTL), proxies to Elfa AI endpoints, hides API key.

#### 🔀 Decision Point: Elfa API Key

Run: `echo $ELFA_API_KEY | head -c 5`
Expected: Non-empty string starting with API key prefix

✅ **If key is set:** Test it:
```bash
curl -s -H "x-elfa-api-key: YOUR_KEY" "https://api.elfa.ai/v2/aggregations/trending-tokens?limit=1" | head -c 200
```
If 200 with data: Elfa is working. Continue.

🔀 **If key is not set or returns 401:**
1. Go to https://dev.elfa.ai
2. Register, generate key, upgrade to Pay-As-You-Go, submit claim form
3. Add key to `.env.local`
4. Re-test

⛔ **If Elfa API is completely unavailable (no key, registration down):**
1. Copilot will still work via Groq alone (without Elfa data)
2. Modify `/api/copilot/route.ts` to skip Elfa calls
3. For courtroom: use placeholder sentiment `{ mentions: 0, positive_pct: 50, trending: false }`
4. Flag in BUILD-REPORT.md: "Elfa unavailable — copilot running without social data"

**Commit:**
```bash
git add src/app/api/elfa/route.ts
git commit -m "feat(api): Elfa AI proxy with response caching from Architecture §17"
```

### Task 3.3: AI Copilot (API Route + Hook + Components)

**Files:**
- Create: `src/app/api/copilot/route.ts` (from ARCHITECTURE.md Section 17)
- Create: `src/hooks/use-copilot.ts` (from ARCHITECTURE.md Section 17)
- Create: `src/components/trade-suggestion.tsx` (from ARCHITECTURE.md Section 17)
- Create: `src/components/chat-panel.tsx` (from ARCHITECTURE.md Section 17)

**Steps:**

1. Copy `src/app/api/copilot/route.ts` from ARCHITECTURE.md Section 17 — POST handler that fetches Elfa trending + mentions data, builds system prompt with market context, calls Groq (Llama 3.3 70B, JSON mode), returns `{ content, tradeSuggestion }`.

2. Copy `src/hooks/use-copilot.ts` from ARCHITECTURE.md Section 17 — `useCopilot()` hook with `messages` state, `sendMessage()` that builds market context and calls `/api/copilot`, `isLoading` state.

3. Copy `src/components/trade-suggestion.tsx` from ARCHITECTURE.md Section 17 — `TradeSuggestionCard` with side coloring, entry/TP/SL grid, confidence badge, Execute button.

4. Copy `src/components/chat-panel.tsx` from ARCHITECTURE.md Section 17 — full chat UI with auto-scroll, message bubbles (user right-aligned blue, assistant left-aligned surface), trade suggestion cards inline, loading indicator, input form.

5. Verify types:
   ```bash
   pnpm run typecheck
   ```

#### 🔀 Decision Point: Groq API

Run: `echo $GROQ_API_KEY | head -c 5`
Expected: Non-empty string starting with `gsk_`

✅ **If key is set:** Continue.

🔀 **If no Groq key:**
1. Sign up at https://console.groq.com
2. Generate API key
3. Add to `.env.local`

⛔ **If Groq is rate-limited (30 RPM free tier) during demo:**
1. The copilot route already returns fallback: `"AI copilot is temporarily unavailable."`
2. For courtroom: the route returns fallback narration template
3. Pre-run courtroom analysis before recording to warm the cache

**Commit:**
```bash
git add src/app/api/copilot/route.ts src/hooks/use-copilot.ts src/components/trade-suggestion.tsx src/components/chat-panel.tsx
git commit -m "feat(copilot): AI copilot with Elfa + Groq from Architecture §17"
```

### Task 3.4: VERIFY-MILESTONE Checkpoint — Core Features

**Purpose:** Mid-build quality gate. Build cannot advance past this point until criteria pass.

**Steps:**

1. Start dev server:
   ```bash
   pnpm dev
   ```

2. Verify in browser (http://localhost:3000):
   - [ ] Page renders without errors (check console)
   - [ ] No TypeScript compilation errors in terminal

3. Verify API routes:
   ```bash
   curl -s http://localhost:3000/api/info | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Markets: {len(d.get(\"markets\", d) if isinstance(d.get(\"markets\", d), list) else [])}')"
   ```

4. Run typecheck:
   ```bash
   pnpm run typecheck
   ```

**Gate (MANDATORY — cannot be skipped):**
- [ ] `pnpm run typecheck` passes
- [ ] `/api/info` returns market data
- [ ] All 12 source files from Phases 1-3 exist
- [ ] Dev server starts and page renders

**If gate fails:** STOP. Fix before proceeding.

---

## Phase 4: Courtroom Module

**Purpose:** Build the courtroom engine (state machine + Groq judge) and all courtroom UI components — the innovation differentiator.
**Estimated time:** 2 hours

### Task 4.1: Courtroom API Route

**Files:**
- Create: `src/app/api/courtroom/route.ts` (from ARCHITECTURE.md Section 18)

**Steps:**

1. Copy `src/app/api/courtroom/route.ts` from ARCHITECTURE.md Section 18 — POST handler with `fetchSentiment()` (Elfa mentions → sentiment analysis), `JUDGE_SYSTEM_PROMPT` (manipulation vs market-driven signals), evidence bundle construction, Groq call (JSON mode), fallback narration template on error.

**Commit:**
```bash
git add src/app/api/courtroom/route.ts
git commit -m "feat(courtroom): AI judge API route with Groq from Architecture §18"
```

### Task 4.2: Courtroom Engine Hook

**Files:**
- Create: `src/hooks/use-courtroom.ts` (from ARCHITECTURE.md Section 18)

**Steps:**

1. Copy `src/hooks/use-courtroom.ts` from ARCHITECTURE.md Section 18 — includes `Action` union type, `initialState`, `reducer` function (8 action types), `delay()` utility, `useCourtroom()` hook with `analyzeLiquidation()` (7-phase sequence: filing 2s → evidence + API call → analysis 2s → deliberation 3s → quality checks 2s → verdict 2s → complete), `reset()`.

**Key timing:** Total animation cycle = ~15s. This is the theatrical pacing that makes the courtroom memorable.

**Commit:**
```bash
git add src/hooks/use-courtroom.ts
git commit -m "feat(courtroom): state machine hook with 7-phase dispatch from Architecture §18"
```

### Task 4.3: Judge Panel Component

**Files:**
- Create: `src/components/judge-panel.tsx` (from ARCHITECTURE.md Section 19)

**Steps:**

1. Copy `src/components/judge-panel.tsx` from ARCHITECTURE.md Section 19 — includes typewriter effect (22ms per char), `courtStatus` derived from phase, judge glow/pulse animation, presiding badge, narration box with cursor.

**Commit:**
```bash
git add src/components/judge-panel.tsx
git commit -m "feat(courtroom): judge panel with typewriter narration from Architecture §19"
```

### Task 4.4: Quality Checks Component

**Files:**
- Create: `src/components/quality-checks.tsx` (from ARCHITECTURE.md Section 19)

**Steps:**

1. Copy `src/components/quality-checks.tsx` from ARCHITECTURE.md Section 19 — includes `CHECK_LABELS` mapping, staggered fill bar animations (200ms delay between bars), pass/fail coloring, confidence counter.

**Commit:**
```bash
git add src/components/quality-checks.tsx
git commit -m "feat(courtroom): staggered quality check bars from Architecture §19"
```

### Task 4.5: Verdict Banner + Trust Bar

**Files:**
- Create: `src/components/verdict-banner.tsx` (from ARCHITECTURE.md Section 19)
- Create: `src/components/trust-bar.tsx` (from ARCHITECTURE.md Section 19)

**Steps:**

1. Copy `src/components/verdict-banner.tsx` from ARCHITECTURE.md Section 19 — spring scale animation on verdict reveal, MARKET-DRIVEN (green) vs MANIPULATION SUSPECTED (red), recommendation text.

2. Copy `src/components/trust-bar.tsx` from ARCHITECTURE.md Section 19 — score display (0-800), tier label (LOW/MODERATE/HIGH), fill bar with shimmer gradient, brightness flash on score reveal, tick marks.

**Commit:**
```bash
git add src/components/verdict-banner.tsx src/components/trust-bar.tsx
git commit -m "feat(courtroom): verdict banner and trust bar from Architecture §19"
```

### Task 4.6: Courtroom Tab (Orchestrator)

**Files:**
- Create: `src/components/courtroom-tab.tsx` (from ARCHITECTURE.md Section 19)

**Steps:**

1. Copy `src/components/courtroom-tab.tsx` from ARCHITECTURE.md Section 19 — includes position selector (at-risk positions < 15% margin), evidence progress dots, phase-based rendering, JudgePanel + QualityChecks + VerdictBanner + TrustBar assembly, reset button.

2. Verify types:
   ```bash
   pnpm run typecheck
   ```

#### 🔀 Decision Point: Courtroom Type Errors

Run: `pnpm run typecheck 2>&1 | grep -c error`
Expected: `0`

✅ **If zero errors:** Continue.

🔀 **If type errors in courtroom components:**
1. Most likely: import path mismatches. Verify all imports reference `@/types`, `@/hooks/use-courtroom`, `@/hooks/use-positions`, `@/hooks/use-market-data`
2. Check `CheckDetail[]` vs `checkDetail[]` casing
3. Check `CourtroomPhase` union includes all 8 phases
4. Fix and re-run typecheck

**Commit:**
```bash
git add src/components/courtroom-tab.tsx
git commit -m "feat(courtroom): courtroom tab orchestrator from Architecture §19"
```

### Phase 4 Gate

Before proceeding to Phase 5, verify:
- [ ] `pnpm run typecheck` passes
- [ ] All 6 courtroom files created: `api/courtroom/route.ts`, `use-courtroom.ts`, `judge-panel.tsx`, `quality-checks.tsx`, `verdict-banner.tsx`, `trust-bar.tsx`, `courtroom-tab.tsx`
- [ ] All commits made for Phase 4

---

## Phase 5: Main Page Assembly + Polish

**Purpose:** Assemble the 3-column layout, connect all components, verify end-to-end.
**Estimated time:** 1 hour

### Task 5.1: Main Page Layout

**Files:**
- Modify: `src/app/page.tsx` (from ARCHITECTURE.md Section 21)

**Steps:**

1. Replace `src/app/page.tsx` with the COMPLETE code from ARCHITECTURE.md Section 21 — 3-column grid layout:
   - Column 1 (flex): MarketSelector + PriceGrid
   - Column 2 (320px): OrderPanel + PositionDisplay
   - Column 3 (380px): Tab switcher (AI Copilot / Courtroom) + ChatPanel or CourtroomTab
   - Header: AXON logo, WS status dot, "Live" indicator
   - State: selectedMarket, category, search, rightPanel, courtroomPosition
   - Callbacks: handleAnalyze (switches to courtroom tab), handleExecuteTrade (pre-fills market)

2. Verify:
   ```bash
   pnpm run typecheck
   ```

3. Start dev server and check visually:
   ```bash
   pnpm dev
   ```
   Open http://localhost:3000 — should see 3-column terminal layout.

**Commit:**
```bash
git add src/app/page.tsx
git commit -m "feat(app): 3-column trading terminal layout from Architecture §21"
```

### Task 5.2: Visual Verification

**Steps:**

1. Open http://localhost:3000 in browser

2. Verify each section:
   - [ ] Header shows "AXON" with green "AX" + white "ON", WS status dot
   - [ ] WS dot turns green within 5s → "Live"
   - [ ] Price Grid populates with 69 markets, prices updating
   - [ ] Click market category tabs → grid filters
   - [ ] Type in search → grid filters by symbol
   - [ ] Click a market row → row highlights, Order Panel shows symbol
   - [ ] Order Panel shows type toggle, side toggle, amount, leverage slider
   - [ ] Position Display shows "No open positions" (or positions if seeded)
   - [ ] AI Copilot tab shows chat input
   - [ ] Courtroom tab shows position selector

3. Test AI Copilot (if Groq key set):
   - Type "What's trending?" → should get AI response within 5s
   - Type "Analyze SOL" → should get trade suggestion card

4. Test Courtroom (requires position — test after seed in Phase 6)

#### 🔀 Decision Point: WebSocket Connection

Expected: Green dot, "Live" status, prices streaming

✅ **If connected and streaming:** Continue.

🔀 **If dot stays yellow ("Connecting..."):**
1. Open browser DevTools → Console → look for WS errors
2. Check: `new WebSocket('wss://test-ws.pacifica.fi/ws')` in console
3. If `ERR_CONNECTION_REFUSED`: Pacifica WS is down
4. Try alternate URL: `wss://ws.pacifica.fi/ws`
5. If all fail: WS connection will work when Pacifica comes back. Build continues.

🔀 **If prices don't appear (green dot but empty grid):**
1. Check DevTools → Network → WS messages
2. Verify subscribe message sent: `{"method":"subscribe","params":{"source":"prices"}}`
3. Verify response: should see `{"channel":"prices","data":[...]}`
4. If no data: the channel name may differ. Check Pacifica docs.

**Commit:**
```bash
git add -A
git commit -m "polish: visual verification pass — terminal layout working"
```

### Phase 5 Gate

Before proceeding to Phase 6, verify:
- [ ] 3-column layout renders
- [ ] WS connects (green dot) and prices stream
- [ ] Market category filtering works
- [ ] Order Panel UI is complete
- [ ] AI Copilot responds (if keys are set)
- [ ] Courtroom tab shows position selector
- [ ] `pnpm run typecheck` passes

---

## Phase 6: Seed Script + Integration Verification

**Purpose:** Implement demo seed script, verify all integrations end-to-end.
**Estimated time:** 45 minutes

### Task 6.1: Implement Demo Seed Script

**Files:**
- Create: `scripts/seed-demo.ts` (from ARCHITECTURE.md Section 28)

**Steps:**

1. Create `scripts/` directory:
   ```bash
   mkdir -p scripts
   ```

2. Copy `scripts/seed-demo.ts` from ARCHITECTURE.md Section 28 — includes local `sortJsonKeys`, `signAndPost` helper, `seed()` function that:
   - Sets BTC leverage to 10x
   - Opens BTC long 0.05
   - Sets ETH leverage to 5x
   - Opens ETH short 0.5

3. Run the seed script:
   ```bash
   pnpm seed
   ```
   Expected:
   ```
   Seeding demo state...
   BTC leverage 10x: 200
   BTC long 0.05: 200 {...}
   ETH leverage 5x: 200
   ETH short 0.5: 200 {...}
   Seed complete.
   ```

#### 🔀 Decision Point: Seed Script Execution

Run: `pnpm seed`

✅ **If all 200s:** Demo positions created. Verify in browser.

🔀 **If `PACIFICA_PRIVATE_KEY not set`:**
1. Generate or obtain Pacifica testnet wallet
2. Register at https://test-app.pacifica.fi (code: "Pacifica")
3. Export private key (base58)
4. Add to `.env.local`
5. Re-run seed

🔀 **If `422 INSUFFICIENT_BALANCE`:**
1. Fund wallet with testnet USDC via Pacifica faucet
2. Check Discord for faucet link
3. Re-run seed

🔀 **If signing error (403 or signature mismatch):**
1. Verify `PACIFICA_PRIVATE_KEY` format: `echo $PACIFICA_PRIVATE_KEY | wc -c` (should be 44-88 chars)
2. Verify key decodes: add `console.log(keyBytes.length)` to seed script — must be 32 or 64
3. Compare with Python SDK signing output for same payload
4. If mismatch: check `sortJsonKeys` produces identical JSON to Python
5. Last resort: use Python signing script and pipe output

⛔ **If Pacifica API is down:**
1. Positions cannot be seeded
2. Demo courtroom can still work with manually constructed position object
3. Flag for wire phase

**Commit:**
```bash
git add scripts/seed-demo.ts package.json
git commit -m "seed(demo): implement seed-demo.ts from PRD §6 Demo Prerequisites"
```

### Task 6.2: End-to-End Integration Verification

**Steps:**

Run each check sequentially:

1. **WS Price Stream:**
   ```bash
   # Check browser — prices should be streaming
   curl -s http://localhost:3000/api/info | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Markets: {len(d.get(\"markets\", d) if isinstance(d, dict) else d)}')"
   ```
   Expected: `Markets: 69`

2. **Order Signing:**
   ```bash
   curl -s -X POST http://localhost:3000/api/trade \
     -H "Content-Type: application/json" \
     -d '{"symbol":"BTC","side":"bid","amount":"0.001","order_type":"market","reduce_only":false,"slippage_percent":"1.0","client_order_id":"test-123"}'
   ```
   Expected: `{"order_id":"...","status":"filled",...}` or `{"error_code":4,"message":"INSUFFICIENT_BALANCE"}`
   Both are acceptable — they prove signing works.

3. **Elfa AI:**
   ```bash
   curl -s "http://localhost:3000/api/elfa?endpoint=/v2/aggregations/trending-tokens&limit=3"
   ```
   Expected: JSON with trending tokens (or `{"error":"..."}` if no key)

4. **Copilot:**
   ```bash
   curl -s -X POST http://localhost:3000/api/copilot \
     -H "Content-Type: application/json" \
     -d '{"message":"What is trending?","marketContext":{"BTC":"63000"}}'
   ```
   Expected: `{"content":"...","tradeSuggestion":...}`

5. **Courtroom:**
   ```bash
   curl -s -X POST http://localhost:3000/api/courtroom \
     -H "Content-Type: application/json" \
     -d '{"position":{"symbol":"ETH","side":"short","leverage":5,"margin_ratio":8.5},"priceData":{"change_1h":-2,"change_24h":-8,"volume_spike":true,"funding":"0.001","open_interest":"5000000"}}'
   ```
   Expected: `{"evidence":{...},"result":{"verdict":"...","narration":"The court has reviewed...","trustScore":...}}`

6. **Positions:**
   ```bash
   curl -s http://localhost:3000/api/positions
   ```
   Expected: Position data (if seeded) or `{"positions":[]}`

**Commit:**
```bash
git add -A
git commit -m "verify: end-to-end integration verification pass"
```

### Phase 6 Gate

Before proceeding to Phase 7, verify:
- [ ] Seed script runs (or positions exist from manual trading)
- [ ] At least 4 of 6 integrations pass (WS, /info, signing, copilot/courtroom)
- [ ] Courtroom API returns verdict + narration + trust score
- [ ] `pnpm build` succeeds (production build)
- [ ] All commits made for Phase 6

---

## Phase 7: Demo Prep + Recording

**Purpose:** Final polish, demo rehearsal, video recording.
**Estimated time:** 2 hours

### Task 7.1: Pre-Demo Checklist

**Steps:**

1. Verify all env vars are set with real keys:
   ```bash
   grep -c "your_" .env.local
   ```
   Expected: `0` (no placeholder values)

2. Run seed script to ensure demo positions exist:
   ```bash
   pnpm seed
   ```

3. Start dev server:
   ```bash
   pnpm dev
   ```

4. Walk through demo flow (PRD §6 — all 8 scenes):
   - [ ] Scene 1: Terminal loads, prices streaming
   - [ ] Scene 2: 3-column layout visible
   - [ ] Scene 3: Category tabs work, search works, market detail shows
   - [ ] Scene 4: Copilot chat responds, trade suggestion appears
   - [ ] Scene 5: Order placement works (or shows error toast)
   - [ ] Scene 6: WS indicator green, signing flow visible
   - [ ] Scene 7: Courtroom — FULL 7-phase animation with verdict + trust score
   - [ ] Scene 8: All panels active

5. If courtroom animations lag or break:
   - Reduce delay durations in `use-courtroom.ts` (minimum: 1s per phase)
   - Cut quality checks animation if needed (Phase 5)
   - Minimum viable: narration + verdict (no bar animations)

### Task 7.2: Production Build

**Steps:**

1. Build for production:
   ```bash
   pnpm build
   ```
   Expected: `Compiled successfully`

#### 🔀 Decision Point: Build Errors

Run: `pnpm build 2>&1 | tail -10`

✅ **If compiled successfully:** Continue.

🔀 **If type errors:**
1. Run `pnpm run typecheck` to identify specific errors
2. Fix each error — most common: missing exports, wrong import paths
3. Re-build

🔀 **If runtime errors (dynamic import, missing module):**
1. Check `serverExternalPackages` in `next.config.ts` includes `tweetnacl`, `bs58`
2. If Groq SDK causes issues: wrap in dynamic import or use `fetch` directly
3. Re-build

### Task 7.3: Deploy to Vercel

**Steps:**

1. Deploy:
   ```bash
   vercel deploy --prod
   ```
   Or push to GitHub and connect Vercel.

2. Set environment variables in Vercel dashboard:
   - `PACIFICA_PRIVATE_KEY`
   - `PACIFICA_PUBLIC_KEY`
   - `NEXT_PUBLIC_PACIFICA_REST_URL`
   - `NEXT_PUBLIC_PACIFICA_WS_URL`
   - `ELFA_API_KEY`
   - `GROQ_API_KEY`

3. Verify deployed URL works

### Task 7.4: Record Demo Video

**Steps:**

Follow PRD §6 Demo Script exactly — 8 scenes, 4-5 minutes total.

1. Pre-warm courtroom: run one analysis before recording (caches Groq + Elfa)
2. Use screen recording (OBS or QuickTime)
3. Record voiceover (live or Azure TTS via Remotion)
4. Edit if needed — cut dead air, keep it under 5 minutes

**Commit:**
```bash
git add -A
git commit -m "ship: AXON v1.0 — AI trading terminal for Pacifica"
```

### Phase 7 Gate (Final)

- [ ] Production build succeeds
- [ ] Deployed URL is live (or local demo works)
- [ ] Demo video recorded (under 10 minutes)
- [ ] All 38 files from Architecture Doc exist
- [ ] All integrations verified

---

## Appendix: Quick Reference

### All Files (38 total)

| # | File | Architecture Section | Phase |
|---|------|:---:|:---:|
| 1 | `package.json` | §4 | 0 |
| 2 | `next.config.ts` | §4 | 0 |
| 3 | `tsconfig.json` | §4 | 0 |
| 4 | `postcss.config.mjs` | §4 | 0 |
| 5 | `.env.local` | §4 | 0 |
| 6 | `src/app/globals.css` | §5 | 0 |
| 7 | `src/types/index.ts` | §3 | 1 |
| 8 | `src/lib/constants.ts` | §6 | 1 |
| 9 | `src/lib/signing.ts` | §7 | 1 |
| 10 | `src/lib/pacifica.ts` | §8 | 1 |
| 11 | `src/lib/query-client.ts` | §9 | 1 |
| 12 | `src/providers/ws-provider.tsx` | §10 | 1 |
| 13 | `src/app/providers.tsx` | §11 | 1 |
| 14 | `src/app/layout.tsx` | §11 | 1 |
| 15 | `src/hooks/use-market-data.ts` | §12 | 2 |
| 16 | `src/app/api/info/route.ts` | §20 | 2 |
| 17 | `src/components/price-grid.tsx` | §13 | 2 |
| 18 | `src/components/market-selector.tsx` | §14 | 2 |
| 19 | `src/hooks/use-orders.ts` | §15 | 2 |
| 20 | `src/app/api/trade/route.ts` | §15 | 2 |
| 21 | `src/components/order-panel.tsx` | §15 | 2 |
| 22 | `src/hooks/use-positions.ts` | §16 | 3 |
| 23 | `src/app/api/positions/route.ts` | §16 | 3 |
| 24 | `src/components/position-display.tsx` | §16 | 3 |
| 25 | `src/app/api/elfa/route.ts` | §17 | 3 |
| 26 | `src/app/api/copilot/route.ts` | §17 | 3 |
| 27 | `src/hooks/use-copilot.ts` | §17 | 3 |
| 28 | `src/components/trade-suggestion.tsx` | §17 | 3 |
| 29 | `src/components/chat-panel.tsx` | §17 | 3 |
| 30 | `src/app/api/courtroom/route.ts` | §18 | 4 |
| 31 | `src/hooks/use-courtroom.ts` | §18 | 4 |
| 32 | `src/components/judge-panel.tsx` | §19 | 4 |
| 33 | `src/components/quality-checks.tsx` | §19 | 4 |
| 34 | `src/components/verdict-banner.tsx` | §19 | 4 |
| 35 | `src/components/trust-bar.tsx` | §19 | 4 |
| 36 | `src/components/courtroom-tab.tsx` | §19 | 4 |
| 37 | `src/app/page.tsx` | §21 | 5 |
| 38 | `scripts/seed-demo.ts` | §28 | 6 |

### All Commands

| Phase | Task | Command | Purpose |
|:---:|:---:|---------|---------|
| 0 | 0.1 | `pnpm create next-app axon ...` | Scaffold project |
| 0 | 0.1 | `pnpm add @tanstack/react-query tweetnacl bs58 groq-sdk sonner clsx uuid` | Install deps |
| 0 | 0.3 | `pnpm dev` | Start dev server |
| 1 | 1.* | `pnpm run typecheck` | Verify types |
| 2 | 2.2 | `curl http://localhost:3000/api/info` | Test market info |
| 6 | 6.1 | `pnpm seed` | Seed demo positions |
| 6 | 6.2 | `curl -X POST http://localhost:3000/api/trade ...` | Test signing |
| 7 | 7.2 | `pnpm build` | Production build |
| 7 | 7.3 | `vercel deploy --prod` | Deploy |

### Troubleshooting

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `Cannot find module 'tweetnacl'` | Not installed | `pnpm add tweetnacl` |
| `bs58.decode is not a function` | bs58 v6 named exports | `import * as bs58 from 'bs58'` |
| WS stays "Connecting..." | Pacifica WS down | Wait + retry, check Discord |
| `422 INSUFFICIENT_BALANCE` | No testnet USDC | Fund via Pacifica faucet |
| `401` from Elfa | Invalid/missing API key | Register at dev.elfa.ai |
| Groq rate limit | >30 RPM on free tier | Wait 60s, pre-cache results |
| `signRequest` wrong signature | Key format mismatch | Check key length (32 or 64 bytes) |
| Build fails with dynamic import | Crypto module in client | Check `serverExternalPackages` |
| Courtroom shows fallback text | Groq/Elfa API error | Check API keys, network, rate limits |
| Positions always empty | Wrong account endpoint | Try `/account/state`, check Discord |
