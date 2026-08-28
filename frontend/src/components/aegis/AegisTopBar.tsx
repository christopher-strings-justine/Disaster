import React, { useState } from 'react';
import { Search, Bell, User, Cpu, Loader2 } from 'lucide-react';
import { useWeatherLayer } from './WeatherLayerContext';

interface AegisTopBarProps {
  onSearch?: (target: [number, number]) => void;
}

export const AegisTopBar: React.FC<AegisTopBarProps> = ({ onSearch }) => {
  const { isPredictorMode, setIsPredictorMode } = useWeatherLayer();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        onSearch?.([parseFloat(lat), parseFloat(lon)]);
        setError('');
      } else {
        setError('Location not found');
      }
    } catch {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">

      {/* Left side: Brand + Search */}
      <div className="flex items-center gap-4 pointer-events-auto">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-lg shadow-black/20">
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent uppercase tracking-wider">AegisX</span>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <div className={`bg-slate-900/60 backdrop-blur-md border rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg shadow-black/20 w-80 group transition-colors duration-300 ${error ? 'border-rose-500/60' : 'border-slate-700/50 focus-within:border-cyan-500/50'}`}>
            {searching
              ? <Loader2 size={18} className="text-cyan-400 animate-spin" />
              : <Search size={18} className="text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
            }
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setError(''); }}
              placeholder="Search location, coordinates..."
              className="bg-transparent border-none outline-none text-sm text-slate-100 w-full placeholder:text-slate-500"
            />
          </div>
          {error && (
            <div className="absolute top-full mt-1 left-0 bg-rose-950/80 border border-rose-700/50 rounded-xl px-3 py-1.5 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Right side: Predictor + Alerts + Profile */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => setIsPredictorMode(!isPredictorMode)}
          className={`backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 transition-all duration-300 group flex items-center gap-2 shadow-lg ${isPredictorMode
            ? 'bg-cyan-600/30 text-cyan-400 shadow-[inset_0_0_15px_rgba(6,182,212,0.3)] border-cyan-500/40'
            : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          <Cpu size={20} className={isPredictorMode ? 'animate-pulse' : ''} />
          <span className="text-sm font-bold tracking-wide">Predictor Mode</span>
        </button>

        <button className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 hover:bg-slate-800/80 transition-colors relative group">
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
          <Bell size={20} className="text-slate-300 group-hover:text-white transition-colors" />
        </button>
        <button className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 hover:bg-slate-800/80 transition-colors group flex items-center gap-2">
          <User size={20} className="text-slate-300 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Profile</span>
        </button>
      </div>

    </div>
  );
};
