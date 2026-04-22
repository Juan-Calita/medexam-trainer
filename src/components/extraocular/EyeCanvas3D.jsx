import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const DORSO_URL    = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/dorso.glb';
const OLHO_URL     = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/olho.glb';
const MUSCULOS_URL = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/musculos.glb';

useGLTF.preload(DORSO_URL);
useGLTF.preload(OLHO_URL);
useGLTF.preload(MUSCULOS_URL);

const MAX_ROT = 0.44;
const OLHO_POS = {
  right: [-0.152, 0.190, 0.664],
  left:  [ 0.152, 0.190, 0.664],
};
const MUSC_POS = {
  right: [-0.152, 0.190, 0.629],
  left:  [ 0.152, 0.190, 0.629],
};

function applyImpairment3D(yaw, pitch, failedDirection, eyeSide) {
  if (!failedDirection) return { yaw, pitch };
  let y = yaw, p = pitch;
  const TEMP = 0.06;
  switch (failedDirection) {
    case 'abduction':
      if (eyeSide === 'right') y = Math.max(y, -TEMP); else y = Math.min(y, TEMP);
      break;
    case 'adduction':
      if (eyeSide === 'right') y = Math.min(y, TEMP); else y = Math.max(y, -TEMP);
      break;
    case 'elevation':  p = Math.min(p, TEMP); break;
    case 'depression': p = Math.max(p, -TEMP); break;
    case 'depression_adduction':
      if (eyeSide === 'right' && y > 0 && p < 0) p = Math.max(p, -TEMP);
      if (eyeSide === 'left'  && y < 0 && p < 0) p = Math.max(p, -TEMP);
      break;
    case 'elevation_adduction':
      if (eyeSide === 'right' && y > 0 && p > 0) p = Math.min(p, TEMP);
      if (eyeSide === 'left'  && y < 0 && p > 0) p = Math.min(p, TEMP);
      break;
    case 'cn3_complete':
      if (eyeSide === 'right') y = Math.min(y, 0.05); else y = Math.max(y, -0.05);
      p = Math.max(p, -TEMP);
      break;
    default: break;
  }
  return { yaw: y, pitch: p };
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.25, 1.8);
    camera.fov = 35;
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function Skull() {
  const gltf = useGLTF(DORSO_URL);
  const cloned = useMemo(() => gltf.scene ? gltf.scene.clone() : null, [gltf.scene]);
  if (!cloned) return null;
  return <primitive object={cloned} />;
}

function Eye({ side, mousePos, containerSize, failedDirection }) {
  const gltf = useGLTF(OLHO_URL);
  const cloned = useMemo(() => gltf.scene ? gltf.scene.clone() : null, [gltf.scene]);
  const groupRef = useRef();
  const rotRef = useRef({ yaw: 0, pitch: 0 });

  useFrame(() => {
    if (!groupRef.current || !cloned) return;
    const { width, height } = containerSize;
    const nx = width  > 0 ? (mousePos.x - width  / 2) / (width  / 2) : 0;
    const ny = height > 0 ? (mousePos.y - height / 2) / (height / 2) : 0;
    const cx = Math.max(-1, Math.min(1, nx));
    const cy = Math.max(-1, Math.min(1, ny));
    let tYaw   =  cx * MAX_ROT;
    let tPitch = -cy * MAX_ROT;
    const clamped = applyImpairment3D(tYaw, tPitch, failedDirection, side);
    rotRef.current.yaw   += (clamped.yaw   - rotRef.current.yaw)   * 0.15;
    rotRef.current.pitch += (clamped.pitch - rotRef.current.pitch) * 0.15;
    groupRef.current.rotation.y = rotRef.current.yaw;
    groupRef.current.rotation.x = rotRef.current.pitch;
  });

  if (!cloned) return null;

  return (
    <group position={OLHO_POS[side]} ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}

function Muscles({ side }) {
  const gltf = useGLTF(MUSCULOS_URL);
  const cloned = useMemo(() => gltf.scene ? gltf.scene.clone() : null, [gltf.scene]);
  if (!cloned) return null;
  return <primitive object={cloned} position={MUSC_POS[side]} />;
}

function Lights() {
  return (
    <>
      <ambientLight args={[0xffffff, 0.7]} />
      <directionalLight args={[0xffffff, 0.9]} position={[2, 3, 2]} />
      <directionalLight args={[0xffffff, 0.4]} position={[-2, 1, 2]} />
    </>
  );
}

function Scene({ mousePos, containerSize, impairedMuscle, impairedEye, gameState }) {
  const active = gameState === 'playing' || gameState === 'feedback';
  const failedDir = active && impairedMuscle ? impairedMuscle.failedDirection : null;
  return (
    <>
      <CameraSetup />
      <Lights />
      <Skull />
      <Eye side="right" mousePos={mousePos} containerSize={containerSize}
           failedDirection={impairedEye === 'right' ? failedDir : null} />
      <Eye side="left"  mousePos={mousePos} containerSize={containerSize}
           failedDirection={impairedEye === 'left' ? failedDir : null} />
      <Muscles side="right" />
      <Muscles side="left" />
    </>
  );
}

export default function EyeCanvas3D({ mousePos, containerRef, impairedMuscle, impairedEye = 'right', gameState }) {
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const update = () => setContainerSize({ width: el.offsetWidth, height: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  const canvasHeight = containerSize.width < 640 ? 320 : 480;

  return (
    <div style={{ width: '100%', height: canvasHeight }}
         className="rounded-xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200 relative">
      <Canvas
        dpr={[1, 2]}
        frameloop="always"
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0.25, 1.8], fov: 35 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene
            mousePos={mousePos}
            containerSize={{ width: containerSize.width, height: canvasHeight }}
            impairedMuscle={impairedMuscle}
            impairedEye={impairedEye}
            gameState={gameState}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}