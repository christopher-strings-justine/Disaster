import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fetchAndStoreEonetData } from './services/eonetService';
import { analyzeDisasters } from './services/aiService';
import Disaster from './models/Disaster';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/disaster-sih';

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Disaster API Backend is running' });
});

// Get all active disasters
app.get('/api/disasters', async (req, res) => {
  try {
    const disasters = await Disaster.find({ status: 'active' }).sort({ date: -1 });
    res.json(disasters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch disasters' });
  }
});

// Trigger a sync from EONET and run AI analysis
app.post('/api/disasters/sync', async (req, res) => {
  try {
    await fetchAndStoreEonetData();
    await analyzeDisasters();
    res.json({ message: 'Sync and analysis complete' });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
