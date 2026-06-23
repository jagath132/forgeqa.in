interface Icon3DProps {
  size?: number;
  className?: string;
}

function IconContainer({ size = 20, className = "", children }: Icon3DProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

export function DashboardIcon3D({ size = 20, className = "" }: Icon3DProps) {
  return (
    <IconContainer size={size} className={className}>
      <rect x="3" y="3" width="8" height="10" rx="1.5" fill="currentColor" opacity="0.2" />
      <rect x="3" y="3" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="15.5" width="8" height="5.5" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="3" y="15.5" width="8" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="3" width="8" height="5.5" rx="1.5" fill="currentColor" opacity="0.35" />
      <rect x="13" y="3" width="8" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="11" width="8" height="10" rx="1.5" fill="currentColor" opacity="0.25" />
      <rect x="13" y="11" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </IconContainer>
  );
}

export function GeneratorIcon3D({ size = 20, className = "" }: Icon3DProps) {
  return (
    <IconContainer size={size} className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8.5" y1="9" x2="15.5" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8.5" y1="13" x2="15.5" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8.5" y1="17" x2="12.5" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="7" r="3" fill="var(--accent-rose)" opacity="0.25" />
      <circle cx="17" cy="7" r="3" stroke="var(--accent-rose)" strokeWidth="1" opacity="0.6" />
      <circle cx="17" cy="7" r="1.2" fill="var(--accent-rose)" opacity="0.8" />
    </IconContainer>
  );
}

export function ScriptsIcon3D({ size = 20, className = "" }: Icon3DProps) {
  return (
    <IconContainer size={size} className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 9l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="18" cy="6" r="3" fill="var(--accent-emerald)" opacity="0.25" />
      <circle cx="18" cy="6" r="3" stroke="var(--accent-emerald)" strokeWidth="1" opacity="0.6" />
      <circle cx="18" cy="6" r="1.2" fill="var(--accent-emerald)" opacity="0.8" />
    </IconContainer>
  );
}

export function KnowledgeIcon3D({ size = 20, className = "" }: Icon3DProps) {
  return (
    <IconContainer size={size} className={className}>
      <rect x="4" y="6" width="16" height="14" rx="2" fill="currentColor" opacity="0.12" />
      <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 10h16" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path d="M8 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <circle cx="18" cy="4" r="3.5" fill="var(--accent-cyan)" opacity="0.2" />
      <circle cx="18" cy="4" r="3.5" stroke="var(--accent-cyan)" strokeWidth="1" opacity="0.5" />
      <circle cx="18" cy="4" r="1.5" fill="var(--accent-cyan)" opacity="0.7" />
    </IconContainer>
  );
}

export function SettingsIcon3D({ size = 20, className = "" }: Icon3DProps) {
  return (
    <IconContainer size={size} className={className}>
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 5v3M12 16v3M5 12h3M16 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.2" opacity="0.25" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="1.2" fill="var(--accent-amber)" opacity="0.8" />
      <circle cx="12" cy="12" r="5" stroke="var(--accent-amber)" strokeWidth="1" opacity="0.3" strokeDasharray="2 4" />
    </IconContainer>
  );
}

export function FeatureIcon3D({
  size = 24,
  className = "",
  type,
}: Icon3DProps & { type: "knowledge" | "ai" | "code" | "export" | "shield" | "history" | "cube" | "sparkle" }) {
  const iconMap: Record<string, React.ReactNode> = {
    knowledge: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" opacity="0.12" />
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <path d="M7 13.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <path d="M7 16.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <circle cx="19" cy="4" r="3" fill="currentColor" opacity="0.25" />
        <circle cx="19" cy="4" r="1.2" fill="currentColor" opacity="0.6" />
      </>
    ),
    ai: (
      <>
        <circle cx="12" cy="12" r="7" fill="currentColor" opacity="0.12" />
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.2" />
        <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.6" />
        <circle cx="18" cy="6" r="2" fill="currentColor" opacity="0.15" />
        <circle cx="6" cy="18" r="2" fill="currentColor" opacity="0.15" />
      </>
    ),
    code: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" fill="currentColor" opacity="0.12" />
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 9l3 3-3 3M15 9l-3 3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <circle cx="18" cy="4" r="2.5" fill="currentColor" opacity="0.2" />
        <circle cx="18" cy="4" r="1" fill="currentColor" opacity="0.5" />
      </>
    ),
    export: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" fill="currentColor" opacity="0.12" />
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v8M9 11l3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <path d="M7 19h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2l8 3v7c0 4-3.5 7.5-8 9-4.5-1.5-8-5-8-9V5l8-3z" fill="currentColor" opacity="0.1" />
        <path d="M12 2l8 3v7c0 4-3.5 7.5-8 9-4.5-1.5-8-5-8-9V5l8-3z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <circle cx="12" cy="6" r="2" fill="currentColor" opacity="0.2" />
      </>
    ),
    history: (
      <>
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.1" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.15" />
      </>
    ),
    cube: (
      <>
        <path d="M12 2l-8 4.5v11L12 22l8-4.5v-11L12 2z" fill="currentColor" opacity="0.08" />
        <path d="M12 2l-8 4.5v11L12 22l8-4.5v-11L12 2z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 6.5l8 4.5 8-4.5M12 11v11" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <path d="M8 4l-4 2.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
        <path d="M16 4l4 2.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="currentColor" opacity="0.1" />
        <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.3" />
        <path d="M18 6l-1 2M6 18l-1 2M18 18l-2-1M6 6l-2-1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {iconMap[type]}
    </svg>
  );
}
