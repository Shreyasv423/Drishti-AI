import React from 'react';
import {
  Camera,
  FileText,
  Home,
  Mic,
  Navigation,
  Banknote,
  Search,
  BookOpen,
  ShieldAlert,
  Wrench,
  Settings,
  HelpCircle,
  Wifi,
  WifiOff,
  VolumeX,
  UserCheck,
} from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { PWAInstallButton } from './PWAInstallButton';
import type { AppRoute } from '../types/drishti';

interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    route,
    navigate,
    t,
    isOnline,
    liveAnnouncement,
    isSpeaking,
    stopSpeaking,
    user,
  } = useDrishti();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: Home },
    { id: 'camera', label: t.nav.camera, icon: Camera },
    { id: 'ocr', label: t.nav.ocr, icon: FileText },
    { id: 'voice', label: t.nav.voice, icon: Mic },
    { id: 'navigation', label: t.nav.navigation, icon: Navigation },
    { id: 'currency', label: t.nav.currency, icon: Banknote },
    { id: 'finder', label: t.nav.finder, icon: Search },
    { id: 'learning', label: t.nav.learning, icon: BookOpen },
    { id: 'tools', label: t.nav.tools, icon: Wrench },
    { id: 'sos', label: t.nav.sos, icon: ShieldAlert },
    { id: 'settings', label: t.nav.settings, icon: Settings },
    { id: 'help', label: t.nav.help, icon: HelpCircle },
  ];

  const mobileTabs: NavItem[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: Home },
    { id: 'camera', label: t.nav.camera, icon: Camera },
    { id: 'ocr', label: t.nav.ocr, icon: FileText },
    { id: 'voice', label: t.nav.voice, icon: Mic },
    { id: 'sos', label: t.nav.sos, icon: ShieldAlert },
  ];

  const currentLabel = navItems.find((n) => n.id === route)?.label || t.appName;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#08101E] dark:text-slate-50 hc:bg-black hc:text-white">
      <a
        href="#drishti-main-content"
        className="sr-only-focusable fixed left-4 top-4 z-50 rounded-xl bg-amber-400 px-4 py-3 text-base font-bold text-slate-950 shadow-lg"
      >
        {t.skipToMain}
      </a>

      {/* Screen-reader live region for spoken/status updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Mobile Compact Sticky Header (< 8% height) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-[#08101E]/95 hc:border-white hc:bg-black lg:hidden">
        <button
          type="button"
          onClick={() => navigate('dashboard')}
          className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 min-h-[44px] flex items-center"
        >
          {t.appName}
        </button>

        <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
          {currentLabel}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {isSpeaking ? (
            <button
              type="button"
              onClick={stopSpeaking}
              aria-label={t.speakStop}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-rose-600 px-3 text-xs font-bold text-white"
            >
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <PWAInstallButton compact />
          )}
        </div>
      </header>

      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        {/* Desktop Navigation Rail */}
        <aside
          aria-label="Primary desktop navigation"
          className="hidden lg:flex lg:w-72 lg:flex-col lg:justify-between lg:border-r lg:border-slate-200 lg:bg-white lg:p-6 dark:lg:border-slate-800 dark:lg:bg-[#0B1526] hc:lg:border-white hc:lg:bg-black"
        >
          <div>
            <div className="flex items-center justify-between gap-2 pb-6 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="text-left min-h-[44px]"
              >
                <span className="block font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  DRISHTI
                </span>
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t.tagline}
                </span>
              </button>
            </div>

            <nav className="mt-5 space-y-1" aria-label="DRISHTI Modules">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = route === item.id;
                const isSos = item.id === 'sos';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                      active
                        ? 'bg-amber-400 text-slate-950 font-bold hc:bg-yellow-300 hc:text-black'
                        : isSos
                          ? 'text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
              ) : (
                <WifiOff className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
              )}
              <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('auth')}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 hc:border-white hc:text-white"
            >
              <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{user?.email ? user.email : 'Account & Sync'}</span>
            </button>

            <PWAInstallButton />
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Connectivity Banner on Mobile or Offline */}
          {!isOnline && (
            <div
              role="status"
              className="flex items-center gap-3 border-b border-amber-400/50 bg-amber-950 px-4 py-2.5 text-sm font-semibold text-amber-100"
            >
              <WifiOff className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <span>{t.offlineLabel}</span>
            </div>
          )}

          <main
            id="drishti-main-content"
            tabIndex={-1}
            className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8"
          >
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile Fixed Thumb Tab Bar (Height: 64px, <= 8% viewport height) */}
      <nav
        aria-label="Quick mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-5 items-center border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-[#08101E]/95 hc:border-t-2 hc:border-white hc:bg-black lg:hidden"
      >
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          const active = route === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold transition ${
                active
                  ? 'text-amber-600 dark:text-amber-300 hc:text-yellow-300 font-bold'
                  : item.id === 'sos'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
