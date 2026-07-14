import { motion } from 'framer-motion';

const COMPANIES = [
  'TechFlow',
  'DataBridge',
  'CloudPeak',
  'ScaleLab',
  'NexGen',
  'Quantum',
  'ApexSoft',
  'Meridian',
];

export default function TrustBar() {
  return (
    <section className="py-12" style={{ background: 'var(--landing-bg)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs font-semibold uppercase tracking-widest mb-8"
          style={{ color: 'var(--landing-text-muted)' }}
        >
          Trusted by engineering teams worldwide
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {COMPANIES.map((name, i) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="text-sm font-semibold tracking-wide"
              style={{ color: 'var(--landing-text-secondary)', opacity: 0.5 }}
            >
              {name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
