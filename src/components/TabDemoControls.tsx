import React, { useState } from 'react';
import { Sliders, MapPin, AlertTriangle, Trash2, ShieldAlert, Thermometer, Droplet, Wind, CloudRain, Radio, Plus, Trash, Lock, Unlock, KeyRound, Home, Users, Check, Search, Crosshair } from 'lucide-react';
import { DisasterType, IntensityLevel, LocationId, WeatherData, Announcement, HazardMarker } from '../types';

interface TabDemoControlsProps {
  simLocation: LocationId;
  setSimLocation: (loc: LocationId) => void;
  simDisaster: DisasterType;
  setSimDisaster: (dis: DisasterType) => void;
  simIntensity: IntensityLevel;
  setSimIntensity: (intensity: IntensityLevel) => void;
  triggerDisaster: () => void;
  resetSimulation: () => void;
  systemAlert: boolean;
  activeDisasterInfo: {
    disaster: DisasterType;
    intensity: IntensityLevel;
    location: LocationId;
  } | null;
  weather: WeatherData;
  announcements: Announcement[];
  addCustomAnnouncement: (message: string, source: string) => void;
  deleteAnnouncement: (id: string) => void;
  isOfficialAuthenticated: boolean;
  authenticateOfficial: (pin: string) => boolean;
  registerShelter: (name: string, locationId: LocationId, lat: number, lng: number, capacity: number) => void;
  registerResponder: (name: string, type: 'Police' | 'Fire' | 'Medical' | 'NGO', location: string) => void;
  logoutOfficial: () => void;
  severityRadius: number;
  setSeverityRadius: (val: number) => void;
  markers: HazardMarker[];
  clearHazard: (id: string) => void;
  registerCustomMarker: (marker: HazardMarker) => void;
}

