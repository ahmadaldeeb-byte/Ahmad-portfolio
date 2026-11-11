// Ep07 · أول صورة ملوّنة — Maxwell & Sutton (1861) three-colour projection → Bayer mosaic (patent 1976).
// 3D: public/models/ep07.glb. The three separations are DERIVED from the colour reproduction (tagged «محاكاة»);
// the Bayer mosaic is procedural.
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack, type ArabicFont} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {ArchivePhoto, Shot, SoundBed, Tag} from '../engine/Shots';
import {Stage3D, project, viewAt, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {Ray} from '../engine/Primitives';
import {useGLB, useTexture} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['أول صورة ملوّنة', 'من ثلاث صور أبيض وأسود'];
export const CUES: CueList = [
  ['year', 'سنة'],
  ['maxwell', 'ماكسويل'],
  ['ribbon', 'شريطة'],
  ['red', 'أحمر'],
  ['green', 'وأخضر'],
  ['blue', 'وأزرق'],
  ['projected', 'عرضوا'],
  ['lights', 'أضواء'],
  ['colors', 'بألوانها'],
  ['strange', 'الغريبة'],
  ['redBlind', 'بالكاد'],
  ['century', 'مية'],
  ['uv', 'البنفسجية'],
  ['today', 'هسا'],
  ['pixel', 'بكسل'],
  ['half', 'ونص'],
];

const IMG = 'archive/ep07-tartan-ribbon.jpg';
const SEP = {red: 'archive/ep07-sep/r.jpg', green: 'archive/ep07-sep/g.jpg', blue: 'archive/ep07-sep/b.jpg'} as const;
const CREDIT = 'James Clerk Maxwell & Thomas Sutton, Tartan Ribbon, 1861 · three-colour projection (reproduction) · Public domain · via Wikimedia Commons';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const T = (font: ArabicFont, size: number, color = '#f5f5f7', weight = 700): React.CSSProperties => ({fontFamily: arabicStack(font), fontSize: size, fontWeight: weight, color, direction: 'rtl', textAlign: 'center'});
const COL = {red: '#ff3b30', green: '#34c759', blue: '#0a84ff'} as const;
/** pure primaries for the additive recombination (so the three channels rebuild the original colours) */
const PURE = {red: '#ff0000', green: '#00ff00', blue: '#0000ff'} as const;

/** Three black-and-white exposures, each behind its filter (derived separations). */
const Separations: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => (
  <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 45%, #1e2433 0%, #07080b 75%)', alignItems: 'center', justifyContent: 'center', gap: 34}}>
    {(['red', 'green', 'blue'] as const).map((k) => {
      const a = ramp(f, c[k] - 2, c[k] + 12);
      return (
        <div key={k} style={{display: 'flex', alignItems: 'center', gap: 28, opacity: a, translate: `${(1 - a) * 60}px 0`}}>
          <Img src={staticFile(SEP[k])} style={{width: 420, borderRadius: 6, boxShadow: `0 0 0 5px ${COL[k]}`}} />
          <div style={{width: 120, height: 120, borderRadius: '50%', background: COL[k], opacity: 0.85, boxShadow: `0 0 40px ${COL[k]}`}} />
        </div>
      );
    })}
    <div style={{position: 'absolute', bottom: '22%', width: '100%', ...T(font, 32, '#a1a1a6', 600)}}>ثلاث صور أبيض وأسود · كل وحدة ورا فلتر</div>
  </AbsoluteFill>
);

/** Lanterns projecting the three separations through their filters onto one screen (additive). */
const Lanterns: React.FC<{f: number; c: Record<string, number>; scene: THREE.Group; tex: Record<'red' | 'green' | 'blue', THREE.Texture>}> = ({f, c, scene, tex}) => {
  const on = {
    red: ramp(f, c.projected, c.projected + 14),
    green: ramp(f, c.projected + 18, c.projected + 32),
    blue: ramp(f, c.projected + 36, c.lights + 6),
  };
  const xs = {red: -0.7, green: 0, blue: 0.7};
  const screenZ = -5.97;
  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[0, 2.8, 1.5]} intensity={2} distance={6} color="#ffe2b0" />
      <primitive object={scene} />
      <mesh position={[0, 1.6, screenZ - 0.002]}>
        <planeGeometry args={[3.2, 2.4]} />
        <meshBasicMaterial color="#050505" />
      </mesh>
      {(['red', 'green', 'blue'] as const).map((k, i) => (
        <group key={k}>
          <mesh position={[0, 1.6, screenZ + 0.001 * (i + 1)]}>
            <planeGeometry args={[2.62, 2.14]} />
            <meshBasicMaterial map={tex[k]} color={PURE[k]} transparent opacity={on[k]} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* beam */}
          {[[-1.2, 0.95], [1.2, 0.95], [-1.2, -0.95], [1.2, -0.95]].map(([dx, dy], j) => (
            <Ray key={j} from={new THREE.Vector3(xs[k], 1.12, -0.48)} to={new THREE.Vector3(dx, 1.6 + dy, screenZ)} r={0.006} color={COL[k]} opacity={on[k] * 0.35 * (1 - ramp(f, c.colors - 10, c.colors + 6))} />
          ))}
        </group>
      ))}
    </>
  );
};

