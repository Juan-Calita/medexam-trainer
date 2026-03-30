import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Circle, Scan, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── Colour matching ───────────────────────────────────────────────────────────
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
  if (s < 0.25 || v < 0.15) return false;
  const diff = Math.abs(h - profile.h);
  const hueDiff = Math.min(diff, 360 - diff);
  return hueDiff <= profile.hTol && s >= profile.sMin && v >= profile.vMin;
}

// ─── Grid detector ─────────────────────────────────────────────────────────────
function detectByGrid(imageData, W, H, profile) {
  const data = imageData.data;
  const LINES = 100000;
  const hBest = new Float32Array(LINES);
  const hCx = new Float32Array(LINES);

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
    hCx[li] = bestCx / W;
  }

  const vBest = new Float32Array(LINES);
  const vCy = new Float32Array(LINES);
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
    vCy[li] = bestCy / H;
  }

  let bestHIdx = 0, bestVIdx = 0;
  for (let i = 1; i < LINES; i++) {
    if (hBest[i] > hBest[bestHIdx]) bestHIdx = i;
    if (vBest[i] > vBest[bestVIdx]) bestVIdx = i;
  }

  if (hBest[bestHIdx] < 3 && vBest[bestVIdx] < 3) return { found: false };

  const x = hBest[bestHIdx] >= 3 ? hCx[bestHIdx] : bestVIdx / (LINES - 1);
  const y = vBest[bestVIdx] >= 3 ? vCy[bestVIdx] : bestHIdx / (LINES - 1);
  return { x, y, found: true };
}

// ─── Coordinate mapping using calibration bounds ───────────────────────────────
// Maps raw camera [0,1] coords to normalized [0,1] using recorded min/max bounds
function mapWithBounds(rawX, rawY, bounds) {
  const { xMin, xMax, yMin, yMax } = bounds;
  const rangeX = xMax - xMin || 0.01;
  const rangeY = yMax - yMin || 0.01;
  return {
    x: Math.max(0, Math.min(1, (rawX - xMin) / rangeX)),
    y: Math.max(0, Math.min(1, (rawY - yMin) / rangeY)),
  };
}

