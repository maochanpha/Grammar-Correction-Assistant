'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Shield,
  Trash2,
  Check,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import InternalLayout from '@/components/InternalLayout';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { WRITING_MODES, WritingMode, LanguageVariant, ExplanationLevel } from '@/lib/ai/types';

export default function SettingsPage() {
  const { user, refreshUser, logout, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [preferredMode, setPreferredMode] = useState<WritingMode>('grammar_fix');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageVariant>('en-US');
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('simple');
  const [autoSave, setAutoSave] = useState(true);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login?redirect=/settings');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (user.preferences) {
        setPreferredMode((user.preferences.preferredWritingMode as WritingMode) || 'grammar_fix');
        setPreferredLanguage(user.preferences.preferredEnglishVariant || 'en-US');
        setExplanationLevel(user.preferences.explanationLevel || 'simple');
        setAutoSave(user.preferences.autoSave ?? true);
      }
    }
  }, [user]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPrefSaving(true);
    setPrefSaveSuccess(false);

    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredWritingMode: preferredMode,
          preferredEnglishVariant: preferredLanguage,
          explanationLevel,
          autoSave,
        }),
      });

      if (res.ok) {
        setPrefSaveSuccess(true);
        await refreshUser();
        setTimeout(() => setPrefSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPrefSaving(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAccountSaving(true);
    setAccountMsg(null);

    try {
      const res = await fetch('/api/auth/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAccountMsg({ type: 'error', text: data.error || 'Failed to update account information.' });
      } else {
        setAccountMsg({ type: 'success', text: 'Account information updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        await refreshUser();
        setTimeout(() => setAccountMsg(null), 3500);
      }
    } catch {
      setAccountMsg({ type: 'error', text: 'Network error updating account information.' });
    } finally {
      setAccountSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/account', { method: 'DELETE' });
      if (res.ok) {
        await logout();
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <InternalLayout title="Settings" maxWidth="max-w-4xl">
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-slate-500">
          <RefreshCw className="w-7 h-7 animate-spin text-[#3647C8]" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">
            Loading settings…
          </p>
        </div>
      </InternalLayout>
    );
  }

  if (!user) {
    return (
      <InternalLayout title="Settings" maxWidth="max-w-4xl">
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#3647C8] dark:text-indigo-400 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Sign In to Access Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Configure writing preferences, appearance, and account credentials.
          </p>
          <Button asChild>
            <Link href="/auth/login?redirect=/settings">Sign In</Link>
          </Button>
        </div>
      </InternalLayout>
    );
  }

  return (
    <InternalLayout title="Settings" maxWidth="max-w-4xl">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal profile, writing defaults, and workspace appearance.
          </p>
        </div>

        {/* Global Feedback Banner */}
        {accountMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              accountMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60'
                : 'bg-red-50 text-red-800 border border-red-200/80 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/60'
            }`}
          >
            {accountMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>{accountMsg.text}</span>
          </div>
        )}

        {/* SECTION 1: Profile Information */}
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-[#3647C8] dark:text-indigo-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Profile Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage your personal account information and credentials.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveAccount} className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full h-9.5 px-3 py-2 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8] transition-colors"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full h-9.5 px-3 py-2 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Email is linked to your account and cannot be modified here.
                </p>
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-3">
                Change Password (optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-9.5 px-3 py-2 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full h-9.5 px-3 py-2 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={accountSaving} className="shadow-xs">
                {accountSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving…
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* SECTION 2: Writing Preferences */}
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-[#3647C8] dark:text-indigo-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Writing Preferences
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize default settings for the AI editor and correction engine.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSavePreferences} className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Default Writing Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Writing Mode
                </label>
                <select
                  value={preferredMode}
                  onChange={(e) => setPreferredMode(e.target.value as WritingMode)}
                  className="w-full h-9.5 px-3 py-2 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8] transition-colors"
                >
                  {Object.values(WRITING_MODES).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred English Variant */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Preferred English Variant
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value as LanguageVariant)}
                  className="w-full h-9.5 px-3 py-2 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8] transition-colors"
                >
                  <option value="en-US">American English (en-US)</option>
                  <option value="en-GB">British English (en-GB)</option>
                </select>
              </div>

              {/* Explanation Depth */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Explanation Depth
                </label>
                <select
                  value={explanationLevel}
                  onChange={(e) => setExplanationLevel(e.target.value as ExplanationLevel)}
                  className="w-full h-9.5 px-3 py-2 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8] transition-colors"
                >
                  <option value="simple">Simple (Concise editorial summary)</option>
                  <option value="detailed">Detailed (Grammar rules &amp; linguistic rationale)</option>
                </select>
              </div>
            </div>

            {/* D. Auto-Save Control Row */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Automatic Document Saving
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automatically save changes while you write in the editor.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3647C8]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              {prefSaveSuccess ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Preferences saved successfully!
                </span>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={prefSaving} className="shadow-xs">
                {prefSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving…
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* SECTION 3: Appearance */}
        <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-[#3647C8] dark:text-indigo-400">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Appearance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose how PorPor AGC looks on your device.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Clean, bright workspace' },
              { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Comfortable in low light' },
              { id: 'system', label: 'System Match', icon: Laptop, desc: 'Syncs with your OS theme' },
            ].map((t) => {
              const Icon = t.icon;
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as 'light' | 'dark' | 'system')}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-150 ${
                    active
                      ? 'border-[#3647C8] bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-[#3647C8]'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        active
                          ? 'bg-[#3647C8] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {active && <Check className="w-4 h-4 text-[#3647C8] dark:text-indigo-400" />}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: Privacy & Account */}
        <section className="rounded-xl border border-red-200/80 dark:border-red-950/50 bg-white dark:bg-[#131722] shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Privacy &amp; Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your data retention and account lifecycle.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-red-100 dark:border-red-950/60 bg-red-50/30 dark:bg-red-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">
                Delete Account
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                Permanently deletes your profile, saved documents, session history, and preferences.
                This action is irreversible.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete Account
            </Button>
          </div>
        </section>
      </div>

      {/* Delete Account Dialog */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account Permanently"
        description="Are you absolutely sure? All your saved writings, grammar correction history, and profile data will be permanently wiped."
      >
        <div className="flex items-center justify-end gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? 'Deleting Account…' : 'Yes, Delete My Account'}
          </Button>
        </div>
      </Modal>
    </InternalLayout>
  );
}
