import type { Difficulty, GameConfig, GameType, Grade, Question, Subject } from "@/lib/types";
import { DEFAULT_TEAM_NAMES, GAMES, TEAM_COLORS, gradeLabel, subjectLabel } from "@/lib/constants";

/*
 * Sample classroom content for grades 1–3. It is written to suit the age group
 * but is NOT claimed to match any official curriculum (e.g. the Jordanian one);
 * teachers should review and adapt it to their approved textbooks.
 */

const SEED_TIME = Date.UTC(2026, 0, 1);

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

type Ctx = { grade: Grade; subject: Subject };
let counter = 0;

function base(ctx: Ctx, lesson: string, difficulty: Difficulty) {
  counter++;
  return {
    id: `seed_${ctx.grade}_${ctx.subject}_${counter}`,
    grade: ctx.grade,
    subject: ctx.subject,
    lesson,
    difficulty,
    createdAt: SEED_TIME + counter,
    updatedAt: SEED_TIME + counter,
  };
}

/** Multiple choice: the first option is the correct one; its position is then varied deterministically. */
function mcq(ctx: Ctx, lesson: string, prompt: string, options: string[], difficulty: Difficulty = 1): Question {
  const pos = hash(prompt) % options.length;
  const choices = options.slice(1);
  choices.splice(pos, 0, options[0]);
  return { ...base(ctx, lesson, difficulty), kind: "mcq", prompt, choices, correctIndex: pos };
}

function tf(ctx: Ctx, lesson: string, prompt: string, isTrue: boolean, difficulty: Difficulty = 1): Question {
  return { ...base(ctx, lesson, difficulty), kind: "truefalse", prompt, choices: ["صح", "خطأ"], correctIndex: isTrue ? 0 : 1 };
}

function arith(ctx: Ctx, lesson: string, expr: string, difficulty: Difficulty = 1): Question {
  return { ...base(ctx, lesson, difficulty), kind: "arithmetic", prompt: expr, choices: [], correctIndex: 0 };
}

function order(ctx: Ctx, lesson: string, prompt: string, answer: string, difficulty: Difficulty = 1): Question {
  return { ...base(ctx, lesson, difficulty), kind: "order", prompt, answer, choices: [], correctIndex: 0 };
}

