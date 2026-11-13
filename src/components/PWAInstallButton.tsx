import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AccessibleModal } from './AccessibleModal';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-300 whitespace-nowrap shrink-0 hc:bg-yellow-300 hc:text-black"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{compact ? 'Install' : 'Install DRISHTI App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Install on iOS</span>
        </button>

        <AccessibleModal
          open={showIOSGuide}
          title="Install DRISHTI on iPhone or iPad"
          onClose={() => setShowIOSGuide(false)}
        >
          <ol className="list-decimal space-y-2 pl-5 text-base leading-relaxed text-slate-700 dark:text-slate-200">
            <li>Open the Safari Share menu at the bottom of your screen.</li>
            <li>Scroll through the options and activate Add to Home Screen.</li>
            <li>Confirm by tapping Add so DRISHTI launches offline in standalone mode.</li>
          </ol>
          <button
            type="button"
            onClick={() => setShowIOSGuide(false)}
            className="mt-6 w-full min-h-[48px] rounded-xl bg-amber-400 px-4 py-3 text-base font-bold text-slate-950 hover:bg-amber-300"
          >
            Got it
          </button>
        </AccessibleModal>
      </>
    );
  }

  return null;
};
