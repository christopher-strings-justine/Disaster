import React, { useState, useEffect } from 'react';
import { Shield, Users, Bell, Activity, Wifi, Database, Radio } from 'lucide-react';
import { RoleType } from '../types';

interface HeaderProps {
  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;
  systemAlert: boolean;
  alertMessage: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  setActiveRole,
  systemAlert,
  alertMessage,
}) => {
  const [time, setTime] = useState<string>('');
  const [tickerOffset, setTickerOffset] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
          ' | ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simple animation loop for the MQTT data stream ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerOffset((prev) => (prev + 1) % 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const roles = [
    { id: 'dma', label: 'Disaster Authority (Command)' },
    { id: 'responder', label: 'Field Responder / Engineer' },
    { id: 'shelter', label: 'Resettlement Shelter Coordinator' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      {/* Alarm Banner if System Alert is active */}
      {systemAlert && (
        <div className="bg-rose-950/60 border-b border-rose-500/50 py-2 px-4 flex items-center justify-between text-rose-200 text-xs font-semibold animate-pulse-slow">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-mono tracking-wide text-rose-400">CRITICAL LIVE THREAT EVENT ACTIVE:</span>
            <span>{alertMessage}</span>
          </div>
          <span className="text-[10px] bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
            RESPONSES DISPATCHED
          </span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: App Logo & SIH Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-950/40 border border-cyan-400/20">
            <Shield className="w-6 h-6 text-slate-950" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                DISASTER<span className="text-cyan-400 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">PREDICTOR</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-slate-400 uppercase tracking-widest">
                v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              SIH 2026 Hackathon Dashboard • <span className="text-cyan-400 font-bold">Team CodeNova</span>
            </p>
          </div>
        </div>

        {/* Center: Live Telemetry Ticker (MQTT Simulation) */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-900/40 border border-slate-800/80 px-4 py-1.5 rounded-full text-[11px] font-mono text-slate-400 max-w-md overflow-hidden">
          <div className="flex items-center gap-1.5 text-cyan-400 shrink-0">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>MQTT STREAM:</span>
          </div>
          <div className="relative w-56 h-4 overflow-hidden select-none">
            <div className="absolute whitespace-nowrap animate-[shimmer_20s_infinite_linear] flex gap-4">
              {tickerOffset % 2 === 0 ? (
                <>
                  <span>[ISRO BHUVAN] GIS Feed Sync: OK</span>
                  <span>•</span>
                  <span>[AWS-EAST] DB Ping: 12ms</span>
                  <span>•</span>
                  <span>[IOT-NODE-W4] Rain Gauge: 4.8mm/hr</span>
                </>
              ) : (
                <>
                  <span>[SAT-CONN-2] Signal strength: 98%</span>
                  <span>•</span>
                  <span>[AI-ENGINE] CV Models loaded</span>
                  <span>•</span>
                  <span>[SYS-LOG] Evacuation solver active</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 shrink-0">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <Database className="w-3 h-3 text-cyan-400" />
          </div>
        </div>

        {/* Right: Role Selector & Clock */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-850 px-3 py-1.5 rounded-lg">
            <Users className="w-4 h-4 text-cyan-400" />
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as RoleType)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-2 hover:text-white transition-colors"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id} className="bg-slate-900 text-slate-200 text-xs py-1">
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex flex-col items-end border-l border-slate-800 pl-4">
            <span className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase">
              {time.split('|')[0] || '---'}
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-extrabold tracking-widest mt-0.5">
              {time.split('|')[1] || '---'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;
