import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Circle, Scan } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── Colour matching ───────────────────────────────────────────────────────────
// Convert RGB → HSV (h:0-360, s:0-1, v:0-1)
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

// Check if a pixel matches the calibrated pen colour profile
function matchesPen(r, g, b, profile) {
  if (!profile) return false;
  const { h, s, v } = rgbToHsv(r, g, b);
  if (s < 0.25 || v < 0.15) return false;
  // Hue tolerance (wraps around 0/360)
  const diff = Math.abs(h - profile.h);
  const hueDiff = Math.min(diff, 360 - diff);
  return hueDiff <= profile.hTol && s >= profile.sMin && v >= profile.vMin;
}

// ─── 1000×1000 grid detector ──────────────────────────────────────────────────
// Scans 1000 horizontal lines + 1000 vertical lines across the full frame.
// For each line, finds the longest run of matching pixels.
// The winning intersection (H-line row + V-line col with most hits) gives position.
function detectByGrid(imageData, W, H, profile) {
  const data = imageData.data;

  // Sample 1000 evenly-spaced rows
  const LINES = 1000;
  const hBest = new Float32Array(LINES); // best run length per H-line (normalised 0-1 x centre)
  const hCx   = new Float32Array(LINES); // centre x of best run per H-line

  for (let li = 0; li < LINES; li++) {
    const sy = Math.floor((li / (LINES - 1)) * (H - 1));
    let runStart = -1, bestLen = 0, bestCx = 0;
    for (let x = 0; x < W; x++) {
      const i = (sy * W + x) * 4;
      if (matchesPen(data[i], data[i + 1], data[i + 2], profile)) {
        if (runStart === -1) runStart = x;
      } else {
        if (runStart !== -1) {
          const len = x - runStart;
          if (len > bestLen) { bestLen = len; bestCx = (runStart + x) / 2; }
          runStart = -1;
        }
      }
    }
    if (runStart !== -1) {
      const len = W - runStart;
      if (len > bestLen) { bestLen = len; bestCx = (runStart + W) / 2; }
    }
    hBest[li] = bestLen;
    hCx[li]   = bestCx / W;
  }

  // Sample 1000 evenly-spaced columns
  const vBest = new Float32Array(LINES);
  const vCy   = new Float32Array(LINES);

  for (let li = 0; li < LINES; li++) {
    const sx = Math.floor((li / (LINES - 1)) * (W - 1));
    let runStart = -1, bestLen = 0, bestCy = 0;
    for (let y = 0; y < H; y++) {
      const i = (y * W + sx) * 4;
      if (matchesPen(data[i], data[i + 1], data[i + 2], profile)) {
        if (runStart === -1) runStart = y;
      } else {
        if (runStart !== -1) {
          const len = y - runStart;
          if (len > bestLen) { bestLen = len; bestCy = (runStart + y) / 2; }
          runStart = -1;
        }
      }
    }
    if (runStart !== -1) {
      const len = H - runStart;
      if (len > bestLen) { bestLen = len; bestCy = (runStart + H) / 2; }
    }
    vBest[li] = bestLen;
    vCy[li]   = bestCy / H;
  }

  // Find best H-line and best V-line
  let bestHIdx = 0, bestVIdx = 0;
  for (let i = 1; i < LINES; i++) {
    if (hBest[i] > hBest[bestHIdx]) bestHIdx = i;
    if (vBest[i] > vBest[bestVIdx]) bestVIdx = i;
  }

  if (hBest[bestHIdx] < 3 && vBest[bestVIdx] < 3) return { found: false };

  // Intersection point: x from H-line centroid, y from V-line centroid
  const x = hBest[bestHIdx] >= 3 ? hCx[bestHIdx] : bestVIdx / (LINES - 1);
  const y = vBest[bestVIdx] >= 3 ? vCy[bestVIdx] : bestHIdx / (LINES - 1);

  return { x, y, found: true, bestHIdx, bestVIdx, hBest, vBest };
}

