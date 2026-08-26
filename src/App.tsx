import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SidebarSimulator } from './components/SidebarSimulator';
import { TabGisMap } from './components/TabGisMap';
import { TabRoleViews } from './components/TabRoleViews';
import { TabComputerVision } from './components/TabComputerVision';
import { TabDispatchDesk } from './components/TabDispatchDesk';
import { TabPipeline } from './components/TabPipeline';
import { References } from './components/References';

import {
  DisasterType,
  IntensityLevel,
  LocationId,
  RoleType,
  HazardMarker,
  Shelter,
  FieldResponder,
  WorkOrder,
} from './types';

import {
  INITIAL_HAZARD_MARKERS,
  INITIAL_SHELTERS,
  INITIAL_RESPONDERS,
  INITIAL_WORK_ORDERS,
} from './mockData';

import { Map, Users, Cpu, Wrench, Shield, AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<'map' | 'roles' | 'cv' | 'dispatch' | 'pipeline'>('map');
  const [activeRole, setActiveRole] = useState<RoleType>('dma');

  // Simulator Selector states
  const [simLocation, setSimLocation] = useState<LocationId>('wayanad');
  const [simDisaster, setSimDisaster] = useState<DisasterType>('cloudburst');
  const [simIntensity, setSimIntensity] = useState<IntensityLevel>('severe');

  // Global simulation alarm states
  const [systemAlert, setSystemAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [activeDisasterInfo, setActiveDisasterInfo] = useState<{
    disaster: DisasterType;
    intensity: IntensityLevel;
    location: LocationId;
  } | null>(null);

  // Core Datasets states
  const [markers, setMarkers] = useState<HazardMarker[]>(INITIAL_HAZARD_MARKERS);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [responders, setResponders] = useState<FieldResponder[]>(INITIAL_RESPONDERS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);

  // Evacuation routing states
  const [selectedMarker, setSelectedMarker] = useState<HazardMarker | null>(null);
  const [activeEvacuationRoute, setActiveEvacuationRoute] = useState<{
    path: string;
    distance: string;
    time: string;
    roadCondition: string;
    targetShelterName: string;
  } | null>(null);

  // 10-Step Pipeline Active Step
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0); // Starts at 0 (PREDICT)

  // Custom Toast Alerts
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle disaster simulation trigger
  const triggerDisaster = () => {
    setSystemAlert(true);
    const locName = simLocation === 'wayanad' ? 'Wayanad Hills' : 'Joshimath Valley';
    const disLabel =
      simDisaster === 'cloudburst' ? 'Cloudburst' : simDisaster === 'landslide' ? 'Landslide' : 'Flash Flood';
    const msg = `CRITICAL ALERT: Severe ${disLabel} detected! Hazard index in ${locName} has exceeded 90%.`;
    setAlertMessage(msg);
    setActiveDisasterInfo({
      disaster: simDisaster,
      intensity: simIntensity,
      location: simLocation,
    });

    // 1. Alter target region markers: Increase risk on primary node to 96%
    const targetMarkerId = simLocation === 'wayanad' ? 'w-1' : 'j-1';
    setMarkers((prev) =>
      prev.map((m) =>
        m.id === targetMarkerId ? { ...m, risk: 96, status: 'danger' } : m
      )
    );

    // Auto-select the dangerous marker so route maps immediately
    const mainMarker = markers.find((m) => m.id === targetMarkerId);
    if (mainMarker) {
      setSelectedMarker({ ...mainMarker, risk: 96, status: 'danger' });
    }

    // 2. Shift Safe Shelter occupancy capacity to 92%
    const shelterId = simLocation === 'wayanad' ? 'w-s1' : 'j-s1';
    setShelters((prev) =>
      prev.map((s) => {
        if (s.id === shelterId) {
          const cap92 = Math.round(s.capacity * 0.92);
          return { ...s, occupancy: cap92 };
        }
        return s;
      })
    );

    // 3. Generate urgent dispatch work order
    const nodeName = simLocation === 'wayanad' ? 'Mundakkai Hamlet' : 'Sunil Ward (Slope Creep)';
    const newWo: WorkOrder = {
      id: `wo-auto-${Date.now().toString().slice(-4)}`,
      title: `Urgent Evacuation & Blockade Clearance (${disLabel})`,
      description: `Immediate response team required to support evacuation from ${nodeName} to nearest Safe Haven due to severe ${disLabel} alert.`,
      source: 'Simulator',
      locationId: simLocation,
      locationName: nodeName,
      priority: 'critical',
      status: 'pending',
      assignedResponderId: null,
      progress: 0,
    };

    setWorkOrders((prev) => [newWo, ...prev]);

    // Show Global Toast Alert
    setToast({
      message: msg,
      type: 'danger',
    });

    // Update pipeline step to 0: PREDICT, then 3: PRIORITIZE
    setActivePipelineStep(0);
    setTimeout(() => {
      setActivePipelineStep(3); // Prioritization
    }, 1500);
  };

  // Reset entire simulation to initial baseline datasets
  const resetSimulation = () => {
    setSystemAlert(false);
    setAlertMessage(null);
    setActiveDisasterInfo(null);
    setMarkers(INITIAL_HAZARD_MARKERS);
    setShelters(INITIAL_SHELTERS);
    setResponders(INITIAL_RESPONDERS);
    setWorkOrders(INITIAL_WORK_ORDERS);
    setSelectedMarker(null);
    setActiveEvacuationRoute(null);
    setActivePipelineStep(0);

    setToast({
      message: 'Simulation engine reset successfully. Datasets reverted to baseline values.',
      type: 'info',
    });
  };

  // Authorize relocation protocols
  const authorizeRelocation = (markerId: string) => {
    const targetMarker = markers.find((m) => m.id === markerId);
    if (!targetMarker) return;

    // Relocate population to nearest safe shelter
    const locShelters = shelters.filter((s) => s.locationId === targetMarker.locationId);
    if (locShelters.length > 0) {
      const targetShelter = locShelters[0];
      setShelters((prev) =>
        prev.map((s) =>
          s.id === targetShelter.id
            ? { ...s, occupancy: Math.min(s.capacity, s.occupancy + targetMarker.population) }
            : s
        )
      );
    }

    // Set marker population to 0 and risk index to lower level
    setMarkers((prev) =>
      prev.map((m) =>
        m.id === markerId ? { ...m, population: 0, risk: 25, status: 'warning', details: 'Population successfully relocated. Sector secured.' } : m
      )
    );

    // If active marker was selected, update selected details
    if (selectedMarker?.id === markerId) {
      setSelectedMarker((prev) =>
        prev
          ? {
              ...prev,
              population: 0,
              risk: 25,
              status: 'warning',
              details: 'Population successfully relocated. Sector secured.',
            }
          : null
      );
    }

    setToast({
      message: `RELOCATION AUTHORIZED: ${targetMarker.name} residents relocated successfully. Safe shelter counts updated.`,
      type: 'success',
    });
  };

  // Deploy responder teams (animated transit)
  const deployTeam = (workOrderId: string, responderId: string) => {
    const targetWO = workOrders.find((w) => w.id === workOrderId);
    const targetResp = responders.find((r) => r.id === responderId);

    if (!targetWO || !targetResp) return;

    // 1. Assign responder and set status to 'dispatched' / 'en-route'
    setWorkOrders((prev) =>
      prev.map((w) =>
        w.id === workOrderId ? { ...w, status: 'dispatched', assignedResponderId: responderId } : w
      )
    );
    setResponders((prev) =>
      prev.map((r) =>
        r.id === responderId ? { ...r, status: 'en-route', taskId: workOrderId, progress: 0 } : r
      )
    );

    // Set active step to 6: COORDINATE
    setActivePipelineStep(6);

    // 2. Animate transit route progress simulation
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setResponders((prev) =>
        prev.map((r) => (r.id === responderId ? { ...r, progress: currentProgress } : r))
      );
      setWorkOrders((prev) =>
        prev.map((w) => (w.id === workOrderId ? { ...w, progress: currentProgress } : w))
      );

      if (currentProgress >= 100) {
        clearInterval(interval);

        // Transition responder status to 'active'
        setResponders((prev) =>
          prev.map((r) => (r.id === responderId ? { ...r, status: 'active', progress: 100 } : r))
        );
        setWorkOrders((prev) =>
          prev.map((w) => (w.id === workOrderId ? { ...w, status: 'active', progress: 100 } : w))
        );

        // Set active step to 7: RELOCATE / 8: MONITOR
        setActivePipelineStep(8);

        // Resolve after 1.5 seconds of work completion
        setTimeout(() => {
          // Resolve Work Order
          setWorkOrders((prev) =>
            prev.map((w) => (w.id === workOrderId ? { ...w, status: 'resolved' } : w))
          );
          // Free Responder
          setResponders((prev) =>
            prev.map((r) => (r.id === responderId ? { ...r, status: 'resolved', taskId: null } : r))
          );

          // Resolve target map coordinate hazard index (reduce risk to 20%)
          setMarkers((prev) =>
            prev.map((m) => {
              if (m.name === targetWO.locationName) {
                return { ...m, risk: 20, status: 'safe', details: 'Debris cleared. Road structural stability restored.' };
              }
              return m;
            })
          );

          if (selectedMarker?.name === targetWO.locationName) {
            setSelectedMarker((prev) =>
              prev
                ? {
                    ...prev,
                    risk: 20,
                    status: 'safe',
                    details: 'Debris cleared. Road structural stability restored.',
                  }
                : null
            );
          }

          setToast({
            message: `HAZARD RESOLVED: ${targetResp.name} completed ${targetWO.title} at ${targetWO.locationName}!`,
            type: 'success',
          });

          // Pipeline Step to 9: RE-OPTIMIZE
          setActivePipelineStep(9);
        }, 1500);
      }
    }, 300);
  };

  // Triggered when CV Model successfully detects a structural flaw
  const onHazardDetected = (hazard: {
    name: string;
    locationId: 'wayanad' | 'joshimath';
    risk: number;
    details: string;
    x: number;
    y: number;
    title: string;
    description: string;
  }) => {
    // 1. Add hazard marker to GIS datasets
    const newMarkerId = `cv-${Date.now().toString().slice(-4)}`;
    const newMarker: HazardMarker = {
      id: newMarkerId,
      name: hazard.name,
      locationId: hazard.locationId,
      risk: hazard.risk,
      status: 'danger',
      details: hazard.details,
      population: 40,
      x: hazard.x,
      y: hazard.y,
    };

    setMarkers((prev) => {
      // Avoid duplicate uploads if preset clicked multiple times
      if (prev.some((m) => m.name === hazard.name)) return prev;
      return [...prev, newMarker];
    });

    // 2. Generate dispatch Work Order
    const newWo: WorkOrder = {
      id: `wo-cv-${Date.now().toString().slice(-4)}`,
      title: hazard.title,
      description: hazard.description,
      source: 'CV',
      locationId: hazard.locationId,
      locationName: hazard.name,
      priority: 'critical',
      status: 'pending',
      assignedResponderId: null,
      progress: 0,
    };

    setWorkOrders((prev) => {
      if (prev.some((w) => w.title === hazard.title)) return prev;
      return [newWo, ...prev];
    });

    // Toast feedback
    setToast({
      message: `AI DETECTED: New ${hazard.title} added to GIS grid. Active work order generated.`,
      type: 'warning',
    });

    // Auto-select and switch tab to Map to highlight routing immediately
    setSelectedMarker(newMarker);
    setSimLocation(hazard.locationId);
    setActiveTab('map');
  };

  const tabs = [
    { id: 'map', label: 'GIS Command Map', icon: Map },
    { id: 'roles', label: 'Role Analytics', icon: Users },
    { id: 'cv', label: 'Computer Vision', icon: Cpu },
    { id: 'dispatch', label: 'Dispatch Desk', icon: Wrench },
    { id: 'pipeline', label: '10-Step Pipeline', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Header */}
      <Header
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        systemAlert={systemAlert}
        alertMessage={alertMessage}
      />

      {/* Global Toast Alert Notifications */}
      {toast && (
        <div className="fixed top-20 right-4 z-[100] max-w-sm w-full animate-bounce shadow-2xl">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'danger'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900/90 border-slate-700/50 text-slate-200'
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-xs font-mono">
              <span className="font-bold uppercase tracking-wider block mb-0.5">
                {toast.type === 'danger'
                  ? 'CRITICAL ALERT'
                  : toast.type === 'warning'
                  ? 'CV DETECTOR DETECT'
                  : toast.type === 'success'
                  ? 'WORK COMPLETED'
                  : 'SYSTEM UPDATE'}
              </span>
              <p className="leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Dual-Pane Section */}
      <main className="max-w-[1600px] mx-auto w-full px-4 py-6 flex-grow flex flex-col lg:flex-row gap-6">
        {/* Left Simulator Panel */}
        <SidebarSimulator
          simLocation={simLocation}
          setSimLocation={setSimLocation}
          simDisaster={simDisaster}
          setSimDisaster={setSimDisaster}
          simIntensity={simIntensity}
          setSimIntensity={setSimIntensity}
          triggerDisaster={triggerDisaster}
          resetSimulation={resetSimulation}
          systemAlert={systemAlert}
          activeDisasterInfo={activeDisasterInfo}
        />

        {/* Right Content Tab Section */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Tabs bar */}
          <div className="flex items-center gap-1.5 bg-slate-900/50 border border-slate-850 p-1.5 rounded-xl self-start overflow-x-auto max-w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-4 rounded-lg font-bold text-xs tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel viewport */}
          <div className="flex-1">
            {activeTab === 'map' && (
              <TabGisMap
                locationId={simLocation}
                markers={markers}
                shelters={shelters}
                selectedMarker={selectedMarker}
                setSelectedMarker={setSelectedMarker}
                activeEvacuationRoute={activeEvacuationRoute}
                setActiveEvacuationRoute={setActiveEvacuationRoute}
                updatePipelineStep={setActivePipelineStep}
              />
            )}

            {activeTab === 'roles' && (
              <TabRoleViews
                activeRole={activeRole}
                markers={markers}
                shelters={shelters}
                setShelters={setShelters}
                responders={responders}
                workOrders={workOrders}
                locationId={simLocation}
                authorizeRelocation={authorizeRelocation}
                updatePipelineStep={setActivePipelineStep}
              />
            )}

            {activeTab === 'cv' && (
              <TabComputerVision
                onHazardDetected={onHazardDetected}
                updatePipelineStep={setActivePipelineStep}
              />
            )}

            {activeTab === 'dispatch' && (
              <TabDispatchDesk
                workOrders={workOrders}
                responders={responders}
                deployTeam={deployTeam}
                locationId={simLocation}
                updatePipelineStep={setActivePipelineStep}
              />
            )}

            {activeTab === 'pipeline' && <TabPipeline activeStep={activePipelineStep} />}
          </div>
        </div>
      </main>

      {/* References Footer */}
      <References />
    </div>
  );
};

export default App;
