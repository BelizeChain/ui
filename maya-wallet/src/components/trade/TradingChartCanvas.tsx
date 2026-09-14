'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Minus,
  ArrowsClockwise,
  ChartLineUp,
  CornersOut,
  CornersIn,
} from 'phosphor-react';

export interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  up: boolean;
}

interface TradingChartCanvasProps {
  pairSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  currentPrice: number;
  candles: CandleData[];
  timeframe: string;
  formatPrice: (val: number) => string;
  onSelectTimeframe?: (tf: string) => void;
  onSelectRange?: (range: string) => void;
}

export type ChartStyle = 'CANDLES' | 'AREA' | 'HOLLOW';

export function TradingChartCanvas({
  pairSymbol,
  baseAsset,
  quoteAsset,
  currentPrice,
  candles,
  timeframe,
  formatPrice,
  onSelectTimeframe,
  onSelectRange,
}: TradingChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport State: Pan & Zoom
  const [visibleCount, setVisibleCount] = useState<number>(55); // Number of candles visible
  const [scrollOffset, setScrollOffset] = useState<number>(0); // 0 = live edge, >0 = history
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [startScrollOffset, setStartScrollOffset] = useState<number>(0);

  // Crosshair / Hover State
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

  // TradingView Style & Indicator States
  const [chartStyle, setChartStyle] = useState<ChartStyle>('CANDLES');
  const [showEMA9, setShowEMA9] = useState(true);
  const [showEMA21, setShowEMA21] = useState(true);
  const [showBB, setShowBB] = useState(false); // Bollinger Bands (20, 2)
  const [showRSI, setShowRSI] = useState(true); // RSI (14)
  const [showVolume, setShowVolume] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeRange, setActiveRange] = useState<string>('1M');

  // Layout Constants
  const PRICE_AXIS_WIDTH = 68;
  const TIME_AXIS_HEIGHT = 24;
  const RSI_PANE_HEIGHT = showRSI ? 65 : 0;

  // Maximum historical scroll offset
  const maxScroll = Math.max(0, candles.length - visibleCount);

  // Slice visible candles according to scrollOffset and visibleCount
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    const endIndex = Math.max(0, candles.length - 1 - scrollOffset);
    const startIndex = Math.max(0, endIndex - visibleCount + 1);
    return candles.slice(startIndex, endIndex + 1);
  }, [candles, visibleCount, scrollOffset]);

  // Compute Technical Indicators across entire dataset
  const ema9Series = useMemo(() => {
    if (!showEMA9 || candles.length === 0) return [];
    const k = 2 / (9 + 1);
    const res: number[] = [];
    let prev = candles[0].close;
    res.push(prev);
    for (let i = 1; i < candles.length; i++) {
      prev = candles[i].close * k + prev * (1 - k);
      res.push(prev);
    }
    return res;
  }, [candles, showEMA9]);

  const ema21Series = useMemo(() => {
    if (!showEMA21 || candles.length === 0) return [];
    const k = 2 / (21 + 1);
    const res: number[] = [];
    let prev = candles[0].close;
    res.push(prev);
    for (let i = 1; i < candles.length; i++) {
      prev = candles[i].close * k + prev * (1 - k);
      res.push(prev);
    }
    return res;
  }, [candles, showEMA21]);

  // Compute Bollinger Bands (20, 2)
  const bbSeries = useMemo(() => {
    if (!showBB || candles.length < 20) return { upper: [], middle: [], lower: [] };
    const upper: number[] = [];
    const middle: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < candles.length; i++) {
      if (i < 19) {
        upper.push(candles[i].close);
        middle.push(candles[i].close);
        lower.push(candles[i].close);
        continue;
      }
      let sum = 0;
      for (let j = i - 19; j <= i; j++) {
        sum += candles[j].close;
      }
      const sma = sum / 20;
      let varSum = 0;
      for (let j = i - 19; j <= i; j++) {
        varSum += Math.pow(candles[j].close - sma, 2);
      }
      const stdDev = Math.sqrt(varSum / 20);
      middle.push(sma);
      upper.push(sma + 2 * stdDev);
      lower.push(sma - 2 * stdDev);
    }
    return { upper, middle, lower };
  }, [candles, showBB]);

  // Compute RSI (14) with Wilder's Smoothing
  const rsiSeries = useMemo(() => {
    if (!showRSI || candles.length < 15) return [];
    const rsi: number[] = new Array(candles.length).fill(50);
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 1; i <= 14; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) avgGain += change;
      else avgLoss += Math.abs(change);
    }
    avgGain /= 14;
    avgLoss /= 14;

    const rs0 = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[14] = 100 - 100 / (1 + rs0);

    for (let i = 15; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * 13 + gain) / 14;
      avgLoss = (avgLoss * 13 + loss) / 14;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
    return rsi;
  }, [candles, showRSI]);

  // Visible price bounds
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 1, maxVol: 1 };
    let min = Infinity;
    let max = -Infinity;
    let volMax = 1;

    for (const c of visibleCandles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > volMax) volMax = c.volume;
    }

    const spread = max - min || min * 0.05 || 1;
    const pad = spread * 0.06;
    return {
      minPrice: Math.max(0.000001, min - pad),
      maxPrice: max + pad,
      maxVol: volMax,
    };
  }, [visibleCandles]);

  // Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Handle Wheel Zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 5 : -5;
    setVisibleCount((prev) => Math.max(15, Math.min(180, prev + zoomDelta)));
  }, []);

  // Mouse Drag to Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setStartScrollOffset(scrollOffset);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const plotWidth = rect.width - PRICE_AXIS_WIDTH;
      const candlePx = plotWidth / Math.max(1, visibleCount);
      const candleDelta = Math.round(deltaX / candlePx);
      const newOffset = Math.max(0, Math.min(maxScroll, startScrollOffset + candleDelta));
      setScrollOffset(newOffset);
    }

    const mainPlotHeight = rect.height - TIME_AXIS_HEIGHT - RSI_PANE_HEIGHT;
    if (x >= 0 && x <= rect.width - PRICE_AXIS_WIDTH && y >= 0 && y <= rect.height - TIME_AXIS_HEIGHT) {
      setMousePos({ x, y });
      const plotWidth = rect.width - PRICE_AXIS_WIDTH;
      const stepX = plotWidth / Math.max(1, visibleCandles.length);
      const idx = Math.min(visibleCandles.length - 1, Math.max(0, Math.floor(x / stepX)));
      setHoveredCandle(visibleCandles[idx] || null);
    } else {
      setMousePos(null);
      setHoveredCandle(null);
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setMousePos(null);
    setHoveredCandle(null);
  };

  // Zoom Button Controls
  const handleZoomIn = () => setVisibleCount((prev) => Math.max(15, prev - 10));
  const handleZoomOut = () => setVisibleCount((prev) => Math.min(180, prev + 10));
  const handleReset = () => {
    setScrollOffset(0);
    setVisibleCount(55);
  };

  // Handle Bottom Range Click
  const handleRangeClick = (range: string) => {
    setActiveRange(range);
    setScrollOffset(0);
    if (onSelectRange) onSelectRange(range);

    if (range === '1D') {
      setVisibleCount(48);
      if (onSelectTimeframe) onSelectTimeframe('15m');
    } else if (range === '5D') {
      setVisibleCount(60);
      if (onSelectTimeframe) onSelectTimeframe('1H');
    } else if (range === '1M') {
      setVisibleCount(60);
      if (onSelectTimeframe) onSelectTimeframe('4H');
    } else if (range === '3M') {
      setVisibleCount(90);
      if (onSelectTimeframe) onSelectTimeframe('1D');
    } else if (range === '6M') {
      setVisibleCount(120);
      if (onSelectTimeframe) onSelectTimeframe('1D');
    } else if (range === '1Y') {
      setVisibleCount(150);
      if (onSelectTimeframe) onSelectTimeframe('1D');
    } else if (range === 'ALL') {
      setVisibleCount(104);
      if (onSelectTimeframe) onSelectTimeframe('1W');
    }
  };

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const plotWidth = width - PRICE_AXIS_WIDTH;
    const totalPlotHeight = height - TIME_AXIS_HEIGHT;
    const mainPlotHeight = totalPlotHeight - RSI_PANE_HEIGHT;
    const rsiTop = mainPlotHeight;

    const scaleY = (price: number) => {
      if (maxPrice <= minPrice) return mainPlotHeight / 2;
      return mainPlotHeight * (1 - (price - minPrice) / (maxPrice - minPrice));
    };

    const count = visibleCandles.length;
    const stepX = plotWidth / Math.max(1, count);
    const candleWidth = Math.max(1.5, stepX * 0.72);

    // 1. Draw Price Grid Lines
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';

    const priceLevels = 5;
    for (let i = 0; i < priceLevels; i++) {
      const ratio = i / (priceLevels - 1);
      const y = Math.floor(10 + ratio * (mainPlotHeight - 20)) + 0.5;
      const priceAtY = maxPrice - ((y - 10) / (mainPlotHeight - 20)) * (maxPrice - minPrice);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatPrice(priceAtY), plotWidth + 6, y);
    }

    // Vertical time grid lines
    const timeStepCount = Math.max(3, Math.floor(plotWidth / 110));
    for (let i = 0; i <= timeStepCount; i++) {
      const ratio = i / timeStepCount;
      const x = Math.floor(ratio * plotWidth) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, totalPlotHeight);
      ctx.stroke();

      const candleIdx = Math.min(count - 1, Math.floor(ratio * (count - 1)));
      const c = visibleCandles[candleIdx];
      if (c) {
        ctx.fillStyle = '#64748b';
        ctx.font = '9.5px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(c.time, x, totalPlotHeight + 6);
      }
    }
    ctx.setLineDash([]);

    // 2. Bollinger Bands (20, 2) Overlay & Translucent Ribbon
    const totalCount = candles.length;
    const startIndex = Math.max(0, totalCount - 1 - scrollOffset - visibleCount + 1);

    if (showBB && bbSeries.upper.length > 0) {
      // Shaded Volatility Ribbon between Upper & Lower Bands
      ctx.fillStyle = 'rgba(6, 182, 212, 0.07)';
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const fullIdx = startIndex + i;
        const upVal = bbSeries.upper[fullIdx];
        if (upVal === undefined) continue;
        const x = i * stepX + stepX / 2;
        const y = scaleY(upVal);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = count - 1; i >= 0; i--) {
        const fullIdx = startIndex + i;
        const lowVal = bbSeries.lower[fullIdx];
        if (lowVal === undefined) continue;
        const x = i * stepX + stepX / 2;
        const y = scaleY(lowVal);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Draw Upper Band
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const fullIdx = startIndex + i;
        const val = bbSeries.upper[fullIdx];
        if (val === undefined) continue;
        const x = i * stepX + stepX / 2;
        const y = scaleY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Lower Band
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const fullIdx = startIndex + i;
        const val = bbSeries.lower[fullIdx];
        if (val === undefined) continue;
        const x = i * stepX + stepX / 2;
        const y = scaleY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Middle SMA Band
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const fullIdx = startIndex + i;
        const val = bbSeries.middle[fullIdx];
        if (val === undefined) continue;
        const x = i * stepX + stepX / 2;
        const y = scaleY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Volume Histogram (Bottom of Main Plot)
    if (showVolume && maxVol > 0) {
      const volMaxHeight = Math.min(42, mainPlotHeight * 0.22);
      for (let i = 0; i < count; i++) {
        const c = visibleCandles[i];
        const x = i * stepX + (stepX - candleWidth) / 2;
        const barHeight = Math.max(1, (c.volume / maxVol) * volMaxHeight);
        const y = mainPlotHeight - barHeight;

        ctx.fillStyle = c.up ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.max(1, Math.floor(candleWidth)), Math.floor(barHeight));
      }
    }

    // 4. Draw Chart Body (Candles, Area/Mountain, or Hollow)
    if (chartStyle === 'AREA') {
      // Area / Mountain Chart
      const gradient = ctx.createLinearGradient(0, 0, 0, mainPlotHeight);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const c = visibleCandles[i];
        const x = i * stepX + stepX / 2;
        const y = scaleY(c.close);
        if (i === 0) ctx.moveTo(x, mainPlotHeight);
        ctx.lineTo(x, y);
      }
      ctx.lineTo((count - 1) * stepX + stepX / 2, mainPlotHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Top Curve Line
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const c = visibleCandles[i];
        const x = i * stepX + stepX / 2;
        const y = scaleY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      // CANDLES or HOLLOW
      for (let i = 0; i < count; i++) {
        const c = visibleCandles[i];
        const candleCenterX = Math.floor(i * stepX + stepX / 2) + 0.5;
        const x = Math.floor(i * stepX + (stepX - candleWidth) / 2);

        const yHigh = Math.floor(scaleY(c.high)) + 0.5;
        const yLow = Math.floor(scaleY(c.low)) + 0.5;
        const yOpen = scaleY(c.open);
        const yClose = scaleY(c.close);

        const bodyTop = Math.floor(Math.min(yOpen, yClose));
        const bodyBottom = Math.floor(Math.max(yOpen, yClose));
        const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);

        const color = c.up ? '#10b981' : '#f43f5e';

        // 1px Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(candleCenterX, yHigh);
        ctx.lineTo(candleCenterX, yLow);
        ctx.stroke();

        if (chartStyle === 'HOLLOW' && c.up) {
          // Hollow Body for bullish
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, bodyTop, Math.max(1, Math.floor(candleWidth)), bodyHeight);
        } else {
          // Solid Body
          ctx.fillStyle = color;
          ctx.fillRect(x, bodyTop, Math.max(1, Math.floor(candleWidth)), bodyHeight);
        }
      }
    }

    // 5. Draw EMA Overlays
    const drawEMA = (series: number[], strokeColor: string) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;

      for (let i = 0; i < count; i++) {
        const fullIdx = startIndex + i;
        const val = series[fullIdx];
        if (val === undefined) continue;

        const x = i * stepX + stepX / 2;
        const y = scaleY(val);

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    if (showEMA9 && ema9Series.length > 0) drawEMA(ema9Series, '#f59e0b');
    if (showEMA21 && ema21Series.length > 0) drawEMA(ema21Series, '#a855f7');

    // 6. Current Live Mid-Price Line
    if (scrollOffset === 0 && currentPrice >= minPrice && currentPrice <= maxPrice) {
      const currentY = Math.floor(scaleY(currentPrice)) + 0.5;
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(plotWidth, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(plotWidth, currentY - 9, PRICE_AXIS_WIDTH, 18);
      ctx.fillStyle = '#030914';
      ctx.font = 'bold 10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatPrice(currentPrice), plotWidth + PRICE_AXIS_WIDTH / 2, currentY);
    }

    // 7. RSI (14) Technical Sub-Pane
    if (showRSI && rsiSeries.length > 0) {
      // Sub-pane separator border
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, rsiTop + 0.5);
      ctx.lineTo(width, rsiTop + 0.5);
      ctx.stroke();

      // RSI Reference Lines: 70 (Overbought), 50 (Neutral), 30 (Oversold)
      const scaleRSI = (val: number) => {
        return rsiTop + 8 + (1 - val / 100) * (RSI_PANE_HEIGHT - 16);
      };

      const y70 = Math.floor(scaleRSI(70)) + 0.5;
      const y50 = Math.floor(scaleRSI(50)) + 0.5;
      const y30 = Math.floor(scaleRSI(30)) + 0.5;

      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 0.8;

      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)'; // 70 Overbought
      ctx.beginPath();
      ctx.moveTo(0, y70);
      ctx.lineTo(plotWidth, y70);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)'; // 50
      ctx.beginPath();
      ctx.moveTo(0, y50);
      ctx.lineTo(plotWidth, y50);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // 30 Oversold
      ctx.beginPath();
      ctx.moveTo(0, y30);
      ctx.lineTo(plotWidth, y30);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right-axis RSI labels
      ctx.font = '9px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fb7185';
      ctx.fillText('70', plotWidth + 6, y70);
      ctx.fillStyle = '#34d399';
      ctx.fillText('30', plotWidth + 6, y30);

      // Pane Label
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 9px ui-monospace, monospace';
      ctx.fillText('RSI (14)', 8, rsiTop + 12);

      // Draw RSI Curve
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let rsiStarted = false;
      for (let i = 0; i < count; i++) {
        const fullIdx = startIndex + i;
        const val = rsiSeries[fullIdx];
        if (val === undefined) continue;
        const x = i * stepX + stepX / 2;
        const y = scaleRSI(val);
        if (!rsiStarted) {
          ctx.moveTo(x, y);
          rsiStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // 8. Crosshairs & Cursor HUD
    if (mousePos && !isDragging) {
      const cx = Math.floor(mousePos.x) + 0.5;
      const cy = Math.floor(mousePos.y) + 0.5;

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 1;

      // Vertical crosshair through entire plot
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, totalPlotHeight);
      ctx.stroke();

      // Horizontal crosshair inside active pane
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(plotWidth, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price / RSI Pill on right axis
      if (cy <= mainPlotHeight) {
        const hoveredPrice = maxPrice - (mousePos.y / mainPlotHeight) * (maxPrice - minPrice);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(plotWidth, cy - 9, PRICE_AXIS_WIDTH, 18);
        ctx.strokeStyle = '#06b6d4';
        ctx.strokeRect(plotWidth, cy - 9, PRICE_AXIS_WIDTH, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9.5px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatPrice(hoveredPrice), plotWidth + PRICE_AXIS_WIDTH / 2, cy);
      }

      // Bottom-axis hover time pill
      if (hoveredCandle) {
        const timeWidth = 64;
        ctx.fillStyle = '#090d16';
        ctx.fillRect(cx - timeWidth / 2, totalPlotHeight, timeWidth, 18);
        ctx.strokeStyle = '#06b6d4';
        ctx.strokeRect(cx - timeWidth / 2, totalPlotHeight, timeWidth, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hoveredCandle.time, cx, totalPlotHeight + 9);
      }
    }

    // 9. Axis Separator Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotWidth + 0.5, 0);
    ctx.lineTo(plotWidth + 0.5, height);
    ctx.moveTo(0, totalPlotHeight + 0.5);
    ctx.lineTo(width, totalPlotHeight + 0.5);
    ctx.stroke();

    ctx.restore();
  }, [
    visibleCandles,
    minPrice,
    maxPrice,
    maxVol,
    mousePos,
    isDragging,
    chartStyle,
    showEMA9,
    showEMA21,
    showBB,
    showRSI,
    showVolume,
    ema9Series,
    ema21Series,
    bbSeries,
    rsiSeries,
    scrollOffset,
    currentPrice,
    formatPrice,
    candles,
    visibleCount,
    RSI_PANE_HEIGHT,
  ]);

  const activeCandle = hoveredCandle || (visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null);
  const candleChange = activeCandle ? ((activeCandle.close - activeCandle.open) / activeCandle.open) * 100 : 0;
  const activeRSI = rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1 - scrollOffset] : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-slate-950/95 border border-slate-800/80 p-3 sm:p-4 flex flex-col justify-between select-none overflow-hidden shadow-2xl backdrop-blur-xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none p-4 sm:p-6' : 'rounded-3xl'
      }`}
    >
      {/* Top Header: Tools, Styles, Indicators & Live OHLC HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/80 pb-2.5 mb-2 font-mono text-[11px]">
        {/* Left: Ticker, Style Switcher & Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-white flex items-center gap-1.5 mr-1">
            <ChartLineUp size={16} className="text-cyan-400" />
            {pairSymbol}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700/80">
              {timeframe}
            </span>
          </span>

          {/* Chart Style Switcher: Candles, Area, Hollow */}
          <div className="flex bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
            {(['CANDLES', 'AREA', 'HOLLOW'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setChartStyle(style)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  chartStyle === style
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {style === 'CANDLES' ? 'Candles' : style === 'AREA' ? 'Area' : 'Hollow'}
              </button>
            ))}
          </div>

          {/* Technical Indicator Toggles */}
          <div className="flex bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setShowEMA9(!showEMA9)}
              title="Exponential Moving Average (9)"
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                showEMA9 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500'
              }`}
            >
              EMA 9
            </button>
            <button
              onClick={() => setShowEMA21(!showEMA21)}
              title="Exponential Moving Average (21)"
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                showEMA21 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500'
              }`}
            >
              EMA 21
            </button>
            <button
              onClick={() => setShowBB(!showBB)}
              title="Bollinger Bands (20, 2)"
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                showBB ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-500'
              }`}
            >
              BB(20)
            </button>
            <button
              onClick={() => setShowRSI(!showRSI)}
              title="Relative Strength Index (14)"
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                showRSI ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500'
              }`}
            >
              RSI
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              title="Volume Bars"
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                showVolume ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500'
              }`}
            >
              VOL
            </button>
          </div>
        </div>

        {/* Right: Dynamic OHLCV Inspection Values & Fullscreen Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px]">
          {hoveredCandle ? (
            <span className="text-cyan-400 font-semibold px-1.5 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/30">
              {hoveredCandle.time}
            </span>
          ) : (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}

          <span className="text-slate-400">
            O: <span className="text-white font-semibold">{formatPrice(activeCandle?.open || currentPrice)}</span>
          </span>
          <span className="text-slate-400">
            H: <span className="text-emerald-400 font-semibold">{formatPrice(activeCandle?.high || currentPrice)}</span>
          </span>
          <span className="text-slate-400">
            L: <span className="text-rose-400 font-semibold">{formatPrice(activeCandle?.low || currentPrice)}</span>
          </span>
          <span className="text-slate-400">
            C:{' '}
            <span className={activeCandle?.up ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {formatPrice(activeCandle?.close || currentPrice)}
            </span>
          </span>
          {activeCandle && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeCandle.up ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {candleChange >= 0 ? `+${candleChange.toFixed(2)}%` : `${candleChange.toFixed(2)}%`}
            </span>
          )}

          {showRSI && activeRSI !== null && (
            <span className="text-purple-400 text-[10px] font-bold px-1.5 py-0.5 bg-purple-500/10 rounded border border-purple-500/30">
              RSI: {activeRSI.toFixed(1)}
            </span>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand Fullscreen'}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-800"
          >
            {isFullscreen ? <CornersIn size={15} weight="bold" /> : <CornersOut size={15} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Element */}
      <div
        className={`relative w-full cursor-crosshair ${
          isFullscreen ? 'flex-1 min-h-[500px]' : 'h-72 sm:h-96'
        } ${isDragging ? 'cursor-grabbing' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating "Jump to LIVE" Alert when panned back in time */}
        {scrollOffset > 0 && (
          <button
            onClick={handleReset}
            className="absolute bottom-8 right-20 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg border border-cyan-300 flex items-center gap-1.5 transition-all transform hover:scale-105"
          >
            <ArrowsClockwise size={14} weight="bold" />
            Jump to LIVE ({scrollOffset} periods back)
          </button>
        )}
      </div>

      {/* TradingView Bottom Range Bar & Zoom Toolbar */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 gap-2">
        {/* TradingView Standard Range Presets */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
          {(['1D', '5D', '1M', '3M', '6M', '1Y', 'ALL'] as const).map((rng) => (
            <button
              key={rng}
              onClick={() => handleRangeClick(rng)}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                activeRange === rng
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {rng}
            </button>
          ))}
        </div>

        {/* Pan hint & Zoom Toolbar */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-500 text-[10px]">
            Density: {visibleCount} bars • Drag to pan • Scroll to zoom
          </span>

          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
            >
              <Plus size={13} weight="bold" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
            >
              <Minus size={13} weight="bold" />
            </button>
            <button
              onClick={handleReset}
              title="Reset Zoom & Pan"
              className="px-2 py-0.5 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-lg font-bold transition-all"
            >
              RESET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
