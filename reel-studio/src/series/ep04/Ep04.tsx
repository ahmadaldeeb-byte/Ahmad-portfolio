// Ep04 · أول نيغاتيف — Talbot, Lacock Abbey (1835) → latent image (1840) → calotype (1841).
// 3D: public/models/ep04.glb. The Commons file is a POSITIVE made from the 1835 negative; the negative is
// shown by inverting it, and the tag says so.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack, type ArabicFont} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {ArchivePhoto, Shot, SoundBed, Tag, VoiceBadge} from '../engine/Shots';
import {Stage3D, project, viewAt, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {useGLB} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['كل صورة طبعتها', 'أصلها شبّاك'];
export const CUES: CueList = [
  ['year', 'سنة'],
  ['soak', 'نقع'],
  ['window', 'شبّاك'],
  ['stamp', 'طابع'],
  ['inverted', 'مقلوب'],
  ['dark', 'غامق'],
  ['light', 'فاتحة'],
  ['negative', 'نيغاتيف'],
  ['genius', 'العبقرية'],
  ['over', 'فوق'],
  ['back', 'بترجع'],
  ['copies', 'وبتطبع'],
  ['five', 'خمس'],
  ['latent', 'بتنطبع'],
  ['hidden', 'مخفية'],
  ['develop', 'تظهّرها'],
  ['cut', 'قصّر'],
];

const IMG = 'archive/ep04-latticed-window.jpg';
const CREDIT = 'William Henry Fox Talbot, Latticed Window at Lacock Abbey, Aug. 1835 · positive from the paper negative · Public domain · via Wikimedia Commons';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const T = (font: ArabicFont, size: number, color = '#f5f5f7', weight = 700): React.CSSProperties => ({fontFamily: arabicStack(font), fontSize: size, fontWeight: weight, color, direction: 'rtl', textAlign: 'center'});

const roomKeys = (c: Record<string, number>): CamKey[] => [
  {f: 0, pos: [0.0, 1.7, -5.6], target: [0, 2.0, 0], fov: 46},
  {f: c.year, pos: [0.7, 1.75, -4.4], target: [0.1, 1.8, 0], fov: 42},
  {f: c.soak, pos: [0.62, 1.48, -2.75], target: [0.2, 1.35, -2.2], fov: 32},
  {f: c.window, pos: [0.24, 1.38, -2.6], target: [0.0, 1.9, 0], fov: 42},
];

/** A photo card (img), optionally inverted to show the negative. */
const Photo: React.FC<{w: number; invert?: number; style?: React.CSSProperties}> = ({w, invert = 0, style}) => (
  <Img src={staticFile(IMG)} style={{width: w, aspectRatio: '489 / 638', objectFit: 'cover', filter: `invert(${invert})`, borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', ...style}} />
);

const StampSize: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const a = ramp(f, c.stamp - 2, c.stamp + 14);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 45%, #2a2620 0%, #0d0c0a 70%)', alignItems: 'center', justifyContent: 'center', gap: 60, flexDirection: 'row'}}>
      <div style={{textAlign: 'center'}}>
        <Photo w={190} invert={1} />
        <div style={{...T(font, 34, '#e8ecf2', 600), marginTop: 18}}>النيغاتيف</div>
      </div>
      <div style={{textAlign: 'center', opacity: a}}>
        <div style={{width: 160, height: 190, border: '6px dashed #e8d7b4', borderRadius: 6, background: 'repeating-linear-gradient(45deg, rgba(232,215,180,0.08) 0 10px, transparent 10px 20px)'}} />
        <div style={{...T(font, 34, '#e8d7b4', 600), marginTop: 18}}>طابع بريد</div>
      </div>
    </AbsoluteFill>
  );
};

const Negative: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const inv = ramp(f, c.inverted, c.inverted + 16);
  return (
    <AbsoluteFill style={{background: '#0b0c0e', alignItems: 'center', justifyContent: 'center'}}>
      <Photo w={760} invert={inv} />
      <div style={{position: 'absolute', top: '30%', right: '10%', ...T(font, 44, '#ffd27a'), opacity: ramp(f, c.dark, c.dark + 10)}}>الضو ← غامق</div>
      <div style={{position: 'absolute', top: '68%', left: '10%', ...T(font, 44, '#ffd27a'), opacity: ramp(f, c.light, c.light + 10)}}>العتمة ← فاتحة</div>
    </AbsoluteFill>
  );
};

