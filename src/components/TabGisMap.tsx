import React, { useState, useEffect } from 'react';
import { MapPin, Info, Navigation, ArrowRight, Eye, ShieldCheck, AlertTriangle } from 'lucide-react';
import { HazardMarker, LocationId, Shelter } from '../types';

interface TabGisMapProps {
  locationId: LocationId;
  markers: HazardMarker[];
  shelters: Shelter[];
  selectedMarker: HazardMarker | null;
  setSelectedMarker: (marker: HazardMarker | null) => void;
  activeEvacuationRoute: {
    path: string;
    distance: string;
    time: string;
    roadCondition: string;
    targetShelterName: string;
  } | null;
  setActiveEvacuationRoute: (
    route: {
      path: string;
      distance: string;
      time: string;
      roadCondition: string;
      targetShelterName: string;
    } | null
  ) => void;
  updatePipelineStep: (step: number) => void;
}

export const TabGisMap: React.FC<TabGisMapProps> = ({
  locationId,
  markers,
  shelters,
  selectedMarker,
  setSelectedMarker,
  activeEvacuationRoute,
  setActiveEvacuationRoute,
  updatePipelineStep,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Filter markers and shelters based on active location
  const activeMarkers = markers.filter((m) => m.locationId === locationId);
  const activeShelters = shelters.filter((s) => s.locationId === locationId);

  // Auto-calculate routing when selectedMarker changes
  useEffect(() => {
    if (selectedMarker && selectedMarker.status !== 'safe') {
      // Find nearest safe shelter for this location
      const safeNodes = activeMarkers.filter((m) => m.status === 'safe');
      if (safeNodes.length > 0) {
        // Find nearest safe shelter (just pick first for mock logic or compute Euclidean distance)
        const nearestShelter = safeNodes[0];

        // Draw curved Bezier path
        const x1 = selectedMarker.x;
        const y1 = selectedMarker.y;
        const x2 = nearestShelter.x;
        const y2 = nearestShelter.y;

        // Quadratic Bezier curve: M startX startY Q controlX controlY endX endY
        // Control point is average point offset orthogonally for a nice curve
        const cx = (x1 + x2) / 2 - 8;
        const cy = (y1 + y2) / 2 - 12;

        const pathStr = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

        // Simulate distances
        const distNum = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) * 0.15;
        const distStr = `${distNum.toFixed(1)} km`;
        const timeVal = Math.round(distNum * 3);
        const timeStr = `${timeVal} mins`;
        const roadCond = selectedMarker.risk > 80 ? 'Heavy Rain / Rocks Cleared' : 'Cleared';

        setActiveEvacuationRoute({
          path: pathStr,
          distance: distStr,
          time: timeStr,
          roadCondition: roadCond,
          targetShelterName: nearestShelter.name,
        });

        // Set active pipeline step to 5: ROUTE
        updatePipelineStep(5);
      }
    } else {
      setActiveEvacuationRoute(null);
    }
  }, [selectedMarker, locationId]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full">
      {/* Map Pane */}
      <div className="flex-1 glass-panel rounded-xl p-4 flex flex-col min-h-[500px] relative overflow-hidden">
        {/* Background Radar sweeps */}
        <div className="tech-grid absolute inset-0 opacity-5 pointer-events-none"></div>

        {/* Map Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {locationId === 'wayanad' ? 'Wayanad Hills (Kerala) Sector Map' : 'Joshimath Valley (Uttarakhand) Hazard Map'}
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Satellite Raster Grid • Scale 1:25,000 • Live Sensor Overlays
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono text-cyan-400">
            ISRO-BHUVAN ENGINE
          </span>
        </div>

        {/* Interactive SVG Canvas */}
        <div className="flex-1 bg-slate-950/70 border border-slate-850 rounded-lg relative overflow-hidden flex items-center justify-center p-2">
          {/* Topographical Grid Simulation inside SVG */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full max-h-[600px] aspect-[4/3] select-none cursor-crosshair"
          >
            {/* Topography Contours */}
            <path
              d="M 5,20 C 15,10 40,5 60,15 C 80,25 90,50 85,75 C 80,90 65,95 50,90 C 30,85 10,70 5,20 Z"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <path
              d="M 12,28 C 22,18 42,15 58,22 C 74,29 82,48 78,70 C 74,82 62,86 48,82 C 32,78 16,66 12,28 Z"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.75"
            />
            <path
              d="M 22,38 C 30,30 45,28 55,32 C 65,36 70,48 68,62 C 66,70 58,74 48,72 C 38,70 25,60 22,38 Z"
              fill="none"
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="3,3"
            />

            {/* Mountains Topo Ridges */}
            <path d="M 5 50 L 25 30 L 45 42 L 70 20 L 95 45" fill="none" stroke="#0f172a" strokeWidth="2" />
            <path d="M 10 75 L 30 55 L 50 65 L 75 45 L 90 60" fill="none" stroke="#0f172a" strokeWidth="1.5" />

            {/* Waterways / Rivers (Blue/Cyan paths) */}
            <path
              d="M 0,5 C 20,10 32,25 35,45 C 38,65 52,80 70,85 C 85,90 92,100 100,100"
              fill="none"
              stroke="#0c4a6e"
              strokeWidth="1.5"
              className="opacity-70"
            />
            <path
              d="M 0,5 C 20,10 32,25 35,45 C 38,65 52,80 70,85 C 85,90 92,100 100,100"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="0.5"
              className="opacity-40"
            />

            {/* Road Networks (Dotted paths) */}
            <path
              d="M 15,15 L 20,35 L 35,65 L 45,50 L 60,70 Q 75,75 90,60"
              fill="none"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="2,3"
            />
            <path
              d="M 15,15 L 20,20 L 30,55 L 48,62 Q 60,55 75,25"
              fill="none"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="2,3"
            />

            {/* Evacuation Route Drawing */}
            {activeEvacuationRoute && (
              <>
                {/* Glow Backdrop */}
                <path
                  d={activeEvacuationRoute.path}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="4"
                  className="opacity-20 blur-sm"
                />
                {/* Animated Dotted Flow */}
                <path
                  d={activeEvacuationRoute.path}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  className="animate-dash"
                />
              </>
            )}

            {/* Zone Boundaries */}
            {/* Wayanad Zones */}
            {locationId === 'wayanad' && (
              <>
                {/* Danger zone around Mundakkai */}
                <polygon
                  points="28,58 42,56 42,75 25,72"
                  fill="rgba(244, 63, 94, 0.08)"
                  stroke="rgba(244, 63, 94, 0.4)"
                  strokeWidth="0.5"
                  strokeDasharray="2,1"
                  className="animate-pulse"
                />
                {/* Warning zone around Chooralmala */}
                <polygon
                  points="38,42 55,40 50,58 35,55"
                  fill="rgba(245, 158, 11, 0.05)"
                  stroke="rgba(245, 158, 11, 0.3)"
                  strokeWidth="0.5"
                />
              </>
            )}

            {/* Joshimath Zones */}
            {locationId === 'joshimath' && (
              <>
                {/* Danger Zone around Sunil Ward */}
                <polygon
                  points="20,48 40,46 38,65 18,62"
                  fill="rgba(244, 63, 94, 0.08)"
                  stroke="rgba(244, 63, 94, 0.4)"
                  strokeWidth="0.5"
                  strokeDasharray="2,1"
                  className="animate-pulse"
                />
                {/* Warning Zone Manohar Bagh */}
                <polygon
                  points="40,54 58,52 56,70 38,68"
                  fill="rgba(245, 158, 11, 0.05)"
                  stroke="rgba(245, 158, 11, 0.3)"
                  strokeWidth="0.5"
                />
              </>
            )}

            {/* Node Markers */}
            {activeMarkers.map((marker) => {
              const isSelected = selectedMarker?.id === marker.id;
              const isHovered = hoveredNode === marker.id;

              // Color classes
              let markerColor = '#10b981'; // safe
              let markerGlow = 'rgba(16, 185, 129, 0.4)';
              if (marker.status === 'danger') {
                markerColor = '#f43f5e';
                markerGlow = 'rgba(244, 63, 94, 0.6)';
              } else if (marker.status === 'warning') {
                markerColor = '#f59e0b';
                markerGlow = 'rgba(245, 158, 11, 0.5)';
              }

              return (
                <g
                  key={marker.id}
                  onClick={() => setSelectedMarker(isSelected ? null : marker)}
                  onMouseEnter={() => setHoveredNode(marker.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer"
                >
                  {/* Outer Pulsing Glow */}
                  {marker.status === 'danger' && (
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r={isHovered || isSelected ? 4.5 : 3.5}
                      fill="none"
                      stroke={markerColor}
                      strokeWidth="0.75"
                      className="animate-ping"
                      style={{ transformOrigin: `${marker.x}px ${marker.y}px` }}
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r={isSelected ? 3 : 2}
                    fill={markerColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 0.75 : 0.4}
                    className="transition-all duration-300"
                  />

                  {/* Inner center dot for safety marker */}
                  {marker.status === 'safe' && (
                    <circle cx={marker.x} cy={marker.y} r="0.75" fill="#020617" />
                  )}

                  {/* Label tooltip (rendered directly on hover/selected) */}
                  {(isHovered || isSelected) && (
                    <g style={{ pointerEvents: 'none' }}>
                      <rect
                        x={marker.x - 18}
                        y={marker.y - 8.5}
                        width="36"
                        height="5.5"
                        rx="1"
                        fill="#0f172a"
                        stroke={isSelected ? '#06b6d4' : '#475569'}
                        strokeWidth="0.3"
                      />
                      <text
                        x={marker.x}
                        y={marker.y - 4.5}
                        fill="#f1f5f9"
                        fontSize="2.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {marker.name.split(' ')[0]}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Map Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-900 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
            <span>Red Zone (High Risk)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-505 shrink-0" style={{ backgroundColor: '#f59e0b' }}></span>
            <span>Yellow Zone (Monitor)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Safe Shelter Point</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-cyan-400 shrink-0 animate-pulse"></span>
            <span>Opt. Evacuation Route</span>
          </div>
        </div>
      </div>

      {/* Info Sidebar Pane */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        {/* Evacuation Optimizer Card */}
        <div className="glass-panel rounded-xl p-5 border-t-4 border-t-cyan-500 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="text-xs font-extrabold tracking-wider text-slate-100 uppercase">
              AI EVACUATION OPTIMIZER
            </h3>
          </div>

          {activeEvacuationRoute && selectedMarker ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Origin Danger Node</div>
                <div className="text-sm font-bold text-rose-400 mt-0.5">{selectedMarker.name}</div>
                <div className="text-[10px] text-slate-300 font-mono mt-1 leading-relaxed">
                  {selectedMarker.details}
                </div>
              </div>

              <div className="flex justify-center my-1 text-slate-500">
                <ArrowRight className="w-5 h-5 text-cyan-400 animate-pulse rotate-90 xl:rotate-0" />
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Allocated Safe Shelter</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {activeEvacuationRoute.targetShelterName}
                </div>
              </div>

              {/* Dynamic Path Calculations */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-900/40 border border-slate-850 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">Evac Distance</span>
                  <span className="text-cyan-400 font-extrabold text-sm">{activeEvacuationRoute.distance}</span>
                </div>
                <div className="p-2.5 bg-slate-900/40 border border-slate-850 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">Travel Time</span>
                  <span className="text-cyan-400 font-extrabold text-sm">{activeEvacuationRoute.time}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/40 border border-slate-850 rounded text-xs font-mono">
                <span className="text-slate-500 block text-[9px] uppercase">Evacuation Route Status</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-200 font-bold">{activeEvacuationRoute.roadCondition}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 px-4 text-center border border-dashed border-slate-800 rounded-lg">
              <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Select any <span className="text-rose-400 font-bold">Red</span> or{' '}
                <span className="text-amber-400 font-bold">Yellow</span> hazard node on the GIS Map to resolve and plot the optimal escape vector route.
              </p>
            </div>
          )}
        </div>

        {/* Selected Marker Telemetry Details */}
        {selectedMarker && (
          <div className="glass-panel rounded-xl p-5 border-l-4 border-l-slate-400 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-200">{selectedMarker.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {selectedMarker.id}</span>
              </div>
              <span
                className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                  selectedMarker.status === 'danger'
                    ? 'bg-rose-950 text-rose-400'
                    : selectedMarker.status === 'warning'
                    ? 'bg-amber-950 text-amber-400'
                    : 'bg-emerald-950 text-emerald-400'
                }`}
              >
                {selectedMarker.status}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-500">Soil Hazard Index:</span>
                <span className={`font-bold ${selectedMarker.risk > 80 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {selectedMarker.risk}%
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-500">Vulnerable Population:</span>
                <span className="font-bold text-slate-200">{selectedMarker.population} residents</span>
              </div>
              <div className="flex flex-col gap-0.5 pt-1">
                <span className="text-slate-500">Geotechnical Analysis:</span>
                <span className="text-slate-350 leading-relaxed text-[11px] mt-1 bg-slate-950 p-2 rounded border border-slate-850">
                  {selectedMarker.details}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* References Card */}
        <div className="glass-panel rounded-xl p-4 flex flex-col gap-2 bg-slate-900/20">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            National Standards Citation
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
            Hazard indicators and risk assessments follow the{' '}
            <span className="text-slate-200">NDMA Landslide Guidelines (2019)</span> and geological datasets from{' '}
            <span className="text-slate-200">ISRO Bhuvan</span> and the{' '}
            <span className="text-slate-200">Geological Survey of India (GSI)</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
export default TabGisMap;
