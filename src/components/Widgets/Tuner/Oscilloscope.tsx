'use client';

import { useEffect, useRef } from 'react';

interface OscilloscopeProps {
  analyser: AnalyserNode | null;
  isListening: boolean;
}

export default function Oscilloscope({ analyser, isListening }: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isListening || !analyser) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Clear background
      ctx.fillStyle = 'rgb(10, 10, 10)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6'; // primary / accent color (blue-500)

      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, isListening]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 bg-zinc-950 rounded-lg border border-zinc-800"
      width={400}
      height={128}
    />
  );
}
