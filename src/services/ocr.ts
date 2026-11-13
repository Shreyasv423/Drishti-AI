import { createWorker } from 'tesseract.js';
import type { LanguageCode } from '../types/drishti';

export interface OcrOutput {
  text: string;
  confidence: number;
  languageUsed: string;
}

export function mapLanguageToTesseract(lang: LanguageCode): string {
  if (lang === 'kn') return 'kan+eng';
  if (lang === 'hi') return 'hin+eng';
  return 'eng';
}

export async function runOfflineOcr(
  imageSource: string | File | Blob,
  language: LanguageCode,
  onProgress?: (progressPct: number, statusText: string) => void
): Promise<OcrOutput> {
  const tessLang = mapLanguageToTesseract(language);

  const worker = await createWorker(tessLang, 1, {
    logger: (m) => {
      if (m && typeof m.progress === 'number' && onProgress) {
        onProgress(Math.round(m.progress * 100), m.status || 'Processing');
      }
    },
  });

  try {
    const result = await worker.recognize(imageSource);
    const cleaned = (result.data.text || '').replace(/\n{3,}/g, '\n\n').trim();
    const confidence = Math.round(result.data.confidence || 0);
    return {
      text: cleaned,
      confidence,
      languageUsed: tessLang,
    };
  } finally {
    await worker.terminate();
  }
}
