/**
 * WindParticleCanvas — Canvas-based animated wind particles
 *
 * Uses actual wind_speed_10m + wind_direction_10m from Open-Meteo.
 * Converts meteorological direction to U/V vectors correctly:
 *   u = -speed * sin(direction_rad)   (westerly component)
 *   v = -speed * cos(direction_rad)   (southerly component)
 *
 * Particles are animated using requestAnimationFrame.
 * Density, speed, and trail are configurable from context.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useWeatherLayer, ParticleDensity } from './WeatherLayerContext';
import { fetchGridData, GridData, MapBounds } from './WeatherDataStore';
import L from 'leaflet';

const PARTICLE_COUNTS: Record<ParticleDensity, number> = {
  low: 600,
  medium: 1500,
  high: 3000,
};

const SPEED_MULTIPLIERS: Record<ParticleDensity, number> = {
  low: 0.4,
  medium: 0.8,
  high: 1.5,
};

interface Particle {
  x: number;  // canvas px
  y: number;  // canvas px
  age: number;
  maxAge: number;
}

export const WindParticleCanvas: React.FC = () => {
  const map = useMap();
  const {
    model, forecastHour,
    showParticles,
    particleDensity, particleSpeed, particleTrail,
  } = useWeatherLayer();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<GridData | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  // ── U/V field sampling ───────────────────────────────────────────────────

  // Pre-built O(1) grid index: key = "row_col" → {u,v}
  const uvGridRef = useRef<{ u: number[][][]; v: number[][][]; rows: number; cols: number; bounds: any } | null>(null);

  // Rebuild UV grid whenever grid data changes
  const buildUVGrid = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const { bounds, rows, cols, points } = grid;
    const uArr: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    const vArr: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (const pt of points) {
      const col = Math.round(((pt.lng - bounds.west) / (bounds.east - bounds.west)) * (cols - 1));
      const row = Math.round(((pt.lat - bounds.south) / (bounds.north - bounds.south)) * (rows - 1));
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        const speed = pt.data['wind_speed_10m'] ?? 0;
        const dir = pt.data['wind_direction_10m'] ?? 0;
        const rad = (dir * Math.PI) / 180;
        uArr[row][col] = -speed * Math.sin(rad);
        vArr[row][col] = -speed * Math.cos(rad);
      }
    }
    uvGridRef.current = { u: [uArr], v: [vArr], rows, cols, bounds };
  }, []);

  function getWindUV(lat: number, lng: number): { u: number; v: number } | null {
    const uvGrid = uvGridRef.current;
    if (!uvGrid) return null;
    const { bounds, rows, cols } = uvGrid;
    const tx = (lng - bounds.west) / (bounds.east - bounds.west);
    const ty = (lat - bounds.south) / (bounds.north - bounds.south);
    if (tx < 0 || tx > 1 || ty < 0 || ty > 1) return null;

    const col = tx * (cols - 1);
    const row = ty * (rows - 1);
    const c0 = Math.floor(col); const c1 = Math.min(c0 + 1, cols - 1);
    const r0 = Math.floor(row); const r1 = Math.min(r0 + 1, rows - 1);
    const fc = col - c0; const fr = row - r0;
    const uG = uvGrid.u[0]; const vG = uvGrid.v[0];
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const u = lerp(lerp(uG[r0][c0], uG[r1][c0], fr), lerp(uG[r0][c1], uG[r1][c1], fr), fc);
    const v = lerp(lerp(vG[r0][c0], vG[r1][c0], fr), lerp(vG[r0][c1], vG[r1][c1], fr), fc);
    return { u, v };
  }

  // Fast path for canvas pixels (avoids map.containerPointToLatLng inside render loop)
  function getWindUVPixel(x: number, y: number, width: number, height: number): { u: number; v: number } | null {
    const uvGrid = uvGridRef.current;
    if (!uvGrid) return null;
    const { rows, cols } = uvGrid;
    
    const tx = x / width;
    // Canvas y=0 is North, y=height is South. UV grid row=0 is South, row=1 is North.
    const ty = 1.0 - (y / height);

    if (tx < 0 || tx > 1 || ty < 0 || ty > 1) return null;

    const col = tx * (cols - 1);
    const row = ty * (rows - 1);
    
    const c0 = Math.floor(col); const c1 = Math.min(c0 + 1, cols - 1);
    const r0 = Math.floor(row); const r1 = Math.min(r0 + 1, rows - 1);
    const fc = col - c0; const fr = row - r0;
    
    const uG = uvGrid.u[0]; const vG = uvGrid.v[0];
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    
    const u = lerp(lerp(uG[r0][c0], uG[r1][c0], fr), lerp(uG[r0][c1], uG[r1][c1], fr), fc);
    const v = lerp(lerp(vG[r0][c0], vG[r1][c0], fr), lerp(vG[r0][c1], vG[r1][c1], fr), fc);
    return { u, v };
  }

  // ── Particle initialization ───────────────────────────────────────────────

  function resetParticle(canvas: HTMLCanvasElement): Particle {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      age: Math.floor(Math.random() * 100),
      maxAge: 80 + Math.random() * 120,
    };
  }

  function initParticles(canvas: HTMLCanvasElement, count: number) {
    particlesRef.current = Array.from({ length: count }, () => resetParticle(canvas));
  }

  // ── Animation loop ────────────────────────────────────────────────────────

  const animate = useCallback(() => {
    if (!runningRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const speedMult = SPEED_MULTIPLIERS[particleSpeed];
    const trail = particleTrail; // 0-1

    // Fade effect using trail setting (using destination-in to preserve map transparency)
    const fadeAlpha = 0.8 + trail * 0.15; // 0.8 to 0.95 alpha multiplier
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.age++;

      if (p.age > p.maxAge) {
        particles[i] = resetParticle(canvas);
        continue;
      }

      // Get wind data directly using pixel coordinates
      const wind = getWindUVPixel(p.x, p.y, canvas.width, canvas.height);
      if (!wind) {
        particles[i] = resetParticle(canvas);
        continue;
      }

      // Move particle in pixel space
      const scale = speedMult * 0.15; // tuned for visual appeal

      const dx = wind.u * scale;
      const dy = -wind.v * scale; // canvas y is inverted

      const speed = Math.sqrt(wind.u ** 2 + wind.v ** 2);
      const alpha = Math.min(1, (p.maxAge - p.age) / 30) * Math.min(1, p.age / 20);

      // Color: calm = blue, strong = cyan, extreme = white
      const r = Math.min(255, Math.floor(speed * 2));
      const g = Math.min(255, Math.floor(180 + speed));
      const b = 255;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      p.x += dx;
      p.y += dy;
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.8})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Wrap particles at map edges
      if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
        particles[i] = resetParticle(canvas);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, particleSpeed, particleTrail]);

  // ── Fetch grid data ───────────────────────────────────────────────────────

  const fetchWindData = useCallback(async () => {
    const bounds = map.getBounds();
    const mapBounds: MapBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };
    try {
      const grid = await fetchGridData({
        bounds: mapBounds,
        zoom: map.getZoom(),
        model,
        forecastHour,
        layerIds: ['wind', 'particles'],
        extraVars: ['wind_speed_10m', 'wind_direction_10m'],
      });
      gridRef.current = grid;
      buildUVGrid();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[WindParticles] Fetch error:', err.message);
      }
    }
  }, [map, model, forecastHour]);

  // ── Mount / unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.cssText = `
      position:absolute;top:0;left:0;
      width:${container.clientWidth}px;
      height:${container.clientHeight}px;
      pointer-events:none;
      z-index:350;
    `;
    canvasRef.current = canvas;

    const paneName = 'aegis-particles';
    let pane = (map as any).getPane(paneName) as HTMLElement | undefined;
    if (!pane) pane = map.createPane(paneName);
    pane.style.zIndex = '350';
    pane.innerHTML = '';
    pane.appendChild(canvas);

    const onResize = () => {
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    const onMove = () => {
      if (canvasRef.current) {
        L.DomUtil.setPosition(canvasRef.current, map.containerPointToLayerPoint(L.point(0, 0)));
      }
    };
    map.on('resize', onResize);
    map.on('move', onMove);
    map.on('moveend', fetchWindData);
    map.on('zoomend', fetchWindData);
    
    onMove(); // Initial position fix

    return () => {
      runningRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.off('resize', onResize);
      map.off('move', onMove);
      map.off('moveend', fetchWindData);
      map.off('zoomend', fetchWindData);
      pane.remove();
      delete (map as any)._panes['aegis-particles'];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle visibility
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (showParticles) {
      runningRef.current = true;
      const count = PARTICLE_COUNTS[particleDensity];
      initParticles(canvas, count);
      fetchWindData().then(() => {
        animFrameRef.current = requestAnimationFrame(animate);
      });
    } else {
      runningRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [showParticles, particleDensity, animate, fetchWindData]);

  // Re-fetch when model/hour changes
  useEffect(() => {
    if (showParticles) {
      fetchWindData();
    }
  }, [model, forecastHour, fetchWindData, showParticles]);

  return null;
};
