import { useLocation } from "react-router-dom";
import { SectionHeader } from "./ui/SectionHeader";

const pageMeta: Record<string, { title: string; description: string; badge: string; badgeClass: string; gradient: string }> = {
  dashboard: {
    title: "Command Center",
    description: "Monitor test generation activity, review knowledge coverage metrics, and navigate to key workflows from a single pane.",
    badge: "Dashboard",
    badgeClass: "badge-violet",
    gradient: "var(--gradient-primary)",
  },
  generator: {
    title: "Test Case Generator",
    description: "Submit product requirements and generate comprehensive test matrices powered by LLM inference and contextual knowledge retrieval.",
    badge: "Generation Engine",
    badgeClass: "badge-rose",
    gradient: "var(--gradient-rose)",
  },
  "test-scripts": {
    title: "Automation Script Studio",
    description: "Translate validated test cases into executable automation code for leading testing frameworks.",
    badge: "Script Studio",
    badgeClass: "badge-amber",
    gradient: "var(--gradient-warm)",
  },
  knowledge: {
    title: "Knowledge Base Manager",
    description: "Ingest, parse, and vectorize project documents to enrich prompt context for every generation cycle.",
    badge: "Knowledge Vault",
    badgeClass: "badge-cyan",
    gradient: "var(--gradient-cyan)",
  },
  "ai-settings": {
    title: "Provider Configuration",
    description: "Manage AI provider connections, rotate credentials, and select inference models for the generation pipeline.",
    badge: "Infrastructure",
    badgeClass: "badge-amber",
    gradient: "var(--gradient-warm)",
  },
};

export function PageHeader() {
  const location = useLocation();
  const key = location.pathname.replace("/", "") || "dashboard";
  const meta = pageMeta[key] ?? pageMeta.dashboard;

  return (
    <header className="hidden lg:block px-8 py-6 border-b" style={{ background: "var(--bg-glass)", borderColor: "var(--border-default)", backdropFilter: "blur(12px)" }}>
      <SectionHeader title={meta.title} description={meta.description} badgeLabel={meta.badge} badgeClass={meta.badgeClass} />
    </header>
  );
}

export function MobilePageHeader({ pageKey }: { pageKey: string }) {
  const meta = pageMeta[pageKey] ?? pageMeta.dashboard;
  return (
    <div className="lg:hidden px-4 py-4 border-b" style={{ borderColor: "var(--border-default)", background: "var(--bg-glass)" }}>
      <div style={{ width: 3, height: 32, borderRadius: 2, background: meta.gradient, position: "absolute", left: 0 }} />
      <span className={`badge ${meta.badgeClass} text-xs mb-1.5`}>{meta.badge}</span>
      <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{meta.title}</h1>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{meta.description}</p>
    </div>
  );
}
