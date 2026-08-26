import React, { useState, useEffect } from 'react';
import { Shield, Users, Wifi, Database, Radio, Lock, Unlock, KeyRound, X } from 'lucide-react';
import { RoleType, WeatherData, LocationId } from '../types';

interface HeaderProps {
  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;
  systemAlert: boolean;
  alertMessage: string | null;
  weather: WeatherData;
  locationId: LocationId;
  isOfficialAuthenticated: boolean;
  authenticateOfficial: (pin: string) => boolean;
  logoutOfficial: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  setActiveRole,
  systemAlert,
  alertMessage,
  weather,
  locationId,
  isOfficialAuthenticated,
  authenticateOfficial,
  logoutOfficial,
}) => {
  const [time, setTime] = useState<string>('');
  const [tickerOffset, setTickerOffset] = useState<number>(0);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');

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
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const roles = [
    { id: 'dma', label: 'Disaster Authority (Command)' },
    { id: 'responder', label: 'Field Responder / Engineer' },
    { id: 'shelter', label: 'Resettlement Shelter Coordinator' },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = authenticateOfficial(pinInput);
    if (success) {
      setShowLoginModal(false);
      setPinInput('');
    }
  };

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
          <span className="text-[10px] bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/30 font-mono flex items-center gap-1.5">
            IMD ALERT: <span className="text-rose-400 font-extrabold uppercase">{weather.imdAlertLevel}</span>
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
                  <span>[IMD-WEATHER] Alert Level: {weather.imdAlertLevel.toUpperCase()}</span>
                  <span>•</span>
                  <span>[PRECIP-FEED] Rain: {weather.precipitation} mm/h</span>
                </>
              ) : (
                <>
                  <span>[SAT-CONN] {locationId.toUpperCase()} satellite grid sync: OK</span>
                  <span>•</span>
                  <span>[AI-SOLVER] Obstacle avoidance route optimization running</span>
                  <span>•</span>
                  <span>[SYS-LOG] Detour calculations armed</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 shrink-0">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <Database className="w-3 h-3 text-cyan-400" />
          </div>
        </div>

        {/* Right: Authentication, Role Selector & Clock */}
        <div className="flex items-center gap-4 relative">
          
          {/* Command Lock Toggle Button */}
          {isOfficialAuthenticated ? (
            <button
              onClick={logoutOfficial}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-emerald-500 bg-emerald-950/20 text-emerald-400 text-xs font-bold font-mono hover:bg-emerald-950/40 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.1)] cursor-pointer"
              title="Official Access Active. Click to lock."
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>COMMAND LOCK OPEN</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-rose-600 bg-rose-950/20 text-rose-400 text-xs font-bold font-mono hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Access restricted. Click to authenticate."
            >
              <Lock className="w-3.5 h-3.5 animate-pulse" />
              <span>COMMAND LOCK</span>
            </button>
          )}

          {/* Role selector dropdown */}
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

          {/* Passcode Authentication Modal (Overlay Popup) */}
          {showLoginModal && (
            <div className="absolute top-12 right-0 w-64 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-2xl z-[100] flex flex-col gap-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-[10px] text-slate-200 font-bold flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                  OFFICIAL SIGN-IN
                </span>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase block">
                    Security Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="Enter PIN (SIH2026)"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded p-1.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 rounded bg-rose-500 hover:bg-rose-600 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Verify Command
                </button>
              </form>
              <div className="text-[8px] text-slate-500 text-center leading-relaxed">
                Unlock to register emergency shelters and provision responder units.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
