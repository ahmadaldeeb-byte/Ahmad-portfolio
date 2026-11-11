// Ep10 · كاميرا الموبايل — voice-coil module: lens-shift OIS + autofocus, then multi-frame merging.
// 3D: public/models/ep10.glb. Lens-shift OIS is shown; sensor-shift designs also exist (said on screen).
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack, type ArabicFont} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {Shot, SoundBed, Tag, VoiceBadge} from '../engine/Shots';
import {Stage3D, project, viewAt, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {Ray} from '../engine/Primitives';
import {node, setOpacity, useGLB} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['عدسة أصغر من ظفرك', 'وإيدك أصلًا بترجف؟'];
export const CUES: CueList = [
  ['inside', 'جوّا'],
  ['hung', 'معلّقة'],
  ['magnets', 'مغناطيسات'],
  ['coils', 'وملفات'],
  ['voice', 'voice'],
  ['secret', 'هون'],
  ['gyro', 'جيروسكوب'],
  ['move', 'بتحرّك'],
  ['opposite', 'عكس'],
  ['gimbal', 'الجيمبل'],
  ['mm', 'بأجزاء'],
  ['focusMotor', 'المحرك'],
  ['focus', 'التركيز'],
  ['press', 'تكبس'],
  ['several', 'كذا'],
  ['merge', 'وبدمجهم'],
  ['clean', 'أوضح'],
  ['notOne', 'مش'],
];

const IMG = 'archive/ep07-tartan-ribbon.jpg';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const AMBER = '#ffd27a';
const OX = 20;
/** hand tremor (module units, ×100 scale → ~0.1 = 1 mm) */
const shake = (f: number, amp: number) => ({x: amp * (0.6 * Math.sin(f * 0.53) + 0.4 * Math.sin(f * 1.31 + 1)), z: amp * (0.6 * Math.cos(f * 0.47 + 2) + 0.4 * Math.sin(f * 1.07))});

const Phone: React.FC<{f: number; c: Record<string, number>; scene: THREE.Group; mode: 'phone' | 'module'}> = ({f, c, scene, mode}) => {
  const ph = node(scene, 'phone');
  if (ph) {
    const s = shake(f, 0.035);
    ph.rotation.set(s.x * 0.6, 0, s.z * 0.6);
  }
  // module: open the housing, explode the stack a little
  const open = mode === 'module' ? ramp(f, c.hung - 4, c.hung + 20) : 0;
  for (let k = 0; k < 4; k++) setOpacity(node(scene, `housing_${k}`), 1 - 0.85 * open);
  setOpacity(node(scene, 'cover_glass'), 1 - 0.7 * open);
  for (let k = 0; k < 2; k++) setOpacity(node(scene, `leaf_spring_${k}`), 0.55);
  // OIS: the whole module shakes with the hand; the lens carrier moves the opposite way (lag 2 frames)
  const amp = mode === 'module' ? 0.08 * ramp(f, c.secret, c.secret + 12) * (1 - ramp(f, c.focusMotor - 10, c.focusMotor)) : 0;
  const ois = ramp(f, c.move, c.move + 10);
  const sh = shake(f, amp);
  const shLag = shake(f - 2, amp);
  scene.traverse((o) => {
    if (o.name.startsWith('housing_') || o.name.startsWith('magnet_') || o.name.startsWith('mod_') || o.name === 'gyro_chip' || o.name.startsWith('leaf_spring')) {
      o.userData.base ??= o.position.clone();
      o.position.set(o.userData.base.x + sh.x, o.userData.base.y, o.userData.base.z + sh.z);
    }
  });
  const carrier = node(scene, 'lens_carrier');
  // autofocus: carrier moves along the optical axis
  const af = ramp(f, c.focusMotor, c.focusMotor + 16) * (1 - ramp(f, c.focus + 10, c.focus + 26));
  if (carrier) {
    carrier.userData.base ??= carrier.position.clone();
    carrier.position.set(carrier.userData.base.x + sh.x - shLag.x * ois, carrier.userData.base.y + 0.12 * af + 0.03 * Math.sin(f * 0.4) * af, carrier.userData.base.z + sh.z - shLag.z * ois);
  }
  const gyroPulse = mode === 'module' ? ramp(f, c.gyro, c.gyro + 8) * (0.5 + 0.5 * Math.sin(f * 0.8)) : 0;
  const g = node(scene, 'gyro_chip') as THREE.Mesh | undefined;
  if (g) {
    const m = g.material as THREE.MeshStandardMaterial;
    m.emissive = new THREE.Color(AMBER);
    m.emissiveIntensity = gyroPulse;
  }
  const lensTop = carrier ? new THREE.Vector3(carrier.position.x, carrier.position.y + 0.3, carrier.position.z) : new THREE.Vector3(OX, 0.9, 0);
  const beam = mode === 'module' ? ramp(f, c.secret, c.secret + 10) * (1 - ramp(f, c.focusMotor - 6, c.focusMotor)) : 0;
  return (
    <>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#eef2ff', '#22201e', 0.5]} />
      <directionalLight position={[OX + 2, 4, 3]} intensity={2.2} />
      <directionalLight position={[2, 3, -3]} intensity={1.6} />
      <primitive object={scene} />
      <Ray from={lensTop} to={new THREE.Vector3(OX, 3.6, 0)} r={0.015} color={AMBER} opacity={beam} onTop />
      <mesh position={[OX, 3.6, 0]}>
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshBasicMaterial color={AMBER} transparent opacity={beam} toneMapped={false} />
      </mesh>
    </>
  );
};

/** Several noisy short frames → aligned and merged into one cleaner picture. */
const Merge: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const appear = (k: number) => ramp(f, c.several + k * 5, c.several + k * 5 + 8);
  const m = ramp(f, c.merge, c.merge + 30);
  const clean = ramp(f, c.clean - 4, c.clean + 16);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 40%, #1e2433 0%, #07080b 75%)', alignItems: 'center', justifyContent: 'center'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={3} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.55" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
      </svg>
      {Array.from({length: 6}, (_, k) => {
        const dx = (k - 2.5) * 70 * (1 - m);
        const dy = (k - 2.5) * 60 * (1 - m);
        return (
          <div key={k} style={{position: 'absolute', width: 640, height: 520, translate: `${dx}px ${dy}px`, opacity: appear(k) * (1 - clean) * (m > 0 ? 0.45 + 0.55 * (1 - m) : 1), rotate: `${(k - 2.5) * 1.5 * (1 - m)}deg`, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', borderRadius: 10, overflow: 'hidden'}}>
            <Img src={staticFile(IMG)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'url(#noise) brightness(0.7)'}} />
          </div>
        );
      })}
      <div style={{position: 'absolute', width: 640, height: 520, opacity: clean, borderRadius: 10, overflow: 'hidden', boxShadow: `0 0 0 5px ${AMBER}`}}>
        <Img src={staticFile(IMG)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{position: 'absolute', top: '72%', width: '100%', fontFamily: arabicStack(font), fontWeight: 700, fontSize: 44, color: clean > 0.5 ? AMBER : '#e8ecf2', textAlign: 'center', direction: 'rtl'}}>
        {clean > 0.5 ? 'صورة وحدة · أوضح وأقل تشويش' : 'كذا لقطة ورا بعض'}
      </div>
    </AbsoluteFill>
  );
};

