'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  FileEdit,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

const PUBLIC_LINKS = [
  { href: '/', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '/editor', label: 'Writing Editor' },
  { href: '#how-it-works', label: 'How It Works' },
];

const INTERNAL_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/editor', label: 'Writing Editor', icon: FileEdit },
  { href: '/documents', label: 'My Documents', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

type NavLink = { href: string; label: string; icon?: React.ElementType };

export default function Navbar() {
  const pathname = usePathname();
  const { effectiveTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isHomePage = pathname === '/';

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  const desktopLinks = isHomePage
    ? PUBLIC_LINKS
    : PUBLIC_LINKS.filter((l) => !l.href.startsWith('#'));

  const authedDesktopLinks = user
    ? isHomePage
      ? [
          { href: '/documents', label: 'My Documents', icon: BookOpen },
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
      : []
    : [];

  const mobileLinks: NavLink[] = isHomePage
    ? PUBLIC_LINKS as NavLink[]
    : [
        { href: '/', label: 'Home' },
        ...INTERNAL_LINKS,
      ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-blur]:bg-[var(--background)]/80">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="VerbaCraft Home">
            <div className="w-7 h-7 rounded-md bg-[var(--primary)] flex items-center justify-center text-white group-hover:bg-[var(--primary-hover)] transition-colors">
              <FileEdit className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base tracking-tight text-[var(--foreground)] sm:block">
              VerbaCraft
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Main navigation">
            {desktopLinks.map((link) => {
              const isActive = pathname === link.href || (link.href.startsWith('#') && false);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
            {authedDesktopLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={effectiveTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition-colors"
            >
              {effectiveTheme === 'dark' ? (
                <Sun className="w-4.5 h-4.5" />
              ) : (
                <Moon className="w-4.5 h-4.5" />
              )}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-[var(--surface-elevated)] text-[var(--foreground)] transition-colors"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white font-medium text-[10px] flex items-center justify-center">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline-block max-w-[130px] truncate">
                    {user.name || user.email}
                  </span>
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[var(--background)] border border-[var(--border)] shadow-lg py-2 z-50 animate-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-[var(--border)]">
                        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)] truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        href="/documents"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                      >
                        <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                        My Documents
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[var(--primary)]" />
                        Dashboard
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                      >
                        <Settings className="w-4 h-4 text-[var(--primary)]" />
                        Settings
                      </Link>

                      <div className="border-t border-[var(--border)] my-1" />

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Sign In
                </Link>
                <Button asChild size="sm">
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile navigation menu"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--background)] px-4 pb-4 space-y-1 animate-in fade-in duration-200">
          {mobileLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                    : 'text-[var(--foreground)] hover:bg-[var(--surface-elevated)]'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                {link.label}
              </Link>
            );
          })}

          {user && (
            <>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
