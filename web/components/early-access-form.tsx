"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { Reveal } from "@/components/motion/reveal";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function EarlyAccessForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "loading" });

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      practice: String(fd.get("practice") || "").trim(),
      role: String(fd.get("role") || "").trim(),
      reports_per_month: String(fd.get("reports_per_month") || "").trim(),
      pain_point: String(fd.get("pain_point") || "").trim(),
    };

    if (!payload.name || !payload.email) {
      setState({ kind: "error", message: "Name and email are required." });
      return;
    }

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setState({ kind: "success" });
        return;
      }

      // Treat duplicates as success, friendlier UX
      if (res.status === 409) {
        setState({ kind: "success" });
        return;
      }

      const data = await res.json().catch(() => ({}));
      setState({
        kind: "error",
        message:
          data?.detail ||
          data?.message ||
          "Something went wrong. Please try again or email mustafa@brade.ai.",
      });
    } catch {
      setState({
        kind: "error",
        message: "Network error. Please try again.",
      });
    }
  }

  const submitting = state.kind === "loading";

  return (
    <section
      id="early-access"
      className="relative py-28 sm:py-36 hairline-t bg-surface scroll-mt-20"
    >
      <Container size="md">
        <div className="grid gap-12 lg:grid-cols-5 items-start">
          {/* Left copy */}
          <div className="lg:col-span-2">
            <Reveal>
              <SectionEyebrow>Early access</SectionEyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 text-[34px] sm:text-[42px] leading-[1.05] tracking-[-0.025em] font-semibold text-text text-balance">
                We're letting in a small first cohort.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 text-[15.5px] leading-relaxed text-text-muted text-pretty">
                Tell us about your practice. We'll reply within a week. We're
                vetting carefully to make sure the first reports we generate
                live up to the standard your work demands.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 hairline-t pt-6 space-y-2.5 text-[13.5px] text-text-muted">
                <Bullet>You keep full control of every report.</Bullet>
                <Bullet>We work in your template, not ours.</Bullet>
                <Bullet>No data leaves the EU/UK by default.</Bullet>
              </div>
            </Reveal>
          </div>

          {/* Right form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-bg hairline p-6 sm:p-8 shadow-clinical relative overflow-hidden">
              <AnimatePresence mode="wait">
                {state.kind === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="py-10 text-center"
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <CheckCircle2 size={24} />
                    </div>
                    <h3 className="mt-5 text-[22px] font-semibold tracking-tight text-text">
                      You're on the list.
                    </h3>
                    <p className="mt-2 text-[14.5px] text-text-muted max-w-sm mx-auto">
                      We've got your details. We'll be in touch within a week
                      with next steps. Check your inbox for a confirmation in
                      the meantime.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={onSubmit}
                    className="space-y-4"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field>
                        <Label htmlFor="name">Full name</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Dr. Jane Smith"
                          required
                          disabled={submitting}
                        />
                      </Field>
                      <Field>
                        <Label htmlFor="email">Work email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="jane@yourpractice.co.uk"
                          required
                          disabled={submitting}
                        />
                      </Field>
                    </div>

                    <Field>
                      <Label htmlFor="practice">Practice or firm</Label>
                      <Input
                        id="practice"
                        name="practice"
                        type="text"
                        autoComplete="organization"
                        placeholder="Greenwood Clinic"
                        disabled={submitting}
                      />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          id="role"
                          name="role"
                          defaultValue=""
                          disabled={submitting}
                        >
                          <option value="" disabled>
                            Select a role
                          </option>
                          <option value="clinician">Doctor / clinician</option>
                          <option value="medical_legal_expert">
                            Medical-legal expert
                          </option>
                          <option value="agency">
                            Reporting agency / solicitor
                          </option>
                          <option value="other">Other</option>
                        </Select>
                      </Field>
                      <Field>
                        <Label htmlFor="reports_per_month">
                          Reports per month
                        </Label>
                        <Select
                          id="reports_per_month"
                          name="reports_per_month"
                          defaultValue=""
                          disabled={submitting}
                        >
                          <option value="" disabled>
                            Pick a range
                          </option>
                          <option value="1-10">1–10</option>
                          <option value="11-30">11–30</option>
                          <option value="31-60">31–60</option>
                          <option value="60+">60+</option>
                        </Select>
                      </Field>
                    </div>

                    <Field>
                      <Label htmlFor="pain_point">
                        What's the worst part of report writing for you?
                      </Label>
                      <Textarea
                        id="pain_point"
                        name="pain_point"
                        placeholder="The thing that, if it disappeared tomorrow, would change your week."
                        disabled={submitting}
                      />
                    </Field>

                    {state.kind === "error" && (
                      <div
                        role="alert"
                        className="text-[13px] text-text rounded-md px-3.5 py-2.5 border"
                        style={{
                          background: "color-mix(in oklch, #ef4444 10%, transparent)",
                          borderColor: "color-mix(in oklch, #ef4444 30%, transparent)",
                        }}
                      >
                        {state.message}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={submitting}
                      className="w-full sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          Request access
                          <ArrowRight size={16} />
                        </>
                      )}
                    </Button>

                    <p className="text-[12px] text-text-subtle pt-1">
                      By submitting, you agree to be contacted by MedGen about
                      your application. We don't share your details.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-[7px] h-1 w-1 rounded-full bg-accent" />
      <span>{children}</span>
    </div>
  );
}
