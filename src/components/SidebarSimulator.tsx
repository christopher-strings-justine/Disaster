import React from 'react';
import { Sliders, MapPin, AlertTriangle, Zap, CloudRain, Flame, Trash2, ArrowUpRight } from 'lucide-react';
import { DisasterType, IntensityLevel, LocationId } from '../types';

interface SidebarSimulatorProps {
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
}

export const SidebarSimulator: React.FC<SidebarSimulatorProps> = ({
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
}) => {
  return (
    <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
      {/* Simulation Controller Panel */}
      <div className="glass-panel rounded-xl p-5 border-l-4 border-l-cyan-500 shadow-xl relative overflow-hidden">
        <div className="tech-grid absolute inset-0 opacity-10 pointer-events-none"></div>

        <div className="flex items-center gap-2 mb-4 relative z-10">
          <div className="p-1.5 rounded-md bg-cyan-950/60 border border-cyan-500/20 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
              DEMO SCENARIO CONTROL
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">Simulate Live Disaster Events</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {/* Target Region */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1.5 uppercase tracking-wider">
              1. Select Target Region
            </label>
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-2 hover:border-slate-700 transition-colors">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <select
                value={simLocation}
                onChange={(e) => setSimLocation(e.target.value as LocationId)}
                className="w-full bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                disabled={systemAlert}
              >
                <option value="wayanad" className="bg-slate-950 text-slate-200">
                  Wayanad Hills (Kerala)
                </option>
                <option value="joshimath" className="bg-slate-950 text-slate-200">
                  Joshimath Valley (Uttarakhand)
                </option>
              </select>
            </div>
          </div>

          {/* Disaster Type */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 font-mono block mb-1.5 uppercase tracking-wider">
              2. Disaster Susceptibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['cloudburst', 'landslide', 'flood'] as DisasterType[]).map((type) => {
                const isActive = simDisaster === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSimDisaster(type)}
                    disabled={systemAlert}
                    className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 justify-center cursor-pointer ${
                      isActive
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {type === 'cloudburst' && <CloudRain className="w-4 h-4" />}
                    {type === 'landslide' && <Flame className="w-4 h-4 rotate-180 text-orange-400" />}
                    {type === 'flood' && <Zap className="w-4 h-4 text-blue-400" />}
                    <span className="text-[10px] font-bold font-mono capitalize">
                      {type === 'cloudburst' ? 'Cloudburst' : type === 'landslide' ? 'Landslide' : 'Flash Flood'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                3. Hazard Intensity
              </label>
              <span
                className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                  simIntensity === 'severe'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                    : simIntensity === 'medium'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                }`}
              >
                {simIntensity}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={simIntensity === 'low' ? 0 : simIntensity === 'medium' ? 1 : 2}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSimIntensity(val === 0 ? 'low' : val === 1 ? 'medium' : 'severe');
                }}
                disabled={systemAlert}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1 px-1">
              <span>LOW</span>
              <span>MEDIUM</span>
              <span>SEVERE</span>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2 space-y-2">
            {!systemAlert ? (
              <button
                type="button"
                onClick={triggerDisaster}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 text-slate-950 font-extrabold text-xs tracking-wider uppercase hover:shadow-lg hover:shadow-rose-950/40 transition-all flex items-center justify-center gap-1.5 border border-rose-400/20 active:scale-98 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-slate-950" />
                TRIGGER SIMULATION
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-rose-400 font-bold font-mono text-xs uppercase animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    SIMULATOR LOCK ACTIVE
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-mono leading-relaxed">
                    A severe hazard is currently active on the map. Reset the simulation to trigger a new event.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetSimulation}
                  className="w-full py-2 px-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-extrabold text-[11px] tracking-wider uppercase hover:bg-slate-850 hover:text-white transition-colors flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  RESET SYSTEM
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulator Feed Details / Status Updates */}
      {systemAlert && activeDisasterInfo && (
        <div className="glass-panel rounded-xl p-4 border border-rose-950 bg-rose-950/10 shadow-lg flex flex-col gap-2.5 animate-glow-rose">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-rose-400 font-bold font-mono uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              RE-OPTIMIZING STATUS
            </span>
            <span className="text-[9px] text-slate-400 font-mono">SEC-ID: {activeDisasterInfo.location === 'wayanad' ? 'WY-LD-2026' : 'JM-SS-2026'}</span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Event Class:</span>
              <span className="font-bold text-rose-400 uppercase">{activeDisasterInfo.disaster}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Hazard Index:</span>
              <span className="font-bold text-rose-400">
                {activeDisasterInfo.intensity === 'severe' ? '94.8%' : activeDisasterInfo.intensity === 'medium' ? '74.2%' : '48.5%'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Relocation State:</span>
              <span className="font-bold text-amber-400">In Progress</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Safe carrying:</span>
              <span className="font-bold text-emerald-400">Reallocated</span>
            </div>
          </div>

          <div className="mt-1 p-2 bg-slate-950/80 rounded border border-rose-900/30 text-[10px] text-slate-400 leading-relaxed font-mono">
            💡 <span className="text-slate-200">Re-optimization effect:</span> Safe carrying capacities reallocated. Shelter capacity in relocation zone set to 92% occupancy. Safe cyan vector route drawn to shelter.
          </div>
        </div>
      )}

      {/* General telemetry status cards */}
      <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-300 tracking-wide uppercase">
          SAT-COM LINK STATUS
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              INSAT-3D Payload
            </span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Bhuvan Raster WMS
            </span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              GIS Evac Engine
            </span>
            <span className="text-cyan-400 font-bold">STABLE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default SidebarSimulator;
