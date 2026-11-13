import React, { useEffect, useState } from 'react';
import { Search, Volume2, ArrowLeft } from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { CameraCapturePanel } from '../components/CameraCapturePanel';
import { findObjectApi } from '../services/apiClient';
import type { ObjectFinderResult } from '../types/drishti';

const PRESET_ITEMS = ['Keys', 'Water Bottle', 'Glasses', 'Medicine Box', 'Wallet', 'Phone'];

export const ObjectFinderPage: React.FC = () => {
  const {
    t,
    prefs,
    pendingFinderQuery,
    setPendingFinderQuery,
    isOnline,
    capabilities,
    speak,
    navigate,
    recordEvent,
  } = useDrishti();

  const [targetObject, setTargetObject] = useState(pendingFinderQuery || 'Keys');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ObjectFinderResult | null>(null);

  useEffect(() => {
    if (pendingFinderQuery) {
      setTargetObject(pendingFinderQuery);
      setPendingFinderQuery('');
    }
  }, [pendingFinderQuery, setPendingFinderQuery]);

  const handleFind = async (dataUrl: string, mimeType: string) => {
    setError('');
    if (!targetObject.trim()) {
      setError('Please enter or select an item to search for.');
      return;
    }
    if (!isOnline) {
      const msg = 'Object finder requires an internet connection for AI vision.';
      setError(msg);
      speak(msg, true);
      return;
    }
    if (!capabilities.geminiConfigured) {
      const msg = 'Gemini AI key is not configured on the server.';
      setError(msg);
      speak(msg, true);
      return;
    }

    setLoading(true);
    try {
      const res = await findObjectApi({
        imageBase64: dataUrl,
        mimeType,
        targetObject: targetObject.trim(),
        language: prefs.language,
      });
      setResult(res);
      const directionText =
        res.found && res.relativeDirection !== 'unknown'
          ? `Position: ${res.relativeDirection}. `
          : '';
      speak(`${directionText}${res.guidance}`, true);
      await recordEvent('finder', res.found ? 'success' : 'uncertain');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to search frame.';
      setError(msg);
      speak(msg, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.dashboard.finderTitle}</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Specify an everyday item and scan a camera frame or photo to locate it.
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-4">
        <div>
          <label htmlFor="target-object-input" className="block text-sm font-bold mb-1.5">
            Item to find
          </label>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              id="target-object-input"
              type="text"
              value={targetObject}
              onChange={(e) => setTargetObject(e.target.value)}
              placeholder="Type item name (e.g., keys, spectacles, charger)"
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-base dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Common everyday items">
          {PRESET_ITEMS.map((item) => {
            const active = targetObject.toLowerCase() === item.toLowerCase();
            return (
              <button
                key={item}
                type="button"
                onClick={() => setTargetObject(item)}
                className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-bold transition ${
                  active
                    ? 'border-amber-400 bg-amber-400 text-slate-950'
                    : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>

      <CameraCapturePanel
        onCapture={(dataUrl, mime) => void handleFind(dataUrl, mime)}
        actionLabel={`Search for ${targetObject || 'Item'}`}
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
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {result.found ? `Found: ${targetObject}` : `Not clearly visible: ${targetObject}`}
            </h2>
            <button
              type="button"
              onClick={() => speak(result.guidance, true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>{t.common.repeat}</span>
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t.common.confidenceLabel}: <span className="capitalize">{result.confidence}</span>
            {result.relativeDirection && result.relativeDirection !== 'unknown'
              ? ` · Direction: ${result.relativeDirection}`
              : ''}
          </p>
          <p className="text-lg leading-relaxed">{result.guidance}</p>
        </section>
      )}
    </div>
  );
};
