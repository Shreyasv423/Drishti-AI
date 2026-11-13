import React, { useState } from 'react';
import { Volume2, AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { CameraCapturePanel } from '../components/CameraCapturePanel';
import { describeSceneApi } from '../services/apiClient';
import type { SceneDescriptionResult } from '../types/drishti';

export const CameraAssistantPage: React.FC = () => {
  const { t, prefs, isOnline, capabilities, speak, navigate, recordEvent } = useDrishti();
  const [focusPrompt, setFocusPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SceneDescriptionResult | null>(null);

  const handleAnalyze = async (dataUrl: string, mimeType: string) => {
    setError('');
    if (!isOnline) {
      const msg = 'You are offline. AI scene description requires an internet connection. Try the Offline OCR Reader or Color Detector.';
      setError(msg);
      speak(msg, true);
      await recordEvent('camera', 'offline_fallback');
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
      const res = await describeSceneApi({
        imageBase64: dataUrl,
        mimeType,
        language: prefs.language,
        focusPrompt,
      });
      setResult(res);
      const speechOutput = [
        res.description,
        res.confidence === 'low' ? 'Confidence is low. Please steady the camera or add light.' : '',
        res.uncertaintyNote,
      ]
        .filter(Boolean)
        .join(' ');
      speak(speechOutput, true);
      await recordEvent('camera', res.confidence === 'low' ? 'uncertain' : 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to analyze scene.';
      setError(msg);
      speak(msg, true);
      await recordEvent('camera', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.dashboard.cameraTitle}</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Capture a frame or upload a photo to hear a clear description of visible surroundings.
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
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
        <span>{t.safety.visionDisclaimer}</span>
      </div>

      <CameraCapturePanel
        onCapture={(dataUrl, mime) => void handleAnalyze(dataUrl, mime)}
        actionLabel={t.common.captureAnalyze}
        isProcessing={loading}
      >
        <div className="space-y-2">
          <label htmlFor="camera-focus-input" className="block text-sm font-semibold">
            Optional focus question (for example: "Is there a chair on the table?" or "What is on the sign?")
          </label>
          <input
            id="camera-focus-input"
            type="text"
            value={focusPrompt}
            onChange={(e) => setFocusPrompt(e.target.value)}
            placeholder="Leave blank for general scene description"
            className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-base dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </CameraCapturePanel>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-500 bg-rose-950/40 p-4 text-base text-rose-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <section
          aria-live="polite"
          aria-label="Scene description result"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {t.common.confidenceLabel}: <span className="capitalize">{result.confidence}</span>
            </h2>
            <button
              type="button"
              onClick={() => speak(result.description, true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>{t.common.repeat}</span>
            </button>
          </div>

          <p className="text-lg leading-relaxed">{result.description}</p>

          {result.uncertaintyNote && (
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Note: {result.uncertaintyNote}
            </p>
          )}

          {result.objects.length > 0 && (
            <div>
              <h3 className="text-base font-bold">Visible Items</h3>
              <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                {result.objects.map((obj, idx) => (
                  <li key={`${obj.name}-${idx}`} className="flex items-center justify-between py-2.5 text-base">
                    <span className="font-semibold">{obj.name}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{obj.position}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="border-t border-slate-200 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
            {result.safetyReminder}
          </p>
        </section>
      )}
    </div>
  );
};
