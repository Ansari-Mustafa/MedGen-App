"use client";

import { motion } from "motion/react";
import { Mic, Pencil, Phone, Monitor, Headphones } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { Reveal } from "@/components/motion/reveal";
import { VIEWPORT_ONCE } from "@/lib/motion";

export function Platforms() {
  return (
    <section id="platforms" className="relative py-28 sm:py-36">
      <Container size="xl">
        <div className="max-w-2xl">
          <Reveal>
            <SectionEyebrow>Two surfaces</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-[36px] sm:text-[44px] leading-[1.05] tracking-[-0.025em] font-semibold text-text text-balance">
              In your pocket. On your desk.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-[16.5px] leading-relaxed text-text-muted">
              Record where the work happens. Review where the screen is bigger.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-5 lg:gap-6">
          {/* Mobile card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2 group relative rounded-2xl bg-surface hairline p-7 sm:p-8 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-wider font-medium text-text-muted">
              <Phone size={12} /> Mobile · iOS & Android
            </div>
            <h3 className="mt-3 text-[22px] font-semibold tracking-tight text-text">
              Record from anywhere.
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-text-muted">
              Live recording in clinic, between sessions, in the car park.
              Chunked uploads survive flaky connections — nothing gets lost.
            </p>

            <div className="mt-8 flex justify-center">
              <PhoneMockup />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <StoreBadge label="App Store" caption="iOS" />
              <StoreBadge label="Google Play" caption="Android" />
            </div>
          </motion.div>

          {/* Web card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{
              duration: 0.5,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="lg:col-span-3 group relative rounded-2xl bg-surface hairline p-7 sm:p-8 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-wider font-medium text-text-muted">
              <Monitor size={12} /> Web · app.medgen.ai
            </div>
            <h3 className="mt-3 text-[22px] font-semibold tracking-tight text-text">
              Review at your desk.
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-text-muted max-w-md">
              Side-by-side transcript and report. Edit in-place or download the
              .docx. Approve, sign, and send — all from one screen.
            </p>

            <div className="mt-8">
              <DesktopMockup />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative w-[200px] h-[400px] rounded-[36px] hairline bg-bg p-2 shadow-clinical-lg">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-20 rounded-full bg-text/90 z-10" />
      <div className="h-full w-full rounded-[28px] bg-surface-2 overflow-hidden flex flex-col">
        {/* Status bar */}
        <div className="h-9 flex items-end justify-between px-5 pb-1.5 text-[10px] font-medium text-text">
          <span>9:41</span>
          <span className="font-mono">•••</span>
        </div>

        {/* App content */}
        <div className="flex-1 px-4 pb-4 flex flex-col">
          <div className="text-[10px] uppercase tracking-wider text-text-subtle font-mono mt-1">
            Recording
          </div>
          <div className="text-[15px] font-semibold text-text mt-1">
            Ms. J. Doe
          </div>
          <div className="text-[10.5px] text-text-muted">
            Personal injury · 22 Apr
          </div>

          {/* Live waveform */}
          <div className="mt-4 flex-1 flex items-center justify-center">
            <div className="flex items-center gap-[2.5px] h-12">
              {Array.from({ length: 28 }).map((_, i) => {
                const seed = (i * 9301 + 49297) % 233280;
                const h = 0.2 + (seed / 233280) * 0.8;
                return (
                  <motion.span
                    key={i}
                    className="w-[2px] rounded-full bg-accent origin-center"
                    initial={{ scaleY: 0.2 }}
                    animate={{ scaleY: [0.2, h, 0.4, h * 0.7, 0.3] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      delay: i * 0.04,
                      ease: "easeInOut",
                    }}
                    style={{ height: "100%" }}
                  />
                );
              })}
            </div>
          </div>

          {/* Time */}
          <div className="font-mono text-[18px] tabular-nums text-text text-center">
            14:32
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-[10.5px] text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-error dot-pulse" style={{ background: "#ef4444" }} />
            Live · diarizing
          </div>

          {/* Stop button */}
          <div className="mt-5 flex justify-center">
            <div className="h-12 w-12 rounded-full bg-text flex items-center justify-center">
              <span className="block h-3.5 w-3.5 rounded-sm bg-bg" />
            </div>
          </div>
          <div className="mt-2 text-[10px] text-center text-text-subtle">
            Tap to stop & process
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopMockup() {
  return (
    <div className="rounded-lg hairline bg-bg shadow-clinical-lg overflow-hidden">
      {/* Browser chrome */}
      <div className="h-8 hairline-b bg-surface-2/50 flex items-center px-3 gap-2">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-border-strong" />
          <span className="h-2 w-2 rounded-full bg-border-strong" />
          <span className="h-2 w-2 rounded-full bg-border-strong" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="text-[10px] font-mono text-text-subtle px-2 py-0.5 rounded bg-bg hairline">
            app.medgen.ai/reports/8842
          </div>
        </div>
      </div>

      {/* App body — split */}
      <div className="grid grid-cols-2 min-h-[260px]">
        {/* Transcript pane */}
        <div className="border-r border-border p-4 bg-surface-2/30">
          <div className="flex items-center gap-2 mb-3 text-[10.5px] uppercase tracking-wider text-text-subtle font-mono">
            <Headphones size={10} /> Transcript
          </div>
          <div className="space-y-2 text-[11.5px] leading-relaxed">
            <div>
              <span className="text-accent font-medium">Dr. Khan:</span>{" "}
              <span className="text-text-muted">
                Tell me about the pain — when did it start?
              </span>
            </div>
            <div>
              <span className="font-medium text-text">Patient:</span>{" "}
              <span className="text-text-muted">
                About three weeks after the accident, in the lower back…
              </span>
            </div>
            <div>
              <span className="text-accent font-medium">Dr. Khan:</span>{" "}
              <span className="text-text-muted">
                Does it radiate anywhere?
              </span>
            </div>
            <div>
              <span className="font-medium text-text">Patient:</span>{" "}
              <span className="text-text-muted">
                Down the right leg, mostly when I stand…
              </span>
            </div>
          </div>
        </div>

        {/* Report pane */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3 text-[10.5px] uppercase tracking-wider text-text-subtle font-mono">
            <Pencil size={10} /> Draft report
          </div>
          <div className="space-y-2 text-[11.5px] leading-relaxed text-text">
            <div className="font-semibold text-[12px]">Presenting Complaint</div>
            <div className="text-text-muted">
              Ms. Doe reports lower back pain with onset approximately three
              weeks following the index incident, with radiation down the right
              leg.
            </div>
            <div className="font-semibold text-[12px] mt-3">Findings</div>
            <ul className="text-text-muted space-y-1">
              <li>· Tenderness on palpation, L4–L5</li>
              <li>· Reduced lumbar flexion bilaterally</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="hairline-t px-4 py-2.5 flex items-center justify-between bg-surface">
        <div className="flex items-center gap-2 text-[10.5px] text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Saved · auto-validated
        </div>
        <div className="flex gap-2">
          <span className="text-[10.5px] text-text-muted px-2 py-1 hairline rounded">
            Download .docx
          </span>
          <span className="text-[10.5px] text-bg bg-text px-2.5 py-1 rounded">
            Approve & sign
          </span>
        </div>
      </div>
    </div>
  );
}

function StoreBadge({ label, caption }: { label: string; caption: string }) {
  return (
    <div className="flex items-center gap-2 hairline rounded-md px-3 py-2 bg-bg">
      <Mic size={14} className="text-text-muted" />
      <div className="leading-tight">
        <div className="text-[9.5px] uppercase tracking-wider text-text-subtle font-mono">
          Coming soon · {caption}
        </div>
        <div className="text-[12.5px] font-medium text-text">{label}</div>
      </div>
    </div>
  );
}
