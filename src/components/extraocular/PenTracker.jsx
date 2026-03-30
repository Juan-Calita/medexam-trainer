import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Circle } from 'lucide-react';

// Draws red mask on debug canvas so user can see what's detected
function drawDebugMask(debugCanvas, sourceCanvas, dotX, dotY) {
  const ctx = debugCanvas.getContext('2d');
  debugCanvas.width = sourceCanvas.width;
  debugCanvas.height = sourceCanvas.height;
  const src = sourceCanvas.getContext('2d').getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const out = ctx.createImageData(sourceCanvas.width, sourceCanvas.height);
  for (let i = 0; i < src.data.length; i += 4) {
    const r = src.data[i], g = src.data[i + 1], b = src.data[i + 2];
    const red = isRedPixel(r, g, b);
    out.data[i]     = red ? 0   : r / 4;
    out.data[i + 1] = red ? 100 : g / 4;
    out.data[i + 2] = red ? 255 : b / 4;
    out.data[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  // Draw crosshair on detected centroid
  if (dotX !== null) {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dotX - 8, dotY); ctx.lineTo(dotX + 8, dotY);
    ctx.moveTo(dotX, dotY - 8); ctx.lineTo(dotX, dotY + 8);
    ctx.stroke();
  }
}

// Convert RGB to HSV and check if it's a vivid blue
function isBluePixel(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  if (delta < 0.15 || max < 0.2) return false; // too dark or unsaturated

  const s = delta / max;   // saturation
  const v = max;           // value (brightness)

  if (s < 0.35 || v < 0.2) return false;

  // Hue calculation
  let h;
  if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
  else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
  else h = 60 * ((rn - gn) / delta + 4);
  if (h < 0) h += 360;

  // Blue hue range: 200–260 degrees
  return h >= 200 && h <= 260;
}

function detectBlueObject(canvas, ctx, video) {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const W = canvas.width;
  const H = canvas.height;

  const bluePixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (isBluePixel(data[i], data[i + 1], data[i + 2])) {
      const idx = i / 4;
      bluePixels.push({ x: idx % W, y: Math.floor(idx / W) });
    }
  }

  if (bluePixels.length < 10) return { x: 0, y: 0, found: false };

  // Find densest cluster in a 12x9 grid
  const cellW = Math.ceil(W / 12);
  const cellH = Math.ceil(H / 9);
  const cells = {};
  for (const p of bluePixels) {
    const key = `${Math.floor(p.x / cellW)}_${Math.floor(p.y / cellH)}`;
    if (!cells[key]) cells[key] = { sumX: 0, sumY: 0, count: 0 };
    cells[key].sumX += p.x;
    cells[key].sumY += p.y;
    cells[key].count++;
  }

  let best = null;
  for (const cell of Object.values(cells)) {
    if (!best || cell.count > best.count) best = cell;
  }

  if (!best || best.count < 5) return { x: 0, y: 0, found: false };

  return { x: best.sumX / best.count, y: best.sumY / best.count, found: true };
}

// Alias used by drawDebugMask
const isRedPixel = isBluePixel;

export default function PenTracker({ onPositionChange, containerRef, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const debugCanvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState('idle'); // idle | loading | active | error
  const [penFound, setPenFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
    setPenFound(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('loading');
    setErrorMsg('');

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (err) {
      setCameraState('error');
      setErrorMsg('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) { stopCamera(); return; }

    video.srcObject = stream;

    // Wait for metadata then play
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    try {
      await video.play();
    } catch (err) {
      setCameraState('error');
      setErrorMsg('Erro ao iniciar o vídeo da câmera: ' + err.message);
      stopCamera();
      return;
    }

    setCameraState('active');
  }, [stopCamera]);

  // Tracking loop — starts only when camera is active
  useEffect(() => {
    if (cameraState !== 'active') return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 320;
    canvas.height = 240;

    let frameCount = 0;
    const loop = () => {
      if (containerRef.current && video.readyState >= 2) {
        const result = detectBlueObject(canvas, ctx, video);
        setPenFound(result.found);
        // Draw debug mask every 3 frames to save CPU
        frameCount++;
        if (frameCount % 3 === 0 && debugCanvasRef.current) {
          drawDebugMask(debugCanvasRef.current, canvas, result.found ? result.x : null, result.found ? result.y : null);
        }
        if (result.found) {
          const rect = containerRef.current.getBoundingClientRect();
          onPositionChange({
            x: (1 - result.x / 320) * rect.width,
            y: (result.y / 240) * rect.height,
          });
        }
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [cameraState, onPositionChange, containerRef]);

  useEffect(() => {
    if (!isActive) stopCamera();
  }, [isActive, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video always in DOM so ref stays stable */}
      <div className={cameraState === 'active' ? 'flex gap-2 items-start' : 'hidden'}>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Câmera</span>
          <video
            ref={videoRef}
            className="rounded-lg border-2 border-slate-200 shadow-sm"
            style={{ width: 160, height: 120, objectFit: 'cover', transform: 'scaleX(-1)' }}
            playsInline
            muted
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Detecção</span>
          <canvas
            ref={debugCanvasRef}
            className="rounded-lg border-2 border-rose-200 shadow-sm"
            style={{ width: 160, height: 120, transform: 'scaleX(-1)' }}
          />
        </div>
      </div>

      {cameraState === 'active' && (
        <div className="flex items-center gap-1.5 -mt-1">
          <Circle className={`w-2.5 h-2.5 fill-current ${penFound ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span className="text-xs text-slate-500">{penFound ? 'Caneta detectada!' : 'Procurando...'}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {(cameraState === 'idle' || cameraState === 'error') && (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
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
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
          >
            <CameraOff className="w-4 h-4" />
            Desativar
          </button>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-600 text-center max-w-xs">{errorMsg}
        </p>
      )}

      {cameraState === 'active' && (
        <p className="text-xs text-slate-500 text-center max-w-xs">
          Segure uma <span className="font-semibold text-blue-600">caneta azul</span> em frente à câmera para mover os olhos.
        </p>
      )}
    </div>
  );
}