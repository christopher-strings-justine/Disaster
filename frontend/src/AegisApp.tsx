import React, { useState } from 'react';
import { AegisMap } from './components/aegis/AegisMap';
import { AegisTopBar } from './components/aegis/AegisTopBar';
import { AegisSidebar } from './components/aegis/AegisSidebar';
import { AegisTimeline } from './components/aegis/AegisTimeline';
import { AegisControls } from './components/aegis/AegisControls';
import { WeatherLayerProvider } from './components/aegis/WeatherLayerContext';

export default function App() {
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  return (
    <WeatherLayerProvider>
      <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 relative font-['Inter',sans-serif]">
        {/* Full-screen Map */}
        <AegisMap flyTarget={flyTarget} />

        {/* UI Overlays */}
        <AegisTopBar onSearch={(coords) => setFlyTarget(coords)} />
        <AegisSidebar />
        <AegisTimeline />
        <AegisControls />
      </div>
    </WeatherLayerProvider>
  );
}