/** How sensitive the 1861 plates were across the spectrum (qualitative). */
const Sensitivity: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const bars: [string, string, number][] = [
    ['فوق البنفسجي', '#b07cff', 0.9],
    ['أزرق', COL.blue, 1],
    ['أخضر', COL.green, 0.35],
    ['أحمر', COL.red, 0.04],
  ];
  const grow = ramp(f, c.strange, c.redBlind + 10);
  const flag = ramp(f, c.uv - 6, c.uv + 10);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 45%, #1e2433 0%, #07080b 75%)'}}>
      <div style={{position: 'absolute', top: '38%', width: '100%', ...T(font, 40, '#e8ecf2')}}>حساسية ألواح التصوير سنة 1861</div>
      <div style={{position: 'absolute', left: 120, right: 120, top: '44%', height: 480, display: 'flex', alignItems: 'flex-end', gap: 40, flexDirection: 'row-reverse'}}>
        {bars.map(([l, col, v]) => (
          <div key={l} style={{flex: 1, textAlign: 'center'}}>
            <div style={{height: 420 * v * grow + 4, background: col, borderRadius: 10, boxShadow: l === 'أحمر' ? `0 0 0 ${4 * flag}px #ffd27a` : undefined}} />
            <div style={{...T(font, 30, '#e8ecf2', 600), marginTop: 16}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: '75%', width: '100%', ...T(font, 32, '#a1a1a6', 600), opacity: grow}}>رسم تقريبي · الألواح بالكاد تحس بالأحمر</div>
    </AbsoluteFill>
  );
};

