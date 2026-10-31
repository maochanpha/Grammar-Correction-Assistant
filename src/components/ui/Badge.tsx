'use client';

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({
  className = '',
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const base =
    'inline-flex items-center gap-1 rounded-md font-semibold whitespace-nowrap transition-colors';

  const variants: Record<string, string> = {
    default:
      'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] border border-[var(--border)]',
    success:
      'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
    warning:
      'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
    info:
      'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30 dark:bg-[var(--primary)]/10 dark:text-[var(--primary-hover)] dark:border-[var(--primary)]/30',
    outline:
      'border border-[var(--border)] bg-[var(--background)] text-[var(--foreground-muted)]',
  };

  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
}
