import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * Play an audible logistics beep on scan / route match
 */
export function playScannerBeep(type: 'success' | 'alert' | 'click' = 'success') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      // Crisp 1760Hz POS scanner beep (two quick tones)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } else if (type === 'alert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
    console.debug('Audio not allowed yet:', e);
  }
}

/**
 * Render Code 128 barcode to SVG element
 */
export function renderBarcodeSvg(
  svgElement: SVGSVGElement | null,
  code: string,
  options?: {
    height?: number;
    width?: number;
    displayValue?: boolean;
    fontSize?: number;
    background?: string;
    lineColor?: string;
  }
) {
  if (!svgElement || !code) return;

  try {
    JsBarcode(svgElement, code, {
      format: 'CODE128',
      lineColor: options?.lineColor || '#0f172a',
      width: options?.width || 2.4,
      height: options?.height || 90,
      displayValue: options?.displayValue !== undefined ? options.displayValue : true,
      text: code,
      font: 'monospace',
      fontOptions: 'bold',
      fontSize: options?.fontSize || 16,
      textMargin: 6,
      margin: 12,
      background: options?.background || '#ffffff',
    });
  } catch (err) {
    console.error('Error rendering barcode:', err);
  }
}

/**
 * Generate QR code as Data URL
 */
export async function generateQrDataUrl(
  text: string,
  options?: { width?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 280,
      margin: 2,
      color: {
        dark: options?.darkColor || '#0f172a',
        light: options?.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}
