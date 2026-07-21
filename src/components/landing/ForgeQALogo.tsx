import React from 'react';
import { AnvilFLogoMark } from '../ui/ForgeQALogo';

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
      className={`flex items-center gap-2.5 cursor-pointer border-none bg-transparent p-0 ${className}`}
      style={{ outline: 'none' }}
      aria-label="ForgeQA Home"
    >
      <AnvilFLogoMark size={iconSize} />
      <span
        className="logo-wordmark"
        style={{
          color: 'var(--landing-text, #F8FAFC)',
          fontSize,
          fontFamily: "'Space Grotesk','Inter',sans-serif",
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        Forge<span style={{ color: '#06B6D4' }}>QA</span>
      </span>
    </button>
  );
}
