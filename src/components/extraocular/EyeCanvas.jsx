import React, { useRef, useEffect } from 'react';

// Eye physics: constrain pupil inside iris circle
function constrainPupil(dx, dy, maxRadius) {
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > maxRadius) {
    return { x: (dx / dist) * maxRadius, y: (dy / dist) * maxRadius };
  }
  return { x: dx, y: dy };
}

// Apply muscle impairment to pupil offset
function applyImpairment(px, py, failedDirection, eyeSide) {
  if (!failedDirection) return { x: px, y: py };

  let x = px;
  let y = py;

  switch (failedDirection) {
    case 'abduction':
      // Cannot move outward
      if (eyeSide === 'left' && x < 0) x = Math.max(x, -4);
      if (eyeSide === 'right' && x > 0) x = Math.min(x, 4);
      break;
    case 'adduction':
      // Cannot move inward
      if (eyeSide === 'left' && x > 0) x = Math.min(x, 4);
      if (eyeSide === 'right' && x < 0) x = Math.max(x, -4);
      break;
    case 'elevation':
      // Cannot move up
      if (y < 0) y = Math.max(y, -4);
      break;
    case 'depression':
      // Cannot move down
      if (y > 0) y = Math.min(y, 4);
      break;
    case 'depression_adduction':
      // Cannot depress when adducted
      if (eyeSide === 'left' && x > 0 && y > 0) y = Math.min(y, 3);
      if (eyeSide === 'right' && x < 0 && y > 0) y = Math.min(y, 3);
      break;
    case 'elevation_adduction':
      // Cannot elevate when adducted
      if (eyeSide === 'left' && x > 0 && y < 0) y = Math.max(y, -3);
      if (eyeSide === 'right' && x < 0 && y < 0) y = Math.max(y, -3);
      break;
    case 'cn3_complete':
      // Olho "down and out": só LR e SO funcionam
      // Sem adução, elevação, depressão → olho fica lateralizado e levemente deprimido
      // Bloqueia movimento medial e para cima
      if (eyeSide === 'left' && x < 0) x = Math.max(x, -2); // sem adução (para a direita)
      if (eyeSide === 'right' && x > 0) x = Math.min(x, 2); // sem adução (para a esquerda)
      if (y < 0) y = Math.max(y, -2); // sem elevação
      if (y > 0) y = Math.min(y, 4); // depressão moderada (SO funcional)
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
    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      const W = size * 2;
      const H = size * 2;
      const eyeCX = size;
      const eyeCY = size;
      const scleraR = size - 2;
      const irisR = scleraR * 0.55;
      const pupilR = irisR * 0.45;
      const maxPupilTravel = scleraR - irisR - 1;

      // Compute target offset from mouse
      const eyeScreenX = containerRect.left + cx;
      const eyeScreenY = containerRect.top + cy;
      const rawDx = mousePos.x - (cx);
      const rawDy = mousePos.y - (cy);
      const angle = Math.atan2(rawDy, rawDx);
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      const clamped = Math.min(dist * 0.12, maxPupilTravel);
      let targetX = Math.cos(angle) * clamped;
      let targetY = Math.sin(angle) * clamped;

      // For CN III palsy: eye rests "down and out"
      if (failedDirection === 'cn3_complete') {
        const restX = eyeSide === 'left' ? -maxPupilTravel * 0.6 : maxPupilTravel * 0.6;
        const restY = maxPupilTravel * 0.35;
        targetX = restX + (targetX - restX) * 0.15;
        targetY = restY + (targetY - restY) * 0.15;
      }

      // Apply muscle impairment
      const impaired = applyImpairment(targetX, targetY, failedDirection, eyeSide);
      targetX = impaired.x;
      targetY = impaired.y;

      // Smooth interpolation
      pupilRef.current.x += (targetX - pupilRef.current.x) * 0.12;
      pupilRef.current.y += (targetY - pupilRef.current.y) * 0.12;

      ctx.clearRect(0, 0, W, H);

      // Sclera
      ctx.beginPath();
      ctx.arc(eyeCX, eyeCY, scleraR, 0, Math.PI * 2);
      ctx.fillStyle = '#FAFAFA';
      ctx.fill();
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Iris
      const irisCX = eyeCX + pupilRef.current.x;
      const irisCY = eyeCY + pupilRef.current.y;
      const irisGrad = ctx.createRadialGradient(irisCX - irisR * 0.2, irisCY - irisR * 0.2, 0, irisCX, irisCY, irisR);
      irisGrad.addColorStop(0, '#4E8EC7');
      irisGrad.addColorStop(1, '#1E4E8C');
      ctx.beginPath();
      ctx.arc(irisCX, irisCY, irisR, 0, Math.PI * 2);
      ctx.fillStyle = irisGrad;
      ctx.fill();

      // Pupil
      ctx.beginPath();
      ctx.arc(irisCX, irisCY, pupilR, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();

      // Light reflection
      ctx.beginPath();
      ctx.arc(irisCX - pupilR * 0.4, irisCY - pupilR * 0.4, pupilR * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();

      // Impairment indicator (subtle red arc if showing hint)
      if (showImpairmentHint && failedDirection) {
        ctx.beginPath();
        ctx.arc(eyeCX, eyeCY, scleraR - 1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239,68,68,0.35)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [mousePos, failedDirection, eyeSide, cx, cy, size, containerRect, showImpairmentHint]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', left: cx - size, top: cy - size }}
    />
  );
}

export default function EyeCanvas({ mousePos, containerRef, impairedMuscle, impairedEye = 'right', gameState }) {
  const faceRef = useRef(null);
  const [containerRect, setContainerRect] = React.useState(null);
  const [faceSize, setFaceSize] = React.useState({ w: 320, h: 220 });

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
  const eyeSize = Math.min(W * 0.13, 42);

  const failedDir = impairedMuscle ? impairedMuscle.failedDirection : null;
  const showHint = gameState === 'feedback';
  const leftImpaired = impairedEye === 'left';
  const eyeLabel = impairedEye === 'left' ? 'Olho esquerdo' : 'Olho direito';

  // Adjust mouse relative to face container
  const relMouse = {
    x: mousePos.x - (containerRef.current ? containerRef.current.getBoundingClientRect().left : 0) + (containerRef.current ? containerRef.current.getBoundingClientRect().left : 0) - (faceRef.current ? faceRef.current.getBoundingClientRect().left : 0),
    y: mousePos.y - (faceRef.current ? faceRef.current.getBoundingClientRect().top : 0),
  };

  return (
    <div className="flex flex-col items-center">
      {/* Instruction label */}
      <p className="text-xs text-slate-400 mb-3 tracking-wide uppercase font-medium">
        Move your mouse over the face — observe eye movement
      </p>

      {/* Face */}
      <div
        ref={faceRef}
        className="relative bg-[#FFF8F0] rounded-[60%] border border-slate-200 shadow-md"
        style={{ width: '320px', height: '220px', maxWidth: '90vw' }}
      >
        {/* Eyebrows */}
        <div style={{ position: 'absolute', top: '22%', left: '24%', width: '20%', height: '4px', background: '#6B7280', borderRadius: '4px', transform: 'rotate(-5deg)' }} />
        <div style={{ position: 'absolute', top: '22%', right: '24%', width: '20%', height: '4px', background: '#6B7280', borderRadius: '4px', transform: 'rotate(5deg)' }} />

        {/* Eyes */}
        {containerRect !== null && (
          <>
            {/* Left eye */}
            <Eye
              cx={leftEyeX}
              cy={eyeY}
              size={eyeSize}
              mousePos={relMouse}
              containerRect={containerRect}
              failedDirection={leftImpaired ? failedDir : null}
              eyeSide="left"
              showImpairmentHint={leftImpaired ? showHint : false}
            />
            {/* Right eye */}
            <Eye
              cx={rightEyeX}
              cy={eyeY}
              size={eyeSize}
              mousePos={relMouse}
              containerRect={containerRect}
              failedDirection={!leftImpaired ? failedDir : null}
              eyeSide="right"
              showImpairmentHint={!leftImpaired ? showHint : false}
            />
          </>
        )}

        {/* Nose */}
        <div style={{ position: 'absolute', top: '58%', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '16px', borderLeft: '2px solid #D1B99A', borderRight: '2px solid #D1B99A', borderBottom: '2px solid #D1B99A', borderRadius: '0 0 50% 50%' }} />

        {/* Mouth */}
        <div style={{ position: 'absolute', top: '76%', left: '50%', transform: 'translateX(-50%)', width: '40px', height: '12px', borderBottom: '2px solid #C2856A', borderRadius: '0 0 50% 50%' }} />

        {/* Impaired eye label */}
        {gameState === 'playing' && (
          <div style={{ position: 'absolute', top: 4, right: 8 }}>
            <span className="text-[10px] text-rose-400 font-medium bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              {eyeLabel} comprometido
            </span>
          </div>
        )}
      </div>

      {/* Orientation label */}
      <div className="flex justify-between w-full max-w-xs mt-2 px-2">
        <span className="text-[10px] text-slate-400">← Temporal (E)</span>
        <span className="text-[10px] text-slate-400">{impairedMuscle ? (leftImpaired ? 'OD normal' : 'OE normal') : ''}</span>
        <span className="text-[10px] text-slate-400">Temporal (D) →</span>
      </div>
    </div>
  );
}