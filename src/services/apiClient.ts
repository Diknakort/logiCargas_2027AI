import { AppUser, RouteItem, WarehouseZoneArea, MapConfig, EnvioItem, UbicacionItem, EntreplantaItem, AppSection } from '../types/logistics';
import { REAL_WAREHOUSE_ZONES } from '../data/warehouseMapData';
import { INITIAL_ROUTES } from '../data/initialData';
import { DEFAULT_UBICACIONES } from '../data/ubicacionesData';
import { DEFAULT_ENTREPLANTA } from '../data/entreplantaData';

const AUTH_STORAGE_KEY = 'logiruta_auth_user_v1';

export const DEFAULT_ENVIOS_FALLBACK: EnvioItem[] = [
  {
    id: 'envio-1',
    tipo: 'CajasVerdes y Jaulas-Autostore',
    qr: '#',
    color: 'emerald',
    badge: 'Autostore',
    orden: 1,
  },
  {
    id: 'envio-2',
    tipo: 'Palets Madera y JAULAS Jx',
    qr: '.',
    color: 'amber',
    badge: 'Madera / Jx',
    orden: 2,
  },
  {
    id: 'envio-3',
    tipo: 'Palets Negros',
    qr: 'A',
    color: 'zinc',
    badge: 'Negros',
    orden: 3,
  },
  {
    id: 'envio-4',
    tipo: 'Vendidos INTER desde CARGAS',
    qr: '7',
    color: 'indigo',
    badge: 'Cargas INTER',
    orden: 4,
  },
];

