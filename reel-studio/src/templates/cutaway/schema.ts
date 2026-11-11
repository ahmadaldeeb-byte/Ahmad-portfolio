import {z} from 'zod';
import {ARABIC_FONTS} from '../../text/font-list';

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

/** Generic props for an Arabic cutaway explainer reel. Everything is editable in the Studio props panel. */
export const cutawaySchema = z.object({
  font: z.enum(ARABIC_FONTS),
  hook: z.array(z.string()),
  hookFrom: z.number().int().min(0),
  hookFrames: z.number().int().min(10),
  hookCapPct: z.number().min(1).max(12),
  hookY: z.number().min(0).max(100),
  label: z.string(),
  labelFrom: z.number().int().min(0),
  labelFrames: z.number().int().min(10),
  labelCapPct: z.number().min(1).max(12),
  labelX: z.number().min(0).max(100),
  labelY: z.number().min(0).max(100),
  /** world point on the model the label's leader line pins to (rest pose) */
  labelAnchor: vec3,
  counterTo: z.number(),
  counterSuffix: z.string(),
  counterCaption: z.array(z.string()),
  counterFrom: z.number().int().min(0),
  counterFrames: z.number().int().min(10),
  counterCapPct: z.number().min(1).max(20),
  counterX: z.number().min(0).max(100),
  counterY: z.number().min(0).max(100),
  outro: z.array(z.string()),
  outroFrom: z.number().int().min(0),
  outroFrames: z.number().int().min(10),
  /** cutaway: housing turns translucent, focus part coloured */
  revealFrom: z.number().int().min(0),
  /** mechanism: action 0 → 1 → 0 (e.g. piston stroke, valve opening) */
  actionFrom: z.number().int().min(0),
  actionFrames: z.number().int().min(4),
  cameraFrom: vec3,
  cameraTo: vec3,
  target: vec3,
  fov: z.number().min(10).max(90),
  showGuides: z.boolean(),
});

export type CutawayProps = z.infer<typeof cutawaySchema>;
