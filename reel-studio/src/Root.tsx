import React from 'react';
import {Composition, Folder} from 'remotion';
import {GimbalTiltReel} from './episodes/gimbal/GimbalTiltReel';
import {GIMBAL_FPS, GIMBAL_FRAMES, gimbalDefaults, gimbalSchema, VO_HOOK} from './episodes/gimbal/storyboard';
import {gimbalMetadata} from './episodes/gimbal/voiceSync';
import {TextMotionPreview} from './TextMotionPreview';
// @episodes-imports (scripts/new-episode.mjs inserts imports above this line)

const common = {schema: gimbalSchema, calculateMetadata: gimbalMetadata, durationInFrames: GIMBAL_FRAMES, fps: GIMBAL_FPS, width: 1080, height: 1920} as const;
/** gimbal hook voiced with ElevenLabs (npm run vo -- tts ... --out vo/gimbal-hook) */
const withVoice = {...gimbalDefaults, voiceover: 'vo/gimbal-hook', hook: VO_HOOK};

export const Root: React.FC = () => (
  <>
    <Composition id="TextMotionPreview" component={TextMotionPreview} defaultProps={{...gimbalDefaults, showGuides: true}} {...common} />
    <Composition id="TextMotionPreviewVO" component={TextMotionPreview} defaultProps={{...withVoice, showGuides: true}} {...common} />
    <Folder name="Episodes">
      <Composition id="GimbalTiltReel" component={GimbalTiltReel} defaultProps={gimbalDefaults} {...common} />
      <Composition id="GimbalTiltReelVO" component={GimbalTiltReel} defaultProps={withVoice} {...common} />
      {/* @episodes-compositions (scripts/new-episode.mjs inserts compositions above this line) */}
    </Folder>
  </>
);
