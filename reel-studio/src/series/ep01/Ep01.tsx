// Ep01 · الغرفة المعتمة — why the image is upside down. 3D: public/models/ep01.glb; the projected picture is a
// Cycles render of the outside seen from the hole (public/renders/ep01-outside.png), shown rotated 180°.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ArabicHook, PartLabel} from '../../text/ArabicMotion';
import {arabicStack, type ArabicFont} from '../../text/fonts';
import {SafeGuides} from '../../text/SafeGuides';
import {Shot, SoundBed, Tag} from '../engine/Shots';
import {Stage3D, project, viewAt, type CamKey} from '../engine/Stage3D';
import {Fact} from '../engine/Text';
import {ImagePlane, Ray} from '../engine/Primitives';
import {node, setOpacity, useGLB, useTexture} from '../engine/useGLB';
import type {SeriesProps} from '../engine/schema';
import type {CueList} from '../engine/timing';
import A from './anchors.json';

export const HOOK = ['طيب ليش الصورة', 'بتطلع مقلوبة؟'];
export const CUES: CueList = [
  ['years', 'ألفين'],
  ['room', 'غرفة'],
  ['hole', 'ثقب'],
  ['here', 'هون'],
  ['straight', 'مستقيم'],
  ['top', 'فوق'],
  ['down', 'لتحت'],
  ['bottom', 'تحت'],
  ['up', 'لفوق'],
  ['flipped', 'بتنقلب'],
  ['mozi', 'موزي'],
  ['haytham', 'الهيثم'],
  ['detail', 'تفصيلة'],
  ['smaller', 'صغّرت'],
  ['clearer', 'أوضح'],
  ['darker', 'أعتم'],
  ['limit', 'حد'],
  ['aperture', 'فتحة'],
];

const OUT = 'renders/ep01-outside.png';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const AMBER = '#ffd27a';
const T = (font: ArabicFont, size: number, color = '#f5f5f7', weight = 700): React.CSSProperties => ({fontFamily: arabicStack(font), fontSize: size, fontWeight: weight, color, direction: 'rtl', textAlign: 'center'});
const V = (p: number[]) => new THREE.Vector3(p[0], p[1], p[2]);

const Room: React.FC<{f: number; c: Record<string, number>; scene: THREE.Group; tex: THREE.Texture}> = ({f, c, scene, tex}) => {
  // cutaway: the right wall and the roof go transparent once we are «in the room»
  const cut = ramp(f, c.room, c.room + 24);
  setOpacity(node(scene, 'wall_side_r'), 1 - 0.92 * cut);
  setOpacity(node(scene, 'room_roof'), 1 - 0.92 * cut);
  const hole = V(A.hole);
  const top = V(A.tree_top);
  const base = V(A.tree_base);
  // where each ray lands on the back wall (straight line through the hole)
  const land = (p: THREE.Vector3) => {
    const d = hole.clone().sub(p);
    const t = (A.screen[2] - hole.z) / d.z;
    return hole.clone().add(d.multiplyScalar(t));
  };
  const rTop = ramp(f, c.top, c.down + 10);
  const rBase = ramp(f, c.bottom, c.up + 10);
  const img = ramp(f, c.flipped - 4, c.flipped + 20);
  const glow = ramp(f, c.here - 2, c.here + 8);
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#dfeaff', '#2a3320', 0.6]} />
      <directionalLight position={[8, 12, 20]} intensity={2.2} color="#fff3dc" />
      <primitive object={scene} />
      {/* the hole glows when it is named */}
      <mesh position={[hole.x, hole.y, hole.z - 0.06]}>
        <circleGeometry args={[0.06 + 0.04 * glow, 24]} />
        <meshBasicMaterial color={AMBER} transparent opacity={glow} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <Ray from={top} to={hole} progress={Math.min(1, rTop * 2)} opacity={rTop > 0 ? 1 : 0} r={0.025} color={AMBER} onTop />
      <Ray from={hole} to={land(top)} progress={Math.max(0, rTop * 2 - 1)} opacity={rTop > 0 ? 1 : 0} r={0.02} color={AMBER} onTop />
      <Ray from={base} to={hole} progress={Math.min(1, rBase * 2)} opacity={rBase > 0 ? 1 : 0} r={0.025} color="#7ad4ff" onTop />
      <Ray from={hole} to={land(base)} progress={Math.max(0, rBase * 2 - 1)} opacity={rBase > 0 ? 1 : 0} r={0.02} color="#7ad4ff" onTop />
      {/* the picture on the back wall: upside down (rotated 180°) */}
      <ImagePlane tex={tex} position={[0, 1.5, A.screen[2] + 0.02]} size={[2.6, 2.6]} rotation={[0, 0, Math.PI]} opacity={img * 0.9} />
    </>
  );
};

