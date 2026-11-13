import React from 'react';
import {
  Camera,
  FileText,
  Navigation,
  Search,
  Banknote,
  ShieldAlert,
  BookOpen,
  Wrench,
  Settings,
  HelpCircle,
  Mic,
} from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { VoiceCommandBar } from '../components/VoiceCommandBar';
import type { AppRoute } from '../types/drishti';

interface ActionCard {
  route: AppRoute;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'primary' | 'danger' | 'standard';
  availability: string;
}

export const DashboardPage: React.FC = () => {
  const { t, navigate, isOnline, capabilities } = useDrishti();

  const primaryActions: ActionCard[] = [
    {
      route: 'camera',
      title: t.dashboard.cameraTitle,
      desc: t.dashboard.cameraDesc,
      icon: Camera,
      tone: 'primary',
      availability: isOnline && capabilities.geminiConfigured ? 'Online AI Vision' : 'Requires Online AI',
    },
    {
      route: 'ocr',
      title: t.dashboard.ocrTitle,
      desc: t.dashboard.ocrDesc,
      icon: FileText,
      tone: 'standard',
      availability: 'Works Offline · Tesseract OCR',
    },
    {
      route: 'navigation',
      title: t.dashboard.navTitle,
      desc: t.dashboard.navDesc,
      icon: Navigation,
      tone: 'standard',
      availability: capabilities.googleMapsConfigured ? 'Google Routes Ready' : 'GPS & Compass',
    },
    {
      route: 'finder',
      title: t.dashboard.finderTitle,
      desc: t.dashboard.finderDesc,
      icon: Search,
      tone: 'standard',
      availability: isOnline && capabilities.geminiConfigured ? 'Online AI Search' : 'Requires Online AI',
    },
    {
      route: 'currency',
      title: t.dashboard.currencyTitle,
      desc: t.dashboard.currencyDesc,
      icon: Banknote,
      tone: 'standard',
      availability: isOnline && capabilities.geminiConfigured ? 'INR Note Estimate' : 'Requires Online AI',
    },
    {
      route: 'sos',
      title: t.dashboard.sosTitle,
      desc: t.dashboard.sosDesc,
      icon: ShieldAlert,
      tone: 'danger',
      availability: 'Works Offline · Explicit Confirm',
    },
  ];

  const secondaryTools = [
    { route: 'voice' as AppRoute, label: t.nav.voice, icon: Mic },
    { route: 'learning' as AppRoute, label: t.nav.learning, icon: BookOpen },
    { route: 'tools' as AppRoute, label: t.nav.tools, icon: Wrench },
    { route: 'settings' as AppRoute, label: t.nav.settings, icon: Settings },
    { route: 'help' as AppRoute, label: t.nav.help, icon: HelpCircle },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t.dashboard.heading}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {t.dashboard.subheading}
        </p>
      </header>

      <VoiceCommandBar />

      <section aria-label="Primary visual assistance modules">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {primaryActions.map((card) => {
            const Icon = card.icon;
            const styleClass =
              card.tone === 'primary'
                ? 'border-amber-400/70 bg-amber-400 text-slate-950 hover:bg-amber-300 hc:bg-yellow-300 hc:text-black'
                : card.tone === 'danger'
                  ? 'border-rose-500/60 bg-rose-950/90 text-rose-50 hover:bg-rose-900 hc:border-2 hc:border-rose-400 hc:bg-black'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-sky-400 dark:border-slate-800 dark:bg-[#0D192B] dark:text-slate-50 dark:hover:border-sky-400 hc:border-2 hc:border-white hc:bg-black';

            return (
              <button
                key={card.route}
                type="button"
                onClick={() => navigate(card.route)}
                className={`group flex min-h-[148px] flex-col justify-between rounded-2xl border p-5 text-left transition ${styleClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xl font-extrabold leading-snug">{card.title}</span>
                  <Icon className="h-7 w-7 shrink-0" aria-hidden="true" />
                </div>

                <div className="mt-4 space-y-2">
                  <p
                    className={`text-sm leading-relaxed ${
                      card.tone === 'primary'
                        ? 'text-slate-900'
                        : card.tone === 'danger'
                          ? 'text-rose-100'
                          : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {card.desc}
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      card.tone === 'primary'
                        ? 'text-slate-900/80'
                        : card.tone === 'danger'
                          ? 'text-rose-200'
                          : 'text-sky-700 dark:text-sky-300'
                    }`}
                  >
                    {card.availability}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="secondary-tools-heading" className="space-y-3">
        <h2 id="secondary-tools-heading" className="text-lg font-bold">
          {t.dashboard.secondaryHeading}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {secondaryTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.route}
                type="button"
                onClick={() => navigate(tool.route)}
                className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#0D192B] dark:text-slate-100 dark:hover:bg-slate-800 hc:border-2 hc:border-white hc:bg-black"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
