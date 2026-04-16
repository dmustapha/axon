'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWS } from '@/providers/ws-provider';
import { PriceGrid } from '@/components/price-grid';
import { MarketSelector } from '@/components/market-selector';
import { OrderPanel } from '@/components/order-panel';
import { PositionDisplay } from '@/components/position-display';
import { ChatPanel } from '@/components/chat-panel';
import { CourtroomTab } from '@/components/courtroom-tab';
import { PriceChart } from '@/components/price-chart';
import { OrderbookDisplay } from '@/components/orderbook-display';
import { PortfolioView } from '@/components/portfolio-view';
import { AnalyticsView } from '@/components/analytics-view';
import type { MarketCategory, Position, TradeSuggestion, RightPanel, ActivePage } from '@/types';
import { useRef } from 'react';

export default function Home() {
  const { status } = useWS();
  const [selectedMarket, setSelectedMarket] = useState<string | null>('BTC');
  const [category, setCategory] = useState<MarketCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [rightPanel, setRightPanel] = useState<RightPanel>('copilot');
  const [courtroomPosition, setCourtroomPosition] = useState<Position | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>('trade');
  const { publicKey, connected } = useWallet();

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Skip if user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case '1': setActivePage('trade'); break;
        case '2': setActivePage('portfolio'); break;
        case '3': setActivePage('analytics'); break;
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleAnalyze = useCallback((position: Position) => {
    setCourtroomPosition(position);
    setRightPanel('courtroom');
  }, []);

  const [pendingSuggestion, setPendingSuggestion] = useState<TradeSuggestion | null>(null);
  const copilotContextRef = useRef<string>('');
  const handleCopilotMessages = useCallback((summary: string) => {
    copilotContextRef.current = summary;
  }, []);

  const handleExecuteTrade = useCallback((suggestion: TradeSuggestion) => {
    setSelectedMarket(suggestion.symbol);
    setPendingSuggestion(suggestion);
    setActivePage('trade');
    toast.success(`Trade setup applied — review and submit`);
  }, []);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--ax-bg)' }}>
      {/* Header */}
      <header className="ax-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 44,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
              <span style={{ color: 'var(--ax-accent)' }}>AX</span>
              <span style={{ color: 'var(--ax-text)' }}>ON</span>
            </h1>
            <span style={{ fontSize: 10, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 1 }}>
              AI Trading Terminal
            </span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {([
              { key: 'trade' as const, label: 'Trade' },
              { key: 'portfolio' as const, label: 'Portfolio' },
              { key: 'analytics' as const, label: 'Analytics' },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActivePage(tab.key)}
                style={{
                  fontSize: 12,
                  fontWeight: activePage === tab.key ? 600 : 500,
                  color: activePage === tab.key ? 'var(--ax-text)' : 'var(--ax-text-muted)',
                  background: 'none',
                  border: 'none',
                  borderBottom: activePage === tab.key ? '2px solid var(--ax-accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: '0 0 2px 0',
                  transition: 'color 150ms',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              className={status === 'connected' ? 'ax-dot-pulse' : ''}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: status === 'connected' ? 'var(--ax-green)' : status === 'connecting' ? 'var(--ax-gold)' : 'var(--ax-red)',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 500, color: status === 'connected' ? 'var(--ax-green-bright)' : 'var(--ax-text-muted)' }}>
              {status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--ax-text-sec)' }}>Pacifica Testnet</span>
          <WalletMultiButton className="ax-wallet-btn" />
        </div>
      </header>

      {/* WS Disconnect Banner */}
      {status !== 'connected' && (
        <div style={{
          background: 'hsla(355, 70%, 55%, 0.15)', border: '1px solid hsla(355, 70%, 55%, 0.3)',
          padding: '4px 12px', margin: '4px 4px 0', borderRadius: 4, fontSize: 11, color: 'var(--ax-red-bright)',
          textAlign: 'center', flexShrink: 0,
        }}>
          Market data may be stale — {status === 'connecting' ? 'connecting...' : 'reconnecting...'}
        </div>
      )}

      {/* Page Content */}
      {activePage === 'trade' ? (
        <div className="ax-trade-grid" style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '220px 1fr 240px 320px',
          gridTemplateRows: '1fr',
          gap: 4,
          padding: 4,
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Col 1: Markets */}
          <div className="ax-card ax-hover-lift" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

          {/* Col 2: Chart + Order */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', minHeight: 0 }}>
            <div className="ax-card ax-hover-lift" style={{ flex: '1 1 55%', minHeight: 200, overflow: 'hidden' }}>
              <PriceChart symbol={selectedMarket} />
            </div>
            <div className="ax-card ax-hover-lift" style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <OrderPanel selectedMarket={selectedMarket} pendingSuggestion={pendingSuggestion} onSuggestionApplied={() => setPendingSuggestion(null)} walletConnected={connected} />
            </div>
          </div>

          {/* Col 3: Orderbook + Positions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', minHeight: 0 }}>
            <div className="ax-card ax-hover-lift" style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <div className="ax-section-header" style={{ flexShrink: 0 }}>
                <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
                  Order Book
                </h3>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <OrderbookDisplay symbol={selectedMarket} />
              </div>
            </div>
            <div className="ax-card ax-hover-lift" style={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <div className="ax-section-header" style={{ flexShrink: 0 }}>
                <h3 style={{ fontSize: 10, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: 0 }}>
                  Positions
                </h3>
              </div>
              <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <PositionDisplay onAnalyze={handleAnalyze} />
              </div>
            </div>
          </div>

          {/* Col 4: Intelligence */}
          <div className="ax-card ax-hover-lift" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--ax-border)', flexShrink: 0 }}>
              {([
                { key: 'copilot' as const, label: 'AI Copilot', color: 'var(--ax-blue)' },
                { key: 'courtroom' as const, label: 'Courtroom', color: 'var(--ax-gold)' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRightPanel(tab.key)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: rightPanel === tab.key ? 600 : 500,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: 'transparent',
                    color: rightPanel === tab.key ? tab.color : 'var(--ax-text-muted)',
                    borderBottom: rightPanel === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                    transition: 'color 150ms',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              {rightPanel === 'copilot' ? (
                <ChatPanel onExecuteTrade={handleExecuteTrade} onMessagesChange={handleCopilotMessages} />
              ) : (
                <CourtroomTab externalPosition={courtroomPosition} copilotContext={copilotContextRef.current} />
              )}
            </div>
          </div>
        </div>
      ) : activePage === 'portfolio' ? (
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <PortfolioView />
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <AnalyticsView />
        </div>
      )}
    </div>
  );
}
