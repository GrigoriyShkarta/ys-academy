'use client';

import { Dispatch, SetStateAction, useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, X, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  content: string;
}

export default function PreviewModal({ open, setOpen, content }: Props) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const isHtmlContent = () => {
    const trimmed = content.trim();
    return trimmed.startsWith('<') && trimmed.endsWith('>');
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotate(prev => prev + 90);
  const handleReset = () => {
    setScale(1);
    setRotate(0);
  };

  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  // Handle wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (open && !isHtmlContent()) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.deltaY < 0) {
            handleZoomIn();
          } else {
            handleZoomOut();
          }
        }
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [open, content]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className={`max-w-[100vw] w-screen z-3001 w-full h-[100vh] bg-transparent border-none shadow-none p-0 
        flex items-center justify-center`}
      >
        <DialogTitle>
          <VisuallyHidden>Preview Content</VisuallyHidden>
        </DialogTitle>

        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Floating Controls */}
        {!isHtmlContent() && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <div className="text-white/60 text-xs font-medium w-12 text-center select-none">
              {Math.round(scale * 100)}%
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
              title="Rotate"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="text-white hover:bg-white/20"
              title="Reset"
            >
              <Maximize2 className="w-5 h-5" />
            </Button>
          </div>
        )}

        <div
          ref={constraintsRef}
          onContextMenu={(e) => e.preventDefault()}
          className={`relative w-full h-full flex items-center justify-center select-none ${
            isHtmlContent() ? 'bg-white p-8 overflow-auto' : 'bg-transparent'
          }`}
        >
          {isHtmlContent() ? (
            <div
              className="ql-editor prose prose-sm max-w-4xl w-full text-black bg-white p-8 rounded-xl shadow-xl"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <motion.img
                src={content}
                alt="Full preview"
                drag={scale > 1}
                dragConstraints={constraintsRef}
                dragElastic={0.1}
                animate={{
                  scale,
                  rotate,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className={`max-w-[90vw] max-h-[90vh] object-contain transition-shadow ${
                  scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                }`}
                style={{
                  touchAction: 'none',
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
