import React from 'react';
import {AbsoluteFill, Freeze} from 'remotion';
import {CleanFrame} from '../../text/clean';
import {arabicStack} from '../../text/fonts';
import {CoverOverlay} from '../../series/Thumbnail';
import {GimbalFullReel} from './GimbalTiltReel';
import type {CueFrames, GimbalProps} from './storyboard';

/** Cover image for the gimbal reel: clean frame at the 20° tilt (hand tilted, motor counter-rotating). */
export const GimbalCover: React.FC<GimbalProps> = (p) => {
  const c = p.cueFrames as CueFrames;
  const f = (c.tilt ?? 300) + p.tiltRampFrames + 10;
  return (
    <AbsoluteFill style={{background: '#07080a'}}>
      <CleanFrame.Provider value>
        <Freeze frame={f}>
          <GimbalFullReel {...p} />
        </Freeze>
      </CleanFrame.Provider>
      <CoverOverlay cover={{line1: 'ليش الكاميرا', line2: 'ما بتميل؟', chip: '20°', ep: '🎥', badge: 'سر الجيمبل'}} font={arabicStack(p.font)} />
    </AbsoluteFill>
  );
};
