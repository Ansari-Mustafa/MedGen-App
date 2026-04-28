"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { Reveal } from "@/components/motion/reveal";

const items = [
  {
    q: "Will my report formatting actually survive?",
    a: "Yes. Your .docx file stays a .docx file end-to-end — we never convert it to PDF, HTML, or anything else mid-pipeline. Margins, headers, footers, table styles, signature blocks, and even custom fonts come through untouched. The AI only fills placeholder fields; the document structure is yours.",
  },
  {
    q: "What stops the AI from hallucinating clinical content?",
    a: "Two layers. First, the AI is constrained to producing JSON that matches your Pydantic schema — it cannot write free text into the document. Second, every output passes through validation before render: missing fields, wrong types, or fabricated structure get caught and rejected. And then a doctor still reviews every report before it leaves the system.",
  },
  {
    q: "Where is my data stored?",
    a: "Your audio, transcripts, and reports live in a region-locked Postgres database (EU/UK by default). Audio is encrypted at rest. Row-level security ensures one doctor cannot see another doctor's data. Audit logs record every read and write. We never train models on your data.",
  },
  {
    q: "What does onboarding involve?",
    a: "You upload two or three of your past reports as .docx. Our system analyses them to learn your structure, recurring phrases, and terminology preferences, then builds a Jinja2-based template you can review. You see exactly what your generated reports will look like before approving the template. Total time: usually under an hour of your involvement.",
  },
  {
    q: "What happens to my voice and audio files?",
    a: "Audio is stored only as long as you need it for review. You can delete any session's audio and transcript at any time. We do not use audio for training. Speaker diarization runs server-side and the raw audio never leaves our infrastructure.",
  },
  {
    q: "Pricing?",
    a: "We're letting in a small first cohort right now and pricing will be set with them. Expect a per-doctor monthly subscription plus a usage component. If you're a fit and we're a fit, we'll work something out.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-28 sm:py-36">
      <Container size="md">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <SectionEyebrow className="justify-center">Questions</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-[36px] sm:text-[44px] leading-[1.05] tracking-[-0.025em] font-semibold text-text text-balance">
              Things doctors actually ask us.
            </h2>
          </Reveal>
        </div>

        <div className="mt-16 hairline-t">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="hairline-b">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-6 py-6 text-left group"
                  aria-expanded={isOpen}
                >
                  <span className="text-[17px] font-medium tracking-tight text-text group-hover:text-accent transition-colors">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="shrink-0 mt-1 flex h-7 w-7 items-center justify-center rounded-full hairline text-text-muted"
                  >
                    <Plus size={14} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 pr-12 text-[15px] leading-relaxed text-text-muted text-pretty">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
