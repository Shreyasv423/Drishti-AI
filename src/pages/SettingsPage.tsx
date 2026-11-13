import React, { useState } from 'react';
import { ArrowLeft, Trash2, Download, Volume2 } from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { PWAInstallButton } from '../components/PWAInstallButton';
import type { LanguageCode, TextScale, ThemeMode } from '../types/drishti';

export const SettingsPage: React.FC = () => {
  const {
    t,
    prefs,
    updatePrefs,
    consents,
    updateConsents,
    voices,
    speak,
    clearLocalUserData,
    navigate,
    contacts,
    documents,
  } = useDrishti();

  const [clearFeedback, setClearFeedback] = useState('');

  const handleExportLocalData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      preferences: prefs,
      consents,
      trustedContacts: contacts,
      savedDocuments: documents,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drishti-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    speak('Local data backup exported.', true);
  };

  const handleClearData = async () => {
    await clearLocalUserData();
    setClearFeedback('All local contacts, documents, and custom preferences have been cleared.');
    speak('Local data cleared.', true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.nav.settings} & Privacy</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Customize speech rate, language, contrast theme, text size, and permission consents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('dashboard')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{t.common.backHome}</span>
        </button>
      </div>

      {/* Speech & Language */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-5">
        <h2 className="text-xl font-bold">Language & Voice Output</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pref-language" className="block text-sm font-bold mb-1.5">
              App & Voice Language
            </label>
            <select
              id="pref-language"
              value={prefs.language}
              onChange={(e) => void updatePrefs({ language: e.target.value as LanguageCode })}
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          <div>
            <label htmlFor="pref-voice" className="block text-sm font-bold mb-1.5">
              System Speech Voice
            </label>
            <select
              id="pref-voice"
              value={prefs.preferredVoiceUri}
              onChange={(e) => void updatePrefs({ preferredVoiceUri: e.target.value })}
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Automatic (match selected language)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <label htmlFor="pref-speed" className="block text-sm font-bold">
              Speech Speed: <span className="font-mono-tabular">{prefs.speechRate.toFixed(1)}x</span>
            </label>
            <input
              id="pref-speed"
              type="range"
              min={0.6}
              max={1.8}
              step={0.1}
              value={prefs.speechRate}
              onChange={(e) => void updatePrefs({ speechRate: Number(e.target.value) })}
              className="mt-2 w-full accent-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={() => speak(t.onboarding.speechSample, true)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-sky-400 px-5 py-3 text-sm font-bold text-slate-950"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            <span>{t.onboarding.testSpeech}</span>
          </button>
        </div>

        <label className="flex min-h-[44px] items-center gap-3 text-base font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.autoSpeakResults}
            onChange={(e) => void updatePrefs({ autoSpeakResults: e.target.checked })}
            className="h-5 w-5 accent-amber-400"
          />
          <span>Automatically speak AI and OCR results</span>
        </label>
      </section>

      {/* Display & Contrast */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-5">
        <h2 className="text-xl font-bold">Display, Contrast & Motion</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pref-theme" className="block text-sm font-bold mb-1.5">
              Visual Theme
            </label>
            <select
              id="pref-theme"
              value={prefs.theme}
              onChange={(e) => void updatePrefs({ theme: e.target.value as ThemeMode })}
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="navy">Dark Navy (Calm Low-Glare)</option>
              <option value="light">Daylight White</option>
              <option value="high-contrast">Pure Black High Contrast</option>
            </select>
          </div>

          <div>
            <label htmlFor="pref-scale" className="block text-sm font-bold mb-1.5">
              Text Size
            </label>
            <select
              id="pref-scale"
              value={prefs.textScale}
              onChange={(e) => void updatePrefs({ textScale: e.target.value as TextScale })}
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="standard">Standard (100%)</option>
              <option value="large">Large (112%)</option>
              <option value="xl">Extra Large (122%)</option>
            </select>
          </div>
        </div>

        <label className="flex min-h-[44px] items-center gap-3 text-base font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.reducedMotion}
            onChange={(e) => void updatePrefs({ reducedMotion: e.target.checked })}
            className="h-5 w-5 accent-amber-400"
          />
          <span>Reduce UI animations and smooth scrolling</span>
        </label>
      </section>

      {/* Privacy & Consents */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-4">
        <h2 className="text-xl font-bold">Privacy & Explicit Consents</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          DRISHTI never caches camera frames or sensitive API responses in shared service worker caches.
        </p>

        <div className="space-y-2">
          {[
            { key: 'cameraConsent' as const, label: 'Allow on-demand camera access when I open visual tools' },
            { key: 'microphoneConsent' as const, label: 'Allow microphone access when I press Speak Command' },
            { key: 'locationShareConsent' as const, label: 'Allow manual location sharing in Navigation' },
            { key: 'sosLocationConsent' as const, label: 'Allow GPS coordinates in confirmed Emergency SOS alerts' },
            { key: 'cloudAiConsent' as const, label: 'Allow sending captured frames to Gemini API when online' },
          ].map((item) => (
            <label key={item.key} className="flex min-h-[44px] items-center gap-3 text-sm font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={consents[item.key]}
                onChange={(e) => void updateConsents({ [item.key]: e.target.checked })}
                className="h-5 w-5 accent-amber-400"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <PWAInstallButton />
          <button
            type="button"
            onClick={handleExportLocalData}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-700"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export Local Backup</span>
          </button>
          <button
            type="button"
            onClick={() => void handleClearData()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-500/60 px-4 py-2 text-sm font-bold text-rose-400 hover:bg-rose-950/30"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>Clear Local Data</span>
          </button>
        </div>

        {clearFeedback && (
          <p role="status" className="text-sm font-semibold text-emerald-400">
            {clearFeedback}
          </p>
        )}
      </section>
    </div>
  );
};
