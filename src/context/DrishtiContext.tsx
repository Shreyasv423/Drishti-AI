import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { TRANSLATIONS, type TranslationBundle } from '../i18n/translations';
import {
  clearAllOfflineData,
  clearQueuedEvents,
  DEFAULT_CONSENTS,
  DEFAULT_PREFERENCES,
  deleteDocument as deleteOfflineDoc,
  deleteTrustedContact as deleteOfflineContact,
  getQueuedEvents,
  loadConsents,
  loadDocuments,
  loadPreferences,
  loadTrustedContacts,
  queueUsageEvent,
  saveConsents,
  saveDocument as saveOfflineDoc,
  savePreferences,
  saveTrustedContact as saveOfflineContact,
} from '../lib/offlineDb';
import { getSupabaseClient, isSupabaseClientConfigured } from '../lib/supabase';
import { fetchCapabilities } from '../services/apiClient';
import { listAvailableVoices, speakText, stopSpeech } from '../services/speech';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type {
  AppRoute,
  DocumentRecord,
  ServerCapabilities,
  TrustedContact,
  UserConsents,
  UserPreferences,
} from '../types/drishti';

interface DrishtiContextValue {
  route: AppRoute;
  navigate: (nextRoute: AppRoute, announceMsg?: string) => void;
  pendingFinderQuery: string;
  setPendingFinderQuery: (q: string) => void;
  prefs: UserPreferences;
  updatePrefs: (patch: Partial<UserPreferences>) => Promise<void>;
  consents: UserConsents;
  updateConsents: (patch: Partial<UserConsents>) => Promise<void>;
  contacts: TrustedContact[];
  addOrUpdateContact: (contact: Omit<TrustedContact, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  documents: DocumentRecord[];
  addDocument: (doc: Omit<DocumentRecord, 'id' | 'createdAt'>) => Promise<DocumentRecord>;
  removeDocument: (id: string) => Promise<void>;
  t: TranslationBundle;
  isOnline: boolean;
  capabilities: ServerCapabilities;
  user: User | null;
  authLoading: boolean;
  signOut: () => Promise<void>;
  liveAnnouncement: string;
  isSpeaking: boolean;
  speak: (text: string, force?: boolean) => void;
  stopSpeaking: () => void;
  voices: SpeechSynthesisVoice[];
  recordEvent: (moduleName: string, status: 'success' | 'uncertain' | 'offline_fallback' | 'error') => Promise<void>;
  clearLocalUserData: () => Promise<void>;
}

const DrishtiContext = createContext<DrishtiContextValue | null>(null);

export const DrishtiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isOnline = useOnlineStatus();
  const [route, setRoute] = useState<AppRoute>('onboarding');
  const [pendingFinderQuery, setPendingFinderQuery] = useState('');
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [consents, setConsents] = useState<UserConsents>(DEFAULT_CONSENTS);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [capabilities, setCapabilities] = useState<ServerCapabilities>({
    geminiConfigured: false,
    googleMapsConfigured: false,
    supabaseConfigured: isSupabaseClientConfigured,
  });
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const userTouchedPrefsRef = React.useRef(false);

  // Load initial local data + capabilities + Supabase auth state
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const [loadedPrefs, loadedConsents, loadedContacts, loadedDocs, caps] = await Promise.all([
        loadPreferences(),
        loadConsents(),
        loadTrustedContacts(),
        loadDocuments(),
        fetchCapabilities(),
      ]);

      if (!active) return;
      if (!userTouchedPrefsRef.current) {
        setPrefs(loadedPrefs);
        if (loadedPrefs.onboardingCompleted) {
          setRoute('dashboard');
        }
      }
      setConsents(loadedConsents);
      setContacts(loadedContacts);
      setDocuments(loadedDocs);
      setCapabilities(caps);

