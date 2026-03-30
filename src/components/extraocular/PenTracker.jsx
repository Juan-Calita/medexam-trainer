import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Circle } from 'lucide-react';

// Detects the centroid of red pixels in a video frame
function detectRedObject(canvas, ctx, video) {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let sumX = 0, sumY = 0, count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Red detection: red channel high, green and blue low
    if (r > 150 && g < 80 && b < 80 && r > g * 2 && r > b * 2) {
      const pixelIndex = i / 4;
      sumX += pixelIndex % canvas.width;
      sumY += Math.floor(pixelIndex / canvas.width);
      count++;
    }
  }

  if (count > 30) {
    return { x: sumX / count, y: sumY / count, found: true };
  }
  return { x: 0, y: 0, found: false };
}

export default function PenTracker({ onPositionChange, containerRef, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState('idle'); // idle | loading | active | error
  const [penFound, setPenFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const startCamera = useCallback(async () => {
    setCameraState('loading');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 320, height: 240 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState('active');
      }
    } catch (err) {
      setCameraState('error');
      setErrorMsg('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraState('idle');
    setPenFound(false);
  }, []);

  // Tracking loop
  useEffect(() => {
    if (cameraState !== 'active') return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 320;
    canvas.height = 240;

    const loop = () => {
      if (!containerRef.current) { animRef.current = requestAnimationFrame(loop); return; }

      const result = detectRedObject(canvas, ctx, video);
      setPenFound(result.found);

      if (result.found) {
        // Map from camera coords (320x240) to container coords
        const rect = containerRef.current.getBoundingClientRect();
        // Mirror X because camera is front-facing (mirrored)
        const mappedX = (1 - result.x / 320) * rect.width;
        const mappedY = (result.y / 240) * rect.height;
        onPositionChange({ x: mappedX, y: mappedY });
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [cameraState, onPositionChange, containerRef]);

  // Stop camera when component is deactivated
  useEffect(() => {
    if (!isActive) stopCamera();
  }, [isActive, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden video element */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Camera preview (small) */}
      {cameraState === 'active' && (
        <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm" style={{ width: 160, height: 120 }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            playsInline
            muted
            autoPlay
          />
          {/* Indicator */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/50 rounded-full px-1.5 py-0.5">
            <Circle className={`w-2 h-2 fill-current ${penFound ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-[9px] text-white">{penFound ? 'Detectado' : 'Procurando...'}</span>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {cameraState === 'idle' || cameraState === 'error' ? (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Ativar Câmera
          </button>
        ) : cameraState === 'loading' ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            Conectando...
          </div>
        ) : (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
          >
            <CameraOff className="w-4 h-4" />
            Desativar
          </button>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <p className="text-xs text-rose-600 text-center max-w-xs">{errorMsg}</p>
      )}

      {/* Tip */}
      {cameraState === 'active' && (
        <p className="text-xs text-slate-500 text-center max-w-xs">
          Segure uma <span className="font-semibold text-rose-600">caneta vermelha</span> ou objeto vermelho em frente à câmera para mover os olhos.
        </p>
      )}
    </div>
  );
}