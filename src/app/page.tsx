'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Users,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { WRITING_MODES } from '@/lib/ai/types';

export default function HomePage() {
  const [demoInput, setDemoInput] = useState(
    'I has send the report yesterday but he not reply me yet.'
  );
  const [demoOutput, setDemoOutput] = useState(
    'I sent the report yesterday, but he has not replied to me yet.'
  );
  const [demoChecking, setDemoChecking] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
      q: 'Can I try the assistant without creating an account?',
      a: 'Yes! Guests can use the full writing editor, run grammar corrections, and test sentence rewrites immediately without registering.',
    },
    {
      q: 'What are the 10 Writing Modes?',
      a: 'Our 10 modes include Grammar Fix (strictly minimal edits), Improve Writing, Professional, Casual, Formal, Simplify, Shorten, Expand, Academic, and Friendly. Each mode contains dedicated editorial prompt engineering.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-transparent blur-3xl pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Next-Gen AI Writing & Grammar Platform</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
                Write Better.{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  Communicate Clearly.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                Fix grammar, improve your sentences, and make every word count with your
                intelligent, privacy-focused AI writing assistant.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/editor"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
                >
                  <span>Start Writing for Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#interactive-demo"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <span>Try Interactive Demo</span>
                </a>
              </div>
            </div>

            {/* INTERACTIVE DEMO WIDGET */}
            <div id="interactive-demo" className="max-w-4xl mx-auto scroll-mt-24">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-bold text-slate-400">
                      Live Grammar Demo
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Interactive
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Demo Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Original Text (Try editing it):
                    </label>
                    <textarea
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      rows={4}
                      className="w-full p-4 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-100 resize-none"
                    />
                    <button
                      onClick={handleDemoCheck}
                      disabled={demoChecking}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {demoChecking ? 'Analyzing...' : 'Correct Grammar Demo'}
                    </button>
                  </div>

                  {/* Demo Output */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Polished Result:
                    </label>
                    <div className="p-4 rounded-xl text-sm bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-slate-900 dark:text-slate-100 min-h-[104px] flex items-center font-medium leading-relaxed">
                      {demoOutput}
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>
                        2 errors fixed: Past tense form (&ldquo;sent&rdquo;) and prepositional verb
                        (&ldquo;replied to me&rdquo;).
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Simplicity by Design
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
                How It Works in 3 Steps
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                From rough draft to polished prose in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center mb-4 shadow-sm shadow-indigo-500/20">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Paste or Type Text
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter your draft into our distraction-free writing editor. Select your preferred
                  English variant (American or British).
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center mb-4 shadow-sm shadow-purple-500/20">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Choose Your Mode
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pick from 10 distinct writing modes: Minimal Grammar Fix, Professional, Casual,
                  Formal, Academic, Simplify, and more.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-4 shadow-sm shadow-emerald-500/20">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Review & Accept Suggestions
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Inspect highlighted error cards, understand the underlying grammar rules, accept or
                  dismiss individually, and export your polished text.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 10 WRITING MODES SHOWCASE */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Versatility
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
                10 Tailored Writing Modes
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                Every mode features custom editorial prompt engineering designed for real-world
                communication tasks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.values(WRITING_MODES).map((mode) => (
                <div
                  key={mode.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {mode.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                      {mode.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {mode.shortDescription}
                    </p>
                  </div>

                  <Link
                    href={`/editor`}
                    className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Try this mode →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFIT AUDIENCES */}
        <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Audience Solutions
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
                Engineered for Every Type of Writer
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  For Students & Learners
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Understand the &ldquo;why&rdquo; behind every correction with detailed grammar
                  rules. Refine academic papers and expand vocabulary without plagiarism risks.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  For Working Professionals
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Craft confident, professional emails, client proposals, and executive reports.
                  Adapt tone to suit managers, stakeholders, or international teammates.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  For Content Creators & ESL Speakers
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ensure English texts sound completely native, natural, and engaging. Catch false
                  friends, awkward idioms, and subtle preposition errors instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CTA BANNER */}
        <section className="py-16 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Ready to elevate your English writing?
            </h2>
            <p className="text-base sm:text-lg text-indigo-200 max-w-2xl mx-auto mb-8">
              Join thousands of writers, students, and professionals who communicate clearly and
              confidently every day.
            </p>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-indigo-950 bg-white hover:bg-indigo-50 shadow-xl transition-all hover:scale-105"
            >
              <span>Launch Writing Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              VerbaCraft • Grammar Correction Assistant
            </span>
          </div>

          <p className="text-xs text-slate-400 text-center sm:text-right">
            © 2026 VerbaCraft. Built with Next.js, TypeScript, Tailwind CSS &
            Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
