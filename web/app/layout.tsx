import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedGen — Medical-legal reports in your words",
  description:
    "Record your session. MedGen produces a fully formatted medical-legal report in your template, in your style. You review and sign. Invite-only.",
  keywords: [
    "medical-legal reports",
    "AI medical reports",
    "doctor report writing",
    "medico-legal",
    "psychiatric reports",
    "report automation",
  ],
  authors: [{ name: "MedGen" }],
  openGraph: {
    title: "MedGen — Reports in your words. Without writing them.",
    description:
      "AI-assisted medical-legal report generation that preserves your template, your writing voice, and your final say.",
    type: "website",
    siteName: "MedGen",
  },
  twitter: {
    card: "summary_large_image",
    title: "MedGen — Reports in your words. Without writing them.",
    description:
      "AI-assisted medical-legal report generation that preserves your template, your writing voice, and your final say.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
