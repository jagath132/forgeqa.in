import { motion } from "framer-motion";
import { FileText, Brain, ListChecks, Play, CheckCircle2, FileBarChart, Rocket } from "lucide-react";

const STAGES = [
  { icon: FileText, title: "Requirements", desc: "Upload PRD, ticket, or plain-text spec", color: "#3B82F6" },
  { icon: Brain, title: "AI Analysis", desc: "NLP extracts intent, edge cases, & acceptance criteria", color: "#8B5CF6" },
  { icon: ListChecks, title: "Generate Tests", desc: "Structured test cases with preconditions & expected results", color: "#06B6D4" },
  { icon: Play, title: "Execute Tests", desc: "Parallel execution across browsers, devices & APIs", color: "#22C55E" },
  { icon: CheckCircle2, title: "Validate Results", desc: "AI-powered diff, visual regression & assertion checks", color: "#F59E0B" },
  { icon: FileBarChart, title: "Generate Reports", desc: "PDF, JUnit XML, CSV, XLSX — direct to CI", color: "#F43F5E" },
  { icon: Rocket, title: "Deploy Confidently", desc: "Ship with verified quality gates & audit trail", color: "#3B82F6" },
];

export default function WorkflowSection() {
  return (
    <section id="workflow" className="py-16 lg:py-20" style={{ background: "var(--landing-bg-elevated)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="hero-badge mb-4">
            <Rocket className="w-3 h-3" /> How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--landing-text)", fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
            From spec to deploy in 7 steps
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-base" style={{ color: "var(--landing-text-secondary)" }}>
            Our AI transforms your product requirements into executed, validated, and reported test suites — fully automated.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5" style={{
            background: "linear-gradient(90deg, #3B82F6, #8B5CF6, #06B6D4, #22C55E, #F59E0B, #F43F5E, #3B82F6)",
            opacity: 0.15,
          }} />

          <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-4 lg:gap-3">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <motion.div
                  key={stage.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="feature-card p-4 lg:p-5 flex flex-col items-center text-center group"
                >
                  <div
                    className="flex items-center justify-center rounded-xl mb-3 transition-all duration-300 group-hover:scale-110"
                    style={{
                      width: 48,
                      height: 48,
                      background: `${stage.color}15`,
                      border: `1px solid ${stage.color}25`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stage.color }} />
                  </div>
                  <div className="text-xs font-bold mb-1" style={{ color: stage.color }}>0{i + 1}</div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: "var(--landing-text)" }}>{stage.title}</h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--landing-text-secondary)" }}>{stage.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
