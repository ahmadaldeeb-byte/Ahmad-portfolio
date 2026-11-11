// Ep02 · أول صورة بالتاريخ — Niépce, View from the Window at Le Gras (1826/27).
// 3D: Blender scene public/models/ep02.glb (series/camera-history/blender/ep02.py). Every reveal starts
// ON the word that explains it (cue frames from the voice-over's words.json).
import React from 'react';
import {AbsoluteFill, interpolate, Easing, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {ArchivePhoto, Shot, SoundBed, Tag, VoiceBadge} from '../engine/Shots';
import {Stage3D, viewAt, project, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {ImagePlane, Ray} from '../engine/Primitives';
import {node, setOpacity, useGLB, useTexture} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['أول صورة بالتاريخ', 'ما انطبعت على ورق'];
export const CUES: CueList = [
  ['paper', 'ورق'],
  ['metal', 'معدن'],
  ['year', 'سنة'],
  ['niepce', 'نيسفور'],
  ['bitumen', 'قار'],
  ['secret', 'هون'],
  ['light', 'يضربه'],
  ['hard', 'بقسى'],
  ['soft', 'طري'],
  ['camera', 'بكاميرا'],
  ['window', 'شبّاك'],
  ['exposure', 'ثماني'],
  ['wash', 'بزيت'],
  ['dissolve', 'بذوب'],
  ['emerge', 'وبتطلع'],
  ['sun', 'الشمس'],
  ['sides', 'جهتين'],
  ['lost', 'ضاع'],
  ['found', 'ولقوه'],
  ['museum', 'بجامعة'],
];

const CREDIT = 'Nicéphore Niépce, View from the Window at Le Gras, c. 1826–27 · enhanced reproduction by Helmut Gernsheim, c. 1952 · Public domain · Harry Ransom Center, UT Austin · via Wikimedia Commons';
const IMG = 'archive/ep02-le-gras.jpg';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const v = (p: number[]) => new THREE.Vector3(p[0], p[1], p[2]);

// ── camera paths (absolute episode frames, filled from cues) ─────────────────────────────────────
const tableKeys = (c: Record<string, number>): CamKey[] => [
  {f: c.metal, pos: [3.2, 1.75, -0.35], target: [2.45, 0.84, -1.6], fov: 34},
  {f: c.bitumen, pos: [2.75, 1.4, -0.85], target: [2.32, 0.84, -1.6], fov: 32},
  {f: c.secret, pos: [2.5, 1.22, -1.1], target: [2.3, 0.84, -1.6], fov: 30},
];
const roomKeys = (c: Record<string, number>): CamKey[] => [
  {f: c.camera, pos: [0.95, 1.55, -1.45], target: [0, 1.25, 0.2], fov: 42},
  {f: c.camera + 40, pos: [1.85, 1.3, -0.3], target: [0, 1.22, -0.31], fov: 30}, // side cutaway: lens and plate both in frame
  {f: c.window, pos: [0.25, 1.55, -1.1], target: [0, 2.4, 10], fov: 50},
  {f: c.exposure, pos: [0.0, 1.75, -1.5], target: [0, 3.6, 12], fov: 58},
  {f: c.wash - 6, pos: [0.0, 1.7, -1.4], target: [0, 3.2, 12], fov: 56},
];
const washKeys = (c: Record<string, number>): CamKey[] => [
  {f: c.wash, pos: [3.45, 1.75, -0.65], target: [2.75, 0.85, -1.6], fov: 34},
  {f: c.emerge, pos: [3.1, 1.32, -1.12], target: [2.95, 0.87, -1.6], fov: 30},
  {f: c.sun - 4, pos: [3.02, 1.22, -1.25], target: [2.95, 0.87, -1.6], fov: 30},
];
const museumKeys = (c: Record<string, number>): CamKey[] => [
  {f: c.lost, pos: [-2.2, 1.55, -1.3], target: [-3.0, 1.22, -2.6], fov: 34},
  {f: c.museum, pos: [-2.75, 1.32, -2.05], target: [-3.0, 1.22, -2.6], fov: 30},
  {f: c.end + 45, pos: [-3.25, 1.3, -2.05], target: [-3.0, 1.22, -2.6], fov: 29},
];

/** The whole Blender scene, posed for frame f (absolute). */
const Le_Gras: React.FC<{f: number; c: Record<string, number>; mode: 'table' | 'room' | 'wash' | 'museum'; scene: THREE.Group; tex: THREE.Texture}> = ({f, c, mode, scene, tex}) => {
  const coat = ramp(f, c.bitumen, c.bitumen + 30); // brush the bitumen on
  const toTray = ramp(f, c.wash, c.wash + 24);
  const dissolve = ramp(f, c.dissolve, c.emerge + 10);
  const sunT = ramp(f, c.exposure, c.wash - 6); // sun arc during the exposure
  // plate group (metal + bitumen + image) moves into the tray
  for (const n of ['plate_metal', 'plate_bitumen', 'plate_image']) {
    const o = node(scene, n);
    if (!o) continue;
    o.userData.base ??= o.position.clone();
    o.position.copy(o.userData.base).add(new THREE.Vector3(0.65 * toTray, 0.08 * Math.sin(Math.PI * toTray) + 0.036 * toTray, 0));
  }
  const bit = node(scene, 'plate_bitumen');
  if (bit) bit.scale.set(Math.max(0.001, coat), 1, 1);
  setOpacity(bit, mode === 'wash' ? 1 - dissolve * 0.92 : 1);
  setOpacity(node(scene, 'plate_image'), 0); // archive texture drawn by ImagePlane below
  const oilFilm = node(scene, 'tray_oil');
  if (oilFilm) oilFilm.position.y = 0.014; // film sits just above the plate
  setOpacity(oilFilm, 0.55 * (1 - ramp(f, c.emerge, c.emerge + 20)));
  setOpacity(node(scene, 'cam_body'), mode === 'room' ? 1 - 0.8 * ramp(f, c.camera + 6, c.camera + 30) * (1 - ramp(f, c.window - 6, c.window + 6)) : 1);
  setOpacity(node(scene, 'cam_body_cut'), 0);
  // section cut for the camera close-up: hide what stands between the viewer and the box
  const cut = mode === 'room' ? ramp(f, c.camera + 6, c.camera + 26) * (1 - ramp(f, c.window - 8, c.window + 4)) : 0;
  for (const n of ['wall_right', 'window_jamb_1', 'casement', 'table_top', 'table_leg_0', 'table_leg_2']) setOpacity(node(scene, n), 1 - cut);
  setOpacity(node(scene, 'plate_museum'), 0);
  const sun = node(scene, 'sun');
  const sunPos = new THREE.Vector3(-26 + 52 * sunT, 6 + 14 * Math.sin(Math.PI * sunT), 30);
  if (sun) sun.position.copy(sunPos);
  const platePos = v(A.plate).add(new THREE.Vector3(0.65 * toTray, 0.08 * Math.sin(Math.PI * toTray) + 0.036 * toTray + 0.0012, 0));
  const lens = v(A.lens);
  const inCam = v(A.plate_in_camera);
  const rays = mode === 'room' ? ramp(f, c.camera + 12, c.camera + 36) * (1 - ramp(f, c.window - 6, c.window + 4)) : 0;
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#fff2dc', '#2a2620', 0.55]} />
      <directionalLight position={sunPos.toArray()} intensity={2.6} color="#ffe2b0" />
      <pointLight position={[0, 1.8, -0.6]} intensity={2.2} distance={4} color="#ffe8c8" />
      <pointLight position={[2.6, 2.2, -1.2]} intensity={mode === 'table' || mode === 'wash' ? 3.2 : 0} distance={3} color="#fff4e2" />
      <spotLight position={[-3, 2.4, -2.0]} target-position={[-3, 1.22, -2.6]} intensity={mode === 'museum' ? 9 : 0} angle={0.5} penumbra={0.6} />
      <primitive object={scene} />
      {/* image on the hero plate: appears where the soft bitumen washes away */}
      <ImagePlane tex={tex} position={platePos.toArray() as [number, number, number]} size={[0.2, 0.15]} rotation={[-Math.PI / 2, 0, 0]} opacity={mode === 'wash' ? dissolve : 0} />
      {/* image projected upside-down inside the camera onto the plate */}
      <ImagePlane tex={tex} position={[inCam.x, inCam.y, inCam.z + 0.008]} size={[0.19, 0.14]} opacity={rays * 0.9} flip />
      {/* museum plate */}
      <ImagePlane tex={tex} position={[-3.0, 1.22, -2.578]} size={[0.2, 0.15]} opacity={mode === 'museum' ? 1 : 0} />
      {/* rays from the top and bottom of the courtyard cross at the lens */}
      <Ray from={new THREE.Vector3(0, 3.6, 9)} to={lens} progress={rays * 2} opacity={rays} color="#ffd27a" r={0.006} />
      <Ray from={lens} to={new THREE.Vector3(inCam.x, inCam.y - 0.06, inCam.z + 0.01)} progress={Math.max(0, rays * 2 - 1)} opacity={rays} color="#ffd27a" r={0.004} onTop />
      <Ray from={new THREE.Vector3(0, -0.6, 9)} to={lens} progress={rays * 2} opacity={rays} color="#7ad4ff" r={0.006} />
      <Ray from={lens} to={new THREE.Vector3(inCam.x, inCam.y + 0.06, inCam.z + 0.01)} progress={Math.max(0, rays * 2 - 1)} opacity={rays} color="#7ad4ff" r={0.004} onTop />
    </>
  );
};

/** 2D cross-section of the plate: pewter + bitumen; light hardens (links) the lit part; shade stays soft. */
const CrossSection: React.FC<{f: number; c: Record<string, number>; font: SeriesProps['font']}> = ({f, c, font}) => {
  const {width} = useVideoConfig();
  const lit = ramp(f, c.light, c.light + 20);
  const link = ramp(f, c.hard - 6, c.hard + 18);
  const soft = ramp(f, c.soft - 4, c.soft + 10);
  const W = width * 0.84;
  const x0 = (width - W) / 2;
  const yB = 1080; // bitumen layer centre
  const mols = Array.from({length: 26}, (_, i) => ({x: x0 + 30 + (i % 13) * ((W - 60) / 12), y: yB - 22 + Math.floor(i / 13) * 44, i}));
  return (
    <AbsoluteFill>
      <svg width={width} height={1920}>
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd27a" stopOpacity="0" />
            <stop offset="1" stopColor="#ffd27a" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* light on the left half */}
        <rect x={x0} y={560} width={W / 2} height={(yB - 40 - 560) * lit} fill="url(#beam)" />
        {Array.from({length: 5}, (_, k) => (
          <line key={k} x1={x0 + 50 + k * (W / 2 - 100) / 4} y1={560} x2={x0 + 50 + k * (W / 2 - 100) / 4} y2={560 + (yB - 60 - 560) * lit} stroke="#ffd27a" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
        ))}
        {/* shade on the right half */}
        <rect x={x0 + W / 2} y={560} width={W / 2} height={yB - 600} fill="rgba(0,0,0,0.25)" opacity={lit} />
        {/* pewter base */}
        <rect x={x0} y={yB + 60} width={W} height={80} rx={8} fill="#9a9a96" />
        {/* bitumen layer */}
        <rect x={x0} y={yB - 50} width={W} height={100} rx={6} fill="#4a2c12" />
        {/* molecules: lit ones link (hard), shaded ones stay apart (soft) */}
        {mols.map((m) => {
          const isLit = m.x < x0 + W / 2;
          const n = mols[m.i + 1];
          return (
            <g key={m.i}>
              {isLit && n && n.y === m.y && n.x < x0 + W / 2 ? <line x1={m.x} y1={m.y} x2={n.x} y2={n.y} stroke="#ffcf8a" strokeWidth={6} opacity={link} /> : null}
              {isLit && m.i < 13 && m.x < x0 + W / 2 ? <line x1={m.x} y1={m.y} x2={m.x} y2={m.y + 44} stroke="#ffcf8a" strokeWidth={6} opacity={link} /> : null}
              <circle cx={m.x + (isLit ? 0 : Math.sin(f * 0.2 + m.i) * 6 * soft)} cy={m.y + (isLit ? 0 : Math.cos(f * 0.17 + m.i) * 5 * soft)} r={14} fill={isLit ? `rgb(${120 + 100 * link},${80 + 80 * link},${40 + 40 * link})` : '#7a4a1e'} />
            </g>
          );
        })}
      </svg>
      <div dir="rtl" style={{position: 'absolute', left: '8%', width: '38%', top: 1250, textAlign: 'center', color: '#ffcf8a', fontFamily: arabicStack(font), fontWeight: 700, fontSize: 52, opacity: link}}>قاسي</div>
      <div dir="rtl" style={{position: 'absolute', left: '54%', width: '38%', top: 1250, textAlign: 'center', color: '#c89a6a', fontFamily: arabicStack(font), fontWeight: 700, fontSize: 52, opacity: soft}}>طري</div>
      <div dir="rtl" style={{position: 'absolute', left: '8%', right: '8%', top: 1340, textAlign: 'center', color: '#a1a1a6', fontFamily: arabicStack(font), fontWeight: 500, fontSize: 34}}>طبقة القار فوق لوح القصدير · مقطع مكبّر</div>
    </AbsoluteFill>
  );
};

