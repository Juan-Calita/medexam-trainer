import React, { useRef, useEffect, useState } from 'react';

function constrainPupil(dx, dy, maxRadius) {
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > maxRadius) {
    return { x: (dx / dist) * maxRadius, y: (dy / dist) * maxRadius };
  }
  return { x: dx, y: dy };
}

function applyImpairment(px, py, failedDirection, eyeSide) {
  if (!failedDirection) return { x: px, y: py };
  let x = px, y = py;
  switch (failedDirection) {
    case 'abduction':
      if (eyeSide === 'right' && x < 0) x = Math.max(x, -4);
      if (eyeSide === 'left'  && x > 0) x = Math.min(x, 4);
      break;
    case 'adduction':
      if (eyeSide === 'right' && x > 0) x = Math.min(x, 4);
      if (eyeSide === 'left'  && x < 0) x = Math.max(x, -4);
      break;
    case 'elevation':
      if (y < 0) y = Math.max(y, -4);
      break;
    case 'depression':
      if (y > 0) y = Math.min(y, 4);
      break;
    case 'depression_adduction':
      if (eyeSide === 'right' && x > 0 && y > 0) y = Math.min(y, 3);
      if (eyeSide === 'left'  && x < 0 && y > 0) y = Math.min(y, 3);
      break;
    case 'elevation_adduction':
      if (eyeSide === 'right' && x > 0 && y < 0) y = Math.max(y, -3);
      if (eyeSide === 'left'  && x < 0 && y < 0) y = Math.max(y, -3);
      break;
    case 'cn3_complete':
      if (eyeSide === 'right' && x > 0) x = Math.min(x, 2);
      if (eyeSide === 'left'  && x < 0) x = Math.max(x, -2);
      if (y < 0) y = Math.max(y, -2);
      if (y > 0) y = Math.min(y, 4);
      break;
    default:
      break;
  }
  return { x, y };
}

