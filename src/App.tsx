/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { RouteSearch } from './components/RouteSearch';
import { CodeDisplay } from './components/CodeDisplay';
import { DockMap } from './components/DockMap';
import { ZoneSelector } from './components/ZoneSelector';
import { SyncModal } from './components/SyncModal';
import { PrintLabelModal } from './components/PrintLabelModal';
import { RouteEditorModal } from './components/RouteEditorModal';
import { LoginView } from './components/LoginView';
import { AdminBackend } from './components/AdminBackend';
import { EnviosView } from './components/EnviosView';
import { DesubicarView } from './components/DesubicarView';
import { RouteItem, SyncConfig, AppUser, WarehouseZoneArea, MapConfig, EnvioItem, UbicacionItem } from './types/logistics';
import { INITIAL_ROUTES } from './data/initialData';
import { REAL_WAREHOUSE_ZONES } from './data/warehouseMapData';
import { apiClient, DEFAULT_ENVIOS_FALLBACK } from './services/apiClient';
import { DEFAULT_UBICACIONES } from './data/ubicacionesData';
import { 
  loadSavedRoutes, 
  saveRoutesLocally, 
  fetchGoogleSheetData 
} from './services/sheetSyncService';
import { 
  Barcode, 
  MapPin, 
  Layers, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle,
  Truck,
  Sparkles,
  Info,
  LogOut,
  ShieldCheck,
  UserCheck,
  Settings,
  ArrowRight,
  Boxes,
  PackageMinus
} from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => apiClient.getCurrentUser());
  const [currentSection, setCurrentSection] = useState<'backend' | 'frontend'>(() => {
    const user = apiClient.getCurrentUser();
    return user?.role === 'admin' ? 'backend' : 'frontend';
  });

  // App data state
  const [routes, setRoutes] = useState<RouteItem[]>(() => loadSavedRoutes(INITIAL_ROUTES));
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(() => {
    const loaded = loadSavedRoutes(INITIAL_ROUTES);
    return loaded.length > 0 ? loaded[0] : null;
  });
  const [recentRoutes, setRecentRoutes] = useState<RouteItem[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'envios' | 'desubicar' | 'map' | 'zones'>('dashboard');
  const [envios, setEnvios] = useState<EnvioItem[]>(DEFAULT_ENVIOS_FALLBACK);
  const [ubicaciones, setUbicaciones] = useState<UbicacionItem[]>(DEFAULT_UBICACIONES);

  // Map state
  const [mapZones, setMapZones] = useState<WarehouseZoneArea[]>(REAL_WAREHOUSE_ZONES);
  const [mapConfig, setMapConfig] = useState<MapConfig>({
    activeMapMode: 'enhanced',
    customMapUrl: '',
    mapTitle: 'Plano General de Almacén y Muelles (Render HD Vertical)',
    dockLabelMode: 'text',
  });

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPrintLabelModalOpen, setIsPrintLabelModalOpen] = useState(false);
  const [isAddRouteModalOpen, setIsAddRouteModalOpen] = useState(false);

  const DEFAULT_GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1gAIjPGHEfqgKXcZPtvxhWeDLFHxudF_KHRzzocgtF1c/edit?usp=drivesdk';

  // Sync state
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    const saved = localStorage.getItem('logiruta_sync_config_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sheetUrl) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return {
      sourceType: 'google_sheets',
      sheetUrl: DEFAULT_GOOGLE_SHEETS_URL,
      autoSync: true,
      syncIntervalSeconds: 300,
      lastSyncTime: null,
      status: 'idle',
      rowCount: INITIAL_ROUTES.length,
    };
  });

  // Quick manual sync handler
  const handleQuickDailySync = async () => {
    setSyncConfig((prev) => ({ ...prev, status: 'syncing' }));
    try {
      const res = await apiClient.triggerSync(syncConfig.sheetUrl);
      if (res.routes && res.routes.length > 0) {
        const fetchedRoutes = res.routes;
        setRoutes(fetchedRoutes);
        setSelectedRoute((prev) => (prev ? fetchedRoutes.find((r) => r.id === prev.id) || fetchedRoutes[0] : fetchedRoutes[0]));
      }
      if (res.envios && res.envios.length > 0) {
        setEnvios(res.envios);
      }
      if (res.ubicaciones && res.ubicaciones.length > 0) {
        setUbicaciones(res.ubicaciones);
      }
      setSyncConfig((prev) => ({
        ...prev,
        status: 'success',
        lastSyncTime: new Date().toLocaleTimeString('es-ES'),
        rowCount: res.count,
      }));
    } catch (err: any) {
      setSyncConfig((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Error al sincronizar con Google Sheets',
      }));
    }
  };

  // Load server routes, map zones, map config, envios, and ubicaciones on start
  useEffect(() => {
    apiClient.getRoutes().then((serverRoutes) => {
      if (serverRoutes && serverRoutes.length > 0) {
        setRoutes(serverRoutes);
        setSelectedRoute((prev) => prev || serverRoutes[0]);
      }
    });

    apiClient.getEnvios().then((serverEnvios) => {
      if (serverEnvios && serverEnvios.length > 0) {
        setEnvios(serverEnvios);
      }
    });

    apiClient.getUbicaciones().then((serverUbicaciones) => {
      if (serverUbicaciones && serverUbicaciones.length > 0) {
        setUbicaciones(serverUbicaciones);
      }
    });

    apiClient.getSyncConfig().then((cfg) => {
      if (cfg) {
        setSyncConfig((prev) => ({
          ...prev,
          sourceType: 'google_sheets',
          sheetUrl: cfg.sourceUrl || DEFAULT_GOOGLE_SHEETS_URL,
          autoSync: cfg.autoDailySync ?? true,
          lastSyncTime: cfg.lastDailySync ? new Date(cfg.lastDailySync).toLocaleString('es-ES') : prev.lastSyncTime,
          rowCount: cfg.lastSyncCount || prev.rowCount,
        }));
      }
    });

    apiClient.getMapZones().then((zones) => {
      if (zones && zones.length > 0) {
        setMapZones(zones);
      }
    });

    apiClient.getMapConfig().then((cfg) => {
      if (cfg) {
        setMapConfig(cfg);
      }
    });
  }, []);

  // Save routes changes to localStorage and backend
  useEffect(() => {
    saveRoutesLocally(routes);
  }, [routes]);

  // Save sync config
  useEffect(() => {
    localStorage.setItem('logiruta_sync_config_v3', JSON.stringify(syncConfig));
  }, [syncConfig]);

  // Real-time automatic background polling if enabled with Google Sheets
  useEffect(() => {
    if (!syncConfig.autoSync || !syncConfig.sheetUrl || syncConfig.sourceType !== 'google_sheets') {
      return;
    }

    const intervalMs = (syncConfig.syncIntervalSeconds || 60) * 1000;
    const timer = setInterval(async () => {
      try {
        const fetched = await fetchGoogleSheetData(syncConfig.sheetUrl);
        setRoutes(fetched);
        setSyncConfig((prev) => ({
          ...prev,
          lastSyncTime: new Date().toLocaleTimeString('es-ES'),
          status: 'success',
          rowCount: fetched.length,
        }));
        // Update backend
        apiClient.bulkUploadRoutes(fetched, true);
      } catch (e) {
        setSyncConfig((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: e instanceof Error ? e.message : 'Error en sincronización en segundo plano',
        }));
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [syncConfig.autoSync, syncConfig.sheetUrl, syncConfig.sourceType, syncConfig.syncIntervalSeconds]);

  // Handle route selection and add to recent
  const handleSelectRoute = (route: RouteItem) => {
    setSelectedRoute(route);
    setRecentRoutes((prev) => {
      const filtered = prev.filter((r) => r.id !== route.id);
      return [route, ...filtered].slice(0, 5);
    });
  };

  // Handle updating route dock assignment
  const handleUpdateRouteDock = (routeId: string, dockId: string, dockName: string, bay: string) => {
    const updated = routes.map((r) =>
      r.id === routeId
        ? {
            ...r,
            muelleId: dockId,
            muelleNombre: dockName,
            bahia: bay,
          }
        : r
    );
    setRoutes(updated);
    apiClient.bulkUploadRoutes(updated, true);

    if (selectedRoute && selectedRoute.id === routeId) {
      setSelectedRoute((prev) =>
        prev
          ? {
              ...prev,
              muelleId: dockId,
              muelleNombre: dockName,
              bahia: bay,
            }
          : null
      );
    }
  };

  // Handle new routes loaded from Excel / Google Sheets
  const handleRoutesLoaded = (newRoutes: RouteItem[], source: string) => {
    setRoutes(newRoutes);
    apiClient.bulkUploadRoutes(newRoutes, true);
    if (newRoutes.length > 0) {
      setSelectedRoute(newRoutes[0]);
    }
  };

  // Add / Save route
  const handleSaveRoute = (newRoute: RouteItem) => {
    setRoutes((prev) => {
      const existsIndex = prev.findIndex((r) => r.id === newRoute.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = newRoute;
        return copy;
      }
      return [newRoute, ...prev];
    });
    apiClient.saveRoute(newRoute);
    setSelectedRoute(newRoute);
  };

  // Login handler
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentSection('backend');
    } else {
      setCurrentSection('frontend');
    }
  };

  // Logout handler
  const handleLogout = () => {
    apiClient.logout();
    setCurrentUser(null);
    setCurrentSection('frontend');
  };

  // Extract unique zones
  const uniqueZones = useMemo(() => {
    const set = new Set<string>();
    routes.forEach((r) => {
      if (r.zona) set.add(r.zona);
    });
    return Array.from(set);
  }, [routes]);

  // ==========================================
  // VIEW RENDER LOGIC
  // ==========================================

  // 1. If not authenticated, always show Login view
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If user is admin and currently on the Backend section
  if (currentUser.role === 'admin' && currentSection === 'backend') {
    return (
      <AdminBackend
        currentUser={currentUser}
        routes={routes}
        onUpdateRoutes={(newRts) => {
          setRoutes(newRts);
          if (newRts.length > 0 && (!selectedRoute || !newRts.some(r => r.id === selectedRoute.id))) {
            setSelectedRoute(newRts[0]);
          }
        }}
        mapZones={mapZones}
        onUpdateMapZones={setMapZones}
        mapConfig={mapConfig}
        onUpdateMapConfig={setMapConfig}
        onNavigateToFrontend={() => setCurrentSection('frontend')}
        onLogout={handleLogout}
      />
    );
  }

  // 3. Otherwise: FRONTEND OPERATOR VIEW (For user role or admin viewing frontend)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Banner for Admin if currently inspecting Frontend */}
      {currentUser.role === 'admin' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between border-b border-amber-600 shadow-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>Modo Administrador: Estás viendo la pantalla operativa de los operarios (Frontend)</span>
          </div>
          <button
            onClick={() => setCurrentSection('backend')}
            className="px-3 py-0.5 rounded-lg bg-slate-950 text-amber-400 text-xs font-bold hover:bg-slate-900 transition flex items-center gap-1 cursor-pointer"
          >
            <span>⚙️ Volver al Backend</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Navigation */}
      <Header
        totalRoutes={routes.length}
        totalZones={uniqueZones.length}
        syncConfig={syncConfig}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenAddRouteModal={() => setIsAddRouteModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        onNavigateToBackend={currentUser.role === 'admin' ? () => setCurrentSection('backend') : undefined}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* GOOGLE SHEETS DAILY SYNC STATUS BANNER (Mobile-friendly) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-3 h-3 rounded-full shrink-0 ${syncConfig.status === 'syncing' ? 'bg-amber-400 animate-spin' : syncConfig.status === 'error' ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
            <div className="truncate">
              <span className="font-bold text-white">Google Sheets Oficial:</span>{' '}
              <span className="text-emerald-400 font-semibold">
                {routes.length} rutas activas
              </span>
              {syncConfig.lastSyncTime && (
                <span className="text-slate-400 ml-1.5 font-mono text-[11px]">
                  (actualizado hoy: {syncConfig.lastSyncTime})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {currentUser.role === 'admin' && (
              <button
                onClick={handleQuickDailySync}
                disabled={syncConfig.status === 'syncing'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 border border-slate-700 transition cursor-pointer"
                title="Sincronizar rutas con Google Sheets (Solo Administrador)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${syncConfig.status === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{syncConfig.status === 'syncing' ? 'Sincronizando...' : 'Actualizar Rutas'}</span>
              </button>
            )}
            {currentUser.role === 'admin' && (
              <a
                href={syncConfig.sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700 transition"
                title="Abrir hoja de cálculo oficial en Google Sheets"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* VIEW 1: DASHBOARD (Route Search + Barcode / QR + Quick Dock Preview) */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Quick Search and Touch Keypad Component */}
            <RouteSearch
              routes={routes}
              selectedRoute={selectedRoute}
              onSelectRoute={handleSelectRoute}
              recentRoutes={recentRoutes}
              selectedArea={selectedArea}
              onSelectArea={setSelectedArea}
            />

            {/* Grid with Code Display & Dock Map Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left / Primary Column: Barcode & QR Code Presentation */}
              <div className="lg:col-span-7 space-y-6">
                <CodeDisplay
                  route={selectedRoute}
                  onNavigateToMap={() => setActiveView('map')}
                  onOpenPrintLabel={() => setIsPrintLabelModalOpen(true)}
                />
              </div>

              {/* Right Column: Dock Pinpoint & Quick Interactive Map */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Ubicación de Muelle en Nave
                      </h3>
                    </div>

                    <button
                      onClick={() => setActiveView('map')}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Ver Plano Completo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Compact Map Preview */}
                  <div className="rounded-xl overflow-hidden border border-slate-800">
                    <DockMap
                      selectedRoute={selectedRoute}
                      allRoutes={routes}
                      onSelectRoute={handleSelectRoute}
                      onUpdateRouteDock={currentUser.role === 'admin' ? handleUpdateRouteDock : undefined}
                      zones={mapZones}
                      mapConfig={mapConfig}
                    />
                  </div>

                  {/* Quick Operator Instructions */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300">
                      <Info className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Procedimiento de Entrega de Bulto:</span>
                    </div>
                    <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px] leading-relaxed pl-1">
                      <li>Escanea el código de barras con la pistola o terminal PDA.</li>
                      <li>Verifica que el número coincida con el albarán físico.</li>
                      <li>Lleva el bulto al muelle indicado en pantalla con el indicador pulsante.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: ENVIOS (4 CHOICE BUTTONS & QR CODES FROM GOOGLE SHEETS) */}
        {activeView === 'envios' && (
          <EnviosView
            envios={envios}
            sheetUrl={syncConfig.sheetUrl}
            onRefresh={currentUser.role === 'admin' ? handleQuickDailySync : undefined}
            isRefreshing={syncConfig.status === 'syncing'}
          />
        )}

        {/* VIEW 2.5: DESUBICAR (AREA SELECTOR & LOCATION BARCODES) */}
        {activeView === 'desubicar' && (
          <DesubicarView
            ubicaciones={ubicaciones}
            onRefresh={currentUser.role === 'admin' ? handleQuickDailySync : undefined}
            isRefreshing={syncConfig.status === 'syncing'}
          />
        )}

        {/* VIEW 3: FULL WAREHOUSE DOCK MAP */}
        {activeView === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Mapa General de Muelles</h2>
                <p className="text-xs text-slate-400">
                  Ubicación exacta de muelles y bahías de carga por fachada
                </p>
              </div>
              <button
                onClick={() => setActiveView('dashboard')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                ← Volver al Escáner
              </button>
            </div>

            <DockMap
              selectedRoute={selectedRoute}
              allRoutes={routes}
              onSelectRoute={handleSelectRoute}
              onUpdateRouteDock={currentUser.role === 'admin' ? handleUpdateRouteDock : undefined}
              zones={mapZones}
              mapConfig={mapConfig}
            />
          </div>
        )}

        {/* VIEW 3: ZONE EXPLORER & COMPLETE ROUTE LIST */}
        {activeView === 'zones' && (
          <div className="space-y-4">
            <ZoneSelector
              routes={routes}
              selectedRoute={selectedRoute}
              onSelectRoute={handleSelectRoute}
              onNavigateToCode={() => setActiveView('dashboard')}
              onNavigateToMap={() => setActiveView('map')}
            />
          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* REQUIRED USER LOGOUT BUTTON AT THE VERY BOTTOM OF FRONTEND */}
      {/* "Y si es usuario normal le llevará al frontend con un botón de deslogear abajo del todo." */}
      {/* ============================================================== */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 py-6 px-4 sm:px-6 mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
              <UserCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Operador Conectado: <strong className="text-amber-400">{currentUser.username}</strong>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {currentUser.role === 'admin' ? 'Administrador' : 'Operador Almacén'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Turno activo. Recuerda cerrar sesión al finalizar o pasar el terminal al siguiente compañero.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setCurrentSection('backend')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Panel Backend</span>
              </button>
            )}

            {/* REQUIRED BOTÓN DE DESLOGEAR ABAJO DEL TODO */}
            <button
              onClick={handleLogout}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión / Deslogear</span>
            </button>
          </div>

        </div>
      </footer>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR FOR OPERATORS */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg px-1 py-1 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
            activeView === 'dashboard'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Barcode className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">Escáner</span>
        </button>

        <button
          onClick={() => setActiveView('envios')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
            activeView === 'envios'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">Envíos</span>
        </button>

        <button
          onClick={() => setActiveView('desubicar')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
            activeView === 'desubicar'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PackageMinus className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">Desubicar</span>
        </button>

        <button
          onClick={() => setActiveView('map')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
            activeView === 'map'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">Muelles</span>
        </button>

        <button
          onClick={() => setActiveView('zones')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
            activeView === 'zones'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">Zonas</span>
        </button>
      </nav>

      {/* MODALS */}
      <SyncModal
        isOpen={isSyncModalOpen && currentUser.role === 'admin'}
        onClose={() => setIsSyncModalOpen(false)}
        syncConfig={syncConfig}
        onUpdateSyncConfig={(cfg) => setSyncConfig((prev) => ({ ...prev, ...cfg }))}
        onRoutesLoaded={handleRoutesLoaded}
        routes={routes}
      />

      <PrintLabelModal
        route={selectedRoute}
        isOpen={isPrintLabelModalOpen}
        onClose={() => setIsPrintLabelModalOpen(false)}
      />

      <RouteEditorModal
        isOpen={isAddRouteModalOpen}
        onClose={() => setIsAddRouteModalOpen(false)}
        onSaveRoute={handleSaveRoute}
        existingZones={uniqueZones}
      />

    </div>
  );
}
