import React from 'react';
import { useWeatherLayer, LayerType } from './WeatherLayerContext';
import { LAYER_CONFIGS, LayerId } from './layerConfig';

export const LayerLegend: React.FC = () => {
  const { activeLayer, model, loadingLayers, layerErrors } = useWeatherLayer();

  // Map legacy/overview layers to hide legend
  const hideLegend = new Set(['overview', 'disaster', 'waves', 'radar', 'aqi', 'hurricane', 'weather', 'wind_legacy', 'rain_acc']);
  if (hideLegend.has(activeLayer)) return null;

  const cfg = LAYER_CONFIGS[activeLayer as LayerId];
  if (!cfg) return null;

  const { legend } = cfg;
  const isLoading = loadingLayers.has(activeLayer);
  const error = layerErrors[activeLayer];

  // Build gradient CSS from legend stops
  const gradientStops = legend.stops
    .map(s => `${s.color} ${((s.value - legend.min) / (legend.max - legend.min) * 100).toFixed(1)}%`)
    .join(', ');
  const gradientCss = `linear-gradient(to right, ${gradientStops})`;

  return (
    <div className="
      absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000]
      pointer-events-none
    ">
      <div className="
        bg-slate-900/85 backdrop-blur-md border border-slate-700/50
        rounded-2xl px-5 py-3 shadow-xl shadow-black/40
        min-w-72 max-w-md
      ">
        {/* Layer name + model badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{cfg.icon}</span>
            <span className="text-sm font-bold text-slate-100">{cfg.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            )}
            {error && !isLoading && (
              <span className="text-xs text-rose-400 font-medium">Data unavailable</span>
            )}
            <span className="text-[10px] font-bold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">
              {model}
            </span>
          </div>
        </div>

        {/* Risk layer disclaimer */}
        {cfg.isRiskLayer && (
          <div className="text-[9px] text-amber-400/80 font-medium mb-2 italic">
            ⚠ AegisX model estimate — not an official warning
          </div>
        )}

        {/* Gradient bar */}
        {legend.stops.length > 0 && !error && (
          <>
            <div
              className="h-3 rounded-full w-full mb-1.5"
              style={{ background: gradientCss }}
            />
            {/* Labels */}
            <div className="flex justify-between">
              {legend.stops.map((s, i) => (
                <div key={i} className="flex flex-col items-center" style={{ width: `${100 / legend.stops.length}%` }}>
                  <span className="text-[9px] text-slate-400 font-medium truncate">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-500 text-right mt-0.5">{legend.unit}</div>
          </>
        )}

        {/* Error state */}
        {error && (
          <div className="text-xs text-slate-400 italic">
            {error.includes('cape') || error.includes('lightning')
              ? `${cfg.name} is not available for the ${model} model.`
              : 'Weather data temporarily unavailable.'}
          </div>
        )}

        {/* Upper atmosphere extra info */}
        {activeLayer.startsWith('upper_') && (
          <div className="mt-2 pt-2 border-t border-slate-700/40 text-[10px] text-slate-500">
            Upper atmosphere data — select Wind/Temp variable in controls
          </div>
        )}
      </div>
    </div>
  );
};
