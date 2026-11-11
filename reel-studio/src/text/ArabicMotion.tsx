// Arabic wrappers around apple-motion's KineticText / Counter. Used by BOTH the reels and
// TextMotionPreview, so what you approve in the preview is exactly what renders in the reel.
import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {Counter, KineticText, type KineticTextProps} from '../apple-motion';
import {arabicStack, type ArabicFont} from './fonts';

export const INK = {
  text: '#f5f5f7',
  dim: '#a1a1a6',
  focus: '#ff8a1f',
  focusGrad: ['#ffc477', '#ff7a1a'] as const,
};

type Common = {font: ArabicFont; from: number; durationInFrames: number};

/** Hook / payoff line(s): word-by-word entry (Arabic words stay joined), short fade-out. */
export const ArabicHook: React.FC<
  Common & {lines: string[]; capHeightPct: number; y: number; entry?: KineticTextProps['entry']; color?: string}
> = ({font, from, durationInFrames, lines, capHeightPct, y, entry = 'perWord', color = INK.text}) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="Hook" layout="none">
    <KineticText
      lines={lines}
      durationInFrames={durationInFrames}
      entry={entry}
      exit="fade"
      exitFrames={6}
      staggerFrames={4}
      capHeightPct={capHeightPct}
      weight={700}
      y={y}
      color={color}
      fontFamily={arabicStack(font)}
      dir="rtl"
      maxWidthPct={84}
      style={{lineHeight: 1.45}}
    />
  </Sequence>
);

/**
 * Part label pinned to a point on the model: anchor dot → leader line (draws on) → label slides up
 * under a mask. The label sits at (x%, y%) away from the moving part; only the thin leader touches it.
 */
export const PartLabel: React.FC<
  Common & {
    text: string;
    capHeightPct: number;
    x: number; // % of width, right edge of the label (RTL)
    y: number; // % of height
    anchor: (localFrame: number) => {x: number; y: number}; // px, follows the part
    width: number;
    height: number;
  }
> = ({font, from, durationInFrames, text, capHeightPct, x, y, anchor, width, height}) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="Part label" layout="none">
    <Leader anchor={anchor} durationInFrames={durationInFrames} x={x} y={y} capHeightPct={capHeightPct} width={width} height={height} />
    <KineticText
      lines={[text]}
      durationInFrames={durationInFrames}
      entry="slideUpMask"
      exit="fade"
      exitFrames={6}
      capHeightPct={capHeightPct}
      weight={700}
      align="right"
      x={x}
      y={y}
      color={INK.focus}
      fontFamily={arabicStack(font)}
      dir="rtl"
      style={{lineHeight: 1.5}}
    />
  </Sequence>
);

const Leader: React.FC<{
  anchor: (f: number) => {x: number; y: number};
  durationInFrames: number;
  x: number;
  y: number;
  capHeightPct: number;
  width: number;
  height: number;
}> = ({anchor, durationInFrames, x, y, capHeightPct, width, height}) => {
  const f = useCurrentFrame();
  const a = anchor(f);
  // leader starts just under the label's right-aligned baseline
  const sx = (x / 100) * width - 6;
  const sy = (y / 100) * height + (capHeightPct / 100) * height * 1.25;
  const elbowY = sy + 14;
  const draw = interpolate(f, [0, 9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(f, [durationInFrames - 6, durationInFrames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dot = interpolate(f, [0, 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pts = `${sx},${sy} ${sx},${elbowY} ${a.x},${a.y}`;
  const len = Math.abs(elbowY - sy) + Math.hypot(a.x - sx, a.y - elbowY);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: out}}>
      <svg width={width} height={height}>
        <polyline points={pts} fill="none" stroke={INK.focus} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <circle cx={a.x} cy={a.y} r={10 * dot} fill="none" stroke={INK.focus} strokeWidth={3} />
        <circle cx={a.x} cy={a.y} r={4 * dot} fill={INK.focus} />
      </svg>
    </AbsoluteFill>
  );
};

/** Big number (apple-motion Counter) with an Arabic caption line under it. */
export const ArabicNumber: React.FC<
  Common & {to: number; suffix: string; caption: string[]; capHeightPct: number; x: number; y: number; rollFrames: number; captionCapPct?: number}
> = ({font, from, durationInFrames, to, suffix, caption, capHeightPct, x, y, rollFrames, captionCapPct = 2.4}) => (
  <Sequence from={from} durationInFrames={durationInFrames} name="Number" layout="none">
    <Counter
      to={to}
      suffix={suffix}
      rollFrames={rollFrames}
      capHeightPct={capHeightPct}
      x={x}
      durationInFrames={durationInFrames}
      exit="fade"
      exitFrames={6}
      y={y}
      gradient={INK.focusGrad}
      fontFamily={arabicStack(font)}
      dir="rtl"
      color={INK.text}
    />
    {/* caption: separate multi-line KineticText (Counter's built-in caption is one line) */}
    <KineticText
      lines={caption}
      durationInFrames={durationInFrames}
      entry="perWord"
      staggerFrames={3}
      exit="fade"
      exitFrames={6}
      capHeightPct={captionCapPct}
      weight={600}
      x={x}
      y={y + capHeightPct * 0.8 + captionCapPct * 1.9}
      color={INK.text}
      fontFamily={arabicStack(font)}
      dir="rtl"
      style={{lineHeight: 1.5}}
    />
  </Sequence>
);
