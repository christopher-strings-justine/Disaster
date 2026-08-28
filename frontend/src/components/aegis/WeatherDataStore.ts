/**
 * WeatherDataStore — Centralized Open-Meteo data fetching service
 *
 * Strategy:
 * 1. Generate an adaptive grid based on map bounds + zoom level
 * 2. Batch-fetch all needed variables for all grid points
 * 3. Cache results keyed by {model, hour, boundsKey, vars}
 * 4. Debounce map movements to avoid excessive API calls
 * 5. Abort in-flight requests when parameters change
 * 6. Gracefully handle unavailable variables per model
 */

import { LayerId, getOpenMeteoModel, LAYER_CONFIGS } from './layerConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GridPoint {
  lat: number;
  lng: number;
  row: number;
  col: number;
}

export interface WeatherPoint {
  lat: number;
  lng: number;
  /** All available variables at this point for the target hour */
  data: Record<string, number | null>;
}

export interface GridData {
  points: WeatherPoint[];
  rows: number;
  cols: number;
  bounds: MapBounds;
  model: string;
  forecastHour: number;
  fetchedAt: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const MAX_CACHE_ENTRIES = 30;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  key: string;
  data: GridData;
  accessedAt: number;
}

const cache = new Map<string, CacheEntry>();

function makeCacheKey(
  bounds: MapBounds,
  zoom: number,
  model: string,
  hour: number,
  vars: string[]
): string {
  const roundedBounds = {
    n: Math.round(bounds.north * 10) / 10,
    s: Math.round(bounds.south * 10) / 10,
    e: Math.round(bounds.east * 10) / 10,
    w: Math.round(bounds.west * 10) / 10,
  };
  return `${JSON.stringify(roundedBounds)}_z${zoom}_${model}_h${hour}_${vars.sort().join(',')}`;
}

function pruneCache() {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  // Remove oldest accessed entries
  const entries = Array.from(cache.entries()).sort(
    (a, b) => a[1].accessedAt - b[1].accessedAt
  );
  const toDelete = entries.slice(0, cache.size - MAX_CACHE_ENTRIES);
  toDelete.forEach(([k]) => cache.delete(k));
}

// ─── Grid Generation ──────────────────────────────────────────────────────────

function getGridSize(zoom: number): { rows: number; cols: number } {
  if (zoom <= 3) return { rows: 4, cols: 5 };
  if (zoom <= 5) return { rows: 5, cols: 7 };
  if (zoom <= 7) return { rows: 6, cols: 8 };
  if (zoom <= 9) return { rows: 7, cols: 9 };
  return { rows: 8, cols: 10 };
}

function generateGrid(bounds: MapBounds, zoom: number): GridPoint[] {
  const { rows, cols } = getGridSize(zoom);
  const points: GridPoint[] = [];

  const latStep = (bounds.north - bounds.south) / (rows - 1);
  const lngStep = (bounds.east - bounds.west) / (cols - 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      points.push({
        lat: bounds.south + r * latStep,
        lng: bounds.west + c * lngStep,
        row: r,
        col: c,
      });
    }
  }
  return points;
}

// ─── Open-Meteo Variable Validation ──────────────────────────────────────────

// Variables NOT available on specific models (graceful degradation)
const MODEL_UNAVAILABLE_VARS: Record<string, string[]> = {
  'gfs_seamless': ['lightning_potential', 'cape'],
  'icon_seamless': [
    'lightning_potential', 'cape',
    'wind_speed_1000hPa', 'wind_direction_1000hPa', 'temperature_1000hPa',
    'wind_speed_925hPa', 'wind_direction_925hPa', 'temperature_925hPa',
    'wind_speed_700hPa', 'wind_direction_700hPa',
    'wind_speed_300hPa', 'wind_direction_300hPa',
    'relative_humidity_1000hPa', 'relative_humidity_925hPa',
    'geopotential_height_1000hPa', 'geopotential_height_925hPa',
    'dew_point_2m', 'apparent_temperature',
  ],
  'ecmwf_ifs025': [],
};