/** Negative over sensitised paper → sunlight → positive → as many copies as you like. */
const Printing: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const over = ramp(f, c.over - 4, c.over + 16);
  const sun = ramp(f, c.over + 16, c.back);
  const lift = ramp(f, c.back, c.back + 18);
  const copies = ramp(f, c.copies, c.copies + 30);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 45%, #232838 0%, #0b0d12 70%)'}}>
      {/* sun rays */}
      <svg width={1080} height={1920} style={{position: 'absolute', opacity: sun * (1 - lift)}}>
        {Array.from({length: 7}, (_, k) => (
          <line key={k} x1={300 + k * 80} y1={420} x2={300 + k * 80} y2={720} stroke="#ffd27a" strokeWidth={6} strokeLinecap="round" />
        ))}
      </svg>
      {/* sensitised paper, darkening where light passes the clear parts of the negative → positive */}
      <div style={{position: 'absolute', left: 310 + (700 - 310) * copies, top: 760 + (640 - 760) * copies, width: 460 - 200 * copies, aspectRatio: '489 / 638', background: '#efe6cf', borderRadius: 4, overflow: 'hidden'}}>
        <Img src={staticFile(IMG)} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: Math.max(sun * 0.9, lift)}} />
      </div>
      {/* the negative laid on top, lifted away */}
      <div style={{position: 'absolute', left: 540 - 230, top: 760 - (1 - over) * 520 - lift * 560, width: 460, opacity: over * (1 - lift * 0.9)}}>
        <Photo w={460} invert={1} style={{opacity: 0.88}} />
      </div>
      {/* copies */}
      {[1, 2, 3, 4, 5].map((k) => (
        <div key={k} style={{position: 'absolute', left: [700, 400, 100][k % 3], top: k < 3 ? 640 : 1020, opacity: ramp(f, c.copies + 4 + k * 5, c.copies + 16 + k * 5)}}>
          <Photo w={260} />
        </div>
      ))}
      <div style={{position: 'absolute', top: '15%', width: '100%', ...T(font, 40, '#a1a1a6', 600)}}>{lift < 0.5 ? 'نيغاتيف فوق ورقة حساسة' : 'بوزيتيف · وبتطبع نسخ'}</div>
    </AbsoluteFill>
  );
};

