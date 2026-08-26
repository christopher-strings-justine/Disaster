import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Info, Navigation, ArrowRight, Phone, CloudRain, Check,
  Layers, ExternalLink, Crosshair, AlertTriangle, MapPin, Plus, Search
} from 'lucide-react';
import { HazardMarker, LocationId, WeatherData, UserGpsData, DisasterType } from '../types';

// Fix Leaflet default icon paths (broken in Vite/webpack builds)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Location centre coords ─────────────────────────────────────────────────
const LOCATION_CENTRES: Record<LocationId, [number, number]> = {
  chennai:   [12.9762,  80.2181],
  wayanad:   [11.5755,  76.0533],
  joshimath: [30.5618,  79.5643],
};
const LOCATION_ZOOM: Record<LocationId, number> = {
  chennai:   13,
  wayanad:   14,
  joshimath: 14,
};

// ─── Custom SVG Icons ────────────────────────────────────────────────────────
const makeIcon = (color: string, pulse: boolean) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 0 0 3px ${color}55, 0 2px 8px rgba(0,0,0,0.4);
      ${pulse ? 'animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;' : ''}
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });

const DANGER_ICON  = makeIcon('#ef4444', true);
const WARNING_ICON = makeIcon('#f59e0b', false);
const SAFE_ICON    = makeIcon('#10b981', false);
const COMPROMISED_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:#1e293b;border:3px solid #ef4444;
    box-shadow:0 0 0 3px #ef444455, 0 2px 8px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
  ">
    <span style="color:#ef4444;font-size:10px;font-weight:black;line-height:1;margin-bottom:1px">⚠️</span>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});
