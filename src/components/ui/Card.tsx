'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  borderless?: boolean;
}

export function Card({
  className = '',
  padded = true,
  borderless = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white dark:bg-[#131722] border ${
        borderless ? 'border-transparent' : 'border-slate-200/90 dark:border-slate-800'
      } shadow-xs ${padded ? 'p-5 sm:p-6' : 'p-0'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
