import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Share2,
  Volume2,
  ShieldAlert,
  ArrowLeft,
  Compass,
} from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { computeNavigationRouteApi } from '../services/apiClient';
import type { NavigationRouteResponse } from '../types/drishti';

export const NavigationPage: React.FC = () => {
  const { t, prefs, consents, updateConsents, capabilities, isOnline, speak, navigate, recordEvent } =
    useDrishti();

  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [destination, setDestination] = useState('');
  const [travelMode, setTravelMode] = useState<'WALK' | 'TRANSIT'>('WALK');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [routeResult, setRouteResult] = useState<NavigationRouteResponse | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');

  const requestLocation = (): Promise<{ lat: number; lng: number; accuracy: number } | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const msg = 'Geolocation is not supported in this browser.';
        setLocError(msg);
        speak(msg, true);
        resolve(null);
        return;
      }
      setLocLoading(true);
      setLocError('');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          };
          setCoords(next);
          setLocLoading(false);
          speak(
            `Current GPS coordinates acquired. Accuracy within ${next.accuracy} meters.`,
            true
          );
          resolve(next);
        },
        (err) => {
          const msg =
            err.code === 1
              ? 'Location permission was denied. Enable GPS access in browser settings.'
              : 'Unable to acquire GPS fix. Move near an open window or outdoors and retry.';
          setLocError(msg);
          setLocLoading(false);
          speak(msg, true);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
  };

  const handleFindRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteError('');
    if (!destination.trim()) {
      setRouteError('Please enter a destination name or address.');
      return;
    }

    if (!isOnline) {
      const msg = 'Route lookup requires internet access. GPS coordinate check remains available offline.';
      setRouteError(msg);
      speak(msg, true);
      return;
    }

    let origin = coords;
    if (!origin) {
      origin = await requestLocation();
      if (!origin) return;
    }

    setRouteLoading(true);
    try {
      const res = await computeNavigationRouteApi({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: destination.trim(),
        travelMode,
        language: prefs.language,
      });
      setRouteResult(res);

      if (res.provider === 'google_routes' && res.steps.length > 0) {
        const summary = `Route to ${res.destinationName}. Total distance ${Math.round(res.distanceMeters ?? 0)} meters. Step 1: ${res.steps[0].instruction}`;
        speak(summary, true);
        await recordEvent('navigation', 'success');
      } else if (res.provider === 'nominatim_bearing') {
        const summary = `${res.destinationName}. Straight-line distance ${res.distanceMeters} meters toward ${res.compassDirection} (${res.bearingDegrees} degrees). ${res.message ?? ''}`;
        speak(summary, true);
        await recordEvent('navigation', 'uncertain');
      } else {
        speak(res.message || 'Routing unavailable.', true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to calculate route.';
      setRouteError(msg);
      speak(msg, true);
      await recordEvent('navigation', 'error');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleShareLocation = async () => {
    setShareFeedback('');
    if (!consents.locationShareConsent) {
      const msg = 'Enable location sharing consent below before sharing your coordinates.';
      setShareFeedback(msg);
      speak(msg, true);
      return;
    }
    const loc = coords ?? (await requestLocation());
    if (!loc) return;

    const mapsLink = `https://maps.google.com/?q=${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
    const shareText = `My current location shared via DRISHTI: ${mapsLink} (accuracy ±${loc.accuracy}m)`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Location (DRISHTI)', text: shareText, url: mapsLink });
        setShareFeedback('Location shared.');
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback('Location link copied to clipboard.');
      speak('Location link copied to clipboard.', true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.dashboard.navTitle}</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Spoken walking and transit guidance with explicit GPS & consent controls.
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

      <div
        role="note"
        className="flex items-start gap-3 rounded-2xl border border-amber-400/50 bg-amber-950/30 p-4 text-sm leading-relaxed text-amber-100"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
        <span>{t.safety.navigationWarning}</span>
      </div>

      {!capabilities.googleMapsConfigured && (
        <div className="rounded-2xl border border-sky-400/40 bg-sky-950/25 p-4 text-sm text-slate-200">
          <strong>Routing Status:</strong> <code>GOOGLE_MAPS_API_KEY</code> is not configured on the server. DRISHTI provides live GPS coordinates, compass bearing, and approximate OpenStreetMap Nominatim distance rather than fabricated turn-by-turn street directions.
        </div>
      )}

      {/* GPS Position & Consent Sharing */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Current GPS Position</h2>
          <button
            type="button"
            onClick={() => void requestLocation()}
            disabled={locLoading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300 disabled:opacity-60"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>{locLoading ? 'Acquiring GPS...' : 'Update My Location'}</span>
          </button>
        </div>

        {coords && (
          <p className="font-mono-tabular text-sm text-slate-700 dark:text-slate-300">
            Latitude {coords.lat.toFixed(5)}, Longitude {coords.lng.toFixed(5)} · Accuracy ±{coords.accuracy}m
          </p>
        )}

        {locError && (
          <p role="alert" className="text-sm font-semibold text-rose-400">
            {locError}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-[44px] items-center gap-3 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={consents.locationShareConsent}
              onChange={(e) => void updateConsents({ locationShareConsent: e.target.checked })}
              className="h-5 w-5 accent-amber-400"
            />
            <span>Allow explicit location sharing when I tap Share</span>
          </label>

          <button
            type="button"
            onClick={() => void handleShareLocation()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>Share My Location</span>
          </button>
        </div>

        {shareFeedback && (
          <p role="status" className="text-sm font-semibold text-emerald-400">
            {shareFeedback}
          </p>
        )}
      </section>

      {/* Destination Search */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black">
        <h2 className="text-lg font-bold">Destination Search</h2>
        <form onSubmit={(e) => void handleFindRoute(e)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="nav-destination" className="block text-sm font-semibold mb-1.5">
              Where do you want to go?
            </label>
            <input
              id="nav-destination"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., MG Road Metro Station, Bengaluru"
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-base dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900" role="group" aria-label="Travel mode">
              {(['WALK', 'TRANSIT'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTravelMode(mode)}
                  className={`min-h-[44px] rounded-lg px-4 text-sm font-bold transition ${
                    travelMode === mode
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mode === 'WALK' ? 'Walking' : 'Public Transit'}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={routeLoading}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-base font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
            >
              <Navigation className="h-5 w-5" aria-hidden="true" />
              <span>{routeLoading ? 'Calculating Route...' : 'Get Spoken Route'}</span>
            </button>
          </div>
        </form>

        {routeError && (
          <p role="alert" className="mt-4 text-sm font-semibold text-rose-400">
            {routeError}
          </p>
        )}
      </section>

      {routeResult && (
        <section
          aria-live="polite"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{routeResult.destinationName || 'Route Status'}</h2>
              {typeof routeResult.distanceMeters === 'number' && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 font-mono-tabular">
                  Distance: {routeResult.distanceMeters} m
                  {routeResult.compassDirection
                    ? ` · Bearing: ${routeResult.compassDirection} (${routeResult.bearingDegrees}°)`
                    : ''}
                </p>
              )}
            </div>

            {routeResult.compassDirection && (
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Compass className="h-5 w-5" aria-hidden="true" />
                <span>{routeResult.compassDirection}</span>
              </div>
            )}
          </div>

          {routeResult.message && (
            <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-300">
              {routeResult.message}
            </p>
          )}

          {routeResult.steps.length > 0 && (
            <ol className="divide-y divide-slate-200 dark:divide-slate-800">
              {routeResult.steps.map((step) => (
                <li key={step.index} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <span className="font-bold">Step {step.index}: </span>
                    <span>{step.instruction}</span>
                    <span className="ml-2 text-xs text-slate-500 font-mono-tabular">
                      ({step.distanceMeters} m)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => speak(`Step ${step.index}: ${step.instruction}`, true)}
                    aria-label={`Speak step ${step.index}`}
                    className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700"
                  >
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
};
