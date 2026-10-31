'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  LogOut,
  Settings,
  BookOpen,
  LayoutDashboard,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface InternalHeaderProps {
  onOpenMobileMenu?: () => void;
  title?: string;
}

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview of your writing workspace and activity',
  },
  '/editor': {
    title: 'Writing Editor',
    subtitle: 'Polish grammar, style, and tone with AI assistance',
  },
  '/documents': {
    title: 'My Documents',
    subtitle: 'Organize and manage your saved writing documents',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Manage your preferences, appearance, and account',
  },
};

export default function InternalHeader({ onOpenMobileMenu, title }: InternalHeaderProps) {
  const pathname = usePathname();
  const { effectiveTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const matched = PAGE_TITLES[pathname] || { title: 'Workspace' };
  const displayTitle = title || matched.title;

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  const userInitial = user?.name?.trim()
    ? user.name.trim().charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#131722]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0">
      {/* Left: Mobile Menu Toggle & Title / Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors hidden sm:inline-block"
            >
              Workspace
            </Link>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline-block">/</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {displayTitle}
            </span>
          </nav>
        </div>
      </div>

      {/* Right: Actions, Theme Toggle, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          {effectiveTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Profile Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-full bg-[#3647C8] text-white font-semibold text-xs flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900">
                {userInitial}
              </div>
              <span className="text-sm font-medium hidden md:inline-block max-w-[130px] truncate">
                {user.name || user.email}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-150" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#161B26] border border-slate-200/90 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.name || 'Writer'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </Link>
                    <Link
                      href="/documents"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      My Documents
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Settings
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
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
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-2.5 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
