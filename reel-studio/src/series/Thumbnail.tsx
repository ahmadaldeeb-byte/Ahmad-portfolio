// Cover images (YouTube Shorts thumbnails), 1080×1920: a clean frame of the episode (no burned-in text)
// + a big two-line headline, a year/number chip and the series badge. Render with `npx remotion still`.
import React from 'react';
import {AbsoluteFill, Freeze} from 'remotion';
import {CleanFrame} from '../text/clean';
import {arabicStack} from '../text/fonts';
import type {SeriesProps} from './engine/schema';

export type Cover = {line1: string; line2: string; chip: string; ep: string; cue: string; offset: number};

export const COVERS: Record<string, Cover> = {
  '01': {line1: 'ليش الصورة', line2: 'بتطلع مقلوبة؟', chip: 'أكثر من 2000 سنة', ep: '01', cue: 'flipped', offset: 40},
  '02': {line1: 'أول صورة', line2: 'بالتاريخ', chip: '1826', ep: '02', cue: 'emerge', offset: 45},
  '03': {line1: 'أول إنسان', line2: 'طلع بصورة', chip: '1838', ep: '03', cue: 'shoes', offset: 30},
  '04': {line1: 'أول نيغاتيف', line2: 'بالعالم', chip: '1835', ep: '04', cue: 'inverted', offset: 18},
  '05': {line1: 'الحصان', line2: 'اللي طار', chip: '1878', ep: '05', cue: 'threads', offset: 116},
  '06': {line1: 'شو بصير', line2: 'جوّا الفيلم؟', chip: '1888', ep: '06', cue: 'film', offset: 40},
  '07': {line1: 'أول صورة', line2: 'ملوّنة', chip: '1861', ep: '07', cue: 'colors', offset: 20},
  '08': {line1: 'المراية', line2: 'اللي بتطير', chip: 'SLR', ep: '08', cue: 'fix', offset: 12},
  '09': {line1: 'أول كاميرا', line2: 'رقمية', chip: '1975', ep: '09', cue: 'transfer', offset: 40},
  '10': {line1: 'ليش صورتك', line2: 'ما بترجف؟', chip: 'OIS', ep: '10', cue: 'move', offset: 40},
};

const ORANGE = '#ff8a1f';

export const makeThumbnail =
  (Ep: React.FC<SeriesProps>, cover: Cover): React.FC<SeriesProps> =>
  (p) => {
    const f = (p.cueFrames[cover.cue] ?? 60) + cover.offset;
    const font = arabicStack(p.font);
    return (
      <AbsoluteFill style={{background: '#07080a'}}>
        <CleanFrame.Provider value>
          <Freeze frame={f}>
            <Ep {...p} />
          </Freeze>
        </CleanFrame.Provider>
        {/* contrast for the headline (top) and a soft vignette */}
        <AbsoluteFill style={{background: 'linear-gradient(rgba(5,6,9,0.92) 0%, rgba(5,6,9,0.75) 26%, rgba(5,6,9,0) 46%, rgba(5,6,9,0) 70%, rgba(5,6,9,0.55) 100%)'}} />
        <AbsoluteFill style={{boxShadow: 'inset 0 0 220px rgba(0,0,0,0.65)'}} />
        {/* series badge */}
        <div dir="rtl" style={{position: 'absolute', top: 150, right: 70, display: 'flex', alignItems: 'center', gap: 16, fontFamily: font, fontWeight: 700, fontSize: 40, color: '#e8ecf2'}}>
          <span style={{background: ORANGE, color: '#14100a', borderRadius: 14, padding: '6px 18px', fontSize: 40}}>{cover.ep}</span>
          <span>الكاميرا من جوّا</span>
        </div>
        {/* headline */}
        <div dir="rtl" style={{position: 'absolute', top: 250, left: 60, right: 60, fontFamily: font, fontWeight: 700, lineHeight: 1.18, textAlign: 'right'}}>
          <div style={{fontSize: 132, color: '#ffffff', textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>{cover.line1}</div>
          <div style={{fontSize: 132, color: ORANGE, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>{cover.line2}</div>
        </div>
        {/* chip */}
        <div style={{position: 'absolute', top: 640, right: 70, padding: '10px 30px', borderRadius: 999, border: `4px solid ${ORANGE}`, color: ORANGE, fontFamily: font, fontWeight: 700, fontSize: 56, direction: 'rtl', background: 'rgba(7,8,10,0.55)'}}>
          {cover.chip}
        </div>
      </AbsoluteFill>
    );
  };
