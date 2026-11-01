import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  Upload, 
  Download, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Clipboard,
  FileCode,
  RotateCcw
} from 'lucide-react';
import { RouteItem, SyncConfig } from '../types/logistics';
import { 
  fetchGoogleSheetData, 
  parseExcelBuffer, 
  parseCsvText, 
  exportRoutesToExcel, 
  exportRoutesToCsv 
} from '../services/sheetSyncService';
import { INITIAL_ROUTES, INITIAL_RAW_CSV } from '../data/initialData';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SyncConfig;
  onUpdateSyncConfig: (config: Partial<SyncConfig>) => void;
  onRoutesLoaded: (routes: RouteItem[], source: string) => void;
  routes: RouteItem[];
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onUpdateSyncConfig,
  onRoutesLoaded,
  routes,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'excel' | 'paste' | 'export'>('sheets');
  const [sheetUrlInput, setSheetUrlInput] = useState(syncConfig.sheetUrl || '');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(syncConfig.autoSync);
  const [syncInterval, setSyncInterval] = useState(syncConfig.syncIntervalSeconds || 60);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pastedText, setPastedText] = useState('');

  if (!isOpen) return null;

  // Sync Google Sheet now
  const handleSyncGoogleSheet = async () => {
    if (!sheetUrlInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor, introduce el enlace de tu Google Sheet.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const parsedRoutes = await fetchGoogleSheetData(sheetUrlInput);
      onRoutesLoaded(parsedRoutes, 'Google Sheets');
      onUpdateSyncConfig({
        sourceType: 'google_sheets',
        sheetUrl: sheetUrlInput,
        autoSync: autoSyncEnabled,
        syncIntervalSeconds: syncInterval,
        lastSyncTime: new Date().toLocaleTimeString('es-ES'),
        status: 'success',
        rowCount: parsedRoutes.length,
      });
      setStatusMessage({
        type: 'success',
        text: `¡Sincronización exitosa! Se cargaron ${parsedRoutes.length} rutas correctamente.`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al sincronizar';
      onUpdateSyncConfig({
        status: 'error',
        errorMessage: errorMsg,
      });
      setStatusMessage({
        type: 'error',
        text: `Error de sincronización: ${errorMsg}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Excel file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const parsedRoutes = parseExcelBuffer(buffer);
        if (parsedRoutes.length === 0) {
          throw new Error('El archivo no contiene filas legibles de rutas.');
        }
        onRoutesLoaded(parsedRoutes, `Archivo Excel (${file.name})`);
        onUpdateSyncConfig({
          sourceType: 'excel_file',
          lastSyncTime: new Date().toLocaleTimeString('es-ES'),
          status: 'success',
          rowCount: parsedRoutes.length,
        });
        setStatusMessage({
          type: 'success',
          text: `Se importaron ${parsedRoutes.length} rutas desde "${file.name}".`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error procesando el archivo';
        setStatusMessage({ type: 'error', text: msg });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle manual CSV/Text parse
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    try {
      const parsed = parseCsvText(pastedText);
      if (parsed.length === 0) {
        throw new Error('No se detectaron rutas válidas en el texto.');
      }
      onRoutesLoaded(parsed, 'Pegado manual');
      setStatusMessage({
        type: 'success',
        text: `Se cargaron ${parsed.length} rutas desde el texto pegado.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el texto';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  // Restore Initial Sample Data
  const handleRestoreInitial = () => {
    onRoutesLoaded(INITIAL_ROUTES, 'Datos Iniciales');
    setStatusMessage({
      type: 'success',
      text: `Se restablecieron las ${INITIAL_ROUTES.length} rutas de tu archivo (Zona 127E00).`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Sincronización de Rutas y Datos
              </h3>
              <p className="text-xs text-slate-400">
                Conecta tu Google Sheets en tiempo real o importa archivos Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('sheets'); setStatusMessage(null); }}
            className={`px-4 py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'sheets'
                ? 'border-amber-400 text-amber-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Google Sheets (Tiempo Real)</span>
          </button>
          <button
            onClick={() => { setActiveTab('excel'); setStatusMessage(null); }}
            className={`px-4 py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'excel'
                ? 'border-amber-400 text-amber-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => { setActiveTab('paste'); setStatusMessage(null); }}
            className={`px-4 py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'paste'
                ? 'border-amber-400 text-amber-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Pegar Datos</span>
          </button>
          <button
            onClick={() => { setActiveTab('export'); setStatusMessage(null); }}
            className={`px-4 py-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'export'
                ? 'border-amber-400 text-amber-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Plantilla / Exportar</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-3 mx-4 mt-4 rounded-xl text-xs flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-800 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body content based on active tab */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Enlace público o publicado de tu Google Sheet
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleSyncGoogleSheet}
                    disabled={isLoading}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 shrink-0 shadow"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Sincronizando...' : 'Sincronizar'}</span>
                  </button>
                </div>
              </div>

              {/* Auto Sync Settings */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autosync"
                    checked={autoSyncEnabled}
                    onChange={(e) => {
                      setAutoSyncEnabled(e.target.checked);
                      onUpdateSyncConfig({ autoSync: e.target.checked });
                    }}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="autosync" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Actualización automática en tiempo real
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Cada:</span>
                  <select
                    value={syncInterval}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSyncInterval(val);
                      onUpdateSyncConfig({ syncIntervalSeconds: val });
                    }}
                    disabled={!autoSyncEnabled}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs disabled:opacity-50"
                  >
                    <option value={15}>15 segundos</option>
                    <option value={30}>30 segundos</option>
                    <option value={60}>1 minuto</option>
                    <option value={300}>5 minutos</option>
                  </select>
                </div>
              </div>

              {/* Instructions on Google Sheets Setup */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-900/60 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  ¿Cómo configurar tu Google Sheet para que se actualice solo?
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 text-[11px] leading-relaxed">
                  <li>En tu Google Sheet, haz clic en el botón verde <strong className="text-white">"Compartir"</strong> arriba a la derecha.</li>
                  <li>En "Acceso general", selecciona <strong className="text-white">"Cualquier persona con el enlace"</strong> (con rol Lector).</li>
                  <li>Copia el enlace y pégalo en el campo superior.</li>
                  <li>¡Listo! Cualquier cambio que hagas en tu Google Sheet se reflejará automáticamente en la pantalla de los operadores.</li>
                </ol>
              </div>

              {/* Current status info */}
              {syncConfig.lastSyncTime && (
                <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
                  <span>Última sincronización: <strong className="text-white font-mono">{syncConfig.lastSyncTime}</strong></span>
                  <span>Rutas cargadas: <strong className="text-amber-400 font-mono">{routes.length}</strong></span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-2xl p-8 text-center bg-slate-950/50 transition">
                <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">
                  Arrastra tu archivo Excel (.xlsx, .xls) o CSV aquí
                </h4>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Soporta tanto archivos con pestañas por zona como hojas con filas de cabecera de zona (ej: "zona 127E00").
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow transition">
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar Archivo</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Pega texto CSV o datos copiados desde Excel
                </label>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`texto,codigo,ruta\nzona 127E00,,\n55043 LANZADERA LOG,134001000,55043\n55211 INTER SAZASA,134002000,55211`}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleRestoreInitial}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cargar datos originales (127E00)</span>
                </button>

                <button
                  onClick={handleParsePastedText}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Procesar y Cargar Rutas</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Descargar Plantilla Excel</h4>
                  <p className="text-xs text-slate-400">
                    Descarga el formato de hoja listo para rellenar con tus zonas, rutas y códigos.
                  </p>
                </div>
                <button
                  onClick={() => exportRoutesToExcel(routes, 'plantilla_rutas_logistica.xlsx')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar (.xlsx)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Exportar Rutas a CSV</h4>
                  <p className="text-xs text-slate-400">
                    Exporta en formato CSV compatible con la imagen inicial.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const csv = exportRoutesToCsv(routes);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'rutas_reparto_codigos.csv';
                    a.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
