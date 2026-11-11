import React from 'react';
import {AbsoluteFill} from 'remotion';

/** Vertical-reel safe zones (Instagram Reels / TikTok UI): top bar, right action rail, bottom caption.
 *  Values in % of the 1080×1920 frame. Text should stay inside the inner (green) box. */
export const SAFE = {top: 7, bottom: 20, left: 5, right: 13};

export const SafeGuides: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: `${SAFE.top}%`, background: 'rgba(255,60,60,0.16)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${SAFE.bottom}%`, background: 'rgba(255,60,60,0.16)'}} />
    <div style={{position: 'absolute', right: 0, top: `${SAFE.top}%`, bottom: `${SAFE.bottom}%`, width: `${SAFE.right}%`, background: 'rgba(255,60,60,0.10)'}} />
    <div
      style={{
        position: 'absolute',
        left: `${SAFE.left}%`,
        right: `${SAFE.right}%`,
        top: `${SAFE.top}%`,
        bottom: `${SAFE.bottom}%`,
        border: '2px dashed rgba(94,240,196,0.7)',
      }}
    />
  </AbsoluteFill>
);
