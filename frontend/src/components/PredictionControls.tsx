import React from 'react';
import { Activity, Clock, SlidersHorizontal, ShieldAlert, Check, Server, RefreshCw } from 'lucide-react';
import { ForecastWindow, DataSourceStatus } from '../types/prediction';

interface PredictionControlsProps {
  isEngineEnabled: boolean;
  setIsEngineEnabled: (v: boolean) => void;
  forecastWindow: ForecastWindow;
  setForecastWindow: (w: ForecastWindow) => void;
  enabledHazards: Set<string>;
  toggleHazard: (h: string) => void;
  minRiskThreshold: number;
  setMinRiskThreshold: (t: number) => void;
  dataHealth: DataSourceStatus[];
  refresh: () => void;
  loading: boolean;
}

export const PredictionControls: React.FC<PredictionControlsProps> = ({
  isEngineEnabled,
  setIsEngineEnabled,
  forecastWindow,
  setForecastWindow,
  enabledHazards,
  toggleHazard,
  minRiskThreshold,
  setMinRiskThreshold,
  dataHealth,
  refresh,
  loading
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const windows: ForecastWindow[] = ['now', '+6h', '+12h', '+24h', '+48h', '+72h', '+7d'];
  const hazards = ['flood', 'storm', 'wildfire', 'seismic', 'landslide'];

  return (
    <div className="absolute top-4 right-4 z-[400] w-72 lg:w-80 transition-all duration-300">
      <div className="glass-panel border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl bg-slate-950/90 backdrop-blur-md">
        
        {/* Header (always visible) */}
        <div 
          className="p-3 bg-slate-900/60 flex items-center justify-between cursor-pointer border-b border-slate-800"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isEngineEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Disaster Risk AI
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEngineEnabled(!isEngineEnabled);
              }}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                isEngineEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  isEngineEnabled ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Expanded Body */}
        {expanded && (
          <div className="p-4 flex flex-col gap-5 text-xs text-slate-300 font-mono">
            
            {/* Forecast Window */}
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                <Clock className="w-3 h-3" /> Forecast Timeline
              </div>
              <div className="flex flex-wrap gap-1">
                {windows.map(w => (
                  <button
                    key={w}
                    onClick={() => setForecastWindow(w)}
                    className={`px-2 py-1 rounded text-[10px] border ${
                      forecastWindow === w 
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {w.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Hazards Filter */}
            <div>
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                <ShieldAlert className="w-3 h-3" /> Hazards
              </div>
              <div className="flex flex-col gap-1.5">
                {hazards.map(h => (
                  <label key={h} className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                      enabledHazards.has(h) ? 'bg-cyan-500 border-cyan-500' : 'bg-slate-900 border-slate-700'
                    }`}>
                      {enabledHazards.has(h) && <Check className="w-2.5 h-2.5 text-slate-950" />}
                    </div>
                    <span className="capitalize">{h}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Minimum Risk Threshold */}
            <div>
              <div className="flex items-center justify-between mb-2 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                <span>Min Risk Score</span>
                <span className="text-cyan-400 font-mono">{minRiskThreshold}</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={minRiskThreshold}
                onChange={(e) => setMinRiskThreshold(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Data Health */}
            <div className="border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                  <Server className="w-3 h-3" /> Source Health
                </div>
                <button 
                  onClick={refresh}
                  disabled={loading}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {dataHealth.length === 0 && !loading && (
                  <div className="text-[9px] text-slate-500">Enable engine to fetch status.</div>
                )}
                {dataHealth.map(src => (
                  <div key={src.name} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 truncate w-32" title={src.name}>{src.name}</span>
                    <div className="flex items-center gap-1.5">
                      {src.latencyMs && <span className="text-slate-600">{src.latencyMs}ms</span>}
                      <span className={`w-1.5 h-1.5 rounded-full ${src.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
