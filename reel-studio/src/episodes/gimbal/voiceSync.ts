import type {CalculateMetadataFunction} from 'remotion';
import {staticFile} from 'remotion';
import {findPhrase, onScreenWordStarts, type VoWords} from '../../text/voice';
import {GIMBAL_FRAMES, type GimbalProps} from './storyboard';

/**
 * When `voiceover` is set, re-time the episode on the real recording:
 *  - hook words land on the spoken words (cueLeadFrames early, like apple-motion's VO rule)
 *  - reveal starts on `revealCue` («هون»), the label on `labelCue` («محور الميل»)
 *  - the mechanism, number and payoff follow the label; the duration grows if the voice needs it.
 * Every derived value is written back into props, so Studio shows (and lets you override) them.
 */
export const gimbalMetadata: CalculateMetadataFunction<GimbalProps> = async ({props}) => {
  if (!props.voiceover) return {durationInFrames: GIMBAL_FRAMES, props: {...props, hookWordStarts: []}};
  const fps = 30;
  const res = await fetch(staticFile(`${props.voiceover}.words.json`));
  if (!res.ok) throw new Error(`voice-over timings not found: public/${props.voiceover}.words.json`);
  const vo = (await res.json()) as VoWords;
  const w = vo.words;
  const at = (sec: number) => props.voiceFrom + Math.round(sec * fps);
  const lead = props.cueLeadFrames;

  const ri = findPhrase(w, props.revealCue);
  const li = findPhrase(w, props.labelCue, Math.max(0, ri));
  if (ri < 0) throw new Error(`reveal cue «${props.revealCue}» not found in the voice-over`);
  if (li < 0) throw new Error(`label cue «${props.labelCue}» not found in the voice-over`);

  const revealFrom = at(w[ri].start);
  const labelFrom = at(w[li].start) - lead;
  const voiceEnd = at(w[w.length - 1].end);
  const hookFrom = props.hookFrom;
  const hookFrames = Math.max(20, Math.min(revealFrom + 6, labelFrom - 2) - hookFrom);
  const hookWordStarts = onScreenWordStarts(props.hook, w, fps, hookFrom, props.voiceFrom, lead);
  // mechanism after the label has been read (~0.6 s)
  const tiltFrom = Math.max(labelFrom + 18, voiceEnd - 6);
  const counterFrom = tiltFrom;
  const counterFrames = props.tiltRampFrames + 28; // number leaves when the hold ends (value stops being true)
  const outroFrom = tiltFrom + 2 * props.tiltRampFrames + 46;
  const outroFrames = props.outroFrames;
  const durationInFrames = Math.max(outroFrom + outroFrames, voiceEnd + 15);
  const labelFrames = outroFrom - labelFrom - 2;

  return {
    durationInFrames,
    props: {...props, hookFrames, hookWordStarts, revealFrom, labelFrom, labelFrames, tiltFrom, counterFrom, counterFrames, outroFrom},
  };
};
