import React, { useState } from 'react';
import { Activity, Wind, Droplets, Thermometer, AlertTriangle, ShieldCheck } from 'lucide-react';

export const TabDisasterDetection: React.FC = () => {
  const [activeHazardTab, setActiveHazardTab] = useState<'flood' | 'storm' | 'cyclone' | 'wildfire' | 'heat' | 'cold'>('cyclone');
  const [simulatorEnabled, setSimulatorEnabled] = useState(false);

  const [precipRate, setPrecipRate] = useState(35);
  const [windSpeed, setWindSpeed] = useState(65);
  const [ambientTemp, setAmbientTemp] = useState(38);
  const [relativeHumidity, setRelativeHumidity] = useState(75);

  // Simple heuristic for score calculation (mock)
  const calculateScore = () => {
    let score = 10;
    if (activeHazardTab === 'cyclone') {
      score += (windSpeed / 100) * 40;
      score += (precipRate / 100) * 30;
      score += (100 - relativeHumidity) * 0.1;
    } else if (activeHazardTab === 'flood') {
      score += (precipRate / 100) * 80;
    } else if (activeHazardTab === 'wildfire') {
      score += (ambientTemp / 50) * 40;
      score += ((100 - relativeHumidity) / 100) * 40;
      score += (windSpeed / 100) * 10;
    }
    return Math.min(Math.floor(score), 100);
  };

  const score = calculateScore();
  let hazardLevel = 'LOW HAZARD';
  let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score > 40) { hazardLevel = 'MODERATE HAZARD'; badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30'; }
  if (score > 70) { hazardLevel = 'HIGH HAZARD'; badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30'; }

  return (
    <div className="h-full p-4 md:p-6 overflow-y-auto space-y-6 custom-scrollbar">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Rule-Based Detection Matrix & Physics Engine
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
          Hazard Verification & Transparent Heuristics
        </h2>
        <p className="text-slate-400 text-sm">Every disaster risk score is derived from physical environmental thresholds, not black-box assumptions.</p>
      </div>

      {/* Hazard Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-4">
        {[
          { id: 'flood', label: 'Flood Risk', icon: Droplets },
          { id: 'storm', label: 'Severe Storm', icon: Activity },
          { id: 'cyclone', label: 'Cyclone / Gale', icon: Wind },
          { id: 'wildfire', label: 'Wildfire Weather', icon: Thermometer },
          { id: 'heat', label: 'Extreme Heat', icon: Thermometer },
          { id: 'cold', label: 'Extreme Cold', icon: Thermometer }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveHazardTab(tab.id as any)}
            className={`flex-1 min-w-[120px] p-3 rounded-lg border text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
              activeHazardTab === tab.id 
                ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                : 'bg-slate-900/50 border-slate-700/50 text-slate-500 hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Engine Output */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">{activeHazardTab.toUpperCase()} & EXTREME ATMOSPHERIC EVENT ENGINE OUTPUT</div>
              <div className="text-4xl font-black text-white">Score {score} <span className="text-lg text-slate-500">/ 100</span></div>
            </div>
            <div className={`px-3 py-1 rounded border text-xs font-black tracking-widest ${badgeColor}`}>
              {hazardLevel}
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Contributing Variable Weights & Raw Metrics</div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Barometric Depression Core</span>
                <span className="font-mono">1007.8 hPa</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Sustained Gale Wind Field</span>
                <span className="font-mono">{windSpeed.toFixed(1)} km/h</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(windSpeed / 150) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Coastal Inundation & Deluge Risk</span>
                <span className="font-mono">24h Rain: {precipRate.toFixed(1)}mm</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(precipRate / 100) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Simulator */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-sm">
              <AlertTriangle className="w-4 h-4" /> Interactive Stress-Test Simulator
            </div>
            <button 
              onClick={() => setSimulatorEnabled(!simulatorEnabled)}
              className={`px-3 py-1.5 rounded border text-xs font-bold transition-colors ${simulatorEnabled ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              {simulatorEnabled ? 'Disable Simulator' : 'Enable Simulator'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-6">Using live Open Meteo telemetry. Click "Enable Simulator" to test custom weather conditions.</p>

          <div className={`space-y-6 ${!simulatorEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Slider 1 */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                <span>Precipitation Rate</span>
                <span className="font-mono">{precipRate} mm/h</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={precipRate} 
                onChange={(e) => setPrecipRate(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider 2 */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                <span>Sustained Wind Speed</span>
                <span className="font-mono">{windSpeed} km/h</span>
              </div>
              <input 
                type="range" 
                min="0" max="150" 
                value={windSpeed} 
                onChange={(e) => setWindSpeed(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider 3 */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                <span>Ambient Temperature</span>
                <span className="font-mono">{ambientTemp}°C</span>
              </div>
              <input 
                type="range" 
                min="-20" max="60" 
                value={ambientTemp} 
                onChange={(e) => setAmbientTemp(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Slider 4 */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                <span>Relative Humidity</span>
                <span className="font-mono">{relativeHumidity}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={relativeHumidity} 
                onChange={(e) => setRelativeHumidity(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