/** 1835 → 1840 → 1841 timeline, then the latent image: invisible until developed with gallic acid. */
const Latent: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const tl = ramp(f, c.five - 4, c.five + 30);
  const dev = ramp(f, c.develop, c.develop + 36);
  const marks: [number, string, string][] = [
    [0, '1835', 'أول نيغاتيف'],
    [0.62, '1840', 'الصورة المخفية'],
    [0.86, '1841', 'براءة الكالوتايب'],
  ];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 40%, #232838 0%, #0b0d12 70%)'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <line x1={900} y1={470} x2={900 - 720 * tl} y2={470} stroke="#7f9bb8" strokeWidth={6} strokeLinecap="round" />
        {marks.map(([p, y], i) => (
          <circle key={y} cx={900 - 720 * p} cy={470} r={16} fill={i === 1 ? '#ffd27a' : '#e8ecf2'} opacity={tl >= p ? 1 : 0} />
        ))}
      </svg>
      {marks.map(([p, y, l], i) => (
        <div key={y} style={{position: 'absolute', left: 900 - 720 * p - 130, width: 260, top: 360, opacity: tl >= p ? 1 : 0}}>
          <div style={{...T(font, 40, i === 1 ? '#ffd27a' : '#e8ecf2'), direction: 'ltr'}}>{y}</div>
          <div style={{...T(font, 26, '#a1a1a6', 600), marginTop: 70}}>{l}</div>
        </div>
      ))}
      {/* exposed paper: looks blank; the developer sweeps down and the image comes up */}
      <div style={{position: 'absolute', left: 540 - 230, top: 720, width: 460, aspectRatio: '489 / 638', background: '#efe6cf', borderRadius: 4, overflow: 'hidden', opacity: ramp(f, c.latent - 6, c.latent + 10)}}>
        <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 ${100 - dev * 100}% 0)`}}>
          <Img src={staticFile(IMG)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'invert(1) sepia(0.5)', opacity: 0.9}} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: `${dev * 100}%`, height: 26, background: 'linear-gradient(rgba(140,110,60,0.0), rgba(140,110,60,0.6))', opacity: dev > 0 && dev < 1 ? 1 : 0}} />
        <div style={{position: 'absolute', inset: 30, border: '4px dashed rgba(42,29,12,0.45)', borderRadius: 4, opacity: ramp(f, c.hidden, c.hidden + 10) * (1 - dev)}} />
      </div>
      <div style={{position: 'absolute', top: '62%', width: '100%', ...T(font, 40, dev > 0.3 ? '#ffd27a' : '#a1a1a6')}}>{dev > 0.3 ? 'حمض الغاليك بطلّعها' : 'الورقة بتبيّن فاضية'}</div>
    </AbsoluteFill>
  );
};

const Gallery: React.FC<{f: number; scene: THREE.Group}> = ({f, scene}) => (
  <>
    <ambientLight intensity={0.12} />
    <hemisphereLight args={['#eaf2ff', '#2a2622', 0.22]} />
    <directionalLight position={[1, 4, 6]} intensity={1.1} color="#f2f6ff" />
    <spotLight position={[0, 2.2, -1]} target-position={[0.2, 1.3, -2.2]} intensity={3 + 0 * f} angle={0.7} penumbra={0.8} color="#eef4ff" />
    <primitive object={scene} />
  </>
);

export const Ep04: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scene = useGLB('models/ep04.glb');
  const c = p.cueFrames;
  if (c.year === undefined || !scene) return null;
  const end = c.end + 45;
  const kR = roomKeys(c);
  const pin = (keys: CamKey[], pt: number[], from: number) => (lf: number) => project(new THREE.Vector3(...(pt as [number, number, number])), viewAt(keys, lf + from), width, height);
  return (
    <AbsoluteFill style={{background: '#07080a'}}>
      <SoundBed
        voiceover={p.voiceover}
        voiceFrom={p.voiceFrom}
        musicVolume={p.musicVolume}
        sfxVolume={p.sfxVolume}
        sfx={[
          {at: c.soak, name: 'liquid', vol: 0.5},
          {at: c.stamp - 6, name: 'whoosh'},
          {at: c.inverted, name: 'shimmer', vol: 0.6},
          {at: c.genius - 6, name: 'whoosh'},
          {at: c.copies, name: 'click'},
          {at: c.copies + 8, name: 'click'},
          {at: c.copies + 16, name: 'click'},
          {at: c.five - 6, name: 'whoosh'},
          {at: c.develop, name: 'liquid'},
          {at: c.cut - 6, name: 'whoosh'},
        ]}
      />
      <Shot from={0} to={c.stamp + 4} fadeIn={0} name="Lacock gallery">
        <Stage3D keys={kR} frameOffset={0} background="linear-gradient(#141821, #07080b)">
          <Gallery f={f} scene={scene} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.stamp} to={c.inverted + 4} name="Stamp size">
        <StampSize f={f} c={c} font={p.font} />
        <Tag text="الصورة الأصلية · مقلوبة الدرجات للعرض" font={p.font} tone="archive" />
      </Shot>
      <Shot from={c.inverted} to={c.genius + 4} name="Negative">
        <Negative f={f} c={c} font={p.font} />
        <Tag text="الصورة الأصلية · مقلوبة الدرجات للعرض" font={p.font} tone="archive" />
      </Shot>
      <Shot from={c.genius} to={c.five + 4} name="Printing">
        <Printing f={f} c={c} font={p.font} />
        <Tag text="رسم توضيحي" font={p.font} />
      </Shot>
      <Shot from={c.five} to={c.cut + 4} name="Latent image">
        <Latent f={f} c={c} font={p.font} />
        <Tag text="رسم توضيحي" font={p.font} />
      </Shot>
      <Shot from={c.cut} to={end} fadeOut={0} name="Original">
        <ArchivePhoto src={IMG} credit={CREDIT} font={p.font} label="الصورة الأصلية · 1835" zoom={[1, 1.06]} />
      </Shot>

      <ArabicHook font={p.font} from={0} durationInFrames={c.year - 2} lines={HOOK} capHeightPct={3.4} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <Fact font={p.font} from={c.year} to={c.stamp - 2} value="1835" caption={['هنري فوكس تالبوت · إنجلترا']} y={74} />
      <PartLabel font={p.font} from={c.soak} durationInFrames={c.stamp - c.soak} text="ورق بأملاح الفضة" capHeightPct={2.4} x={86} y={20} anchor={pin(kR, A.paper, c.soak)} width={width} height={height} />
      <Fact font={p.font} from={c.stamp + 8} to={c.inverted - 2} value="≈ 1 إنش²" caption={['أصغر من طابع البريد تقريبًا']} y={72} capHeightPct={4.4} />
      <Fact font={p.font} from={c.negative} to={c.genius - 2} value="نيغاتيف" y={84} capHeightPct={4.2} />
      <Fact font={p.font} from={c.cut} to={end} value="ساعة وأكثر ← دقيقة أو دقيقتين" caption={['مدة التعريض قبل وبعد الاكتشاف']} y={24} capHeightPct={3.4} />

      <VoiceBadge status={p.voiceStatus} font={p.font} />
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
