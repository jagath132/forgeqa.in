import type { PropsWithChildren } from "react";

export function Card({ children, className = "", style }: PropsWithChildren<{ className?: string; style?: React.CSSProperties }>) {
  return (
    <div
      className={`card p-6 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
