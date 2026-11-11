#!/usr/bin/env node

/**
 * remotion-3d-skill CLI
 * Universal Multi-Agent Skill & CLI for 3D Remotion Video Composition
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PKG_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(PKG_ROOT, 'templates');
const REFERENCES_DIR = path.join(PKG_ROOT, 'references');

const ASSET_REGISTRY = [
  {
    name: 'LowPolyCharacter',
    category: 'CHARACTER',
    summary: 'Stylized low-poly humanoid character with customizable skins (casual, worker, scooterRider) and action poses.',
    props: {
      variant: "'casual' | 'worker' | 'scooterRider'",
      action: "'idle' | 'walk' | 'wave' | 'point' | 'ride'",
      scale: 'number (default: 1)',
      position: '[x, y, z]',
      vestColor: 'hex string',
    },
  },
  {
    name: 'Stickman3D',
    category: 'CHARACTER',
    summary: 'Minimalist 3D stickman with joints, limbs, and action poses (idle, walk, wave, point, jump).',
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
    category: 'EXPLAINER',
    summary: 'Architectural beam cross-section exposing internal steel rebars and stirrups with dynamic load sag animation.',
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
    category: 'EXPLAINER',
    summary: '3D-tracked leader line anchored to world coordinates with title badge and spring entrance.',
    props: {
      title: 'string (badge text)',
      anchorPosition: '[x, y, z]',
      badgeOffset: '[dx, dy, dz]',
      startFrame: 'number',
      badgeColor: 'hex string',
    },
  },
  {
    name: 'ForceVectorArrow',
    category: 'EXPLAINER',
    summary: 'Dynamic 3D directional arrow indicating force, tension, sway, or ground shake.',
    props: {
      direction: "'down' | 'up' | 'left' | 'right' | 'sway'",
      length: 'number (default: 1.2)',
      color: 'hex string',
      position: '[x, y, z]',
    },
  },
  {
    name: 'DioramaStage',
    category: 'ENVIRONMENT',
    summary: 'Floating low-poly miniature ground chunk with soil layers, stylized trees, and picket fence.',
    props: {
      width: 'number (default: 12)',
      depth: 'number (default: 12)',
      groundColor: 'hex string',
      showTrees: 'boolean',
      showFence: 'boolean',
      position: '[x, y, z]',
    },
  },
  {
    name: 'UrbanCityDiorama',
    category: 'ENVIRONMENT',
    summary: 'Complete urban foundation slab with 2-lane asphalt road, crosswalk, sidewalks, lamps, and trees.',
    props: {
      width: 'number (default: 16)',
      depth: 'number (default: 14)',
      position: '[x, y, z]',
      showProps: 'boolean',
    },
  },
  {
    name: 'CurtainWallSkyscraper',
    category: 'URBAN',
    summary: '28-story translucent glass skyscraper with internal white floor slabs, columns, entrance plaza, and perimeter blue barrier.',
    props: {
      position: '[x, y, z]',
      height: 'number (default: 22)',
      width: 'number (default: 3.8)',
      depth: 'number (default: 3.4)',
      glassColor: 'hex string (default: #c2d6d0)',
      floorCount: 'number (default: 28)',
      showPlaza: 'boolean',
      showBlueBarrier: 'boolean',
    },
  },
  {
    name: 'ModernCurvedTower',
    category: 'URBAN',
    summary: 'Modern semi-circular curved glass skyscraper with tiered mechanical crown and antenna mast.',
    props: {
      position: '[x, y, z]',
      height: 'number (default: 14)',
      radius: 'number (default: 2.2)',
      glassColor: 'hex string',
    },
  },
  {
    name: 'SteppedCommercialBlock',
    category: 'URBAN',
    summary: 'Mid-rise contemporary commercial building with setback terrace gardens and blue ribbon glass.',
    props: {
      position: '[x, y, z]',
      width: 'number (default: 4.2)',
      depth: 'number (default: 3.6)',
      facadeColor: 'hex string',
    },
  },
  {
    name: 'HighRiseTower',
    category: 'URBAN',
    summary: 'Modern low-poly glass skyscraper with repeating window bands, AC chiller box, and antenna mast.',
    props: {
      height: 'number (default: 9)',
      width: 'number (default: 3)',
      depth: 'number (default: 2.8)',
      facadeColor: 'hex string',
      position: '[x, y, z]',
    },
  },
  {
    name: 'Townhouse',
    category: 'URBAN',
    summary: 'Stylized 2-3 story townhouse with terracotta roof, commercial shopfront awning, entrance, and windows.',
    props: {
      floors: 'number (default: 3)',
      wallColor: 'hex string',
      roofColor: 'hex string',
      hasAwning: 'boolean',
      position: '[x, y, z]',
    },
  },
  {
    name: 'MiniatureHouse',
    category: 'URBAN',
    summary: 'Charming residential house with terracotta hipped or gabled roof (cottage, townhouse, apartment, villa).',
    props: {
      variant: "'cottage' | 'townhouse' | 'apartment' | 'villa'",
      position: '[x, y, z]',
      scale: 'number (default: 1)',
      roofColor: 'hex string',
    },
  },
  {
    name: 'DistantSkyline',
    category: 'URBAN',
    summary: 'Stepped and matrix silhouette towers providing atmospheric background depth for cityscapes.',
    props: {
      position: '[x, y, z]',
      scale: 'number',
      tintColor: 'hex string',
    },
  },
  {
    name: 'LollipopTree',
    category: 'URBAN',
    summary: 'Stylized round spherical canopy tree on a slender trunk.',
    props: {
      position: '[x, y, z]',
      scale: 'number',
      foliageColor: 'hex string',
    },
  },
  {
    name: 'LowPolyCar',
    category: 'URBAN',
    summary: 'Stylized city car / yellow taxi with rotating wheels, glowing headlights/taillights, and suspension bobbing.',
    props: {
      variant: "'taxi' | 'sedan' | 'van'",
      color: 'hex string (default: #facc15)',
      speed: 'number',
      direction: '1 | -1',
    },
  },
  {
    name: 'LowPolyScooter',
    category: 'URBAN',
    summary: 'Scooter/vespa with seated low-poly rider, handlebar, spinning wheels, and vibration physics.',
    props: {
      bodyColor: 'hex string',
      speed: 'number',
      riderVariant: "'casual' | 'worker'",
      direction: '1 | -1',
    },
  },
  {
    name: 'LowPolyCloud',
    category: 'URBAN',
    summary: 'Puffy low-poly faceted cloud drifting deterministically across the sky.',
    props: {
      position: '[x, y, z]',
      scale: 'number',
      driftSpeed: 'number',
    },
  },
  {
    name: 'Streetlamp',
    category: 'URBAN',
    summary: 'Curved streetlamp pole with warm glowing lantern fixture.',
    props: {
      height: 'number (default: 2.2)',
      lightColor: 'hex string',
      position: '[x, y, z]',
    },
  },
  {
    name: 'TrafficLight',
    category: 'URBAN',
    summary: 'Traffic signal post with illuminated red, yellow, or green lights.',
    props: {
      height: 'number (default: 2.5)',
      activeColor: "'red' | 'yellow' | 'green'",
      position: '[x, y, z]',
    },
  },
  {
    name: 'InfiniteCyberGrid',
    category: 'ENVIRONMENT',
    summary: 'Perspective infinite glowing grid floor with animated forward velocity.',
    props: {
      size: 'number (default: 40)',
      divisions: 'number (default: 40)',
      speed: 'number (default: 0.5)',
      position: '[x, y, z]',
    },
  },
  {
    name: 'FloatingGlassCard',
    category: 'MOGRAPH',
    summary: '3D frosted glass card with glowing border, title, chip node, and spring entrance.',
    props: {
      title: 'string',
      color: 'hex string',
      width: 'number (default: 3.6)',
      height: 'number (default: 2.2)',
      startFrame: 'number',
    },
  },
  {
    name: 'Animated3DBarChart',
    category: 'MOGRAPH',
    summary: '3D data bar chart with staggered spring growth animation and glowing indicator caps.',
    props: {
      values: 'number[]',
      colors: 'string[]',
      position: '[x, y, z]',
    },
  },
  {
    name: 'CryptoToken3D',
    category: 'MOGRAPH',
    summary: 'Beveled 3D gold or neon coin with embossed emblem, continuous spin, and metallic shine.',
    props: {
      color: 'hex string (default: #fbbf24)',
      radius: 'number',
      rotationSpeed: 'number',
    },
  },
  {
    name: 'CinematicCamera',
    category: 'CAMERA',
    summary: 'Frame-driven camera supporting static, orbit turntable, push-in, and subtle handheld micro-shake.',
    props: {
      mode: "'static' | 'orbit' | 'pushIn' | 'handheldDrift'",
      position: '[x, y, z]',
      target: '[x, y, z]',
      fov: 'number (default: 40)',
      orbitSpeed: 'number',
      shakeIntensity: 'number',
    },
  },
];

const copyRecursiveSync = (src, dest) => {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const childItem of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, childItem), path.join(dest, childItem));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
};

const handleList = () => {
  console.log('=== REMOTION 3D ASSET LIBRARY CATALOG ===\n');
  console.log(`Total Assets Available: ${ASSET_REGISTRY.length}\n`);

  ASSET_REGISTRY.forEach((asset, idx) => {
    console.log(`[${idx + 1}] <${asset.name} /> (${asset.category})`);
    console.log(`    Summary: ${asset.summary}`);
    console.log('    Props:');
    for (const [propName, propType] of Object.entries(asset.props)) {
      console.log(`      - ${propName}: ${propType}`);
    }
    console.log('');
  });
};

const handleScaffold = (args) => {
  let name = 'Generated3DScene';
  let template = 'diorama-explainer';
  let ratio = '9:16';
  let outputDir = path.resolve(process.cwd(), 'src/scenes');
  let inject = false;
  let componentsDir = path.resolve(process.cwd(), 'src/components/3d');

  for (const arg of args) {
    if (arg.startsWith('--name=')) {
      name = arg.replace('--name=', '').trim();
    } else if (arg.startsWith('--template=')) {
      template = arg.replace('--template=', '').trim();
    } else if (arg.startsWith('--ratio=')) {
      ratio = arg.replace('--ratio=', '').trim();
    } else if (arg.startsWith('--out=')) {
      outputDir = path.resolve(process.cwd(), arg.replace('--out=', '').trim());
    } else if (arg.startsWith('--components-dir=')) {
      componentsDir = path.resolve(process.cwd(), arg.replace('--components-dir=', '').trim());
    } else if (arg === '--inject') {
      inject = true;
    }
  }

  if (inject) {
    console.log(`[INJECT] Copying 3D component templates into ${componentsDir}...`);
    fs.mkdirSync(componentsDir, { recursive: true });
    copyRecursiveSync(path.join(TEMPLATES_DIR, 'core'), path.join(componentsDir, 'core'));
    copyRecursiveSync(path.join(TEMPLATES_DIR, 'remotion'), path.join(componentsDir, 'remotion'));
    copyRecursiveSync(path.join(TEMPLATES_DIR, 'assets'), path.join(componentsDir, 'assets'));
    console.log(`[INJECT] 3D assets injected successfully!`);
  }

  const importCore = inject ? '../components/3d/core' : '@3d-assets/core';
  const importRemotion = inject ? '../components/3d/remotion' : '@3d-assets/remotion';
  const importAssets = inject ? '../components/3d/assets' : '@3d-assets/assets';

  let code = '';
  if (template === 'urban-city') {
    code = `import React from 'react';
import { ThreeCanvasContainer, CinematicCamera } from '${importRemotion}';
import {
  UrbanCityDiorama,
  CurtainWallSkyscraper,
  ModernCurvedTower,
  SteppedCommercialBlock,
  MiniatureHouse,
  DistantSkyline,
  LollipopTree,
  LowPolyCar,
  LowPolyScooter,
  LowPolyCharacter,
  TechnicalCallout3D,
} from '${importAssets}';

export const ${name}: React.FC = () => {
  return (
    <ThreeCanvasContainer clearColor="#ece6db" shadows={true}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[10, 20, 12]} intensity={1.4} castShadow />

      <CinematicCamera
        mode="handheldDrift"
        position={[0, 7.5, 17.5]}
        target={[0, 2.5, 0]}
        fov={38}
        shakeIntensity={0.03}
      />

      <DistantSkyline position={[0, 0, -22]} />
      <UrbanCityDiorama position={[0, -0.4, 0]} width={18} depth={14} />

      <CurtainWallSkyscraper position={[-3.2, 0, -1.8]} height={17} floorCount={22} />
      <ModernCurvedTower position={[3.6, 0, -3.2]} height={12} radius={2.0} />
      <SteppedCommercialBlock position={[-5.8, 0, 2.4]} />

      <MiniatureHouse variant="cottage" position={[3.8, 0, 1.8]} rotationY={-0.3} />
      <MiniatureHouse variant="townhouse" position={[5.4, 0, 1.5]} rotationY={-0.2} />
      <LollipopTree position={[2.4, 0, 2.8]} scale={1.1} />
      <LollipopTree position={[-1.2, 0, 3.2]} scale={0.9} />

      <LowPolyCar variant="taxi" speed={3.2} startPosition={[-8, 0, 0.9]} direction={1} />
      <LowPolyScooter speed={2.4} startPosition={[8, 0, -0.9]} direction={-1} riderVariant="worker" />

      <LowPolyCharacter variant="casual" action="walk" position={[0.5, 0, 2.2]} scale={0.7} />
      <TechnicalCallout3D
        title="METROPOLIS CORE"
        anchorPosition={[-3.2, 8.5, -1.8]}
        badgeOffset={[1.8, 1.5, 0]}
        startFrame={10}
        badgeColor="#0284c7"
      />
    </ThreeCanvasContainer>
  );
};
`;
  } else if (template === 'tech-showcase') {
    code = `import React from 'react';
import { ThreeCanvasContainer, CinematicCamera } from '${importRemotion}';
import { StudioLighting } from '${importCore}';
import {
  InfiniteCyberGrid,
  FloatingGlassCard,
  CryptoToken3D,
  Animated3DBarChart,
  Stickman3D,
} from '${importAssets}';

export const ${name}: React.FC = () => {
  return (
    <ThreeCanvasContainer clearColor="#0b0f19" shadows={true}>
      <StudioLighting keyColor="#ffffff" fillColor="#64748b" rimColor="#06b6d4" />

      <CinematicCamera
        mode="orbit"
        position={[0, 4, 9]}
        target={[0, 1.2, 0]}
        orbitSpeed={0.15}
        orbitRadius={9}
      />

      <InfiniteCyberGrid size={32} divisions={32} />

      <FloatingGlassCard position={[-3, 1.8, 0]} title="3D ENGINE" color="#06b6d4" />
      <CryptoToken3D position={[0, 1.5, 0]} rotationSpeed={0.4} />
      <Animated3DBarChart position={[3, 0, 0]} values={[4, 6, 8, 12]} />
      <Stickman3D position={[0, 0, 2]} action="wave" />
    </ThreeCanvasContainer>
  );
};
`;
  } else {
    // Default: diorama-explainer
    code = `import React from 'react';
import { ThreeCanvasContainer, CinematicCamera } from '${importRemotion}';
import { DioramaSunlight } from '${importCore}';
import {
  DioramaStage,
  StructuralCutaway,
  LowPolyCharacter,
  TechnicalCallout3D,
  ForceVectorArrow,
} from '${importAssets}';

export const ${name}: React.FC = () => {
  return (
    <ThreeCanvasContainer clearColor="#e8dfd5">
      <DioramaSunlight intensity={1.3} sunPosition={[7, 12, 8]} />

      <CinematicCamera
        mode="handheldDrift"
        position={[0, 4.2, 8.8]}
        target={[0, 1.2, 0]}
        fov={40}
        shakeIntensity={0.05}
      />

      <DioramaStage width={9} depth={9} position={[0, -0.8, 0]} showTrees={true} showFence={true} />

      <StructuralCutaway
        position={[0, 1.5, 0]}
        length={5.2}
        showCutaway={true}
        deflectionAmount={0.3}
        startSagFrame={20}
      />

      <LowPolyCharacter
        variant="worker"
        action="point"
        position={[-2.1, 0.9, 0.5]}
        scale={0.85}
        rotationY={0.6}
      />

      <ForceVectorArrow direction="down" position={[0, 2.9, 0]} length={1.0} />

      <TechnicalCallout3D
        title="INSPECTION PIN"
        anchorPosition={[0.8, 1.25, 0.3]}
        badgeOffset={[1.2, 1.3, 0]}
        startFrame={15}
        badgeColor="#2563eb"
      />
    </ThreeCanvasContainer>
  );
};
`;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${name}.tsx`);
  fs.writeFileSync(filePath, code, 'utf-8');

  console.log(`\n[SUCCESS] Scaffolder generated scene component:`);
  console.log(`  File:      ${filePath}`);
  console.log(`  Template:  ${template}`);
  console.log(`  Ratio:     ${ratio}`);
  console.log(`  Injected:  ${inject ? 'Yes (Local Components in ' + componentsDir + ')' : 'No'}\n`);
  console.log(`Required dependencies for target Remotion project:`);
  console.log(`  npm install three @react-three/fiber @remotion/three zod`);
  console.log(`  npm install -D @types/three\n`);
};

const handleInstallSkill = (args) => {
  const home = os.homedir();
  const destinations = [];

  let target = 'all';
  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      target = arg.replace('--target=', '').trim();
    }
  }

  if (target === 'antigravity' || target === 'all') {
    destinations.push(path.join(home, '.gemini/antigravity-cli/skills/remotion-3d-skill'));
  }
  if (target === 'claude' || target === 'all') {
    destinations.push(path.join(home, '.claude/skills/remotion-3d-skill'));
  }
  if (target === 'project') {
    destinations.push(path.resolve(process.cwd(), '.agents/skills/remotion-3d-skill'));
  }

  for (const dest of destinations) {
    console.log(`[INSTALL] Installing skill to: ${dest}...`);
    fs.mkdirSync(dest, { recursive: true });
    fs.copyFileSync(path.join(PKG_ROOT, 'SKILL.md'), path.join(dest, 'SKILL.md'));
    copyRecursiveSync(REFERENCES_DIR, path.join(dest, 'references'));
    copyRecursiveSync(path.join(PKG_ROOT, 'scripts'), path.join(dest, 'scripts'));
    copyRecursiveSync(TEMPLATES_DIR, path.join(dest, 'templates'));
    console.log(`[INSTALL] Installed successfully to ${dest}`);
  }
};

const handleHelp = () => {
  console.log(`
remotion-3d-skill CLI — Deterministic 3D Remotion Video Composition

Usage:
  npx remotion-3d-skill [command] [options]

Commands:
  list                          List all 25+ 3D assets and prop specifications
  scaffold [options]            Scaffold a 3D scene and optionally inject components
  install-skill [options]       Install skill into Antigravity or Claude Code global folders
  help                          Display this help menu

Scaffold Options:
  --name=<SceneName>            Name of generated component (default: Generated3DScene)
  --template=<name>             Template: 'diorama-explainer', 'urban-city', 'tech-showcase'
  --ratio=<9:16|16:9>           Aspect ratio
  --out=<path>                  Output directory (default: src/scenes)
  --inject                      Inject self-contained 3D component source code locally
  --components-dir=<path>       Destination for injected components (default: src/components/3d)

Install Skill Options:
  --target=<all|antigravity|claude|project>  Destination for skill installation (default: all)

Examples:
  npx remotion-3d-skill list
  npx remotion-3d-skill scaffold --name=UrbanCity --template=urban-city --inject
  npx remotion-3d-skill install-skill --target=antigravity
`);
};

const main = () => {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  switch (command) {
    case 'list':
      handleList();
      break;
    case 'scaffold':
      handleScaffold(args.slice(1));
      break;
    case 'install-skill':
      handleInstallSkill(args.slice(1));
      break;
    case 'help':
    case '--help':
    case '-h':
      handleHelp();
      break;
    default:
      if (command.startsWith('--')) {
        handleScaffold(args);
      } else {
        console.error(`Unknown command: ${command}`);
        handleHelp();
        process.exit(1);
      }
  }
};

main();
