// Ep09 · أول كاميرا رقمية — Steven Sasson, Kodak, December 1975 (approximate reconstruction).
// 3D: public/models/ep09.glb. The CCD (shown as 10×10 for legibility; the real one was 100×100) is procedural.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack, type ArabicFont} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {Shot, SoundBed, Tag, VoiceBadge} from '../engine/Shots';
import {Stage3D, project, viewAt, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {node, setOpacity, useGLB} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['أول كاميرا رقمية', 'وزنها حوالي أربع كيلو'];
export const CUES: CueList = [
  ['kilo', 'كيلو'],
  ['pixels', 'آلاف'],
  ['year', 'سنة'],
  ['toaster', 'التوستر'],
  ['secret', 'هون'],
  ['ccd', 'CCD'],
  ['light', 'الضو'],
  ['how', 'كيف'],
  ['transfer', 'بتنتقل'],
  ['bucket', 'سطل'],
  ['edge', 'للحافة'],
  ['picture', 'الصورة'],
  ['res', 'مية'],
  ['cassette', 'كاسيت'],
  ['seconds', 'ثلاثة'],
  ['kodak', 'وكوداك'],
  ['market', 'للسوق'],
  ['today', 'هسا'],
  ['thousand', 'ألف'],
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const AMBER = '#ffd27a';
const T = (font: ArabicFont, size: number, color = '#f5f5f7', weight = 700): React.CSSProperties => ({fontFamily: arabicStack(font), fontSize: size, fontWeight: weight, color, direction: 'rtl', textAlign: 'center'});

const Camera: React.FC<{f: number; c: Record<string, number>; scene: THREE.Group}> = ({f, c, scene}) => {
  const open = ramp(f, c.toaster - 4, c.toaster + 22);
  setOpacity(node(scene, 'shell_top'), 1 - 0.9 * open);
  setOpacity(node(scene, 'shell_right'), 1 - 0.9 * open);
  setOpacity(node(scene, 'shell_front'), 1 - 0.7 * open);
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#eef2ff', '#2a2622', 0.5]} />
      <directionalLight position={[2, 4, 3]} intensity={2.2} />
      <pointLight position={[0.2, 1.2, 0.2]} intensity={open * 3} distance={2} />
      <primitive object={scene} />
    </>
  );
};

// ── CCD: 10×10 wells; light fills them, rows shift down into the readout register, then out ───────────
const N = 10;
const CELL = 0.12;
const OX = 20;
/** brightness pattern (a simple scene: sun + horizon) */
const level = (i: number, j: number) => {
  const sun = Math.max(0, 1 - Math.hypot(i - 6.5, j - 2.5) / 3);
  const ground = j > 6 ? 0.35 : 0.1;
  return Math.min(1, sun + ground + 0.08 * ((i * 7 + j * 3) % 3));
};
const CCD: React.FC<{f: number; c: Record<string, number>}> = ({f, c}) => {
  const fill = ramp(f, c.light, c.light + 24);
  const t = Math.max(0, f - c.transfer);
  // one row per step, paced so the last row reaches the edge as «للحافة / وتنقرا» is spoken
  const STEP = Math.max(9, Math.round((c.picture - c.transfer) / (N + 1.5)));
  const step = Math.floor(t / STEP);
  const frac = Easing.inOut(Easing.cubic)(Math.min(1, (t % STEP) / 5));
  const shift = f < c.transfer ? 0 : step + frac;
  const cellX = (i: number) => OX + (i - N / 2 + 0.5) * CELL;
  const cellZ = (j: number) => (j - N / 2 + 0.5) * CELL;
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[OX + 1, 3, 2]} intensity={2} />
      {/* silicon + wells */}
      <mesh position={[OX, -0.03, 0.06]}>
        <boxGeometry args={[N * CELL + 0.1, 0.04, (N + 1.5) * CELL + 0.1]} />
        <meshStandardMaterial color="#1c2230" metalness={0.5} roughness={0.3} />
      </mesh>
      {Array.from({length: N * N}, (_, k) => {
        const i = k % N;
        const j = Math.floor(k / N);
        return (
          <mesh key={`w${k}`} position={[cellX(i), 0.0, cellZ(j)]}>
            <boxGeometry args={[CELL * 0.9, 0.01, CELL * 0.9]} />
            <meshStandardMaterial color="#2c3548" roughness={0.4} />
          </mesh>
        );
      })}
      {/* readout register (row below the array) + output node */}
      <mesh position={[OX, 0.0, cellZ(N) + 0.02]}>
        <boxGeometry args={[N * CELL, 0.012, CELL * 0.8]} />
        <meshStandardMaterial color="#4a3b20" emissive="#ffd27a" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[cellX(N) + 0.05, 0.03, cellZ(N) + 0.02]}>
        <cylinderGeometry args={[0.05, 0.05, 0.06, 20]} />
        <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.4 + 0.6 * Math.max(0, Math.sin(t * 0.7)) * (f > c.edge ? 1 : 0)} />
      </mesh>
      {/* charges: rows move down one well per step; the row in the register slides right to the output */}
      {Array.from({length: N * N}, (_, k) => {
        const i = k % N;
        const j = Math.floor(k / N);
        const row = j + shift;
        if (row > N + 1) return null;
        const inReg = row >= N;
        const x = inReg ? cellX(i) + (row - N) * CELL * N * 0.9 : cellX(i);
        if (inReg && x > cellX(N)) return null;
        const r = 0.012 + 0.04 * level(i, j) * fill;
        return (
          <mesh key={`q${k}`} position={[x, 0.03, cellZ(Math.min(row, N))]}>
            <sphereGeometry args={[r, 12, 8]} />
            <meshStandardMaterial color="#6ab7ff" emissive="#2e7dff" emissiveIntensity={0.8} />
          </mesh>
        );
      })}
      {/* photons */}
      {f > c.light - 8 && f < c.light + 40
        ? Array.from({length: 24}, (_, k) => {
            const i = (k * 3) % N;
            const j = (k * 7) % N;
            const tt = ((f - c.light) * 0.06 + k * 0.17) % 1;
            return (
              <mesh key={`p${k}`} position={[cellX(i), 0.05 + (1 - tt) * 1.0, cellZ(j)]}>
                <sphereGeometry args={[0.012, 6, 4]} />
                <meshBasicMaterial color={AMBER} toneMapped={false} />
              </mesh>
            );
          })
        : null}
    </>
  );
};

