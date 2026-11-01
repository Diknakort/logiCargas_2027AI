import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware for parsing JSON and large payloads (e.g. base64 images or excel sheets)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for uploaded maps or public assets
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'data', 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploads
app.use('/data/uploads', express.static(UPLOADS_DIR));

// File paths
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ROUTES_FILE = path.join(DATA_DIR, 'routes.json');
const MAP_ZONES_FILE = path.join(DATA_DIR, 'map_zones.json');
const MAP_CONFIG_FILE = path.join(DATA_DIR, 'map_config.json');
const SYNC_CONFIG_FILE = path.join(DATA_DIR, 'sync_config.json');
const ENVIOS_FILE = path.join(DATA_DIR, 'envios.json');
const UBICACIONES_FILE = path.join(DATA_DIR, 'ubicaciones.json');

const DEFAULT_ENVIOS = [
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

const DEFAULT_SYNC_CONFIG = {
  sourceUrl: 'https://docs.google.com/spreadsheets/d/1gAIjPGHEfqgKXcZPtvxhWeDLFHxudF_KHRzzocgtF1c/edit?usp=drivesdk',
  sourceType: 'google_sheets',
  autoDailySync: true,
  lastDailySync: null as string | null,
  lastSyncStatus: 'idle' as 'idle' | 'syncing' | 'success' | 'error',
  lastSyncMessage: 'Listo para sincronización diaria automática',
  lastSyncCount: 0,
};

interface ServerUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  password?: string;
  createdAt: string;
  lastLogin?: string;
}

