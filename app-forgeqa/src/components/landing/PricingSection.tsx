import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const TIERS = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    desc: 'For individual QA engineers and small teams.',
    features: [
      '500 test generations/mo',
      '3 AI providers',
      'CSV & PDF export',
      'Email support',
      'Single workspace',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Team',
    price: '$99',
    period: '/month',
    desc: 'For growing QA teams with shared test suites.',
    features: [
      '5,000 test generations/mo',
      'All AI providers',
      'Multi-format export',
      'Team workspaces',
      'Priority email support',
      'Parallel execution',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For organizations with custom compliance needs.',
    features: [
      'Unlimited generations',
      'On-premise deployment',
      'SSO/SAML',
      'Dedicated support engineer',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

interface PricingSectionProps {
  isAuthed: boolean;
  onGetStarted: () => void;
}

function PricingCard({
  tier,
  index,
  isAuthed,
  onGetStarted,
}: PricingSectionProps & { tier: (typeof TIERS)[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl flex flex-col"
      style={{
        background: 'var(--landing-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: tier.highlighted
          ? '1px solid rgba(37, 99, 235, 0.4)'
          : '1px solid var(--landing-glass-border)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Blob overflow clip wrapper */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <motion.div
          animate={{
            scale: hovered ? 1.05 : 0.9,
            opacity: hovered ? 0.35 : 0.2,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute pointer-events-none"
          style={{
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Most Popular badge */}
      {tier.highlighted && (
        <span
          className="absolute px-4 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
          style={{
            top: '-0.75rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--gradient-hero)',
            color: '#fff',
            zIndex: 30,
            letterSpacing: '0.03em',
          }}
        >
          Most Popular
        </span>
      )}

      {/* Content - z-10 layer */}
      <div className="p-6 lg:p-8 flex flex-col" style={{ position: 'relative', zIndex: 10 }}>
        <h3
          className="text-lg font-bold"
          style={{ color: 'var(--landing-text)', fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {tier.name}
        </h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-3xl font-bold gradient-text-accent">{tier.price}</span>
          {tier.period && (
            <span className="text-sm" style={{ color: 'var(--landing-text-muted)' }}>
              {tier.period}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm" style={{ color: 'var(--landing-text-secondary)' }}>
          {tier.desc}
        </p>

        <ul className="mt-6 space-y-3 flex-1">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--neon-blue)' }} />
              <span style={{ color: 'var(--landing-text-secondary)' }}>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA - z-20 layer */}
        <button
          onClick={() => {
            if (tier.name === 'Enterprise') {
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
            } else {
              onGetStarted();
            }
          }}
          type="button"
          className="mt-8 w-full py-3 text-sm font-semibold rounded-lg cursor-pointer inline-flex items-center justify-center gap-2 transition-all duration-200"
          onMouseEnter={(e) => {
            if (tier.highlighted) {
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(37, 99, 235, 0.3)';
            } else {
              e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (tier.highlighted) {
              e.currentTarget.style.boxShadow = 'none';
            } else {
              e.currentTarget.style.borderColor = 'var(--landing-glass-border)';
            }
          }}
          style={{
            background: tier.highlighted ? 'var(--gradient-hero)' : 'var(--landing-glass)',
            backdropFilter: tier.highlighted ? 'none' : 'blur(12px)',
            WebkitBackdropFilter: tier.highlighted ? 'none' : 'blur(12px)',
            border: tier.highlighted ? 'none' : '1px solid var(--landing-glass-border)',
            color: tier.highlighted ? '#fff' : 'var(--landing-text)',
            position: 'relative',
            zIndex: 20,
          }}
        >
          {isAuthed && tier.name !== 'Enterprise' ? 'Dashboard' : tier.cta}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function PricingSection({ isAuthed, onGetStarted }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-16 lg:py-20" style={{ background: 'var(--landing-bg)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="hero-badge mb-4">Pricing</span>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{
              color: 'var(--landing-text)',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            }}
          >
            Plans that scale with your team
          </h2>
          <p
            className="mt-3 max-w-2xl mx-auto text-base"
            style={{ color: 'var(--landing-text-secondary)' }}
          >
            Start free, upgrade when you grow. All plans include a 14-day trial with full feature
            access.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 lg:gap-8 max-w-5xl mx-auto">
          {TIERS.map((tier, i) => (
            <PricingCard
              key={tier.name}
              tier={tier}
              index={i}
              isAuthed={isAuthed}
              onGetStarted={onGetStarted}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
