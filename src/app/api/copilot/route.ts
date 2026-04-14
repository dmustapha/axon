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
