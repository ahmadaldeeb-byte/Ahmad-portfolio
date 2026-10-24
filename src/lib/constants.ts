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
  /** The game generates its own questions from settings (no question list). */
  generated?: boolean;
  /** Subjects the game belongs to; all subjects when omitted. */
  subjects?: Subject[];
  /** Grades the ready-made versions are prepared for; all grades when omitted. */
  grades?: Grade[];
  /**
   * Math games whose world also plays question-bank questions in the other
   * subjects (Arabic, science, English): the name and description used there.
   */
  bank?: { name: string; description: string; howTo: string[] };
}

const CHOICE_KINDS: QuestionKind[] = ["mcq", "truefalse", "arithmetic"];
const bank = (name: string, description: string) => ({
  name,
  description,
  howTo: ["اقرأ السؤال واختر الإجابة الصحيحة من الأزرار.", "كل إجابة صحيحة تقدّمك في عالم اللعبة.", "في الوضع التعليمي يمكنك المحاولة مرة أخرى بلا خصم."],
});

export const GAMES: GameMeta[] = [
  { type: "wheel", name: "عجلة الأبطال", description: "عجلة ملوّنة تدور وتختار سؤالًا أو اسم طالب بعدل تام.", genre: "حظ وتحدٍّ", dimension: "2D", ready: true, kinds: CHOICE_KINDS, minQuestions: 2, teamBased: true, accent: "#FFD43B" },
  { type: "race", name: "سباق الأذكياء", description: "كل إجابة صحيحة تدفع سيارة فريقك نحو خط النهاية.", genre: "سباق فرق", dimension: "3D", ready: true, kinds: CHOICE_KINDS, minQuestions: 3, teamBased: true, accent: "#4361EE" },
  { type: "balloons", name: "بالونات المعرفة", description: "افقع البالون الذي يحمل الإجابة الصحيحة!", genre: "سرعة وملاحظة", dimension: "2D", ready: true, kinds: CHOICE_KINDS, minQuestions: 2, teamBased: false, accent: "#FF6B9A" },
  { type: "memory", name: "ذاكرة الأبطال", description: "اقلب البطاقات وطابق كل زوج مترابط.", genre: "ذاكرة", dimension: "2D", ready: true, kinds: ["match"], minQuestions: 1, teamBased: false, accent: "#7950F2" },
  { type: "quiz", name: "من بطل المعرفة؟", description: "مسابقة اختيار من متعدد مع مؤقت وشريط تقدّم.", genre: "مسابقة", dimension: "2D", ready: true, kinds: CHOICE_KINDS, minQuestions: 3, teamBased: false, accent: "#40C057" },
  { type: "words", name: "صانع الكلمات", description: "رتّب الحروف لتكوّن الكلمة الصحيحة.", genre: "لغة", dimension: "2D", ready: true, kinds: ["order"], minQuestions: 2, teamBased: false, accent: "#FF922B", subjects: ["arabic", "english"] },
  { type: "numbers", name: "أبطال الأرقام", description: "حلّ المسائل لتتقدّم في مغامرة الأرقام.", genre: "مغامرة", dimension: "2D", ready: true, kinds: ["arithmetic", "mcq", "truefalse"], minQuestions: 3, teamBased: false, accent: "#20A4C9", subjects: ["math"] },
  { type: "puzzle", name: "أبطال الألغاز", description: "أجب لتربح قطع الصورة، ثم ركّب كل قطعة في مكانها.", genre: "ألغاز", dimension: "2D", ready: true, kinds: CHOICE_KINDS, minQuestions: 4, teamBased: false, accent: "#E64980" },
  { type: "space", name: "رحلة إلى النجوم", description: "سافر بمركبتك بين الكواكب بالإجابة عن الأسئلة.", genre: "مغامرة فضائية", dimension: "3D", ready: true, kinds: CHOICE_KINDS, minQuestions: 3, teamBased: false, accent: "#5C3FD9" },
  { type: "train", name: "قطار الأرقام السحري", description: "أكمل الأعداد الناقصة في عربات القطار: السابق والتالي والعدد الناقص.", genre: "أعداد متتالية", dimension: "3D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#E8590C", generated: true, subjects: ["math"] },
  { type: "island", name: "جزيرة الأرقام", description: "اجمع العدد المطلوب من الثمار في السلة وتعلّم العد.", genre: "العد والأعداد", dimension: "2D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#20A4C9", generated: true, bank: bank("جزيرة الثمار", "كل إجابة صحيحة تضيف ثمرة إلى سلة الجزيرة.") },
  { type: "crocodile", name: "التمساح الجائع", description: "قارن بين المجموعات والأعداد بالرموز > و< و=.", genre: "مقارنة الأعداد", dimension: "2D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#2F9E44", generated: true, bank: bank("التمساح الجائع", "أطعم التمساح سمكة مع كل إجابة صحيحة حتى يشبع.") },
  { type: "rocket", name: "صاروخ الجمع", description: "املأ خزان الوقود بإجابات الجمع لينطلق الصاروخ إلى كوكب جديد.", genre: "الجمع", dimension: "3D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#5C3FD9", generated: true, bank: bank("صاروخ المعرفة", "املأ خزان الوقود بالإجابات الصحيحة لينطلق الصاروخ إلى كوكب جديد.") },
  { type: "appleBasket", name: "سلة التفاح", description: "خذ التفاحات من الشجرة إلى السلة وعدّ الباقي.", genre: "الطرح", dimension: "2D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#E03131", generated: true, bank: bank("سلة التفاح", "كل إجابة صحيحة تُسقط تفاحة من الشجرة في السلة.") },
  { type: "factory", name: "مصنع الأعداد", description: "ابنِ الأعداد بحزم العشرات ومكعبات الآحاد.", genre: "الآحاد والعشرات", dimension: "2D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#E67700", generated: true, bank: bank("مصنع الأبطال", "كل إجابة صحيحة تصنع لعبة جديدة على خط المصنع.") },
  { type: "raceAdd", name: "سباق الجمع", description: "سباق فريقين على شاشة مقسومة بعمليات جمع ضمن منزلتين.", genre: "الجمع ضمن منزلتين", dimension: "3D", ready: true, kinds: [], minQuestions: 0, teamBased: true, accent: "#1C7ED6", generated: true, subjects: ["math"] },
  { type: "pirates", name: "كنز القراصنة", description: "حلّ مسائل الطرح لتحصل على المفاتيح وتفتح الأبواب حتى الكنز.", genre: "الطرح", dimension: "2D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#862E9C", generated: true, bank: bank("كنز القراصنة", "أجب لتحصل على المفاتيح وتفتح الأبواب حتى الكنز.") },
  { type: "shapes", name: "مدينة الأشكال", description: "تعرّف على الأشكال والمجسمات وابنِ مدينة ملوّنة.", genre: "الهندسة", dimension: "3D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#0CA678", generated: true, bank: bank("مدينة الأبطال", "كل إجابة صحيحة تبني مبنى في المدينة.") },
  { type: "pizza", name: "مطعم البيتزا", description: "قسّم البيتزا إلى أجزاء متساوية وقدّم النصف والربع.", genre: "الكسور", dimension: "2D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#F76707", generated: true, bank: bank("مطعم البيتزا", "كل إجابة صحيحة تضيف قطعة إلى البيتزا حتى تكتمل.") },
  { type: "market", name: "السوق الصغير", description: "اشترِ المنتجات وادفع ثمنها بالقطع النقدية الأردنية.", genre: "النقود", dimension: "2D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#D6336C", generated: true, bank: bank("السوق الصغير", "اربح قطعة نقدية مع كل إجابة صحيحة واملأ حصّالتك.") },
  { type: "clock", name: "ساعة المغامرات", description: "اقرأ الساعة واضبط عقاربها لتنظيم يوم فارس.", genre: "الزمن", dimension: "2D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#3B5BDB", generated: true, bank: bank("ساعة المغامرات", "كل إجابة صحيحة تقدّم عقارب الساعة في يوم فارس.") },
  { type: "measure", name: "مختبر القياس", description: "قارن الأطوال والكتل والسعات بالميزان والأدوات.", genre: "القياس", dimension: "2D", ready: true, kinds: [], minQuestions: 0, teamBased: false, accent: "#495057", generated: true, bank: bank("ميزان المعرفة", "كل إجابة صحيحة تضيف ثقلًا إلى كفّة الأبطال.") },
  { type: "teams", name: "معركة الأبطال", description: "منافسة مباشرة بين الفريق الأحمر والفريق الأزرق.", genre: "تحدي فرق", dimension: "2D", ready: true, kinds: CHOICE_KINDS, minQuestions: 4, teamBased: true, accent: "#FA5252" },
];

export const gameMeta = (t: GameType): GameMeta => GAMES.find((g) => g.type === t)!;

/**
 * The game as it plays in a subject: math games generate their own tasks in
 * math, and play question-bank questions (multiple choice / true-false) in
 * the other subjects under their «bank» name.
 */
export function gameMetaFor(t: GameType, subject: Subject): GameMeta {
  const meta = gameMeta(t);
  if (!meta.bank || subject === "math") return meta;
  return { ...meta, name: meta.bank.name, description: meta.bank.description, genre: "أسئلة ومغامرة", generated: false, kinds: CHOICE_KINDS, minQuestions: 3, subjects: undefined };
}
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

export const ENCOURAGEMENTS = ["أحسنت!", "إجابة رائعة!", "أنت بطل!", "ممتاز!", "رائع جدًا!", "لقد نجحت!", "رائع يا بطل!", "إجابة صحيحة!"];
export const TRY_AGAIN = "حاول مرة أخرى!";
