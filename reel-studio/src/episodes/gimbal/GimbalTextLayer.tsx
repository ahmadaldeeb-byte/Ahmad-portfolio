import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ArabicHook, ArabicNumber, PartLabel} from '../../text/ArabicMotion';
import {project, RIG, rigState, withHandle} from './rig';
import type {GimbalProps} from './storyboard';
import {VoiceTrack} from '../../text/VoiceTrack';

/** All on-screen Arabic text of the gimbal episode. Rendered on top of the 3D scene in the reel and
 *  on top of layout guides in TextMotionPreview. */
export const GimbalTextLayer: React.FC<GimbalProps> = (p) => {
  const {width, height, durationInFrames} = useVideoConfig();
  // anchor follows the tilt motor through the wrist motion (local frame -> absolute frame)
  const anchor = (local: number) => {
    const f = local + p.labelFrom;
    const s = rigState(f, p);
    return project(withHandle(RIG.tiltAxis.clone().setX(RIG.tiltAxis.x + 0.5), s.handle), f, durationInFrames, width, height);
  };
  return (
    <AbsoluteFill>
      <VoiceTrack {...p} />
      <ArabicHook font={p.font} from={p.hookFrom} durationInFrames={p.hookFrames} lines={p.hook} capHeightPct={p.hookCapPct} y={p.hookY} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <PartLabel
        font={p.font}
        from={p.labelFrom}
        durationInFrames={p.labelFrames}
        text={p.label}
        capHeightPct={p.labelCapPct}
        x={p.labelX}
        y={p.labelY}
        anchor={anchor}
        width={width}
        height={height}
      />
      <ArabicNumber
        font={p.font}
        from={p.counterFrom}
        durationInFrames={p.counterFrames}
        to={p.counterTo}
        suffix={p.counterSuffix}
        caption={p.counterCaption}
        capHeightPct={p.counterCapPct}
        x={p.counterX}
        y={p.counterY}
        rollFrames={p.tiltRampFrames}
      />
      <ArabicHook font={p.font} from={p.outroFrom} durationInFrames={p.outroFrames} lines={p.outro} capHeightPct={p.hookCapPct * 0.85} y={p.hookY} entry="perWord" />
    </AbsoluteFill>
  );
};
