import React, { useRef, useState } from 'react';
import { Mic, MicOff, Send, VolumeX } from 'lucide-react';
import { getSpeechLocale } from '../i18n/translations';
import { useDrishti } from '../context/DrishtiContext';
import { askVoiceAssistantApi } from '../services/apiClient';
import { isSpeechRecognitionSupported, parseVoiceIntent } from '../services/speech';
import type { AppRoute } from '../types/drishti';

interface SpeechRecInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

export const VoiceCommandBar: React.FC = () => {
  const {
    t,
    prefs,
    consents,
    updateConsents,
    navigate,
    route,
    setPendingFinderQuery,
    speak,
    isSpeaking,
    stopSpeaking,
    isOnline,
  } = useDrishti();

  const [listening, setListening] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const recRef = useRef<SpeechRecInstance | null>(null);

  const recSupported = isSpeechRecognitionSupported();

  const executeTranscript = async (rawText: string) => {
    const clean = rawText.trim();
    if (!clean) return;
    setStatusMessage(`Heard: "${clean}"`);

    const intent = parseVoiceIntent(clean);
    if (intent.action === 'stop_speech') {
      stopSpeaking();
      setStatusMessage('Speech stopped.');
      return;
    }

    if (intent.route) {
      if (intent.objectQuery) {
        setPendingFinderQuery(intent.objectQuery);
      }
      navigate(intent.route, `Opening ${t.nav[intent.route as keyof typeof t.nav] ?? intent.route}`);
      return;
    }

    if (!isOnline) {
      const msg =
        'Offline mode: try built-in commands like "open camera", "read text", "navigation", "currency", "find keys", or "emergency SOS".';
      setStatusMessage(msg);
      speak(msg, true);
      return;
    }

    setBusy(true);
    try {
      const res = await askVoiceAssistantApi({
        message: clean,
        language: prefs.language,
        currentScreen: route,
      });
      setStatusMessage(res.reply);
      speak(res.reply, true);
      const validRoutes: AppRoute[] = [
        'dashboard',
        'camera',
        'ocr',
        'voice',
        'currency',
        'navigation',
        'finder',
        'learning',
        'sos',
        'tools',
        'settings',
        'help',
      ];
      if (validRoutes.includes(res.suggestedRoute as AppRoute)) {
        navigate(res.suggestedRoute as AppRoute);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to process voice command.';
      setStatusMessage(msg);
      speak(msg, true);
    } finally {
      setBusy(false);
    }
  };

  const toggleListening = async () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }

    if (!recSupported) {
      const msg = 'Speech recognition is unavailable in this browser. Please type your command in the box.';
      setStatusMessage(msg);
      speak(msg, true);
      return;
    }

    if (!consents.microphoneConsent) {
      await updateConsents({ microphoneConsent: true });
    }

    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecInstance;
      webkitSpeechRecognition?: new () => SpeechRecInstance;
    };
    const RecCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!RecCtor) return;

    const rec = new RecCtor();
    rec.lang = getSpeechLocale(prefs.language);
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      setCommandInput(transcript);
      void executeTranscript(transcript);
    };
    rec.onerror = (event) => {
      const errCode = event?.error || 'error';
      const msg =
        errCode === 'not-allowed'
          ? 'Microphone permission was denied. You can still type commands below.'
          : 'Could not hear a clear command. Try again or type below.';
      setStatusMessage(msg);
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };

    recRef.current = rec;
    setListening(true);
    setStatusMessage('Listening... Speak a command such as "describe surroundings" or "read text".');
    rec.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    void executeTranscript(commandInput);
  };

  return (
    <section
      aria-label="Voice and text command bar"
      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void toggleListening()}
          aria-pressed={listening}
          className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-bold transition whitespace-nowrap shrink-0 ${
            listening
              ? 'bg-rose-600 text-white hover:bg-rose-500'
              : 'bg-amber-400 text-slate-950 hover:bg-amber-300 hc:bg-yellow-300 hc:text-black'
          }`}
        >
          {listening ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
          <span>{listening ? t.stopListening : t.listenCommand}</span>
        </button>

        <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
          <label htmlFor="voice-command-fallback" className="sr-only">
            Type a command or question
          </label>
          <input
            id="voice-command-fallback"
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder='Try "open camera", "read text", "find keys", or ask a question...'
            className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-base text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400 hc:border-white hc:bg-black hc:text-white"
          />
          <button
            type="submit"
            disabled={busy || !commandInput.trim()}
            aria-label="Send command"
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-sky-400 px-4 text-slate-950 font-bold hover:bg-sky-300 disabled:opacity-50"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>

        {isSpeaking && (
          <button
            type="button"
            onClick={stopSpeaking}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <VolumeX className="h-4 w-4" aria-hidden="true" />
            <span>{t.speakStop}</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300 hc:text-yellow-200" aria-live="polite">
          {statusMessage}
        </p>
      )}
    </section>
  );
};
