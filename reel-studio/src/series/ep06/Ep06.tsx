// Ep06 · «اكبس الزر» — the original Kodak (1888) and what happens inside the film.
// 3D: public/models/ep06.glb (camera ×10 scale). The grain field is procedural (three.js InstancedMesh).
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack, type ArabicFont} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {ArchivePhoto, Shot, SoundBed, Tag} from '../engine/Shots';
import {Stage3D, project, viewAt, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {node, setOpacity, useGLB} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['أي حدا يقدر يصوّر', 'بدون ما يعرف كيمياء'];
export const CUES: CueList = [
  ['kodak', 'كوداك'],
  ['film', 'فيلم'],
  ['hundred', 'مية'],
  ['round', 'مدوّرة'],
  ['send', 'بتبعث'],
  ['slogan', 'اكبس'],
  ['inside', 'جوّا'],
  ['grains', 'حبيبات'],
  ['hit', 'يضربها'],
  ['atoms', 'ذرة'],
  ['mark', 'علامة'],
  ['develop', 'بالتحميض'],
  ['black', 'سودا'],
  ['washed', 'بنغسل'],
  ['millions', 'ملايين'],
];

const AD = 'archive/ep06-kodak-1888-ad.jpg';
const CREDIT = 'Kodak advertisement, c. 1889 ("You press the button, we do the rest") · Public domain · via Wikimedia Commons';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

// ── grain field: hexagonal silver-halide crystals in the gelatin layer (procedural) ──────────────────
const GX = 44;
const GY = 78;
const PITCH = 0.06;
const GRAIN_ORIGIN = new THREE.Vector3(30, 0, 0);
/** House silhouette (the "picture" the developed grains form): roof triangle + walls + door. */
const inPicture = (u: number, v: number) => {
  // u,v ∈ [0,1], v up
  const walls = u > 0.22 && u < 0.78 && v > 0.22 && v < 0.55;
  const roof = v >= 0.55 && v < 0.78 && Math.abs(u - 0.5) < (0.78 - v) * 1.3;
  const door = u > 0.45 && u < 0.56 && v > 0.22 && v < 0.38;
  const sun = Math.hypot(u - 0.8, v - 0.86) < 0.07;
  return (walls && !door) || roof || sun;
};
const GRAINS = (() => {
  const out: {x: number; z: number; lit: boolean; s: number; r: number}[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < GX; i++)
    for (let j = 0; j < GY; j++) {
      const u = i / (GX - 1);
      const v = j / (GY - 1);
      out.push({x: (i - GX / 2) * PITCH + (rnd() - 0.5) * 0.02, z: -(j - GY / 2) * PITCH + (rnd() - 0.5) * 0.02, lit: inPicture(u, v) && rnd() > 0.12, s: 0.6 + rnd() * 0.5, r: rnd() * Math.PI});
    }
  return out;
})();

const GrainField: React.FC<{f: number; c: Record<string, number>}> = ({f, c}) => {
  const hit = ramp(f, c.hit, c.hit + 18);
  const specks = ramp(f, c.atoms, c.atoms + 16);
  const dev = ramp(f, c.develop, c.black + 6);
  const wash = ramp(f, c.washed, c.washed + 24);
  const geo = useMemo(() => new THREE.CylinderGeometry(0.022, 0.022, 0.006, 6), []);
  const {lit, unlit} = useMemo(() => ({lit: GRAINS.filter((g) => g.lit), unlit: GRAINS.filter((g) => !g.lit)}), []);
  const place = (mesh: THREE.InstancedMesh | null, list: typeof GRAINS) => {
    if (!mesh) return;
    const m = new THREE.Matrix4();
    list.forEach((g, k) => {
      m.compose(new THREE.Vector3(g.x, 0.012, g.z).add(GRAIN_ORIGIN), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, g.r, 0)), new THREE.Vector3(g.s, 1, g.s));
      mesh.setMatrixAt(k, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  const litColor = new THREE.Color('#e9dcc0').lerp(new THREE.Color('#1a1a1c'), dev);
  return (
    <group>
      {/* film base + gelatin */}
      <mesh position={[GRAIN_ORIGIN.x, -0.01, GRAIN_ORIGIN.z]}>
        <boxGeometry args={[GX * PITCH + 0.2, 0.02, GY * PITCH + 0.2]} />
        <meshStandardMaterial color="#c9d6dc" transparent opacity={0.35} roughness={0.1} />
      </mesh>
      <mesh position={[GRAIN_ORIGIN.x, 0.012, GRAIN_ORIGIN.z]}>
        <boxGeometry args={[GX * PITCH + 0.2, 0.024, GY * PITCH + 0.2]} />
        <meshStandardMaterial color="#e8c98a" transparent opacity={0.18 * (1 - dev * 0.6)} roughness={0.4} depthWrite={false} />
      </mesh>
      <instancedMesh ref={(m) => place(m, unlit)} args={[geo, undefined, unlit.length]}>
        <meshStandardMaterial color="#e9dcc0" metalness={0.2} roughness={0.35} transparent opacity={1 - wash} />
      </instancedMesh>
      <instancedMesh ref={(m) => place(m, lit)} args={[geo, undefined, lit.length]}>
        <meshStandardMaterial color={litColor} metalness={0.4} roughness={0.4} emissive="#ffd27a" emissiveIntensity={0.6 * hit * (1 - dev)} />
      </instancedMesh>
      {/* latent-image specks: a few silver atoms on each struck grain (shown on a sample of grains) */}
      {lit.slice(0, 260).map((g, k) => (
        <mesh key={k} position={[GRAIN_ORIGIN.x + g.x + 0.006, 0.019, GRAIN_ORIGIN.z + g.z]} scale={specks * (1 - dev)}>
          <sphereGeometry args={[0.006, 6, 4]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* photons arriving */}
      {Array.from({length: 40}, (_, k) => {
        const g = lit[(k * 37) % lit.length];
        const t = ((f - c.hit) * 0.05 + k * 0.13) % 1;
        const show = f > c.hit - 10 && f < c.atoms + 20;
        return show ? (
          <mesh key={`p${k}`} position={[GRAIN_ORIGIN.x + g.x, 0.02 + (1 - t) * 1.2, GRAIN_ORIGIN.z + g.z]}>
            <sphereGeometry args={[0.01, 6, 4]} />
            <meshBasicMaterial color="#ffd27a" toneMapped={false} />
          </mesh>
        ) : null;
      })}
    </group>
  );
};

const Kodak: React.FC<{f: number; c: Record<string, number>; scene: THREE.Group; mode: 'camera' | 'grains'}> = ({f, c, scene, mode}) => {
  const open = ramp(f, c.film - 4, c.film + 20) * (1 - ramp(f, c.send - 6, c.send + 8));
  for (const n of ['body_top', 'body_right']) setOpacity(node(scene, n), 1 - 0.85 * open);
  const wind = ramp(f, c.hundred, c.round) * Math.PI * 6;
  for (const n of ['spool_supply', 'roll_supply', 'spool_takeup', 'roll_takeup']) {
    const o = node(scene, n);
    if (o) {
      o.userData.base ??= o.rotation.clone();
      o.rotation.set(o.userData.base.x + wind, o.userData.base.y, o.userData.base.z);
    }
  }
  const shutter = node(scene, 'barrel_shutter');
  if (shutter) shutter.rotation.y = ramp(f, c.slogan, c.slogan + 8) * Math.PI;
  // «send the whole camera back»: it lifts off and away
  const away = ramp(f, c.send, c.slogan - 4);
  scene.position.set(0, away * 0.6, -away * 4);
  scene.rotation.set(0, away * 0.8, 0);
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#fff4e6', '#2a2420', 0.5]} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} color="#fff0dc" />
      <pointLight position={[0.6, 0.9, -0.3]} intensity={open * 3} distance={1.6} color="#ffe2b0" />
      {mode === 'camera' ? <primitive object={scene} /> : <GrainField f={f} c={c} />}
    </>
  );
};

/** The round frame: a circle on the rectangular film. */
const RoundFrame: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const a = ramp(f, c.round - 4, c.round + 10) * (1 - ramp(f, c.send - 8, c.send));
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '30%', opacity: a}}>
      <div style={{width: 300, height: 220, background: '#c9a46a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>
        <div style={{width: 196, height: 196, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, #f1e3c4, #a98758)'}} />
      </div>
      <div style={{marginTop: 18, fontFamily: arabicStack(font), fontWeight: 700, fontSize: 40, color: '#ffd27a', direction: 'rtl'}}>صورة مدوّرة · قطرها حوالي 6 سم</div>
    </AbsoluteFill>
  );
};

export const Ep06: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scene = useGLB('models/ep06.glb');
  const c = p.cueFrames;
  if (c.kodak === undefined || !scene) return null;
  const end = c.end + 45;
  const kK: CamKey[] = [
    {f: c.kodak, pos: [2.4, 1.4, 2.6], target: [0, 0.45, 0], fov: 34},
    {f: c.film, pos: [2.0, 1.6, -1.2], target: [0, 0.45, -0.3], fov: 34},
    {f: c.hundred, pos: [1.6, 1.25, -1.7], target: [0, 0.45, -0.4], fov: 32},
    {f: c.send, pos: [2.6, 1.6, 2.2], target: [0, 0.6, -1.5], fov: 40},
  ];
  const gx = GRAIN_ORIGIN.x;
  const kG: CamKey[] = [
    {f: c.inside, pos: [gx + 0.25, 0.45, 0.35], target: [gx, 0.0, 0], fov: 34},
    {f: c.atoms, pos: [gx + 0.12, 0.22, 0.2], target: [gx, 0.01, 0.02], fov: 30},
    {f: c.develop, pos: [gx + 0.2, 0.4, 0.3], target: [gx, 0.0, 0], fov: 34},
    {f: c.millions, pos: [gx, 6.0, 0.9], target: [gx, 0, 0], fov: 42}, // straight down: the picture appears
    {f: end, pos: [gx, 6.6, 1.0], target: [gx, 0, 0], fov: 42},
  ];
  const pin = (keys: CamKey[], pt: number[], from: number) => (lf: number) => project(new THREE.Vector3(...(pt as [number, number, number])), viewAt(keys, lf + from), width, height);
  const sampleLit = GRAINS.find((g) => g.lit && Math.abs(g.x) < 0.1 && Math.abs(g.z) < 0.2) ?? GRAINS[0];
  const grainPt = [GRAIN_ORIGIN.x + sampleLit.x, 0.02, GRAIN_ORIGIN.z + sampleLit.z];
  return (
    <AbsoluteFill style={{background: '#07080a'}}>
      <SoundBed
        voiceover={p.voiceover}
        voiceFrom={p.voiceFrom}
        musicVolume={p.musicVolume}
        sfxVolume={p.sfxVolume}
        sfx={[
          {at: c.kodak - 6, name: 'whoosh'},
          {at: c.hundred, name: 'whirr'},
          {at: c.send, name: 'whoosh'},
          {at: c.slogan, name: 'shutter'},
          {at: c.inside - 6, name: 'whoosh'},
          {at: c.hit, name: 'shimmer', vol: 0.6},
          {at: c.develop, name: 'liquid'},
          {at: c.washed, name: 'liquid', vol: 0.6},
        ]}
      />
      <Shot from={0} to={c.kodak + 4} fadeIn={0} name="Ad">
        <ArchivePhoto src={AD} credit={CREDIT} font={p.font} label="إعلان أصلي · كوداك" zoom={[1, 1.1]} />
      </Shot>
      <Shot from={c.kodak} to={c.inside + 4} name="Kodak camera">
        <Stage3D keys={kK} frameOffset={c.kodak}>
          <Kodak f={f} c={c} scene={scene} mode="camera" />
        </Stage3D>
        <RoundFrame f={f} c={c} font={p.font} />
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.inside} to={end} fadeOut={0} name="Inside the film">
        <Stage3D keys={kG} frameOffset={c.inside} background="radial-gradient(90% 60% at 50% 45%, #1e2433 0%, #07080b 75%)">
          <Kodak f={f} c={c} scene={scene} mode="grains" />
        </Stage3D>
        <Tag text="رسم توضيحي · مكبّر" font={p.font} />
      </Shot>

      <ArabicHook font={p.font} from={0} durationInFrames={c.kodak - 2} lines={HOOK} capHeightPct={3.4} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <Fact font={p.font} from={8} to={c.kodak - 2} value="1888" caption={['جورج إيستمان · كوداك']} y={76} />
      <PartLabel font={p.font} from={c.film} durationInFrames={c.hundred - c.film} text="لفّة الفيلم" capHeightPct={2.4} x={86} y={20} anchor={pin(kK, A.spool, c.film)} width={width} height={height} />
      <Fact font={p.font} from={c.hundred} to={c.round - 2} value="100" caption={['صورة بالفيلم الواحد']} y={74} />
      <Fact font={p.font} from={c.slogan} to={c.inside - 2} value="«إنت اكبس الزر»" caption={['والباقي علينا']} y={74} capHeightPct={4.2} />
      <PartLabel font={p.font} from={c.grains} durationInFrames={c.atoms - c.grains} text="حبيبات أملاح الفضة" capHeightPct={2.4} x={86} y={20} anchor={pin(kG, grainPt, c.grains)} width={width} height={height} />
      <PartLabel font={p.font} from={c.atoms} durationInFrames={c.develop - c.atoms} text="كم ذرة فضة · علامة مخفية" capHeightPct={2.3} x={86} y={20} anchor={pin(kG, grainPt, c.atoms)} width={width} height={height} />
      <Fact font={p.font} from={c.black} to={c.millions - 2} value="فضة سودا" caption={['والباقي بنغسل']} y={74} capHeightPct={4.4} />

      {p.voiceStatus === 'temp' ? <Tag text="صوت مؤقت" font={p.font} tone="temp" x={70} y={7.6} /> : null}
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
