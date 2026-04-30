import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/ui/wordmark";

export function Footer() {
  return (
    <footer className="hairline-t py-14 bg-bg">
      <Container size="xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Wordmark />
            <p className="mt-4 text-[13.5px] text-text-muted max-w-sm leading-relaxed">
              AI-assisted clinical report writing. Built for doctors who can't
              afford to compromise on formatting, voice, or accuracy.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-6 text-[13.5px]">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-subtle font-mono mb-3">
                Product
              </div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#how-it-works"
                    className="text-text-muted hover:text-text transition-colors"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-text-muted hover:text-text transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#platforms"
                    className="text-text-muted hover:text-text transition-colors"
                  >
                    Platforms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-subtle font-mono mb-3">
                Company
              </div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#security"
                    className="text-text-muted hover:text-text transition-colors"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-text-muted hover:text-text transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@medgen.ai"
                    className="text-text-muted hover:text-text transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-subtle font-mono mb-3">
                Legal
              </div>
              <ul className="space-y-2">
                <li>
                  <span className="text-text-muted">Privacy (soon)</span>
                </li>
                <li>
                  <span className="text-text-muted">Terms (soon)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 hairline-t pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[12px] text-text-subtle">
          <div>
            © {new Date().getFullYear()}{" "}
            <a
              href="https://lv4ai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text transition-colors underline-offset-2 hover:underline"
            >
              Love-For-AI
            </a>
            . All rights reserved.
          </div>
          <div className="font-mono">Built carefully · for doctors</div>
        </div>
      </Container>
    </footer>
  );
}
