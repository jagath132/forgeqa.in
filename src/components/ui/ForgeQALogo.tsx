import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  dark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { box: 'h-7 w-7', icon: 18, text: 'text-sm', textSub: 'text-[10px]', gap: 'gap-2' },
  md: { box: 'h-9 w-9', icon: 22, text: 'text-base', textSub: 'text-xs', gap: 'gap-2.5' },
  lg: { box: 'h-11 w-11', icon: 26, text: 'text-lg', textSub: 'text-xs', gap: 'gap-3' },
  xl: { box: 'h-14 w-14', icon: 32, text: 'text-xl', textSub: 'text-sm', gap: 'gap-3.5' },
};

/**
 * Concept 1: Navy Anvil-Slab "F" Press Icon
 * Bold geometric F constructed from anvil-slab blocks cut through by a sharp cyan checkmark.
 */
export function AnvilFLogoMark({
  size = 24,
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
      {/* Background Container - Deep Navy */}
      <rect width="40" height="40" rx="9" fill="#0F172A" />

      {/* Anvil Base & Pillar */}
      <path d="M10 32H30V29H24V24H16V29H10V32Z" fill="#1E293B" />

      {/* Top Anvil Face Slab (Main F Header) */}
      <path d="M9 10H31V16H15V20H27V25H15V31H9V10Z" fill="#F8FAFC" />

      {/* Middle F Arm */}
      <path d="M15 20H26V25H15V20Z" fill="#E2E8F0" />

      {/* Diagonal Quality Checkmark Slash (Negative-Space Cut / Accent) */}
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

export function ForgeQALogo({
  size = 'md',
  showWordmark = true,
  dark = false,
  className = '',
}: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <div className={`flex ${s.box} items-center justify-center shrink-0`}>
        <AnvilFLogoMark size={size === 'sm' ? 28 : size === 'md' ? 36 : size === 'lg' ? 44 : 56} />
      </div>
      {showWordmark && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1 font-bold tracking-tight">
            <span
              className={`${s.text}`}
              style={{
                color: dark ? '#FFFFFF' : '#0F172A',
                fontFamily: 'var(--font-display, system-ui, sans-serif)',
                letterSpacing: '-0.02em',
              }}
            >
              Forge
            </span>
            <span
              className={`${s.text}`}
              style={{
                color: '#06B6D4',
                fontFamily: 'var(--font-display, system-ui, sans-serif)',
                letterSpacing: '-0.02em',
              }}
            >
              QA
            </span>
          </div>
          <span
            className={`${s.textSub} font-medium tracking-wide uppercase`}
            style={{ color: dark ? '#94A3B8' : '#64748B', fontSize: '0.65rem' }}
          >
            AI Test Automation
          </span>
        </div>
      )}
    </div>
  );
}

export function ForgeQAIcon({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const s = sizeMap[size];
  return (
    <div className={`flex ${s.box} items-center justify-center shrink-0 ${className}`}>
      <AnvilFLogoMark size={size === 'sm' ? 28 : size === 'md' ? 36 : size === 'lg' ? 44 : 56} />
    </div>
  );
}