function grade1(): Question[] {
  const ar: Ctx = { grade: 1, subject: "arabic" };
  const ma: Ctx = { grade: 1, subject: "math" };
  const sc: Ctx = { grade: 1, subject: "science" };
  const en: Ctx = { grade: 1, subject: "english" };
  return [
    mcq(ar, "الحروف", "ما الحرف الأول في كلمة «بَطّة»؟", ["ب", "ت", "ط", "ة"]),
    mcq(ar, "الحروف", "ما الحرف الأول في كلمة «شَمْس»؟", ["ش", "س", "م", "ص"]),
    mcq(ar, "الحروف", "أيّ كلمة تبدأ بحرف الميم؟", ["مَوْز", "تُفّاح", "عِنَب", "بُرتُقال"]),
    mcq(ar, "الحروف", "ما الحرف الأخير في كلمة «قَلَم»؟", ["م", "ل", "ق", "ن"]),
    mcq(ar, "الحركات", "ما الحركة على حرف الباء في «بَ»؟", ["الفتحة", "الضمة", "الكسرة", "السكون"]),
    mcq(ar, "الحركات", "ما الحركة على حرف السين في «سُ»؟", ["الضمة", "الفتحة", "الكسرة", "الشدة"]),
    mcq(ar, "الحركات", "أيّ حرف عليه كسرة؟", ["دِ", "دَ", "دُ", "دْ"]),
    mcq(ar, "تكوين الكلمات", "رَ + ا + مِ + ي = ؟", ["رامي", "رمي", "مرا", "يرام"]),
    mcq(ar, "تكوين الكلمات", "بَ + ا + بٌ = ؟", ["بابٌ", "بُوب", "بيت", "أب"]),
    mcq(ar, "قراءة الكلمات", "أيّ كلمة تدلّ على حيوان؟", ["أَسَد", "كُرْسي", "شَجَرة", "قَمَر"]),
    tf(ar, "قراءة الكلمات", "كلمة «وَرْدة» تبدأ بحرف الواو.", true),
    tf(ar, "الحروف", "كلمة «نَجْمة» تبدأ بحرف التاء.", false),
    order(ar, "تكوين الكلمات", "رتّب الحروف لتكوّن كلمة", "قَلَم"),
    order(ar, "تكوين الكلمات", "رتّب الحروف لتكوّن كلمة", "بَيْت"),

    arith(ma, "الجمع", "2 + 3"),
    arith(ma, "الجمع", "4 + 5"),
    arith(ma, "الجمع", "6 + 2"),
    arith(ma, "الجمع", "7 + 3", 2),
    arith(ma, "الطرح", "5 - 2"),
    arith(ma, "الطرح", "9 - 4"),
    arith(ma, "الطرح", "10 - 6", 2),
    mcq(ma, "الأعداد", "ما العدد الذي يأتي بعد ٧؟", ["8", "6", "9", "5"]),
    mcq(ma, "الأعداد", "ما العدد الذي يأتي قبل ٥؟", ["4", "6", "3", "7"]),
    mcq(ma, "المقارنة", "أيّ عدد أكبر؟", ["9", "6", "3", "7"]),
    mcq(ma, "المقارنة", "أيّ عدد أصغر؟", ["2", "8", "5", "4"]),
    tf(ma, "المقارنة", "العدد ٨ أكبر من العدد ٣.", true),
    tf(ma, "الأعداد", "العدد ١٠ يأتي قبل العدد ٩.", false, 2),

    mcq(sc, "الحيوانات", "أيّ حيوان يعيش في الماء؟", ["السمكة", "القطة", "الحصان", "الأرنب"]),
    mcq(sc, "الحيوانات", "أيّ حيوان يطير؟", ["العصفور", "الفيل", "الجمل", "البقرة"]),
    mcq(sc, "الحيوانات", "ماذا تعطينا البقرة؟", ["الحليب", "العسل", "الصوف", "البيض فقط"]),
    mcq(sc, "الحيوانات", "كم رجلًا للدجاجة؟", ["2", "4", "6", "8"]),
    mcq(sc, "النباتات", "ماذا تحتاج النبتة لتنمو؟", ["الماء والضوء", "الحلوى", "الظلام فقط", "الرمل فقط"]),
    mcq(sc, "النباتات", "أيّ جزء من النبات يكون عادةً تحت التربة؟", ["الجذر", "الزهرة", "الورقة", "الثمرة"]),
    mcq(sc, "الحواس", "بأيّ عضو نرى؟", ["العين", "الأذن", "الأنف", "اللسان"]),
    mcq(sc, "الحواس", "بأيّ عضو نسمع؟", ["الأذن", "العين", "اليد", "الأنف"]),
    mcq(sc, "الحواس", "بأيّ عضو نشمّ الوردة؟", ["الأنف", "العين", "الأذن", "القدم"]),
    tf(sc, "الحواس", "نتذوق الطعام باللسان.", true),
    tf(sc, "الحيوانات", "الأرنب يعيش في البحر.", false),

    mcq(en, "Letters", "Which letter comes after A?", ["B", "C", "D", "E"]),
    mcq(en, "Letters", "Which word starts with the letter C?", ["cat", "dog", "sun", "bag"]),
    mcq(en, "Letters", "Which letter is a vowel?", ["E", "T", "M", "K"]),
    mcq(en, "Colors", "What color is the sun?", ["yellow", "blue", "black", "pink"]),
    mcq(en, "Colors", "What color is the grass?", ["green", "red", "white", "purple"]),
    mcq(en, "Colors", "What color is the sky?", ["blue", "brown", "orange", "green"]),
    mcq(en, "Numbers", "How do we write 3 in English?", ["three", "two", "four", "five"]),
    mcq(en, "Numbers", "Which number is «five»?", ["5", "3", "8", "9"]),
    mcq(en, "Simple Words", "Which word is an animal?", ["dog", "pen", "car", "cup"]),
    mcq(en, "Simple Words", "Which word is a fruit?", ["apple", "book", "ball", "chair"]),
    tf(en, "Simple Words", "«cat» is an animal.", true),
    tf(en, "Colors", "The color of milk is black.", false),
  ];
}

