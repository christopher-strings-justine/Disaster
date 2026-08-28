import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchAndStoreEonetData } from './services/eonetService';
import { analyzeDisasters } from './services/aiService';
import { disastersStore } from './models/Disaster';
import visionRoutes from './routes/visionRoutes';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({limit: '2mb'}));
app.use(express.urlencoded({limit: '2mb', extended: true}));

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later.'
});
app.use('/api/', apiLimiter);

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
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Force event loop to stay alive in case some dependency is unref-ing the server
setInterval(() => {
  // heartbeat
}, 60000);
