import { Card } from "./ui/Card";

const phaseLabels: Record<string, string> = {
  knowledge: "Knowledge Retrieval",
  prompt: "Prompt Assembly",
  generating: "Matrix Synthesis",
  complete: "Complete",
  error: "Error",
  connecting: "Connecting...",
};

const phaseDescriptions: Record<string, string> = {
  knowledge: "Vector search & scoring",
  prompt: "Context injection",
  generating: "LLM inference & parsing",
  complete: "Generation complete",
  error: "Generation failed",
  connecting: "Establishing stream...",
};

const stepColors = [
  { accent: "var(--accent-cyan)", soft: "var(--accent-cyan-soft)", border: "color-mix(in srgb, var(--accent-cyan) 30%, transparent)" },
  { accent: "var(--accent-violet)", soft: "var(--accent-violet-soft)", border: "color-mix(in srgb, var(--accent-violet) 30%, transparent)" },
  { accent: "var(--accent-rose)", soft: "var(--accent-rose-soft)", border: "color-mix(in srgb, var(--accent-rose) 30%, transparent)" },
];

export function GeneratingLoader({
  phase,
  streamingText,
  onCancel: _onCancel,
}: {
  phase: string | null;
  streamingText: string;
  onCancel?: () => void;
}) {
  const currentSteps = ["knowledge", "prompt", "generating"];
  const currentIndex = currentSteps.indexOf(phase ?? "");

  return (
    <Card className="p-8" style={{ borderColor: "var(--border-default)" }}>
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "3px solid var(--accent)", borderTopColor: "transparent" }} />
          <span className="text-xs font-bold gradient-text">AI</span>
        </div>
        <h2 className="mt-4 text-lg font-bold gradient-text">
          {phase ? (phaseLabels[phase] ?? "Generating") : "Generating Test Cases"}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {phase ? (phaseDescriptions[phase] ?? "") : "Retrieving vectors, compiling prompt, and requesting the AI model."}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {currentSteps.map((step, index) => {
          const isActive = index === currentIndex;
          const isDone = index < currentIndex;
          const c = stepColors[index];
          return (
            <div key={step} className="rounded-lg p-4 transition-all" style={{
              background: isActive ? c.soft : "var(--bg-secondary)",
              border: `1px solid ${isActive ? c.border : "var(--border-subtle)"}`,
              boxShadow: isActive ? `0 0 15px ${c.accent.replace("var(", "").replace(")", "")}15` : undefined,
            }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase" style={{ color: isActive ? c.accent : "var(--text-muted)" }}>
                  Phase {index + 1}
                </span>
                {isActive && <span className="flex h-1.5 w-1.5 rounded-full animate-ping" style={{ background: c.accent }} />}
                {isDone && (
                  <svg className="h-4 w-4" style={{ color: "var(--accent-emerald)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{phaseLabels[step]}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{phaseDescriptions[step]}</p>
            </div>
          );
        })}
      </div>

      {streamingText && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--accent-cyan)" }}>Live AI Response</p>
          <div className="rounded-lg p-4 font-mono text-xs leading-relaxed max-h-32 overflow-y-auto" style={{ background: "var(--bg-primary)", border: "1px solid color-mix(in srgb, var(--accent-cyan) 20%, transparent)", color: "var(--accent-cyan)" }}>
            <pre className="whitespace-pre-wrap">{streamingText}</pre>
          </div>
        </div>
      )}
    </Card>
  );
}
