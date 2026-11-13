import React, { useState } from 'react';
import { Banknote, AlertTriangle, Volume2, ArrowLeft } from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { CameraCapturePanel } from '../components/CameraCapturePanel';
import { identifyCurrencyApi } from '../services/apiClient';
import type { CurrencyResult } from '../types/drishti';

export const CurrencyPage: React.FC = () => {
  const { t, prefs, isOnline, capabilities, speak, navigate, recordEvent } = useDrishti();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CurrencyResult | null>(null);

  const handleAnalyze = async (dataUrl: string, mimeType: string) => {
    setError('');
    if (!isOnline) {
      const msg = 'Currency recognition requires internet access for AI vision analysis.';
      setError(msg);
      speak(msg, true);
      await recordEvent('currency', 'offline_fallback');
      return;
    }
    if (!capabilities.geminiConfigured) {
      const msg = 'Gemini AI key is not configured on the server yet.';
      setError(msg);
      speak(msg, true);
      return;
    }

    setLoading(true);
    try {
      const res = await identifyCurrencyApi({
        imageBase64: dataUrl,
        mimeType,
        language: prefs.language,
      });
      setResult(res);
      speak(`${res.spokenSummary} ${res.disclaimer}`, true);
      await recordEvent('currency', res.confidence === 'low' ? 'uncertain' : 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to identify banknote.';
      setError(msg);
      speak(msg, true);
      await recordEvent('currency', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.dashboard.currencyTitle}</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Hold one Indian Rupee note flat under even lighting and capture a clear photo.
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

      <div
        role="note"
        className="flex items-start gap-3 rounded-2xl border border-amber-400/50 bg-amber-950/30 p-4 text-sm leading-relaxed text-amber-100"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
        <span>{t.safety.currencyWarning}</span>
      </div>

      <CameraCapturePanel
        onCapture={(dataUrl, mime) => void handleAnalyze(dataUrl, mime)}
        actionLabel="Identify Banknote"
        isProcessing={loading}
      />

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-500 bg-rose-950/40 p-4 text-base text-rose-100">
          {error}
        </div>
      )}

      {result && (
        <section
          aria-live="polite"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Banknote className="h-7 w-7 text-amber-400" aria-hidden="true" />
              <div>
                <h2 className="text-2xl font-extrabold font-mono-tabular">
                  {result.denomination}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t.common.confidenceLabel}: <span className="font-semibold capitalize">{result.confidence}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => speak(`${result.spokenSummary} ${result.disclaimer}`, true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>{t.common.repeat}</span>
            </button>
          </div>

          <p className="text-lg leading-relaxed">{result.spokenSummary}</p>

          {result.visualCues && (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-bold">Observed Cues: </span>
              {result.visualCues}
            </p>
          )}

          <p className="border-t border-slate-200 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
            {result.disclaimer}
          </p>
        </section>
      )}
    </div>
  );
};
