'use client';

import { useState, useRef, useEffect } from 'react';
import { useCopilot } from '@/hooks/use-copilot';
import { useTrending } from '@/hooks/use-trending';
import { TradeSuggestionCard } from './trade-suggestion';
import type { TradeSuggestion } from '@/types';

interface ChatPanelProps {
  onExecuteTrade: (suggestion: TradeSuggestion) => void;
  onMessagesChange?: (summary: string) => void;
}

export function ChatPanel({ onExecuteTrade, onMessagesChange }: ChatPanelProps) {
  const { messages, sendMessage, isLoading } = useCopilot();
  const { data: trending } = useTrending();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Notify parent of latest copilot context (H9: bridge to courtroom)
  useEffect(() => {
    if (!onMessagesChange || messages.length === 0) return;
    const last5 = messages.slice(-5).map(m => `${m.role}: ${m.content.slice(0, 200)}`).join('\n');
    onMessagesChange(last5);
  }, [messages, onMessagesChange]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div style={{ color: 'var(--ax-text-muted)', fontSize: 12, lineHeight: 1.6 }}>
              Ask me about market sentiment, trending tokens, or trade setups.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              {[
                'What are the top trending tokens right now?',
                'Analyze BTC for a potential long setup',
                'What does social sentiment look like for SOL?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  disabled={isLoading}
                  onClick={() => { if (!isLoading) sendMessage(prompt); }}
                  style={{
                    padding: '8px 12px', fontSize: 11, borderRadius: 6, textAlign: 'left',
                    background: 'var(--ax-surface)', border: '1px solid var(--ax-border)',
                    color: 'var(--ax-text-sec)', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 150ms, color 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ax-blue-dim)'; e.currentTarget.style.color = 'var(--ax-text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ax-surface)'; e.currentTarget.style.color = 'var(--ax-text-sec)'; }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role !== 'user' && (
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                background: 'var(--ax-blue-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--ax-blue)"><circle cx="8" cy="5" r="2.5"/><path d="M4 12c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>
              </div>
            )}
            <div style={{
              padding: '8px 12px',
              borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
              maxWidth: '85%',
              background: msg.role === 'user' ? 'var(--ax-blue-dim)' : 'var(--ax-surface)',
              border: `1px solid ${msg.role === 'user' ? 'hsla(210, 65%, 55%, 0.2)' : 'var(--ax-border)'}`,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </p>
              {msg.tradeSuggestion && (
                <TradeSuggestionCard suggestion={msg.tradeSuggestion} onExecute={onExecuteTrade} />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: 'var(--ax-blue-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--ax-blue)"><circle cx="8" cy="5" r="2.5"/><path d="M4 12c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>
            </div>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)', fontStyle: 'italic' }}>Analyzing...</span>
          </div>
        )}
      </div>

      {/* Trending Chips */}
      {trending && trending.length > 0 && (
        <div style={{
          display: 'flex', gap: 6, padding: '6px 12px', overflowX: 'auto', flexShrink: 0,
          borderTop: '1px solid var(--ax-border)',
        }}>
          <span style={{ fontSize: 9, color: 'var(--ax-text-muted)', whiteSpace: 'nowrap', alignSelf: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Trending
          </span>
          {trending.slice(0, 6).map((t) => (
            <button
              key={t.token}
              onClick={() => { sendMessage(`What's the outlook for ${t.token}?`); }}
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap',
                background: 'var(--ax-surface)', border: '1px solid var(--ax-border)',
                color: t.change_percent > 0 ? 'var(--ax-green-bright)' : 'var(--ax-text-sec)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms',
              }}
            >
              {t.token} {t.change_percent > 0 ? '+' : ''}{t.change_percent?.toFixed(0)}%
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 12px',
          borderTop: '1px solid var(--ax-border)',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about market sentiment, trending tokens, or trade setups..."
          className="ax-input"
          style={{ flex: 1, fontSize: 12 }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="ax-btn"
          style={{
            padding: '0 16px',
            height: 34,
            fontSize: 12,
            background: 'var(--ax-blue)',
            color: '#fff',
            opacity: !input.trim() || isLoading ? 0.4 : 1,
            boxShadow: '0 2px 8px hsla(210, 65%, 55%, 0.25), 0 0 20px hsla(210, 65%, 55%, 0.1)',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
