import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, MapPin, RefreshCw, Cpu } from 'lucide-react';
import { useWeatherLayer } from './WeatherLayerContext';
import { fetchPointData } from './WeatherDataStore';
import { calcAegisRisk, AegisRiskResult, formatRiskLevel } from './AegisRiskEngine';
import Groq from 'groq-sdk';

interface PointWeather {
  temperature_2m: number | null;
  apparent_temperature: number | null;
  relative_humidity_2m: number | null;
  pressure_msl: number | null;
  wind_speed_10m: number | null;
  wind_direction_10m: number | null;
  wind_gusts_10m: number | null;
  precipitation: number | null;
  rain: number | null;
  precipitation_probability: number | null;
  cloud_cover: number | null;
  visibility: number | null;
  weather_code: number | null;
  cape: number | null;
  [key: string]: number | null;
}

const POINT_VARS = [
  'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
  'pressure_msl', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
  'precipitation', 'rain', 'precipitation_probability',
  'cloud_cover', 'visibility', 'weather_code', 'cape',
  'showers', 'snowfall',
];

const COMPASS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
function degToCompass(deg: number | null): string {
  if (deg === null) return '–';
  return COMPASS[Math.round(deg / 22.5) % 16];
}

function fmt(v: number | null, decimals = 1, fallback = '–'): string {
  if (v === null || v === undefined) return fallback;
  return v.toFixed(decimals);
}

function getWindLabel(speed: number | null): string {
  if (speed === null) return '–';
  if (speed >= 90) return 'Hurricane';
  if (speed >= 60) return 'Storm';
  if (speed >= 40) return 'Strong';
  if (speed >= 20) return 'Moderate';
  if (speed >= 10) return 'Light';
  return 'Calm';
}

function getVisibilityLabel(km: number | null): string {
  if (km === null) return '–';
  if (km >= 50) return 'Excellent';
  if (km >= 20) return 'Good';
  if (km >= 10) return 'Moderate';
  if (km >= 5) return 'Poor';
  return 'Very Poor';
}

function getHumidityLabel(h: number | null): string {
  if (h === null) return '–';
  if (h >= 80) return 'Very Humid';
  if (h >= 60) return 'Humid';
  if (h >= 40) return 'Comfortable';
  return 'Dry';
}

const groqClient = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

