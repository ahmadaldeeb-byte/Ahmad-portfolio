/**
 * CLI script for AI Agents to inspect all available 3D assets in the library.
 * Run with: npm run list-assets
 */

export interface AssetMeta {
  name: string;
  category: 'character' | 'explainer' | 'environment' | 'mograph' | 'urban' | 'camera';
  importPath: string;
  description: string;
  props: Record<string, string>;
}

export const ASSET_REGISTRY: AssetMeta[] = [
  {
    name: 'LowPolyCharacter',
    category: 'character',
    importPath: '@3d-assets/assets',
    description: 'Stylized low-poly humanoid character with customizable skins (casual, worker, scooterRider) and action poses.',
    props: {
      variant: "'casual' | 'worker' | 'scooterRider'",
      action: "'idle' | 'walk' | 'wave' | 'point' | 'ride'",
      scale: 'number (default: 1)',
      position: '[x, y, z] (default: [0, 0, 0])',
      rotationY: 'number (radians)',
      vestColor: 'hex string (e.g. #f97316)',
    },
  },
  {
    name: 'Stickman3D',
    category: 'character',
    importPath: '@3d-assets/assets',
    description: 'Minimalist 3D stickman with joints, limbs, and action poses (idle, walk, wave, point, jump).',
    props: {
      action: "'idle' | 'walk' | 'wave' | 'point' | 'jump'",
      color: 'hex string (default: #ffffff)',
      limbThickness: 'number (default: 0.06)',
      scale: 'number (default: 1)',
      position: '[x, y, z]',
    },
  },
  {
    name: 'StructuralCutaway',
    category: 'explainer',
    importPath: '@3d-assets/assets',
    description: 'Architectural/civil beam cross-section exposing internal rebar steel & stirrups (sengkang) with load sag animation.',
    props: {
      length: 'number (default: 6)',
      height: 'number (default: 0.8)',
      depth: 'number (default: 0.8)',
      showCutaway: 'boolean (default: true)',
      deflectionAmount: 'number (sagging depth under load)',
      startSagFrame: 'number (frame when load begins)',
      position: '[x, y, z]',
    },
  },
  {
    name: 'TechnicalCallout3D',
    category: 'explainer',
    importPath: '@3d-assets/assets',
    description: '3D-tracked leader line anchored to world coordinates, with anchor ring and title badge with spring entrance.',
    props: {
      title: 'string (badge text)',
      anchorPosition: '[x, y, z] (point being annotated)',
      badgeOffset: '[dx, dy, dz] (relative position of badge)',
      startFrame: 'number (entrance trigger frame)',
      badgeColor: 'hex string',
    },
  },
  {
    name: 'ForceVectorArrow',
    category: 'explainer',
    importPath: '@3d-assets/assets',
    description: 'Dynamic 3D directional arrow indicating force, tension, sway, or earthquake ground shake.',
    props: {
      direction: "'down' | 'up' | 'left' | 'right' | 'sway'",
      length: 'number (default: 1.2)',
      color: 'hex string',
      position: '[x, y, z]',
      animated: 'boolean (default: true)',
    },
  },
  {
    name: 'DioramaStage',
    category: 'environment',
    importPath: '@3d-assets/assets',
    description: 'Floating low-poly miniature ground chunk with soil layers, stylized trees, and picket fence.',
    props: {
      width: 'number (default: 12)',
      depth: 'number (default: 12)',
      groundColor: 'hex string',
      soilColor: 'hex string',
      showTrees: 'boolean (default: true)',
      showFence: 'boolean (default: true)',
      position: '[x, y, z]',
    },
  },
  {
    name: 'UrbanCityDiorama',
    category: 'environment',
    importPath: '@3d-assets/assets',
    description: 'Complete urban city foundation slab with 2-lane asphalt road, crosswalk, sidewalks, lamps, and street trees.',
    props: {
      width: 'number (default: 16)',
      depth: 'number (default: 14)',
      position: '[x, y, z]',
      showProps: 'boolean (default: true)',
    },
  },
  {
    name: 'HighRiseTower',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Modern low-poly glass skyscraper with repeating window bands, AC chiller box, and antenna mast.',
    props: {
      height: 'number (default: 9)',
      width: 'number (default: 3)',
      depth: 'number (default: 2.8)',
      facadeColor: 'hex string',
      windowColor: 'hex string',
      position: '[x, y, z]',
    },
  },
  {
    name: 'Townhouse',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Stylized 2-3 story townhouse with terracotta roof, commercial shopfront awning, entrance, and windows.',
    props: {
      floors: 'number (default: 3)',
      wallColor: 'hex string',
      roofColor: 'hex string',
      hasAwning: 'boolean (default: true)',
      position: '[x, y, z]',
    },
  },
  {
    name: 'LowPolyCar',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Stylized city car / yellow taxi with rotating wheels, glowing headlights/taillights, and suspension bobbing.',
    props: {
      variant: "'taxi' | 'sedan' | 'van'",
      color: 'hex string (default: #facc15)',
      speed: 'number (units/sec)',
      startPosition: '[x, y, z]',
      direction: '1 | -1',
    },
  },
  {
    name: 'LowPolyScooter',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Scooter/vespa with seated low-poly rider, handlebar, spinning wheels, and vibration physics.',
    props: {
      bodyColor: 'hex string (default: #0284c7)',
      speed: 'number',
      startPosition: '[x, y, z]',
      direction: '1 | -1',
      riderVariant: "'casual' | 'worker'",
    },
  },
  {
    name: 'LowPolyCloud',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Puffy low-poly faceted cloud drifting deterministically across the sky.',
    props: {
      position: '[x, y, z]',
      scale: 'number (default: 1)',
      driftSpeed: 'number',
    },
  },
  {
    name: 'Streetlamp',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Curved streetlamp pole with warm glowing lantern fixture.',
    props: {
      height: 'number (default: 2.2)',
      poleColor: 'hex string',
      lightColor: 'hex string',
      position: '[x, y, z]',
    },
  },
  {
    name: 'TrafficLight',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Traffic signal post with illuminated red, yellow, or green lights.',
    props: {
      height: 'number (default: 2.5)',
      activeColor: "'red' | 'yellow' | 'green'",
      position: '[x, y, z]',
    },
  },
  {
    name: 'LollipopTree',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Stylized round spherical canopy tree on a slender trunk.',
    props: {
      position: '[x, y, z]',
      scale: 'number (default: 1)',
      foliageColor: 'hex string (default: #52835f)',
      trunkColor: 'hex string (default: #856041)',
    },
  },
  {
    name: 'CurtainWallSkyscraper',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: '28-story translucent glass skyscraper with internal white floor slabs, columns, entrance plaza, and perimeter blue barrier.',
    props: {
      position: '[x, y, z]',
      height: 'number (default: 22)',
      width: 'number (default: 3.8)',
      depth: 'number (default: 3.4)',
      glassColor: 'hex string (default: #c2d6d0)',
      glassOpacity: 'number (default: 0.55)',
      floorCount: 'number (default: 28)',
      showPlaza: 'boolean (default: true)',
      showBlueBarrier: 'boolean (default: true)',
    },
  },
  {
    name: 'ModernCurvedTower',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Modern semi-circular curved glass skyscraper with tiered crown and antenna mast.',
    props: {
      position: '[x, y, z]',
      height: 'number (default: 14)',
      radius: 'number (default: 2.2)',
      glassColor: 'hex string (default: #b0cecc)',
    },
  },
  {
    name: 'SteppedCommercialBlock',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Mid-rise contemporary commercial building with setback terrace gardens and blue ribbon glass.',
    props: {
      position: '[x, y, z]',
      width: 'number (default: 4.2)',
      depth: 'number (default: 3.6)',
      facadeColor: 'hex string (default: #f1f5f9)',
    },
  },
  {
    name: 'MiniatureHouse',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Charming residential house with terracotta hipped or gabled roof (cottage, townhouse, apartment, villa).',
    props: {
      variant: "'cottage' | 'townhouse' | 'apartment' | 'villa'",
      position: '[x, y, z]',
      rotationY: 'number (radians)',
      scale: 'number (default: 1)',
      wallColor: 'hex string (default: #faf7f0)',
      roofColor: 'hex string (default: #d2543e)',
    },
  },
  {
    name: 'DistantSkyline',
    category: 'urban',
    importPath: '@3d-assets/assets',
    description: 'Stepped and matrix silhouette towers providing atmospheric background depth for cityscapes.',
    props: {
      position: '[x, y, z] (default: [0, 0, -20])',
      scale: 'number (default: 1)',
      tintColor: 'hex string (default: #cfc8b6)',
    },
  },
  {
    name: 'InfiniteCyberGrid',
    category: 'environment',
    importPath: '@3d-assets/assets',
    description: 'Perspective infinite glowing grid floor with animated forward velocity.',
    props: {
      size: 'number (default: 40)',
      divisions: 'number (default: 40)',
      colorCenterLine: 'hex string (default: #06b6d4)',
      colorGrid: 'hex string (default: #1e293b)',
      speed: 'number (default: 0.5)',
      position: '[x, y, z]',
    },
  },
  {
    name: 'FloatingGlassCard',
    category: 'mograph',
    importPath: '@3d-assets/assets',
    description: '3D frosted glass card with glowing border, title, chip node, and spring entrance.',
    props: {
      title: 'string',
      color: 'hex string',
      width: 'number (default: 3.6)',
      height: 'number (default: 2.2)',
      position: '[x, y, z]',
      startFrame: 'number (default: 5)',
    },
  },
  {
    name: 'Animated3DBarChart',
    category: 'mograph',
    importPath: '@3d-assets/assets',
    description: '3D data bar chart with staggered spring growth animation and glowing indicator caps.',
    props: {
      values: 'number[] (e.g. [4, 7, 5, 9, 12])',
      colors: 'string[] (hex colors)',
      position: '[x, y, z]',
      staggerDelay: 'number (frames between bars)',
    },
  },
  {
    name: 'CryptoToken3D',
    category: 'mograph',
    importPath: '@3d-assets/assets',
    description: 'Beveled 3D gold or neon coin with embossed emblem, continuous spin, and metallic shine.',
    props: {
      color: 'hex string (default: #fbbf24)',
      radius: 'number (default: 1.2)',
      thickness: 'number (default: 0.25)',
      rotationSpeed: 'number (default: 0.4)',
      position: '[x, y, z]',
    },
  },
  {
    name: 'CinematicCamera',
    category: 'camera',
    importPath: '@3d-assets/remotion',
    description: 'Frame-driven camera supporting static, orbit turntable, push-in, and subtle handheld micro-shake.',
    props: {
      mode: "'static' | 'orbit' | 'pushIn' | 'handheldDrift'",
      position: '[x, y, z]',
      target: '[x, y, z]',
      fov: 'number (default: 40)',
      orbitSpeed: 'number (default: 0.2)',
      shakeIntensity: 'number (default: 0.05)',
    },
  },
];

const main = () => {
  console.log('=== REMOTION 3D ASSET LIBRARY CATALOG ===\n');
  console.log(`Total Assets Available: ${ASSET_REGISTRY.length}\n`);

  ASSET_REGISTRY.forEach((asset, idx) => {
    console.log(`[${idx + 1}] <${asset.name} /> (${asset.category.toUpperCase()})`);
    console.log(`    Import:  import { ${asset.name} } from '${asset.importPath}';`);
    console.log(`    Summary: ${asset.description}`);
    console.log('    Props:');
    for (const [propName, propType] of Object.entries(asset.props)) {
      console.log(`      - ${propName}: ${propType}`);
    }
    console.log('');
  });
};

if (require.main === module) {
  main();
}