const Timeline: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const a = ramp(f, c.mozi - 4, c.mozi + 10);
  const b = ramp(f, c.haytham - 4, c.haytham + 10);
  const card = (o: number, when: string, who: string, what: string, top: string) => (
    <div style={{position: 'absolute', top, left: '10%', right: '10%', padding: '34px 30px', borderRadius: 24, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,210,122,0.35)', opacity: o, translate: `0 ${(1 - o) * 40}px`}}>
      <div style={{...T(font, 34, AMBER, 600)}}>{when}</div>
      <div style={{...T(font, 58), marginTop: 8}}>{who}</div>
      <div style={{...T(font, 32, '#a1a1a6', 500), marginTop: 10}}>{what}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 40%, #232838 0%, #0b0d12 70%)'}}>
      {card(a, 'حوالي القرن الرابع قبل الميلاد', 'موزي', 'سجّل الظاهرة وفسّرها بالخطوط المستقيمة', '26%')}
      {card(b, 'حوالي 1011–1021', 'ابن الهيثم', 'كتاب المناظر · تجارب بغرفة معتمة', '52%')}
    </AbsoluteFill>
  );
};

/** Hole size: big = bright but blurry, small = sharp but dim; too small = blurry again (diffraction). */
const HoleSize: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  // hole diameter (px on the dial) over the narration
  const d = interpolate(f, [c.detail, c.smaller, c.clearer + 10, c.darker + 10, c.limit, c.limit + 30], [90, 90, 34, 14, 14, 4], clamp);
  const blur = d > 14 ? (d - 14) * 0.45 : (14 - d) * 0.9; // geometric vs diffraction blur (qualitative)
  const bright = Math.min(1.1, 0.25 + d / 80);
  return (
    <AbsoluteFill style={{background: '#08090c', alignItems: 'center'}}>
      <div style={{position: 'absolute', top: '24%', width: 760, height: 760, borderRadius: 24, overflow: 'hidden', boxShadow: '0 0 0 3px rgba(255,255,255,0.12)'}}>
        <Img src={staticFile(OUT)} style={{width: '100%', height: '100%', objectFit: 'cover', rotate: '180deg', filter: `blur(${blur}px) brightness(${bright})`}} />
      </div>
      <div style={{position: 'absolute', top: '67%', display: 'flex', alignItems: 'center', gap: 30, flexDirection: 'row-reverse'}}>
        <div style={{width: 120, height: 120, borderRadius: 16, background: '#1a1b1f', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: d, height: d, borderRadius: '50%', background: AMBER}} />
        </div>
        <div style={{...T(font, 36, '#e8ecf2', 600)}}>{d > 60 ? 'ثقب كبير: ساطع ومغبّش' : d > 10 ? 'ثقب صغير: أوضح وأعتم' : 'أصغر من اللازم: بترجع تغبّش'}</div>
      </div>
    </AbsoluteFill>
  );
};

/** A lens iris: the same balance, with blades. */
const Iris: React.FC<{f: number; c: Record<string, number>; font: ArabicFont}> = ({f, c, font}) => {
  const t = (Math.sin((f - c.aperture) * 0.06) + 1) / 2; // open ↔ closed
  const r = 60 + 200 * t;
  const blades = 7;
  const fnum = [16, 11, 8, 5.6, 4, 2.8, 2][Math.min(6, Math.floor(t * 7))];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 45%, #1e2433 0%, #07080b 75%)', alignItems: 'center', justifyContent: 'center'}}>
      <svg width={720} height={720} viewBox="-360 -360 720 720">
        <circle r={330} fill="#16181d" stroke="#3a3e46" strokeWidth={14} />
        <circle r={300} fill="#0b0c0e" />
        {Array.from({length: blades}, (_, k) => {
          const a = (k / blades) * Math.PI * 2;
          return (
            <path
              key={k}
              d={`M ${r * Math.cos(a)} ${r * Math.sin(a)} L ${310 * Math.cos(a + 0.9)} ${310 * Math.sin(a + 0.9)} L ${310 * Math.cos(a + 1.9)} ${310 * Math.sin(a + 1.9)} L ${r * Math.cos(a + (2 * Math.PI) / blades)} ${r * Math.sin(a + (2 * Math.PI) / blades)} Z`}
              fill="#2a2d33"
              stroke="#4a4f58"
              strokeWidth={3}
            />
          );
        })}
        <circle r={Math.max(10, r * 0.86)} fill="rgba(255,210,122,0.18)" />
      </svg>
      <div style={{position: 'absolute', top: '70%', width: '100%', ...T(font, 64, AMBER), direction: 'ltr'}}>f/{fnum}</div>
    </AbsoluteFill>
  );
};

