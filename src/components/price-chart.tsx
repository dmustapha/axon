'use client';

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { usePrices } from '@/hooks/use-prices';
import { useCandles as useWSCandles } from '@/hooks/use-candles';
import type { ChartTimeframe } from '@/types';

interface PriceChartProps {
  symbol: string | null;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const TIMEFRAMES: { label: ChartTimeframe; seconds: number; count: number }[] = [
  { label: '1m', seconds: 60, count: 120 },
  { label: '5m', seconds: 300, count: 120 },
  { label: '15m', seconds: 900, count: 96 },
  { label: '1H', seconds: 3600, count: 48 },
  { label: '4H', seconds: 14400, count: 48 },
  { label: '1D', seconds: 86400, count: 60 },
];

type ChartType = 'candles' | 'line';

// Seeded PRNG for deterministic candle generation per symbol
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashSymbol(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash + symbol.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateCandles(symbol: string, mark: number, yesterdayPrice: number, tf: typeof TIMEFRAMES[number]): Candle[] {
  const rand = seededRandom(hashSymbol(symbol) + tf.seconds);
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const currentSlot = now - (now % tf.seconds);
  const totalChange = mark - yesterdayPrice;
  const baseVol = mark * 10;

  for (let i = tf.count; i >= 0; i--) {
    const time = currentSlot - i * tf.seconds;
    const progress = (tf.count - i) / tf.count;

    const trend = yesterdayPrice + totalChange * progress;
    const volatility = Math.abs(totalChange) * 0.15 * Math.sqrt(tf.seconds / 3600);
    const noise = () => (rand() - 0.5) * 2 * volatility;

    const open = trend + noise();
    const close = i === 0 ? mark : trend + noise();
    const high = Math.max(open, close) + Math.abs(noise()) * 0.5;
    const low = Math.min(open, close) - Math.abs(noise()) * 0.5;
    const volume = baseVol * (0.3 + rand() * 1.4);

    candles.push({ time, open, high, low, close, volume });
  }

  return candles;
}

export function PriceChart({ symbol }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainSeriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<any>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const liveCandle = useRef<{ open: number; high: number; low: number; close: number } | null>(null);
  const [chartReady, setChartReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lcModuleRef = useRef<any>(null);
  const { prices } = usePrices();

  const [timeframe, setTimeframe] = useState<ChartTimeframe>('1H');
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [crosshairData, setCrosshairData] = useState<{ o: number; h: number; l: number; c: number; v: number; time: number } | null>(null);

  const currentPrice = symbol ? prices.get(symbol) : null;
  const tfConfig = TIMEFRAMES.find((t) => t.label === timeframe)!;

  // Try real WS candles first
  const { candles: wsCandles, hasRealData } = useWSCandles(symbol);

  // Snapshot initial prices per symbol to avoid regenerating candles on every tick (C6: moved to useEffect)
  const snapshotRef = useRef<{ symbol: string; mark: number; yesterday: number } | null>(null);
  useEffect(() => {
    if (currentPrice && symbol) {
      const mark = parseFloat(currentPrice.mark);
      const yesterday = parseFloat(currentPrice.yesterday_price);
      if (!snapshotRef.current || snapshotRef.current.symbol !== symbol) {
        snapshotRef.current = { symbol, mark, yesterday };
      }
    }
  }, [currentPrice, symbol]);

  const syntheticCandles = useMemo(() => {
    if (!snapshotRef.current) return null;
    const { symbol: sym, mark, yesterday } = snapshotRef.current;
    if (!mark || !yesterday) return null;
    return generateCandles(sym, mark, yesterday, tfConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, tfConfig]);

  // Use real candles if available, else synthetic
  const candles = hasRealData && wsCandles ? wsCandles : syntheticCandles;

  // Initialize chart (once)
  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    import('lightweight-charts').then((lc) => {
      if (disposed || !containerRef.current) return;
      lcModuleRef.current = lc;

      const chart = lc.createChart(containerRef.current, {
        layout: {
          background: { color: 'transparent' },
          textColor: 'hsl(25, 4%, 42%)',
          fontFamily: 'Menlo, Monaco, Courier New, monospace',
          fontSize: 10,
        },
        grid: {
          vertLines: { color: 'hsla(25, 6%, 15%, 0.5)' },
          horzLines: { color: 'hsla(25, 6%, 15%, 0.5)' },
        },
        crosshair: {
          vertLine: { color: 'hsla(35, 90%, 55%, 0.3)', labelBackgroundColor: 'hsl(25, 12%, 7%)' },
          horzLine: { color: 'hsla(35, 90%, 55%, 0.3)', labelBackgroundColor: 'hsl(25, 12%, 7%)' },
        },
        rightPriceScale: {
          borderColor: 'hsl(25, 6%, 15%)',
          scaleMargins: { top: 0.08, bottom: 0.2 },
        },
        timeScale: {
          borderColor: 'hsl(25, 6%, 15%)',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScale: { axisPressedMouseMove: true },
        handleScroll: { vertTouchDrag: false },
      });

      chartRef.current = chart;

      // Subscribe to crosshair move for OHLC display
      chart.subscribeCrosshairMove((param: { time?: unknown; seriesData?: Map<unknown, unknown> }) => {
        if (!param.time || !param.seriesData) {
          setCrosshairData(null);
          return;
        }
        // Read candlestick/line data from main series, volume from volume series
        let o = 0, h = 0, l = 0, c = 0, v = 0;
        let found = false;
        for (const [series, val] of param.seriesData) {
          const d = val as Record<string, number>;
          if (!d) continue;
          if (series === mainSeriesRef.current) {
            if ('open' in d) {
              o = d.open; h = d.high; l = d.low; c = d.close;
            } else if ('value' in d) {
              // Line series
              o = d.value; h = d.value; l = d.value; c = d.value;
            }
            found = true;
          } else if (series === volumeSeriesRef.current && 'value' in d) {
            v = d.value;
          }
        }
        if (found) {
          setCrosshairData({ o, h, l, c, v, time: param.time as number });
        }
      });

      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          chart.applyOptions({ width, height });
        }
      });
      ro.observe(containerRef.current!);
      roRef.current = ro;

      setChartReady(true);
    });

    return () => {
      disposed = true;
      roRef.current?.disconnect();
      roRef.current = null;
      chartRef.current?.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      lcModuleRef.current = null;
      setChartReady(false);
    };
  }, []);

