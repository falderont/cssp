const COLORS: Record<string, string> = {
  power_kw: "#2f5fdb",
  temperature_c: "#7c3aed",
  humidity_pct: "#0f766e",
};

export function Sparkline({ metric, values }: { metric: string; values: number[] }) {
  if (values.length < 2) return null;
  const width = 240;
  const height = 48;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(" ");
  const color = COLORS[metric] ?? "#2f5fdb";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full" preserveAspectRatio="none" role="img" aria-label={`${metric} trend`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
