import { useState } from "react";
import { Card } from "./ui/Card";

const STEPS = [
  {
    key: "welcome",
    title: "Welcome to ForgeQA",
    description: "Let's get you set up in 2 minutes.",
    icon: "M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "provider",
    title: "Connect an AI Provider",
    description: "Add your API key to start generating test cases. You can change this later in Settings.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    key: "project",
    title: "Create Your First Project",
    description: "Upload a specification document and let AI generate comprehensive test cases instantly.",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  {
    key: "done",
    title: "You're All Set!",
    description: "Start generating test cases or invite your team members.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <Card style={{ maxWidth: 480, width: "90%", position: "relative" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--accent-gradient)" }}>
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{step.title}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{step.description}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="h-1.5 rounded-full transition-all" style={{
                width: i === stepIdx ? 24 : 6,
                background: i <= stepIdx ? "var(--accent)" : "var(--border-default)",
              }} />
            ))}
          </div>
          <button
            onClick={() => {
              if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
              else onComplete();
            }}
            className="btn-primary px-5 py-2 text-sm font-semibold cursor-pointer"
            type="button"
          >
            {stepIdx < STEPS.length - 1 ? "Continue" : "Get Started"}
          </button>
        </div>
      </Card>
    </div>
  );
}
