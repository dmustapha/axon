'use client';

import { useState, useRef, useEffect } from 'react';
import { useCopilot } from '@/hooks/use-copilot';
import { TradeSuggestionCard } from './trade-suggestion';
import type { TradeSuggestion } from '@/types';

interface ChatPanelProps {
  onExecuteTrade: (suggestion: TradeSuggestion) => void;
}

export function ChatPanel({ onExecuteTrade }: ChatPanelProps) {
  const { messages, sendMessage, isLoading } = useCopilot();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 13 }}>
            Ask me about market sentiment, trending tokens, or trade setups.
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              padding: 10,
              borderRadius: 8,
              maxWidth: '85%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--ax-blue-dim)' : 'var(--ax-surface)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'var(--ax-border)'}`,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ax-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </p>
            {msg.tradeSuggestion && (
              <TradeSuggestionCard suggestion={msg.tradeSuggestion} onExecute={onExecuteTrade} />
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ padding: 10, fontSize: 13, color: 'var(--ax-text-muted)', fontStyle: 'italic' }}>
            Analyzing...
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          borderTop: '1px solid var(--ax-border)',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about sentiment, trends, trades..."
          style={{
            flex: 1,
            height: 36,
            padding: '0 12px',
            borderRadius: 8,
            background: 'var(--ax-surface)',
            border: '1px solid var(--ax-border)',
            color: 'var(--ax-text)',
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          style={{
            padding: '0 16px',
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'var(--ax-blue)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            opacity: !input.trim() || isLoading ? 0.4 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