export const Ep10: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scene = useGLB('models/ep10.glb');
  const c = p.cueFrames;
  if (c.inside === undefined || !scene) return null;
  const end = c.end + 45;
  const kP: CamKey[] = [
    {f: 0, pos: [1.2, 2.2, 1.6], target: [0, 0.5, 0], fov: 38},
    {f: c.inside, pos: [-0.05, 1.3, -0.95], target: [-0.22, 0.56, -0.56], fov: 30},
  ];
  const kM: CamKey[] = [
    {f: c.inside, pos: [OX + 2.4, 2.2, 2.6], target: [OX, 0.55, 0], fov: 36},
    {f: c.magnets, pos: [OX + 1.8, 1.6, 2.0], target: [OX, 0.6, 0], fov: 34},
    {f: c.secret, pos: [OX + 2.3, 2.5, 2.9], target: [OX + 0.2, 1.2, 0.2], fov: 50},
    {f: c.focusMotor, pos: [OX + 1.6, 1.1, 1.8], target: [OX, 0.65, 0], fov: 34},
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
          {at: c.inside - 6, name: 'whoosh'},
          {at: c.hung, name: 'whirr', vol: 0.6},
          {at: c.secret, name: 'shimmer', vol: 0.5},
          {at: c.move, name: 'whirr'},
          {at: c.focusMotor, name: 'whirr'},
          {at: c.press, name: 'shutter'},
          ...Array.from({length: 6}, (_, k) => ({at: c.several + k * 5, name: 'click', vol: 0.5})),
          {at: c.clean, name: 'shimmer'},
        ]}
      />
      <Shot from={0} to={c.inside + 20} fadeIn={0} name="Phone">
        <Stage3D keys={kP} frameOffset={0}>
          <Phone f={f} c={c} scene={scene} mode="phone" />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.inside + 16} to={c.press + 4} name="Module">
        <Stage3D keys={kM} frameOffset={c.inside + 16}>
          <Phone f={f} c={c} scene={scene} mode="module" />
        </Stage3D>
        <Tag text="إعادة بناء · مكبّر ×100" font={p.font} />
      </Shot>
      <Shot from={c.press} to={end} fadeOut={0} name="Merge">
        <Merge f={f} c={c} font={p.font} />
        <Tag text="محاكاة" font={p.font} />
      </Shot>

      <ArabicHook font={p.font} from={0} durationInFrames={c.inside - 2} lines={HOOK} capHeightPct={3.4} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <PartLabel font={p.font} from={c.magnets} durationInFrames={c.coils - c.magnets} text="مغناطيس" capHeightPct={2.4} x={86} y={20} anchor={pin(kM, A.magnet, c.magnets)} width={width} height={height} />
      <PartLabel font={p.font} from={c.coils} durationInFrames={c.secret - c.coils} text="ملف نحاس حوالين العدسة" capHeightPct={2.3} x={86} y={20} anchor={pin(kM, A.coil, c.coils)} width={width} height={height} />
      <Fact font={p.font} from={c.voice} to={c.secret - 2} value="Voice Coil" caption={['نفس محرك السمّاعة']} y={76} capHeightPct={4.4} />
      <PartLabel font={p.font} from={c.gyro} durationInFrames={c.move - c.gyro} text="جيروسكوب" capHeightPct={2.4} x={86} y={20} anchor={pin(kM, A.gyro, c.gyro)} width={width} height={height} />
      <Fact font={p.font} from={c.opposite} to={c.focusMotor - 2} value="عكس الرجفة" caption={['هون إزاحة العدسة · في موبايلات بتحرّك الحساس']} y={78} capHeightPct={4.2} />
      <Fact font={p.font} from={c.mm} to={c.focusMotor - 2} value="أجزاء من المليمتر" y={20} capHeightPct={3.6} />
      <PartLabel font={p.font} from={c.focus} durationInFrames={c.press - c.focus} text="التركيز: العدسة لقدّام ولورا" capHeightPct={2.3} x={86} y={20} anchor={pin(kM, A.lens, c.focus)} width={width} height={height} />

      <VoiceBadge status={p.voiceStatus} font={p.font} />
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
