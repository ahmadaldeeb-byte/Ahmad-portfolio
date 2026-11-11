import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, ArabicNumber, PartLabel} from '../../text/ArabicMotion';
import {VoiceTrack} from '../../text/VoiceTrack';
import {anchorOn, RIG, type Chain} from './rig';
import type {CueFrames, GimbalProps} from './storyboard';

/** All on-screen Arabic text of the full gimbal reel + the voice-over. Same layer in the reel and in
 *  TextMotionPreviewVO. Timings come from the voice cues (voiceSync.ts). */
export const GimbalTextLayer: React.FC<GimbalProps> = (p) => {
  const {width, height} = useVideoConfig();
  const c = p.cueFrames as CueFrames;
  if (c.reveal === undefined) return null;
  const pin = (link: keyof Chain, local: THREE.Vector3, from: number) => (lf: number) => anchorOn(link, local, lf + from, p, width, height);
  const label = (text: string, from: number, to: number, x: number, y: number, link: keyof Chain, local: THREE.Vector3) => (
    <PartLabel font={p.font} from={from} durationInFrames={Math.max(12, to - from)} text={text} capHeightPct={p.labelCapPct} x={x} y={y} anchor={pin(link, local, from)} width={width} height={height} />
  );
  const hookEnd = Math.min(c.reveal + 6, c.tiltLabel - 2);
  const tiltHoldEnd = Math.max(c.tilt + p.tiltRampFrames + 20, c.roll - 30);
  return (
    <AbsoluteFill>
      <VoiceTrack voiceover={p.voiceover} voiceFrom={p.voiceFrom} voiceStatus={p.voiceStatus} />
      <ArabicHook font={p.font} from={0} durationInFrames={hookEnd} lines={p.hook} capHeightPct={p.hookCapPct} y={p.hookY} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      {label(p.labels.tilt, c.tiltLabel, c.roll - 6, 86, 16, 'roll', RIG.tiltMotor.clone().setX(RIG.tiltMotor.x + 0.5))}
      {label(p.labels.sensor, c.sensor, c.tilt - 2, 40, 44, 'tilt', RIG.imu)}
      <ArabicNumber
        font={p.font}
        from={c.tilt}
        durationInFrames={tiltHoldEnd - c.tilt}
        to={p.tiltCounter.to}
        suffix={p.tiltCounter.suffix}
        caption={p.tiltCounter.caption}
        capHeightPct={p.counterCapPct}
        x={p.counterX}
        y={p.counterY}
        rollFrames={p.tiltRampFrames}
      />
      {label(p.labels.roll, c.roll, c.pan - 6, 86, 16, 'pan', RIG.rollMotor.clone().setZ(RIG.rollMotor.z - 0.2))}
      {label(p.labels.pan, c.pan, c.payoff - 4, 86, 16, 'handle', RIG.panMotor.clone().setX(0.45))}
      <ArabicNumber
        font={p.font}
        from={c.payoff}
        durationInFrames={c.outro - 2 - c.payoff}
        to={p.axesCounter.to}
        suffix={p.axesCounter.suffix}
        caption={p.axesCounter.caption}
        capHeightPct={p.counterCapPct}
        x={p.counterX}
        y={p.counterY}
        rollFrames={18}
      />
      <ArabicHook font={p.font} from={c.outro} durationInFrames={c.end + 45 - c.outro} lines={p.outro} capHeightPct={p.hookCapPct} y={p.hookY} />
    </AbsoluteFill>
  );
};
