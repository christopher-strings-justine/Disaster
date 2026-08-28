import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, ZoomControl, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWeatherLayer, LayerType } from './WeatherLayerContext';
import { MapCanvasOverlay } from './MapCanvasOverlay';
import { WindParticleCanvas } from './WindParticleCanvas';
import { IsobarCanvas } from './IsobarCanvas';
import { LayerLegend } from './LayerLegend';
import { LocationInfoPanel } from './LocationInfoPanel';
import { LayerId, LAYER_CONFIGS } from './layerConfig';
import Groq from 'groq-sdk';

// ─── Fix Leaflet default icon paths ──────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom Icons ──────────────────────────────────────────────────────────────
const createSeverityIcon = (color: string, glow: boolean) => L.divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:${color};border:2px solid #fff;
    box-shadow:0 0 0 4px ${color}40, 0 2px 10px rgba(0,0,0,0.6);
    ${glow ? 'animation: aegis-ping 1.5s ease-in-out infinite;' : ''}
  "></div>
  <style>
    @keyframes aegis-ping {
      0% { box-shadow: 0 0 0 0 ${color}70; }
      70% { box-shadow: 0 0 0 12px ${color}00; }
      100% { box-shadow: 0 0 0 0 ${color}00; }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
});

const getDisasterIcon = (severity: number) => {
  if (severity >= 80) return createSeverityIcon('#ef4444', true);
  if (severity >= 50) return createSeverityIcon('#f59e0b', false);
  return createSeverityIcon('#10b981', false);
};

const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('fire') || cat.includes('volcano')) return 'text-orange-500';
  if (cat.includes('flood') || cat.includes('water') || cat.includes('storm')) return 'text-blue-400';
  if (cat.includes('earthquake') || cat.includes('landslide')) return 'text-amber-600';
  return 'text-rose-600';
};

// ─── Layers that support real canvas heatmaps ─────────────────────────────────
const CANVAS_LAYER_IDS = new Set<LayerType>([
  'temperature', 'feelsLike', 'humidity', 'dewPoint', 'pressure',
  'cloud', 'cloudLow', 'cloudMid', 'cloudHigh', 'visibility',
  'wind', 'windGust',
  'rain', 'rainIntensity', 'precipProbability', 'showers', 'snow', 'precipAccum',
  'thunderstorm', 'cape', 'convective', 'lightning', 'stormRisk',
  'upper_1000', 'upper_925', 'upper_850', 'upper_700', 'upper_500', 'upper_300',
  'floodRisk', 'cycloneRisk', 'extremeRain', 'extremeWind',
  'heatRisk', 'fireRisk', 'lightningRisk', 'landslideRisk', 'aegisRisk',
]);

// ─── Legacy tile layers for backward-compat layers ─────────────────────────────
const LEGACY_TILE_CONFIG: Record<string, { url: string; attribution: string; opacity: number; tint: string; label: string }> = {
  weather: {
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
    attribution: '&copy; IEM Nexrad', opacity: 0.7, tint: 'rgba(239, 68, 68, 0.08)', label: '🌡 Temperature Layer',
  },
  wind_legacy: {
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
    attribution: '&copy; IEM Nexrad', opacity: 0.65, tint: 'rgba(6, 182, 212, 0.08)', label: '💨 Wind Layer',
  },
  rain_acc: {
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/n0r-900913/{z}/{x}/{y}.png',
    attribution: '&copy; IEM Nexrad', opacity: 0.7, tint: 'rgba(59, 130, 246, 0.12)', label: '🌊 Rain Accumulation',
  },
  hurricane: {
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
    attribution: '&copy; IEM Nexrad', opacity: 0.8, tint: 'rgba(168, 85, 247, 0.10)', label: '🌀 Hurricane Tracker',
  },
  radar: {
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
    attribution: '&copy; IEM Nexrad', opacity: 0.75, tint: 'rgba(239, 68, 68, 0.06)', label: '📡 Radar Layer',
  },
  aqi: {
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
    attribution: '&copy; IEM Nexrad', opacity: 0.5, tint: 'rgba(16, 185, 129, 0.10)', label: '🍃 Air Quality Index',
  },
  waves: {
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
    attribution: '&copy; IEM Nexrad', opacity: 0.65, tint: 'rgba(14, 165, 233, 0.10)', label: '🌊 Waves',
  },
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Disaster {
  eonetId: string;
  title: string;
  category: string;
  description: string;
  coordinates: { lat: number; lng: number };
  severityScore: number;
}

interface AIPrediction {
  lat: number;
  lng: number;
  status: 'loading' | 'success' | 'error';
  content: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const MapFlyController = ({ target }: { target: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 11, { duration: 1.8 });
  }, [target, map]);
  return null;
};

