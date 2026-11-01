import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UbicacionItem } from '../types/logistics';
import { renderBarcodeSvg, playScannerBeep } from '../services/barcodeService';
import { 
  Barcode, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Layers, 
  Search,
  CheckCircle2,
  HelpCircle,
  PackageMinus,
  MapPin,
  Compass,
  ArrowUp,
  X
} from 'lucide-react';

interface DesubicarViewProps {
  ubicaciones: UbicacionItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const DesubicarView: React.FC<DesubicarViewProps> = ({
  ubicaciones,
  onRefresh,
  isRefreshing = false,
}) => {
  // Extract unique areas from ubicaciones list
  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    ubicaciones.forEach((u) => {
      if (u.area) set.add(u.area.trim());
    });
    return Array.from(set);
  }, [ubicaciones]);

  // Selected area state (default to first area)
  const [selectedArea, setSelectedArea] = useState<string>(() => {
    return uniqueAreas.length > 0 ? uniqueAreas[0] : '';
  });

  // Ensure selectedArea is valid when uniqueAreas change
  useEffect(() => {
    if (uniqueAreas.length > 0 && (!selectedArea || !uniqueAreas.includes(selectedArea))) {
      setSelectedArea(uniqueAreas[0]);
    }
  }, [uniqueAreas, selectedArea]);

  // Ubicaciones filtered by current area
  const locationsInCurrentArea = useMemo(() => {
    if (!selectedArea) return [];
    return ubicaciones.filter((u) => u.area.trim() === selectedArea);
  }, [ubicaciones, selectedArea]);

  // Search filter inside current area
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locationsInCurrentArea;
    const query = searchQuery.trim().toLowerCase();
    return locationsInCurrentArea.filter((u) => 
      u.codigo.toLowerCase().includes(query)
    );
  }, [locationsInCurrentArea, searchQuery]);

  // Selected location item
  const [selectedUbicacionId, setSelectedUbicacionId] = useState<string>(() => {
    return locationsInCurrentArea.length > 0 ? locationsInCurrentArea[0].id : '';
  });

  // Keep selected location in sync when area changes
  useEffect(() => {
    if (locationsInCurrentArea.length > 0) {
      const exists = locationsInCurrentArea.some((u) => u.id === selectedUbicacionId);
      if (!exists) {
        setSelectedUbicacionId(locationsInCurrentArea[0].id);
      }
    }
  }, [locationsInCurrentArea, selectedUbicacionId]);

  const currentUbicacion = useMemo(() => {
    return ubicaciones.find((u) => u.id === selectedUbicacionId) ||
           locationsInCurrentArea[0] ||
           ubicaciones[0] ||
           null;
  }, [ubicaciones, selectedUbicacionId, locationsInCurrentArea]);

  // Barcode SVG references
  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const fullscreenBarcodeSvgRef = useRef<SVGSVGElement>(null);
  const barcodeCardRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Render barcode whenever current location changes
  useEffect(() => {
    if (!currentUbicacion || !currentUbicacion.codigo) return;

    // Render normal card barcode
    if (barcodeSvgRef.current) {
      renderBarcodeSvg(barcodeSvgRef.current, currentUbicacion.codigo, {
        height: 100,
        width: 2.6,
        fontSize: 18,
        displayValue: true,
      });
    }

    // Render fullscreen barcode if open
    if (isFullscreen && fullscreenBarcodeSvgRef.current) {
      renderBarcodeSvg(fullscreenBarcodeSvgRef.current, currentUbicacion.codigo, {
        height: 140,
        width: 3.2,
        fontSize: 22,
        displayValue: true,
      });
    }
  }, [currentUbicacion, isFullscreen]);

  const handleSelectArea = (area: string) => {
    setSelectedArea(area);
    setSearchQuery('');
    playScannerBeep('click');
    const firstInArea = ubicaciones.find((u) => u.area.trim() === area);
    if (firstInArea) {
      setSelectedUbicacionId(firstInArea.id);
    }
  };

  const handleSelectLocation = (ubicacion: UbicacionItem) => {
    setSelectedUbicacionId(ubicacion.id);
    playScannerBeep('click');
    if (navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {
        // ignore
      }
    }
  };

  const handleSelectLocationAndScrollUp = (ubicacion: UbicacionItem) => {
    handleSelectLocation(ubicacion);
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

  // Distinct styling palettes for area pills
  const getAreaTheme = (areaName: string, isSelected: boolean) => {
    const areaLower = areaName.toLowerCase();
    if (areaLower.includes('auto') || areaLower.includes('salautos')) {
      return {
        pill: isSelected
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400 font-black'
          : 'bg-slate-900 text-slate-300 hover:text-white border border-emerald-500/30 hover:bg-slate-800',
        badge: isSelected ? 'bg-emerald-700/80 text-white' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800',
        dot: 'bg-emerald-400',
      };
    }
    if (areaLower.includes('118')) {
      return {
        pill: isSelected
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400 font-black'
          : 'bg-slate-900 text-slate-300 hover:text-white border border-blue-500/30 hover:bg-slate-800',
        badge: isSelected ? 'bg-blue-700/80 text-white' : 'bg-blue-950/80 text-blue-400 border border-blue-800',
        dot: 'bg-blue-400',
      };
    }
    if (areaLower.includes('123')) {
      return {
        pill: isSelected
          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400 font-black'
          : 'bg-slate-900 text-slate-300 hover:text-white border border-amber-500/30 hover:bg-slate-800',
        badge: isSelected ? 'bg-amber-700/80 text-white' : 'bg-amber-950/80 text-amber-400 border border-amber-800',
        dot: 'bg-amber-400',
      };
    }
    if (areaLower.includes('127')) {
      return {
        pill: isSelected
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400 font-black'
          : 'bg-slate-900 text-slate-300 hover:text-white border border-purple-500/30 hover:bg-slate-800',
        badge: isSelected ? 'bg-purple-700/80 text-white' : 'bg-purple-950/80 text-purple-400 border border-purple-800',
        dot: 'bg-purple-400',
      };
    }
    return {
      pill: isSelected
        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-2 ring-sky-400 font-black'
        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800',
      badge: isSelected ? 'bg-sky-700/80 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700',
      dot: 'bg-sky-400',
    };
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
            <PackageMinus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Módulo Desubicar
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase tracking-wider">
                Códigos de Barras
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Selecciona el área y pulsa la ubicación para ver su código de barras listo para escanear
            </p>
          </div>
        </div>

        {/* Global info & Audio */}
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
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{ubicaciones.length} ubicaciones</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SELECTOR DE ÁREAS (Columna 2 del Excel) */}
      {/* "En esa pestaña quiero un selector de areas..." */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3.5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Selecciona el Área de Almacén:
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {uniqueAreas.length} áreas disponibles
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {uniqueAreas.map((area) => {
            const isSelected = area === selectedArea;
            const theme = getAreaTheme(area, isSelected);
            const countInArea = ubicaciones.filter((u) => u.area.trim() === area).length;

            return (
              <button
                key={`area-pill-${area}`}
                onClick={() => handleSelectArea(area)}
                className={`p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-1.5 border text-left ${theme.pill}`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-sm sm:text-base font-black font-mono tracking-tight truncate">
                    {area}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                </div>
                <div className="flex items-center justify-between text-xs opacity-90 mt-0.5">
                  <span className="text-[11px] truncate">Ubicaciones:</span>
                  <span className={`px-2 py-0.2 rounded-md font-mono text-[11px] font-black ${theme.badge}`}>
                    {countInArea}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CÓDIGO DE BARRAS DE LA UBICACIÓN SELECCIONADA */}
      {/* "...para seleccionar la ubicacion que se quiere ver el codigo de barras" */}
      {/* ========================================================================= */}
      <div 
        ref={barcodeCardRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

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
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-slate-800 text-amber-400 border border-slate-700">
                  Área: {currentUbicacion.area}
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
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm font-mono shrink-0 shadow-lg shadow-amber-500/20">
              UB
            </div>
            <div>
              <div className="text-xs text-slate-400">
                Ubicación para orden de desubicación:
              </div>
              <div className="text-base font-black font-mono text-white">
                {currentUbicacion?.codigo}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-slate-400">Área:</span>
            <span className="px-3 py-1 rounded-xl bg-blue-600/30 text-blue-300 font-bold font-mono text-xs border border-blue-500/40">
              {currentUbicacion?.area}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTONES PARA SELECCIONAR LA UBICACIÓN */}
      {/* "...y una vez elegido el area poner botones para seleccionar la ubicacion..." */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        
        {/* Section Header with Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                2. Ubicaciones del Área <span className="text-amber-400 font-mono">{selectedArea}</span>:
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pulsa cualquier botón para generar su código de barras arriba
            </p>
          </div>

          {/* Search filter within area */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filtrar en ${selectedArea}...`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Locations Grid Buttons */}
        {filteredLocations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {filteredLocations.map((ubicacion, index) => {
              const isSelected = ubicacion.id === selectedUbicacionId;

              return (
                <button
                  key={ubicacion.id}
                  onClick={() => handleSelectLocationAndScrollUp(ubicacion)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer font-mono text-center flex flex-col items-center justify-center gap-1 border active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black ring-4 ring-amber-400/40 shadow-xl scale-[1.03]'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700 shadow'
                  }`}
                  title={`Seleccionar ubicación ${ubicacion.codigo}`}
                >
                  <span className="text-xs sm:text-sm font-black tracking-tight whitespace-nowrap">
                    {ubicacion.codigo}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isSelected ? 'bg-slate-950/25 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}>
                      #{index + 1}
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
        ) : (
          <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
            No se encontraron ubicaciones que coincidan con «{searchQuery}» en el área {selectedArea}.
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4. GUÍA RÁPIDA DE OPERACIÓN */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-5 text-xs text-slate-400 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Guía de Uso del Módulo Desubicar</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">1</span>
              <span>Elige el Área</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Toca el botón correspondiente a la zona donde te encuentras (118E00, 123F00, AUTOSTORE, 127F00).
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">2</span>
              <span>Pulsa la Ubicación</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Selecciona el código específico del estante, carril o jaula a desubicar.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">3</span>
              <span>Escanea con PDA</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Apunta la pistola lectora de código de barras a la pantalla para registrar la desubicación.
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
                  Modo Escáner Gigante · Desubicar
                </span>
                <h3 className="text-lg font-black text-white font-mono truncate">
                  {currentUbicacion?.codigo} · Área: {currentUbicacion?.area}
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
