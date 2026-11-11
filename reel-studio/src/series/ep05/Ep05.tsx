// Ep05 · الحصان اللي طار — Muybridge, The Horse in Motion (Palo Alto, June 1878). 3D: public/models/ep05.glb.
// The horse is Muybridge's own frames on a card (multiply blend: the white backdrop drops out); the frame
// advances every 27 inches of travel — the spacing of the cameras on the original card.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack, type ArabicFont} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {ArchivePhoto, Shot, SoundBed, Tag} from '../engine/Shots';
import {Stage3D, project, viewAt, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {node, setOpacity, useGLB, useTexture} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['الرسامين غلطوا', 'مئات السنين'];
export const CUES: CueList = [
  ['year', 'سنة'],
  ['twelve', 'اثنعشر'],
  ['secret', 'هون'],
  ['threads', 'خيطان'],
  ['cut', 'بقطع'],
  ['shutter', 'والغالق'],
  ['fraction', 'بجزء'],
  ['series', 'اثنعشر'],
  ['flying', 'طاير'],
  ['four', 'والأربع'],
  ['notStretched', 'ممدودين'],
  ['tucked', 'مضمومين'],
  ['play', 'تعرض'],
  ['runs', 'يركض'],
  ['cinema', 'السينما'],
];

const SHEET = 'archive/ep05-horse-in-motion.jpg';
const CREDIT = 'Eadweard Muybridge, The Horse in Motion ("Sallie Gardner"), Palo Alto, 19 June 1878 · Public domain · via Wikimedia Commons';
const SP = 0.686; // 27 in
const X0 = -SP * 5.5;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const frameFile = (i: number) => `archive/ep05-frames/f${String(i).padStart(2, '0')}.jpg`;
/** levels-adjusted copy (paper → white) so the card's background drops out under multiply blending */
const cardFile = (i: number) => `archive/ep05-frames/w${String(i).padStart(2, '0')}.jpg`;
const SPEED = 1.6; // m/s on screen (slowed down so each thread reads)

/** Horse x at frame f for a run that starts at `start` from x = X0 - 4. */
const horseX = (f: number, start: number) => X0 - 4 + ((f - start) / 30) * SPEED;
/** Frame passing thread i. */
const passFrame = (i: number, start: number) => start + Math.round(((X0 + i * SP - (X0 - 4)) / SPEED) * 30);

const Track: React.FC<{f: number; runStart: number; scene: THREE.Group; frames: (THREE.Texture | null)[]; snap: boolean}> = ({f, runStart, scene, frames, snap}) => {
  const x = horseX(f, runStart);
  const idx = ((Math.floor((x - X0) / SP) % 11) + 11) % 11; // 0..10 → frames 1..11
  for (let i = 0; i < 12; i++) {
    const passed = snap && x > X0 + i * SP;
    setOpacity(node(scene, `thread_${String(i).padStart(2, '0')}`), passed ? 0 : 1);
    const sh = node(scene, `cam_${String(i).padStart(2, '0')}_shutter`) as THREE.Mesh | undefined;
    if (sh) {
      const t = f - passFrame(i, runStart);
      const open = snap && t >= 0 && t < 4;
      sh.position.y = open ? 0.18 : 0; // shutter board drops away for a moment
      (sh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(open ? '#ffd27a' : '#000000');
      (sh.material as THREE.MeshStandardMaterial).emissiveIntensity = open ? 3 : 0;
    }
  }
  const tex = frames[idx];
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#fff6e6', '#4a4232', 0.6]} />
      <directionalLight position={[-6, 10, 8]} intensity={2.4} color="#fff1d6" />
      <primitive object={scene} />
      {tex ? (
        <mesh position={[x, 0.92, 0.35]}>
          <planeGeometry args={[2.85, 1.84]} />
          <meshBasicMaterial map={tex} transparent blending={THREE.MultiplyBlending} premultipliedAlpha toneMapped={false} />
        </mesh>
      ) : null}
    </>
  );
};

/** The sheet with one frame circled. */
const Sheet: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const ring = ramp(f, c.flying - 2, c.flying + 12);
  const zoom = ramp(f, c.notStretched - 4, c.notStretched + 20);
  // frame 3 centre on the 1280-wide grid: x≈(644+938)/2=791, y≈(32+222)/2=127 → fractions of 1280×789
  const fx = 791 / 1280;
  const fy = 127 / 789;
  const W = 1080;
  const H = (W * 789) / 1280;
  const top = (1920 - H) / 2;
  return (
    <AbsoluteFill style={{background: '#0b0c0e'}}>
      <div style={{position: 'absolute', left: 0, top, width: W, height: H, transformOrigin: `${fx * 100}% ${fy * 100}%`, scale: String(1 + 2.9 * zoom), translate: `${(0.5 - fx) * W * zoom}px ${(960 - top - fy * H) * zoom}px`}}>
        <Img src={staticFile(SHEET)} style={{width: '100%', height: '100%'}} />
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <rect x={(644 / 1280) * W} y={(32 / 789) * H} width={(294 / 1280) * W} height={(190 / 789) * H} fill="none" stroke="#ffd27a" strokeWidth={6 / (1 + 2.9 * zoom)} opacity={ring} />
        </svg>
      </div>
      <div style={{position: 'absolute', top: '24%', width: '100%', fontFamily: arabicStack(font), fontWeight: 700, fontSize: 52, color: '#ffd27a', textAlign: 'center', direction: 'rtl', opacity: ramp(f, c.tucked, c.tucked + 10)}}>
        الرجلين مضمومين تحت البطن
      </div>
    </AbsoluteFill>
  );
};

