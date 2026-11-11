import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {arabicStack, type ArabicFont} from '../../text/fonts';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** A shot on the timeline: [from, to) with short cross-fades (frames). */
export const Shot: React.FC<{from: number; to: number; fadeIn?: number; fadeOut?: number; name?: string; children: React.ReactNode}> = ({
  from,
  to,
  fadeIn = 8,
  fadeOut = 8,
  name,
  children,
}) => (
  <Sequence from={from} durationInFrames={Math.max(1, to - from)} name={name} layout="none">
    <Fade len={to - from} fadeIn={fadeIn} fadeOut={fadeOut}>
      {children}
    </Fade>
  </Sequence>
);
const Fade: React.FC<{len: number; fadeIn: number; fadeOut: number; children: React.ReactNode}> = ({len, fadeIn, fadeOut, children}) => {
  const f = useCurrentFrame();
  const o = Math.min(fadeIn ? interpolate(f, [0, fadeIn], [0, 1], clamp) : 1, fadeOut ? interpolate(f, [len - fadeOut, len], [1, 0], clamp) : 1);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

/** Small pill tag (RTL), e.g. «الصورة الأصلية» or «إعادة بناء». */
export const Tag: React.FC<{text: string; font: ArabicFont; tone?: 'archive' | 'rebuild' | 'temp'; x?: number; y?: number}> = ({text, font, tone = 'rebuild', x = 5, y = 7.6}) => {
  const bg = tone === 'archive' ? 'rgba(245,232,200,0.92)' : tone === 'temp' ? 'rgba(255,177,92,0.95)' : 'rgba(20,24,32,0.72)';
  const fg = tone === 'archive' ? '#2a1d0c' : tone === 'temp' ? '#1a1206' : '#e8ecf2';
  return (
    <div
      dir="rtl"
      style={{position: 'absolute', right: `${x}%`, top: `${y}%`, padding: '10px 22px', borderRadius: 999, background: bg, color: fg,
        fontFamily: arabicStack(font), fontWeight: 700, fontSize: 34, letterSpacing: 0, border: tone === 'rebuild' ? '1.5px solid rgba(232,236,242,0.35)' : 'none'}}
    >
      {text}
    </div>
  );
};

/** Archival photograph: slow Ken Burns, «الصورة الأصلية» tag, Latin credit line at the bottom of the safe zone. */
export const ArchivePhoto: React.FC<{
  src: string;
  credit: string;
  font: ArabicFont;
  label?: string;
  fit?: 'cover' | 'contain';
  zoom?: [number, number];
  pan?: [[number, number], [number, number]]; // % object-position from → to
  invert?: boolean;
  tag?: boolean;
}> = ({src, credit, font, label = 'الصورة الأصلية', fit = 'contain', zoom = [1, 1.08], pan = [[50, 50], [50, 50]], invert = false, tag = true}) => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const t = interpolate(f, [0, Math.max(1, durationInFrames)], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const s = zoom[0] + (zoom[1] - zoom[0]) * t;
  const px = pan[0][0] + (pan[1][0] - pan[0][0]) * t;
  const py = pan[0][1] + (pan[1][1] - pan[0][1]) * t;
  return (
    <AbsoluteFill style={{background: '#0b0c0e'}}>
      {fit === 'contain' ? (
        <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: `blur(40px) brightness(0.35)${invert ? ' invert(1)' : ''}`, scale: '1.2'}} />
      ) : null}
      <Img
        src={staticFile(src)}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, objectPosition: fit === 'cover' ? `${px}% ${py}%` : '50% 50%', scale: String(s), transformOrigin: `${px}% ${py}%`, filter: invert ? 'invert(1)' : undefined}}
      />
      {tag ? <Tag text={label} font={font} tone="archive" /> : null}
      <div style={{position: 'absolute', left: '6%', right: '6%', top: '11.2%', color: 'rgba(232,236,242,0.72)', fontFamily: 'Inter, Arial, sans-serif', fontSize: 22, textAlign: 'left', direction: 'ltr'}}>{credit}</div>
    </AbsoluteFill>
  );
};

/** Voice-over + music bed (ducked under the voice) + one-shot SFX at frames. */
export const SoundBed: React.FC<{voiceover: string; voiceFrom: number; musicVolume: number; sfxVolume: number; sfx: {at: number; name: string; vol?: number}[]}> = ({
  voiceover,
  voiceFrom,
  musicVolume,
  sfxVolume,
  sfx,
}) => (
  <>
    <Sequence from={voiceFrom} name="Voice-over" layout="none">
      <Audio src={staticFile(`${voiceover}.mp3`)} />
    </Sequence>
    <Audio src={staticFile('sfx/series/bed.mp3')} volume={musicVolume} loop />
    {sfx.map((s, i) => (
      <Sequence key={i} from={Math.max(0, s.at)} name={`SFX ${s.name}`} layout="none">
        <Audio src={staticFile(`sfx/series/${s.name}.wav`)} volume={sfxVolume * (s.vol ?? 1)} />
      </Sequence>
    ))}
  </>
);