const GPS_ICON = L.divIcon({
  className: '',
  html: `
    <style>
      @keyframes gpsPulse {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    </style>
    <div style="
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #1a73e8;
      border: 2px solid #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -5px; left: -5px; right: -5px; bottom: -5px;
        border-radius: 50%;
        background: rgba(26,115,232,0.35);
        animation: gpsPulse 2s infinite ease-out;
        pointer-events: none;
      "></div>
    </div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// ─── Sub-component: fly to location when locationId changes ──────────────────
function MapFlyTo({ centre, zoom }: { centre: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(centre, zoom, { duration: 1.4 });
  }, [centre, zoom, map]);
  return null;
}

// ─── Sub-component: capture and store reference to the Leaflet Map instance ───
function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}



// ─── Props ───────────────────────────────────────────────────────────────────
interface TabGisMapProps {
  locationId: LocationId;
  markers: HazardMarker[];
  selectedMarker: HazardMarker | null;
  setSelectedMarker: (m: HazardMarker | null) => void;
  activeEvacuationRoute: {
    routeCoords: [number, number][];
    distance: string;
    time: string;
    roadCondition: string;
    targetShelterName: string;
    isRerouted: boolean;
    targetShelter: HazardMarker | null;
  } | null;
  setActiveEvacuationRoute: (r: any) => void;
  updatePipelineStep: (step: number) => void;
  weather: WeatherData;
  userGps: UserGpsData | null;
  setUserGps: (g: UserGpsData | null) => void;
  severityRadius: number;
  isOfficialAuthenticated: boolean;
  registerCustomMarker: (marker: HazardMarker) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const TabGisMap: React.FC<TabGisMapProps> = ({
  locationId,
  markers,
  selectedMarker,
  setSelectedMarker,
  activeEvacuationRoute,
  setActiveEvacuationRoute,
  updatePipelineStep,
  weather,
  userGps,
  setUserGps,
  severityRadius,
  isOfficialAuthenticated,
  registerCustomMarker,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');

  // Custom live coordinate plotting states
  const [clickedLatLng, setClickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [plotType, setPlotType] = useState<'hazard' | 'shelter'>('hazard');
  const [plotName, setPlotName] = useState('Active Landslide / Flooding');
  const [plotRadius, setPlotRadius] = useState(1000);
  const [plotRisk, setPlotRisk] = useState(80);

  // Map Click Listener child component
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setClickedLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
        // Set context-aware defaults when opening plot form
        if (isOfficialAuthenticated) {
          setPlotName(plotType === 'shelter' ? 'GCC Resettlement Safe Camp' : 'Active Landslide / Flooding');
        }
      }
    });
    return null;
  };

  // Unified Provisioning & Geocoding Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [provisionType, setProvisionType] = useState<'hazard' | 'shelter'>('hazard');
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [selectedDisasterType, setSelectedDisasterType] = useState<DisasterType>('cloudburst');
  const [customRadiusVal, setCustomRadiusVal] = useState(1500);

  const handleSearchGeocode = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    setSelectedResult(null);
    try {
      // Attempt 1: append 'India' context for better local results
      const url1 = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(searchQuery + ' India')}&limit=5&accept-language=en`;
      const res1 = await fetch(url1, { headers: { 'User-Agent': 'DisasterPredictor-SIH-CodeNova/1.0' } });
      let data: any[] = await res1.json();

      // Attempt 2: global fallback if no results
      if (!data || data.length === 0) {
        const url2 = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=en`;
        const res2 = await fetch(url2, { headers: { 'User-Agent': 'DisasterPredictor-SIH-CodeNova/1.0' } });
        data = await res2.json();
      }
      setSearchResults(data || []);
    } catch (err) {
      console.error("Geocoding failed:", err);
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const handleDeployProvision = () => {
    if (!isOfficialAuthenticated) {
      alert("⚠️ ACCESS LOCKED: Please authenticate as Command Officer in the 'Demo Control Portal' or click the lock button in the header.");
      return;
    }
    if (!selectedResult) {
      alert("⚠️ Target coordinate unselected. Please query a location and select a resolved result.");
      return;
    }
    const lat = parseFloat(selectedResult.lat);
    const lng = parseFloat(selectedResult.lon);

    const markerId = `${provisionType}-custom-${Date.now()}`;
    const cleanName = selectedResult.display_name.split(',')[0];
    
    const hazardLabels: Record<DisasterType, string> = {
      cloudburst: "Cloudburst Event",
      landslide: "Active Slope Failure Landslide",
      flood: "Urban Drainage Flooding Inundation",
      earthquake: "Seismic Ground Tremor Event",
      wildfire: "Active Forest Wildfire Incident",
      tsunami: "Coastal Tsunami Wave Surge",
      gasleak: "Industrial Toxic Gas Leak Cloud",
      hailstorm: "Severe Ice Hailstorm Event",
    };

    const newMarker: HazardMarker = {
      id: markerId,
      name: provisionType === 'shelter' ? `${cleanName} Relief Camp` : `${hazardLabels[selectedDisasterType]}`,
      locationId: locationId,
      risk: provisionType === 'shelter' ? 2 : 82,
      status: provisionType === 'shelter' ? 'safe' : 'danger',
      details: provisionType === 'shelter' ? `Live provisioned government refuge shelter.` : `Live mapped geographical hazard threat.`,
      population: provisionType === 'shelter' ? 0 : 350,
      lat,
      lng,
      radius: provisionType === 'shelter' ? undefined : customRadiusVal,
    };

    registerCustomMarker(newMarker);
    
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
    }

    setSearchQuery('');
    setSearchResults([]);
    setSelectedResult(null);
  };
  const activeMarkers = markers.filter(m => 
    locationId === 'joshimath' 
      ? m.locationId === 'joshimath' 
      : (m.locationId === 'chennai' || m.locationId === 'wayanad')
  );
  const centre = LOCATION_CENTRES[locationId];
  const zoom   = LOCATION_ZOOM[locationId];

  // ── OSRM route fetch ────────────────────────────────────────────────────
  const fetchRoute = useCallback(async (from: HazardMarker, to: HazardMarker) => {
    setRouteLoading(true);
    setRouteError(null);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/` +
        `${from.lng},${from.lat};${to.lng},${to.lat}` +
        `?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.length) {
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        const distKm = (route.distance / 1000).toFixed(1);
        const timeMins = Math.round(route.duration / 60);
        setActiveEvacuationRoute({
          routeCoords: coords,
          distance: `${distKm} km`,
          time: `${timeMins} mins`,
          roadCondition:
            from.risk > 80
              ? 'Heavy Rainfall — Proceed with caution'
              : 'Route appears clear',
          targetShelterName: to.name,
          isRerouted: false,
          targetShelter: to,
        });
      } else {
        // Fallback: straight line
        setActiveEvacuationRoute({
          routeCoords: [[from.lat, from.lng], [to.lat, to.lng]],
          distance: `~${haversine(from.lat, from.lng, to.lat, to.lng).toFixed(1)} km`,
          time: 'Est. unknown',
          roadCondition: 'Route data unavailable — showing straight line',
          targetShelterName: to.name,
          isRerouted: true,
          targetShelter: to,
        });
        setRouteError('OSRM could not compute road route — showing straight line fallback.');
      }
    } catch {
      setRouteError('Network error — check your connection.');
      setActiveEvacuationRoute(null);
    }
    setRouteLoading(false);
    updatePipelineStep(5);
  }, [setActiveEvacuationRoute, updatePipelineStep]);

  // ── Find nearest safe shelter and trigger route ─────────────────────────
  useEffect(() => {
    if (!selectedMarker || selectedMarker.status === 'safe') {
      setActiveEvacuationRoute(null);
      return;
    }
    const safeNodes = activeMarkers.filter(m => m.status === 'safe' && m.locationId === selectedMarker.locationId);
    if (!safeNodes.length) return;

    // Filter out compromised safe nodes (shelters within range of active threat)
    const uncompromisedSafeNodes = safeNodes.filter(s => {
      const check = isShelterCompromised(s.lat, s.lng, markers);
      return !check.compromised;
    });

    if (!uncompromisedSafeNodes.length) {
      setRouteError('WARNING: All regional safe shelters are compromised! Proximity ranges overlap all camps.');
      setActiveEvacuationRoute(null);
      return;
    }

    let nearest = uncompromisedSafeNodes[0];
    let minDist = Infinity;
    uncompromisedSafeNodes.forEach(s => {
      const d = haversine(selectedMarker.lat, selectedMarker.lng, s.lat, s.lng);
      if (d < minDist) { minDist = d; nearest = s; }
    });
    fetchRoute(selectedMarker, nearest);
  }, [selectedMarker, locationId, markers]);

  // ── GPS geolocation ─────────────────────────────────────────────────────
  const triggerGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserGps({ lat, lng, x: 0, y: 0, accuracy: pos.coords.accuracy });
          if (mapRef.current) {
            mapRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
          }
        },
        () => mockGps(),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else mockGps();
  };
  const mockGps = () => {
    const defaults: Record<LocationId, [number, number]> = {
      chennai:   [12.9620, 80.2250],
      wayanad:   [11.5824, 76.1215],
      joshimath: [30.5518, 79.5635],
    };
    const [lat, lng] = defaults[locationId];
    setUserGps({ lat, lng, x: 0, y: 0, accuracy: 12 });
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  };

  // ── Open Google Maps for navigation ────────────────────────────────────
  const openGoogleMaps = () => {
    if (!selectedMarker || !activeEvacuationRoute?.targetShelter) return;
    const { lat: lat1, lng: lng1 } = selectedMarker;
    const { lat: lat2, lng: lng2 } = activeEvacuationRoute.targetShelter;
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${lat1},${lng1}&destination=${lat2},${lng2}&travelmode=driving`,
      '_blank'
    );
  };

  const tileUrl = mapStyle === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttr = mapStyle === 'satellite'
    ? '© Esri &mdash; Source: Esri, USGS, NOAA'
    : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full">
      {/* ── MAP PANE ─────────────────────────────────────────────────────── */}
      <div className="flex-1 glass-panel rounded-xl p-4 flex flex-col min-h-[560px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {locationId === 'chennai' ? 'CHENNAI METROPOLITAN REGION' :
                 locationId === 'wayanad' ? 'WAYANAD DISTRICT' : 'JOSHIMATH VALLEY'}
                {' '}— LIVE MAP
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Real street map • OpenStreetMap • Click any marker to route
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Map style toggle */}
            <button
              onClick={() => setMapStyle(s => s === 'street' ? 'satellite' : 'street')}
              className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 px-2.5 py-1.5 rounded transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              {mapStyle === 'street' ? 'Satellite' : 'Street'}
            </button>
            {/* GPS button */}
            <button
              onClick={triggerGps}
              className={`flex items-center gap-1.5 text-[10px] font-mono border px-2.5 py-1.5 rounded transition-all ${
                userGps
                  ? 'bg-blue-950/40 border-blue-500 text-blue-400'
                  : 'bg-slate-900 border-slate-700 hover:border-blue-500 text-slate-300 hover:text-blue-400'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              {userGps ? 'GPS Active' : 'Locate Me'}
            </button>
          </div>
        </div>

        {/* Weather HUD strip */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 mb-3 px-1">
          <span className="flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-cyan-400" />
            {weather.precipitation} mm/h
          </span>
          <span>{weather.windSpeed} km/h wind</span>
          <span>{weather.temperature}°C</span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
            weather.imdAlertLevel === 'red'    ? 'bg-rose-950 text-rose-400' :
            weather.imdAlertLevel === 'orange' ? 'bg-amber-950 text-amber-400' :
            weather.imdAlertLevel === 'yellow' ? 'bg-yellow-950 text-yellow-400' :
            'bg-emerald-950 text-emerald-400'
          }`}>
            IMD {weather.imdAlertLevel} Alert
          </span>
        </div>

        {/* ── Leaflet Map ──────────────────────────────────────────────── */}
        <div className="flex-1 rounded-lg overflow-hidden border border-slate-700 min-h-[420px]" style={{ zIndex: 0 }}>
          <MapContainer
            ref={mapRef}
            center={centre}
            zoom={zoom}
            style={{ height: '100%', width: '100%', minHeight: '420px' }}
            scrollWheelZoom
            className="z-0"
          >
            <TileLayer url={tileUrl} attribution={tileAttr} maxZoom={19} />
            <MapRefSetter mapRef={mapRef} />
            <MapFlyTo centre={centre} zoom={zoom} />

            {/* Hazard & shelter markers */}
            {activeMarkers.map(m => {
              const check = isShelterCompromised(m.lat, m.lng, markers);
              const isComp = m.status === 'safe' && check.compromised;
              let icon = m.status === 'danger' ? DANGER_ICON : m.status === 'warning' ? WARNING_ICON : SAFE_ICON;
              if (isComp) {
                icon = COMPROMISED_ICON;
              }
              return (
                <Marker
                  key={m.id}
                  position={[m.lat, m.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedMarker(selectedMarker?.id === m.id ? null : m),
                  }}
                >
                  <Popup className="leaflet-popup-dark">
                    <div className="p-1 min-w-[180px]">
                      <div className={`text-xs font-bold mb-1 ${
                        isComp ? 'text-red-400 font-extrabold line-through' :
                        m.status === 'danger' ? 'text-red-500' :
                        m.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>{m.name} {isComp && '⚠️ (COMPROMISED)'}</div>
                      <div className="text-[11px] text-gray-400 mb-1 leading-relaxed">
                        {isComp ? `ALERT: Shelter is compromised due to proximity to active threat: ${check.threatName}. Immediate evacuation required.` : m.details}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {m.status !== 'safe' && <span>👥 {m.population.toLocaleString()} residents · </span>}
                        Risk: <span className="font-bold">{m.risk}%</span>
                      </div>
                      <div className="text-[9px] text-gray-500 mt-1 font-mono">
                        {m.lat.toFixed(4)}°N, {m.lng.toFixed(4)}°E
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Custom Severity Radius circle overlay for active selected hazard */}
            {selectedMarker && selectedMarker.status !== 'safe' && (
              <Circle
                center={[selectedMarker.lat, selectedMarker.lng]}
                radius={selectedMarker.radius || 1000}
                pathOptions={{
                  color: selectedMarker.status === 'danger' ? '#ef4444' : '#f59e0b',
                  fillColor: selectedMarker.status === 'danger' ? '#ef4444' : '#f59e0b',
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: '5,5'
                }}
              />
            )}

            {/* Real severity radius circles for all active danger/warning threats */}
            {activeMarkers.filter(m => m.status !== 'safe' && m.risk > 10).map(m => (
              <Circle
                key={`threat-radius-${m.id}`}
                center={[m.lat, m.lng]}
                radius={m.radius || 1000}
                pathOptions={{
                  color: m.status === 'danger' ? '#ef4444' : '#f59e0b',
                  fillColor: m.status === 'danger' ? '#ef4444' : '#f59e0b',
                  fillOpacity: selectedMarker?.id === m.id ? 0.10 : 0.03,
                  weight: selectedMarker?.id === m.id ? 2.5 : 1,
                  dashArray: '4,4'
                }}
              />
            ))}

            {/* OSRM route polyline */}
            {activeEvacuationRoute?.routeCoords && (
              <>
                {/* Glow outline */}
                <Polyline
                  positions={activeEvacuationRoute.routeCoords}
                  pathOptions={{ color: '#3b82f6', weight: 8, opacity: 0.15 }}
                />
                {/* Main route */}
                <Polyline
                  positions={activeEvacuationRoute.routeCoords}
                  pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.9, dashArray: activeEvacuationRoute.isRerouted ? '10,6' : undefined }}
                />
              </>
            )}

            {/* User GPS marker */}
            {userGps && (
              <>
                <Circle
                  center={[userGps.lat, userGps.lng]}
                  radius={userGps.accuracy || 15}
                  pathOptions={{
                    color: '#1a73e8',
                    fillColor: '#1a73e8',
                    fillOpacity: 0.08,
                    weight: 1,
                    dashArray: '3,3'
                  }}
                />
                <Marker position={[userGps.lat, userGps.lng]} icon={GPS_ICON}>
                  <Popup>
                    <div className="text-xs font-bold text-blue-600">📍 Your Location</div>
                    <div className="text-[10px] text-gray-500 font-mono">{userGps.lat.toFixed(5)}, {userGps.lng.toFixed(5)}</div>
                  </Popup>
                </Marker>
              </>
            )}
            {/* Map click listener to dynamically spawn threats/shelters */}
            <MapClickHandler />

            {clickedLatLng && (
              <Popup
                position={[clickedLatLng.lat, clickedLatLng.lng]}
                eventHandlers={{ remove: () => setClickedLatLng(null) }}
                className="leaflet-popup-dark animate-fade-in"
              >
                <div className="p-2 min-w-[220px] font-mono text-xs text-slate-200">
                  <div className="font-bold text-slate-100 uppercase tracking-wider mb-2 text-[10px] border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>📍 Plot GPS Point</span>
                    <span className={`text-[8px] px-1 py-0.2 rounded border font-black ${
                      isOfficialAuthenticated 
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800/40" 
                        : "bg-rose-950 text-rose-400 border-rose-800/40"
                    }`}>
                      {isOfficialAuthenticated ? "Authorized" : "Locked"}
                    </span>
                  </div>

                  {!isOfficialAuthenticated ? (
                    <div className="text-[10px] text-rose-400 leading-relaxed py-1">
                      ⚠️ ACCESS LOCKED: Authenticate as Higher Command Officer in the Demo Portal tab to enable live geospatial coordinate plotting.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-1.5 border-b border-slate-900 pb-2">
                        <button
                          type="button"
                          onClick={() => { setPlotType('hazard'); setPlotName('Active Landslide / Flooding'); }}
                          className={`flex-1 py-1 rounded text-[8px] uppercase font-black border transition-all cursor-pointer ${
                            plotType === 'hazard' ? 'bg-rose-500 text-slate-950 border-rose-400' : 'bg-slate-900 text-slate-450 border-slate-800'
                          }`}
                        >
                          Threat
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPlotType('shelter'); setPlotName('GCC Resettlement Safe Camp'); }}
                          className={`flex-1 py-1 rounded text-[8px] uppercase font-black border transition-all cursor-pointer ${
                            plotType === 'shelter' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-900 text-slate-450 border-slate-800'
                          }`}
                        >
                          Safe Haven
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 uppercase block">Label Name</label>
                        <input
                          type="text"
                          value={plotName}
                          onChange={(e) => setPlotName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-200 focus:outline-none"
                        />
                      </div>

                      {plotType === 'hazard' && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-500 uppercase block">Radius (m)</label>
                            <input
                              type="number"
                              value={plotRadius}
                              onChange={(e) => setPlotRadius(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-200 focus:outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-500 uppercase block">Risk %</label>
                            <input
                              type="number"
                              value={plotRisk}
                              onChange={(e) => setPlotRisk(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-200 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const markerId = `${plotType}-custom-${Date.now()}`;
                          const newMarker: HazardMarker = {
                            id: markerId,
                            name: plotName || (plotType === 'shelter' ? 'Safe Haven Camp' : 'Custom Threat'),
                            locationId: locationId,
                            risk: plotType === 'shelter' ? 2 : plotRisk,
                            status: plotType === 'shelter' ? 'safe' : (plotRisk > 75 ? 'danger' : 'warning'),
                            details: plotType === 'shelter' ? 'Live plotted government resettlement refuge camp.' : 'Live plotted geographical threat incident.',
                            population: plotType === 'shelter' ? 0 : 250,
                            lat: clickedLatLng.lat,
                            lng: clickedLatLng.lng,
                            radius: plotRadius,
                          };
                          registerCustomMarker(newMarker);
                          setClickedLatLng(null);
                        }}
                        className="w-full py-1.5 mt-1 rounded bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Confirm Placement
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-900 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />Danger Zone
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Warning Zone
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Safe Shelter
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-6 h-0.5 bg-blue-500 rounded" />OSRM Road Route
          </span>
          {userGps && (
            <span className="flex items-center gap-1.5 text-blue-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-2 ring-blue-300/40" />Your GPS
            </span>
          )}
        </div>
      </div>

      {/* ── EVACUATION SIDEBAR ───────────────────────────────────────────── */}
      <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
        


        {/* ── EVACUATION OPTIMIZER CARD ── */}
        <div className="glass-panel rounded-xl p-5 border-t-4 border-t-cyan-500 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="text-xs font-extrabold tracking-wider text-slate-100 uppercase">
              AI EVACUATION OPTIMIZER
            </h3>
          </div>

          {routeLoading && (
            <div className="py-6 text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-mono">Computing OSRM road route…</p>
            </div>
          )}

          {!routeLoading && activeEvacuationRoute && selectedMarker ? (
            <div className="space-y-3 font-mono">
              {/* Status banner */}
              {activeEvacuationRoute.isRerouted ? (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-start gap-2 text-amber-300 text-[10px]">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">STRAIGHT-LINE FALLBACK</span>
                    OSRM road data unavailable — showing direct path. Use Google Maps for real directions.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2 text-emerald-300 text-[10px]">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">REAL ROAD ROUTE COMPUTED</span>
                    OSRM route via actual roads displayed on map.
                  </div>
                </div>
              )}

              {routeError && (
                <p className="text-[9px] text-rose-400 font-mono bg-rose-950/20 border border-rose-800/40 rounded px-2 py-1">{routeError}</p>
              )}

              {/* Origin */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div className="text-[9px] text-slate-500 uppercase mb-0.5">Evacuating From</div>
                <div className="text-xs font-bold text-rose-300">{selectedMarker.name}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                  {selectedMarker.lat.toFixed(5)}°N, {selectedMarker.lng.toFixed(5)}°E
                </div>
              </div>

              {/* Destination */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div className="text-[9px] text-slate-500 uppercase mb-0.5">Nearest Safe Shelter</div>
                <div className="text-xs font-bold text-emerald-400">{activeEvacuationRoute.targetShelterName}</div>
                {activeEvacuationRoute.targetShelter && (
                  <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                    {activeEvacuationRoute.targetShelter.lat.toFixed(5)}°N,{' '}
                    {activeEvacuationRoute.targetShelter.lng.toFixed(5)}°E
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-900/40 border border-slate-800 rounded">
                  <span className="text-[9px] text-slate-500 block uppercase">Road Distance</span>
                  <span className="text-cyan-400 font-extrabold text-sm">{activeEvacuationRoute.distance}</span>
                </div>
                <div className="p-2.5 bg-slate-900/40 border border-slate-800 rounded">
                  <span className="text-[9px] text-slate-500 block uppercase">Est. Drive Time</span>
                  <span className="text-cyan-400 font-extrabold text-sm">{activeEvacuationRoute.time}</span>
                </div>
              </div>

              {/* Road condition */}
              <div className="p-2.5 bg-slate-900/40 border border-slate-800 rounded text-[10px]">
                <span className="text-[9px] text-slate-500 block uppercase mb-0.5">Route Condition</span>
                <span className="text-slate-200 font-bold">{activeEvacuationRoute.roadCondition}</span>
              </div>

              {/* Google Maps redirect */}
              <button
                onClick={openGoogleMaps}
                className="w-full py-3 rounded-lg bg-[#4285f4] hover:bg-[#2563eb] text-white font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/30"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                Open Turn-by-Turn in Google Maps
              </button>

              {/* Quick directions link as text */}
              <p className="text-[9px] text-slate-500 text-center font-mono">
                Opens Google Maps driving directions in a new tab
              </p>
            </div>
          ) : !routeLoading ? (
            <div className="py-8 px-4 text-center border border-dashed border-slate-800 rounded-lg">
              <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Click any{' '}
                <span className="text-rose-400 font-bold">Red</span> or{' '}
                <span className="text-amber-400 font-bold">Yellow</span> marker on the map
                to compute the real road route to the nearest safe shelter.
              </p>
            </div>
          ) : null}
        </div>

        {/* Selected marker telemetry */}
        {selectedMarker && (
          <div className="glass-panel rounded-xl p-5 border-l-4 border-l-slate-500 flex flex-col gap-3 font-mono">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-slate-200">{selectedMarker.name}</h3>
                <span className="text-[9px] text-slate-500 font-mono">
                  {selectedMarker.lat.toFixed(5)}°N, {selectedMarker.lng.toFixed(5)}°E
                </span>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                selectedMarker.status === 'danger'  ? 'bg-rose-950 text-rose-400' :
                selectedMarker.status === 'warning' ? 'bg-amber-950 text-amber-400' :
                'bg-emerald-950 text-emerald-400'
              }`}>{selectedMarker.status}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-500">Risk Score:</span>
                <span className={`font-bold ${selectedMarker.risk > 80 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {selectedMarker.risk}%
                </span>
              </div>
              {selectedMarker.status !== 'safe' && (
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">Affected Residents:</span>
                  <span className="font-bold text-slate-200">{selectedMarker.population.toLocaleString()}</span>
                </div>
              )}
              <div className="flex flex-col gap-0.5 pt-1">
                <span className="text-slate-500">Assessment:</span>
                <span className="text-slate-400 leading-relaxed text-[10px] mt-1 bg-slate-950 p-2.5 rounded border border-slate-900">
                  {selectedMarker.details}
                </span>
              </div>
              {/* Direct Google Maps link for selected location */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedMarker.lat},${selectedMarker.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors pt-1"
              >
                <MapPin className="w-3 h-3" />
                View location in Google Maps
              </a>
            </div>
          </div>
        )}

        {/* ── GEO COMMAND DESK (Search + Deploy) ── */}
        {isOfficialAuthenticated && (
          <div className="glass-panel rounded-xl p-4 border-t-4 border-t-purple-500 flex flex-col gap-3 font-mono">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-extrabold tracking-wider text-slate-100 uppercase">
                GEO COMMAND DESK
              </h3>
            </div>
            <p className="text-[9px] text-slate-500 -mt-1">Search any location globally and deploy as hazard or safe shelter</p>

            {/* Search input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search college, landmark, city…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchGeocode(); } }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleSearchGeocode}
                disabled={searchLoading}
                className="px-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center"
              >
                {searchLoading ? (
                  <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Search results */}
            {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
              <div className="text-[9px] text-yellow-400/80 italic px-1">⚠️ No results. Try adding a city or district name.</div>
            )}
            {searchResults.length > 0 && (
              <div className="bg-slate-900 border border-slate-700 rounded p-1 divide-y divide-slate-800 max-h-36 overflow-y-auto">
                {searchResults.map((res: any, idx: number) => {
                  const parts = res.display_name.split(',');
                  const main = parts[0]?.trim();
                  const ctx = parts.slice(1, 3).join(',').trim();
                  const tag = res.type || res.class || '';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedResult(res);
                        setSearchQuery(res.display_name.split(',')[0]);
                        setSearchResults([]);
                        if (mapRef.current) {
                          mapRef.current.flyTo([parseFloat(res.lat), parseFloat(res.lon)], 16, { duration: 1.2 });
                        }
                      }}
                      className={`w-full text-left py-1.5 px-2 text-[9px] block cursor-pointer transition-colors rounded-sm ${
                        selectedResult?.place_id === res.place_id ? 'bg-purple-900/40 text-purple-300 font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="shrink-0 mt-0.5">📍</span>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{main}</div>
                          {ctx && <div className="text-slate-500 text-[8px] truncate">{ctx}</div>}
                        </div>
                        {tag && <span className="ml-auto shrink-0 text-[7px] bg-slate-800 text-slate-400 px-1 rounded uppercase">{tag}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Confirmed selection + deploy */}
            {selectedResult && (
              <div className="space-y-2 border-t border-slate-800 pt-2">
                <div className="p-2 bg-purple-950/30 border border-purple-800/40 rounded text-[9px] font-mono">
                  <div className="text-purple-300 font-bold truncate">{selectedResult.display_name.split(',')[0]}</div>
                  <div className="text-slate-500 mt-0.5">{parseFloat(selectedResult.lat).toFixed(5)}°N, {parseFloat(selectedResult.lon).toFixed(5)}°E</div>
                </div>

                {/* Deploy type toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setProvisionType('hazard')}
                    className={`flex-1 py-1 rounded text-[9px] uppercase font-black border transition-all cursor-pointer ${
                      provisionType === 'hazard' ? 'bg-rose-500 text-slate-950 border-rose-400' : 'bg-slate-900 text-slate-500 border-slate-700'
                    }`}
                  >
                    ⚠️ Hazard
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvisionType('shelter')}
                    className={`flex-1 py-1 rounded text-[9px] uppercase font-black border transition-all cursor-pointer ${
                      provisionType === 'shelter' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-900 text-slate-500 border-slate-700'
                    }`}
                  >
                    🛡️ Shelter
                  </button>
                </div>

                {/* Disaster type (hazard only) */}
                {provisionType === 'hazard' && (
                  <select
                    value={selectedDisasterType}
                    onChange={(e) => setSelectedDisasterType(e.target.value as DisasterType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none"
                  >
                    <option value="flood">🌊 Flood</option>
                    <option value="landslide">🏔️ Landslide</option>
                    <option value="cloudburst">⛈️ Cloudburst</option>
                    <option value="earthquake">🌍 Earthquake</option>
                    <option value="wildfire">🔥 Wildfire</option>
                    <option value="tsunami">🌊 Tsunami</option>
                    <option value="gasleak">☁️ Gas Leak</option>
                    <option value="hailstorm">🧊 Hailstorm</option>
                  </select>
                )}

                <button
                  type="button"
                  onClick={handleDeployProvision}
                  className="w-full py-2 rounded bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Deploy to Map
                </button>
              </div>
            )}
          </div>
        )}


        {/* ── EMERGENCY CALL BUTTON ── */}
        <a
          href="tel:112"
          className="glass-panel rounded-xl overflow-hidden border-2 border-rose-500 hover:border-rose-300 bg-rose-950/30 hover:bg-rose-950/50 cursor-pointer transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] group shrink-0"
          title="Tap to call 112 — National Emergency"
        >
          {/* Top label strip */}
          <div className="bg-rose-500/20 border-b border-rose-500/40 px-4 py-1.5 flex items-center justify-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-300">📞 EMERGENCY CALL</span>
          </div>

          {/* Phone icon + number — the main tap target */}
          <div className="flex items-center gap-4 px-5 py-4">
            {/* Animated phone icon */}
            <div className="relative shrink-0">
              {/* Outer ping ring */}
              <div className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping" />
              {/* Inner glow */}
              <div className="relative w-14 h-14 rounded-full bg-rose-500 flex items-center justify-center border-2 border-rose-300 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.7)]">
                <Phone className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Text */}
            <div className="text-left">
              <div className="text-2xl font-black text-white tracking-widest font-mono leading-none">112</div>
              <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider mt-0.5">National Emergency</div>
              <div className="text-[9px] text-slate-500 mt-1">Police · Fire · Ambulance</div>
            </div>
          </div>

          {/* Bottom instruction */}
          <div className="bg-slate-950/40 border-t border-rose-900/40 px-4 py-1.5 text-center">
            <span className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">Single tap connects to control room</span>
          </div>
        </a>
      </div>
    </div>
  );
};

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Haversine distance (meters) ─────────────────────────────────────────────
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Check if a safe shelter falls inside any active threat's severity range
export function isShelterCompromised(shelterLat: number, shelterLng: number, allMarkers: HazardMarker[]): { compromised: boolean; threatName?: string } {
  for (const m of allMarkers) {
    if (m.status !== 'safe' && m.risk > 10) {
      const radiusMeters = m.radius || 1000;
      const distanceMeters = haversineMeters(m.lat, m.lng, shelterLat, shelterLng);
      if (distanceMeters <= radiusMeters) {
        return { compromised: true, threatName: m.name };
      }
    }
  }
  return { compromised: false };
}

export default TabGisMap;
