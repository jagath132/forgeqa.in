import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  Brain, Globe, Smartphone, Code, Gauge, Eye, 
  Layers, GitBranch, BarChart3, Wrench, Zap, Shield,
  Check
} from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "AI Test Generation", desc: "Describe your feature in plain English. Our AI generates comprehensive test cases with preconditions, steps, and expected results.", color: "#3B82F6" },
  { icon: Globe, title: "Cross-Browser Testing", desc: "Execute tests across Chrome, Firefox, Safari, and Edge simultaneously. Automatic screenshots and diff comparison.", color: "#06B6D4" },
  { icon: Smartphone, title: "Mobile Automation", desc: "Test on iOS and Android devices with real device cloud. Gesture simulation, orientation switching, and network throttling.", color: "#8B5CF6" },
  { icon: Code, title: "API Automation", desc: "REST, GraphQL, and WebSocket testing with automatic schema validation. Generate API tests from OpenAPI specs.", color: "#22C55E" },
  { icon: Gauge, title: "Performance Testing", desc: "Load test your APIs and UI with configurable virtual users. Identify bottlenecks before they reach production.", color: "#F59E0B" },
  { icon: Eye, title: "Visual Regression", desc: "Pixel-perfect visual comparison with AI-powered ignoring of expected changes. Catch visual bugs automatically.", color: "#F43F5E" },
  { icon: Layers, title: "Parallel Execution", desc: "Run thousands of tests in parallel across distributed workers. Smart test splitting for optimal resource usage.", color: "#3B82F6" },
  { icon: GitBranch, title: "CI/CD Integration", desc: "Native GitHub Actions, GitLab CI, Jenkins, and CircleCI plugins. Auto-trigger on PR, merge, or schedule.", color: "#06B6D4" },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Real-time dashboards with pass/fail trends, flaky test detection, and team productivity metrics.", color: "#8B5CF6" },
  { icon: Wrench, title: "Self-Healing Tests", desc: "AI automatically fixes broken selectors and waits. Tests that adapt to UI changes without manual maintenance.", color: "#22C55E" },
  { icon: Zap, title: "Smart Test Selection", desc: "ML-powered test impact analysis. Only run tests relevant to your code changes. Cut feedback loops by 80%.", color: "#F59E0B" },
  { icon: Shield, title: "Enterprise Security", desc: "AES-256-GCM encrypted data. SOC 2 compliant infrastructure. RBAC with SSO/SAML support.", color: "#F43F5E" },
];

export default function FeaturesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  return (
    <section id="features" className="py-16 lg:py-20" style={{ background: "var(--landing-bg)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="hero-badge mb-4">
            <Zap className="w-3 h-3" /> Everything you need
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--landing-text)", fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
            Enterprise-grade test automation
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-base" style={{ color: "var(--landing-text-secondary)" }}>
            From AI-powered test generation to CI/CD integration — everything your QA team needs in one platform.
          </p>
        </motion.div>

        <motion.div
          ref={scrollRef}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            const isHovered = hoveredIndex === i;

            return (
              <motion.div
                key={feat.title}
                variants={cardVariants}
                className="feature-card p-5 group cursor-default"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-300"
                    style={{
                      width: 44,
                      height: 44,
                      background: isHovered ? `${feat.color}20` : "var(--landing-glass)",
                      border: `1px solid ${isHovered ? `${feat.color}30` : "var(--landing-glass-border)"}`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feat.color }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold" style={{ color: "var(--landing-text)" }}>{feat.title}</h3>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--landing-text-secondary)" }}>{feat.desc}</p>
                  </div>
                </div>
                {isHovered && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    className="h-0.5 mt-4 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${feat.color}, transparent)` }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
