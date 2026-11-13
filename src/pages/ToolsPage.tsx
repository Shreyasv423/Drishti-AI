import React, { useState } from 'react';
import { Palette, QrCode, Tag, Volume2, ArrowLeft } from 'lucide-react';
import { useDrishti } from '../context/DrishtiContext';
import { CameraCapturePanel } from '../components/CameraCapturePanel';
import { sampleCenterColorFromDataUrl, type ColorSampleResult } from '../services/colorDetector';
import { inspectProductLabelApi } from '../services/apiClient';

type ToolTab = 'color' | 'qr' | 'product';

export const ToolsPage: React.FC = () => {
  const { t, prefs, isOnline, capabilities, speak, navigate } = useDrishti();
  const [activeTool, setActiveTool] = useState<ToolTab>('color');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [colorResult, setColorResult] = useState<ColorSampleResult | null>(null);
  const [qrResult, setQrResult] = useState<string>('');
  const [productResult, setProductResult] = useState<{
    productName: string;
    details: string;
    warnings: string;
    confidence: string;
  } | null>(null);

  const handleCapture = async (dataUrl: string, mimeType: string) => {
    setError('');
    setBusy(true);
    try {
      if (activeTool === 'color') {
        const sample = await sampleCenterColorFromDataUrl(dataUrl, prefs.language);
        setColorResult(sample);
        speak(`Detected ${sample.brightness} ${sample.name}.`, true);
      } else if (activeTool === 'qr') {
        const w = window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => {
            detect: (img: HTMLImageElement) => Promise<Array<{ rawValue?: string; format?: string }>>;
          };
        };
        if (!w.BarcodeDetector) {
          const msg =
            'Native BarcodeDetector API is not supported in this browser. Try Chrome/Edge on Android or desktop, or use the OCR Reader to read printed codes.';
          setError(msg);
          speak(msg, true);
          return;
        }
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = dataUrl;
        });
        const detector = new w.BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'code_128'],
        });
        const codes = await detector.detect(img);
        if (!codes.length) {
          const msg = 'No QR code or barcode detected. Center the code and try again.';
          setQrResult('');
          setError(msg);
          speak(msg, true);
        } else {
          const val = codes.map((c) => `${c.format || 'Code'}: ${c.rawValue || ''}`).join('\n');
          setQrResult(val);
          speak(`Detected ${val}`, true);
        }
      } else {
        if (!isOnline || !capabilities.geminiConfigured) {
          const msg = 'Product label AI analysis requires internet and a configured Gemini API key. Use OCR Reader offline for plain text.';
          setError(msg);
          speak(msg, true);
          return;
        }
        const res = await inspectProductLabelApi({
          imageBase64: dataUrl,
          mimeType,
          language: prefs.language,
        });
        setProductResult(res);
        speak(`${res.productName}. ${res.details}. ${res.warnings}`, true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tool processing failed.';
      setError(msg);
      speak(msg, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t.nav.tools}</h1>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Offline Color Detector, QR / Barcode Scanner, and Product Label Reader.
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

      <div className="grid gap-3 sm:grid-cols-3" role="tablist" aria-label="Everyday assistive tools">
        {[
          { id: 'color' as ToolTab, label: 'Color Detector (Offline)', icon: Palette },
          { id: 'qr' as ToolTab, label: 'QR / Barcode Reader', icon: QrCode },
          { id: 'product' as ToolTab, label: 'Product Label Reader', icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveTool(tab.id);
                setError('');
              }}
              className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                active
                  ? 'border-amber-400 bg-amber-400 text-slate-950'
                  : 'border-slate-300 bg-white text-slate-900 dark:border-slate-800 dark:bg-[#0D192B] dark:text-slate-100'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <CameraCapturePanel
        onCapture={(dataUrl, mime) => void handleCapture(dataUrl, mime)}
        actionLabel={
          activeTool === 'color'
            ? 'Detect Center Color'
            : activeTool === 'qr'
              ? 'Scan QR / Barcode'
              : 'Read Product Label'
        }
        isProcessing={busy}
      />

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-500 bg-rose-950/40 p-4 text-base text-rose-100">
          {error}
        </div>
      )}

      {activeTool === 'color' && colorResult && (
        <section
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B]"
        >
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="h-16 w-16 rounded-xl border border-slate-300"
              style={{ backgroundColor: colorResult.hex }}
            />
            <div>
              <h2 className="text-2xl font-extrabold">
                {colorResult.brightness} {colorResult.name}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-mono-tabular">
                {colorResult.hex} · RGB({colorResult.rgb.r}, {colorResult.rgb.g}, {colorResult.rgb.b})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => speak(`${colorResult.brightness} ${colorResult.name}`, true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            <span>{t.common.repeat}</span>
          </button>
        </section>
      )}

      {activeTool === 'qr' && qrResult && (
        <section
          aria-live="polite"
          className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] space-y-2"
        >
          <h2 className="text-xl font-bold">Detected Code</h2>
          <p className="whitespace-pre-wrap break-all font-mono-tabular text-base">{qrResult}</p>
        </section>
      )}

      {activeTool === 'product' && productResult && (
        <section
          aria-live="polite"
          className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0D192B] space-y-2"
        >
          <h2 className="text-xl font-bold">{productResult.productName}</h2>
          <p className="text-base leading-relaxed">{productResult.details}</p>
          {productResult.warnings && (
            <p className="text-sm font-semibold text-amber-400">
              Warnings: {productResult.warnings}
            </p>
          )}
          <p className="text-xs text-slate-500">
            {t.common.confidenceLabel}: {productResult.confidence}
          </p>
        </section>
      )}
    </div>
  );
};
