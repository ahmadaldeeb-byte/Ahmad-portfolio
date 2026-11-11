import { defaultSettings } from "@/content/seed";
import { DEFAULT_TEAM_NAMES, GAMES, TEAM_COLORS, gameMeta } from "../constants";
import type { GameConfig, GameType, Grade, Question, Subject } from "../types";
import { normalizeDigits, shuffle, uid } from "../utils";

/**
 * Future "AI Game Generator" extension point.
 *
 * A teacher writes a request such as:
 *   «أنشئ لعبة سباق سيارات للصف الثاني عن الجمع والطرح، تحتوي على 10 أسئلة وفريقين»
 * and a generator returns a DRAFT game. Drafts are never played or saved
 * directly: they must open in the creation wizard for the teacher to review
 * and approve every question first.
 *
 * The platform ships only the offline generator below (rule-based, using the
 * local question bank). A cloud/LLM provider can implement the same interface
 * later without changing the rest of the app.
 */
export interface GameDraft {
  game: GameConfig;
  /** Always true: the teacher must review before the draft is used. */
  needsReview: true;
  notes: string[];
}

export interface GameGenerator {
  readonly id: string;
  readonly requiresNetwork: boolean;
  generate(request: string, bank: Question[]): Promise<GameDraft>;
}

export interface ParsedRequest {
  grade?: Grade;
  subject?: Subject;
  type?: GameType;
  count?: number;
  teams?: number;
  topic?: string;
}

const GRADE_WORDS: [RegExp, Grade][] = [
  [/(ال|لل)صف\s*(الأول|1)/, 1],
  [/(ال|لل)صف\s*(الثاني|2)/, 2],
  [/(ال|لل)صف\s*(الثالث|3)/, 3],
];
const SUBJECT_WORDS: [RegExp, Subject][] = [
  [/الإنجليزي|الانجليزي|English/i, "english"],
  [/العلوم/, "science"],
  [/الرياضيات|الجمع|الطرح|الضرب|القسمة|الأعداد/, "math"],
  [/العربية|الحروف|الكلمات|القراءة/, "arabic"],
];
const TYPE_WORDS: [RegExp, GameType][] = [
  [/سباق|سيارات/, "race"],
  [/عجلة/, "wheel"],
  [/بالون/, "balloons"],
  [/ذاكرة/, "memory"],
  [/مسابقة|بطل المعرفة/, "quiz"],
  [/ترتيب الحروف|صانع الكلمات/, "words"],
  [/فضاء|النجوم/, "space"],
  [/معركة|تحدي الفريقين/, "teams"],
];

export function parseRequest(text: string): ParsedRequest {
  const t = normalizeDigits(text);
  const r: ParsedRequest = {};
  r.grade = GRADE_WORDS.find(([re]) => re.test(t))?.[1];
  r.subject = SUBJECT_WORDS.find(([re]) => re.test(t))?.[1];
  r.type = TYPE_WORDS.find(([re]) => re.test(t))?.[1];
  const count = /(\d+)\s*(سؤال|أسئلة|سؤالًا)/.exec(t);
  if (count) r.count = Number(count[1]);
  if (/فريقين|فريقان/.test(t)) r.teams = 2;
  const teams = /(\d+)\s*فرق/.exec(t);
  if (teams) r.teams = Number(teams[1]);
  const topic = /عن\s+([^،,.]+?)(?:\s*[،,.]|\s+تحتوي|\s+فيها|$)/.exec(t);
  if (topic) r.topic = topic[1].trim();
  return r;
}

/** Offline generator: picks matching questions from the local bank. */
export const offlineGenerator: GameGenerator = {
  id: "offline",
  requiresNetwork: false,
  async generate(request, bank) {
    const p = parseRequest(request);
    const notes: string[] = [];
    let type = p.type ?? "quiz";
    if (!gameMeta(type).ready) {
      notes.push(`لعبة «${gameMeta(type).name}» غير متاحة بعد، فاختيرت «عجلة الأبطال» بدلًا منها.`);
      type = "wheel";
    }
    const meta = GAMES.find((g) => g.type === type)!;
    const grade = p.grade ?? 1;
    const subject = p.subject ?? "arabic";
    if (!p.grade) notes.push("لم يُحدَّد الصف؛ اختير الصف الأول.");
    if (!p.subject) notes.push("لم تُحدَّد المادة؛ اختيرت اللغة العربية.");
    const words = (p.topic ?? "").split(/\s+و?|\s*و\s*/).filter((w) => w.length > 2);
    const pool = bank.filter((q) => q.grade === grade && q.subject === subject && meta.kinds.includes(q.kind));
    const onTopic = words.length ? pool.filter((q) => words.some((w) => q.lesson.includes(w.replace(/^ال/, "")) || q.prompt.includes(w))) : pool;
    const source = onTopic.length >= meta.minQuestions ? onTopic : pool;
    if (source === pool && words.length) notes.push("لم توجد أسئلة كافية عن الموضوع المطلوب؛ أضيفت أسئلة أخرى من المادة نفسها.");
    const count = Math.min(p.count ?? 10, source.length);
    if (p.count && count < p.count) notes.push(`وُجد ${count} سؤالًا فقط مناسبًا في بنك الأسئلة.`);
    const settings = defaultSettings(type);
    if (meta.teamBased && p.teams) {
      const n = Math.min(4, Math.max(2, p.teams));
      settings.teams = Array.from({ length: n }, (_, i) => ({ name: DEFAULT_TEAM_NAMES[i], color: TEAM_COLORS[i] }));
    }
    const now = Date.now();
    return {
      needsReview: true,
      notes,
      game: {
        id: uid("g_"),
        title: `${meta.name} — ${p.topic ?? "مراجعة"}`,
        grade,
        subject,
        lesson: p.topic ?? "مراجعة",
        type,
        difficulty: 1,
        questions: shuffle(source).slice(0, count).map((q) => ({ ...q, id: uid("q_") })),
        settings,
        createdAt: now,
        updatedAt: now,
      },
    };
  },
};
