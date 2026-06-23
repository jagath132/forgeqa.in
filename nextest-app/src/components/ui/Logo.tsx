import { useAppStore } from "../../store/useAppStore";

interface LogoProps {
  variant?: "mark" | "wordmark";
  className?: string;
}

export function Logo({ variant = "wordmark", className = "" }: LogoProps) {
  const theme = useAppStore((s) => s.theme);

  if (variant === "mark") {
    return (
      <img
        src="/logo/logo-mark-gradient.svg"
        alt="NexTest"
        className={className}
        width={32}
        height={32}
      />
    );
  }

  const src = theme === "dark" ? "/logo/wordmark-dark-bg.svg" : "/logo/wordmark-light-bg.svg";
  return (
    <img
      src={src}
      alt="NexTest"
      className={className}
      width={132}
      height={34}
      style={{ display: "block" }}
    />
  );
}