// Initial seed data
const DEFAULT_USERS: ServerUser[] = [
  {
    id: 'usr-admin-diego',
    username: 'Diego',
    fullName: 'Diego (Administrador)',
    role: 'admin',
    password: '1yo1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-user-normal',
    username: 'user',
    fullName: 'Operador Logístico',
    role: 'user',
    password: '1234',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_MAP_CONFIG = {
  activeMapMode: 'enhanced', // 'enhanced' is Plan Render HD
  customMapUrl: '',
  mapTitle: 'Plano General de Almacén y Muelles (Render HD Vertical)',
  dockLabelMode: 'text', // 'text' | 'dock'
  lastModified: new Date().toISOString(),
};

const DEFAULT_ROUTES = [
  {
    id: '127E00-55043',
    ruta: '55043',
    codigo: '134001000',
    texto: '55043 LANZADERA LOG',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-55211',
    ruta: '55211',
    codigo: '134002000',
    texto: '55211 INTER SAZASA',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-21192',
    ruta: '21192',
    codigo: '138005000',
    texto: '21192 RECOGE ZGZ',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-R0810',
    ruta: 'R0810',
    codigo: '130010000',
    texto: 'R0810 RECOGE LOGROÑO',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-C0830',
    ruta: 'C0830',
    codigo: '130009000',
    texto: 'C0830 LOGROÑO (803-804)',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-C0820',
    ruta: 'C0820',
    codigo: '130008000',
    texto: 'C0820 LOGROÑO (802-809)',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-C0810',
    ruta: 'C0810',
    codigo: '130007000',
    texto: 'C0810 CD LOGROÑO (801-805)',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-R0820',
    ruta: 'R0820',
    codigo: '130011000',
    texto: 'R0820 RECOGE CALAHORRA',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-43081',
    ruta: '43081',
    codigo: '130002000',
    texto: '43081 RUTA RIOJA',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
  {
    id: '127E00-43082',
    ruta: '43082',
    codigo: '130019000',
    texto: '43082 CALAHORRA',
    zona: 'zona 127E00',
    muelleId: '127E00',
    muelleNombre: 'Muelle 127E00',
    bahia: 'Sector 127E00',
  },
];

const DEFAULT_MAP_ZONES = [
  {
    "id": "145C00",
    "code": "145C00",
    "label": "Zona 145C00",
    "wall": "right",
    "x": 77,
    "y": 11.2,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 11.2,
    "dockX": 86,
    "dockY": 11.2,
    "dockLabel": "Muelle 145C00",
    "description": "Muelle superior derecho (el más alto)"
  },
  {
    "id": "142C00",
    "code": "142C00",
    "label": "Zona 142C00",
    "wall": "right",
    "x": 77,
    "y": 15.6,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 15.6,
    "dockX": 86,
    "dockY": 15.6,
    "dockLabel": "Muelle 142C00",
    "description": "Bahía de carga derecha 142C00"
  },
  {
    "id": "140C00",
    "code": "140C00",
    "label": "Zona 140C00",
    "wall": "right",
    "x": 77,
    "y": 20,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 20,
    "dockX": 86,
    "dockY": 20,
    "dockLabel": "Muelle 140C00",
    "description": "Bahía de carga derecha 140C00"
  },
  {
    "id": "138C00",
    "code": "138C00",
    "label": "Zona 138C00",
    "wall": "right",
    "x": 77,
    "y": 24.2,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 24.2,
    "dockX": 86,
    "dockY": 24.2,
    "dockLabel": "Muelle 138C00",
    "description": "Bahía de carga derecha 138C00"
  },
  {
    "id": "135D00",
    "code": "135D00",
    "label": "Zona 135D00",
    "wall": "right",
    "x": 77,
    "y": 28.5,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 28.5,
    "dockX": 86,
    "dockY": 28.5,
    "dockLabel": "Muelle 135D00",
    "description": "Bahía de carga derecha 135D00"
  },
  {
    "id": "127E00",
    "code": "127E00",
    "label": "Zona 127E00",
    "wall": "right",
    "x": 77,
    "y": 33,
    "width": 23,
    "height": 3.6,
    "textX": 77,
    "textY": 33,
    "dockX": 86,
    "dockY": 33,
    "dockLabel": "Muelle / Bahía 127E00",
    "description": "Muelle asignado para Rutas 127E00 (Logroño, Calahorra, Lanzadera)"
  },
  {
    "id": "123E00",
    "code": "123E00",
    "label": "Zona 123E00",
    "wall": "right",
    "x": 77,
    "y": 37.8,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 37.8,
    "dockX": 86,
    "dockY": 37.8,
    "dockLabel": "Muelle 123E00",
    "description": "Bahía derecha 123E00 adyacente a zona Rioja"
  },
  {
    "id": "118F00",
    "code": "118F00",
    "label": "Zona 118F00",
    "wall": "right",
    "x": 77,
    "y": 42.6,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 42.6,
    "dockX": 86,
    "dockY": 42.6,
    "dockLabel": "Muelle 118F00",
    "description": "Bahía derecha 118F00"
  },
  {
    "id": "114F00",
    "code": "114F00",
    "label": "Zona 114F00",
    "wall": "right",
    "x": 77,
    "y": 47.5,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 47.5,
    "dockX": 86,
    "dockY": 47.5,
    "dockLabel": "Muelle 114F00",
    "description": "Bahía derecha 114F00"
  },
  {
    "id": "109F00",
    "code": "109F00",
    "label": "Zona 109F00",
    "wall": "right",
    "x": 77,
    "y": 52.4,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 52.4,
    "dockX": 86,
    "dockY": 52.4,
    "dockLabel": "Muelle 109F00",
    "description": "Bahía derecha 109F00"
  },
  {
    "id": "099F00",
    "code": "099F00",
    "label": "Zona 099F00",
    "wall": "right",
    "x": 77,
    "y": 57.2,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 57.2,
    "dockX": 86,
    "dockY": 57.2,
    "dockLabel": "Muelle 099F00",
    "description": "Bahía derecha 099F00"
  },
  {
    "id": "095F00",
    "code": "095F00",
    "label": "Zona 095F00",
    "wall": "right",
    "x": 77,
    "y": 62.2,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 62.2,
    "dockX": 86,
    "dockY": 62.2,
    "dockLabel": "Muelle 095F00",
    "description": "Bahía derecha 095F00"
  },
  {
    "id": "091F00",
    "code": "091F00",
    "label": "Zona 091F00",
    "wall": "right",
    "x": 77,
    "y": 67.2,
    "width": 22,
    "height": 3.4,
    "textX": 77,
    "textY": 67.2,
    "dockX": 86,
    "dockY": 67.2,
    "dockLabel": "Muelle 091F00",
    "description": "Bahía inferior derecha (el más bajo)"
  },
  {
    "id": "074G00",
    "code": "074G00",
    "label": "Zona 074G00",
    "wall": "bottom",
    "x": 28,
    "y": 80.5,
    "width": 14,
    "height": 3.4,
    "textX": 28,
    "textY": 80.5,
    "dockX": 28,
    "dockY": 84.5,
    "dockLabel": "Muelle 074G00",
    "description": "Muelle inferior 074G00 (inicio izquierda)"
  },
  {
    "id": "076G00",
    "code": "076G00",
    "label": "Zona 076G00",
    "wall": "bottom",
    "x": 35.5,
    "y": 80.5,
    "width": 14,
    "height": 3.4,
    "textX": 35.5,
    "textY": 80.5,
    "dockX": 35.5,
    "dockY": 84.5,
    "dockLabel": "Muelle 076G00",
    "description": "Muelle inferior 076G00"
  },
  {
    "id": "078G00",
    "code": "078G00",
    "label": "Zona 078G00",
    "wall": "bottom",
    "x": 43,
    "y": 80.5,
    "width": 14,
    "height": 3.4,
    "textX": 43,
    "textY": 80.5,
    "dockX": 43,
    "dockY": 84.5,
    "dockLabel": "Muelle 078G00",
    "description": "Muelle inferior central 078G00"
  },
  {
    "id": "080G00",
    "code": "080G00",
    "label": "Zona 080G00",
    "wall": "bottom",
    "x": 50.5,
    "y": 80.5,
    "width": 14,
    "height": 3.4,
    "textX": 50.5,
    "textY": 80.5,
    "dockX": 50.5,
    "dockY": 84.5,
    "dockLabel": "Muelle 080G00",
    "description": "Muelle inferior 080G00"
  },
  {
    "id": "082G00",
    "code": "082G00",
    "label": "Zona 082G00",
    "wall": "bottom",
    "x": 58,
    "y": 80.5,
    "width": 14,
    "height": 3.4,
    "textX": 58,
    "textY": 80.5,
    "dockX": 58,
    "dockY": 84.5,
    "dockLabel": "Muelle 082G00",
    "description": "Muelle inferior 082G00 (extremo derecha)"
  },
  {
    "id": "040F00",
    "code": "040F00",
    "label": "Zona 040F00",
    "wall": "left",
    "x": 20,
    "y": 48,
    "width": 20,
    "height": 3.4,
    "textX": 20,
    "textY": 48,
    "dockX": 12,
    "dockY": 48,
    "dockLabel": "Muelle 040F00",
    "description": "Muelle y Acceso Lateral Izquierdo 040F00"
  }
];

// Helper functions for reading/writing JSON files
function readJsonFile<T>(filePath: string, defaultData: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Initialize seed data on startup
readJsonFile(USERS_FILE, DEFAULT_USERS);
readJsonFile(ROUTES_FILE, DEFAULT_ROUTES);
readJsonFile(MAP_ZONES_FILE, DEFAULT_MAP_ZONES);
readJsonFile(MAP_CONFIG_FILE, DEFAULT_MAP_CONFIG);
readJsonFile(ENVIOS_FILE, DEFAULT_ENVIOS);

// ==========================================
// API ROUTES
// ==========================================

// --- AUTHENTICATION ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const users = readJsonFile(USERS_FILE, DEFAULT_USERS);
  const foundUser = users.find(
    (u) =>
      u.username.trim().toLowerCase() === username.trim().toLowerCase() &&
      u.password === password
  );

  if (!foundUser) {
    return res.status(401).json({ error: 'Credenciales inválidas. Verifica usuario y contraseña.' });
  }

  // Update last login
  foundUser.lastLogin = new Date().toISOString();
  writeJsonFile(USERS_FILE, users);

  // Return user info (without password)
  const { password: _, ...safeUser } = foundUser;
  return res.json({
    success: true,
    user: safeUser,
    token: `token_${safeUser.id}_${Date.now()}`,
  });
});

// --- USERS MANAGEMENT ---
app.get('/api/users', (req, res) => {
  const users = readJsonFile(USERS_FILE, DEFAULT_USERS);
  // Return users with passwords masked or stripped for security
  const safeUsers = users.map(({ password, ...u }) => ({
    ...u,
    hasPassword: Boolean(password),
  }));
  return res.json(safeUsers);
});

app.post('/api/users', (req, res) => {
  const { username, fullName, role, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos' });
  }

  const users = readJsonFile(USERS_FILE, DEFAULT_USERS);
  const exists = users.some(
    (u) => u.username.trim().toLowerCase() === username.trim().toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: `El usuario "${username}" ya existe` });
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: username.trim(),
    fullName: fullName ? fullName.trim() : username.trim(),
    role: role === 'admin' ? 'admin' : 'user',
    password: String(password).trim(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJsonFile(USERS_FILE, users);

  const { password: _, ...safeUser } = newUser;
  return res.status(201).json(safeUser);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, fullName, role, password } = req.body;

  const users = readJsonFile(USERS_FILE, DEFAULT_USERS);
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (username) {
    const exists = users.some(
      (u) => u.id !== id && u.username.trim().toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ error: `El nombre de usuario "${username}" ya está en uso` });
    }
    users[userIndex].username = username.trim();
  }

  if (fullName !== undefined) {
    users[userIndex].fullName = fullName.trim();
  }

  if (role && (role === 'admin' || role === 'user')) {
    // Prevent demoting Diego if he is the main admin
    if (users[userIndex].username.toLowerCase() === 'diego' && role !== 'admin') {
      return res.status(400).json({ error: 'El usuario Diego debe mantener el rol de administrador principal' });
    }
    users[userIndex].role = role;
  }

  if (password) {
    users[userIndex].password = String(password).trim();
  }

  writeJsonFile(USERS_FILE, users);

  const { password: _, ...safeUser } = users[userIndex];
  return res.json(safeUser);
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const users = readJsonFile(USERS_FILE, DEFAULT_USERS);
  const target = users.find((u) => u.id === id);

  if (!target) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (target.username.toLowerCase() === 'diego') {
    return res.status(400).json({ error: 'No es posible eliminar al usuario administrador Diego' });
  }

  const updated = users.filter((u) => u.id !== id);
  writeJsonFile(USERS_FILE, updated);
  return res.json({ success: true, message: 'Usuario eliminado correctamente' });
});