function Eye({ cx, cy, size, mousePos, containerRect, failedDirection, eyeSide, showImpairmentHint, hasPtose }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const pupilRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * 2 * dpr;
    canvas.height = size * 2 * dpr;
    canvas.style.width = `${size * 2}px`;
    canvas.style.height = `${size * 2}px`;
    ctx.scale(dpr, dpr);
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRect) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const W = size * 2;
      const H = size * 2;
      const eyeCX = size;
      const eyeCY = size;
      const scleraR = size - 2;
      const irisR = scleraR * 0.55;
      const pupilR = irisR * 0.45;
      const maxPupilTravel = scleraR - irisR - 1;

      const rawDx = mousePos.x - cx;
      const rawDy = mousePos.y - cy;
      const angle = Math.atan2(rawDy, rawDx);
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      const clamped = Math.min(dist * 0.12, maxPupilTravel);
      let targetX = Math.cos(angle) * clamped;
      let targetY = Math.sin(angle) * clamped;

      if (failedDirection === 'cn3_complete') {
        const restX = eyeSide === 'right' ? -maxPupilTravel * 0.6 : maxPupilTravel * 0.6;
        const restY = maxPupilTravel * 0.35;
        targetX = restX + (targetX - restX) * 0.15;
        targetY = restY + (targetY - restY) * 0.15;
      }

      const impaired = applyImpairment(targetX, targetY, failedDirection, eyeSide);
      targetX = impaired.x;
      targetY = impaired.y;

      pupilRef.current.x += (targetX - pupilRef.current.x) * 0.12;
      pupilRef.current.y += (targetY - pupilRef.current.y) * 0.12;

      ctx.clearRect(0, 0, W, H);

      // Sclera with dark-mode feel
      ctx.beginPath();
      ctx.arc(eyeCX, eyeCY, scleraR, 0, Math.PI * 2);
      const scleraGrad = ctx.createRadialGradient(eyeCX - scleraR * 0.2, eyeCY - scleraR * 0.2, 0, eyeCX, eyeCY, scleraR);
      scleraGrad.addColorStop(0, '#e8f4f8');
      scleraGrad.addColorStop(1, '#c8dce8');
      ctx.fillStyle = scleraGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(148,163,184,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Iris
      const irisCX = eyeCX + pupilRef.current.x;
      const irisCY = eyeCY + pupilRef.current.y;
      const irisGrad = ctx.createRadialGradient(irisCX - irisR * 0.25, irisCY - irisR * 0.25, 0, irisCX, irisCY, irisR);
      irisGrad.addColorStop(0, '#06b6d4');
      irisGrad.addColorStop(0.6, '#0e7490');
      irisGrad.addColorStop(1, '#164e63');
      ctx.beginPath();
      ctx.arc(irisCX, irisCY, irisR, 0, Math.PI * 2);
      ctx.fillStyle = irisGrad;
      ctx.fill();

      // Iris texture lines
      ctx.save();
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(irisCX + Math.cos(a) * pupilR * 1.1, irisCY + Math.sin(a) * pupilR * 1.1);
        ctx.lineTo(irisCX + Math.cos(a) * irisR * 0.9, irisCY + Math.sin(a) * irisR * 0.9);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Pupil
      ctx.beginPath();
      ctx.arc(irisCX, irisCY, pupilR, 0, Math.PI * 2);
      ctx.fillStyle = '#050a0f';
      ctx.fill();

      // Reflection
      ctx.beginPath();
      ctx.arc(irisCX - pupilR * 0.35, irisCY - pupilR * 0.35, pupilR * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(irisCX + pupilR * 0.2, irisCY - pupilR * 0.1, pupilR * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();

      // Impairment ring
      if (showImpairmentHint && failedDirection) {
        ctx.beginPath();
        ctx.arc(eyeCX, eyeCY, scleraR - 1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239,68,68,0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Ptose
      if (hasPtose) {
        ctx.beginPath();
        ctx.rect(eyeCX - scleraR, eyeCY - scleraR, scleraR * 2, scleraR * 1.1);
        ctx.fillStyle = 'rgba(120,90,60,0.88)';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(eyeCX - scleraR, eyeCY - scleraR + scleraR * 1.1);
        ctx.lineTo(eyeCX + scleraR, eyeCY - scleraR + scleraR * 1.1);
        ctx.strokeStyle = '#5a3e28';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [mousePos, failedDirection, eyeSide, cx, cy, size, containerRect, showImpairmentHint, hasPtose]);

  return (
    <div style={{ position: 'absolute', left: cx - size, top: cy - size, width: size * 2, height: size * 2 }}>
      <canvas ref={canvasRef} style={{ borderRadius: '50%' }} />
      {hasPtose && (
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '54%',
            background: 'rgba(120,90,60,0.88)',
            borderRadius: '50% 50% 0 0 / 60% 60% 0 0',
            borderBottom: '2px solid #5a3e28',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

export default function EyeCanvas({ mousePos, containerRef, impairedMuscle, impairedEye = 'right', gameState, inputMode = 'mouse' }) {
  const faceRef = useRef(null);
  const [containerRect, setContainerRect] = React.useState(null);
  const [faceSize, setFaceSize] = React.useState({ w: 340, h: 230 });

  React.useEffect(() => {
    const update = () => {
      if (faceRef.current) {
        const r = faceRef.current.getBoundingClientRect();
        setContainerRect(r);
        setFaceSize({ w: r.width, h: r.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const W = faceSize.w;
  const H = faceSize.h;
  const eyeY = H * 0.42;
  const leftEyeX = W * 0.35;
  const rightEyeX = W * 0.65;
  const eyeSize = Math.min(W * 0.13, 44);

  const failedDir = impairedMuscle ? impairedMuscle.failedDirection : null;
  const showHint = gameState === 'feedback';
  const leftImpaired = impairedEye === 'left';
  const eyeLabel = impairedEye === 'left' ? 'Olho esquerdo' : 'Olho direito';
  const isCN3 = failedDir === 'cn3_complete';
  const showPtose = isCN3 && (gameState === 'playing' || gameState === 'feedback');

  const faceClientRect = faceRef.current ? faceRef.current.getBoundingClientRect() : null;
  const containerClientRect = containerRef.current ? containerRef.current.getBoundingClientRect() : null;
  const relMouse = {
    x: faceClientRect && containerClientRect ? mousePos.x - (faceClientRect.left - containerClientRect.left) : mousePos.x,
    y: faceClientRect && containerClientRect ? mousePos.y - (faceClientRect.top - containerClientRect.top) : mousePos.y,
  };

  return (
    <div className="flex flex-col items-center">
      {/* Instruction */}
      <p className="text-[11px] text-slate-500 mb-3 tracking-widest uppercase font-medium">
        {inputMode === 'camera'
          ? 'Mova a caneta sobre o rosto — observe o movimento ocular'
          : 'Mova o mouse sobre o rosto — observe o movimento ocular'}
      </p>

      {/* Face */}
      <div
        ref={faceRef}
        className="relative rounded-[60%] border shadow-2xl"
        style={{
          width: '340px',
          height: '230px',
          maxWidth: '90vw',
          background: 'linear-gradient(135deg, #2a1f18 0%, #1c1510 100%)',
          borderColor: 'rgba(100,80,60,0.4)',
          boxShadow: '0 0 40px rgba(6,182,212,0.08), 0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Eyebrows */}
        <div style={{ position: 'absolute', top: '22%', left: '24%', width: '20%', height: '3px', background: 'rgba(180,140,100,0.7)', borderRadius: '4px', transform: 'rotate(-5deg)' }} />
        <div style={{ position: 'absolute', top: '22%', right: '24%', width: '20%', height: '3px', background: 'rgba(180,140,100,0.7)', borderRadius: '4px', transform: 'rotate(5deg)' }} />

        {/* Eyes */}
        {containerRect !== null && (
          <>
            <Eye
              cx={leftEyeX} cy={eyeY} size={eyeSize}
              mousePos={relMouse} containerRect={containerRect}
              failedDirection={!leftImpaired ? failedDir : null}
              eyeSide="right"
              showImpairmentHint={!leftImpaired ? showHint : false}
              hasPtose={!leftImpaired && showPtose}
            />
            <Eye
              cx={rightEyeX} cy={eyeY} size={eyeSize}
              mousePos={relMouse} containerRect={containerRect}
              failedDirection={leftImpaired ? failedDir : null}
              eyeSide="left"
              showImpairmentHint={leftImpaired ? showHint : false}
              hasPtose={leftImpaired && showPtose}
            />
          </>
        )}

        {/* Nose */}
        <div style={{ position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '14px', borderLeft: '1.5px solid rgba(180,140,100,0.4)', borderRight: '1.5px solid rgba(180,140,100,0.4)', borderBottom: '1.5px solid rgba(180,140,100,0.4)', borderRadius: '0 0 50% 50%' }} />

        {/* Mouth */}
        <div style={{ position: 'absolute', top: '76%', left: '50%', transform: 'translateX(-50%)', width: '36px', height: '10px', borderBottom: '1.5px solid rgba(180,100,80,0.5)', borderRadius: '0 0 50% 50%' }} />

        {/* Impaired label */}
        {gameState === 'playing' && (
          <div style={{ position: 'absolute', top: 6, ...(leftImpaired ? { right: 8 } : { left: 8 }) }}>
            <span className="text-[10px] text-rose-300 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              {eyeLabel} comprometido
            </span>
          </div>
        )}
      </div>

      {/* Orientation labels */}
      <div className="flex justify-between w-full max-w-xs mt-2 px-2">
        <span className="text-[10px] text-slate-600">← Temporal (E)</span>
        <span className="text-[10px] text-slate-600">{impairedMuscle ? (leftImpaired ? 'OD normal' : 'OE normal') : ''}</span>
        <span className="text-[10px] text-slate-600">Temporal (D) →</span>
      </div>
      <div className="flex justify-between w-full max-w-xs px-2">
        <span className="text-[10px] text-slate-500 font-semibold">OD</span>
        <span className="text-[10px] text-slate-500 font-semibold">OE</span>
      </div>
    </div>
  );
}