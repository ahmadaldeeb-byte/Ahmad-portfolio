"use client";
import { AnimatePresence, motion } from "motion/react";
import { Flag, Timer, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Button, Loading, Segmented, inputClass } from "@/components/ui";
import { isMathExpression } from "@/lib/arabic";
import { sound } from "@/lib/audio";
import type { PlayableQuestion } from "@/lib/questions";
import { RACE_DEFAULTS, RACE_DURATIONS, decideRace, fairSequences, validateRaceSettings, type RaceOutcome, type RaceSettings } from "@/lib/race";
import { cn, formatDuration, formatNum } from "@/lib/utils";
import { useSettings } from "@/store/settings";
import type { GameProps } from "../types";

const RaceLane = dynamic(() => import("./RaceLane"), { ssr: false, loading: () => <Loading label="نجهّز الحلبة..." /> });

/** Fixed team identities: red races on the right, blue on the left. */
const SIDES = [
  { key: "red", color: "#FA5252", soft: "#FFE3E3", fallback: "الفريق الأحمر" },
  { key: "blue", color: "#4361EE", soft: "#DBE4FF", fallback: "الفريق الأزرق" },
] as const;

type Phase = "setup" | "countdown" | "racing" | "over";
interface TeamState {
  index: number; // position in the team's own question sequence
  steps: number;
  correct: number;
  wrong: number;
  picked: number | null;
  feedback: "correct" | "wrong" | null;
}
const freshTeam = (): TeamState => ({ index: 0, steps: 0, correct: 0, wrong: 0, picked: null, feedback: null });

