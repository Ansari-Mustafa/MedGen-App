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
    a: "Yes. Your Word file stays a Word file end-to-end. We never convert it to PDF, HTML, or anything else mid-process. Margins, headers, footers, table styles, signature blocks, and custom fonts come through untouched. The system only fills the parts you've marked as variable; the document structure is yours.",
  },
  {
    q: "Can I trust what the AI writes?",
    a: "The system only drafts from what your transcript actually contains. It doesn't fill space with invented detail. If a section's source is missing or unclear, you get a flag asking you to confirm rather than a fabrication. And every report passes through your review before it leaves the system. Doctor sign-off is non-negotiable.",
  },
  {
    q: "Is this only for medical-legal reports?",
    a: "No. The system works with any clinical report type: IME / medico-legal, psychiatric assessments, chronic-pain reviews, occupational health, and general clinic letters. It's driven by the template and past reports you upload, so the same engine adapts to whatever format you write in.",
  },
  {
    q: "Where is my data stored?",
    a: "Your audio, transcripts, and reports live in a region-locked database (EU/UK by default). Audio is encrypted at rest. Strict access controls ensure one doctor cannot see another's data. Audit logs record every read and write. We never train models on your data.",
  },
  {
    q: "What does onboarding involve?",
    a: "You upload two or three of your past reports. The system reads them to learn your structure, recurring phrases, and terminology preferences, then builds a template you can review. You see exactly what your generated reports will look like before approving anything. Total time: usually under an hour of your involvement.",
  },
  {
    q: "What happens to my voice and audio files?",
    a: "Audio is stored only as long as you need it for review. You can delete any session's audio and transcript at any time. We do not use audio to train models. The raw audio never leaves our infrastructure.",
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
