import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crop as CropIcon,
  RefreshCw,
  FlipHorizontal,
  Move,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PhotoCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

type AspectRatioOption = {
  id: string;
  label: string;
  sub: string;
  ratio: number | null; // width / height; null = custom / free
};

const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: '4:5', label: '4:5', sub: 'Instagram Feed', ratio: 4 / 5 },
  { id: '1:1', label: '1:1', sub: 'Square', ratio: 1 },
  { id: '9:16', label: '9:16', sub: 'Story / Reel', ratio: 9 / 16 },
  { id: '3:4', label: '3:4', sub: 'Portrait', ratio: 3 / 4 },
  { id: 'free', label: 'Free', sub: 'Custom Box', ratio: null },
];

type DragAction =
  | { type: 'move_crop' }
  | { type: 'resize_crop'; handle: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' }
  | { type: 'pan_image' }
  | null;

export const PhotoCropperModal: React.FC<PhotoCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [selectedRatioId, setSelectedRatioId] = useState<string>('4:5');
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);
  const [imagePan, setImagePan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState<'crop' | 'image'>('crop'); // 'crop' (adjust frame) or 'image' (pan image)

  // Crop rectangle inside the preview container (in container pixels)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 40,
    y: 20,
    width: 240,
    height: 300,
  });

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 360,
    height: 380,
  });

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 1000,
  });

  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragActionRef = useRef<DragAction>(null);
  const dragStartCropBoxRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const dragStartImagePanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1.0);

  // Initialize crop box to centered default matching aspect ratio
  const initCropBox = useCallback(
    (cWidth: number, cHeight: number, ratioId: string) => {
      const ratioObj = ASPECT_RATIOS.find((r) => r.id === ratioId) || ASPECT_RATIOS[0];
      const pad = 24;
      const availW = Math.max(120, cWidth - pad * 2);
      const availH = Math.max(120, cHeight - pad * 2);

      let targetRatio = ratioObj.ratio;
      if (targetRatio === null) {
        // Free ratio default to 4:5
        targetRatio = 4 / 5;
      }

      let w = availW;
      let h = w / targetRatio;
      if (h > availH) {
        h = availH;
        w = h * targetRatio;
      }

      // Center it
      const x = Math.round((cWidth - w) / 2);
      const y = Math.round((cHeight - h) / 2);

      setCropBox({
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.round(w),
        height: Math.round(h),
      });
    },
    []
  );

  // On open or imageSrc change
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0);
      setRotation(0);
      setIsFlippedH(false);
      setImagePan({ x: 0, y: 0 });
      setImgLoaded(false);
      setIsProcessing(false);
      setAppliedSuccess(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setNaturalSize({
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 1000,
        });
        setImgLoaded(true);
      };
      img.onerror = () => {
        // Fallback without crossOrigin in case of strict origin policies
        const fallback = new Image();
        fallback.onload = () => {
          setNaturalSize({
            width: fallback.naturalWidth || 800,
            height: fallback.naturalHeight || 1000,
          });
          setImgLoaded(true);
        };
        fallback.onerror = () => {
          setNaturalSize({ width: 800, height: 1000 });
          setImgLoaded(true);
        };
        fallback.src = imageSrc;
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  // Update container size on mount/resize
  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (w > 0 && h > 0) {
          setContainerSize({ width: w, height: h });
          initCropBox(w, h, selectedRatioId);
        }
      }
    };

    const timer = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [isOpen, initCropBox, selectedRatioId]);

  // Compute base rendered dimensions of image to fit nicely inside container
  const getRenderedImageSize = useCallback(() => {
    const isRotatedQuarter = rotation === 90 || rotation === 270;
    const effNaturalW = isRotatedQuarter ? naturalSize.height : naturalSize.width;
    const effNaturalH = isRotatedQuarter ? naturalSize.width : naturalSize.height;

    const containerAspect = containerSize.width / containerSize.height;
    const imageAspect = effNaturalW / (effNaturalH || 1);

    let drawW: number;
    let drawH: number;

    // Cover container nicely so there are no empty borders
    if (imageAspect > containerAspect) {
      drawH = containerSize.height;
      drawW = drawH * imageAspect;
    } else {
      drawW = containerSize.width;
      drawH = drawW / imageAspect;
    }

    // Account for 90/270 rotation for the unrotated image element
    if (isRotatedQuarter) {
      return {
        baseW: Math.round(drawH),
        baseH: Math.round(drawW),
      };
    }

    return {
      baseW: Math.round(drawW),
      baseH: Math.round(drawH),
    };
  }, [containerSize, naturalSize, rotation]);

  const { baseW, baseH } = getRenderedImageSize();

  // Pointer Interaction Handlers
  const handlePointerDown = (
    e: React.PointerEvent,
    action: DragAction
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragActionRef.current = action;
    dragStartPointerRef.current = { x: e.clientX, y: e.clientY };
    dragStartCropBoxRef.current = { ...cropBox };
    dragStartImagePanRef.current = { ...imagePan };

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values()) as { x: number; y: number }[];
      initialPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialZoomRef.current = zoom;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Handle two-finger pinch-to-zoom
    if (activePointersRef.current.size === 2 && initialPinchDistRef.current) {
      const pts = Array.from(activePointersRef.current.values()) as { x: number; y: number }[];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / initialPinchDistRef.current;
      setZoom(Math.min(Math.max(0.5, initialZoomRef.current * ratio), 3.5));
      return;
    }

    const action = dragActionRef.current;
    if (!action) return;

    const dx = e.clientX - dragStartPointerRef.current.x;
    const dy = e.clientY - dragStartPointerRef.current.y;

    if (action.type === 'pan_image') {
      setImagePan({
        x: dragStartImagePanRef.current.x + dx,
        y: dragStartImagePanRef.current.y + dy,
      });
      return;
    }

    if (action.type === 'move_crop') {
      const orig = dragStartCropBoxRef.current;
      const maxX = containerSize.width - orig.width;
      const maxY = containerSize.height - orig.height;

      setCropBox({
        ...orig,
        x: Math.min(Math.max(0, orig.x + dx), Math.max(0, maxX)),
        y: Math.min(Math.max(0, orig.y + dy), Math.max(0, maxY)),
      });
      return;
    }

    if (action.type === 'resize_crop') {
      const orig = dragStartCropBoxRef.current;
      const handle = action.handle;
      const minSize = 60;
      const activeRatio = ASPECT_RATIOS.find((r) => r.id === selectedRatioId)?.ratio || null;

      let newX = orig.x;
      let newY = orig.y;
      let newW = orig.width;
      let newH = orig.height;

      // Unconstrained resize coordinates
      if (handle.includes('r')) {
        newW = Math.max(minSize, Math.min(containerSize.width - orig.x, orig.width + dx));
      }
      if (handle.includes('l')) {
        const potentialW = orig.width - dx;
        if (potentialW >= minSize && orig.x + dx >= 0) {
          newX = orig.x + dx;
          newW = potentialW;
        }
      }
      if (handle.includes('b')) {
        newH = Math.max(minSize, Math.min(containerSize.height - orig.y, orig.height + dy));
      }
      if (handle.includes('t')) {
        const potentialH = orig.height - dy;
        if (potentialH >= minSize && orig.y + dy >= 0) {
          newY = orig.y + dy;
          newH = potentialH;
        }
      }

      // Constrain to selected aspect ratio if locked
      if (activeRatio !== null) {
        if (handle === 'tl' || handle === 'tr' || handle === 'bl' || handle === 'br') {
          // Adjust height based on width
          newH = Math.round(newW / activeRatio);
          if (newY + newH > containerSize.height) {
            newH = containerSize.height - newY;
            newW = Math.round(newH * activeRatio);
          }
          if (handle === 'tl') {
            newX = orig.x + orig.width - newW;
            newY = orig.y + orig.height - newH;
          } else if (handle === 'tr') {
            newY = orig.y + orig.height - newH;
          } else if (handle === 'bl') {
            newX = orig.x + orig.width - newW;
          }
        }
      }

      // Boundaries clamping
      newX = Math.max(0, Math.min(newX, containerSize.width - minSize));
      newY = Math.max(0, Math.min(newY, containerSize.height - minSize));
      newW = Math.min(newW, containerSize.width - newX);
      newH = Math.min(newH, containerSize.height - newY);

      setCropBox({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (activePointersRef.current.size === 0) {
      dragActionRef.current = null;
      initialPinchDistRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(0.5, prev + delta), 3.5));
  };

  // Safe Image Loader: handles data URLs, blob URLs, and external URLs with crossOrigin
  const loadDrawableImage = async (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Direct load for data and blob URLs
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
        return;
      }

      // For external URLs (like Unsplash), try crossOrigin='anonymous'
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback: try fetching as a blob with mode: 'cors'
        fetch(src, { mode: 'cors' })
          .then((res) => {
            if (!res.ok) throw new Error('Fetch failed');
            return res.blob();
          })
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            const fallback = new Image();
            fallback.onload = () => resolve(fallback);
            fallback.onerror = () => {
              const direct = new Image();
              direct.onload = () => resolve(direct);
              direct.onerror = (e) => reject(e);
              direct.src = src;
            };
            fallback.src = blobUrl;
          })
          .catch((err) => {
            // If aborted or failed CORS, safely fallback to direct image load without throwing
            const direct = new Image();
            direct.onload = () => resolve(direct);
            direct.onerror = () => {
              // Still resolve with direct image element so canvas can attempt or gracefully fallback
              resolve(direct);
            };
            direct.src = src;
          });
      };
      img.src = src;
    });
  };

  // Export high-resolution cropped portrait
  const handleApplyCrop = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const img = await loadDrawableImage(imageSrc);

      // Desired output size: High resolution (target 1080px portrait width)
      const scale = Math.max(2.0, Math.min(4.0, 1080 / cropBox.width));
      const outW = Math.round(cropBox.width * scale);
      const outH = Math.round(cropBox.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Move canvas origin to the top-left of the crop box transformed space
      const imgCenterX = containerSize.width / 2 + imagePan.x;
      const imgCenterY = containerSize.height / 2 + imagePan.y;

      const relCenterX = (imgCenterX - cropBox.x) * scale;
      const relCenterY = (imgCenterY - cropBox.y) * scale;

      ctx.translate(relCenterX, relCenterY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale((isFlippedH ? -1 : 1) * zoom, zoom);

      const drawW = baseW * scale;
      const drawH = baseH * scale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      try {
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setAppliedSuccess(true);
        setTimeout(() => {
          onCropComplete(croppedDataUrl);
          onClose();
        }, 150);
      } catch (canvasErr) {
        console.warn('Canvas export tainted, passing through image:', canvasErr);
        onCropComplete(imageSrc);
        onClose();
      }
    } catch (err) {
      console.error('Error applying crop:', err);
      // Fallback: send image
      onCropComplete(imageSrc);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    imageSrc,
    cropBox,
    containerSize,
    imagePan,
    rotation,
    isFlippedH,
    zoom,
    baseW,
    baseH,
    onCropComplete,
    onClose,
  ]);

  // Keyboard accessibility: Enter to apply Done, Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApplyCrop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleApplyCrop, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="modal-photo-cropper"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/85 backdrop-blur-md"
        >
          {/* Backdrop Dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] z-10"
          >
            {/* Modal Header with Prominent Done Button */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-neutral-800 bg-neutral-900/95 shrink-0">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                  <CropIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight text-white">Crop & Frame Portrait</h3>
                  <p className="text-[11px] text-neutral-400">
                    Adjust box or handles • Click Done when ready
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Primary Header Done Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  id="btn-done-cropper-header"
                  disabled={isProcessing}
                  onClick={handleApplyCrop}
                  className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                    appliedSuccess
                      ? 'bg-emerald-600 ring-2 ring-emerald-400/40'
                      : 'bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:brightness-110 ring-2 ring-pink-500/40'
                  }`}
                  title="Finish cropping and apply this image"
                >
                  {isProcessing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{appliedSuccess ? 'Done!' : 'Done'}</span>
                </motion.button>

                <button
                  type="button"
                  id="btn-close-cropper"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Cancel & close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Aspect Ratio Selector Pills */}
            <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden sm:inline mr-1">
                  Ratio:
                </span>
                {ASPECT_RATIOS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    id={`btn-aspect-ratio-${item.id.replace(':', '-')}`}
                    onClick={() => {
                      setSelectedRatioId(item.id);
                      initCropBox(containerSize.width, containerSize.height, item.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedRatioId === item.id
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xs'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">({item.sub})</span>
                  </button>
                ))}
              </div>

              {/* Mode Toggle: Adjust Crop Frame vs Pan Photo */}
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 shrink-0">
                <button
                  type="button"
                  id="btn-mode-crop"
                  onClick={() => setInteractionMode('crop')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    interactionMode === 'crop'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Drag the crop box corners to adjust framing"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Crop Box</span>
                </button>
                <button
                  type="button"
                  id="btn-mode-image"
                  onClick={() => setInteractionMode('image')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    interactionMode === 'image'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Pan and move the image underneath"
                >
                  <Move className="w-3 h-3" />
                  <span>Pan Photo</span>
                </button>
              </div>
            </div>

            {/* Interactive Cropping Stage */}
            <div
              ref={containerRef}
              onWheel={handleWheel}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative flex-1 min-h-[320px] sm:min-h-[380px] bg-neutral-950 overflow-hidden select-none flex items-center justify-center cursor-default"
            >
              {/* Rendered Target Image */}
              <div
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                  transform: `translate(${imagePan.x}px, ${imagePan.y}px) rotate(${rotation}deg) scale(${
                    isFlippedH ? -1 : 1
                  }, 1) scale(${zoom})`,
                  transformOrigin: '0 0',
                  transition: dragActionRef.current ? 'none' : 'transform 0.08s ease-out',
                }}
              >
                {imgLoaded ? (
                  <img
                    src={imageSrc}
                    alt="Cropping target"
                    referrerPolicy="no-referrer"
                    style={{
                      position: 'absolute',
                      left: `${-baseW / 2}px`,
                      top: `${-baseH / 2}px`,
                      width: `${baseW}px`,
                      height: `${baseH}px`,
                      maxWidth: 'none',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <div className="absolute -left-5 -top-5 w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Darkened Mask Over Entire Container with Cutout at CropBox */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 2000px rgba(0, 0, 0, 0.65)`,
                  clipPath: `polygon(
                    0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                    ${cropBox.x}px ${cropBox.y}px,
                    ${cropBox.x}px ${cropBox.y + cropBox.height}px,
                    ${cropBox.x + cropBox.width}px ${cropBox.y + cropBox.height}px,
                    ${cropBox.x + cropBox.width}px ${cropBox.y}px,
                    ${cropBox.x}px ${cropBox.y}px
                  )`,
                }}
              />

              {/* Background Pan Surface (allows panning photo when clicking outside crop box) */}
              <div
                id="surface-pan-photo"
                onPointerDown={(e) => handlePointerDown(e, { type: 'pan_image' })}
                className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
              />

              {/* Active Interactive Crop Box */}
              <div
                id="interactive-crop-box"
                onPointerDown={(e) =>
                  handlePointerDown(
                    e,
                    interactionMode === 'crop' ? { type: 'move_crop' } : { type: 'pan_image' }
                  )
                }
                style={{
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                  touchAction: 'none',
                }}
                className={`absolute z-20 border-2 border-pink-500 rounded-xl shadow-2xl transition-shadow ${
                  interactionMode === 'crop'
                    ? 'cursor-move ring-2 ring-pink-500/30'
                    : 'cursor-grab active:cursor-grabbing'
                }`}
              >
                {/* Rule-of-Thirds Gridlines */}
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>

                {/* 4 Corner Resize Handles */}
                {/* Top-Left */}
                <div
                  id="handle-crop-tl"
                  onPointerDown={(e) =>
                    handlePointerDown(e, { type: 'resize_crop', handle: 'tl' })
                  }
                  className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-pink-600 rounded-full shadow-md cursor-nwse-resize hover:scale-125 transition-transform flex items-center justify-center z-30"
                >
                  <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                </div>

                {/* Top-Right */}
                <div
                  id="handle-crop-tr"
                  onPointerDown={(e) =>
                    handlePointerDown(e, { type: 'resize_crop', handle: 'tr' })
                  }
                  className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-pink-600 rounded-full shadow-md cursor-nesw-resize hover:scale-125 transition-transform flex items-center justify-center z-30"
                >
                  <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                </div>

                {/* Bottom-Left */}
                <div
                  id="handle-crop-bl"
                  onPointerDown={(e) =>
                    handlePointerDown(e, { type: 'resize_crop', handle: 'bl' })
                  }
                  className="absolute -bottom-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-pink-600 rounded-full shadow-md cursor-nesw-resize hover:scale-125 transition-transform flex items-center justify-center z-30"
                >
                  <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                </div>

                {/* Bottom-Right */}
                <div
                  id="handle-crop-br"
                  onPointerDown={(e) =>
                    handlePointerDown(e, { type: 'resize_crop', handle: 'br' })
                  }
                  className="absolute -bottom-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-pink-600 rounded-full shadow-md cursor-nwse-resize hover:scale-125 transition-transform flex items-center justify-center z-30"
                >
                  <div className="w-1.5 h-1.5 bg-pink-600 rounded-full" />
                </div>

                {/* 4 Edge Resize Grips */}
                {/* Top Edge */}
                <div
                  id="handle-crop-t"
                  onPointerDown={(e) =>
                    handlePointerDown(e, { type: 'resize_crop', handle: 't' })
                  }
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-white/90 border border-pink-500 rounded-full cursor-ns-resize shadow-xs hover:bg-white z-30"
                />

                {/* Bottom Edge */}
                <div
                  id="handle-crop-b"
                  onPointerDown={(e) =>
                    handlePointerDown(e, { type: 'resize_crop', handle: 'b' })
                  }
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-white/90 border border-pink-500 rounded-full cursor-ns-resize shadow-xs hover:bg-white z-30"
                />

                {/* Left Edge */}
                <div
                  id="handle-crop-l"
                  onPointerDown={(e) =>
                    handlePointerDown(e, { type: 'resize_crop', handle: 'l' })
                  }
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-8 bg-white/90 border border-pink-500 rounded-full cursor-ew-resize shadow-xs hover:bg-white z-30"
                />

                {/* Right Edge */}
                <div
                  id="handle-crop-r"
                  onPointerDown={(e) =>
                    handlePointerDown(e, { type: 'resize_crop', handle: 'r' })
                  }
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 bg-white/90 border border-pink-500 rounded-full cursor-ew-resize shadow-xs hover:bg-white z-30"
                />

                {/* Aspect Badge on Crop Box */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-md text-[10px] font-bold text-pink-400 border border-pink-500/40 pointer-events-none">
                  {cropBox.width} × {cropBox.height}px
                </div>
              </div>

              {/* Floating Quick Done Pill & Instructions */}
              <div className="absolute bottom-3 left-3 sm:left-4 z-30 pointer-events-none">
                <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-full text-[11px] text-neutral-300 flex items-center gap-1.5 shadow-md border border-white/10">
                  <Sparkles className="w-3 h-3 text-pink-400 shrink-0" />
                  <span className="hidden sm:inline">Drag corners to resize • </span>
                  <span>Click <strong>Done</strong> to save</span>
                </div>
              </div>

              <div className="absolute bottom-3 right-3 sm:right-4 z-30">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  id="btn-stage-quick-done"
                  disabled={isProcessing}
                  onClick={handleApplyCrop}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:brightness-110 text-white text-xs font-bold shadow-lg border border-white/20 cursor-pointer transition-all disabled:opacity-50"
                  title="Finish and apply cropped portrait"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </motion.button>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 sm:p-5 bg-neutral-900 border-t border-neutral-800 space-y-3.5">
              {/* Zoom Slider */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="btn-zoom-out"
                  onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.15))}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <input
                  id="slider-photo-zoom"
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />

                <button
                  type="button"
                  id="btn-zoom-in"
                  onClick={() => setZoom((prev) => Math.min(3.0, prev + 0.15))}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <span className="text-xs font-mono text-neutral-400 w-11 text-right">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Tool Buttons: Rotate, Flip, Center, Reset, and Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="btn-crop-rotate"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                    title="Rotate 90° clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-pink-400" />
                    <span>Rotate</span>
                  </button>

                  <button
                    type="button"
                    id="btn-crop-flip"
                    onClick={() => setIsFlippedH((prev) => !prev)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isFlippedH
                        ? 'bg-pink-600/30 text-pink-300 border border-pink-500/50'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                    }`}
                    title="Flip horizontally"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip</span>
                  </button>

                  <button
                    type="button"
                    id="btn-crop-center"
                    onClick={() => {
                      setImagePan({ x: 0, y: 0 });
                      initCropBox(containerSize.width, containerSize.height, selectedRatioId);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                    title="Re-center crop box and photo"
                  >
                    <span>Center</span>
                  </button>

                  <button
                    type="button"
                    id="btn-crop-reset"
                    onClick={() => {
                      setZoom(1.0);
                      setRotation(0);
                      setIsFlippedH(false);
                      setImagePan({ x: 0, y: 0 });
                      initCropBox(containerSize.width, containerSize.height, selectedRatioId);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                    title="Reset all adjustments"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-cancel-crop"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    id="btn-apply-crop"
                    disabled={isProcessing}
                    onClick={handleApplyCrop}
                    className={`inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                      appliedSuccess
                        ? 'bg-emerald-600 ring-2 ring-emerald-400/40'
                        : 'bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:brightness-110 ring-2 ring-pink-500/30'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{appliedSuccess ? 'Done! Cropped' : 'Done • Use Cropped Photo'}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
