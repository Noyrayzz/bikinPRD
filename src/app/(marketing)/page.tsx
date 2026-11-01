import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { OutputPreview } from "@/components/marketing/OutputPreview";
import { ClosingCta } from "@/components/marketing/ClosingCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <OutputPreview />
      <ClosingCta />
    </>
  );
}
