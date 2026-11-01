import * as XLSX from 'xlsx';
import { RouteItem } from '../types/logistics';
import { matchZoneToWarehouseArea } from '../data/warehouseMapData';
export { matchZoneToWarehouseArea };

const LOCAL_STORAGE_ROUTES_KEY = 'logiruta_routes_v3';
const LOCAL_STORAGE_SYNC_KEY = 'logiruta_sync_config_v3';
export const DEFAULT_GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1gAIjPGHEfqgKXcZPtvxhWeDLFHxudF_KHRzzocgtF1c/edit?usp=drivesdk';

/**
 * Universal parser for uploaded file (supports .xlsx, .xls, .csv)
 */
export function parseExcelOrCsv(buffer: ArrayBuffer, fileName: string): RouteItem[] {
  if (fileName.toLowerCase().endsWith('.csv')) {
    const textDecoder = new TextDecoder('utf-8');
    const text = textDecoder.decode(buffer);
    return parseCsvText(text);
  }
  return parseExcelBuffer(buffer);
}

/**
 * Transforms any Google Sheet URL to its direct CSV export link
 */
export function convertToGoogleSheetCsvUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Already a published CSV or export CSV link
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return trimmed;
  }

  // Extract Spreadsheet ID from standard Google Sheets URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    return trimmed;
  }

  const docId = match[1];
  const gidMatch = trimmed.match(/gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
}

/**
 * Parse rows into structured RouteItem array strictly from provided Excel/CSV data
 */
export function parseRawDataToRoutes(rows: Record<string, string | number>[]): RouteItem[] {
  const result: RouteItem[] = [];
  let currentZone = 'zona general';

  rows.forEach((row, idx) => {
    // Normalize keys to lowercase
    const normalizedRow: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      const cleanKey = k.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      normalizedRow[cleanKey] = String(row[k] ?? '').trim();
    });

    const textoVal = normalizedRow['texto'] || normalizedRow['descripcion'] || normalizedRow['nombre'] || normalizedRow['ruta_desc'] || '';
    const codigoVal = normalizedRow['codigo'] || normalizedRow['code'] || normalizedRow['cod'] || normalizedRow['codigo_barras'] || '';
    const rutaVal = normalizedRow['ruta'] || normalizedRow['n_ruta'] || normalizedRow['numero_ruta'] || normalizedRow['route'] || '';
    const explicitZona = normalizedRow['zona'] || normalizedRow['zone'] || normalizedRow['area'] || '';

    // Check if this row is a zone/area header (e.g. "zona 127E00,," or texto contains "zona"/"area")
    const isZoneHeader =
      (!codigoVal && !rutaVal && textoVal) ||
      textoVal.toLowerCase().startsWith('zona ') ||
      textoVal.toLowerCase().startsWith('area ') ||
      (explicitZona && !codigoVal && !rutaVal);

    if (isZoneHeader) {
      currentZone = textoVal || explicitZona;
      return;
    }

    if (explicitZona) {
      currentZone = explicitZona;
    }

    // Only add if there is at least a route or code or text
    if (!rutaVal && !codigoVal && !textoVal) return;

    const routeNumber = rutaVal || (textoVal.match(/^([A-Za-z0-9]+)/)?.[1] || `R-${idx + 1}`);
    // If code is 0 or empty, use route number as scannable barcode
    const barcodeNumber = (codigoVal && codigoVal !== '0') ? codigoVal : routeNumber;
    const cleanText = textoVal || `Ruta ${routeNumber}`;

    // Read muelle if explicitly provided in Excel, or auto-match to the handwritten warehouse area
    const matchedWarehouseZone = matchZoneToWarehouseArea(currentZone);
    const muelleVal = normalizedRow['muelle'] || normalizedRow['muelle_nombre'] || (matchedWarehouseZone ? matchedWarehouseZone.dockLabel : '');
    const muelleId = normalizedRow['muelleid'] || normalizedRow['muelle_id'] || (matchedWarehouseZone ? matchedWarehouseZone.code : (muelleVal ? muelleVal.replace(/\s+/g, '-').toUpperCase() : ''));
    const bahiaVal = normalizedRow['bahia'] || (matchedWarehouseZone ? `Sector ${matchedWarehouseZone.code}` : '');

    result.push({
      id: `${currentZone}-${routeNumber}-${idx}`,
      ruta: routeNumber,
      codigo: barcodeNumber,
      texto: cleanText,
      zona: currentZone,
      muelleId: muelleId,
      muelleNombre: muelleVal,
      bahia: bahiaVal,
      tipoVehiculo: normalizedRow['vehiculo'] || normalizedRow['tipo_vehiculo'] || '',
      instrucciones: normalizedRow['instrucciones'] || normalizedRow['obs'] || '',
      horaSalida: normalizedRow['salida'] || normalizedRow['hora'] || '',
      estado: (normalizedRow['estado'] as 'espera' | 'en_carga' | 'completado') || 'espera',
    });
  });

  return result;
}

