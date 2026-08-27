import React, { useState } from 'react';
import { Play, ArrowRight, Info, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface TabPipelineProps {
  activeStep: number;
}

export const TabPipeline: React.FC<TabPipelineProps> = ({ activeStep }) => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const pipelineSteps = [
    {
      title: 'PREDICT',
      desc: 'Predict Susceptibility Thresholds',
      detail: 'Aggregates IoT precipitation telemetry, GSI landslide susceptibility indices, and soil moisture rasters to run predictive hazard boundaries before failure occurs.',
      status: 'Continuous GIS modeling active',
      icon: '1',
    },
    {
      title: 'DETECT',
      desc: 'Drone CV Deformation Scanning',
      detail: 'Utilizes high-resolution drone camera feeds and Convolutional Neural Networks (ResNet-50) to detect tension fissures, road cracks, and deep potholes.',
      status: 'CV scanner node listening',
      icon: '2',
    },
    {
      title: 'ASSESS',
      desc: 'Threat Severity Assessment',
      detail: 'Calculates the hazard index of detected cracks and blockages. Cross-references structural failure confidence with population densities.',
      status: 'Threat mapping engine online',
      icon: '3',
    },
    {
      title: 'PRIORITIZE',
      desc: 'Risk Prioritization Heuristics',
      detail: 'Sorts endangered habitations and structural blocks. Triggers alerts for coordinates exceeding the 80% critical risk coefficient.',
      status: 'Prioritization grid active',
      icon: '4',
    },
    {
      title: 'ALLOCATE',
      desc: 'Shelter Carrying Capacity Allocation',
      detail: 'Calculates safe-zone capacities. Dynamically manages water levels, food rations, and medical supply reserves on-site to absorb evacuees.',
      status: 'Carrying Capacity Engine active',
      icon: '5',
    },
    {
      title: 'ROUTE',
      desc: 'Optimal Escape Route Solver',
      detail: 'Plots evacuation vector pathways from danger boundaries to nearest safe shelter using Dijkstra/A* models, checking road blocks.',
      status: 'SVG Routing solver active',
      icon: '6',
    },
    {
      title: 'COORDINATE',
      desc: 'Field Responder Dispatch',
      detail: 'Coordinates task assignment boards for Police, SDRF, Medical, and NGOs. Tracks team coordinates and estimated arrival times.',
      status: 'SDRF coordinate channel OK',
      icon: '7',
    },
    {
      title: 'RELOCATE',
      desc: 'Resident Relocation Protocol',
      detail: 'Initiates community alerts and guides vulnerable residents along optimized cyan escape vectors toward safe resettlement camps.',
      status: 'Relocation protocols armed',
      icon: '8',
    },
    {
      title: 'MONITOR',
      desc: 'Live Feedback & IoT Stream',
      detail: 'Uses Sentinel radar and UAV aerial overlays to monitor mudflow speeds and crack enlargement rates during evacuation.',
      status: 'IoT MQTT stream listening',
      icon: '9',
    },
    {
      title: 'RE-OPTIMIZE',
      desc: 'Closed-Loop Feed Re-Adjustment',
      detail: 'Updates shelter resources and escape pathways as hazards are resolved, continuously feeding new metrics back into prediction algorithms.',
      status: 'Feedback loop listening',
      icon: '10',
    },
  ];

  const activeIndex = activeStep;
  const currentDetailsIndex = selectedStep !== null ? selectedStep : activeIndex;
  const currentDetailsStep = pipelineSteps[currentDetailsIndex];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Visual Flow Timeline Card */}
      <div className="glass-panel rounded-xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="tech-grid absolute inset-0 opacity-5 pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-6 relative z-10">
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              10-STEP CONTINUOUS OPTIMIZATION PIPELINE
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Mitigation Workflow Lifecycle • Team CodeNova Closed-Loop Architecture
            </p>
          </div>
          <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded font-mono text-cyan-400">
            ACTIVE PIPELINE STEP: #{activeIndex + 1}
          </span>
        </div>

        {/* Timeline Grid Flowchart */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-4">
          {pipelineSteps.map((step, idx) => {
            const isActive = idx === activeIndex;
            const isSelected = idx === selectedStep;
            const isCompleted = idx < activeIndex;

            return (
              <div
                key={idx}
                onClick={() => setSelectedStep(idx)}
                className={`relative p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between h-28 hover:scale-102 ${
                  isActive
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse-slow'
                    : isCompleted
                    ? 'border-emerald-800/40 bg-emerald-950/10'
                    : isSelected
                    ? 'border-slate-500 bg-slate-900/60'
                    : 'border-slate-900 bg-slate-950/40 opacity-70 hover:border-slate-800 hover:opacity-100'
                }`}
              >
                {/* Number Badge & Status indicator */}
                <div className="flex justify-between items-start">
                  <span
                    className={`w-5 h-5 rounded-full font-mono text-[9px] font-bold flex items-center justify-center border ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.8)]'
                        : isCompleted
                        ? 'bg-emerald-900 text-emerald-400 border-emerald-800/60'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {step.icon}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  )}
                </div>

                {/* Step Titles */}
                <div className="mt-4">
                  <h3
                    className={`text-xs font-black tracking-wide font-mono uppercase ${
                      isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[8px] font-mono text-slate-500 mt-0.5 truncate uppercase">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Box */}
      {currentDetailsStep && (
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-cyan-400 flex flex-col md:flex-row gap-5 items-start">
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 shrink-0 self-center md:self-auto">
            <span className="font-mono text-2xl font-black">{currentDetailsStep.icon}</span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-900 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  STEP {currentDetailsStep.icon}: {currentDetailsStep.title}
                </h3>
                <p className="text-[10px] text-cyan-400 font-mono mt-0.5">{currentDetailsStep.desc}</p>
              </div>
              <span className="text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded font-mono text-slate-400 uppercase self-start sm:self-auto">
                Engine Status: {currentDetailsStep.status}
              </span>
            </div>

            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              {currentDetailsStep.detail}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default TabPipeline;
