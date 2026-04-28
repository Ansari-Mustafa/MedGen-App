import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Problem } from "@/components/problem";
import { Pipeline } from "@/components/pipeline";
import { Features } from "@/components/features";
import { Platforms } from "@/components/platforms";
import { Trust } from "@/components/trust";
import { FAQ } from "@/components/faq";
import { EarlyAccessForm } from "@/components/early-access-form";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Pipeline />
        <Features />
        <Platforms />
        <Trust />
        <FAQ />
        <EarlyAccessForm />
      </main>
      <Footer />
    </>
  );
}
