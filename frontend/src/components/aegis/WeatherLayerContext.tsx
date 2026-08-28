import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// ─── Layer ID type ────────────────────────────────────────────────────────────
export type LayerType =
  // Atmosphere
  | 'temperature' | 'feelsLike' | 'humidity' | 'dewPoint'
  | 'pressure' | 'cloud' | 'visibility'
  // Wind
  | 'wind' | 'windDirection' | 'windGust' | 'particles'
  // Precipitation
  | 'rain' | 'rainIntensity' | 'precipProbability' | 'showers' | 'snow' | 'precipAccum'
  // Storms
  | 'thunderstorm' | 'cape' | 'convective' | 'lightning' | 'stormRisk'
  // Upper atmosphere (legacy ids kept)
  | 'upper_1000' | 'upper_925' | 'upper_850' | 'upper_700' | 'upper_500' | 'upper_300'
  // Disaster Intelligence
  | 'floodRisk' | 'cycloneRisk' | 'extremeRain' | 'extremeWind'
  | 'heatRisk' | 'fireRisk' | 'lightningRisk' | 'landslideRisk' | 'aegisRisk'
  // Legacy / overview
  | 'overview' | 'weather' | 'wind_legacy' | 'rain_acc' | 'waves'
  | 'radar' | 'disaster' | 'hurricane' | 'aqi';

export type AltitudeType = 'surface' | '1000hPa' | '925hPa' | '850hPa' | '700hPa' | '500hPa' | '300hPa';
export type ModelType = 'ECMWF' | 'GFS' | 'ICON';
export type ParticleDensity = 'low' | 'medium' | 'high';

export interface LayerState {
  enabled: boolean;
  opacity: number; // 0–1
}

interface WeatherLayerContextType {
  // ── Primary layer ──
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;

  // ── Overlay layers (wind particles, isobars, markers) ──
  overlayLayers: Record<string, LayerState>;
  setOverlayLayer: (id: string, state: Partial<LayerState>) => void;

  // ── Per-layer opacity ──
  layerOpacity: Record<string, number>;
  setLayerOpacity: (id: string, opacity: number) => void;

  // ── Playback & time ──
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  forecastHour: number;
  setForecastHour: (hour: number) => void;

  // ── Pressure altitude ──
  altitude: AltitudeType;
  setAltitude: (alt: AltitudeType) => void;
  pressureLevel: AltitudeType;
  setPressureLevel: (level: AltitudeType) => void;

  // ── Model ──
  model: ModelType;
  setModel: (mod: ModelType) => void;

  // ── Display toggles (kept for backward compat) ──
  showIsobars: boolean;
  setShowIsobars: (show: boolean) => void;
  showParticles: boolean;
  setShowParticles: (show: boolean) => void;

  // ── Particle controls ──
  particleDensity: ParticleDensity;
  setParticleDensity: (d: ParticleDensity) => void;
  particleSpeed: ParticleDensity;
  setParticleSpeed: (s: ParticleDensity) => void;
  particleTrail: number; // 0–1
  setParticleTrail: (t: number) => void;

  // ── Predictor mode ──
  isPredictorMode: boolean;
  setIsPredictorMode: (mode: boolean) => void;

  // ── Selected location (from map click) ──
  selectedLocation: { lat: number; lng: number } | null;
  setSelectedLocation: (loc: { lat: number; lng: number } | null) => void;

  // ── Loading state per layer ──
  loadingLayers: Set<string>;
  setLayerLoading: (id: string, loading: boolean) => void;

  // ── Error state per layer ──
  layerErrors: Record<string, string>;
  setLayerError: (id: string, error: string | null) => void;
}

const WeatherLayerContext = createContext<WeatherLayerContextType | undefined>(undefined);

export const WeatherLayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeLayer, setActiveLayerState] = useState<LayerType>('temperature');
  const [overlayLayers, setOverlayLayers] = useState<Record<string, LayerState>>({
    particles: { enabled: true, opacity: 0.8 },
    isobars: { enabled: false, opacity: 0.7 },
    disasterMarkers: { enabled: true, opacity: 1 },
  });
  const [layerOpacity, setLayerOpacityState] = useState<Record<string, number>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [forecastHour, setForecastHour] = useState(0);
  const [altitude, setAltitude] = useState<AltitudeType>('surface');
  const [pressureLevel, setPressureLevel] = useState<AltitudeType>('850hPa');
  const [model, setModel] = useState<ModelType>('ECMWF');
  const [showIsobars, setShowIsobarsState] = useState(false);
  const [showParticles, setShowParticlesState] = useState(true);
  const [particleDensity, setParticleDensity] = useState<ParticleDensity>('medium');
  const [particleSpeed, setParticleSpeed] = useState<ParticleDensity>('medium');
  const [particleTrail, setParticleTrail] = useState(0.5);
  const [isPredictorMode, setIsPredictorMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLayers, setLoadingLayersState] = useState<Set<string>>(new Set());
  const [layerErrors, setLayerErrorsState] = useState<Record<string, string>>({});

  const setActiveLayer = useCallback((layer: LayerType) => {
    setActiveLayerState(layer);
  }, []);

  const setOverlayLayer = useCallback((id: string, state: Partial<LayerState>) => {
    setOverlayLayers(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? { enabled: false, opacity: 1 }), ...state },
    }));
  }, []);

  const setLayerOpacity = useCallback((id: string, opacity: number) => {
    setLayerOpacityState(prev => ({ ...prev, [id]: opacity }));
  }, []);

  // Keep showIsobars / showParticles in sync with overlayLayers
  const setShowIsobars = useCallback((show: boolean) => {
    setShowIsobarsState(show);
    setOverlayLayers(prev => ({
      ...prev,
      isobars: { ...(prev.isobars ?? { opacity: 0.7 }), enabled: show },
    }));
  }, []);

  const setShowParticles = useCallback((show: boolean) => {
    setShowParticlesState(show);
    setOverlayLayers(prev => ({
      ...prev,
      particles: { ...(prev.particles ?? { opacity: 0.8 }), enabled: show },
    }));
  }, []);

  const setLayerLoading = useCallback((id: string, loading: boolean) => {
    setLoadingLayersState(prev => {
      const next = new Set(prev);
      loading ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const setLayerError = useCallback((id: string, error: string | null) => {
    setLayerErrorsState(prev => {
      if (error === null) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: error };
    });
  }, []);

  return (
    <WeatherLayerContext.Provider value={{
      activeLayer, setActiveLayer,
      overlayLayers, setOverlayLayer,
      layerOpacity, setLayerOpacity,
      isPlaying, setIsPlaying,
      forecastHour, setForecastHour,
      altitude, setAltitude,
      pressureLevel, setPressureLevel,
      model, setModel,
      showIsobars, setShowIsobars,
      showParticles, setShowParticles,
      particleDensity, setParticleDensity,
      particleSpeed, setParticleSpeed,
      particleTrail, setParticleTrail,
      isPredictorMode, setIsPredictorMode,
      selectedLocation, setSelectedLocation,
      loadingLayers, setLayerLoading,
      layerErrors, setLayerError,
    }}>
      {children}
    </WeatherLayerContext.Provider>
  );
};

export const useWeatherLayer = () => {
  const context = useContext(WeatherLayerContext);
  if (context === undefined) {
    throw new Error('useWeatherLayer must be used within a WeatherLayerProvider');
  }
  return context;
};
