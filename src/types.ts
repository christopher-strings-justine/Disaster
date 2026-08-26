export type DisasterType = 'cloudburst' | 'landslide' | 'flood';
export type IntensityLevel = 'low' | 'medium' | 'severe';
export type LocationId = 'wayanad' | 'joshimath';
export type RoleType = 'dma' | 'responder' | 'shelter';

export interface HazardMarker {
  id: string;
  name: string;
  locationId: LocationId;
  risk: number;
  status: 'danger' | 'warning' | 'safe';
  details: string;
  population: number;
  x: number; // percentage coordinate (0-100) on SVG map
  y: number; // percentage coordinate (0-100) on SVG map
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
