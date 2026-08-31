import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { ShiftSection } from '@/components/landing/ShiftSection';
import { PillarsSection } from '@/components/landing/PillarsSection';
import { OpenTabStory } from '@/components/landing/OpenTabStory';
import { FlowSection } from '@/components/landing/FlowSection';
import { DevelopersSection, SecuritySection, AboutSection } from '@/components/landing/DevelopersSecurityAbout';
import { CTAFooter } from '@/components/landing/CTAFooter';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-ink-950">
      <LandingNav />
      <main>
        <Hero />
        <ShiftSection />
        <PillarsSection />
        <OpenTabStory />
        <FlowSection />
        <DevelopersSection />
        <SecuritySection />
        <AboutSection />
      </main>
      <CTAFooter />
    </div>
  );
}