  // Rebuild series when chart type changes
  const rebuildSeries = useCallback(() => {
    if (!chartRef.current || !lcModuleRef.current || !chartReady) return;
    const lc = lcModuleRef.current;
    const chart = chartRef.current;

    // Remove old series
    if (mainSeriesRef.current) {
      try { chart.removeSeries(mainSeriesRef.current); } catch { /* ok */ }
      mainSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      try { chart.removeSeries(volumeSeriesRef.current); } catch { /* ok */ }
      volumeSeriesRef.current = null;
    }

    // Add volume series first (behind price)
    const volSeries = chart.addSeries(lc.HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeriesRef.current = volSeries;

    // Add price series
    if (chartType === 'candles') {
      const series = chart.addSeries(lc.CandlestickSeries, {
        upColor: 'hsl(145, 65%, 48%)',
        downColor: 'hsl(355, 70%, 55%)',
        borderUpColor: 'hsl(145, 65%, 48%)',
        borderDownColor: 'hsl(355, 70%, 55%)',
        wickUpColor: 'hsl(145, 65%, 42%)',
        wickDownColor: 'hsl(355, 70%, 48%)',
      });
      mainSeriesRef.current = series;
    } else {
      const series = chart.addSeries(lc.LineSeries, {
        color: 'hsl(35, 90%, 55%)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: 'hsl(35, 90%, 55%)',
      });
      mainSeriesRef.current = series;
    }
  }, [chartType, chartReady]);

  // Rebuild on chart type change
  useEffect(() => {
    rebuildSeries();
  }, [rebuildSeries]);

  // Load candle data when ready or timeframe/type changes
  useEffect(() => {
    if (!mainSeriesRef.current || !volumeSeriesRef.current || !candles || !chartReady) return;
    liveCandle.current = null;

    if (chartType === 'candles') {
      mainSeriesRef.current.setData(candles.map((c) => ({
        time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
      })));
    } else {
      mainSeriesRef.current.setData(candles.map((c) => ({
        time: c.time, value: c.close,
      })));
    }

    // Volume bars
    volumeSeriesRef.current.setData(candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'hsla(145, 65%, 48%, 0.3)' : 'hsla(355, 70%, 55%, 0.3)',
    })));