/** 100 × 100 pixels, enlarged, with the pixel grid; then the cassette's 23 s per picture. */
const Pixels: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const grid = ramp(f, c.res, c.res + 12);
  const tape = ramp(f, c.cassette - 4, c.cassette + 10);
  const secs = 23 * ramp(f, c.cassette, c.kodak - 6); // fast-forwarded to the 23 s it took
  const rot = (f - c.cassette) * 9;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 40%, #1e2433 0%, #07080b 75%)', alignItems: 'center'}}>
      <div style={{position: 'absolute', top: '22%', width: 760, height: 760, opacity: 1 - tape * 0.75, scale: String(1 - tape * 0.25)}}>
        <Img src={staticFile('archive/ep09/scene-100-big.png')} style={{width: '100%', height: '100%', imageRendering: 'pixelated'}} />
        <div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.35) 1px, transparent 1px)', backgroundSize: '7.6px 7.6px', opacity: grid}} />
      </div>
      <div style={{position: 'absolute', top: '50%', opacity: tape}}>
        <svg width={620} height={380}>
          <rect x={10} y={10} width={600} height={360} rx={26} fill="#d9d6cc" stroke="#222" strokeWidth={6} />
          <rect x={110} y={110} width={400} height={150} rx={16} fill="#2a2a2e" />
          {[210, 410].map((cx) => (
            <g key={cx} transform={`rotate(${rot} ${cx} 185)`}>
              <circle cx={cx} cy={185} r={52} fill="#f2efe6" />
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <rect key={a} x={cx - 6} y={185 - 40} width={12} height={22} fill="#2a2a2e" transform={`rotate(${a} ${cx} 185)`} />
              ))}
            </g>
          ))}
        </svg>
        <div style={{...T(font, 64, AMBER), direction: 'ltr', marginTop: 10}}>{secs.toFixed(0).padStart(2, '0')} s</div>
      </div>
    </AbsoluteFill>
  );
};

/** 100×100 vs a 12-megapixel phone sensor (4000×3000): same scale, by area. */
const Compare: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const a = ramp(f, c.today, c.today + 30);
  const big = 820;
  const small = big * Math.sqrt((100 * 100) / (4000 * 3000)) * (4 / 3) ** 0.5; // area-correct square
  return (
    <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 40%, #1e2433 0%, #07080b 75%)', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'relative', width: big, height: (big * 3) / 4, border: `4px solid ${AMBER}`, borderRadius: 10, opacity: a, background: 'rgba(255,210,122,0.08)'}}>
        <div style={{position: 'absolute', left: 20, top: 20, width: Math.max(small, 6), height: Math.max(small, 6), background: '#6ab7ff', boxShadow: '0 0 0 3px #6ab7ff'}} />
        <div style={{position: 'absolute', left: 40, top: 8, ...T(font, 30, '#6ab7ff', 600)}}>100×100</div>
        <div style={{position: 'absolute', bottom: 20, width: '100%', ...T(font, 34, AMBER, 600), direction: 'ltr'}}>4000 × 3000 · 12 MP</div>
      </div>
    </AbsoluteFill>
  );
};

