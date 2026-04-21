import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Fallback 3D scene — no external GLB files needed.
// Renders two stylised eyeball spheres that follow the mouse, with the same
// impairment logic as the 2D canvas.
// ---------------------------------------------------------------------------

const MAX_ROT = 0.44;

const EYE_POSITIONS = {
  right: [-0.55, 0, 0],
  left:  [ 0.55, 0, 0],
};

function applyImpairment3D(yaw, pitch, failedDirection, eyeSide) {
  let y = yaw;
  let x = pitch;
  switch (failedDirection) {
    case 'abduction':
      if (eyeSide === 'right') y = Math.max(y, -0.06); else y = Math.min(y, 0.06);
      break;
    case 'adduction':
      if (eyeSide === 'right') y = Math.min(y, 0.06);  else y = Math.max(y, -0.06);
      break;
    case 'elevation':   x = Math.min(x, 0.06);  break;
    case 'depression':  x = Math.max(x, -0.06); break;
    case 'depression_adduction':
      if (eyeSide === 'right' && y > 0 && x > 0) x = Math.min(x, 0.05);
      if (eyeSide === 'left'  && y < 0 && x > 0) x = Math.min(x, 0.05);
      break;
    case 'elevation_adduction':
      if (eyeSide === 'right' && y > 0 && x < 0) x = Math.max(x, -0.05);
      if (eyeSide === 'left'  && y < 0 && x < 0) x = Math.max(x, -0.05);
      break;
    case 'cn3_complete':
      if (eyeSide === 'right') y = Math.min(y, 0.05); else y = Math.max(y, -0.05);
      x = Math.min(x, 0.06);
      break;
    default: break;
  }
  return { y, x };
}

function EyeBall({ side, mousePos, containerSize, failedDirection, showPtose }) {
  const groupRef = useRef();
  const rotRef   = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (!groupRef.current) return;
    const { width, height } = containerSize;
    const nx = width  > 0 ? (mousePos.x - width  / 2) / (width  / 2) : 0;
    const ny = height > 0 ? (mousePos.y - height / 2) / (height / 2) : 0;

    let tYaw   =  nx * MAX_ROT;
    let tPitch = -ny * MAX_ROT;

    if (failedDirection) {
      const c = applyImpairment3D(tYaw, tPitch, failedDirection, side);
      tYaw   = c.y;
      tPitch = c.x;
    }

    if (failedDirection === 'cn3_complete') {
      const restY = side === 'right' ? -MAX_ROT * 0.5 : MAX_ROT * 0.5;
      const restX = MAX_ROT * 0.3;
      tYaw   = restY + (tYaw   - restY) * 0.15;
      tPitch = restX + (tPitch - restX) * 0.15;
    }

    rotRef.current.x += (tPitch - rotRef.current.x) * 0.12;
    rotRef.current.y += (tYaw   - rotRef.current.y) * 0.12;
    groupRef.current.rotation.x = rotRef.current.x;
    groupRef.current.rotation.y = rotRef.current.y;
  });

  const pos = EYE_POSITIONS[side];

  return (
    <group position={pos}>
      {/* Sclera */}
      <mesh>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color="#f8f8f5" roughness={0.3} />
      </mesh>

      {/* Iris */}
      <group ref={groupRef}>
        <mesh position={[0, 0, 0.32]}>
          <circleGeometry args={[0.18, 32]} />
          <meshStandardMaterial color="#2563eb" roughness={0.4} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.325]}>
          <circleGeometry args={[0.09, 32]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        {/* Specular highlight */}
        <mesh position={[-0.04, 0.05, 0.33]}>
          <circleGeometry args={[0.025, 16]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Ptose lid overlay */}
      {showPtose && (
        <mesh position={[0, 0.22, 0.26]}>
          <boxGeometry args={[0.78, 0.32, 0.05]} />
          <meshStandardMaterial color="#c8a882" transparent opacity={0.88} />
        </mesh>
      )}
    </group>
  );
}

function Scene({ mousePos, containerSize, impairedMuscle, impairedEye, gameState }) {
  const active    = gameState === 'playing' || gameState === 'feedback';
  const failedDir = active && impairedMuscle ? impairedMuscle.failedDirection : null;
  const hasPtose  = active && (impairedMuscle?.visualHints?.includes('ptose') ?? false);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 3]} intensity={0.8} />
      <directionalLight position={[-2, -1, 2]} intensity={0.3} />

      {/* Simple face sphere */}
      <mesh position={[0, 0, -0.45]}>
        <sphereGeometry args={[1.1, 48, 48]} />
        <meshStandardMaterial color="#f5deb3" roughness={0.8} />
      </mesh>

      <EyeBall
        side="right"
        mousePos={mousePos}
        containerSize={containerSize}
        failedDirection={impairedEye === 'right' ? failedDir : null}
        showPtose={impairedEye === 'right' && hasPtose}
      />
      <EyeBall
        side="left"
        mousePos={mousePos}
        containerSize={containerSize}
        failedDirection={impairedEye === 'left' ? failedDir : null}
        showPtose={impairedEye === 'left' && hasPtose}
      />
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

  const canvasHeight = containerSize.width < 640 ? 300 : 420;

  return (
    <div style={{ width: '100%', height: canvasHeight }} className="rounded-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900">
      <Canvas
        dpr={[1, 2]}
        frameloop="always"
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene
          mousePos={mousePos}
          containerSize={{ width: containerSize.width, height: canvasHeight }}
          impairedMuscle={impairedMuscle}
          impairedEye={impairedEye}
          gameState={gameState}
        />
      </Canvas>
    </div>
  );
}