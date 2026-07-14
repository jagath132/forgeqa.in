import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'How does ForgeQA handle my data?',
    a: 'Your requirements and generated test cases are stored in your dedicated MongoDB instance. We never share or sell your data. API keys are encrypted at rest with AES-256-GCM.',
  },
  {
    q: 'Which AI provider sees my data?',
    a: 'The provider you choose. When you bring your own API key (BYOK), requests go directly to that provider — ForgeQA never proxies through a shared pool.',
  },
  {
    q: 'Can I bring my own API key?',
    a: 'Yes — every AI provider supports BYOK. Your key is encrypted and stored securely. You can rotate or revoke it at any time from your settings page.',
  },
  {
    q: 'What export formats are supported?',
    a: 'PDF, CSV, XLSX, and JUnit XML. Direct CI integrations include GitHub Actions, GitLab CI, and Jenkins via webhook.',
  },
  {
    q: 'How does self-healing work?',
    a: 'When a test fails due to UI changes, our AI analyzes the failure, identifies the new selector or wait condition, and automatically updates the test. You review and approve changes via pull request.',
  },
];

export default function FaqSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section
      id="faq"
      className="py-20 lg:py-28"
      style={{ background: 'var(--landing-bg-elevated)' }}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="hero-badge mb-4">
            <HelpCircle className="w-3 h-3" /> FAQ
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold mt-4"
            style={{
              color: 'var(--landing-text)',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            }}
          >
            Frequently asked questions
          </h2>
          <p className="mt-3 text-base max-w-lg" style={{ color: 'var(--landing-text-secondary)' }}>
            Everything you need to know about ForgeQA. Can&apos;t find what you&apos;re looking for?
            Contact our team.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12">
          {/* Left: Question list */}
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const isActive = activeIdx === i;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveIdx(i)}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl text-left cursor-pointer transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                    border: isActive ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid transparent',
                    color: isActive ? 'var(--neon-blue)' : 'var(--landing-text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--color-accent-soft)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span className="text-sm font-medium">{item.q}</span>
                  <ChevronRight
                    className="w-4 h-4 shrink-0 transition-transform duration-200"
                    style={{ transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Right: Answer panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div
              className="sticky top-24 p-8 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid var(--landing-glass-border)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                minHeight: 200,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{
                        background: 'var(--color-accent-soft)',
                        border: '1px solid rgba(37, 99, 235, 0.15)',
                      }}
                    >
                      <HelpCircle className="w-4 h-4" style={{ color: 'var(--neon-blue)' }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--neon-blue)' }}>
                      Question {activeIdx + 1} of {FAQ_ITEMS.length}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{
                      color: 'var(--landing-text)',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {FAQ_ITEMS[activeIdx].q}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--landing-text-secondary)' }}
                  >
                    {FAQ_ITEMS[activeIdx].a}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
