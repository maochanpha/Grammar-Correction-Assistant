'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import InternalHeader from '@/components/InternalHeader';

interface InternalLayoutProps {
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
}

export default function InternalLayout({
  children,
  title,
  maxWidth = 'max-w-7xl',
}: InternalLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <InternalHeader
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          title={title}
        />

        <main className="flex-1 w-full min-w-0">
          <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
