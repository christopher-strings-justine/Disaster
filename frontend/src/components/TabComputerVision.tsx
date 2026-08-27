import React, { useState, useRef } from 'react';
import { Upload, Eye, RefreshCw, Cpu, Activity, AlertCircle, Sparkles } from 'lucide-react';
import { CV_PRESET_IMAGES } from '../mockData';
import { CvPresetImage, BoundingBox } from '../types';

import { HazardMarker, UserGpsData } from '../types';

interface TabComputerVisionProps {
  onHazardDetected: (marker: HazardMarker) => void;
  updatePipelineStep: (step: number) => void;
  userGps: UserGpsData | null;
}

export const TabComputerVision: React.FC<TabComputerVisionProps> = ({
  onHazardDetected,
  updatePipelineStep,
  userGps,
}) => {
  const [selectedImg, setSelectedImg] = useState<CvPresetImage | null>(null);
  const [customImgUrl, setCustomImgUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanComplete, setScanComplete] = useState<boolean>(false);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanning = (img: CvPresetImage | { id: string; name: string; url: string }) => {
    setIsScanning(true);
    setScanComplete(false);
    setScanLog([]);
    updatePipelineStep(1); // Set pipeline step to 1: DETECT

    const logs = [
      'Initializing ResNet-50 Convolutional Layers...',
      'Mapping RGB tensors to float matrices...',
      'Running sliding-window bounding box anchor regressions...',
      'Confidence score threshold reached. Filtering overlapping anchors...',
      'Feature extraction completed. Structural degradation located.',
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setScanLog((prev) => [...prev, `[AI-LOG] ${log}`]);
      }, (index + 1) * 350);
    });

    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);

      // Trigger global state hazard addition
      if (img.id === 'cv-img-1') {
        onHazardDetected({
          id: 'cv-' + Date.now(),
          name: 'Mundakkai Pothole Node',
          locationId: 'wayanad',
          status: 'danger',
          risk: 84,
          population: 150,
          lat: 11.5755,
          lng: 76.0535,
          details: 'Pothole detected via drone CV scan. Threat of road damage halting transport.',
          x: 48,
          y: 60,
        });
      } else if (img.id === 'cv-img-2') {
        onHazardDetected({
          id: 'cv-' + Date.now(),
          name: 'Sunil Fissure Creep Node',
          locationId: 'joshimath',
          status: 'danger',
          risk: 92,
          population: 320,
          lat: 30.555,
          lng: 79.56,
          details: 'Active ground tension fissure detected by aerial AI segmentation model.',
          x: 35,
          y: 48,
        });
      } else {
        // Custom uploaded image hazard (Ceiling / Hole / Real-world upload)
        onHazardDetected({
          id: 'cv-' + Date.now(),
          name: 'Ceiling Structural Damage / Hole Detected',
          locationId: 'joshimath',
          status: 'danger',
          risk: 85,
          population: 50,
          // Use user's exact GPS if they have it turned on, else default to a fallback location
          lat: userGps ? userGps.lat : 30.56,
          lng: userGps ? userGps.lng : 79.55,
          details: 'Severe localized structural damage (ceiling puncture) detected via user-uploaded imagery. Immediate structural inspection required.',
          x: 55,
          y: 50,
        });
      }

      // Update to step 2: ASSESS
      updatePipelineStep(2);
    }, 2000);
  };

  const handlePresetSelect = (preset: CvPresetImage) => {
    setSelectedImg(preset);
    setCustomImgUrl(null);
    startScanning(preset);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setCustomImgUrl(url);
        setSelectedImg(null);
        startScanning({
          id: 'custom-upload',
          name: file.name,
          url: url,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Helper variables for bounding box coordinates
  const activeBoxes: BoundingBox[] = selectedImg
    ? selectedImg.boundingBoxes
    : customImgUrl
    ? [
        {
          x: 25,
          y: 25,
          w: 50,
          h: 50,
          label: 'Fissure/Pothole Structure',
          confidence: 89.4,
        },
      ]
    : [];

  const displayUrl = selectedImg ? selectedImg.url : customImgUrl;
  const currentHazardName = selectedImg ? selectedImg.hazardType : 'Custom Structural Defect';
  const currentConfidence = selectedImg ? selectedImg.confidence : 89.4;
  const currentLocation = selectedImg ? selectedImg.locationTag : 'User Upload coordinate';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
      {/* Selector & Uploader (Left Pane) */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">
              AI COMPUTER VISION INPUT
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Feed drone scans, satellite clips, or field photos
            </p>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Demo Scenarios (Click to analyze)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {CV_PRESET_IMAGES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`group relative aspect-[4/3] rounded-lg overflow-hidden border text-left transition-all hover:scale-102 cursor-pointer ${
                  selectedImg?.id === preset.id
                    ? 'border-cyan-500 ring-1 ring-cyan-500'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-2.5">
                  <span className="text-[10px] font-bold text-slate-200 block truncate">
                    {preset.name}
                  </span>
                  <span className="text-[8px] font-mono text-cyan-400 mt-0.5 block truncate">
                    {preset.locationTag}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 py-2 text-slate-500 font-mono text-[9px] uppercase">
          <span className="h-px bg-slate-850 flex-1"></span>
          <span>Or</span>
          <span className="h-px bg-slate-850 flex-1"></span>
        </div>

        {/* Drag and Drop Uploader */}
        <div className="flex-1 flex flex-col">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <div
            onClick={triggerFileSelect}
            className="flex-1 min-h-[160px] border border-dashed border-slate-800 hover:border-cyan-500/60 rounded-xl flex flex-col items-center justify-center gap-3 p-6 bg-slate-900/10 cursor-pointer hover:bg-slate-900/30 transition-all text-center"
          >
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-full text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-350">Upload Custom Image</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Drag-and-drop files or click to browse
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Scan Canvas (Center Pane) */}
      <div className="xl:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 flex flex-col min-h-[400px]">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-xs font-extrabold tracking-wider text-slate-100 uppercase">
              AI MODEL DETECTION VIEWPORT
            </h3>
          </div>
          {isScanning && (
            <span className="text-[9px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-400 rounded border border-cyan-800/40 animate-pulse">
              ANALYZING PIXELS...
            </span>
          )}
        </div>

        {/* Image Scan Area */}
        <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
          {displayUrl ? (
            <div className="relative max-w-full max-h-[400px] overflow-hidden rounded border border-slate-900 shadow-2xl">
              <img
                src={displayUrl}
                alt="Scan Area"
                className={`w-full h-full object-contain max-h-[390px] transition-all ${
                  isScanning ? 'brightness-50 contrast-125 saturate-50' : ''
                }`}
              />

              {/* Laser Scan Line Overlay */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10 animate-scan"></div>
              )}

              {/* Bounding Boxes */}
              {!isScanning &&
                scanComplete &&
                activeBoxes.map((box, index) => (
                  <div
                    key={index}
                    className="absolute border-2 border-rose-500 animate-[glow-rose_2s_infinite_linear] rounded shadow-[0_0_5px_rgba(244,63,94,0.4)]"
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.w}%`,
                      height: `${box.h}%`,
                    }}
                  >
                    <div className="absolute -top-5 left-0 bg-rose-500 text-slate-950 text-[9px] font-extrabold font-mono px-1.5 py-0.5 rounded-t flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {box.label} • {box.confidence}%
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center font-mono py-12">
              <Eye className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-400">Viewport Offline</p>
              <p className="text-[10px] text-slate-650 mt-1">Select a preset scenario to boot the AI pipeline</p>
            </div>
          )}
        </div>

        {/* Telemetry Output console */}
        {displayUrl && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-850 pt-4">
            {/* Logs console */}
            <div className="bg-slate-950/80 border border-slate-900 rounded p-3 h-32 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1">
              <div className="text-cyan-400 font-bold border-b border-slate-900 pb-1 mb-1 flex items-center justify-between">
                <span>SYSTEM DIAGNOSTIC STREAM</span>
                <span className="text-[8px] animate-pulse">● FEED ONLINE</span>
              </div>
              {scanLog.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
              {isScanning && <div className="text-cyan-400 animate-pulse font-bold">[AI-RUN] Mapping matrices...</div>}
              {scanComplete && (
                <div className="text-emerald-400 font-bold">
                  [SUCCESS] Classifications resolved. Work order dispatched to Dispatch Desk.
                </div>
              )}
            </div>

            {/* AI Diagnostics details */}
            <div className="glass-panel-hover rounded border border-slate-900 p-3 font-mono text-xs text-slate-350 space-y-2 flex flex-col justify-center">
              <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px]">
                <span className="text-slate-500">Hazard Class:</span>
                <span className={`font-bold ${scanComplete && !isScanning ? 'text-rose-400' : 'text-slate-500'}`}>
                  {isScanning ? 'Processing...' : scanComplete ? currentHazardName : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px]">
                <span className="text-slate-500">Confidence Value:</span>
                <span className={`font-bold ${scanComplete && !isScanning ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {isScanning ? 'Resolving...' : scanComplete ? `${currentConfidence}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1 text-[10px]">
                <span className="text-slate-500">GIS Geotag:</span>
                <span className="text-slate-300 truncate max-w-[150px]">
                  {isScanning ? 'Locating...' : scanComplete ? currentLocation : 'None'}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Dispatch Order:</span>
                <span className={`font-bold ${scanComplete && !isScanning ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isScanning ? 'Allocating...' : scanComplete ? 'ORDER DISPATCHED' : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default TabComputerVision;
