import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Upload,
  Play,
  Pause,
  Sparkles,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { runOfflineOcr } from '../services/ocr';
import { summarizeDocumentApi } from '../services/apiClient';
import { pauseSpeech, resumeSpeech } from '../services/speech';

export const LearningAssistantPage: React.FC = () => {
  const {
    t,
    prefs,
    documents,
    addDocument,
    removeDocument,
    speak,
    isOnline,
    capabilities,
    navigate,
  } = useDrishti();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState<{ title: string; summary: string; keyPoints: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSummary(null);

    if (file.size > 6 * 1024 * 1024) {
      setError('File exceeds 6 MB size limit.');
      return;
    }

    if (file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name)) {
      const txt = await file.text();
      setTitle(file.name);
      setContent(txt.slice(0, 15000));
      setStatus(`Loaded text file "${file.name}".`);
      speak(`Loaded ${file.name}. Ready to read aloud or summarize.`);
    } else if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setBusy(true);
      setStatus('Running offline OCR on document image...');
      try {
        const ocr = await runOfflineOcr(file, prefs.language, (pct) => {
          setStatus(`Extracting document text: ${pct}%`);
        });
        setTitle(file.name);
        setContent(ocr.text);
        setStatus('Document text extracted.');
        speak(`Extracted text from ${file.name}.`, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'OCR failed on file.');
      } finally {
        setBusy(false);
      }
    } else {
      setError('Please upload a TXT, Markdown, JPEG, PNG, or WebP document scan.');
    }
    e.target.value = '';
  };

  const handleSummarize = async () => {
    setError('');
    if (content.trim().length < 20) {
      setError('Enter or upload at least 20 characters to summarize.');
      return;
    }
    if (!isOnline || !capabilities.geminiConfigured) {
      const msg = 'Document summarization requires internet and a configured Gemini API key. Read-aloud playback works offline.';
      setError(msg);
      speak(msg, true);
      return;
    }

    setBusy(true);
    setStatus('Creating audio-friendly summary...');
    try {
      const res = await summarizeDocumentApi({
        text: content,
        language: prefs.language,
      });
      setSummary(res);
      speak(`${res.title}. ${res.summary}`, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Summarization failed.';
      setError(msg);
      speak(msg, true);
    } finally {
      setBusy(false);
      setStatus('');
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    await addDocument({
      title: title.trim() || `Study Note (${new Date().toLocaleDateString()})`,
      sourceType: 'uploaded_text',
      language: prefs.language,
      extractedText: content,
      summaryText: summary?.summary,
      keyPoints: summary?.keyPoints,
      wordCount: content.trim().split(/\s+/).length,
    });
    setStatus('Saved to offline Learning Library.');
    speak('Document saved.', true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.nav.learning} Assistant</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Upload notes or scanned pages, listen aloud offline, or generate spoken summaries.
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.csv,image/jpeg,image/png,image/webp"
            onChange={(e) => void handleFileUpload(e)}
            className="sr-only"
            aria-label="Upload text or document image"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-sky-400 px-5 py-3 text-base font-bold text-slate-950 hover:bg-sky-300 disabled:opacity-60"
          >
            <Upload className="h-5 w-5" aria-hidden="true" />
            <span>Upload Text or Page Image</span>
          </button>
          {status && <span className="text-sm font-semibold text-sky-400">{status}</span>}
        </div>

        <div>
          <label htmlFor="doc-title" className="block text-sm font-semibold mb-1">
            Document Title
          </label>
          <input
            id="doc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Biology Chapter 3 Notes"
            className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        <div>
          <label htmlFor="doc-content" className="block text-sm font-semibold mb-1">
            Document Content
          </label>
          <textarea
            id="doc-content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste text here or upload a file above..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-base leading-relaxed dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-semibold text-rose-400">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!content.trim()}
            onClick={() => {
              setPaused(false);
              speak(content, true);
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-base font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
          >
            <Play className="h-5 w-5" aria-hidden="true" />
            <span>{t.common.play}</span>
          </button>

          <button
            type="button"
            disabled={!content.trim()}
            onClick={() => {
              if (paused) {
                resumeSpeech();
                setPaused(false);
              } else {
                pauseSpeech();
                setPaused(true);
              }
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold dark:border-slate-700 disabled:opacity-50"
          >
            <Pause className="h-5 w-5" aria-hidden="true" />
            <span>{paused ? t.common.resume : t.common.pause}</span>
          </button>

          <button
            type="button"
            disabled={busy || content.trim().length < 20}
            onClick={() => void handleSummarize()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-sky-400 px-5 py-3 text-base font-bold text-sky-400 hover:bg-sky-950/30 disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <span>Summarize for Listening</span>
          </button>

          <button
            type="button"
            disabled={!content.trim()}
            onClick={() => void handleSave()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold dark:border-slate-700 disabled:opacity-50"
          >
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            <span>Save to Library</span>
          </button>
        </div>
      </section>

      {summary && (
        <section
          aria-live="polite"
          className="space-y-3 rounded-2xl border border-sky-400/40 bg-sky-950/25 p-6"
        >
          <h2 className="text-xl font-bold">{summary.title}</h2>
          <p className="text-lg leading-relaxed">{summary.summary}</p>
          {summary.keyPoints.length > 0 && (
            <ul className="list-disc space-y-1.5 pl-5 text-base">
              {summary.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Saved Offline Library */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-4">
        <h2 className="text-xl font-bold">Saved Offline Library</h2>
        {documents.length === 0 ? (
          <p className="text-base text-slate-600 dark:text-slate-300">
            No saved documents yet. Save an OCR scan or study note above for offline playback.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold text-base">{doc.title}</p>
                  <p className="text-xs text-slate-500 font-mono-tabular">
                    {doc.wordCount} words · {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTitle(doc.title);
                      setContent(doc.extractedText);
                      speak(doc.summaryText || doc.extractedText, true);
                    }}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-sm font-bold text-slate-950"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    <span>Listen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeDocument(doc.id)}
                    aria-label={`Delete ${doc.title}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-rose-500/50 text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
