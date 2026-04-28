"use client";

import { motion, type Variants } from "motion/react";
import { fadeInUp, VIEWPORT_ONCE } from "@/lib/motion";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
  variants = fadeInUp,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variants?: Variants;
  as?: "div" | "section" | "li" | "span" | "h1" | "h2" | "h3" | "p";
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
