export type LanguageCode = 'en' | 'kn' | 'hi';

export type ThemeMode = 'navy' | 'light' | 'high-contrast';

export type TextScale = 'standard' | 'large' | 'xl';

export type AppRoute =
  | 'onboarding'
  | 'auth'
  | 'dashboard'
  | 'camera'
  | 'ocr'
  | 'voice'
  | 'currency'
  | 'navigation'
  | 'finder'
  | 'learning'
  | 'sos'
  | 'tools'
  | 'settings'
  | 'help';

export interface UserPreferences {
  language: LanguageCode;
  theme: ThemeMode;
  textScale: TextScale;
  speechRate: number;
  preferredVoiceUri: string;
  autoSpeakResults: boolean;
  hapticFeedback: boolean;
  reducedMotion: boolean;
  offlineOcrOnly: boolean;
  onboardingCompleted: boolean;
}

export interface UserConsents {
  cameraConsent: boolean;
  microphoneConsent: boolean;
  locationShareConsent: boolean;
  cloudAiConsent: boolean;
  sosLocationConsent: boolean;
  updatedAt: string;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  sourceType: 'ocr_scan' | 'uploaded_text' | 'manual_note';
  language: LanguageCode;
  extractedText: string;
  summaryText?: string;
  keyPoints?: string[];
  wordCount: number;
  createdAt: string;
}

export interface ServerCapabilities {
  geminiConfigured: boolean;
  googleMapsConfigured: boolean;
  supabaseConfigured: boolean;
}

export interface SceneDescriptionResult {
  description: string;
  objects: Array<{ name: string; position: string }>;
  confidence: 'high' | 'medium' | 'low';
  uncertaintyNote: string;
  safetyReminder: string;
}

export interface CurrencyResult {
  denomination: string;
  confidence: 'high' | 'medium' | 'low';
  visualCues: string;
  spokenSummary: string;
  disclaimer: string;
}

export interface ObjectFinderResult {
  found: boolean;
  confidence: 'high' | 'medium' | 'low';
  relativeDirection: string;
  guidance: string;
}

export interface NavigationStep {
  index: number;
  instruction: string;
  maneuver: string;
  distanceMeters: number;
}

export interface NavigationRouteResponse {
  provider: 'google_routes' | 'nominatim_bearing' | 'unconfigured';
  googleMapsConfigured: boolean;
  destinationName?: string;
  destinationCoords?: { lat: number; lng: number };
  distanceMeters?: number;
  durationText?: string;
  bearingDegrees?: number;
  compassDirection?: string;
  steps: NavigationStep[];
  message?: string;
}
