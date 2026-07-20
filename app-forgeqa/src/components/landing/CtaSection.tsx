import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';

interface CtaSectionProps {
  onGetStarted: () => void;
}

export default function CtaSection({ onGetStarted }: CtaSectionProps) {
  return (
    <section
      className="relative py-20 lg:py-28 overflow-hidden"
      style={{ background: 'var(--landing-bg)' }}
    >
      <div className="absolute inset-0 cta-gradient" />
      <div className="particles-grid" />
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="orb-blue absolute"
          style={{ width: '50vw', height: '50vw', top: '-20%', left: '20%', filter: 'blur(120px)' }}
        />
        <div
          className="orb-violet absolute"
          style={{
            width: '40vw',
            height: '40vw',
            bottom: '-30%',
            right: '10%',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]"
            style={{
              color: 'var(--landing-text)',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            }}
          >
            Ready to ship with <span className="gradient-text-accent">confidence?</span>
          </h2>

          <p
            className="mt-5 text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--landing-text-secondary)' }}
          >
            Join 2,400+ engineering teams already using ForgeQA to accelerate their testing
            workflow. No credit card required. Full access for 14 days.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button onClick={onGetStarted} type="button" className="btn-neon text-base py-3.5 px-8">
              Start Testing Smarter <ArrowRight className="w-4 h-4" />
            </button>
            <button type="button" className="btn-glass text-base py-3.5 px-8">
              Talk to Sales
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--landing-text-muted)' }}
            >
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--neon-emerald)' }} />
              No credit card required
            </div>
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--landing-text-muted)' }}
            >
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--neon-emerald)' }} />
              14-day free trial
            </div>
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--landing-text-muted)' }}
            >
              <Shield className="w-3.5 h-3.5" style={{ color: 'var(--neon-emerald)' }} />
              Cancel anytime
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
