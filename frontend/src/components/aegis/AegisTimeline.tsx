import React, { useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { useWeatherLayer, ModelType } from './WeatherLayerContext';

const HOURS = 168; // 7 days
const DAYS = ['Today', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

export const AegisTimeline: React.FC = () => {
  const {
    isPlaying, setIsPlaying,
    forecastHour, setForecastHour,
    model, setModel,
  } = useWeatherLayer();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance hour when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setForecastHour(h => (h + 1) % HOURS);
      }, 600);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, setForecastHour]);

  const now = new Date();
  const displayDate = new Date(now);
  displayDate.setHours(now.getHours() + forecastHour);
  const dayLabel = DAYS[Math.floor(forecastHour / 24)] ?? `Day ${Math.floor(forecastHour / 24) + 1}`;
  const timeLabel = `${String(displayDate.getHours()).padStart(2, '0')}:00`;

  const models: ModelType[] = ['ECMWF', 'GFS', 'ICON'];
  const progressPct = (forecastHour / HOURS) * 100;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-5xl pointer-events-auto">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-4 shadow-xl shadow-black/30">

        {/* Top: Play + Time + Models */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause forecast animation' : 'Play forecast animation'}
              className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 flex justify-center items-center text-slate-950 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            >
              {isPlaying
                ? <Pause size={20} className="fill-current" />
                : <Play size={20} className="fill-current ml-1" />
              }
            </button>
            <div className="text-slate-200 font-medium tracking-wide">
              <span className="text-slate-400 text-sm">{dayLabel},&nbsp;</span>
              <span className="text-cyan-400 font-bold">{timeLabel}</span>
              <span className="ml-2 text-[10px] text-slate-500">+{forecastHour}h</span>
              {isPlaying && <span className="ml-2 text-[10px] text-cyan-500 font-bold animate-pulse">▶ ANIMATING</span>}
            </div>
          </div>

          {/* Model toggles */}
          <div className="flex bg-slate-950/50 rounded-xl p-1 border border-slate-700/50 gap-1">
            {models.map(m => (
              <button
                key={m}
                onClick={() => setModel(m)}
                aria-label={`Switch to ${m} model`}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
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

        {/* Timeline Scrubber */}
        <div className="relative h-12 flex items-center px-4">
          {/* Background track */}
          <div className="absolute inset-0 bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/30">
            {/* Progress fill */}
            <div
              className="h-full bg-cyan-500/10 relative transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            >
              <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)]" />
            </div>
          </div>

          {/* Clickable scrubber input */}
          <input
            type="range"
            min={0}
            max={HOURS - 1}
            value={forecastHour}
            onChange={e => { setForecastHour(parseInt(e.target.value)); setIsPlaying(false); }}
            aria-label="Forecast hour selector"
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />

          {/* Day markers */}
          <div className="absolute inset-0 flex items-center px-6 pointer-events-none">
            {DAYS.map((day, i) => (
              <div
                key={i}
                className="flex flex-col items-center absolute"
                style={{ left: `${(i / 6) * 100}%` }}
              >
                <div className="w-[1px] h-3 bg-slate-600 mb-1" />
                <span className="text-[10px] text-slate-400 uppercase font-semibold whitespace-nowrap">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hour mini-ticks */}
        <div className="flex justify-between px-6 -mt-2">
          {[0, 6, 12, 18, 24, 30, 36, 42, 48].map(h => (
            <span key={h} className="text-[9px] text-slate-600">
              +{h}h
            </span>
          ))}
        </div>

      </div>
    </div>
  );
};
