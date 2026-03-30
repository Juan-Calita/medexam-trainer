import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Circle, Scan, Crosshair } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── RGB → HSV ────────────────────────────────────────────────────────────────
function rgbToHsv(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function matchesPen(r, g, b, profile) {
  if (!profile) return false;
  const { h, s, v } = rgbToHsv(r, g, b);
  if (s < profile.sMin || v < profile.vMin) return false;
  const diff = Math.abs(h - profile.h);
  return Math.min(diff, 360 - diff) <= profile.hTol;
}

// ─── Connected-blob detector ──────────────────────────────────────────────────
// Instead of a global centroid (confused by clothes), we find ALL blobs via
// flood-fill on a downsampled grid and pick the SMALLEST qualifying blob.
// A pen tip is always a small, compact object. Clothes produce huge blobs.

function detectSmallestBlob(imageData, W, H, profile, maxBlobFraction = 0.12) {
  const data = imageData.data;
  const STRIDE = 2; // sample every 2px for speed
  const GW = Math.ceil(W / STRIDE);
  const GH = Math.ceil(H / STRIDE);

  // Build binary match grid
  const grid = new Uint8Array(GW * GH);
  for (let gy = 0; gy < GH; gy++) {
    for (let gx = 0; gx < GW; gx++) {
      const px = gx * STRIDE, py = gy * STRIDE;
      const i = (py * W + px) * 4;
      grid[gy * GW + gx] = matchesPen(data[i], data[i + 1], data[i + 2], profile) ? 1 : 0;
    }
  }

  const maxBlobSize = GW * GH * maxBlobFraction; // ignore blobs larger than X% of frame
  const visited = new Uint8Array(GW * GH);
  const blobs = [];

  // BFS flood fill
  for (let start = 0; start < GW * GH; start++) {
    if (!grid[start] || visited[start]) continue;
    const queue = [start];
    visited[start] = 1;
    let sumX = 0, sumY = 0, size = 0;
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const gx = idx % GW, gy = Math.floor(idx / GW);
      sumX += gx; sumY += gy; size++;
      if (size > maxBlobSize) break; // too large — skip rest
      // 4-connected neighbours
      const neighbours = [
        gy > 0      ? idx - GW : -1,
        gy < GH - 1 ? idx + GW : -1,
        gx > 0      ? idx - 1  : -1,
        gx < GW - 1 ? idx + 1  : -1,
      ];
      for (const n of neighbours) {
        if (n >= 0 && grid[n] && !visited[n]) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
    if (size >= 4 && size <= maxBlobSize) {
      blobs.push({ cx: sumX / size / GW, cy: sumY / size / GH, size });
    }
  }

  if (blobs.length === 0) return { found: false };

  // Pick the smallest blob — that's almost certainly the pen tip, not clothes
  blobs.sort((a, b) => a.size - b.size);
  const best = blobs[0];

  return { found: true, x: best.cx, y: best.cy, size: best.size };
}

// ─── Debug overlay ────────────────────────────────────────────────────────────
function drawDebug(debugCanvas, sourceCanvas, hit, profile) {
  const ctx = debugCanvas.getContext('2d');
  const W = sourceCanvas.width, H = sourceCanvas.height;
  debugCanvas.width = W;
  debugCanvas.height = H;

  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, W, H);

  if (hit && hit.found) {
    const px = hit.x * W, py = hit.y * H;
    ctx.strokeStyle = 'rgba(0,255,136,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, py); ctx.lineTo(W, py);
    ctx.moveTo(px, 0); ctx.lineTo(px, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();
  }

  if (profile) {
    ctx.fillStyle = `hsl(${profile.h}, 80%, 50%)`;
    ctx.fillRect(4, 4, 14, 14);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 14, 14);
  }
}

// ─── Default blue pen profile ─────────────────────────────────────────────────
const DEFAULT_BLUE_PROFILE = {
  h: 210,
  hTol: 35,
  sMin: 0.30,
  vMin: 0.25,
};

// ─── AI calibration ───────────────────────────────────────────────────────────
async function calibrateWithAI(canvas) {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  return base44.integrations.Core.InvokeLLM({
    prompt: `This is a webcam frame. The user is holding a pen or pointer in front of the camera.
Look at the pen tip and determine its dominant colour.
Return a JSON object describing the colour in HSV terms so we can track it:
{
  "found": true,
  "penDescription": "blue ballpoint pen",
  "h": 210,
  "hTol": 35,
  "sMin": 0.30,
  "vMin": 0.25
}
If no pen is visible return: { "found": false }`,
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: {
        found: { type: 'boolean' },
        penDescription: { type: 'string' },
        h: { type: 'number' },
        hTol: { type: 'number' },
        sMin: { type: 'number' },
        vMin: { type: 'number' },
      },
      required: ['found'],
    },
  });
}

