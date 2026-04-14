# Pacifica Hackathon 2026 — Ideas

## Selected: [AWAITING WARROOM DELIBERATION]

---

## Generation Stats
- Raw ideas generated: 21
- Killed by Kill List: 3
- Killed by Demo Test: 1
- Killed by score threshold: 2
- Salvaged kernels: 4
- Final presented: 8

---

## Constraint Methods Used

| # | Method | Ideas Generated |
|---|--------|:---:|
| 1 | Tech Combo (constraint-B) | 3 |
| 2 | Demo Impact (constraint-D) | 3 |
| 3 | Inversion (constraint-E) | 3 |
| 4 | Market Gap (constraint-F) | 3 |
| 5 | External Injection | 3 |
| 6 | Problem-First | 3 |
| 7 | Recombination | 3 |

---

## Presented Ideas

### #1: NEXUS — AI Social Trading Terminal
**Score:** 23/25 — Ship [4] | Demo [5] | Sponsor [5] | Novel [5] | Memorable [4]

**Pitch:** A full-featured perpetuals trading terminal where an AI copilot powered by Elfa AI social intelligence analyzes sentiment, surfaces trade setups, and executes orders — all through a conversational interface layered on top of real-time Pacifica market data.

**Demo:** Open the terminal. Live orderbook streaming via WebSocket. User asks the AI "What's the sentiment on BTC right now?" — Elfa AI trending tokens + keyword mentions load instantly. AI says "Strong bullish momentum on CT, 3 whale accounts loading BTC longs. Recommend long BTC 0.1 with trailing stop." User clicks "Execute" → market order fires via Pacifica API → position appears in real-time. Position panel shows live P&L, liquidation price, margin ratio. AI monitors and says "Sentiment shifting bearish — recommend tightening stop to breakeven." User approves → stop order updates.

**Targets:** Track 1: Trading Applications ($2K) + Grand Prize ($5K) + Most Innovative ($1K) + Best UX ($1K) = **$9K max**

**Tech Stack & Integration:**
- **Pacifica REST:** ALL market endpoints (7), ALL order endpoints (market, limit, stop, TWAP, TP/SL), account info, positions, leverage management
- **Pacifica WS:** Prices, Orderbook, BBO, Trades, Account Positions, Account Order Updates, Account Trades
- **Elfa AI:** trending-tokens, keyword-mentions, top-mentions, trending-narratives, AI Chat (tokenAnalysis + macro + summary modes), smart-stats for filtering signal accounts
- **Privy:** Embedded wallet for instant onboarding (no Phantom needed)
- **Signing:** Full ed25519 implementation for all POST operations
- **Reusable code:** PRISM multi-protocol UI patterns, AgentAuditor LLM integration, Somnia real-time streaming architecture

**What This Becomes:** The Bloomberg Terminal for Pacifica — every serious perps trader's daily driver.

**The Risk:** Scope is ambitious — terminal + AI + real-time data + full order management. Mitigated by: extensive reusable code (PRISM UI, AgentAuditor LLM patterns), Claude Code 10x speed, and can ship with 3 core features (orderbook view, AI chat, order execution).

**Why this wins:** Deepest possible Pacifica API integration (touches ALL endpoints). Elfa AI integration is native, not bolted-on — social intelligence IS the product differentiator. Targets ALL 4 prize categories. No trading terminal exists for Pacifica yet. Demo is visually stunning — live data, real trades, AI conversation.

