import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { EvidenceBundle, CourtroomResult } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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

    // Call Claude AI Judge
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: JUDGE_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: JSON.stringify(evidence) },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
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