// ─── Debug overlay ─────────────────────────────────────────────────────────────
// Renders the 1000×1000 heatmap (H lines as horizontal bars, V lines as vertical bars)
// The intensity of each bar encodes the run-length found on that line.
// The detected point crosshair is drawn in screen space, directly mapping:
//   x=0 → left edge, x=1 → right edge (mirrored for selfie view externally)
//   y=0 → top edge,  y=1 → bottom edge
function drawDebug(debugCanvas, sourceCanvas, hit, profile) {
  const ctx = debugCanvas.getContext('2d');
  const W = sourceCanvas.width, H = sourceCanvas.height;
  debugCanvas.width = W;
  debugCanvas.height = H;

  // Base frame (dimmed)
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);

  if (hit && hit.hBest && hit.vBest) {
    const LINES = hit.hBest.length;

    // Find max run for normalisation
    let maxH = 1, maxV = 1;
    for (let i = 0; i < LINES; i++) {
      if (hit.hBest[i] > maxH) maxH = hit.hBest[i];
      if (hit.vBest[i] > maxV) maxV = hit.vBest[i];
    }

    // Draw H-line heatmap: each of the 1000 rows gets a 1px horizontal bar
    // colour intensity proportional to the run length found
    for (let li = 0; li < LINES; li++) {
      if (hit.hBest[li] < 1) continue;
      const py = Math.floor((li / (LINES - 1)) * (H - 1));
      const alpha = (hit.hBest[li] / maxH) * 0.8;
      ctx.fillStyle = `rgba(255,200,0,${alpha})`;
      ctx.fillRect(0, py, W, 1);
    }

    // Draw V-line heatmap: each of the 1000 columns gets a 1px vertical bar
    for (let li = 0; li < LINES; li++) {
      if (hit.vBest[li] < 1) continue;
      const px = Math.floor((li / (LINES - 1)) * (W - 1));
      const alpha = (hit.vBest[li] / maxV) * 0.8;
      ctx.fillStyle = `rgba(0,180,255,${alpha})`;
      ctx.fillRect(px, 0, 1, H);
    }
  }

  // Crosshair at detected point
  if (hit && hit.found) {
    const px = hit.x * W, py = hit.y * H;

    // Full-width/height crosshair lines
    ctx.strokeStyle = 'rgba(0,255,136,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, py); ctx.lineTo(W, py);
    ctx.moveTo(px, 0); ctx.lineTo(px, H);
    ctx.stroke();

    // Circle at intersection
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Small filled dot
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();
  }

  // Profile colour swatch
  if (profile) {
    ctx.fillStyle = `hsl(${profile.h}, 80%, 50%)`;
    ctx.fillRect(4, 4, 16, 16);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 16, 16);
  }
}

