"use client";

import { motion, useReducedMotion } from "motion/react";
import { Mic, ArrowDown } from "lucide-react";

/**
 * Hero mockup. Communicates the product transformation in two halves:
 *
 *   1) Live audio capture strip (continuously-animating waveform + transcript line)
 *   2) Microsoft Word document page (paper-styled, serif, with letterhead, justified
 *      paragraphs, bullet list and page-number footer) showing the report being filled in.
 *
 * The Word page deliberately stays white in both light and dark modes. Paper is
 * paper. The surrounding chrome adapts to the theme.
 */
export function HeroMockup() {
  const reduced = useReducedMotion();
  const baseDelay = reduced ? 0 : 0.6;

  return (
    <div className="relative w-full">
      {/* Decorative blurred glow */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 opacity-50"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, rgba(59, 130, 246, 0.15), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="space-y-3"
      >
        <AudioStrip />
        <FlowConnector />
        <WordDocument baseDelay={baseDelay} />
      </motion.div>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Audio capture strip                                                */
/* ----------------------------------------------------------------- */

function AudioStrip() {
  return (
    <div className="rounded-xl bg-surface hairline shadow-clinical p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
        >
          <Mic size={15} />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-text">
            Live session · Ms. J. Doe
          </div>
          <div className="text-[11px] text-text-muted">
            Personal injury assessment
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-text-muted shrink-0">
          <span
            className="h-1.5 w-1.5 rounded-full dot-pulse"
            style={{ background: "#ef4444" }}
          />
          <span className="font-mono tabular-nums">14:32</span>
        </div>
      </div>

      <div className="mt-3.5">
        <LiveWaveform />
      </div>

      <div className="mt-3 text-[12px] leading-relaxed text-text-muted font-mono italic truncate">
        <span className="text-text-subtle not-italic">[14:02] Patient:</span>{" "}
        "...the pain started about three weeks after the accident…"
      </div>
    </div>
  );
}

/**
 * Continuously-animating waveform. Each bar runs an infinite sin-based
 * amplitude loop with a per-bar phase offset, producing a flowing effect.
 */
function LiveWaveform() {
  const reduced = useReducedMotion();
  const bars = 64;

  // Build per-bar keyframe arrays from a smoothed pseudo-random sequence.
  const tracks = Array.from({ length: bars }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const r = seed / 233280;
    const peak = 0.55 + r * 0.4;     // unique max amplitude per bar
    const trough = 0.18 + r * 0.15;  // unique min
    return [trough, peak, trough * 1.4, peak * 0.8, trough, peak * 0.95, trough * 1.2];
  });

  if (reduced) {
    // Static, accessible fallback
    return (
      <div className="flex items-center gap-[2px] h-9" aria-hidden>
        {tracks.map((t, i) => (
          <span
            key={i}
            className="block w-[2px] rounded-full bg-accent"
            style={{ height: `${Math.round(t[1] * 100)}%`, opacity: 0.7 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[2px] h-9" aria-hidden>
      {tracks.map((track, i) => (
        <motion.span
          key={i}
          className="block w-[2px] rounded-full bg-accent origin-center"
          style={{ height: "100%" }}
          animate={{ scaleY: track }}
          transition={{
            duration: 1.4 + (i % 7) * 0.12,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: (i * 0.035) % 1.6,
          }}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Flow connector: shows audio to document                            */
/* ----------------------------------------------------------------- */

function FlowConnector() {
  const reduced = useReducedMotion();
  return (
    <div className="flex items-center gap-3 px-2 py-1" aria-hidden>
      <div className="h-px flex-1 bg-border" />
      <motion.div
        animate={
          reduced
            ? { y: 0, opacity: 0.6 }
            : { y: [0, 3, 0], opacity: [0.5, 1, 0.5] }
        }
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
        }
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-text-subtle font-mono"
      >
        <ArrowDown size={11} className="text-accent" />
        <span>Generating</span>
      </motion.div>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Word document page                                                 */
/* ----------------------------------------------------------------- */

function WordDocument({ baseDelay }: { baseDelay: number }) {
  return (
    <div className="relative">
      {/* Stacked-pages illusion behind */}
      <div
        aria-hidden
        className="absolute inset-x-2 -bottom-1.5 h-3 rounded-b-md bg-white/70 hairline shadow-sm"
        style={{ borderColor: "#e5e5e5" }}
      />
      <div
        aria-hidden
        className="absolute inset-x-1 -bottom-[3px] h-2 rounded-b-md bg-white/85 hairline shadow-sm"
        style={{ borderColor: "#e5e5e5" }}
      />

      {/* The page itself */}
      <div
        className="relative rounded-md overflow-hidden shadow-clinical-lg"
        style={{ background: "#ffffff", color: "#1a1a1a", border: "1px solid #e5e5e5" }}
      >
        {/* Word-style chrome */}
        <div
          className="flex items-center gap-2.5 px-4 py-2 border-b"
          style={{ background: "#f3f3f3", borderColor: "#e0e0e0" }}
        >
          <WordIcon />
          <div className="text-[11px]" style={{ color: "#444" }}>
            <span className="font-medium">report-2024-1847.docx</span>
            <span style={{ color: "#888" }}> · Word</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: "#666" }}>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#22c55e" }}
            />
            <span>Saved</span>
          </div>
        </div>

        {/* Ruler */}
        <div
          className="h-3 border-b flex items-center"
          style={{ background: "#fafafa", borderColor: "#eaeaea" }}
          aria-hidden
        >
          <div className="flex-1 flex items-center justify-evenly text-[7px]" style={{ color: "#aaa" }}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <span key={n}>|</span>
            ))}
          </div>
        </div>

        {/* Page body, paper */}
        <div
          className="px-7 sm:px-10 py-7 sm:py-8 space-y-4"
          style={{
            fontFamily:
              "'Times New Roman', Times, ui-serif, Georgia, serif",
            color: "#1a1a1a",
          }}
        >
          {/* Letterhead */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: baseDelay }}
            className="text-center pb-3 border-b"
            style={{ borderColor: "#e5e5e5" }}
          >
            <div
              className="text-[11px] uppercase tracking-[0.22em]"
              style={{ color: "#555", fontFamily: "var(--font-sans)" }}
            >
              Khan Medico-Legal Associates
            </div>
            <div className="text-[9.5px] mt-0.5" style={{ color: "#888", fontFamily: "var(--font-sans)" }}>
              14 Bedford Square · London WC1B 3RA · MK / 8842
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: baseDelay + 0.15 }}
            className="text-center font-bold tracking-wider"
            style={{ fontSize: "13.5px", letterSpacing: "0.18em", color: "#1a1a1a" }}
          >
            INDEPENDENT MEDICAL REPORT
          </motion.h2>

          {/* Demographics: two-column key/value rows */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12px] pt-1">
            <DocField label="Patient" value="Jane Doe" delay={baseDelay + 0.25} />
            <DocField label="DOB" value="14 March 1987" delay={baseDelay + 0.35} />
            <DocField label="Date of Session" value="22 April 2026" delay={baseDelay + 0.45} />
            <DocField label="Referrer" value="Bedford Solicitors" delay={baseDelay + 0.55} />
          </div>

          {/* Section heading + justified paragraph */}
          <div className="pt-2">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: baseDelay + 0.7 }}
              className="font-bold mb-1.5"
              style={{ fontSize: "12.5px", color: "#1a1a1a" }}
            >
              1. Presenting Complaint
            </motion.h3>
            <DocParagraph
              delay={baseDelay + 0.85}
              text="Ms. Doe presents with persistent lower back pain, radiating to the right leg, with onset approximately three weeks following the index incident. She reports that the pain is exacerbated on standing and during prolonged ambulation."
            />
          </div>

          {/* Bullet list */}
          <div className="pt-1">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: baseDelay + 2.0 }}
              className="font-bold mb-1.5"
              style={{ fontSize: "12.5px", color: "#1a1a1a" }}
            >
              2. Clinical Observations
            </motion.h3>
            <ul className="space-y-1 text-[12px]" style={{ color: "#1a1a1a" }}>
              {[
                "Reduced lumbar flexion noted bilaterally.",
                "Tenderness on palpation, L4–L5.",
                "Straight leg raise positive at 45 degrees.",
              ].map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: baseDelay + 2.15 + i * 0.18,
                  }}
                  className="flex gap-2.5 pl-2"
                >
                  <span style={{ color: "#1a1a1a" }} className="mt-[1px]">•</span>
                  <span className="flex-1">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Page footer */}
        <div
          className="px-7 sm:px-10 py-2 border-t flex items-center justify-between text-[10px]"
          style={{ background: "#fafafa", borderColor: "#eaeaea", color: "#888", fontFamily: "var(--font-sans)" }}
        >
          <span>Khan, M. · IMR · Doe, J.</span>
          <span>Page 1 of 4</span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/* Helpers                                                            */
/* ----------------------------------------------------------------- */

function WordIcon() {
  // A tasteful blue rounded square with a stylized "W". Communicates
  // "Word document" without being a literal copy of Microsoft's logo.
  return (
    <span
      className="flex items-center justify-center rounded-[3px] shrink-0"
      style={{
        height: 16,
        width: 16,
        background: "linear-gradient(135deg, #2b579a 0%, #1e3f6f 100%)",
        color: "#fff",
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "-0.05em",
        fontFamily: "var(--font-sans)",
        lineHeight: 1,
      }}
      aria-hidden
    >
      W
    </span>
  );
}

function DocField({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay: number;
}) {
  const placeholder = `{{${value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z_]/g, "")}}}`;

  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span style={{ color: "#444", fontWeight: 600 }} className="shrink-0">
        {label}:
      </span>
      <span className="relative flex-1 truncate min-h-[1em]">
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.25, delay: delay + 0.35 }}
          className="absolute inset-0 font-mono text-[11px]"
          style={{ color: "#aaa", fontFamily: "var(--font-mono)" }}
        >
          {placeholder}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.5 }}
          style={{ color: "#1a1a1a" }}
        >
          {value}
        </motion.span>
      </span>
    </div>
  );
}

function DocParagraph({ text, delay }: { text: string; delay: number }) {
  const words = text.split(" ");
  return (
    <p
      className="leading-relaxed"
      style={{
        textAlign: "justify",
        textIndent: "1.25em",
        fontSize: "12px",
        color: "#1a1a1a",
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.18,
            delay: delay + i * 0.022,
          }}
          className="inline-block"
        >
          {word}
          {i < words.length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </p>
  );
}
