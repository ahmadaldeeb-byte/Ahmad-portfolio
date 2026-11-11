import React from 'react';
import { ThreeCanvasContainer, CinematicCamera } from '@3d-assets/remotion';
import { DioramaSunlight } from '@3d-assets/core';
import {
  DioramaStage,
  StructuralCutaway,
  LowPolyCharacter,
  TechnicalCallout3D,
  ForceVectorArrow,
} from '@3d-assets/assets';

/**
 * 9:16 Vertical Video Composition (Explainer / Edukatif)
 * Inspired by the structural engineering diorama references.
 */
export const DioramaExplainerScene: React.FC = () => {
  return (
    <ThreeCanvasContainer clearColor="#e8dfd5">
      {/* Warm natural sun and sky lighting */}
      <DioramaSunlight intensity={1.3} sunPosition={[7, 12, 8]} />

      {/* Cinematic camera with subtle organic handheld drift */}
      <CinematicCamera
        mode="handheldDrift"
        position={[0, 5.5, 11.5]}
        target={[0, 1.2, 0]}
        fov={38}
        shakeIntensity={0.06}
      />

      {/* Low-poly diorama ground slice with trees and picket fence */}
      <DioramaStage
        width={9}
        depth={9}
        position={[0, -0.8, 0]}
        showTrees={true}
        showFence={true}
      />

      {/* Structural concrete beam cutaway with internal rebar & load sag */}
      <StructuralCutaway
        position={[0, 1.5, 0]}
        length={5.2}
        showCutaway={true}
        deflectionAmount={0.3}
        startSagFrame={20}
      />

      {/* Civil engineer / worker character pointing to the structural beam */}
      <LowPolyCharacter
        variant="worker"
        action="point"
        position={[-2.1, 0.9, 0.5]}
        scale={0.85}
        rotationY={0.6}
      />

      {/* Dynamic 3D downward force vector arrow indicating load pressure */}
      <ForceVectorArrow
        direction="down"
        position={[0, 2.9, 0]}
        length={1.0}
        animated={true}
      />

      {/* Technical leader line callouts anchored to internal rebar */}
      <TechnicalCallout3D
        title="BESI TULANGAN"
        anchorPosition={[0.8, 1.25, 0.3]}
        badgeOffset={[1.2, 1.3, 0]}
        startFrame={15}
        badgeColor="#2563eb"
      />
      <TechnicalCallout3D
        title="SENGKANG"
        anchorPosition={[-0.7, 1.6, 0.3]}
        badgeOffset={[-1.2, 1.3, 0]}
        startFrame={30}
        badgeColor="#dc2626"
      />
    </ThreeCanvasContainer>
  );
};
