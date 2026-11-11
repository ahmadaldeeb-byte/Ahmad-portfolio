// Ep08 · المراية اللي بتطير — SLR mirror box (section view). 3D: public/models/ep08.glb.
// Optical axis: light travels -Z (lens at z=+0.6, sensor at z=-0.31). The mirror starts to rise ON «بتطلع».
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack, type ArabicFont} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {Shot, SoundBed, Tag} from '../engine/Shots';
import {Stage3D, project, viewAt, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {Ray} from '../engine/Primitives';
import {node, setOpacity, useGLB} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['صوت «التك»', 'هاد صوت مراية بتطير'];
export const CUES: CueList = [
  ['flies', 'بتطير'],
  ['slr', 'بكاميرات'],
  ['angled', 'مايلة'],
  ['reflect', 'بتعكس'],
  ['screen', 'شاشة'],
  ['reversed', 'معكوسة'],
  ['prism', 'منشور'],
  ['fix', 'وبعدّلها'],
  ['press', 'تكبس'],
  ['up', 'بتطلع'],
  ['shutter', 'الغالق'],
  ['back', 'بترجع'],
  ['fraction', 'بجزء'],
  ['moment', 'لحظة'],
  ['dark', 'عتمة'],
  ['mirrorless', 'بدون'],
  ['sensor', 'والحساس'],
];

const SCENE_IMG = 'archive/ep03-boulevard-du-temple.jpg'; // what the photographer is looking at
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const AMBER = '#ffd27a';

/** Mirror angle 0 (down, 45°) → 1 (up under the screen). Up on «بتطلع», back on «بترجع». */
const mirrorUp = (f: number, c: Record<string, number>) => Math.min(ramp(f, c.up, c.up + 8, Easing.out(Easing.cubic)), 1 - ramp(f, c.back, c.back + 10, Easing.in(Easing.cubic)));

const SLR: React.FC<{f: number; c: Record<string, number>; scene: THREE.Group; mode: 'outside' | 'section' | 'mirrorless'}> = ({f, c, scene, mode}) => {
  const sectionOpen = mode === 'outside' ? 0 : 1;
  setOpacity(node(scene, 'section_face'), 0);
  setOpacity(node(scene, 'body_side_right'), 1 - 0.75 * sectionOpen);
  const up = mirrorUp(f, c);
  const hinge = node(scene, 'mirror_hinge');
  if (hinge) hinge.rotation.x = -up * (Math.PI / 4);
  // focal-plane shutter: first curtain drops away, second follows to close
  const open1 = ramp(f, c.shutter, c.shutter + 6);
  const close2 = ramp(f, c.shutter + 12, c.shutter + 18);
  const c1 = node(scene, 'curtain_first');
  const c2 = node(scene, 'curtain_second');
  if (c1) {
    c1.userData.base ??= c1.position.clone();
    c1.position.y = c1.userData.base.y - 0.4 * open1 + 0.4 * ramp(f, c.back + 12, c.back + 20);
  }
  if (c2) {
    c2.userData.base ??= c2.position.clone();
    c2.position.y = c2.userData.base.y - 0.4 * close2 + 0.4 * ramp(f, c.back + 12, c.back + 20);
  }
  // mirrorless: the mirror box, screen and prism are removed
  const gone = mode === 'mirrorless' ? ramp(f, c.mirrorless + 4, c.mirrorless + 30) : 0;
  for (const n of ['mirror', 'focus_screen', 'pentaprism', 'eyepiece', 'eyepiece_glass']) setOpacity(node(scene, n), 1 - gone);
  setOpacity(node(scene, 'curtain_first'), 1 - gone);
  setOpacity(node(scene, 'curtain_second'), 1 - gone);
  // light paths
  const toScreen = mode === 'section' ? ramp(f, c.reflect, c.reflect + 18) * (1 - up) : 0;
  const toEye = mode === 'section' ? ramp(f, c.prism + 8, c.fix + 10) * (1 - up) : 0;
  const toSensor = mode === 'section' ? Math.min(open1, 1 - close2 * 0.9) * (up > 0.9 ? 1 : 0) : mode === 'mirrorless' ? gone : 0;
  const pts = {front: V(0, 0.45, 2.2), lens: V(0, 0.45, 0.6), mirror: V(0, 0.45, 0.12), screen: V(0, 0.72, 0.12), roof: V(0, 1.0, 0.03), rear: V(0, 0.9, -0.2), eye: V(0, 0.86, -0.45), out: V(0, 0.86, -1.3), sensor: V(0, 0.45, -0.31)};
  const glow = (a: THREE.Vector3, b: THREE.Vector3, p: number, o: number) => <Ray from={a} to={b} progress={p} opacity={o} r={0.012} color={AMBER} onTop />;
  const seg = (t: number, i: number, n: number) => Math.max(0, Math.min(1, t * n - i));
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#e8eeff', '#1a1a1e', 0.5]} />
      <directionalLight position={[-3, 4, 3]} intensity={2} />
      <pointLight position={[-1.2, 0.8, 0]} intensity={sectionOpen * 2.5} distance={3} color="#fff2e0" />
      <primitive object={scene} />
      {toScreen > 0 || toEye > 0 ? (
        <>
          {glow(pts.front, pts.lens, seg(toScreen, 0, 3), 1)}
          {glow(pts.lens, pts.mirror, seg(toScreen, 1, 3), 1)}
          {glow(pts.mirror, pts.screen, seg(toScreen, 2, 3), 1)}
          {glow(pts.screen, pts.roof, seg(toEye, 0, 4), 1)}
          {glow(pts.roof, pts.rear, seg(toEye, 1, 4), 1)}
          {glow(pts.rear, pts.eye, seg(toEye, 2, 4), 1)}
          {glow(pts.eye, pts.out, seg(toEye, 3, 4), 1)}
        </>
      ) : null}
      {toSensor > 0.01 ? (
        <>
          {glow(pts.front, pts.lens, 1, toSensor)}
          {glow(pts.lens, pts.sensor, 1, toSensor)}
          <mesh position={[0, 0.45, -0.295]}>
            <planeGeometry args={[0.46, 0.32]} />
            <meshBasicMaterial color={AMBER} transparent opacity={0.45 * toSensor} toneMapped={false} />
          </mesh>
        </>
      ) : null}
    </>
  );
};

