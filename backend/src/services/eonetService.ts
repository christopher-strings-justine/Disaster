import axios from 'axios';
import { disastersStore, IDisaster } from '../models/Disaster';

const EONET_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';

export const fetchAndStoreEonetData = async () => {
  try {
    const response = await axios.get(EONET_API_URL, {
      params: { status: 'open', limit: 100 }
    });
    
    const events = response.data.events;
    let addedCount = 0;
    
    for (const event of events) {
      if (!event.geometry || event.geometry.length === 0) continue;
      
      const latestGeo = event.geometry[0];
      const lng = latestGeo.coordinates[0];
      const lat = latestGeo.coordinates[1];
      
      // Filter for South Asia/India bounding box:
      // Lat between -10 and 45
      // Lng between 50 and 110
      if (lat >= -10 && lat <= 45 && lng >= 50 && lng <= 110) {
        
        // Update or insert in memory
        const existingIndex = disastersStore.findIndex(d => d.eonetId === event.id);
        
        const disaster: IDisaster = {
          eonetId: event.id,
          title: event.title,
          category: event.categories[0]?.title || 'Unknown',
          description: '',
          status: 'active',
          coordinates: { lat, lng },
          severityScore: 0,
          aiAnalysis: '',
          date: new Date(latestGeo.date)
        };
        
        if (existingIndex >= 0) {
          // Preserve AI fields if they exist
          disaster.severityScore = disastersStore[existingIndex].severityScore;
          disaster.aiAnalysis = disastersStore[existingIndex].aiAnalysis;
          disastersStore[existingIndex] = disaster;
        } else {
          disastersStore.push(disaster);
        }
        
        addedCount++;
      }
    }
    console.log(`Synced ${addedCount} events near India from EONET.`);
  } catch (error) {
    console.error('Error fetching EONET data:', error);
  }
};
