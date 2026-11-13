import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, LogOut, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { getSupabaseClient } from '../lib/supabase';

type AuthMode = 'login' | 'signup' | 'reset';

export const AuthPage: React.FC = () => {
  const { user, signOut, capabilities, navigate, speak, t } = useDrishti();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const supabase = getSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (!supabase) {
      const msg =
        'Supabase cloud authentication is not configured yet. DRISHTI continues in private Local Device Mode using IndexedDB.';
      setErrorMsg(msg);
      speak(msg, true);
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        const msg = 'Signed in successfully. Your preferences and trusted contacts can now sync.';
        setStatusMsg(msg);
        speak(msg, true);
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        const msg = 'Account created. Check your inbox if email verification is enabled.';
        setStatusMsg(msg);
        speak(msg, true);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        const msg = 'Password reset link sent to your email address.';
        setStatusMsg(msg);
        speak(msg, true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMsg(msg);
      speak(msg, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Account & Cloud Sync</h1>
        <button
          type="button"
          onClick={() => navigate('dashboard')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t.common.backHome}</span>
        </button>
      </div>

      {!capabilities.supabaseConfigured && (
        <div className="rounded-2xl border border-sky-400/50 bg-sky-950/30 p-5 text-slate-100">
          <h2 className="text-lg font-bold">Running in Local Device Mode</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-200">
            Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured. All accessibility settings, trusted contacts, consents, and saved documents are safely stored locally on this device in IndexedDB.
          </p>
        </div>
      )}

      {user ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B]">
          <h2 className="text-xl font-bold">Signed In</h2>
          <p className="mt-2 text-base text-slate-700 dark:text-slate-300">
            Account email: <span className="font-semibold">{user.email}</span>
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-base font-bold text-white hover:bg-rose-500"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-800" role="tablist">
            {[
              { id: 'login' as AuthMode, label: 'Sign In', icon: LogIn },
              { id: 'signup' as AuthMode, label: 'Create Account', icon: UserPlus },
              { id: 'reset' as AuthMode, label: 'Reset Password', icon: KeyRound },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setMode(tab.id);
                    setErrorMsg('');
                    setStatusMsg('');
                  }}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                    active
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4 max-w-md">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-fullname" className="block text-sm font-semibold mb-1.5">
                  Full Name
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-base dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-semibold mb-1.5">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-base dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="auth-password" className="block text-sm font-semibold mb-1.5">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-base dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            )}

            {errorMsg && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500 bg-rose-950/40 p-3 text-sm text-rose-100">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-300" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {statusMsg && (
              <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500 bg-emerald-950/40 p-3 text-sm text-emerald-100">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                <span>{statusMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-amber-400 px-5 py-3 text-base font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
            >
              {busy
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign In'
                  : mode === 'signup'
                    ? 'Create Account'
                    : 'Send Reset Link'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
