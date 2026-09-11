import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera as CameraIcon } from 'lucide-react';

declare global {
  interface Window {
    cv: any;
  }
}

interface HoverScannerProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

// --- Tunable detection gates (mirrors camera_test.py, with gates added) ---
const MIN_AREA_FRACTION = 0.45;   // candidate must fill >=45% of scan box
const MIN_ASPECT_RATIO = 0.4;
const MAX_ASPECT_RATIO = 2.5;
const CENTER_TOLERANCE = 0.25;    // how far off-center (fraction of box) is still OK
const STABLE_FRAMES_NEEDED = 20;  // ~1s at ~20fps
const STABLE_POSITION_TOLERANCE = 15; // px movement allowed between frames while "stable"
const DETECTION_WIDTH = 320;      // downscale width for the analysis loop (speed)

type ScanStatus = 'loading-cv' | 'align' | 'holding' | 'capturing' | 'error';

export default function HoverScanner({ onCapture, onClose }: HoverScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const captureCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const [status, setStatus] = useState<ScanStatus>('loading-cv');
  const [errorMsg, setErrorMsg] = useState('');

  // Stability tracking across frames
  const stableCountRef = useRef(0);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);

  // --- Wait for OpenCV.js to finish loading its WASM runtime ---
  useEffect(() => {
    let cancelled = false;

    function whenReady() {
      if (cancelled) return;
      setStatus('align');
    }

    if (window.cv && window.cv.Mat) {
      whenReady();
    } else {
      const check = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(check);
          whenReady();
        }
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(check);
      };
    }
  }, []);

  // --- Open the camera ---
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg('Could not access the camera. Check permissions and try again.');
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // --- Capture the current video frame as a File, same shape as manual upload ---
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = captureCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      },
      'image/jpeg',
      0.92
    );
  }, [onCapture]);

  const triggerAutoCapture = useCallback(() => {
    setStatus('capturing');
    // brief pause so "Capturing..." is visible before the frame is grabbed
    setTimeout(() => {
      capturePhoto();
    }, 300);
  }, [capturePhoto]);

  // --- Main detection loop ---
  useEffect(() => {
    if (status !== 'align' && status !== 'holding') return;
    if (!window.cv || !window.cv.Mat) return;

    const video = videoRef.current;
    if (!video) return;

    const cv = window.cv;
    const canvas = detectCanvasRef.current;

    function tick() {
      if (!video || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const scale = DETECTION_WIDTH / video.videoWidth;
      const dw = DETECTION_WIDTH;
      const dh = Math.round(video.videoHeight * scale);
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      ctx.drawImage(video, 0, 0, dw, dh);

      // Scan box: centered, 75% of frame (matches camera_test.py proportions)
      const boxW = dw * 0.75;
      const boxH = dh * 0.75;
      const boxX = (dw - boxW) / 2;
      const boxY = (dh - boxH) / 2;
      const boxArea = boxW * boxH;
      const boxCenterX = boxX + boxW / 2;
      const boxCenterY = boxY + boxH / 2;

      let src, gray, blurred, edges, contours, hierarchy;
      let bestCandidate: { x: number; y: number; w: number; h: number; area: number } | null = null;

      try {
        src = cv.imread(canvas);
        gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

        edges = new cv.Mat();
        cv.Canny(blurred, edges, 50, 150);

        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const rect = cv.boundingRect(contour);
          contour.delete();

          const area = rect.width * rect.height;

          // Gate 1: size relative to scan box
          if (area < boxArea * MIN_AREA_FRACTION) continue;

          // Gate 2: aspect ratio (rejects thin barcode/label strips)
          const aspect = rect.width / rect.height;
          if (aspect < MIN_ASPECT_RATIO || aspect > MAX_ASPECT_RATIO) continue;

          // Gate 3: centered within the scan box
          const cx = rect.x + rect.width / 2;
          const cy = rect.y + rect.height / 2;
          if (
            Math.abs(cx - boxCenterX) > boxW * CENTER_TOLERANCE ||
            Math.abs(cy - boxCenterY) > boxH * CENTER_TOLERANCE
          ) continue;

          if (!bestCandidate || area > bestCandidate.area) {
            bestCandidate = { x: rect.x, y: rect.y, w: rect.width, h: rect.height, area };
          }
        }
      } finally {
        src?.delete();
        gray?.delete();
        blurred?.delete();
        edges?.delete();
        contours?.delete();
        hierarchy?.delete();
      }

      // Gate 4: frame-to-frame stability
      if (bestCandidate) {
        const center = { x: bestCandidate.x + bestCandidate.w / 2, y: bestCandidate.y + bestCandidate.h / 2 };
        if (lastCenterRef.current) {
          const dist = Math.hypot(center.x - lastCenterRef.current.x, center.y - lastCenterRef.current.y);
          if (dist <= STABLE_POSITION_TOLERANCE) {
            stableCountRef.current += 1;
          } else {
            stableCountRef.current = 0;
          }
        }
        lastCenterRef.current = center;

        if (stableCountRef.current >= STABLE_FRAMES_NEEDED) {
          triggerAutoCapture();
          return; // stop the loop; capturing takes over
        }
        setStatus('holding');
      } else {
        stableCountRef.current = 0;
        lastCenterRef.current = null;
        setStatus('align');
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, triggerAutoCapture]);

  const statusText = {
    'loading-cv': 'Starting scanner…',
    align: 'Place product inside the box',
    holding: 'Hold steady…',
    capturing: 'Capturing…',
    error: errorMsg,
  }[status];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="rounded-full bg-white/10 p-2 text-white">
          <X size={22} />
        </button>
        <span className="text-sm font-medium text-white">{statusText}</span>
        <div className="w-9" />
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />

        {/* Scan box overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`h-3/4 w-3/4 rounded-2xl border-4 transition-colors ${
              status === 'holding' ? 'border-primary-400' : 'border-white/70'
            }`}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 p-6">
        <button
          onClick={triggerAutoCapture}
          disabled={status === 'loading-cv' || status === 'error' || status === 'capturing'}
          className="btn-primary"
        >
          <CameraIcon size={20} />
          Capture Now
        </button>
        <p className="text-xs text-white/60">Automatic detection isn't perfect — you can capture manually anytime.</p>
      </div>
    </div>
  );
}
