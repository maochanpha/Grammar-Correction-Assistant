'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileEdit,
  GraduationCap,
  Briefcase,
  Users,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { WRITING_MODES } from '@/lib/ai/types';

const FEATURES = [
  {
    name: 'Grammar & Spelling',
    desc: 'Fix typos, grammatical errors, and punctuation mistakes with precision.',
  },
  {
    name: 'Sentence Rewriting',
    desc: 'Rephrase awkward sentences for better flow and clarity.',
  },
  {
    name: 'Tone Adjustment',
    desc: 'Shift your writing between casual, professional, formal, and friendly registers.',
  },
  {
    name: 'Clarity Improvements',
    desc: 'Remove wordiness and make your message easier to understand.',
  },
  {
    name: 'Readability Insights',
    desc: 'Get Flesch readability scores and grade-level guidance for your text.',
  },
  {
    name: 'Writing History',
    desc: 'Access your past documents and corrections anytime from your dashboard.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Write or paste your text',
    desc: 'Open the editor and drop in your draft, or start writing from scratch.',
  },
  {
    num: '02',
    title: 'Review suggestions',
    desc: 'Inspect highlighted grammar, spelling, and clarity suggestions with plain-language explanations.',
  },
  {
    num: '03',
    title: 'Apply improvements',
    desc: 'Accept or dismiss each suggestion individually and export your polished text.',
  },
];

