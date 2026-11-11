import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {GimbalTextLayer} from './episodes/gimbal/GimbalTextLayer';
import {MovingZone} from './episodes/gimbal/MovingZone';
import type {GimbalProps} from './episodes/gimbal/storyboard';
import {SafeGuides} from './text/SafeGuides';

/** Mobile-size preview of the episode's typography (hook, part label, number) without the WebGL scene.
 *  Same component + same props as the reel; edit them in the Studio props panel. */
export const TextMotionPreview: React.FC<GimbalProps> = (p) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 42%, #1c2230 0%, #0b0d12 62%, #050609 100%)'}}>
      <MovingZone {...p} />
      <GimbalTextLayer {...p} />
      {p.showGuides ? <SafeGuides /> : null}
      <div style={{position: 'absolute', left: 24, bottom: 18, color: '#86868b', fontFamily: 'monospace', fontSize: 26}}>
        f {frame} · {(frame / 30).toFixed(2)}s
      </div>
    </AbsoluteFill>
  );
};
