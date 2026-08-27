export interface IDisaster {
  eonetId: string;
  title: string;
  category: string;
  description: string;
  status: 'active' | 'closed';
  coordinates: {
    lat: number;
    lng: number;
  };
  severityScore: number;
  aiAnalysis: string;
  date: Date;
}

// In-memory store
export const disastersStore: IDisaster[] = [];
