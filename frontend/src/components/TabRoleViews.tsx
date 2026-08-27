import React from 'react';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Activity,
  UserCheck,
  ClipboardList,
  CheckCircle,
  ShieldAlert,
  Droplet,
  Heart,
  Truck,
  Database,
  BarChart,
  Navigation,
  FileSpreadsheet
} from 'lucide-react';
import { RoleType, HazardMarker, Shelter, FieldResponder, WorkOrder, UserGpsData } from '../types';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface TabRoleViewsProps {
  activeRole: RoleType;
  markers: HazardMarker[];
  shelters: Shelter[];
  setShelters: React.Dispatch<React.SetStateAction<Shelter[]>>;
  responders: FieldResponder[];
  workOrders: WorkOrder[];
  locationId: string;
  authorizeRelocation: (markerId: string) => void;
  updatePipelineStep: (step: number) => void;
  userGps: UserGpsData | null;
}

export const TabRoleViews: React.FC<TabRoleViewsProps> = ({
  activeRole,
  markers,
  shelters,
  setShelters,
  responders,
  workOrders,
  locationId,
  authorizeRelocation,
  updatePipelineStep,
  userGps,
}) => {
  // Filter data for active location
  const activeMarkers = markers.filter((m) => m.locationId === locationId);
  const activeShelters = shelters.filter((s) => s.locationId === locationId);
  const activeWorkOrders = workOrders.filter((w) => w.locationId === locationId);

  const downloadExcelReport = () => {
    // Requirements: Date, No of Refuges Availed, Places, Disaster Location, Cause, no duplicates on same date
    const rows: string[] = ['Date,Refuges Availed,Shelter Places,Disaster Location,Cause'];
    const uniqueDates = new Set<string>();

    const today = new Date().toISOString().split('T')[0];
    
    // Process data for today
    if (!uniqueDates.has(today)) {
      uniqueDates.add(today);
      const totalAvailed = shelters.reduce((acc, s) => acc + s.occupancy, 0);
      const places = shelters.map(s => `"${s.name}"`).join(';');
      const disasterLocations = activeMarkers.map(m => `"${m.name}"`).join(';');
      const causes = activeMarkers.map(m => `"${m.type}"`).join(';');
      
      rows.push(`${today},${totalAvailed},${places},${disasterLocations},${causes}`);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Daily_Disaster_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats Calculations
  const avgRisk = Math.round(
    activeMarkers.reduce((acc, curr) => acc + curr.risk, 0) / (activeMarkers.length || 1)
  );
  const totalVulnerablePop = activeMarkers
    .filter((m) => m.status !== 'safe')
    .reduce((acc, curr) => acc + curr.population, 0);
  const activeHotspots = activeMarkers.filter((m) => m.status === 'danger').length;

  const handleResourceSliderChange = (
    shelterId: string,
    field: 'waterLevel' | 'rations' | 'medicalKits',
    value: number
  ) => {
    setShelters((prev) =>
      prev.map((s) => (s.id === shelterId ? { ...s, [field]: value } : s))
    );
    // Set active pipeline step to 4: ALLOCATE
    updatePipelineStep(4);
  };

  // Switch views depending on the active role
  switch (activeRole) {
    case 'dma':
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">District Analytics Overview</h2>
            <button
              onClick={downloadExcelReport}
              className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 px-3 py-1.5 rounded font-mono text-[10px] hover:bg-emerald-900/80 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel Report
            </button>
          </div>
          {/* DMA Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 flex items-center justify-between border-l-4 border-l-rose-500">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Avg Regional Risk</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono">{avgRisk}%</h3>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 flex items-center justify-between border-l-4 border-l-amber-500">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Vulnerable Population</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                  {totalVulnerablePop.toLocaleString('en-IN')}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 flex items-center justify-between border-l-4 border-l-cyan-500">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Active Hotspots</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono">{activeHotspots} Zones</h3>
              </div>
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Risk-Based Prioritization Engine */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase flex items-center gap-2">
                    RISK-BASED PRIORITIZATION ENGINE
                    {userGps && (
                      <span className="text-[8px] bg-blue-950 text-blue-400 border border-blue-900/60 px-2 py-0.5 rounded font-mono uppercase animate-pulse">
                        GPS Prioritization Active
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {userGps 
                      ? 'Habitations sorted by proximity to responder current GPS coordinates (Closest First)' 
                      : 'Heuristic assessment of habitations sorted by default hazard susceptibility index'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 font-mono uppercase tracking-wider rounded flex items-center gap-1.5 self-start sm:self-auto">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {userGps ? 'GPS Proximity Feeds' : 'Susceptibility Feeds'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 bg-slate-900/30">
                    <th className="py-2.5 px-3">Habitation</th>
                    <th className="py-2.5 px-3 text-center">Hazard Index</th>
                    <th className="py-2.5 px-3 text-center">Population</th>
                    <th className="py-2.5 px-3 text-center">Proximity to GPS</th>
                    <th className="py-2.5 px-3">Geotech Vulnerability Description</th>
                    <th className="py-2.5 px-3 text-right">Relocation Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {[...activeMarkers.filter((m) => m.status !== 'safe')]
                    .sort((a, b) => {
                      if (userGps) {
                        const distA = haversineKm(a.lat, a.lng, userGps.lat, userGps.lng);
                        const distB = haversineKm(b.lat, b.lng, userGps.lat, userGps.lng);
                        return distA - distB;
                      }
                      return b.risk - a.risk;
                    })
                    .map((marker) => {
                      const gpsDist = userGps
                        ? haversineKm(marker.lat, marker.lng, userGps.lat, userGps.lng).toFixed(1) + ' km'
                        : 'GPS Offline';
                      return (
                        <tr key={marker.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-200">{marker.name}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                marker.status === 'danger'
                                  ? 'bg-rose-950/60 text-rose-400 border border-rose-900/40'
                                  : 'bg-amber-950/60 text-amber-400 border border-amber-900/40'
                              }`}
                            >
                              {marker.risk}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300">
                            {marker.population.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300">
                            <span className={userGps ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                              {gpsDist}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={marker.details}>
                            {marker.details}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                authorizeRelocation(marker.id);
                                updatePipelineStep(7);
                              }}
                              className={`py-1 px-3 rounded font-extrabold text-[10px] uppercase tracking-wider transition-all ${
                                marker.population === 0
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : marker.risk > 80
                                  ? 'bg-rose-500 hover:bg-rose-600 text-slate-950 cursor-pointer'
                                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer'
                              }`}
                              disabled={marker.population === 0}
                            >
                              Authorize Relocate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

    case 'responder':
      return (
        <div className="space-y-6">
          {/* Responder Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Dispatched Teams</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                  {responders.filter((r) => r.status !== 'idle').length} / {responders.length}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 flex items-center justify-between border-l-4 border-l-rose-500">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Pending Alerts</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                  {activeWorkOrders.filter((w) => w.status === 'pending').length}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 flex items-center justify-between border-l-4 border-l-cyan-500">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Completed Tasks</span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono">
                  {activeWorkOrders.filter((w) => w.status === 'resolved').length}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Worker Deployment Tracking Board */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
                  FIELD DEPLOYMENT & WORKER STATUS
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Live status board of SDRF, Medical units, Police, and local NGOs tracking landslide alerts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {responders.map((resp) => (
                <div
                  key={resp.id}
                  className="bg-slate-950/80 border border-slate-900 rounded-lg p-4 hover:border-slate-800 transition-colors flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{resp.name}</h4>
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                        Class: {resp.type} Response Unit
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                        resp.status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30'
                          : resp.status === 'active'
                          ? 'bg-rose-950 text-rose-400 border border-rose-900/30 animate-pulse'
                          : resp.status === 'en-route'
                          ? 'bg-amber-950 text-amber-400 border border-amber-900/30'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {resp.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="text-slate-200">{resp.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Task Assignment:</span>
                      <span className={resp.taskId ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                        {resp.taskId ? `Order #${resp.taskId}` : 'None (Available)'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-900/50">
                      <span>Active Vehicles:</span>
                      <span className="text-slate-200">{resp.vehicleCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Personnel:</span>
                      <span className="text-slate-200">{resp.personnelSize || 0}</span>
                    </div>
                  </div>

                  {/* Progress Indicator if moving */}
                  {resp.status === 'en-route' && (
                    <div className="mt-1">
                      <div className="flex justify-between text-[9px] text-slate-500 mb-1 font-mono">
                        <span>EN ROUTE DETECTOR COORDINATE</span>
                        <span>{resp.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-cyan-400 rounded-full animate-pulse transition-all duration-300"
                          style={{ width: `${resp.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'shelter':
      return (
        <div className="space-y-6">
          {/* Resource Status Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400">
                <Droplet className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Avg Water Supply</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{
                        width: `${Math.round(
                          activeShelters.reduce((acc, curr) => acc + curr.waterLevel, 0) /
                            (activeShelters.length || 1)
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {Math.round(
                      activeShelters.reduce((acc, curr) => acc + curr.waterLevel, 0) /
                        (activeShelters.length || 1)
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                <Heart className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Rations Reserve</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{
                        width: `${Math.round(
                          activeShelters.reduce((acc, curr) => acc + curr.rations, 0) /
                            (activeShelters.length || 1)
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {Math.round(
                      activeShelters.reduce((acc, curr) => acc + curr.rations, 0) /
                        (activeShelters.length || 1)
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-400">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Medical Kits Res.</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{
                        width: `${Math.round(
                          activeShelters.reduce((acc, curr) => acc + curr.medicalKits, 0) /
                            (activeShelters.length || 1)
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {Math.round(
                      activeShelters.reduce((acc, curr) => acc + curr.medicalKits, 0) /
                        (activeShelters.length || 1)
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Carrying Capacity Optimization Engine */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
                  CARRYING CAPACITY & LOGISTICS ALLOCATOR
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Manage resettlement sites and optimize safe-haven resource deployment thresholds
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {activeShelters.map((shelter) => {
                const occupancyRate = Math.round((shelter.occupancy / shelter.capacity) * 100);
                const check = isShelterCompromised(shelter.lat ?? 0, shelter.lng ?? 0, markers);

                return (
                  <div
                    key={shelter.id}
                    className={`p-4 rounded-xl space-y-4 border ${
                      check.compromised 
                        ? 'bg-rose-950/20 border-rose-500/40' 
                        : 'bg-slate-950/80 border-slate-900'
                    }`}
                  >
                    {/* Shelter Header Capacity Gauge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                          {shelter.name}
                          {check.compromised && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-slate-950 text-[8px] font-black uppercase animate-pulse">
                              Compromised
                            </span>
                          )}
                        </h4>
                        <span className="text-[9px] font-mono block">
                          {check.compromised 
                            ? `⚠️ ALERT: Proximity overlap with active threat: ${check.threatName}`
                            : `LOCATION: ${shelter.locationId.toUpperCase()} SAFETY GRID`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right border-r border-slate-800 pr-3">
                          <span className="text-[10px] text-slate-500 font-mono block">Medical Beds</span>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {shelter.hospitalBeds || 0}
                          </span>
                        </div>
                        <div className="text-right border-r border-slate-800 pr-3">
                          <span className="text-[10px] text-slate-500 font-mono block">Personnel</span>
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {shelter.personnelCount || 0}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-mono block">Occupancy Rate</span>
                          <span className="text-xs font-mono font-bold text-slate-350">
                            {shelter.occupancy} / {shelter.capacity} Beds
                          </span>
                        </div>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                            occupancyRate > 90
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/40 animate-pulse'
                              : occupancyRate > 70
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          }`}
                        >
                          {occupancyRate}%
                        </span>
                      </div>
                    </div>

                    {/* Resources Allocators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                      {/* Water */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                            Water Level
                          </span>
                          <span className="text-cyan-400 font-bold">{shelter.waterLevel}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={shelter.waterLevel}
                          onChange={(e) =>
                            handleResourceSliderChange(shelter.id, 'waterLevel', parseInt(e.target.value))
                          }
                          className="w-full accent-cyan-400 bg-slate-900 rounded-lg cursor-pointer h-1"
                        />
                      </div>

                      {/* Rations */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-emerald-400" />
                            Rations Reserves
                          </span>
                          <span className="text-emerald-400 font-bold">{shelter.rations}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={shelter.rations}
                          onChange={(e) =>
                            handleResourceSliderChange(shelter.id, 'rations', parseInt(e.target.value))
                          }
                          className="w-full accent-emerald-400 bg-slate-900 rounded-lg cursor-pointer h-1"
                        />
                      </div>

                      {/* Medical Kits */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            Medical Invent.
                          </span>
                          <span className="text-amber-400 font-bold">{shelter.medicalKits}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={shelter.medicalKits}
                          onChange={(e) =>
                            handleResourceSliderChange(shelter.id, 'medicalKits', parseInt(e.target.value))
                          }
                          className="w-full accent-amber-400 bg-slate-900 rounded-lg cursor-pointer h-1"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

// ─── Haversine distance (meters) ─────────────────────────────────────────────
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Check if a safe shelter falls inside any active threat's severity range
function isShelterCompromised(shelterLat: number, shelterLng: number, allMarkers: HazardMarker[]): { compromised: boolean; threatName?: string } {
  for (const m of allMarkers) {
    if (m.status !== 'safe' && m.risk > 10) {
      const radiusMeters = m.radius || 1000;
      const distanceMeters = haversineMeters(m.lat, m.lng, shelterLat, shelterLng);
      if (distanceMeters <= radiusMeters) {
        return { compromised: true, threatName: m.name };
      }
    }
  }
  return { compromised: false };
}

export default TabRoleViews;
