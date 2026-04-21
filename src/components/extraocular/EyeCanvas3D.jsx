import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const DORSO_URL    = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/dorso.glb';
const OLHO_URL     = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/olho.glb';
const MUSCULOS_URL = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/musculos.glb';

useGLTF.preload(DORSO_URL);
useGLTF.preload(OLHO_URL);
useGLTF.preload(MUSCULOS_URL);

const MAX_ROT = 0.44; // ~25 degrees
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

function Skull() {
  const { scene } = useGLTF(DORSO_URL);
  return <primitive object={scene} />;
}

function Eye({ side, mousePos, containerSize, failedDirection, showPtose }) {
  const { scene } = useGLTF(OLHO_URL);
  const cloned = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef();
  const rotRef = useRef({ yaw: 0, pitch: 0 });

  useFrame(() => {
    if (!groupRef.current) return;
    const { width, height } = containerSize;
    const nx = width  > 0 ? (mousePos.x - width  / 2) / (width  / 2) : 0;
    const ny = height > 0 ? (mousePos.y - height / 2) / (height / 2) : 0;
    let tYaw   =  Math.max(-1, Math.min(1, nx)) * MAX_ROT;
    let tPitch = -Math.max(-1, Math.min(1, ny)) * MAX_ROT;
    const clamped = applyImpairment3D(tYaw, tPitch, failedDirection, side);
    rotRef.current.yaw   += (clamped.yaw   - rotRef.current.yaw)   * 0.15;
    rotRef.current.pitch += (clamped.pitch - rotRef.current.pitch) * 0.15;
    groupRef.current.rotation.y = rotRef.current.yaw;
    groupRef.current.rotation.x = rotRef.current.pitch;
  });

  return (
    <group position={OLHO_POS[side]} ref={groupRef}>
      <primitive object={cloned} />
      {showPtose && (
        <mesh position={[0, 0.08, 0.02]}>
          <boxGeometry args={[0.3, 0.18, 0.28]} />
          <meshStandardMaterial color="#d4a373" transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}

function Muscles({ side }) {
  const { scene } = useGLTF(MUSCULOS_URL);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} position={MUSC_POS[side]} />;
}

function Scene({ mousePos, containerSize, impairedMuscle, impairedEye, gameState }) {
  const active = gameState === 'playing' || gameState === 'feedback';
  const failedDir = active && impairedMuscle ? impairedMuscle.failedDirection : null;
  const hasPtose = active && (impairedMuscle?.visualHints?.includes('ptose') ?? false);
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.25, 1.8]} fov={35} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[2, 3, 2]} intensity={0.8} />
      <directionalLight position={[-2, 1, 2]} intensity={0.3} />
      <Skull />
      <Eye side="right" mousePos={mousePos} containerSize={containerSize}
           failedDirection={impairedEye === 'right' ? failedDir : null}
           showPtose={impairedEye === 'right' && hasPtose} />
      <Eye side="left"  mousePos={mousePos} containerSize={containerSize}
           failedDirection={impairedEye === 'left' ? failedDir : null}
           showPtose={impairedEye === 'left' && hasPtose} />
      <Muscles side="right" />
      <Muscles side="left" />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full text-slate-500">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Carregando modelo 3D...</span>
      </div>
    </div>
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
         className="rounded-xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-200">
      <Canvas dpr={[1, 2]} frameloop="always" gl={{ alpha: true, antialias: true }}
              style={{ width: '100%', height: '100%' }}>
        <Suspense fallback={null}>
          <Scene mousePos={mousePos}
                 containerSize={{ width: containerSize.width, height: canvasHeight }}
                 impairedMuscle={impairedMuscle}
                 impairedEye={impairedEye}
                 gameState={gameState} />
        </Suspense>
      </Canvas>
    </div>
  );
}