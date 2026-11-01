'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  RefreshCw,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  FileEdit,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials');
      setLoading(false);
    } else {
      router.push(redirect);
    }
  };

  const registerHref =
    redirect !== '/dashboard'
      ? `/auth/register?redirect=${encodeURIComponent(redirect)}`
      : '/auth/register';

  return (
    <div className="w-full max-w-md border border-[var(--border)] rounded-xl bg-[var(--background)] shadow-sm p-8">
      <div className="text-center space-y-2 mb-6">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <Image
            src="/logo.png"
            alt="PorPor AGC Logo"
            width={36}
            height={36}
            className="w-9 h-9 rounded-lg object-contain shadow-xs"
            priority
          />
          <span className="font-semibold text-lg tracking-tight text-[var(--foreground)]">
            PorPor AGC
          </span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Sign In
        </h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          Access your saved documents, preferences, and writing history.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--foreground-muted)]">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="block w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all disabled:bg-[var(--surface-elevated)] disabled:text-[var(--foreground-muted)] disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--foreground-muted)]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-3.5 pr-10 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all disabled:bg-[var(--surface-elevated)] disabled:text-[var(--foreground-muted)] disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />
              Signing in…
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 text-center space-y-3">
        <p className="text-xs text-[var(--foreground-muted)]">
          Don&apos;t have an account?{' '}
          <Link href={registerHref} className="font-semibold text-[var(--primary)] hover:underline">
            Create one for free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense
          fallback={
            <div className="w-full max-w-md border border-[var(--border)] rounded-xl bg-[var(--background)] shadow-sm p-12 flex flex-col items-center justify-center">
              <RefreshCw className="w-7 h-7 animate-spin text-[var(--primary)]" />
              <p className="text-xs text-[var(--foreground-muted)] mt-3">Loading sign in…</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
