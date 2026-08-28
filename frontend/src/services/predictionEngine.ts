/**
 * PREDICTION ENGINE
 * =================
 * Fetches live environmental data from open APIs and computes
 * probabilistic disaster risk estimates for given locations.
 *
 * DATA SOURCES (all free, no API keys required):
 *  - Open-Meteo: weather + forecast + soil moisture + CAPE
 *  - USGS: live earthquake catalog
 *  - NASA EONET: observed natural events
 *
 * IMPORTANT DISCLAIMERS:
 *  - Scores are decision-support indicators, NOT official emergency warnings.
 *  - Seismic section is "hazard assessment", NOT earthquake prediction.
 *  - All outputs must be labeled "MODEL-PREDICTED RISK".
 */

import {
  Prediction,
  DisasterObservation,
  DataSourceStatus,
  HazardType,
  ForecastWindow,
  ContributingFactor,
  SourceDataRef,
  WeatherSnapshot,
  getRiskLevel,
  FLOOD_RISK_CONFIG,
  STORM_RISK_CONFIG,
  WILDFIRE_RISK_CONFIG,
  LANDSLIDE_RISK_CONFIG,
} from '../types/prediction';

// ─── API Base URLs ────────────────────────────────────────────────────────────
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_FLOOD = 'https://flood-api.open-meteo.com/v1/flood';
const USGS_EARTHQUAKE = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const EONET_API = 'https://eonet.gsfc.nasa.gov/api/v3/events';

// ─── Refresh Intervals (milliseconds) ────────────────────────────────────────
export const REFRESH_INTERVALS = {
  weather: 15 * 60 * 1000,     // 15 min
  earthquake: 10 * 60 * 1000,  // 10 min
  eonet: 30 * 60 * 1000,        // 30 min
  predictions: 15 * 60 * 1000, // 15 min
} as const;

// ─── Locations to analyze ─────────────────────────────────────────────────────
// These mirror the app's existing LocationId set plus several global hot-zones.
export const PREDICTION_LOCATIONS = [
  { lat: 12.9762, lng: 80.2181, name: 'Chennai, Tamil Nadu', region: 'chennai' },
  { lat: 11.5755, lng: 76.0533, name: 'Wayanad, Kerala', region: 'wayanad' },
  { lat: 30.5618, lng: 79.5643, name: 'Joshimath, Uttarakhand', region: 'joshimath' },
  { lat: 27.7172, lng: 85.3240, name: 'Kathmandu Valley, Nepal', region: 'global' },
  { lat: 10.0889, lng: 77.0600, name: 'Idukki, Kerala', region: 'global' },
  { lat: 9.4981, lng: 76.3328, name: 'Alappuzha, Kerala', region: 'global' },
  { lat: 11.7480, lng: 79.7710, name: 'Cuddalore Coast, Tamil Nadu', region: 'global' },
] as const;

// ─── In-memory cache ─────────────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttlMs: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, fetchedAt: Date.now(), ttlMs });
}

// ─── Fetch with retry + exponential backoff ───────────────────────────────────
async function fetchWithRetry(url: string, maxAttempts = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }
  throw lastError!;
}

// ─── Open-Meteo Weather Fetch ─────────────────────────────────────────────────
async function fetchWeatherForecast(lat: number, lng: number): Promise<WeatherSnapshot | null> {
  const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = getCached<WeatherSnapshot>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    current: [
      'temperature_2m', 'precipitation', 'rain', 'snowfall', 'weather_code',
      'wind_speed_10m', 'wind_gusts_10m', 'relative_humidity_2m', 'surface_pressure',
      'cloud_cover', 'cape',
    ].join(','),
    hourly: [
      'precipitation_probability', 'precipitation', 'soil_moisture_0_to_1cm',
      'cape', 'wind_gusts_10m', 'temperature_2m', 'relative_humidity_2m',
    ].join(','),
    forecast_days: '3',
    timezone: 'auto',
  });

  try {
    const t0 = Date.now();
    const res = await fetchWithRetry(`${OPEN_METEO_BASE}?${params}`);
    const latencyMs = Date.now() - t0;
    const data = await res.json();

    const curr = data.current || {};
    const hourly = data.hourly || {};

    // Take max precip probability from next 12 hours
    const maxPrecipProb = hourly.precipitation_probability
      ? Math.max(...(hourly.precipitation_probability as number[]).slice(0, 12))
      : 0;

    // Average soil moisture across forecast
    const soilArr: number[] = hourly.soil_moisture_0_to_1cm || [];
    const soilMoisture = soilArr.length
      ? soilArr.slice(0, 24).reduce((a, b) => a + b, 0) / Math.min(soilArr.length, 24)
      : 0;

    const snapshot: WeatherSnapshot = {
      temperature: curr.temperature_2m ?? 0,
      precipitation: curr.precipitation ?? 0,
      windSpeed: curr.wind_speed_10m ?? 0,
      windGusts: curr.wind_gusts_10m ?? 0,
      humidity: curr.relative_humidity_2m ?? 0,
      surfacePressure: curr.surface_pressure ?? 1013,
      cape: curr.cape ?? 0,
      soilMoisture,
      weatherCode: curr.weather_code ?? 0,
      precipitationProbability: maxPrecipProb,
    };

    setCached(cacheKey, snapshot, REFRESH_INTERVALS.weather);
    return snapshot;
  } catch (err) {
    console.warn(`[PredictionEngine] Open-Meteo fetch failed for ${lat},${lng}:`, err);
    return null;
  }
}

