// ─── Centralized Layer Configuration Registry ─────────────────────────────────
// Every layer the UI can display is defined here. Rendering, data fetching,
// and UI all read from this single source of truth.

export type LayerId =
  // Atmosphere
  | 'temperature' | 'feelsLike' | 'humidity' | 'dewPoint'
  | 'pressure' | 'cloud' | 'cloudLow' | 'cloudMid' | 'cloudHigh' | 'visibility'
  // Wind
  | 'wind' | 'windDirection' | 'windGust' | 'particles'
  // Precipitation
  | 'rain' | 'rainIntensity' | 'precipProbability' | 'showers' | 'snow' | 'precipAccum'
  // Storms
  | 'thunderstorm' | 'cape' | 'convective' | 'lightning' | 'stormRisk'
  // Upper atmosphere
  | 'upper_1000' | 'upper_925' | 'upper_850' | 'upper_700' | 'upper_500' | 'upper_300'
  // Disaster Intelligence
  | 'floodRisk' | 'cycloneRisk' | 'extremeRain' | 'extremeWind'
  | 'heatRisk' | 'fireRisk' | 'lightningRisk' | 'landslideRisk' | 'aegisRisk';

export type LayerCategory =
  | 'ATMOSPHERE'
  | 'WIND'
  | 'PRECIPITATION'
  | 'STORMS'
  | 'UPPER_ATMOSPHERE'
  | 'DISASTER_INTELLIGENCE';

export type RenderMethod =
  | 'heatmap'      // canvas bilinear interpolation
  | 'particles'    // animated canvas particles
  | 'isobars'      // contour lines
  | 'markers'      // leaflet markers
  | 'composite';   // multiple render passes

// Color stop: [value, r, g, b, a]
export type ColorStop = [number, number, number, number, number];

export interface LayerLegendConfig {
  unit: string;
  stops: { value: number; label: string; color: string }[];
  min: number;
  max: number;
}

export interface LayerConfig {
  id: LayerId;
  name: string;
  shortName: string;
  icon: string;
  category: LayerCategory;
  description: string;
  unit: string;
  renderMethod: RenderMethod;
  // Open-Meteo hourly variable name(s)
  openMeteoVars: string[];
  // Which primary variable to use for coloring
  primaryVar: string;
  colorScale: ColorStop[];   // [value, r, g, b, a] normalized to [0,1] value
  legend: LayerLegendConfig;
  // Whether this layer can be an overlay (stacked on top of primary)
  isOverlay: boolean;
  // Models that support this layer (empty = all)
  supportedModels: string[];
  // If true, data is a risk score 0-100
  isRiskLayer: boolean;
}

// ─── Color Scales ─────────────────────────────────────────────────────────────
// Value is normalized 0-1 (mapped from min-max range)
// Format: [normalizedValue, r, g, b, alpha]

const TEMP_SCALE: ColorStop[] = [
  [0,    67,  84, 160, 200],   // -20°C  deep blue
  [0.17, 0,  128, 255, 210],   // -10°C  blue
  [0.33, 0,  200, 200, 220],   //   0°C  cyan
  [0.5,  80, 200,  80, 220],   //  15°C  green
  [0.60, 255, 230,  0, 230],   //  25°C  yellow
  [0.73, 255, 140,  0, 230],   //  35°C  orange
  [0.87, 220,  40,  0, 240],   //  45°C  red
  [1.0,  150,   0, 50, 255],   //  50°C  dark red
];

const WIND_SCALE: ColorStop[] = [
  [0,    20, 40, 160, 200],
  [0.2,  0, 128, 255, 210],
  [0.4,  0, 220, 180, 220],
  [0.6,  255, 230,  0, 230],
  [0.8,  255, 100,  0, 230],
  [1.0,  220,   0,  0, 240],
];

const RAIN_SCALE: ColorStop[] = [
  [0,    200, 230, 255, 0],
  [0.05, 100, 180, 255, 180],
  [0.15, 50,  100, 255, 200],
  [0.3,  0,   50,  255, 220],
  [0.5,  255, 220, 0,   230],
  [0.7,  255, 100, 0,   235],
  [1.0,  200, 0,   0,   250],
];

const CAPE_SCALE: ColorStop[] = [
  [0,    20,  40,  80,  0],
  [0.1,  0,   80,  180, 160],
  [0.3,  80,  180, 80,  200],
  [0.5,  255, 200, 0,   220],
  [0.75, 255, 100, 0,   235],
  [1.0,  200, 0,   20,  250],
];

const HUMIDITY_SCALE: ColorStop[] = [
  [0,   200, 180, 100, 150],
  [0.3,  80, 200, 160, 200],
  [0.6,  0,  150, 255, 220],
  [1.0,  0,   50, 180, 240],
];