const MapClickHandler = ({
  onMapClick,
  onLocationSelect,
}: {
  onMapClick: (latlng: L.LatLng) => void;
  onLocationSelect: (latlng: L.LatLng) => void;
}) => {
  const { isPredictorMode } = useWeatherLayer();
  useMapEvents({
    click(e) {
      if (isPredictorMode) {
        onMapClick(e.latlng);
      } else {
        onLocationSelect(e.latlng);
      }
    }
  });
  return null;
};

// ─── Active Layer HUD ─────────────────────────────────────────────────────────
const LayerHUD: React.FC = () => {
  const { activeLayer, model, altitude, loadingLayers } = useWeatherLayer();
  if (activeLayer === 'overview') return null;

  const cfg = LAYER_CONFIGS[activeLayer as LayerId];
  const label = cfg ? `${cfg.icon} ${cfg.name}` : activeLayer;
  const isLoading = loadingLayers.has(activeLayer);

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1001] pointer-events-none">
      <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 rounded-full px-5 py-1.5 text-cyan-300 text-xs font-bold tracking-wide shadow-lg animate-fade-in flex items-center gap-2">
        {isLoading && (
          <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
        )}
        <span>{label}</span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400">{model}</span>
        {altitude !== 'surface' && (
          <>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{altitude}</span>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Map Component ───────────────────────────────────────────────────────
interface AegisMapProps {
  flyTarget?: [number, number] | null;
}

export const AegisMap: React.FC<AegisMapProps> = ({ flyTarget }) => {
  const { activeLayer, altitude, model, isPredictorMode, setSelectedLocation } = useWeatherLayer();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);

  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY || 'dummy_key',
    dangerouslyAllowBrowser: true,
  });

  // Predictor mode map click (AI analysis)
  const handlePredictorClick = async (latlng: L.LatLng) => {
    if (!isPredictorMode) return;
    const { lat, lng } = latlng;
    setPredictions(prev => [...prev, { lat, lng, status: 'loading', content: '' }]);

    try {
      const meteoRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
      );
      const meteoData = await meteoRes.json();
      if (!meteoData.current_weather) throw new Error('Weather data unavailable');
      const weatherStr = JSON.stringify(meteoData.current_weather);

      const chatCompletion = await groq.chat.completions.create({
        messages: [{
          role: 'user',
          content: `You are an expert meteorologist and disaster response analyst. Based on coordinates (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}) and real-time weather data: ${weatherStr}, predict the likelihood of natural disasters for the next 48 hours. Keep the response concise, analytical, structured in HTML. Do not use markdown backticks.`
        }],
        model: 'llama3-8b-8192',
        temperature: 0.2,
      });

      const responseHtml = chatCompletion.choices[0]?.message?.content || '<div>Analysis failed.</div>';
      setPredictions(prev => prev.map(p =>
        (p.lat === lat && p.lng === lng) ? { ...p, status: 'success', content: responseHtml } : p
      ));
    } catch (error: any) {
      setPredictions(prev => prev.map(p =>
        (p.lat === lat && p.lng === lng)
          ? { ...p, status: 'error', content: `<p style="color:#f43f5e;font-weight:bold">Error: ${error.message || 'API failed'}</p>` }
          : p
      ));
    }
  };

  // Normal click → location inspect
  const handleLocationSelect = useCallback((latlng: L.LatLng) => {
    setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
  }, [setSelectedLocation]);

  // Fetch disaster markers from backend
  useEffect(() => {
    fetch('http://localhost:3001/api/disasters')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setDisasters(data); })
      .catch(err => console.warn('[AegisX] Disaster backend unavailable:', err));
  }, []);

  const legacyTile = LEGACY_TILE_CONFIG[activeLayer];
  const isCanvasLayer = CANVAS_LAYER_IDS.has(activeLayer);

  return (
    <div className="absolute inset-0 z-0">
      {/* Legacy tint overlay for non-canvas layers */}
      {legacyTile && !isCanvasLayer && (
        <div
          className="absolute inset-0 z-[5] pointer-events-none transition-all duration-500"
          style={{ backgroundColor: legacyTile.tint, mixBlendMode: 'multiply' }}
        />
      )}

      {/* Layer HUD */}
      <LayerHUD />

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full bg-slate-950"
        style={{ cursor: isPredictorMode ? 'crosshair' : 'grab' }}
      >
        {/* Base Dark Map */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

        {/* ── Canvas heatmap overlay (new layer system) ── */}
        {isCanvasLayer && (
          <MapCanvasOverlay
            key={`${activeLayer}-${altitude}-${model}`}
            layerId={activeLayer as LayerId}
            opacity={0.78}
          />
        )}

        {/* ── Wind particles overlay ── */}
        <WindParticleCanvas />

        {/* ── Isobar overlay ── */}
        <IsobarCanvas />

        {/* ── Legacy tile layer (for backward-compat layers) ── */}
        {legacyTile && !isCanvasLayer && (
          <TileLayer
            key={`${activeLayer}-${altitude}-${model}`}
            url={legacyTile.url}
            attribution={legacyTile.attribution}
            opacity={legacyTile.opacity}
          />
        )}

        {/* Zoom control */}
        <ZoomControl position="bottomright" />

        {/* Fly to searched location */}
        <MapFlyController target={flyTarget ?? null} />

        {/* Click handler */}
        <MapClickHandler
          onMapClick={handlePredictorClick}
          onLocationSelect={handleLocationSelect}
        />

        {/* Live Disaster Markers */}
        {disasters.map(d => (
          <Marker
            key={d.eonetId}
            position={[d.coordinates.lat, d.coordinates.lng]}
            icon={getDisasterIcon(d.severityScore)}
          >
            <Popup>
              <div className="font-sans" style={{ minWidth: 200 }}>
                <h3 style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>{d.title}</h3>
                <p style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}
                  className={getCategoryColor(d.category)}>
                  {d.category}
                </p>
                <p style={{ fontSize: 12, marginBottom: 6 }}>{d.description || 'Active natural event detected.'}</p>
                <span style={{
                  fontSize: 11, fontWeight: 'bold', padding: '2px 8px', borderRadius: 4, color: '#fff',
                  background: d.severityScore >= 80 ? '#ef4444' : d.severityScore >= 50 ? '#f59e0b' : '#10b981'
                }}>
                  Severity: {d.severityScore}/100
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* AI Predictor Markers */}
        {predictions.map((p, idx) => (
          <Marker
            key={`pred-${idx}`}
            position={[p.lat, p.lng]}
            icon={createSeverityIcon(
              p.status === 'error' ? '#ef4444' : p.status === 'loading' ? '#f59e0b' : '#8b5cf6',
              p.status === 'loading'
            )}
          >
            <Popup>
              {p.status === 'loading' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>
                  <div style={{
                    width: 16, height: 16, border: '2px solid #06b6d4',
                    borderTop: '2px solid transparent', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Analyzing Disaster Risk...</span>
                </div>
              ) : (
                <div style={{ maxWidth: 340, maxHeight: 260, overflowY: 'auto', fontSize: 12 }}
                  dangerouslySetInnerHTML={{ __html: p.content }} />
              )}
            </Popup>
          </Marker>
        ))}

      </MapContainer>

      {/* ── Layer Legend (outside MapContainer, above map) ── */}
      <div className="absolute inset-0 pointer-events-none z-[999]">
        <LayerLegend />
        <LocationInfoPanel />
      </div>

    </div>
  );
};