// All valid hourly surface variables (Open-Meteo v1)
const VALID_HOURLY_SURFACE_VARS = new Set([
  'temperature_2m', 'relative_humidity_2m', 'dew_point_2m',
  'apparent_temperature', 'precipitation_probability',
  'precipitation', 'rain', 'showers', 'snowfall',
  'snow_depth', 'weather_code',
  'pressure_msl', 'surface_pressure',
  'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',
  'visibility',
  'wind_speed_10m', 'wind_speed_80m',
  'wind_direction_10m', 'wind_direction_80m',
  'wind_gusts_10m', 'cape', 'lightning_potential',
]);

const VALID_PRESSURE_VARS = new Set([
  'temperature_1000hPa', 'temperature_925hPa', 'temperature_850hPa',
  'temperature_700hPa', 'temperature_500hPa', 'temperature_300hPa',
  'wind_speed_1000hPa', 'wind_speed_925hPa', 'wind_speed_850hPa',
  'wind_speed_700hPa', 'wind_speed_500hPa', 'wind_speed_300hPa',
  'wind_direction_1000hPa', 'wind_direction_925hPa', 'wind_direction_850hPa',
  'wind_direction_700hPa', 'wind_direction_500hPa', 'wind_direction_300hPa',
  'relative_humidity_1000hPa', 'relative_humidity_850hPa',
  'relative_humidity_700hPa', 'relative_humidity_500hPa',
  'geopotential_height_1000hPa', 'geopotential_height_850hPa',
  'geopotential_height_500hPa', 'geopotential_height_925hPa',
  'geopotential_height_700hPa', 'geopotential_height_300hPa',
]);

function filterVarsForModel(vars: string[], modelStr: string): {
  surfaceVars: string[];
  pressureVars: string[];
} {
  const unavailable = new Set(MODEL_UNAVAILABLE_VARS[modelStr] ?? []);
  const allowed = vars.filter(v => !unavailable.has(v));

  const surfaceVars = allowed.filter(v => VALID_HOURLY_SURFACE_VARS.has(v));
  const pressureVars = allowed.filter(v => VALID_PRESSURE_VARS.has(v));

  return { surfaceVars, pressureVars };
}

// ─── Batch Fetch ──────────────────────────────────────────────────────────────

const BATCH_SIZE = 20; // points per request (stay conservative)

