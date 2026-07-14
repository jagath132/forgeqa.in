interface LogoProps {
  variant?: 'mark' | 'wordmark';
  className?: string;
}

export function Logo({ variant = 'wordmark', className = '' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <img
        src="/logo/logo-mark-gradient.svg"
        alt="ForgeQA"
        className={className}
        width={32}
        height={32}
      />
    );
  }

  return (
    <img
      src="/logo/wordmark-light-bg.svg"
      alt="ForgeQA"
      className={className}
      width={132}
      height={34}
      style={{ display: 'block' }}
    />
  );
}
