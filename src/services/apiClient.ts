import type {
  CurrencyResult,
  LanguageCode,
  NavigationRouteResponse,
  ObjectFinderResult,
  SceneDescriptionResult,
  ServerCapabilities,
} from '../types/drishti';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function fetchCapabilities(): Promise<ServerCapabilities> {
  try {
    const res = await fetch('/api/capabilities');
    if (!res.ok) throw new Error('Capabilities unavailable');
    return (await res.json()) as ServerCapabilities;
  } catch {
    return {
      geminiConfigured: false,
      googleMapsConfigured: false,
      supabaseConfigured: false,
    };
  }
}

export function describeSceneApi(params: {
  imageBase64: string;
  mimeType: string;
  language: LanguageCode;
  focusPrompt?: string;
}): Promise<SceneDescriptionResult> {
  return postJson<SceneDescriptionResult>('/api/vision/describe', params);
}

export function findObjectApi(params: {
  imageBase64: string;
  mimeType: string;
  targetObject: string;
  language: LanguageCode;
}): Promise<ObjectFinderResult> {
  return postJson<ObjectFinderResult>('/api/vision/find-object', params);
}

export function identifyCurrencyApi(params: {
  imageBase64: string;
  mimeType: string;
  language: LanguageCode;
}): Promise<CurrencyResult> {
  return postJson<CurrencyResult>('/api/vision/currency', params);
}

export function inspectProductLabelApi(params: {
  imageBase64: string;
  mimeType: string;
  language: LanguageCode;
}): Promise<{ productName: string; details: string; warnings: string; confidence: string }> {
  return postJson('/api/vision/product-label', params);
}

export function askVoiceAssistantApi(params: {
  message: string;
  language: LanguageCode;
  currentScreen: string;
}): Promise<{ reply: string; suggestedRoute: string }> {
  return postJson('/api/assistant', params);
}

export function summarizeDocumentApi(params: {
  text: string;
  language: LanguageCode;
}): Promise<{ title: string; summary: string; keyPoints: string[] }> {
  return postJson('/api/learning/summarize', params);
}

export function computeNavigationRouteApi(params: {
  origin: { lat: number; lng: number };
  destination: string;
  travelMode: 'WALK' | 'TRANSIT';
  language: LanguageCode;
}): Promise<NavigationRouteResponse> {
  return postJson('/api/navigation/route', params);
}