function grade2(): Question[] {
  const ar: Ctx = { grade: 2, subject: "arabic" };
  const ma: Ctx = { grade: 2, subject: "math" };
  const sc: Ctx = { grade: 2, subject: "science" };
  const en: Ctx = { grade: 2, subject: "english" };
  return [
    mcq(ar, "المفردات", "ما عكس كلمة «طويل»؟", ["قصير", "كبير", "سريع", "جميل"]),
    mcq(ar, "المفردات", "ما عكس كلمة «حارّ»؟", ["بارد", "دافئ", "ساخن", "جاف"]),
    mcq(ar, "المفردات", "ما معنى كلمة «سَعيد»؟", ["فرحان", "حزين", "غاضب", "نائم"]),
    mcq(ar, "المفردات", "ما جمع كلمة «كِتاب»؟", ["كُتُب", "كاتب", "مكتبة", "كتابة"], 2),
    mcq(ar, "تكوين الجمل", "أكمل: ذهبَ أحمدُ إلى ...", ["المدرسة", "يلعب", "جميلٌ", "سريعًا"]),
    mcq(ar, "تكوين الجمل", "أكمل: الشمسُ ...", ["ساطعةٌ", "يأكل", "كتابٌ", "تحت"]),
    mcq(ar, "القراءة", "أيّ كلمة فيها حرف «ظ»؟", ["ظَرْف", "ضِفْدَع", "طائِر", "زَهْرة"], 2),
    mcq(ar, "الفهم البسيط", "«سقى سامي الزرعَ في الحديقة». ماذا سقى سامي؟", ["الزرع", "القطة", "الكتاب", "الدراجة"]),
    mcq(ar, "الفهم البسيط", "«لبست مريمُ معطفها لأن الجو بارد». لماذا لبست مريم المعطف؟", ["لأن الجو بارد", "لأنها جائعة", "لأنها نائمة", "لأن الجو حار"], 2),
    tf(ar, "المفردات", "كلمة «نَهار» عكسها «لَيْل».", true),
    tf(ar, "تكوين الجمل", "الجملة «القطةُ تشربُ الحليبَ» جملة صحيحة.", true),
    tf(ar, "المفردات", "جمع كلمة «قلم» هو «قلمان».", false, 2),
    order(ar, "تكوين الجمل", "رتّب الحروف لتكوّن كلمة", "مَدْرَسة", 2),

    arith(ma, "الجمع", "23 + 15"),
    arith(ma, "الجمع", "40 + 36"),
    arith(ma, "الجمع", "28 + 14", 2),
    arith(ma, "الطرح", "45 - 12"),
    arith(ma, "الطرح", "70 - 25", 2),
    arith(ma, "الطرح", "56 - 30"),
    mcq(ma, "القيمة المنزلية", "كم عشرة في العدد ٤٧؟", ["4", "7", "47", "11"]),
    mcq(ma, "القيمة المنزلية", "ما قيمة الرقم ٣ في العدد ٣٥؟", ["30", "3", "5", "35"], 2),
    mcq(ma, "القيمة المنزلية", "٥ عشرات و ٢ آحاد = ؟", ["52", "25", "7", "502"]),
    mcq(ma, "مسائل حسابية", "مع ليلى ١٢ قلمًا، وأعطتها أمها ٥ أقلام. كم قلمًا معها الآن؟", ["17", "7", "15", "12"]),
    mcq(ma, "مسائل حسابية", "في الشجرة ٢٠ عصفورًا، طار منها ٨. كم عصفورًا بقي؟", ["12", "28", "10", "8"], 2),
    tf(ma, "القيمة المنزلية", "العدد ٦٠ فيه ٦ عشرات.", true),
    tf(ma, "الجمع", "١٠ + ١٠ = ٣٠", false),

    mcq(sc, "الكائنات الحية", "أيّ مما يلي كائن حيّ؟", ["الشجرة", "الحجر", "الكرسي", "الكرة"]),
    mcq(sc, "الكائنات الحية", "ماذا تحتاج الكائنات الحية لتعيش؟", ["الماء والغذاء والهواء", "الألعاب", "الكهرباء", "التلفاز"]),
    mcq(sc, "الكائنات الحية", "أيّ حيوان يغطي جسمه الريش؟", ["الحمامة", "القطة", "السمكة", "الأفعى"]),
    mcq(sc, "أجزاء النبات", "أيّ جزء من النبات يصنع الغذاء؟", ["الورقة", "الجذر", "البذرة", "الساق"], 2),
    mcq(sc, "أجزاء النبات", "ما وظيفة الجذر؟", ["امتصاص الماء من التربة", "صنع الألوان", "جذب النحل", "الطيران"]),
    mcq(sc, "أجزاء النبات", "أيّ جزء يحمل الأوراق والأزهار؟", ["الساق", "الجذر", "التربة", "البذرة"]),
    mcq(sc, "البيئة", "ماذا نفعل لنحافظ على نظافة البيئة؟", ["نضع النفايات في السلة", "نرمي النفايات في الشارع", "نقطع الأشجار", "نترك الماء مفتوحًا"]),
    mcq(sc, "البيئة", "أين يعيش الجمل غالبًا؟", ["الصحراء", "القطب الشمالي", "البحر", "الغابة المطيرة"]),
    tf(sc, "البيئة", "إغلاق صنبور الماء يوفّر الماء.", true),
    tf(sc, "الكائنات الحية", "الحجر يتنفس ويأكل.", false),

    mcq(en, "Vocabulary", "What do we use to write?", ["pencil", "spoon", "shoe", "bed"]),
    mcq(en, "Vocabulary", "Where do we sleep?", ["bed", "table", "door", "window"], 2),
    mcq(en, "Simple Words", "Which word means «كتاب»?", ["book", "bag", "box", "ball"]),
    mcq(en, "Simple Words", "Which word means «بيت»?", ["house", "horse", "mouse", "hand"]),
    mcq(en, "Colors", "Red + Yellow = ?", ["orange", "green", "blue", "black"], 2),
    mcq(en, "Colors", "What color is a banana?", ["yellow", "blue", "purple", "gray"]),
    mcq(en, "Animals", "Which animal says «moo»?", ["cow", "cat", "duck", "lion"]),
    mcq(en, "Animals", "Which animal can swim?", ["fish", "bird", "horse", "goat"]),
    mcq(en, "Animals", "Which animal is very big?", ["elephant", "ant", "mouse", "bee"]),
    tf(en, "Animals", "A lion is a big cat.", true),
    tf(en, "Vocabulary", "We eat with a chair.", false),
  ];
}

