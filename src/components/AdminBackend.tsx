import React, { useState, useEffect, useRef } from 'react';
import { 
  AppUser, 
  RouteItem, 
  WarehouseZoneArea, 
  MapConfig, 
  SyncConfig,
  EnvioItem 
} from '../types/logistics';
import { apiClient } from '../services/apiClient';
import { parseExcelOrCsv, matchZoneToWarehouseArea } from '../services/sheetSyncService';
import * as XLSX from 'xlsx';
import { 
  Users, 
  FileSpreadsheet, 
  Map, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowRight, 
  Eye, 
  Move, 
  Maximize2, 
  Minimize2, 
  Layers,
  Image as ImageIcon,
  KeyRound,
  RefreshCw,
  ExternalLink,
  Info,
  Boxes,
  QrCode
} from 'lucide-react';
import { ENHANCED_WAREHOUSE_MAP_IMAGE, ORIGINAL_WAREHOUSE_PHOTO } from '../data/warehouseMapData';

interface AdminBackendProps {
  currentUser: AppUser;
  routes: RouteItem[];
  onUpdateRoutes: (newRoutes: RouteItem[]) => void;
  mapZones: WarehouseZoneArea[];
  onUpdateMapZones: (newZones: WarehouseZoneArea[]) => void;
  mapConfig: MapConfig;
  onUpdateMapConfig: (newConfig: MapConfig) => void;
  onNavigateToFrontend: () => void;
  onLogout: () => void;
}

