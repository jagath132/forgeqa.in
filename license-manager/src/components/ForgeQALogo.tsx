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
    <img
      src="/logo/forgeqa_logo.png"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      alt="ForgeQA Logo"
    />
  );
}
