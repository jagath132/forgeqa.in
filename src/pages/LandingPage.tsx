import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import Navigation from '../components/landing/Navigation';
import Hero from '../components/landing/Hero';
import FeaturesSection from '../components/landing/FeaturesSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import PricingSection from '../components/landing/PricingSection';
import FaqSection from '../components/landing/FaqSection';
import ContactFooter from '../components/landing/ContactFooter';

export function LandingPage({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted: () => void;
  onSignIn?: () => void;
}) {
  const user = useAppStore((s) => s.user);
  const isAuthed = user !== null;
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get('support') === 'true') {
      setTimeout(
        () =>
          document
            .getElementById('support-form')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        300
      );
    }
  }, [searchParams]);

  return (
    <div className="landing-body" ref={scrollRef}>
      <div className="scroll-progress" id="scroll-progress" />

      <Navigation isAuthed={isAuthed} onGetStarted={onGetStarted} onSignIn={onSignIn} />

      <Hero />

      <FeaturesSection />
      <WorkflowSection />
      <PricingSection isAuthed={isAuthed} onGetStarted={onGetStarted} />
      <FaqSection />
      <ContactFooter />
    </div>
  );
}
