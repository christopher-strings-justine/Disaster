import React, { useState } from 'react';
import { App as OldApp } from './OldApp';
import AegisApp from './AegisApp';

export default function App() {
  const [mode, setMode] = useState<'old' | 'aegis'>('old');

  return (
    <>
      {/* Mode Toggle Button */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-1 rounded-full flex gap-1 shadow-lg items-center">
          <button 
            onClick={() => setMode('old')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'old' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
          >
            Disaster Predictor
          </button>
          <button 
            onClick={() => setMode('aegis')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'aegis' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
          >
            AegisX Mode
          </button>
          <div className="w-px h-5 bg-slate-700 mx-1"></div>
          <button 
            onClick={() => {
              localStorage.setItem('dp-activeTab', JSON.stringify('map'));
              window.dispatchEvent(new Event('emergency-nav'));
              setMode('old');
            }}
            className="px-4 py-1.5 rounded-full text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)] transition-all animate-pulse flex items-center gap-2"
          >
            <span>🚨</span> EMERGENCY
          </button>
        </div>
      </div>

      {/* Render selected app mode */}
      {mode === 'old' ? <OldApp /> : <AegisApp />}
    </>
  );
}