const USERS = [
  {
    name: 'Students',
    Icon: GraduationCap,
    desc: 'Refine essays, papers, and assignments while learning from every correction.',
  },
  {
    name: 'Professionals',
    Icon: Briefcase,
    desc: 'Write confident emails, proposals, and reports that sound polished and authoritative.',
  },
  {
    name: 'Everyday Writers',
    Icon: Users,
    desc: 'Improve messages, blog posts, and notes so every word communicates clearly.',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const editorHref = user ? '/editor' : '/auth/login?redirect=/editor';

  const [demoInput, setDemoInput] = useState(
    'I has send the report yesterday but he not reply me yet.'
  );
  const [demoOutput, setDemoOutput] = useState(
    'I sent the report yesterday, but he has not replied to me yet.'
  );
  const [demoChecking, setDemoChecking] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDemoCheck = () => {
    setDemoChecking(true);
    setTimeout(() => {
      if (demoInput.includes('I has send')) {
        setDemoOutput('I sent the report yesterday, but he has not replied to me yet.');
      } else {
        setDemoOutput(
          demoInput
            .replace(/\bhas send\b/gi, 'sent')
            .replace(/\bnot reply me\b/gi, 'has not replied to me')
            .replace(/\bdont\b/gi, "doesn't")
            .replace(/\bmore better\b/gi, 'better')
        );
      }
      setDemoChecking(false);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(demoOutput);
  };

  const FAQS = [
    {
      q: 'How does Grammar Correction Assistant differ from generic AI chatbots?',
      a: 'Unlike generic chatbots, our platform is purpose-built as an editorial engine. It strictly preserves your factual meaning, calculates character-accurate offsets for individual suggestions, provides Flesch readability scoring, offers 10 specialized writing registers, and never invents citations or claims.',
    },
    {
      q: 'Is my submitted writing private and secure?',
      a: 'Absolutely. We do not use your private writing to train AI models. All API requests are processed server-side with strict encryption. Guest text is never permanently stored, and authenticated users retain full control to edit or delete documents at any time.',
    },
    {
      q: 'Can I choose between American and British English?',
      a: 'Yes. You can switch between American English (en-US) and British English (en-GB) at any moment. The engine automatically adapts spelling (e.g., color vs. colour, organize vs. organise) and punctuation rules.',
    },
    {
      q: 'Do I need an account to use the assistant?',
      a: 'Yes, please sign in or register for a free account to access the full writing editor, grammar corrections, tone adjustments, and document history.',
    },
    {
      q: 'What are the 10 Writing Modes?',
      a: 'Our 10 modes include Grammar Fix (strictly minimal edits), Improve Writing, Professional, Casual, Formal, Simplify, Shorten, Expand, Academic, and Friendly. Each mode contains dedicated editorial prompt engineering.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-10 sm:pt-16 pb-12 sm:pb-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center ${
                mounted ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-700 ease-out`}
            >
              {/* Left column */}
              <div className="space-y-6">
                <span className="text-xs font-semibold tracking-wider text-[var(--foreground-muted)] uppercase">
                  Your everyday writing companion
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.2] text-[var(--foreground)]">
                  Better writing starts here.
                </h1>
                <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed">
                  Make your writing clearer, more natural, and more confident. Correct mistakes,
                  improve sentences, and find the right words for every situation.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={editorHref}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    <span>Start Writing</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#features"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[var(--foreground)] border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-elevated)] transition-colors"
                  >
                    Explore Features
                  </a>
                </div>
                <p className="text-xs text-[var(--foreground-muted)]">
                  From quick messages to important documents.
                </p>
              </div>

              {/* Right column: editor preview */}
              <div className="relative">
                <div className="border border-[var(--border)] rounded-xl shadow-sm overflow-hidden bg-[var(--background)]">
                  <div className="border-b border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between bg-[var(--surface-elevated)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--foreground-muted)]/30" />
                      <div className="w-2 h-2 rounded-full bg-[var(--foreground-muted)]/30" />
                      <div className="w-2 h-2 rounded-full bg-[var(--foreground-muted)]/30" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                        Document
                      </span>
                      <span className="mx-0.5">•</span>
                      <span>en-US</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-[var(--foreground)]">
                      The quarterly report{' '}
                      <span className="underline decoration-[var(--cat-grammar-border)] decoration-[2px] underline-offset-3">
                        was submitted
                      </span>{' '}
                      yesterday, but the client{' '}
                      <span className="underline decoration-[var(--cat-grammar-border)] decoration-[2px] underline-offset-3">
                        has not
                      </span>{' '}
                      responded yet.
                    </p>
                    <div className="mt-5 flex items-center gap-3 px-3 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                      <span className="w-6 h-6 rounded-md border border-[var(--border)] flex items-center justify-center text-[10px] font-medium text-[var(--foreground-muted)] shrink-0">
                        S
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                          Suggestion
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm text-[var(--foreground)] line-through">has not responded</span>
                          <span className="text-xs text-[var(--foreground-muted)]">→</span>
                          <span className="text-sm font-medium text-[var(--primary)]">has not replied</span>
                        </div>
                      </div>
                      <button
                        className="px-3 py-1.5 rounded-md text-[10px] font-semibold text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary-light)] transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
                <p className="absolute -right-6 bottom-4 text-xs text-[var(--foreground-muted)] hidden sm:block">
                  Writing editor preview
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE GRAMMAR DEMO */}
        <section id="interactive-demo" className="py-14 sm:py-20 border-t border-[var(--border)]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-10">
              <span className="text-xs font-semibold tracking-wider text-[var(--foreground-muted)] uppercase">
                Try it
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2 mb-4">
                See it in action
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                Paste or type a sentence below to see how PorPor AGC improves it.
              </p>
            </div>

            <div
              className={`rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-sm p-5 sm:p-7 ${
                mounted ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-700 ease-out`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Your Text */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Your Text</h3>
                    <p className="ml-auto text-xs text-[var(--foreground-muted)]">Editable input</p>
                  </div>
                  <textarea
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    rows={5}
                    className="w-full p-4 rounded-lg text-sm text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none transition-colors"
                    placeholder="Type or paste your text here…"
                  />
                  <button
                    onClick={handleDemoCheck}
                    disabled={demoChecking}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {demoChecking ? 'Checking…' : 'Check Grammar'}
                  </button>
                </div>

                {/* Improved Version */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Improved Version</h3>
                    <button
                      onClick={handleCopy}
                      disabled={!demoOutput || demoOutput === demoInput}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <div className="min-h-[104px] flex items-center p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-sm text-[var(--foreground)] leading-relaxed font-medium">
                    {demoOutput}
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] text-xs text-[var(--foreground-muted)]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {demoChecking ? 'Analyzing your text…' : '2 improvements detected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-14 sm:py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-12 text-center">
              <span className="text-xs font-semibold tracking-wider text-[var(--foreground-muted)] uppercase">
                Features
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2 mb-4">
                Everything you need to write with confidence.
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                A focused set of editorial tools built for real-world writing tasks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feature) => (
                <div
                  key={feature.name}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-shadow"
                >
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-14 sm:py-20 border-t border-[var(--border)]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-12 text-center">
              <span className="text-xs font-semibold tracking-wider text-[var(--foreground-muted)] uppercase">
                How it works
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2 mb-4">
                A simpler way to improve your writing.
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                From rough draft to polished prose, in three steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center mb-3 text-[var(--primary)] font-bold text-sm">
                    {step.num}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WRITING MODES */}
        <section id="writing-modes" className="py-14 sm:py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-12 text-center">
              <span className="text-xs font-semibold tracking-wider text-[var(--foreground-muted)] uppercase">
                Writing modes
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2 mb-4">
                Ten ways to write better.
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                Choose the register that fits your audience and purpose.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.values(WRITING_MODES).map((mode) => (
                <Link
                  key={mode.id}
                  href={editorHref}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-shadow flex flex-col"
                >
                  <div className="mb-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--foreground-muted)]">
                      {mode.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1.5">
                    {mode.name}
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed flex-1">
                    {mode.shortDescription}
                  </p>
                  <span className="mt-3 pt-2 border-t border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--primary)] hover:underline">
                    Open in editor
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* TARGET USERS */}
        <section id="target-users" className="py-14 sm:py-20 border-t border-[var(--border)] bg-[var(--surface-elevated)]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-12 text-center">
              <span className="text-xs font-semibold tracking-wider text-[var(--foreground-muted)] uppercase">
                For everyone who writes
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2 mb-4">
                Built for students, professionals, and everyday writers.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {USERS.map((user) => (
                <div key={user.name} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm">
                  <div className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--primary)] mb-4">
                    <user.Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                    {user.name}
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {user.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="py-14 sm:py-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-8 sm:p-12 text-center shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mb-4">
                Make every word count.
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed max-w-xl mx-auto mb-8">
                Start improving your writing with PorPor AGC.
              </p>
              <Link
                href={editorHref}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors"
              >
                <span>Open Writing Editor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 sm:py-20 border-t border-[var(--border)]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto mb-10 text-center">
              <span className="text-xs font-semibold tracking-wider text-[var(--foreground-muted)] uppercase">
                FAQ
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2 mb-4">
                Frequently asked questions
              </h2>
            </div>

            <div className="max-w-2xl mx-auto space-y-2">
              {FAQS.map((faq) => {
                const isOpen = activeFaq === faq.q;
                return (
                  <div
                    key={faq.q}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : faq.q)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--foreground-muted)] transition-transform shrink-0 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-[var(--foreground-muted)] leading-relaxed border-t border-[var(--border)]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] bg-[var(--background)] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="PorPor AGC Logo"
              width={26}
              height={26}
              className="w-6.5 h-6.5 rounded-md object-contain shadow-xs"
            />
            <span className="font-semibold text-sm tracking-tight text-[var(--foreground)]">
              PorPor AGC
            </span>
          </div>

          <p className="text-xs text-[var(--foreground-muted)]">
            © 2026 PorPor AGC. Built with Next.js, TypeScript, Tailwind CSS & Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
