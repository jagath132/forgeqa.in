import type { PropsWithChildren } from "react";

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 24,
  boxShadow: "0 4px 24px rgba(30, 41, 59, 0.06), 0 1px 4px rgba(30, 41, 59, 0.04)",
  border: "1px solid #E2E8F0",
  padding: 24,
};

export function Card({ children, className = "", style }: PropsWithChildren<{ className?: string; style?: React.CSSProperties }>) {
  return (
    <div
      className={className}
      style={{ ...cardStyle, ...style }}
    >
      {children}
    </div>
  );
}
