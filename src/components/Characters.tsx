"use client";
import { motion } from "motion/react";

type Mood = "happy" | "cheer" | "think";

/** «فارس» — the little explorer hero (original artwork). */
export function HeroKid({ size = 160, mood = "happy", className }: { size?: number; mood?: Mood; className?: string }) {
  const armUp = mood === "cheer";
  return (
    <motion.svg
      viewBox="0 0 200 220"
      width={size}
      height={(size * 220) / 200}
      className={className}
      role="img"
      aria-label="البطل فارس"
      initial={{ y: 0 }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* cape */}
      <motion.path
        d="M62 110 Q100 96 138 110 L156 196 Q100 210 44 196 Z"
        fill="#FF6B9A"
        animate={{ d: ["M62 110 Q100 96 138 110 L156 196 Q100 210 44 196 Z", "M62 110 Q100 96 138 110 L162 192 Q100 214 40 200 Z", "M62 110 Q100 96 138 110 L156 196 Q100 210 44 196 Z"] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* legs */}
      <rect x="78" y="172" width="16" height="32" rx="8" fill="#25304B" />
      <rect x="106" y="172" width="16" height="32" rx="8" fill="#25304B" />
      <ellipse cx="84" cy="206" rx="14" ry="7" fill="#FFD43B" />
      <ellipse cx="116" cy="206" rx="14" ry="7" fill="#FFD43B" />
      {/* body */}
      <rect x="66" y="110" width="68" height="72" rx="26" fill="#4361EE" />
      <path d="M100 128 l6 12 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2z" fill="#FFD43B" />
      {/* arms */}
      <motion.g
        style={{ originX: 1, originY: 0.5 }}
        animate={armUp ? { rotate: [0, -150, -130, -150] } : { rotate: [0, 8, 0] }}
        transition={{ duration: armUp ? 0.9 : 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="46" y="116" width="28" height="15" rx="7.5" fill="#4361EE" />
        <circle cx="46" cy="123.5" r="9" fill="#F5C29A" />
      </motion.g>
      <motion.g
        style={{ originX: 0, originY: 0.5 }}
        animate={armUp ? { rotate: [0, 150, 130, 150] } : { rotate: [0, -10, 0] }}
        transition={{ duration: armUp ? 0.9 : 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="126" y="116" width="28" height="15" rx="7.5" fill="#4361EE" />
        <circle cx="154" cy="123.5" r="9" fill="#F5C29A" />
      </motion.g>
      {/* head */}
      <circle cx="100" cy="72" r="44" fill="#F5C29A" />
      <path d="M58 64 Q60 26 100 26 Q142 26 144 66 Q126 46 100 50 Q76 46 58 64Z" fill="#3B2A20" />
      {/* mask */}
      <path d="M62 66 Q100 54 138 66 L136 84 Q100 76 64 84Z" fill="#7950F2" />
      <g className="anim-blink">
        <ellipse cx="83" cy="73" rx="7" ry={mood === "think" ? 5 : 8} fill="#fff" />
        <ellipse cx="117" cy="73" rx="7" ry={mood === "think" ? 5 : 8} fill="#fff" />
        <circle cx="84" cy="74" r="4" fill="#25304B" />
        <circle cx="118" cy="74" r="4" fill="#25304B" />
      </g>
      <circle cx="72" cy="94" r="6" fill="#FF8FAB" opacity="0.6" />
      <circle cx="128" cy="94" r="6" fill="#FF8FAB" opacity="0.6" />
      {mood === "think" ? (
        <path d="M90 100 Q100 96 110 100" stroke="#25304B" strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M84 96 Q100 116 116 96 Z" fill="#25304B" />
      )}
    </motion.svg>
  );
}

/** «نبيه» — the friendly knowledge robot (original artwork). */
export function RobotBuddy({ size = 150, mood = "happy", className }: { size?: number; mood?: Mood; className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 200 220"
      width={size}
      height={(size * 220) / 200}
      className={className}
      role="img"
      aria-label="الروبوت نبيه"
      animate={{ y: [0, -8, 0], rotate: mood === "cheer" ? [0, -4, 4, 0] : 0 }}
      transition={{ duration: mood === "cheer" ? 1.2 : 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="100" cy="212" rx="44" ry="6" fill="#25304B" opacity="0.12" />
      {/* antenna */}
      <line x1="100" y1="20" x2="100" y2="42" stroke="#25304B" strokeWidth="5" strokeLinecap="round" />
      <motion.circle cx="100" cy="16" r="9" fill="#FFD43B" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
      {/* head */}
      <rect x="44" y="40" width="112" height="86" rx="30" fill="#E7ECFF" stroke="#4361EE" strokeWidth="5" />
      <rect x="58" y="56" width="84" height="54" rx="20" fill="#25304B" />
      <g className="anim-blink">
        {mood === "cheer" ? (
          <>
            <path d="M72 86 Q80 74 88 86" stroke="#40C057" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M112 86 Q120 74 128 86" stroke="#40C057" strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="80" cy="82" r="9" fill="#5CE1E6" />
            <circle cx="120" cy="82" r="9" fill="#5CE1E6" />
          </>
        )}
      </g>
      <path d={mood === "think" ? "M90 100 L110 100" : "M88 98 Q100 106 112 98"} stroke="#5CE1E6" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="34" y="72" width="12" height="26" rx="6" fill="#7950F2" />
      <rect x="154" y="72" width="12" height="26" rx="6" fill="#7950F2" />
      {/* body */}
      <rect x="62" y="130" width="76" height="62" rx="22" fill="#4361EE" />
      <circle cx="100" cy="160" r="15" fill="#E7ECFF" />
      <path d="M93 160 l5 5 10 -11" stroke="#40C057" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <motion.g
        style={{ originX: 1, originY: 0.5 }}
        animate={{ rotate: mood === "cheer" ? [0, 40, 0] : [0, 10, 0] }}
        transition={{ duration: mood === "cheer" ? 0.7 : 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="38" y="136" width="28" height="13" rx="6.5" fill="#7950F2" />
        <circle cx="36" cy="142.5" r="9" fill="#FFD43B" />
      </motion.g>
      <motion.g
        style={{ originX: 0, originY: 0.5 }}
        animate={{ rotate: mood === "cheer" ? [0, -40, 0] : [0, -8, 0] }}
        transition={{ duration: mood === "cheer" ? 0.7 : 2.9, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="134" y="136" width="28" height="13" rx="6.5" fill="#7950F2" />
        <circle cx="164" cy="142.5" r="9" fill="#FFD43B" />
      </motion.g>
      <rect x="76" y="190" width="16" height="16" rx="5" fill="#25304B" />
      <rect x="108" y="190" width="16" height="16" rx="5" fill="#25304B" />
    </motion.svg>
  );
}
