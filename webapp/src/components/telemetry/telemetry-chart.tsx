"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TelemetryChart({ data, label }: { data: { time: string; value: number }[]; label: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={36} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} name={label} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
