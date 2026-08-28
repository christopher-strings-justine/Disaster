import { useState, useEffect, useCallback, useRef } from 'react';
import { runPredictionEngine, checkDataSourceHealth } from '../services/predictionEngine';
import { Prediction, DataSourceStatus, ForecastWindow } from '../types/prediction';

interface UsePredictionEngineReturn {
  predictions: Prediction[];
  dataHealth: DataSourceStatus[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  setForecastWindow: (window: ForecastWindow) => void;
  forecastWindow: ForecastWindow;
  enabledHazards: Set<string>;
  toggleHazard: (hazard: string) => void;
  minRiskThreshold: number;
  setMinRiskThreshold: (threshold: number) => void;
  isEngineEnabled: boolean;
  setIsEngineEnabled: (enabled: boolean) => void;
}

export function usePredictionEngine(): UsePredictionEngineReturn {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [dataHealth, setDataHealth] = useState<DataSourceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Controls state
  const [isEngineEnabled, setIsEngineEnabled] = useState(false);
  const [forecastWindow, setForecastWindow] = useState<ForecastWindow>('now');
  const [enabledHazards, setEnabledHazards] = useState<Set<string>>(
    new Set(['flood', 'storm', 'wildfire', 'seismic', 'landslide'])
  );
  const [minRiskThreshold, setMinRiskThreshold] = useState<number>(0);
  
  const timerRef = useRef<number | null>(null);

  const fetchPredictions = useCallback(async () => {
    if (!isEngineEnabled) return;
    
    setLoading(true);
    setError(null);
    try {
      const [preds, health] = await Promise.all([
        runPredictionEngine(forecastWindow),
        checkDataSourceHealth()
      ]);
      setPredictions(preds);
      setDataHealth(health);
    } catch (err) {
      console.error('[usePredictionEngine] Error fetching predictions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [isEngineEnabled, forecastWindow]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchPredictions();
    
    if (isEngineEnabled) {
      // Refresh every 15 minutes
      timerRef.current = window.setInterval(fetchPredictions, 15 * 60 * 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [fetchPredictions, isEngineEnabled]);

  const toggleHazard = (hazard: string) => {
    setEnabledHazards(prev => {
      const next = new Set(prev);
      if (next.has(hazard)) next.delete(hazard);
      else next.add(hazard);
      return next;
    });
  };

  return {
    predictions,
    dataHealth,
    loading,
    error,
    refresh: fetchPredictions,
    forecastWindow,
    setForecastWindow,
    enabledHazards,
    toggleHazard,
    minRiskThreshold,
    setMinRiskThreshold,
    isEngineEnabled,
    setIsEngineEnabled
  };
}
