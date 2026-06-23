import type { PropsWithChildren } from "react";

const variantClasses: Record<string, string> = {
  neutral: "badge-primary",
  primary: "badge-primary",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: PropsWithChildren<{ variant?: keyof typeof variantClasses; className?: string }>) {
  return (
    <span className={`badge ${variantClasses[variant] ?? variantClasses.neutral} ${className}`}>
      {children}
    </span>
  );
}
