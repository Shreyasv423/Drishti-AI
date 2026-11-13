import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Pill,
} from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { CameraCapturePanel } from '../components/CameraCapturePanel';
import { runOfflineOcr } from '../services/ocr';
import { pauseSpeech, resumeSpeech } from '../services/speech';
import type { LanguageCode } from '../types/drishti';

export const OcrReaderPage: React.FC = () => {
  const { t, prefs, updatePrefs, speak, addDocument, navigate, recordEvent } = useDrishti();
  const [ocrLang, setOcrLang] = useState<LanguageCode>(prefs.language);
  const [medicineMode, setMedicineMode] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState('');
  const [paused, setPaused] = useState(false);

  const handleOcrCapture = async (dataUrl: string) => {
    setError('');
    setSavedNotice('');
    setProcessing(true);
    setProgress(0);
    setStatusText('Initializing OCR engine...');
    speak('Reading text from image. Please wait.');

    try {
      const output = await runOfflineOcr(dataUrl, ocrLang, (pct, status) => {
        setProgress(pct);
        setStatusText(status);
      });

      if (!output.text) {
        const msg = 'No clear text was found. Hold the page flat in brighter light and try again.';
        setExtractedText('');
        setConfidence(0);
        setError(msg);
        speak(msg, true);
        await recordEvent('ocr', 'uncertain');
        return;
      }

      setExtractedText(output.text);
      setConfidence(output.confidence);
      setPaused(false);

      const spokenIntro = medicineMode ? `${t.safety.medicineWarning} ` : '';
      const lowConfNote =
        output.confidence < 60
          ? 'Text recognition confidence is low. Please verify important numbers. '
          : '';
      speak(`${spokenIntro}${lowConfNote}${output.text}`, true);
      await recordEvent('ocr', output.confidence < 60 ? 'uncertain' : 'success');
    } catch (err) {
      const msg =
        err instanceof Error
          ? `OCR failed: ${err.message}`
          : 'Unable to read text from this image.';
      setError(msg);
      speak(msg, true);
      await recordEvent('ocr', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveToLearning = async () => {
    if (!extractedText.trim()) return;
    const words = extractedText.trim().split(/\s+/).length;
    await addDocument({
      title: medicineMode ? 'Medicine Label Scan' : `Scanned Text (${new Date().toLocaleDateString()})`,
      sourceType: 'ocr_scan',
      language: ocrLang,
      extractedText,
      wordCount: words,
    });
    setSavedNotice('Saved to your Learning Library for offline listening.');
    speak('Saved to Learning Library.', true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.dashboard.ocrTitle}</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Offline-capable optical character recognition for books, documents, menus, and labels.
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

      {/* OCR Options */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ocr-language-select" className="block text-sm font-bold mb-1.5">
              Document Language
            </label>
            <select
              id="ocr-language-select"
              value={ocrLang}
              onChange={(e) => setOcrLang(e.target.value as LanguageCode)}
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="en">English (eng)</option>
              <option value="kn">Kannada + English (kan+eng)</option>
              <option value="hi">Hindi + English (hin+eng)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              role="switch"
              aria-checked={medicineMode}
              onClick={() => setMedicineMode((v) => !v)}
              className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-2 text-left text-sm font-bold transition ${
                medicineMode
                  ? 'border-amber-400 bg-amber-400 text-slate-950'
                  : 'border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Pill className="h-4 w-4" aria-hidden="true" />
                <span>Medicine / Prescription Label Mode</span>
              </span>
              <span>{medicineMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        <div
          role="note"
          className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/60 bg-amber-950/30 p-3.5 text-sm text-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <span>{t.safety.medicineWarning}</span>
        </div>
      </section>

      <CameraCapturePanel
        onCapture={(dataUrl) => void handleOcrCapture(dataUrl)}
        actionLabel="Capture & Read Text"
        isProcessing={processing}
      />

      {processing && (
        <div role="status" className="rounded-2xl border border-sky-400/50 bg-sky-950/30 p-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{statusText}</span>
            <span className="font-mono-tabular">{progress}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-sky-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-500 bg-rose-950/40 p-4 text-base text-rose-100">
          {error}
        </div>
      )}

      {extractedText && (
        <section
          aria-label="Extracted text and audio playback"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Recognized Text</h2>
              {confidence !== null && (
                <p className="text-sm text-slate-600 dark:text-slate-300 font-mono-tabular">
                  {t.common.confidenceLabel}: {confidence}%
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaused(false);
                  speak(extractedText, true);
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>{t.common.play}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (paused) {
                    resumeSpeech();
                    setPaused(false);
                  } else {
                    pauseSpeech();
                    setPaused(true);
                  }
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Pause className="h-4 w-4" aria-hidden="true" />
                <span>{paused ? t.common.resume : t.common.pause}</span>
              </button>

              <button
                type="button"
                onClick={() => speak(extractedText, true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{t.common.repeat}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSaveToLearning()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="max-w-sm">
            <label htmlFor="ocr-speed-slider" className="block text-sm font-semibold">
              Reading Speed: <span className="font-mono-tabular">{prefs.speechRate.toFixed(1)}x</span>
            </label>
            <input
              id="ocr-speed-slider"
              type="range"
              min={0.6}
              max={1.6}
              step={0.1}
              value={prefs.speechRate}
              onChange={(e) => void updatePrefs({ speechRate: Number(e.target.value) })}
              className="mt-1.5 w-full accent-amber-400"
            />
          </div>

          {savedNotice && (
            <div role="status" className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>{savedNotice}</span>
            </div>
          )}

          <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-lg leading-relaxed dark:border-slate-800 dark:bg-slate-900">
            {extractedText}
          </div>
        </section>
      )}
    </div>
  );
};
