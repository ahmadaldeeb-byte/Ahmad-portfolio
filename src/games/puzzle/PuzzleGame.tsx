"use client";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ChoiceButton, MathShell, type MathApi } from "../math/MathShell";
import type { GameProps } from "../types";

/** Original educational pictures drawn in a 300 × 300 box (cut into pieces by viewBox). */
const PICTURES: { name: string; draw: ReactNode }[] = [
  {
    name: "قرية جميلة",
    draw: (
      <>
        <rect width="300" height="300" fill="#A5D8FF" />
        <circle cx="240" cy="60" r="34" fill="#FFD43B" />
        <path d="M0 200 L70 110 L140 200 Z" fill="#69DB7C" />
        <path d="M100 200 L190 90 L280 200 Z" fill="#40C057" />
        <rect y="200" width="300" height="100" fill="#8CE99A" />
        <rect x="40" y="170" width="90" height="80" fill="#FF922B" stroke="#25304B" strokeWidth="4" />
        <path d="M30 172 L85 120 L140 172 Z" fill="#E03131" stroke="#25304B" strokeWidth="4" />
        <rect x="72" y="205" width="26" height="45" fill="#8B5E3C" />
        <rect x="200" y="190" width="16" height="60" fill="#8B5E3C" />
        <circle cx="208" cy="170" r="36" fill="#2F9E44" />
        <path d="M150 300 Q170 250 160 200" stroke="#FFE066" strokeWidth="14" fill="none" />
      </>
    ),
  },
  {
    name: "تحت البحر",
    draw: (
      <>
        <rect width="300" height="300" fill="#1C7ED6" />
        <rect y="250" width="300" height="50" fill="#FFE8A3" />
        <path d="M40 250 q-10 -40 6 -80 q-14 -30 4 -70" stroke="#2F9E44" strokeWidth="10" fill="none" />
        <path d="M260 250 q12 -40 -4 -80" stroke="#2F9E44" strokeWidth="10" fill="none" />
        <ellipse cx="120" cy="110" rx="40" ry="24" fill="#FF922B" />
        <path d="M80 110 L55 90 L55 130 Z" fill="#FF922B" />
        <circle cx="140" cy="104" r="6" fill="#fff" />
        <ellipse cx="210" cy="190" rx="34" ry="20" fill="#FAB005" />
        <path d="M244 190 L268 172 L268 208 Z" fill="#FAB005" />
        <circle cx="196" cy="185" r="5" fill="#fff" />
        <circle cx="80" cy="200" r="22" fill="#E64980" />
        {[60, 100, 230, 250, 170].map((x, k) => <circle key={k} cx={x} cy={40 + k * 12} r={6 + (k % 3) * 2} fill="#D0EBFF" opacity="0.8" />)}
        <path d="M150 250 l10 -20 l10 20 z M180 250 l8 -14 l8 14 z" fill="#E8590C" />
      </>
    ),
  },
  {
    name: "رحلة في الفضاء",
    draw: (
      <>
        <rect width="300" height="300" fill="#1B1E3C" />
        {Array.from({ length: 24 }, (_, k) => <circle key={k} cx={(k * 73) % 300} cy={(k * 41) % 300} r={k % 3 ? 1.5 : 2.5} fill="#fff" />)}
        <circle cx="80" cy="220" r="50" fill="#FF922B" />
        <ellipse cx="80" cy="220" rx="78" ry="14" fill="none" stroke="#FFD43B" strokeWidth="6" />
        <circle cx="230" cy="80" r="34" fill="#4DABF7" />
        <path d="M216 70 q10 -10 22 0 q-6 12 -22 0z" fill="#40C057" />
        <path d="M160 180 L190 120 L220 180 Z" fill="#F1F3F5" stroke="#25304B" strokeWidth="4" />
        <rect x="172" y="180" width="36" height="40" fill="#E03131" stroke="#25304B" strokeWidth="4" />
        <circle cx="190" cy="160" r="8" fill="#74C0FC" stroke="#25304B" strokeWidth="3" />
        <path d="M180 220 L190 250 L200 220 Z" fill="#FFD43B" />
      </>
    ),
  },
];

interface Board {
  picture: number;
  pieces: number;
}

/** The pictures for a round: 3 × 3 pieces with 9+ questions, otherwise 2 × 2 (one piece per right answer). */
export function puzzleBoards(questions: number): Board[] {
  const pieces = questions >= 9 ? 9 : 4;
  return Array.from({ length: Math.ceil(questions / pieces) }, (_, k) => ({ picture: k % PICTURES.length, pieces }));
}