async function fetchBatch(
  points: GridPoint[],
  surfaceVars: string[],
  pressureVars: string[],
  modelStr: string,
  forecastHour: number,
  signal: AbortSignal
): Promise<WeatherPoint[]> {
  if (surfaceVars.length === 0 && pressureVars.length === 0) {
    return points.map(p => ({ lat: p.lat, lng: p.lng, data: {} }));
  }

  const lats = points.map(p => p.lat.toFixed(4)).join(',');
  const lngs = points.map(p => p.lng.toFixed(4)).join(',');

  const params = new URLSearchParams({
    latitude: lats,
    longitude: lngs,
    models: modelStr,
    forecast_days: '7',
    timezone: 'UTC',
  });

  if (surfaceVars.length > 0) params.set('hourly', surfaceVars.join(','));
  if (pressureVars.length > 0) params.set('hourly', [...surfaceVars, ...pressureVars].join(','));

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Open-Meteo responded with ${res.status}`);
  const json = await res.json();

  // Open-Meteo returns array of results when multiple coordinates given
  const results: any[] = Array.isArray(json) ? json : [json];

  return results.map((r, i) => {
    const pt = points[i];
    if (!pt) return { lat: 0, lng: 0, data: {} };

    const hourly = r.hourly ?? {};
    const data: Record<string, number | null> = {};
    const allVars = [...surfaceVars, ...pressureVars];

    for (const v of allVars) {
      const arr = hourly[v];
      if (Array.isArray(arr) && forecastHour < arr.length) {
        data[v] = arr[forecastHour] ?? null;
      } else {
        data[v] = null;
      }
    }

    return { lat: pt.lat, lng: pt.lng, data };
  });
}

// ─── Active abort controllers ─────────────────────────────────────────────────
let activeController: AbortController | null = null;

// ─── Main Export ──────────────────────────────────────────────────────────────

export interface FetchGridOptions {
  bounds: MapBounds;
  zoom: number;
  model: string;            // 'ECMWF' | 'GFS' | 'ICON'
  forecastHour: number;
  layerIds: LayerId[];
  extraVars?: string[];
  onProgress?: (loaded: number, total: number) => void;
}

export async function fetchGridData(opts: FetchGridOptions): Promise<GridData> {
  const { bounds, zoom, model, forecastHour, layerIds, extraVars = [] } = opts;
  const modelStr = getOpenMeteoModel(model);

  // Collect all needed variables
  const neededVarSet = new Set<string>(extraVars);
  for (const id of layerIds) {
    const cfg = LAYER_CONFIGS[id];
    if (cfg) cfg.openMeteoVars.forEach(v => neededVarSet.add(v));
  }
  const allVars = Array.from(neededVarSet);
  const { surfaceVars, pressureVars } = filterVarsForModel(allVars, modelStr);

  // Check cache
  const cacheKey = makeCacheKey(bounds, zoom, model, forecastHour, [...surfaceVars, ...pressureVars]);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.data.fetchedAt < CACHE_TTL_MS) {
    cached.accessedAt = Date.now();
    return cached.data;
  }

  // Cancel any in-flight request
  if (activeController) {
    activeController.abort();
  }
  activeController = new AbortController();
  const { signal } = activeController;

  // Generate grid
  const grid = generateGrid(bounds, zoom);
  const { rows, cols } = getGridSize(zoom);

  // Split into batches
  const batches: GridPoint[][] = [];
  for (let i = 0; i < grid.length; i += BATCH_SIZE) {
    batches.push(grid.slice(i, i + BATCH_SIZE));
  }

  const allPoints: WeatherPoint[] = [];
  let loadedBatches = 0;

  for (const batch of batches) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const pts = await fetchBatch(batch, surfaceVars, pressureVars, modelStr, forecastHour, signal);
    allPoints.push(...pts);
    loadedBatches++;
    opts.onProgress?.(loadedBatches, batches.length);
  }

  const gridData: GridData = {
    points: allPoints,
    rows,
    cols,
    bounds,
    model,
    forecastHour,
    fetchedAt: Date.now(),
  };

  // Store in cache
  cache.set(cacheKey, { key: cacheKey, data: gridData, accessedAt: Date.now() });
  pruneCache();

  return gridData;
}

/** Fetch weather data for a single point (used by location click panel) */
export async function fetchPointData(
  lat: number,
  lng: number,
  model: string,
  forecastHour: number,
  vars: string[]
): Promise<Record<string, number | null>> {
  const modelStr = getOpenMeteoModel(model);
  const { surfaceVars, pressureVars } = filterVarsForModel(vars, modelStr);
  const allVars = [...surfaceVars, ...pressureVars];

  if (allVars.length === 0) return {};

  const params = new URLSearchParams({
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
    models: modelStr,
    forecast_days: '7',
    timezone: 'UTC',
    hourly: allVars.join(','),
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = await res.json();

  const hourly = json.hourly ?? {};
  const data: Record<string, number | null> = {};
  for (const v of allVars) {
    const arr = hourly[v];
    data[v] = Array.isArray(arr) && forecastHour < arr.length ? (arr[forecastHour] ?? null) : null;
  }
  return data;
}

/** Get which vars are unavailable for a model (for UI warnings) */
export function getUnavailableVars(vars: string[], model: string): string[] {
  const modelStr = getOpenMeteoModel(model);
  const unavailable = new Set(MODEL_UNAVAILABLE_VARS[modelStr] ?? []);
  return vars.filter(v => unavailable.has(v));
}

/** Clear all cached data */
export function clearCache() {
  cache.clear();
}
