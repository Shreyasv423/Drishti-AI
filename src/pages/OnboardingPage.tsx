import React from 'react';
import { Volume2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import type { LanguageCode } from '../types/drishti';

const LANGUAGES: Array<{ code: LanguageCode; label: string; native: string }> = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
];

export const OnboardingPage: React.FC = () => {
  const { prefs, updatePrefs, t, speak, navigate } = useDrishti();

  const handleSelectLanguage = async (code: LanguageCode) => {
    await updatePrefs({ language: code });
    const sample =
      code === 'kn'
        ? 'ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ.'
        : code === 'hi'
          ? 'हिन्दी भाषा चुनी गई है।'
          : 'English language selected.';
    speak(sample, true);
  };

  const handleEnterDashboard = async () => {
    await updatePrefs({ onboardingCompleted: true });
    navigate('dashboard', t.dashboard.heading);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-sky-600 dark:text-sky-300 hc:text-yellow-300">
          DRISHTI · {t.tagline}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t.onboarding.welcomeTitle}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-200">
          {t.onboarding.welcomeBody}
        </p>
      </header>

      <section
        aria-labelledby="onboarding-language-heading"
        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
      >
        <h2 id="onboarding-language-heading" className="text-xl font-bold">
          {t.onboarding.chooseLanguage}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t.onboarding.chooseLanguage}>
          {LANGUAGES.map((lang) => {
            const active = prefs.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => void handleSelectLanguage(lang.code)}
                className={`flex min-h-[64px] flex-col items-start justify-center rounded-xl border p-4 text-left transition ${
                  active
                    ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold hc:bg-yellow-300 hc:text-black'
                    : 'border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 hc:border-white hc:bg-black hc:text-white'
                }`}
              >
                <span className="text-lg font-bold">{lang.native}</span>
                <span className={`text-sm ${active ? 'text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}>
                  {lang.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <label htmlFor="onboarding-speech-rate" className="block text-sm font-semibold">
              Speech Speed: <span className="font-mono-tabular">{prefs.speechRate.toFixed(1)}x</span>
            </label>
            <input
              id="onboarding-speech-rate"
              type="range"
              min={0.6}
              max={1.6}
              step={0.1}
              value={prefs.speechRate}
              onChange={(e) => void updatePrefs({ speechRate: Number(e.target.value) })}
              className="mt-2 w-full accent-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={() => speak(t.onboarding.speechSample, true)}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-base font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Volume2 className="h-5 w-5" aria-hidden="true" />
            <span>{t.onboarding.testSpeech}</span>
          </button>
        </div>
      </section>

      <section
        aria-labelledby="onboarding-privacy-heading"
        className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-sky-400" aria-hidden="true" />
          <div>
            <h2 id="onboarding-privacy-heading" className="text-xl font-bold">
              {t.onboarding.privacyTitle}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {t.onboarding.privacyBody}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void handleEnterDashboard()}
          className="inline-flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 text-lg font-extrabold text-slate-950 hover:bg-amber-300 hc:bg-yellow-300 hc:text-black"
        >
          <span>{t.onboarding.startButton}</span>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => navigate('auth')}
          className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-4 text-base font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <UserCheck className="h-5 w-5" aria-hidden="true" />
          <span>{t.onboarding.signInLink}</span>
        </button>
      </div>
    </div>
  );
};