function Piece({ picture, index, pieces, className }: { picture: number; index: number; pieces: number; className?: string }) {
  const n = Math.sqrt(pieces);
  const size = 300 / n;
  const x = (index % n) * size;
  const y = Math.floor(index / n) * size;
  return (
    <svg viewBox={`${x} ${y} ${size} ${size}`} className={cn("block size-full", className)} aria-hidden>
      {PICTURES[picture].draw}
    </svg>
  );
}

/** «أبطال الألغاز»: answer a question to win a puzzle piece, then put it in its place. */
export default function PuzzleGame({ game, questions, paused, onFinish }: GameProps) {
  const boards = puzzleBoards(questions.length);
  const pieces = boards[0]?.pieces ?? 4;
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={questions}
      prompt={(q) => <span dir={/[A-Za-z]/.test(q.prompt) && !/[؀-ۿ]/.test(q.prompt) ? "ltr" : "rtl"}>{q.prompt}</span>}
      skill={() => "puzzle"}
      celebrate={(solved) => (solved % pieces === 0 ? 1500 : 0)}
    >
      {(q, api, i) => <PuzzleTask q={q} api={api} board={boards[Math.floor(i / pieces)]} slot={i % pieces} />}
    </MathShell>
  );
}

function PuzzleTask({ q, api, board, slot }: { q: GameProps["questions"][number]; api: MathApi; board: Board; slot: number }) {
  const [won, setWon] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);
  const [miss, setMiss] = useState<number | null>(null);
  const answer = q.choices[q.correctIndex];
  const n = Math.sqrt(board.pieces);
  const pick = (c: string) => {
    if (c === answer) {
      sound.play("correct");
      setWon(true);
    } else {
      setWrong(c);
      api.submit(false);
    }
  };
  const place = (k: number) => {
    if (api.locked) return;
    if (k === slot) api.submit(true, "أحسنت! القطعة في مكانها");
    else {
      sound.play("wrong");
      setMiss(k);
    }
  };
  const placed = (k: number) => k < slot || (api.solved && k === slot);
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-3 md:flex-row md:items-center md:gap-8" data-testid="puzzle">
      <div className="flex flex-col items-center gap-2">
        <div className="grid aspect-square w-[min(80vw,46vh)] max-w-sm gap-1 rounded-3xl bg-hero-ink/10 p-1" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-label={`لوحة اللغز: ${PICTURES[board.picture].name}`}>
          {Array.from({ length: board.pieces }, (_, k) => (
            <motion.button
              key={k}
              type="button"
              disabled={!won || placed(k) || api.locked}
              onClick={() => place(k)}
              animate={miss === k ? { x: [0, -8, 8, 0] } : {}}
              className={cn("relative overflow-hidden rounded-xl bg-white", won && !placed(k) && "cursor-pointer ring-2 ring-hero-orange")}
              aria-label={placed(k) ? `قطعة ${k + 1}` : `مكان فارغ ${k + 1}`}
              data-testid="puzzle-slot"
              data-placed={placed(k)}
            >
              {/* Empty places show a faint copy of the picture so children can match the piece. */}
              <Piece picture={board.picture} index={k} pieces={board.pieces} className={placed(k) ? "" : "opacity-20 grayscale"} />
            </motion.button>
          ))}
        </div>
        <span className="font-bold text-hero-muted">{PICTURES[board.picture].name}</span>
      </div>
      <div className="flex w-full max-w-2xl flex-col items-center gap-3">
        {!won ? (
          <>
            {q.image && <img src={q.image} alt="" className="max-h-40 rounded-2xl object-contain shadow-soft" />}
            <div className="grid w-full grid-cols-2 gap-3">
              {q.choices.map((c) => (
                <ChoiceButton key={c} disabled={api.locked} state={api.revealed ? (c === answer ? "correct" : c === wrong ? "wrong" : "dim") : c === wrong ? "wrong" : null} onClick={() => pick(c)} className="text-2xl md:text-3xl">
                  {c}
                </ChoiceButton>
              ))}
            </div>
          </>
        ) : (
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-2">
            <p className="text-xl font-bold">ربحت قطعة! ضعها في مكانها الصحيح في اللوحة 🧩</p>
            <div className="size-32 overflow-hidden rounded-2xl border-4 border-hero-orange shadow-lg md:size-40" data-testid="puzzle-piece" data-slot={slot}>
              <Piece picture={board.picture} index={slot} pieces={board.pieces} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
