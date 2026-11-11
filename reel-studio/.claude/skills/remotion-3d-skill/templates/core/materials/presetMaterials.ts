import * as THREE from 'three';

/**
 * Standardized PBR & Stylized Material Presets for 3D Video Assets.
 * Uses Three.js built-in materials with optimized render settings.
 */

export const Palette = {
  // Diorama Explainer Palette (Reference Match)
  sandNeutral: '#e8dfd5',
  warmGround: '#dcd1c4',
  terracottaRoof: '#c85a42',
  foliageSage: '#5e8652',
  foliageDark: '#3e6335',
  woodBrown: '#8b5a2b',
  concreteGrey: '#d1d5db',
  concreteDark: '#9ca3af',
  soilBrown: '#6b4423',
  soilSubsoil: '#8d5b2d',
  waterTranslucent: '#74a8a3',
  rebarBlue: '#2563eb',
  rebarRed: '#dc2626',
  safetyOrange: '#f97316',
  safetyYellow: '#eab308',

  // Motion Graphics & Tech Palette
  cyberCyan: '#06b6d4',
  cyberPurple: '#a855f7',
  neonGreen: '#22c55e',
  glassWhite: '#ffffff',
  goldMetallic: '#eab308',
  darkStudio: '#0f172a',
} as const;

export const createDioramaMaterials = () => {
  return {
    foliage: new THREE.MeshStandardMaterial({
      color: Palette.foliageSage,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    }),
    treeTrunk: new THREE.MeshStandardMaterial({
      color: Palette.woodBrown,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true,
    }),
    concrete: new THREE.MeshStandardMaterial({
      color: Palette.concreteGrey,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    }),
    terracotta: new THREE.MeshStandardMaterial({
      color: Palette.terracottaRoof,
      roughness: 0.7,
      metalness: 0.05,
      flatShading: true,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: Palette.waterTranslucent,
      roughness: 0.1,
      transmission: 0.7,
      opacity: 0.85,
      transparent: true,
      ior: 1.33,
    }),
    soilCutaway: new THREE.MeshStandardMaterial({
      color: Palette.soilBrown,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: true,
    }),
    rebarSteel: new THREE.MeshStandardMaterial({
      color: Palette.rebarBlue,
      roughness: 0.3,
      metalness: 0.8,
    }),
    safetyVest: new THREE.MeshStandardMaterial({
      color: Palette.safetyOrange,
      roughness: 0.6,
      metalness: 0.1,
    }),
  };
};

export const createTechMaterials = () => {
  return {
    frostedGlass: new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.25,
      transmission: 0.85,
      transparent: true,
      opacity: 0.85,
      ior: 1.5,
    }),
    goldCoin: new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      roughness: 0.2,
      metalness: 0.9,
    }),
    neonCyan: new THREE.MeshBasicMaterial({
      color: Palette.cyberCyan,
    }),
  };
};
