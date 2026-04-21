import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Model URLs — replace with your actual hosted GLB files
// ---------------------------------------------------------------------------
const SKULL_URL = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/dorso.glb';
const OLHO_URL  = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/olho.glb';
const MUSC_URL  = 'https://cdn.jsdelivr.net/gh/Juan-Calita/medexam-trainer@main/models/musculos.glb';

const MAX_ROT = 0.44;

// Eye world positions inside the skull model
const EYE_POSITIONS = {
  right: new THREE.Vector3(-0.152, 0.190, 0.664),
  left:  new THREE.Vector3( 0.152, 0.190, 0.664),
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

// Deep-clone a THREE.Object3D without sharing geometries/materials
function deepClone(obj) {
  const clone = obj.clone(true);
  clone.traverse((node) => {
    if (node.isMesh) {
      node.geometry = node.geometry.clone();
      if (Array.isArray(node.material)) {
        node.material = node.material.map(m => m.clone());
      } else if (node.material) {
        node.material = node.material.clone();
      }
    }
  });
  return clone;
}

function EyeGroup({ side, olhoScene, muscScene, mousePos, containerSize, failedDirection, showPtose }) {
  const groupRef = useRef();
  const rotRef = useRef({ x: 0, y: 0 });

  // Clone once when scenes are loaded
  const olhoClone = useMemo(() => olhoScene ? deepClone(olhoScene) : null, [olhoScene]);
  const muscClone  = useMemo(() => muscScene  ? deepClone(muscScene)  : null, [muscScene]);

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
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      {olhoClone && <primitive object={olhoClone} />}
      {muscClone  && <primitive object={muscClone}  />}
      {showPtose && (
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

  const skullClone = useMemo(() => skullScene ? deepClone(skullScene) : null, [skullScene]);

  const active = gameState === 'playing' || gameState === 'feedback';
  const failedDir = active && impairedMuscle ? impairedMuscle.failedDirection : null;
  const hasPtose  = active && (impairedMuscle?.visualHints?.includes('ptose') ?? false);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 2]} intensity={0.8} />
      {skullClone && <primitive object={skullClone} />}
      <EyeGroup
        side="right"
        olhoScene={olhoScene}
        muscScene={muscScene}
        mousePos={mousePos}
        containerSize={containerSize}
        failedDirection={impairedEye === 'right' ? failedDir : null}
        showPtose={impairedEye === 'right' && hasPtose}
      />
      <EyeGroup
        side="left"
        olhoScene={olhoScene}
        muscScene={muscScene}
        mousePos={mousePos}
        containerSize={containerSize}
        failedDirection={impairedEye === 'left' ? failedDir : null}
        showPtose={impairedEye === 'left' && hasPtose}
      />
    </>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
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

  const fallback = (
    <div className="flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 text-sm" style={{ height: canvasHeight }}>
      Modelo 3D indisponível
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback}>
      <div style={{ width: '100%', height: canvasHeight }} className="rounded-xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
        <Canvas
          dpr={[1, 2]}
          frameloop="always"
          camera={{ position: [0, 0.2, 1.2], fov: 45 }}
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
    </ErrorBoundary>
  );
}