"use client";

import { motion } from "motion/react";
import { Container } from "@/components/ui/container";
import { stagger, fadeInUp, VIEWPORT_ONCE } from "@/lib/motion";

const stats = [
  {
    figure: "8 hrs",
    suffix: "/ week",
    body: "Average time doctors spend writing reports. Time stolen from clinical work and family.",
  },
  {
    figure: "100%",
    suffix: "format risk",
    body: "Generic dictation tools strip the formatting that took years to refine. One stray paragraph break ruins a finished document.",
  },
  {
    figure: "0%",
    suffix: "tolerance",
    body: "Off-the-shelf AI invents clinical detail to fill space. In a clinical report, an invented fact is a liability, not a quirk.",
  },
];

export function Problem() {
  return (
    <section className="relative py-24 sm:py-28 hairline-t hairline-b bg-surface">
      <Container size="xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          variants={stagger}
          className="grid gap-10 sm:gap-x-10 sm:gap-y-12 md:grid-cols-3"
        >
          {stats.map((s) => (
            <motion.div key={s.figure} variants={fadeInUp} className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-[44px] sm:text-[52px] leading-none font-semibold tracking-[-0.03em] text-text">
                  {s.figure}
                </span>
                <span className="text-[13px] uppercase tracking-wider text-text-subtle font-mono">
                  {s.suffix}
                </span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-text-muted max-w-[26rem]">
                {s.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
