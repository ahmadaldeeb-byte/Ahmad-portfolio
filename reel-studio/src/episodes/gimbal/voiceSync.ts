import type {CalculateMetadataFunction} from 'remotion';
import {staticFile} from 'remotion';
import {findPhrase, onScreenWordStarts, type VoWords} from '../../text/voice';
import {CUE_IDS, GIMBAL_FPS, type CueFrames, type GimbalProps} from './storyboard';

/**
 * Times the whole reel on the voice-over. Uses public/<voiceover>.words.json (the real recording, from
 * `npm run vo -- tts|align`) when it exists, otherwise <voiceover>.temp.words.json (estimate, no audio).
 * Every cue phrase is searched in order (each after the previous one), so «تميل» in the hook can't be
 * mistaken for the one in the explanation. Derived frames are written into props.
 */
export const gimbalMetadata: CalculateMetadataFunction<GimbalProps> = async ({props}) => {
  const fps = GIMBAL_FPS;
  let voiceStatus: GimbalProps['voiceStatus'] = 'recorded';
  let res = await fetch(staticFile(`${props.voiceover}.words.json`));
  if (!res.ok) {
    voiceStatus = 'temp';
    res = await fetch(staticFile(`${props.voiceover}.temp.words.json`));
  }
  if (!res.ok) throw new Error(`voice-over timings not found: public/${props.voiceover}.words.json (or .temp.words.json)`);
  const w = ((await res.json()) as VoWords).words;
  const at = (sec: number) => props.voiceFrom + Math.round(sec * fps);

  const cueFrames = {} as CueFrames;
  let from = 0;
  for (const id of CUE_IDS) {
    const i = findPhrase(w, props.cues[id], from);
    if (i < 0) throw new Error(`cue «${props.cues[id]}» (${id}) not found in the voice-over after word ${from}`);
    // the reveal follows the sound; text cues land cueLeadFrames early (apple-motion VO rule)
    const isText = id === 'tiltLabel' || id === 'sensor' || id === 'roll' || id === 'pan' || id === 'payoff' || id === 'outro';
    cueFrames[id] = at(w[i].start) - (isText ? props.cueLeadFrames : 0);
    from = i + 1;
  }
  cueFrames.end = at(w[w.length - 1].end);
  const hookWordStarts = onScreenWordStarts(props.hook, w, fps, 0, props.voiceFrom, props.cueLeadFrames);
  const durationInFrames = cueFrames.end + 45; // hold the payoff 1.5 s after the last word

  return {durationInFrames, props: {...props, voiceStatus, cueFrames, hookWordStarts}};
};
