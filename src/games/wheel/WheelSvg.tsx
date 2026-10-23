"use client";
import { memo } from "react";

const PALETTE = ["#4361EE", "#FF6B9A", "#40C057", "#FFD43B", "#7950F2", "#FF922B", "#20A4C9", "#E64980"];

function point(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return [Math.sin(a) * r, -Math.cos(a) * r];
}

export function segmentColor(i: number, count: number) {
  // Avoid two neighbouring segments (first/last) sharing a colour.
  if (count > 1 && i === count - 1 && i % PALETTE.length === 0) return PALETTE[3];
  return PALETTE[i % PALETTE.length];
}

/** Static wheel drawing; segment 0 starts at 12 o'clock and they go clockwise. */
export const WheelSvg = memo(function WheelSvg({ labels, highlight }: { labels: string[]; highlight: number | null }) {
  const count = labels.length;
  const seg = 360 / count;
  const R = 96;
  const fontSize = count <= 6 ? 13 : count <= 10 ? 10.5 : count <= 16 ? 8.5 : 7;
  const maxChars = count <= 8 ? 14 : 10;
  return (
    <svg viewBox="-100 -100 200 200" className="size-full drop-shadow-xl" aria-hidden>
      <circle r="99" fill="#25304B" />
      {labels.map((label, i) => {
        const a0 = i * seg;
        const a1 = a0 + seg;
        const [x0, y0] = point(a0, R);
        const [x1, y1] = point(a1, R);
        const large = seg > 180 ? 1 : 0;
        const d = count === 1 ? `M0 ${-R} A${R} ${R} 0 1 1 -0.01 ${-R}Z` : `M0 0 L${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
        const mid = a0 + seg / 2;
        const text = label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label;
        const dark = segmentColor(i, count) === "#FFD43B";
        return (
          <g key={i}>
            <path d={d} fill={segmentColor(i, count)} stroke="#fff" strokeWidth="1.2" opacity={highlight === null || highlight === i ? 1 : 0.45} />
            <g transform={`rotate(${mid})`}>
              <text
                x={0}
                y={-R * 0.58}
                transform={`rotate(90 0 ${-R * 0.58})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight={800}
                fontFamily="Cairo, Tajawal, sans-serif"
                fill={dark ? "#25304B" : "#fff"}
              >
                {text}
              </text>
            </g>
          </g>
        );
      })}
      {Array.from({ length: Math.min(count, 24) }, (_, i) => {
        const [x, y] = point(i * (360 / Math.min(count, 24)), 97.5);
        return <circle key={i} cx={x} cy={y} r="1.8" fill="#FFD43B" />;
      })}
      <circle r="15" fill="#fff" stroke="#25304B" strokeWidth="3" />
      <circle r="6" fill="#FFD43B" />
    </svg>
  );
});
