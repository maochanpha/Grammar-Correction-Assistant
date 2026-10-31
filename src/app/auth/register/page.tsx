'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  FileEdit,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);
    setError(null);

    const res = await register(name, email, password);
    if (!res.success) {
      setError(res.error || 'Registration failed');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md border border-[var(--border)] rounded-xl bg-[var(--background)] shadow-sm p-8">
          <div className="text-center space-y-2 mb-6">
            <Link href="/" className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[var(--primary)] flex items-center justify-center text-white">
                <FileEdit className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-base tracking-tight text-[var(--foreground)]">
                VerbaCraft
              </span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Create Account
            </h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Start writing with AI-powered grammar correction and tone optimization.
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
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[var(--foreground-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  label={undefined}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--foreground-muted)]">
                Email Address
              </label>
              <Input
                label={undefined}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold text-[var(--foreground-muted)]">
                Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="block w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-3.5 pr-10 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-colors disabled:bg-[var(--surface-elevated)] disabled:text-[var(--foreground-muted)] disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold text-[var(--foreground-muted)]">
                Confirm Password
              </label>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Type your password again"
                className="block w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-3.5 pr-10 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-colors disabled:bg-[var(--surface-elevated)] disabled:text-[var(--foreground-muted)] disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Passwords do not match.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />
                  Creating account…
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center space-y-3">
            <p className="text-xs text-[var(--foreground-muted)]">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-[var(--primary)] hover:underline">
                Sign in
              </Link>
            </p>

            <div className="border-t border-[var(--border-subtle)] pt-3">
              <Link
                href="/editor"
                className="text-xs font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Continue as Guest →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
