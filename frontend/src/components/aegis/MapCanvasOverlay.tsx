/**
 * MapCanvasOverlay — Leaflet canvas-based heatmap renderer
 *
 * Uses bilinear interpolation across the grid of Open-Meteo points
 * to produce smooth heatmap visualizations for any data layer.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useWeatherLayer } from './WeatherLayerContext';
import { LAYER_CONFIGS, sampleColorScale, normalizeValue, LayerId } from './layerConfig';
import { fetchGridData, GridData, MapBounds, WeatherPoint } from './WeatherDataStore';
import { computeLayerValue } from './AegisRiskEngine';

interface Props {
  layerId: LayerId;
  opacity?: number;
}

// ─── Bilinear interpolation helper ───────────────────────────────────────────

function bilinearInterp(
  q11: number, q12: number, q21: number, q22: number,
  tx: number, ty: number
): number {
  const r1 = q11 * (1 - tx) + q21 * tx;
  const r2 = q12 * (1 - tx) + q22 * tx;
  return r1 * (1 - ty) + r2 * ty;
}

/**
 * Given a normalized canvas pixel position (px, py) in [0,1]
 * and the grid of weather values, return interpolated value.
 */
function sampleGrid(
  values: (number | null)[][],  // [row][col]
  rows: number,
  cols: number,
  tx: number,  // normalized x in [0,1] across cols
  ty: number   // normalized y in [0,1] across rows (0=south, 1=north)
): number | null {
  const col = tx * (cols - 1);
  const row = ty * (rows - 1);

  const c0 = Math.floor(col);
  const c1 = Math.min(c0 + 1, cols - 1);
  const r0 = Math.floor(row);
  const r1 = Math.min(r0 + 1, rows - 1);

  const fc = col - c0;
  const fr = row - r0;

  const v11 = values[r0]?.[c0] ?? null;
  const v12 = values[r1]?.[c0] ?? null;
  const v21 = values[r0]?.[c1] ?? null;
  const v22 = values[r1]?.[c1] ?? null;

  if (v11 === null && v12 === null && v21 === null && v22 === null) return null;

  // Replace nulls with nearest available
  const fill = (v11 ?? v12 ?? v21 ?? v22)!;
  return bilinearInterp(
    v11 ?? fill, v12 ?? fill,
    v21 ?? fill, v22 ?? fill,
    fc, fr
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const MapCanvasOverlay: React.FC<Props> = ({ layerId, opacity = 0.75 }) => {
  const map = useMap();
  const { model, forecastHour, setLayerLoading, setLayerError, layerOpacity } = useWeatherLayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<L.Layer | null>(null);
  const rafRef = useRef<number | null>(null);
  const gridRef = useRef<GridData | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const cfg = LAYER_CONFIGS[layerId];
  if (!cfg) return null;

  const effectiveOpacity = layerOpacity[layerId] ?? opacity;

  // ── Canvas draw ────────────────────────────────────────────────────────────

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid || grid.points.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const imageData = ctx.createImageData(width, height);
    const { rows, cols, bounds, points } = grid;

    // Build 2D value grid [row][col]
    const values: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (const pt of points) {
      // Find nearest grid position
      const col = Math.round(((pt.lng - bounds.west) / (bounds.east - bounds.west)) * (cols - 1));
      const row = Math.round(((pt.lat - bounds.south) / (bounds.north - bounds.south)) * (rows - 1));
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        values[row][col] = computeLayerValue(layerId, pt.data, cfg.primaryVar);
      }
    }

    const mapBounds = map.getBounds();
    const nw = map.latLngToContainerPoint(mapBounds.getNorthWest());
    const se = map.latLngToContainerPoint(mapBounds.getSouthEast());

    const { min, max } = cfg.legend;
    const colorScale = cfg.colorScale;

    // Scale canvas bounds to grid bounds
    const gridNorth = bounds.north;
    const gridSouth = bounds.south;
    const gridWest = bounds.west;
    const gridEast = bounds.east;

    // Get current container lat/lng bounds for fast linear interpolation
    const nwLatLng = map.containerPointToLatLng(L.point(0, 0));
    const seLatLng = map.containerPointToLatLng(L.point(width, height));
    
    const lngStart = nwLatLng.lng;
    const lngDiff = seLatLng.lng - nwLatLng.lng;
    const latStart = nwLatLng.lat;
    const latDiff = seLatLng.lat - nwLatLng.lat;

    for (let py = 0; py < height; py++) {
      // Interpolate latitude (outer loop)
      const lat = latStart + (py / height) * latDiff;
      const ty = (lat - gridSouth) / (gridNorth - gridSouth);
      
      // Skip row if entirely outside grid
      if (ty < 0 || ty > 1) continue;

      for (let px = 0; px < width; px++) {
        // Interpolate longitude (inner loop)
        const lng = lngStart + (px / width) * lngDiff;
        const tx = (lng - gridWest) / (gridEast - gridWest);

        // Skip pixels outside grid bounds
        if (tx < 0 || tx > 1) continue;

        const value = sampleGrid(values, rows, cols, tx, ty);
        if (value === null) continue;

        const normalized = normalizeValue(value, min, max);
        const [r, g, b, a] = sampleColorScale(colorScale, normalized);

        const idx = (py * width + px) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = Math.round(a * effectiveOpacity);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [layerId, cfg, map, effectiveOpacity]);

  // ── Fetch + Draw ───────────────────────────────────────────────────────────

  const fetchAndDraw = useCallback(async () => {
    const bounds = map.getBounds();
    const mapBounds: MapBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };

    setLayerLoading(layerId, true);
    setLayerError(layerId, null);
    setIsRendering(true);

    try {
      const grid = await fetchGridData({
        bounds: mapBounds,
        zoom: map.getZoom(),
        model,
        forecastHour,
        layerIds: [layerId],
      });
      gridRef.current = grid;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        drawCanvas();
        setIsRendering(false);
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(`[AegisX] Layer ${layerId} fetch error:`, err);
      setLayerError(layerId, err.message ?? 'Data unavailable');
    } finally {
      setLayerLoading(layerId, false);
    }
  }, [layerId, model, forecastHour, map, drawCanvas, setLayerLoading, setLayerError]);

  // ── Leaflet canvas integration ─────────────────────────────────────────────

  useEffect(() => {
    // Create canvas sized to the map container
    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.cssText = `
      position:absolute;top:0;left:0;
      width:${container.clientWidth}px;
      height:${container.clientHeight}px;
      pointer-events:none;
      z-index:300;
      transition:opacity 0.5s ease;
    `;
    canvasRef.current = canvas;

    // Add canvas as a Leaflet pane overlay (guard against StrictMode double-invoke)
    const paneName = `aegis-heatmap-${layerId}`;
    let pane = (map as any).getPane(paneName) as HTMLElement | undefined;
    if (!pane) {
      pane = map.createPane(paneName);
    }
    pane.style.zIndex = '300';
    // Clear any old canvas
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

    fetchAndDraw();
    // Initial position fix
    onMove();

    return () => {
      map.off('resize', onResize);
      map.off('move', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Clear canvas content rather than removing pane (pane may be reused)
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when model/hour/layer changes
  useEffect(() => {
    fetchAndDraw();
  }, [model, forecastHour, fetchAndDraw]);

  // Redraw on map move/zoom (no re-fetch, just re-project)
  useEffect(() => {
    const onMoveEnd = () => {
      if (gridRef.current) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(drawCanvas);
      }
      // Fetch new data for new viewport
      fetchAndDraw();
    };
    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
      map.off('zoomend', onMoveEnd);
    };
  }, [map, drawCanvas, fetchAndDraw]);

  // Update opacity without re-fetching
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.opacity = String(effectiveOpacity);
    }
  }, [effectiveOpacity]);

  return null;
};
