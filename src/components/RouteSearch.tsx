import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Search, 
  X, 
  Hash, 
  Keyboard, 
  Sparkles, 
  CornerDownLeft, 
  Layers, 
  MapPin, 
  ChevronRight, 
  Check, 
  FilterX, 
  ArrowUpDown,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { RouteItem } from '../types/logistics';
import { playScannerBeep } from '../services/barcodeService';

interface RouteSearchProps {
  routes: RouteItem[];
  selectedRoute: RouteItem | null;
  onSelectRoute: (route: RouteItem) => void;
  recentRoutes: RouteItem[];
  selectedArea?: string | null;
  onSelectArea?: (area: string | null) => void;
}

export const RouteSearch: React.FC<RouteSearchProps> = ({
  routes,
  selectedRoute,
  onSelectRoute,
  recentRoutes,
  selectedArea: controlledArea,
  onSelectArea: controlledOnSelectArea,
}) => {
  const [internalArea, setInternalArea] = useState<string | null>(null);
  const selectedArea = controlledArea !== undefined ? controlledArea : internalArea;
  const setSelectedArea = (area: string | null) => {
    if (controlledOnSelectArea) {
      controlledOnSelectArea(area);
    } else {
      setInternalArea(area);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera Barcode Scanning stream lifecycle
  useEffect(() => {
    if (!isCameraOpen) return;
    setCameraError(null);
    let activeStream: MediaStream | null = null;
    let scanInterval: any = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        .then((stream) => {
          activeStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }

          if ('BarcodeDetector' in window) {
            try {
              const detector = new (window as any).BarcodeDetector({
                formats: ['code_128', 'code_39', 'qr_code', 'ean_13', 'upc_a'],
              });

              scanInterval = setInterval(async () => {
                if (!videoRef.current || videoRef.current.readyState < 2) return;
                try {
                  const barcodes = await detector.detect(videoRef.current);
                  if (barcodes && barcodes.length > 0) {
                    const scanned = barcodes[0].rawValue.trim();
                    const matched = routes.find(
                      (r) =>
                        r.codigo === scanned ||
                        r.ruta.toLowerCase() === scanned.toLowerCase() ||
                        scanned.includes(r.ruta)
                    );
                    if (matched) {
                      handleSelect(matched);
                      setIsCameraOpen(false);
                    }
                  }
                } catch {
                  // continuous frame capture
                }
              }, 300);
            } catch {
              // fallback
            }
          }
        })
        .catch((err) => {
          console.warn('Camera access denied:', err);
          setCameraError('No se pudo acceder a la cámara del dispositivo. Permite el permiso o introduce el número manualmente.');
        });
    } else {
      setCameraError('Cámara no compatible en este navegador.');
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOpen, routes]);

  // Extract unique areas / zones from routes
  const areas = useMemo(() => {
    const map = new Map<string, number>();
    routes.forEach((r) => {
      const z = r.zona || 'Sin Zona';
      map.set(z, (map.get(z) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [routes]);

  // Routes filtered by selected area (for recommendations)
  const recommendedRoutes = useMemo(() => {
    if (!selectedArea) return [];
    return routes.filter((r) => r.zona === selectedArea);
  }, [routes, selectedArea]);

  // Search filter: searches across all routes or prioritizes selected area
  const query = searchTerm.trim().toLowerCase();
  const filteredRoutes = useMemo(() => {
    if (!query) return [];

    const matches = routes.filter((r) => {
      return (
        r.ruta.toLowerCase().includes(query) ||
        r.codigo.toLowerCase().includes(query) ||
        r.texto.toLowerCase().includes(query) ||
        r.zona.toLowerCase().includes(query) ||
        r.muelleNombre.toLowerCase().includes(query)
      );
    });

    // If an area is selected, sort routes in that area to the top, but DO NOT hide other routes
    if (selectedArea) {
      return matches.sort((a, b) => {
        const aInArea = a.zona === selectedArea ? 1 : 0;
        const bInArea = b.zona === selectedArea ? 1 : 0;
        return bInArea - aInArea;
      }).slice(0, 8);
    }

    return matches.slice(0, 8);
  }, [routes, query, selectedArea]);

  const handleSelect = (route: RouteItem) => {
    onSelectRoute(route);
    setSearchTerm(route.ruta);
    setIsDropdownOpen(false);
    playScannerBeep('success');
  };

  const handleKeypadPress = (val: string) => {
    playScannerBeep('click');
    if (val === 'ENTER') {
      const exact = routes.find(
        (r) => r.ruta.toLowerCase() === searchTerm.toLowerCase() || r.codigo === searchTerm
      );
      if (exact) {
        handleSelect(exact);
      } else if (filteredRoutes.length > 0) {
        handleSelect(filteredRoutes[0]);
      } else {
        playScannerBeep('alert');
      }
    } else if (val === 'BACKSPACE') {
      setSearchTerm((prev) => prev.slice(0, -1));
      setIsDropdownOpen(true);
    } else if (val === 'CLEAR') {
      setSearchTerm('');
      setIsDropdownOpen(false);
    } else {
      const nextTerm = searchTerm + val;
      setSearchTerm(nextTerm);
      setIsDropdownOpen(true);
      const exact = routes.find((r) => r.ruta.toLowerCase() === nextTerm.toLowerCase());
      if (exact) {
        handleSelect(exact);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredRoutes.length > 0) {
        handleSelect(filteredRoutes[0]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl backdrop-blur-sm space-y-4">
      
      {/* ============================================================ */}
      {/* 1. SELECTOR POR ZONA / ÁREA (OPCIONAL - ARRIBA) */}
      {/* ============================================================ */}
      <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span>Zona / Área Logística</span>
              <span className="text-[10px] font-medium text-slate-400 lowercase font-mono">
                (opcional, según columna de Excel)
              </span>
            </label>
          </div>

          {selectedArea && (
            <button
              onClick={() => setSelectedArea(null)}
              className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition"
              title="Quitar filtro de área"
            >
              <FilterX className="w-3 h-3" />
              <span>Ver todas las áreas</span>
            </button>
          )}
        </div>

        {/* Quick Horizontal Area Chips / Dropdown */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700 flex-nowrap">
          <button
            onClick={() => setSelectedArea(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 shrink-0 ${
              !selectedArea
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white'
            }`}
          >
            <span>Todas las Áreas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${!selectedArea ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
              {routes.length}
            </span>
          </button>

          {areas.map((area) => {
            const isSelected = selectedArea === area.name;
            return (
              <button
                key={area.name}
                onClick={() => setSelectedArea(isSelected ? null : area.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white'
                }`}
              >
                <span>{area.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {area.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* RECOMENDACIONES DE RUTAS DEL ÁREA SELECCIONADA */}
        {selectedArea && recommendedRoutes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Rutas recomendadas en {selectedArea} ({recommendedRoutes.length}):
              </span>
              <span className="text-[10px] text-slate-400">Haz clic para cargar código y muelle</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {recommendedRoutes.map((r) => {
                const isCurrent = selectedRoute?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className={`p-2 rounded-lg text-left transition border flex flex-col justify-between group ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 border-white ring-2 ring-amber-400/50 shadow-md'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700/70 hover:border-amber-400/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`font-mono font-black text-xs px-1.5 py-0.5 rounded ${
                        isCurrent ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950'
                      }`}>
                        {r.ruta}
                      </span>
                      {r.muelleNombre ? (
                        <span className={`text-[10px] font-mono px-1 rounded ${
                          isCurrent ? 'bg-slate-900/80 text-white font-bold' : 'text-blue-300 bg-blue-950/60'
                        }`}>
                          {r.muelleNombre.replace(/ \(.+\)/, '')}
                        </span>
                      ) : null}
                    </div>
                    <div className={`text-[11px] font-semibold truncate ${
                      isCurrent ? 'text-slate-950' : 'text-slate-200 group-hover:text-amber-300'
                    }`}>
                      {r.texto.replace(new RegExp(`^${r.ruta}\\s*`), '') || r.texto}
                    </div>
                    <div className={`text-[9px] font-mono mt-0.5 ${
                      isCurrent ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      Cód: {r.codigo}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. ENTRADA DIRECTA POR NÚMERO DE RUTA O CÓDIGO */}
      {/* ============================================================ */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Hash className="w-4 h-4 text-amber-400" />
            <span>Número de Ruta / Código de Bulto</span>
            {selectedArea ? (
              <span className="text-[11px] font-normal text-slate-400">
                (filtrando en <span className="text-amber-300 font-semibold">{selectedArea}</span> o escribe cualquiera)
              </span>
            ) : (
              <span className="text-[11px] font-normal text-slate-400">
                (búsqueda directa global)
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeypad(!showKeypad)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                showKeypad
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>{showKeypad ? 'Ocultar Teclado' : 'Teclado Táctil'}</span>
            </button>
          </div>
        </div>

        {/* Main Big Input */}
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-slate-400">
              <Search className="w-6 h-6 text-amber-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => {
                if (searchTerm.trim()) setIsDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedArea
                  ? `Introduce nº de ruta de ${selectedArea} o cualquier otra (ej. 55043, R0810)...`
                  : 'Introduce nº de ruta directamente (ej. 55043, 55211, R0810, C0830)...'
              }
              className="w-full pl-13 pr-24 py-3.5 bg-slate-950/80 border-2 border-slate-700 focus:border-amber-400 focus:outline-none rounded-xl text-lg sm:text-xl font-mono font-bold text-white placeholder-slate-500 shadow-inner tracking-wide transition"
            />
            {/* Camera Scan Action Button & Clear */}
            <div className="absolute right-3 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setIsDropdownOpen(false);
                    inputRef.current?.focus();
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                title="Escanear código con la cámara del móvil"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 transition shadow-sm font-semibold text-xs cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Cámara</span>
              </button>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && query && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-72 overflow-y-auto divide-y divide-slate-800">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => {
                  const isInSelectedArea = selectedArea && route.zona === selectedArea;
                  return (
                    <button
                      key={route.id}
                      onClick={() => handleSelect(route)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-800/90 flex items-center justify-between gap-4 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-sm border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                          {route.ruta}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition flex items-center gap-2">
                            <span>{route.texto}</span>
                            {isInSelectedArea && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                Área seleccionada
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            Cód: {route.codigo} • {route.zona}
                          </p>
                        </div>
                      </div>
                      {route.muelleNombre && (
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-800">
                            {route.muelleNombre}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-5 text-center text-sm text-slate-400">
                  No se encontró ninguna ruta con el término "<span className="text-white font-mono">{searchTerm}</span>"
                </div>
              )}
            </div>
          )}
        </div>

        {/* On-Screen Touch Keypad for Warehouse Operators */}
        {showKeypad && (
          <div className="mt-3 p-3 bg-slate-950/90 rounded-xl border border-slate-800 grid grid-cols-4 sm:grid-cols-6 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'R', 'C', '55043', '55211', 'R0810', 'C0830'].map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className="py-3 px-2 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-mono font-bold text-base border border-slate-700 shadow active:scale-95 transition"
                >
                  {key}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => handleKeypadPress('BACKSPACE')}
              className="py-3 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-200 font-mono font-semibold text-xs border border-rose-800 shadow active:scale-95 transition"
            >
              ← Borrar
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('CLEAR')}
              className="py-3 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-semibold text-xs border border-slate-700 shadow active:scale-95 transition"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('ENTER')}
              className="col-span-2 py-3 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm border border-amber-400 shadow-md flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <CornerDownLeft className="w-4 h-4" />
              <span>Buscar / Cargar</span>
            </button>
          </div>
        )}

        {/* Quick Select Chips when NO area is selected */}
        {!selectedArea && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Rutas frecuentes:
            </span>
            {routes.slice(0, 7).map((r) => {
              const isCurrent = selectedRoute?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-medium shrink-0 border transition ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  {r.ruta}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MOBILE CAMERA SCANNER OVERLAY */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-md">
          <div className="w-full max-w-md flex items-center justify-between text-white py-2">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="font-bold text-sm">Escáner de Cámara para Móvil</span>
            </div>
            <button
              onClick={() => setIsCameraOpen(false)}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative w-full max-w-sm aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Guide line */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse pointer-events-none" />
            <div className="absolute inset-8 border-2 border-white/40 rounded-xl pointer-events-none" />

            {cameraError && (
              <div className="absolute inset-4 bg-slate-950/90 rounded-xl p-4 flex flex-col items-center justify-center text-center text-rose-300 text-xs">
                <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
                <p>{cameraError}</p>
              </div>
            )}
          </div>

          <div className="w-full max-w-md text-center py-3">
            <p className="text-xs text-slate-300">
              Apunta con la cámara al código de barras o QR de la caja o albarán para detectarlo al instante.
            </p>
            <button
              onClick={() => setIsCameraOpen(false)}
              className="mt-3 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
            >
              Cerrar Cámara
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
