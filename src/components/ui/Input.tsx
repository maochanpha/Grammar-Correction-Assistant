'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  className = '',
  label,
  error,
  helperText,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`block w-full h-9.5 px-3 py-2 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8] transition-colors disabled:bg-slate-50 dark:disabled:bg-slate-900/60 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
