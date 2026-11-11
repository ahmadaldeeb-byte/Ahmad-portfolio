import React from 'react';
import {Composition, Folder} from 'remotion';
import {seriesDefaults, seriesSchema} from './engine/schema';
import {FPS, seriesMetadata} from './engine/timing';
import {CUES as CUES02, Ep02, HOOK as HOOK02} from './ep02/Ep02';
import {CUES as CUES03, Ep03, HOOK as HOOK03} from './ep03/Ep03';
import {CUES as CUES04, Ep04, HOOK as HOOK04} from './ep04/Ep04';
import {CUES as CUES05, Ep05, HOOK as HOOK05} from './ep05/Ep05';
import {CUES as CUES06, Ep06, HOOK as HOOK06} from './ep06/Ep06';
import {CUES as CUES07, Ep07, HOOK as HOOK07} from './ep07/Ep07';
import {CUES as CUES08, Ep08, HOOK as HOOK08} from './ep08/Ep08';
import {CUES as CUES09, Ep09, HOOK as HOOK09} from './ep09/Ep09';
// @series-imports

const base = {schema: seriesSchema, durationInFrames: 1500, fps: FPS, width: 1080, height: 1920} as const;

/** Camera History series — one composition per episode (1080×1920). */
export const CameraHistory: React.FC = () => (
  <Folder name="CameraHistory">
    <Composition id="CH02-FirstPhotograph" component={Ep02} defaultProps={seriesDefaults('02')} calculateMetadata={seriesMetadata(CUES02, HOOK02)} {...base} />
    <Composition id="CH03-FirstHuman" component={Ep03} defaultProps={seriesDefaults('03')} calculateMetadata={seriesMetadata(CUES03, HOOK03)} {...base} />
    <Composition id="CH04-FirstNegative" component={Ep04} defaultProps={seriesDefaults('04')} calculateMetadata={seriesMetadata(CUES04, HOOK04)} {...base} />
    <Composition id="CH05-HorseInMotion" component={Ep05} defaultProps={seriesDefaults('05')} calculateMetadata={seriesMetadata(CUES05, HOOK05)} {...base} />
    <Composition id="CH06-KodakFilm" component={Ep06} defaultProps={seriesDefaults('06')} calculateMetadata={seriesMetadata(CUES06, HOOK06)} {...base} />
    <Composition id="CH07-FirstColor" component={Ep07} defaultProps={seriesDefaults('07')} calculateMetadata={seriesMetadata(CUES07, HOOK07)} {...base} />
    <Composition id="CH08-SLRMirror" component={Ep08} defaultProps={seriesDefaults('08')} calculateMetadata={seriesMetadata(CUES08, HOOK08)} {...base} />
    <Composition id="CH09-FirstDigital" component={Ep09} defaultProps={seriesDefaults('09')} calculateMetadata={seriesMetadata(CUES09, HOOK09)} {...base} />
    {/* @series-compositions */}
  </Folder>
);
