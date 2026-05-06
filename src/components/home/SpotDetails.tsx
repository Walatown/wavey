'use client';

import { useRef, useState } from 'react';
import type { SurfSpot } from '@/types/surf';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const ratingVariants: Record<SurfSpot['rating'], 'good' | 'fair' | 'poor'> = {
  Good: 'good',
  Fair: 'fair',
  Poor: 'poor',
};

interface SpotDetailsProps {
  spot: SurfSpot;
  onBack: () => void;
  explanationLoading: boolean;
}

function formatWaterTemp(waterTemp: SurfSpot['waterTemp']) {
  return waterTemp === null ? 'N/A' : `${waterTemp}°C`;
}

function scoreColor(score: number) {
  return score < 5 ? '#ff6b6b' : score < 7 ? '#ffd43b' : '#51cf66';
}

function toBaliTime(utcIso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
  }).format(new Date(utcIso));
}

function buildSmoothPath(
  values: number[],
  minV: number,
  maxV: number,
  padL: number,
  padR: number,
  padT: number,
  chartH: number,
  totalW: number,
  closed: boolean,
): string {
  if (values.length < 2) return '';
  const chartW = totalW - padL - padR;
  const range = maxV - minV || 1;

  const pts: [number, number][] = values.map((v, i) => [
    padL + (i / (values.length - 1)) * chartW,
    padT + chartH - ((v - minV) / range) * chartH,
  ]);

  const segs = [`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`];
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const dx = (p1[0] - p0[0]) / 2.5;
    segs.push(
      `C ${(p0[0] + dx).toFixed(1)} ${p0[1].toFixed(1)},` +
      ` ${(p1[0] - dx).toFixed(1)} ${p1[1].toFixed(1)},` +
      ` ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`,
    );
  }

  if (closed) {
    const last = pts[pts.length - 1];
    segs.push(
      `L ${last[0].toFixed(1)} ${(padT + chartH).toFixed(1)}` +
      ` L ${padL} ${(padT + chartH).toFixed(1)} Z`,
    );
  }

  return segs.join(' ');
}

const W      = 500;
const H      = 165;
const PAD_L  = 36;
const PAD_R  = 14;
const PAD_T  = 24; // extra top room for inline value label
const PAD_B  = 32;
const CHART_H = H - PAD_T - PAD_B;
const CHART_W = W - PAD_L - PAD_R;

interface AreaChartProps {
  label: string;
  subLabel: string;
  values: number[];
  labels: string[];
  minY: number;
  maxY: number;
  yUnit: string;
  color: string;
  uid: string;
  isScoreChart?: boolean;
  hoveredIdx: number | null;
  onHover: (idx: number, clientX: number, clientY: number) => void;
}