/**
 * Parse CSV text into RouteItems
 */
export function parseCsvText(csvText: string): RouteItem[] {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: '' });
  return parseRawDataToRoutes(rows);
}

/**
 * Parse Excel ArrayBuffer (from file upload) into RouteItems
 * Supports multi-sheet (tabs as zones) or single-sheet
 */
export function parseExcelBuffer(buffer: ArrayBuffer): RouteItem[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const allRoutes: RouteItem[] = [];

  // If there are multiple sheets, check if sheets represent zones
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet, { defval: '' });
    if (rows.length === 0) continue;

    // If workbook has multiple sheets, use sheetName as zone unless already specified
    const parsed = parseRawDataToRoutes(rows);
    if (workbook.SheetNames.length > 1) {
      parsed.forEach((item) => {
        if (!item.zona || item.zona === 'Zona General') {
          item.zona = `Zona ${sheetName}`;
        }
      });
    }
    allRoutes.push(...parsed);
  }

  return allRoutes;
}

/**
 * Fetch Google Sheet via CSV URL with cache-busting
 */
export async function fetchGoogleSheetData(sheetUrl: string): Promise<RouteItem[]> {
  const csvUrl = convertToGoogleSheetCsvUrl(sheetUrl);
  if (!csvUrl) {
    throw new Error('URL de Google Sheets no válida');
  }

  // Append timestamp for cache busting
  const urlWithCacheBust = csvUrl.includes('?')
    ? `${csvUrl}&_t=${Date.now()}`
    : `${csvUrl}?_t=${Date.now()}`;

  const response = await fetch(urlWithCacheBust, {
    method: 'GET',
    headers: {
      Accept: 'text/csv,text/plain,*/*',
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudo descargar la hoja. Verifica que esté configurada con acceso "Cualquier persona con el enlace" o "Publicada en la web".`);
  }

  const csvText = await response.text();
  const routes = parseCsvText(csvText);
  if (routes.length === 0) {
    throw new Error('La hoja se descargó pero no contiene filas válidas de rutas.');
  }

  return routes;
}

/**
 * Local Storage helpers
 */
export function loadSavedRoutes(fallback: RouteItem[]): RouteItem[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_ROUTES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load routes from local storage', e);
  }
  return fallback;
}

export function saveRoutesLocally(routes: RouteItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(routes));
  } catch (e) {
    console.warn('Failed to save routes to local storage', e);
  }
}

/**
 * Export routes to Excel file
 */
export function exportRoutesToExcel(routes: RouteItem[], filename = 'rutas_logistica.xlsx') {
  const exportData = routes.map((r) => ({
    zona: r.zona,
    ruta: r.ruta,
    codigo: r.codigo,
    texto: r.texto,
    muelle: r.muelleNombre,
    bahia: r.bahia || '',
    vehiculo: r.tipoVehiculo || '',
    instrucciones: r.instrucciones || '',
    salida: r.horaSalida || '',
    estado: r.estado || 'espera',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rutas');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export routes to CSV format identical to user's sample
 */
export function exportRoutesToCsv(routes: RouteItem[]): string {
  // Group by zone
  const zonesMap = new Map<string, RouteItem[]>();
  routes.forEach((r) => {
    const list = zonesMap.get(r.zona) || [];
    list.push(r);
    zonesMap.set(r.zona, list);
  });

  const lines: string[] = ['texto,codigo,ruta'];
  zonesMap.forEach((zoneRoutes, zoneName) => {
    lines.push(`${zoneName},,`);
    zoneRoutes.forEach((r) => {
      lines.push(`${r.texto},${r.codigo},${r.ruta}`);
    });
  });

  return lines.join('\n');
}
