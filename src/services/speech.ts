import { getSpeechLocale } from '../i18n/translations';
import type { AppRoute, LanguageCode } from '../types/drishti';

export interface VoiceIntent {
  route?: AppRoute;
  action?: 'describe_scene' | 'read_text' | 'stop_speech' | 'find_object';
  objectQuery?: string;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function listAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function stopSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

export function pauseSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.pause();
}

export function resumeSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.resume();
}

export function speakText(
  text: string,
  options: {
    language: LanguageCode;
    rate?: number;
    voiceUri?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
): boolean {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    options.onEnd?.();
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const locale = getSpeechLocale(options.language);
  utterance.lang = locale;
  utterance.rate = Math.min(2.0, Math.max(0.5, options.rate ?? 1.0));

  const voices = window.speechSynthesis.getVoices();
  if (options.voiceUri) {
    const chosen = voices.find((v) => v.voiceURI === options.voiceUri);
    if (chosen) utterance.voice = chosen;
  } else {
    const langPrefix = locale.split('-')[0];
    const matched =
      voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (matched) utterance.voice = matched;
  }

  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = () => options.onError?.();

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Deterministic voice command parser supporting English, Kannada, and Hindi phrases.
 */
export function parseVoiceIntent(rawTranscript: string): VoiceIntent {
  const text = rawTranscript.trim().toLowerCase();
  if (!text) return {};

  if (
    /\b(stop|quiet|silence|mute|ನಿಲ್ಲಿಸು|माफ|बंद|रुको)\b/.test(text)
  ) {
    return { action: 'stop_speech' };
  }

  if (
    /(describe|surroundings|around me|camera|what is in front|scene|ಸುತ್ತಮುತ್ತ|ಕ್ಯಾಮೆರಾ|आसपास|कैमरा|क्या दिख)/.test(
      text
    )
  ) {
    return { route: 'camera', action: 'describe_scene' };
  }

  if (
    /(read text|ocr|read document|medicine|label|menu|ಪಠ್ಯ|ಓದು|औषधि|पढ़ो|टेक्स्ट)/.test(
      text
    )
  ) {
    return { route: 'ocr', action: 'read_text' };
  }

  if (/(navigation|navigate|directions|route|way to|ಮಾರ್ಗ|ದಾರಿ|रास्ता|नेविगेशन)/.test(text)) {
    return { route: 'navigation' };
  }

  if (/(currency|money|rupee|note|banknote|ನೋಟು|ಹಣ|रुपया|नोट)/.test(text)) {
    return { route: 'currency' };
  }

  if (/(sos|emergency|help me|call emergency|trusted contact|ತುರ್ತು|आपातकाल|बचाओ|मदद)/.test(text)) {
    return { route: 'sos' };
  }

  const findMatch = text.match(/(?:find|locate|where is|search for|ಹುಡುಕು|ढूंढो)\s+(.+)/i);
  if (findMatch && findMatch[1]) {
    return {
      route: 'finder',
      action: 'find_object',
      objectQuery: findMatch[1].trim(),
    };
  }

  if (/(finder|object|ವಸ್ತು|वस्तु)/.test(text)) {
    return { route: 'finder' };
  }

  if (/(learning|summarize|study|pdf|ಕಲಿಕೆ|अध्ययन|सारांश)/.test(text)) {
    return { route: 'learning' };
  }

  if (/(color|colour|qr|barcode|tools|ಬಣ್ಣ|साधन|रंग)/.test(text)) {
    return { route: 'tools' };
  }

  if (/(settings|preferences|language|speed|ಸಿದ್ಧತೆ|सेटिंग)/.test(text)) {
    return { route: 'settings' };
  }

  if (/(help|tutorial|guide|ಸಹಾಯ|सहायता)/.test(text)) {
    return { route: 'help' };
  }

  if (/(home|dashboard|ಮುಖಪುಟ|होम)/.test(text)) {
    return { route: 'dashboard' };
  }

  return {};
}
