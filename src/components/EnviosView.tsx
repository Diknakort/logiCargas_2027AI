import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { EnvioItem } from '../types/logistics';
import { 
  QrCode, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  FileSpreadsheet, 
  ExternalLink,
  Info,
  Layers,
  ArrowUp,
  Package,
  Boxes,
  Truck,
  HelpCircle
} from 'lucide-react';

interface EnviosViewProps {
  envios: EnvioItem[];
  sheetUrl?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const EnviosView: React.FC<EnviosViewProps> = ({
  envios,
  sheetUrl,
  onRefresh,
  isRefreshing = false,
}) => {
  const [selectedEnvioId, setSelectedEnvioId] = useState<string>(() => {
    return envios.length > 0 ? envios[0].id : '';
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Ref to the top QR container to scroll up when a full-name selector is clicked
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize selected ID if envios changes and current selection is missing
  useEffect(() => {
    if (envios.length > 0 && (!selectedEnvioId || !envios.some(e => e.id === selectedEnvioId))) {
      setSelectedEnvioId(envios[0].id);
    }
  }, [envios, selectedEnvioId]);

  const currentEnvio = envios.find((e) => e.id === selectedEnvioId) || envios[0];

  // Sound beep feedback using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz beep (A5)
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  };

  // Generate QR code whenever the selected envio changes
  useEffect(() => {
    if (!currentEnvio || currentEnvio.qr === undefined) {
      setQrDataUrl('');
      return;
    }

    const textToEncode = String(currentEnvio.qr);

    QRCode.toDataURL(textToEncode, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code for envio:', err);
      });
  }, [currentEnvio]);

  const handleSelectEnvio = (envio: EnvioItem) => {
    setSelectedEnvioId(envio.id);
    playBeep();
    if (navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch {
        // ignore
      }
    }
  };

  // Selects an envio and scrolls smoothly up to the QR code area
  const handleSelectEnvioAndScrollUp = (envio: EnvioItem) => {
    handleSelectEnvio(envio);
    if (qrContainerRef.current) {
      qrContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCopyCharacter = () => {
    if (!currentEnvio) return;
    navigator.clipboard.writeText(String(currentEnvio.qr));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preset button themes for recognizable visual distinction
  const getButtonTheme = (index: number, isSelected: boolean) => {
    const themes = [
      {
        // 1. Verdes (CajasVerdes y Jaulas-Autostore)
        bg: isSelected
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-emerald-500/30 hover:border-emerald-400',
        badgeBg: isSelected ? 'bg-emerald-700/80 text-white' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
        accent: 'text-emerald-400',
        dot: 'bg-emerald-400',
        border: 'border-emerald-500/40',
      },
      {
        // 2. Palets (Palets Madera y JAULAS Jx)
        bg: isSelected
          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400'
          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-amber-500/30 hover:border-amber-400',
        badgeBg: isSelected ? 'bg-amber-700/80 text-white' : 'bg-amber-950/60 text-amber-400 border border-amber-800/60',
        accent: 'text-amber-400',
        dot: 'bg-amber-400',
        border: 'border-amber-500/40',
      },
      {
        // 3. Negros (Palets Negros)
        bg: isSelected
          ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/60 ring-2 ring-sky-400 border-2 border-slate-600'
          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500',
        badgeBg: isSelected ? 'bg-slate-700 text-sky-300' : 'bg-slate-950 text-slate-300 border border-slate-700',
        accent: 'text-sky-400',
        dot: 'bg-slate-300',
        border: 'border-slate-700',
      },
      {
        // 4. Vendidos (Vendidos INTER desde CARGAS)
        bg: isSelected
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
          : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-indigo-500/30 hover:border-indigo-400',
        badgeBg: isSelected ? 'bg-indigo-700/80 text-white' : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/60',
        accent: 'text-indigo-400',
        dot: 'bg-indigo-400',
        border: 'border-indigo-500/40',
      },
    ];

    return themes[index % themes.length];
  };

  // Quick access labels: "Verdes", "Palets", "Negros", "Vendidos"
  const getQuickLabel = (envio: EnvioItem, index: number): string => {
    const tipoLower = (envio.tipo || '').toLowerCase();
    if (tipoLower.includes('verde') || tipoLower.includes('autostore')) return 'Verdes';
    if (tipoLower.includes('madera') || (tipoLower.includes('palet') && !tipoLower.includes('negro')) || tipoLower.includes('jaula')) return 'Palets';
    if (tipoLower.includes('negro')) return 'Negros';
    if (tipoLower.includes('vendido') || tipoLower.includes('inter') || tipoLower.includes('carga')) return 'Vendidos';

    const defaults = ['Verdes', 'Palets', 'Negros', 'Vendidos'];
    return defaults[index] || envio.tipo.split(' ')[0] || `Opción ${index + 1}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Códigos de Envíos
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hidden sm:inline">
                Pestaña Envíos
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Accesos rápidos 1-toque para terminales y pistolas lectoras PDA
            </p>
          </div>
        </div>

        {/* Audio feedback toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-750'
                : 'bg-slate-800/50 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Sonido al pulsar activado' : 'Sonido desactivado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px] hidden sm:inline font-mono">Beep</span>
          </button>

          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs transition font-medium"
              title="Abrir hoja de cálculo oficial en Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hoja Oficial</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FIRST PART: QR DISPLAY WITH QUICK ACCESS BUTTONS ABOVE THE IMAGE */}
      {/* "pon la parte de qr con los accesos rapidos en la primera parte de la app" */}
      {/* "la parte de acceso rapido de envío de los qr, ponla por encima de la imagen" */}
      {/* ========================================================================= */}
      <div 
        ref={qrContainerRef} 
        className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient Background Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Selected Name Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono block">
              Código QR Activo para Pistola / PDA:
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white truncate flex items-center gap-2 mt-0.5">
              <span>{currentEnvio ? currentEnvio.tipo : 'Sin selección'}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={handleCopyCharacter}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Copiar carácter al portapapeles"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-xs">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
              title="Ampliar a pantalla completa para escaneo lejano"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="text-xs">Pantalla Completa</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ACCESOS RÁPIDOS POR ENCIMA DE LA IMAGEN QR */}
        {/* ============================================================== */}
        <div className="pt-4 pb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              Accesos Rápidos de Envíos:
            </span>
            <span className="text-[10px] font-mono text-slate-500">Toque directo 1 clic</span>
          </div>

          {/* 4 Big Quick Choice Buttons: Verdes, Palets, Negros, Vendidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {envios.map((envio, idx) => {
              const isSelected = envio.id === selectedEnvioId;
              const quickName = getQuickLabel(envio, idx);
              const theme = getButtonTheme(idx, isSelected);

              return (
                <button
                  key={`quick-top-btn-${envio.id}`}
                  onClick={() => handleSelectEnvio(envio)}
                  className={`p-3 sm:p-3.5 rounded-2xl transition-all font-bold text-left border cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? `${theme.bg} ring-2 ring-amber-400 font-black shadow-xl scale-[1.02]`
                      : 'bg-slate-950/90 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                  title={`${quickName}: ${envio.tipo}`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-sm sm:text-base font-black tracking-tight truncate">
                      {quickName}
                    </span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                  </div>
                  
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="text-[10px] opacity-75 font-mono uppercase tracking-wider">
                      QR Char:
                    </span>
                    <span className="font-mono text-sm sm:text-base px-2 py-0.5 rounded-lg bg-black/40 font-black shadow-inner">
                      {envio.qr}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* IMAGEN DEL CÓDIGO QR GENERADO AL INSTANTE */}
        {/* ============================================================== */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="p-4 sm:p-5 bg-white rounded-3xl shadow-2xl border-4 border-slate-200 transition-transform duration-200 hover:scale-[1.01]">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Código QR para ${currentEnvio?.tipo} (${currentEnvio?.qr})`}
                className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 object-contain block mx-auto select-none"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                <QrCode className="w-12 h-12 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Giant Encoded Character Display Capsule */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Carácter Codificado en el QR:
            </div>
            <div className="text-xs text-slate-300 font-mono mt-0.5">
              Valor exacto de la columna 2 del Excel
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 font-mono text-2xl sm:text-3xl font-black text-center min-w-[56px] shadow-lg shadow-amber-500/10">
              {currentEnvio ? currentEnvio.qr : '-'}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. SECOND PART: SELECTORS WITH FULL NAME (COLUMN 1 OF EXCEL) */}
      {/* "despues los selectores con el nombre completo, que al puslarlos te suba al qr seleccionado para verlo directamente." */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              Detalle Completo de Envíos (Texto Columna 1 Excel):
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Toca cualquier opción para seleccionarla y subir directamente a ver su código QR
            </p>
          </div>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl hidden sm:inline-block">
            {envios.length} tipos disponibles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {envios.map((envio, idx) => {
            const isSelected = envio.id === selectedEnvioId;
            const theme = getButtonTheme(idx, isSelected);
            const quickName = getQuickLabel(envio, idx);

            return (
              <button
                key={`full-card-${envio.id}`}
                onClick={() => handleSelectEnvioAndScrollUp(envio)}
                className={`group relative w-full text-left p-4 sm:p-4.5 rounded-2xl transition-all duration-150 transform active:scale-[0.98] cursor-pointer flex flex-col justify-between gap-3 border ${
                  isSelected
                    ? `${theme.bg} ring-2 ring-amber-400 shadow-xl border-amber-400`
                    : 'bg-slate-950/80 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Quick Badge + Character Capsule */}
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-black/40 text-white' : 'bg-slate-800 text-amber-400 border border-slate-700'
                    }`}>
                      {quickName}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] opacity-75 font-mono uppercase">Carácter:</span>
                    <span className={`px-2.5 py-0.5 rounded-lg font-mono font-black text-sm ${
                      isSelected ? 'bg-black/40 text-white' : 'bg-slate-800 text-amber-300 border border-slate-700'
                    }`}>
                      {envio.qr}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Full Name Text */}
                <div className="min-w-0 my-1">
                  <div className="font-bold text-sm sm:text-base leading-snug break-words">
                    {envio.tipo}
                  </div>
                </div>

                {/* Bottom Row: Call-to-action indication to scroll up to QR */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs opacity-80">
                  <span className="text-[11px] flex items-center gap-1 text-amber-300 font-semibold">
                    <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
                    <span>Ver QR arriba</span>
                  </span>
                  {isSelected ? (
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md uppercase">
                      Seleccionado
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      Tocar para activar
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. FINAL PART: EXPLANATION / GUÍA DE USO AT THE VERY END */}
      {/* "y la explicación de como usarlo al final, para que la revisen cuando haya dudas pero facilite el uso normal de usuarios experimentados" */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-5 text-xs text-slate-400 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Guía de Uso para Operadores (Ayuda y Dudas)</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">1</span>
              <span>Accesos Rápidos</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Pulsa directamente en cualquiera de los 4 botones superiores (Verdes, Palets, Negros, Vendidos).
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">2</span>
              <span>Generación de QR</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              El código QR se actualiza en pantalla de inmediato con el carácter asignado en la columna 2 del Excel.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">3</span>
              <span>Escaneo PDA</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Acerca la pistola lectora o terminal PDA a la pantalla para leer el código y registrar el bulto en el almacén.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FULLSCREEN MODAL FOR ULTRA-FAST LONG-DISTANCE SCANNING */}
      {/* ============================================================== */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <div 
            className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="text-left">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Modo Escáner Gigante
                </span>
                <h3 className="text-base font-bold text-white truncate max-w-[260px]">
                  {currentEnvio?.tipo}
                </h3>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            {/* Giant QR */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-slate-200">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt={`QR ${currentEnvio?.qr}`}
                  className="w-72 h-72 sm:w-80 sm:h-80 object-contain block mx-auto select-none"
                />
              )}
            </div>

            {/* Giant Character Banner */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">
                Carácter QR:
              </span>
              <span className="text-3xl font-black font-mono text-amber-400 px-4 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30">
                {currentEnvio?.qr}
              </span>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              Cerrar Vista Ampliada
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
