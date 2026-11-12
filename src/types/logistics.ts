export interface RouteItem {
  id: string;
  ruta: string;          // e.g. "55043", "R0810", "C0830"
  codigo: string;        // e.g. "134001000", "130010000"
  texto: string;         // e.g. "55043 LANZADERA LOG" or "LANZADERA LOG"
  zona: string;          // e.g. "zona 127E00"
  muelleId: string;      // e.g. "M-04", "M-12"
  muelleNombre: string;  // e.g. "Muelle 04 (Norte)"
  bahia?: string;        // e.g. "Bahía N-2"
  tipoVehiculo?: string; // e.g. "Tráiler 24t", "Furgón 3.5t", "Rígido"
  instrucciones?: string;// e.g. "Palets estándar. Consolidar frente a puerta."
  horaSalida?: string;   // e.g. "06:30"
  estado?: 'espera' | 'en_carga' | 'completado';
}

export interface ZoneGroup {
  nombre: string;
  rutas: RouteItem[];
}

export interface WarehouseDock {
  id: string;
  nombre: string;
  numero: number;
  lado: 'norte' | 'sur' | 'este' | 'oeste';
  x: number; // percentage in map 0-100
  y: number; // percentage in map 0-100
  capacidad: string;
  ocupadoPor?: string; // route code
}

export interface SyncConfig {
  sourceType: 'google_sheets' | 'excel_file' | 'local';
  sheetUrl: string;
  autoSync: boolean;
  syncIntervalSeconds: number;
  lastSyncTime: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  rowCount: number;
}

export interface ServerSyncState {
  sourceUrl: string;
  sourceType: 'google_sheets';
  autoDailySync: boolean;
  lastDailySync: string | null;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncMessage: string;
  lastSyncCount: number;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user';
  createdAt?: string;
  lastLogin?: string;
  hasPassword?: boolean;
}

export interface MapConfig {
  activeMapMode: 'original' | 'enhanced' | 'cad' | 'custom';
  customMapUrl: string;
  mapTitle: string;
  dockLabelMode: 'text' | 'dock';
  lastModified?: string;
}

export interface WarehouseZoneArea {
  id: string;
  code: string;
  label: string;
  wall: 'bottom' | 'left' | 'top' | 'right' | 'center';
  x: number;
  y: number;
  width: number;
  height: number;
  textX: number;
  textY: number;
  dockX: number;
  dockY: number;
  dockLabel: string;
  description: string;
}

export interface EnvioItem {
  id: string;
  tipo: string;
  qr: string;
  color?: string;
  badge?: string;
  orden?: number;
}

export interface UbicacionItem {
  id: string;
  codigo: string;
  area: string;
  orden?: number;
}

export interface EntreplantaItem {
  id: string;
  codigo: string;
  area: 'Reposición' | 'Ascensor' | string;
  orden?: number;
}


