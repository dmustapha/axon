# WINNER-BRIEF — PACIFICA HACKATHON 2026
**Idea:** NEXUS — AI Social Trading Terminal with Liquidation Courtroom
**Track:** Trading Applications & Bots (primary)
**Warroom Version:** V1
**Date:** 2026-04-14

---

## Chosen Idea
A full-featured perpetuals trading terminal for Pacifica with three layers: (1) real-time market data terminal with live orderbook, positions, and P&L via WebSocket, (2) AI copilot powered by Elfa AI social intelligence that analyzes sentiment, surfaces trade setups, and executes orders through conversational interface, (3) Liquidation Courtroom module where AI agents analyze whether liquidation events are market-driven or manipulation-driven, presenting evidence in a real-time WebSocket courtroom UI.

## Problem Statement
Perpetual futures traders lose **$2B+ annually** to preventable liquidations. They currently juggle 3-5 fragmented tools (exchange UI, Twitter for sentiment, Discord for signals, spreadsheets for risk) with zero integration between them. No unified terminal exists for Pacifica, and no tool anywhere provides AI-powered liquidation analysis.

## Why It Won
| Criterion | Weight | Score | Rationale |
|-----------|:------:|:-----:|-----------|
| Innovation | 20% | 8/10 | Courtroom-as-liquidation-intelligence is novel within terminal archetype; AI copilot + social data + trading + dispute analysis is an unexplored combination |
| Technical Execution | 20% | 9/10 | Deepest Pacifica API integration: ALL market (7), order (12), account (10), subaccount (3) endpoints + ALL 12 WebSocket channels + ed25519 signing + Elfa AI full suite |
| User Experience | 20% | 8/10 | Multi-panel terminal with conversational AI, one-click trading, live data streaming; PRISM + deltaagent dashboard patterns proven |
| Potential Impact | 20% | 7/10 | First terminal for Pacifica; consolidates fragmented workflows; generalizable architecture |
| Presentation | 20% | 8/10 | Demo arc: live data → AI analysis → trade execution → courtroom spectacle as finale |
| **FINAL** | | **9.97** | Unanimous 12/12 vote, highest normalized score |

## Key Deliberation Arguments (Why This Won)
1. FLOW Round 1: "Presentation is 20% of the score. UX is 20%. That's 40% of judging where NEXUS dominates every other idea. The builder's PRISM dashboard, Somnia streaming, and AgentAuditor LLM patterns provide a 200+ hour head start on polish."
2. WILD Round 3 Hybrid: "Take NEXUS's deep Pacifica integration (ALL endpoints) and add VERDIKT MARKETS' most memorable feature — the AI courtroom — as a MODULE. Deep API usage + memorable demo moment + practical utility + spectacle."
3. REAL Round 1: "Today, Pacifica traders must use 4-5 separate tools. NEXUS consolidates everything into one interface. That's a real workflow problem affecting every trader on the platform."

## Top Risks + Mitigations
| # | Risk | Severity | Mitigation |
|---|------|:--------:|------------|
| 1 | Scope overload — terminal + AI + courtroom too ambitious | CRITICAL | Courtroom is ONE lightweight tab, built LAST. Terminal is 90% of effort. If courtroom doesn't ship, pure NEXUS (7.11 score) is still strongest entry. |
| 2 | Category crowding — judges see multiple "AI terminal" submissions | CRITICAL | Courtroom module is the differentiator no other terminal has. Script demo around ONE story arc, not feature tour. |
| 3 | Demo overwhelm — too many features confuse judges | HIGH | Max 3 features showcased in demo: (1) AI sentiment analysis, (2) one-click trade execution, (3) courtroom liquidation analysis. Everything else is background. |
| 4 | WebSocket instability during demo | HIGH | Pre-record fallback demo. Test WS connection stability on testnet before recording. |
| 5 | Elfa AI rate limits or downtime | HIGH | Cache Elfa responses for demo. Have pre-seeded data as fallback. |

## Non-Negotiables (Must Be In Build)
- Real-time orderbook + positions via Pacifica WebSocket (ALL market + account channels)
- AI copilot with Elfa AI integration (minimum: trending-tokens, keyword-mentions, AI Chat tokenAnalysis mode)
- Full order management (market, limit, stop, TP/SL) via REST with ed25519 signing
- Live P&L tracking and position panel
- Courtroom module: at minimum, a visual AI analysis of liquidation risk using Pacifica position data + Elfa sentiment

## Explicit Out-of-Scope
- TWAP orders and batch orders (nice-to-have, not core demo)
- Subaccount management UI (use single account for demo simplicity)
- Cross-exchange data (Pacifica only — no Binance/Bybit integration)
- Mobile responsive design (desktop terminal only)
- Real money / mainnet trading (testnet throughout)

## Minority Dissent (Unresolved Concerns)
WILD maintains that if the courtroom module gets cut for time, we're left with vanilla NEXUS — "a polished but forgettable terminal." The courtroom MUST ship for the innovation score to hold. If it can't ship, the Innovation score drops from 8 to 5, and the FINAL score drops significantly. Mitigation: courtroom is built on Verdikt's existing WebSocket UI code — the reuse advantage makes it achievable.

## Reusable Code Map
| Source Project | What We Reuse | For Which Feature |
|---------------|--------------|-------------------|
| deltaagent | Autonomous AI + leveraged position management + real-time dashboard | Core terminal architecture |
| TrustTap | Ed25519 signing on Solana (SAME scheme as Pacifica) | API authentication |
| PRISM | Multi-panel dashboard UI, protocol adapters, TanStack Query patterns | Terminal layout + data fetching |
| Verdikt | WebSocket courtroom UI, escrow patterns, trust accumulation | Courtroom module |
| AgentAuditor | LLM analysis patterns, behavioral profiling | AI copilot intelligence |
| Somnia DataStream | Real-time streaming architecture, auto-refresh patterns | WebSocket data handling |

## Prize Stacking Strategy
- **Trading Applications & Bots** ($2K + 14K pts) — primary track, deepest API integration
- **Grand Prize** ($5K + 30K pts) — highest overall score across all criteria
- **Most Innovative Use of Pacifica** ($1K + 7K pts) — courtroom module is novel use of Pacifica data
- **Best User Experience** ($1K + 7K pts) — multi-panel terminal with AI chat, proven builder UX track record
- **Maximum: $9,000 + 58,000 pts**