    chartRef.current?.timeScale().fitContent();
  }, [candles, chartReady, chartType]);

  // Real-time price update
  useEffect(() => {
    if (!mainSeriesRef.current || !currentPrice || !chartReady) return;
    const mark = parseFloat(currentPrice.mark);
    if (!mark) return;

    const now = Math.floor(Date.now() / 1000);
    const slotTime = now - (now % tfConfig.seconds);

    if (chartType === 'candles') {
      if (!liveCandle.current) {
        liveCandle.current = { open: mark, high: mark, low: mark, close: mark };
      } else {
        liveCandle.current.high = Math.max(liveCandle.current.high, mark);
        liveCandle.current.low = Math.min(liveCandle.current.low, mark);
        liveCandle.current.close = mark;
      }
      mainSeriesRef.current.update({ time: slotTime, ...liveCandle.current });
    } else {
      mainSeriesRef.current.update({ time: slotTime, value: mark });
    }
  }, [currentPrice?.mark, chartReady, tfConfig.seconds, chartType]);

  if (!symbol) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ax-text-muted)', fontSize: 12 }}>
        Select a market to view chart
      </div>
    );
  }

  const markPrice = currentPrice ? parseFloat(currentPrice.mark) : 0;
  const yesterdayNum = currentPrice ? parseFloat(currentPrice.yesterday_price) : 0;
  const change24h = currentPrice && yesterdayNum
    ? ((parseFloat(currentPrice.mark) - yesterdayNum) / yesterdayNum * 100)
    : 0;
  const displayData = crosshairData || (candles?.length ? { o: candles[candles.length - 1].open, h: candles[candles.length - 1].high, l: candles[candles.length - 1].low, c: candles[candles.length - 1].close, v: candles[candles.length - 1].volume, time: 0 } : null);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chart toolbar */}
      <div className="ax-section-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 10px',
        flexShrink: 0,
        gap: 8,
      }}>
        {/* Left: symbol + timeframes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text)' }}>{symbol}-PERP</span>
          <span className={`ax-mono ${change24h >= 0 ? 'ax-glow-green' : 'ax-glow-red'}`} style={{ fontSize: 12, fontWeight: 700 }}>
            ${markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                onClick={() => setTimeframe(tf.label)}
                style={{
                  padding: '2px 6px',
                  fontSize: 10,
                  fontWeight: timeframe === tf.label ? 700 : 500,
                  borderRadius: 3,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: timeframe === tf.label ? 'var(--ax-accent-dim)' : 'transparent',
                  color: timeframe === tf.label ? 'var(--ax-accent)' : 'var(--ax-text-muted)',
                  transition: 'color 150ms, background 150ms',
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: chart type + tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setChartType('candles')}
            title="Candlestick"
            style={{
              padding: '2px 6px', fontSize: 10, borderRadius: 3, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: chartType === 'candles' ? 'var(--ax-accent-dim)' : 'transparent',
              color: chartType === 'candles' ? 'var(--ax-accent)' : 'var(--ax-text-muted)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="2" height="12" rx="0.5"/><rect x="7" y="5" width="2" height="8" rx="0.5"/><rect x="11" y="1" width="2" height="10" rx="0.5"/></svg>
          </button>
          <button
            onClick={() => setChartType('line')}
            title="Line"
            style={{
              padding: '2px 6px', fontSize: 10, borderRadius: 3, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: chartType === 'line' ? 'var(--ax-accent-dim)' : 'transparent',
              color: chartType === 'line' ? 'var(--ax-accent)' : 'var(--ax-text-muted)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12L5 6L9 9L15 2"/></svg>
          </button>
          <div style={{ width: 1, height: 14, background: 'var(--ax-border)', margin: '0 2px' }} />
          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            title="Fit to view"
            style={{
              padding: '2px 6px', fontSize: 10, borderRadius: 3, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'transparent', color: 'var(--ax-text-muted)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"/></svg>
          </button>
        </div>
      </div>

      {/* OHLCV bar */}
      {displayData && (
        <div style={{
          display: 'flex', gap: 12, padding: '2px 10px', fontSize: 10, flexShrink: 0,
          background: 'hsla(25, 10%, 6%, 0.5)',
        }}>
          <span style={{ color: 'var(--ax-text-muted)' }}>O <span className="ax-mono" style={{ color: 'var(--ax-text-sec)' }}>{displayData.o.toFixed(2)}</span></span>
          <span style={{ color: 'var(--ax-text-muted)' }}>H <span className="ax-mono" style={{ color: 'var(--ax-green-bright)' }}>{displayData.h.toFixed(2)}</span></span>
          <span style={{ color: 'var(--ax-text-muted)' }}>L <span className="ax-mono" style={{ color: 'var(--ax-red-bright)' }}>{displayData.l.toFixed(2)}</span></span>
          <span style={{ color: 'var(--ax-text-muted)' }}>C <span className="ax-mono" style={{ color: displayData.c >= displayData.o ? 'var(--ax-green-bright)' : 'var(--ax-red-bright)' }}>{displayData.c.toFixed(2)}</span></span>
          <span style={{ color: 'var(--ax-text-muted)' }}>Vol <span className="ax-mono" style={{ color: 'var(--ax-text-sec)' }}>{formatVol(displayData.v)}</span></span>
        </div>
      )}

      {/* Simulated data indicator */}
      {!hasRealData && candles && (
        <div style={{
          padding: '2px 10px', fontSize: 9, color: 'var(--ax-text-muted)',
          background: 'hsla(35, 90%, 55%, 0.05)', flexShrink: 0,
        }}>
          Estimated chart — live candle data pending
        </div>
      )}

      {/* Chart container */}
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}

function formatVol(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}
