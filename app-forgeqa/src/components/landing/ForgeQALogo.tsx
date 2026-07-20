interface ForgeQALogoProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export default function ForgeQALogo({ onClick, className = '', size = 'md' }: ForgeQALogoProps) {
  const iconSize = size === 'sm' ? 28 : 36;
  const fontSize = size === 'sm' ? '1.1rem' : '1.35rem';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 cursor-pointer border-none bg-transparent p-0 ${className}`}
      style={{ outline: 'none' }}
      aria-label="ForgeQA Home"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="fmark-grad" x1="0" y1="0" x2="36" y2="36">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="10"
          fill="url(#fmark-grad)"
          fillOpacity="0.12"
          stroke="url(#fmark-grad)"
          strokeWidth="1.5"
        />
        <text
          x="18"
          y="24"
          textAnchor="middle"
          fill="url(#fmark-grad)"
          fontFamily="'Space Grotesk','Inter',sans-serif"
          fontWeight="800"
          fontSize="20"
        >
          F
        </text>
        <circle cx="26" cy="10" r="2" fill="#22C55E" opacity="0.8" />
        <path d="M24 12 L28 8" stroke="#22C55E" strokeWidth="1.5" opacity="0.5" />
      </svg>
      <span
        className="logo-wordmark"
        style={{
          color: 'var(--landing-text)',
          fontSize,
          fontFamily: "'Space Grotesk','Inter',sans-serif",
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        Forge<span style={{ color: 'var(--neon-blue)' }}>QA</span>
      </span>
    </button>
  );
}
