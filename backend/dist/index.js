"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const eonetService_1 = require("./services/eonetService");
const aiService_1 = require("./services/aiService");
const Disaster_1 = require("./models/Disaster");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Disaster API Backend is running' });
});
// Get all active disasters
app.get('/api/disasters', (req, res) => {
    try {
        const activeDisasters = Disaster_1.disastersStore
            .filter(d => d.status === 'active')
            .sort((a, b) => b.date.getTime() - a.date.getTime());
        res.json(activeDisasters);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch disasters' });
    }
});
// Trigger a sync from EONET and run AI analysis
app.post('/api/disasters/sync', async (req, res) => {
    try {
        await (0, eonetService_1.fetchAndStoreEonetData)();
        await (0, aiService_1.analyzeDisasters)();
        res.json({ message: 'Sync and analysis complete' });
    }
    catch (error) {
        res.status(500).json({ error: 'Sync failed' });
    }
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
