import React, { useState } from 'react';
import {
  ShieldAlert,
  Phone,
  MessageSquare,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { AccessibleModal } from '../components/AccessibleModal';

export const SosPage: React.FC = () => {
  const {
    t,
    contacts,
    addOrUpdateContact,
    removeContact,
    consents,
    updateConsents,
    speak,
    navigate,
  } = useDrishti();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [isPrimary, setIsPrimary] = useState(true);
  const [formError, setFormError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sosCoordinates, setSosCoordinates] = useState<string>('');
  const [sosPrepared, setSosPrepared] = useState(false);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || phone.trim().length < 5) {
      setFormError('Please enter a contact name and valid phone number.');
      return;
    }
    await addOrUpdateContact({ name, phone, relationship, isPrimary });
    speak(`Saved trusted contact ${name}.`, true);
    setName('');
    setPhone('');
    setRelationship('Family');
  };

  const handleOpenConfirm = () => {
    setSosPrepared(false);
    setSosCoordinates('');
    if (consents.sosLocationConsent && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSosCoordinates(
            `https://maps.google.com/?q=${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`
          );
        },
        () => setSosCoordinates(''),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
    setConfirmOpen(true);
    speak('Emergency SOS confirmation opened. No message has been sent yet. Choose confirm or cancel.', true);
  };

  const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0];
  const sosMessageBody = encodeURIComponent(
    `Emergency alert from DRISHTI: I need assistance.${sosCoordinates ? ` My approximate location: ${sosCoordinates}` : ''}`
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.dashboard.sosTitle}</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Configure trusted contacts. DRISHTI never contacts anyone silently without your explicit confirmation.
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

      {/* Explicit SOS Launch Card */}
      <section className="rounded-2xl border border-rose-500/60 bg-rose-950/90 p-6 text-rose-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Request Assistance</h2>
            <p className="mt-1 text-sm text-rose-100">
              {primaryContact
                ? `Primary contact ready: ${primaryContact.name} (${primaryContact.phone})`
                : 'Add at least one trusted contact below before using SOS.'}
            </p>
          </div>
          <button
            type="button"
            disabled={!primaryContact}
            onClick={handleOpenConfirm}
            className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-base font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
          >
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            <span>Open SOS Confirmation</span>
          </button>
        </div>

        <label className="mt-4 flex min-h-[44px] items-center gap-3 text-sm font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={consents.sosLocationConsent}
            onChange={(e) => void updateConsents({ sosLocationConsent: e.target.checked })}
            className="h-5 w-5 accent-amber-400"
          />
          <span>Include my GPS location link when I confirm an Emergency SOS message</span>
        </label>
      </section>

      {/* Trusted Contacts List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black space-y-5">
        <h2 className="text-xl font-bold">Trusted Contacts</h2>

        {contacts.length === 0 ? (
          <p className="text-base text-slate-600 dark:text-slate-300">
            No trusted contacts saved yet. Add a family member, friend, or caregiver below.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-base font-bold">
                    {contact.name}
                    {contact.isPrimary ? ' · Primary' : ''}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-mono-tabular">
                    {contact.phone} · {contact.relationship}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    <span>Call</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => void removeContact(contact.id)}
                    aria-label={`Delete ${contact.name}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-rose-500/50 text-rose-400 hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={(e) => void handleAddContact(e)} className="border-t border-slate-200 pt-5 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-bold">Add Trusted Contact</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-semibold mb-1">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Asha Rao"
                className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-base dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div>
              <label htmlFor="contact-phone" className="block text-sm font-semibold mb-1">
                Phone Number
              </label>
              <input
                id="contact-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98..."
                className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-base font-mono-tabular dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div>
              <label htmlFor="contact-rel" className="block text-sm font-semibold mb-1">
                Relationship
              </label>
              <input
                id="contact-rel"
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Family / Caregiver"
                className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-base dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <label className="flex min-h-[44px] items-center gap-3 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-5 w-5 accent-amber-400"
            />
            <span>Set as primary SOS contact</span>
          </label>

          {formError && (
            <p role="alert" className="text-sm font-semibold text-rose-400">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-sky-400 px-5 py-3 text-base font-bold text-slate-950 hover:bg-sky-300"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span>Save Trusted Contact</span>
          </button>
        </form>
      </section>

      <AccessibleModal
        open={confirmOpen}
        title="Confirm Emergency SOS Action"
        onClose={() => setConfirmOpen(false)}
      >
        {primaryContact && (
          <div className="space-y-4">
            <p className="text-base leading-relaxed">
              You are about to contact <strong>{primaryContact.name}</strong> ({primaryContact.phone}).
              {consents.sosLocationConsent
                ? sosCoordinates
                  ? ' Your GPS location link is included.'
                  : ' Waiting for GPS or sending without location.'
                : ' Location sharing is currently off.'}
            </p>

            {!sosPrepared ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setSosPrepared(true);
                    speak('Confirmed. Choose Call or Send SMS below to launch your phone dialer or messaging app.', true);
                  }}
                  className="min-h-[48px] flex-1 rounded-xl bg-rose-600 px-4 py-3 text-base font-extrabold text-white hover:bg-rose-500"
                >
                  Confirm & Unlock Call / SMS
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="min-h-[48px] rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold dark:border-slate-700"
                >
                  {t.common.cancel}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>Confirmed — choose how to reach {primaryContact.name}:</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href={`tel:${primaryContact.phone}`}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-base font-bold text-white"
                  >
                    <Phone className="h-5 w-5" aria-hidden="true" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href={`sms:${primaryContact.phone}?body=${sosMessageBody}`}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-base font-bold text-slate-950"
                  >
                    <MessageSquare className="h-5 w-5" aria-hidden="true" />
                    <span>Open SMS Alert</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </AccessibleModal>
    </div>
  );
};
