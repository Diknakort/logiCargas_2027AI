import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Barcode, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Wifi, 
  HelpCircle,
  RotateCcw,
  PrinterCheck,
  CheckCircle2,
  X,
  History,
  ArrowRight
} from 'lucide-react';
import { renderBarcodeSvg, playScannerBeep } from '../services/barcodeService';

export const ImpresorasView: React.FC = () => {
  // Two digits input state (e.g., '40')
  const [digits, setDigits] = useState<string>('40');
  // Active generated code (starts with default 'EMPWIFIZ40')
  const [activeCode, setActiveCode] = useState<string>('EMPWIFIZ40');
  const [activeNumber, setActiveNumber] = useState<string>('40');
  
  // UI states
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentNumbers, setRecentNumbers] = useState<string[]>(() => {
    const saved = localStorage.getItem('logiruta_recent_printers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 8);
      } catch {}
    }
    return ['40', '01', '02', '08', '10', '12', '20', '30'];
  });

  // SVG references for barcodes
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);
  const fullscreenSvgRef = useRef<SVGSVGElement | null>(null);
  const barcodeCardRef = useRef<HTMLDivElement | null>(null);

  // Common quick-pick printer presets in warehouse
  const PRESET_NUMBERS = ['40', '01', '02', '03', '04', '08', '10', '12', '15', '20', '25', '30', '50', '99'];

  // Render barcode whenever activeCode changes
  useEffect(() => {
    if (!activeCode) return;
    
    // Main card barcode
    if (barcodeSvgRef.current) {
      renderBarcodeSvg(barcodeSvgRef.current, activeCode, {
        width: 2.8,
        height: 105,
        fontSize: 18,
        displayValue: true,
      });
    }

    // Fullscreen barcode (if open)
    if (isFullscreen && fullscreenSvgRef.current) {
      renderBarcodeSvg(fullscreenSvgRef.current, activeCode, {
        width: 3.8,
        height: 160,
        fontSize: 24,
        displayValue: true,
      });
    }
  }, [activeCode, isFullscreen]);

  // Handle digit input change (only allow max 2 digits, numbers only)
  const handleInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 2);
    setDigits(cleaned);
  };

  // Generate code function
  const handleGenerate = (numToUse?: string) => {
    const targetDigits = (numToUse !== undefined ? numToUse : digits).trim();
    if (!targetDigits) return;

    // Pad with leading zero if single digit (e.g., '4' -> '04') or keep as is if 2 digits
    const formattedDigits = targetDigits.length === 1 ? `0${targetDigits}` : targetDigits;
    const fullCode = `EMPWIFIZ${formattedDigits}`;

    setActiveNumber(formattedDigits);
    setActiveCode(fullCode);
    setDigits(formattedDigits);

    if (soundEnabled) {
      playScannerBeep('success');
    }

    // Update recent numbers
    setRecentNumbers((prev) => {
      const updated = [formattedDigits, ...prev.filter((n) => n !== formattedDigits)].slice(0, 8);
      localStorage.setItem('logiruta_recent_printers', JSON.stringify(updated));
      return updated;
    });

    // Smooth scroll to barcode card on mobile
    if (barcodeCardRef.current && window.innerWidth < 768) {
      barcodeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!activeCode) return;
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      if (soundEnabled) playScannerBeep('click');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Virtual keypad helper
  const handleKeypadPress = (digit: string) => {
    if (soundEnabled) playScannerBeep('click');
    if (digits.length >= 2) {
      setDigits(digit); // replace if already 2
    } else {
      setDigits((prev) => `${prev}${digit}`.slice(0, 2));
    }
  };

  const handleKeypadBackspace = () => {
    if (soundEnabled) playScannerBeep('click');
    setDigits((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    if (soundEnabled) playScannerBeep('click');
    setDigits('');
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* TOP HEADER: SECTION TITLE & SOUND CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border border-blue-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Impresoras</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono font-bold">
                  Code 128
                </span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                WiFi / Zebra
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Generador de códigos para vincular PDA o pistolas láser a impresoras móviles
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 self-start md:self-center">
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

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-mono">
            <Barcode className="w-3.5 h-3.5 text-amber-400" />
            <span>Prefijo: <strong className="text-white">EMPWIFIZ</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BARCODE ACTIVE DISPLAY CARD (PROMINENT AT TOP FOR SPEED) */}
      {/* ========================================================================= */}
      <div 
        ref={barcodeCardRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Barcode Header with Active Code Details & Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono block">
              Código de Barras Activo (Listo para Pistola / PDA):
            </span>
            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
              <h3 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                <span className="text-blue-400">EMPWIFIZ</span>
                <span className="text-amber-400 underline decoration-amber-400/50">{activeNumber}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-slate-800 text-emerald-400 border border-slate-700 flex items-center gap-1">
                <PrinterCheck className="w-3.5 h-3.5 text-emerald-400" />
                Impresora #{activeNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Copiar texto del código"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
              title="Ampliar código de barras a pantalla completa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pantalla Completa</span>
            </button>
          </div>
        </div>

        {/* Big Code 128 Barcode Display Canvas */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-xl p-5 sm:p-7 bg-white rounded-3xl shadow-2xl border-4 border-slate-200 flex flex-col items-center justify-center transition-transform hover:scale-[1.01]">
            <svg 
              ref={barcodeSvgRef} 
              className="w-full max-w-full h-auto object-contain block mx-auto select-none" 
            />
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-3 text-center flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Código Code 128 de alta densidad para lectura instantánea a distancia</span>
          </p>
        </div>

        {/* Status specs bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm font-mono shrink-0 shadow-lg shadow-blue-600/20">
              PR
            </div>
            <div>
              <div className="text-xs text-slate-400">
                Identificador de Impresora WiFi:
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-white">
                EMPWIFIZ{activeNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-slate-400">Terminales compatibles:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
              Zebra, Honeywell, Datalogic
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NUMERIC INPUT & "GENERAR CÓDIGO" ACTION CARD */}
      {/* "el usuario pondrá 2 dígitos (dos números por ejemplo 40) estos una vez */}
      {/* confirmado con un botón 'generar código' creará un código 128..." */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Input Form & Button */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Introduce los 2 Dígitos de la Impresora
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Ejemplo: 40 &rarr; EMPWIFIZ40
            </span>
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Número de Impresora (2 dígitos)
              </label>

              {/* Big Input with Prefix visual indicator */}
              <div className="relative flex items-center bg-slate-950 border-2 border-slate-700 focus-within:border-amber-400 rounded-2xl p-2 transition-all shadow-inner">
                <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 font-mono font-black text-base sm:text-lg select-none shrink-0 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-blue-400" />
                  <span>EMPWIFIZ</span>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={digits}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="40"
                  className="w-full bg-transparent px-3 py-2 text-3xl sm:text-4xl font-mono font-black text-amber-400 placeholder:text-slate-700 focus:outline-none tracking-widest text-center"
                  autoFocus
                />

                {digits && (
                  <button
                    type="button"
                    onClick={() => setDigits('')}
                    className="p-2 text-slate-500 hover:text-white transition cursor-pointer shrink-0"
                    title="Borrar número"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 pl-1">
                Escribe dos números del 00 al 99 (si pones un solo dígito como 4 se completará a 04).
              </p>
            </div>

            {/* Big Action Button "GENERAR CÓDIGO" */}
            <button
              type="submit"
              disabled={!digits.trim()}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                digits.trim()
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Barcode className="w-5 h-5 text-slate-950" />
              <span>Generar Código</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </form>

          {/* Quick On-Screen Touch Keypad for Warehouse Operators with Gloves */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Teclado Rápido Táctil:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={`keypad-${digit}`}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-mono font-bold text-lg transition active:scale-95 cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-red-950/30 border border-slate-800 text-red-400 font-mono text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-mono font-bold text-lg transition active:scale-95 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 font-mono text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                &larr; Borrar
              </button>
            </div>
          </div>
        </div>

        {/* Right: Quick Preset Buttons & Operator Guide */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Access Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Accesos Rápidos Habituales
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">1 toque</span>
            </div>

            <p className="text-xs text-slate-400">
              Pulsa cualquiera de los números directos para generar su código 128 inmediatamente:
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-4 gap-2">
              {PRESET_NUMBERS.map((preset) => {
                const isActive = activeNumber === preset;
                return (
                  <button
                    key={`preset-${preset}`}
                    onClick={() => handleGenerate(preset)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition cursor-pointer font-mono font-black text-sm flex flex-col items-center justify-center ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                        : 'bg-slate-950 hover:bg-slate-850 text-slate-200 border-slate-800 hover:border-amber-400/50'
                    }`}
                  >
                    <span>{preset}</span>
                    <span className={`text-[8px] tracking-tighter ${isActive ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
                      EMPWIFIZ
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Recent Numbers History */}
            {recentNumbers.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2">
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span>Últimos números generados:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentNumbers.map((num) => (
                    <button
                      key={`recent-${num}`}
                      onClick={() => handleGenerate(num)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300 font-mono text-xs font-bold transition cursor-pointer"
                    >
                      #{num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Operator Instructions Guide */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Instrucciones para Operadores</span>
            </div>

            <ol className="text-slate-400 space-y-2 text-xs list-decimal list-inside leading-relaxed pl-1">
              <li>
                Localiza el adhesivo con el número de impresora en el lateral de la Zebra (ej. <strong className="text-white">40</strong>).
              </li>
              <li>
                Escribe ese número en la casilla o toca uno de los botones rápidos de arriba y pulsa <strong className="text-amber-400">Generar Código</strong>.
              </li>
              <li>
                Apunta con el lector láser de la PDA o pistola directamente al código de barras <strong className="text-white">EMPWIFIZ40</strong> en la pantalla.
              </li>
              <li>
                La PDA emitirá un pitido de confirmación y quedará vinculada por Wi-Fi lista para imprimir albaranes y etiquetas.
              </li>
            </ol>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* FULLSCREEN MODAL FOR MAXIMUM SCANNING DISTANCE (1 - 3 METERS) */}
      {/* ========================================================================= */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          
          {/* Top Modal Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center font-mono">
                {activeNumber}
              </div>
              <div>
                <span className="text-xs uppercase font-mono font-bold text-amber-400 block">
                  Lectura a Distancia PDA
                </span>
                <h4 className="text-lg sm:text-xl font-black text-white font-mono">
                  EMPWIFIZ{activeNumber}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Cerrar pantalla completa"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Giant Crisp White Barcode Card */}
          <div className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-12 shadow-2xl border-4 border-slate-300 flex flex-col items-center justify-center">
            <svg
              ref={fullscreenSvgRef}
              className="w-full max-w-full h-auto object-contain block mx-auto select-none"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleCopyCode}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Código Copiado' : 'Copiar EMPWIFIZ' + activeNumber}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(false)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              Volver
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
