import { openDB, type IDBPDatabase } from 'idb';
import type {
  DocumentRecord,
  TrustedContact,
  UserConsents,
  UserPreferences,
} from '../types/drishti';

const DB_NAME = 'drishti_offline_db';
const DB_VERSION = 1;

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  theme: 'navy',
  textScale: 'standard',
  speechRate: 1.0,
  preferredVoiceUri: '',
  autoSpeakResults: true,
  hapticFeedback: true,
  reducedMotion: false,
  offlineOcrOnly: false,
  onboardingCompleted: false,
};

export const DEFAULT_CONSENTS: UserConsents = {
  cameraConsent: false,
  microphoneConsent: false,
  locationShareConsent: false,
  cloudAiConsent: true,
  sosLocationConsent: false,
  updatedAt: new Date().toISOString(),
};

interface QueuedEvent {
  id: string;
  moduleName: string;
  status: 'success' | 'uncertain' | 'offline_fallback' | 'error';
  language: string;
  createdAt: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

async function getDb(): Promise<IDBPDatabase | null> {
  if (!hasIndexedDB()) return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
        if (!db.objectStoreNames.contains('contacts')) {
          db.createObjectStore('contacts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('queued_events')) {
          db.createObjectStore('queued_events', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const db = await getDb();
    if (!db) return DEFAULT_PREFERENCES;
    const saved = await db.get('kv', 'preferences');
    return { ...DEFAULT_PREFERENCES, ...(saved ?? {}) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put('kv', prefs, 'preferences');
}

export async function loadConsents(): Promise<UserConsents> {
  try {
    const db = await getDb();
    if (!db) return DEFAULT_CONSENTS;
    const saved = await db.get('kv', 'consents');
    return { ...DEFAULT_CONSENTS, ...(saved ?? {}) };
  } catch {
    return DEFAULT_CONSENTS;
  }
}

export async function saveConsents(consents: UserConsents): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put('kv', consents, 'consents');
}

export async function loadTrustedContacts(): Promise<TrustedContact[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const list = (await db.getAll('contacts')) as TrustedContact[];
    return list.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  } catch {
    return [];
  }
}

export async function saveTrustedContact(contact: TrustedContact): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put('contacts', contact);
}

export async function deleteTrustedContact(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete('contacts', id);
}

export async function loadDocuments(): Promise<DocumentRecord[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const docs = (await db.getAll('documents')) as DocumentRecord[];
    return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function saveDocument(doc: DocumentRecord): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.put('documents', doc);
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete('documents', id);
}

export async function queueUsageEvent(event: Omit<QueuedEvent, 'id' | 'createdAt'>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const item: QueuedEvent = {
    id: crypto.randomUUID(),
    ...event,
    createdAt: new Date().toISOString(),
  };
  await db.put('queued_events', item);
}

export async function getQueuedEvents(): Promise<QueuedEvent[]> {
  const db = await getDb();
  if (!db) return [];
  return (await db.getAll('queued_events')) as QueuedEvent[];
}

export async function clearQueuedEvents(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.clear('queued_events');
}

export async function clearAllOfflineData(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await Promise.all([
    db.clear('kv'),
    db.clear('contacts'),
    db.clear('documents'),
    db.clear('queued_events'),
  ]);
}
