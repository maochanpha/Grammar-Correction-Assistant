import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PorPor AGC — AI Grammar Correction Assistant & Writing Studio',
  description:
    'Detect and correct grammar mistakes, spelling typos, punctuation errors, and refine sentence tone with an intelligent, privacy-first AI writing assistant.',
  keywords: [
    'PorPor AGC',
    'grammar checker',
    'grammar correction',
    'AI writing assistant',
    'spell check',
    'sentence rewriter',
    'Flesch readability',
    'writing tool',
  ],
  authors: [{ name: 'PorPor AGC Team' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'PorPor AGC — AI Grammar Correction Assistant',
    description:
      'Elevate your writing with accurate grammar correction, tone adjustment, and detailed explanations.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
