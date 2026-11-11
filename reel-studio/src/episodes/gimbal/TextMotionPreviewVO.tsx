import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SafeGuides} from '../../text/SafeGuides';
import {GimbalTextLayer} from './GimbalTextLayer';
import {MovingZone} from './MovingZone';
import type {GimbalProps} from './storyboard';

/** Full-reel typography + voice-over without WebGL: hook, labels, numbers, payoff over the live
 *  silhouette of the moving parts, with reel safe zones. Same text layer and props as GimbalTiltReelVO. */
export const TextMotionPreviewVO: React.FC<GimbalProps> = (p) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 42%, #1c2230 0%, #0b0d12 62%, #050609 100%)'}}>
      <MovingZone {...p} />
      <GimbalTextLayer {...p} />
      {p.showGuides ? <SafeGuides /> : null}
      <div style={{position: 'absolute', left: 24, bottom: 18, color: '#86868b', fontFamily: 'monospace', fontSize: 26}}>
        f {frame} · {(frame / 30).toFixed(2)}s
      </div>
      {p.voiceStatus === 'temp' ? (
        <div style={{position: 'absolute', right: 24, bottom: 18, color: '#ffb15c', fontFamily: 'monospace', fontSize: 26}}>TEMP VO TIMING · no audio yet</div>
      ) : null}
    </AbsoluteFill>
  );
};
