import React from 'react';
import {Composition, Folder} from 'remotion';
// 8 s pilot (approved, frozen): GimbalTiltReel / TextMotionPreview
import {GimbalTiltReel} from './episodes/gimbal-pilot/GimbalTiltReel';
import {GIMBAL_FPS, GIMBAL_FRAMES, gimbalDefaults as pilotDefaults, gimbalSchema as pilotSchema} from './episodes/gimbal-pilot/storyboard';
import {gimbalMetadata as pilotMetadata} from './episodes/gimbal-pilot/voiceSync';
import {TextMotionPreview} from './TextMotionPreview';
// full ~30 s reel, timed on the voice-over: GimbalTiltReelVO / TextMotionPreviewVO
import {GimbalFullReel} from './episodes/gimbal/GimbalTiltReel';
import {gimbalDefaults, gimbalSchema} from './episodes/gimbal/storyboard';
import {gimbalMetadata} from './episodes/gimbal/voiceSync';
import {TextMotionPreviewVO} from './episodes/gimbal/TextMotionPreviewVO';
// @episodes-imports (scripts/new-episode.mjs inserts imports above this line)

const pilot = {schema: pilotSchema, calculateMetadata: pilotMetadata, durationInFrames: GIMBAL_FRAMES, fps: GIMBAL_FPS, width: 1080, height: 1920} as const;
const full = {schema: gimbalSchema, calculateMetadata: gimbalMetadata, durationInFrames: 900, fps: 30, width: 1080, height: 1920} as const;

export const Root: React.FC = () => (
  <>
    <Composition id="TextMotionPreviewVO" component={TextMotionPreviewVO} defaultProps={{...gimbalDefaults, showGuides: true}} {...full} />
    <Composition id="TextMotionPreview" component={TextMotionPreview} defaultProps={{...pilotDefaults, showGuides: true}} {...pilot} />
    <Folder name="Episodes">
      <Composition id="GimbalTiltReelVO" component={GimbalFullReel} defaultProps={gimbalDefaults} {...full} />
      <Composition id="GimbalTiltReel" component={GimbalTiltReel} defaultProps={pilotDefaults} {...pilot} />
      {/* @episodes-compositions (scripts/new-episode.mjs inserts compositions above this line) */}
    </Folder>
  </>
);