// --- ROUTES & EXCEL DATA ---
app.get('/api/routes', (req, res) => {
  const routes = readJsonFile(ROUTES_FILE, DEFAULT_ROUTES);
  return res.json(routes);
});

app.post('/api/routes', (req, res) => {
  const newRoute = req.body;
  if (!newRoute.ruta || !newRoute.codigo) {
    return res.status(400).json({ error: 'Ruta y código son requeridos' });
  }

  const routes = readJsonFile(ROUTES_FILE, DEFAULT_ROUTES);
  const id = newRoute.id || `rt_${Date.now()}_${newRoute.ruta}`;
  const routeToSave = { ...newRoute, id };

  // Replace or add
  const idx = routes.findIndex((r) => r.id === id || r.ruta === newRoute.ruta);
  if (idx >= 0) {
    routes[idx] = routeToSave;
  } else {
    routes.unshift(routeToSave);
  }

  writeJsonFile(ROUTES_FILE, routes);
  return res.json(routeToSave);
});

app.put('/api/routes/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const routes = readJsonFile(ROUTES_FILE, DEFAULT_ROUTES);
  const idx = routes.findIndex((r) => r.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Ruta no encontrada' });
  }

  routes[idx] = { ...routes[idx], ...updatedData, id };
  writeJsonFile(ROUTES_FILE, routes);
  return res.json(routes[idx]);
});

