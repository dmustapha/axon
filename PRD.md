# AXON — Product Requirements Document

**Hackathon:** Pacifica Hackathon 2026
**Track:** Trading Applications & Bots (primary)
**Deadline:** April 16, 2026 (2 days remaining)
**Version:** V1
**Scope Mode:** EMERGENCY — courtroom MUST ship (user override)

## [EMERGENCY MODE — 2 components mocked]

**Mocked components:**
- `[MOCK]` Orderbook depth visualization — displays placeholder "orderbook not available" with bid/ask spread from price data
- `[MOCK]` Historical candle charts — displays price ticker and 24h change instead of candlestick chart

All other components are real implementations.

---

## 1. Project Overview

### One-Liner
An AI-powered perpetuals trading terminal for Pacifica that combines real-time market data, social intelligence copilot, and a courtroom-style liquidation analyzer — all in one interface.

### Problem Statement
Perpetual futures traders lose **$2B+ annually** to preventable liquidations. They currently juggle **3-5 fragmented tools** (exchange UI, Twitter for sentiment, Discord for signals, spreadsheets for risk) with zero integration. No unified terminal exists for Pacifica, and no tool anywhere provides AI-powered liquidation analysis that distinguishes market-driven liquidations from manipulation-driven ones.

### Solution
AXON is a three-layer trading terminal built natively on Pacifica's perpetuals infrastructure:

1. **Real-time Terminal** — Live prices, positions, P&L, and order management streamed via WebSocket across 69 markets (crypto, stocks, forex, commodities).
2. **AI Copilot** — Powered by Elfa AI social intelligence, the copilot analyzes trending tokens, sentiment shifts, and generates trade setups through a conversational chat interface.
3. **Liquidation Courtroom** — AI agents evaluate whether a position approaching liquidation is under genuine market pressure or potential manipulation, presenting evidence in an animated courtroom UI with judge narration, quality checks, and a trust verdict.

### Why This Wins

| Judging Criterion | Weight | How We Excel |
|---|:---:|---|
| Innovation | 20% | Courtroom-as-liquidation-intelligence is a novel concept — no existing tool combines AI dispute analysis with a trading terminal. The courtroom spectacle is memorable and demo-worthy. |
| Technical Execution | 20% | Deepest Pacifica API integration: ALL market data via WebSocket, full order management via REST with ed25519 signing, account position streaming, Elfa AI social endpoints. Pure TypeScript stack. |
| User Experience | 20% | Multi-panel terminal with conversational AI, one-click trading, live data streaming. Built on proven dashboard patterns from PRISM and deltaagent. |
| Potential Impact | 20% | First comprehensive terminal for Pacifica. Consolidates 3-5 fragmented workflows into one interface. Generalizable architecture for any perps platform. |
| Presentation | 20% | Demo arc: live data → AI analysis → trade execution → courtroom spectacle as the grand finale. Story-driven, not feature-tour. |

---

