"use client";

import { Lock, UserCheck, Globe2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { Reveal } from "@/components/motion/reveal";

const pillars = [
  {
    icon: Lock,
    title: "Your data, your tenancy",
    body: "Postgres with row-level security. Doctor-scoped audit logs on every mutation. Audio is encrypted at rest. We never train on your data.",
  },
  {
    icon: UserCheck,
    title: "Doctor sign-off, every report",
    body: "No auto-send. No background filing. Every report sits in your queue until you read it, edit it, and approve it. Non-negotiable, by design.",
  },
  {
    icon: Globe2,
    title: "EU/UK-aligned by default",
    body: "Data stored in-region. Processing logs retained for compliance. Built around the principle that medico-legal evidence must be defensible end-to-end.",
  },
];

export function Trust() {
  return (
    <section id="security" className="relative py-28 sm:py-36 hairline-t bg-surface">
      <Container size="xl">
        <div className="max-w-2xl">
          <Reveal>
            <SectionEyebrow>Built for the bar</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-[36px] sm:text-[44px] leading-[1.05] tracking-[-0.025em] font-semibold text-text text-balance">
              Trustworthy at the level a courtroom expects.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-[16.5px] leading-relaxed text-text-muted text-pretty">
              Medico-legal reports are evidence. We treat them that way — with
              audit trails, human approval, and data handling that meets your
              regulator's bar.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="rounded-xl bg-bg hairline p-7 h-full transition-colors duration-200 hover:border-border-strong">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-5 text-[18px] font-semibold tracking-tight text-text">
                    {p.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-text-muted">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
