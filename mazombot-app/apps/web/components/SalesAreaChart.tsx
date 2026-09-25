"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// TODO: trocar pelos últimos 14 dias reais vindos da API.
const data = [
  { day: "1/11", revenue: 1800, leads: 120 },
  { day: "3/11", revenue: 2600, leads: 180 },
  { day: "5/11", revenue: 1400, leads: 90 },
  { day: "7/11", revenue: 2200, leads: 150 },
  { day: "9/11", revenue: 3100, leads: 210 },
  { day: "11/11", revenue: 2000, leads: 140 },
  { day: "13/11", revenue: 2700, leads: 190 },
];

export function SalesAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(85% 0.18 200)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="oklch(85% 0.18 200)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(27% 0.02 270 / 0.4)" vertical={false} />
        <XAxis dataKey="day" stroke="oklch(65% 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(65% 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "oklch(16% 0.015 270)",
            border: "1px solid oklch(27% 0.02 270 / 0.6)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="oklch(85% 0.18 200)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="oklch(68% 0.24 300)"
          strokeWidth={1.5}
          fill="transparent"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
