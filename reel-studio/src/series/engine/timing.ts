import type {CalculateMetadataFunction} from 'remotion';
import {staticFile} from 'remotion';
import {findPhrase, onScreenWordStarts, type VoWords} from '../../text/voice';
import type {SeriesProps} from './schema';

export const FPS = 25; // final delivery frame rate (cues are in seconds, so they stay on their words)
/** [cueId, spoken phrase] in speaking order; each is searched after the previous one. */
export type CueList = readonly (readonly [string, string])[];

/** Times an episode on its voice-over: every cue → absolute frame (reveals start ON the word),
 *  'end' = last word, duration = voice + 1.5 s hold. Words files flagged "temp" mark the episode temporary. */
export const seriesMetadata =
  (cues: CueList, hook: string[]): CalculateMetadataFunction<SeriesProps> =>
  async ({props}) => {
    const res = await fetch(staticFile(`${props.voiceover}.words.json`));
    if (!res.ok) throw new Error(`voice-over timings not found: public/${props.voiceover}.words.json`);
    const vo = (await res.json()) as VoWords & {temp?: boolean};
    const w = vo.words;
    const at = (s: number) => props.voiceFrom + Math.round(s * FPS);
    const cueFrames: Record<string, number> = {};
    let from = 0;
    for (const [id, phrase] of cues) {
      const i = findPhrase(w, phrase, from);
      if (i < 0) throw new Error(`cue «${phrase}» (${id}) not found in ${props.voiceover} after word ${from}`);
      cueFrames[id] = at(w[i].start);
      from = i + 1;
    }
    cueFrames.end = at(w[w.length - 1].end);
    return {
      durationInFrames: cueFrames.end + 45,
      props: {
        ...props,
        cueFrames,
        voiceStatus: vo.temp ? 'temp' : 'recorded',
        hookWordStarts: onScreenWordStarts(hook, w, FPS, 0, props.voiceFrom, props.cueLeadFrames),
      },
    };
  };
