import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers, Eye, EyeOff } from 'lucide-react';
import { useWeatherLayer, LayerType } from './WeatherLayerContext';
import { LAYER_CATEGORIES, LAYER_CONFIGS, LayerId } from './layerConfig';

interface LayerRowProps {
  layerId: LayerId;
  isActive: boolean;
  onSelect: () => void;
}

const LayerRow: React.FC<LayerRowProps> = ({ layerId, isActive, onSelect }) => {
  const { loadingLayers, layerErrors } = useWeatherLayer();
  const cfg = LAYER_CONFIGS[layerId];
  const isLoading = loadingLayers.has(layerId);
  const hasError = !!layerErrors[layerId];

  return (
    <button
      key={layerId}
      onClick={onSelect}
      aria-label={`Select ${cfg.name} layer`}
      title={cfg.description}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
        transition-all duration-200 group
        ${isActive
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
        }
      `}
    >
      <span className="text-base flex-shrink-0 w-6 text-center">{cfg.icon}</span>
      <span className={`text-sm font-medium flex-1 truncate ${isActive ? 'text-cyan-200' : ''}`}>
        {cfg.name}
      </span>
      {isLoading && (
        <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
      {hasError && !isLoading && (
        <span className="text-rose-400 text-xs flex-shrink-0">!</span>
      )}
      {isActive && !isLoading && !hasError && (
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
      )}
    </button>
  );
};

interface CategorySectionProps {
  categoryId: string;
  label: string;
  icon: string;
  layers: LayerId[];
  activeLayer: LayerType;
  onSelectLayer: (id: LayerId) => void;
  defaultOpen?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId, label, icon, layers, activeLayer, onSelectLayer, defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hasActive = layers.some(l => l === activeLayer);

  return (
    <div className="border-b border-slate-700/40 last:border-0">
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`
          w-full flex items-center gap-2 px-3 py-2.5 text-left
          transition-colors duration-200
          ${hasActive ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'}
        `}
      >
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest flex-1">{label}</span>
        {hasActive && (
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1" />
        )}
        {isOpen
          ? <ChevronDown size={14} className="flex-shrink-0 opacity-60" />
          : <ChevronRight size={14} className="flex-shrink-0 opacity-60" />
        }
      </button>

      {isOpen && (
        <div className="px-2 pb-2 flex flex-col gap-1">
          {layers.map(id => (
            <LayerRow
              key={id}
              layerId={id}
              isActive={activeLayer === (id as string)}
              onSelect={() => onSelectLayer(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayerPanel: React.FC = () => {
  const { activeLayer, setActiveLayer, showParticles, setShowParticles, showIsobars, setShowIsobars } = useWeatherLayer();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSelectLayer = (id: LayerId) => {
    setActiveLayer(id as LayerType);
  };

  const defaultOpen: Record<string, boolean> = {
    'ATMOSPHERE': true,
    'WIND': false,
    'PRECIPITATION': false,
    'STORMS': false,
    'UPPER_ATMOSPHERE': false,
    'DISASTER_INTELLIGENCE': false,
  };

  return (
    <div className="absolute top-20 left-4 z-[1000] pointer-events-none">
      <div className="pointer-events-auto">

        {/* Header toggle */}
        <button
          onClick={() => setIsExpanded(e => !e)}
          className="
            w-full flex items-center gap-3 px-4 py-3 mb-1
            bg-slate-900/80 backdrop-blur-md border border-slate-700/50
            rounded-2xl shadow-lg shadow-black/30
            text-slate-200 hover:text-white transition-colors
          "
          aria-label="Toggle layer panel"
        >
          <Layers size={18} className="text-cyan-400" />
          <span className="text-sm font-bold tracking-wide">WEATHER LAYERS</span>
          <div className="flex-1" />
          {isExpanded
            ? <ChevronDown size={16} className="opacity-60" />
            : <ChevronRight size={16} className="opacity-60" />
          }
        </button>

        {/* Panel body */}
        {isExpanded && (
          <div className="
            bg-slate-900/85 backdrop-blur-md border border-slate-700/50
            rounded-2xl shadow-xl shadow-black/40
            overflow-hidden
            w-64
          ">

            {/* Quick toggles */}
            <div className="flex gap-1 p-2 border-b border-slate-700/40">
              <button
                onClick={() => setShowParticles(!showParticles)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold
                  transition-all duration-200
                  ${showParticles
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-600'
                  }
                `}
                aria-label="Toggle wind particles"
              >
                ✨ Particles
              </button>
              <button
                onClick={() => setShowIsobars(!showIsobars)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold
                  transition-all duration-200
                  ${showIsobars
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-600'
                  }
                `}
                aria-label="Toggle pressure isobars"
              >
                〰 Isobars
              </button>
            </div>

            {/* Category sections */}
            <div className="max-h-[70vh] overflow-y-auto">
              {LAYER_CATEGORIES.map(cat => (
                <CategorySection
                  key={cat.id}
                  categoryId={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  layers={cat.layers}
                  activeLayer={activeLayer}
                  onSelectLayer={handleSelectLayer}
                  defaultOpen={defaultOpen[cat.id] ?? false}
                />
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
