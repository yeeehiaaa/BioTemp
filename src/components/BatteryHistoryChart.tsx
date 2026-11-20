import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppLanguage } from '../types/biotemp';

interface BatteryHistoryChartProps {
  batteryHistory: number[];
  language?: AppLanguage;
  todayLabel?: string;
  strokeColor?: string;
}

interface ChartPoint {
  day: string;
  battery: number;
}

export const BatteryHistoryChart: React.FC<BatteryHistoryChartProps> = ({
  batteryHistory,
  language = 'fr',
  todayLabel = 'Auj.',
  strokeColor = '#0B8A7E',
}) => {
  const { data, yMin, yMax } = useMemo(() => {
    const safeSeries = batteryHistory.length > 0 ? batteryHistory : [100];
    const points: ChartPoint[] = safeSeries.map((level, idx) => {
      const offset = safeSeries.length - 1 - idx;
      const day =
        offset === 0
          ? todayLabel
          : language === 'ar'
          ? `-${offset}ي`
          : `J-${offset}`;
      return {
        day,
        battery: Math.max(0, Math.min(100, Math.round(level))),
      };
    });

    const minVal = Math.min(...points.map((p) => p.battery));
    const maxVal = Math.max(...points.map((p) => p.battery));
    const upper = Math.min(100, Math.ceil((maxVal + 2) / 5) * 5);
    let lower = Math.max(0, Math.floor((minVal - 4) / 5) * 5);
    if (upper - lower < 15) {
      lower = Math.max(0, upper - 15);
    }

    return {
      data: points,
      yMin: lower,
      yMax: upper,
    };
  }, [batteryHistory, language, todayLabel]);

  return (
    <div dir="ltr" className="w-full h-[112px] min-w-0 text-[#64798F] dark:text-[#7B91A8]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            strokeOpacity={0.14}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: 'currentColor' }}
            axisLine={false}
            tickLine={false}
            dy={4}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickCount={4}
            tick={{ fontSize: 10, fill: 'currentColor' }}
            tickFormatter={(val: number) => `${val}%`}
            axisLine={false}
            tickLine={false}
          />
          {yMin <= 15 && yMax >= 15 && (
            <ReferenceLine
              y={15}
              stroke="#D91E43"
              strokeDasharray="3 3"
              strokeOpacity={0.65}
            />
          )}
          <Tooltip
            cursor={{ stroke: 'currentColor', strokeOpacity: 0.2, strokeDasharray: '2 2' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0].payload as ChartPoint;
              return (
                <div className="rounded-lg border border-[#E1E8EE] bg-white px-2.5 py-1.5 text-[11px] shadow-sm dark:border-[#1B2A42] dark:bg-[#0D1626]">
                  <span className="font-medium text-[#64798F] dark:text-[#8DA2B9]">
                    {point.day} ·{' '}
                  </span>
                  <span className="font-mono font-bold text-[#0F1D32] dark:text-[#F1F5F9] tabular-nums">
                    {point.battery} %
                  </span>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="battery"
            stroke={strokeColor}
            strokeWidth={2.25}
            dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
            activeDot={{ r: 4.5, fill: strokeColor, stroke: '#FFFFFF', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