// ─── AI colour detection ───────────────────────────────────────────────────────
async function detectColourWithAI(canvas) {
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
  "h": 220,
  "hTol": 30,
  "sMin": 0.35,
  "vMin": 0.2
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

// ─── H-pattern calibration points (9 positions) ────────────────────────────────
// The user traces an "H": top-left → bottom-left → middle-left →
// middle-right → top-right → bottom-right
// We record raw camera coords at each extreme to build a bounding box.
const H_STEPS = [
  { label: 'Canto superior esquerdo', hint: '↖', targetX: 0, targetY: 0 },
  { label: 'Canto inferior esquerdo', hint: '↙', targetX: 0, targetY: 1 },
  { label: 'Centro esquerdo',         hint: '←', targetX: 0, targetY: 0.5 },
  { label: 'Centro',                  hint: '·', targetX: 0.5, targetY: 0.5 },
  { label: 'Centro direito',          hint: '→', targetX: 1, targetY: 0.5 },
  { label: 'Canto superior direito',  hint: '↗', targetX: 1, targetY: 0 },
  { label: 'Canto inferior direito',  hint: '↘', targetX: 1, targetY: 1 },
];

// ─── H-pattern overlay on mini camera view ─────────────────────────────────────
function HPatternOverlay({ step, total, collected }) {
  // Show the target dot position for current step
  const cur = H_STEPS[step];
  if (!cur) return null;

  // mirror x for selfie view (camera is flipped)
  const dotX = (1 - cur.targetX) * 100;
  const dotY = cur.targetY * 100;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Lines of the H pattern (faint) */}
      {collected.map((pt, i) => {
        const next = collected[i + 1];
        if (!next) return null;
        // Draw in % space (mirrored x)
        const x1 = (1 - pt.rawX) * 100;
        const y1 = pt.rawY * 100;
        const x2 = (1 - next.rawX) * 100;
        const y2 = next.rawY * 100;
        return (
          <svg key={i} className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            <line
              x1={`${x1}%`} y1={`${y1}%`}
              x2={`${x2}%`} y2={`${y2}%`}
              stroke="rgba(99,255,150,0.5)" strokeWidth="1.5"
            />
          </svg>
        );
      })}
      {/* Collected dots */}
      {collected.map((pt, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-emerald-400 border border-white"
          style={{ left: `${(1 - pt.rawX) * 100}%`, top: `${pt.rawY * 100}%`, transform: 'translate(-50%,-50%)' }}
        />
      ))}
      {/* Target dot (pulsing) */}
      <div
        className="absolute w-4 h-4 rounded-full bg-amber-400 border-2 border-white animate-pulse shadow-lg"
        style={{ left: `${dotX}%`, top: `${dotY}%`, transform: 'translate(-50%,-50%)' }}
      />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function PenTracker({ onPositionChange, containerRef, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const profileRef = useRef(null);
  const boundsRef = useRef(null);       // { xMin, xMax, yMin, yMax }
  const smoothRef = useRef({ x: 0.5, y: 0.5 });
  const missFramesRef = useRef(0);
  const latestHitRef = useRef(null);    // latest raw hit for H-calib capture

  const [cameraState, setCameraState] = useState('idle');
  // calibState: none | ai_detecting | ai_failed | h_calib | done
  const [calibState, setCalibState] = useState('none');
  const [penFound, setPenFound] = useState(false);
  const [penDesc, setPenDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // H-calibration state
  const [hStep, setHStep] = useState(0);
  const [hCollected, setHCollected] = useState([]);
  const [hCapturing, setHCapturing] = useState(false); // brief flash on capture

  const showCamera = cameraState === 'active' &&
    (calibState === 'none' || calibState === 'ai_detecting' || calibState === 'ai_failed' || calibState === 'h_calib');

  // ── Stop ──────────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
    setCalibState('none');
    setPenFound(false);
    profileRef.current = null;
    boundsRef.current = null;
    smoothRef.current = { x: 0.5, y: 0.5 };
    missFramesRef.current = 0;
    setHStep(0);
    setHCollected([]);
  }, []);

  // ── Start camera ──────────────────────────────────────────────────────────────
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
      setCameraState('error'); setErrorMsg('Erro: ' + err.message); stopCamera(); return;
    }
    setCameraState('active');
  }, [stopCamera]);

  // ── Step 1: AI detects pen colour ─────────────────────────────────────────────
  const runAIDetect = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;
    setCalibState('ai_detecting');
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const result = await detectColourWithAI(canvas);
      if (result.found && result.h != null) {
        profileRef.current = {
          h: result.h,
          hTol: result.hTol ?? 30,
          sMin: result.sMin ?? 0.3,
          vMin: result.vMin ?? 0.2,
        };
        setPenDesc(result.penDescription ?? 'caneta');
        // Move to H-calibration phase
        setHStep(0);
        setHCollected([]);
        boundsRef.current = null;
        setCalibState('h_calib');
      } else {
        setCalibState('ai_failed');
      }
    } catch {
      setCalibState('ai_failed');
    }
  }, []);

  // ── Step 2: capture current pen position for H-calib ─────────────────────────
  const captureHPoint = useCallback(() => {
    const hit = latestHitRef.current;
    if (!hit) return;
    setHCapturing(true);
    setTimeout(() => setHCapturing(false), 300);

    const newPoint = { rawX: hit.x, rawY: hit.y, step: hStep };
    const newCollected = [...hCollected, newPoint];
    setHCollected(newCollected);

    const nextStep = hStep + 1;
    if (nextStep >= H_STEPS.length) {
      // Build bounding box from all collected raw points
      const xs = newCollected.map(p => p.rawX);
      const ys = newCollected.map(p => p.rawY);
      boundsRef.current = {
        xMin: Math.min(...xs),
        xMax: Math.max(...xs),
        yMin: Math.min(...ys),
        yMax: Math.max(...ys),
      };
      smoothRef.current = { x: 0.5, y: 0.5 };
      missFramesRef.current = 0;
      setCalibState('done');
    } else {
      setHStep(nextStep);
    }
  }, [hStep, hCollected]);

  // ── Frame loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (cameraState !== 'active') return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 320;
    canvas.height = 240;
    const ALPHA = 0.08;
    const MISS_THRESHOLD = 20;

    const loop = () => {
      if (video.readyState >= 2 && profileRef.current) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hit = detectByGrid(imageData, canvas.width, canvas.height, profileRef.current);

        if (hit.found) {
          latestHitRef.current = hit;
          missFramesRef.current = 0;
          setPenFound(true);

          // Only update smooth position after H-calib is done
          if (boundsRef.current) {
            const mapped = mapWithBounds(hit.x, hit.y, boundsRef.current);
            smoothRef.current.x += ALPHA * (mapped.x - smoothRef.current.x);
            smoothRef.current.y += ALPHA * (mapped.y - smoothRef.current.y);
          }
        } else {
          latestHitRef.current = null;
          missFramesRef.current++;
          if (missFramesRef.current >= MISS_THRESHOLD) setPenFound(false);
        }

        // Send smoothed mapped position to parent
        if (boundsRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          onPositionChange({
            x: (1 - smoothRef.current.x) * rect.width,
            y: smoothRef.current.y * rect.height,
          });
        }
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [cameraState, onPositionChange, containerRef]);

  useEffect(() => { if (!isActive) stopCamera(); }, [isActive, stopCamera]);
  useEffect(() => () => stopCamera(), [stopCamera]);

  const resetCalib = () => {
    profileRef.current = null;
    boundsRef.current = null;
    setCalibState('none');
    setPenFound(false);
    setHStep(0);
    setHCollected([]);
    missFramesRef.current = 0;
  };

  const currentHStep = H_STEPS[hStep];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video always in DOM so ref is always valid; visibility via display */}
      <div style={{ display: showCamera ? 'flex' : 'none' }} className="flex-col items-center gap-1">
        <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm"
          style={{ width: 240, height: 180 }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            playsInline muted
          />
          {calibState === 'h_calib' && (
            <HPatternOverlay step={hStep} total={H_STEPS.length} collected={hCollected} />
          )}
          {hCapturing && (
            <div className="absolute inset-0 bg-white/50 rounded-lg" />
          )}
        </div>
      </div>

      {/* ── H-Calibration UI ── */}
      {cameraState === 'active' && calibState === 'h_calib' && currentHStep && (
        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <div className="text-center">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              Passo {hStep + 1} de {H_STEPS.length}
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">
              Aponte a caneta para: <span className="text-amber-600">{currentHStep.label}</span>
            </p>
            <p className="text-2xl mt-1">{currentHStep.hint}</p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {H_STEPS.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < hCollected.length ? 'bg-emerald-500' :
                i === hStep ? 'bg-amber-400 scale-125' : 'bg-slate-200'
              }`} />
            ))}
          </div>
          <button
            onClick={captureHPoint}
            disabled={!penFound}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
              penFound
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Capturar ponto
          </button>
          {!penFound && (
            <p className="text-xs text-amber-600 text-center">
              Caneta não detectada — aponte para a câmera
            </p>
          )}
        </div>
      )}

      {/* ── Status when tracking ── */}
      {cameraState === 'active' && calibState === 'done' && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
          penFound
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <Circle className={`w-2.5 h-2.5 fill-current ${penFound ? 'text-emerald-500' : 'text-amber-500'}`} />
          {penFound ? `Rastreando: ${penDesc}` : 'Caneta não detectada — aponte para a câmera'}
        </div>
      )}

      {cameraState === 'active' && calibState === 'ai_detecting' && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <div className="w-3 h-3 border-2 border-amber-400 border-t-amber-600 rounded-full animate-spin" />
          IA identificando cor da caneta...
        </div>
      )}
      {cameraState === 'active' && calibState === 'ai_failed' && (
        <p className="text-xs text-rose-500 text-center">IA não encontrou caneta — tente novamente</p>
      )}

      {/* ── Buttons ── */}
      <div className="flex gap-2 flex-wrap justify-center">
        {(cameraState === 'idle' || cameraState === 'error') && (
          <button onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
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
        {cameraState === 'active' && (calibState === 'none' || calibState === 'ai_failed') && (
          <button onClick={runAIDetect}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm">
            <Scan className="w-4 h-4" />
            {calibState === 'ai_failed' ? 'Tentar novamente' : 'Iniciar calibração'}
          </button>
        )}
        {cameraState === 'active' && calibState === 'done' && (
          <button onClick={resetCalib}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">
            <Scan className="w-3.5 h-3.5" />
            Recalibrar
          </button>
        )}
        {cameraState === 'active' && (
          <button onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors">
            <CameraOff className="w-4 h-4" />
            Desativar
          </button>
        )}
      </div>

      {errorMsg && <p className="text-xs text-rose-600 text-center max-w-xs">{errorMsg}</p>}

      {cameraState === 'active' && calibState === 'none' && (
        <p className="text-xs text-slate-500 text-center max-w-xs">
          Segure a caneta na frente da câmera e clique em{' '}
          <span className="font-semibold text-amber-600">Iniciar calibração</span>.
        </p>
      )}
    </div>
  );
}