## 2. System Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AXON TERMINAL (Next.js 15)                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Price Grid   │  │  AI Copilot  │  │   Courtroom Tab          │  │
│  │  (69 markets) │  │  Chat UI     │  │   JudgePanel + Verdict   │  │
│  │  + Market     │  │  + Trade     │  │   QualityChecks + Trust  │  │
│  │    Selector   │  │    Suggest   │  │   VerdictBanner          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                  │                      │                  │
│  ┌──────┴──────────────────┴──────────────────────┴───────────────┐ │
│  │              Shared State (TanStack Query + Context)            │ │
│  │  useMarketData | usePositions | useOrders | useCourtroomState  │ │
│  └──────┬──────────────────┬──────────────────────┬───────────────┘ │
│         │                  │                      │                  │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────────┴───────────────┐ │
│  │ WebSocket    │  │  API Routes  │  │  Courtroom Engine        │ │
│  │ Manager      │  │  (Next.js)   │  │  (State Machine +        │ │
│  │ (prices,     │  │  /api/trade  │  │   AI Judge via Groq)     │ │
│  │  positions)  │  │  /api/elfa   │  │                          │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘ │
└─────────┼──────────────────┼────────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Pacifica WS     │  │  Pacifica REST   │  │  Elfa AI API     │
│  test-ws.        │  │  test-api.       │  │  api.elfa.ai     │
│  pacifica.fi/ws  │  │  pacifica.fi     │  │  /v2/*           │
│                  │  │  /api/v1/*       │  │                  │
│  prices stream   │  │  orders          │  │  trending tokens │
│  positions       │  │  positions       │  │  sentiment       │
│  order updates   │  │  account         │  │  AI chat         │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Component Table

| # | Component | Type | Purpose | Key Dependencies |
|---|-----------|------|---------|-----------------|
| 1 | Price Grid | Frontend | Display live prices for all 69 markets with sorting/filtering | WebSocket Manager, TanStack Query |
| 2 | Market Selector | Frontend | Browse/search/filter markets by category (crypto, stocks, forex, commodities) | Price Grid, shared state |
| 3 | AI Copilot | Frontend + API | Chat interface for AI-powered trade analysis using Elfa social data | Elfa AI API, Groq API, Next.js API routes |
| 4 | Order Panel | Frontend + API | Place market/limit/stop orders with ed25519 signing | Pacifica REST API, tweetnacl signing |
| 5 | Position Display | Frontend | Show open positions, P&L, margin, liquidation price | WebSocket Manager (account_positions) |
| 6 | Courtroom Tab | Frontend | Animated courtroom UI analyzing liquidation risk | Courtroom Engine, WebSocket state |
| 7 | Courtroom Engine | Backend Logic | State machine driving courtroom phases, AI judge narration | Groq API (Llama 3.3), Pacifica position data, Elfa sentiment |
| 8 | WebSocket Manager | Service | Singleton WS connection with auto-reconnect, multi-source subscriptions | Pacifica WebSocket API |
| 9 | Signing Service | Utility | ed25519 message signing for Pacifica REST API authentication | tweetnacl, bs58 |
| 10 | Elfa Proxy | API Route | Server-side proxy for Elfa AI calls (hides API key from client) | Elfa AI REST API |

### Data Flow

1. **Market Data:** Pacifica WebSocket → WebSocket Manager → TanStack Query cache → Price Grid / Market Selector / Order Panel (for current price)
2. **Account Data:** Pacifica WebSocket (authenticated) → WebSocket Manager → TanStack Query cache → Position Display / Courtroom Engine (for liquidation proximity)
3. **AI Intelligence:** User chat message → Next.js API route → Elfa AI endpoints (trending, sentiment, chat) → Groq for synthesis → Chat UI response
4. **Order Execution:** User clicks trade → Order Panel → Signing Service (ed25519) → Next.js API route → Pacifica REST API → Order confirmation → Position Display updates via WebSocket
5. **Courtroom:** User triggers analysis → Courtroom Engine reads position data + Elfa sentiment → State machine progresses through 7 phases → JudgePanel narrates → VerdictBanner shows result

---

## 3. User Flows

### Flow 1: Terminal Browsing (Primary — judges see first)

1. User opens AXON → dashboard loads with Price Grid showing top markets (BTC, ETH, SOL)
2. WebSocket connects and prices stream in real-time (~3s updates)
3. User clicks a market category tab (Crypto / Stocks / Forex / Commodities)
4. Price Grid filters to show only that category
5. User clicks a market row (e.g., "ETH")
6. Market detail panel opens: current price, 24h change, funding rate, open interest, volume
7. Order Panel pre-fills with selected market
8. Position Display shows any open ETH positions

### Flow 2: AI Copilot Chat

1. User opens AI Copilot tab (right sidebar or tab)
2. User types: "What's the sentiment on SOL right now?"
3. System sends request to `/api/elfa` proxy → Elfa AI `trending-tokens` + `top-mentions` for SOL
4. Groq synthesizes Elfa data into conversational response with trade context
5. AI responds: "SOL sentiment is bullish — 340 mentions in the last hour, 78% positive. Smart accounts are accumulating. Current funding rate is +0.012% suggesting longs are dominant."
6. User types: "Should I long SOL?"
7. AI uses Elfa `tokenAnalysis` mode + current position data to generate trade setup
8. AI responds with entry, take-profit, stop-loss levels based on sentiment + market data
9. User clicks "Execute Trade" button attached to the suggestion
10. Flow transitions to Order Execution (Flow 3)

### Flow 3: Order Execution

1. User selects market (from Flow 1 or Flow 2 suggestion)
2. User chooses order type: Market / Limit / Stop
3. User enters amount, side (Long/Short), leverage
4. For limit/stop: user enters price
5. System shows order preview: estimated entry, fees, margin required, liquidation price
6. User clicks "Place Order"
7. Signing Service constructs payload → signs with ed25519 → sends to Pacifica REST
8. Order confirmation toast appears with order ID
9. If market order: Position Display updates immediately via WebSocket `account_positions`
10. If limit: order appears in Open Orders section; fills trigger position update

**Error paths:**
- Insufficient balance → "Insufficient margin. Required: $X, Available: $Y"
- API timeout → "Order submission timed out. Check your positions — order may have executed."
- Invalid signature → "Authentication failed. Please reconnect your wallet."
- Rate limit → "Too many requests. Please wait and retry."

### Flow 4: Courtroom Liquidation Analysis (Demo Finale)

1. User navigates to Courtroom tab
2. System shows positions approaching liquidation (< 15% margin remaining) OR user selects any position to analyze
3. User clicks "Analyze" on a position
4. **Phase 1 — Filing:** Courtroom UI animates "case filed" with position details (symbol, entry, current price, margin %, liquidation price)
5. **Phase 2 — Evidence Collection:** Progress bars animate as system gathers evidence:
   - Market data (price action, volume, funding rate from Pacifica WS)
   - Social sentiment (Elfa AI trending mentions, keyword analysis)
   - Position context (entry time, leverage, historical P&L)
6. **Phase 3 — Analysis:** AI Judge (Groq Llama 3.3) evaluates evidence
7. **Phase 4 — Deliberation:** JudgePanel shows typewriter narration: "The court has reviewed the evidence..."
8. **Phase 5 — Quality Checks:** Animated progress bars show confidence scores for each evidence category
9. **Phase 6 — Verdict:** VerdictBanner reveals: "MARKET-DRIVEN" or "MANIPULATION SUSPECTED"
   - Market-driven: "Price decline is consistent with broader market trend. Recommend reducing position size."
   - Manipulation: "Unusual volume spike inconsistent with organic movement. Recommend setting tighter stop-loss."
10. **Phase 7 — Trust Score:** TrustBar displays 0-800 confidence score with shimmer animation

### Sequence Diagram: Order Execution

```
User -> OrderPanel: Select market, enter amount, click "Place Order"
OrderPanel -> SigningService: {symbol, amount, side, type}
SigningService -> SigningService: Build header + payload → sort → serialize → sign (ed25519)
SigningService -> OrderPanel: {signature, timestamp, expiry_window}
OrderPanel -> /api/trade: POST {account, signature, ...payload}
/api/trade -> Pacifica REST: POST /orders/create_market
Pacifica REST -> /api/trade: {order_id, status}
/api/trade -> OrderPanel: {success, order_id}
OrderPanel -> User: Toast "Order placed: #order_id"
Pacifica WS -> WebSocketManager: account_positions update
WebSocketManager -> PositionDisplay: New/updated position
PositionDisplay -> User: Position appears with live P&L
```

### Sequence Diagram: Courtroom Analysis

```
User -> CourtroomTab: Click "Analyze" on position
CourtroomTab -> CourtroomEngine: {position_id, symbol, entry, current_price, margin_pct}
CourtroomEngine -> PacificaWS: Get latest price, funding, OI for symbol
CourtroomEngine -> /api/elfa: Get trending + top-mentions for symbol
CourtroomEngine -> CourtroomEngine: Phase 1 (Filing) → dispatch to UI
CourtroomTab -> JudgePanel: Animate "Case filed"
CourtroomEngine -> CourtroomEngine: Phase 2 (Evidence) → dispatch progress
CourtroomTab -> QualityChecks: Animate evidence bars
CourtroomEngine -> Groq: Analyze evidence → generate narration + verdict
Groq -> CourtroomEngine: {verdict, narration, confidence, trust_score}
CourtroomEngine -> CourtroomEngine: Phase 4 (Deliberation) → dispatch narration
CourtroomTab -> JudgePanel: Typewriter effect for narration
CourtroomEngine -> CourtroomEngine: Phase 6 (Verdict) → dispatch result
CourtroomTab -> VerdictBanner: Spring animation reveal
CourtroomTab -> TrustBar: Animate to trust score
```

---

## 4. Technical Specifications

### Price Grid
- **Purpose:** Display live market prices in a sortable, filterable table
- **Interface:** React component consuming `useMarketData()` hook
- **Key Data Structures:**
  ```typescript
  interface MarketPrice {
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
  ```
- **Dependencies:** WebSocket Manager, TanStack Query
- **Events:** `onMarketSelect(symbol: string)` → propagates to Order Panel + Position Display
- **Constraints:** Must handle 69 markets with ~3s update frequency without UI jank. Virtualized list for performance.

### Market Selector
- **Purpose:** Category-based market browsing (Crypto, Stocks, Forex, Commodities, Spot)
- **Interface:** Tab bar + search input → filters Price Grid
- **Key Data Structures:**
  ```typescript
  type MarketCategory = 'crypto' | 'stocks' | 'forex' | 'commodities' | 'spot';
  interface MarketSpec {
    symbol: string;
    category: MarketCategory;
    max_leverage: number;
    tick_size: string;
    min_order_size: string;
  }
  ```
- **Dependencies:** Pacifica REST `GET /info` (loaded once at startup)
- **Constraints:** Market specs fetched once on mount and cached (TanStack Query, 5min staleTime)

### AI Copilot
- **Purpose:** Conversational AI that synthesizes Elfa social intelligence with market data
- **Interface:** Chat UI with message history, trade suggestion cards
- **Key Data Structures:**
  ```typescript
  interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    tradeSuggestion?: TradeSuggestion;
    timestamp: number;
  }
  interface TradeSuggestion {
    symbol: string;
    side: 'long' | 'short';
    entry: string;
    takeProfit: string;
    stopLoss: string;
    confidence: number;
    reasoning: string;
  }
  ```
- **Dependencies:** Elfa AI API (via proxy), Groq API (via proxy), market data from WebSocket
- **Events:** `onExecuteTrade(suggestion: TradeSuggestion)` → opens Order Panel pre-filled
- **Constraints:** Elfa API rate limits (20K credits total). Groq free tier. Responses cached for repeated queries. Max 50 messages per session.

### Order Panel
- **Purpose:** Place, modify, and cancel orders on Pacifica
- **Interface:** Form with market/limit/stop toggle, amount, side, leverage inputs
- **Key Data Structures:**
  ```typescript
  interface OrderRequest {
    symbol: string;
    side: 'bid' | 'ask';
    amount: string;
    order_type: 'market' | 'limit' | 'stop';
    price?: string;           // limit/stop only
    reduce_only: boolean;
    slippage_percent?: string; // market only
    leverage?: number;
    client_order_id: string;
  }
  ```
- **Dependencies:** Signing Service, Pacifica REST API, current market price from WebSocket
- **Events:** Order placed → toast notification, position update via WS
- **Constraints:** Must validate sufficient balance before submission. Must show estimated liquidation price.

### Position Display
- **Purpose:** Show open positions with live P&L, margin, and liquidation proximity
- **Interface:** Table/card layout showing all open positions
- **Key Data Structures:**
  ```typescript
  interface Position {
    symbol: string;
    side: 'long' | 'short';
    size: string;
    entry_price: string;
    mark_price: string;
    unrealized_pnl: string;
    margin: string;
    liquidation_price: string;
    leverage: number;
    margin_ratio: number; // % remaining before liq
  }
  ```
- **Dependencies:** WebSocket Manager (`account_positions`), authenticated WS subscription
- **Events:** `onAnalyze(position: Position)` → opens Courtroom tab for that position
- **Constraints:** Must update in real-time. Highlight positions approaching liquidation (< 15% margin).

### Courtroom Tab
- **Purpose:** Animated courtroom UI presenting AI analysis of liquidation risk
- **Interface:** Full-tab layout with JudgePanel, QualityChecks bars, VerdictBanner, TrustBar
- **Key Data Structures:**
  ```typescript
  type CourtroomPhase = 'idle' | 'filing' | 'evidence' | 'analysis' | 'deliberation' | 'quality_checks' | 'verdict' | 'complete';
  interface CourtroomState {
    phase: CourtroomPhase;
    position: Position | null;
    evidence: EvidenceBundle | null;
    narration: string;
    verdict: 'market_driven' | 'manipulation_suspected' | null;
    trustScore: number; // 0-800
    confidenceScores: Record<string, number>;
  }
  ```
- **Dependencies:** Courtroom Engine, Position Display (selected position)
- **Events:** Phase transitions animate UI components
- **Constraints:** Full animation cycle: 15-25 seconds. Must feel theatrical — deliberate pacing with delays.

### Courtroom Engine
- **Purpose:** State machine + AI judge that evaluates liquidation evidence
- **Interface:** `analyzeLiquidation(position: Position): Promise<CourtroomResult>`
- **Key Data Structures:**
  ```typescript
  interface EvidenceBundle {
    priceAction: { change_1h: number; change_24h: number; volume_spike: boolean };
    sentiment: { mentions: number; positive_pct: number; trending: boolean };
    positionContext: { entry_age_hours: number; leverage: number; margin_ratio: number };
  }
  interface CourtroomResult {
    verdict: 'market_driven' | 'manipulation_suspected';
    narration: string;     // 50-word judge narration
    trustScore: number;    // 0-800
    confidenceScores: Record<string, number>;
    recommendation: string;
  }
  ```
- **Dependencies:** Groq API (Llama 3.3 70B), Pacifica WS data, Elfa AI data
- **Constraints:** Groq free tier rate limits. Fallback narration templates if API fails. Must produce result in < 5s.

### WebSocket Manager
- **Purpose:** Singleton WebSocket connection to Pacifica with auto-reconnect and multi-source subscriptions
- **Interface:** `subscribe(source: string): void`, `unsubscribe(source: string): void`, `onMessage(handler): void`
- **Key Data Structures:**
  ```typescript
  type WsSource = 'prices' | 'orderbook' | 'bbo' | 'trades' | 'account_positions' | 'account_order_updates' | 'account_info';
  interface WsMessage {
    channel: string;
    data: unknown;
  }
  ```
- **Dependencies:** Pacifica WebSocket API (`wss://test-ws.pacifica.fi/ws`)
- **Events:** Emits per-source callbacks. Reconnects on close/error with exponential backoff (1s, 2s, 4s, max 30s).
- **Constraints:** Ping every 30s to prevent 60s idle timeout. Max 20 subscriptions per connection. 24h max connection life.

### Signing Service
- **Purpose:** ed25519 message signing for Pacifica REST API authentication
- **Interface:** `signRequest(type: string, payload: Record<string, unknown>, privateKey: Uint8Array): SignedRequest`
- **Key Data Structures:**
  ```typescript
  interface SignedRequest {
    account: string;
    signature: string;
    timestamp: number;
    expiry_window: number;
    [key: string]: unknown; // spread payload fields
  }
  ```
- **Dependencies:** tweetnacl (ed25519), bs58 (base58 encoding)
- **Constraints:** Signing runs in Next.js API route (server-side only — private key never sent to client). Message format must match Pacifica: nested "data" key, recursive sort, compact JSON.

### Elfa Proxy
- **Purpose:** Server-side proxy to hide Elfa AI API key from client
- **Interface:** Next.js API routes at `/api/elfa/*`
- **Dependencies:** Elfa AI REST API (`https://api.elfa.ai/v2/*`)
- **Constraints:** 20K credits total. Cache responses (5min TTL) to minimize credit usage. Rate limit client requests.

---

## 5. API Contracts

### External API: Pacifica REST

- **Base URL:** `https://test-api.pacifica.fi/api/v1`
- **Authentication:** ed25519 signing (POST only; GET is public)
- **Rate Limits:** 125 credits/60s (unidentified), 300 with API key

#### Endpoint: GET /info [VERIFIED]
- **Request:** No parameters
- **Response (success):**
  ```json
  {
    "markets": [
      {
        "symbol": "BTC",
        "max_leverage": 50,
        "tick_size": "0.1",
        "min_order_size": "0.001",
        "status": "active"
      }
    ]
  }
  ```
- **Notes:** Returns 69 markets on testnet. Cache for 5 minutes.

#### Endpoint: POST /orders/create_market [VERIFIED]
- **Request:**
  ```json
  {
    "account": "<public_key_base58>",
    "signature": "<base58_signature>",
    "timestamp": 1713052800000,
    "expiry_window": 5000,
    "symbol": "BTC",
    "side": "bid",
    "amount": "0.1",
    "reduce_only": false,
    "slippage_percent": "0.5",
    "client_order_id": "<uuid>"
  }
  ```
- **Signing type:** `"create_market_order"`
- **Response (success):**
  ```json
  {
    "order_id": "<uuid>",
    "status": "filled",
    "filled_amount": "0.1",
    "avg_price": "63500.50"
  }
  ```
- **Response (error 422):**
  ```json
  {
    "error_code": 4,
    "message": "INSUFFICIENT_BALANCE"
  }
  ```

#### Endpoint: POST /orders/create [VERIFIED]
- **Request:**
  ```json
  {
    "account": "<public_key_base58>",
    "signature": "<base58_signature>",
    "timestamp": 1713052800000,
    "expiry_window": 5000,
    "symbol": "BTC",
    "side": "bid",
    "amount": "0.1",
    "price": "60000",
    "order_type": "limit",
    "reduce_only": false,
    "client_order_id": "<uuid>"
  }
  ```
- **Signing type:** `"create_order"`

#### Endpoint: POST /orders/cancel [VERIFIED]
- **Request:**
  ```json
  {
    "account": "<public_key_base58>",
    "signature": "<base58_signature>",
    "timestamp": 1713052800000,
    "expiry_window": 5000,
    "order_id": "<uuid>"
  }
  ```
- **Signing type:** `"cancel_order"`

#### Endpoint: POST /positions/tpsl [VERIFIED]
- **Request:**
  ```json
  {
    "account": "<public_key_base58>",
    "signature": "<base58_signature>",
    "timestamp": 1713052800000,
    "expiry_window": 5000,
    "symbol": "BTC",
    "take_profit": "70000",
    "stop_loss": "58000"
  }
  ```
- **Signing type:** `"update_position_tpsl"`

#### Endpoint: POST /account/leverage [VERIFIED]
- **Request:**
  ```json
  {
    "account": "<public_key_base58>",
    "signature": "<base58_signature>",
    "timestamp": 1713052800000,
    "expiry_window": 5000,
    "symbol": "BTC",
    "leverage": 10
  }
  ```
- **Signing type:** `"update_leverage"`

### External API: Pacifica WebSocket

- **URL:** `wss://test-ws.pacifica.fi/ws`
- **Authentication:** None for market data; ed25519 signed subscription for account data

#### Subscribe to Prices [VERIFIED]
- **Request:** `{"method": "subscribe", "params": {"source": "prices"}}`
- **Response (stream, ~3s interval):**
  ```json
  {
    "channel": "prices",
    "data": [
      {
        "symbol": "BTC",
        "funding": "0.0001",
        "oracle": "63452.10",
        "mark": "63460.50",
        "mid": "63455.30",
        "yesterday_price": "62100.00",
        "open_interest": "1250000",
        "volume_24h": "45000000",
        "timestamp": 1713052800000
      }
    ]
  }
  ```

#### Subscribe to Account Positions [UNVERIFIED]
- **Request:** `{"id": "<uuid>", "params": {"subscribe_account_positions": {signed_payload}}}`
- **Response (stream):**
  ```json
  {
    "channel": "account_positions",
    "data": [
      {
        "symbol": "BTC",
        "side": "long",
        "size": "0.1",
        "entry_price": "63000",
        "mark_price": "63460.50",
        "unrealized_pnl": "46.05",
        "margin": "630",
        "liquidation_price": "56700"
      }
    ]
  }
  ```
- **Notes:** Exact response schema is [UNVERIFIED]. Decision tree in Plan covers fallback to REST polling.

#### Heartbeat [VERIFIED]
- **Request:** `{"method": "ping"}`
- **Response:** `{"channel": "pong"}`

### External API: Elfa AI

- **Base URL:** `https://api.elfa.ai`
- **Authentication:** `x-elfa-api-key` header
- **Rate Limits:** 20,000 credits total (claimed via dev.elfa.ai)

#### Endpoint: GET /v2/aggregations/trending-tokens
- **Request:** Query params: `limit=20`
- **Response (success):** [UNVERIFIED — endpoint live but response schema assumed]
  ```json
  {
    "data": [
      {
        "token": "SOL",
        "mentions": 340,
        "sentiment_positive_pct": 78,
        "velocity": 2.4
      }
    ]
  }
  ```

#### Endpoint: GET /v2/data/top-mentions
- **Request:** Query params: `ticker=SOL&limit=10`
- **Response (success):** [UNVERIFIED]
  ```json
  {
    "data": [
      {
        "text": "SOL breaking out above $180...",
        "author": "@cryptotrader",
        "engagement": 1250,
        "sentiment": "positive",
        "timestamp": "2026-04-14T12:00:00Z"
      }
    ]
  }
  ```

#### Endpoint: POST /v2/chat (tokenAnalysis mode)
- **Request:**
  ```json
  {
    "mode": "tokenAnalysis",
    "query": "Analyze SOL for a long trade setup",
    "context": { "current_price": "180.50", "funding_rate": "0.012%" }
  }
  ```
- **Response (success):** [UNVERIFIED]
  ```json
  {
    "response": "SOL shows strong social momentum with 340 mentions...",
    "trade_setup": {
      "bias": "bullish",
      "entry_range": "178-182",
      "take_profit": "195",
      "stop_loss": "170",
      "confidence": 0.72
    }
  }
  ```
- **Notes:** Exact response format is [UNVERIFIED]. Architecture will include response adapter with fallback.

### External API: Groq

- **Base URL:** `https://api.groq.com/openai/v1`
- **Authentication:** Bearer token (`GROQ_API_KEY`)
- **Rate Limits:** Free tier — 30 RPM, 14,400 RPD for Llama 3.3 70B

#### Endpoint: POST /chat/completions
- **Request:**
  ```json
  {
    "model": "llama-3.3-70b-versatile",
    "messages": [
      {"role": "system", "content": "You are a trading court judge..."},
      {"role": "user", "content": "{evidence bundle as JSON}"}
    ],
    "temperature": 0.7,
    "max_tokens": 200,
    "response_format": { "type": "json_object" }
  }
  ```
- **Response (success):**
  ```json
  {
    "choices": [{
      "message": {
        "content": "{\"verdict\":\"market_driven\",\"narration\":\"...\",\"trust_score\":650,\"confidence\":{...}}"
      }
    }]
  }
  ```

---

## 6. Demo Script

**Total Duration:** 4-5 minutes
**Format:** Screen recording with voice narration (Remotion + Azure TTS or live)

### Demo Prerequisites

**Seed State Table** — exact state that must exist before recording begins.

| Item | Value | Network / Location | Created By |
|------|-------|-------------------|------------|
| Pacifica testnet wallet | Funded Solana keypair | Pacifica testnet | Manual registration at test-app.pacifica.fi |
| USDC balance | ≥ $5,000 testnet USDC | Pacifica testnet | Testnet faucet |
| Open BTC long position | 0.05 BTC at ~$63,000, 10x leverage | Pacifica testnet | seed-demo.ts (place via API) |
| Open ETH short position | 0.5 ETH at ~$3,200, 5x leverage, near liquidation | Pacifica testnet | seed-demo.ts (place via API) |
| Elfa AI API key | Valid key with credits | api.elfa.ai | Manual claim at dev.elfa.ai |
| Groq API key | Valid key | api.groq.com | Manual setup |
| WebSocket connected | Live price stream active | Pacifica WS | Automatic on app load |

**Invariant:** Running `npx ts-node scripts/seed-demo.ts` creates the positions and verifies balances.

### Scene 1: Problem & Idea (30s)

**Screen:** Split — left shows trader juggling 4 browser tabs (exchange, Twitter, Discord, spreadsheet). Right shows AXON terminal.
**Voiceover:** "Perp traders lose over 2 billion dollars a year to preventable liquidations. They juggle 4 to 5 tools with zero integration. AXON changes that — one terminal for market data, AI intelligence, and liquidation defense. Built on Pacifica."
**Action:** Fade from chaos tabs to clean AXON terminal.

### Scene 2: Solution Overview (30s)

**Screen:** AXON terminal fully loaded — Price Grid showing live prices, market categories visible
**Voiceover:** "AXON is a three-layer trading terminal. Real-time data from Pacifica's WebSocket. AI copilot powered by Elfa social intelligence. And a liquidation courtroom that tells you if you're being hunted."
**Action:** Camera pans across the three sections of the terminal.

### Scene 3: Live Product Walkthrough — Market Data (60s)

**Screen:** Price Grid with 69 markets streaming live
**Voiceover:** "69 markets streaming in real-time. Crypto, stocks, forex, commodities — all from Pacifica's WebSocket. Watch the prices update every 3 seconds."
**Action:** Click through market categories. Select BTC → show detail panel with funding rate, open interest, volume. Select NVDA → show stock prices on Pacifica.

### Scene 4: Live Product Walkthrough — AI Copilot (60s)

**Screen:** AI Copilot chat panel
**Voiceover:** "Ask the AI copilot anything. It pulls social intelligence from Elfa — trending tokens, sentiment analysis, smart account activity. Then gives you actionable trade setups."
**Action:**
1. Type "What's trending right now?" → AI returns trending tokens list
2. Type "Analyze SOL for a trade" → AI returns sentiment analysis + trade setup with entry/TP/SL
3. Click "Execute Trade" on the suggestion → Order Panel opens pre-filled

### Scene 5: Live Product Walkthrough — Order Execution (45s)

**Screen:** Order Panel with SOL market order
**Voiceover:** "One click to execute. AXON signs every order with ed25519 directly — full Pacifica API integration. Market orders, limit orders, stop orders, take-profit and stop-loss management."
**Action:**
1. Place a market long on SOL → show confirmation toast
2. Position appears in Position Display with live P&L
3. Set TP/SL on the position

### Scene 6: Pacifica Integration Deep Dive (45s)

**Screen:** Split — code snippets on left, working terminal on right
**Voiceover:** "Under the hood: WebSocket subscriptions for real-time prices. Ed25519 signing for every authenticated request. REST API for order management across all 12 order endpoints. Account position streaming. This isn't a wrapper — it's a native Pacifica terminal."
**Action:** Show signing flow visually. Highlight WS connection indicator. Show API response in dev tools briefly.

### Scene 7: Courtroom — The Grand Finale (60s)

**Screen:** Courtroom tab with ETH short position near liquidation
**Voiceover:** "Here's what makes AXON different. Your ETH short is approaching liquidation. Is it the market? Or is someone hunting your stop? The Liquidation Courtroom investigates."
**Action:**
1. Click "Analyze" on the ETH position
2. Courtroom animates — case filed, evidence collected (progress bars), AI judge deliberates
3. JudgePanel typewriter: "The court has reviewed price action, social sentiment, and position context..."
4. VerdictBanner reveals: "MARKET-DRIVEN" or "MANIPULATION SUSPECTED"
5. TrustBar animates to 650/800
6. Judge recommends: "Reduce position size and widen stop-loss"

### Scene 8: Impact & What's Next (30s)

**Screen:** Full terminal view with all components visible
**Voiceover:** "AXON consolidates 5 tools into one. Real-time data, AI intelligence, and the first liquidation courtroom anywhere. With more time: copy trading, advanced charting, and multi-exchange support. This is just the beginning."
**Action:** Terminal view with all panels active showing live data.

---

## 7. Risk Register

| # | Risk | Severity | Likelihood | Impact | Mitigation | Decision Tree |
|---|------|----------|-----------|--------|------------|:---:|
| 1 | Scope overload — terminal + AI + courtroom too ambitious for 2 days | CRITICAL | HIGH | Ship incomplete, courtroom cut | Courtroom is one tab built last using Verdikt's existing code. Terminal is 90% of effort. Build in priority order. | Plan Phase 4 |
| 2 | Pacifica WebSocket drops during demo recording | CRITICAL | MEDIUM | Demo shows stale data, looks broken | Pre-record fallback demo. Ping every 30s. Auto-reconnect with exponential backoff. Test stability before recording. | Plan Phase 5 |
| 3 | Elfa AI API key not claimed or credits exhausted | CRITICAL | MEDIUM | AI Copilot is non-functional | Register at dev.elfa.ai FIRST. Cache all Elfa responses (5min TTL). Pre-seed demo data as fallback. Hard-code demo responses if needed. | Plan Phase 2 |
| 4 | Ed25519 signing fails in TypeScript (tweetnacl) | HIGH | LOW | Cannot place orders — core feature broken | Python signing verified. TS uses same primitive (nacl.sign.detached + bs58). Test signing immediately in Phase 1. Fallback: Python signing microservice. | Plan Phase 1 |
| 5 | Category crowding — judges see multiple AI terminal submissions | HIGH | MEDIUM | Lower relative scores | Courtroom module is the differentiator. Demo script leads with courtroom spectacle, not feature tour. | Plan Phase 5 |
| 6 | Groq API rate limits hit during demo | HIGH | LOW | Courtroom narration fails mid-demo | Fallback narration templates hardcoded. Cache courtroom results. Pre-run analysis before recording. | Plan Phase 4 |
| 7 | Account WebSocket subscription format incorrect (UNVERIFIED) | HIGH | MEDIUM | No live position updates | REST polling fallback for positions every 5s. Account WS format from SDK analysis — test early. | Plan Phase 3 |
| 8 | Demo overwhelm — too many features confuse judges | MEDIUM | MEDIUM | Judges don't understand the value | Demo script focused on 3 features: AI sentiment → trade execution → courtroom. Everything else is background. Max 5 minutes. | Plan Phase 5 |
| 9 | Pacifica testnet API downtime | MEDIUM | LOW | Cannot test or demo | Pre-record demo during stable period. Cache API responses for offline development. | Plan Phase 1 |
| 10 | Time pressure causes bugs in courtroom module | MEDIUM | HIGH | Courtroom animations broken or incomplete | Build courtroom with Verdikt patterns (proven working). Reduce animation complexity if behind schedule. Minimum viable: narration + verdict, no animations. | Plan Phase 4 |
| 11 | Insufficient testnet balance for demo positions | LOW | LOW | Cannot show position management or courtroom | Fund wallet early. Request from Discord support if faucet insufficient. | Plan Phase 1 |

### Risk Categories Covered
- [x] Technical risks (#4, #7, #9)
- [x] Competitive risks (#5)
- [x] Time risks (#1, #10)
- [x] Demo risks (#2, #6, #8)
- [x] Judging risks (#5, #8)
- [x] Scope risks (#1, #3)

---

## 8. Day-by-Day Build Plan

| Day | Date | Primary Objective | Secondary Objective | Deliverable |
|:---:|------|------------------|--------------------|-----------  |
| 1 | Apr 14 | Core terminal + AI copilot | Order management | Working terminal with live prices, AI chat, and order placement |
| 2 | Apr 15 | Courtroom module + polish | Demo recording | Complete courtroom tab, full demo video, submission-ready |

### Detailed Hour-by-Hour (Emergency Mode)

**Day 1 — Apr 14 (Today)**

| Hours | Phase | Deliverable |
|:---:|-------|------------|
| 0-2h | Project scaffolding + WebSocket | Next.js app with live price streaming from Pacifica WS |
| 2-4h | Terminal UI | Price Grid, Market Selector, Position Display components |
| 4-6h | Ed25519 signing + Order Panel | Working order placement on Pacifica testnet |
| 6-8h | AI Copilot | Elfa AI proxy, chat UI, trade suggestions |
| 8-10h | Position management | Account WS subscription, live P&L, TP/SL |

**Day 2 — Apr 15**

| Hours | Phase | Deliverable |
|:---:|-------|------------|
| 0-3h | Courtroom module | Courtroom Engine + UI (JudgePanel, QualityChecks, VerdictBanner, TrustBar) |
| 3-5h | Courtroom polish + integration | Courtroom connected to real position data + Elfa sentiment |
| 5-7h | Full UI polish | Consistent dark theme, loading states, error handling |
| 7-9h | Demo prep + recording | Seed demo state, run through demo script, record video |
| 9-10h | Buffer | Fix bugs, re-record if needed, prepare submission |

### Buffer Allocation
- 2 hours buffer on Day 2 (hours 9-10)
- If courtroom falls behind: cut animations, keep narration + verdict
- If AI copilot falls behind: use hardcoded demo responses
- Absolute minimum demo: terminal with live prices + one order execution + courtroom verdict (no animations)

---

## 9. Dependencies & Prerequisites

### External Services

| Service | URL | Auth Required | Status |
|---------|-----|:---:|---|
| Pacifica REST API | https://test-api.pacifica.fi/api/v1 | ed25519 (POST) | VERIFIED |
| Pacifica WebSocket | wss://test-ws.pacifica.fi/ws | None (market) / ed25519 (account) | VERIFIED |
| Elfa AI | https://api.elfa.ai/v2 | API key header | LIVE (needs key) |
| Groq | https://api.groq.com/openai/v1 | Bearer token | LIVE |

### Development Tools

| Tool | Version | Purpose | Install Command |
|------|---------|---------|----------------|
| Node.js | 20+ | Runtime | `brew install node` |
| pnpm | 9+ | Package manager | `npm install -g pnpm` |
| Next.js | 15 | Framework | `pnpm create next-app` |
| TypeScript | 5.x | Language | Included with Next.js |
| tweetnacl | 1.x | ed25519 signing | `pnpm add tweetnacl` |
| bs58 | 6.x | Base58 encoding | `pnpm add bs58` |
| shadcn/ui | latest | UI components | `pnpm dlx shadcn@latest init` |
| TanStack Query | 5.x | Data fetching + cache | `pnpm add @tanstack/react-query` |

### Accounts & Credentials

| Account | Purpose | How to Get |
|---------|---------|-----------|
| Pacifica testnet wallet | Trading on testnet | Register at https://test-app.pacifica.fi (code: "Pacifica"), generate Solana keypair |
| Elfa AI API key | Social intelligence data | Register at https://dev.elfa.ai → generate key → upgrade to Pay-As-You-Go → submit claim form |
| Groq API key | LLM for courtroom narration + AI copilot synthesis | Sign up at https://console.groq.com → generate API key |

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PACIFICA_PRIVATE_KEY` | Solana ed25519 private key (base58) | `4wBqp...` |
| `PACIFICA_PUBLIC_KEY` | Solana ed25519 public key (base58) | `7xKp...` |
| `NEXT_PUBLIC_PACIFICA_REST_URL` | Pacifica REST base URL | `https://test-api.pacifica.fi/api/v1` |
| `NEXT_PUBLIC_PACIFICA_WS_URL` | Pacifica WebSocket URL | `wss://test-ws.pacifica.fi/ws` |
| `ELFA_API_KEY` | Elfa AI API key | `elfa_...` |
| `GROQ_API_KEY` | Groq API key | `gsk_...` |

---

## 10. Concerns Compliance

| # | Severity | Concern | How PRD Addresses It |
|---|:---:|---------|----------------------|
| 1 | C | Demo failure: Full trading terminal demo flow (connect → analyze → trade → courtroom) must work end-to-end without manual intervention | Demo Script (§6) covers full flow with seed state table. Demo Prerequisites specify exact pre-conditions. Fallback: pre-recorded backup video. |
| 2 | C | Integration failure: Pacifica testnet API (REST + WebSocket) must be live and authenticated with ed25519 signing | API Contracts (§5) document all verified endpoints. Signing Service spec (§4) details exact ed25519 flow. Decision trees cover signing failure fallbacks. |
| 3 | C | Courtroom must ship: Innovation score drops from 8→5 without courtroom module. It is the differentiator. | Courtroom Tab and Courtroom Engine are full components in §4. Build plan allocates 5 hours to courtroom on Day 2. Uses Verdikt's proven code patterns. Minimum viable: narration + verdict (no animations). |
| 4 | I | Scope creep: Core feature set must be locked by end of forge — no additions during build | §8 Day-by-Day Plan locks features. Out-of-scope items explicit: TWAP, batch, subaccounts, candle charts, mobile, orderbook depth. Emergency Mode Notice lists mocked components. |
| 5 | I | Elfa AI availability: 20K free credits must be claimed and working before build starts | §9 Dependencies lists Elfa key as prerequisite with exact claim instructions. §7 Risk #3 covers Elfa unavailability with cached/hardcoded fallback. |
| 6 | I | WebSocket stability: Price/orderbook streams must remain connected for demo recording (60s idle timeout, 24h max) | WebSocket Manager spec (§4) includes 30s ping interval, auto-reconnect with exponential backoff. §7 Risk #2 covers WS drop during demo with pre-recorded fallback. |
| 7 | A | Polish: UI polish is advisory for terminal — function and demo flow take priority | Build plan prioritizes function (Day 1) over polish (Day 2, hours 5-7). Buffer allocated for polish only after courtroom ships. |
| 8 | A | Pre-recorded fallback: Have backup demo recording in case live WebSocket drops during recording | §8 Build Plan includes "re-record if needed" in buffer. §7 Risk #2 mitigation: pre-record during stable WS period. |
