// ─── Prediction Engine Types ────────────────────────────────────────────────
// Separated from the main types.ts to keep the module self-contained.
// These types are intentionally kept distinct from HazardMarker (observed events).

export type HazardType = 'flood' | 'storm' | 'wildfire' | 'seismic' | 'landslide' | 'cyclone' | 'volcano';
export type EventType = 'observed' | 'forecast' | 'prediction' | 'official_alert';
export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
export type ForecastWindow = 'now' | '+6h' | '+12h' | '+24h' | '+48h' | '+72h' | '+7d';
export type SourceStatus = 'ONLINE' | 'OFFLINE' | 'STALE' | 'LOADING';

// ─── Risk Score Thresholds (configurable) ───────────────────────────────────
export const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 24, color: '#22c55e', label: 'LOW' },
  MODERATE: { min: 25, max: 49, color: '#f59e0b', label: 'MODERATE' },
  HIGH: { min: 50, max: 74, color: '#f97316', label: 'HIGH' },
  EXTREME: { min: 75, max: 100, color: '#ef4444', label: 'EXTREME' },
} as const;

export function getRiskLevel(score: number): SeverityLevel {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MODERATE';
  if (score < 75) return 'HIGH';
  return 'EXTREME';
}

export function getRiskConfig(score: number) {
  return RISK_THRESHOLDS[getRiskLevel(score)];
}

// ─── Flood Risk Config (all weights configurable) ────────────────────────────
export const FLOOD_RISK_CONFIG = {
  precipitation_weight: 0.30,
  accumulated_rain_weight: 0.20,
  soil_moisture_weight: 0.20,
  cape_weight: 0.15,
  discharge_weight: 0.15,
} as const;

export const STORM_RISK_CONFIG = {
  wind_gust_weight: 0.30,
  cape_weight: 0.25,
  precipitation_weight: 0.20,
  pressure_tendency_weight: 0.15,
  humidity_weight: 0.10,
} as const;

export const WILDFIRE_RISK_CONFIG = {
  temperature_weight: 0.25,
  humidity_deficit_weight: 0.30,
  wind_weight: 0.20,
  precip_deficit_weight: 0.15,
  soil_moisture_weight: 0.10,
} as const;

export const LANDSLIDE_RISK_CONFIG = {
  precipitation_weight: 0.35,
  soil_moisture_weight: 0.30,
  rain_intensity_weight: 0.20,
  wind_weight: 0.15,
} as const;

// ─── Core Prediction Model ───────────────────────────────────────────────────
export interface Prediction {
  id: string;
  eventType: 'prediction';
  hazardType: HazardType;
  latitude: number;
  longitude: number;
  locationName: string;
  riskScore: number;          // 0–100
  probability: number;        // 0–100
  confidence: number;         // 0–100
  severity: SeverityLevel;
  forecastStart: ForecastWindow;
  forecastEnd: ForecastWindow;
  generatedAt: Date;
  expiresAt: Date;
  contributingFactors: ContributingFactor[];
  sourceData: SourceDataRef[];
  methodology: string;
  status: 'active' | 'expired' | 'verified' | 'unverified';
  rawWeatherData?: WeatherSnapshot;
  modelAgreement: 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';
  disclaimer: string;
}

export interface ContributingFactor {
  name: string;
  value: string;
  weight: number;
  impact: 'positive' | 'negative'; // positive = increasing risk
}

export interface SourceDataRef {
  source: string;
  variable: string;
  value: string;
  timestamp: Date;
  url: string;
}

export interface WeatherSnapshot {
  temperature: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  humidity: number;
  surfacePressure: number;
  cape: number;
  soilMoisture: number;
  weatherCode: number;
  precipitationProbability: number;
}

// ─── Observed Disaster (normalized from EONET/USGS) ─────────────────────────
export interface DisasterObservation {
  id: string;
  eventType: 'observed';
  source: 'EONET' | 'USGS' | 'Manual';
  sourceEventId: string;
  hazardType: HazardType | 'unknown';
  latitude: number;
  longitude: number;
  observedAt: Date;
  severity: SeverityLevel;
  title: string;
  description: string;
  sourceUrl: string;
  magnitude?: number; // for seismic
}

// ─── Official Alert ──────────────────────────────────────────────────────────
export interface OfficialAlert {
  id: string;
  eventType: 'official_alert';
  source: string;
  hazardType: HazardType;
  title: string;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  issuedAt: Date;
  expiresAt?: Date;
  sourceUrl: string;
  description: string;
}

// ─── Data Source Health ──────────────────────────────────────────────────────
export interface DataSourceStatus {
  name: string;
  url: string;
  status: SourceStatus;
  lastChecked: Date;
  lastSuccess?: Date;
  latencyMs?: number;
  errorMessage?: string;
}

// ─── Prediction Verification ─────────────────────────────────────────────────
export interface PredictionVerification {
  predictionId: string;
  verifiedAt: Date;
  outcome: 'VERIFIED' | 'NOT_OBSERVED' | 'PENDING';
  observedEventId?: string;
  notes: string;
}

// ─── Engine Result ────────────────────────────────────────────────────────────
export interface PredictionEngineResult {
  predictions: Prediction[];
  dataHealth: DataSourceStatus[];
  generatedAt: Date;
  forecastWindow: ForecastWindow;
}
