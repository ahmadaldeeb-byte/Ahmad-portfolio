import type { GameType } from "@/lib/types";

/** Original vector illustrations used as game thumbnails. */
export function GameArt({ type, className }: { type: GameType; className?: string }) {
  const common = { viewBox: "0 0 240 150", className, "aria-hidden": true } as const;
  switch (type) {
    case "wheel":
      return (
        <svg {...common}>
          <rect width="240" height="150" fill="#FFF3BF" />
          <circle cx="40" cy="30" r="30" fill="#FFE066" opacity=".6" />
          <g transform="translate(120 80)">
            {["#4361EE", "#FF6B9A", "#40C057", "#FFD43B", "#7950F2", "#FF922B"].map((c, i) => (
              <path key={c} d="M0 0 L0 -58 A58 58 0 0 1 50.2 -29 Z" fill={c} transform={`rotate(${i * 60})`} />
            ))}
            <circle r="58" fill="none" stroke="#25304B" strokeWidth="5" />
            <circle r="12" fill="#fff" stroke="#25304B" strokeWidth="4" />
          </g>
          <path d="M120 30 l-10 -18 h20z" fill="#FA5252" stroke="#25304B" strokeWidth="3" transform="rotate(180 120 21)" />
        </svg>
      );
    case "race":
      return (
        <svg {...common}>
          <rect width="240" height="150" fill="#D0EBFF" />
          <rect y="70" width="240" height="80" fill="#495057" />
          <path d="M0 110 H240" stroke="#fff" strokeWidth="4" strokeDasharray="18 14" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x="196" y={70 + i * 13.3} width="12" height="13.3" fill={i % 2 ? "#fff" : "#25304B"} />
          ))}
          <g transform="translate(120 76)">
            <rect width="56" height="22" rx="8" fill="#FA5252" />
            <rect x="12" y="-12" width="30" height="16" rx="6" fill="#FF8787" />
            <circle cx="12" cy="24" r="8" fill="#25304B" />
            <circle cx="44" cy="24" r="8" fill="#25304B" />
          </g>
          <g transform="translate(60 112)">
            <rect width="56" height="22" rx="8" fill="#4361EE" />
            <rect x="12" y="-12" width="30" height="16" rx="6" fill="#748FFC" />
            <circle cx="12" cy="24" r="8" fill="#25304B" />
            <circle cx="44" cy="24" r="8" fill="#25304B" />
          </g>
          <circle cx="190" cy="30" r="16" fill="#FFD43B" />
        </svg>
      );
    case "balloons":
      return (
        <svg {...common}>
          <rect width="240" height="150" fill="#FFDEEB" />
          {[
            [60, 70, "#FF6B9A"],
            [105, 50, "#4361EE"],
            [150, 75, "#40C057"],
            [190, 45, "#FFD43B"],
          ].map(([x, y, c]) => (
            <g key={String(c)}>
              <path d={`M${x} ${Number(y) + 30} q-6 20 4 40`} stroke="#25304B" strokeWidth="2" fill="none" />
              <ellipse cx={x} cy={y} rx="22" ry="28" fill={String(c)} />
              <ellipse cx={Number(x) - 7} cy={Number(y) - 10} rx="5" ry="8" fill="#fff" opacity=".5" />
            </g>
          ))}
        </svg>
      );
    case "memory":
      return (
        <svg {...common}>
          <rect width="240" height="150" fill="#E5DBFF" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={30 + i * 48} y={40 + (i % 2) * 10} width="40" height="56" rx="8" fill={i === 1 ? "#fff" : "#7950F2"} stroke="#25304B" strokeWidth="3" />
          ))}
          <text x="94" y="78" fontSize="22" fill="#7950F2">★</text>
        </svg>
      );
    case "quiz":
      return (
        <svg {...common}>
          <rect width="240" height="150" fill="#D3F9D8" />
          <rect x="40" y="22" width="160" height="34" rx="12" fill="#fff" stroke="#25304B" strokeWidth="3" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={40 + (i % 2) * 84} y={66 + Math.floor(i / 2) * 36} width="76" height="28" rx="10" fill={["#40C057", "#4361EE", "#FF6B9A", "#FFD43B"][i]} />
          ))}
        </svg>
      );
    case "words":
      return (
        <svg {...common}>
          <rect width="240" height="150" fill="#FFE8CC" />
          {["ق", "ل", "م"].map((ch, i) => (
            <g key={ch} transform={`translate(${150 - i * 50} 50)`}>
              <rect width="40" height="48" rx="10" fill="#FF922B" stroke="#25304B" strokeWidth="3" />
              <text x="20" y="34" textAnchor="middle" fontSize="26" fill="#fff" fontWeight="bold">{ch}</text>
            </g>
          ))}
        </svg>
      );
    case "numbers":
      return (
        <svg {...common}>
          <rect width="240" height="150" fill="#C5F6FA" />
          <path d="M20 120 Q70 60 120 100 T220 60" stroke="#20A4C9" strokeWidth="6" fill="none" strokeDasharray="10 10" />
          {[[20, 120], [120, 100], [220, 60]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="14" fill="#FFD43B" stroke="#25304B" strokeWidth="3" />
          ))}
          <text x="90" y="44" fontSize="30" fontWeight="bold" fill="#25304B">٣+٤</text>
        </svg>
      );
    case "puzzle":
      return (
        <svg {...common}>
          <rect width="240" height="150" fill="#FFDEEB" />
          <rect x="60" y="25" width="60" height="50" fill="#E64980" />
          <rect x="120" y="25" width="60" height="50" fill="#FF8FAB" />
          <rect x="60" y="75" width="60" height="50" fill="#FCC2D7" />
          <rect x="132" y="87" width="60" height="50" fill="#F06595" transform="rotate(8 162 112)" />
        </svg>
      );
    case "space":
      return (
        <svg {...common}>
          <rect width="240" height="150" fill="#1B1464" />
          {Array.from({ length: 20 }, (_, i) => (
            <circle key={i} cx={(i * 53) % 240} cy={(i * 37) % 150} r={i % 3 === 0 ? 2 : 1} fill="#fff" />
          ))}
          <circle cx="180" cy="50" r="24" fill="#FF922B" />
          <ellipse cx="180" cy="50" rx="38" ry="8" fill="none" stroke="#FFD43B" strokeWidth="4" />
          <circle cx="50" cy="110" r="16" fill="#40C057" />
          <path d="M100 100 l30 -30 l8 8 -30 30z" fill="#fff" />
          <path d="M100 100 l-10 12 l6 2 2 6z" fill="#FA5252" />
        </svg>
      );
    case "teams":
      return (
        <svg {...common}>
          <rect width="120" height="150" fill="#FFC9C9" />
          <rect x="120" width="120" height="150" fill="#BAC8FF" />
          <circle cx="60" cy="75" r="34" fill="#FA5252" />
          <circle cx="180" cy="75" r="34" fill="#4361EE" />
          <text x="120" y="86" textAnchor="middle" fontSize="30" fontWeight="bold" fill="#25304B">⚡</text>
        </svg>
      );
  }
}