// ─── Smoothing ────────────────────────────────────────────────────────────────
// Adaptive EMA: faster when pen moves a lot, slower when nearly still
function adaptiveEMA(current, target, baseAlpha = 0.22) {
  const dist = Math.sqrt((target.x - current.x) ** 2 + (target.y - current.y) ** 2);
  // Boost alpha for fast movements so we don't lag behind; slow down for stillness
  const alpha = Math.min(0.6, baseAlpha + dist * 2);
  return {
    x: current.x + alpha * (target.x - current.x),
    y: current.y + alpha * (target.y - current.y),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PenTracker({ onPositionChange, containerRef, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const debugCanvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const profileRef = useRef(null);
  const smoothRef = useRef({ x: 0.5, y: 0.5, active: false });

  // Max blob fraction — user can tighten this after calibration
  const maxBlobFractionRef = useRef(0.10);

  const [cameraState, setCameraState] = useState('idle');
  const [calibState, setCalibState] = useState('none');
  const [penFound, setPenFound] = useState(false);
  const [penDesc, setPenDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showCalibHint, setShowCalibHint] = useState(false);

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
    setCalibState('none');
    setPenFound(false);
    profileRef.current = null;
    smoothRef.current = { x: 0.5, y: 0.5, active: false };
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('loading');
    setErrorMsg('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
      });
    } catch {
      setCameraState('error');
      setErrorMsg('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      return;
    }
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) { stopCamera(); return; }
    video.srcObject = stream;
    await new Promise(resolve => { video.onloadedmetadata = resolve; });
    try { await video.play(); } catch (err) {
      setCameraState('error'); setErrorMsg('Erro ao iniciar o vídeo: ' + err.message); stopCamera(); return;
    }
    setCameraState('active');
    profileRef.current = DEFAULT_BLUE_PROFILE;
    setPenDesc('azul (padrão)');
    setCalibState('done');
    setShowCalibHint(true);
    setTimeout(() => setShowCalibHint(false), 5000);
  }, [stopCamera]);

  // Capture current blob size as the reference max — eliminates clothing confusion
  const calibrateBlobSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profileRef.current) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hit = detectSmallestBlob(imageData, canvas.width, canvas.height, profileRef.current, 0.5);
    if (hit.found) {
      // Set max to 3× current pen blob size — roupa será muito maior
      const STRIDE = 2;
      const GW = Math.ceil(canvas.width / STRIDE);
      const GH = Math.ceil(canvas.height / STRIDE);
      const fraction = hit.size / (GW * GH);
      maxBlobFractionRef.current = Math.min(0.25, fraction * 4);
    }
  }, []);

  const runCalibration = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;
    setCalibState('calibrating');
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const result = await calibrateWithAI(canvas);
      if (result.found && result.h != null) {
        profileRef.current = {
          h: result.h,
          hTol: result.hTol ?? 35,
          sMin: result.sMin ?? 0.30,
          vMin: result.vMin ?? 0.25,
        };
        setPenDesc(result.penDescription ?? 'caneta detectada');
        setCalibState('done');
        // Also capture blob size right after AI calibration
        setTimeout(calibrateBlobSize, 200);
      } else {
        setCalibState('failed');
      }
    } catch {
      setCalibState('failed');
    }
  }, [calibrateBlobSize]);

  // ─── Frame loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (cameraState !== 'active') return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 160;
    canvas.height = 120;

    let frameN = 0;
    let penFoundLocal = false;

    const loop = () => {
      if (video.readyState >= 2 && profileRef.current) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hit = detectSmallestBlob(imageData, canvas.width, canvas.height, profileRef.current, maxBlobFractionRef.current);

        if (hit.found) {
          const s = smoothRef.current;
          if (!s.active) {
            s.x = hit.x; s.y = hit.y; s.active = true;
          } else {
            const smoothed = adaptiveEMA({ x: s.x, y: s.y }, { x: hit.x, y: hit.y });
            s.x = smoothed.x; s.y = smoothed.y;
          }

          if (!penFoundLocal) { setPenFound(true); penFoundLocal = true; }

          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            onPositionChange({
              x: (1 - s.x) * rect.width,
              y: s.y * rect.height,
            });
          }
        } else {
          smoothRef.current.active = false;
          if (penFoundLocal) { setPenFound(false); penFoundLocal = false; }
        }

        if (frameN % 3 === 0 && debugCanvasRef.current) {
          drawDebug(debugCanvasRef.current, canvas, hit, profileRef.current);
        }
      } else if (video.readyState >= 2 && frameN % 3 === 0 && debugCanvasRef.current) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dctx = debugCanvasRef.current.getContext('2d');
        debugCanvasRef.current.width = canvas.width;
        debugCanvasRef.current.height = canvas.height;
        dctx.drawImage(canvas, 0, 0);
      }

      frameN++;
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [cameraState, onPositionChange, containerRef]);

  useEffect(() => { if (!isActive) stopCamera(); }, [isActive, stopCamera]);
  useEffect(() => () => stopCamera(), [stopCamera]);

  const calibBadge = {
    none: null,
    calibrating: { color: 'text-amber-500', label: 'IA analisando caneta...' },
    done: { color: 'text-emerald-500', label: penDesc || 'Calibrado!' },
    failed: { color: 'text-rose-500', label: 'IA não encontrou caneta — tente novamente' },
  }[calibState];

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="hidden" />

      <div className={cameraState === 'active' ? 'flex gap-2 items-start' : 'hidden'}>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Câmera</span>
          <video
            ref={videoRef}
            className="rounded-lg border-2 border-slate-200 shadow-sm"
            style={{ width: 160, height: 120, objectFit: 'cover', transform: 'scaleX(-1)' }}
            playsInline muted
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Detecção</span>
          <canvas
            ref={debugCanvasRef}
            className="rounded-lg border-2 border-cyan-300 shadow-sm"
            style={{ width: 160, height: 120, transform: 'scaleX(-1)' }}
          />
        </div>
      </div>

      {cameraState === 'active' && calibBadge && (
        <div className="flex items-center gap-1.5 -mt-1">
          <Circle className={`w-2.5 h-2.5 fill-current ${calibBadge.color}`} />
          <span className="text-xs text-slate-500">{calibBadge.label}</span>
        </div>
      )}
      {cameraState === 'active' && calibState === 'done' && (
        <div className="flex items-center gap-1.5 -mt-1">
          <Circle className={`w-2.5 h-2.5 fill-current ${penFound ? 'text-emerald-500' : 'text-slate-300'}`} />
          <span className="text-xs text-slate-500">{penFound ? 'Caneta detectada' : 'Rastreando...'}</span>
        </div>
      )}

      {/* Calibrate blob size hint */}
      {cameraState === 'active' && calibState === 'done' && showCalibHint && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 text-center max-w-xs">
          Aponte a caneta para a câmera e clique em <strong>Calibrar Tamanho</strong> para evitar confusão com roupas.
        </div>
      )}

      <div className="flex gap-2 flex-wrap justify-center">
        {(cameraState === 'idle' || cameraState === 'error') && (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Ativar Câmera
          </button>
        )}
        {cameraState === 'loading' && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            Conectando...
          </div>
        )}
        {cameraState === 'active' && (
          <>
            {/* Calibrate blob size — key button to avoid clothes confusion */}
            <button
              onClick={calibrateBlobSize}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Calibrar Tamanho
            </button>

            {calibState === 'failed' ? (
              <button
                onClick={runCalibration}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm"
              >
                <Scan className="w-4 h-4" />
                Calibrar com IA
              </button>
            ) : (
              <button
                onClick={runCalibration}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
              >
                <Scan className="w-3.5 h-3.5" />
                Recalibrar cor (IA)
              </button>
            )}

            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
            >
              <CameraOff className="w-4 h-4" />
              Desativar
            </button>
          </>
        )}
      </div>

      {errorMsg && <p className="text-xs text-rose-600 text-center max-w-xs">{errorMsg}</p>}

      {cameraState === 'active' && calibState === 'done' && !showCalibHint && (
        <p className="text-xs text-slate-400 text-center max-w-xs">
          Aponte a caneta → <span className="font-semibold text-blue-600">Calibrar Tamanho</span> para ignorar roupas da mesma cor.
        </p>
      )}
    </div>
  );
}