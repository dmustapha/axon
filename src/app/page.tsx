'use client';

import { useState, useCallback } from 'react';
import { useWS } from '@/providers/ws-provider';
import { PriceGrid } from '@/components/price-grid';
import { MarketSelector } from '@/components/market-selector';
import { OrderPanel } from '@/components/order-panel';
import { PositionDisplay } from '@/components/position-display';
import { ChatPanel } from '@/components/chat-panel';
import { CourtroomTab } from '@/components/courtroom-tab';
import type { MarketCategory, Position, TradeSuggestion, RightPanel } from '@/types';

export default function Home() {
  const { status } = useWS();
  const [selectedMarket, setSelectedMarket] = useState<string | null>('BTC');
  const [category, setCategory] = useState<MarketCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [rightPanel, setRightPanel] = useState<RightPanel>('copilot');
  const [courtroomPosition, setCourtroomPosition] = useState<Position | null>(null);

  const handleAnalyze = useCallback((position: Position) => {
    setCourtroomPosition(position);
    setRightPanel('courtroom');
  }, []);

  const handleExecuteTrade = useCallback((suggestion: TradeSuggestion) => {
    setSelectedMarket(suggestion.symbol);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ax-bg)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: 48,
          borderBottom: '1px solid var(--ax-border)',
          background: 'var(--ax-bg-elev)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '0.08em' }}>
            <span style={{ color: 'var(--ax-green-bright)' }}>AX</span>
            <span style={{ color: 'var(--ax-text)' }}>ON</span>
          </h1>
          <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
            AI Trading Terminal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className={status === 'connected' ? 'ax-dot-pulse' : ''}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background:
                status === 'connected' ? 'var(--ax-green)' :
                status === 'connecting' ? 'var(--ax-gold)' : 'var(--ax-red)',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
            {status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Main Content — 3 columns */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px 380px', overflow: 'hidden' }}>
        {/* Column 1: Markets */}
        <div style={{ borderRight: '1px solid var(--ax-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <MarketSelector
            category={category}
            onCategoryChange={setCategory}
            search={search}
            onSearchChange={setSearch}
          />
          <PriceGrid
            category={category}
            search={search}
            onSelectMarket={setSelectedMarket}
            selectedMarket={selectedMarket}
          />
        </div>

        {/* Column 2: Trading */}
        <div style={{ borderRight: '1px solid var(--ax-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid var(--ax-border)', flex: '0 0 auto' }}>
            <OrderPanel selectedMarket={selectedMarket} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ax-border)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>
                Positions
              </h3>
            </div>
            <PositionDisplay onAnalyze={handleAnalyze} />
          </div>
        </div>

        {/* Column 3: Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--ax-border)', flexShrink: 0 }}>
            {([
              { key: 'copilot' as const, label: 'AI Copilot' },
              { key: 'courtroom' as const, label: 'Courtroom' },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRightPanel(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: rightPanel === tab.key ? 'var(--ax-panel)' : 'transparent',
                  color: rightPanel === tab.key
                    ? (tab.key === 'courtroom' ? 'var(--ax-gold)' : 'var(--ax-blue)')
                    : 'var(--ax-text-muted)',
                  borderBottom: rightPanel === tab.key
                    ? `2px solid ${tab.key === 'courtroom' ? 'var(--ax-gold)' : 'var(--ax-blue)'}`
                    : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {rightPanel === 'copilot' ? (
              <ChatPanel onExecuteTrade={handleExecuteTrade} />
            ) : (
              <CourtroomTab externalPosition={courtroomPosition} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