export const AdminBackend: React.FC<AdminBackendProps> = ({
  currentUser,
  routes,
  onUpdateRoutes,
  mapZones,
  onUpdateMapZones,
  mapConfig,
  onUpdateMapConfig,
  onNavigateToFrontend,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'excel' | 'envios' | 'map'>('excel');

  // --- NOTIFICATIONS ---
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ==========================================
  // ENVIOS STATE & LOGIC (PESTAÑA ENVIOS)
  // ==========================================
  const [enviosList, setEnviosList] = useState<EnvioItem[]>([]);
  const [loadingEnvios, setLoadingEnvios] = useState(false);
  const [editingEnvio, setEditingEnvio] = useState<EnvioItem | null>(null);
  const [isAddEnvioOpen, setIsAddEnvioOpen] = useState(false);
  const [formEnvioTipo, setFormEnvioTipo] = useState('');
  const [formEnvioQr, setFormEnvioQr] = useState('');

  const loadEnvios = async () => {
    setLoadingEnvios(true);
    try {
      const data = await apiClient.getEnvios();
      setEnviosList(data);
    } catch {
      showMessage('Error al cargar la lista de envíos', 'error');
    } finally {
      setLoadingEnvios(false);
    }
  };

  useEffect(() => {
    loadEnvios();
  }, []);

  const handleSaveEnvioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEnvioTipo.trim()) {
      showMessage('El tipo de envío es obligatorio', 'error');
      return;
    }
    try {
      await apiClient.saveEnvio({
        id: editingEnvio ? editingEnvio.id : `envio-${Date.now()}`,
        tipo: formEnvioTipo.trim(),
        qr: formEnvioQr.trim(),
      });
      showMessage(`Envío "${formEnvioTipo}" guardado con éxito`);
      setIsAddEnvioOpen(false);
      setEditingEnvio(null);
      loadEnvios();
    } catch (err: any) {
      showMessage(`Error al guardar: ${err.message}`, 'error');
    }
  };

  const handleResetEnviosDefaults = async () => {
    try {
      const res = await apiClient.resetEnvios();
      setEnviosList(res);
      showMessage('Envíos restablecidos a los 4 botones originales del Excel');
    } catch (err: any) {
      showMessage(`Error: ${err.message}`, 'error');
    }
  };

  // ==========================================
  // TAB 1: USERS STATE & LOGIC
  // ==========================================
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserPassword, setNewUserPassword] = useState('');

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiClient.getUsers();
      setUsersList(data);
    } catch {
      showMessage('Error al cargar la lista de usuarios', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserPassword.trim()) {
      showMessage('Usuario y contraseña son requeridos', 'error');
      return;
    }
    try {
      await apiClient.createUser({
        username: newUsername.trim(),
        fullName: newFullName.trim() || newUsername.trim(),
        role: newUserRole,
        password: newUserPassword.trim(),
      });
      showMessage(`Usuario "${newUsername}" creado con éxito`);
      setIsAddUserOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewUserPassword('');
      loadUsers();
    } catch (err: any) {
      showMessage(err.message || 'Error al crear usuario', 'error');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiClient.updateUser(editingUser.id, {
        username: editingUser.username,
        fullName: editingUser.fullName,
        role: editingUser.role,
        password: newUserPassword ? newUserPassword.trim() : undefined,
      });
      showMessage(`Usuario "${editingUser.username}" actualizado`);
      setEditingUser(null);
      setNewUserPassword('');
      loadUsers();
    } catch (err: any) {
      showMessage(err.message || 'Error al actualizar usuario', 'error');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (name.toLowerCase() === 'diego') {
      showMessage('No es posible eliminar al administrador Diego', 'error');
      return;
    }
    if (!confirm(`¿Eliminar al usuario "${name}"?`)) return;
    try {
      await apiClient.deleteUser(id);
      showMessage(`Usuario "${name}" eliminado`);
      loadUsers();
    } catch (err: any) {
      showMessage(err.message || 'Error al eliminar usuario', 'error');
    }
  };

  // ==========================================
  // TAB 2: EXCEL & ROUTES STATE & LOGIC
  // ==========================================
  const [routeSearch, setRouteSearch] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);

  // New route form state
  const [formRuta, setFormRuta] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formTexto, setFormTexto] = useState('');
  const [formZona, setFormZona] = useState('zona 127E00');
  const [formMuelleId, setFormMuelleId] = useState('127E00');
  const [formBahia, setFormBahia] = useState('Sector 127E00');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch = 
      r.ruta.toLowerCase().includes(routeSearch.toLowerCase()) ||
      r.codigo.includes(routeSearch) ||
      (r.texto && r.texto.toLowerCase().includes(routeSearch.toLowerCase())) ||
      (r.muelleNombre && r.muelleNombre.toLowerCase().includes(routeSearch.toLowerCase()));
    const matchesZone = selectedZoneFilter === 'all' || r.zona === selectedZoneFilter;
    return matchesSearch && matchesZone;
  });

  const uniqueZones = Array.from(new Set(routes.map((r) => r.zona).filter(Boolean)));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsedRoutes = parseExcelOrCsv(buffer, file.name);

      if (parsedRoutes.length === 0) {
        showMessage('No se encontraron filas válidas con número de ruta y código en el archivo', 'error');
        return;
      }

      const updated = await apiClient.bulkUploadRoutes(parsedRoutes, true);
      onUpdateRoutes(updated);
      showMessage(`¡Éxito! Se cargaron ${parsedRoutes.length} rutas desde "${file.name}"`);
    } catch (err: any) {
      showMessage(`Error al procesar el archivo: ${err.message}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetToInitialRoutes = async () => {
    if (!confirm('¿Restablecer las rutas a los 10 registros originales del Excel de la Zona 127E00?')) return;
    try {
      const def = await apiClient.resetRoutes();
      onUpdateRoutes(def);
      showMessage('Rutas restablecidas a los 10 registros originales');
    } catch {
      showMessage('Error al restablecer rutas', 'error');
    }
  };

  // Google Sheets daily sync state
  const [serverSync, setServerSync] = useState<any>(null);
  const [syncUrlInput, setSyncUrlInput] = useState('https://docs.google.com/spreadsheets/d/1gAIjPGHEfqgKXcZPtvxhWeDLFHxudF_KHRzzocgtF1c/edit?usp=drivesdk');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditingSyncUrl, setIsEditingSyncUrl] = useState(false);
  const [autoDailySync, setAutoDailySync] = useState(true);

  useEffect(() => {
    apiClient.getSyncConfig().then((cfg) => {
      if (cfg) {
        setServerSync(cfg);
        if (cfg.sourceUrl) setSyncUrlInput(cfg.sourceUrl);
        if (cfg.autoDailySync !== undefined) setAutoDailySync(cfg.autoDailySync);
      }
    });
  }, []);

  const handleTriggerManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await apiClient.triggerSync(syncUrlInput);
      if (res.routes && res.routes.length > 0) {
        onUpdateRoutes(res.routes);
      }
      if (res.envios && res.envios.length > 0) {
        setEnviosList(res.envios);
      }
      showMessage(`Sincronización completada: ${res.count} rutas y ${res.envios?.length || 0} envíos cargados`);
      const updated = await apiClient.getSyncConfig();
      setServerSync(updated);
    } catch (err: any) {
      showMessage(`Error en sincronización: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSyncConfig = async () => {
    try {
      const updated = await apiClient.updateSyncConfig({
        sourceUrl: syncUrlInput.trim(),
        autoDailySync,
      });
      setServerSync(updated);
      setIsEditingSyncUrl(false);
      showMessage('Configuración de sincronización de Google Sheets guardada');
    } catch (err: any) {
      showMessage(`Error al guardar: ${err.message}`, 'error');
    }
  };

  const handleExportToExcel = () => {
    try {
      const exportData = routes.map((r) => ({
        Ruta: r.ruta,
        Código: r.codigo,
        Descripción: r.texto || '',
        Zona: r.zona || '',
        Muelle: r.muelleNombre || r.muelleId || '',
        Bahía: r.bahia || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rutas_Almacen');
      XLSX.writeFile(workbook, `LogiRuta_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showMessage('Archivo Excel descargado con éxito');
    } catch {
      showMessage('Error al generar archivo Excel', 'error');
    }
  };

  const handleSaveRouteItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRuta.trim() || !formCodigo.trim()) {
      showMessage('Ruta y Código son obligatorios', 'error');
      return;
    }

    const matchedArea = matchZoneToWarehouseArea(formZona || formMuelleId);

    const routeData: RouteItem = {
      id: editingRoute ? editingRoute.id : `rt_${Date.now()}_${formRuta.trim()}`,
      ruta: formRuta.trim(),
      codigo: formCodigo.trim(),
      texto: formTexto.trim() || `${formRuta.trim()} RUTA`,
      zona: formZona.trim() || (matchedArea ? `zona ${matchedArea.code}` : 'zona 127E00'),
      muelleId: matchedArea ? matchedArea.code : (formMuelleId || '127E00'),
      muelleNombre: matchedArea ? matchedArea.dockLabel : `Muelle ${formMuelleId || '127E00'}`,
      bahia: formBahia.trim() || (matchedArea ? `Bahía ${matchedArea.code}` : 'Sector 127E00'),
    };

    try {
      await apiClient.saveRoute(routeData);
      const updatedRoutes = editingRoute
        ? routes.map((r) => (r.id === editingRoute.id ? routeData : r))
        : [routeData, ...routes];
      onUpdateRoutes(updatedRoutes);
      showMessage(`Ruta ${formRuta} guardada correctamente`);
      setIsAddRouteOpen(false);
      setEditingRoute(null);
      setFormRuta('');
      setFormCodigo('');
      setFormTexto('');
    } catch {
      showMessage('Error al guardar la ruta', 'error');
    }
  };

  const handleDeleteRoute = async (id: string, ruta: string) => {
    if (!confirm(`¿Eliminar la ruta ${ruta}?`)) return;
    try {
      await apiClient.deleteRoute(id);
      const updated = routes.filter((r) => r.id !== id);
      onUpdateRoutes(updated);
      showMessage(`Ruta ${ruta} eliminada`);
    } catch {
      showMessage('Error al eliminar la ruta', 'error');
    }
  };

  // ==========================================
  // TAB 3: MAP CHANGES & DOCK CALIBRATOR
  // ==========================================
  const [selectedDockZone, setSelectedDockZone] = useState<WarehouseZoneArea | null>(null);
  const [isAddDockOpen, setIsAddDockOpen] = useState(false);
  const mapImageUploadRef = useRef<HTMLInputElement>(null);

  // Form for adding a new dock
  const [newDockCode, setNewDockCode] = useState('');
  const [newDockLabel, setNewDockLabel] = useState('');
  const [newDockWall, setNewDockWall] = useState<'bottom' | 'left' | 'top' | 'right' | 'center'>('bottom');
  const [newDockX, setNewDockX] = useState(50);
  const [newDockY, setNewDockY] = useState(79.5);

  const handleSelectMapMode = async (mode: 'original' | 'enhanced' | 'cad' | 'custom') => {
    const updated = { ...mapConfig, activeMapMode: mode };
    onUpdateMapConfig(updated);
    try {
      await apiClient.updateMapConfig(updated);
      showMessage(`Modo de plano cambiado a "${mode}"`);
    } catch {
      showMessage('Error al guardar preferencia de plano', 'error');
    }
  };

  const handleUploadCustomMap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const result = await apiClient.uploadCustomMapImage(base64, file.name);
        onUpdateMapConfig(result.config);
        showMessage('Nuevo plano cargado y activado con éxito');
      } catch (err: any) {
        showMessage(err.message || 'Error al subir la imagen del plano', 'error');
      } finally {
        if (mapImageUploadRef.current) mapImageUploadRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateSelectedDockCoordinates = (key: 'x' | 'y' | 'width' | 'height' | 'textX' | 'textY' | 'dockX' | 'dockY', value: number) => {
    if (!selectedDockZone) return;
    const rounded = Math.round(value * 100) / 100;
    const updated: WarehouseZoneArea = {
      ...selectedDockZone,
      [key]: rounded,
    };
    if (key === 'textX' || key === 'x') {
      updated.x = rounded;
      updated.textX = rounded;
      updated.dockX = rounded;
    }
    if (key === 'textY' || key === 'y') {
      updated.y = rounded;
      updated.textY = rounded;
      updated.dockY = Math.round((rounded - 2.5) * 100) / 100;
    }
    setSelectedDockZone(updated);
    const newZones = mapZones.map((z) => (z.id === updated.id ? updated : z));
    onUpdateMapZones(newZones);
  };

  const handleSaveDockZoneChanges = async () => {
    if (!selectedDockZone) return;
    try {
      await apiClient.saveMapZone(selectedDockZone);
      const newZones = mapZones.map((z) => (z.id === selectedDockZone.id ? selectedDockZone : z));
      await apiClient.updateMapZones(newZones);
      onUpdateMapZones(newZones);
      showMessage(`Cambios guardados en ${selectedDockZone.label}`);
    } catch {
      showMessage('Error al guardar zona en el backend', 'error');
    }
  };

  const handleResetMapZones = async () => {
    if (!confirm('¿Restablecer las coordenadas de todos los muelles a las 19 posiciones originales medidas de la foto?')) return;
    try {
      const reset = await apiClient.resetMapZones();
      onUpdateMapZones(reset);
      setSelectedDockZone(null);
      showMessage('Coordenadas de muelles restablecidas al plano original');
    } catch {
      showMessage('Error al restablecer plano', 'error');
    }
  };

  const handleCreateDockZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDockCode.trim()) {
      showMessage('Código de muelle requerido', 'error');
      return;
    }

    const code = newDockCode.trim().toUpperCase();
    const isRight = newDockWall === 'right';
    const isBottom = newDockWall === 'bottom';
    const isLeft = newDockWall === 'left';

    const newZone: WarehouseZoneArea = {
      id: code,
      code,
      label: newDockLabel.trim() || `Zona ${code}`,
      wall: newDockWall,
      x: Number(newDockX),
      y: Number(newDockY),
      width: isRight ? 22 : isBottom ? 14 : isLeft ? 20 : 15,
      height: 3.4,
      textX: Number(newDockX),
      textY: Number(newDockY),
      dockX: Number(newDockX),
      dockY: Number(newDockY) - 2.5,
      dockLabel: `Muelle ${code}`,
      description: `Muelle configurado ${code}`,
    };

    try {
      await apiClient.saveMapZone(newZone);
      const exists = mapZones.some((z) => z.id === newZone.id || z.code === newZone.code);
      const updated = exists
        ? mapZones.map((z) => (z.id === newZone.id || z.code === newZone.code ? newZone : z))
        : [...mapZones, newZone];
      await apiClient.updateMapZones(updated);
      onUpdateMapZones(updated);
      setSelectedDockZone(newZone);
      setIsAddDockOpen(false);
      setNewDockCode('');
      setNewDockLabel('');
      showMessage(`Muelle ${code} creado y sincronizado con éxito`);
    } catch {
      showMessage('Error al crear nuevo muelle', 'error');
    }
  };

  const handleDeleteDockZone = async (id: string, label: string) => {
    if (!confirm(`¿Eliminar el muelle/zona "${label}"?`)) return;
    try {
      await apiClient.deleteMapZone(id);
      const updated = mapZones.filter((z) => z.id !== id);
      await apiClient.updateMapZones(updated);
      onUpdateMapZones(updated);
      if (selectedDockZone?.id === id) setSelectedDockZone(null);
      showMessage(`Muelle "${label}" eliminado`);
    } catch {
      showMessage('Error al eliminar muelle', 'error');
    }
  };

  // Determine current map image
  const currentMapImage = 
    mapConfig.activeMapMode === 'enhanced'
      ? ENHANCED_WAREHOUSE_MAP_IMAGE
      : mapConfig.activeMapMode === 'custom' && mapConfig.customMapUrl
      ? mapConfig.customMapUrl
      : ORIGINAL_WAREHOUSE_PHOTO;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* ============================================================== */}
      {/* TOP NAVIGATION BAR WITH BACK / FRONT SWITCH FOR ADMIN */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & Admin Status */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shadow-lg shadow-amber-500/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-wide text-white">
                    LOGIRUTA <span className="text-amber-400">ADMIN</span>
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Diego (Admin)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Panel de Control Backend & Gestión Integral
                </p>
              </div>
            </div>

            {/* Mobile quick exit */}
            <button
              onClick={onLogout}
              className="md:hidden text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 border border-red-500/20"
            >
              Salir
            </button>
          </div>

          {/* REQUIRED TOP TABS: BACKEND VS FRONTEND SWITCH */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner w-full md:w-auto justify-center">
            <button
              onClick={() => {}} // Already in backend
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 cursor-default"
            >
              <Layers className="w-4 h-4" />
              <span>⚙️ Panel de Gestión (Backend)</span>
            </button>

            <button
              onClick={onNavigateToFrontend}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>📦 Operativa de Rutas (Frontend)</span>
            </button>
          </div>

          {/* Action to Logout / Back */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onNavigateToFrontend}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
            >
              <span>Ver Pantalla Operadores</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              onClick={onLogout}
              className="text-xs font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      </header>

      {/* Floating feedback message */}
      {feedback && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' 
              : 'bg-red-950/95 border-red-500/50 text-red-200'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECONDARY BACKEND TABS: USUARIOS | EXCELS & RUTAS | MAPA */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex gap-2 sm:gap-4 overflow-x-auto py-3 no-scrollbar">
          
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
              activeTab === 'excel'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Gestión de Excels y Rutas</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-slate-300">
              {routes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('envios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
              activeTab === 'envios'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Boxes className="w-4 h-4 text-amber-400" />
            <span>Pestaña Envíos & QR</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-slate-300">
              {enviosList.length} botones
            </span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
              activeTab === 'map'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Map className="w-4 h-4 text-blue-400" />
            <span>Cambios de Mapa y Muelles</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-slate-300">
              {mapZones.length} zonas
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Gestión de Usuarios</span>
          </button>

        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN BACKEND CONTENT AREA */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ------------------------------------------------------------ */}
        {/* TAB 1: GESTIÓN DE EXCELS Y RUTAS */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'excel' && (
          <div className="space-y-6">
            
            {/* GOOGLE SHEETS DAILY AUTO-SYNC CARD */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span>Google Sheets: Sincronización Automática Diaria</span>
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Actualización cada día activa</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      El servidor se sincroniza automáticamente cada 24 horas con la hoja oficial. Si realizas cambios en el archivo de Google Sheets, se actualizarán aquí sin necesidad de intervención manual a menos que desees cambiar el enlace.
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
                  <button
                    onClick={handleTriggerManualSync}
                    disabled={isSyncing}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                  </button>

                  <a
                    href={syncUrlInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                    <span>Abrir Google Sheets</span>
                  </a>

                  <button
                    onClick={() => setIsEditingSyncUrl(!isEditingSyncUrl)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>{isEditingSyncUrl ? 'Cerrar Edición' : 'Editar Enlace'}</span>
                  </button>
                </div>
              </div>

              {/* Status and URL Bar */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300 overflow-hidden">
                  <span className="font-bold text-slate-400 shrink-0">Enlace Activo:</span>
                  <span className="font-mono text-emerald-300 truncate max-w-lg select-all" title={syncUrlInput}>
                    {syncUrlInput}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
                  {serverSync?.lastDailySync && (
                    <span>
                      Última sincr: <strong className="text-white">{new Date(serverSync.lastDailySync).toLocaleString('es-ES')}</strong>
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold">
                    {routes.length} rutas
                  </span>
                </div>
              </div>

              {/* Edit URL Form (collapsible) */}
              {isEditingSyncUrl && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Cambiar Enlace de Google Sheets
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-300 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={autoDailySync}
                          onChange={(e) => setAutoDailySync(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>Actualizar automáticamente cada día</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={syncUrlInput}
                      onChange={(e) => setSyncUrlInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      onClick={handleSaveSyncConfig}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Enlace</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Asegúrate de que la hoja de Google Sheets esté configurada con acceso "Cualquier persona con el enlace puede leer".
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar & Excel Uploader */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <span>Carga Manual de Archivos Excel / CSV</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Sube el Excel con las zonas y rutas asignadas para actualizar el sistema en tiempo real.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir Nuevo Excel / CSV</span>
                  </button>

                  <button
                    onClick={handleExportToExcel}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Descargar .xlsx</span>
                  </button>

                  <button
                    onClick={handleResetToInitialRoutes}
                    className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Restaura las 10 rutas originales de la zona 127E00"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rutas Originales</span>
                  </button>
                </div>
              </div>

              {/* Statistics & Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Rutas Activas
                  </span>
                  <span className="text-xl font-black text-amber-400">{routes.length}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Zonas / Áreas Detectadas
                  </span>
                  <span className="text-xl font-black text-blue-400">{uniqueZones.length}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Muelles Vinculados
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    {new Set(routes.map(r => r.muelleId).filter(Boolean)).size}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Añadir Manual
                    </span>
                    <span className="text-xs text-slate-400">Crear ruta suelta</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRoute(null);
                      setFormRuta('');
                      setFormCodigo('');
                      setFormTexto('');
                      setIsAddRouteOpen(true);
                    }}
                    className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={routeSearch}
                    onChange={(e) => setRouteSearch(e.target.value)}
                    placeholder="Filtrar por número de ruta (ej: 55043, C0810) o código..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={selectedZoneFilter}
                    onChange={(e) => setSelectedZoneFilter(e.target.value)}
                    className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="all">Todas las Zonas ({routes.length})</option>
                    {uniqueZones.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Ruta</th>
                        <th className="py-3 px-4">Código Bulto</th>
                        <th className="py-3 px-4">Descripción / Destino</th>
                        <th className="py-3 px-4">Zona / Área</th>
                        <th className="py-3 px-4">Muelle / Bahía</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {filteredRoutes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No se encontraron rutas con el filtro actual.
                          </td>
                        </tr>
                      ) : (
                        filteredRoutes.map((route) => (
                          <tr key={route.id} className="hover:bg-slate-900/50 transition">
                            <td className="py-3 px-4 font-mono font-bold text-amber-400">
                              {route.ruta}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                              {route.codigo}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              {route.texto || '-'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[11px]">
                                {route.zona || '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span>{route.muelleNombre || route.muelleId}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingRoute(route);
                                    setFormRuta(route.ruta);
                                    setFormCodigo(route.codigo);
                                    setFormTexto(route.texto || '');
                                    setFormZona(route.zona || '');
                                    setFormMuelleId(route.muelleId || '');
                                    setFormBahia(route.bahia || '');
                                    setIsAddRouteOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRoute(route.id, route.ruta)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 2: CAMBIOS DE PLANO Y CALIBRACIÓN DE MUELLES */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            
            {/* Top map config header */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Map className="w-5 h-5 text-blue-400" />
                    <span>Cambios de Plano de Almacén y Calibrador de Muelles</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Ajusta coordenadas X/Y de los muelles, sube nuevos planos o cambia el modo visual activo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={mapImageUploadRef}
                    onChange={handleUploadCustomMap}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => mapImageUploadRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir Nueva Imagen de Plano</span>
                  </button>

                  <button
                    onClick={handleResetMapZones}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Restaura las 19 zonas medidas con precisión de la foto original"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Restablecer Coordenadas 1:1</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewDockCode('');
                      setNewDockLabel('');
                      setIsAddDockOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir Muelle</span>
                  </button>
                </div>
              </div>

              {/* Map Mode Selector */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-400 mr-2">Plano Activo:</span>
                
                <button
                  onClick={() => handleSelectMapMode('original')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    mapConfig.activeMapMode === 'original'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>📷 Foto Original (Tus Marcas)</span>
                </button>

                <button
                  onClick={() => handleSelectMapMode('enhanced')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    mapConfig.activeMapMode === 'enhanced'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>📐 Plano Render HD (Vertical)</span>
                </button>

                <button
                  onClick={() => handleSelectMapMode('cad')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    mapConfig.activeMapMode === 'cad'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>🏗️ Esquema CAD</span>
                </button>

                {mapConfig.customMapUrl && (
                  <button
                    onClick={() => handleSelectMapMode('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      mapConfig.activeMapMode === 'custom'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>🖼️ Plano Subido Personalizado</span>
                  </button>
                )}
              </div>

              {/* Grid: Map Live Visualizer on Left & Calibration Tool on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
                
                {/* Map View */}
                <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-2 relative flex justify-center">
                  <div 
                    className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-all" 
                    style={{ 
                      aspectRatio: mapConfig.activeMapMode === 'enhanced' ? '768 / 1376' : '4 / 3',
                      maxWidth: mapConfig.activeMapMode === 'enhanced' ? '500px' : '100%',
                    }}
                  >
                    <img
                      src={currentMapImage}
                      alt="Plano Almacén"
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />

                    {/* Interactive Dock Zone Markers */}
                    {mapZones.map((zone) => {
                      const isSelected = selectedDockZone?.id === zone.id;
                      const hasRoutes = routes.some((r) => r.muelleId === zone.code || r.zona?.includes(zone.code));

                      return (
                        <div
                          key={zone.id}
                          onClick={() => setSelectedDockZone(zone)}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center ${
                            isSelected
                              ? 'ring-4 ring-amber-400 bg-amber-500/40 z-30 shadow-2xl scale-110'
                              : hasRoutes
                              ? 'ring-2 ring-emerald-400 bg-emerald-500/20 hover:scale-105 z-20'
                              : 'ring-1 ring-blue-500/40 bg-blue-500/10 hover:bg-blue-500/30 z-10'
                          }`}
                          style={{
                            left: `${zone.textX || zone.x}%`,
                            top: `${zone.textY || zone.y}%`,
                            width: `${zone.width}%`,
                            height: `${zone.height}%`,
                          }}
                        >
                          <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap flex items-center justify-center ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 ring-1 ring-white'
                              : hasRoutes
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-900/95 text-blue-300 border border-slate-700'
                          }`}>
                            {zone.code}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    💡 Haz clic en cualquier muelle para ver y calibrar sus coordenadas en tiempo real.
                  </p>
                </div>

                {/* Right: Dock Zone Fine-Tuning Panel */}
                <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  {selectedDockZone ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block">
                            Muelle Seleccionado
                          </span>
                          <h3 className="text-base font-bold text-white">
                            {selectedDockZone.label} ({selectedDockZone.code})
                          </h3>
                        </div>
                        <button
                          onClick={() => handleDeleteDockZone(selectedDockZone.id, selectedDockZone.label)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                          title="Eliminar muelle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Precise Stepper Coordinates */}
                      <div className="space-y-3 text-xs">
                        
                        {/* Position X */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Posición Horizontal X (%)</span>
                            <span className="font-mono font-bold text-white">{selectedDockZone.textX || selectedDockZone.x}%</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateSelectedDockCoordinates('textX', (selectedDockZone.textX || selectedDockZone.x) - 0.5)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                            >
                              -0.5
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.05"
                              value={selectedDockZone.textX || selectedDockZone.x}
                              onChange={(e) => handleUpdateSelectedDockCoordinates('textX', parseFloat(e.target.value))}
                              className="flex-1 accent-amber-500"
                            />
                            <button
                              onClick={() => handleUpdateSelectedDockCoordinates('textX', (selectedDockZone.textX || selectedDockZone.x) + 0.5)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                            >
                              +0.5
                            </button>
                          </div>
                        </div>

                        {/* Position Y */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Posición Vertical Y (%)</span>
                            <span className="font-mono font-bold text-white">{selectedDockZone.textY || selectedDockZone.y}%</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateSelectedDockCoordinates('textY', (selectedDockZone.textY || selectedDockZone.y) - 0.5)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                            >
                              -0.5
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.05"
                              value={selectedDockZone.textY || selectedDockZone.y}
                              onChange={(e) => handleUpdateSelectedDockCoordinates('textY', parseFloat(e.target.value))}
                              className="flex-1 accent-amber-500"
                            />
                            <button
                              onClick={() => handleUpdateSelectedDockCoordinates('textY', (selectedDockZone.textY || selectedDockZone.y) + 0.5)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                            >
                              +0.5
                            </button>
                          </div>
                        </div>

                        {/* Width & Height */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Ancho (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedDockZone.width}
                              onChange={(e) => handleUpdateSelectedDockCoordinates('width', parseFloat(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Alto (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={selectedDockZone.height}
                              onChange={(e) => handleUpdateSelectedDockCoordinates('height', parseFloat(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-xs"
                            />
                          </div>
                        </div>

                        {/* Wall Side */}
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Fachada / Lado</label>
                          <select
                            value={selectedDockZone.wall}
                            onChange={(e) => {
                              const newWall = e.target.value as any;
                              const isRight = newWall === 'right';
                              const isBottom = newWall === 'bottom';
                              const isLeft = newWall === 'left';
                              const updated = { 
                                ...selectedDockZone, 
                                wall: newWall,
                                width: isRight ? 22 : isBottom ? 14 : isLeft ? 20 : 15,
                                height: 3.4,
                              };
                              setSelectedDockZone(updated);
                              const newZones = mapZones.map((z) => (z.id === updated.id ? updated : z));
                              onUpdateMapZones(newZones);
                              apiClient.saveMapZone(updated);
                              apiClient.updateMapZones(newZones);
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                          >
                            <option value="bottom">Fachada Sur (Pared Inferior)</option>
                            <option value="left">Fachada Oeste (Pared Izquierda)</option>
                            <option value="top">Fachada Norte (Pared Superior)</option>
                            <option value="right">Fachada Este (Pared Derecha)</option>
                            <option value="center">Interior / Centro</option>
                          </select>
                        </div>

                        {/* Routes assigned to this dock */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                          <span className="text-slate-400 block font-semibold mb-1">Rutas vinculadas:</span>
                          <div className="flex flex-wrap gap-1">
                            {routes.filter(r => r.muelleId === selectedDockZone.code || r.zona?.includes(selectedDockZone.code)).map(r => (
                              <span key={r.id} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px]">
                                {r.ruta}
                              </span>
                            ))}
                            {routes.filter(r => r.muelleId === selectedDockZone.code || r.zona?.includes(selectedDockZone.code)).length === 0 && (
                              <span className="text-slate-500">Ninguna ruta asignada</span>
                            )}
                          </div>
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={handleSaveDockZoneChanges}
                          className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>Guardar Calibración</span>
                        </button>

                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <Move className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs">Selecciona un muelle en el plano para ajustar sus coordenadas con precisión.</p>
                    </div>
                  )}

                  {/* Quick Dock List */}
                  <div className="pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Lista de Muelles ({mapZones.length})
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 text-xs">
                      {mapZones.map((z) => (
                        <div
                          key={z.id}
                          onClick={() => setSelectedDockZone(z)}
                          className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition ${
                            selectedDockZone?.id === z.id
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <div className="font-mono font-semibold">{z.code}</div>
                          <div className="text-[10px] text-slate-500">{z.wall}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 3: GESTIÓN DE USUARIOS */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span>Control de Usuarios y Permisos</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Gestiona los usuarios autorizados para operar el frontend o administrar el sistema.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadUsers}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Recargar usuarios"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      setNewUsername('');
                      setNewFullName('');
                      setNewUserPassword('');
                      setNewUserRole('user');
                      setIsAddUserOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Nuevo Usuario</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Nombre Completo</th>
                      <th className="py-3 px-4">Rol en el Sistema</th>
                      <th className="py-3 px-4">Último Acceso</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {usersList.map((user: AppUser) => {
                      const isAdmin = user.role === 'admin';
                      const isDiego = user.username.toLowerCase() === 'diego';

                      return (
                        <tr key={user.id} className="hover:bg-slate-900/50 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                isAdmin 
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {user.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{user.username}</span>
                                {isDiego && (
                                  <span className="text-[10px] text-amber-400 font-semibold">Administrador Principal</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-300">
                            {user.fullName || user.username}
                          </td>

                          <td className="py-3 px-4">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold text-[11px]">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Administrador (Backend + Frontend)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-[11px]">
                                <UserCheck className="w-3 h-3" />
                                <span>Operador Normal (Frontend)</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString('es-ES') : 'Pendiente'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setNewUserPassword('');
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                                title="Editar contraseña o nombre"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {!isDiego && (
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Security Hint */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-300">Reglas de Acceso:</strong> Los administradores (como Diego) tienen pestañas superiores para alternar entre el backend de gestión y el frontend operativo. Los operadores normales (como user) acceden directamente al frontend con el botón de deslogear visible en la parte inferior.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TAB 4: PESTAÑA ENVIOS & BOTONES QR */}
        {/* ------------------------------------------------------------ */}
        {activeTab === 'envios' && (
          <div className="space-y-6">
            
            {/* Context Card */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>Pestaña Envíos: Botones Rápidos y Caracteres QR</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      Configuración sincronizada con la nueva pestaña <strong>Envios</strong> de tu hoja de Google Sheets.
                      Columna 1: Texto del botón pulsable. Columna 2: Carácter exacto codificado en el QR.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleTriggerManualSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Hoja Ahora'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingEnvio(null);
                      setFormEnvioTipo('');
                      setFormEnvioQr('');
                      setIsAddEnvioOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Añadir Botón Manual</span>
                  </button>

                  <button
                    onClick={handleResetEnviosDefaults}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700/60 transition cursor-pointer"
                    title="Restablecer los 4 botones por defecto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restablecer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of the 4 Buttons and their QR Codes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {enviosList.map((item: EnvioItem, idx: number) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {(() => {
                            const t = (item.tipo || '').toLowerCase();
                            if (t.includes('verde') || t.includes('autostore')) return 'Verdes';
                            if (t.includes('madera') || (t.includes('palet') && !t.includes('negro')) || t.includes('jaula')) return 'Palets';
                            if (t.includes('negro')) return 'Negros';
                            if (t.includes('vendido') || t.includes('inter') || t.includes('carga')) return 'Vendidos';
                            return ['Verdes', 'Palets', 'Negros', 'Vendidos'][idx] || `Opción ${idx + 1}`;
                          })()}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingEnvio(item);
                          setFormEnvioTipo(item.tipo);
                          setFormEnvioQr(item.qr);
                          setIsAddEnvioOpen(true);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Editar botón"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-bold text-white text-sm line-clamp-2 min-h-[40px]">
                      {item.tipo}
                    </h4>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Carácter QR:
                      </span>
                      <span className="text-xl font-black font-mono text-amber-400">
                        {item.qr || '(vacío)'}
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center">
                      <QrCode className="w-7 h-7 text-slate-950" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Resumen de Datos (Hoja Envios)
              </h4>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Acceso Rápido</th>
                      <th className="py-3 px-4">Columna 1 (Texto del Botón)</th>
                      <th className="py-3 px-4">Columna 2 (Carácter QR)</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {enviosList.map((e: EnvioItem, index: number) => (
                      <tr key={e.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {(() => {
                              const t = (e.tipo || '').toLowerCase();
                              if (t.includes('verde') || t.includes('autostore')) return 'Verdes';
                              if (t.includes('madera') || (t.includes('palet') && !t.includes('negro')) || t.includes('jaula')) return 'Palets';
                              if (t.includes('negro')) return 'Negros';
                              if (t.includes('vendido') || t.includes('inter') || t.includes('carga')) return 'Vendidos';
                              return ['Verdes', 'Palets', 'Negros', 'Vendidos'][index] || `Opción ${index + 1}`;
                            })()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          {e.tipo}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-base font-black px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {e.qr}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingEnvio(e);
                              setFormEnvioTipo(e.tipo);
                              setFormEnvioQr(e.qr);
                              setIsAddEnvioOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition"
                          >
                            <Edit3 className="w-3 h-3 text-amber-400" />
                            <span>Editar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT ROUTE */}
      {/* ============================================================== */}
      {isAddRouteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              <span>{editingRoute ? 'Editar Ruta' : 'Añadir Nueva Ruta'}</span>
            </h3>

            <form onSubmit={handleSaveRouteItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Número de Ruta *</label>
                <input
                  type="text"
                  value={formRuta}
                  onChange={(e) => setFormRuta(e.target.value)}
                  placeholder="Ej: 55043, R0810, C0830"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Código de Carga / Bulto *</label>
                <input
                  type="text"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  placeholder="Ej: 134001000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Descripción o Destino</label>
                <input
                  type="text"
                  value={formTexto}
                  onChange={(e) => setFormTexto(e.target.value)}
                  placeholder="Ej: 55043 LANZADERA LOG"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Zona / Área</label>
                  <input
                    type="text"
                    value={formZona}
                    onChange={(e) => setFormZona(e.target.value)}
                    placeholder="zona 127E00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Muelle</label>
                  <select
                    value={formMuelleId}
                    onChange={(e) => setFormMuelleId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  >
                    {mapZones.map((z) => (
                      <option key={z.id} value={z.code}>
                        {z.code} ({z.dockLabel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRouteOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Guardar Ruta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD DOCK ZONE */}
      {/* ============================================================== */}
      {isAddDockOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-amber-400" />
              <span>Añadir Nuevo Muelle al Plano</span>
            </h3>

            <form onSubmit={handleCreateDockZone} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Código del Muelle *</label>
                <input
                  type="text"
                  value={newDockCode}
                  onChange={(e) => setNewDockCode(e.target.value)}
                  placeholder="Ej: 130E00 o 050F00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Etiqueta</label>
                <input
                  type="text"
                  value={newDockLabel}
                  onChange={(e) => setNewDockLabel(e.target.value)}
                  placeholder="Ej: Zona 130E00"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Fachada / Lado</label>
                <select
                  value={newDockWall}
                  onChange={(e) => {
                    const wall = e.target.value as any;
                    setNewDockWall(wall);
                    if (wall === 'right') {
                      setNewDockX(77);
                      setNewDockY(35);
                    } else if (wall === 'bottom') {
                      setNewDockX(50);
                      setNewDockY(80.5);
                    } else if (wall === 'left') {
                      setNewDockX(20);
                      setNewDockY(50);
                    } else if (wall === 'top') {
                      setNewDockX(50);
                      setNewDockY(10);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="bottom">Fachada Sur (Pared Inferior)</option>
                  <option value="left">Fachada Oeste (Pared Izquierda)</option>
                  <option value="top">Fachada Norte (Pared Superior)</option>
                  <option value="right">Fachada Este (Pared Derecha)</option>
                  <option value="center">Interior / Centro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Posición X (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDockX}
                    onChange={(e) => setNewDockX(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Posición Y (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDockY}
                    onChange={(e) => setNewDockY(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDockOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Crear Muelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT USER */}
      {/* ============================================================== */}
      {(isAddUserOpen || editingUser) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>{editingUser ? `Editar Usuario "${editingUser.username}"` : 'Crear Nuevo Usuario'}</span>
            </h3>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre de Usuario *</label>
                <input
                  type="text"
                  value={editingUser ? editingUser.username : newUsername}
                  onChange={(e) => {
                    if (editingUser) setEditingUser({ ...editingUser, username: e.target.value });
                    else setNewUsername(e.target.value);
                  }}
                  disabled={editingUser?.username.toLowerCase() === 'diego'}
                  placeholder="Ej: operador2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre Completo</label>
                <input
                  type="text"
                  value={editingUser ? editingUser.fullName : newFullName}
                  onChange={(e) => {
                    if (editingUser) setEditingUser({ ...editingUser, fullName: e.target.value });
                    else setNewFullName(e.target.value);
                  }}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Rol</label>
                <select
                  value={editingUser ? editingUser.role : newUserRole}
                  onChange={(e) => {
                    const role = e.target.value as 'admin' | 'user';
                    if (editingUser) setEditingUser({ ...editingUser, role });
                    else setNewUserRole(role);
                  }}
                  disabled={editingUser?.username.toLowerCase() === 'diego'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white disabled:opacity-50"
                >
                  <option value="user">Operador Normal (Acceso solo Frontend)</option>
                  <option value="admin">Administrador (Backend + Frontend)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  {editingUser ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Introduce la clave"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  required={!editingUser}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT ENVIO BUTTON */}
      {/* ============================================================== */}
      {isAddEnvioOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              <span>{editingEnvio ? 'Editar Botón de Envío' : 'Añadir Nuevo Botón de Envío'}</span>
            </h3>

            <form onSubmit={handleSaveEnvioItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Columna 1: Texto del Botón (Tipo / Carga) *
                </label>
                <input
                  type="text"
                  value={formEnvioTipo}
                  onChange={(e) => setFormEnvioTipo(e.target.value)}
                  placeholder="Ej: CajasVerdes y Jaulas-Autostore"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Columna 2: Carácter para el Código QR *
                </label>
                <input
                  type="text"
                  value={formEnvioQr}
                  onChange={(e) => setFormEnvioQr(e.target.value)}
                  placeholder="Ej: # o . o A o 7"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-base font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Este carácter o texto exacto se codificará en el código QR cuando los operadores pulsen el botón.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEnvioOpen(false);
                    setEditingEnvio(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer shadow-md shadow-amber-500/20"
                >
                  {editingEnvio ? 'Guardar Cambios' : 'Añadir Botón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