function AreaChart({
  label,
  subLabel,
  values,
  labels,
  minY,
  maxY,
  yUnit,
  color,
  uid,
  isScoreChart = false,
  hoveredIdx,
  onHover,
}: AreaChartProps) {
  const range = maxY - minY || 1;

  const areaPath = buildSmoothPath(values, minY, maxY, PAD_L, PAD_R, PAD_T, CHART_H, W, true);
  const linePath = buildSmoothPath(values, minY, maxY, PAD_L, PAD_R, PAD_T, CHART_H, W, false);

  // Y coordinate for a given value
  function yOf(v: number) {
    return PAD_T + CHART_H - ((v - minY) / range) * CHART_H;
  }
  function ptX(i: number) {
    return PAD_L + (i / (values.length - 1)) * CHART_W;
  }

  // Score zone y-boundaries (only used when isScoreChart)
  const y5     = yOf(5);                    // top of red zone / bottom of yellow
  const y7     = yOf(7);                    // top of yellow zone / bottom of green
  const yTop   = PAD_T;
  const yBot   = PAD_T + CHART_H;

  const gridLines = [0, 1, 2, 3].map((i) => {
    const v = minY + (range / 3) * i;
    return { v, y: yOf(v) };
  });

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX  = ((e.clientX - rect.left) / rect.width) * W;
    const frac  = Math.max(0, Math.min(1, (svgX - PAD_L) / CHART_W));
    const idx   = Math.round(frac * (values.length - 1));
    onHover(idx, e.clientX, e.clientY);
  }

  // Color for crosshair / dot at hovered point
  const hoveredColor = isScoreChart && hoveredIdx !== null
    ? scoreColor(values[hoveredIdx])
    : color;

  // Formatted value label shown inside the chart on hover
  function formatVal(i: number) {
    return yUnit === 'm'
      ? `${values[i].toFixed(2)} m`
      : String(values[i]);
  }

  return (
    <div>
      <div className="mb-2">
        <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color }}>
          {label}
        </div>
        <div className="text-[11px] text-white/40">{subLabel}</div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair overflow-visible"
        onMouseMove={handleMouseMove}
      >
        <defs>
          {/* ── Plain gradient (wave chart) ── */}
          {!isScoreChart && (
            <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.40" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          )}

          {/* ── Score chart: mask + three clip zones ── */}
          {isScoreChart && (
            <>
              {/* Mask = the filled area shape */}
              <mask id={`${uid}-mask`}>
                <path d={areaPath} fill="white" />
              </mask>
              {/* Clip paths for each colour zone */}
              <clipPath id={`${uid}-clip-red`}>
                <rect x={PAD_L} y={y5}   width={CHART_W} height={yBot - y5} />
              </clipPath>
              <clipPath id={`${uid}-clip-yellow`}>
                <rect x={PAD_L} y={y7}   width={CHART_W} height={y5 - y7} />
              </clipPath>
              <clipPath id={`${uid}-clip-green`}>
                <rect x={PAD_L} y={yTop} width={CHART_W} height={y7 - yTop} />
              </clipPath>
            </>
          )}
        </defs>

        {/* Gridlines + y-labels */}
        {gridLines.map(({ v, y }, i) => (
          <g key={i}>
            <line
              x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
              stroke="rgba(255,255,255,0.07)" strokeWidth={0.5}
            />
            <text
              x={PAD_L - 5} y={y + 3.5}
              textAnchor="end" fontSize={9}
              fill="rgba(255,255,255,0.28)"
            >
              {yUnit === 'm' ? v.toFixed(1) : Math.round(v)}{yUnit}
            </text>
          </g>
        ))}

        {/* ── Wave chart: plain gradient area + single coloured line ── */}
        {!isScoreChart && (
          <>
            <path d={areaPath} fill={`url(#${uid}-grad)`} />
            <path
              d={linePath} fill="none"
              stroke={color} strokeWidth={1.5}
              strokeLinecap="round" strokeLinejoin="round"
            />
          </>
        )}

        {/* ── Score chart: colour-banded area + three line segments ── */}
        {isScoreChart && (
          <>
            {/* Colour bands masked by area shape */}
            <g mask={`url(#${uid}-mask)`}>
              <rect x={PAD_L} y={y5}   width={CHART_W} height={yBot - y5} fill="#ff6b6b" fillOpacity={0.38} />
              <rect x={PAD_L} y={y7}   width={CHART_W} height={y5  - y7}  fill="#ffd43b" fillOpacity={0.38} />
              <rect x={PAD_L} y={yTop} width={CHART_W} height={y7  - yTop} fill="#51cf66" fillOpacity={0.38} />
            </g>
            {/* Coloured line segments clipped to each zone */}
            <path d={linePath} fill="none" stroke="#ff6b6b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${uid}-clip-red)`} />
            <path d={linePath} fill="none" stroke="#ffd43b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${uid}-clip-yellow)`} />
            <path d={linePath} fill="none" stroke="#51cf66" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${uid}-clip-green)`} />
          </>
        )}

        {/* "Now" dashed vertical marker */}
        <line
          x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + CHART_H}
          stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeDasharray="3 3"
        />

        {/* X-axis labels — every other point */}
        {values.map((_, i) =>
          i % 2 === 0 ? (
            <text
              key={i}
              x={ptX(i)} y={H - 5}
              textAnchor="middle" fontSize={9}
              fill="rgba(255,255,255,0.28)"
            >
              {labels[i]}
            </text>
          ) : null,
        )}

        {/* ── Hover: crosshair + dot + inline value label ── */}
        {hoveredIdx !== null && (() => {
          const cx = ptX(hoveredIdx);
          const cy = yOf(values[hoveredIdx]);
          const val = formatVal(hoveredIdx);
          // Position label: above crosshair top, centred on cx
          const labelW = val.length * 6.5 + 10;
          const labelX = Math.min(Math.max(cx - labelW / 2, PAD_L), W - PAD_R - labelW);
          return (
            <g>
              {/* Vertical crosshair */}
              <line
                x1={cx} y1={PAD_T} x2={cx} y2={PAD_T + CHART_H}
                stroke={hoveredColor} strokeWidth={1} strokeOpacity={0.5}
              />
              {/* Dot */}
              <circle cx={cx} cy={cy} r={8}  fill={hoveredColor} fillOpacity={0.18} />
              <circle cx={cx} cy={cy} r={4}  fill={hoveredColor} />
              {/* Inline value callout at top of chart */}
              <rect
                x={labelX} y={PAD_T - 18}
                width={labelW} height={15}
                rx={3}
                fill="rgba(12,12,18,0.88)"
                stroke={hoveredColor} strokeWidth={0.6} strokeOpacity={0.5}
              />
              <text
                x={labelX + labelW / 2} y={PAD_T - 7}
                textAnchor="middle" fontSize={10} fontWeight="700"
                fill={hoveredColor}
              >
                {val}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

export function SpotDetails({ spot, onBack, explanationLoading }: SpotDetailsProps) {
  const chartsRef  = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, flip: false });

  const hasForecast = spot.forecast && spot.forecast.length > 0;

  const nowBaliTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar',
  }).format(new Date());

  const allScores  = hasForecast ? [spot.score,      ...spot.forecast.map(f => f.score)]       : [spot.score];
  const allWaves   = hasForecast ? [spot.waveHeight,  ...spot.forecast.map(f => f.waveHeight)]  : [spot.waveHeight];
  const timeLabels = hasForecast
    ? [nowBaliTime, ...spot.forecast.map(f => toBaliTime(f.time))]
    : [nowBaliTime];

  const maxWave = Math.ceil((Math.max(...allWaves) + 0.3) * 4) / 4;

  function handleHover(idx: number, clientX: number, clientY: number) {
    const rect = chartsRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = clientX - rect.left;
    setTooltipPos({ x: relX, y: clientY - rect.top, flip: relX > rect.width / 2 });
    setHoveredIdx(idx);
  }

  return (
    <section className="px-6 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <Button type="button" variant="outlined" size="sm" onClick={onBack} className="mb-6">
          ← Back to all spots
        </Button>

        <Card className="overflow-hidden">
          <CardContent className="p-0">

            {/* Header */}
            <div className="flex flex-col items-start justify-between gap-4 border-b border-white/[0.08] bg-white/[0.03] p-6 md:flex-row md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-medium text-white">{spot.name}</h2>
                  <Badge variant={ratingVariants[spot.rating]}>{spot.rating} conditions</Badge>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/60">
                  {spot.location} · updated now
                </p>
              </div>
              <div className="shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.06] px-6 py-4 text-center backdrop-blur-sm">
                <div
                  className="text-4xl font-medium leading-none"
                  style={{ color: scoreColor(spot.score) }}
                >
                  {spot.score}
                </div>
                <div className="mt-1 text-[10px] font-medium uppercase tracking-widest text-white/50">
                  surf score / 10
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-px bg-white/[0.06] md:grid-cols-4">
              <StatCard label="wave height" value={`${spot.waveHeight.toFixed(1)} m`} />
              <StatCard label="wind speed"  value={`${spot.windSpeed} km/h`} />
              <StatCard label="period"      value={`${spot.period} sec`} />
              <StatCard label="water temp"  value={formatWaterTemp(spot.waterTemp)} />
            </div>

            {/* Charts — two side by side with shared hover state */}
            {hasForecast && (
              <div
                ref={chartsRef}
                className="relative border-t border-white/[0.08] bg-white/[0.02]"
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="grid grid-cols-2 divide-x divide-white/[0.08]">
                  <div className="p-6">
                    <AreaChart
                      label="Surf score"
                      subLabel={`↓ ${Math.min(...allScores)}  ↑ ${Math.max(...allScores)}`}
                      values={allScores}
                      labels={timeLabels}
                      minY={0} maxY={10}
                      yUnit="" color="#7B61FF"
                      uid="score"
                      isScoreChart
                      hoveredIdx={hoveredIdx}
                      onHover={handleHover}
                    />
                  </div>
                  <div className="p-6">
                    <AreaChart
                      label="Wave height"
                      subLabel={`↓ ${Math.min(...allWaves).toFixed(1)} m  ↑ ${Math.max(...allWaves).toFixed(1)} m`}
                      values={allWaves}
                      labels={timeLabels}
                      minY={0} maxY={maxWave}
                      yUnit="m" color="#2E9CCA"
                      uid="wave"
                      hoveredIdx={hoveredIdx}
                      onHover={handleHover}
                    />
                  </div>
                </div>

                {/* Floating tooltip — appears when hovering either chart, shows both metrics */}
                {hoveredIdx !== null && (
                  <div
                    className="pointer-events-none absolute z-20 min-w-[148px] rounded-xl border border-white/[0.1] bg-black/70 px-3.5 py-2.5 shadow-xl backdrop-blur-xl"
                    style={{
                      left: tooltipPos.x,
                      top:  tooltipPos.y,
                      transform: tooltipPos.flip
                        ? 'translate(calc(-100% - 14px), -50%)'
                        : 'translate(14px, -50%)',
                    }}
                  >
                    <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/45">
                      {timeLabels[hoveredIdx]}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: scoreColor(allScores[hoveredIdx]) }}
                        />
                        <span className="text-[12px] font-semibold text-white">
                          {allScores[hoveredIdx]}
                          <span className="ml-1 text-[10px] font-normal text-white/45">/ 10</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2E9CCA]" />
                        <span className="text-[12px] font-semibold text-white">
                          {allWaves[hoveredIdx].toFixed(2)}
                          <span className="ml-1 text-[10px] font-normal text-white/45">m wave</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI analysis */}
            <div className="border-t border-white/[0.08] bg-white/[0.02] p-6">
              <div className="rounded-xl border border-white/[0.08] bg-black/40 p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="text-xs font-medium uppercase tracking-wider text-white/60">
                    ai analysis
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">
                  {explanationLoading
                    ? 'generating analysis...'
                    : spot.explanation || 'no explanation available for this spot right now.'}
                </p>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] p-5 text-center">
      <div className="text-xl font-medium text-white">{value}</div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}
