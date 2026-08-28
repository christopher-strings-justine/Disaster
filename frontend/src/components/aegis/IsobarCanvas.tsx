/**
 * IsobarCanvas — Canvas-based pressure contour lines
 *
 * Uses a simplified marching-squares style approach to draw
 * isobars from the grid pressure data.
 * Wired to context showIsobars toggle.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useWeatherLayer } from './WeatherLayerContext';
import { fetchGridData, GridData, MapBounds } from './WeatherDataStore';
import L from 'leaflet';

const ISOBAR_LEVELS = [960, 965, 970, 975, 980, 985, 990, 995, 1000, 1005, 1010, 1015, 1020, 1025, 1030, 1035, 1040];
const MAJOR_LEVELS = new Set([980, 1000, 1020, 1040]);

export const IsobarCanvas: React.FC = () => {
  const map = useMap();
  const { model, forecastHour, showIsobars } = useWeatherLayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<GridData | null>(null);

  const drawIsobars = useCallback(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showIsobars) return;

    const { bounds, rows, cols, points } = grid;

    // Build 2D pressure grid
    const pressureGrid: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (const pt of points) {
      const col = Math.round(((pt.lng - bounds.west) / (bounds.east - bounds.west)) * (cols - 1));
      const row = Math.round(((pt.lat - bounds.south) / (bounds.north - bounds.south)) * (rows - 1));
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        pressureGrid[row][col] = pt.data['pressure_msl'] ?? null;
      }
    }

    // For each isobar level, trace the contour
    for (const level of ISOBAR_LEVELS) {
      const isMajor = MAJOR_LEVELS.has(level);
      ctx.strokeStyle = isMajor
        ? 'rgba(100, 200, 240, 0.7)'
        : 'rgba(100, 160, 200, 0.35)';
      ctx.lineWidth = isMajor ? 1.5 : 0.8;
      ctx.setLineDash(isMajor ? [] : [4, 4]);

      // Simple marching segments between grid cells
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const v00 = pressureGrid[r][c];
          const v01 = pressureGrid[r + 1][c];
          const v10 = pressureGrid[r][c + 1];
          const v11 = pressureGrid[r + 1][c + 1];

          if (v00 === null || v01 === null || v10 === null || v11 === null) continue;

          // Check which edges cross the isobar level
          const gridToCanvas = (row: number, col: number): L.Point => {
            const lat = bounds.south + (row / (rows - 1)) * (bounds.north - bounds.south);
            const lng = bounds.west + (col / (cols - 1)) * (bounds.east - bounds.west);
            return map.latLngToContainerPoint(L.latLng(lat, lng));
          };

          function interp(a: number, b: number, va: number, vb: number): number {
            if (vb === va) return 0;
            return (level - va) / (vb - va);
          }

          const crossings: L.Point[] = [];

          // Bottom edge (r, c) → (r, c+1)
          if ((v00 < level) !== (v10 < level)) {
            const t = interp(c, c + 1, v00, v10);
            const pt = gridToCanvas(r, c + t);
            crossings.push(pt);
          }
          // Top edge (r+1, c) → (r+1, c+1)
          if ((v01 < level) !== (v11 < level)) {
            const t = interp(c, c + 1, v01, v11);
            const pt = gridToCanvas(r + 1, c + t);
            crossings.push(pt);
          }
          // Left edge (r, c) → (r+1, c)
          if ((v00 < level) !== (v01 < level)) {
            const t = interp(r, r + 1, v00, v01);
            const pt = gridToCanvas(r + t, c);
            crossings.push(pt);
          }
          // Right edge (r, c+1) → (r+1, c+1)
          if ((v10 < level) !== (v11 < level)) {
            const t = interp(r, r + 1, v10, v11);
            const pt = gridToCanvas(r + t, c + 1);
            crossings.push(pt);
          }

          if (crossings.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(crossings[0].x, crossings[0].y);
            ctx.lineTo(crossings[1].x, crossings[1].y);
            ctx.stroke();

            // Label major isobars at grid intersections
            if (isMajor && Math.random() < 0.1) {
              const mx = (crossings[0].x + crossings[1].x) / 2;
              const my = (crossings[0].y + crossings[1].y) / 2;
              ctx.save();
              ctx.font = '10px Inter, sans-serif';
              ctx.fillStyle = 'rgba(160, 220, 255, 0.9)';
              ctx.fillText(String(level), mx + 2, my - 2);
              ctx.restore();
            }
          }
        }
      }
    }

    ctx.setLineDash([]);
  }, [map, showIsobars]);

  const fetchAndDraw = useCallback(async () => {
    const bounds = map.getBounds();
    const mapBounds: MapBounds = {
      north: bounds.getNorth(), south: bounds.getSouth(),
      east: bounds.getEast(), west: bounds.getWest(),
    };

    try {
      const grid = await fetchGridData({
        bounds: mapBounds, zoom: map.getZoom(), model, forecastHour,
        layerIds: ['pressure'],
        extraVars: ['pressure_msl'],
      });
      gridRef.current = grid;
      requestAnimationFrame(drawIsobars);
    } catch (err: any) {
      if (err.name !== 'AbortError') console.warn('[Isobars]', err.message);
    }
  }, [map, model, forecastHour, drawIsobars]);

  useEffect(() => {
    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.cssText = `
      position:absolute;top:0;left:0;
      width:${container.clientWidth}px;height:${container.clientHeight}px;
      pointer-events:none;z-index:360;
    `;
    canvasRef.current = canvas;

    const paneName = 'aegis-isobars';
    let pane = (map as any).getPane(paneName) as HTMLElement | undefined;
    if (!pane) pane = map.createPane(paneName);
    pane.style.zIndex = '360';
    pane.innerHTML = '';
    pane.appendChild(canvas);

    const onMove = () => { requestAnimationFrame(drawIsobars); };
    map.on('move', onMove);
    map.on('moveend', fetchAndDraw);
    map.on('zoomend', fetchAndDraw);

    fetchAndDraw();

    return () => {
      map.off('move', onMove);
      map.off('moveend', fetchAndDraw);
      map.off('zoomend', fetchAndDraw);
      pane.remove();
      delete (map as any)._panes['aegis-isobars'];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showIsobars) fetchAndDraw();
    else {
      const canvas = canvasRef.current;
      canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [showIsobars, model, forecastHour, fetchAndDraw]);

  return null;
};
