import React from 'react';
import {Composition, Folder} from 'remotion';
import {seriesDefaults, seriesSchema} from './engine/schema';
import {FPS, seriesMetadata} from './engine/timing';
import {CUES as CUES02, Ep02, HOOK as HOOK02} from './ep02/Ep02';
// @series-imports

const base = {schema: seriesSchema, durationInFrames: 1500, fps: FPS, width: 1080, height: 1920} as const;

/** Camera History series — one composition per episode (1080×1920). */
export const CameraHistory: React.FC = () => (
  <Folder name="CameraHistory">
    <Composition id="CH02-FirstPhotograph" component={Ep02} defaultProps={seriesDefaults('02')} calculateMetadata={seriesMetadata(CUES02, HOOK02)} {...base} />
    {/* @series-compositions */}
  </Folder>
);
