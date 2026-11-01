import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { RouteItem } from '../types/logistics';
import { 
  ENHANCED_WAREHOUSE_MAP_IMAGE, 
  REAL_WAREHOUSE_ZONES, 
  WarehouseZoneArea 
} from '../data/warehouseMapData';
import { playScannerBeep } from '../services/barcodeService';
import { MapConfig } from '../types/logistics';

interface DockMapProps {
  selectedRoute: RouteItem | null;
  allRoutes: RouteItem[];
  onSelectRoute: (route: RouteItem) => void;
  onUpdateRouteDock?: (routeId: string, dockId: string, dockName: string, bay: string) => void;
  zones?: WarehouseZoneArea[];
  mapConfig?: MapConfig;
}

export const DockMap: React.FC<DockMapProps> = ({
  selectedRoute,
  allRoutes,
  onSelectRoute,
  onUpdateRouteDock,
  zones,
}) => {
  const activeZones = zones && zones.length > 0 ? zones : REAL_WAREHOUSE_ZONES;

  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [wallFilter, setWallFilter] = useState<'all' | 'right' | 'bottom' | 'left'>('all');

  // Detect which zone corresponds to the selected route
  const currentRouteZoneArea = useMemo(() => {
    if (!selectedRoute) return null;
    return activeZones.find((z) => z.code === selectedRoute.muelleId) ||
           activeZones.find((z) => selectedRoute.zona?.includes(z.code)) ||
           activeZones.find((z) => z.code === '127E00') ||
           activeZones[0];
  }, [selectedRoute, activeZones]);

  // Sync activeZoneId when selected route changes
  React.useEffect(() => {
    if (currentRouteZoneArea) {
      setActiveZoneId(currentRouteZoneArea.id);
    }
  }, [currentRouteZoneArea?.id]);

  const focusedZone = useMemo(() => {
    if (activeZoneId) {
      return activeZones.find((z) => z.id === activeZoneId) || null;
    }
    return currentRouteZoneArea || activeZones.find((z) => z.code === '127E00') || activeZones[0] || null;
  }, [activeZoneId, currentRouteZoneArea, activeZones]);

  // Routes in this focused zone
  const routesInFocusedZone = useMemo(() => {
    if (!focusedZone) return [];
    return allRoutes.filter((r) => {
      return r.muelleId === focusedZone.code || (r.zona && r.zona.includes(focusedZone.code));
    });
  }, [allRoutes, focusedZone]);

  const handleZoneClick = (zone: WarehouseZoneArea) => {
    setActiveZoneId(zone.id);
    playScannerBeep('click');
  };

  const handleAssignCurrentRouteToZone = (zone: WarehouseZoneArea) => {
    if (!selectedRoute || !onUpdateRouteDock) return;
    onUpdateRouteDock(
      selectedRoute.id,
      zone.code,
      zone.dockLabel,
      `Sector ${zone.code}`
    );
    setActiveZoneId(zone.id);
    playScannerBeep('success');
  };

  const filteredZones = useMemo(() => {
    return activeZones.filter((z) => {
      if (wallFilter === 'all') return true;
      return z.wall === wallFilter;
    });
  }, [wallFilter, activeZones]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* Top Header Banner - Clean Single View: Plan Render HD Vertical */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border-b border-blue-500/30 p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Plano Render HD
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Vertical · Orientación Exacta
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Zona 40 (izq.) · Zonas 74 a 82 (abajo, &rarr; der.) · Muelles 091 a 145 (derecha, 145 arriba &rarr; 091 abajo)
            </p>
          </div>
        </div>

        {/* Selected Route Badge indicator */}
        {selectedRoute && currentRouteZoneArea && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 px-3 py-1.5 rounded-xl self-start md:self-center">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <div className="text-xs">
              <span className="text-amber-400 font-bold font-mono">Ruta {selectedRoute.ruta}: </span>
              <span className="text-white font-bold">Muelle {currentRouteZoneArea.code}</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar: Wall Filters & Zoom */}
      <div className="px-3 sm:px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        
        {/* Wall Filter Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold mr-1 hidden sm:inline">
            Sector:
          </span>
          <button
            onClick={() => setWallFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              wallFilter === 'all' 
                ? 'bg-blue-600 text-white font-bold shadow' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({activeZones.length})
          </button>
          <button
            onClick={() => setWallFilter('right')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              wallFilter === 'right' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Derecha (145 &darr; 091)
          </button>
          <button
            onClick={() => setWallFilter('bottom')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              wallFilter === 'bottom' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Abajo (74 &rarr; 82)
          </button>
          <button
            onClick={() => setWallFilter('left')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              wallFilter === 'left' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Izquierda (Zona 40)
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setZoomLevel((prev) => Math.max(0.8, Number((prev - 0.2).toFixed(1))))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition"
            title="Alejar"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-amber-400 px-1 font-bold min-w-[42px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((prev) => Math.min(2.5, Number((prev + 0.2).toFixed(1))))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition"
            title="Acercar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-[11px] font-mono"
            title="Restablecer escala al 100%"
          >
            100%
          </button>
        </div>

      </div>

      {/* Main Interactive Map Canvas in Vertical Format */}
      <div className="relative w-full bg-slate-950 overflow-auto min-h-[580px] sm:min-h-[720px] flex items-center justify-center p-3 select-none">
        
        {/* Scalable Container - Vertical Portrait Aspect Ratio (768 / 1376) */}
        <div 
          className="relative transition-transform duration-200 origin-top max-w-md sm:max-w-lg md:max-w-xl w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-900"
          style={{
            transform: `scale(${zoomLevel})`,
            aspectRatio: '768 / 1376',
          }}
        >
          {/* PLAN RENDER HD VERTICAL IMAGE */}
          <img
            src={ENHANCED_WAREHOUSE_MAP_IMAGE}
            alt="Plano Render HD Vertical de Nave Logística"
            className="w-full h-full object-cover block select-none pointer-events-none"
          />

          {/* DYNAMIC TARGET GLOW RING on the focused dock */}
          {focusedZone && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              <circle
                cx={`${focusedZone.x}%`}
                cy={`${focusedZone.y}%`}
                r="24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-[spin_7s_linear_infinite]"
              />
            </svg>
          )}

          {/* INTERACTIVE CLICKABLE DOCK PINS WITH STRICTLY HORIZONTAL TEXT */}
          {filteredZones.map((zone) => {
            const isCurrentRouteTarget = currentRouteZoneArea?.id === zone.id;
            const isFocused = focusedZone?.id === zone.id;

            return (
              <div
                key={zone.id}
                onClick={() => handleZoneClick(zone)}
                className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-150 ${
                  isCurrentRouteTarget
                    ? 'scale-110 z-40'
                    : isFocused
                    ? 'scale-105 z-35'
                    : 'hover:scale-105 hover:z-30'
                }`}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                }}
              >
                {/* Glowing Radar Ping if this is the active route target */}
                {isCurrentRouteTarget && (
                  <div className="absolute -inset-2 rounded-lg bg-amber-400/40 animate-ping pointer-events-none" />
                )}

                {/* Framing Box with Horizontal Text Badge */}
                <div
                  className={`w-full h-full rounded-md border flex items-center justify-center transition-all shadow-lg px-1 ${
                    isCurrentRouteTarget
                      ? 'bg-amber-500 border-white text-slate-950 font-black ring-4 ring-amber-400/70 shadow-amber-500/50'
                      : isFocused
                      ? 'bg-blue-600 border-amber-400 text-white font-black ring-2 ring-blue-400'
                      : 'bg-slate-950/85 hover:bg-slate-900 border-amber-400/70 hover:border-amber-300 text-amber-300'
                  }`}
                >
                  {/* Icon & Code strictly horizontal */}
                  <div className="flex items-center justify-center gap-1 w-full text-center">
                    <span className="font-mono text-[10px] sm:text-xs leading-none font-black tracking-tight whitespace-nowrap">
                      {zone.code}
                    </span>
                    {isCurrentRouteTarget && (
                      <span className="text-[8px] bg-slate-950 text-amber-300 px-1 py-0.5 rounded font-black uppercase tracking-wider">
                        AQUÍ
                      </span>
                    )}
                  </div>
                </div>

                {/* Floating Horizontal Tooltip with Dock Details */}
                {(isCurrentRouteTarget || isFocused) && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 bg-slate-950 text-white px-2.5 py-1 rounded-md border border-amber-400 text-[10px] font-bold whitespace-nowrap shadow-2xl flex items-center gap-1.5 pointer-events-none z-50">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>
                      {isCurrentRouteTarget
                        ? `DEPOSITAR AQUÍ: ${zone.code} (${selectedRoute?.ruta || ''})`
                        : `ZONA ${zone.code} - ${zone.dockLabel}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* Bottom Panel: Focused Zone Specs & Route Info */}
      <div className="bg-slate-850 p-4 sm:p-5 border-t border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
          
          {/* Active Area Specs */}
          {focusedZone ? (
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black flex flex-col items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <span className="text-[9px] font-mono leading-none">MUELLE</span>
                <span className="text-sm font-black leading-tight">{focusedZone.code}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">{focusedZone.label}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                    {focusedZone.wall === 'right' ? 'Pared Derecha' : focusedZone.wall === 'bottom' ? 'Pared Inferior' : 'Pared Izquierda'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {focusedZone.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-amber-300 font-mono">
                  <span>{focusedZone.dockLabel}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              Toca cualquier muelle del plano vertical para ver sus detalles.
            </div>
          )}

          {/* Current Route Match Indicator */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Ruta en curso (de tu Excel)
            </span>
            {selectedRoute ? (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">
                      Ruta {selectedRoute.ruta}
                    </span>
                    <span className="text-xs text-slate-300 truncate max-w-[130px]">
                      {selectedRoute.texto}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Zona: <strong className="text-white">{selectedRoute.zona}</strong>
                  </div>
                </div>

                {focusedZone && (
                  <div className="text-right">
                    {currentRouteZoneArea?.id === focusedZone.id ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ubicado</span>
                      </span>
                    ) : (
                      onUpdateRouteDock && (
                        <button
                          onClick={() => handleAssignCurrentRouteToZone(focusedZone)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow cursor-pointer"
                        >
                          Asignar a {focusedZone.code}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Selecciona una ruta para ubicar su muelle en el plano.</p>
            )}
          </div>

          {/* Routes Loaded in this Zone */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Rutas en este muelle ({routesInFocusedZone.length})
              </span>
            </div>
            {routesInFocusedZone.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {routesInFocusedZone.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onSelectRoute(r)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                      selectedRoute?.id === r.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {r.ruta}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Sin rutas asignadas actualmente a este muelle ({focusedZone?.code}).
              </p>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