/** Bayer mosaic: RGGB filters + microlenses over photosites (procedural). */
const NX = 24;
const NY = 18;
const P = 0.03;
const Bayer: React.FC<{f: number; c: Record<string, number>; scene: THREE.Group}> = ({f, c, scene}) => {
  const ox = 30;
  const pulse = ramp(f, c.half, c.half + 10) * (0.5 + 0.5 * Math.sin((f - c.half) * 0.25));
  const geo = useMemo(() => new THREE.BoxGeometry(P * 0.92, 0.008, P * 0.92), []);
  const lens = useMemo(() => new THREE.SphereGeometry(P * 0.4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), []);
  const cells = useMemo(() => {
    const out: {x: number; z: number; k: 'red' | 'green' | 'blue'}[] = [];
    for (let i = 0; i < NX; i++)
      for (let j = 0; j < NY; j++) {
        const k = i % 2 === 0 && j % 2 === 0 ? 'red' : i % 2 === 1 && j % 2 === 1 ? 'blue' : 'green';
        out.push({x: ox + (i - NX / 2 + 0.5) * P, z: (j - NY / 2 + 0.5) * P, k});
      }
    return out;
  }, []);
  const place = (mesh: THREE.InstancedMesh | null, list: typeof cells, y: number) => {
    if (!mesh) return;
    const m = new THREE.Matrix4();
    list.forEach((cl, n) => {
      m.makeTranslation(cl.x, y, cl.z);
      mesh.setMatrixAt(n, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  const by = (k: 'red' | 'green' | 'blue') => cells.filter((x) => x.k === k);
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[ox + 1, 3, 2]} intensity={2.2} />
      <primitive object={scene} />
      {(['red', 'green', 'blue'] as const).map((k) => (
        <instancedMesh key={k} ref={(mm) => place(mm, by(k), 0.148)} args={[geo, undefined, by(k).length]}>
          <meshStandardMaterial color={COL[k]} emissive={COL[k]} emissiveIntensity={k === 'green' ? 0.25 + pulse * 0.9 : 0.25} roughness={0.3} transparent opacity={0.92} />
        </instancedMesh>
      ))}
      <instancedMesh ref={(mm) => place(mm, cells, 0.152)} args={[lens, undefined, cells.length]}>
        <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0} transparent opacity={0.16} depthWrite={false} />
      </instancedMesh>
    </>
  );
};

export const Ep07: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scene = useGLB('models/ep07.glb');
  const tr = useTexture(SEP.red);
  const tg = useTexture(SEP.green);
  const tb = useTexture(SEP.blue);
  const c = p.cueFrames;
  if (c.year === undefined || !scene || !tr || !tg || !tb) return null;
  const end = c.end + 45;
  const kL: CamKey[] = [
    {f: c.projected, pos: [2.6, 2.2, 2.2], target: [0, 1.4, -2.8], fov: 44},
    {f: c.lights, pos: [1.2, 1.9, 0.9], target: [0, 1.6, -5.9], fov: 40},
    {f: c.colors, pos: [0.0, 1.6, -2.2], target: [0, 1.6, -6], fov: 44},
  ];
  const kB: CamKey[] = [
    {f: c.today, pos: [31.4, 1.6, 1.6], target: [30, 0.1, 0], fov: 36},
    {f: c.pixel, pos: [30.25, 0.42, 0.28], target: [30, 0.14, 0], fov: 32},
    {f: c.half, pos: [30.16, 0.36, 0.22], target: [30, 0.14, 0], fov: 30},
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
          {at: c.year - 6, name: 'whoosh'},
          {at: c.red, name: 'click'},
          {at: c.green, name: 'click'},
          {at: c.blue, name: 'click'},
          {at: c.projected - 6, name: 'whoosh'},
          {at: c.colors, name: 'shimmer'},
          {at: c.strange - 6, name: 'whoosh'},
          {at: c.today - 6, name: 'whoosh'},
          {at: c.half, name: 'shimmer', vol: 0.6},
        ]}
      />
      <Shot from={0} to={c.year + 4} fadeIn={0} name="Original">
        <ArchivePhoto src={IMG} credit={CREDIT} font={p.font} label="الصورة الأصلية · 1861" zoom={[1, 1.1]} />
      </Shot>
      <Shot from={c.year} to={c.projected + 4} name="Separations">
        <Separations f={f} c={c} font={p.font} />
        <Tag text="محاكاة من الصورة الملوّنة" font={p.font} />
      </Shot>
      <Shot from={c.projected} to={c.strange + 4} name="Projection">
        <Stage3D keys={kL} frameOffset={c.projected} background="#050608">
          <Lanterns f={f} c={c} scene={scene} tex={{red: tr, green: tg, blue: tb}} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.strange} to={c.today + 4} name="Red-blind plates">
        <Sensitivity f={f} c={c} font={p.font} />
        <Tag text="رسم توضيحي" font={p.font} />
      </Shot>
      <Shot from={c.today} to={end} fadeOut={0} name="Bayer">
        <Stage3D keys={kB} frameOffset={c.today}>
          <Bayer f={f} c={c} scene={scene} />
        </Stage3D>
        <Tag text="رسم توضيحي · مكبّر" font={p.font} />
      </Shot>

      <ArabicHook font={p.font} from={0} durationInFrames={c.year - 2} lines={HOOK} capHeightPct={3.3} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <Fact font={p.font} from={c.year} to={c.red - 2} value="1861" caption={['ماكسويل · المصوّر توماس ساتون']} y={86} capHeightPct={4} />
      <PartLabel font={p.font} from={c.lights} durationInFrames={c.strange - c.lights} text="ثلاث فلاتر · ثلاث أضواء" capHeightPct={2.3} x={86} y={20} anchor={pin(kL, A.filter_green, c.lights)} width={width} height={height} />
      <Fact font={p.font} from={c.century} to={c.today - 2} value="1961" caption={['تفسير إيفانز: الأحمر انسجّل من فوق البنفسجي', 'ودراسة 2022 بتشكّك فيه']} y={20} capHeightPct={4} />
      <PartLabel font={p.font} from={c.pixel} durationInFrames={c.half - c.pixel} text="فلتر فوق كل بكسل" capHeightPct={2.3} x={86} y={20} anchor={pin(kB, A.die, c.pixel)} width={width} height={height} />
      <Fact font={p.font} from={c.half} to={end} value="50% أخضر" caption={['25% أحمر · 25% أزرق', 'نمط Bayer · 1976']} y={74} capHeightPct={4.4} />

      {p.voiceStatus === 'temp' ? <Tag text="صوت مؤقت" font={p.font} tone="temp" x={70} y={7.6} /> : null}
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
