import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  RefreshCw, 
  FileSpreadsheet, 
  MapPin, 
  Barcode, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Boxes
} from 'lucide-react';
import { SyncConfig, AppUser } from '../types/logistics';
import { ShieldCheck, LogOut, Settings, PackageMinus, Building2, Printer } from 'lucide-react';

interface HeaderProps {
  totalRoutes: number;
  totalZones: number;
  syncConfig: SyncConfig;
  onOpenSyncModal: () => void;
  onOpenAddRouteModal: () => void;
  activeView: 'dashboard' | 'envios' | 'desubicar' | 'entreplanta' | 'impresoras' | 'map' | 'zones';
  setActiveView: (view: 'dashboard' | 'envios' | 'desubicar' | 'entreplanta' | 'impresoras' | 'map' | 'zones') => void;
  currentUser?: AppUser | null;
  onNavigateToBackend?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalRoutes,
  totalZones,
  syncConfig,
  onOpenSyncModal,
  onOpenAddRouteModal,
  activeView,
  setActiveView,
  currentUser,
  onNavigateToBackend,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Truck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  LogiRuta
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                    Logística Interna
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Gestión de Rutas, Códigos de Carga y Asignación de Muelles
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Mobile scrollable / wrapping) */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-center overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Barcode className="w-4 h-4" />
              <span>Escáner y Rutas</span>
            </button>
            <button
              onClick={() => setActiveView('envios')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'envios'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Envíos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeView === 'envios' ? 'bg-slate-950 text-amber-400' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                QR
              </span>
            </button>
            <button
              onClick={() => setActiveView('desubicar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'desubicar'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <PackageMinus className="w-4 h-4" />
              <span>DESUBICAR</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeView === 'desubicar' ? 'bg-slate-950 text-amber-400' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                Barras
              </span>
            </button>
            <button
              onClick={() => setActiveView('entreplanta')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'entreplanta'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Entreplanta</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeView === 'entreplanta' ? 'bg-slate-950 text-amber-400' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                Piso 1
              </span>
            </button>
            <button
              onClick={() => setActiveView('impresoras')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'impresoras'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Impresoras</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeView === 'impresoras' ? 'bg-slate-950 text-amber-400' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                WiFi
              </span>
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Mapa de Muelles</span>
            </button>
            <button
              onClick={() => setActiveView('zones')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeView === 'zones'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Zonas ({totalZones})</span>
            </button>
          </div>

          {/* Quick Metrics & Sync Status */}
          <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono font-medium">{currentTime}</span>
            </div>

            {/* Sync Badge Button (Clickable only for Admin) */}
            {currentUser?.role === 'admin' ? (
              <button
                onClick={onOpenSyncModal}
                title="Configurar Google Sheets o subir Excel (Solo Administrador)"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition hover:border-slate-600 cursor-pointer"
              >
                <div className="relative">
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      syncConfig.status === 'syncing'
                        ? 'animate-spin text-amber-400'
                        : syncConfig.status === 'error'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  />
                  {syncConfig.autoSync && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <span className="hidden sm:inline">
                  {syncConfig.sourceType === 'google_sheets' ? 'Google Sheets' : 'Excel / Local'}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400">
                  {totalRoutes} rutas
                </span>
              </button>
            ) : (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
                title="Rutas activas en almacén"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-[11px] text-slate-300">{totalRoutes} rutas</span>
              </div>
            )}

            {/* Admin Backend Switch (If admin user) */}
            {currentUser?.role === 'admin' && onNavigateToBackend && (
              <button
                onClick={onNavigateToBackend}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition cursor-pointer"
                title="Ir al panel de gestión backend"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>⚙️ Panel Backend</span>
              </button>
            )}

            {/* User Info / Logout Button in Header */}
            {currentUser && onLogout && (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-700/60">
                <span className="text-[11px] font-mono font-semibold text-slate-400 hidden sm:inline">
                  {currentUser.username}
                </span>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
