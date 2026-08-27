# Unified Disaster Response & Provisioning System

An advanced, real-time disaster management and geographical tracking system built for Smart India Hackathon (SIH). This full-stack application provides multi-role dashboards for District Magistrates, First Responders, and Shelter Managers to coordinate rescue operations and allocate resources efficiently.

## Features

- **Live Global Disaster Tracking**: Integrated with the NASA EONET API, filtered specifically for the South Asian (Indian) subcontinent to plot live natural disasters on a dynamic map.
- **Resource Provisioning**: Fully functional Demo Control Portal allowing officials to spawn mock hazard events, setup relief camps, and dispatch field responder teams (Police, Fire, Medical, NGO).
- **Advanced Resource Tracking**: Comprehensive metrics for tracking vehicles, hospital bed capacities, inventory, and personnel available at both shelters and rescue units.
- **Role-Based Analytics**: Dedicated dashboards simulating unique real-time statistics and pipelines for DMA (District Magistrate), Field Responders, and Shelter Management.

## Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Mapping**: Leaflet / React-Leaflet
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js / Express
- **Language**: TypeScript
- **Storage**: In-Memory Store (previously MongoDB, optimized for fast deployment and resilience)
- **External API**: NASA Earth Observatory Natural Event Tracker (EONET)

## Getting Started

### 1. Backend Setup
Navigate to the backend directory, install dependencies, and start the development server.
```bash
cd backend
npm install
npm run build
npm start
```
The backend will run on `http://localhost:3000`.

### 2. Frontend Setup
In a new terminal window, navigate to the frontend directory.
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## Recent Updates
* **[2026-08-27] Advanced Resource Provisioning added**: Introduced detailed forms and analytics tracking for Vehicles, Hospital Beds, and active Personnel counts for both Field Responders and Refuges.
* **[2026-08-27] Localized Live Tracking**: Global maps now prioritize centering on India, and NASA EONET fetching uses South Asian bounding box filtering.
* **[2026-08-27] In-Memory Migration**: Transitioned from a strict MongoDB schema to a stable in-memory store for faster local demo execution without database timeout errors.
