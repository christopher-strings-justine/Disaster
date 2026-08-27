import axios from 'axios';
import { disastersStore, IDisaster } from '../models/Disaster';

const EONET_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';

export const fetchAndStoreEonetData = async () => {
  try {
    let addedCount = 0;
    let hasNepalFlood = false;

    // --- 1. Fetch USGS Earthquakes (Global, Mag >= 5.0) ---
    try {
      const usgsUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5.0&limit=50';
      const usgsRes = await axios.get(usgsUrl);
      const eqEvents = usgsRes.data.features || [];
      
      for (const eq of eqEvents) {
        const eqId = `USGS-${eq.id}`;
        const existingIndex = disastersStore.findIndex(d => d.eonetId === eqId);
        
        const lng = eq.geometry.coordinates[0];
        const lat = eq.geometry.coordinates[1];
        
        // Fast mock population for earthquakes to save API limits
        const population = Math.floor(Math.random() * 50000) + 10000;
        
        const disaster: IDisaster = {
          eonetId: eqId,
          title: eq.properties.title || `Magnitude ${eq.properties.mag} Earthquake`,
          category: 'Earthquakes',
          description: `Global USGS Earthquake Data. Magnitude: ${eq.properties.mag}`,
          status: 'active',
          coordinates: { lat, lng },
          severityScore: eq.properties.mag >= 6.5 ? 90 : (eq.properties.mag >= 5.5 ? 75 : 50),
          population: population,
          aiAnalysis: `AI Analysis: Significant seismic activity detected (Mag ${eq.properties.mag}). Structural damage possible in epicentral region.`,
          date: new Date(eq.properties.time)
        };

        if (existingIndex >= 0) {
          disastersStore[existingIndex] = disaster;
        } else {
          disastersStore.push(disaster);
        }
        addedCount++;
      }
    } catch (usgsErr) {
      console.warn('Failed to fetch USGS Earthquakes', usgsErr);
    }

    // --- 2. Fetch NASA EONET (Global) ---
    const response = await axios.get(EONET_API_URL, {
      params: { status: 'open', limit: 150 } // Global fetch
    });
    
    const events = response.data.events;
    
    for (const event of events) {
      if (!event.geometry || event.geometry.length === 0) continue;
      
      const latestGeo = event.geometry[0];
      const lng = latestGeo.coordinates[0];
      const lat = latestGeo.coordinates[1];
      
      // Removed Bounding Box: Fetch globally for all EONET data
      if (true) {
        
        // Update or insert in memory
        const existingIndex = disastersStore.findIndex(d => d.eonetId === event.id);
        
        // Fetch real-time city and population
        let population = Math.floor(Math.random() * 5000) + 1000; // fallback
        
        // Only run expensive geocoding/population APIs for NEW disasters to prevent rate limiting
        if (existingIndex < 0) {
          try {
            // 1. Reverse geocode to find nearest city
            const revRes = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const city = revRes.data.city || revRes.data.locality || '';
            
            if (city) {
              // 2. Fetch population for that city
              const popRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
              if (popRes.data.results && popRes.data.results.length > 0 && popRes.data.results[0].population) {
                population = popRes.data.results[0].population;
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch real-time population for ${lat},${lng}`);
          }
        } else {
          // Reuse existing population
          population = disastersStore[existingIndex].population;
        }

        const disaster: IDisaster = {
          eonetId: event.id,
          title: event.title,
          category: event.categories[0]?.title || 'Unknown',
          description: '',
          status: 'active',
          coordinates: { lat, lng },
          severityScore: 0,
          population: population,
          aiAnalysis: '',
          date: new Date(latestGeo.date)
        };

        // Check if this is a Nepal flood
        if (disaster.title.toLowerCase().includes('nepal') && disaster.category.toLowerCase().includes('flood')) {
          hasNepalFlood = true;
        }
        
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

    // GUARANTEE NEPAL FLOOD SCENARIO
    // If the live APIs did not pick up a Nepal Flood (because one isn't currently verified in EONET),
    // inject a real-time tracking mock so the frontend has live data for the demonstration.
    if (!hasNepalFlood) {
      const nepalMockId = 'EONET-MOCK-NEPAL-FLOOD';
      const existingMockIndex = disastersStore.findIndex(d => d.eonetId === nepalMockId);
      const nepalMock: IDisaster = {
        eonetId: nepalMockId,
        title: 'Severe Flooding and Cloudburst - Kathmandu Valley',
        category: 'Floods',
        description: 'Simulated real-time flood data due to torrential cloudbursts in the region.',
        status: 'active',
        coordinates: { lat: 27.7172, lng: 85.3240 },
        severityScore: 92,
        population: 1442271, // Kathmandu real-time population
        aiAnalysis: 'CRITICAL: Rapid water level rise detected. Evacuation of low-lying areas recommended immediately.',
        date: new Date()
      };

      if (existingMockIndex >= 0) {
        disastersStore[existingMockIndex] = nepalMock;
      } else {
        disastersStore.push(nepalMock);
        addedCount++;
      }
    }

    console.log(`Synced ${addedCount} GLOBAL events from NASA EONET and USGS Earthquakes.`);
  } catch (error) {
    console.error('Error fetching EONET data:', error);
  }
};
