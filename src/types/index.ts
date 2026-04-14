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
