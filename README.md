# AXON: AI-Powered Perpetuals Trading Terminal

A professional-grade trading terminal for Pacifica perpetuals exchange with real-time market data, AI copilot, and a "Liquidation Courtroom" that analyzes position risk using adversarial AI reasoning.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Solana](https://img.shields.io/badge/Solana-Wallet_Adapter-9945FF?logo=solana)](https://solana.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![AXON Trading Terminal](docs/images/landing.png)

---

## What Is AXON?

AXON is a real-time perpetuals trading terminal built on top of Pacifica's infrastructure. It connects to Pacifica's REST and WebSocket APIs to provide live market data across 75 markets (crypto, stocks, forex, commodities, spot), AI-powered trade analysis, and a unique "Liquidation Courtroom" feature that evaluates position risk through adversarial AI deliberation.

---

## Screenshots

| Portfolio View | Analytics Dashboard |
|:---:|:---:|
| ![Portfolio](docs/images/portfolio.png) | ![Analytics](docs/images/analytics.png) |

---

## Features

- **75 Live Markets**: Crypto, stocks, forex, commodities, and spot pairs with real-time WebSocket price feeds
- **Full Order Management**: Market, limit, and stop orders with configurable leverage (1-200x), TP/SL, and TIF options
- **AI Copilot**: Claude-powered trading assistant that analyzes market sentiment, social data (via Elfa AI), and suggests trade setups
- **Liquidation Courtroom**: Adversarial AI analysis of open positions -- presents evidence, runs quality checks, and delivers a verdict on position health
- **Live Order Book**: Real-time bid/ask depth visualization from WebSocket feeds
- **TradingView Charts**: Professional charting with multiple timeframes (1m to 1D), candlestick and line modes
- **Solana Wallet Integration**: Phantom and Solflare wallet connection via Solana Wallet Adapter
- **Portfolio Dashboard**: Account overview with balance, margin usage, and position summary
- **Analytics View**: Performance tracking and trading metrics

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2.3, React 19.2.4, Tailwind v4 |
| Charts | TradingView Lightweight Charts |
| State | TanStack React Query, useSyncExternalStore |
| Real-time | Pacifica WebSocket (prices, orderbook, trades) |
| AI | Claude API (copilot + courtroom), Elfa AI (social intelligence) |
| Wallet | Solana Wallet Adapter (Phantom, Solflare) |
| Signing | tweetnacl Ed25519 + bs58 (server-side) |
| Build | Turbopack, pnpm |

---

## Testing the App

### Prerequisites
- A Pacifica testnet account (register via [Pacifica Telegram Bot](https://t.me/PacificaTGPortalBot))
- Pacifica testnet funds (request from the faucet in Discord)
- Phantom or Solflare wallet extension

### Walkthrough

1. Open the app and connect your Solana wallet (top-right "Select Wallet" button)
2. Browse 75 markets in the left sidebar. Filter by category (Crypto, Stocks, Forex, Commodities, Spot) or search by name
3. Select a market to load its chart and order book
4. Place a trade:
   - Choose Market/Limit/Stop order type
   - Set Long or Short direction
   - Enter amount in USD and adjust leverage (1-50x slider)
   - Optionally set Take Profit and Stop Loss prices
   - Review the order preview (entry, size, liquidation price, fees)
   - Submit the order
5. Monitor positions in the bottom panel. Click "Analyze" on any position to send it to the Liquidation Courtroom
6. Use the AI Copilot (right panel) to ask about market sentiment, trending tokens, or get trade setup suggestions
7. View portfolio summary and analytics on the Portfolio and Analytics pages

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/account` | Account balance and info |
| GET | `/api/positions` | Open positions |
| GET | `/api/orders` | Open orders |
| GET | `/api/orders?history=true` | Order history |
| GET | `/api/info` | Market specs (75 markets) |
| POST | `/api/trade` | Place market/limit/stop order |
| POST | `/api/orders/cancel` | Cancel order by ID or all |
| POST | `/api/positions/tpsl` | Set take profit / stop loss |
| POST | `/api/copilot` | AI copilot chat |
| POST | `/api/courtroom` | Liquidation courtroom analysis |
| GET | `/api/elfa` | Proxy for Elfa social intelligence |
| GET | `/api/wallet` | Connected wallet info |

---

## How It Works

```
Browser (Solana Wallet)
  |
  v
Next.js Frontend (React 19 + Tailwind v4)
  |
  +---> TradingView Charts
  |
  +---> WebSocket <---- Pacifica WS (prices, orderbook, trades)
  |
  v
Next.js API Routes (server-side signing)
  |
  +---> Pacifica REST API (orders, positions, account)
  |     [Ed25519 signed with tweetnacl]
  |
  +---> Claude API (copilot + courtroom AI)
  |
  +---> Elfa AI (social sentiment, trending tokens)
```

---

## Running Locally

```bash
# Clone
git clone https://github.com/dmustapha/axon.git
cd axon

# Install
pnpm install

# Configure environment
cp .env.example .env.local
# Fill in your keys (see .env.example for required variables)

# Run development server
pnpm dev

# Open http://localhost:3000
```

---

## Project Structure

```
src/
  app/
    page.tsx                  # Main trading terminal layout
    layout.tsx                # Root layout with providers
    providers.tsx             # React Query + WS + Wallet + Price providers
    globals.css               # Design system (dark terminal theme)
    api/
      account/route.ts        # Account balance/info
      copilot/route.ts        # AI copilot (Claude + Elfa)
      courtroom/route.ts      # Liquidation courtroom AI
      elfa/route.ts           # Elfa social intelligence proxy
      info/route.ts           # Market specifications
      orders/route.ts         # Order list/history
      orders/cancel/route.ts  # Cancel orders
      positions/route.ts      # Open positions
      positions/tpsl/route.ts # Take profit / stop loss
      trade/route.ts          # Place orders (market/limit/stop)
      wallet/route.ts         # Wallet info
  components/
    price-chart.tsx           # TradingView chart integration
    order-panel.tsx           # Order form with preview
    position-display.tsx      # Positions table with close/analyze
    orderbook-display.tsx     # Live order book visualization
    chat-panel.tsx            # AI copilot chat interface
    courtroom-tab.tsx         # Liquidation courtroom UI
    market-selector.tsx       # Market filter/search
    price-grid.tsx            # Live price table (75 markets)
    portfolio-view.tsx        # Portfolio dashboard
    analytics-view.tsx        # Analytics page
  hooks/                      # Data fetching hooks (React Query)
  lib/
    signing.ts                # Ed25519 request signing (tweetnacl + bs58)
    pacifica.ts               # Pacifica API client helpers
    constants.ts              # URLs, intervals, market categories
    pnl.ts                    # PnL calculation
    format.ts                 # Number formatting utilities
  providers/
    ws-provider.tsx           # WebSocket connection manager
    price-provider.tsx        # Price feed bridge (WS -> React)
    wallet-provider.tsx       # Solana wallet adapter setup
  stores/
    price-store.ts            # Price state (useSyncExternalStore)
  types/
    index.ts                  # TypeScript interfaces
```

---

## License

MIT
