import type { PropsWithChildren } from "react";

const variantStyles: Record<string, { bg: string; color: string; border: string }> = {
  neutral: { bg: "#F1F5F9", color: "#64748B", border: "transparent" },
  primary: { bg: "rgba(37, 99, 235, 0.08)", color: "#2563EB", border: "transparent" },
  success: { bg: "rgba(16, 185, 129, 0.08)", color: "#10B981", border: "transparent" },
  warning: { bg: "rgba(245, 158, 11, 0.08)", color: "#F59E0B", border: "transparent" },
  danger: { bg: "rgba(239, 68, 68, 0.08)", color: "#EF4444", border: "transparent" },
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: PropsWithChildren<{ variant?: keyof typeof variantStyles; className?: string }>) {
  const s = variantStyles[variant] ?? variantStyles.neutral;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 600,
        lineHeight: "1.4",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {children}
    </span>
  );
}
