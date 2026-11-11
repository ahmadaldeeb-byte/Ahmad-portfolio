// Ep03 · أول إنسان بصورة — Daguerre, Boulevard du Temple (1838). 3D: public/models/ep03.glb.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {ArchivePhoto, Shot, SoundBed, Tag} from '../engine/Shots';
import {Stage3D, project, viewAt, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {ImagePlane} from '../engine/Primitives';
import {node, setOpacity, useGLB, useTexture} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['أول إنسان طلع بصورة', 'ما كان عارف إنه بتصوّر'];
export const CUES: CueList = [
  ['paris', 'باريس'],
  ['year', 'ألف'],
  ['street', 'شارع'],
  ['empty', 'فاضي'],
  ['why', 'ليش'],
  ['plate', 'لوح'],
  ['iodine', 'اليود'],
  ['sensitive', 'حسّاس'],
  ['minutes', 'أربع'],
  ['moving', 'بتحرك'],
  ['except', 'إلا'],
  ['shoes', 'بلمّع'],
  ['develop', 'ظهّر'],
  ['mercury', 'الزيبق'],
  ['fix', 'وثبّتها'],
  ['result', 'والنتيجة'],
  ['copy', 'نسخة'],
  ['mirror', 'المراية'],
  ['reversed', 'معكوسة'],
];

const IMG = 'archive/ep03-boulevard-du-temple.jpg';
const CREDIT = 'Louis Daguerre, Boulevard du Temple, Paris, 1838 · daguerreotype · Public domain · via Wikimedia Commons';
const MAN = {x: 20.3, y: 60.9}; // the man's position on screen with the photo fitted (% of frame)
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const DIR = new THREE.Vector3(Math.sin((35 * Math.PI) / 180), 0, -Math.cos((35 * Math.PI) / 180)); // boulevard direction

const streetKeys = (c: Record<string, number>): CamKey[] => [
  {f: c.paris, pos: [-14, 22, 20], target: [8, 0, -18], fov: 40},
  {f: c.empty, pos: [-12, 19, 16], target: [6, 0, -16], fov: 38},
];
const exceptKeys = (c: Record<string, number>): CamKey[] => [
  {f: c.moving, pos: [-12, 19, 16], target: [6, 0, -16], fov: 38},
  {f: c.except, pos: [7.2, 6.5, -6.0], target: [-0.24, 1.0, -11.16], fov: 34},
  {f: c.shoes, pos: [3.9, 3.0, -8.3], target: [-0.24, 1.1, -11.16], fov: 32},
];
const benchKeys = (c: Record<string, number>): CamKey[] => [
  {f: c.why, pos: [20.3, 2.1, 1.6], target: [19.3, 1.05, 0], fov: 34},
  {f: c.iodine, pos: [19.75, 1.75, 1.0], target: [19.0, 1.15, 0], fov: 32},
  {f: c.minutes, pos: [19.6, 1.68, 0.85], target: [19.0, 1.2, 0], fov: 30},
];
const devKeys = (c: Record<string, number>): CamKey[] => [
  {f: c.develop, pos: [21.0, 2.05, 1.45], target: [20.1, 1.3, 0], fov: 34},
  {f: c.mercury, pos: [21.0, 2.25, 1.75], target: [20.05, 1.3, 0], fov: 40},
  {f: c.fix, pos: [21.4, 1.5, 0.7], target: [20.9, 1.0, 0], fov: 32},
];
const caseKeys = (c: Record<string, number>): CamKey[] => [
  {f: c.result, pos: [21.65, 1.35, 0.25], target: [21.25, 0.98, -0.35], fov: 30},
  {f: c.mirror, pos: [21.35, 1.2, 0.05], target: [21.25, 0.98, -0.35], fov: 28},
];

type Mode = 'street' | 'bench' | 'case';
const Paris: React.FC<{f: number; c: Record<string, number>; mode: Mode; scene: THREE.Group; tex: THREE.Texture}> = ({f, c, mode, scene, tex}) => {
  // long exposure: everything that moves is erased, the man having his boots blacked stays
  const erase = Math.max(ramp(f, c.empty - 4, c.empty + 26), ramp(f, c.moving, c.moving + 30));
  const busy = 1 - erase * 0.94;
  scene.traverse((o) => {
    if (/^(ped|carriage)_\d+$/.test(o.name)) {
      o.userData.base ??= o.position.clone();
      const k = Number(o.name.split('_')[1]);
      const speed = o.name.startsWith('carriage') ? 0.11 : 0.035 * (k % 2 ? 1 : -1);
      o.position.copy(o.userData.base).addScaledVector(DIR, speed * (f % 900));
      setOpacity(o, busy);
    }
  });
  // plate journey on the bench: iodine box → mercury cabinet (tilted) → salt bath
  const plate = node(scene, 'plate');
  if (plate) {
    plate.userData.base ??= plate.position.clone();
    const toMerc = ramp(f, c.develop, c.develop + 24);
    const toSalt = ramp(f, c.fix, c.fix + 24);
    const p = plate.userData.base.clone().add(new THREE.Vector3(1.0 * toMerc + 0.9 * toSalt, 0.18 * toMerc - 0.18 * toSalt - 0.29 * toSalt + 0.06 * Math.sin(Math.PI * toSalt), 0));
    plate.position.copy(p);
    plate.rotation.set(-0.78 * toMerc * (1 - toSalt), 0, 0);
  }
  // silver → silver iodide (golden) over the iodine
  const sil = node(scene, 'plate_silver') as THREE.Mesh | undefined;
  if (sil) (sil.material as THREE.MeshStandardMaterial).color.copy(new THREE.Color('#ebebe6').lerp(new THREE.Color('#d9b45a'), ramp(f, c.iodine, c.sensitive + 20)));
  setOpacity(node(scene, 'plate_image'), 0);
  scene.traverse((o) => {
    if (o.name.startsWith('iodine_vapor_')) {
      const k = Number(o.name.split('_').pop());
      o.userData.base ??= o.position.clone();
      const t = ((f * 0.012 + k * 0.11) % 1);
      o.position.copy(o.userData.base).add(new THREE.Vector3(0, t * 0.012, 0));
      setOpacity(o, ramp(f, c.iodine - 4, c.iodine + 10) * (1 - ramp(f, c.minutes + 30, c.moving)) * (1 - t));
    }
  });
  const img = ramp(f, c.mercury, c.mercury + 40);
  const platePos = plate ? plate.position.clone().add(new THREE.Vector3(0, 0.006, 0)) : new THREE.Vector3(...(A.plate as [number, number, number]));
  return (
    <>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#eef2ff', '#3a342c', 0.6]} />
      <directionalLight position={[-30, 40, 10]} intensity={2.4} color="#fff3df" />
      <pointLight position={[20, 2.2, 0.8]} intensity={mode === 'bench' ? 4 : 0} distance={4} color="#fff2e0" />
      <pointLight position={[20, 1.0, 0.2]} intensity={mode === 'bench' ? 1.5 * ramp(f, c.develop, c.develop + 10) : 0} distance={0.8} color="#ffa040" />
      <spotLight position={[21.6, 1.9, 0.4]} intensity={mode === 'case' ? 8 : 0} angle={0.5} penumbra={0.6} />
      <primitive object={scene} />
      {/* developed image on the silver (mirror-reversed, as on the real plate) */}
      <ImagePlane tex={tex} position={platePos.toArray() as [number, number, number]} size={[0.21, 0.155]} rotation={[-Math.PI / 2 + (plate?.rotation.x ?? 0), 0, 0]} opacity={mode === 'bench' ? img : 0} />
      <ImagePlane tex={tex} position={[21.25, 0.976, -0.35]} size={[0.22, 0.16]} rotation={[-Math.PI / 2, 0, 0]} opacity={mode === 'case' ? 1 : 0} />
    </>
  );
};

/** The plate is a mirror image of the street: flip it back. */
const Reversed: React.FC<{f: number; c: Record<string, number>; font: SeriesProps['font']}> = ({f, c, font}) => {
  const flip = ramp(f, c.reversed + 6, c.reversed + 30);
  return (
    <AbsoluteFill style={{background: '#0b0c0e', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: '92%', aspectRatio: '3441 / 2472', backgroundImage: `url(${staticFile(IMG)})`, backgroundSize: 'cover', scale: `${1 - 2 * flip} 1`, borderRadius: 8, boxShadow: '0 0 0 3px rgba(255,210,122,0.6)'}} />
      <div dir="rtl" style={{position: 'absolute', top: '73%', width: '100%', textAlign: 'center', color: '#ffd27a', fontFamily: arabicStack(font), fontWeight: 700, fontSize: 46}}>
        {flip < 0.5 ? 'زي ما انطبعت على اللوح' : 'الشارع زي ما هو بالحقيقة'}
      </div>
    </AbsoluteFill>
  );
};

export const Ep03: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scene = useGLB('models/ep03.glb');
  const tex = useTexture(IMG);
  const c = p.cueFrames;
  if (c.paris === undefined || !scene || !tex) return null;
  const end = c.end + 45;
  const kS = streetKeys(c);
  const kE = exceptKeys(c);
  const kB = benchKeys(c);
  const kD = devKeys(c);
  const kC = caseKeys(c);
  const pin = (keys: CamKey[], pt: number[], from: number) => (lf: number) => project(new THREE.Vector3(...(pt as [number, number, number])), viewAt(keys, lf + from), width, height);
  const ring = ramp(f, c.shoes - 2, c.shoes + 10);
  return (
    <AbsoluteFill style={{background: '#07080a'}}>
      <SoundBed
        voiceover={p.voiceover}
        voiceFrom={p.voiceFrom}
        musicVolume={p.musicVolume}
        sfxVolume={p.sfxVolume}
        sfx={[
          {at: c.paris - 6, name: 'whoosh'},
          {at: c.empty, name: 'shimmer', vol: 0.7},
          {at: c.why - 6, name: 'whoosh'},
          {at: c.iodine, name: 'tape', vol: 0.4},
          {at: c.moving - 6, name: 'whoosh'},
          {at: c.except, name: 'click'},
          {at: c.mercury, name: 'tape', vol: 0.4},
          {at: c.fix + 18, name: 'liquid'},
          {at: c.reversed, name: 'whoosh', vol: 0.7},
        ]}
      />
      {/* A · the original, slowly closing in on the man */}
      <Shot from={0} to={c.paris + 4} fadeIn={0} name="Original">
        <ArchivePhoto src={IMG} credit={CREDIT} font={p.font} label="الصورة الأصلية · 1838" zoom={[1, 1.5]} pan={[[50, 50], [MAN.x, MAN.y]]} />
      </Shot>
      {/* B · busy street, then the long exposure empties it */}
      <Shot from={c.paris} to={c.why + 4} name="Street">
        <Stage3D keys={kS} frameOffset={c.paris} background="linear-gradient(#9fb4c8, #dfe6ea)">
          <Paris f={f} c={c} mode="street" scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      {/* C · silver plate over iodine */}
      <Shot from={c.why} to={c.moving + 4} name="Iodine">
        <Stage3D keys={kB} frameOffset={c.why}>
          <Paris f={f} c={c} mode="bench" scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      {/* D · only the still man remains */}
      <Shot from={c.moving} to={c.shoes + 4} name="Still man">
        <Stage3D keys={kE} frameOffset={c.moving} background="linear-gradient(#9fb4c8, #dfe6ea)">
          <Paris f={f} c={c} mode="street" scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.shoes} to={c.develop + 4} name="The man in the original">
        <ArchivePhoto src={IMG} credit={CREDIT} font={p.font} zoom={[3.2, 3.4]} pan={[[MAN.x, MAN.y], [MAN.x, MAN.y]]} />
        <AbsoluteFill>
          <svg width={width} height={height}>
            <circle cx={(MAN.x / 100) * width} cy={(MAN.y / 100) * height} r={120} fill="none" stroke="#ffd27a" strokeWidth={6} opacity={ring} />
          </svg>
        </AbsoluteFill>
      </Shot>
      {/* E · mercury vapour, salt bath */}
      <Shot from={c.develop} to={c.result + 4} name="Develop">
        <Stage3D keys={kD} frameOffset={c.develop}>
          <Paris f={f} c={c} mode="bench" scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      {/* F · one of a kind, a mirror */}
      <Shot from={c.result} to={c.reversed + 4} name="Case">
        <Stage3D keys={kC} frameOffset={c.result}>
          <Paris f={f} c={c} mode="case" scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.reversed} to={end} fadeOut={0} name="Reversed">
        <Reversed f={f} c={c} font={p.font} />
        <Tag text="الصورة الأصلية" font={p.font} tone="archive" />
      </Shot>

      <ArabicHook font={p.font} from={0} durationInFrames={c.paris - 2} lines={HOOK} capHeightPct={3.3} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <Fact font={p.font} from={c.year} to={c.why - 2} value="1838" caption={['باريس · لويس داغير']} y={72} />
      <PartLabel font={p.font} from={c.iodine} durationInFrames={c.moving - c.iodine} text="يوديد الفضة" capHeightPct={2.4} x={86} y={20} anchor={pin(kB, A.plate, c.iodine)} width={width} height={height} />
      <Fact font={p.font} from={c.minutes} to={c.moving - 2} value={'⁦4–10⁩ دقايق'} caption={['مدة التعريض', 'حسب المصادر']} y={70} capHeightPct={4.6} />
      <PartLabel font={p.font} from={c.except + 4} durationInFrames={c.shoes - c.except} text="واقف ثابت" capHeightPct={2.4} x={86} y={20} anchor={pin(kE, A.man, c.except + 4)} width={width} height={height} />
      <PartLabel font={p.font} from={c.mercury} durationInFrames={c.fix - c.mercury} text="بخار الزيبق" capHeightPct={2.4} x={86} y={20} anchor={pin(kD, A.mercury, c.mercury)} width={width} height={height} />
      <PartLabel font={p.font} from={c.fix + 10} durationInFrames={c.result - c.fix - 10} text="محلول ملح" capHeightPct={2.4} x={86} y={20} anchor={pin(kD, A.salt, c.fix + 10)} width={width} height={height} />
      <Fact font={p.font} from={c.copy} to={c.reversed - 2} value="نسخة وحدة" caption={['ما في نيغاتيف']} y={72} capHeightPct={4.4} />

      {p.voiceStatus === 'temp' ? <Tag text="صوت مؤقت" font={p.font} tone="temp" x={70} y={7.6} /> : null}
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
