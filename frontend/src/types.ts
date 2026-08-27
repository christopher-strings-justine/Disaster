export type DisasterType = 'cloudburst' | 'landslide' | 'flood' | 'earthquake' | 'wildfire' | 'tsunami' | 'gasleak' | 'hailstorm';
export type IntensityLevel = 'low' | 'medium' | 'severe';
export type LocationId = 'wayanad' | 'joshimath' | 'chennai';
export type RoleType = 'dma' | 'responder' | 'shelter';

export interface HazardMarker {
  id: string;
  name: string;
  locationId: LocationId;
  risk: number;
  status: 'danger' | 'warning' | 'safe';
  details: string;
  population: number;
  lat: number; // real-world latitude
  lng: number; // real-world longitude
  radius?: number; // individual severity radius in meters (optional)
  x?: number; // legacy SVG canvas x (0-100), optional
  y?: number; // legacy SVG canvas y (0-100), optional
}

export interface Shelter {
  id: string;
  name: string;
  locationId: LocationId;
  capacity: number;
  occupancy: number; // current occupants
  waterLevel: number; // percentage (0-100)
  rations: number; // percentage (0-100)
  medicalKits: number; // percentage (0-100)
  lat?: number; // real-world latitude (optional)
  lng?: number; // real-world longitude (optional)
}

export interface FieldResponder {
  id: string;
  name: string;
  type: 'Police' | 'Fire' | 'Medical' | 'NGO';
  status: 'idle' | 'en-route' | 'active' | 'resolved';
  location: string;
  progress: number; // 0-100 for dispatch animation
  taskId: string | null;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  source: 'CV' | 'Simulator';
  locationId: LocationId;
  locationName: string;
  priority: 'low' | 'medium' | 'critical';
  status: 'pending' | 'dispatched' | 'active' | 'resolved';
  assignedResponderId: string | null;
  progress: number;
}

export interface BoundingBox {
  x: number; // percentage left
  y: number; // percentage top
  w: number; // percentage width
  h: number; // percentage height
  label: string;
  confidence: number;
}

export interface CvPresetImage {
  id: string;
  name: string;
  url: string;
  hazardType: string;
  confidence: number;
  locationTag: string;
  boundingBoxes: BoundingBox[];
}

export interface WeatherData {
  precipitation: number; // mm/hr
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  imdAlertLevel: 'green' | 'yellow' | 'orange' | 'red';
}

export interface Announcement {
  id: string;
  time: string;
  source: string;
  message: string;
}

export interface UserGpsData {
  x: number;
  y: number;
  lat: number;
  lng: number;
  accuracy: number;
}


