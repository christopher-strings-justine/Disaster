const fs = require('fs');

let content = fs.readFileSync('mockData.ts', 'utf8');

// Update Shelters
content = content.replace(/capacity: (\d+),\n\s*occupancy: (\d+),\n\s*waterLevel: (\d+),\n\s*rations: (\d+),\n\s*medicalKits: (\d+),/g, (match, p1, p2, p3, p4, p5) => {
  return `${match}\n    hospitalBeds: Math.floor(${p1} * 0.1),\n    personnelCount: Math.floor(${p1} * 0.05),\n    inventoryDetails: 'Blankets, Tents, Basic Meds',`;
});

// Update Responders
content = content.replace(/taskId: (.*?),\n\s*}/g, (match, p1) => {
  return `${match.replace('}', '')}  vehicleCount: 3,\n    personnelSize: 15,\n    equipmentDetails: 'Standard Rescue Gear',\n  }`;
});

fs.writeFileSync('mockData.ts', content);
console.log('Updated mockData.ts');
