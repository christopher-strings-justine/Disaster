/**
 * AegisRiskEngine — Pure deterministic risk calculation functions.
 *
 * RULES:
 * - Takes ONLY real Open-Meteo data values as input.
 * - NEVER fabricates or assumes values.
 * - Returns scores 0-100 with confidence + contributing factors.
 * - Groq receives these structured results for narrative explanation.
 * - All outputs must be labeled "AegisX estimate — not an official warning."
 */

export interface RiskScore {
  score: number;         // 0–100
  level: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'EXTREME';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];     // Human-readable contributing factors
}

export interface AegisRiskResult {
  composite: RiskScore;
  flood: RiskScore;
  storm: RiskScore;
  wind: RiskScore;
  heat: RiskScore;
  fire: RiskScore;
  landslide: RiskScore;
  lightning: RiskScore;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function scoreLevel(score: number): RiskScore['level'] {
  if (score >= 80) return 'EXTREME';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'ELEVATED';
  if (score >= 20) return 'MODERATE';
  return 'LOW';
}

function makeScore(
  rawScore: number,
  factors: string[],
  dataCount: number,
  totalExpected: number
): RiskScore {
  const completeness = dataCount / totalExpected;
  const confidence: RiskScore['confidence'] =
    completeness > 0.8 ? 'HIGH' : completeness > 0.5 ? 'MEDIUM' : 'LOW';

  const score = clamp(Math.round(rawScore));
  return { score, level: scoreLevel(score), confidence, factors };
}

// ─── Flood Risk ───────────────────────────────────────────────────────────────

export function calcFloodRisk(data: Record<string, number | null>): RiskScore {
  const precipitation = data['precipitation'] ?? null;
  const rain = data['rain'] ?? null;
  const showers = data['showers'] ?? null;
  const humidity = data['relative_humidity_2m'] ?? null;
  const precipProb = data['precipitation_probability'] ?? null;

  let score = 0;
  const factors: string[] = [];
  let dataCount = 0;
  const totalExpected = 5;

  // Precipitation contribution (0-55 pts)
  if (precipitation !== null) {
    dataCount++;
    if (precipitation > 50) { score += 55; factors.push(`Very heavy precipitation: ${precipitation.toFixed(1)} mm`); }
    else if (precipitation > 25) { score += 40; factors.push(`Heavy precipitation: ${precipitation.toFixed(1)} mm`); }
    else if (precipitation > 10) { score += 25; factors.push(`Moderate precipitation: ${precipitation.toFixed(1)} mm`); }
    else if (precipitation > 5) { score += 15; factors.push(`Light precipitation: ${precipitation.toFixed(1)} mm`); }
    else if (precipitation > 0) { score += 5; }
  }

  // Shower contribution
  if (showers !== null) {
    dataCount++;
    if (showers > 20) { score += 20; factors.push(`Intense showers: ${showers.toFixed(1)} mm`); }
    else if (showers > 5) { score += 10; factors.push(`Showers: ${showers.toFixed(1)} mm`); }
  }

  // Humidity contribution (0-15 pts)
  if (humidity !== null) {
    dataCount++;
    if (humidity > 90) { score += 15; factors.push(`Very high humidity: ${humidity.toFixed(0)}%`); }
    else if (humidity > 80) { score += 8; }
  }

  // Rain contribution
  if (rain !== null) {
    dataCount++;
    if (rain > 30) { score += 15; }
    else if (rain > 10) { score += 8; }
  }

  // Precip probability
  if (precipProb !== null) {
    dataCount++;
    if (precipProb > 80) { score += 10; factors.push(`High precip probability: ${precipProb.toFixed(0)}%`); }
    else if (precipProb > 60) { score += 5; }
  }

  return makeScore(score, factors, dataCount, totalExpected);
}

// ─── Storm Risk ───────────────────────────────────────────────────────────────

export function calcStormRisk(data: Record<string, number | null>): RiskScore {
  const cape = data['cape'] ?? null;
  const precipitation = data['precipitation'] ?? null;
  const gusts = data['wind_gusts_10m'] ?? null;
  const weatherCode = data['weather_code'] ?? null;
  const showers = data['showers'] ?? null;

  let score = 0;
  const factors: string[] = [];
  let dataCount = 0;
  const totalExpected = 5;

  // CAPE contribution (0-40 pts)
  if (cape !== null) {
    dataCount++;
    if (cape > 3000) { score += 40; factors.push(`Extreme CAPE: ${cape.toFixed(0)} J/kg`); }
    else if (cape > 2000) { score += 30; factors.push(`High CAPE: ${cape.toFixed(0)} J/kg`); }
    else if (cape > 1000) { score += 20; factors.push(`Moderate CAPE: ${cape.toFixed(0)} J/kg`); }
    else if (cape > 500) { score += 10; factors.push(`Low CAPE: ${cape.toFixed(0)} J/kg`); }
  }

  // Weather code (WMO codes 95-99 = thunderstorms)
  if (weatherCode !== null) {
    dataCount++;
    if (weatherCode >= 95) { score += 30; factors.push(`Thunderstorm weather code: ${weatherCode}`); }
    else if (weatherCode >= 80) { score += 15; factors.push(`Heavy shower code: ${weatherCode}`); }
    else if (weatherCode >= 60) { score += 8; }
  }

  // Precipitation
  if (precipitation !== null) {
    dataCount++;
    if (precipitation > 20) { score += 15; factors.push(`Heavy precipitation: ${precipitation.toFixed(1)} mm`); }
    else if (precipitation > 10) { score += 8; }
  }

  // Gusts
  if (gusts !== null) {
    dataCount++;
    if (gusts > 80) { score += 15; factors.push(`Dangerous gusts: ${gusts.toFixed(0)} km/h`); }
    else if (gusts > 60) { score += 10; factors.push(`Strong gusts: ${gusts.toFixed(0)} km/h`); }
    else if (gusts > 40) { score += 5; }
  }

  // Showers
  if (showers !== null) {
    dataCount++;
    if (showers > 15) { score += 10; factors.push(`Intense showers: ${showers.toFixed(1)} mm`); }
    else if (showers > 5) { score += 5; }
  }

  return makeScore(score, factors, dataCount, totalExpected);
}

// ─── Wind Risk ────────────────────────────────────────────────────────────────

export function calcWindRisk(data: Record<string, number | null>): RiskScore {
  const windSpeed = data['wind_speed_10m'] ?? null;
  const gusts = data['wind_gusts_10m'] ?? null;

  let score = 0;
  const factors: string[] = [];
  let dataCount = 0;
  const totalExpected = 2;

  if (windSpeed !== null) {
    dataCount++;
    if (windSpeed > 100) { score += 60; factors.push(`Extreme wind speed: ${windSpeed.toFixed(0)} km/h`); }
    else if (windSpeed > 75) { score += 45; factors.push(`Very strong winds: ${windSpeed.toFixed(0)} km/h`); }
    else if (windSpeed > 50) { score += 30; factors.push(`Strong winds: ${windSpeed.toFixed(0)} km/h`); }
    else if (windSpeed > 30) { score += 15; factors.push(`Moderate winds: ${windSpeed.toFixed(0)} km/h`); }
    else if (windSpeed > 15) { score += 5; }
  }

  if (gusts !== null) {
    dataCount++;
    if (gusts > 120) { score += 40; factors.push(`Extreme gusts: ${gusts.toFixed(0)} km/h`); }
    else if (gusts > 90) { score += 30; factors.push(`Severe gusts: ${gusts.toFixed(0)} km/h`); }
    else if (gusts > 60) { score += 20; factors.push(`Strong gusts: ${gusts.toFixed(0)} km/h`); }
    else if (gusts > 40) { score += 10; }
  }

  return makeScore(score, factors, dataCount, totalExpected);
}

// ─── Heat Risk ────────────────────────────────────────────────────────────────

export function calcHeatRisk(data: Record<string, number | null>): RiskScore {
  const temp = data['temperature_2m'] ?? null;
  const apparent = data['apparent_temperature'] ?? null;
  const humidity = data['relative_humidity_2m'] ?? null;

  let score = 0;
  const factors: string[] = [];
  let dataCount = 0;
  const totalExpected = 3;

  const useTemp = apparent ?? temp;

  if (useTemp !== null) {
    dataCount++;
    if (useTemp > 45) { score += 60; factors.push(`Extreme heat: ${useTemp.toFixed(1)}°C`); }
    else if (useTemp > 40) { score += 45; factors.push(`Dangerous heat: ${useTemp.toFixed(1)}°C`); }
    else if (useTemp > 35) { score += 30; factors.push(`Very hot: ${useTemp.toFixed(1)}°C`); }
    else if (useTemp > 30) { score += 15; factors.push(`Hot: ${useTemp.toFixed(1)}°C`); }
    else if (useTemp < 0) { score = 0; }
  }

  if (apparent !== null) dataCount++;

  if (humidity !== null) {
    dataCount++;
    if (humidity > 80 && (useTemp ?? 0) > 30) {
      score += 20;
      factors.push(`High humidity ${humidity.toFixed(0)}% amplifies heat stress`);
    } else if (humidity > 70 && (useTemp ?? 0) > 30) {
      score += 10;
    }
  }

  return makeScore(score, factors, dataCount, totalExpected);
}

// ─── Fire Risk ────────────────────────────────────────────────────────────────

export function calcFireRisk(data: Record<string, number | null>): RiskScore {
  const temp = data['temperature_2m'] ?? null;
  const humidity = data['relative_humidity_2m'] ?? null;
  const windSpeed = data['wind_speed_10m'] ?? null;
  const precipitation = data['precipitation'] ?? null;

  let score = 0;
  const factors: string[] = [];
  let dataCount = 0;
  const totalExpected = 4;

  // Temperature
  if (temp !== null) {
    dataCount++;
    if (temp > 40) { score += 30; factors.push(`High temperature: ${temp.toFixed(1)}°C`); }
    else if (temp > 35) { score += 20; factors.push(`Warm: ${temp.toFixed(1)}°C`); }
    else if (temp > 30) { score += 10; }
  }

  // Low humidity = dry = fire risk
  if (humidity !== null) {
    dataCount++;
    if (humidity < 20) { score += 40; factors.push(`Critically dry: humidity ${humidity.toFixed(0)}%`); }
    else if (humidity < 30) { score += 25; factors.push(`Very dry: humidity ${humidity.toFixed(0)}%`); }
    else if (humidity < 40) { score += 15; factors.push(`Dry conditions: ${humidity.toFixed(0)}%`); }
    else if (humidity > 70) { score -= 20; } // wet = less fire risk
  }

  // Wind spreads fire
  if (windSpeed !== null) {
    dataCount++;
    if (windSpeed > 50) { score += 20; factors.push(`Strong fire-spreading winds: ${windSpeed.toFixed(0)} km/h`); }
    else if (windSpeed > 30) { score += 10; factors.push(`Moderate winds: ${windSpeed.toFixed(0)} km/h`); }
    else if (windSpeed > 15) { score += 5; }
  }

  // Rain suppresses fire
  if (precipitation !== null) {
    dataCount++;
    if (precipitation > 10) { score -= 40; }
    else if (precipitation > 2) { score -= 20; }
    else if (precipitation > 0.5) { score -= 10; }
  }

  return makeScore(score, factors, dataCount, totalExpected);
}

// ─── Landslide Risk ───────────────────────────────────────────────────────────

export function calcLandslideRisk(data: Record<string, number | null>): RiskScore {
  const precipitation = data['precipitation'] ?? null;
  const rain = data['rain'] ?? null;
  const showers = data['showers'] ?? null;
  const humidity = data['relative_humidity_2m'] ?? null;

  let score = 0;
  const factors: string[] = [];
  let dataCount = 0;
  const totalExpected = 4;

  if (precipitation !== null) {
    dataCount++;
    if (precipitation > 40) { score += 55; factors.push(`Extreme rain: ${precipitation.toFixed(1)} mm — landslide conditions`); }
    else if (precipitation > 20) { score += 35; factors.push(`Heavy rain: ${precipitation.toFixed(1)} mm`); }
    else if (precipitation > 10) { score += 20; factors.push(`Moderate rain: ${precipitation.toFixed(1)} mm`); }
    else if (precipitation > 5) { score += 10; }
  }

  if (rain !== null) {
    dataCount++;
    if (rain > 30) { score += 20; factors.push(`Heavy rainfall: ${rain.toFixed(1)} mm`); }
    else if (rain > 10) { score += 10; }
  }

  if (showers !== null) {
    dataCount++;
    if (showers > 20) { score += 15; factors.push(`Intense showers: ${showers.toFixed(1)} mm`); }
    else if (showers > 5) { score += 7; }
  }

  if (humidity !== null) {
    dataCount++;
    if (humidity > 95) { score += 10; factors.push(`Saturated ground conditions: ${humidity.toFixed(0)}%`); }
    else if (humidity > 90) { score += 5; }
  }

  return makeScore(score, factors, dataCount, totalExpected);
}

// ─── Lightning Risk ───────────────────────────────────────────────────────────

export function calcLightningRisk(data: Record<string, number | null>): RiskScore {
  const cape = data['cape'] ?? null;
  const weatherCode = data['weather_code'] ?? null;
  const showers = data['showers'] ?? null;

  let score = 0;
  const factors: string[] = [];
  let dataCount = 0;
  const totalExpected = 3;

  if (cape !== null) {
    dataCount++;
    if (cape > 2500) { score += 50; factors.push(`Extreme convective energy: ${cape.toFixed(0)} J/kg`); }
    else if (cape > 1500) { score += 35; factors.push(`High CAPE: ${cape.toFixed(0)} J/kg`); }
    else if (cape > 800) { score += 20; factors.push(`Moderate CAPE: ${cape.toFixed(0)} J/kg`); }
    else if (cape > 300) { score += 10; }
  }

  if (weatherCode !== null) {
    dataCount++;
    if (weatherCode >= 95) { score += 40; factors.push(`Active thunderstorm (code ${weatherCode})`); }
    else if (weatherCode >= 80) { score += 20; factors.push(`Convective showers (code ${weatherCode})`); }
  }

  if (showers !== null) {
    dataCount++;
    if (showers > 15) { score += 10; factors.push(`Intense convective showers: ${showers.toFixed(1)} mm`); }
    else if (showers > 5) { score += 5; }
  }

  return makeScore(score, factors, dataCount, totalExpected);
}

// ─── Composite Aegis Risk ─────────────────────────────────────────────────────

export function calcAegisRisk(data: Record<string, number | null>): AegisRiskResult {
  const flood = calcFloodRisk(data);
  const storm = calcStormRisk(data);
  const wind = calcWindRisk(data);
  const heat = calcHeatRisk(data);
  const fire = calcFireRisk(data);
  const landslide = calcLandslideRisk(data);
  const lightning = calcLightningRisk(data);

  // Weighted composite
  const weightedScore =
    flood.score * 0.25 +
    storm.score * 0.25 +
    wind.score * 0.20 +
    heat.score * 0.10 +
    fire.score * 0.10 +
    landslide.score * 0.10;

  // Boost by max individual risk
  const maxIndividual = Math.max(flood.score, storm.score, wind.score, heat.score, fire.score, landslide.score);
  const finalScore = clamp(Math.round(weightedScore * 0.7 + maxIndividual * 0.3));

  // Composite factors: top contributors
  const allFactors = [
    ...flood.factors,
    ...storm.factors,
    ...wind.factors,
    ...heat.factors,
  ].slice(0, 4);

  const confidences = [flood.confidence, storm.confidence, wind.confidence, heat.confidence];
  const highCount = confidences.filter(c => c === 'HIGH').length;
  const compositeConfidence: RiskScore['confidence'] =
    highCount >= 3 ? 'HIGH' : highCount >= 1 ? 'MEDIUM' : 'LOW';

  return {
    composite: {
      score: finalScore,
      level: scoreLevel(finalScore),
      confidence: compositeConfidence,
      factors: allFactors,
    },
    flood,
    storm,
    wind,
    heat,
    fire,
    landslide,
    lightning,
  };
}

// ─── Layer-specific risk calculation ─────────────────────────────────────────

/**
 * Given a layer ID and raw data point, compute the display value.
 * For risk layers this returns a 0-100 score.
 * For data layers this returns the raw variable value.
 */
export function computeLayerValue(
  layerId: string,
  data: Record<string, number | null>,
  primaryVar: string
): number | null {
  switch (layerId) {
    case 'floodRisk': return calcFloodRisk(data).score;
    case 'cycloneRisk': {
      const wind = calcWindRisk(data);
      const flood = calcFloodRisk(data);
      return clamp(Math.round(wind.score * 0.6 + flood.score * 0.4));
    }
    case 'extremeRain': return calcFloodRisk(data).score;
    case 'extremeWind': return calcWindRisk(data).score;
    case 'heatRisk': return calcHeatRisk(data).score;
    case 'fireRisk': return calcFireRisk(data).score;
    case 'lightningRisk': return calcLightningRisk(data).score;
    case 'landslideRisk': return calcLandslideRisk(data).score;
    case 'aegisRisk': return calcAegisRisk(data).composite.score;
    case 'stormRisk': return calcStormRisk(data).score;
    case 'thunderstorm': return calcStormRisk(data).score;
    case 'convective': {
      const cape = data['cape'] ?? 0;
      const showers = data['showers'] ?? 0;
      const gusts = data['wind_gusts_10m'] ?? 0;
      return clamp(Math.round(
        (Math.min(cape / 40, 40)) +
        (Math.min(showers * 2, 30)) +
        (Math.min(gusts / 3, 30))
      ));
    }
    default:
      return data[primaryVar] ?? null;
  }
}

/** Format a risk score as a colored label string */
export function formatRiskLevel(level: RiskScore['level']): { label: string; color: string; bg: string } {
  switch (level) {
    case 'EXTREME':  return { label: 'EXTREME',  color: '#ff4040', bg: 'rgba(200,0,0,0.25)' };
    case 'HIGH':     return { label: 'HIGH',     color: '#ff8c00', bg: 'rgba(200,80,0,0.20)' };
    case 'ELEVATED': return { label: 'ELEVATED', color: '#ffd700', bg: 'rgba(180,140,0,0.20)' };
    case 'MODERATE': return { label: 'MODERATE', color: '#ffe600', bg: 'rgba(160,140,0,0.15)' };
    case 'LOW':      return { label: 'LOW',      color: '#00c850', bg: 'rgba(0,150,50,0.15)' };
  }
}
