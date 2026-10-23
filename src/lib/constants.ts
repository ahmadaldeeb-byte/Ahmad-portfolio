import type { GameType, Grade, QuestionKind, Subject } from "./types";

export const GRADES: { id: Grade; label: string; short: string; color: string; gradient: string }[] = [
  { id: 1, label: "الصف الأول", short: "الأول", color: "#4361EE", gradient: "from-[#4361EE] to-[#7950F2]" },
  { id: 2, label: "الصف الثاني", short: "الثاني", color: "#40C057", gradient: "from-[#40C057] to-[#20A4C9]" },
  { id: 3, label: "الصف الثالث", short: "الثالث", color: "#FF6B9A", gradient: "from-[#FF6B9A] to-[#FF922B]" },
];

export const SUBJECTS: { id: Subject; label: string; emoji: string; color: string }[] = [
  { id: "arabic", label: "اللغة العربية", emoji: "📖", color: "#7950F2" },
  { id: "math", label: "الرياضيات", emoji: "🔢", color: "#4361EE" },
  { id: "science", label: "العلوم", emoji: "🔬", color: "#40C057" },
  { id: "english", label: "اللغة الإنجليزية", emoji: "🔤", color: "#FF6B9A" },
];

export interface GameMeta {
  type: GameType;
  name: string;
  description: string;
  genre: string;
  dimension: "2D" | "3D";
  /** Whether the game is playable in this release. */
  ready: boolean;
  /** Question kinds the game can play. */
  kinds: QuestionKind[];
  minQuestions: number;
  teamBased: boolean;
  accent: string;
}

const CHOICE_KINDS: QuestionKind[] = ["mcq", "truefalse", "arithmetic"];

export const GAMES: GameMeta[] = [
  { type: "wheel", name: "عجلة الأبطال", description: "عجلة ملوّنة تدور وتختار سؤالًا أو اسم طالب بعدل تام.", genre: "حظ وتحدٍّ", dimension: "2D", ready: true, kinds: CHOICE_KINDS, minQuestions: 2, teamBased: true, accent: "#FFD43B" },
  { type: "race", name: "سباق الأذكياء", description: "كل إجابة صحيحة تدفع سيارة فريقك نحو خط النهاية.", genre: "سباق فرق", dimension: "3D", ready: true, kinds: CHOICE_KINDS, minQuestions: 3, teamBased: true, accent: "#4361EE" },
  { type: "balloons", name: "بالونات المعرفة", description: "افقع البالون الذي يحمل الإجابة الصحيحة!", genre: "سرعة وملاحظة", dimension: "2D", ready: true, kinds: CHOICE_KINDS, minQuestions: 2, teamBased: false, accent: "#FF6B9A" },
  { type: "memory", name: "ذاكرة الأبطال", description: "اقلب البطاقات وطابق كل زوج مترابط.", genre: "ذاكرة", dimension: "2D", ready: false, kinds: ["match"], minQuestions: 1, teamBased: false, accent: "#7950F2" },
  { type: "quiz", name: "من بطل المعرفة؟", description: "مسابقة اختيار من متعدد مع مؤقت وشريط تقدّم.", genre: "مسابقة", dimension: "2D", ready: true, kinds: CHOICE_KINDS, minQuestions: 3, teamBased: false, accent: "#40C057" },
  { type: "words", name: "صانع الكلمات", description: "رتّب الحروف لتكوّن الكلمة الصحيحة.", genre: "لغة", dimension: "2D", ready: false, kinds: ["order"], minQuestions: 2, teamBased: false, accent: "#FF922B" },
  { type: "numbers", name: "أبطال الأرقام", description: "حلّ المسائل لتتقدّم في مغامرة الأرقام.", genre: "مغامرة", dimension: "2D", ready: false, kinds: ["arithmetic", "mcq"], minQuestions: 3, teamBased: false, accent: "#20A4C9" },
  { type: "puzzle", name: "أبطال الألغاز", description: "ركّب أجزاء الصورة التعليمية في مكانها.", genre: "ألغاز", dimension: "2D", ready: false, kinds: ["mcq"], minQuestions: 1, teamBased: false, accent: "#E64980" },
  { type: "space", name: "رحلة إلى النجوم", description: "سافر بمركبتك بين الكواكب بالإجابة عن الأسئلة.", genre: "مغامرة فضائية", dimension: "3D", ready: false, kinds: CHOICE_KINDS, minQuestions: 3, teamBased: false, accent: "#5C3FD9" },
  { type: "teams", name: "معركة الأبطال", description: "منافسة مباشرة بين الفريق الأحمر والفريق الأزرق.", genre: "تحدي فرق", dimension: "2D", ready: true, kinds: CHOICE_KINDS, minQuestions: 4, teamBased: true, accent: "#FA5252" },
];

export const gameMeta = (t: GameType): GameMeta => GAMES.find((g) => g.type === t)!;
export const gradeLabel = (g: Grade) => GRADES.find((x) => x.id === g)!.label;
export const subjectLabel = (s: Subject) => SUBJECTS.find((x) => x.id === s)!.label;

export const KIND_LABELS: Record<QuestionKind, string> = {
  mcq: "اختيار من متعدد",
  truefalse: "صح أو خطأ",
  order: "ترتيب الحروف/الكلمات",
  match: "مطابقة العناصر",
  arithmetic: "عملية حسابية",
};

export const DIFFICULTY_LABELS = { 1: "سهل", 2: "متوسط", 3: "صعب" } as const;

export const TEAM_COLORS = ["#FA5252", "#4361EE", "#40C057", "#FFD43B"];
export const DEFAULT_TEAM_NAMES = ["الفريق الأحمر", "الفريق الأزرق", "الفريق الأخضر", "الفريق الأصفر"];

export const ENCOURAGEMENTS = ["أحسنت!", "إجابة رائعة!", "أنت بطل!", "ممتاز!", "رائع جدًا!", "لقد نجحت!"];
export const TRY_AGAIN = "حاول مرة أخرى!";
