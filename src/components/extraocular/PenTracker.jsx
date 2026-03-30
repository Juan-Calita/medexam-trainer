import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Circle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// How many frames between AI calls (AI is slow, ~1-2s)
const AI_INTERVAL_FRAMES = 45; // ~1.5s at 30fps

function drawDebugOverlay(debugCanvas, sourceCanvas, dotX, dotY) {
  const ctx = debugCanvas.getContext('2d');
  debugCanvas.width = sourceCanvas.width;
  debugCanvas.height = sourceCanvas.height;
  // Draw the source frame dimmed
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, debugCanvas.width, debugCanvas.height);
  // Draw crosshair on AI-detected point
  if (dotX !== null && dotY !== null) {
    const px = dotX * sourceCanvas.width;
    const py = dotY * sourceCanvas.height;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 10, py); ctx.lineTo(px + 10, py);
    ctx.moveTo(px, py - 10); ctx.lineTo(px, py + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export default function PenTracker({ onPositionChange, containerRef, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const debugCanvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const aiPendingRef = useRef(false);
  const lastAIResultRef = useRef(null); // { x, y } normalized 0-1
  const frameCountRef = useRef(0);

  const [cameraState, setCameraState] = useState('idle');
  const [penFound, setPenFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiStatus, setAiStatus] = useState(''); // 'calling' | 'ok' | 'miss'

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
    setPenFound(false);
    lastAIResultRef.current = null;
    aiPendingRef.current = false;
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
      setCameraState('error');
      setErrorMsg('Erro ao iniciar o vídeo: ' + err.message);
      stopCamera();
      return;
    }
    setCameraState('active');
  }, [stopCamera]);

  // Call AI to detect pen position in the current frame
  const callAI = useCallback(async (canvas) => {
    if (aiPendingRef.current) return;
    aiPendingRef.current = true;
    setAiStatus('calling');

    // Capture frame as JPEG base64 data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

    try {
      // Upload the frame so InvokeLLM can access it as a URL
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `This is a frame from a webcam. The user is holding a pen/pointer in front of the camera.
Detect the TIP of the pen (the pointed end closest to the camera or most visible endpoint).
Return ONLY a JSON object with the normalized coordinates of the pen tip:
{ "found": true, "x": 0.45, "y": 0.3 }
where x=0 is left edge, x=1 is right edge, y=0 is top, y=1 is bottom.
If no pen is visible, return: { "found": false, "x": null, "y": null }
Do NOT include any other text.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            found: { type: 'boolean' },
            x: { type: 'number' },
            y: { type: 'number' },
          },
          required: ['found'],
        },
      });

      if (result.found && result.x != null && result.y != null) {
        lastAIResultRef.current = { x: result.x, y: result.y };
        setPenFound(true);
        setAiStatus('ok');
      } else {
        lastAIResultRef.current = null;
        setPenFound(false);
        setAiStatus('miss');
      }
    } catch {
      setAiStatus('miss');
    } finally {
      aiPendingRef.current = false;
    }
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
    frameCountRef.current = 0;

    const loop = () => {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        frameCountRef.current++;

        // Trigger AI every N frames
        if (frameCountRef.current % AI_INTERVAL_FRAMES === 0) {
          callAI(canvas);
        }

        // Update debug overlay every 3 frames
        if (frameCountRef.current % 3 === 0 && debugCanvasRef.current) {
          const pos = lastAIResultRef.current;
          drawDebugOverlay(debugCanvasRef.current, canvas, pos?.x ?? null, pos?.y ?? null);
        }

        // Send position to parent using last known AI result
        if (lastAIResultRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          onPositionChange({
            // Mirror X since video is mirrored visually
            x: (1 - lastAIResultRef.current.x) * rect.width,
            y: lastAIResultRef.current.y * rect.height,
          });
        }
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [cameraState, callAI, onPositionChange, containerRef]);

  useEffect(() => {
    if (!isActive) stopCamera();
  }, [isActive, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const statusColor = aiStatus === 'ok' ? 'text-emerald-500' : aiStatus === 'calling' ? 'text-amber-400' : 'text-slate-400';
  const statusLabel = aiStatus === 'calling' ? 'IA analisando...' : penFound ? 'Caneta detectada!' : 'Procurando...';

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
            playsInline
            muted
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">IA</span>
          <canvas
            ref={debugCanvasRef}
            className="rounded-lg border-2 border-emerald-200 shadow-sm"
            style={{ width: 160, height: 120, transform: 'scaleX(-1)' }}
          />
        </div>
      </div>

      {cameraState === 'active' && (
        <div className="flex items-center gap-1.5 -mt-1">
          <Circle className={`w-2.5 h-2.5 fill-current ${statusColor}`} />
          <span className="text-xs text-slate-500">{statusLabel}</span>
        </div>
      )}

      <div className="flex gap-2">
        {(cameraState === 'idle' || cameraState === 'error') && (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Ativar Câmera (IA)
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
        <p className="text-xs text-rose-600 text-center max-w-xs">{errorMsg}</p>
      )}

      {cameraState === 'active' && (
        <p className="text-xs text-slate-500 text-center max-w-xs">
          Segure qualquer <span className="font-semibold text-indigo-600">caneta ou objeto</span> em frente à câmera — a IA detecta automaticamente.
        </p>
      )}
    </div>
  );
}