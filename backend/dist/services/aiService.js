"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDisasters = void 0;
const Disaster_1 = __importDefault(require("../models/Disaster"));
const analyzeDisasters = async () => {
    const activeDisasters = await Disaster_1.default.find({ status: 'active', aiAnalysis: '' });
    for (const disaster of activeDisasters) {
        // Simulated AI Processing (Replace with actual Gemini/OpenAI call when API key is available)
        const prompt = `Analyze the potential risk and severity of a ${disaster.category} titled "${disaster.title}" at coordinates ${disaster.coordinates.lat}, ${disaster.coordinates.lng}. Provide a short risk summary and a severity score from 1-100.`;
        // Simulating AI response
        const mockSeverityScore = Math.floor(Math.random() * 50) + 50; // 50 to 100
        const mockAnalysis = `AI Assessment: This ${disaster.category} event requires monitoring. Estimated severity index is high due to its category.`;
        disaster.severityScore = mockSeverityScore;
        disaster.aiAnalysis = mockAnalysis;
        await disaster.save();
    }
};
exports.analyzeDisasters = analyzeDisasters;
