import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EntreplantaItem } from '../types/logistics';
import { renderBarcodeSvg, playScannerBeep } from '../services/barcodeService';
import { 
  Barcode, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Layers, 
  CheckCircle2, 
  HelpCircle, 
  Building2, 
  ArrowUpDown, 
  Boxes, 
  Package, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface EntreplantaViewProps {
  entreplanta: EntreplantaItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const EntreplantaView: React.FC<EntreplantaViewProps> = ({
  entreplanta,
  onRefresh,
  isRefreshing = false,
}) => {
  // Extract distinct areas present in the data (defaulting to Reposición and Ascensor)
  const areas = useMemo(() => {
    const list = Array.from(new Set(entreplanta.map((item) => item.area.trim())));
    // Ensure Reposición and Ascensor order if present
    const preferred = ['Reposición', 'Ascensor'];
    const sorted = preferred.filter((p) => list.some((a) => a.toLowerCase() === p.toLowerCase()));
    list.forEach((a) => {
      if (!sorted.some((s) => s.toLowerCase() === a.toLowerCase())) {
        sorted.push(a);
      }
    });
    return sorted.length > 0 ? sorted : ['Reposición', 'Ascensor'];
  }, [entreplanta]);

  // Selected area state (default to first area, typically Reposición)
  const [selectedArea, setSelectedArea] = useState<string>(() => {
    return areas.length > 0 ? areas[0] : 'Reposición';
  });

  // Keep selectedArea valid if areas change
  useEffect(() => {
    if (areas.length > 0 && !areas.includes(selectedArea)) {
      setSelectedArea(areas[0]);
    }
  }, [areas, selectedArea]);

  // Locations filtered by currently selected area
  const locationsInCurrentArea = useMemo(() => {
    return entreplanta.filter(
      (item) => item.area.trim().toLowerCase() === selectedArea.trim().toLowerCase()
    );
  }, [entreplanta, selectedArea]);

  // Currently selected location item
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    return locationsInCurrentArea.length > 0 ? locationsInCurrentArea[0].id : '';
  });

  // When area changes, automatically select the first location in the new area
  useEffect(() => {
    if (locationsInCurrentArea.length > 0) {
      const exists = locationsInCurrentArea.some((l) => l.id === selectedLocationId);
      if (!exists) {
        setSelectedLocationId(locationsInCurrentArea[0].id);
      }
    }
  }, [locationsInCurrentArea, selectedLocationId]);

  const currentUbicacion = useMemo(() => {
    return entreplanta.find((l) => l.id === selectedLocationId) ||
           locationsInCurrentArea[0] ||
           entreplanta[0] ||
           null;
  }, [entreplanta, selectedLocationId, locationsInCurrentArea]);

  // SVG references for barcodes
  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const fullscreenBarcodeSvgRef = useRef<SVGSVGElement>(null);
  const barcodeCardRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Render barcode whenever active location changes or fullscreen is toggled
  useEffect(() => {
    if (!currentUbicacion || !currentUbicacion.codigo) return;

    // Normal barcode
    if (barcodeSvgRef.current) {
      renderBarcodeSvg(barcodeSvgRef.current, currentUbicacion.codigo, {
        height: 100,
        width: 2.8,
        fontSize: 18,
        displayValue: true,
      });
    }

    // Fullscreen barcode
    if (isFullscreen && fullscreenBarcodeSvgRef.current) {
      renderBarcodeSvg(fullscreenBarcodeSvgRef.current, currentUbicacion.codigo, {
        height: 140,
        width: 3.4,
        fontSize: 22,
        displayValue: true,
      });
    }
  }, [currentUbicacion, isFullscreen]);

  const handleSelectArea = (area: string) => {
    setSelectedArea(area);
    playScannerBeep('click');
    const firstInArea = entreplanta.find(
      (item) => item.area.trim().toLowerCase() === area.trim().toLowerCase()
    );
    if (firstInArea) {
      setSelectedLocationId(firstInArea.id);
    }
  };

  const handleSelectLocation = (item: EntreplantaItem) => {
    setSelectedLocationId(item.id);
    playScannerBeep('click');
    if (navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {
        // ignore
      }
    }
    if (barcodeCardRef.current) {
      barcodeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleCopyCode = () => {
    if (!currentUbicacion) return;
    navigator.clipboard.writeText(currentUbicacion.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Entreplanta
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                Reposición & Ascensor
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Códigos de barras de ubicaciones para tareas en planta intermedia
            </p>
          </div>
        </div>

        {/* Controls: Audio beep toggle & total counter */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
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
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{entreplanta.length} ubicaciones</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SELECTOR PARA ELEGIR ENTRE 'REPOSICIÓN' Y 'ASCENSOR' */}
      {/* "Esta sección debe mostrar un selector para elegir entre 'Reposición' y 'Ascensor'..." */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Selecciona el Tipo de Operación:
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {areas.length} zonas en Entreplanta
          </span>
        </div>

        {/* Big Dual / Multi Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {areas.map((area) => {
            const isSelected = area.toLowerCase() === selectedArea.toLowerCase();
            const count = entreplanta.filter(
              (item) => item.area.trim().toLowerCase() === area.trim().toLowerCase()
            ).length;
            const isAscensor = area.toLowerCase().includes('ascensor');

            return (
              <button
                key={`entreplanta-area-${area}`}
                onClick={() => handleSelectArea(area)}
                className={`p-4 sm:p-5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4 border text-left ${
                  isSelected
                    ? isAscensor
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/25 ring-2 ring-blue-400 font-black scale-[1.02]'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-600/25 ring-2 ring-emerald-400 font-black scale-[1.02]'
                    : 'bg-slate-950/80 hover:bg-slate-850 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isAscensor
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isAscensor ? <ArrowUpDown className="w-6 h-6" /> : <Boxes className="w-6 h-6" />}
                  </div>

                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-black tracking-tight truncate">
                      {area}
                    </div>
                    <div className="text-xs opacity-85 mt-0.5 truncate">
                      {isAscensor
                        ? 'Ubicaciones de subida y bajada (S1_1, S1_2...)'
                        : 'Estanterías y carril de reposición (E1_1, E1_2...)'}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black block ${
                    isSelected
                      ? 'bg-black/30 text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {count} {count === 1 ? 'ubicación' : 'ubicaciones'}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white mt-1 block">
                      Seleccionado
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CÓDIGO DE BARRAS DE LA UBICACIÓN SELECCIONADA (TAL COMO EN DESUBICAR) */}
      {/* "Al seleccionar una ubicación, debe mostrarse el código de barras correspondiente tal como en la vista de Desubicar." */}
      {/* ========================================================================= */}
      <div 
        ref={barcodeCardRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono block">
              Código de Barras Activo (Listo para Pistola / PDA):
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {currentUbicacion ? currentUbicacion.codigo : 'Sin selección'}
              </h3>
              {currentUbicacion && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-slate-800 text-indigo-300 border border-slate-700">
                  {currentUbicacion.area}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
              title="Copiar código al portapapeles"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
              title="Ampliar código de barras a pantalla completa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pantalla Completa</span>
            </button>
          </div>
        </div>

        {/* Big Code 128 Barcode Display Card */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-lg p-5 sm:p-6 bg-white rounded-3xl shadow-2xl border-4 border-slate-200 flex flex-col items-center justify-center transition-transform hover:scale-[1.01]">
            <svg 
              ref={barcodeSvgRef} 
              className="w-full max-w-full h-auto object-contain block mx-auto select-none" 
            />
          </div>
        </div>

        {/* Location Specs Footer */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white font-black flex items-center justify-center text-sm font-mono shrink-0 shadow-lg shadow-indigo-500/20">
              ENT
            </div>
            <div>
              <div className="text-xs text-slate-400">
                Ubicación seleccionada en Entreplanta:
              </div>
              <div className="text-base font-black font-mono text-white">
                {currentUbicacion?.codigo}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-slate-400">Zona:</span>
            <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold font-mono text-xs border border-indigo-500/40">
              {currentUbicacion?.area}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTONES PARA SELECCIONAR LA UBICACIÓN EN 'REPOSICIÓN' O 'ASCENSOR' */}
      {/* "...utilizando los datos de la pestaña 'Entreplanta' para listar las ubicaciones (código y área)..." */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                2. Ubicaciones disponibles en <span className="text-amber-400 font-mono">{selectedArea}</span>:
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Toca cualquier ubicación para generar de inmediato su código de barras arriba
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            {locationsInCurrentArea.length} disponibles
          </span>
        </div>

        {/* Location Grid Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {locationsInCurrentArea.map((item, index) => {
            const isSelected = item.id === selectedLocationId;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectLocation(item)}
                className={`p-4 rounded-2xl transition-all cursor-pointer font-mono text-center flex flex-col items-center justify-center gap-1.5 border active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black ring-4 ring-amber-400/40 shadow-xl scale-[1.03]'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700 shadow'
                }`}
                title={`Seleccionar ubicación ${item.codigo} (${item.area})`}
              >
                <span className="text-base sm:text-lg font-black tracking-tight whitespace-nowrap">
                  {item.codigo}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-slate-950/25 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {item.area}
                  </span>
                  {isSelected && (
                    <span className="text-[9px] uppercase tracking-wider font-black text-slate-950">
                      ACTIVO
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. GUÍA RÁPIDA DE OPERACIÓN */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-5 text-xs text-slate-400 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Guía de Operación en Entreplanta</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">1</span>
              <span>Elige Tipo</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Selecciona entre <strong>Reposición</strong> (pasillos E1 y E2) o <strong>Ascensor</strong> (plataformas S1).
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">2</span>
              <span>Pulsa la Ubicación</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Haz clic en el código de la posición exacta donde vas a depositar o recoger el material.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">3</span>
              <span>Lectura con Pistola</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Apunta el lector láser o la PDA a la pantalla para registrar el movimiento en el sistema.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FULLSCREEN BARCODE MODAL FOR DISTANT SCANNING */}
      {/* ============================================================== */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <div 
            className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="text-left">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Modo Escáner Gigante · Entreplanta
                </span>
                <h3 className="text-lg font-black text-white font-mono truncate">
                  {currentUbicacion?.codigo} · {currentUbicacion?.area}
                </h3>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            {/* Giant Barcode SVG */}
            <div className="w-full p-6 bg-white rounded-2xl shadow-2xl border-4 border-slate-200 flex items-center justify-center">
              <svg
                ref={fullscreenBarcodeSvgRef}
                className="w-full max-w-full h-auto object-contain block mx-auto select-none"
              />
            </div>

            <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold font-mono">
                Código Ubicación:
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 px-4 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30">
                {currentUbicacion?.codigo}
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