app.delete('/api/routes/:id', (req, res) => {
  const { id } = req.params;
  const routes = readJsonFile(ROUTES_FILE, DEFAULT_ROUTES);
  const updated = routes.filter((r) => r.id !== id);
  writeJsonFile(ROUTES_FILE, updated);
  return res.json({ success: true });
});

app.post('/api/routes/bulk', (req, res) => {
  const { routes: newRoutes, replace } = req.body;
  if (!Array.isArray(newRoutes)) {
    return res.status(400).json({ error: 'Se esperaba un array de rutas' });
  }

  let routes = readJsonFile(ROUTES_FILE, DEFAULT_ROUTES);
  if (replace) {
    routes = newRoutes;
  } else {
    // Append or update existing by ruta
    newRoutes.forEach((nr) => {
      const idx = routes.findIndex((r) => r.ruta === nr.ruta);
      if (idx >= 0) {
        routes[idx] = { ...routes[idx], ...nr };
      } else {
        routes.push(nr);
      }
    });
  }

  writeJsonFile(ROUTES_FILE, routes);
  return res.json({ success: true, count: routes.length, routes });
});

app.post('/api/routes/reset', (req, res) => {
  writeJsonFile(ROUTES_FILE, DEFAULT_ROUTES);
  return res.json({ success: true, count: DEFAULT_ROUTES.length, routes: DEFAULT_ROUTES });
});

// --- ENVIOS (DISPATCH BUTTONS & QR CHARACTERS) ---
app.get('/api/envios', (_req, res) => {
  const envios = readJsonFile(ENVIOS_FILE, DEFAULT_ENVIOS);
  return res.json(envios);
});

app.put('/api/envios', (req, res) => {
  const { envios } = req.body;
  if (!Array.isArray(envios)) {
    return res.status(400).json({ error: 'Se esperaba un array de envíos' });
  }
  writeJsonFile(ENVIOS_FILE, envios);
  return res.json({ success: true, count: envios.length, envios });
});

app.post('/api/envios', (req, res) => {
  const newEnvio = req.body;
  if (!newEnvio.tipo) {
    return res.status(400).json({ error: 'El nombre o tipo de envío es requerido' });
  }
  const envios = readJsonFile(ENVIOS_FILE, DEFAULT_ENVIOS);
  const id = newEnvio.id || `envio-${Date.now()}`;
  const item = {
    id,
    tipo: String(newEnvio.tipo).trim(),
    qr: String(newEnvio.qr ?? '').trim(),
    color: newEnvio.color || 'emerald',
    badge: newEnvio.badge || '',
    orden: Number(newEnvio.orden) || envios.length + 1,
  };
  const idx = envios.findIndex((e) => e.id === id || e.tipo.toLowerCase() === item.tipo.toLowerCase());
  if (idx >= 0) {
    envios[idx] = item;
  } else {
    envios.push(item);
  }
  writeJsonFile(ENVIOS_FILE, envios);
  return res.status(201).json(item);
});

