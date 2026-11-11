import {z} from 'zod';
import {ARABIC_FONTS} from '../../text/font-list';

/**
 * Episode: «كيف الجيمبل بثبّت اتجاه الكاميرا لما تميل إيدك؟»
 * 8 s · 1080×1920 · 30 fps = 240 frames. Every number below is editable in Remotion Studio (props panel).
 *
 * Mechanism (checked): a 3-axis handheld gimbal has brushless motors on pan, roll and tilt axes. An IMU
 * on the camera plate measures the camera's angle; a controller drives each motor in the opposite
 * direction of the disturbance. When the wrist pitches the handle forward by θ, the tilt motor rotates
 * the camera plate by −θ about the tilt axis, so the camera's pitch in the world stays ~0. The motor
 * reacts a few milliseconds late — shown here as a 3-frame lag so cause → effect reads on screen.
 */
export const BEATS = [
  {id: 'hook', from: 0, to: 62, visual: 'الجيمبل كامل بمنظور مائل، المقبض يتهزهز والكاميرا ثابتة', text: 'هوك سطرين كلمة بكلمة'},
  {id: 'reveal', from: 54, to: 96, visual: 'باقي الأجزاء تصير شفافة، غطاء محرك الميل ينفتح، المحور يتلوّن ويتمدد عبر الكاميرا', text: 'تسمية «محور الميل» مع خط إشارة'},
  {id: 'mechanism', from: 96, to: 196, visual: 'المقبض يميل 20° لقدام ثم لورا؛ محرك الميل يلف بالعكس؛ خط أفق العدسة يبقى أفقي', text: 'رقم 20° + سطر شرح'},
  {id: 'payoff', from: 196, to: 240, visual: 'الكاميرا ثابتة، المقبض يرجع للوضع الطبيعي', text: 'سطر النتيجة'},
] as const;

export const gimbalSchema = z.object({
  font: z.enum(ARABIC_FONTS),
  // hook
  hook: z.array(z.string()),
  hookFrom: z.number().int().min(0),
  hookFrames: z.number().int().min(10),
  hookCapPct: z.number().min(1).max(12),
  hookY: z.number().min(0).max(100),
  // part label
  label: z.string(),
  labelFrom: z.number().int().min(0),
  labelFrames: z.number().int().min(10),
  labelCapPct: z.number().min(1).max(12),
  labelX: z.number().min(0).max(100),
  labelY: z.number().min(0).max(100),
  // number
  counterTo: z.number(),
  counterSuffix: z.string(),
  counterCaption: z.array(z.string()),
  counterX: z.number().min(0).max(100),
  counterFrom: z.number().int().min(0),
  counterFrames: z.number().int().min(10),
  counterCapPct: z.number().min(1).max(20),
  counterY: z.number().min(0).max(100),
  // payoff
  outro: z.array(z.string()),
  outroFrom: z.number().int().min(0),
  outroFrames: z.number().int().min(10),
  // mechanism timing
  revealFrom: z.number().int().min(0),
  tiltFrom: z.number().int().min(0),
  tiltRampFrames: z.number().int().min(4),
  correctionLagFrames: z.number().int().min(0).max(10),
  // voice-over (ElevenLabs): '' = no voice. Path under public/ without extension; needs <path>.mp3 + <path>.words.json
  voiceover: z.string(),
  voiceFrom: z.number().int().min(0),
  /** spoken word that starts the reveal */
  revealCue: z.string(),
  /** spoken phrase that brings in the part label */
  labelCue: z.string(),
  /** type lands this many frames BEFORE the spoken word (apple-motion VO.typeLeadFrames = 2) */
  cueLeadFrames: z.number().int().min(0).max(10),
  /** derived by calculateMetadata from the words file (frames, relative to the hook start) */
  hookWordStarts: z.array(z.number()),
  // preview helpers
  showGuides: z.boolean(),
});

export type GimbalProps = z.infer<typeof gimbalSchema>;

export const gimbalDefaults: GimbalProps = {
  font: 'IBM Plex Sans Arabic',
  hook: ['إيدك بتميل…', 'والكاميرا لأ. كيف؟'],
  hookFrom: 0,
  hookFrames: 62,
  hookCapPct: 3.4,
  hookY: 13,
  label: 'محور الميل',
  labelFrom: 64,
  labelFrames: 132,
  labelCapPct: 2.5,
  labelX: 86,
  labelY: 16,
  counterTo: 20,
  counterSuffix: '°',
  counterCaption: ['المحرك بيلفّ', 'عكس إيدك'],
  counterX: 20,
  counterFrom: 96,
  counterFrames: 56,
  counterCapPct: 6,
  counterY: 50,
  outro: ['بيقيس الميل…', 'وبيعاكسه فورًا'],
  outroFrom: 198,
  outroFrames: 42,
  revealFrom: 54,
  tiltFrom: 96,
  tiltRampFrames: 28,
  correctionLagFrames: 3,
  voiceover: '',
  voiceFrom: 6,
  revealCue: 'هون',
  labelCue: 'محور الميل',
  cueLeadFrames: 2,
  hookWordStarts: [],
  showGuides: false,
};

/** Hook used with the voice-over: the spoken question, shown word by word on the speech. */
export const VO_HOOK = ['ليش الكاميرا بتضل ثابتة', 'وإنت بتميل المقبض؟'];

export const GIMBAL_FPS = 30;
export const GIMBAL_FRAMES = 240;
