import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { RefreshCw, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

const BACKEND_URL = 'http://localhost:3001/api/disasters';
const SYNC_URL = 'http://localhost:3001/api/disasters/sync';

// Custom icons
const makeIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 0 0 3px ${color}55, 0 2px 8px rgba(0,0,0,0.4);
      animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });

const DEFAULT_ICON = makeIcon('#ef4444');
const HIGH_RISK_ICON = makeIcon('#7f1d1d');

export const TabGlobalLive: React.FC = () => {
  const [disasters, setDisasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const fetchDisasters = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BACKEND_URL);
      setDisasters(res.data);
    } catch (err) {
      console.error('Failed to fetch disasters:', err);
    }
    setLoading(false);
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      await axios.post(SYNC_URL);
      await fetchDisasters();
    } catch (err) {
      console.error('Sync failed', err);
    }
    setSyncing(false);
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full">
      <div className="flex-1 glass-panel rounded-xl p-4 flex flex-col min-h-[560px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                GLOBAL LIVE THREATS
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Real-time natural events synchronized via NASA EONET and analyzed by AI
              </p>
            </div>
          </div>
          <button
            onClick={syncData}
            disabled={syncing}
            className={`flex items-center gap-1.5 text-[10px] font-mono border px-3 py-1.5 rounded transition-all cursor-pointer ${
              syncing
                ? 'bg-slate-800 text-slate-500 border-slate-700'
                : 'bg-rose-950/40 border-rose-500 text-rose-400 hover:bg-rose-900/60'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing with NASA...' : 'Sync Live Data'}
          </button>
        </div>

        <div className="flex-1 rounded-lg overflow-hidden border border-slate-700 min-h-[420px] relative">
          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 z-[1000] flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
              <div className="text-rose-400 font-mono text-xs">Connecting to regional satellite feeds...</div>
            </div>
          )}
          <MapContainer
            center={[22.5937, 78.9629]}
            zoom={4.5}
            style={{ height: '100%', width: '100%', minHeight: '420px' }}
            scrollWheelZoom
            className="z-0"
            ref={mapRef as any}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="© Esri &mdash; Source: Esri, USGS, NOAA"
              maxZoom={10}
            />

            {disasters.map(d => {
              const isHighRisk = d.severityScore >= 80;
              return (
                <Marker
                  key={d._id}
                  position={[d.coordinates.lat, d.coordinates.lng]}
                  icon={isHighRisk ? HIGH_RISK_ICON : DEFAULT_ICON}
                >
                  <Popup className="leaflet-popup-dark">
                    <div className="p-2 min-w-[220px]">
                      <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                        {isHighRisk ? <ShieldAlert className="w-4 h-4 text-rose-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        <span className={`text-xs font-bold ${isHighRisk ? 'text-rose-500' : 'text-amber-500'}`}>
                          {d.category.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-100 font-bold mb-1 leading-tight">{d.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mb-3">
                        {d.coordinates.lat.toFixed(4)}°N, {d.coordinates.lng.toFixed(4)}°E
                      </div>
                      
                      {d.aiAnalysis && (
                        <div className="bg-slate-900 p-2 rounded border border-slate-800 mb-2">
                          <div className="text-[9px] text-cyan-500 uppercase font-bold mb-1 flex items-center gap-1">
                            <Activity className="w-3 h-3" /> AI Risk Analysis
                          </div>
                          <div className="text-[10px] text-slate-300 leading-relaxed">{d.aiAnalysis}</div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[9px] text-slate-500">Severity Score:</span>
                        <span className={`text-xs font-black ${isHighRisk ? 'text-rose-500' : 'text-amber-500'}`}>
                          {d.severityScore || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
      
      {/* Sidebar for listing top severe disasters */}
      <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
        <div className="glass-panel rounded-xl p-5 border-t-4 border-t-rose-500 shadow-xl flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-400" />
            <h3 className="text-xs font-extrabold tracking-wider text-slate-100 uppercase">
              CRITICAL THREATS
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {disasters
              .filter(d => d.severityScore >= 80)
              .sort((a, b) => b.severityScore - a.severityScore)
              .map(d => (
                <div key={d._id} className="p-3 bg-slate-900/60 border border-rose-900/30 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-[9px] text-rose-500 uppercase font-bold">{d.category}</div>
                    <div className="text-[10px] font-black text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded">
                      {d.severityScore}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-200 leading-tight mb-2">{d.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {d.aiAnalysis}
                  </div>
                  <button 
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.flyTo([d.coordinates.lat, d.coordinates.lng], 8, { duration: 1.5 });
                      }
                    }}
                    className="mt-3 text-[9px] uppercase tracking-wider text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Activity className="w-3 h-3" /> Locate on Map
                  </button>
                </div>
              ))}
              
            {disasters.filter(d => d.severityScore >= 80).length === 0 && !loading && (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No critical threats (Score &gt;= 80) currently detected by AI.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