function grade3(): Question[] {
  const ar: Ctx = { grade: 3, subject: "arabic" };
  const ma: Ctx = { grade: 3, subject: "math" };
  const sc: Ctx = { grade: 3, subject: "science" };
  const en: Ctx = { grade: 3, subject: "english" };
  return [
    mcq(ar, "فهم المقروء", "«زرعَ خالدٌ شجرةَ زيتونٍ أمامَ بيتِه، وكان يسقيها كلَّ صباح». متى كان خالد يسقي الشجرة؟", ["كل صباح", "كل مساء", "كل أسبوع", "يوم الجمعة"]),
    mcq(ar, "فهم المقروء", "في النص السابق: ما نوع الشجرة؟", ["زيتون", "ليمون", "تفاح", "نخيل"]),
    mcq(ar, "المفردات", "ما مرادف كلمة «شُجاع»؟", ["جريء", "خائف", "كسول", "ضعيف"]),
    mcq(ar, "المفردات", "ما مفرد كلمة «أشجار»؟", ["شجرة", "شجر", "شاجر", "مشجر"]),
    mcq(ar, "المفردات", "ما مرادف كلمة «ذهب» في جملة «ذهبَ الولدُ إلى السوق»؟", ["مضى", "رجع", "جلس", "نام"], 2),
    mcq(ar, "ترتيب الجمل", "رتّب الكلمات (المدرسةِ - إلى - ذهبتُ) في جملة صحيحة:", ["ذهبتُ إلى المدرسةِ", "إلى ذهبتُ المدرسةِ", "المدرسةِ ذهبتُ إلى"], 2),
    mcq(ar, "التراكيب اللغوية", "اختر اسم الإشارة المناسب: ... الولدُ نشيطٌ.", ["هذا", "هذه", "هؤلاء", "هاتان"]),
    mcq(ar, "التراكيب اللغوية", "اختر اسم الإشارة المناسب: ... البنتُ مهذّبة.", ["هذه", "هذا", "هذان", "ذلك"]),
    mcq(ar, "التراكيب اللغوية", "ما الفعل في جملة «يكتبُ سعيدٌ الدرسَ»؟", ["يكتبُ", "سعيدٌ", "الدرسَ", "لا يوجد"], 2),
    tf(ar, "التراكيب اللغوية", "«المعلمون» جمع مذكر سالم.", true, 2),
    tf(ar, "المفردات", "مرادف كلمة «سريع» هو «بطيء».", false),
    order(ar, "المفردات", "رتّب الحروف لتكوّن كلمة", "عُصْفور", 2),

    arith(ma, "الضرب", "3 × 4"),
    arith(ma, "الضرب", "5 × 6"),
    arith(ma, "الضرب", "7 × 8", 3),
    arith(ma, "الضرب", "9 × 3", 2),
    arith(ma, "القسمة الأساسية", "12 ÷ 3"),
    arith(ma, "القسمة الأساسية", "20 ÷ 4"),
    arith(ma, "القسمة الأساسية", "36 ÷ 6", 2),
    mcq(ma, "الأعداد", "ما العدد ٤٠٠ + ٣٠ + ٥؟", ["435", "345", "453", "4305"]),
    mcq(ma, "الأعداد", "أيّ عدد هو الأكبر؟", ["912", "921", "219", "291"], 2),
    mcq(ma, "المسائل اللفظية", "في الصف ٤ صفوف من المقاعد، في كل صف ٦ مقاعد. كم مقعدًا في الصف؟", ["24", "10", "18", "28"], 2),
    mcq(ma, "المسائل اللفظية", "وُزِّعت ١٥ حبة تفاح بالتساوي على ٣ أطفال. كم حبة لكل طفل؟", ["5", "3", "12", "18"], 2),
    tf(ma, "الضرب", "٦ × ٢ = ١٢", true),
    tf(ma, "القسمة الأساسية", "١٨ ÷ ٢ = ٨", false),

    mcq(sc, "المادة", "ما حالة الماء عندما يتجمّد؟", ["صلبة", "سائلة", "غازية", "لا شيء"]),
    mcq(sc, "المادة", "أيّ مما يلي غاز؟", ["الهواء", "الحليب", "الحجر", "الخشب"]),
    mcq(sc, "المادة", "ماذا يحدث للجليد عند تسخينه؟", ["ينصهر ويصبح ماء", "يصبح حجرًا", "يكبر حجمه", "لا يتغير"], 2),
    mcq(sc, "الطاقة", "ما المصدر الرئيس للضوء والحرارة على الأرض؟", ["الشمس", "القمر", "المصباح", "الغيوم"]),
    mcq(sc, "الطاقة", "أيّ جهاز يحوّل الكهرباء إلى ضوء؟", ["المصباح", "المروحة اليدوية", "الكرة", "الكتاب"]),
    mcq(sc, "الكائنات الحية", "أيّ حيوان من آكلات النباتات؟", ["الأرنب", "الأسد", "النمر", "الذئب"], 2),
    mcq(sc, "الكائنات الحية", "كيف يتنفّس السمك؟", ["بالخياشيم", "بالرئتين فقط", "بالجلد فقط", "لا يتنفس"], 2),
    mcq(sc, "البيئة", "أيّ تصرّف يحمي البيئة؟", ["إعادة تدوير البلاستيك", "حرق النفايات", "رمي الأكياس في البحر", "قطع الأشجار"]),
    tf(sc, "الطاقة", "الرياح يمكن أن تكون مصدرًا للطاقة.", true),
    tf(sc, "المادة", "الحليب مادة صلبة.", false),

    mcq(en, "Vocabulary", "Which word means «مدرسة»?", ["school", "street", "shop", "sea"]),
    mcq(en, "Vocabulary", "The opposite of «big» is ...", ["small", "tall", "long", "happy"]),
    mcq(en, "Vocabulary", "Which is a day of the week?", ["Monday", "March", "Morning", "Moon"], 2),
    mcq(en, "Sentence Building", "Choose the correct sentence.", ["I like apples.", "Apples like I.", "Like I apples.", "I apples like."], 2),
    mcq(en, "Sentence Building", "She ___ a student.", ["is", "am", "are", "be"]),
    mcq(en, "Sentence Building", "They ___ playing football.", ["are", "is", "am", "be"], 2),
    mcq(en, "Reading", "«Sam has a red ball.» What color is the ball?", ["red", "blue", "green", "yellow"]),
    mcq(en, "Reading", "«Lina is seven years old.» How old is Lina?", ["7", "6", "8", "17"]),
    tf(en, "Reading", "«The cat is on the bed.» The cat is under the bed.", false, 2),
    tf(en, "Vocabulary", "«Teacher» means «معلّم».", true),
  ];
}

