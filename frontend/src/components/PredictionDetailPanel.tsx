import React, { useState } from 'react';
import { X, Activity, AlertTriangle, Info, Clock, MapPin, ExternalLink, Cpu } from 'lucide-react';
import { Prediction, getRiskConfig } from '../types/prediction';
import { aiService } from '../services/aiService';

interface PredictionDetailPanelProps {
  prediction: Prediction | null;
  onClose: () => void;
}

export const PredictionDetailPanel: React.FC<PredictionDetailPanelProps> = ({ prediction, onClose }) => {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  React.useEffect(() => {
    if (!prediction) {
      setAiExplanation(null);
      return;
    }
    
    const fetchExplanation = async () => {
      setLoadingAi(true);
      try {
        const result = await aiService.analyzePrediction(prediction);
        setAiExplanation(result);
      } catch (err) {
        console.error('Failed to get AI explanation', err);
        setAiExplanation('Explanation unavailable at this time.');
      }
      setLoadingAi(false);
    };

    fetchExplanation();
  }, [prediction]);

  if (!prediction) return null;

  const riskConfig = getRiskConfig(prediction.riskScore);

  return (
    <div className="absolute right-4 top-20 z-[450] w-80 lg:w-96 bottom-6 flex flex-col gap-4 animate-in slide-in-from-right-8 duration-300">
      <div className="glass-panel border-l-4 rounded-xl flex flex-col h-full overflow-hidden bg-slate-950/95 backdrop-blur-xl shadow-2xl" style={{ borderLeftColor: riskConfig.color }}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4" style={{ color: riskConfig.color }} />
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: riskConfig.color }}>
                {prediction.severity} RISK
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 capitalize">{prediction.hazardType} Hazard</h2>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1 font-mono">
              <MapPin className="w-3 h-3" /> {prediction.locationName}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Risk Score</div>
              <div className="text-2xl font-black font-mono" style={{ color: riskConfig.color }}>
                {prediction.riskScore}<span className="text-sm text-slate-600">/100</span>
              </div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Confidence</div>
              <div className="text-2xl font-black font-mono text-cyan-400">
                {prediction.confidence}<span className="text-sm text-slate-600">%</span>
              </div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 col-span-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Forecast Window</div>
                <div className="text-sm font-bold text-slate-200">
                  {prediction.forecastStart === 'now' ? 'Immediate' : prediction.forecastStart} → {prediction.forecastEnd}
                </div>
              </div>
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
          </div>

          {/* Disclaimer Alert */}
          <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-[10px] text-amber-200/80 leading-relaxed font-mono">
              {prediction.disclaimer}
            </div>
          </div>

          {/* AI Analysis (Groq) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              <Cpu className="w-4 h-4 text-cyan-500" />
              Groq AI Assessment
            </div>
            {loadingAi ? (
              <div className="p-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-slate-800 font-mono">
                {aiExplanation}
              </div>
            )}
          </div>

          {/* Contributing Factors */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              <Activity className="w-4 h-4 text-rose-500" />
              Contributing Factors
            </div>
            <div className="flex flex-col gap-2">
              {prediction.contributingFactors.map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold">{factor.name}</span>
                    <span className={`text-xs font-mono ${factor.impact === 'positive' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {factor.value}
                    </span>
                  </div>
                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${factor.impact === 'positive' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${factor.weight * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Sources */}
          <div className="flex flex-col gap-2 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              <Info className="w-4 h-4 text-blue-400" />
              Data Attribution
            </div>
            <div className="flex flex-col gap-2">
              {prediction.sourceData.map((src, idx) => (
                <a 
                  key={idx} 
                  href={src.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-1 bg-slate-900/30 p-2 rounded hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700"
                >
                  <div className="flex items-center justify-between text-[10px] text-blue-400 font-bold">
                    {src.source}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[10px] text-slate-500">{src.variable}</div>
                </a>
              ))}
              <div className="text-[9px] text-slate-600 mt-2 font-mono">
                Methodology: {prediction.methodology}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
