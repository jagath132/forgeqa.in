import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

const HeroScene = lazy(() => import('./HeroScene'));

interface HeroProps {}

const WORDS_LINE1 = ['Write', 'tests,', 'not', 'scripts.'];
const WORDS_LINE2 = ['AI', 'that', 'ships', 'with', 'you.'];

function AnimatedHeading() {
  return (
    <h1
      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight"
      style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", color: 'var(--landing-text)' }}
    >
      <span className="block overflow-hidden">
        {WORDS_LINE1.map((word, i) => (
          <motion.span
            key={`l1-${i}`}
            className="inline-block mr-[0.3em]"
            initial={{ y: '120%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.7,
              delay: 0.2 + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {i === 3 ? <span className="gradient-text-accent">{word}</span> : word}
          </motion.span>
        ))}
      </span>
      <span className="block overflow-hidden mt-1">
        {WORDS_LINE2.map((word, i) => (
          <motion.span
            key={`l2-${i}`}
            className="inline-block mr-[0.3em]"
            initial={{ y: '120%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.7,
              delay: 0.6 + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {i === 0 ? <span className="gradient-text-accent">{word}</span> : word}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}

function Typewriter({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <>{displayed}</>;
}

export default function Hero(_props: HeroProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handleMouse = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [isMobile]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'var(--landing-bg)' }}
    >
      <div className="particles-grid" />
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="orb-blue absolute"
          style={{
            width: '60vw',
            height: '60vw',
            top: '-20%',
            left: '-10%',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="orb-violet absolute"
          style={{
            width: '40vw',
            height: '40vw',
            bottom: '-10%',
            right: '-5%',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="orb-cyan absolute"
          style={{ width: '30vw', height: '30vw', top: '30%', left: '40%', filter: 'blur(80px)' }}
        />
      </div>

      <div
        className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 w-full"
        style={{ paddingTop: '80px', paddingBottom: '60px' }}
      >
        {/* Desktop / Tablet: side by side */}
        <div className="hidden md:grid md:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
          <div>
            <AnimatedHeading />
            <motion.p
              className="mt-6 text-base lg:text-lg max-w-xl leading-relaxed"
              style={{ color: 'var(--landing-text-secondary)' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <Typewriter text="Generate, execute, and manage automated test suites across web, mobile, API, and desktop — powered by the AI provider you already trust." />
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[350px] md:h-[400px] lg:h-[500px] xl:h-[550px]"
            style={{
              transform: `perspective(1000px) rotateY(${mouse.x * 3}deg) rotateX(${-mouse.y * 3}deg)`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            <div className="absolute inset-0 rounded-2xl overflow-hidden glass-panel-landing">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--neon-blue)] border-t-transparent animate-spin" />
                  </div>
                }
              >
                <HeroScene />
              </Suspense>
            </div>
          </motion.div>
        </div>

        {/* Mobile: stacked layout */}
        <div className="md:hidden flex flex-col items-center text-center">
          <AnimatedHeading />
          <motion.p
            className="mt-5 text-sm leading-relaxed max-w-md"
            style={{ color: 'var(--landing-text-secondary)' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <Typewriter text="Generate, execute, and manage automated test suites across web, mobile, API, and desktop — powered by the AI provider you already trust." />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-[280px] sm:h-[320px] mt-8"
          >
            <div className="absolute inset-0 rounded-2xl overflow-hidden glass-panel-landing">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--neon-blue)] border-t-transparent animate-spin" />
                  </div>
                }
              >
                <HeroScene />
              </Suspense>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
