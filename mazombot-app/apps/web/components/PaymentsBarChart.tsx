"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// TODO: trocar pelos dados reais da semana vindos da API.
const data = [
  { day: "Seg", gerados: 120, aprovados: 70 },
  { day: "Ter", gerados: 160, aprovados: 95 },
  { day: "Qua", gerados: 140, aprovados: 80 },
  { day: "Qui", gerados: 210, aprovados: 130 },
  { day: "Sex", gerados: 190, aprovados: 120 },
  { day: "Sáb", gerados: 175, aprovados: 100 },
  { day: "Dom", gerados: 155, aprovados: 90 },
];

export function PaymentsBarChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
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
        <Legend
          wrapperStyle={{ fontSize: 11, color: "oklch(65% 0.02 260)" }}
          formatter={(value) => (value === "aprovados" ? "aprovados" : "gerados")}
        />
        <Bar dataKey="gerados" fill="oklch(68% 0.24 300)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="aprovados" fill="oklch(85% 0.18 200)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
