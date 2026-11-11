import {z} from 'zod';
import {ARABIC_FONTS} from '../../text/font-list';

/**
 * Episode (full reel, ~30 s): «كيف الجيمبل بثبّت اتجاه الكاميرا لما تميل إيدك؟»
 * 1080×1920 · 30 fps. Length and every beat come from the voice-over (calculateMetadata in voiceSync.ts):
 * the real recording's words.json when it exists, otherwise the committed temporary estimate.
 *
 * Mechanism (checked): a 3-axis handheld gimbal is a chain handle → pan motor → roll motor → tilt motor →
 * camera, each a brushless motor. An IMU (gyro + accelerometer) on the camera plate measures the camera's
 * attitude hundreds of times per second; the controller drives each motor opposite to the disturbance
 * on its axis, so tilt (pitch) and roll stay level, and pan follows the hand smoothly (follow mode)
 * instead of copying its jitter. Shown with a 3-frame sensor→motor lag so cause → effect reads.
 *
 * Script: scripts/voiceover/gimbal-full.txt
 */
export const GIMBAL_FPS = 30;

/** Spoken cue phrases, searched in this order in the voice-over (each after the previous one). */
export const CUE_IDS = ['reveal', 'tiltLabel', 'sensor', 'tilt', 'roll', 'rollRight', 'rollLeft', 'pan', 'panMove', 'payoff', 'outro'] as const;
export type CueId = (typeof CUE_IDS)[number];
/** absolute frames of every cue + 'end' (last spoken word) — derived from the words file */
export type CueFrames = Record<CueId | 'end', number>;

export const BEATS: {id: string; cue: CueId | 'start'; visual: string; text: string}[] = [
  {id: 'hook', cue: 'start', visual: 'الجيمبل كامل بمنظور مائل، المقبض يتهزهز والكاميرا ثابتة', text: 'الهوك كلمة بكلمة على الصوت'},
  {id: 'reveal', cue: 'reveal', visual: 'عند «هون»: الأجزاء تصير شفافة وغطاء محرك الميل ينفتح', text: '—'},
  {id: 'tiltLabel', cue: 'tiltLabel', visual: 'محور الميل يتلوّن ويتمدد عبر الكاميرا', text: 'تسمية «محور الميل»'},
  {id: 'sensor', cue: 'sensor', visual: 'الحسّاس على قاعدة الكاميرا يومض بإشارات متتالية', text: 'تسمية «الحسّاس»'},
  {id: 'tilt', cue: 'tilt', visual: 'المقبض يميل 20° لقدّام ومحرك الميل يلف الكاميرا 20° لورا', text: 'رقم 20°'},
  {id: 'roll', cue: 'roll', visual: 'الكاميرا تلف لمنظر أمامي، محرك اللف يتلوّن ومحوره على خط العدسة', text: 'تسمية «محور اللف»'},
  {id: 'rollMove', cue: 'rollRight', visual: 'الإيد تميل يمين ثم شمال، خط الأفق يضل مستقيم', text: '—'},
  {id: 'pan', cue: 'pan', visual: 'منظر علوي، محرك الدوران يتلوّن', text: 'تسمية «محور الدوران»'},
  {id: 'panMove', cue: 'panMove', visual: 'الإيد تلف 35° مع رجفة، الكاميرا تلحقها بنعومة', text: '—'},
  {id: 'payoff', cue: 'payoff', visual: 'المحركات الثلاثة ومحاورها ملوّنة مع بعض', text: 'رقم 3'},
  {id: 'outro', cue: 'outro', visual: 'الإيد ترتجف على المحاور الثلاثة، الكاميرا ثابتة تمامًا', text: '«لقطة ثابتة / بإيد بتهتز»'},
];

const cueSchema = z.object(Object.fromEntries(CUE_IDS.map((c) => [c, z.string()])) as Record<CueId, z.ZodString>);

export const gimbalSchema = z.object({
  font: z.enum(ARABIC_FONTS),
  // text
  hook: z.array(z.string()),
  hookCapPct: z.number().min(1).max(12),
  hookY: z.number().min(0).max(100),
  labels: z.object({tilt: z.string(), sensor: z.string(), roll: z.string(), pan: z.string()}),
  labelCapPct: z.number().min(1).max(12),
  tiltCounter: z.object({to: z.number(), suffix: z.string(), caption: z.array(z.string())}),
  axesCounter: z.object({to: z.number(), suffix: z.string(), caption: z.array(z.string())}),
  counterCapPct: z.number().min(1).max(20),
  counterX: z.number().min(0).max(100),
  counterY: z.number().min(0).max(100),
  outro: z.array(z.string()),
  // motion
  tiltDeg: z.number(),
  rollDeg: z.number(),
  panDeg: z.number(),
  tiltRampFrames: z.number().int().min(4),
  correctionLagFrames: z.number().int().min(0).max(10),
  // voice-over: public/<voiceover>.mp3 + .words.json (recorded) or .temp.words.json (estimate)
  voiceover: z.string(),
  voiceFrom: z.number().int().min(0),
  cueLeadFrames: z.number().int().min(0).max(10),
  cues: cueSchema,
  // derived by calculateMetadata (shown in Studio, recomputed on every load)
  cueFrames: z.record(z.string(), z.number()),
  hookWordStarts: z.array(z.number()),
  voiceStatus: z.enum(['temp', 'recorded']),
  showGuides: z.boolean(),
});

export type GimbalProps = z.infer<typeof gimbalSchema>;

export const gimbalDefaults: GimbalProps = {
  font: 'IBM Plex Sans Arabic',
  hook: ['ليش الكاميرا بتضل ثابتة', 'وإنت بتميل المقبض؟'],
  hookCapPct: 3.4,
  hookY: 13.5,
  labels: {tilt: 'محور الميل', sensor: 'الحسّاس', roll: 'محور اللف', pan: 'محور الدوران'},
  labelCapPct: 2.5,
  tiltCounter: {to: 20, suffix: '°', caption: ['المحرك بيلفّ', 'عكس إيدك']},
  axesCounter: {to: 3, suffix: '', caption: ['محاور ومحركات', 'وحسّاس واحد']},
  counterCapPct: 6,
  counterX: 20,
  counterY: 50,
  outro: ['لقطة ثابتة', 'بإيد بتهتز'],
  tiltDeg: 20,
  rollDeg: 12,
  panDeg: 35,
  tiltRampFrames: 28,
  correctionLagFrames: 3,
  voiceover: 'vo/gimbal-full',
  voiceFrom: 6,
  cueLeadFrames: 2,
  cues: {
    reveal: 'هون',
    tiltLabel: 'محور الميل',
    sensor: 'حسّاس',
    tilt: 'عشرين',
    roll: 'محور اللفّ',
    rollRight: 'يمين',
    rollLeft: 'شمال',
    pan: 'محور الدوران',
    panMove: 'بينعّم',
    payoff: 'تلات محاور',
    outro: 'والنتيجة',
  },
  cueFrames: {},
  hookWordStarts: [],
  voiceStatus: 'temp',
  showGuides: false,
};
