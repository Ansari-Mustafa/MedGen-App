"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils/format";

export function AudioPlayer({ src }: { src: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onLoaded = () => setDuration(a.duration || 0);
    const onEnded = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  if (!src) return null;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  };

  const seek = (pct: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = (pct / 100) * (duration || 0);
  };

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <Button size="icon" onClick={toggle} className="h-9 w-9 rounded-full">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="flex flex-1 flex-col gap-1.5">
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-1 w-full accent-[var(--primary)]"
          aria-label="Seek"
        />
        <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
          <span>{formatDuration(time)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
      <Volume2 className="hidden h-4 w-4 text-muted-foreground md:block" />
    </div>
  );
}
