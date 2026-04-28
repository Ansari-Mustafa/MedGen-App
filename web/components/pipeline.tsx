"use client";

import { motion } from "motion/react";
import { Mic, Waves, Sparkles, FileCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { Reveal } from "@/components/motion/reveal";
import { VIEWPORT_ONCE } from "@/lib/motion";

const steps = [
  {
    n: "01",
    icon: Mic,
    title: "Record",
    body: "Phone, web, or upload. Live or post-session. Audio is stored before any processing — nothing gets lost on a flaky connection.",
  },
  {
    n: "02",
    icon: Waves,
    title: "Transcribe",
    body: "Medical-grade STT with speaker diarization. Doctor and patient are separated. Clinical vocabulary, drug names, and timestamps preserved.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Generate",
    body: "Claude produces structured JSON validated against your Pydantic schema. Every field is checked before render. Hallucinations get caught.",
  },
  {
    n: "04",
    icon: FileCheck,
    title: "Render & Review",
    body: "Your .docx template renders untouched — every margin, font, and table style intact. You review, edit, sign.",
  },
];

export function Pipeline() {
  return (
    <section id="how-it-works" className="relative py-28 sm:py-36">
      <Container size="xl">
        <div className="max-w-2xl">
          <Reveal>
            <SectionEyebrow>How it works</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-[36px] sm:text-[44px] leading-[1.05] tracking-[-0.025em] font-semibold text-text text-balance">
              Audio in. Court-ready report out.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-[16.5px] leading-relaxed text-text-muted text-pretty">
              Four steps. The AI never touches your document. It produces
              structured data; your template handles formatting.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 sm:mt-20">
          {/* Connecting line */}
          <div className="relative">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="hidden lg:block absolute top-7 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-border-strong to-transparent origin-left"
              aria-hidden
            />

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT_ONCE}
                    transition={{
                      duration: 0.5,
                      delay: 0.15 + i * 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative flex flex-col"
                  >
                    {/* Numbered badge with icon */}
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-surface hairline transition-all duration-200 group-hover:border-border-strong">
                      <Icon
                        size={20}
                        className="text-accent transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>

                    <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-text-subtle">
                      Step {step.n}
                    </div>
                    <h3 className="mt-1.5 text-[20px] font-semibold tracking-tight text-text">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 text-[14.5px] leading-relaxed text-text-muted">
                      {step.body}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
