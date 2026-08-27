import React from 'react';
import {
  Wrench,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock,
  Compass,
  Cpu,
  Sliders,
  Send,
  AlertTriangle,
  Play
} from 'lucide-react';
import { WorkOrder, FieldResponder } from '../types';

interface TabDispatchDeskProps {
  workOrders: WorkOrder[];
  responders: FieldResponder[];
  deployTeam: (workOrderId: string, responderId: string) => void;
  locationId: string;
  updatePipelineStep: (step: number) => void;
}

export const TabDispatchDesk: React.FC<TabDispatchDeskProps> = ({
  workOrders,
  responders,
  deployTeam,
  locationId,
  updatePipelineStep,
}) => {
  // Filter active work orders for current location
  const activeWorkOrders = workOrders.filter((w) => w.locationId === locationId);

  // Find an available (idle) responder
  const availableResponders = responders.filter((r) => r.status === 'idle');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-rose-400 bg-rose-950/50 border-rose-900/50';
      case 'medium':
        return 'text-amber-400 bg-amber-950/50 border-amber-900/50';
      default:
        return 'text-cyan-400 bg-cyan-950/50 border-cyan-900/50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-900/30';
      case 'active':
        return 'text-rose-400 bg-rose-950/50 border-rose-900/30 animate-pulse';
      case 'dispatched':
        return 'text-amber-400 bg-amber-950/50 border-amber-900/30';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const handleDeployClick = (woId: string, respId: string) => {
    deployTeam(woId, respId);
    // Set active step to 6: COORDINATE
    updatePipelineStep(6);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Work Orders List (Left Pane) */}
      <div className="lg:col-span-3 glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
                ACTIVE WORK ORDERS & TELEMETRY TASKS
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Incidents generated from Computer Vision detection scans or Simulation alerts
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 bg-slate-950 border border-slate-850 text-slate-400 font-mono rounded">
            TASKS: {activeWorkOrders.length}
          </span>
        </div>

        {/* Work Orders Scroll Area */}
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-1">
          {activeWorkOrders.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-850 rounded-xl">
              <CheckCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-mono text-slate-400">All local hazards resolved.</p>
              <p className="text-[9px] text-slate-500 font-mono mt-1">
                Scan images in the CV Portal or trigger scenario events to generate active work orders.
              </p>
            </div>
          ) : (
            activeWorkOrders.map((wo) => (
              <div
                key={wo.id}
                className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-800 transition-colors"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-500 font-mono">#{wo.id}</span>
                      <span
                        className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${
                          wo.source === 'CV' ? 'bg-cyan-950/60 text-cyan-400 border-cyan-900/30' : 'bg-slate-900 text-slate-400 border-slate-850'
                        }`}
                      >
                        SRC: {wo.source}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-1">{wo.title}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-cyan-400" />
                      {wo.locationName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-[8px] font-extrabold font-mono px-2 py-0.5 rounded border uppercase ${getPriorityColor(
                        wo.priority
                      )}`}
                    >
                      {wo.priority}
                    </span>
                    <span
                      className={`text-[8px] font-extrabold font-mono px-2 py-0.5 rounded border uppercase ${getStatusColor(
                        wo.status
                      )}`}
                    >
                      {wo.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed bg-slate-900/30 p-2.5 rounded border border-slate-900/60">
                  {wo.description}
                </p>

                {/* Deploy action footer */}
                {wo.status === 'pending' && (
                  <div className="border-t border-slate-900 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    {availableResponders.length > 0 ? (
                      <>
                        <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {availableResponders.length} units available for dispatch.
                        </span>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <select
                            id={`resp-select-${wo.id}`}
                            className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[10px] font-mono text-slate-350 focus:outline-none"
                          >
                            {availableResponders.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name.split(' ')[0]} ({r.type})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const selectEl = document.getElementById(
                                `resp-select-${wo.id}`
                              ) as HTMLSelectElement;
                              if (selectEl) {
                                handleDeployClick(wo.id, selectEl.value);
                              }
                            }}
                            className="flex-1 sm:flex-initial py-1 px-3 rounded bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3 text-slate-950" />
                            Deploy Team
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-[9px] font-mono text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        No response units available. (All teams currently active/deployed)
                      </span>
                    )}
                  </div>
                )}

                {/* Progress bar if dispatched */}
                {wo.status === 'dispatched' && (
                  <div className="pt-2">
                    <div className="flex justify-between text-[9px] text-slate-500 mb-1 font-mono">
                      <span>RESPONDER TEAM TRANSITING TO VECTOR COORDINATES</span>
                      <span>{wo.progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-300"
                        style={{ width: `${wo.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Field Responder status (Right Pane) */}
      <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
          <Truck className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
              FIELD RESPONDER REGISTRY
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Live status mapping and communications channels
            </p>
          </div>
        </div>

        {/* Responder registry scroll */}
        <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[500px]">
          {responders.map((resp) => (
            <div
              key={resp.id}
              className={`p-3 rounded-lg border transition-all ${
                resp.status !== 'idle'
                  ? 'bg-slate-950/80 border-slate-800'
                  : 'bg-slate-900/30 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200">{resp.name}</span>
                <span
                  className={`text-[8px] font-extrabold font-mono px-1.5 py-0.5 rounded border uppercase ${
                    resp.status === 'resolved'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-900/30'
                      : resp.status === 'active'
                      ? 'bg-rose-950 text-rose-400 border-rose-900/30'
                      : resp.status === 'en-route'
                      ? 'bg-amber-950 text-amber-400 border-amber-900/30'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {resp.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-900">
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">Specialty Unit</span>
                  <span className="text-slate-350">{resp.type} Response</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase">Task Ref</span>
                  <span className="text-slate-350">{resp.taskId ? `Order #${resp.taskId}` : 'Unassigned'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TabDispatchDesk;
