"use client";

import { useEffect, useRef } from "react";

export function Waveform({
  stream,
  paused,
  className,
}: {
  stream: MediaStream | null;
  paused?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioCtx = new AudioContextCtor();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      if (paused) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      analyser.getByteFrequencyData(dataArray);

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const barCount = 48;
      const step = Math.floor(bufferLength / barCount);
      const barWidth = w / barCount - 2;
      const accent = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim() || "#1E40AF";

      for (let i = 0; i < barCount; i += 1) {
        const v = dataArray[i * step] / 255;
        const barHeight = Math.max(2, v * h * 0.9);
        const x = i * (barWidth + 2);
        const y = (h - barHeight) / 2;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.4 + v * 0.6;
        const r = Math.min(barWidth / 2, 4);
        roundedRect(ctx, x, y, barWidth, barHeight, r);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      try {
        source.disconnect();
        analyser.disconnect();
        audioCtx.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
    };
  }, [stream, paused]);

  return <canvas ref={canvasRef} className={className} />;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