app.post('/api/envios/reset', (_req, res) => {
  writeJsonFile(ENVIOS_FILE, DEFAULT_ENVIOS);
  return res.json({ success: true, count: DEFAULT_ENVIOS.length, envios: DEFAULT_ENVIOS });
});

// --- UBICACIONES (DESUBICAR) ---
app.get('/api/ubicaciones', (_req, res) => {
  const ubicaciones = readJsonFile(UBICACIONES_FILE, []);
  return res.json(ubicaciones);
});

app.put('/api/ubicaciones', (req, res) => {
  const { ubicaciones } = req.body;
  if (!Array.isArray(ubicaciones)) {
    return res.status(400).json({ error: 'Formato inválido para lista de ubicaciones' });
  }
  writeJsonFile(UBICACIONES_FILE, ubicaciones);
  return res.json({ success: true, count: ubicaciones.length, ubicaciones });
});

// --- MAP ZONES & DOCKS ---
app.get('/api/map/zones', (req, res) => {
  const zones = readJsonFile(MAP_ZONES_FILE, DEFAULT_MAP_ZONES);
  return res.json(zones);
});

app.put('/api/map/zones', (req, res) => {
  const { zones } = req.body;
  if (!Array.isArray(zones)) {
    return res.status(400).json({ error: 'Se esperaba un array de zonas' });
  }
  writeJsonFile(MAP_ZONES_FILE, zones);
  return res.json({ success: true, count: zones.length, zones });
});

app.post('/api/map/zones', (req, res) => {
  const newZone = req.body;
  if (!newZone.code || !newZone.label) {
    return res.status(400).json({ error: 'Código y etiqueta de zona son requeridos' });
  }

  const zones = readJsonFile(MAP_ZONES_FILE, DEFAULT_MAP_ZONES);
  const id = newZone.id || newZone.code.trim();
  const zoneToSave = {
    id,
    code: newZone.code.trim(),
    label: newZone.label.trim(),
    wall: newZone.wall || 'bottom',
    x: Number(newZone.x) || 50,
    y: Number(newZone.y) || 50,
    width: Number(newZone.width) || 5.8,
    height: Number(newZone.height) || 7.6,
    textX: Number(newZone.textX || newZone.x) || 50,
    textY: Number(newZone.textY || newZone.y) || 50,
    dockX: Number(newZone.dockX || newZone.x) || 50,
    dockY: Number(newZone.dockY || (Number(newZone.y) - 2)) || 48,
    dockLabel: newZone.dockLabel || `Muelle ${newZone.code}`,
    description: newZone.description || `Zona ${newZone.code}`,
  };

  const idx = zones.findIndex((z) => z.id === id || z.code === zoneToSave.code);
  if (idx >= 0) {
    zones[idx] = zoneToSave;
  } else {
    zones.push(zoneToSave);
  }

  writeJsonFile(MAP_ZONES_FILE, zones);
  return res.status(201).json(zoneToSave);
});

app.put('/api/map/zones/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const zones = readJsonFile(MAP_ZONES_FILE, DEFAULT_MAP_ZONES);
  const idx = zones.findIndex((z) => z.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Zona no encontrada' });
  }

  zones[idx] = { ...zones[idx], ...updatedData, id };
  writeJsonFile(MAP_ZONES_FILE, zones);
  return res.json(zones[idx]);
});

app.delete('/api/map/zones/:id', (req, res) => {
  const { id } = req.params;
  const zones = readJsonFile(MAP_ZONES_FILE, DEFAULT_MAP_ZONES);
  const updated = zones.filter((z) => z.id !== id);
  writeJsonFile(MAP_ZONES_FILE, updated);
  return res.json({ success: true });
});

app.post('/api/map/reset-zones', (req, res) => {
  writeJsonFile(MAP_ZONES_FILE, DEFAULT_MAP_ZONES);
  return res.json({ success: true, count: DEFAULT_MAP_ZONES.length, zones: DEFAULT_MAP_ZONES });
});

// --- MAP CONFIG & UPLOADS ---
app.get('/api/map/config', (req, res) => {
  const config = readJsonFile(MAP_CONFIG_FILE, DEFAULT_MAP_CONFIG);
  return res.json(config);
});

app.put('/api/map/config', (req, res) => {
  const updated = req.body;
  const current = readJsonFile(MAP_CONFIG_FILE, DEFAULT_MAP_CONFIG);
  const newConfig = { ...current, ...updated, lastModified: new Date().toISOString() };
  writeJsonFile(MAP_CONFIG_FILE, newConfig);
  return res.json(newConfig);
});

