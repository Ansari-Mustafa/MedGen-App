"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/motion/reveal";
import { VIEWPORT_ONCE } from "@/lib/motion";

/**
 * Silent autoplay product demo. Video plays/pauses based on viewport
 * intersection so we don't burn bandwidth or CPU when off-screen.
 */
export function Showcase() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.play().catch(() => {
            /* autoplay may be blocked; that's fine */
          });
        } else {
          v.pause();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <section id="demo" className="relative py-24 sm:py-32">
      <Container size="xl">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center text-[12px] font-medium uppercase tracking-[0.14em] text-text-muted">
              See how it works
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-4 text-[16.5px] leading-relaxed text-text-muted text-pretty">
              Record. Transcribe. Generate. Review. From audio to a finished
              report in your template, your style.
            </p>
          </Reveal>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 sm:mt-16 mx-auto max-w-5xl"
        >
          {/* Decorative blurred glow underneath */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 -z-10 w-[80%] max-w-3xl h-32 mt-32 opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 50%, rgba(59,130,246,0.35), transparent 70%)",
            }}
          />

          <div className="relative rounded-xl bg-surface hairline shadow-clinical-lg overflow-hidden">
            {/* Browser chrome */}
            <div className="hairline-b px-4 py-2.5 bg-surface-2/50 flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="text-[11px] font-mono text-text-subtle px-2.5 py-1 rounded bg-bg hairline">
                  app.medgen.ai
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10.5px] text-text-subtle">
                <span className="h-1.5 w-1.5 rounded-full bg-success dot-pulse" />
                Live
              </div>
            </div>

            {/* Video */}
            <video
              ref={videoRef}
              className="block w-full h-auto bg-black"
              src="/promo.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-label="Silent screen recording showing MedGen turning a recorded session into a finished report"
            />
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
