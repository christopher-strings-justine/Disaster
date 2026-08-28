import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  CloudRain, 
  Wind, 
  AlertTriangle, 
  Map as MapIcon, 
  CheckCircle2, 
  Play, 
  ExternalLink 
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

type EngineId = 'inasafe' | 'openquake' | 'fastflood' | 'nasa_lhasa' | 'riskchanges' | 'itzi' | 'opensees' | 'segformer' | 'chronos' | 'bart';

interface EngineState {
  status: 'idle' | 'running' | 'completed';
  progress: number;
}

export const TabPredictiveEngines: React.FC = () => {
  const [engineStates, setEngineStates] = useState<Record<EngineId, EngineState>>({
    inasafe: { status: 'idle', progress: 0 },
    openquake: { status: 'idle', progress: 0 },
    fastflood: { status: 'idle', progress: 0 },
    nasa_lhasa: { status: 'idle', progress: 0 },
    riskchanges: { status: 'idle', progress: 0 },
    itzi: { status: 'idle', progress: 0 },
    opensees: { status: 'idle', progress: 0 },
    segformer: { status: 'idle', progress: 0 },
    chronos: { status: 'idle', progress: 0 },
    bart: { status: 'idle', progress: 0 }
  });

  const runSimulation = (id: EngineId) => {
    setEngineStates(prev => ({ ...prev, [id]: { status: 'running', progress: 0 } }));
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setEngineStates(prev => ({ ...prev, [id]: { status: 'completed', progress: 100 } }));
      } else {
        setEngineStates(prev => ({ ...prev, [id]: { status: 'running', progress: currentProgress } }));
      }
    }, 400);
  };

  const renderEngineCard = (
    id: EngineId, 
    title: string, 
    hazards: string, 
    repo: string, 
    repoLink: string,
    desc: string,
    icon: React.ReactNode,
    ChartComponent: React.ReactNode
  ) => {
    const state = engineStates[id];
    
    return (
      <div className="glass-panel rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-cyan-900/20 hover:shadow-lg border border-slate-800 hover-lift">
        <div className="p-5 border-b border-slate-800 bg-slate-900/40 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-cyan-400 border border-slate-700">
                {icon}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100 tracking-wide uppercase">{title}</h3>
                <a href={repoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors font-mono uppercase tracking-wider">
                  <ExternalLink className="w-3 h-3" /> {repo}
                </a>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-[9px] font-bold text-slate-300 uppercase tracking-widest text-right max-w-[120px]">
              {hazards}
            </div>
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] relative z-10">
            {desc}
          </p>
        </div>

        <div className="p-5 flex-1 flex flex-col bg-slate-950/50">
          {state.status === 'idle' && (
            <div className="flex-1 flex items-center justify-center py-8">
              <button 
                onClick={() => runSimulation(id)}
                className="group relative px-6 py-2.5 bg-transparent border border-cyan-500/50 rounded hover:bg-cyan-950/30 hover:border-cyan-400 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000" />
                <span className="relative flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-widest group-hover:text-cyan-100">
                  <Play className="w-4 h-4" /> Run Predictive Model
                </span>
              </button>
            </div>
          )}

          {state.status === 'running' && (
            <div className="flex-1 flex flex-col justify-center py-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-mono text-cyan-400 animate-pulse">Compiling tensors & spatial matrices...</span>
                <span className="text-xs font-black text-slate-200">{Math.floor(state.progress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-300 ease-out relative"
                  style={{ width: `${state.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {state.status === 'completed' && (
            <div className="flex-1 flex flex-col animate-fade-in">
              <div className="flex items-center gap-1.5 mb-3 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Simulation Output Generated</span>
              </div>
              <div className="h-40 w-full bg-slate-900/60 rounded border border-slate-800/60 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  {ChartComponent}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const [locationQuery, setLocationQuery] = useState('');
  const [activeLocation, setActiveLocation] = useState('Global Framework');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationQuery.trim()) {
      setActiveLocation(locationQuery.trim());
      // Reset engines to idle when location changes
      setEngineStates({
        inasafe: { status: 'idle', progress: 0 },
        openquake: { status: 'idle', progress: 0 },
        fastflood: { status: 'idle', progress: 0 },
        nasa_lhasa: { status: 'idle', progress: 0 },
        riskchanges: { status: 'idle', progress: 0 },
        itzi: { status: 'idle', progress: 0 },
        opensees: { status: 'idle', progress: 0 }
      });
    }
  };

  // Mock Data for Charts dynamically bound to location
  const locPrefix = activeLocation === 'Global Framework' ? 'Sector' : activeLocation;
  
  const inasafeData = [
    { zone: `${locPrefix} N`, impact: 85, threshold: 50 },
    { zone: `${locPrefix} S`, impact: 42, threshold: 50 },
    { zone: `${locPrefix} E`, impact: 91, threshold: 50 },
    { zone: `${locPrefix} W`, impact: 23, threshold: 50 },
  ];

  const openquakeData = [
    { g: 0.1, fragility: 0.05 },
    { g: 0.3, fragility: 0.2 },
    { g: 0.5, fragility: 0.65 },
    { g: 0.7, fragility: 0.88 },
    { g: 0.9, fragility: 0.98 },
  ];

  const fastfloodData = [
    { time: '0h', depth: 0 },
    { time: '2h', depth: 0.5 },
    { time: '4h', depth: 1.8 },
    { time: '6h', depth: 2.4 },
    { time: '8h', depth: 1.2 },
    { time: '10h', depth: 0.3 },
  ];

  const nasaData = [
    { area: `${locPrefix} Ridge`, soilMoisture: 80, rain: 90, risk: 95 },
    { area: `${locPrefix} Valley`, soilMoisture: 40, rain: 30, risk: 20 },
    { area: `${locPrefix} Basin`, soilMoisture: 60, rain: 50, risk: 55 },
    { area: `${locPrefix} Peak`, soilMoisture: 90, rain: 95, risk: 99 },
  ];

  const riskChangesData = [
    { year: 2024, riskValue: 400 },
    { year: 2026, riskValue: 350 }, // with mitigation
    { year: 2030, riskValue: 200 },
    { year: 2040, riskValue: 120 },
  ];

  const itziData = [
    { node: `${locPrefix} N1`, surfaceFlow: 12, capacity: 15 },
    { node: `${locPrefix} N2`, surfaceFlow: 22, capacity: 15 }, // Overflow
    { node: `${locPrefix} N3`, surfaceFlow: 8, capacity: 15 },
    { node: `${locPrefix} N4`, surfaceFlow: 18, capacity: 15 }, // Overflow
  ];

  const openseesData = [
    { mode: 'Mode 1', response: 4.2 },
    { mode: 'Mode 2', response: 2.1 },
    { mode: 'Mode 3', response: 1.5 },
    { mode: 'Mode 4', response: 0.8 },
  ];

  const segformerData = [
    { class: 'Vegetation', area: 45, confidence: 92 },
    { class: 'Exposed Soil', area: 30, confidence: 88 },
    { class: 'Water Body', area: 15, confidence: 95 },
    { class: 'Urban Area', area: 10, confidence: 85 },
  ];

  const chronosData = [
    { time: '-2h', waveHeight: 0.5 },
    { time: '-1h', waveHeight: 0.8 },
    { time: '0h', waveHeight: 1.2 },
    { time: '+1h', waveHeight: 4.5 },
    { time: '+2h', waveHeight: 7.2 },
    { time: '+3h', waveHeight: 3.1 },
  ];

  const bartData = [
    { category: 'Structural Damage', prob: 88 },
    { category: 'Casualties', prob: 12 },
    { category: 'Infrastructure', prob: 75 },
    { category: 'Evacuation', prob: 95 },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-widest flex items-center gap-3">
              <Cpu className="w-8 h-8 text-cyan-500" />
              Advanced Predictive Engines
            </h2>
            <p className="text-slate-400 text-sm mt-2 font-mono max-w-2xl">
              Integrated scientific modeling frameworks for probabilistic hazard assessment, hydrodynamic surface routing, and structural fragility analysis. Select an engine to run localized deterministic simulations.
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full lg:w-96 flex">
            <input 
              type="text" 
              placeholder="Enter specific location (e.g., Joshimath, Wayanad)..." 
              className="w-full bg-slate-900/80 border border-slate-700 text-slate-200 text-sm px-4 py-3 rounded-l focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-3 rounded-r transition-colors"
            >
              Set Location
            </button>
          </form>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Active Simulation Target:</span>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/40 px-2 py-1 rounded border border-cyan-900/50">{activeLocation}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
          {/* InaSAFE */}
          {renderEngineCard(
            'inasafe',
            'InaSAFE',
            'Multi-Hazard',
            'inasafe.org',
            'https://inasafe.org/',
            'QGIS plugin calculating impact scenarios by integrating spatial hazard maps with exposure layers (population, infrastructure).',
            <MapIcon className="w-6 h-6" />,
            <BarChart data={inasafeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="zone" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
              <Bar dataKey="impact" fill="#0ea5e9" radius={[2, 2, 0, 0]} name="Impact Severity" />
            </BarChart>
          )}

          {/* OpenQuake Engine */}
          {renderEngineCard(
            'openquake',
            'OpenQuake',
            'Earthquakes',
            'globalquakemodel.org',
            'https://www.globalquakemodel.org/product/openquake-engine',
            'Advanced open-source calculation engine for probabilistic and deterministic seismic hazard and risk assessment (GEM Foundation).',
            <Activity className="w-6 h-6 text-rose-500" />,
            <LineChart data={openquakeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="g" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="fragility" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: '#f43f5e' }} name="Fragility Curve" />
            </LineChart>
          )}

          {/* FastFlood */}
          {renderEngineCard(
            'fastflood',
            'FastFlood',
            'Floods',
            'fastflood.org',
            'https://fastflood.org/',
            'WebAssembly-powered, browser-based 2D hydraulic/hydrological modeling platform for rapid mitigation testing and flood routing.',
            <CloudRain className="w-6 h-6 text-blue-400" />,
            <AreaChart data={fastfloodData}>
              <defs>
                <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
              <Area type="monotone" dataKey="depth" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDepth)" name="Inundation Depth (m)" />
            </AreaChart>
          )}

          {/* NASA LHASA */}
          {renderEngineCard(
            'nasa_lhasa',
            'NASA LHASA',
            'Landslides',
            'GitHub',
            'https://github.com/nasa/LHASA',
            'Landslide Hazard Assessment for Situational Awareness. Open-source Python model utilizing satellite GPM telemetry for predictions.',
            <Globe className="w-6 h-6 text-amber-500" />,
            <RadarChart outerRadius={50} data={nasaData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="area" stroke="#64748b" fontSize={9} />
              <Radar name="Landslide Risk" dataKey="risk" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
            </RadarChart>
          )}

          {/* RiskChanges SDSS */}
          {renderEngineCard(
            'riskchanges',
            'RiskChanges SDSS',
            'Multi-Hazard',
            'un-spider.org',
            'https://github.com/RiskChanges/RiskChangesDesktop',
            'Spatial Decision Support System for analyzing dynamic multi-hazard risk, element-at-risk vulnerability, and cost-benefit options.',
            <Database className="w-6 h-6 text-purple-400" />,
            <AreaChart data={riskChangesData}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
              <Area type="step" dataKey="riskValue" stroke="#a855f7" fillOpacity={1} fill="url(#colorRisk)" name="Proj. Economic Loss" />
            </AreaChart>
          )}

          {/* Itzi */}
          {renderEngineCard(
            'itzi',
            'Itzï',
            'Floods',
            'GitHub',
            'https://github.com/ItziModel/itzi',
            'GIS-native 2D surface flow hydrologic and hydraulic modeling tool with full GRASS GIS integration and SWMM coupling.',
            <Wind className="w-6 h-6 text-teal-400" />,
            <BarChart data={itziData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="node" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
              <Bar dataKey="surfaceFlow" fill="#14b8a6" radius={[2, 2, 0, 0]} name="Surface Flow (m³/s)" />
              <Bar dataKey="capacity" fill="#334155" radius={[2, 2, 0, 0]} name="Drain Capacity (m³/s)" />
            </BarChart>
          )}

          {/* OpenSees */}
          {renderEngineCard(
            'opensees',
            'OpenSees',
            'Earthquakes',
            'opensees.berkeley.edu',
            'https://opensees.berkeley.edu/',
            'Structural and geotechnical simulation framework developed by UC Berkeley for modeling system responses subjected to earthquakes.',
            <AlertTriangle className="w-6 h-6 text-orange-500" />,
            <LineChart data={openseesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="mode" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
              <Line type="step" dataKey="response" stroke="#f97316" strokeWidth={3} dot={false} name="Displacement Response" />
            </LineChart>
          )}

          {/* NVIDIA Segformer */}
          {renderEngineCard(
            'segformer',
            'NVIDIA Segformer',
            'Landslides',
            'Hugging Face',
            'https://huggingface.co/nvidia/segformer-b0-finetuned-ade-512-512',
            'Semantic segmentation model fine-tuned on ADE20K. Used for analyzing aerial/satellite imagery to map landslide extents.',
            <Globe className="w-6 h-6 text-green-500" />,
            <BarChart data={segformerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis dataKey="class" type="category" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
              <Bar dataKey="area" fill="#22c55e" radius={[0, 2, 2, 0]} name="Affected Area (%)" />
            </BarChart>
          )}

          {/* Amazon Chronos */}
          {renderEngineCard(
            'chronos',
            'Amazon Chronos',
            'Tsunami',
            'Hugging Face',
            'https://huggingface.co/amazon/chronos-t5-small',
            'Time series forecasting model based on T5 architecture. Used for predicting tsunami wave height propagation and arrival times.',
            <Wind className="w-6 h-6 text-cyan-400" />,
            <AreaChart data={chronosData}>
              <defs>
                <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
              <Area type="monotone" dataKey="waveHeight" stroke="#06b6d4" fillOpacity={1} fill="url(#colorWave)" name="Wave Height (m)" />
            </AreaChart>
          )}

          {/* Facebook BART */}
          {renderEngineCard(
            'bart',
            'Facebook BART',
            'Earthquakes',
            'Hugging Face',
            'https://huggingface.co/facebook/bart-large-mnli',
            'Zero-shot classification model for natural language processing. Used to analyze crowd-sourced reports and extract emergency parameters.',
            <Activity className="w-6 h-6 text-indigo-400" />,
            <BarChart data={bartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="category" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} itemStyle={{ fontSize: '10px' }} />
              <Bar dataKey="prob" fill="#6366f1" radius={[2, 2, 0, 0]} name="Probability (%)" />
            </BarChart>
          )}
        </div>
      </div>
    </div>
  );
};