// Custom map upload endpoint (supports base64 image payload)
app.post('/api/map/upload-image', (req, res) => {
  const { imageBase64, fileName } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Imagen base64 requerida' });
  }

  try {
    // Extract mime type and clean base64
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('svg')) ext = 'svg';
      else if (mime.includes('webp')) ext = 'webp';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    const savedFileName = `custom_map_${Date.now()}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, savedFileName);
    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/data/uploads/${savedFileName}`;

    // Update map config
    const currentConfig = readJsonFile(MAP_CONFIG_FILE, DEFAULT_MAP_CONFIG);
    currentConfig.customMapUrl = publicUrl;
    currentConfig.activeMapMode = 'custom';
    currentConfig.lastModified = new Date().toISOString();
    writeJsonFile(MAP_CONFIG_FILE, currentConfig);

    return res.json({ success: true, url: publicUrl, config: currentConfig });
  } catch (err) {
    console.error('Error saving uploaded map:', err);
    return res.status(500).json({ error: 'Error al guardar la imagen del mapa' });
  }
});

// --- GOOGLE SHEETS DAILY SYNCHRONIZATION ---

function convertToGoogleSheetCsvUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return trimmed;
  }
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    return trimmed;
  }
  const docId = match[1];
  const gidMatch = trimmed.match(/gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
}

function parseRowsToRoutes(rows: Record<string, string | number>[]): any[] {
  const result: any[] = [];
  let currentZone = 'Zona General';

  rows.forEach((row, idx) => {
    const normalizedRow: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      const cleanKey = k.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      normalizedRow[cleanKey] = String(row[k] ?? '').trim();
    });

    const textoVal = normalizedRow['texto'] || normalizedRow['descripcion'] || normalizedRow['nombre'] || '';
    const codigoVal = normalizedRow['codigo'] || normalizedRow['code'] || normalizedRow['cod'] || '';
    const rutaVal = normalizedRow['ruta'] || normalizedRow['n_ruta'] || normalizedRow['numero_ruta'] || '';
    const explicitZona = normalizedRow['zona'] || normalizedRow['area'] || '';

    const isZoneHeader =
      (!codigoVal && !rutaVal && textoVal) ||
      textoVal.toLowerCase().startsWith('zona ') ||
      textoVal.toLowerCase().startsWith('area ') ||
      (explicitZona && !codigoVal && !rutaVal);

    if (isZoneHeader) {
      currentZone = explicitZona || textoVal;
      return;
    }

    if (explicitZona) {
      currentZone = explicitZona;
    }

    if (!rutaVal && !codigoVal && !textoVal) return;

    const routeNumber = rutaVal || (textoVal.match(/^([A-Za-z0-9]+)/)?.[1] || `R-${idx + 1}`);
    const barcodeNumber = (codigoVal && codigoVal !== '0') ? codigoVal : routeNumber;
    const cleanText = textoVal || `Ruta ${routeNumber}`;

    const dockMatch = (explicitZona || currentZone).match(/([0-9]{3}[A-Z]\s*[0-9]{2})/i);
    const muelleId = dockMatch ? dockMatch[1].replace(/\s+/g, '').toUpperCase() : '';
    const muelleNombre = muelleId ? `Muelle ${muelleId}` : (explicitZona || currentZone);
    const bahia = muelleId ? `Sector ${muelleId}` : 'Bahía General';

    result.push({
      id: `${currentZone}-${routeNumber}-${idx}`,
      ruta: routeNumber,
      codigo: barcodeNumber,
      codigoOriginal: codigoVal,
      texto: cleanText,
      zona: currentZone,
      muelleId: muelleId,
      muelleNombre: muelleNombre,
      bahia: bahia,
      tipoVehiculo: normalizedRow['vehiculo'] || normalizedRow['tipo_vehiculo'] || '',
      instrucciones: normalizedRow['instrucciones'] || '',
      horaSalida: normalizedRow['salida'] || '',
      estado: (normalizedRow['estado'] as 'espera' | 'en_carga' | 'completado') || 'espera',
    });
  });

  return result;
}

function parseEnviosSheet(worksheet: XLSX.WorkSheet): any[] {
  const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
  const result: any[] = [];
  const palette = ['emerald', 'amber', 'zinc', 'indigo', 'purple', 'sky'];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !row[0]) continue;
    const tipo = String(row[0]).trim();
    const qr = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : '';
    if (tipo) {
      const color = palette[result.length % palette.length];
      result.push({
        id: `envio-${result.length + 1}`,
        tipo,
        qr,
        color,
        badge: tipo.split(' ')[0] || `Opción ${result.length + 1}`,
        orden: result.length + 1,
      });
    }
  }
  return result;
}