export const Ep09: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scene = useGLB('models/ep09.glb');
  const c = p.cueFrames;
  if (c.kilo === undefined || !scene) return null;
  const end = c.end + 45;
  const kC: CamKey[] = [
    {f: 0, pos: [2.2, 1.5, 2.6], target: [0, 0.4, 0], fov: 34},
    {f: c.year, pos: [1.9, 1.7, 1.9], target: [0, 0.4, 0], fov: 34},
    {f: c.toaster, pos: [1.6, 1.9, 1.2], target: [0, 0.45, 0], fov: 36},
    {f: c.secret - 4, pos: [-0.25, 0.95, 1.4], target: [-0.25, 0.45, 0.43], fov: 30},
  ];
  const kD: CamKey[] = [
    {f: c.secret, pos: [OX + 0.9, 1.4, 1.2], target: [OX, 0, 0.05], fov: 40},
    {f: c.transfer, pos: [OX + 0.4, 1.6, 1.25], target: [OX, 0, 0.1], fov: 40},
    {f: c.edge, pos: [OX + 0.8, 1.2, 1.4], target: [OX + 0.3, 0, 0.5], fov: 38},
  ];
  const pin = (keys: CamKey[], pt: number[], from: number) => (lf: number) => project(new THREE.Vector3(...(pt as [number, number, number])), viewAt(keys, lf + from), width, height);
  return (
    <AbsoluteFill style={{background: '#07080a'}}>
      <SoundBed
        voiceover={p.voiceover}
        voiceFrom={p.voiceFrom}
        musicVolume={p.musicVolume}
        sfxVolume={p.sfxVolume}
        sfx={[
          {at: c.toaster, name: 'whirr'},
          {at: c.secret - 6, name: 'whoosh'},
          {at: c.light, name: 'shimmer', vol: 0.6},
          ...Array.from({length: 11}, (_, k) => ({at: c.transfer + Math.round((k * (c.picture - c.transfer)) / 11.5), name: 'tick', vol: 0.6})),
          {at: c.picture - 6, name: 'whoosh'},
          {at: c.cassette, name: 'tape'},
          {at: c.today - 6, name: 'whoosh'},
        ]}
      />
      <Shot from={0} to={c.secret + 4} fadeIn={0} name="Prototype">
        <Stage3D keys={kC} frameOffset={0}>
          <Camera f={f} c={c} scene={scene} />
        </Stage3D>
        <Tag text="إعادة بناء تقريبية" font={p.font} />
      </Shot>
      <Shot from={c.secret} to={c.picture + 4} name="CCD">
        <Stage3D keys={kD} frameOffset={c.secret} background="radial-gradient(90% 60% at 50% 45%, #1e2433 0%, #07080b 75%)">
          <CCD f={f} c={c} />
        </Stage3D>
        <Tag text="رسم توضيحي · 10×10 بدل 100×100" font={p.font} />
      </Shot>
      <Shot from={c.picture} to={c.kodak + 4} name="100x100 + cassette">
        <Pixels f={f} c={c} font={p.font} />
        <Tag text="محاكاة" font={p.font} />
      </Shot>
      <Shot from={c.kodak} to={end} fadeOut={0} name="Today">
        <Compare f={f} c={c} font={p.font} />
        <Tag text="مقارنة بالمساحة" font={p.font} />
      </Shot>

      <ArabicHook font={p.font} from={0} durationInFrames={c.pixels - 2} lines={HOOK} capHeightPct={3.4} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <Fact font={p.font} from={c.pixels} to={c.year - 2} value="10,000 بكسل" caption={['0.01 ميغابكسل · أبيض وأسود']} y={74} capHeightPct={4.4} />
      <Fact font={p.font} from={c.year} to={c.secret - 2} value="1975" caption={['ستيفن ساسون · كوداك', 'حوالي 3.6 كغ']} y={74} />
      <PartLabel font={p.font} from={c.toaster + 10} durationInFrames={c.secret - c.toaster - 10} text="حسّاس CCD" capHeightPct={2.4} x={86} y={20} anchor={pin(kC, A.ccd, c.toaster + 10)} width={width} height={height} />
      <PartLabel font={p.font} from={c.light} durationInFrames={c.transfer - c.light} text="ضو ← شحنة" capHeightPct={2.4} x={86} y={20} anchor={pin(kD, [OX + 0.18, 0.03, -0.18], c.light)} width={width} height={height} />
      <Fact font={p.font} from={c.bucket} to={c.picture - 2} value="زي سطول المي" caption={['صف ورا صف · للحافة · وبتنقرا']} y={78} capHeightPct={4} />
      <Fact font={p.font} from={c.res} to={c.cassette - 2} value="100 × 100" caption={['بكسل · أبيض وأسود']} y={82} capHeightPct={4.4} />
      <Fact font={p.font} from={c.seconds} to={c.kodak - 2} value="23 ثانية" caption={['لتسجيل كل صورة على الكاسيت']} y={20} capHeightPct={4.4} />
      <Fact font={p.font} from={c.kodak} to={c.today - 2} value="ما نزلت للسوق" caption={['كوداك ما طلّعتها وقتها']} y={74} capHeightPct={4} />
      <Fact font={p.font} from={c.thousand} to={end} value="+1000 ضعف" caption={['بكسلات حساس موبايل 12 ميغابكسل']} y={84} capHeightPct={4} />

      <VoiceBadge status={p.voiceStatus} font={p.font} />
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};

