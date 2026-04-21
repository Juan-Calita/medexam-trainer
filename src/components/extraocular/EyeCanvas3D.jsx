import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

const SKULL_URL = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/dorso.glb';
const OLHO_URL  = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/olho.glb';
const MUSC_URL  = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/musculos.glb';

useGLTF.preload(SKULL_URL);
useGLTF.preload(OLHO_URL);
useGLTF.preload(MUSC_URL);

const OLHO_POS = {
  right: [-0.152, 0.190, 0.664],
  left:  [ 0.152, 0.190, 0.664],
};
const MUSC_OFFSET = {
  right: [-0.152 - -0.152, 0.190 - 0.190, 0.629 - 0.664],
  left:  [ 0.152 -  0.152, 0.190 - 0.190, 0.629 - 0.664],
};

const MAX_ROT = 0.44;

function applyImpairment3D(yaw, pitch, failedDirection, eyeSide) {
  let y = yaw;
  let x = pitch;

  switch (failedDirection) {
    case 'abduction':
      if (eyeSide === 'right') y = Math.max(y, -0.06);
      else                      y = Math.min(y,  0.06);
      break;
    case 'adduction':
      if (eyeSide === 'right') y = Math.min(y, 0.06);
      else                      y = Math.max(y, -0.06);
      break;
    case 'elevation':
      x = Math.min(x, 0.06);
      break;
    case 'depression':
      x = Math.max(x, -0.06);
      break;
    case 'depression_adduction':
      if (eyeSide === 'right' && y > 0 && x > 0) x = Math.min(x, 0.05);
      if (eyeSide === 'left'  && y < 0 && x > 0) x = Math.min(x, 0.05);
      break;
    case 'elevation_adduction':
      if (eyeSide === 'right' && y > 0 && x < 0) x = Math.max(x, -0.05);
      if (eyeSide === 'left'  && y < 0 && x < 0) x = Math.max(x, -0.05);
      break;
    case 'cn3_complete':
      if (eyeSide === 'right') y = Math.min(y, 0.05);
      else                      y = Math.max(y, -0.05);
      x = Math.min(x, 0.06);
      break;
    default:
      break;
  }
  return { y, x };
}

function EyeGroup({ side, olhoScene, muscScene, mousePos, containerSize, failedDirection, gameState, showPtose }) {
  const groupRef = useRef();
  const rotRef = useRef({ x: 0, y: 0 });

  const olhoClone = useMemo(() => SkeletonUtils.clone(olhoScene), [olhoScene]);
  const muscClone = useMemo(() => SkeletonUtils.clone(muscScene), [muscScene]);

  useFrame(() => {
    if (!groupRef.current) return;
    const { width, height } = containerSize;
    const nx = width  > 0 ? (mousePos.x - width  / 2) / (width  / 2) : 0;
    const ny = height > 0 ? (mousePos.y - height / 2) / (height / 2) : 0;

    let tYaw   =  nx * MAX_ROT;
    let tPitch = -ny * MAX_ROT;

    const fd = (gameState === 'playing' || gameState === 'feedback') ? failedDirection : null;
    if (fd) {
      const c = applyImpairment3D(tYaw, tPitch, fd, side);
      tYaw   = c.y;
      tPitch = c.x;
    }

    if (fd === 'cn3_complete') {
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

  return (
    <group ref={groupRef} position={OLHO_POS[side]}>
      <primitive object={olhoClone} />
      <primitive object={muscClone} position={[0, 0, MUSC_OFFSET.right[2]]} />
      {showPtose && (gameState === 'playing' || gameState === 'feedback') && (
        <mesh position={[0, 0.012, 0.012]}>
          <boxGeometry args={[0.055, 0.025, 0.002]} />
          <meshBasicMaterial color="#B48C64" transparent opacity={0.82} />
        </mesh>
      )}
    </group>
  );
}

function Scene({ mousePos, containerSize, impairedMuscle, impairedEye, gameState }) {
  const { scene: skullScene } = useGLTF(SKULL_URL);
  const { scene: olhoScene }  = useGLTF(OLHO_URL);
  const { scene: muscScene }  = useGLTF(MUSC_URL);

  const skullClone = useMemo(() => SkeletonUtils.clone(skullScene), [skullScene]);

  const failedDir = (gameState === 'playing' || gameState === 'feedback') && impairedMuscle
    ? impairedMuscle.failedDirection
    : null;
  const hasPtose = impairedMuscle?.visualHints?.includes('ptose') ?? false;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 2]} intensity={0.8} />
      <primitive object={skullClone} position={[0, 0, 0]} />
      <EyeGroup
        side="right"
        olhoScene={olhoScene}
        muscScene={muscScene}
        mousePos={mousePos}
        containerSize={containerSize}
        failedDirection={impairedEye === 'right' ? failedDir : null}
        gameState={gameState}
        showPtose={impairedEye === 'right' && hasPtose}
      />
      <EyeGroup
        side="left"
        olhoScene={olhoScene}
        muscScene={muscScene}
        mousePos={mousePos}
        containerSize={containerSize}
        failedDirection={impairedEye === 'left' ? failedDir : null}
        gameState={gameState}
        showPtose={impairedEye === 'left' && hasPtose}
      />
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center w-full" style={{ height: 320 }}>
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3" />
      <p className="text-sm text-slate-500">Carregando modelo 3D...</p>
    </div>
  );
}

export default function EyeCanvas3D({ mousePos, containerRef, impairedMuscle, impairedEye = 'right', gameState }) {
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const update = () => setContainerSize({ width: el.offsetWidth, height: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 text-sm" style={{ height: 320 }}>
        Modelo 3D indisponível — usando modo 2D
      </div>
    );
  }

  const canvasHeight = containerSize.width < 640 ? 320 : 480;

  return (
    <div style={{ width: '100%', height: canvasHeight }} className="rounded-xl overflow-hidden">
      <Canvas
        dpr={[1, 2]}
        frameloop="always"
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0.2, 1.2], fov: 45 }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
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