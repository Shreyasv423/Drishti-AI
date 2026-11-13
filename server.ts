import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BASE64_BYTES = 6 * 1024 * 1024; // 6 MB limit
const AI_TIMEOUT_MS = 25_000;

type SupportedLang = 'en' | 'kn' | 'hi';

function getLanguageName(lang: unknown): string {
  if (lang === 'kn') return 'Kannada';
  if (lang === 'hi') return 'Hindi';
  return 'English';
}

function normalizeLang(lang: unknown): SupportedLang {
  if (lang === 'kn' || lang === 'hi') return lang;
  return 'en';
}

function sanitizeText(input: unknown, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function validateBase64Image(imageBase64: unknown, mimeType: unknown): { ok: true; data: string; mime: string } | { ok: false; error: string } {
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    return { ok: false, error: 'Image data is required.' };
  }
  const cleanMime = typeof mimeType === 'string' && ALLOWED_IMAGE_MIMES.has(mimeType) ? mimeType : 'image/jpeg';
  const stripped = imageBase64.includes(',') ? imageBase64.split(',')[1] ?? '' : imageBase64;
  if (!/^[A-Za-z0-9+/=]+$/.test(stripped)) {
    return { ok: false, error: 'Invalid base64 image format.' };
  }
  const approxBytes = Math.ceil((stripped.length * 3) / 4);
  if (approxBytes > MAX_BASE64_BYTES) {
    return { ok: false, error: 'Image exceeds 6 MB size limit. Please capture a smaller frame.' };
  }
  return { ok: true, data: stripped, mime: cleanMime };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)} seconds.`));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Simple sliding-window rate limiter for AI endpoints (no sensitive data logged)
const rateBuckets = new Map<string, number[]>();
function rateLimit(maxRequests = 25, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'local';
    const now = Date.now();
    const history = (rateBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
    if (history.length >= maxRequests) {
      res.status(429).json({
        error: 'Too many AI requests in a short time. Please wait a few seconds and try again.',
      });
      return;
    }
    history.push(now);
    rateBuckets.set(key, history);
    next();
  };
}

function extractGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : 'AI service error.';
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return { status: 429, message: 'AI quota limit reached temporarily. Please wait and retry.' };
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return { status: 503, message: 'Server Gemini API key is missing or invalid.' };
  }
  if (msg.includes('timed out')) {
    return { status: 504, message: msg };
  }
  return { status: 502, message: 'Unable to complete AI analysis right now. Please try again.' };
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'drishti-api', timestamp: new Date().toISOString() });
  });

  app.get('/api/capabilities', (_req, res) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
    const supaUrl = process.env.VITE_SUPABASE_URL;
    const supaAnon = process.env.VITE_SUPABASE_ANON_KEY;

    res.json({
      geminiConfigured: Boolean(geminiKey && geminiKey !== 'MY_GEMINI_API_KEY'),
      googleMapsConfigured: Boolean(mapsKey && mapsKey !== 'your-google-maps-server-api-key'),
      supabaseConfigured: Boolean(
        supaUrl &&
          supaAnon &&
          !supaUrl.includes('your-project-id') &&
          !supaAnon.includes('your-supabase-anon-key')
      ),
    });
  });

  // 1. AI Camera Assistant — Scene Description
  app.post('/api/vision/describe', rateLimit(25, 60_000), async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini AI vision is not configured on the server. Offline OCR and Color Detector remain available.',
      });
      return;
    }

    const validated = validateBase64Image(req.body?.imageBase64, req.body?.mimeType);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const lang = normalizeLang(req.body?.language);
    const langName = getLanguageName(lang);
    const userFocus = sanitizeText(req.body?.focusPrompt, 240);

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              { inlineData: { mimeType: validated.mime, data: validated.data } },
              {
                text: userFocus
                  ? `Describe this image for a blind or low-vision person in ${langName}, paying attention to: ${userFocus}`
                  : `Describe this scene concisely for a blind or low-vision person in ${langName}.`,
              },
            ],
          },
          config: {
            systemInstruction: `You are DRISHTI, a calm, factual visual companion for blind and low-vision users.
