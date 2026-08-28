# Unified Disaster Response & Provisioning System (Aegis)

An advanced, real-time disaster management and geographical tracking system designed for emergency response coordination. This full-stack application provides multi-role dashboards for District Magistrates, First Responders, and Shelter Managers to coordinate rescue operations and allocate resources efficiently.

## 🚀 Features

- **Live Global Disaster Tracking**: Integrated with the NASA EONET API, filtered specifically for the South Asian (Indian) subcontinent to plot live natural disasters on a dynamic map.
- **AI-Powered Intelligence**: Uses Groq and Google Gemini AI models to provide predictive analytics and natural language processing capabilities for disaster management.
- **Real-Time Weather Data**: Incorporates advanced weather overlays and wind particle visualization.
- **Resource Provisioning**: Fully functional Demo Control Portal allowing officials to spawn mock hazard events, setup relief camps, and dispatch field responder teams (Police, Fire, Medical, NGO).
- **Advanced Resource Tracking**: Comprehensive metrics and charts for tracking vehicles, hospital bed capacities, inventory, and personnel available at both shelters and rescue units.
- **Role-Based Analytics**: Dedicated dashboards simulating unique real-time statistics and pipelines for DMA (District Magistrate), Field Responders, and Shelter Management.
- **Image Recognition**: Integrated TensorFlow.js models for on-device mobile net image classification capabilities.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React.js 19](https://react.dev/) powered by [Vite](https://vitejs.dev/) for lightning-fast HMR and building.
- **Language**: TypeScript
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Mapping & GIS**: [Leaflet](https://leafletjs.com/) and [React-Leaflet](https://react-leaflet.js.org/) for interactive geographical mapping and weather overlays.
- **Charts & Visualizations**: [Recharts](https://recharts.org/) for rendering analytics dashboards.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Machine Learning**: TensorFlow.js (MobileNet) for in-browser ML capabilities.

### Backend
- **Framework**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Language**: TypeScript (using `tsx` for execution)
- **AI Integrations**: 
  - [Groq SDK](https://console.groq.com/docs/quickstart) for rapid AI inference.
  - [@google/generative-ai](https://ai.google.dev/) for Gemini-powered insights.
- **Database / Storage**: 
  - In-Memory Store optimized for fast local deployments.
  - Support for MongoDB (Mongoose) and PostgreSQL (pg).
- **External APIs**: NASA Earth Observatory Natural Event Tracker (EONET)
- **Security**: CORS, Express Rate Limit, XSS filtering.

---

## 📖 How to Use (Usage Instructions)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Environment Variables Setup
You'll need to set up your environment variables for both the frontend and backend.
Create a `.env` file in the `backend` directory (if not already present) and populate it with required API keys, for example:
```env
PORT=3000
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and start the development server.

```bash
cd backend
npm install

# Start the server in development mode (with auto-reload)
npm run dev

# OR start in production mode
npm start
```
The backend server will run on `http://localhost:3000`.

### 3. Frontend Setup
In a new terminal window, navigate to the frontend directory, install dependencies, and run the Vite dev server.

```bash
cd frontend
npm install

# Start the frontend dev server
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

### 4. Running the Application
- Open your browser and navigate to `http://localhost:5173`.
- **District Magistrate View**: Use the primary dashboards to get a bird's-eye view of all ongoing crises.
- **Demo Controls**: Access the demo provisioning panels to mock spawn hazards, deploy vehicles, and update bed capacities to see real-time chart updates.

---

## 📅 Recent Updates
* **AI Integrations**: Upgraded the system with Groq and Gemini APIs to process incident reports faster.
* **Advanced Resource Provisioning added**: Introduced detailed forms and analytics tracking for Vehicles, Hospital Beds, and active Personnel counts for both Field Responders and Refuges.
* **Localized Live Tracking**: Global maps now prioritize centering on India, and NASA EONET fetching uses South Asian bounding box filtering.
* **In-Memory Migration**: Transitioned from a strict MongoDB schema to a stable in-memory store for faster local demo execution without database timeout errors.