let cache: Question[] | null = null;
export function seedQuestions(): Question[] {
  if (!cache) {
    counter = 0;
    cache = [...grade1(), ...grade2(), ...grade3()];
  }
  return cache;
}

export function defaultSettings(type: GameType) {
  const teamCount = type === "race" ? 2 : type === "teams" ? 2 : 2;
  return {
    timePerQuestion: type === "balloons" ? 20 : type === "race" ? 30 : 30,
    pointsPerCorrect: 10,
    teams: Array.from({ length: teamCount }, (_, i) => ({ name: DEFAULT_TEAM_NAMES[i], color: TEAM_COLORS[i] })),
    shuffle: true,
    wheelMode: "questions" as const,
    wheelNames: [] as string[],
    removeUsed: true,
  };
}

/** Ready-made games for each grade × subject, generated from the sample bank (read-only). */
export function builtinGames(): GameConfig[] {
  const qs = seedQuestions();
  const out: GameConfig[] = [];
  for (const grade of [1, 2, 3] as Grade[]) {
    for (const subject of ["arabic", "math", "science", "english"] as Subject[]) {
      for (const meta of GAMES.filter((g) => g.ready)) {
        const questions = qs.filter((q) => q.grade === grade && q.subject === subject && meta.kinds.includes(q.kind));
        out.push({
          id: `builtin_${meta.type}_${grade}_${subject}`,
          title: `${meta.name} — ${subjectLabel(subject)}`,
          grade,
          subject,
          lesson: `مراجعة ${subjectLabel(subject)} — ${gradeLabel(grade)}`,
          type: meta.type,
          difficulty: 1,
          questions,
          settings: defaultSettings(meta.type),
          builtin: true,
          createdAt: SEED_TIME,
          updatedAt: SEED_TIME,
        });
      }
    }
  }
  return out;
}