function parseUbicacionesSheet(worksheet: XLSX.WorkSheet): any[] {
  const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
  const result: any[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !row[0]) continue;
    const col0 = String(row[0]).trim();
    const col1 = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : '';
    // Skip header row if present
    if (/^(codigo|ubicacion|ubicaci|location|name)/i.test(col0) && /^(area|zona|zone)/i.test(col1)) {
      continue;
    }
    if (col0 && col1) {
      result.push({
        id: `ub-${result.length + 1}-${col0}`,
        codigo: col0,
        area: col1,
        orden: result.length + 1,
      });
    }
  }
  return result;
}

function parseGoogleSheetCsvToRoutes(csvText: string): any[] {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: '' });
  return parseRowsToRoutes(rows);
}

async function performSyncFromGoogleSheets(customUrl?: string): Promise<{
  success: boolean;
  count: number;
  message: string;
  routes?: any[];
  envios?: any[];
  ubicaciones?: any[];
}> {
  const syncConfig = readJsonFile(SYNC_CONFIG_FILE, DEFAULT_SYNC_CONFIG);
  const targetUrl = customUrl || syncConfig.sourceUrl;

  const docMatch = (targetUrl || '').match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  let parsedRoutes: any[] = [];
  let parsedEnvios: any[] = [];
  let parsedUbicaciones: any[] = [];
  let syncSuccess = false;

  // 1. First try XLSX export which downloads all tabs (including 'Envios', 'Rutas', and 'Ubicaciones')
  if (docMatch && docMatch[1]) {
    try {
      const docId = docMatch[1];
      const xlsxUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=xlsx&_t=${Date.now()}`;
      const response = await fetch(xlsxUrl, {
        headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*' },
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

        // Process Rutas
        const rutasSheetName =
          workbook.SheetNames.find((name) => /ruta/i.test(name)) || workbook.SheetNames[0];
        if (rutasSheetName && workbook.Sheets[rutasSheetName]) {
          const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
            workbook.Sheets[rutasSheetName],
            { defval: '' }
          );
          parsedRoutes = parseRowsToRoutes(rows);
        }

        // Process Envios (quick shipment QR codes)
        const enviosSheetName = workbook.SheetNames.find((name) => /envio/i.test(name));
        if (enviosSheetName && workbook.Sheets[enviosSheetName]) {
          parsedEnvios = parseEnviosSheet(workbook.Sheets[enviosSheetName]);
          if (parsedEnvios.length > 0) {
            writeJsonFile(ENVIOS_FILE, parsedEnvios);
            console.log(`[LogiRuta] Pestaña Envíos sincronizada: ${parsedEnvios.length} botones QR cargados`);
          }
        }

        // Process Ubicaciones (Desubicar barcode locations)
        const ubicacionesSheetName = workbook.SheetNames.find((name) => /ubicaci/i.test(name));
        if (ubicacionesSheetName && workbook.Sheets[ubicacionesSheetName]) {
          parsedUbicaciones = parseUbicacionesSheet(workbook.Sheets[ubicacionesSheetName]);
          if (parsedUbicaciones.length > 0) {
            writeJsonFile(UBICACIONES_FILE, parsedUbicaciones);
            console.log(`[LogiRuta] Pestaña Ubicaciones sincronizada: ${parsedUbicaciones.length} ubicaciones cargadas`);
          }
        }

        if (parsedRoutes.length > 0) {
          syncSuccess = true;
        }
      }
    } catch (xlsxErr) {
      console.warn('[LogiRuta] Error al descargar formato XLSX, intentando fallback CSV:', xlsxErr);
    }
  }

  // 2. Fallback to CSV if XLSX was not successful
  if (!syncSuccess) {
    const csvUrl = convertToGoogleSheetCsvUrl(targetUrl);
    if (!csvUrl) {
      const errorMsg = 'URL de Google Sheets no válida';
      syncConfig.lastSyncStatus = 'error';
      syncConfig.lastSyncMessage = errorMsg;
      writeJsonFile(SYNC_CONFIG_FILE, syncConfig);
      return { success: false, count: 0, message: errorMsg };
    }

    try {
      const urlWithCacheBust = csvUrl.includes('?') ? `${csvUrl}&_t=${Date.now()}` : `${csvUrl}?_t=${Date.now()}`;
      const response = await fetch(urlWithCacheBust, {
        method: 'GET',
        headers: { Accept: 'text/csv,text/plain,*/*' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: No se pudo descargar la hoja de Google`);
      }

      const csvText = await response.text();
      parsedRoutes = parseGoogleSheetCsvToRoutes(csvText);

      if (parsedRoutes.length === 0) {
        throw new Error('El archivo se descargó pero no se encontraron filas de rutas válidas');
      }

      syncSuccess = true;
    } catch (csvErr: any) {
      const errorMsg = csvErr?.message || 'Error desconocido durante la sincronización';
      syncConfig.lastSyncStatus = 'error';
      syncConfig.lastSyncMessage = errorMsg;
      writeJsonFile(SYNC_CONFIG_FILE, syncConfig);
      console.error('[LogiRuta] Error sincronizando con Google Sheets:', errorMsg);
      return { success: false, count: 0, message: errorMsg };
    }
  }

  // Save parsed routes
  writeJsonFile(ROUTES_FILE, parsedRoutes);

  // If envios wasn't in XLSX, load from file or default
  if (parsedEnvios.length === 0) {
    parsedEnvios = readJsonFile(ENVIOS_FILE, DEFAULT_ENVIOS);
  }

  // Update sync config
  syncConfig.sourceUrl = targetUrl;
  syncConfig.lastDailySync = new Date().toISOString();
  syncConfig.lastSyncStatus = 'success';
  syncConfig.lastSyncCount = parsedRoutes.length;
  syncConfig.lastSyncMessage = `Sincronización exitosa: ${parsedRoutes.length} rutas y ${parsedEnvios.length} envíos cargados`;
  writeJsonFile(SYNC_CONFIG_FILE, syncConfig);

  console.log(`[LogiRuta] Google Sheets sincronizado con éxito: ${parsedRoutes.length} rutas y ${parsedEnvios.length} envíos cargados`);

  // If ubicaciones wasn't in XLSX, load from file
  if (parsedUbicaciones.length === 0) {
    parsedUbicaciones = readJsonFile(UBICACIONES_FILE, []);
  }

  return {
    success: true,
    count: parsedRoutes.length,
    message: syncConfig.lastSyncMessage,
    routes: parsedRoutes,
    envios: parsedEnvios,
    ubicaciones: parsedUbicaciones,
  };
}