/** The two-sided light in the original: markers on both building faces. */
const BothSides: React.FC<{f: number; c: Record<string, number>; font: SeriesProps['font']}> = ({f, c, font}) => {
  const a = ramp(f, c.sides - 2, c.sides + 12);
  const ring = (x: number, y: number, label: string) => (
    <>
      <circle cx={x} cy={y} r={70 + 6 * Math.sin(f * 0.15)} fill="none" stroke="#ffd27a" strokeWidth={6} opacity={a} />
      <text x={x} y={y - 100} textAnchor="middle" fill="#ffd27a" fontSize={40} fontWeight={700} fontFamily={arabicStack(font)} opacity={a} direction="rtl">
        {label}
      </text>
    </>
  );
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        {ring(250, 900, 'ضو')}
        {ring(830, 905, 'وضو')}
      </svg>
    </AbsoluteFill>
  );
};

export const Ep02: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  // load outside the WebGL canvas so the frame is only captured once the model is in the scene
  const scene = useGLB('models/ep02.glb');
  const tex = useTexture(IMG);
  const c = p.cueFrames;
  if (c.metal === undefined || !scene || !tex) return null;
  const end = c.end + 45;
  const keysT = tableKeys(c);
  const keysR = roomKeys(c);
  const keysW = washKeys(c);
  const keysM = museumKeys(c);
  const pin = (keys: CamKey[], pt: number[], from: number) => (lf: number) => project(v(pt), viewAt(keys, lf + from), width, height);
  return (
    <AbsoluteFill style={{background: '#07080a'}}>
      <SoundBed
        voiceover={p.voiceover}
        voiceFrom={p.voiceFrom}
        musicVolume={p.musicVolume}
        sfxVolume={p.sfxVolume}
        sfx={[
          {at: c.metal - 6, name: 'whoosh'},
          {at: c.bitumen, name: 'liquid', vol: 0.5},
          {at: c.secret, name: 'shimmer'},
          {at: c.camera - 6, name: 'whoosh'},
          {at: c.exposure, name: 'tick'},
          {at: c.exposure + 15, name: 'tick'},
          {at: c.exposure + 30, name: 'tick'},
          {at: c.wash, name: 'liquid'},
          {at: c.emerge, name: 'shimmer', vol: 0.7},
          {at: c.lost - 6, name: 'whoosh'},
        ]}
      />

      {/* A · the original */}
      <Shot from={0} to={c.metal + 4} fadeIn={0} name="Original">
        <ArchivePhoto src={IMG} credit={CREDIT} font={p.font} label="الصورة الأصلية · 1826–1827" zoom={[1.0, 1.12]} />
      </Shot>

      {/* B · the plate and the bitumen (reconstruction) */}
      <Shot from={c.metal} to={c.secret + 4} name="Plate">
        <Stage3D keys={keysT} frameOffset={c.metal}>
          <Le_Gras f={f} c={c} mode="table" scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>

      {/* C · why it works: light hardens the bitumen */}
      <Shot from={c.secret} to={c.camera + 4} name="Cross-section">
        <AbsoluteFill style={{background: 'radial-gradient(110% 70% at 50% 45%, #1d2230 0%, #0b0d12 70%)'}} />
        <CrossSection f={f} c={c} font={p.font} />
        <Tag text="رسم توضيحي" font={p.font} />
      </Shot>

      {/* D · camera at the window, the long exposure */}
      <Shot from={c.camera} to={c.wash + 4} name="Window">
        <Stage3D keys={keysR} frameOffset={c.camera}>
          <Le_Gras f={f} c={c} mode="room" scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>

      {/* E · lavender-oil wash: the image appears */}
      <Shot from={c.wash} to={c.sun + 4} name="Wash">
        <Stage3D keys={keysW} frameOffset={c.wash}>
          <Le_Gras f={f} c={c} mode="wash" scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>

      {/* F · the original again: light on both sides */}
      <Shot from={c.sun} to={c.lost + 4} name="Both sides">
        <ArchivePhoto src={IMG} credit={CREDIT} font={p.font} label="الصورة الأصلية" zoom={[1.12, 1.18]} />
        <BothSides f={f} c={c} font={p.font} />
      </Shot>

      {/* G · lost and found: the museum case */}
      <Shot from={c.lost} to={end} fadeOut={0} name="Museum">
        <Stage3D keys={keysM} frameOffset={c.lost} background="radial-gradient(90% 60% at 50% 45%, #2a2024 0%, #0c0a0b 70%)">
          <Le_Gras f={f} c={c} mode="museum" scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>

      {/* text */}
      <ArabicHook font={p.font} from={0} durationInFrames={c.metal - 2} lines={HOOK} capHeightPct={3.4} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <Fact font={p.font} from={c.year} to={c.bitumen - 2} value={"\u20661826 – 1827\u2069"} caption={['نيسفور نييبس · فرنسا']} y={70} />
      <PartLabel font={p.font} from={c.bitumen} durationInFrames={c.secret - c.bitumen} text="قار يهودا" capHeightPct={2.5} x={86} y={20} anchor={pin(keysT, A.plate, c.bitumen)} width={width} height={height} />
      <PartLabel font={p.font} from={c.camera + 10} durationInFrames={c.window - c.camera - 10} text="لوح القار" capHeightPct={2.4} x={86} y={20} anchor={pin(keysR, A.plate_in_camera, c.camera + 10)} width={width} height={height} />
      <Fact font={p.font} from={c.exposure} to={c.wash - 2} value="8 ساعات ← أيام" caption={['مدة التعريض', 'حسب التقديرات']} y={68} capHeightPct={4.4} />
      <PartLabel font={p.font} from={c.wash + 4} durationInFrames={c.emerge - c.wash} text="زيت اللافندر" capHeightPct={2.4} x={86} y={20} anchor={pin(keysW, A.tray, c.wash + 4)} width={width} height={height} />
      <Fact font={p.font} from={c.found} to={c.museum - 2} value="1952" caption={['انلقى بعد ما ضاع عقود']} y={70} />
      <PartLabel font={p.font} from={c.museum} durationInFrames={end - c.museum} text="مركز هاري رانسوم · أوستن" capHeightPct={2.3} x={86} y={20} anchor={pin(keysM, A.case, c.museum)} width={width} height={height} />

      <VoiceBadge status={p.voiceStatus} font={p.font} />
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
