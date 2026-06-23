interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

const sizeMap = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-sm", gap: "gap-2" },
  md: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-base", gap: "gap-2.5" },
  lg: { box: "h-14 w-14", icon: "h-7 w-7", text: "text-xl", gap: "gap-3" },
};

const ShieldSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 3 L22 3 L22 14 L12 22 L2 14 Z" fill="white" fillOpacity="0.12" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M18 5 L12 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <rect x="17" y="3.2" width="3.2" height="2.5" rx="0.5" fill="white" opacity="0.95" />
    <path d="M6 16 L18 16 L18 14 L15 14 L15 10 L9 10 L9 14 L6 14 Z" fill="white" opacity="0.88" />
  </svg>
);

export function NexTestLogo({ size = "md", showWordmark = true }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center ${s.gap}`}>
      <div className={`flex ${s.box} items-center justify-center rounded-lg shrink-0`} style={{ background: "var(--gradient-rainbow)" }}>
        <ShieldSvg className={s.icon} />
      </div>
      {showWordmark && (
        <div>
          <p className={`${s.text} font-bold gradient-text`} style={{ background: "var(--gradient-rainbow)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NexTest</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>QA Automation Suite</p>
        </div>
      )}
    </div>
  );
}

export function NexTestIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = sizeMap[size];
  return (
    <div className={`flex ${s.box} items-center justify-center rounded-lg shrink-0`} style={{ background: "var(--gradient-rainbow)" }}>
      <ShieldSvg className={s.icon} />
    </div>
  );
}
