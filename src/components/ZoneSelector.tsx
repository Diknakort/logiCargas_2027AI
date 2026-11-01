import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  MapPin, 
  Barcode, 
  Truck, 
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Table,
  LayoutGrid
} from 'lucide-react';
import { RouteItem } from '../types/logistics';
import { playScannerBeep } from '../services/barcodeService';

interface ZoneSelectorProps {
  routes: RouteItem[];
  selectedRoute: RouteItem | null;
  onSelectRoute: (route: RouteItem) => void;
  onNavigateToCode: () => void;
  onNavigateToMap: () => void;
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  routes,
  selectedRoute,
  onSelectRoute,
  onNavigateToCode,
  onNavigateToMap,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Extract unique zones
  const zones = useMemo(() => {
    const set = new Set<string>();
    routes.forEach((r) => {
      if (r.zona) set.add(r.zona);
    });
    return Array.from(set);
  }, [routes]);

  // Filter routes
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const matchesZone = selectedZone === 'all' || r.zona === selectedZone;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        r.ruta.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q) ||
        r.texto.toLowerCase().includes(q) ||
        r.muelleNombre.toLowerCase().includes(q);
      return matchesZone && matchesQuery;
    });
  }, [routes, selectedZone, query]);

  const handleRouteClick = (route: RouteItem) => {
    onSelectRoute(route);
    playScannerBeep('click');
    onNavigateToCode();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header & Controls */}
      <div className="p-4 sm:p-6 bg-slate-850 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white">
              Rutas Agrupadas por Zonas Logísticas
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {routes.length} rutas registradas en {zones.length} zonas operativas
          </p>
        </div>

        {/* View Toggle & Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar por ruta, código..."
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Vista en tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title="Vista en tabla"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Zone Tabs Bar */}
      <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedZone('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
            selectedZone === 'all'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
          }`}
        >
          Todas las Zonas ({routes.length})
        </button>
        {zones.map((zone) => {
          const count = routes.filter((r) => r.zona === zone).length;
          return (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                selectedZone === zone
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
              }`}
            >
              <span>{zone}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedZone === zone ? 'bg-slate-950 text-amber-300' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content: Grid or Table */}
      <div className="p-4 sm:p-6 bg-slate-950/30">
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No se encontraron rutas que coincidan con los filtros seleccionados.
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => handleRouteClick(route)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/15 to-slate-900 border-amber-400 ring-2 ring-amber-500/30 shadow-xl'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-sm border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                        {route.ruta}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {route.zona}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition mb-1">
                      {route.texto}
                    </h4>

                    <div className="text-xs font-mono font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-slate-400" />
                      <span>{route.codigo}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-blue-300 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{route.muelleNombre || 'Muelle pendiente de plano'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                      <span>Ver Código</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Ruta</th>
                  <th className="px-4 py-3">Descripción / Destino</th>
                  <th className="px-4 py-3">Código de Bulto</th>
                  <th className="px-4 py-3">Zona</th>
                  <th className="px-4 py-3">Muelle</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredRoutes.map((route) => {
                  const isSelected = selectedRoute?.id === route.id;
                  return (
                    <tr
                      key={route.id}
                      onClick={() => handleRouteClick(route)}
                      className={`cursor-pointer transition hover:bg-slate-800/70 ${
                        isSelected ? 'bg-amber-500/10 text-white font-bold' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">
                        {route.ruta}
                      </td>
                      <td className="px-4 py-3 text-white font-semibold">{route.texto}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{route.codigo}</td>
                      <td className="px-4 py-3 text-slate-400">{route.zona}</td>
                      <td className="px-4 py-3">
                        {route.muelleNombre ? (
                          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                            {route.muelleNombre}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">
                            Pendiente de plano
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-xs font-semibold transition">
                          Cargar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
