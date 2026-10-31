'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileEdit,
  BookOpen,
  Settings,
  X,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/editor', label: 'Writing Editor', icon: FileEdit },
  { href: '/documents', label: 'My Documents', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/editor') {
      return pathname.startsWith('/editor');
    }
    return pathname === href;
  };

  const userInitial = user?.name?.trim()
    ? user.name.trim().charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  const NavContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#131722] border-r border-slate-200/80 dark:border-slate-800/80">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
        <Link
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group"
          aria-label="VerbaCraft Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[#3647C8] flex items-center justify-center text-white shadow-xs group-hover:bg-[#2b39a8] transition-colors">
            <FileEdit className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
              VerbaCraft
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block leading-none">
              Writing Assistant
            </span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation sidebar"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
        role="navigation"
        aria-label="Internal Navigation"
      >
        <div className="px-3 pb-2">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Workspace
          </span>
        </div>

        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-[#EEF2FF] text-[#3647C8] dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 ${
                  active ? 'text-[#3647C8] dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Home Link / Help */}
      <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Product Features
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      {/* Account Section at Bottom */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#10141d]/50">
        {user ? (
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-[#3647C8] text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate group-hover:text-[#3647C8] dark:group-hover:text-indigo-300 transition-colors">
                {user.name || 'Writer'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </Link>
        ) : (
          <Link
            href="/auth/login"
            onClick={onCloseMobile}
            className="block text-center py-2 px-3 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            Sign In to VerbaCraft
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed/Sticky Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 sticky top-0 h-screen z-20">
        {NavContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {NavContent}
          </div>
        </div>
      )}
    </>
  );
}
