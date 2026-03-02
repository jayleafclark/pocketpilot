"use client";

interface ArcProps {
  pct: number;
  size: number;
  sw?: number;
  gapDeg?: number;
}

export default function Arc({ pct, size, sw = 5, gapDeg = 70 }: ArcProps) {
  const r = (size - sw * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const sa = 90 + gapDeg / 2;
  const sweep = 360 - gapDeg;
  const fill = Math.min(pct, 1);
  const isOver = pct > 1;

  const pol = (d: number) => {
    const rad = ((d - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  const arc = (a: number, b: number) => {
    const s = Math.min(b - a, 359.5);
    if (s <= 0) return "";
    const [x1, y1] = pol(a);
    const [x2, y2] = pol(a + s);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${s > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path
        d={arc(sa, sa + sweep)}
        fill="none"
        stroke="var(--color-bg3)"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {fill > 0 && (
        <path
          d={arc(sa, sa + sweep * fill)}
          fill="none"
          stroke={isOver ? "var(--color-red)" : "var(--color-ch)"}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