      const supabase = getSupabaseClient();
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (active) setUser(data.user ?? null);
      }
      if (active) setAuthLoading(false);
    }

    bootstrap();

    const supabase = getSupabaseClient();
    const authSub = supabase?.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const refreshVoices = () => setVoices(listAvailableVoices());
    refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }

    return () => {
      active = false;
      authSub?.data.subscription.unsubscribe();
    };
  }, []);

  // Apply theme, scale, language, and reduced-motion attributes to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.lang = prefs.language;
    root.classList.remove('dark', 'hc', 'reduced-motion');
    if (prefs.theme === 'navy') {
      root.classList.add('dark');
    } else if (prefs.theme === 'high-contrast') {
      root.classList.add('dark', 'hc');
    }
    if (prefs.reducedMotion) {
      root.classList.add('reduced-motion');
    }
    const scale = prefs.textScale === 'xl' ? '1.22' : prefs.textScale === 'large' ? '1.12' : '1';
    root.style.setProperty('--drishti-scale', scale);
  }, [prefs.language, prefs.theme, prefs.textScale, prefs.reducedMotion]);

  // Announce connectivity changes cleanly
  useEffect(() => {
    const t = TRANSLATIONS[prefs.language];
    const msg = isOnline ? t.onlineLabel : t.offlineLabel;
    setLiveAnnouncement(msg);
  }, [isOnline, prefs.language]);

  // Flush queued non-sensitive usage events when signed in and online
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!isOnline || !user || !supabase) return;
    getQueuedEvents().then(async (events) => {
      if (!events.length) return;
      const rows = events.map((e) => ({
        user_id: user.id,
        module_name: e.moduleName,
        status: e.status,
        language: e.language,
      }));
      const { error } = await supabase.from('usage_events').insert(rows);
      if (!error) {
        await clearQueuedEvents();
      }
    });
  }, [isOnline, user]);

  const speak = useCallback(
    (text: string, force = false) => {
      setLiveAnnouncement(text);
      if (!force && !prefs.autoSpeakResults) return;
      speakText(text, {
        language: prefs.language,
        rate: prefs.speechRate,
        voiceUri: prefs.preferredVoiceUri,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [prefs.autoSpeakResults, prefs.language, prefs.speechRate, prefs.preferredVoiceUri]
  );

  const stopSpeaking = useCallback(() => {
    stopSpeech();
    setIsSpeaking(false);
  }, []);

  const navigate = useCallback(
    (nextRoute: AppRoute, announceMsg?: string) => {
      setRoute(nextRoute);
      if (announceMsg) {
        speak(announceMsg);
      } else {
        const label = TRANSLATIONS[prefs.language].nav[nextRoute as keyof TranslationBundle['nav']] || nextRoute;
        setLiveAnnouncement(label);
      }
      window.scrollTo({ top: 0, behavior: prefs.reducedMotion ? 'auto' : 'smooth' });
    },
    [prefs.language, prefs.reducedMotion, speak]
  );

  const updatePrefs = useCallback(
    async (patch: Partial<UserPreferences>) => {
      userTouchedPrefsRef.current = true;
      const next = { ...prefs, ...patch };
      setPrefs(next);
      await savePreferences(next);

      const supabase = getSupabaseClient();
      if (supabase && user && isOnline) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          language: next.language,
          theme: next.theme,
          text_scale: next.textScale,
          speech_rate: next.speechRate,
          preferred_voice_uri: next.preferredVoiceUri || null,
          auto_speak_results: next.autoSpeakResults,
          haptic_feedback: next.hapticFeedback,
          reduced_motion: next.reducedMotion,
          offline_ocr_only: next.offlineOcrOnly,
        });
      }
    },
    [prefs, user, isOnline]
  );

  const updateConsents = useCallback(
    async (patch: Partial<UserConsents>) => {
      const next: UserConsents = {
        ...consents,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      setConsents(next);
      await saveConsents(next);

      const supabase = getSupabaseClient();
      if (supabase && user && isOnline) {
        await supabase.from('user_consents').upsert({
          user_id: user.id,
          camera_consent: next.cameraConsent,
          microphone_consent: next.microphoneConsent,
          location_share_consent: next.locationShareConsent,
          cloud_ai_consent: next.cloudAiConsent,
          sos_location_consent: next.sosLocationConsent,
          consent_updated_at: next.updatedAt,
        });
      }
    },
    [consents, user, isOnline]
  );

  const addOrUpdateContact = useCallback(
    async (input: Omit<TrustedContact, 'id' | 'createdAt'> & { id?: string }) => {
      const record: TrustedContact = {
        id: input.id ?? crypto.randomUUID(),
        name: input.name.trim(),
        phone: input.phone.trim(),
        relationship: input.relationship.trim() || 'Family',
        isPrimary: input.isPrimary,
        createdAt: new Date().toISOString(),
      };

      const updated = [record, ...contacts.filter((c) => c.id !== record.id)].sort(
        (a, b) => Number(b.isPrimary) - Number(a.isPrimary)
      );
      setContacts(updated);
      await saveOfflineContact(record);

      const supabase = getSupabaseClient();
      if (supabase && user && isOnline) {
        await supabase.from('trusted_contacts').upsert({
          id: record.id,
          user_id: user.id,
          name: record.name,
          phone: record.phone,
          relationship: record.relationship,
          is_primary: record.isPrimary,
        });
      }
    },
    [contacts, user, isOnline]
  );

  const removeContact = useCallback(
    async (id: string) => {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      await deleteOfflineContact(id);

      const supabase = getSupabaseClient();
      if (supabase && user && isOnline) {
        await supabase.from('trusted_contacts').delete().eq('id', id).eq('user_id', user.id);
      }
    },
    [user, isOnline]
  );

  const addDocument = useCallback(
    async (docInput: Omit<DocumentRecord, 'id' | 'createdAt'>): Promise<DocumentRecord> => {
      const doc: DocumentRecord = {
        ...docInput,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setDocuments((prev) => [doc, ...prev]);
      await saveOfflineDoc(doc);

      const supabase = getSupabaseClient();
      if (supabase && user && isOnline) {
        await supabase.from('document_metadata').insert({
          id: doc.id,
          user_id: user.id,
          title: doc.title,
          source_type: doc.sourceType,
          language: doc.language,
          extracted_text: doc.extractedText,
          summary_text: doc.summaryText ?? null,
          word_count: doc.wordCount,
        });
      }
      return doc;
    },
    [user, isOnline]
  );

  const removeDocument = useCallback(
    async (id: string) => {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      await deleteOfflineDoc(id);

      const supabase = getSupabaseClient();
      if (supabase && user && isOnline) {
        await supabase.from('document_metadata').delete().eq('id', id).eq('user_id', user.id);
      }
    },
    [user, isOnline]
  );

  const recordEvent = useCallback(
    async (moduleName: string, status: 'success' | 'uncertain' | 'offline_fallback' | 'error') => {
      await queueUsageEvent({ moduleName, status, language: prefs.language });
    },
    [prefs.language]
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  }, []);

  const clearLocalUserData = useCallback(async () => {
    await clearAllOfflineData();
    setContacts([]);
    setDocuments([]);
    setConsents(DEFAULT_CONSENTS);
    setPrefs(DEFAULT_PREFERENCES);
  }, []);

  const value = useMemo<DrishtiContextValue>(
    () => ({
      route,
      navigate,
      pendingFinderQuery,
      setPendingFinderQuery,
      prefs,
      updatePrefs,
      consents,
      updateConsents,
      contacts,
      addOrUpdateContact,
      removeContact,
      documents,
      addDocument,
      removeDocument,
      t: TRANSLATIONS[prefs.language],
      isOnline,
      capabilities,
      user,
      authLoading,
      signOut,
      liveAnnouncement,
      isSpeaking,
      speak,
      stopSpeaking,
      voices,
      recordEvent,
      clearLocalUserData,
    }),
    [
      route,
      navigate,
      pendingFinderQuery,
      prefs,
      updatePrefs,
      consents,
      updateConsents,
      contacts,
      addOrUpdateContact,
      removeContact,
      documents,
      addDocument,
      removeDocument,
      isOnline,
      capabilities,
      user,
      authLoading,
      signOut,
      liveAnnouncement,
      isSpeaking,
      speak,
      stopSpeaking,
      voices,
      recordEvent,
      clearLocalUserData,
    ]
  );

  return <DrishtiContext.Provider value={value}>{children}</DrishtiContext.Provider>;
};

export function useDrishti() {
  const ctx = useContext(DrishtiContext);
  if (!ctx) throw new Error('useDrishti must be used within DrishtiProvider');
  return ctx;
}
