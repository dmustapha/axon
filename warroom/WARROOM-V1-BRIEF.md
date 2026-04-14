# WAR ROOM V1 — PACIFICA HACKATHON 2026 DELIBERATION BRIEF
**Date:** 2026-04-14
**Objective:** Pick THE ONE idea that is BOTH the most winnable AND solves a significant real problem. Target maximum prize stacking.

---

## NON-NEGOTIABLE RULES (from the builder)

### CRITICAL CONCERNS (Must satisfy — idea eliminated if violated)
1. [C] Time NOT a constraint. Claude Code = 10x dev speed. Do NOT penalize ideas for complexity.
2. [C] Uniqueness is non-negotiable. Zero competitors in the target space strongly preferred.
3. [C] "Does this help real humans?" test. Must point to real people whose lives improve.
4. [C] Cumulative corrections — nothing dropped between versions.
5. [C] Must solve a SIGNIFICANT, real problem. "Would I still build this if there were no prize?"
6. [C] Must serve actual target users who exist TODAY.

### IMPORTANT CONCERNS (Should satisfy — score penalty if violated)
7. [I] Everything is devnet/testnet. Mocks are fine for demos.
8. [I] Read ALL research data — use EVERYTHING.
9. [I] Take your time, be extensive. 200-400 words per proposal.
10. [I] Focused product, BROAD problem. Niche scope OK, niche audience NOT.
11. [I] Winning AND real impact are not mutually exclusive.
12. [I] Demo must feel like the real product.
13. [I] AI/Agents should be considered (Elfa AI sponsor exists with 20K free credits).
14. [I] Sponsor bounty stacking strategy (4 sponsors: Elfa AI, Privy, Fuul, Rhinofi).

### ADVISORY CONCERNS
15. [A] Fresh ideas allowed — not limited to predefined lists.
16. [A] Reframing is on the table.

### PER-HACKATHON CONCERNS
17. [C] Must DEEPLY use Pacifica API — not surface-level. Judges explicitly grade on API integration depth. Use multiple endpoint categories (markets, orders, account, subaccounts, WebSocket).
18. [C] Target maximum prize stacking — Grand Prize ($5K) + Track Winner ($2K) + Most Innovative ($1K) + Best UX ($1K) = $9K potential.

---

## HACKATHON FACTS
- Hackathon: Pacifica Hackathon 2026
- Deadline: April 16, 2026 (2 days remaining)
- Prize: $15,000 + 100,000 points total
  - Grand Prize: $5,000 + 30,000 pts (also gets track prize = $7K + 44K pts total)
  - Track Winner (×4): $2,000 + 14,000 pts
  - Most Innovative Use of Pacifica: $1,000 + 7,000 pts
  - Best User Experience: $1,000 + 7,000 pts
- Tracks: Trading Applications & Bots | Analytics & Data | Social & Gamification | DeFi Composability
- Platform: Pacifica — perpetuals trading infrastructure on Solana
- Deployment NOT mandatory — testnet, mainnet, or local all accepted
- Demo video: 10 min max, voice narration REQUIRED, live product walkthrough is THE MOST IMPORTANT section
- Can submit incomplete features if core concept is demonstrable

## JUDGING CRITERIA (Equal weight — 20% each)
1. Innovation (20%): Novelty and creative use of Pacifica's infrastructure
2. Technical Execution (20%): Code quality, API integration depth, development rigor
3. User Experience (20%): Polish, usability, intuitive design
4. Potential Impact (20%): Would traders/users actually adopt this?
5. Presentation (20%): Clarity and effectiveness of the demo video

## THE BUILDER
- Skills: TypeScript, Next.js, React, Solidity, Python, Solana, ZK proofs, AI agents
- Speed: 10x with Claude Code + MCP servers + subagents + skills + hooks
- Past wins: Chainlink Convergence (Ghostfund — deep CRE integration), Solana Seeker (TrustTap — trust scoring)
- Key strength: Deep integration wins. Builder won Chainlink via deep CRE integration. Always prioritize deep native integration.
- Reusable code:
  - WhaleVault: ZK privacy for Solana (Merkle trees, nullifiers)
  - Ghostfund: Automated monitoring + policy enforcement + human-in-the-loop approval
  - TrustTap: 8-dimension wallet trust scoring on Solana + Ed25519 signatures
  - PRISM: Multi-protocol DeFi aggregator UI (Next.js 15, shadcn, wagmi)
  - Somnia DataStream: Real-time data streaming architecture
  - Verdikt: Escrow + quality gates + trust accumulation + WebSocket courtroom UI
  - AgentAuditor: 9-dimension behavioral profiling with LLM analysis

