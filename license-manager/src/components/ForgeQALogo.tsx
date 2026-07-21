/**
 * Concept 1: Navy Anvil-Slab "F" Press Icon for License Manager
 */
export function AnvilFLogoMark({
  size = 28,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="9" fill="#0F172A" />
      <path d="M10 32H30V29H24V24H16V29H10V32Z" fill="#1E293B" />
      <path d="M9 10H31V16H15V20H27V25H15V31H9V10Z" fill="#F8FAFC" />
      <path d="M15 20H26V25H15V20Z" fill="#E2E8F0" />
      <path
        d="M20 28L25 32L34 16"
        stroke="#06B6D4"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
