import React from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';

export const HelpPage: React.FC = () => {
  const { t, navigate, speak } = useDrishti();

  const guideSummary =
    'DRISHTI Help Guide. Use Tab or swipe right with TalkBack to move through controls. Use the Speak Command button to navigate by voice. OCR Reader, Color Detector, and Trusted Contacts work offline. AI Scene Description, Currency Recognition, and Object Finder require an internet connection.';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.nav.help} & Accessible Tutorial</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Screen-reader navigation tips, supported voice commands, and honest safety guidelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => speak(guideSummary, true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            <span>Listen to Guide</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t.common.backHome}</span>
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-4">
        <h2 className="text-xl font-bold">Android TalkBack & Keyboard Navigation</h2>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700 dark:text-slate-200">
          <li>Swipe right or press Tab to step cleanly through buttons, inputs, and live result regions.</li>
          <li>Every page starts with a Skip to Main Content link for immediate access.</li>
          <li>All interactive touch targets are sized at least 44 by 44 pixels for comfortable use.</li>
          <li>Press Escape inside any dialog to close it and return focus to the previous button.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-4">
        <h2 className="text-xl font-bold">Supported Voice Commands</h2>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700 dark:text-slate-200">
          <li><strong>&ldquo;Describe surroundings&rdquo;</strong> — Opens AI Camera Assistant.</li>
          <li><strong>&ldquo;Read text&rdquo;</strong> — Opens the offline Tesseract OCR Reader.</li>
          <li><strong>&ldquo;Find keys&rdquo;</strong> — Opens Everyday Object Finder pre-filled with &ldquo;keys&rdquo;.</li>
          <li><strong>&ldquo;Identify currency&rdquo;</strong> — Opens Indian Rupee note identifier.</li>
          <li><strong>&ldquo;Open navigation&rdquo;</strong> — Opens Accessible Navigation & GPS position.</li>
          <li><strong>&ldquo;Emergency SOS&rdquo;</strong> — Opens Trusted Contacts & SOS confirmation.</li>
          <li><strong>&ldquo;Stop&rdquo;</strong> — Immediately silences spoken playback.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-3">
        <h2 className="text-xl font-bold">Safety & Limitation Boundaries</h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
          DRISHTI is an assistive companion and is never a substitute for a white cane, guide dog, human assistance at busy crossings, or pharmacist verification for medicines. When AI confidence is low, DRISHTI explicitly tells you to retry with steadier framing or better lighting.
        </p>
      </section>
    </div>
  );
};
