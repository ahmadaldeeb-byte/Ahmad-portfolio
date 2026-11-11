import React from 'react';
import {Sequence} from 'remotion';
import {KineticText} from '../../apple-motion';
import {arabicStack, type ArabicFont} from '../../text/fonts';
import {INK} from '../../text/ArabicMotion';

/** A big value (year, number, range) with an Arabic caption under it — apple-motion KineticText. */
export const Fact: React.FC<{
  font: ArabicFont;
  from: number;
  to: number;
  value: string;
  caption?: string[];
  x?: number;
  y?: number;
  capHeightPct?: number;
}> = ({font, from, to, value, caption, x = 50, y = 74, capHeightPct = 5.2}) => (
  <Sequence from={from} durationInFrames={Math.max(12, to - from)} name={`Fact ${value}`} layout="none">
    <KineticText
      lines={[value]}
      durationInFrames={Math.max(12, to - from)}
      entry="scaleDown"
      exit="fade"
      exitFrames={6}
      capHeightPct={capHeightPct}
      weight={700}
      x={x}
      y={y}
      gradient={INK.focusGrad}
      fontFamily={arabicStack(font)}
      dir="rtl"
      maxWidthPct={78}
      style={{lineHeight: 1.3}}
    />
    {caption ? (
      <KineticText
        lines={caption}
        durationInFrames={Math.max(12, to - from)}
        entry="perWord"
        staggerFrames={3}
        exit="fade"
        exitFrames={6}
        capHeightPct={2.3}
        weight={600}
        x={x}
        y={y + capHeightPct * 0.85 + 3.2}
        color={INK.text}
        fontFamily={arabicStack(font)}
        dir="rtl"
        maxWidthPct={76}
        style={{lineHeight: 1.5}}
      />
    ) : null}
  </Sequence>
);
