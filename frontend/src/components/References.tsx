import React from 'react';
import { Landmark, Award, BookOpen, AlertCircle } from 'lucide-react';

export const References: React.FC = () => {
  return (
    <footer className="glass-panel border-t border-slate-900 mt-8 rounded-t-xl">
      <div className="max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-6 text-xs font-mono text-slate-400">
        
        {/* Ministry of Home Affairs */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-[10px] uppercase tracking-wider">
            <Landmark className="w-4 h-4 text-cyan-400" />
            <span>MHA DISASTER MITIGATION</span>
          </div>
          <p className="leading-relaxed text-[11px] text-slate-400">
            Aligned with the national disaster mitigation guidelines issued by the Ministry of Home Affairs, Govt. of India for landslide susceptibility and early alert response structures.
          </p>
        </div>

        {/* NDMA Guidelines */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-[10px] uppercase tracking-wider">
            <Award className="w-4 h-4 text-rose-400" />
            <span>NDMA REGULATORY COMPLIANCE</span>
          </div>
          <p className="leading-relaxed text-[11px] text-slate-400">
            Carrying capacity allocations, resource thresholds (water/rations/medicine), and emergency response evacuation corridors are structured according to the NDMA Management Guidelines.
          </p>
        </div>

        {/* ISRO Bhuvan */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-[10px] uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>ISRO BHUVAN DATASETS</span>
          </div>
          <p className="leading-relaxed text-[11px] text-slate-400">
            Topographical contours, raster overlay models, and digital elevation graphs (DEM) are mock-mapped to represent actual GIS coordinates sourced from ISRO Bhuvan.
          </p>
        </div>

        {/* GSI Landslide susceptibility mapping */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-[10px] uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-emerald-400" />
            <span>GSI LANDSLIDE INDICES</span>
          </div>
          <p className="leading-relaxed text-[11px] text-slate-400">
            Susceptibility scores (Safe, Warning, Danger) are calculated based on GSI slope stability thresholds and geological shear strength metrics.
          </p>
        </div>

      </div>
      
      <div className="border-t border-slate-900 py-3 text-center text-[10px] font-mono text-slate-500">
        © 2026 Disaster Predictor (Team CodeNova). Built for Smart India Hackathon. All rights reserved.
      </div>
    </footer>
  );
};
export default References;