const PRESSURE_SCALE: ColorStop[] = [
  [0,   80, 40, 140, 200],
  [0.25,0, 100, 200, 210],
  [0.5, 0, 200, 180, 220],
  [0.75,200,200, 0,  220],
  [1.0, 200, 60, 0,  230],
];

const CLOUD_SCALE: ColorStop[] = [
  [0,   10, 15, 30,  0],
  [0.3, 60, 70, 100, 120],
  [0.7, 130,140,160, 180],
  [1.0, 200,210,220, 220],
];

const VISIBILITY_SCALE: ColorStop[] = [
  [0,    200, 0,   0,   220],  // very poor
  [0.2,  220, 100, 0,   210],
  [0.4,  220, 200, 0,   200],
  [0.7,  80,  200, 80,  180],
  [1.0,  0,   180, 240, 150],  // excellent
];

const RISK_SCALE: ColorStop[] = [
  [0,    20,  200, 80,  180],  // low
  [0.25, 200, 200, 0,   210],  // moderate
  [0.5,  255, 140, 0,   220],  // elevated
  [0.75, 220, 60,  0,   235],  // high
  [1.0,  180, 0,   0,   250],  // extreme
];

const GUST_SCALE: ColorStop[] = [
  [0,    20,  40,  160, 200],
  [0.25, 0,   160, 255, 210],
  [0.5,  255, 220, 0,   220],
  [0.75, 255, 80,  0,   230],
  [1.0,  200, 0,   0,   250],
];

const PRECIP_PROB_SCALE: ColorStop[] = [
  [0,    200, 200, 200, 0],
  [0.2,  100, 180, 255, 160],
  [0.5,  0,   100, 255, 210],
  [0.75, 0,   50,  200, 230],
  [1.0,  0,   0,   150, 250],
];

