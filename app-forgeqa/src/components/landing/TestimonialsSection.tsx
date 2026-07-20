import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Rahul Sharma',
    role: 'QA Lead, TechFlow',
    avatar: 'RS',
    text: "Nextest cut our test creation time by 80%. The AI understands context better than any tool we've tried. Our release cycles went from two weeks to two days.",
    rating: 5,
  },
  {
    name: 'Priya Patel',
    role: 'Engineering Director, DataBridge',
    avatar: 'PP',
    text: 'The multi-provider support is a game-changer. We use Gemini for unit tests and Claude for integration — all from one interface with unified reporting.',
    rating: 5,
  },
  {
    name: 'Arjun Mehta',
    role: 'CTO, CloudPeak',
    avatar: 'AM',
    text: 'We went from spec to 200 passing Playwright tests in one afternoon. Nextest is the missing piece in our CI pipeline. Self-healing tests alone saved us 40hrs/month.',
    rating: 5,
  },
  {
    name: 'Neha Gupta',
    role: 'SDET, ScaleLab',
    avatar: 'NG',
    text: 'The export to JUnit XML saved us weeks of migration work. Our Jenkins pipeline integrates seamlessly. The parallel execution is incredibly fast.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  return (
    <section className="py-16 lg:py-20" style={{ background: 'var(--landing-bg-elevated)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="hero-badge mb-4">
            <Star className="w-3 h-3" /> Testimonials
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{
              color: 'var(--landing-text)',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            }}
          >
            Trusted by engineering leaders
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="relative min-h-[240px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="testimonial-card"
              >
                <Quote
                  className="w-8 h-8 mb-3"
                  style={{ color: 'var(--neon-blue)', opacity: 0.2 }}
                />
                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'var(--landing-text)', fontStyle: 'italic' }}
                >
                  &ldquo;{TESTIMONIALS[current].text}&rdquo;
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {Array.from({ length: TESTIMONIALS[current].rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-current"
                      style={{ color: 'var(--neon-amber)' }}
                    />
                  ))}
                </div>
                <div
                  className="flex items-center gap-3 mt-5 pt-4"
                  style={{ borderTop: '1px solid var(--landing-glass-border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--neon-blue)' }}
                  >
                    {TESTIMONIALS[current].avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--landing-text)' }}>
                      {TESTIMONIALS[current].name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--landing-text-secondary)' }}>
                      {TESTIMONIALS[current].role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setCurrent((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              type="button"
              className="flex items-center justify-center rounded-full cursor-pointer"
              style={{
                width: 36,
                height: 36,
                color: 'var(--landing-text-secondary)',
                background: 'var(--landing-glass)',
                border: '1px solid var(--landing-glass-border)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  type="button"
                  className="rounded-full cursor-pointer"
                  style={{
                    width: 8,
                    height: 8,
                    border: 'none',
                    padding: 0,
                    background: i === current ? 'var(--neon-blue)' : 'var(--landing-glass-border)',
                    transition: 'background 0.3s, transform 0.2s',
                    transform: i === current ? 'scale(1.3)' : 'scale(1)',
                  }}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent((i) => (i + 1) % TESTIMONIALS.length)}
              type="button"
              className="flex items-center justify-center rounded-full cursor-pointer"
              style={{
                width: 36,
                height: 36,
                color: 'var(--landing-text-secondary)',
                background: 'var(--landing-glass)',
                border: '1px solid var(--landing-glass-border)',
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
