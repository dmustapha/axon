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