// ─── Layer Definitions ────────────────────────────────────────────────────────
export const LAYER_CONFIGS: Record<LayerId, LayerConfig> = {

  // ── ATMOSPHERE ──────────────────────────────────────────────────────────────
  temperature: {
    id: 'temperature', name: 'Temperature', shortName: 'Temp', icon: '🌡',
    category: 'ATMOSPHERE', description: 'Air temperature at 2m above surface',
    unit: '°C', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['temperature_2m'],
    primaryVar: 'temperature_2m',
    supportedModels: [],
    colorScale: TEMP_SCALE,
    legend: {
      unit: '°C',
      min: -20, max: 50,
      stops: [
        { value: -20, label: '-20', color: '#4354a0' },
        { value: -10, label: '-10', color: '#0080ff' },
        { value: 0,   label: '0',   color: '#00c8c8' },
        { value: 10,  label: '10',  color: '#50c850' },
        { value: 20,  label: '20',  color: '#ffe600' },
        { value: 30,  label: '30',  color: '#ff8c00' },
        { value: 40,  label: '40',  color: '#dc2800' },
        { value: 50,  label: '50',  color: '#960032' },
      ],
    },
  },

  feelsLike: {
    id: 'feelsLike', name: 'Feels Like', shortName: 'Feels', icon: '🌡',
    category: 'ATMOSPHERE', description: 'Apparent temperature (wind chill / heat index)',
    unit: '°C', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['apparent_temperature'],
    primaryVar: 'apparent_temperature',
    supportedModels: [],
    colorScale: TEMP_SCALE,
    legend: { unit: '°C', min: -20, max: 50,
      stops: [
        { value: -20, label: '-20', color: '#4354a0' },
        { value: 0, label: '0', color: '#00c8c8' },
        { value: 15, label: '15', color: '#50c850' },
        { value: 30, label: '30', color: '#ff8c00' },
        { value: 50, label: '50', color: '#960032' },
      ],
    },
  },

  humidity: {
    id: 'humidity', name: 'Humidity', shortName: 'Humid', icon: '💧',
    category: 'ATMOSPHERE', description: 'Relative humidity at 2m',
    unit: '%', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['relative_humidity_2m'],
    primaryVar: 'relative_humidity_2m',
    supportedModels: [],
    colorScale: HUMIDITY_SCALE,
    legend: { unit: '%', min: 0, max: 100,
      stops: [
        { value: 0,   label: '0',   color: '#c8b464' },
        { value: 30,  label: '30',  color: '#50c8a0' },
        { value: 60,  label: '60',  color: '#0096ff' },
        { value: 80,  label: '80',  color: '#0050c8' },
        { value: 100, label: '100', color: '#003296' },
      ],
    },
  },

  dewPoint: {
    id: 'dewPoint', name: 'Dew Point', shortName: 'DewPt', icon: '💦',
    category: 'ATMOSPHERE', description: 'Dew point temperature',
    unit: '°C', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['dew_point_2m'],
    primaryVar: 'dew_point_2m',
    supportedModels: [],
    colorScale: HUMIDITY_SCALE,
    legend: { unit: '°C', min: -20, max: 30,
      stops: [
        { value: -20, label: '-20', color: '#c8b464' },
        { value: 0,   label: '0',   color: '#50c8a0' },
        { value: 15,  label: '15',  color: '#0096ff' },
        { value: 25,  label: '25',  color: '#0050c8' },
        { value: 30,  label: '30',  color: '#003296' },
      ],
    },
  },

  pressure: {
    id: 'pressure', name: 'Pressure', shortName: 'Pres', icon: '🧭',
    category: 'ATMOSPHERE', description: 'Mean sea-level pressure',
    unit: 'hPa', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['pressure_msl', 'surface_pressure'],
    primaryVar: 'pressure_msl',
    supportedModels: [],
    colorScale: PRESSURE_SCALE,
    legend: { unit: 'hPa', min: 960, max: 1040,
      stops: [
        { value: 960,  label: '960',  color: '#50288c' },
        { value: 980,  label: '980',  color: '#0064c8' },
        { value: 1000, label: '1000', color: '#00c8b4' },
        { value: 1020, label: '1020', color: '#c8c800' },
        { value: 1040, label: '1040', color: '#c83c00' },
      ],
    },
  },

  cloud: {
    id: 'cloud', name: 'Cloud Cover', shortName: 'Cloud', icon: '☁',
    category: 'ATMOSPHERE', description: 'Total cloud cover percentage',
    unit: '%', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high'],
    primaryVar: 'cloud_cover',
    supportedModels: [],
    colorScale: CLOUD_SCALE,
    legend: { unit: '%', min: 0, max: 100,
      stops: [
        { value: 0,   label: '0',   color: '#0a0f1e' },
        { value: 25,  label: '25',  color: '#3c4664' },
        { value: 50,  label: '50',  color: '#8286a0' },
        { value: 75,  label: '75',  color: '#c8cdd8' },
        { value: 100, label: '100', color: '#c8d2dc' },
      ],
    },
  },

  cloudLow: {
    id: 'cloudLow', name: 'Low Clouds', shortName: 'Lo Cld', icon: '🌫',
    category: 'ATMOSPHERE', description: 'Low-level cloud cover',
    unit: '%', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['cloud_cover_low'],
    primaryVar: 'cloud_cover_low',
    supportedModels: [],
    colorScale: CLOUD_SCALE,
    legend: { unit: '%', min: 0, max: 100, stops: [
      { value: 0, label: '0', color: '#0a0f1e' },
      { value: 50, label: '50', color: '#8286a0' },
      { value: 100, label: '100', color: '#c8d2dc' },
    ]},
  },

  cloudMid: {
    id: 'cloudMid', name: 'Mid Clouds', shortName: 'Mi Cld', icon: '☁',
    category: 'ATMOSPHERE', description: 'Mid-level cloud cover',
    unit: '%', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['cloud_cover_mid'],
    primaryVar: 'cloud_cover_mid',
    supportedModels: [],
    colorScale: CLOUD_SCALE,
    legend: { unit: '%', min: 0, max: 100, stops: [
      { value: 0, label: '0', color: '#0a0f1e' },
      { value: 50, label: '50', color: '#8286a0' },
      { value: 100, label: '100', color: '#c8d2dc' },
    ]},
  },

  cloudHigh: {
    id: 'cloudHigh', name: 'High Clouds', shortName: 'Hi Cld', icon: '☁',
    category: 'ATMOSPHERE', description: 'High-level (cirrus) cloud cover',
    unit: '%', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['cloud_cover_high'],
    primaryVar: 'cloud_cover_high',
    supportedModels: [],
    colorScale: CLOUD_SCALE,
    legend: { unit: '%', min: 0, max: 100, stops: [
      { value: 0, label: '0', color: '#0a0f1e' },
      { value: 50, label: '50', color: '#8286a0' },
      { value: 100, label: '100', color: '#c8d2dc' },
    ]},
  },

  visibility: {
    id: 'visibility', name: 'Visibility', shortName: 'Vis', icon: '👁',
    category: 'ATMOSPHERE', description: 'Horizontal visibility at surface',
    unit: 'km', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['visibility'],
    primaryVar: 'visibility',
    supportedModels: [],
    colorScale: VISIBILITY_SCALE,
    legend: { unit: 'km', min: 0, max: 100,
      stops: [
        { value: 0,   label: '<1',  color: '#c80000' },
        { value: 5,   label: '5',   color: '#dc6400' },
        { value: 20,  label: '20',  color: '#dcdc00' },
        { value: 50,  label: '50',  color: '#50c850' },
        { value: 100, label: '100', color: '#00b4f0' },
      ],
    },
  },

  // ── WIND ───────────────────────────────────────────────────────────────────
  wind: {
    id: 'wind', name: 'Wind Speed', shortName: 'Wind', icon: '💨',
    category: 'WIND', description: 'Wind speed at 10m height',
    unit: 'km/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['wind_speed_10m', 'wind_direction_10m'],
    primaryVar: 'wind_speed_10m',
    supportedModels: [],
    colorScale: WIND_SCALE,
    legend: { unit: 'km/h', min: 0, max: 120,
      stops: [
        { value: 0,   label: '0',   color: '#142890' },
        { value: 20,  label: '20',  color: '#0080ff' },
        { value: 40,  label: '40',  color: '#00dcb4' },
        { value: 60,  label: '60',  color: '#ffe600' },
        { value: 80,  label: '80',  color: '#ff6400' },
        { value: 120, label: '120+',color: '#dc0000' },
      ],
    },
  },

  windDirection: {
    id: 'windDirection', name: 'Wind Direction', shortName: 'Dir', icon: '🧭',
    category: 'WIND', description: 'Wind direction arrows',
    unit: '°', renderMethod: 'markers', isOverlay: true, isRiskLayer: false,
    openMeteoVars: ['wind_speed_10m', 'wind_direction_10m'],
    primaryVar: 'wind_direction_10m',
    supportedModels: [],
    colorScale: WIND_SCALE,
    legend: { unit: '°', min: 0, max: 360, stops: [] },
  },

  windGust: {
    id: 'windGust', name: 'Wind Gusts', shortName: 'Gusts', icon: '🌪',
    category: 'WIND', description: 'Maximum wind gusts at 10m',
    unit: 'km/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['wind_gusts_10m'],
    primaryVar: 'wind_gusts_10m',
    supportedModels: [],
    colorScale: GUST_SCALE,
    legend: { unit: 'km/h', min: 0, max: 150,
      stops: [
        { value: 0,   label: '0',    color: '#142890' },
        { value: 30,  label: '30',   color: '#0080ff' },
        { value: 60,  label: '60',   color: '#ffe600' },
        { value: 90,  label: '90',   color: '#ff6400' },
        { value: 120, label: '120',  color: '#dc0000' },
        { value: 150, label: '150+', color: '#960032' },
      ],
    },
  },

  particles: {
    id: 'particles', name: 'Wind Particles', shortName: 'Ptcl', icon: '✨',
    category: 'WIND', description: 'Animated wind flow particles',
    unit: '', renderMethod: 'particles', isOverlay: true, isRiskLayer: false,
    openMeteoVars: ['wind_speed_10m', 'wind_direction_10m'],
    primaryVar: 'wind_speed_10m',
    supportedModels: [],
    colorScale: WIND_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [] },
  },

  // ── PRECIPITATION ──────────────────────────────────────────────────────────
  rain: {
    id: 'rain', name: 'Rain', shortName: 'Rain', icon: '🌧',
    category: 'PRECIPITATION', description: 'Rainfall rate',
    unit: 'mm', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['rain', 'precipitation'],
    primaryVar: 'rain',
    supportedModels: [],
    colorScale: RAIN_SCALE,
    legend: { unit: 'mm', min: 0, max: 50,
      stops: [
        { value: 0,  label: '0',   color: 'transparent' },
        { value: 2,  label: '2',   color: '#64b4ff' },
        { value: 5,  label: '5',   color: '#0064ff' },
        { value: 10, label: '10',  color: '#0000ff' },
        { value: 25, label: '25',  color: '#ffe600' },
        { value: 50, label: '50+', color: '#c80000' },
      ],
    },
  },

  rainIntensity: {
    id: 'rainIntensity', name: 'Rain Intensity', shortName: 'Intensity', icon: '🌦',
    category: 'PRECIPITATION', description: 'Instantaneous rain rate (radar-like)',
    unit: 'mm/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['precipitation', 'rain', 'showers'],
    primaryVar: 'precipitation',
    supportedModels: [],
    colorScale: RAIN_SCALE,
    legend: { unit: 'mm/h', min: 0, max: 30,
      stops: [
        { value: 0,  label: '0',  color: 'transparent' },
        { value: 1,  label: '1',  color: '#64b4ff' },
        { value: 5,  label: '5',  color: '#0064ff' },
        { value: 15, label: '15', color: '#ffe600' },
        { value: 30, label: '30+',color: '#c80000' },
      ],
    },
  },

  precipProbability: {
    id: 'precipProbability', name: 'Precip Probability', shortName: 'POP', icon: '☔',
    category: 'PRECIPITATION', description: 'Probability of precipitation',
    unit: '%', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['precipitation_probability'],
    primaryVar: 'precipitation_probability',
    supportedModels: [],
    colorScale: PRECIP_PROB_SCALE,
    legend: { unit: '%', min: 0, max: 100,
      stops: [
        { value: 0,   label: '0',   color: '#c8c8c8' },
        { value: 20,  label: '20',  color: '#64b4ff' },
        { value: 50,  label: '50',  color: '#0064ff' },
        { value: 80,  label: '80',  color: '#0032c8' },
        { value: 100, label: '100', color: '#003296' },
      ],
    },
  },

  showers: {
    id: 'showers', name: 'Showers', shortName: 'Shwrs', icon: '🌦',
    category: 'PRECIPITATION', description: 'Convective shower precipitation',
    unit: 'mm', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['showers'],
    primaryVar: 'showers',
    supportedModels: [],
    colorScale: RAIN_SCALE,
    legend: { unit: 'mm', min: 0, max: 30, stops: [
      { value: 0, label: '0', color: 'transparent' },
      { value: 5, label: '5', color: '#0064ff' },
      { value: 15, label: '15', color: '#ffe600' },
      { value: 30, label: '30+', color: '#c80000' },
    ]},
  },

  snow: {
    id: 'snow', name: 'Snowfall', shortName: 'Snow', icon: '❄',
    category: 'PRECIPITATION', description: 'Snowfall accumulation',
    unit: 'cm', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['snowfall'],
    primaryVar: 'snowfall',
    supportedModels: [],
    colorScale: [
      [0,    0,   0,  50,  0],
      [0.2, 100, 150, 200, 160],
      [0.5, 200, 220, 240, 210],
      [1.0, 255, 255, 255, 240],
    ],
    legend: { unit: 'cm', min: 0, max: 50, stops: [
      { value: 0,  label: '0',   color: '#000032' },
      { value: 10, label: '10',  color: '#6496c8' },
      { value: 25, label: '25',  color: '#c8dcf0' },
      { value: 50, label: '50+', color: '#ffffff' },
    ]},
  },

  precipAccum: {
    id: 'precipAccum', name: 'Precip Accumulation', shortName: 'Accum', icon: '🌊',
    category: 'PRECIPITATION', description: 'Total precipitation accumulation',
    unit: 'mm', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['precipitation'],
    primaryVar: 'precipitation',
    supportedModels: [],
    colorScale: RAIN_SCALE,
    legend: { unit: 'mm', min: 0, max: 100, stops: [
      { value: 0,  label: '0',    color: 'transparent' },
      { value: 10, label: '10',   color: '#64b4ff' },
      { value: 25, label: '25',   color: '#0064ff' },
      { value: 50, label: '50',   color: '#ffe600' },
      { value: 100,label: '100+', color: '#c80000' },
    ]},
  },

  // ── STORMS ─────────────────────────────────────────────────────────────────
  thunderstorm: {
    id: 'thunderstorm', name: 'Thunderstorm', shortName: 'T-Storm', icon: '⛈',
    category: 'STORMS', description: 'Thunderstorm probability from weather code',
    unit: '%', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['weather_code', 'precipitation', 'cape', 'wind_gusts_10m'],
    primaryVar: 'weather_code',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,   label: 'LOW',      color: '#14c850' },
      { value: 33,  label: 'MODERATE', color: '#ffe600' },
      { value: 66,  label: 'HIGH',     color: '#ff6400' },
      { value: 100, label: 'EXTREME',  color: '#c80000' },
    ]},
  },

  cape: {
    id: 'cape', name: 'CAPE', shortName: 'CAPE', icon: '🔥',
    category: 'STORMS', description: 'Convective Available Potential Energy',
    unit: 'J/kg', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['cape'],
    primaryVar: 'cape',
    supportedModels: ['ECMWF', 'GFS'],
    colorScale: CAPE_SCALE,
    legend: { unit: 'J/kg', min: 0, max: 4000,
      stops: [
        { value: 0,    label: '0',    color: '#14285a' },
        { value: 500,  label: '500',  color: '#0050b4' },
        { value: 1000, label: '1000', color: '#50b450' },
        { value: 2000, label: '2000', color: '#ffc800' },
        { value: 3000, label: '3000', color: '#ff6400' },
        { value: 4000, label: '4000+',color: '#c80000' },
      ],
    },
  },

  convective: {
    id: 'convective', name: 'Convective Potential', shortName: 'Conv', icon: '⚡',
    category: 'STORMS', description: 'Composite convective risk score',
    unit: '', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['cape', 'showers', 'precipitation', 'wind_gusts_10m'],
    primaryVar: 'cape',
    supportedModels: ['ECMWF', 'GFS'],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,   label: 'LOW',      color: '#14c850' },
      { value: 33,  label: 'MODERATE', color: '#ffe600' },
      { value: 66,  label: 'HIGH',     color: '#ff6400' },
      { value: 100, label: 'EXTREME',  color: '#c80000' },
    ]},
  },

  lightning: {
    id: 'lightning', name: 'Lightning', shortName: 'Ltng', icon: '⚡',
    category: 'STORMS', description: 'Lightning density (ECMWF only)',
    unit: 'fl/km²/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['lightning_potential'],
    primaryVar: 'lightning_potential',
    supportedModels: ['ECMWF'],
    colorScale: CAPE_SCALE,
    legend: { unit: 'fl/km²/h', min: 0, max: 1, stops: [
      { value: 0,    label: 'None',   color: '#000000' },
      { value: 0.25, label: 'Low',    color: '#0050b4' },
      { value: 0.5,  label: 'Mod',    color: '#ffc800' },
      { value: 0.75, label: 'High',   color: '#ff6400' },
      { value: 1.0,  label: 'Extreme',color: '#c80000' },
    ]},
  },

  stormRisk: {
    id: 'stormRisk', name: 'Storm Risk', shortName: 'Storm', icon: '🌀',
    category: 'STORMS', description: 'AegisX composite storm risk estimate',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['cape', 'precipitation', 'wind_gusts_10m', 'weather_code', 'showers'],
    primaryVar: 'cape',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,   label: 'LOW',      color: '#14c850' },
      { value: 25,  label: 'MODERATE', color: '#ffe600' },
      { value: 50,  label: 'ELEVATED', color: '#ff8c00' },
      { value: 75,  label: 'HIGH',     color: '#ff6400' },
      { value: 100, label: 'EXTREME',  color: '#c80000' },
    ]},
  },

  // ── UPPER ATMOSPHERE ───────────────────────────────────────────────────────
  upper_1000: {
    id: 'upper_1000', name: '1000 hPa', shortName: '1000', icon: '📈',
    category: 'UPPER_ATMOSPHERE', description: 'Near-surface pressure level',
    unit: 'km/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['wind_speed_1000hPa', 'wind_direction_1000hPa', 'temperature_1000hPa', 'relative_humidity_1000hPa', 'geopotential_height_1000hPa'],
    primaryVar: 'wind_speed_1000hPa',
    supportedModels: ['ECMWF', 'GFS'],
    colorScale: WIND_SCALE,
    legend: { unit: 'km/h', min: 0, max: 100, stops: [
      { value: 0,   label: '0',    color: '#142890' },
      { value: 30,  label: '30',   color: '#0080ff' },
      { value: 60,  label: '60',   color: '#ffe600' },
      { value: 100, label: '100+', color: '#c80000' },
    ]},
  },

  upper_925: {
    id: 'upper_925', name: '925 hPa', shortName: '925', icon: '📈',
    category: 'UPPER_ATMOSPHERE', description: '~750m altitude level',
    unit: 'km/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['wind_speed_925hPa', 'wind_direction_925hPa', 'temperature_925hPa', 'relative_humidity_925hPa', 'geopotential_height_925hPa'],
    primaryVar: 'wind_speed_925hPa',
    supportedModels: ['ECMWF', 'GFS'],
    colorScale: WIND_SCALE,
    legend: { unit: 'km/h', min: 0, max: 100, stops: [] },
  },

  upper_850: {
    id: 'upper_850', name: '850 hPa', shortName: '850', icon: '📈',
    category: 'UPPER_ATMOSPHERE', description: '~1.5km altitude level',
    unit: 'km/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['wind_speed_850hPa', 'wind_direction_850hPa', 'temperature_850hPa', 'relative_humidity_850hPa', 'geopotential_height_850hPa'],
    primaryVar: 'wind_speed_850hPa',
    supportedModels: ['ECMWF', 'GFS', 'ICON'],
    colorScale: WIND_SCALE,
    legend: { unit: 'km/h', min: 0, max: 120, stops: [] },
  },

  upper_700: {
    id: 'upper_700', name: '700 hPa', shortName: '700', icon: '📈',
    category: 'UPPER_ATMOSPHERE', description: '~3km altitude level',
    unit: 'km/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['wind_speed_700hPa', 'wind_direction_700hPa', 'temperature_700hPa', 'relative_humidity_700hPa', 'geopotential_height_700hPa'],
    primaryVar: 'wind_speed_700hPa',
    supportedModels: ['ECMWF', 'GFS'],
    colorScale: WIND_SCALE,
    legend: { unit: 'km/h', min: 0, max: 150, stops: [] },
  },

  upper_500: {
    id: 'upper_500', name: '500 hPa', shortName: '500', icon: '📈',
    category: 'UPPER_ATMOSPHERE', description: '~5.5km altitude level',
    unit: 'km/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['wind_speed_500hPa', 'wind_direction_500hPa', 'temperature_500hPa', 'relative_humidity_500hPa', 'geopotential_height_500hPa'],
    primaryVar: 'wind_speed_500hPa',
    supportedModels: ['ECMWF', 'GFS', 'ICON'],
    colorScale: WIND_SCALE,
    legend: { unit: 'km/h', min: 0, max: 200, stops: [] },
  },

  upper_300: {
    id: 'upper_300', name: '300 hPa', shortName: '300', icon: '📈',
    category: 'UPPER_ATMOSPHERE', description: '~9km altitude (jet stream level)',
    unit: 'km/h', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: false,
    openMeteoVars: ['wind_speed_300hPa', 'wind_direction_300hPa', 'temperature_300hPa', 'geopotential_height_300hPa'],
    primaryVar: 'wind_speed_300hPa',
    supportedModels: ['ECMWF', 'GFS'],
    colorScale: WIND_SCALE,
    legend: { unit: 'km/h', min: 0, max: 300, stops: [] },
  },

  // ── DISASTER INTELLIGENCE ──────────────────────────────────────────────────
  floodRisk: {
    id: 'floodRisk', name: 'Flood Risk', shortName: 'Flood', icon: '🌊',
    category: 'DISASTER_INTELLIGENCE',
    description: 'AegisX flood risk estimate — not an official warning',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['precipitation', 'rain', 'showers', 'relative_humidity_2m'],
    primaryVar: 'precipitation',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,  label: 'LOW',      color: '#14c850' },
      { value: 25, label: 'MODERATE', color: '#ffe600' },
      { value: 50, label: 'ELEVATED', color: '#ff8c00' },
      { value: 75, label: 'HIGH',     color: '#ff6400' },
      { value: 100,label: 'EXTREME',  color: '#c80000' },
    ]},
  },

  cycloneRisk: {
    id: 'cycloneRisk', name: 'Cyclone Risk', shortName: 'Cyclone', icon: '🌀',
    category: 'DISASTER_INTELLIGENCE',
    description: 'AegisX cyclone/extreme wind risk estimate',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['wind_speed_10m', 'wind_gusts_10m', 'pressure_msl', 'precipitation'],
    primaryVar: 'wind_speed_10m',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,  label: 'LOW',      color: '#14c850' },
      { value: 25, label: 'MODERATE', color: '#ffe600' },
      { value: 75, label: 'HIGH',     color: '#c80000' },
    ]},
  },

  extremeRain: {
    id: 'extremeRain', name: 'Extreme Rain Risk', shortName: 'ExRain', icon: '⛈',
    category: 'DISASTER_INTELLIGENCE',
    description: 'AegisX extreme rainfall risk estimate',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['precipitation', 'rain', 'showers', 'precipitation_probability'],
    primaryVar: 'precipitation',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,  label: 'LOW',     color: '#14c850' },
      { value: 50, label: 'HIGH',    color: '#ff6400' },
      { value: 100,label: 'EXTREME', color: '#c80000' },
    ]},
  },

  extremeWind: {
    id: 'extremeWind', name: 'Extreme Wind Risk', shortName: 'ExWind', icon: '💨',
    category: 'DISASTER_INTELLIGENCE',
    description: 'AegisX extreme wind risk estimate',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['wind_speed_10m', 'wind_gusts_10m'],
    primaryVar: 'wind_gusts_10m',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,  label: 'LOW',     color: '#14c850' },
      { value: 50, label: 'HIGH',    color: '#ff6400' },
      { value: 100,label: 'EXTREME', color: '#c80000' },
    ]},
  },

  heatRisk: {
    id: 'heatRisk', name: 'Heat Risk', shortName: 'Heat', icon: '🌡',
    category: 'DISASTER_INTELLIGENCE',
    description: 'AegisX heat stress risk estimate',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m'],
    primaryVar: 'temperature_2m',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,  label: 'LOW',     color: '#14c850' },
      { value: 50, label: 'HIGH',    color: '#ff6400' },
      { value: 100,label: 'EXTREME', color: '#c80000' },
    ]},
  },

  fireRisk: {
    id: 'fireRisk', name: 'Fire Risk', shortName: 'Fire', icon: '🔥',
    category: 'DISASTER_INTELLIGENCE',
    description: 'AegisX wildfire risk estimate',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['temperature_2m', 'relative_humidity_2m', 'wind_speed_10m', 'precipitation'],
    primaryVar: 'temperature_2m',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,  label: 'LOW',     color: '#14c850' },
      { value: 50, label: 'HIGH',    color: '#ff6400' },
      { value: 100,label: 'EXTREME', color: '#c80000' },
    ]},
  },

  lightningRisk: {
    id: 'lightningRisk', name: 'Lightning Risk', shortName: 'Ltng', icon: '⚡',
    category: 'DISASTER_INTELLIGENCE',
    description: 'AegisX lightning risk estimate from CAPE + weather code',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['cape', 'weather_code', 'showers'],
    primaryVar: 'cape',
    supportedModels: ['ECMWF', 'GFS'],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,  label: 'LOW',     color: '#14c850' },
      { value: 50, label: 'HIGH',    color: '#ff6400' },
      { value: 100,label: 'EXTREME', color: '#c80000' },
    ]},
  },

  landslideRisk: {
    id: 'landslideRisk', name: 'Landslide Risk', shortName: 'Slide', icon: '⛰',
    category: 'DISASTER_INTELLIGENCE',
    description: 'AegisX landslide risk estimate (precipitation-based)',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['precipitation', 'rain', 'showers', 'relative_humidity_2m'],
    primaryVar: 'precipitation',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,  label: 'LOW',     color: '#14c850' },
      { value: 50, label: 'HIGH',    color: '#ff6400' },
      { value: 100,label: 'EXTREME', color: '#c80000' },
    ]},
  },

  aegisRisk: {
    id: 'aegisRisk', name: 'Aegis AI Risk', shortName: 'AEGIS', icon: '🚨',
    category: 'DISASTER_INTELLIGENCE',
    description: 'AegisX composite multi-hazard risk — model estimate only',
    unit: '/100', renderMethod: 'heatmap', isOverlay: false, isRiskLayer: true,
    openMeteoVars: ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
      'precipitation', 'rain', 'showers', 'wind_speed_10m', 'wind_gusts_10m',
      'cape', 'weather_code', 'pressure_msl', 'precipitation_probability'],
    primaryVar: 'precipitation',
    supportedModels: [],
    colorScale: RISK_SCALE,
    legend: { unit: '', min: 0, max: 100, stops: [
      { value: 0,   label: 'LOW',      color: '#14c850' },
      { value: 20,  label: 'MODERATE', color: '#ffe600' },
      { value: 40,  label: 'ELEVATED', color: '#ff8c00' },
      { value: 60,  label: 'HIGH',     color: '#ff6400' },
      { value: 80,  label: 'EXTREME',  color: '#c80000' },
    ]},
  },
};