export default function RaceGame({ game, questions, paused, onFinish }: GameProps) {
  const { settings } = game;
  const numerals = useSettings((s) => s.numerals);
  const n = useCallback((v: number | string) => formatNum(v, numerals), [numerals]);
  const names = SIDES.map((s, i) => settings.teams[i]?.name?.trim() || s.fallback);
  const isEnglish = game.subject === "english";

  const [race, setRace] = useState<RaceSettings>({ ...RACE_DEFAULTS, ...settings.race });
  const [phase, setPhase] = useState<Phase>("setup");
  const [count, setCount] = useState(3);
  const [teams, setTeams] = useState<[TeamState, TeamState]>([freshTeam(), freshTeam()]);
  const [remainingMs, setRemainingMs] = useState(race.durationSec * 1000);
  const [outcome, setOutcome] = useState<RaceOutcome | null>(null);
  const [fire, setFire] = useState(0);
  const timers = useRef<number[]>([]);
  const teamsRef = useRef(teams);
  teamsRef.current = teams;
  const sequences = useMemo(() => fairSequences(questions, 400), [questions]);
  const seqOf = (t: 0 | 1): PlayableQuestion[] => (t === 0 ? sequences.red : sequences.blue);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  // 3-2-1 start, then both cars go at once.
  useEffect(() => {
    if (phase !== "countdown" || paused) return;
    if (count === 0) {
      sound.play("levelUp");
      const t = setTimeout(() => setPhase("racing"), 600);
      return () => clearTimeout(t);
    }
    sound.play("tick");
    const t = setTimeout(() => setCount((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [phase, count, paused]);

  const end = useCallback((o: RaceOutcome) => {
    setOutcome(o);
    setPhase("over"); // freezes both sides
    setFire(Date.now());
    sound.play("win");
    sound.say(o.winner === null ? "تعادل!" : "أحسنتم!");
  }, []);

  // One shared match clock.
  useEffect(() => {
    if (phase !== "racing" || paused) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setRemainingMs((r) => {
        const next = Math.max(0, r - dt);
        if (Math.ceil(next / 1000) !== Math.ceil(r / 1000) && next > 0 && next <= 10_000) sound.play("tick");
        return next;
      });
    }, 200);
    return () => clearInterval(id);
  }, [phase, paused]);

  useEffect(() => {
    if (phase === "racing" && remainingMs <= 0 && !ending.current) {
      ending.current = true;
      sound.play("timeup");
      end(decideRace([teams[0].steps, teams[1].steps], race.finishSteps, true)!);
    }
  }, [remainingMs, phase, teams, race.finishSteps, end]);

  // Per-team input locks, updated synchronously so two touches in the same instant are both handled.
  const busy = useRef<[boolean, boolean]>([false, false]);
  const ending = useRef(false);

  /** Answers are handled per team; one side never waits for the other. */
  const answer = (t: 0 | 1, choice: number) => {
    if (phase !== "racing" || paused || busy.current[t] || ending.current) return;
    busy.current[t] = true;
    const seq = seqOf(t);
    setTeams((cur) => {
      const team = cur[t];
      const q = seq[team.index % seq.length];
      const ok = choice === q.correctIndex;
      const c = [...cur] as [TeamState, TeamState];
      c[t] = {
        ...team,
        picked: choice,
        feedback: ok ? "correct" : "wrong",
        steps: team.steps + (ok ? 1 : 0),
        correct: team.correct + (ok ? 1 : 0),
        wrong: team.wrong + (ok ? 0 : 1),
      };
      return c;
    });
    const q = seq[teamsRef.current[t].index % seq.length];
    const ok = choice === q.correctIndex;
    sound.play(ok ? "engine" : "wrong");
    later(() => {
      setTeams((cur) => {
        const c = [...cur] as [TeamState, TeamState];
        c[t] = { ...c[t], index: c[t].index + 1, picked: null, feedback: null };
        return c;
      });
      busy.current[t] = false;
    }, ok ? 750 : 1400);
  };

  // A car crossed the line: stop the race for both teams.
  useEffect(() => {
    if (phase !== "racing" || ending.current) return;
    const o = decideRace([teams[0].steps, teams[1].steps], race.finishSteps, false);
    if (!o) return;
    ending.current = true;
    later(() => end(o), 700); // let the car reach the line first
  }, [teams, phase, race.finishSteps, end]);

  const finish = () => {
    const ts = teams.map((s, i) => ({ name: names[i], color: SIDES[i].color, score: s.correct * settings.pointsPerCorrect, correct: s.correct, wrong: s.wrong }));
    onFinish({
      correct: teams[0].correct + teams[1].correct,
      wrong: teams[0].wrong + teams[1].wrong,
      score: ts[0].score + ts[1].score,
      teams: ts,
      winner: outcome?.winner != null ? names[outcome.winner] : undefined,
    });
  };

  const start = () => {
    ending.current = false;
    busy.current = [false, false];
    setRemainingMs(race.durationSec * 1000);
    setTeams([freshTeam(), freshTeam()]);
    setCount(3);
    setPhase("countdown");
    sound.play("whoosh");
  };

  if (phase === "setup") return <RaceSetup race={race} onChange={setRace} names={names} onStart={start} n={n} />;

  const secs = Math.ceil(remainingMs / 1000);
  return (
    <div className="relative flex size-full flex-col" data-testid="race-split">
      <Confetti fire={fire} />
      {/* Shared match timer */}
      <div className="z-20 flex items-center justify-center gap-3 bg-hero-ink py-1.5 text-white">
        <span className="font-display text-lg font-bold" style={{ color: SIDES[0].color }}>{names[0]}</span>
        <span
          className={cn("flex items-center gap-2 rounded-2xl px-5 py-1 font-display text-4xl font-extrabold tabular-nums md:text-5xl", secs <= 10 && phase === "racing" ? "animate-pulse bg-hero-red" : "bg-white/15")}
          role="timer"
          aria-label="الوقت المتبقي للسباق"
          data-testid="race-timer"
        >
          <Timer className="size-8" /> {n(formatDuration(remainingMs))}
        </span>
        <span className="font-display text-lg font-bold" style={{ color: "#91A7FF" }}>{names[1]}</span>
      </div>

      <div className="relative grid min-h-0 flex-1 grid-cols-2">
        {([0, 1] as const).map((t) => (
          <TeamSide
            key={t}
            side={t}
            name={names[t]}
            state={teams[t]}
            question={seqOf(t)[teams[t].index % seqOf(t).length]}
            finishSteps={race.finishSteps}
            locked={phase !== "racing" || paused}
            onAnswer={(c) => answer(t, c)}
            ltr={isEnglish}
            n={n}
          />
        ))}
        {/* Divider */}
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-3 -translate-x-1/2"
          style={{ background: "repeating-linear-gradient(0deg, #25304B 0 12px, #fff 12px 24px)" }}
          aria-hidden
        />
      </div>

      <AnimatePresence>
        {phase === "countdown" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-hero-ink/40">
            <motion.span
              key={count}
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="font-display text-[10rem] font-extrabold text-white drop-shadow-2xl"
              data-testid="race-countdown"
            >
              {count > 0 ? n(count) : "انطلق!"}
            </motion.span>
          </motion.div>
        )}
        {phase === "over" && outcome && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 flex items-center justify-center bg-hero-ink/50 p-6 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.3, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="flex flex-col items-center gap-3 rounded-[2rem] bg-white px-10 py-8 text-center shadow-2xl"
            >
              <Trophy className="size-24 fill-hero-yellow text-[#E67700]" />
              <h2
                className="font-display text-4xl font-extrabold md:text-6xl"
                style={{ color: outcome.winner === null ? undefined : SIDES[outcome.winner].color }}
                data-testid="race-winner"
              >
                {outcome.winner === null ? "تعادل بين الفريقين!" : `${names[outcome.winner]} هو البطل!`}
              </h2>
              <p className="text-xl text-hero-muted">
                {outcome.reason === "finish" ? "وصل إلى خط النهاية أولًا" : "انتهى الوقت"} • {names[0]} {n(teams[0].steps)} — {names[1]} {n(teams[1].steps)}
              </p>
              <Button size="xl" variant="success" onClick={finish}>عرض النتائج</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamSide({
  side,
  name,
  state,
  question,
  finishSteps,
  locked,
  onAnswer,
  ltr,
  n,
}: {
  side: 0 | 1;
  name: string;
  state: TeamState;
  question: PlayableQuestion;
  finishSteps: number;
  locked: boolean;
  onAnswer: (choice: number) => void;
  ltr: boolean;
  n: (v: number | string) => string;
}) {
  const s = SIDES[side];
  const revealed = state.feedback !== null;
  return (
    <section className="relative flex min-h-0 flex-col" style={{ background: s.soft }} aria-label={name} data-testid={`race-side-${s.key}`}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-white" style={{ background: s.color }}>
        <span className="truncate font-display text-xl font-extrabold md:text-2xl">{name}</span>
        <div className="flex flex-1 justify-center gap-1" aria-label={`التقدم ${state.steps} من ${finishSteps}`} data-testid={`race-progress-${s.key}`} data-steps={state.steps}>
          {Array.from({ length: finishSteps }, (_, k) => (
            <span key={k} className={cn("h-3 max-w-8 flex-1 rounded-full", k < state.steps ? "bg-white" : "bg-white/30")} />
          ))}
        </div>
        <span className="font-display text-xl font-extrabold tabular-nums">🏁 {n(state.steps)}/{n(finishSteps)}</span>
      </div>
      <div className="relative min-h-[22vh] flex-1">
        <RaceLane color={s.color} progress={Math.min(1, state.steps / finishSteps)} />
        <AnimatePresence>
          {state.feedback && (
            <motion.span
              key={`${state.index}-${state.feedback}`}
              initial={{ scale: 0.4, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn("absolute left-1/2 top-4 -translate-x-1/2 rounded-2xl px-5 py-2 font-display text-2xl font-extrabold text-white shadow-xl md:text-3xl", state.feedback === "correct" ? "bg-hero-green" : "bg-hero-orange")}
            >
              {state.feedback === "correct" ? "أحسنت! انطلق 🚀" : "حاول مرة أخرى!"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className={cn("flex flex-col gap-2 p-2 md:p-3", ltr && "ltr-content")}>
        <h3
          className="rounded-2xl bg-white px-3 py-2 text-center font-display text-2xl font-extrabold leading-snug md:text-3xl"
          dir={isMathExpression(question.prompt) ? "ltr" : undefined}
          data-testid={`race-question-${s.key}`}
        >
          {question.prompt}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {question.choices.map((c, i) => {
            const isCorrect = i === question.correctIndex;
            return (
              <motion.button
                key={`${state.index}-${i}`}
                type="button"
                disabled={locked || revealed}
                // pointerdown (not click) so two teams touching at the same moment both register.
                onPointerDown={(e) => {
                  e.preventDefault();
                  onAnswer(i);
                }}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onAnswer(i))}
                animate={revealed && i === state.picked && !isCorrect ? { x: [0, -10, 10, -6, 6, 0] } : {}}
                className={cn(
                  "btn-3d min-h-20 touch-manipulation select-none rounded-2xl px-2 font-display text-3xl font-extrabold text-white disabled:cursor-default md:min-h-24 md:text-4xl",
                  revealed && isCorrect ? "bg-hero-green" : revealed && i === state.picked ? "bg-hero-red" : "",
                  revealed && !isCorrect && i !== state.picked && "opacity-40",
                )}
                style={!revealed ? { background: s.color } : undefined}
                data-testid={`race-choice-${s.key}`}
              >
                {c}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RaceSetup({ race, onChange, names, onStart, n }: { race: RaceSettings; onChange: (r: RaceSettings) => void; names: string[]; onStart: () => void; n: (v: number | string) => string }) {
  const custom = !RACE_DURATIONS.includes(race.durationSec);
  const errors = validateRaceSettings(race);
  return (
    <div className="flex size-full flex-col items-center justify-center gap-6 overflow-y-auto p-6" data-testid="race-setup">
      <h2 className="font-display text-4xl font-extrabold md:text-5xl">إعداد السباق</h2>
      <div className="flex items-center gap-4 font-display text-2xl font-extrabold">
        <span className="rounded-2xl px-5 py-2 text-white" style={{ background: SIDES[0].color }}>{names[0]} ➜ يمين الشاشة</span>
        <span className="rounded-2xl px-5 py-2 text-white" style={{ background: SIDES[1].color }}>{names[1]} ➜ يسار الشاشة</span>
      </div>
      <div className="flex w-full max-w-3xl flex-col gap-5 rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2" role="group" aria-label="مدة السباق">
          <span className="font-display text-xl font-bold">مدة السباق</span>
          <Segmented
            value={custom ? 0 : race.durationSec}
            onChange={(v) => onChange({ ...race, durationSec: v || 120 })}
            options={[...RACE_DURATIONS.map((d) => ({ value: d, label: d === 60 ? "دقيقة واحدة" : `${n(d / 60)} دقائق` })), { value: 0, label: "مدة مخصصة" }]}
          />
          {custom && (
            <label className="flex items-center gap-2">
              عدد الدقائق
              <input
                type="number"
                min={0.5}
                max={60}
                step={0.5}
                className={`${inputClass} w-28`}
                value={race.durationSec / 60}
                aria-label="عدد دقائق السباق"
                onChange={(e) => onChange({ ...race, durationSec: Math.round((Number(e.target.value) || 0) * 60) })}
              />
            </label>
          )}
        </div>
        <div className="flex flex-col gap-2" role="group" aria-label="خط النهاية">
          <span className="font-display text-xl font-bold">عدد الإجابات الصحيحة للوصول إلى خط النهاية</span>
          <Segmented
            value={race.finishSteps}
            onChange={(v) => onChange({ ...race, finishSteps: v })}
            options={[4, 6, 8, 10, 15].map((v) => ({ value: v, label: n(v) }))}
          />
        </div>
        {errors.length > 0 && <p className="text-hero-red" role="alert">{errors[0]}</p>}
        <p className="text-hero-muted">يلعب الفريقان في الوقت نفسه، ولكل فريق أسئلته الخاصة بالمستوى نفسه من الصعوبة. الإجابة الخاطئة لا تحرّك السيارة.</p>
      </div>
      <Button size="xl" variant="success" icon={<Flag className="size-8" />} disabled={errors.length > 0} onClick={onStart}>
        ابدأ السباق
      </Button>
    </div>
  );
}
