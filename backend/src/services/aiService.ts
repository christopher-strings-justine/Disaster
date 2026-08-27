import { disastersStore } from '../models/Disaster';

export const analyzeDisasters = async () => {
  const activeDisasters = disastersStore.filter(d => d.status === 'active' && d.aiAnalysis === '');
  
  for (const disaster of activeDisasters) {
    // Simulated AI response
    const mockSeverityScore = Math.floor(Math.random() * 50) + 50; // 50 to 100
    const mockAnalysis = `AI Assessment: This ${disaster.category} event requires monitoring. Estimated severity index is high due to its category.`;
    
    disaster.severityScore = mockSeverityScore;
    disaster.aiAnalysis = mockAnalysis;
  }
};