// Default initial user session for offline / fallback
export const DEFAULT_USERS_FALLBACK: AppUser[] = [
  {
    id: 'usr-admin-diego',
    username: 'Diego',
    fullName: 'Diego (Administrador)',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-user-normal',
    username: 'user',
    fullName: 'Operador Logístico',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];

export const apiClient = {
  // --- AUTH ---
  getCurrentUser(): AppUser | null {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  },

  setCurrentUser(user: AppUser | null) {
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  async login(username: string, password: string): Promise<AppUser> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        this.setCurrentUser(data.user);
        return data.user;
      }

      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Credenciales incorrectas');
    } catch (err) {
      // Fallback for direct browser testing if backend route isn't reachable
      const trimmedUser = username.trim().toLowerCase();
      if (trimmedUser === 'diego' && password === '1yo1') {
        const adminUser: AppUser = {
          id: 'usr-admin-diego',
          username: 'Diego',
          fullName: 'Diego (Administrador)',
          role: 'admin',
        };
        this.setCurrentUser(adminUser);
        return adminUser;
      } else if (trimmedUser === 'user' && password === '1234') {
        const normalUser: AppUser = {
          id: 'usr-user-normal',
          username: 'user',
          fullName: 'Operador Logístico',
          role: 'user',
        };
        this.setCurrentUser(normalUser);
        return normalUser;
      }
      throw err;
    }
  },

  logout() {
    this.setCurrentUser(null);
  },

  // --- USERS MANAGEMENT ---
  async getUsers(): Promise<AppUser[]> {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API /api/users failed, using fallback:', err);
    }
    return DEFAULT_USERS_FALLBACK;
  },

  async createUser(userData: { 
    username: string; 
    fullName: string; 
    role: 'admin' | 'user' | string; 
    password: string;
    allowedSections?: AppSection[];
    customRoleName?: string;
  }): Promise<AppUser> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear usuario');
    }
    return await res.json();
  },

  async updateUser(id: string, userData: Partial<AppUser> & { password?: string }): Promise<AppUser> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar usuario');
    }
    return await res.json();
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar usuario');
    }
    return true;
  },

  // --- ROUTES & EXCEL ---
  async getRoutes(): Promise<RouteItem[]> {
    try {
      const res = await fetch('/api/routes');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API /api/routes failed, using localStorage fallback');
    }
    const local = localStorage.getItem('logiruta_routes_v3');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // ignore
      }
    }
    return INITIAL_ROUTES;
  },

  async saveRoute(route: RouteItem): Promise<RouteItem> {
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend route save failed:', err);
    }
    return route;
  },

  async deleteRoute(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/routes/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async bulkUploadRoutes(routes: RouteItem[], replace = true): Promise<RouteItem[]> {
    try {
      const res = await fetch('/api/routes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes, replace }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.routes;
      }
    } catch (err) {
      console.warn('Bulk upload failed, keeping local copy:', err);
    }
    return routes;
  },

  async resetRoutes(): Promise<RouteItem[]> {
    try {
      const res = await fetch('/api/routes/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return data.routes;
      }
    } catch (err) {
      console.warn('Reset routes failed:', err);
    }
    return INITIAL_ROUTES;
  },

  // --- MAP ZONES & CONFIG ---
  async getMapZones(): Promise<WarehouseZoneArea[]> {
    try {
      const res = await fetch('/api/map/zones');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API /api/map/zones failed:', err);
    }
    return REAL_WAREHOUSE_ZONES;
  },

  async updateMapZones(zones: WarehouseZoneArea[]): Promise<boolean> {
    try {
      const res = await fetch('/api/map/zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async saveMapZone(zone: WarehouseZoneArea): Promise<WarehouseZoneArea> {
    const res = await fetch('/api/map/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zone),
    });
    if (!res.ok) {
      throw new Error('Error al guardar zona de muelle');
    }
    return await res.json();
  },

  async deleteMapZone(id: string): Promise<boolean> {
    const res = await fetch(`/api/map/zones/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async resetMapZones(): Promise<WarehouseZoneArea[]> {
    try {
      const res = await fetch('/api/map/reset-zones', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return data.zones;
      }
    } catch (err) {
      console.warn('Reset map zones failed:', err);
    }
    return REAL_WAREHOUSE_ZONES;
  },

  async getMapConfig(): Promise<MapConfig> {
    try {
      const res = await fetch('/api/map/config');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API /api/map/config failed:', err);
    }
    return {
      activeMapMode: 'enhanced',
      customMapUrl: '',
      mapTitle: 'Plano General de Almacén y Muelles (Render HD Vertical)',
      dockLabelMode: 'text',
    };
  },

  async updateMapConfig(config: Partial<MapConfig>): Promise<MapConfig> {
    const res = await fetch('/api/map/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      throw new Error('Error al guardar configuración del plano');
    }
    return await res.json();
  },

  async uploadCustomMapImage(imageBase64: string, fileName?: string): Promise<{ url: string; config: MapConfig }> {
    const res = await fetch('/api/map/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, fileName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al subir imagen del plano');
    }
    return await res.json();
  },

  // --- GOOGLE SHEETS DAILY SYNC ---
  async getSyncConfig(): Promise<any> {
    try {
      const res = await fetch('/api/sync/config');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API /api/sync/config failed:', err);
    }
    return {
      sourceUrl: 'https://docs.google.com/spreadsheets/d/1gAIjPGHEfqgKXcZPtvxhWeDLFHxudF_KHRzzocgtF1c/edit?usp=drivesdk',
      sourceType: 'google_sheets',
      autoDailySync: true,
      lastDailySync: null,
      lastSyncStatus: 'idle',
      lastSyncMessage: 'Listo para sincronización',
      lastSyncCount: 0,
    };
  },

  async updateSyncConfig(config: Record<string, any>): Promise<any> {
    const res = await fetch('/api/sync/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      throw new Error('Error al actualizar configuración de sincronización');
    }
    return await res.json();
  },

  async triggerSync(sourceUrl?: string): Promise<{
    success: boolean;
    count: number;
    message: string;
    routes?: RouteItem[];
    envios?: EnvioItem[];
    ubicaciones?: UbicacionItem[];
    entreplanta?: EntreplantaItem[];
  }> {
    const res = await fetch('/api/sync/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Error al ejecutar sincronización');
    }
    return data;
  },

  // --- ENVIOS (QUICK SHIPMENT BUTTONS & QR) ---
  async getEnvios(): Promise<EnvioItem[]> {
    try {
      const res = await fetch('/api/envios');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('API /api/envios failed, using fallback:', err);
    }
    return DEFAULT_ENVIOS_FALLBACK;
  },

  async updateEnvios(envios: EnvioItem[]): Promise<EnvioItem[]> {
    const res = await fetch('/api/envios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ envios }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar lista de envíos');
    }
    const data = await res.json();
    return data.envios || envios;
  },

  async saveEnvio(envio: Partial<EnvioItem>): Promise<EnvioItem> {
    const res = await fetch('/api/envios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envio),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al guardar envío');
    }
    return await res.json();
  },

  async resetEnvios(): Promise<EnvioItem[]> {
    const res = await fetch('/api/envios/reset', { method: 'POST' });
    if (!res.ok) {
      throw new Error('Error al resetear envíos');
    }
    const data = await res.json();
    return data.envios || DEFAULT_ENVIOS_FALLBACK;
  },

  async getUbicaciones(): Promise<UbicacionItem[]> {
    try {
      const res = await fetch('/api/ubicaciones');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('API /api/ubicaciones failed, using fallback:', err);
    }
    return DEFAULT_UBICACIONES;
  },

  async updateUbicaciones(ubicaciones: UbicacionItem[]): Promise<UbicacionItem[]> {
    const res = await fetch('/api/ubicaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ubicaciones }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar lista de ubicaciones');
    }
    const data = await res.json();
    return data.ubicaciones || ubicaciones;
  },

  async getEntreplanta(): Promise<EntreplantaItem[]> {
    try {
      const res = await fetch('/api/entreplanta');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('API /api/entreplanta failed, using fallback:', err);
    }
    return DEFAULT_ENTREPLANTA;
  },

  async updateEntreplanta(entreplanta: EntreplantaItem[]): Promise<EntreplantaItem[]> {
    const res = await fetch('/api/entreplanta', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entreplanta }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar lista de entreplanta');
    }
    const data = await res.json();
    return data.entreplanta || entreplanta;
  },
};