/** The photographer's view through the eyepiece: the scene, then black while the mirror is up. */
const Viewfinder: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  // replay the press: blackout for the instant the mirror is up
  const t = f - c.moment;
  const black = t > 18 && t < 30 ? 1 : interpolate(t, [14, 18, 30, 34], [0, 1, 1, 0], clamp) * 0 + (t > 18 && t < 30 ? 1 : 0);
  const dark = Math.max(black, ramp(f, c.dark - 2, c.dark + 4) * (1 - ramp(f, c.dark + 22, c.dark + 30)));
  return (
    <AbsoluteFill style={{background: '#000', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 860, height: 640, borderRadius: 40, overflow: 'hidden', position: 'relative', boxShadow: '0 0 0 18px #111, 0 0 80px rgba(0,0,0,0.9) inset'}}>
        <Img src={staticFile(SCENE_IMG)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', inset: 0, background: '#000', opacity: dark}} />
        <svg width={860} height={640} style={{position: 'absolute', inset: 0, opacity: 1 - dark}}>
          <circle cx={430} cy={320} r={70} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
          <line x1={360} y1={320} x2={500} y2={320} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
        </svg>
      </div>
      <div style={{position: 'absolute', top: '74%', width: '100%', fontFamily: arabicStack(font), fontWeight: 700, fontSize: 44, color: dark > 0.5 ? AMBER : '#e8ecf2', textAlign: 'center', direction: 'rtl'}}>
        {dark > 0.5 ? 'عتمة · المراية فوق' : 'من عين المصوّر'}
      </div>
    </AbsoluteFill>
  );
};

