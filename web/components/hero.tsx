"use client";

import { motion } from "motion/react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroMockup } from "@/components/hero-mockup";
import { stagger, wordReveal } from "@/lib/motion";

const headline = ["Reports", "in", "your", "words.", "Without", "writing", "them."];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 sm:pt-20 pb-24 sm:pb-32">
      {/* Background dotted grid */}
      <div
        className="absolute inset-0 grid-backdrop opacity-60 -z-10"
        aria-hidden
      />
      {/* Top gradient fade */}
      <div
        className="absolute inset-x-0 top-0 h-[420px] -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, var(--accent-soft), transparent 65%)",
          opacity: 0.6,
        }}
      />

      <Container size="xl">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-6 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full hairline bg-surface px-3 py-1 text-[12px] font-medium"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success dot-pulse" />
              <span className="text-text-muted">
                Invite-only · For medical-legal practitioners
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="mt-6 text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.02] tracking-[-0.03em] font-semibold text-text text-balance"
            >
              {headline.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  variants={wordReveal}
                  className="inline-block mr-[0.22em]"
                >
                  {/* Emphasize "your" with the accent */}
                  {word === "your" ? (
                    <span className="text-accent">{word}</span>
                  ) : (
                    word
                  )}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-6 text-[17px] sm:text-[18px] leading-relaxed text-text-muted text-pretty max-w-[34rem]"
            >
              MedGen records your session, transcribes it, and produces a fully
              formatted report in your template, in your style. The AI never
              touches free text. <span className="text-text">You review and sign.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  document
                    .getElementById("early-access")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Request Early Access
                <ArrowRight size={16} />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                See how it works
                <ArrowDown size={16} />
              </Button>
            </motion.div>

            {/* Trust micro-line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.05 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-text-subtle"
            >
              <span>· Word template stays Word, end-to-end</span>
              <span>· Doctor sign-off required on every report</span>
            </motion.div>
          </div>

          {/* Right: mockup */}
          <div className="lg:col-span-6">
            <HeroMockup />
          </div>
        </div>
      </Container>
    </section>
  );
}