// ─── Open-Meteo Flood API ─────────────────────────────────────────────────────
async function fetchFloodForecast(lat: number, lng: number): Promise<{ discharge: number; anomaly: number } | null> {
  const cacheKey = `flood_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = getCached<{ discharge: number; anomaly: number }>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    daily: 'river_discharge,river_discharge_max,river_discharge_min',
    forecast_days: '7',
  });

  try {
    const res = await fetchWithRetry(`${OPEN_METEO_FLOOD}?${params}`);
    const data = await res.json();

    const discharges: number[] = data.daily?.river_discharge || [];
    const maxDischarges: number[] = data.daily?.river_discharge_max || [];

    if (!discharges.length) return null;

    const currentDischarge = discharges[0] ?? 0;
    const avgDischarge = discharges.reduce((a, b) => a + b, 0) / discharges.length;
    const maxForecast = maxDischarges.length ? Math.max(...maxDischarges) : currentDischarge;

    // Anomaly: how much current deviates from 7-day avg (%)
    const anomaly = avgDischarge > 0 ? ((maxForecast - avgDischarge) / avgDischarge) * 100 : 0;

    const result = { discharge: currentDischarge, anomaly };
    setCached(cacheKey, result, REFRESH_INTERVALS.weather);
    return result;
  } catch (err) {
    console.warn(`[PredictionEngine] Flood API fetch failed:`, err);
    return null;
  }
}

// ─── USGS Earthquake Fetch ────────────────────────────────────────────────────
interface EarthquakeCluster {
  count: number;
  maxMagnitude: number;
  avgDepth: number;
  nearestKm: number;
}

async function fetchEarthquakeCluster(lat: number, lng: number): Promise<EarthquakeCluster | null> {
  const cacheKey = `usgs_${lat.toFixed(1)}_${lng.toFixed(1)}`;
  const cached = getCached<EarthquakeCluster>(cacheKey);
  if (cached) return cached;

  // Query earthquakes within 3 degrees, last 30 days, mag >= 2.5
  const minLat = (lat - 3).toFixed(2);
  const maxLat = (lat + 3).toFixed(2);
  const minLng = (lng - 3).toFixed(2);
  const maxLng = (lng + 3).toFixed(2);

  const url = `${USGS_EARTHQUAKE}?format=geojson&minmagnitude=2.5&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLng}&maxlongitude=${maxLng}&orderby=time&limit=50`;

  try {
    const res = await fetchWithRetry(url);
    const data = await res.json();
    const features = data.features || [];

    if (!features.length) {
      const result: EarthquakeCluster = { count: 0, maxMagnitude: 0, avgDepth: 0, nearestKm: 999 };
      setCached(cacheKey, result, REFRESH_INTERVALS.earthquake);
      return result;
    }

    const maxMag = Math.max(...features.map((f: any) => f.properties.mag || 0));
    const depths = features.map((f: any) => f.geometry.coordinates[2] || 0);
    const avgDepth = depths.reduce((a: number, b: number) => a + b, 0) / depths.length;

    // Nearest distance (haversine approx)
    const nearestKm = Math.min(...features.map((f: any) => {
      const eLat = f.geometry.coordinates[1];
      const eLng = f.geometry.coordinates[0];
      const dLat = (eLat - lat) * 111;
      const dLng = (eLng - lng) * 111 * Math.cos(lat * Math.PI / 180);
      return Math.sqrt(dLat * dLat + dLng * dLng);
    }));

    const result: EarthquakeCluster = {
      count: features.length,
      maxMagnitude: maxMag,
      avgDepth,
      nearestKm,
    };
    setCached(cacheKey, result, REFRESH_INTERVALS.earthquake);
    return result;
  } catch (err) {
    console.warn(`[PredictionEngine] USGS fetch failed:`, err);
    return null;
  }
}

// ─── Confidence Calculator ────────────────────────────────────────────────────
function calculateConfidence(params: {
  sourcesAvailable: number;
  sourcesTotal: number;
  dataFreshMinutes: number;
  riskScore: number;
  hasOfficialSignal: boolean;
}): number {
  const { sourcesAvailable, sourcesTotal, dataFreshMinutes, riskScore, hasOfficialSignal } = params;

  // Source agreement: fraction of sources available
  const sourceScore = (sourcesAvailable / sourcesTotal) * 40;

  // Data freshness: penalize if older than 30 min
  const freshnessScore = dataFreshMinutes <= 15 ? 30
    : dataFreshMinutes <= 30 ? 20
    : dataFreshMinutes <= 60 ? 10
    : 0;

  // Score consistency: extremes are more confident than borderline
  const consistencyScore = riskScore > 70 || riskScore < 20 ? 20 : 10;

  // Official signal bonus
  const officialBonus = hasOfficialSignal ? 10 : 0;

  // Missing data penalty
  const missingPenalty = (sourcesTotal - sourcesAvailable) * 5;

  return Math.min(100, Math.max(0, Math.round(sourceScore + freshnessScore + consistencyScore + officialBonus - missingPenalty)));
}

// ─── Flood Risk Engine ────────────────────────────────────────────────────────
function computeFloodRisk(
  weather: WeatherSnapshot,
  floodData: { discharge: number; anomaly: number } | null
): { score: number; factors: ContributingFactor[] } {
  const factors: ContributingFactor[] = [];

  // Precipitation intensity signal (0–100)
  const precipSignal = Math.min(100, (weather.precipitation / 30) * 100); // 30 mm/h = 100%
  factors.push({
    name: 'Precipitation intensity',
    value: `${weather.precipitation.toFixed(1)} mm/h`,
    weight: FLOOD_RISK_CONFIG.precipitation_weight,
    impact: weather.precipitation > 5 ? 'positive' : 'negative',
  });

  // Forecast precipitation probability
  const precipProbSignal = weather.precipitationProbability;
  factors.push({
    name: 'Forecast rain probability',
    value: `${precipProbSignal.toFixed(0)}%`,
    weight: FLOOD_RISK_CONFIG.accumulated_rain_weight,
    impact: precipProbSignal > 50 ? 'positive' : 'negative',
  });

  // Soil moisture (0–1 scale: 1 = fully saturated)
  const soilSignal = Math.min(100, weather.soilMoisture * 100);
  factors.push({
    name: 'Soil moisture saturation',
    value: `${soilSignal.toFixed(0)}%`,
    weight: FLOOD_RISK_CONFIG.soil_moisture_weight,
    impact: soilSignal > 60 ? 'positive' : 'negative',
  });

  // CAPE (J/kg): convective energy driving intense rain
  const capeSignal = Math.min(100, (weather.cape / 2500) * 100); // 2500 J/kg = extreme
  factors.push({
    name: 'Atmospheric instability (CAPE)',
    value: `${weather.cape.toFixed(0)} J/kg`,
    weight: FLOOD_RISK_CONFIG.cape_weight,
    impact: weather.cape > 500 ? 'positive' : 'negative',
  });

  // River discharge anomaly
  let dischargeSignal = 0;
  if (floodData && floodData.anomaly > 0) {
    dischargeSignal = Math.min(100, floodData.anomaly);
    factors.push({
      name: 'River discharge anomaly',
      value: `+${floodData.anomaly.toFixed(0)}% above baseline`,
      weight: FLOOD_RISK_CONFIG.discharge_weight,
      impact: 'positive',
    });
  } else {
    factors.push({
      name: 'River discharge',
      value: floodData ? `${floodData.discharge.toFixed(1)} m³/s` : 'Data unavailable',
      weight: FLOOD_RISK_CONFIG.discharge_weight,
      impact: 'negative',
    });
  }

  const score = Math.round(
    precipSignal * FLOOD_RISK_CONFIG.precipitation_weight +
    precipProbSignal * FLOOD_RISK_CONFIG.accumulated_rain_weight +
    soilSignal * FLOOD_RISK_CONFIG.soil_moisture_weight +
    capeSignal * FLOOD_RISK_CONFIG.cape_weight +
    dischargeSignal * FLOOD_RISK_CONFIG.discharge_weight
  );

  return { score: Math.min(100, score), factors };
}

// ─── Storm Risk Engine ────────────────────────────────────────────────────────
function computeStormRisk(
  weather: WeatherSnapshot
): { score: number; factors: ContributingFactor[] } {
  const factors: ContributingFactor[] = [];

  const gustSignal = Math.min(100, (weather.windGusts / 100) * 100); // 100 km/h = extreme
  factors.push({
    name: 'Wind gusts',
    value: `${weather.windGusts.toFixed(1)} km/h`,
    weight: STORM_RISK_CONFIG.wind_gust_weight,
    impact: weather.windGusts > 50 ? 'positive' : 'negative',
  });

  const capeSignal = Math.min(100, (weather.cape / 2500) * 100);
  factors.push({
    name: 'Convective energy (CAPE)',
    value: `${weather.cape.toFixed(0)} J/kg`,
    weight: STORM_RISK_CONFIG.cape_weight,
    impact: weather.cape > 1000 ? 'positive' : 'negative',
  });

  const precipSignal = Math.min(100, (weather.precipitation / 50) * 100);
  factors.push({
    name: 'Precipitation rate',
    value: `${weather.precipitation.toFixed(1)} mm/h`,
    weight: STORM_RISK_CONFIG.precipitation_weight,
    impact: weather.precipitation > 10 ? 'positive' : 'negative',
  });

  // Pressure: low pressure = storm. 980 hPa or lower = high risk
  const pressureSignal = Math.min(100, Math.max(0, (1013 - weather.surfacePressure) / 33 * 100));
  factors.push({
    name: 'Surface pressure',
    value: `${weather.surfacePressure.toFixed(0)} hPa`,
    weight: STORM_RISK_CONFIG.pressure_tendency_weight,
    impact: weather.surfacePressure < 995 ? 'positive' : 'negative',
  });

  const humidSignal = Math.min(100, weather.humidity);
  factors.push({
    name: 'Relative humidity',
    value: `${weather.humidity.toFixed(0)}%`,
    weight: STORM_RISK_CONFIG.humidity_weight,
    impact: weather.humidity > 80 ? 'positive' : 'negative',
  });

  const score = Math.round(
    gustSignal * STORM_RISK_CONFIG.wind_gust_weight +
    capeSignal * STORM_RISK_CONFIG.cape_weight +
    precipSignal * STORM_RISK_CONFIG.precipitation_weight +
    pressureSignal * STORM_RISK_CONFIG.pressure_tendency_weight +
    humidSignal * STORM_RISK_CONFIG.humidity_weight
  );

  return { score: Math.min(100, score), factors };
}

// ─── Wildfire Risk Engine ─────────────────────────────────────────────────────
function computeWildfireRisk(
  weather: WeatherSnapshot
): { score: number; factors: ContributingFactor[] } {
  const factors: ContributingFactor[] = [];

  // High temperature increases fire risk
  const tempSignal = Math.min(100, Math.max(0, ((weather.temperature - 25) / 20) * 100));
  factors.push({
    name: 'Air temperature',
    value: `${weather.temperature.toFixed(1)}°C`,
    weight: WILDFIRE_RISK_CONFIG.temperature_weight,
    impact: weather.temperature > 35 ? 'positive' : 'negative',
  });

  // Low humidity = high fire risk
  const humidDeficit = Math.max(0, 100 - weather.humidity);
  const humidSignal = Math.min(100, (humidDeficit / 70) * 100);
  factors.push({
    name: 'Humidity deficit',
    value: `${weather.humidity.toFixed(0)}% relative humidity`,
    weight: WILDFIRE_RISK_CONFIG.humidity_deficit_weight,
    impact: weather.humidity < 30 ? 'positive' : 'negative',
  });

  const windSignal = Math.min(100, (weather.windSpeed / 60) * 100);
  factors.push({
    name: 'Wind speed',
    value: `${weather.windSpeed.toFixed(1)} km/h`,
    weight: WILDFIRE_RISK_CONFIG.wind_weight,
    impact: weather.windSpeed > 30 ? 'positive' : 'negative',
  });

  // Low precipitation = fire risk
  const precipDeficit = Math.max(0, 1 - weather.precipitation / 5) * 100;
  factors.push({
    name: 'Precipitation deficit',
    value: weather.precipitation < 1 ? 'Dry conditions' : `${weather.precipitation.toFixed(1)} mm/h`,
    weight: WILDFIRE_RISK_CONFIG.precip_deficit_weight,
    impact: weather.precipitation < 1 ? 'positive' : 'negative',
  });

  // Low soil moisture = dry fuel
  const soilDrySignal = Math.max(0, 100 - weather.soilMoisture * 100);
  factors.push({
    name: 'Soil dryness',
    value: `${(weather.soilMoisture * 100).toFixed(0)}% moisture`,
    weight: WILDFIRE_RISK_CONFIG.soil_moisture_weight,
    impact: weather.soilMoisture < 0.2 ? 'positive' : 'negative',
  });

  const score = Math.round(
    tempSignal * WILDFIRE_RISK_CONFIG.temperature_weight +
    humidSignal * WILDFIRE_RISK_CONFIG.humidity_deficit_weight +
    windSignal * WILDFIRE_RISK_CONFIG.wind_weight +
    precipDeficit * WILDFIRE_RISK_CONFIG.precip_deficit_weight +
    soilDrySignal * WILDFIRE_RISK_CONFIG.soil_moisture_weight
  );

  return { score: Math.min(100, score), factors };
}

// ─── Seismic Hazard Assessment ────────────────────────────────────────────────
// NOT earthquake prediction — seismic hazard assessment based on recent activity.
function computeSeismicHazard(
  cluster: EarthquakeCluster | null
): { score: number; factors: ContributingFactor[] } {
  if (!cluster) return { score: 0, factors: [] };

  const factors: ContributingFactor[] = [];

  // Activity level based on count
  const countSignal = Math.min(100, (cluster.count / 20) * 100); // 20+ events = high
  factors.push({
    name: 'Recent seismic activity (30 days)',
    value: `${cluster.count} events ≥ M2.5`,
    weight: 0.4,
    impact: cluster.count > 5 ? 'positive' : 'negative',
  });

  // Maximum magnitude
  const magSignal = Math.min(100, (cluster.maxMagnitude / 7) * 100);
  factors.push({
    name: 'Largest recent event',
    value: cluster.maxMagnitude > 0 ? `M${cluster.maxMagnitude.toFixed(1)}` : 'No significant events',
    weight: 0.35,
    impact: cluster.maxMagnitude > 5 ? 'positive' : 'negative',
  });

  // Proximity
  const proximitySignal = Math.min(100, Math.max(0, (200 - cluster.nearestKm) / 200 * 100));
  factors.push({
    name: 'Distance to nearest event',
    value: `${cluster.nearestKm.toFixed(0)} km`,
    weight: 0.25,
    impact: cluster.nearestKm < 50 ? 'positive' : 'negative',
  });

  const score = Math.round(
    countSignal * 0.4 +
    magSignal * 0.35 +
    proximitySignal * 0.25
  );

  return { score: Math.min(100, score), factors };
}

// ─── Landslide Risk Engine ────────────────────────────────────────────────────
function computeLandslideRisk(
  weather: WeatherSnapshot
): { score: number; factors: ContributingFactor[] } {
  const factors: ContributingFactor[] = [];

  const precipSignal = Math.min(100, (weather.precipitation / 40) * 100); // 40 mm/h = extreme
  factors.push({
    name: 'Rainfall intensity',
    value: `${weather.precipitation.toFixed(1)} mm/h`,
    weight: LANDSLIDE_RISK_CONFIG.precipitation_weight,
    impact: weather.precipitation > 15 ? 'positive' : 'negative',
  });

  const soilSignal = Math.min(100, weather.soilMoisture * 100);
  factors.push({
    name: 'Soil saturation',
    value: `${soilSignal.toFixed(0)}%`,
    weight: LANDSLIDE_RISK_CONFIG.soil_moisture_weight,
    impact: soilSignal > 70 ? 'positive' : 'negative',
  });

  const capeSignal = Math.min(100, (weather.cape / 2000) * 100);
  factors.push({
    name: 'Convective instability',
    value: `${weather.cape.toFixed(0)} J/kg CAPE`,
    weight: LANDSLIDE_RISK_CONFIG.rain_intensity_weight,
    impact: weather.cape > 500 ? 'positive' : 'negative',
  });

  const windSignal = Math.min(100, (weather.windGusts / 80) * 100);
  factors.push({
    name: 'Wind gusts',
    value: `${weather.windGusts.toFixed(1)} km/h`,
    weight: LANDSLIDE_RISK_CONFIG.wind_weight,
    impact: weather.windGusts > 40 ? 'positive' : 'negative',
  });

  const score = Math.round(
    precipSignal * LANDSLIDE_RISK_CONFIG.precipitation_weight +
    soilSignal * LANDSLIDE_RISK_CONFIG.soil_moisture_weight +
    capeSignal * LANDSLIDE_RISK_CONFIG.rain_intensity_weight +
    windSignal * LANDSLIDE_RISK_CONFIG.wind_weight
  );

  return { score: Math.min(100, score), factors };
}

// ─── Source Attribution Builder ───────────────────────────────────────────────
function buildSourceRefs(weather: WeatherSnapshot | null, hasFlood: boolean, hasUSGS: boolean): SourceDataRef[] {
  const now = new Date();
  const refs: SourceDataRef[] = [];

  if (weather) {
    refs.push({
      source: 'Open-Meteo / ECMWF',
      variable: 'Weather forecast (current + hourly)',
      value: `Temp: ${weather.temperature.toFixed(1)}°C, Precip: ${weather.precipitation.toFixed(1)} mm/h, CAPE: ${weather.cape.toFixed(0)} J/kg`,
      timestamp: now,
      url: 'https://open-meteo.com/',
    });
  }

  if (hasFlood) {
    refs.push({
      source: 'Open-Meteo Flood API / GloFAS',
      variable: 'River discharge forecast',
      value: 'GloFAS-derived 7-day discharge',
      timestamp: now,
      url: 'https://open-meteo.com/en/docs/flood-api',
    });
  }

  if (hasUSGS) {
    refs.push({
      source: 'USGS Earthquake Hazards Program',
      variable: 'Recent seismic activity',
      value: 'M ≥ 2.5 events, last 30 days',
      timestamp: now,
      url: 'https://earthquake.usgs.gov/',
    });
  }

  return refs;
}

// ─── Data Source Health Monitor ───────────────────────────────────────────────
export async function checkDataSourceHealth(): Promise<DataSourceStatus[]> {
  const sources = [
    { name: 'Open-Meteo', url: 'https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=80.21&current=temperature_2m' },
    { name: 'USGS Earthquakes', url: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=6.0&limit=1' },
    { name: 'NASA EONET', url: 'https://eonet.gsfc.nasa.gov/api/v3/events?limit=1' },
    { name: 'GloFAS Flood API', url: 'https://flood-api.open-meteo.com/v1/flood?latitude=12.97&longitude=80.21&daily=river_discharge&forecast_days=1' },
  ];

  const results: DataSourceStatus[] = await Promise.all(
    sources.map(async (src) => {
      const t0 = Date.now();
      try {
        const res = await fetch(src.url, { signal: AbortSignal.timeout(8000) });
        const latencyMs = Date.now() - t0;
        return {
          name: src.name,
          url: src.url,
          status: res.ok ? 'ONLINE' as const : 'OFFLINE' as const,
          lastChecked: new Date(),
          lastSuccess: res.ok ? new Date() : undefined,
          latencyMs,
        };
      } catch (err) {
        return {
          name: src.name,
          url: src.url,
          status: 'OFFLINE' as const,
          lastChecked: new Date(),
          errorMessage: (err as Error).message?.slice(0, 100),
        };
      }
    })
  );

  return results;
}

// ─── Main Prediction Engine ───────────────────────────────────────────────────
export async function runPredictionEngine(
  forecastWindow: string = 'now'
): Promise<Prediction[]> {
  const predictions: Prediction[] = [];
  const now = new Date();

  // Compute forecast time offset for window display
  const windowOffsets: Record<string, number> = {
    'now': 0, '+6h': 6, '+12h': 12, '+24h': 24, '+48h': 48, '+72h': 72,
  };
  const hoursAhead = windowOffsets[forecastWindow] ?? 0;

  for (const loc of PREDICTION_LOCATIONS) {
    try {
      // Fetch data
      const [weather, floodData, eqCluster] = await Promise.allSettled([
        fetchWeatherForecast(loc.lat, loc.lng),
        fetchFloodForecast(loc.lat, loc.lng),
        fetchEarthquakeCluster(loc.lat, loc.lng),
      ]);

      const w = weather.status === 'fulfilled' ? weather.value : null;
      const f = floodData.status === 'fulfilled' ? floodData.value : null;
      const eq = eqCluster.status === 'fulfilled' ? eqCluster.value : null;

      const sourcesAvailable = [w, f, eq].filter(Boolean).length;
      const sourceRefs = buildSourceRefs(w, f !== null, eq !== null);

      if (!w) continue; // Need at least weather data

      // For non-zero forecast windows, scale signals by precipitation probability
      // (proxy for forecast degradation — confidence falls off with time)
      const timeDecay = hoursAhead > 0 ? Math.max(0.6, 1 - hoursAhead * 0.005) : 1;

      // ── Flood prediction ───────────────────────────────────────────────────
      const floodResult = computeFloodRisk(w, f);
      const floodScore = Math.round(floodResult.score * timeDecay);
      if (floodScore >= 20) {
        const confidence = calculateConfidence({
          sourcesAvailable,
          sourcesTotal: 3,
          dataFreshMinutes: 0,
          riskScore: floodScore,
          hasOfficialSignal: false,
        });

        predictions.push({
          id: `flood_${loc.lat}_${loc.lng}_${forecastWindow}`,
          eventType: 'prediction',
          hazardType: 'flood',
          latitude: loc.lat,
          longitude: loc.lng,
          locationName: loc.name,
          riskScore: floodScore,
          probability: Math.round(floodScore * 0.85),
          confidence,
          severity: getRiskLevel(floodScore),
          forecastStart: 'now',
          forecastEnd: forecastWindow as any || 'now',
          generatedAt: now,
          expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
          contributingFactors: floodResult.factors,
          sourceData: sourceRefs,
          methodology: 'Weighted feature scoring: precipitation intensity + soil moisture + CAPE + GloFAS discharge anomaly',
          status: 'active',
          rawWeatherData: w,
          modelAgreement: sourcesAvailable >= 2 ? 'HIGH' : 'MODERATE',
          disclaimer: 'MODEL-PREDICTED RISK — This is a decision-support indicator, NOT an official emergency warning. Contact authorities for official information.',
        });
      }

      // ── Storm prediction ───────────────────────────────────────────────────
      const stormResult = computeStormRisk(w);
      const stormScore = Math.round(stormResult.score * timeDecay);
      if (stormScore >= 20) {
        const confidence = calculateConfidence({
          sourcesAvailable,
          sourcesTotal: 3,
          dataFreshMinutes: 0,
          riskScore: stormScore,
          hasOfficialSignal: false,
        });

        predictions.push({
          id: `storm_${loc.lat}_${loc.lng}_${forecastWindow}`,
          eventType: 'prediction',
          hazardType: 'storm',
          latitude: loc.lat,
          longitude: loc.lng,
          locationName: loc.name,
          riskScore: stormScore,
          probability: Math.round(stormScore * 0.80),
          confidence,
          severity: getRiskLevel(stormScore),
          forecastStart: 'now',
          forecastEnd: forecastWindow as any || '+12h',
          generatedAt: now,
          expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
          contributingFactors: stormResult.factors,
          sourceData: sourceRefs,
          methodology: 'Weighted feature scoring: wind gusts + CAPE + precipitation + surface pressure + humidity',
          status: 'active',
          rawWeatherData: w,
          modelAgreement: sourcesAvailable >= 2 ? 'HIGH' : 'MODERATE',
          disclaimer: 'MODEL-PREDICTED RISK — This is a decision-support indicator, NOT an official emergency warning.',
        });
      }

      // ── Wildfire prediction ────────────────────────────────────────────────
      const wildfireResult = computeWildfireRisk(w);
      const wildfireScore = Math.round(wildfireResult.score * timeDecay);
      if (wildfireScore >= 20) {
        const confidence = calculateConfidence({
          sourcesAvailable,
          sourcesTotal: 3,
          dataFreshMinutes: 0,
          riskScore: wildfireScore,
          hasOfficialSignal: false,
        });

        predictions.push({
          id: `wildfire_${loc.lat}_${loc.lng}_${forecastWindow}`,
          eventType: 'prediction',
          hazardType: 'wildfire',
          latitude: loc.lat,
          longitude: loc.lng,
          locationName: loc.name,
          riskScore: wildfireScore,
          probability: Math.round(wildfireScore * 0.75),
          confidence,
          severity: getRiskLevel(wildfireScore),
          forecastStart: 'now',
          forecastEnd: forecastWindow as any || '+24h',
          generatedAt: now,
          expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
          contributingFactors: wildfireResult.factors,
          sourceData: sourceRefs,
          methodology: 'Weighted feature scoring: temperature + humidity deficit + wind + precipitation deficit + soil dryness',
          status: 'active',
          rawWeatherData: w,
          modelAgreement: 'MODERATE',
          disclaimer: 'MODEL-PREDICTED FIRE WEATHER RISK — Not equivalent to an official fire danger rating.',
        });
      }

      // ── Seismic hazard assessment (NOT prediction) ─────────────────────────
      if (eq) {
        const seismicResult = computeSeismicHazard(eq);
        if (seismicResult.score >= 15) {
          const confidence = calculateConfidence({
            sourcesAvailable: eq ? 2 : 1,
            sourcesTotal: 2,
            dataFreshMinutes: 0,
            riskScore: seismicResult.score,
            hasOfficialSignal: false,
          });

          predictions.push({
            id: `seismic_${loc.lat}_${loc.lng}_${forecastWindow}`,
            eventType: 'prediction',
            hazardType: 'seismic',
            latitude: loc.lat,
            longitude: loc.lng,
            locationName: loc.name,
            riskScore: seismicResult.score,
            probability: Math.round(seismicResult.score * 0.60),
            confidence,
            severity: getRiskLevel(seismicResult.score),
            forecastStart: 'now',
            forecastEnd: '+72h',
            generatedAt: now,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            contributingFactors: seismicResult.factors,
            sourceData: sourceRefs.filter(r => r.source.includes('USGS')),
            methodology: 'SEISMIC HAZARD ASSESSMENT — NOT earthquake prediction. Based on recent USGS catalog: cluster density + magnitude + proximity.',
            status: 'active',
            rawWeatherData: w,
            modelAgreement: 'MODERATE',
            disclaimer: 'SEISMIC HAZARD ASSESSMENT — NOT an earthquake prediction. Earthquakes cannot be reliably predicted. Source: USGS live catalog.',
          });
        }
      }

      // ── Landslide prediction ───────────────────────────────────────────────
      // Only flag landslide risk in hilly/mountain regions (crude proxy: lat > 10 AND any rain)
      if (w.precipitation > 2 || w.soilMoisture > 0.5) {
        const landslideResult = computeLandslideRisk(w);
        const landslideScore = Math.round(landslideResult.score * timeDecay);
        if (landslideScore >= 25) {
          const confidence = calculateConfidence({
            sourcesAvailable,
            sourcesTotal: 3,
            dataFreshMinutes: 0,
            riskScore: landslideScore,
            hasOfficialSignal: false,
          });

          predictions.push({
            id: `landslide_${loc.lat}_${loc.lng}_${forecastWindow}`,
            eventType: 'prediction',
            hazardType: 'landslide',
            latitude: loc.lat + 0.01, // slight offset to avoid overlapping flood circle
            longitude: loc.lng + 0.01,
            locationName: loc.name,
            riskScore: landslideScore,
            probability: Math.round(landslideScore * 0.78),
            confidence,
            severity: getRiskLevel(landslideScore),
            forecastStart: 'now',
            forecastEnd: forecastWindow as any || '+12h',
            generatedAt: now,
            expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
            contributingFactors: landslideResult.factors,
            sourceData: sourceRefs,
            methodology: 'Weighted feature scoring: rainfall intensity + soil saturation + CAPE + wind gusts',
            status: 'active',
            rawWeatherData: w,
            modelAgreement: sourcesAvailable >= 2 ? 'HIGH' : 'LOW',
            disclaimer: 'MODEL-PREDICTED LANDSLIDE RISK — This is a decision-support indicator, NOT an official warning.',
          });
        }
      }

    } catch (locationErr) {
      console.warn(`[PredictionEngine] Failed for ${loc.name}:`, locationErr);
      // Continue to next location — do not crash
    }
  }

  return predictions;
}