export const LocationInfoPanel: React.FC = () => {
  const { selectedLocation, setSelectedLocation, model, forecastHour } = useWeatherLayer();
  const [weather, setWeather] = useState<PointWeather | null>(null);
  const [risk, setRisk] = useState<AegisRiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groqNarrative, setGroqNarrative] = useState<string | null>(null);
  const [groqLoading, setGroqLoading] = useState(false);
  const [groqError, setGroqError] = useState<string | null>(null);
  const groqDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedLocation) return;
    setLoading(true);
    setError(null);
    setWeather(null);
    setRisk(null);
    setGroqNarrative(null);
    setGroqError(null);

    try {
      const data = await fetchPointData(
        selectedLocation.lat,
        selectedLocation.lng,
        model,
        forecastHour,
        POINT_VARS
      );
      setWeather(data as PointWeather);
      const riskResult = calcAegisRisk(data);
      setRisk(riskResult);

      // Debounce Groq call — only fetch explanation once per location
      if (groqDebounceRef.current) clearTimeout(groqDebounceRef.current);
      groqDebounceRef.current = setTimeout(() => {
        fetchGroqNarrative(data, riskResult);
      }, 1500);
    } catch (err: any) {
      setError('Weather data temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, model, forecastHour]);

  const fetchGroqNarrative = async (
    data: Record<string, number | null>,
    riskResult: AegisRiskResult
  ) => {
    setGroqLoading(true);
    setGroqError(null);
    try {
      const prompt = `You are AegisX, a weather intelligence assistant.

Given the following real Open-Meteo forecast data and AegisX risk scores, provide a concise 2-3 sentence situation summary. Focus on the most significant hazards. Do NOT invent any values. Do NOT use markdown. End with: "Monitor official warnings from local meteorological authorities."

Data:
Temperature: ${data['temperature_2m']}°C (feels like ${data['apparent_temperature']}°C)
Humidity: ${data['relative_humidity_2m']}%
Pressure: ${data['pressure_msl']} hPa
Wind: ${data['wind_speed_10m']} km/h from ${data['wind_direction_10m']}°
Gusts: ${data['wind_gusts_10m']} km/h
Precipitation: ${data['precipitation']} mm
Rain: ${data['rain']} mm
CAPE: ${data['cape'] ?? 'N/A'} J/kg
Weather code: ${data['weather_code']}

AegisX Risk Scores (0-100 estimate only):
Composite: ${riskResult.composite.score}/100 (${riskResult.composite.level})
Flood: ${riskResult.flood.score}/100
Storm: ${riskResult.storm.score}/100
Wind: ${riskResult.wind.score}/100
Heat: ${riskResult.heat.score}/100
Fire: ${riskResult.fire.score}/100`;

      const completion = await groqClient.chat.completions.create({
        model: 'llama3-8b-8192',
        temperature: 0.2,
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });
      setGroqNarrative(completion.choices[0]?.message?.content ?? null);
    } catch (err: any) {
      setGroqError('AI explanation temporarily unavailable.');
    } finally {
      setGroqLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLocation) fetchData();
  }, [selectedLocation, fetchData]);

  if (!selectedLocation) return null;

  const composite = risk?.composite;
  const compositeStyle = composite ? formatRiskLevel(composite.level) : null;

  return (
    <div className="
      absolute top-20 right-4 z-[1000] w-80
      pointer-events-none
    ">
      <div className="
        pointer-events-auto
        bg-slate-900/90 backdrop-blur-md border border-slate-700/50
        rounded-2xl shadow-xl shadow-black/50
        overflow-hidden
      ">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/40 bg-slate-800/40">
          <MapPin size={16} className="text-cyan-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-200">Selected Location</div>
            <div className="text-[10px] text-slate-500 font-mono">
              {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lng.toFixed(4)}° E
            </div>
          </div>
          <button
            onClick={fetchData}
            title="Refresh"
            className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setSelectedLocation(null)}
            title="Close"
            className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-500 hover:text-rose-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 p-4 text-cyan-400 text-sm">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            Fetching forecast data…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-4">
            <p className="text-rose-400 text-sm">{error}</p>
            <button onClick={fetchData} className="mt-2 text-xs text-cyan-400 hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Weather data */}
        {weather && !loading && !error && (
          <>
            {/* Main weather values */}
            <div className="p-4 space-y-1.5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { label: 'Temperature', value: `${fmt(weather.temperature_2m)}°C` },
                  { label: 'Feels Like', value: `${fmt(weather.apparent_temperature)}°C` },
                  { label: 'Humidity', value: `${fmt(weather.relative_humidity_2m, 0)}% — ${getHumidityLabel(weather.relative_humidity_2m)}` },
                  { label: 'Pressure', value: `${fmt(weather.pressure_msl, 0)} hPa` },
                  { label: 'Wind', value: `${fmt(weather.wind_speed_10m, 0)} km/h ${degToCompass(weather.wind_direction_10m)} — ${getWindLabel(weather.wind_speed_10m)}` },
                  { label: 'Gusts', value: `${fmt(weather.wind_gusts_10m, 0)} km/h` },
                  { label: 'Rain', value: `${fmt(weather.rain)} mm` },
                  { label: 'Precipitation', value: `${fmt(weather.precipitation)} mm` },
                  { label: 'Precip Prob', value: `${fmt(weather.precipitation_probability, 0)}%` },
                  { label: 'Cloud Cover', value: `${fmt(weather.cloud_cover, 0)}%` },
                  { label: 'Visibility', value: `${weather.visibility !== null ? (weather.visibility / 1000).toFixed(1) : '–'} km — ${getVisibilityLabel(weather.visibility !== null ? weather.visibility / 1000 : null)}` },
                  { label: 'CAPE', value: weather.cape !== null ? `${fmt(weather.cape, 0)} J/kg` : 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} className="min-w-0">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">{label}</div>
                    <div className="text-xs text-slate-200 font-medium truncate">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AegisX Risk */}
            {risk && (
              <div className="border-t border-slate-700/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">🚨 Aegis Risk</span>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-black"
                    style={{ color: compositeStyle?.color, background: compositeStyle?.bg }}
                  >
                    {risk.composite.score}/100 — {risk.composite.level}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Flood', score: risk.flood },
                    { label: 'Storm', score: risk.storm },
                    { label: 'Wind', score: risk.wind },
                    { label: 'Heat', score: risk.heat },
                    { label: 'Fire', score: risk.fire },
                    { label: 'Lightning', score: risk.lightning },
                  ].map(({ label, score }) => {
                    const style = formatRiskLevel(score.level);
                    return (
                      <div key={label} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-slate-400 font-semibold">{label}</span>
                        <span className="text-[10px] font-bold" style={{ color: style.color }}>
                          {score.score}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 text-[9px] text-amber-400/70 italic">
                  Model estimate — not an official warning
                </div>
              </div>
            )}

            {/* Groq AI Explanation */}
            <div className="border-t border-slate-700/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={12} className="text-purple-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Situation Brief</span>
                {groqLoading && (
                  <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin ml-auto" />
                )}
              </div>

              {groqLoading && !groqNarrative && (
                <div className="text-xs text-slate-500 italic">Generating assessment…</div>
              )}

              {groqError && !groqLoading && (
                <div className="text-xs text-slate-500 italic">{groqError}</div>
              )}

              {groqNarrative && (
                <p className="text-xs text-slate-300 leading-relaxed">{groqNarrative}</p>
              )}
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-700/30">
          <p className="text-[9px] text-slate-600">
            Forecast data: Open-Meteo / {model}. AegisX estimates only.
          </p>
        </div>
      </div>
    </div>
  );
};
