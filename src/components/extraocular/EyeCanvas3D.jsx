import React, { useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// EyeCanvas3D — pseudo-3D eye canvas rendered with plain HTML5 Canvas API.
// No R3F / Three.js dependencies — guaranteed to work anywhere.
// Shares identical impairment logic with EyeCanvas (2D mode).
// ---------------------------------------------------------------------------

function applyImpairment(px, py, failedDirection, eyeSide) {
  if (!failedDirection) return { x: px, y: py };
  let x = px;
  let y = py;

  switch (failedDirection) {
    case 'abduction':
      if (eyeSide === 'right' && x < 0) x = Math.max(x, -4);
      if (eyeSide === 'left'  && x > 0) x = Math.min(x,  4);
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
      if (eyeSide === 'right') x = Math.min(x, 2);
      else                      x = Math.max(x, -2);
      y = Math.max(y, -2);
      y = Math.min(y, 4);
      break;
    default:
      break;
  }
  return { x, y };
}

function drawEye3D(ctx, cx, cy, size, pupilOffset, failedDir, eyeSide, showHint, hasPtose) {
  const scleraR = size - 2;
  const irisR   = scleraR * 0.55;
  const pupilR  = irisR * 0.45;
  const maxTravel = scleraR - irisR - 1;

  const angle = Math.atan2(pupilOffset.y, pupilOffset.x);
  const dist  = Math.sqrt(pupilOffset.x ** 2 + pupilOffset.y ** 2);
  const clamped = Math.min(dist * 0.12, maxTravel);
  let tx = Math.cos(angle) * clamped;
  let ty = Math.sin(angle) * clamped;

  if (failedDir === 'cn3_complete') {
    const restX = eyeSide === 'right' ? -maxTravel * 0.6 : maxTravel * 0.6;
    const restY = maxTravel * 0.35;
    tx = restX + (tx - restX) * 0.15;
    ty = restY + (ty - restY) * 0.15;
  }

  const imp = applyImpairment(tx, ty, failedDir, eyeSide);
  tx = imp.x;
  ty = imp.y;

  // --- Shadow for depth ---
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur  = 10;
  ctx.shadowOffsetY = 4;

  // Sclera (white of eye) with slight off-white gradient for 3D feel
  const scleraGrad = ctx.createRadialGradient(cx - scleraR * 0.25, cy - scleraR * 0.25, 0, cx, cy, scleraR);
  scleraGrad.addColorStop(0, '#ffffff');
  scleraGrad.addColorStop(1, '#d8dde8');
  ctx.beginPath();
  ctx.arc(cx, cy, scleraR, 0, Math.PI * 2);
  ctx.fillStyle = scleraGrad;
  ctx.fill();
  ctx.restore();

  // Sclera border
  ctx.beginPath();
  ctx.arc(cx, cy, scleraR, 0, Math.PI * 2);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Iris with 3D gradient
  const irisCX = cx + tx;
  const irisCY = cy + ty;
  const irisGrad = ctx.createRadialGradient(irisCX - irisR * 0.3, irisCY - irisR * 0.3, 0, irisCX, irisCY, irisR);
  irisGrad.addColorStop(0,   '#60a5fa');
  irisGrad.addColorStop(0.5, '#2563eb');
  irisGrad.addColorStop(1,   '#1e3a8a');
  ctx.beginPath();
  ctx.arc(irisCX, irisCY, irisR, 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();

  // Iris texture lines (radial spokes for realism)
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(irisCX + Math.cos(a) * pupilR * 1.1, irisCY + Math.sin(a) * pupilR * 1.1);
    ctx.lineTo(irisCX + Math.cos(a) * irisR * 0.95, irisCY + Math.sin(a) * irisR * 0.95);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  // Pupil with depth gradient
  const pupilGrad = ctx.createRadialGradient(irisCX - pupilR * 0.3, irisCY - pupilR * 0.3, 0, irisCX, irisCY, pupilR);
  pupilGrad.addColorStop(0, '#1a1a2e');
  pupilGrad.addColorStop(1, '#000000');
  ctx.beginPath();
  ctx.arc(irisCX, irisCY, pupilR, 0, Math.PI * 2);
  ctx.fillStyle = pupilGrad;
  ctx.fill();

  // Primary specular highlight
  ctx.beginPath();
  ctx.arc(irisCX - pupilR * 0.45, irisCY - pupilR * 0.45, pupilR * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();

  // Secondary smaller highlight
  ctx.beginPath();
  ctx.arc(irisCX + pupilR * 0.3, irisCY - pupilR * 0.2, pupilR * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();

  // Sclera ambient occlusion ring (inner shadow illusion)
  const aoGrad = ctx.createRadialGradient(cx, cy, scleraR * 0.6, cx, cy, scleraR);
  aoGrad.addColorStop(0,   'rgba(0,0,0,0)');
  aoGrad.addColorStop(1,   'rgba(0,0,0,0.12)');
  ctx.beginPath();
  ctx.arc(cx, cy, scleraR, 0, Math.PI * 2);
  ctx.fillStyle = aoGrad;
  ctx.fill();

  // Impairment hint ring
  if (showHint && failedDir) {
    ctx.beginPath();
    ctx.arc(cx, cy, scleraR - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239,68,68,0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Ptose overlay
  if (hasPtose) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - scleraR, cy - scleraR, scleraR * 2, scleraR * 1.1);
    const ptoseGrad = ctx.createLinearGradient(cx, cy - scleraR, cx, cy - scleraR + scleraR * 1.1);
    ptoseGrad.addColorStop(0,   'rgba(160,120,80,0.92)');
    ptoseGrad.addColorStop(0.7, 'rgba(180,140,100,0.88)');
    ptoseGrad.addColorStop(1,   'rgba(120,90,60,0.75)');
    ctx.fillStyle = ptoseGrad;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - scleraR, cy - scleraR + scleraR * 1.1);
    ctx.lineTo(cx + scleraR, cy - scleraR + scleraR * 1.1);
    ctx.strokeStyle = '#7c5c3a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function EyeCanvas3DInner({ mousePos, containerRef, impairedMuscle, impairedEye = 'right', gameState }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const pupilsRef = useRef({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 420, H = 280;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const failedDir = (gameState === 'playing' || gameState === 'feedback') && impairedMuscle
      ? impairedMuscle.failedDirection : null;
    const showHint  = gameState === 'feedback';
    const isCN3     = failedDir === 'cn3_complete';
    const showPtose = isCN3 && (gameState === 'playing' || gameState === 'feedback');

    const leftImpaired = impairedEye === 'left';

    // Layout
    const eyeY      = H * 0.42;
    const leftEyeX  = W * 0.32;  // OD (on left side of screen)
    const rightEyeX = W * 0.68;  // OE (on right side of screen)
    const eyeSize   = Math.min(W * 0.13, 46);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Background — dark scene for 3D atmosphere
      const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8);
      bgGrad.addColorStop(0, '#1e293b');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Face oval (stylised, dark skin tone with subtle shading)
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur  = 24;
      ctx.shadowOffsetY = 8;
      const faceGrad = ctx.createRadialGradient(W / 2 - 10, H * 0.3, 0, W / 2, H * 0.5, H * 0.55);
      faceGrad.addColorStop(0, '#f5d5a8');
      faceGrad.addColorStop(0.6, '#e8c58a');
      faceGrad.addColorStop(1, '#c9a46a');
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.5, W * 0.38, H * 0.46, 0, 0, Math.PI * 2);
      ctx.fillStyle = faceGrad;
      ctx.fill();
      ctx.restore();

      // Eyebrow OD (left on screen)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftEyeX - eyeSize * 0.9, eyeY - eyeSize * 1.15);
      ctx.quadraticCurveTo(leftEyeX, eyeY - eyeSize * 1.35, leftEyeX + eyeSize * 0.9, eyeY - eyeSize * 1.18);
      ctx.strokeStyle = '#4a3520';
      ctx.lineWidth   = eyeSize * 0.18;
      ctx.lineCap     = 'round';
      ctx.stroke();
      ctx.restore();

      // Eyebrow OE (right on screen)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rightEyeX - eyeSize * 0.9, eyeY - eyeSize * 1.18);
      ctx.quadraticCurveTo(rightEyeX, eyeY - eyeSize * 1.35, rightEyeX + eyeSize * 0.9, eyeY - eyeSize * 1.15);
      ctx.strokeStyle = '#4a3520';
      ctx.lineWidth   = eyeSize * 0.18;
      ctx.lineCap     = 'round';
      ctx.stroke();
      ctx.restore();

      // Compute mouse relative to canvas
      const faceRect      = canvas.getBoundingClientRect();
      const containerRect = containerRef.current ? containerRef.current.getBoundingClientRect() : null;
      const relX = containerRect ? mousePos.x - (faceRect.left - containerRect.left) : mousePos.x;
      const relY = containerRect ? mousePos.y - (faceRect.top  - containerRect.top)  : mousePos.y;

      // Smooth pupils
      ['left', 'right'].forEach(s => {
        const targetCX = s === 'left' ? leftEyeX : rightEyeX;
        const rawDx = relX - targetCX;
        const rawDy = relY - eyeY;
        pupilsRef.current[s].x += (rawDx - pupilsRef.current[s].x) * 0.12;
        pupilsRef.current[s].y += (rawDy - pupilsRef.current[s].y) * 0.12;
      });

      // Draw OD (left side of screen, eyeSide='right')
      drawEye3D(
        ctx, leftEyeX, eyeY, eyeSize,
        pupilsRef.current.left,
        !leftImpaired ? failedDir : null,
        'right',
        !leftImpaired ? showHint : false,
        !leftImpaired && showPtose,
      );

      // Draw OE (right side of screen, eyeSide='left')
      drawEye3D(
        ctx, rightEyeX, eyeY, eyeSize,
        pupilsRef.current.right,
        leftImpaired ? failedDir : null,
        'left',
        leftImpaired ? showHint : false,
        leftImpaired && showPtose,
      );

      // Nose
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(W / 2, eyeY + eyeSize * 0.4);
      ctx.lineTo(W / 2 - eyeSize * 0.35, eyeY + eyeSize * 1.5);
      ctx.lineTo(W / 2 - eyeSize * 0.5,  eyeY + eyeSize * 1.5);
      ctx.bezierCurveTo(
        W / 2 - eyeSize * 0.4, eyeY + eyeSize * 1.7,
        W / 2 + eyeSize * 0.4, eyeY + eyeSize * 1.7,
        W / 2 + eyeSize * 0.5, eyeY + eyeSize * 1.5,
      );
      ctx.lineTo(W / 2 + eyeSize * 0.35, eyeY + eyeSize * 1.5);
      ctx.strokeStyle = 'rgba(160,100,60,0.55)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.restore();

      // Impaired eye label
      if (gameState === 'playing') {
        const labelX = leftImpaired ? rightEyeX : leftEyeX;
        const label  = impairedEye === 'left' ? 'OE comprometido' : 'OD comprometido';
        ctx.save();
        ctx.font         = `bold ${eyeSize * 0.32}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.fillStyle    = 'rgba(252,165,165,0.95)';
        ctx.shadowColor  = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur   = 6;
        ctx.fillText(label, labelX, eyeY - eyeSize * 1.55);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [mousePos, impairedMuscle, impairedEye, gameState, containerRef]);

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-slate-400 mb-3 tracking-wide uppercase font-medium">
        Modo 3D — mova o mouse e observe o movimento ocular
      </p>
      <canvas
        ref={canvasRef}
        style={{ borderRadius: '12px', display: 'block', maxWidth: '100%' }}
      />
      <div className="flex justify-between w-full max-w-xs mt-2 px-2">
        <span className="text-[10px] text-slate-400">← Temporal (E)</span>
        <span className="text-[10px] text-slate-400">Temporal (D) →</span>
      </div>
      <div className="flex justify-between w-full max-w-xs px-2">
        <span className="text-[10px] text-slate-400 font-medium">OD</span>
        <span className="text-[10px] text-slate-400 font-medium">OE</span>
      </div>
    </div>
  );
}

export default EyeCanvas3DInner;