/** Mirrorless: the rear screen shows what the sensor sees. */
const RearScreen: React.FC<{f: number; c: Record<string, number>}> = ({f, c}) => {
  const a = ramp(f, c.sensor, c.sensor + 16);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '23%', opacity: a}}>
      <div style={{width: 520, height: 340, borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 0 10px #111, 0 20px 50px rgba(0,0,0,0.6)'}}>
        <Img src={staticFile(SCENE_IMG)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    </AbsoluteFill>
  );
};

export const Ep08: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scene = useGLB('models/ep08.glb');
  const c = p.cueFrames;
  if (c.flies === undefined || !scene) return null;
  const end = c.end + 45;
  const kO: CamKey[] = [
    {f: 0, pos: [1.6, 1.3, 2.6], target: [0.3, 0.55, 0.1], fov: 36},
    {f: c.slr, pos: [-2.0, 1.1, 1.8], target: [0.1, 0.55, 0.1], fov: 36},
  ];
  const kS: CamKey[] = [
    {f: c.slr, pos: [-2.6, 0.75, 0.6], target: [0, 0.6, 0.0], fov: 36},
    {f: c.prism, pos: [-2.2, 0.95, 0.1], target: [0, 0.75, -0.05], fov: 34},
    {f: c.press, pos: [-2.0, 0.65, 0.05], target: [0, 0.55, -0.05], fov: 34},
  ];
  const kM: CamKey[] = [
    {f: c.mirrorless, pos: [-2.4, 0.8, 0.4], target: [0, 0.55, 0.0], fov: 36},
    {f: end, pos: [-2.2, 0.9, -0.2], target: [0, 0.5, -0.1], fov: 36},
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
          {at: 20, name: 'thud'},
          {at: c.flies, name: 'thud'},
          {at: c.slr - 6, name: 'whoosh'},
          {at: c.reflect, name: 'shimmer', vol: 0.5},
          {at: c.up, name: 'thud'},
          {at: c.shutter, name: 'shutter'},
          {at: c.back, name: 'click'},
          {at: c.moment + 18, name: 'thud', vol: 0.7},
          {at: c.mirrorless - 6, name: 'whoosh'},
        ]}
      />
      <Shot from={0} to={c.slr + 4} fadeIn={0} name="SLR outside">
        <Stage3D keys={kO} frameOffset={0}>
          <SLR f={f} c={c} scene={scene} mode="outside" />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.slr} to={c.moment + 4} name="Section">
        <Stage3D keys={kS} frameOffset={c.slr}>
          <SLR f={f} c={c} scene={scene} mode="section" />
        </Stage3D>
        <Tag text="مقطع · إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.moment} to={c.mirrorless + 4} name="Viewfinder">
        <Viewfinder f={f} c={c} font={p.font} />
        <Tag text="محاكاة" font={p.font} />
      </Shot>
      <Shot from={c.mirrorless} to={end} fadeOut={0} name="Mirrorless">
        <Stage3D keys={kM} frameOffset={c.mirrorless}>
          <SLR f={f} c={c} scene={scene} mode="mirrorless" />
        </Stage3D>
        <RearScreen f={f} c={c} />
        <Tag text="مقطع · إعادة بناء" font={p.font} />
      </Shot>

      <ArabicHook font={p.font} from={0} durationInFrames={c.slr - 2} lines={HOOK} capHeightPct={3.4} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <PartLabel font={p.font} from={c.angled} durationInFrames={c.screen - c.angled} text="مراية · 45°" capHeightPct={2.4} x={86} y={20} anchor={pin(kS, A.mirror, c.angled)} width={width} height={height} />
      <PartLabel font={p.font} from={c.screen} durationInFrames={c.prism - c.screen} text="شاشة ضبابية" capHeightPct={2.4} x={86} y={20} anchor={pin(kS, [0, 0.72, 0.0], c.screen)} width={width} height={height} />
      <PartLabel font={p.font} from={c.prism} durationInFrames={c.press - c.prism} text="منشور خماسي" capHeightPct={2.4} x={86} y={20} anchor={pin(kS, A.prism, c.prism)} width={width} height={height} />
      <PartLabel font={p.font} from={c.shutter} durationInFrames={c.moment - c.shutter} text="الغالق" capHeightPct={2.4} x={86} y={20} anchor={pin(kS, A.shutter, c.shutter)} width={width} height={height} />
      <Fact font={p.font} from={c.fraction} to={c.moment - 2} value="جزء من الثانية" caption={['المراية تطلع · الغالق يفتح · المراية ترجع']} y={74} capHeightPct={4.2} />
      <PartLabel font={p.font} from={c.sensor} durationInFrames={end - c.sensor} text="الحساس" capHeightPct={2.4} x={86} y={20} anchor={pin(kM, A.sensor, c.sensor)} width={width} height={height} />

      {p.voiceStatus === 'temp' ? <Tag text="صوت مؤقت" font={p.font} tone="temp" x={70} y={7.6} /> : null}
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
