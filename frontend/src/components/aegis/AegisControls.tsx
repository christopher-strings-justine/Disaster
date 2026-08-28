import React from 'react';
import { useWeatherLayer, AltitudeType, ModelType, ParticleDensity } from './WeatherLayerContext';

const ALTITUDE_OPTIONS: { value: AltitudeType; label: string; height: string }[] = [
  { value: 'surface',  label: 'Surface', height: '~0m' },
  { value: '1000hPa',  label: '1000',    height: '~110m' },
  { value: '925hPa',   label: '925',     height: '~750m' },
  { value: '850hPa',   label: '850',     height: '~1.5km' },
  { value: '700hPa',   label: '700',     height: '~3km' },
  { value: '500hPa',   label: '500',     height: '~5.5km' },
  { value: '300hPa',   label: '300',     height: '~9km' },
];

export const AegisControls: React.FC = () => {
  const {
    altitude, setAltitude,
    model, setModel,
    showIsobars, setShowIsobars,
    showParticles, setShowParticles,
    particleDensity, setParticleDensity,
    particleSpeed, setParticleSpeed,
    particleTrail, setParticleTrail,
  } = useWeatherLayer();

  const models: ModelType[] = ['ECMWF', 'GFS', 'ICON'];
  const densityOptions: ParticleDensity[] = ['low', 'medium', 'high'];

  return (
    <div className="absolute bottom-28 right-4 z-[1000] flex flex-col gap-3 pointer-events-none">

      {/* Display Toggles */}
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 flex flex-col gap-2 shadow-lg shadow-black/20 pointer-events-auto">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Overlays</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500/50 w-4 h-4 transition-all"
            checked={showIsobars}
            onChange={e => setShowIsobars(e.target.checked)}
            aria-label="Toggle pressure isobars"
          />
          <span className="text-sm font-medium text-slate-300">Pressure lines</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500/50 w-4 h-4 transition-all"
            checked={showParticles}
            onChange={e => setShowParticles(e.target.checked)}
            aria-label="Toggle wind particles"
          />
          <span className="text-sm font-medium text-slate-300">Particles animation</span>
        </label>
      </div>

      {/* Particle controls (visible when particles on) */}
      {showParticles && (
        <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-3 shadow-lg shadow-black/20 pointer-events-auto w-52">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Particles</p>

          {/* Density */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-medium">Density</span>
            <div className="flex gap-1">
              {densityOptions.map(d => (
                <button
                  key={d}
                  onClick={() => setParticleDensity(d)}
                  aria-label={`Particle density: ${d}`}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold capitalize transition-all duration-200 ${
                    particleDensity === d
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-500 hover:text-slate-300 bg-slate-800/40 border border-transparent'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-medium">Speed</span>
            <div className="flex gap-1">
              {densityOptions.map(d => (
                <button
                  key={d}
                  onClick={() => setParticleSpeed(d)}
                  aria-label={`Particle speed: ${d}`}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold capitalize transition-all duration-200 ${
                    particleSpeed === d
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-500 hover:text-slate-300 bg-slate-800/40 border border-transparent'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Trail */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Trail</span>
              <span className="text-[10px] text-cyan-400">{Math.round(particleTrail * 100)}%</span>
            </div>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={particleTrail}
              onChange={e => setParticleTrail(parseFloat(e.target.value))}
              aria-label="Particle trail length"
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>
      )}

      {/* Pressure Level Selector */}
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-2 shadow-lg shadow-black/20 pointer-events-auto">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Altitude</span>
          <span className="text-xs font-bold text-cyan-400">
            {ALTITUDE_OPTIONS.find(a => a.value === altitude)?.height}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          {ALTITUDE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setAltitude(opt.value)}
              aria-label={`Set altitude to ${opt.label}`}
              className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all duration-200 ${
                altitude === opt.value
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span>{opt.label} hPa</span>
              <span className="text-slate-600 text-[10px]">{opt.height}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Model Toggles */}
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-1.5 flex gap-1 shadow-lg shadow-black/20 pointer-events-auto">
        {models.map(m => (
          <button
            key={m}
            onClick={() => setModel(m)}
            aria-label={`Select ${m} model`}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              model === m
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

    </div>
  );
};