// ─── AI calibration call ───────────────────────────────────────────────────────
async function calibrateWithAI(canvas) {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  return base44.integrations.Core.InvokeLLM({
    prompt: `This is a webcam frame. The user is holding a pen or pointer in front of the camera.
Look at the pen and determine its dominant colour.
Return a JSON object describing the colour in HSV terms so we can track it:
{
  "found": true,
  "penDescription": "blue ballpoint pen",
  "h": 220,       // hue 0-360 (red=0, yellow=60, green=120, cyan=180, blue=240, magenta=300)
  "hTol": 30,     // acceptable hue tolerance (degrees)
  "sMin": 0.35,   // minimum saturation (0-1)
  "vMin": 0.2     // minimum value/brightness (0-1)
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

// ─── Component ─────────────────────────────────────────────────────────────────
export default function PenTracker({ onPositionChange, containerRef, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const debugCanvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const profileRef = useRef(null);
  // Smoothed position (EMA) — avoids jitter
  const smoothRef = useRef({ x: 0.5, y: 0.5 });
  // Frames since last detection — for "not found" warning
  const missFramesRef = useRef(0);

  const [cameraState, setCameraState] = useState('idle'); // idle|loading|active|error
  const [calibState, setCalibState] = useState('none');   // none|calibrating|done|failed
  const [penFound, setPenFound] = useState(false);
  const [penDesc, setPenDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Show camera only during calibration phases
  const showCamera = cameraState === 'active' && (calibState === 'none' || calibState === 'calibrating' || calibState === 'failed');

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
    setCalibState('none');
    setPenFound(false);
    profileRef.current = null;
    smoothRef.current = { x: 0.5, y: 0.5 };
    missFramesRef.current = 0;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('loading');
    setErrorMsg('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
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
  }, [stopCamera]);

  // One-shot AI calibration
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
          hTol: result.hTol ?? 30,
          sMin: result.sMin ?? 0.3,
          vMin: result.vMin ?? 0.2,
        };
        setPenDesc(result.penDescription ?? 'caneta detectada');
        smoothRef.current = { x: 0.5, y: 0.5 };
        missFramesRef.current = 0;
        setCalibState('done');
      } else {
        setCalibState('failed');
      }
    } catch {
      setCalibState('failed');
    }
  }, []);

  // Frame loop with EMA smoothing
  useEffect(() => {
    if (cameraState !== 'active') return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 320;
    canvas.height = 240;
    // EMA alpha: lower = smoother but more lag; 0.08 is fluid yet responsive
    const ALPHA = 0.08;
    // Frames without detection before showing warning
    const MISS_THRESHOLD = 20;
    let frameN = 0;

    const loop = () => {
      if (video.readyState >= 2 && profileRef.current) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hit = detectByGrid(imageData, canvas.width, canvas.height, profileRef.current);

        if (hit.found) {
          missFramesRef.current = 0;
          setPenFound(true);
          // EMA smoothing — only update smooth position when pen is detected
          smoothRef.current.x += ALPHA * (hit.x - smoothRef.current.x);
          smoothRef.current.y += ALPHA * (hit.y - smoothRef.current.y);
        } else {
          missFramesRef.current++;
          if (missFramesRef.current >= MISS_THRESHOLD) {
            setPenFound(false);
          }
          // Do NOT update smoothRef when pen is lost — hold last position
        }

        // Debug overlay every 2 frames (only visible during recalibration)
        if (frameN % 2 === 0 && debugCanvasRef.current) {
          drawDebug(debugCanvasRef.current, canvas, hit.found ? hit : null, profileRef.current);
        }

        // Always send the smoothed position to parent
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          onPositionChange({
            x: (1 - smoothRef.current.x) * rect.width,
            y: smoothRef.current.y * rect.height,
          });
        }
      } else if (video.readyState >= 2 && frameN % 2 === 0 && debugCanvasRef.current) {
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

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera + debug — only visible during calibration */}
      <div style={{ display: showCamera ? 'flex' : 'none' }} className="gap-2 items-start">
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
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Debug</span>
          <canvas
            ref={debugCanvasRef}
            className="rounded-lg border-2 border-yellow-300 shadow-sm"
            style={{ width: 160, height: 120, transform: 'scaleX(-1)' }}
          />
        </div>
      </div>

      {/* Pen not detected warning — shown when calibrated but pen lost */}
      {cameraState === 'active' && calibState === 'done' && !penFound && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Circle className="w-2.5 h-2.5 fill-current text-amber-500" />
          <span className="text-xs text-amber-700 font-medium">Caneta não detectada — aponte para a câmera</span>
        </div>
      )}
      {cameraState === 'active' && calibState === 'done' && penFound && (
        <div className="flex items-center gap-1.5">
          <Circle className="w-2.5 h-2.5 fill-current text-emerald-500" />
          <span className="text-xs text-slate-500">Rastreando: {penDesc}</span>
        </div>
      )}
      {cameraState === 'active' && calibState === 'calibrating' && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <div className="w-3 h-3 border-2 border-amber-400 border-t-amber-600 rounded-full animate-spin" />
          IA analisando caneta...
        </div>
      )}
      {cameraState === 'active' && calibState === 'failed' && (
        <p className="text-xs text-rose-500">IA não encontrou caneta — tente novamente</p>
      )}

      {/* Buttons */}
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
        {cameraState === 'active' && (calibState === 'none' || calibState === 'failed') && (
          <button
            onClick={runCalibration}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm"
          >
            <Scan className="w-4 h-4" />
            Calibrar com IA
          </button>
        )}
        {cameraState === 'active' && calibState === 'done' && (
          <button
            onClick={() => { profileRef.current = null; setCalibState('none'); setPenFound(false); missFramesRef.current = 0; }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
          >
            <Scan className="w-3.5 h-3.5" />
            Recalibrar
          </button>
        )}
        {cameraState === 'active' && (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
          >
            <CameraOff className="w-4 h-4" />
            Desativar
          </button>
        )}
      </div>

      {errorMsg && <p className="text-xs text-rose-600 text-center max-w-xs">{errorMsg}</p>}

      {cameraState === 'active' && calibState === 'none' && (
        <p className="text-xs text-slate-500 text-center max-w-xs">
          Segure a caneta na frente da câmera e clique em <span className="font-semibold text-amber-600">Calibrar com IA</span>.
        </p>
      )}
    </div>
  );
}