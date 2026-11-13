import type { LanguageCode } from '../types/drishti';

export interface ColorSampleResult {
  hex: string;
  rgb: { r: number; g: number; b: number };
  name: string;
  brightness: 'dark' | 'medium' | 'light';
}

const COLOR_NAMES: Record<string, Record<LanguageCode, string>> = {
  Black: { en: 'Black', kn: 'ಕಪ್ಪು (Black)', hi: 'काला (Black)' },
  White: { en: 'White', kn: 'ಬಿಳಿ (White)', hi: 'सफ़ेद (White)' },
  Gray: { en: 'Gray', kn: 'ಬೂದು (Gray)', hi: 'भूरा-सलेटी (Gray)' },
  Red: { en: 'Red', kn: 'ಕೆಂಪು (Red)', hi: 'लाल (Red)' },
  Orange: { en: 'Orange', kn: 'ಕಿತ್ತಳೆ (Orange)', hi: 'नारंगी (Orange)' },
  Yellow: { en: 'Yellow', kn: 'ಹಳದಿ (Yellow)', hi: 'पीला (Yellow)' },
  Green: { en: 'Green', kn: 'ಹಸಿರು (Green)', hi: 'हरा (Green)' },
  Teal: { en: 'Teal / Cyan', kn: 'ನೀಲಿ-ಹಸಿರು (Teal)', hi: 'फ़िरोज़ी (Teal)' },
  Blue: { en: 'Blue', kn: 'ನೀಲಿ (Blue)', hi: 'नीला (Blue)' },
  Purple: { en: 'Purple', kn: 'ನೇರಳೆ (Purple)', hi: 'बैंगनी (Purple)' },
  Pink: { en: 'Pink', kn: 'ಗುಲಾಬಿ (Pink)', hi: 'गुलाबी (Pink)' },
  Brown: { en: 'Brown', kn: 'ಕಂದು (Brown)', hi: 'भूरा (Brown)' },
};

export function classifyRgbColor(
  r: number,
  g: number,
  b: number,
  language: LanguageCode = 'en'
): ColorSampleResult {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
  }

  let key = 'Gray';
  if (l < 0.14) key = 'Black';
  else if (l > 0.9 && s < 0.18) key = 'White';
  else if (s < 0.14) key = 'Gray';
  else if (h < 15 || h >= 345) key = l < 0.32 ? 'Brown' : 'Red';
  else if (h < 42) key = l < 0.35 ? 'Brown' : 'Orange';
  else if (h < 68) key = 'Yellow';
  else if (h < 155) key = 'Green';
  else if (h < 195) key = 'Teal';
  else if (h < 255) key = 'Blue';
  else if (h < 305) key = 'Purple';
  else key = 'Pink';

  const brightness: 'dark' | 'medium' | 'light' = l < 0.3 ? 'dark' : l > 0.72 ? 'light' : 'medium';
  const hex = `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

  return {
    hex,
    rgb: { r: Math.round(r), g: Math.round(g), b: Math.round(b) },
    name: COLOR_NAMES[key]?.[language] ?? key,
    brightness,
  };
}

export async function sampleCenterColorFromDataUrl(
  dataUrl: string,
  language: LanguageCode
): Promise<ColorSampleResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, 48, 48);
      const data = ctx.getImageData(16, 16, 16, 16).data;
      let r = 0;
      let g = 0;
      let b = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      resolve(classifyRgbColor(r / pixels, g / pixels, b / pixels, language));
    };
    img.onerror = () => reject(new Error('Failed to load image for color sampling.'));
    img.src = dataUrl;
  });
}
