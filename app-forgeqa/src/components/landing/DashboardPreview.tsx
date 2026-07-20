import { motion } from 'framer-motion';
import {
  Activity,
  Smartphone,
  Globe,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';

const METRICS = [
  { label: 'Pass Rate', value: '97.2%', color: '#22C55E', icon: CheckCircle2 },
  { label: 'Coverage', value: '94.8%', color: '#3B82F6', icon: Activity },
  { label: 'Flaky', value: '2.1%', color: '#F59E0B', icon: AlertCircle },
  { label: 'Avg Duration', value: '1.2s', color: '#06B6D4', icon: Clock },
];

const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];
const DEVICES = ['iPhone 15', 'Pixel 8', 'Galaxy S24', 'iPad Pro'];

export default function DashboardPreview() {
  return (
    <section className="py-16 lg:py-20" style={{ background: 'var(--landing-bg)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="hero-badge mb-4">
            <BarChart3 className="w-3 h-3" /> Product Dashboard
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{
              color: 'var(--landing-text)',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            }}
          >
            See your entire testing universe
          </h2>
          <p
            className="mt-3 max-w-2xl mx-auto text-base"
            style={{ color: 'var(--landing-text-secondary)' }}
          >
            Real-time visibility into every test execution across browsers, devices, and APIs — all
            in one place.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel-landing-strong rounded-2xl overflow-hidden"
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid var(--landing-glass-border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f5a623' }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
              <span
                className="ml-2 text-xs font-mono"
                style={{ color: 'var(--landing-text-muted)' }}
              >
                nextest dashboard
              </span>
            </div>
            <div
              className="flex items-center gap-3 text-xs"
              style={{ color: 'var(--landing-text-muted)' }}
            >
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--neon-blue)' }} />
              <span>Live</span>
            </div>
          </div>

          <div className="p-5 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {METRICS.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="glass-panel-landing rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3 h-3" style={{ color: m.color }} />
                      <span className="text-xs" style={{ color: 'var(--landing-text-muted)' }}>
                        {m.label}
                      </span>
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: m.color, fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {m.value}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-panel-landing rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-3.5 h-3.5" style={{ color: 'var(--neon-cyan)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--landing-text)' }}>
                    Browser Matrix
                  </span>
                </div>
                <div className="space-y-2">
                  {BROWSERS.map((b) => (
                    <div key={b} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--landing-text-secondary)' }}>
                        {b}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-20 h-1.5 rounded-full"
                          style={{ background: 'var(--landing-glass-border)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${85 + Math.random() * 15}%`,
                              background: 'var(--neon-blue)',
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: 'var(--neon-blue)' }}
                        >
                          {(85 + Math.random() * 15).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel-landing rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-3.5 h-3.5" style={{ color: 'var(--neon-violet)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--landing-text)' }}>
                    Device Farm
                  </span>
                </div>
                <div className="space-y-2">
                  {DEVICES.map((d) => (
                    <div key={d} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--landing-text-secondary)' }}>
                        {d}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className="w-3 h-3"
                          style={{ color: 'var(--neon-emerald)' }}
                        />
                        <span className="text-[10px]" style={{ color: 'var(--neon-emerald)' }}>
                          Passed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
