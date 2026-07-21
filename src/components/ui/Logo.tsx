import React from 'react';
import { ForgeQALogo, AnvilFLogoMark } from './ForgeQALogo';

interface LogoProps {
  variant?: 'mark' | 'wordmark';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
}

export function Logo({
  variant = 'wordmark',
  className = '',
  size = 'md',
  dark = false,
}: LogoProps) {
  if (variant === 'mark') {
    return (
      <AnvilFLogoMark size={size === 'sm' ? 28 : size === 'md' ? 36 : 44} className={className} />
    );
  }

  return <ForgeQALogo size={size} dark={dark} className={className} />;
}
