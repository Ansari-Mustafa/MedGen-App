"use client";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return undefined;
}

function extensionFor(mime: string | undefined): string {
  if (!mime) return "webm";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export interface RecorderResult {
  blob: Blob;
  durationS: number;
  mimeType: string;
  extension: string;
}

export class BrowserRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private accumulatedMs = 0;
  private mimeType: string | undefined;

  async start(): Promise<MediaStream> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("Audio recording is not supported in this browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;
    this.mimeType = pickMimeType();
    const recorder = this.mimeType
      ? new MediaRecorder(stream, { mimeType: this.mimeType })
      : new MediaRecorder(stream);
    this.recorder = recorder;
    this.chunks = [];
    this.accumulatedMs = 0;

    recorder.addEventListener("dataavailable", (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    });

    recorder.start(1000);
    this.startedAt = performance.now();
    return stream;
  }

  pause() {
    if (this.recorder?.state === "recording" && typeof this.recorder.pause === "function") {
      this.accumulatedMs += performance.now() - this.startedAt;
      this.recorder.pause();
    }
  }

  resume() {
    if (this.recorder?.state === "paused" && typeof this.recorder.resume === "function") {
      this.startedAt = performance.now();
      this.recorder.resume();
    }
  }

  async stop(): Promise<RecorderResult> {
    const recorder = this.recorder;
    if (!recorder) throw new Error("Recorder not initialised");

    const stoppedPromise = new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
    });

    if (recorder.state === "recording") {
      this.accumulatedMs += performance.now() - this.startedAt;
    }

    if (recorder.state !== "inactive") recorder.stop();
    await stoppedPromise;

    const mime = this.mimeType ?? recorder.mimeType ?? "audio/webm";
    const blob = new Blob(this.chunks, { type: mime });
    const durationS = Math.max(1, Math.round(this.accumulatedMs / 1000));

    this.releaseStream();
    this.recorder = null;
    this.chunks = [];

    return { blob, durationS, mimeType: mime, extension: extensionFor(mime) };
  }

  cancel() {
    try {
      if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    } catch {
      // ignore
    }
    this.releaseStream();
    this.recorder = null;
    this.chunks = [];
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  static supportsPause(): boolean {
    return (
      typeof MediaRecorder !== "undefined" &&
      typeof MediaRecorder.prototype.pause === "function" &&
      typeof MediaRecorder.prototype.resume === "function"
    );
  }

  static isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    );
  }

  private releaseStream() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}
