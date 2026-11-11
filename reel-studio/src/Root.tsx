import React from 'react';
import {Composition, Folder} from 'remotion';
import {GimbalTiltReel} from './episodes/gimbal/GimbalTiltReel';
import {GIMBAL_FPS, GIMBAL_FRAMES, gimbalDefaults, gimbalSchema} from './episodes/gimbal/storyboard';
import {TextMotionPreview} from './TextMotionPreview';
// @episodes-imports (scripts/new-episode.mjs inserts imports above this line)

export const Root: React.FC = () => (
  <>
    <Composition
      id="TextMotionPreview"
      component={TextMotionPreview}
      schema={gimbalSchema}
      defaultProps={{...gimbalDefaults, showGuides: true}}
      durationInFrames={GIMBAL_FRAMES}
      fps={GIMBAL_FPS}
      width={1080}
      height={1920}
    />
    <Folder name="Episodes">
      <Composition
        id="GimbalTiltReel"
        component={GimbalTiltReel}
        schema={gimbalSchema}
        defaultProps={gimbalDefaults}
        durationInFrames={GIMBAL_FRAMES}
        fps={GIMBAL_FPS}
        width={1080}
        height={1920}
      />
      {/* @episodes-compositions (scripts/new-episode.mjs inserts compositions above this line) */}
    </Folder>
  </>
);