export const Ep01: React.FC<SeriesProps> = (p) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const scene = useGLB('models/ep01.glb');
  const tex = useTexture(OUT);
  const c = p.cueFrames;
  if (c.years === undefined || !scene || !tex) return null;
  const end = c.end + 45;
  const kR: CamKey[] = [
    {f: 0, pos: [-1.5, 2.4, 21], target: [1.2, 2.0, 2], fov: 42},
    {f: c.room - 24, pos: [-1.5, 2.4, 21], target: [1.2, 2.0, 2], fov: 42}, // the tree, and the dark room behind it
    {f: c.room, pos: [6.5, 3.2, 1.5], target: [0, 1.5, -1.6], fov: 46}, // side: the cutaway opens
    {f: c.here, pos: [1.4, 1.75, 3.2], target: [0, 1.5, 0], fov: 38}, // the hole, from outside
    {f: c.top - 16, pos: [19, 2.4, 1.5], target: [0, 1.9, 1.5], fov: 74},
    {f: c.up + 12, pos: [19, 2.4, 1.5], target: [0, 1.9, 1.5], fov: 74}, // wide side: tree outside + room inside
    {f: c.flipped, pos: [2.8, 1.7, -0.6], target: [0, 1.5, -3.95], fov: 52}, // the back wall
    {f: c.mozi, pos: [2.2, 1.6, -1.2], target: [0, 1.5, -3.95], fov: 50},
  ];
  const pin = (keys: CamKey[], pt: number[], from: number) => (lf: number) => project(V(pt), viewAt(keys, lf + from), width, height);
  return (
    <AbsoluteFill style={{background: '#07080a'}}>
      <SoundBed
        voiceover={p.voiceover}
        voiceFrom={p.voiceFrom}
        musicVolume={p.musicVolume}
        sfxVolume={p.sfxVolume}
        sfx={[
          {at: c.room - 6, name: 'whoosh'},
          {at: c.here, name: 'click'},
          {at: c.top, name: 'shimmer', vol: 0.5},
          {at: c.bottom, name: 'shimmer', vol: 0.5},
          {at: c.flipped, name: 'whoosh', vol: 0.7},
          {at: c.mozi - 6, name: 'whoosh'},
          {at: c.detail - 6, name: 'whoosh'},
          {at: c.aperture - 6, name: 'whoosh'},
          {at: c.aperture + 10, name: 'whirr', vol: 0.5},
        ]}
      />
      <Shot from={0} to={c.mozi + 4} fadeIn={0} name="Dark room">
        <Stage3D keys={kR} frameOffset={0} background="linear-gradient(#9ec0e8, #dfe9f2)">
          <Room f={f} c={c} scene={scene} tex={tex} />
        </Stage3D>
        <Tag text="إعادة بناء" font={p.font} />
      </Shot>
      <Shot from={c.mozi} to={c.detail + 4} name="Timeline">
        <Timeline f={f} c={c} font={p.font} />
      </Shot>
      <Shot from={c.detail} to={c.aperture + 4} name="Hole size">
        <HoleSize f={f} c={c} font={p.font} />
        <Tag text="محاكاة · رندر Blender" font={p.font} />
      </Shot>
      <Shot from={c.aperture} to={end} fadeOut={0} name="Iris">
        <Iris f={f} c={c} font={p.font} />
        <Tag text="رسم توضيحي" font={p.font} />
      </Shot>

      <ArabicHook font={p.font} from={0} durationInFrames={c.years - 2} lines={HOOK} capHeightPct={3.4} y={20} wordStarts={p.hookWordStarts.length ? p.hookWordStarts : undefined} />
      <Fact font={p.font} from={c.years} to={c.room - 2} value="+2000 سنة" caption={['عمر الجواب']} y={74} capHeightPct={4.6} />
      <PartLabel font={p.font} from={c.here} durationInFrames={c.top - c.here} text="الثقب" capHeightPct={2.5} x={86} y={20} anchor={pin(kR, A.hole, c.here)} width={width} height={height} />
      <Fact font={p.font} from={c.straight} to={c.top - 2} value="خط مستقيم" caption={['الضو ما بلف']} y={74} capHeightPct={4.4} />
      <PartLabel font={p.font} from={c.flipped} durationInFrames={c.mozi - c.flipped} text="الصورة مقلوبة" capHeightPct={2.5} x={86} y={20} anchor={pin(kR, A.screen, c.flipped)} width={width} height={height} />
      <Fact font={p.font} from={c.aperture + 20} to={end} value="نفس الموازنة" caption={['فتحة العدسة: ضو أكثر أو حدّة أكثر']} y={84} capHeightPct={3.8} />

      {p.voiceStatus === 'temp' ? <Tag text="صوت مؤقت" font={p.font} tone="temp" x={70} y={7.6} /> : null}
      {p.showGuides ? <SafeGuides /> : null}
    </AbsoluteFill>
  );
};
