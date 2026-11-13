import React, { useState } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { VoiceCommandBar } from '../components/VoiceCommandBar';
import { askVoiceAssistantApi } from '../services/apiClient';

interface AssistantTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_COMMANDS = [
  { label: 'Describe surroundings', command: 'Describe surroundings' },
  { label: 'Read printed text', command: 'Read text' },
  { label: 'Identify currency note', command: 'Identify currency' },
  { label: 'Find my keys', command: 'Find keys' },
  { label: 'Open navigation', command: 'Open navigation' },
  { label: 'Open Emergency SOS', command: 'Emergency SOS' },
];

export const VoiceAssistantPage: React.FC = () => {
  const { t, prefs, navigate, speak, isOnline, capabilities } = useDrishti();
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (promptText: string) => {
    const clean = promptText.trim();
    if (!clean) return;
    setTurns((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: clean }]);
    setQuestion('');

    if (!isOnline || !capabilities.geminiConfigured) {
      const reply = !isOnline
        ? 'You are offline. Use the quick command buttons above or speak navigation commands like "open camera" or "read text".'
        : 'Gemini AI is not configured on the server yet. Built-in voice commands remain active.';
      setTurns((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: reply }]);
      speak(reply, true);
      return;
    }

    setLoading(true);
    try {
      const res = await askVoiceAssistantApi({
        message: clean,
        language: prefs.language,
        currentScreen: 'voice',
      });
      setTurns((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: res.reply }]);
      speak(res.reply, true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach assistant.';
      setTurns((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: msg }]);
      speak(msg, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.nav.voice} Assistant</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Speak commands hands-free, use quick action buttons, or type questions below.
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

      <VoiceCommandBar />

      <section aria-labelledby="quick-commands-heading" className="space-y-3">
        <h2 id="quick-commands-heading" className="text-lg font-bold">
          Quick Voice & Touch Commands
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {QUICK_COMMANDS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.command === 'Describe surroundings') navigate('camera');
                else if (item.command === 'Read text') navigate('ocr');
                else if (item.command === 'Identify currency') navigate('currency');
                else if (item.command === 'Open navigation') navigate('navigation');
                else if (item.command === 'Emergency SOS') navigate('sos');
                else navigate('finder');
              }}
              className="min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-bold hover:border-amber-400 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section
        aria-label="Conversational assistant"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
      >
        <h2 className="text-lg font-bold">Ask DRISHTI</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleAsk(question);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="assistant-question" className="sr-only">
            Ask a question
          </label>
          <input
            id="assistant-question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask how to use a feature, or ask an everyday question..."
            className="min-h-[48px] flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-base dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="min-h-[48px] rounded-xl bg-amber-400 px-6 py-3 text-base font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
          >
            {loading ? t.common.loading : 'Ask'}
          </button>
        </form>

        {turns.length > 0 && (
          <div className="space-y-3 pt-2" aria-live="polite">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`rounded-xl p-4 ${
                  turn.role === 'user'
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100'
                    : 'border border-sky-400/40 bg-sky-950/30 text-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {turn.role === 'user' ? 'You' : 'DRISHTI'}
                  </span>
                  {turn.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => speak(turn.text, true)}
                      aria-label="Read response aloud"
                      className="inline-flex min-h-[36px] items-center gap-1 text-xs font-bold text-sky-300 hover:underline"
                    >
                      <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Speak</span>
                    </button>
                  )}
                </div>
                <p className="mt-1 text-base leading-relaxed">{turn.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