function initDailyAutoSync() {
  const syncConfig = readJsonFile(SYNC_CONFIG_FILE, DEFAULT_SYNC_CONFIG);

  // If never synced or last sync is older than 24 hours, perform initial sync
  const lastSyncDate = syncConfig.lastDailySync ? new Date(syncConfig.lastDailySync).getTime() : 0;
  const hoursSinceLast = (Date.now() - lastSyncDate) / (1000 * 60 * 60);

  if ((!syncConfig.lastDailySync || hoursSinceLast >= 24) && syncConfig.autoDailySync) {
    console.log('[LogiRuta] Ejecutando sincronización diaria inicial con Google Sheets...');
    performSyncFromGoogleSheets().catch((err) => {
      console.error('[LogiRuta] Fallo en sincronización inicial:', err);
    });
  }

  // Check every 30 minutes if 24 hours have elapsed for the daily update
  setInterval(() => {
    const currentConfig = readJsonFile(SYNC_CONFIG_FILE, DEFAULT_SYNC_CONFIG);
    if (!currentConfig.autoDailySync) return;

    const lastTime = currentConfig.lastDailySync ? new Date(currentConfig.lastDailySync).getTime() : 0;
    const elapsedHours = (Date.now() - lastTime) / (1000 * 60 * 60);

    if (elapsedHours >= 24) {
      console.log(`[LogiRuta] Han transcurrido ${elapsedHours.toFixed(1)}h. Ejecutando actualización diaria desde Google Sheets...`);
      performSyncFromGoogleSheets().catch((err) => {
        console.error('[LogiRuta] Error en actualización periódica diaria:', err);
      });
    }
  }, 30 * 60 * 1000);
}

// Sync API Endpoints
app.get('/api/sync/config', (_req, res) => {
  const config = readJsonFile(SYNC_CONFIG_FILE, DEFAULT_SYNC_CONFIG);
  return res.json(config);
});

app.put('/api/sync/config', (req, res) => {
  const current = readJsonFile(SYNC_CONFIG_FILE, DEFAULT_SYNC_CONFIG);
  const updated = { ...current, ...req.body };
  writeJsonFile(SYNC_CONFIG_FILE, updated);
  return res.json(updated);
});

app.post('/api/sync/trigger', async (req, res) => {
  const { sourceUrl } = req.body || {};
  const result = await performSyncFromGoogleSheets(sourceUrl);
  if (!result.success) {
    return res.status(500).json(result);
  }
  return res.json(result);
});

// ==========================================
// VITE INTEGRATION / SPA SERVING
// ==========================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LogiRuta] Servidor backend ejecutándose en http://0.0.0.0:${PORT}`);
    try {
      // Initialize automatic daily synchronization
      initDailyAutoSync();
    } catch (e) {
      console.error('[LogiRuta] Error al iniciar sincronización automática:', e);
    }
  });

  server.on('error', (err: any) => {
    console.error('[LogiRuta] Error en servidor HTTP:', err);
  });
}

startServer();
