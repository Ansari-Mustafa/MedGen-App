"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/cn";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#demo", label: "Demo" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#platforms", label: "Platforms" },
  { href: "#security", label: "Security" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-bg/70 backdrop-blur-xl hairline-b"
          : "bg-transparent border-transparent",
      )}
    >
      <Container size="xl">
        <div className="flex h-16 items-center justify-between">
          <a
            href="#"
            className="flex items-center"
            aria-label="MedGen home"
          >
            <Wordmark />
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-[13.5px] text-text-muted hover:text-text transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                document.getElementById("early-access")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden sm:inline-flex"
            >
              Request Early Access
            </Button>
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-surface-2 text-text"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden hairline-t bg-bg overflow-hidden"
          >
            <Container size="xl">
              <nav className="flex flex-col py-3">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="py-2.5 text-[14px] text-text-muted hover:text-text"
                  >
                    {link.label}
                  </a>
                ))}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setOpen(false);
                    document.getElementById("early-access")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-3 sm:hidden"
                >
                  Request Early Access
                </Button>
              </nav>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
