import {z} from 'zod';
import {ARABIC_FONTS} from '../../text/font-list';

/** Props shared by every camera-history episode (editable in Studio). Derived fields are filled by
 *  calculateMetadata from the voice-over's words.json. */
export const seriesSchema = z.object({
  font: z.enum(ARABIC_FONTS),
  voiceover: z.string(), // public/<voiceover>.mp3 + .words.json
  voiceFrom: z.number().int().min(0),
  cueLeadFrames: z.number().int().min(0).max(10),
  musicVolume: z.number().min(0).max(1),
  sfxVolume: z.number().min(0).max(1),
  showGuides: z.boolean(),
  // derived
  cueFrames: z.record(z.string(), z.number()),
  hookWordStarts: z.array(z.number()),
  voiceStatus: z.enum(['temp', 'recorded']),
});
export type SeriesProps = z.infer<typeof seriesSchema>;

export const seriesDefaults = (ep: string): SeriesProps => ({
  font: 'IBM Plex Sans Arabic',
  voiceover: `vo/series/${ep}`,
  voiceFrom: 6,
  cueLeadFrames: 2,
  musicVolume: 0.1,
  sfxVolume: 0.5,
  showGuides: false,
  cueFrames: {},
  hookWordStarts: [],
  voiceStatus: 'temp',
});
