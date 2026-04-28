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
    body: "The .docx file you authored in Word is the file we render. No format reconstruction, no PDF round-trips, no broken tables. Margins, headers, footers, signature blocks — all preserved.",
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
    title: "Structured, not free text",
    body: "Claude outputs JSON matching a Pydantic schema. Every field is validated before it touches your template. Missing data, wrong types, invented fields — caught before render.",
    visual: <SchemaVisual />,
  },
  {
    icon: Repeat,
    title: "A feedback loop that improves you",
    body: "Every edit you make is a correction pair we store: AI output vs your final. Your profile retunes itself over time. The more reports you sign, the closer the first draft gets.",
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
              Built around the way medical-legal reports actually work.
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
    <div className="font-mono text-[11.5px] leading-[1.7] text-text-muted bg-surface-2 hairline rounded-md p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-2 text-[10px] uppercase tracking-wider text-text-subtle">
        <span>template.docx</span>
        <span>preserved</span>
      </div>
      <div>
        <span className="text-text-subtle">// Your Word file</span>
      </div>
      <div className="mt-1 text-text">
        Patient Name: <span className="text-accent">{"{{ patient_name }}"}</span>
      </div>
      <div className="text-text">
        DOB: <span className="text-accent">{"{{ patient_dob }}"}</span>
      </div>
      <div className="text-text-subtle">{"{%p for item in findings %}"}</div>
      <div className="text-text pl-4">
        • <span className="text-accent">{"{{ item }}"}</span>
      </div>
      <div className="text-text-subtle">{"{%p endfor %}"}</div>
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

function SchemaVisual() {
  return (
    <div className="font-mono text-[11.5px] leading-relaxed text-text-muted bg-surface-2 hairline rounded-md p-4">
      <div className="text-text-subtle">// Validated before render</div>
      <div className="mt-1">
        <span className="text-text">presenting_complaint</span>
        <span className="text-text-subtle">: str</span>
      </div>
      <div>
        <span className="text-text">findings</span>
        <span className="text-text-subtle">: list[Finding]</span>
      </div>
      <div>
        <span className="text-text">recommendations</span>
        <span className="text-text-subtle">: list[str]</span>
      </div>
      <div className="mt-2 text-success">✓ schema valid · 12 fields</div>
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
