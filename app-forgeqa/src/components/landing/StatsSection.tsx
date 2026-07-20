import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Bug, Gauge, Shield, Zap, Users, Cpu, Globe } from 'lucide-react';

const STATS = [
  { value: 50000, suffix: '+', label: 'Tests Executed', icon: Activity },
  { value: 98, suffix: '%', label: 'Test Coverage', icon: Shield },
  { value: 99.9, suffix: '%', label: 'Release Confidence', icon: Gauge },
  { value: 94, suffix: '%', label: 'Defect Detection', icon: Bug },
  { value: 1.2, suffix: 's', label: 'Avg. Execution Time', icon: Zap, decimals: 1 },
  { value: 2400, suffix: '+', label: 'Active Projects', icon: Users },
  { value: 15000, suffix: '+', label: 'AI Suggestions', icon: Cpu },
  { value: 500, suffix: 'K+', label: 'Cloud Sessions', icon: Globe },
];

function useCountUp(target: number, visible: boolean, duration = 1400, decimals = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Number((ease * target).toFixed(decimals)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, target, duration, decimals]);
  return count;
}

function StatCard({
  stat,
  index,
  visible,
}: {
  stat: (typeof STATS)[0];
  index: number;
  visible: boolean;
}) {
  const count = useCountUp(stat.value, visible, 1400, stat.decimals || 0);
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="glass-panel-landing rounded-xl p-5 flex items-start gap-4"
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg"
        style={{ width: 40, height: 40, background: 'rgba(59,130,246,0.1)' }}
      >
        <Icon className="w-4 h-4" style={{ color: 'var(--neon-blue)' }} />
      </div>
      <div>
        <div
          className="text-2xl font-bold"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          <span className="gradient-text-accent">{count.toLocaleString()}</span>
          <span className="gradient-text-accent">{stat.suffix}</span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--landing-text-muted)' }}>
          {stat.label}
        </div>
      </div>
    </motion.div>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 lg:py-20" style={{ background: 'var(--landing-bg)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="hero-badge mb-4">
            <Activity className="w-3 h-3" /> Platform Metrics
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{
              color: 'var(--landing-text)',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            }}
          >
            Built for scale, proven by data
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