**Method:** Recombination (Tech Combo #1 + Demo Impact #4 + Market Gap #10)

---

### #2: SENTRY — Intelligent Risk Shield for Perpetuals
**Score:** 21/25 — Ship [5] | Demo [4] | Sponsor [4] | Novel [4] | Memorable [4]

**Pitch:** An AI-powered risk management system that monitors all your Pacifica positions in real-time, predicts liquidation risk using market data + social sentiment, and autonomously adjusts TP/SL, reduces position size, or alerts you — a "guardian angel" for perps traders.

**Demo:** Dashboard shows 3 open positions with live margin ratios via WS. Elfa AI detects a trending bearish narrative on ETH. SENTRY's risk score spikes from GREEN to YELLOW. AI explains: "Bearish CT momentum detected — 12 high-influence accounts calling ETH top. Your ETH long liquidation distance: 3.2%. Recommendation: tighten stop-loss to $X." User enables "Guardian Mode" → SENTRY auto-adjusts the stop order via API. 30 seconds later, price drops — SENTRY caught it.

**Targets:** Track 1: Trading ($2K) + Best UX ($1K) + Grand Prize ($5K) = **$8K max**

**Tech Stack & Integration:**
- **Pacifica REST:** account info, positions, create/edit stop orders, TP/SL, account settings, leverage
- **Pacifica WS:** Account Positions, Account Margin, Prices, Mark Price Candle
- **Elfa AI:** trending-tokens, keyword-mentions, AI Chat (macro + tokenAnalysis), trending-narratives
- **Signing:** ed25519 for all order modifications
- **Reusable code:** Ghostfund monitoring + policy engine (ACE MaxPolicy → position size limits, PausePolicy → circuit breakers), TrustTap scoring algorithm adapted for risk scoring

**What This Becomes:** Risk management SaaS for perps traders — subscription model, works across exchanges.

**The Risk:** "Guardian Mode" auto-execution needs to feel safe, not scary. Mitigated by: clear opt-in UX, human-in-the-loop confirmation for large adjustments (Ghostfund pattern), transparent risk scoring.

**Why this wins:** Solves the #1 perps trader pain point (liquidation). Ghostfund's monitoring + policy engine is directly transplantable. Elfa AI integration is meaningful (social sentiment as risk signal). Deep Pacifica API usage (positions, orders, account management).

**Method:** Problem-First (liquidation anxiety) + Tech Combo (Pacifica positions + Elfa AI sentiment)

---

### #3: ARENA — Social Trading Competition Platform
**Score:** 21/25 — Ship [4] | Demo [5] | Sponsor [4] | Novel [4] | Memorable [4]

**Pitch:** A competitive trading platform built on Pacifica's subaccount system. Traders join time-boxed competitions, trade on isolated subaccounts, and climb leaderboards ranked by P&L, Sharpe ratio, and social influence (Elfa AI smart-stats). Winners earn prizes and followers. Think "Fantasy Football for perpetuals trading."

**Demo:** Landing page shows active competitions ("BTC Bulls vs Bears — 24hr — $500 prize pool"). User clicks "Join" → Privy embedded wallet creates account → Pacifica subaccount auto-created with funded balance. Trading interface opens — simplified view for competition. Real-time leaderboard on the right shows all competitors' P&L updating live via WS. User places a trade. Leaderboard shifts. Competition ends — winner celebration animation with confetti + prize distribution.

**Targets:** Track 3: Social & Gamification ($2K) + Grand Prize ($5K) + Best UX ($1K) = **$8K max**

**Tech Stack & Integration:**
- **Pacifica REST:** subaccount creation, fund transfer, account info, positions, trade history, orders (all types)
- **Pacifica WS:** Account Trades, Account Positions, Account Info, Prices
- **Elfa AI:** smart-stats (rank traders by social influence), account analysis
- **Privy:** Embedded wallets for instant onboarding
- **Fuul:** Referral tracking for competition invites
- **Signing:** ed25519 for subaccount creation (both main + sub must sign)
- **Reusable code:** TrustTap scoring for trader reputation, Verdikt leaderboard patterns

**What This Becomes:** The Robinhood of perps competitions — gamified trading that drives Pacifica adoption.

**The Risk:** Subaccount flow (main + sub signing) is complex. Mitigated by: Python SDK has subaccount examples, Privy handles wallet complexity. Competition logic is straightforward.

**Why this wins:** Uses Pacifica's UNIQUE feature (subaccounts) that no other perps platform has in the same way. Gamification + social = viral potential. Demo is incredibly visual (leaderboards, competitions, real-time P&L). Judges love platforms that drive ecosystem adoption. Uses 4 sponsor tools (Pacifica, Elfa, Privy, Fuul).

**Method:** External Injection (Hyperliquid leaderboard pattern) + Market Gap (no social layer on Pacifica)

---

### #4: ORACLE — Predictive Analytics & Liquidation Radar
**Score:** 20/25 — Ship [4] | Demo [5] | Sponsor [3] | Novel [4] | Memorable [4]

**Pitch:** Real-time analytics platform that visualizes Pacifica's market microstructure — orderbook heatmaps, liquidation cascades, funding rate trends, whale position tracking — overlaid with Elfa AI social momentum indicators to predict market moves before they happen.

**Demo:** Full-screen dashboard with 4 panels. Panel 1: Live orderbook heatmap (WS depth data visualized as color gradient — green bids, red asks, bright = thick). Panel 2: Liquidation radar showing estimated liquidation clusters by price level. Panel 3: Funding rate chart with historical trends + arbitrage opportunities highlighted. Panel 4: Elfa AI social pulse — trending narratives, keyword velocity, smart account activity. All updating in real-time. User hovers over a liquidation cluster → tooltip: "~$2.3M in long liquidations between $62,100 - $62,500. Social sentiment turning bearish (Elfa momentum score: -0.7)."

**Targets:** Track 2: Analytics & Data ($2K) + Most Innovative ($1K) + Grand Prize ($5K) = **$8K max**

**Tech Stack & Integration:**
- **Pacifica REST:** exchange info, prices, orderbook, recent trades, historical funding, candles, mark price candles
- **Pacifica WS:** Orderbook, BBO, Trades, Prices, Candle, Mark Price Candle
- **Elfa AI:** trending-tokens, keyword-mentions, trending-narratives, trending-cas, AI Chat (macro + summary)
- **Reusable code:** Somnia DataStream real-time architecture, PRISM dashboard layout

**What This Becomes:** The TradingView competitor for Pacifica — data-driven trading intelligence.

**The Risk:** Liquidation estimation requires position data that may not be publicly available via API. Mitigated by: estimate from orderbook imbalance + historical patterns + social signals. Even without exact liquidation data, the analytics dashboard is compelling.

**Why this wins:** Most visually impressive demo possible — judges see beautiful real-time visualizations. Uses ALL 6 market WebSocket channels. Elfa AI adds genuine predictive value (social sentiment as leading indicator). Track 2 (Analytics) is likely the least competitive track.

**Method:** Demo Impact (visual heatmaps) + Market Gap (no analytics tools exist for Pacifica)

---

### #5: AUTOPILOT — Autonomous Strategy Vault
**Score:** 19/25 — Ship [3] | Demo [4] | Sponsor [4] | Novel [4] | Memorable [4]

**Pitch:** A vault-based automated trading system where users deposit capital and choose from AI-curated strategies (funding rate capture, momentum trading, mean reversion). The vault executes via Pacifica's full order API, uses Elfa AI for strategy signals, and tracks performance with full transparency.

**Demo:** User deposits testnet SOL into the vault. Selects "Funding Rate Capture" strategy. Dashboard shows: vault balance, active positions, strategy P&L, funding collected. AI panel shows why each trade was taken: "BTC funding rate at +0.05% (annualized 54%). Opened short BTC + equivalent spot hedge. Expected daily yield: $X." Real-time position tracking via WS.

**Targets:** Track 4: DeFi Composability ($2K) + Grand Prize ($5K) + Most Innovative ($1K) = **$8K max**

**Tech Stack & Integration:**
- **Pacifica REST:** ALL order types (market, limit, stop, TWAP), positions, account info, leverage management, margin mode
- **Pacifica WS:** All account channels + market channels
- **Elfa AI:** macro mode for market context, trending-tokens for momentum signals
- **Signing:** Full ed25519 for all automated order execution
- **Reusable code:** Ghostfund vault architecture + monitoring, PRISM protocol adapter pattern

**What This Becomes:** Yearn Finance for perpetuals — automated yield on Pacifica.

**The Risk:** Automated trading on testnet needs pre-seeded scenarios to demo compellingly. Strategy backtesting might be simplistic. Mitigated by: use Ghostfund's human-in-the-loop pattern for transparency, pre-seed testnet with realistic scenarios.

**Why this wins:** DeFi Composability track. Deepest order API integration (all order types). Vault pattern is proven (Yearn, GMX GLP). Strategy automation is genuinely innovative on Pacifica.

**Method:** External Injection (GMX/Yearn vault pattern) + Tech Combo (Pacifica orders + Elfa AI signals)

---

### #6: PULSE — Social Sentiment Trading Signals
**Score:** 19/25 — Ship [5] | Demo [4] | Sponsor [5] | Novel [3] | Memorable [2]

**Pitch:** Real-time trading signal dashboard that converts Elfa AI social intelligence into actionable perpetuals trade signals on Pacifica. See what CT is saying, get AI-generated trade setups, one-click execute on Pacifica.

**Demo:** Dashboard shows top trending tokens (Elfa). User clicks BTC → social momentum chart, keyword velocity, smart account positions. AI generates trade setup: "Bullish sentiment acceleration detected. 8/10 smart accounts long. Suggested: Long BTC at market, TP +3%, SL -1.5%." User clicks "Execute" → order fires on Pacifica. Position appears with live tracking.

**Targets:** Track 2: Analytics ($2K) + Most Innovative ($1K) = **$3K**

**Tech Stack & Integration:**
- **Pacifica REST:** market orders, limit orders, TP/SL, positions, prices
- **Pacifica WS:** Prices, Account Positions
- **Elfa AI:** ALL endpoints (trending-tokens, keyword-mentions, top-mentions, trending-narratives, trending-cas, smart-stats, AI Chat with all 6 modes)
- **Privy:** Embedded wallet onboarding
- **Reusable code:** AgentAuditor LLM analysis patterns

**What This Becomes:** The social trading signal service for crypto — like TipRanks for perps.

**The Risk:** "Social signals → trade" is not novel as a concept. Differentiation is in execution quality and Elfa AI depth. Mitigated by: deepest possible Elfa AI integration (ALL endpoints), quality UX.

**Why this wins:** Deepest Elfa AI integration of any idea. Ships fast (simpler scope). But may not stand out enough for Grand Prize.

**Method:** Tech Combo (Elfa AI full suite + Pacifica orders)

---

### #7: FORGE — Prediction Market on Perp Outcomes
**Score:** 20/25 — Ship [3] | Demo [5] | Sponsor [3] | Novel [5] | Memorable [5]

**Pitch:** Binary prediction markets settled against Pacifica's mark prices. "Will BTC be above $65K at Friday 5PM UTC?" Users stake positions. Settlement is trustless — Pacifica's mark price candle endpoint is the oracle. Social sentiment from Elfa AI powers crowd wisdom indicators.

**Demo:** Landing page shows live markets: "BTC > $65K by Apr 16?" (65% YES). User clicks into market → price chart with Pacifica mark price live, social sentiment gauge (Elfa), position breakdown (bulls vs bears). User buys YES position. Timer counts down. Market resolves — Pacifica mark price candle at settlement time determines winner. Payout animation.

**Targets:** Track 3: Social & Gamification ($2K) + Most Innovative ($1K) + Grand Prize ($5K) = **$8K max**

**Tech Stack & Integration:**
- **Pacifica REST:** mark price candles (settlement oracle), prices, exchange info
- **Pacifica WS:** Mark Price Candle, Prices
- **Elfa AI:** trending-tokens (crowd wisdom), keyword-mentions (sentiment), AI Chat (tokenAnalysis for market context)
- **Privy:** Embedded wallet for betting
- **Reusable code:** Verdikt escrow patterns for stake management

**What This Becomes:** Polymarket for perpetuals — prediction markets on any derivative.

**The Risk:** Using Pacifica as a price oracle is creative but limited — we're not using the full order/position API. Only market data endpoints. Judges might say "Pacifica is optional."

**Why this wins:** Most memorable idea by far — prediction markets are inherently engaging. Demo is incredibly fun (live betting). Highly novel in the Pacifica ecosystem. BUT: Pacifica integration is shallow (only price feeds), which violates our per-hackathon concern about deep API usage.

**Method:** Inversion (instead of trading perps → betting on perp outcomes) + Demo Impact

---

### #8: MINOTAUR — Cross-Exchange Funding Rate Arbitrage Engine
**Score:** 19/25 — Ship [4] | Demo [4] | Sponsor [3] | Novel [3] | Memorable [4]

**Pitch:** Automated system that monitors funding rates across Pacifica and major CEXs (Binance, Bybit, OKX), identifies arbitrage opportunities, and executes delta-neutral positions — long on the exchange paying funding, short on the one charging it. Captures the spread risk-free.

**Demo:** Dashboard shows funding rate comparison table: Pacifica BTC +0.03%, Binance BTC -0.01% → "Arbitrage opportunity: 0.04% spread." User clicks "Execute Arb" → MINOTAUR opens long on Pacifica (via API) + shows hedge instruction for CEX. Position tracker shows both legs, net funding collected over time, and total P&L.

**Targets:** Track 1: Trading ($2K) + Most Innovative ($1K) = **$3K**

**Tech Stack & Integration:**
- **Pacifica REST:** historical funding, prices, market orders, positions, account info
- **Pacifica WS:** Prices, Account Positions
- **Elfa AI:** trending-tokens (to predict funding rate direction from social momentum)
- **Signing:** Full ed25519 for order execution

**What This Becomes:** Professional arbitrage tool for institutional traders.

**The Risk:** Cross-exchange execution requires CEX API keys which complicates the demo. Mitigated by: show Pacifica leg live, mock the CEX leg visually. Funding rate data from Pacifica is real.

**Why this wins:** Directly suggested by Pacifica in their Track 1 ideas. Deep API usage (funding data + orders + positions). Practical utility — real traders do this. But: less visually impressive than NEXUS or ARENA.

**Method:** Problem-First (funding rate ignorance) + External Injection (dYdX/Hyperliquid arb tools)

---

## Honorable Mentions (Scored 17-18)

- **TradeGuard** (17/25) — AI that PREVENTS bad trades by analyzing position risk + social sentiment before execution. Creative inversion but narrow scope, hard to demo the "nothing happened" value.
- **PacificaEasy** (17/25) — Simplified trading for beginners with Privy embedded wallets. Good UX angle but low on innovation and technical depth.

---

## Killed Ideas (Notable)

| Idea | Method | Kill Reason |
|------|--------|-------------|
| ContrarianBot | Inversion | Demo Test — contrarian trading results are hard to show convincingly in 3 min |
| PerpKit (SDK Framework) | External Injection | Demo Test — frameworks have nothing visual to show judges |
| MarginGuard (Margin Optimizer) | Market Gap | Score threshold (11/25) — too narrow, single endpoint usage |

---

## Salvaged Kernels

1. **ContrarianBot's inversion signal** — "trade against CT consensus" can be a mode inside NEXUS AI copilot
2. **PerpKit's strategy abstraction** — pluggable strategy pattern reusable in AUTOPILOT vault
3. **MarginGuard's margin efficiency math** — collateral optimization can be a feature in SENTRY risk shield
4. **TradeGuard's prevention logic** — "pre-trade risk check" can be a feature in NEXUS or SENTRY
