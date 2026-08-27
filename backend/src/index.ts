import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchAndStoreEonetData } from './services/eonetService';
import { analyzeDisasters } from './services/aiService';
import { disastersStore } from './models/Disaster';
import visionRoutes from './routes/visionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/vision', visionRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Disaster API Backend is running' });
});

// Get all active disasters
app.get('/api/disasters', (req, res) => {
  try {
    const activeDisasters = disastersStore
      .filter(d => d.status === 'active')
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    res.json(activeDisasters);
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
