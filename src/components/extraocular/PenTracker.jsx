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

// ─── 5-scanline H detector ─────────────────────────────────────────────────────
// Scans 5 horizontal lines evenly distributed across the frame height.
// For each scanline, finds the run of matching pixels and takes its centre.
// Returns the scanline hit with the most matching pixels (densest cluster).
function detectByScanlines(imageData, W, H, profile) {
  const data = imageData.data;
  const scanYs = [0.15, 0.30, 0.50, 0.70, 0.85].map(f => Math.floor(f * H));

  let bestHit = null;

  for (const sy of scanYs) {
    let runStart = -1, bestRun = null;
    for (let x = 0; x < W; x++) {
      const i = (sy * W + x) * 4;
      const matches = matchesPen(data[i], data[i + 1], data[i + 2], profile);
      if (matches) {
        if (runStart === -1) runStart = x;
      } else {
        if (runStart !== -1) {
          const len = x - runStart;
          if (!bestRun || len > bestRun.len) bestRun = { start: runStart, len };
          runStart = -1;
        }
      }
    }
    // Close any open run at line end
    if (runStart !== -1) {
      const len = W - runStart;
      if (!bestRun || len > bestRun.len) bestRun = { start: runStart, len };
    }

    if (bestRun && bestRun.len >= 4) {
      const cx = bestRun.start + bestRun.len / 2;
      if (!bestHit || bestRun.len > bestHit.len) {
        bestHit = { x: cx / W, y: sy / H, len: bestRun.len };
      }
    }
  }

  return bestHit ? { x: bestHit.x, y: bestHit.y, found: true } : { found: false };
}

// ─── Debug overlay ─────────────────────────────────────────────────────────────
function drawDebug(debugCanvas, sourceCanvas, scanYs, hit, profile) {
  const ctx = debugCanvas.getContext('2d');
  const W = sourceCanvas.width, H = sourceCanvas.height;
  debugCanvas.width = W;
  debugCanvas.height = H;
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, W, H);

  // Draw 5 scanlines
  const ys = [0.15, 0.30, 0.50, 0.70, 0.85].map(f => Math.floor(f * H));
  for (const sy of ys) {
    ctx.strokeStyle = 'rgba(255,220,0,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, sy); ctx.lineTo(W, sy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw detected point
  if (hit) {
    const px = hit.x * W, py = hit.y * H;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 12, py); ctx.lineTo(px + 12, py);
    ctx.moveTo(px, py - 12); ctx.lineTo(px, py + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ff88';
    ctx.stroke();
  }

  // Show profile colour swatch
  if (profile) {
    ctx.fillStyle = `hsl(${profile.h}, 80%, 50%)`;
    ctx.fillRect(4, 4, 18, 18);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 18, 18);
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
  const profileRef = useRef(null);        // calibrated colour profile
  const lastHitRef = useRef(null);        // last detected position

  const [cameraState, setCameraState] = useState('idle'); // idle|loading|active|error
  const [calibState, setCalibState] = useState('none');   // none|calibrating|done|failed
  const [penFound, setPenFound] = useState(false);
  const [penDesc, setPenDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
    setCalibState('none');
    setPenFound(false);
    profileRef.current = null;
    lastHitRef.current = null;
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
    // Draw current frame into canvas
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
        setCalibState('done');
      } else {
        setCalibState('failed');
      }
    } catch {
      setCalibState('failed');
    }
  }, []);

  // Frame loop: 5-scanline detection using calibrated profile
  useEffect(() => {
    if (cameraState !== 'active') return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 320;
    canvas.height = 240;
    let frameN = 0;

    const scanYs = [0.15, 0.30, 0.50, 0.70, 0.85];

    const loop = () => {
      if (video.readyState >= 2 && profileRef.current) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hit = detectByScanlines(imageData, canvas.width, canvas.height, profileRef.current);

        if (hit.found) {
          lastHitRef.current = hit;
          setPenFound(true);
        } else {
          setPenFound(false);
        }

        // Debug overlay every 3 frames
        if (frameN % 3 === 0 && debugCanvasRef.current) {
          drawDebug(debugCanvasRef.current, canvas, scanYs, hit.found ? hit : null, profileRef.current);
        }

        // Send to parent (mirror X for selfie view)
        if (lastHitRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          onPositionChange({
            x: (1 - lastHitRef.current.x) * rect.width,
            y: lastHitRef.current.y * rect.height,
          });
        }
      } else if (video.readyState >= 2 && frameN % 3 === 0 && debugCanvasRef.current) {
        // No profile yet — just mirror video into debug canvas
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
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera + debug view */}
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
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Scan H</span>
          <canvas
            ref={debugCanvasRef}
            className="rounded-lg border-2 border-yellow-300 shadow-sm"
            style={{ width: 160, height: 120, transform: 'scaleX(-1)' }}
          />
        </div>
      </div>

      {/* Status */}
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
            onClick={() => { profileRef.current = null; setCalibState('none'); setPenFound(false); }}
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
      {cameraState === 'active' && calibState === 'done' && (
        <p className="text-xs text-slate-500 text-center max-w-xs">
          5 linhas de varredura horizontal rastreiam a caneta em tempo real.
        </p>
      )}
    </div>
  );
}