Rules:
1. Respond strictly in ${langName}.
2. Keep the main description concise (2-4 clear spoken sentences) and practical.
3. Mention relative horizontal/vertical position (e.g., "on the left", "in the center", "near the bottom") ONLY when clearly visible in the frame.
4. NEVER claim safe obstacle avoidance, safe walking path, safe road crossing, or exact metric distances from a single 2D image.
5. If the image is blurry, dark, obstructed, or ambiguous, set confidence to "low" and ask the user to steady the camera or add light.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                objects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      position: { type: Type.STRING },
                    },
                  },
                },
                confidence: { type: Type.STRING },
                uncertaintyNote: { type: Type.STRING },
                safetyReminder: { type: Type.STRING },
              },
            },
          },
        }),
        AI_TIMEOUT_MS,
        'Scene description'
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        description: typeof parsed.description === 'string' ? parsed.description : 'Unable to describe this frame clearly.',
        objects: Array.isArray(parsed.objects) ? parsed.objects.slice(0, 10) : [],
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
        uncertaintyNote: typeof parsed.uncertaintyNote === 'string' ? parsed.uncertaintyNote : '',
        safetyReminder:
          typeof parsed.safetyReminder === 'string' && parsed.safetyReminder
            ? parsed.safetyReminder
            : 'AI descriptions are visual aids only and cannot replace a white cane, guide dog, or physical safety checks.',
      });
    } catch (err) {
      const mapped = extractGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 2. Everyday Object Finder
  app.post('/api/vision/find-object', rateLimit(30, 60_000), async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini AI is not configured on the server.' });
      return;
    }

    const targetObject = sanitizeText(req.body?.targetObject, 100);
    if (!targetObject) {
      res.status(400).json({ error: 'Please specify the object you are looking for.' });
      return;
    }

    const validated = validateBase64Image(req.body?.imageBase64, req.body?.mimeType);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const langName = getLanguageName(normalizeLang(req.body?.language));

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              { inlineData: { mimeType: validated.mime, data: validated.data } },
              {
                text: `Look carefully for "${targetObject}" in this image. Respond in ${langName}.`,
              },
            ],
          },
          config: {
            systemInstruction: `You assist a blind or low-vision user finding an everyday object in a camera frame.
Respond in ${langName}. Only report found=true when clearly visible. Do not guess or fabricate.
Only announce relativeDirection ("left", "center", "right", "upper-left", "upper-right", "lower-left", "lower-right", or "unknown") if reliably supported by the image.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                found: { type: Type.BOOLEAN },
                confidence: { type: Type.STRING },
                relativeDirection: { type: Type.STRING },
                guidance: { type: Type.STRING },
              },
            },
          },
        }),
        AI_TIMEOUT_MS,
        'Object finder'
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        found: Boolean(parsed.found),
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
        relativeDirection: typeof parsed.relativeDirection === 'string' ? parsed.relativeDirection : 'unknown',
        guidance:
          typeof parsed.guidance === 'string'
            ? parsed.guidance
            : 'Could not confirm the item in this frame. Try panning slowly.',
      });
    } catch (err) {
      const mapped = extractGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 3. Indian Currency Recognition (with uncertainty & verification warning)
  app.post('/api/vision/currency', rateLimit(20, 60_000), async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini AI is not configured on the server.' });
      return;
    }

    const validated = validateBase64Image(req.body?.imageBase64, req.body?.mimeType);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const langName = getLanguageName(normalizeLang(req.body?.language));

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              { inlineData: { mimeType: validated.mime, data: validated.data } },
              {
                text: `Examine this image for an Indian Rupee banknote (INR: 10, 20, 50, 100, 200, 500, or 2000). Respond in ${langName}.`,
              },
            ],
          },
          config: {
            systemInstruction: `You are an assistive currency identification aid for Indian Rupee banknotes.
Respond in ${langName}.
Rules:
1. Never claim 100% certainty or counterfeit authentication.
2. If the denomination numeral or Gandhi/RBI features are folded, obscured, blurry, or not clearly an Indian banknote, return denomination "unknown" and confidence "low".
3. Describe non-color-only visual cues you observed (printed numeral, motif, portrait side) and always include an uncertainty disclaimer advising tactile bleed-line checks or human verification for high-value transactions.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                denomination: { type: Type.STRING },
                confidence: { type: Type.STRING },
                visualCues: { type: Type.STRING },
                spokenSummary: { type: Type.STRING },
                disclaimer: { type: Type.STRING },
              },
            },
          },
        }),
        AI_TIMEOUT_MS,
        'Currency recognition'
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        denomination: typeof parsed.denomination === 'string' ? parsed.denomination : 'unknown',
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
        visualCues: typeof parsed.visualCues === 'string' ? parsed.visualCues : '',
        spokenSummary:
          typeof parsed.spokenSummary === 'string'
            ? parsed.spokenSummary
            : 'Banknote unclear. Please flatten the note in good light and try again.',
        disclaimer:
          typeof parsed.disclaimer === 'string' && parsed.disclaimer
            ? parsed.disclaimer
            : 'Camera currency recognition is an assistive estimate, not guaranteed. Please verify via tactile marks or trusted assistance.',
      });
    } catch (err) {
      const mapped = extractGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 4. Product Label Inspector
  app.post('/api/vision/product-label', rateLimit(20, 60_000), async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini AI is not configured on the server.' });
      return;
    }

    const validated = validateBase64Image(req.body?.imageBase64, req.body?.mimeType);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const langName = getLanguageName(normalizeLang(req.body?.language));

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              { inlineData: { mimeType: validated.mime, data: validated.data } },
              {
                text: `Read and summarize this product or medicine label clearly in ${langName}.`,
              },
            ],
          },
          config: {
            systemInstruction: `Extract clearly legible product name, brand, key warnings, allergens, dosage, or expiry text visible on the label.
Respond in ${langName}. If any text is blurry or cut off, state that explicitly and never guess dosage or expiry dates.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING },
                details: { type: Type.STRING },
                warnings: { type: Type.STRING },
                confidence: { type: Type.STRING },
              },
            },
          },
        }),
        AI_TIMEOUT_MS,
        'Product label inspection'
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        productName: typeof parsed.productName === 'string' ? parsed.productName : 'Unknown product',
        details: typeof parsed.details === 'string' ? parsed.details : '',
        warnings: typeof parsed.warnings === 'string' ? parsed.warnings : '',
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
      });
    } catch (err) {
      const mapped = extractGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 5. Voice & Conversational Assistant
  app.post('/api/assistant', rateLimit(30, 60_000), async (req, res) => {
    const message = sanitizeText(req.body?.message, 800);
    if (!message) {
      res.status(400).json({ error: 'Please provide a question or command.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini conversational AI is not configured on the server. Built-in voice navigation commands still work offline.',
      });
      return;
    }

    const langName = getLanguageName(normalizeLang(req.body?.language));
    const currentScreen = sanitizeText(req.body?.currentScreen, 60);

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `User screen: ${currentScreen || 'dashboard'}. User says: "${message}"`,
          config: {
            systemInstruction: `You are DRISHTI, a concise, respectful voice-first accessibility assistant for blind and low-vision users.
Respond strictly in ${langName} in 1-3 short, spoken-friendly sentences.
If the user wants to open a specific app screen, set suggestedRoute to one of: "dashboard", "camera", "ocr", "voice", "currency", "navigation", "finder", "learning", "sos", "tools", "settings", "help", or "" if no navigation is needed.
Never fabricate real-time sensor readings, live GPS locations, or medical diagnoses.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: { type: Type.STRING },
                suggestedRoute: { type: Type.STRING },
              },
            },
          },
        }),
        AI_TIMEOUT_MS,
        'Voice assistant'
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        reply: typeof parsed.reply === 'string' ? parsed.reply : 'How can I assist you?',
        suggestedRoute: typeof parsed.suggestedRoute === 'string' ? parsed.suggestedRoute : '',
      });
    } catch (err) {
      const mapped = extractGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 6. Learning Assistant Summarization
  app.post('/api/learning/summarize', rateLimit(20, 60_000), async (req, res) => {
    const content = sanitizeText(req.body?.text, 15_000);
    if (content.length < 20) {
      res.status(400).json({ error: 'Please provide at least 20 characters of text to summarize.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini summarization is not configured on the server. Read-aloud playback works offline.' });
      return;
    }

    const langName = getLanguageName(normalizeLang(req.body?.language));

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Summarize this document clearly for audio listening in ${langName}:\n\n${content}`,
          config: {
            systemInstruction: `Create an accessible audio-friendly summary in ${langName}. Keep sentences clear and avoid markdown symbols or ASCII art that sound awkward in screen readers.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          },
        }),
        AI_TIMEOUT_MS,
        'Document summary'
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        title: typeof parsed.title === 'string' ? parsed.title : 'Document Summary',
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 8) : [],
      });
    } catch (err) {
      const mapped = extractGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 7. Navigation Route Proxy (Google Routes API v2 & Places API New when configured; honest status otherwise)
  app.post('/api/navigation/route', rateLimit(30, 60_000), async (req, res) => {
    const originLat = Number(req.body?.origin?.lat);
    const originLng = Number(req.body?.origin?.lng);
    const destinationQuery = sanitizeText(req.body?.destination, 200);
    const travelMode = req.body?.travelMode === 'TRANSIT' ? 'TRANSIT' : 'WALK';
    const lang = normalizeLang(req.body?.language);

    if (!Number.isFinite(originLat) || !Number.isFinite(originLng) || !destinationQuery) {
      res.status(400).json({ error: 'Origin coordinates and a destination name are required.' });
      return;
    }

    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!mapsKey || mapsKey === 'your-google-maps-server-api-key') {
      // Honest fallback using OpenStreetMap Nominatim place lookup for straight-line bearing & distance only
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(destinationQuery)}`;
        const nomRes = await withTimeout(
          fetch(nomUrl, { headers: { 'User-Agent': 'DRISHTI-Accessibility-PWA/1.0' } }),
          8000,
          'Place lookup'
        );
        if (!nomRes.ok) {
          res.json({
            provider: 'unconfigured',
            googleMapsConfigured: false,
            message: 'Google Maps / Routes API key is not configured on the server, and place lookup was unavailable.',
            steps: [],
          });
          return;
        }
        const places = (await nomRes.json()) as Array<{ lat: string; lon: string; display_name: string }>;
        if (!places.length) {
          res.status(404).json({
            provider: 'nominatim_bearing',
            googleMapsConfigured: false,
            error: 'No matching destination found. Please enter a clearer street address or landmark.',
          });
          return;
        }
        const destLat = Number(places[0].lat);
        const destLng = Number(places[0].lon);
        const distanceMeters = haversineMeters(originLat, originLng, destLat, destLng);
        const bearingDeg = initialBearingDeg(originLat, originLng, destLat, destLng);
        res.json({
          provider: 'nominatim_bearing',
          googleMapsConfigured: false,
          destinationName: places[0].display_name,
          destinationCoords: { lat: destLat, lng: destLng },
          distanceMeters: Math.round(distanceMeters),
          bearingDegrees: Math.round(bearingDeg),
          compassDirection: bearingToCompass(bearingDeg),
          steps: [],
          message:
            'Google Routes API key is not configured. Showing straight-line compass bearing and approximate distance from OpenStreetMap Nominatim instead of turn-by-turn street routing.',
        });
        return;
      } catch {
        res.json({
          provider: 'unconfigured',
          googleMapsConfigured: false,
          message: 'Google Maps API key is not configured on the server. GPS coordinates and compass bearing remain available locally.',
          steps: [],
        });
        return;
      }
    }

    try {
      // 1) Resolve destination using Places API (New)
      const placeRes = await withTimeout(
        fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': mapsKey,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
          },
          body: JSON.stringify({
            textQuery: destinationQuery,
            languageCode: lang,
            locationBias: {
              circle: {
                center: { latitude: originLat, longitude: originLng },
                radius: 25000,
              },
            },
          }),
        }),
        10_000,
        'Places search'
      );

      const placeJson = (await placeRes.json()) as {
        places?: Array<{
          displayName?: { text?: string };
          formattedAddress?: string;
          location?: { latitude: number; longitude: number };
        }>;
        error?: { message?: string };
      };

      const topPlace = placeJson.places?.[0];
      if (!placeRes.ok || !topPlace?.location) {
        res.status(404).json({
          error: placeJson.error?.message || 'Destination could not be resolved via Google Places.',
        });
        return;
      }

      // 2) Compute accessible route via Google Routes API v2
      const routeRes = await withTimeout(
        fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': mapsKey,
            'X-Goog-FieldMask':
              'routes.duration,routes.distanceMeters,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters',
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
            destination: {
              location: {
                latLng: {
                  latitude: topPlace.location.latitude,
                  longitude: topPlace.location.longitude,
                },
              },
            },
            travelMode,
            languageCode: lang === 'kn' ? 'kn' : lang === 'hi' ? 'hi' : 'en-US',
            units: 'METRIC',
          }),
        }),
        10_000,
        'Routes computation'
      );

      const routeJson = (await routeRes.json()) as {
        routes?: Array<{
          distanceMeters?: number;
          duration?: string;
          legs?: Array<{
            steps?: Array<{
              distanceMeters?: number;
              navigationInstruction?: { instructions?: string; maneuver?: string };
            }>;
          }>;
        }>;
        error?: { message?: string };
      };

      const route = routeJson.routes?.[0];
      if (!routeRes.ok || !route) {
        res.status(502).json({
          error: routeJson.error?.message || 'Unable to compute a route for this destination.',
        });
        return;
      }

      const steps =
        route.legs?.[0]?.steps?.map((step, index) => ({
          index: index + 1,
          instruction: step.navigationInstruction?.instructions || 'Continue along path',
          maneuver: step.navigationInstruction?.maneuver || 'STRAIGHT',
          distanceMeters: step.distanceMeters ?? 0,
        })) ?? [];

      res.json({
        provider: 'google_routes',
        googleMapsConfigured: true,
        destinationName: `${topPlace.displayName?.text ?? destinationQuery}${topPlace.formattedAddress ? `, ${topPlace.formattedAddress}` : ''}`,
        destinationCoords: {
          lat: topPlace.location.latitude,
          lng: topPlace.location.longitude,
        },
        distanceMeters: route.distanceMeters ?? 0,
        durationText: route.duration ?? '',
        steps,
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Navigation service failed.',
      });
    }
  });

  return app;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function initialBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function bearingToCompass(deg: number): string {
  const dirs = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
  return dirs[Math.round(deg / 45) % 8] ?? 'North';
}

async function startServer() {
  const app = createApp();

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DRISHTI server listening on http://localhost:${PORT}`);
  });
}

// Start server only when executed directly (not when imported in tests)
const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  startServer().catch((err) => {
    console.error('Failed to start DRISHTI server:', err);
    process.exit(1);
  });
}