export const TabDemoControls: React.FC<TabDemoControlsProps> = ({
  simLocation,
  setSimLocation,
  simDisaster,
  setSimDisaster,
  simIntensity,
  setSimIntensity,
  triggerDisaster,
  resetSimulation,
  systemAlert,
  activeDisasterInfo,
  weather,
  announcements,
  addCustomAnnouncement,
  deleteAnnouncement,
  isOfficialAuthenticated,
  authenticateOfficial,
  registerShelter,
  registerResponder,
  logoutOfficial,
  severityRadius,
  setSeverityRadius,
  markers,
  clearHazard,
  registerCustomMarker,
}) => {
  const [customMsg, setCustomMsg] = useState('');
  const [customSrc, setCustomSrc] = useState('District DM');

  // Common occurred Indian disaster presets
  const INDIAN_DISASTERS = [
    { name: "Urban Deluge Waterlogging", details: "Severe rainfall drainage blockage. Heavy flooding in lowlands and basement parking." },
    { name: "Cyclone Deluge Inundation", details: "East coast monsoonal storm surge. Canal breach and ocean overflow. Dangerous winds." },
    { name: "Debris Flow Mudslide", details: "Saturated hills slope soil shear failure. Road blockages on main connector highway." },
    { name: "Sunil Creep Subsidence", details: "Himalayan active foundational rock creep. Wide tension cracks reported. Evacuation alert." },
    { name: "Cloudburst Flash Flood", details: "Sudden extreme local cloudburst precipitation. High velocity runoff inundating enclaves." },
    { name: "Valley Fault Tremor (M5.5)", details: "Himalayan V-zone active fault tremor. Structural damage and active rockfall warnings." }
  ];

  const spawnRandomIncident = () => {
    const chosen = INDIAN_DISASTERS[Math.floor(Math.random() * INDIAN_DISASTERS.length)];
    
    // Generate random coordinates inside the currently active region sector
    let lat = 12.96;
    let lng = 80.22;
    if (simLocation === 'chennai') {
      lat = 12.9200 + Math.random() * 0.08;
      lng = 80.1800 + Math.random() * 0.08;
    } else if (simLocation === 'wayanad') {
      lat = 11.5300 + Math.random() * 0.07;
      lng = 76.0300 + Math.random() * 0.07;
    } else {
      lat = 30.5000 + Math.random() * 0.06;
      lng = 79.5200 + Math.random() * 0.05;
    }

    const riskScore = 70 + Math.floor(Math.random() * 28); // 70% to 98%
    const radVal = 600 + Math.floor(Math.random() * 1900); // 600m to 2500m

    const markerId = `hazard-random-${Date.now()}`;
    const newMarker: HazardMarker = {
      id: markerId,
      name: `${chosen.name} (${lat.toFixed(3)}°N)`,
      locationId: simLocation,
      risk: riskScore,
      status: riskScore > 85 ? 'danger' : 'warning',
      details: chosen.details,
      population: 300 + Math.floor(Math.random() * 1500),
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      radius: radVal,
    };

    registerCustomMarker(newMarker);
  };

  // Authorization Form State
  const [pinVal, setPinVal] = useState('');

  // Shelter Registration State
  const [shelterName, setShelterName] = useState('');
  const [shelterRegion, setShelterRegion] = useState<LocationId>('chennai');
  const [shelterLat, setShelterLat] = useState('');
  const [shelterLng, setShelterLng] = useState('');
  const [shelterCapacity, setShelterCapacity] = useState('');

  // Auto-suggest and Geocoding States
  const [locQuery, setLocQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Search OSM Nominatim API
  const fetchSuggestions = async (val: string) => {
    setLocQuery(val);
    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSuggestLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=in&limit=5`
      );
      const data = await response.json();
      setSuggestions(data || []);
    } catch (err) {
      console.error('Geocoding search failed', err);
    } finally {
      setSuggestLoading(false);
    }
  };

  const selectSuggestion = (sug: any) => {
    const lat = parseFloat(sug.lat);
    const lng = parseFloat(sug.lon);
    setShelterLat(lat.toString());
    setShelterLng(sug.lon);
    
    // Auto-fill shelter name with a cleaned version of the address
    const nameParts = sug.display_name.split(',');
    const simpleName = nameParts.slice(0, 2).join(',').trim();
    setShelterName(simpleName);
    setLocQuery(sug.display_name);
    setSuggestions([]);

    // Auto-detect Regional Sector from coordinates
    if (lat >= 12.8 && lat <= 13.2 && lng >= 80.1 && lng <= 80.4) {
      setShelterRegion('chennai');
    } else if (lat >= 11.4 && lat <= 11.7 && lng >= 75.9 && lng <= 76.2) {
      setShelterRegion('wayanad');
    } else if (lat >= 30.3 && lat <= 30.7 && lng >= 79.3 && lng <= 79.7) {
      setShelterRegion('joshimath');
    }
  };

  // Browser Geolocation API
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setShelterLat(lat.toFixed(6));
          setShelterLng(lng.toFixed(6));
          setLocQuery(`Device GPS Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`);
          if (!shelterName) {
            setShelterName(`Active GPS Relief Shelter`);
          }
          // Set appropriate region sector
          if (lat >= 12.8 && lat <= 13.2 && lng >= 80.1 && lng <= 80.4) {
            setShelterRegion('chennai');
          } else if (lat >= 11.4 && lat <= 11.7 && lng >= 75.9 && lng <= 76.2) {
            setShelterRegion('wayanad');
          } else if (lat >= 30.3 && lat <= 30.7 && lng >= 79.3 && lng <= 79.7) {
            setShelterRegion('joshimath');
          }
        },
        (err) => {
          const defaults: Record<LocationId, [number, number]> = {
            chennai: [12.9762, 80.2181],
            wayanad: [11.5755, 76.0533],
            joshimath: [30.5618, 79.5643],
          };
          const [lat, lng] = defaults[shelterRegion];
          setShelterLat(lat.toString());
          setShelterLng(lng.toString());
          setLocQuery(`Fallback GPS Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`);
          if (!shelterName) {
            setShelterName(`GPS Safe Resettlement Haven`);
          }
        }
      );
    }
  };

  // Responder Registration State
  const [responderName, setResponderName] = useState('');
  const [responderType, setResponderType] = useState<'Police' | 'Fire' | 'Medical' | 'NGO'>('Police');
  const [responderLoc, setResponderLoc] = useState('');

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMsg.trim()) {
      addCustomAnnouncement(customMsg, customSrc);
      setCustomMsg('');
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = authenticateOfficial(pinVal);
    if (success) {
      setPinVal('');
    }
  };

  const handleShelterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(shelterLat);
    const lng = parseFloat(shelterLng);
    const cap = parseInt(shelterCapacity);

    if (shelterName && !isNaN(lat) && !isNaN(lng) && !isNaN(cap)) {
      registerShelter(shelterName, shelterRegion, lat, lng, cap);
      // Reset form
      setShelterName('');
      setShelterLat('');
      setShelterLng('');
      setShelterCapacity('');
      setLocQuery('');
    }
  };

  const handleResponderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (responderName && responderLoc) {
      registerResponder(responderName, responderType, responderLoc);
      // Reset form
      setResponderName('');
      setResponderLoc('');
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      
      {/* Top Section: controls & logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Simulation Controls (Left Column) */}
        <div className="xl:col-span-2 glass-panel rounded-xl p-5 border-t-4 border-t-rose-500 shadow-xl relative overflow-hidden flex flex-col gap-6">
          <div className="tech-grid absolute inset-0 opacity-5 pointer-events-none"></div>

          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/20 text-rose-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
                CRITICAL INCIDENT GENERATOR
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Simulate live disaster events to test neural algorithms and carrying capacity optimization
              </p>
            </div>
          </div>

          {/* Controls Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column A: Selection */}
            <div className="space-y-4">
              {/* Target Region */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1.5 uppercase tracking-wider">
                  1. Select Vulnerable Target Region
                </label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2.5 hover:border-slate-700 transition-all">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <select
                    value={simLocation}
                    onChange={(e) => setSimLocation(e.target.value as LocationId)}
                    className="w-full bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                    disabled={systemAlert}
                  >
                    <option value="chennai" className="bg-slate-950 text-slate-200">
                      Chennai Sector (Tamil Nadu, India)
                    </option>
                    <option value="wayanad" className="bg-slate-950 text-slate-200">
                      Wayanad Hills (Kerala, India)
                    </option>
                    <option value="joshimath" className="bg-slate-950 text-slate-200">
                      Joshimath Valley (Uttarakhand, India)
                    </option>
                  </select>
                </div>
              </div>

              {/* Disaster Scenario */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1.5 uppercase tracking-wider">
                  2. Select Hazard Scenario
                </label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2.5 hover:border-slate-700 transition-all">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <select
                    value={simDisaster}
                    onChange={(e) => setSimDisaster(e.target.value as DisasterType)}
                    className="w-full bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                    disabled={systemAlert}
                  >
                    <option value="cloudburst" className="bg-slate-950 text-slate-200">Cloudburst Event</option>
                    <option value="landslide" className="bg-slate-950 text-slate-200">Severe Landslide</option>
                    <option value="earthquake" className="bg-slate-950 text-slate-200">Seismic Tremor (M5.2)</option>
                    <option value="flood" className="bg-slate-950 text-slate-200">River Flash Flood</option>
                  </select>
                </div>
              </div>

              {/* Severity Level */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1.5 uppercase tracking-wider">
                  3. Select Incident Severity
                </label>
                <div className="flex gap-2">
                  {(['moderate', 'severe', 'catastrophic'] as IntensityLevel[]).map((level) => {
                    const isSelected = simIntensity === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSimIntensity(level)}
                        className={`flex-1 py-2 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500 text-slate-950 border-rose-400 font-black'
                            : 'bg-slate-900 text-slate-450 border-slate-800 hover:border-slate-750 hover:text-slate-350'
                        }`}
                        disabled={systemAlert}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Radius of Severity */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1.5 uppercase tracking-wider">
                  4. Custom Radius of Severity
                </label>
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-2 hover:border-slate-700 transition-all">
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={severityRadius}
                    onChange={(e) => setSeverityRadius(Number(e.target.value))}
                    disabled={systemAlert}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-rose-400 font-mono font-black shrink-0 whitespace-nowrap bg-rose-950/40 border border-rose-900/30 px-1.5 py-0.5 rounded">
                    {severityRadius} m
                  </span>
                </div>
              </div>
            </div>

            {/* Column B: Command Desk Triggers */}
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between gap-4 font-mono">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Trigger Desk</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      systemAlert ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                    }`}
                  ></span>
                </div>

                {systemAlert && activeDisasterInfo ? (
                  <div className="space-y-2 text-[10px] leading-relaxed">
                    <div className="text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      CRITICAL ALARM DEPLOYED
                    </div>
                    <p className="text-slate-400">
                      Disaster profile generated for{' '}
                      <span className="text-slate-200 font-bold">{activeDisasterInfo.location.toUpperCase()}</span>.
                      Live precipitation spikes of{' '}
                      <span className="text-rose-300 font-bold">{weather.precipitation} mm/h</span> routed to MET HUD and
                      evacuation routes updated automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-[10px] text-slate-500 leading-relaxed">
                    <div className="text-slate-400 uppercase tracking-widest font-bold">Simulator Arm Status: STANDBY</div>
                    <p>
                      Trigger a disaster to test carrying capacity thresholds, dynamic detour vector path solvers, and
                      dispatch task priorities.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {systemAlert ? (
                  <button
                    type="button"
                    onClick={resetSimulation}
                    className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Reset & Clear Alarm
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={triggerDisaster}
                      className="w-[60%] py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-950/20"
                    >
                      Trigger Scenario
                    </button>
                    <button
                      type="button"
                      onClick={spawnRandomIncident}
                      className="w-[40%] py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-950/20"
                    >
                      Spawn Random
                    </button>
                  </>
                )}
              </div>

              {/* Active Incident Threats list to remove manually */}
              <div className="border-t border-slate-900 pt-3 mt-2 space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                  Active Hazard Threat Registry ({markers.filter(m => m.locationId === simLocation && m.status !== 'safe').length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {markers.filter(m => m.locationId === simLocation && m.status !== 'safe').map((m) => (
                    <div key={m.id} className="flex items-center justify-between bg-slate-900/60 border border-slate-850 p-2 rounded gap-2">
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-slate-200 block truncate">{m.name}</span>
                        <span className="text-[8px] text-rose-400 font-mono">Risk Index: {m.risk}% • {m.status.toUpperCase()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => clearHazard(m.id)}
                        className="px-2 py-1 bg-rose-955 hover:bg-rose-900 border border-rose-900/30 text-rose-400 hover:text-rose-200 rounded text-[9px] uppercase font-mono font-bold transition-all shrink-0 cursor-pointer"
                        title="Remove Hazard Alert"
                      >
                        Clear Alert
                      </button>
                    </div>
                  ))}
                  {markers.filter(m => m.locationId === simLocation && m.status !== 'safe').length === 0 && (
                    <div className="text-[9px] text-slate-650 italic text-center py-2">
                      No active hazard alarms triggered.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Alerts Center (Right Column) */}
        <div className="glass-panel rounded-xl p-5 border-t-4 border-t-cyan-500 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3 shrink-0">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
                DISTRICT BULLETIN FEED
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Post real-world administrative warnings and alerts
              </p>
            </div>
          </div>

          <form onSubmit={handleAddAnnouncement} className="space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase block">Source</label>
                <select
                  value={customSrc}
                  onChange={(e) => setCustomSrc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] font-mono text-slate-200 focus:outline-none"
                >
                  <option value="District DM Office">District DM Office</option>
                  <option value="Kerala SDMA">Kerala SDMA</option>
                  <option value="Uttarakhand SDMA">Uttarakhand SDMA</option>
                  <option value="NDRF Command">NDRF Command</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-bold uppercase block">Broadcast Message</label>
              <textarea
                rows={2}
                placeholder="Enter official warning coordinates or evacuation notices..."
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 px-3 rounded bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-950" />
              Dispatch Broadcast
            </button>
          </form>

          {/* Announcements List */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[160px] pr-1">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-slate-900 pb-1">
              Active Broadcast Logs
            </h4>
            {announcements.length === 0 ? (
              <p className="text-[10px] text-slate-600 font-mono py-4 text-center">No active bulletins.</p>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-2 bg-slate-950 border border-slate-900 rounded font-mono text-[9px] relative group hover:border-slate-800 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1 text-slate-500 font-bold">
                    <span>{ann.source}</span>
                    <span className="text-[8px] text-slate-600 font-normal">{ann.time}</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed pr-6">{ann.message}</p>
                  <button
                    type="button"
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="absolute right-2 top-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete Bulletin"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Official Command Resource Provisioning */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 relative overflow-hidden">
        
        {/* Authentication Check */}
        {!isOfficialAuthenticated ? (
          <div className="py-6 flex flex-col items-center justify-center gap-4 text-center relative z-10 font-mono max-w-md mx-auto">
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/25 rounded-full text-rose-400 animate-pulse">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                ADMINISTRATIVE PROVISIONING PORTAL LOCKED
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Only higher emergency command officials can register new safe shelters (refuge locations) or add active emergency response teams to the deployment registry.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="w-full flex gap-2 mt-2">
              <input
                type="password"
                placeholder="Enter passcode (PIN: SIH2026)"
                value={pinVal}
                onChange={(e) => setPinVal(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-805 rounded p-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-rose-500 hover:bg-rose-600 text-slate-950 font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Authenticate
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 relative z-10 font-mono">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
                    OFFICIAL RESOURCE PROVISIONING DESK
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Authority status: <span className="text-emerald-400 font-bold">Verified Officer Logged In</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logoutOfficial}
                className="py-1 px-3 border border-slate-850 rounded text-slate-400 hover:border-slate-700 hover:text-slate-200 text-[9px] uppercase font-bold transition-all cursor-pointer"
              >
                Lock Access
              </button>
            </div>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              
              {/* Form 1: Register Shelter */}
              <div className="space-y-4 border-r border-slate-900 pr-0 md:pr-8">
                <div className="flex items-center gap-1.5 text-slate-200 border-b border-slate-900 pb-1.5">
                  <Home className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Register Resettlement Safe Shelter
                  </span>
                </div>
                <form onSubmit={handleShelterSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase block">Shelter Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Helang Community Hall"
                        value={shelterName}
                        onChange={(e) => setShelterName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase block">Region Sector</label>
                      <select
                        value={shelterRegion}
                        onChange={(e) => setShelterRegion(e.target.value as LocationId)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none"
                      >
                        <option value="chennai">Chennai Sector</option>
                        <option value="wayanad">Wayanad Hills</option>
                        <option value="joshimath">Joshimath Valley</option>
                      </select>
                    </div>
                  </div>

                  {/* Location Auto-Suggest Input */}
                  <div className="space-y-1 relative">
                    <label className="text-[9px] text-slate-500 uppercase block">Search Location (Auto-Suggest Coordinates)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search e.g. Velachery, Chennai..."
                          value={locQuery}
                          onChange={(e) => fetchSuggestions(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 pr-8 text-[10px] text-slate-200 focus:outline-none"
                        />
                        {suggestLoading && (
                          <div className="absolute right-2.5 top-2.5 w-3.5 h-3.5 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-300 border border-blue-800 rounded text-[9px] uppercase font-bold transition-all cursor-pointer shrink-0"
                        title="Use Current Geolocation GPS"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        GPS
                      </button>
                    </div>

                    {/* Suggestions list */}
                    {suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 divide-y divide-slate-900 max-h-40 overflow-y-auto">
                        {suggestions.map((sug, idx) => (
                          <div
                            key={idx}
                            onClick={() => selectSuggestion(sug)}
                            className="p-2 text-[9px] text-slate-350 hover:bg-slate-900 hover:text-slate-100 cursor-pointer truncate font-mono"
                          >
                            📍 {sug.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resolved Coordinate Display */}
                  <div className="bg-slate-950 border border-slate-900 rounded p-2.5 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 uppercase">Resolved Coordinates</span>
                    {shelterLat && shelterLng ? (
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">
                        📍 {parseFloat(shelterLat).toFixed(4)}°N, {parseFloat(shelterLng).toFixed(4)}°E
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-mono animate-pulse">
                        No coordinates loaded
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase block">Bed Capacity</label>
                    <input
                      type="number"
                      placeholder="e.g. 350"
                      value={shelterCapacity}
                      onChange={(e) => setShelterCapacity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Add Resettlement Haven
                  </button>
                </form>
              </div>

              {/* Form 2: Register Rescue Unit */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-slate-200 border-b border-slate-900 pb-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Provision New Rescue Response Unit
                  </span>
                </div>

                <form onSubmit={handleResponderSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase block">Unit Name</label>
                      <input
                        type="text"
                        placeholder="e.g. SDRF Heavy Machinery Unit-5"
                        value={responderName}
                        onChange={(e) => setResponderName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase block">Rescue Division</label>
                      <select
                        value={responderType}
                        onChange={(e) => setResponderType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none"
                      >
                        <option value="Police">Police / SDRF Units</option>
                        <option value="Fire">Fire / Special Rescue</option>
                        <option value="Medical">Medical / Red Cross</option>
                        <option value="NGO">NGO Volunteers / Civil Defense</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase block">Headquarters / Dispatch Base Station</label>
                    <input
                      type="text"
                      placeholder="e.g. Joshimath SDRF Station"
                      value={responderLoc}
                      onChange={(e) => setResponderLoc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Provision Rescue Unit
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
};
export default TabDemoControls;
