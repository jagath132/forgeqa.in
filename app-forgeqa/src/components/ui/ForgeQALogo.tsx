interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

const sizeMap = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-sm', gap: 'gap-2' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5', text: 'text-base', gap: 'gap-2.5' },
  lg: { box: 'h-14 w-14', icon: 'h-7 w-7', text: 'text-xl', gap: 'gap-3' },
};

const AnvilSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 4V14" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M8 14H16L18 20H6Z"
      fill="white"
      fillOpacity="0.12"
      stroke="white"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M12 14L14 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="9" r="1.5" fill="white" />
  </svg>
);

export function ForgeQALogo({ size = 'md', showWordmark = true }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center ${s.gap}`}>
      <div
        className={`flex ${s.box} items-center justify-center rounded-lg shrink-0`}
        style={{ background: 'var(--gradient-rainbow)' }}
      >
        <AnvilSvg className={s.icon} />
      </div>
      {showWordmark && (
        <div>
          <p
            className={`${s.text} font-bold gradient-text`}
            style={{
              background: 'var(--gradient-rainbow)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ForgeQA
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Quality at Scale
          </p>
        </div>
      )}
    </div>
  );
}

export function ForgeQAIcon({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = sizeMap[size];
  return (
    <div
      className={`flex ${s.box} items-center justify-center rounded-lg shrink-0`}
      style={{ background: 'var(--gradient-rainbow)' }}
    >
      <AnvilSvg className={s.icon} />
    </div>
  );
}
