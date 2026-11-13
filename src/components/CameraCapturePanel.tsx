import React, { useRef, useState } from 'react';
import { Camera, CameraOff, Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useDrishti } from '../context/DrishtiContext';

interface CameraCapturePanelProps {
  onCapture: (dataUrl: string, mimeType: string) => void;
  actionLabel: string;
  isProcessing?: boolean;
  children?: React.ReactNode;
}

export const CameraCapturePanel: React.FC<CameraCapturePanelProps> = ({
  onCapture,
  actionLabel,
  isProcessing = false,
  children,
}) => {
  const { t, consents, updateConsents, speak } = useDrishti();
  const { videoRef, status, errorMessage, startCamera, stopCamera, captureFrameDataUrl } = useCamera();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>('');

  const handleEnableCamera = async () => {
    if (!consents.cameraConsent) {
      await updateConsents({ cameraConsent: true });
    }
    const ok = await startCamera();
    if (ok) {
      speak('Camera is active. Hold steady and select capture when ready.');
    } else {
      speak('Camera could not start. You can upload an image file instead.');
    }
  };

  const handleCapture = () => {
    const frame = captureFrameDataUrl();
    if (!frame) {
      speak('Camera frame not ready yet. Please wait a moment and try again.');
      return;
    }
    setPreviewDataUrl(frame);
    setUploadError('');
    onCapture(frame, 'image/jpeg');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      const msg = 'Unsupported file format. Please choose a JPEG, PNG, or WebP image.';
      setUploadError(msg);
      speak(msg, true);
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      const msg = 'Image file is larger than 6 MB. Please choose a smaller image.';
      setUploadError(msg);
      speak(msg, true);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewDataUrl(reader.result);
        onCapture(reader.result, file.type);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <section
      aria-label="Camera and image input"
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0D192B] hc:border-2 hc:border-white hc:bg-black"
    >
      <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-slate-950 dark:border-slate-700 aspect-video max-h-[360px] w-full flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Live camera viewfinder"
          className={`h-full w-full object-cover ${status === 'active' ? 'block' : 'hidden'}`}
        />

        {status !== 'active' && previewDataUrl && (
          <img
            src={previewDataUrl}
            alt="Selected image ready for analysis"
            className="h-full w-full object-contain"
          />
        )}

        {status !== 'active' && !previewDataUrl && (
          <div className="flex flex-col items-center justify-center px-6 py-8 text-center text-slate-200">
            <Camera className="mb-3 h-10 w-10 text-sky-400" aria-hidden="true" />
            <p className="max-w-md text-base font-medium leading-relaxed">
              Camera stays off until you turn it on. Enable your camera or choose an image file below.
            </p>
          </div>
        )}
      </div>

      {(errorMessage || uploadError) && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400 bg-amber-950/50 p-4 text-sm text-amber-100"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <span>{uploadError || errorMessage}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {status !== 'active' ? (
          <button
            type="button"
            onClick={() => void handleEnableCamera()}
            disabled={status === 'requesting'}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 py-3 text-base font-bold text-slate-950 hover:bg-sky-300 disabled:opacity-60 hc:bg-yellow-300 hc:text-black"
          >
            <Camera className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{status === 'requesting' ? 'Requesting Camera...' : t.common.startCamera}</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCapture}
              disabled={isProcessing}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-base font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-60 hc:bg-yellow-300 hc:text-black"
            >
              <RefreshCw className={`h-5 w-5 shrink-0 ${isProcessing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isProcessing ? t.common.loading : actionLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                speak('Camera turned off.');
              }}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 hc:border-white hc:text-white"
            >
              <CameraOff className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t.common.stopCamera}</span>
            </button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          aria-label={t.common.uploadImage}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-base font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 hc:border-white hc:bg-black hc:text-white"
        >
          <Upload className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{t.common.uploadImage}</span>
        </button>

        {previewDataUrl && status !== 'active' && (
          <button
            type="button"
            onClick={() => onCapture(previewDataUrl, 'image/jpeg')}
            disabled={isProcessing}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-base font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
          >
            <span>{isProcessing ? t.common.loading : actionLabel}</span>
          </button>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </section>
  );
};
