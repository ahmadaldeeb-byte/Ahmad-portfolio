/**
 * CLI Scaffolding & Code-Injection Script for Remotion 3D Scenes.
 * Usage:
 *   npx tsx scripts/scaffold-scene.ts --name=MyNewScene --template=diorama-explainer --ratio=9:16
 *   npx tsx scripts/scaffold-scene.ts --name=UrbanShowcase --template=urban-city --inject
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ScaffoldOptions {
  name: string;
  template: 'diorama-explainer' | 'tech-showcase' | 'urban-city' | 'custom';
  ratio: '9:16' | '16:9';
  outputDir: string;
  inject: boolean;
  componentsDir: string;
}

const parseArgs = (): ScaffoldOptions => {
  const args = process.argv.slice(2);
  const options: ScaffoldOptions = {
    name: 'Generated3DScene',
    template: 'diorama-explainer',
    ratio: '9:16',
    outputDir: path.resolve(process.cwd(), 'src/scenes'),
    inject: false,
    componentsDir: path.resolve(process.cwd(), 'src/components/3d'),
  };

  for (const arg of args) {
    if (arg.startsWith('--name=')) {
      options.name = arg.replace('--name=', '').trim();
    } else if (arg.startsWith('--template=')) {
      options.template = arg.replace('--template=', '').trim() as any;
    } else if (arg.startsWith('--ratio=')) {
      options.ratio = arg.replace('--ratio=', '').trim() as any;
    } else if (arg.startsWith('--out=')) {
      options.outputDir = path.resolve(process.cwd(), arg.replace('--out=', '').trim());
    } else if (arg.startsWith('--components-dir=')) {
      options.componentsDir = path.resolve(process.cwd(), arg.replace('--components-dir=', '').trim());
    } else if (arg === '--inject') {
      options.inject = true;
    }
  }

  return options;
};

const copyRecursiveSync = (src: string, dest: string) => {
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

const injectTemplates = (opts: ScaffoldOptions) => {
  const templatesDir = path.resolve(__dirname, '../templates');
  if (!fs.existsSync(templatesDir)) {
    console.warn(`[WARN] Templates directory not found at ${templatesDir}`);
    return;
  }

  console.log(`[INJECT] Copying 3D component templates into ${opts.componentsDir}...`);
  fs.mkdirSync(opts.componentsDir, { recursive: true });

  copyRecursiveSync(path.join(templatesDir, 'core'), path.join(opts.componentsDir, 'core'));
  copyRecursiveSync(path.join(templatesDir, 'remotion'), path.join(opts.componentsDir, 'remotion'));
  copyRecursiveSync(path.join(templatesDir, 'assets'), path.join(opts.componentsDir, 'assets'));

  console.log(`[INJECT] Successfully injected 3D assets, core math, and canvas container into ${opts.componentsDir}`);
};

const generateSceneCode = (opts: ScaffoldOptions): string => {
  const importCore = opts.inject ? '../components/3d/core' : '@3d-assets/core';
  const importRemotion = opts.inject ? '../components/3d/remotion' : '@3d-assets/remotion';
  const importAssets = opts.inject ? '../components/3d/assets' : '@3d-assets/assets';

  if (opts.template === 'tech-showcase') {
    return `import React from 'react';
import { ThreeCanvasContainer, CinematicCamera } from '${importRemotion}';
import { StudioLighting } from '${importCore}';
import {
  InfiniteCyberGrid,
  FloatingGlassCard,
  CryptoToken3D,
  Animated3DBarChart,
  Stickman3D,
} from '${importAssets}';

export const ${opts.name}: React.FC = () => {
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
  }

  if (opts.template === 'urban-city') {
    return `import React from 'react';
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

export const ${opts.name}: React.FC = () => {
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

      {/* Hero Skyscraper & Modern Towers */}
      <CurtainWallSkyscraper position={[-3.2, 0, -1.8]} height={17} floorCount={22} />
      <ModernCurvedTower position={[3.6, 0, -3.2]} height={12} radius={2.0} />
      <SteppedCommercialBlock position={[-5.8, 0, 2.4]} />

      {/* Residential Cottages & Trees */}
      <MiniatureHouse variant="cottage" position={[3.8, 0, 1.8]} rotationY={-0.3} />
      <MiniatureHouse variant="townhouse" position={[5.4, 0, 1.5]} rotationY={-0.2} />
      <LollipopTree position={[2.4, 0, 2.8]} scale={1.1} />
      <LollipopTree position={[-1.2, 0, 3.2]} scale={0.9} />

      {/* Active Traffic */}
      <LowPolyCar variant="taxi" speed={3.2} startPosition={[-8, 0, 0.9]} direction={1} />
      <LowPolyScooter speed={2.4} startPosition={[8, 0, -0.9]} direction={-1} riderVariant="worker" />

      {/* Pedestrians & Callout */}
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
  }

  // Default: Diorama Explainer
  return `import React from 'react';
import { ThreeCanvasContainer, CinematicCamera } from '${importRemotion}';
import { DioramaSunlight } from '${importCore}';
import {
  DioramaStage,
  StructuralCutaway,
  LowPolyCharacter,
  TechnicalCallout3D,
  ForceVectorArrow,
} from '${importAssets}';

export const ${opts.name}: React.FC = () => {
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
};

const run = () => {
  const opts = parseArgs();

  if (opts.inject) {
    injectTemplates(opts);
  }

  const filePath = path.join(opts.outputDir, `${opts.name}.tsx`);
  fs.mkdirSync(opts.outputDir, { recursive: true });
  fs.writeFileSync(filePath, generateSceneCode(opts), 'utf-8');

  console.log(`\n[SUCCESS] Scaffolder generated scene component:`);
  console.log(`  File:      ${filePath}`);
  console.log(`  Template:  ${opts.template}`);
  console.log(`  Ratio:     ${opts.ratio}`);
  console.log(`  Injected:  ${opts.inject ? 'Yes (Local Components)' : 'No (Package Imports)'}\n`);
  console.log(`Target Remotion project dependencies required:`);
  console.log(`  npm install three @react-three/fiber @remotion/three zod`);
};

if (require.main === module) {
  run();
}
