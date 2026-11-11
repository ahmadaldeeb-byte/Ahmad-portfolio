import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const cache = new Map<string, Promise<THREE.Group>>();
const texCache = new Map<string, Promise<THREE.Texture>>();

/** Loads public/models/<ep>.glb once (render waits for it). Objects keep their Blender names. */
export const useGLB = (file: string) => {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [handle] = useState(() => delayRender(`load ${file}`));
  useEffect(() => {
    if (!cache.has(file)) cache.set(file, new GLTFLoader().loadAsync(staticFile(file)).then((g) => {
          // unique material per mesh, so fading one object never fades another that shared a material
          g.scene.traverse((c) => {
            const m = c as THREE.Mesh;
            if (m.isMesh && m.material) m.material = (m.material as THREE.Material).clone();
          });
          return g.scene;
        }));
    cache.get(file)!.then((s) => {
      setScene(s);
      continueRender(handle);
    });
  }, [file, handle]);
  return scene;
};

export const useTexture = (file: string) => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender(`texture ${file}`));
  useEffect(() => {
    if (!texCache.has(file))
      texCache.set(
        file,
        new THREE.TextureLoader().loadAsync(staticFile(file)).then((t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          return t;
        }),
      );
    texCache.get(file)!.then((t) => {
      setTex(t);
      continueRender(handle);
    });
  }, [file, handle]);
  return tex;
};

/** Find a named object (glTF export may suffix names with .001 etc.). */
export const node = (scene: THREE.Object3D, name: string) => scene.getObjectByName(name) ?? scene.getObjectByName(name.replace(/\./g, ''));

/** Set opacity on every material under an object (makes them transparent when < 1). */
export const setOpacity = (o: THREE.Object3D | undefined, a: number) => {
  o?.traverse((c) => {
    const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (!m) return;
    if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
    m.opacity = m.userData.baseOpacity * a;
    m.transparent = m.opacity < 0.999 || m.userData.baseOpacity < 0.999;
    m.depthWrite = m.opacity > 0.999;
    c.visible = a > 0.001;
  });
};
