"use client";

import { motion } from "motion/react";
import { FileType2, Mic2, ShieldCheck, Repeat } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { Reveal } from "@/components/motion/reveal";
import { VIEWPORT_ONCE } from "@/lib/motion";

const features = [
  {
    icon: FileType2,
    title: "Your template, byte-for-byte",
    body: "The Word file you authored is the file we render. No format reconstruction, no PDF round-trips, no broken tables. Margins, headers, footers, signature blocks, all preserved.",
    visual: <TemplateVisual />,
  },
  {
    icon: Mic2,
    title: "Your writing voice",
    body: "Onboarding ingests two or three of your past reports. We learn your recurring phrases, your terminology preferences, your length tendency, your bullet style. Reports come out reading like you wrote them.",
    visual: <VoiceVisual />,
  },
  {
    icon: ShieldCheck,
    title: "Grounded in what was said",
    body: "Reports are drafted only from what your transcript actually contains. Missing or unclear sections get flagged for you to fill in. Never invented to fill space.",
    visual: <GroundedVisual />,
  },
  {
    icon: Repeat,
    title: "Gets better the more you use it",
    body: "Every edit you make teaches the system how you'd have written it. Over time the first draft lands closer to your final. Less editing, faster turnaround.",
    visual: <FeedbackVisual />,
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-28 sm:py-36 hairline-t bg-surface">
      <Container size="xl">
        <div className="max-w-2xl">
          <Reveal>
            <SectionEyebrow>Why MedGen is different</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-[36px] sm:text-[44px] leading-[1.05] tracking-[-0.025em] font-semibold text-text text-balance">
              Built around the way you actually write reports.
            </h2>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_ONCE}
                transition={{
                  duration: 0.5,
                  delay: 0.1 + (i % 2) * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group relative rounded-xl bg-bg hairline p-7 sm:p-8 transition-all duration-200 hover:border-border-strong hover:-translate-y-px hover:shadow-clinical"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon size={18} />
                </div>
                <h3 className="mt-5 text-[19px] font-semibold tracking-tight text-text">
                  {f.title}
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-text-muted">
                  {f.body}
                </p>
                <div className="mt-6 hairline-t pt-5">{f.visual}</div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function TemplateVisual() {
  return (
    <div className="text-[12px] leading-[1.8] text-text bg-surface-2 hairline rounded-md p-4 overflow-hidden" style={{ fontFamily: "'Times New Roman', Times, ui-serif, serif" }}>
      <div className="flex justify-between items-center mb-2 text-[10px] uppercase tracking-wider text-text-subtle font-mono">
        <span>your-template.docx</span>
        <span>preserved</span>
      </div>
      <div>
        <span className="font-semibold">Patient Name:</span>{" "}
        <span className="text-accent">Jane Doe</span>
      </div>
      <div>
        <span className="font-semibold">DOB:</span>{" "}
        <span className="text-accent">14 March 1987</span>
      </div>
      <div className="mt-1 font-semibold">Findings:</div>
      <div className="pl-3 text-text">• Tenderness on palpation, L4–L5</div>
      <div className="pl-3 text-text">• Reduced lumbar flexion bilaterally</div>
    </div>
  );
}

function VoiceVisual() {
  const phrases = [
    "On the balance of probabilities…",
    "It is this clinician's opinion that…",
    "More likely than not, the symptoms…",
  ];
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-text-subtle font-mono">
        Recurring phrases learned
      </div>
      {phrases.map((p) => (
        <div
          key={p}
          className="flex items-center gap-2.5 text-[13px] text-text"
        >
          <span className="text-accent text-[10px]">▸</span>
          <span className="italic">"{p}"</span>
        </div>
      ))}
    </div>
  );
}

function GroundedVisual() {
  return (
    <div className="space-y-2 text-[13px] text-text">
      <div className="flex items-start gap-2.5">
        <span className="mt-[3px] text-success font-bold">✓</span>
        <span>
          <span className="font-medium">Onset of symptoms</span>{" "}
          <span className="text-text-muted">· sourced from 02:14</span>
        </span>
      </div>
      <div className="flex items-start gap-2.5">
        <span className="mt-[3px] text-success font-bold">✓</span>
        <span>
          <span className="font-medium">Examination findings</span>{" "}
          <span className="text-text-muted">· sourced from 11:42</span>
        </span>
      </div>
      <div className="flex items-start gap-2.5">
        <span className="mt-[3px] text-warning font-bold" style={{ color: "#d97706" }}>
          !
        </span>
        <span>
          <span className="font-medium">Date of last MRI</span>{" "}
          <span className="text-text-muted">· not mentioned, please confirm</span>
        </span>
      </div>
    </div>
  );
}

function FeedbackVisual() {
  return (
    <div className="space-y-2.5">
      <div className="text-[10px] uppercase tracking-wider text-text-subtle font-mono">
        Last 7 days
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {[0.4, 0.6, 0.5, 0.75, 0.7, 0.85, 0.92].map((v, i) => (
          <div key={i} className="flex flex-col items-stretch gap-1">
            <div className="h-12 flex items-end">
              <div
                className="w-full rounded-sm bg-accent/80"
                style={{ height: `${v * 100}%` }}
              />
            </div>
            <div className="text-[9px] text-center text-text-subtle font-mono">
              {["M", "T", "W", "T", "F", "S", "S"][i]}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[12px] text-text-muted">
        Edit volume{" "}
        <span className="text-success font-medium">↓ 38%</span> over 30 days.
      </div>
    </div>
  );
}
