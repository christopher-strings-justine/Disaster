import mongoose, { Document, Schema } from 'mongoose';

export interface IDisaster extends Document {
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

const DisasterSchema: Schema = new Schema({
  eonetId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  severityScore: { type: Number, default: 0 },
  aiAnalysis: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

export default mongoose.model<IDisaster>('Disaster', DisasterSchema);