/** Frames 1–11 played back in sequence: the horse runs again. */
const Playback: React.FC<{f: number; c: Record<string, number>}> = ({f, c}) => {
  const i = Math.floor(Math.max(0, f - c.play) / 3) % 11; // ~10 fps playback
  return (
    <AbsoluteFill style={{background: '#0b0c0e', alignItems: 'center', justifyContent: 'center'}}>
      <Img src={staticFile(frameFile(i + 1))} style={{width: '96%', borderRadius: 6, boxShadow: '0 0 0 4px rgba(255,210,122,0.5)'}} />
    </AbsoluteFill>
  );
};

export const Ep05: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scene = useGLB('models/ep05.glb');
  const frames = Array.from({length: 11}, (_, k) => useTexture(cardFile(k + 1))); // eslint-disable-line react-hooks/rules-of-hooks
  const c = p.cueFrames;
  if (c.year === undefined || !scene || frames.some((t) => !t)) return null;
  const end = c.end + 45;
  const runA = -20; // establishing gallop during the hook
  const runC = c.threads - 30; // the run that breaks the threads
  const kA: CamKey[] = [
    {f: 0, pos: [-7.2, 1.9, 3.4], target: [0.5, 1.0, 0], fov: 40},
    {f: c.year, pos: [-5.8, 2.1, 3.4], target: [0.6, 1.0, 0], fov: 40},
    {f: c.twelve, pos: [-5.0, 1.9, 3.2], target: [1.5, 1.2, 4.3], fov: 40}, // along the row of cameras
    {f: c.secret - 4, pos: [3.8, 1.9, 3.0], target: [0, 1.25, 4.3], fov: 40},
  ];
  const kC: CamKey[] = [
    {f: c.secret, pos: [-3.6, 1.7, 3.3], target: [0.4, 1.0, 0.2], fov: 40},
    {f: c.cut, pos: [-2.9, 1.55, 3.2], target: [0.0, 1.0, 0.2], fov: 38},
    {f: c.shutter, pos: [1.6, 1.55, 0.6], target: [-1.2, 1.25, 4.2], fov: 42},
    {f: c.series - 4, pos: [0.9, 1.5, 1.0], target: [-1.6, 1.25, 4.2], fov: 40},
  ];
  const pin = (keys: CamKey[], pt: number[], from: number) => (lf: number) => project(new THREE.Vector3(...(pt as [number, number, number])), viewAt(keys, lf + from), width, height);
  const clicks = Array.from({length: 12}, (_, i) => ({at: passFrame(i, runC), name: 'click', vol: 0.8})).filter((s) => s.at > c.secret && s.at < c.series);
  return (
    <AbsoluteFill style={{background: '#07080a'}}>
      <SoundBed
        voiceover={p.voiceover}
        voiceFrom={p.voiceFrom}
        musicVolume={p.musicVolume}
        sfxVolume={p.sfxVolume}
        sfx={[{at: c.year - 6, name: 'whoosh'}, {at: c.secret, name: 'shimmer', vol: 0.6}, ...clicks, {at: c.series - 6, name: 'whoosh'}, {at: c.flying, name: 'shimmer', vol: 0.6}, {at: c.play - 6, name: 'whoosh'}, {at: c.cinema, name: 'tape', vol: 0.5}]}
      />
      <Shot from={0} to={c.secret + 4} fadeIn={0} name="Track and cameras">
        <Stage3D keys={kA} frameOffset={0} background="linear-gradient(#a9c3da, #e9e2d2)">
          <Track f={f} runStart={runA} scene={scene} frames={frames} snap={false} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.secret} to={c.series + 4} name="Threads">
        <Stage3D keys={kC} frameOffset={c.secret} background="linear-gradient(#a9c3da, #e9e2d2)">
          <Track f={f} runStart={runC} scene={scene} frames={frames} snap />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.series} to={c.play + 4} name="The sheet">
        <Sheet f={f} c={c} font={p.font} />
        <Tag text="الصورة الأصلية · 1878" font={p.font} tone="archive" />
      </Shot>
      <Shot from={c.play} to={c.cinema + 4} name="Playback">
        <Playback f={f} c={c} />
        <Tag text="الصور الأصلية ورا بعض" font={p.font} tone="archive" />
      </Shot>
      <Shot from={c.cinema} to={end} fadeOut={0} name="Original">
        <ArchivePhoto src={SHEET} credit={CREDIT} font={p.font} label="الصورة الأصلية · 1878" zoom={[1, 1.05]} />
      </Shot>

      <ArabicHook font={p.font} from={0} durationInFrames={c.year - 2} lines={HOOK} capHeightPct={3.4} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <Fact font={p.font} from={c.year} to={c.twelve - 2} value="1878" caption={['بالو ألتو · كاليفورنيا']} y={74} />
      <Fact font={p.font} from={c.twelve} to={c.secret - 2} value="12" caption={['كاميرا · كل وحدة بعد 27 إنش']} y={74} />
      <PartLabel font={p.font} from={c.threads} durationInFrames={c.shutter - c.threads} text="خيط" capHeightPct={2.4} x={86} y={20} anchor={pin(kC, A.thread, c.threads)} width={width} height={height} />
      <PartLabel font={p.font} from={c.shutter} durationInFrames={c.series - c.shutter} text="الغالق" capHeightPct={2.4} x={86} y={20} anchor={pin(kC, A.cam_04, c.shutter)} width={width} height={height} />
      <Fact font={p.font} from={c.fraction} to={c.series - 2} value={'أقل من \u20661/2000\u2069 ثانية'} caption={['مدة التعريض حسب البطاقة الأصلية']} y={74} capHeightPct={4.2} />
      <Fact font={p.font} from={c.play} to={c.cinema - 2} value={'⁦1/25⁩ ثانية'} caption={['بين كل صورة والثانية · حسب البطاقة']} y={80} capHeightPct={4} />

      {p.voiceStatus === 'temp' ? <Tag text="صوت مؤقت" font={p.font} tone="temp" x={70} y={7.6} /> : null}
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
