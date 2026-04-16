'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { PACIFICA_WS_URL, WS_PING_INTERVAL, WS_MAX_BACKOFF } from '@/lib/constants';
import type { WsMessage } from '@/types';

type WSStatus = 'connecting' | 'connected' | 'disconnected';
type WSListener = (msg: WsMessage) => void;

interface WSContextValue {
  status: WSStatus;
  subscribe: (source: string) => void;
  unsubscribe: (source: string) => void;
  addListener: (fn: WSListener) => () => void;
}

const WSContext = createContext<WSContextValue | null>(null);

export function WSProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<WSListener>>(new Set());
  const sourcesRef = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const backoffRef = useRef(1000);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let closed = false;

    function connect() {
      if (closed) return;
      setStatus('connecting');
      const ws = new WebSocket(PACIFICA_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        backoffRef.current = 1000;

        // Re-subscribe to all sources on reconnect
        for (const source of sourcesRef.current) {
          ws.send(JSON.stringify({ method: 'subscribe', params: { source } }));
        }

        // Ping every 30s to prevent 60s idle timeout
        if (pingRef.current) clearInterval(pingRef.current);
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ method: 'ping' }));
          }
        }, WS_PING_INTERVAL);
      };

      ws.onmessage = (ev) => {
        try {
          const raw = JSON.parse(ev.data);
          // Ignore pong responses
          if (raw.channel === 'pong') return;
          if (typeof raw !== 'object' || raw === null) return;
          const msg: WsMessage = { channel: raw.channel, data: raw.data };
          const snapshot = [...listenersRef.current];
          for (const fn of snapshot) fn(msg);
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        if (pingRef.current) clearInterval(pingRef.current);
        if (!closed) {
          setStatus('disconnected');
          const delay = Math.min(backoffRef.current, WS_MAX_BACKOFF);
          backoffRef.current = Math.min(delay * 2, WS_MAX_BACKOFF);
          setTimeout(connect, delay);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      closed = true;
      if (pingRef.current) clearInterval(pingRef.current);
      wsRef.current?.close();
    };
  }, []);

  const subscribe = useCallback((source: string) => {
    sourcesRef.current.add(source);
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ method: 'subscribe', params: { source } }));
    }
  }, []);

  const unsubscribe = useCallback((source: string) => {
    sourcesRef.current.delete(source);
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ method: 'unsubscribe', params: { source } }));
    }
  }, []);

  const addListener = useCallback((fn: WSListener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  return (
    <WSContext.Provider value={{ status, subscribe, unsubscribe, addListener }}>
      {children}
    </WSContext.Provider>
  );
}

export function useWS() {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error('useWS must be inside WSProvider');
  return ctx;
}