---

## PACIFICA CAPABILITIES

### REST API (test-api.pacifica.fi/api/v1)
- Markets (7 endpoints): exchange info, prices, candles, mark price candles, orderbook, recent trades, historical funding
- Orders (12 endpoints): market, limit, stop, TWAP, TP/SL, cancel, cancel all, edit, batch
- Account (10 endpoints): info, settings, positions, trade history, funding history, equity/balance history, leverage, margin mode, withdrawal
- Subaccounts (3 endpoints): create (both main+sub sign), list, fund transfer

### WebSocket (test-ws.pacifica.fi/ws)
- Market channels (6): Prices, Orderbook, BBO, Trades, Candle, Mark Price Candle
- Account channels (6): Margin, Leverage, Info, Positions, Order Updates, Trades
- Heartbeat: ping/pong, 60s idle timeout, 24h max connection

### Authentication: Solana ed25519 signing for POST requests. GET and WS subscriptions do NOT require signing.

### Rate Limits: 125 credits/60s (no key) → 300 (with key). WS: 300 connections/IP, 20 subs/channel.

### Python SDK: `solders`, `requests`, `websockets`, `base58`. 24 REST examples + 7 WS examples.

---

## SPONSOR TOOLS

### Elfa AI (20,000 FREE credits)
- Social data: top-mentions, keyword-mentions, token-news
- Trend aggregations: trending-tokens, trending-narratives, trending-cas (Twitter + Telegram)
- Account intelligence: smart-stats (follower quality scoring)
- AI Chat (6 modes): chat, macro, summary, tokenIntro, tokenAnalysis, accountAnalysis
- Integration depth opportunity: Use ALL endpoints for deepest sponsor integration

### Privy — Embedded wallets, wallet auth, instant onboarding (no extension needed)
### Fuul — Referral attribution and conversion tracking
### Rhinofi — Cross-chain bridge infrastructure

---

## BUILDER'S REUSABLE CODE ADVANTAGE

| Project | What's Reusable | Hours Saved |
|---------|----------------|:-----------:|
| PRISM | Multi-protocol UI, dashboard layouts, protocol adapters | 35-50h |
| Ghostfund | CRE monitoring → adaptable to position monitoring, policy engine | 30-50h |
| TrustTap | 8D scoring algorithm, Ed25519 signing (SAME as Pacifica!), Solana integration | 50-80h |
| Somnia DataStream | Real-time streaming architecture, auto-refresh, server-side ops | 25-40h |
| AgentAuditor | LLM analysis patterns, behavioral profiling, Telegram alerts | 25-40h |
| Verdikt | Escrow patterns, quality gates, WebSocket live UI, trust accumulation | 40-60h |
| WhaleVault | ZK proofs, Merkle trees, Solana privacy patterns | 40-60h |

**Critical reuse:** TrustTap already implements Ed25519 signing on Solana — the SAME signing scheme Pacifica uses. This eliminates the hardest integration challenge.

---

## YOUR TASK

You are 4 expert agents debating which idea to build for Pacifica Hackathon 2026. Deliberate across 6 rounds. Use EVIDENCE from the research above.

## IDEAS TO EVALUATE

1. **NEXUS** — AI Social Trading Terminal (23/25)
2. **SENTRY** — Intelligent Risk Shield (21/25)
3. **ARENA** — Social Trading Competition Platform (21/25)
4. **ORACLE** — Predictive Analytics & Liquidation Radar (20/25)
5. **AUTOPILOT** — Autonomous Strategy Vault (19/25)
6. **PULSE** — Social Sentiment Trading Signals (19/25)
7. **FORGE** — Prediction Market on Perp Outcomes (20/25)
8. **MINOTAUR** — Cross-Exchange Funding Rate Arbitrage (19/25)

Agents can and should propose completely new ideas beyond this list.
