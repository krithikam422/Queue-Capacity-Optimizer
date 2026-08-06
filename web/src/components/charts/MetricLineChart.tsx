'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ChartPoint {
  c: number;
  value: number | null;
}

/**
 * Shared single-series line chart used by the wait/utilization/cost charts.
 * One axis, one hue (the accent color) — current and recommended
 * configurations are called out by marker shape, not by introducing new
 * colors, so the chart never needs a legend.
 */
export function MetricLineChart({
  data,
  currentC,
  recommendedC,
  valueFormatter,
  yLabel,
}: {
  data: ChartPoint[];
  currentC: number;
  recommendedC: number;
  valueFormatter: (value: number) => string;
  yLabel: string;
}) {
  const currentPoint = data.find((d) => d.c === currentC && d.value !== null);
  const recommendedPoint = data.find((d) => d.c === recommendedC && d.value !== null);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="c"
            tick={{ fontSize: 12, fill: 'var(--muted)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            label={{ value: 'Servers', position: 'insideBottom', offset: -2, fontSize: 12, fill: 'var(--muted)' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--muted)' }}
            axisLine={false}
            tickLine={false}
            width={44}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 12, fill: 'var(--muted)' }}
          />
          <Tooltip
            formatter={(value) => valueFormatter(Number(value))}
            labelFormatter={(c) => `${c} servers`}
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ r: 3, stroke: 'var(--accent)', fill: 'var(--card)', strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          {currentPoint && (
            <ReferenceDot
              x={currentPoint.c}
              y={currentPoint.value as number}
              r={6}
              fill="var(--accent)"
              stroke="var(--card)"
              strokeWidth={2}
              label={{
                value: currentPoint.c === recommendedPoint?.c ? 'Current & recommended' : 'Current',
                position: 'top',
                fontSize: 11,
                fill: 'var(--foreground)',
              }}
            />
          )}
          {recommendedPoint && recommendedPoint.c !== currentPoint?.c && (
            <ReferenceDot
              x={recommendedPoint.c}
              y={recommendedPoint.value as number}
              r={6}
              fill="var(--card)"
              stroke="var(--accent)"
              strokeWidth={2}
              label={{ value: 'Recommended', position: 'top', fontSize: 11, fill: 'var(--foreground)' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
