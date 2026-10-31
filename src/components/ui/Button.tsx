'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  asChild?: boolean;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  asChild = false,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const variants: Record<string, string> = {
    primary:
      'bg-[#3647C8] text-white hover:bg-[#2b39a8] shadow-xs hover:shadow focus-visible:ring-[#3647C8]/50 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80 focus-visible:ring-slate-400',
    outline:
      'border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs focus-visible:ring-slate-300',
    ghost:
      'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 focus-visible:ring-slate-300',
    danger:
      'bg-red-50 text-red-600 border border-red-200/80 hover:bg-red-100 hover:text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/40 focus-visible:ring-red-400',
  };

  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs rounded-md',
    md: 'h-9 px-3.5 py-1.5 text-sm',
    lg: 'h-11 px-5 py-2.5 text-base rounded-xl',
  };

  const buttonClasses = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (asChild) {
    return (
      <span className={buttonClasses} {...(props as Record<string, unknown>)}>
        {isLoading ? (
          <>
            <svg
              className="w-4 h-4 animate-spin -ml-1 mr-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading…</span>
          </>
        ) : (
          children
        )}
      </span>
    );
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={buttonClasses}
      {...(props as Record<string, unknown>)}
    >
      {isLoading ? (
        <>
          <svg
            className="w-4 h-4 animate-spin -ml-1 mr-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