// ─── Layer Categories (ordered for UI) ───────────────────────────────────────
export const LAYER_CATEGORIES: {
  id: LayerCategory;
  label: string;
  icon: string;
  layers: LayerId[];
}[] = [
  {
    id: 'ATMOSPHERE',
    label: 'Atmosphere',
    icon: '🌡',
    layers: ['temperature', 'feelsLike', 'humidity', 'dewPoint', 'pressure', 'cloud', 'cloudLow', 'cloudMid', 'cloudHigh', 'visibility'],
  },
  {
    id: 'WIND',
    label: 'Wind',
    icon: '💨',
    layers: ['wind', 'windGust', 'windDirection', 'particles'],
  },
  {
    id: 'PRECIPITATION',
    label: 'Precipitation',
    icon: '🌧',
    layers: ['rain', 'rainIntensity', 'precipProbability', 'showers', 'snow', 'precipAccum'],
  },
  {
    id: 'STORMS',
    label: 'Storms',
    icon: '⛈',
    layers: ['thunderstorm', 'cape', 'convective', 'lightning', 'stormRisk'],
  },
  {
    id: 'UPPER_ATMOSPHERE',
    label: 'Upper Atmosphere',
    icon: '📈',
    layers: ['upper_1000', 'upper_925', 'upper_850', 'upper_700', 'upper_500', 'upper_300'],
  },
  {
    id: 'DISASTER_INTELLIGENCE',
    label: 'Disaster Intelligence',
    icon: '🚨',
    layers: ['floodRisk', 'cycloneRisk', 'extremeRain', 'extremeWind', 'heatRisk', 'fireRisk', 'lightningRisk', 'landslideRisk', 'aegisRisk'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getLayerConfig(id: LayerId): LayerConfig {
  return LAYER_CONFIGS[id];
}

/** Interpolate a color from a ColorStop scale given a 0-1 normalized value */
export function sampleColorScale(scale: ColorStop[], t: number): [number, number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < scale.length - 1; i++) {
    const [v0, r0, g0, b0, a0] = scale[i];
    const [v1, r1, g1, b1, a1] = scale[i + 1];
    if (clamped >= v0 && clamped <= v1) {
      const f = v1 === v0 ? 0 : (clamped - v0) / (v1 - v0);
      return [
        Math.round(r0 + f * (r1 - r0)),
        Math.round(g0 + f * (g1 - g0)),
        Math.round(b0 + f * (b1 - b0)),
        Math.round(a0 + f * (a1 - a0)),
      ];
    }
  }
  const last = scale[scale.length - 1];
  return [last[1], last[2], last[3], last[4]];
}

/** Normalize a value to 0-1 using layer legend min/max */
export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/** Get Open-Meteo model string for API call */
export function getOpenMeteoModel(model: string): string {
  const map: Record<string, string> = {
    'ECMWF': 'ecmwf_ifs025',
    'GFS': 'gfs_seamless',
    'ICON': 'icon_seamless',
  };
  return map[model] ?? 'ecmwf_ifs025';
}

/** All hourly variables needed by a set of layer IDs */
export function getRequiredVars(layerIds: LayerId[]): string[] {
  const vars = new Set<string>();
  for (const id of layerIds) {
    const cfg = LAYER_CONFIGS[id];
    if (cfg) cfg.openMeteoVars.forEach(v => vars.add(v));
  }
  return Array.from(vars);
}
