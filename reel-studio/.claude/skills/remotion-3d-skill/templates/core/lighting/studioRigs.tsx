import React from 'react';

export interface DioramaSunlightProps {
  intensity?: number;
  sunPosition?: [number, number, number];
  shadows?: boolean;
}

/**
 * Warm sunlight rig recreating the aesthetic of the diorama explainer reference.
 */
export const DioramaSunlight: React.FC<DioramaSunlightProps> = ({
  intensity = 1.2,
  sunPosition = [8, 14, 10],
  shadows = true,
}) => {
  return (
    <>
      {/* Warm directional sun */}
      <directionalLight
        position={sunPosition}
        intensity={intensity}
        color="#fff8ed"
        castShadow={shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      {/* Soft warm ambient fill */}
      <ambientLight intensity={0.55} color="#f5f0ea" />
      {/* Subtle sky bounce */}
      <hemisphereLight
        args={['#fdfcf9', '#e8dfd5', 0.45]}
        position={[0, 20, 0]}
      />
    </>
  );
};

export interface StudioLightingProps {
  keyColor?: string;
  fillColor?: string;
  rimColor?: string;
}

/**
 * High-end three-point studio lighting for product reveals and motion graphics.
 */
export const StudioLighting: React.FC<StudioLightingProps> = ({
  keyColor = '#ffffff',
  fillColor = '#cbd5e1',
  rimColor = '#38bdf8',
}) => {
  return (
    <>
      <directionalLight position={[5, 8, 5]} intensity={1.4} color={keyColor} castShadow />
      <directionalLight position={[-6, 4, 2]} intensity={0.6} color={fillColor} />
      <directionalLight position={[0, -5, -6]} intensity={1.0} color={rimColor} />
      <ambientLight intensity={0.4} />
    </>
  );
};
