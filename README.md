<div align="center">

# 🛡️ DISASTER PREDICTOR
### Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment & Immediate Relocation Planning

[![SIH 2026](https://img.shields.io/badge/SIH%202026-Hackathon-orange?style=for-the-badge)](https://www.sih.gov.in/)
[![Team CodeNova](https://img.shields.io/badge/Team-CodeNova-cyan?style=for-the-badge)](#)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet)](https://leafletjs.com/)

> **Theme:** Disaster Management &nbsp;|&nbsp; **Category:** Software &nbsp;|&nbsp; **PS:** Intelligent Red Zone Identification

</div>

---

## 📑 Table of Contents

1. [About the Project](#-about-the-project)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Installation Guide](#-installation-guide)
   - [Windows](#-windows)
   - [macOS](#-macos)
   - [Linux](#-linux)
6. [Running the App](#-running-the-app)
7. [App Usage Guide](#-app-usage-guide)
8. [Authentication](#-authentication)
9. [External APIs Used](#-external-apis-used)
10. [Project Structure](#-project-structure)
11. [Team](#-team)

---

## 🌍 About the Project

**Disaster Predictor** is an **AI-driven, GIS-enabled Decision Support Platform** built for the Smart India Hackathon 2026.

It dynamically identifies **multi-hazard Red Zones**, assesses the **carrying capacity** of safer relocation sites, and prioritizes **vulnerable habitations** for evidence-based, proactive relocation planning — giving government and disaster management authorities a single, real-time command interface.

### Problem Statement
Traditional disaster response is **reactive, not predictive**. By the time authorities identify red zones, assess shelter capacity, and coordinate evacuations — lives are already lost. Disaster Predictor solves this with a live, AI-assisted command dashboard.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🗺️ **Live GIS Command Map** | Real-time OpenStreetMap + satellite view with hazard markers, severity radius circles, and OSRM road routing |
| 🤖 **Computer Vision Detector** | Simulated AI detection of potholes, cracks, slope failures from uploaded images with bounding-box overlays |
| 🧭 **AI Evacuation Optimizer** | Automatically computes the fastest road route (via OSRM) from any hazard to the nearest uncompromised safe shelter |
| 📡 **10-Step Pipeline Tracker** | Visualizes the full disaster response pipeline from PREDICT → MONITOR → REROUTE |
| 🏕️ **Safe Shelter Management** | Real-time occupancy, ration levels, water, and medical kit tracking for all active shelters |
| 👮 **Role-Based Views** | Separate dashboards for DMA Command, Field Responders, and Shelter Coordinators |
| 🚨 **Emergency Simulation Engine** | Trigger realistic multi-hazard disaster scenarios with live weather spikes, marker updates, and auto-dispatching |
| 📋 **Dispatch Desk** | Assign field responder teams to work orders with animated transit progress |
| 📍 **Smart Geocoder** | Multi-source geocoder (Nominatim + Photon/komoot) with query preprocessing for Indian institutions and local landmarks |
| 💾 **Full Session Persistence** | All data (markers, responders, work orders, auth) saved to browser localStorage — survives page refresh |
| 📞 **Emergency 112 Dialer** | Single-tap phone button to directly call the National Emergency Control Room |

---

## 🧰 Tech Stack

### Frontend Framework
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.x | UI component framework |
| **TypeScript** | 6.0 | Type-safe development |
| **Vite** | 8.x | Lightning-fast build tool & dev server |
| **Tailwind CSS** | 4.x | Utility-first CSS styling |

### Mapping & Geospatial
| Technology | Version | Purpose |
|---|---|---|
| **Leaflet** | 1.9.4 | Interactive map rendering |
| **React-Leaflet** | 5.0 | React bindings for Leaflet |
| **OpenStreetMap** | — | Street tile layer (free, open) |
| **Esri World Imagery** | — | Satellite tile layer |
| **OSRM** | — | Open-Source Routing Machine — real road route computation |

### Geocoding APIs (no API key required)
| API | Purpose |
|---|---|
| **Nominatim (OSM)** | Primary address/landmark geocoding |
| **Photon (komoot.io)** | Fuzzy search fallback — better for Indian colleges & institutions |

### Icons & UI
| Technology | Purpose |
|---|---|
| **Lucide React** | 1000+ sharp, consistent SVG icons |

### Data & State
| Approach | Purpose |
|---|---|
| **React useState + useLocalStorage** | All state persisted to `localStorage` keyed with `dp-*` prefix |
| **Custom Hooks** (`useLocalStorage`, `useGeocoder`) | Reusable data and API utilities |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DISASTER PREDICTOR v2.0                     │
│                        React + TypeScript                        │
├─────────────┬───────────────────────────┬───────────────────────┤
│  GIS Map    │     Demo Control Portal   │    Role Dashboards     │
│  (Leaflet)  │   (Simulation Engine)     │  DMA / Field / Shelter │
├─────────────┴───────────────────────────┴───────────────────────┤
│               Global State (App.tsx + useLocalStorage)          │
│  markers | shelters | responders | workOrders | announcements   │
├──────────────┬──────────────┬──────────────────────────────────-┤
│  Nominatim   │    Photon    │   OSRM Route API                  │
│  Geocoding   │  (komoot)    │   (road pathfinding)              │
└──────────────┴──────────────┴───────────────────────────────────┘
        ↕ All data auto-saved to browser localStorage ↕
```

---

## 💻 Installation Guide

### Prerequisites (All Platforms)

You need **Node.js v18 or higher** and **npm v9 or higher**.

Check if already installed:
```bash
node --version
npm --version
```

---

### 🪟 Windows

#### Step 1 — Install Node.js
1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS (Long Term Support)** installer (`.msi` file)
3. Run the installer — accept all defaults
4. Open **Command Prompt** or **PowerShell** and verify:
   ```cmd
   node --version
   npm --version
   ```

#### Step 2 — Install Git (if not installed)
1. Download from [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Install with default settings

#### Step 3 — Clone and Install
Open **Command Prompt** or **PowerShell**:
```cmd
git clone https://github.com/your-org/disaster-predictor.git
cd disaster-predictor
npm install
```

#### Step 4 — Run
```cmd
npm run dev
```
Open your browser at **[http://localhost:5173](http://localhost:5173)**

---

### 🍎 macOS

#### Step 1 — Install Homebrew (recommended)
Open **Terminal** and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Step 2 — Install Node.js via Homebrew
```bash
brew install node
```

**OR** download the macOS `.pkg` installer directly from [https://nodejs.org](https://nodejs.org).

Verify:
```bash
node --version
npm --version
```

#### Step 3 — Install Git
macOS ships with Git. Verify with:
```bash
git --version
```
If not installed, run:
```bash
brew install git
```

#### Step 4 — Clone and Install
```bash
git clone https://github.com/your-org/disaster-predictor.git
cd disaster-predictor
npm install
```

#### Step 5 — Run
```bash
npm run dev
```
Open your browser at **[http://localhost:5173](http://localhost:5173)**

---

### 🐧 Linux (Ubuntu / Debian / Fedora)

#### Ubuntu / Debian

```bash
# Update package index
sudo apt update

# Install Node.js via NodeSource (recommended for latest version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version

# Install Git (if not present)
sudo apt install git -y
```

#### Fedora / RHEL / CentOS

```bash
# Install Node.js
sudo dnf install nodejs npm -y

# Or via NodeSource for latest:
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install nodejs -y

# Install Git
sudo dnf install git -y
```

#### Arch Linux

```bash
sudo pacman -S nodejs npm git
```

#### Clone and Install (All Linux distros)

```bash
git clone https://github.com/your-org/disaster-predictor.git
cd disaster-predictor
npm install
```

#### Run

```bash
npm run dev
```
Open your browser at **[http://localhost:5173](http://localhost:5173)**

---

## 🚀 Running the App

### Development Server (with hot reload)
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
Output goes to the `dist/` folder — can be served with any static file server.

### Preview Production Build Locally
```bash
npm run preview
```

### Lint the Code
```bash
npm run lint
```

---

## 📖 App Usage Guide

### 🗺️ Tab 1 — GIS Command Map

The main operational screen. Shows all hazard zones and safe shelters on a real interactive map.

| Action | How to do it |
|---|---|
| **View hazards** | Red pulsing dots = active danger zones |
| **View shelters** | Green dots = safe shelter locations |
| **Select a hazard** | Click any marker to compute evacuation route |
| **See evacuation route** | Blue line appears automatically after marker selection |
| **Toggle satellite view** | Click the `Satellite` button in the map header |
| **Locate yourself** | Click `Locate Me` (GPS) button |
| **Plot a new hazard** | Click anywhere on the map (requires authentication) |
| **Search & deploy** | Use the **GEO COMMAND DESK** panel (right sidebar) after logging in |
| **Emergency call** | Click the red **112** phone button in the right sidebar |

**Marker Colors:**
- 🔴 **Red** — Active danger zone (risk > 75%)
- 🟡 **Amber** — Warning zone (risk 30–75%)
- 🟢 **Green** — Safe shelter
- 🔴 Strikethrough — Compromised shelter (within hazard radius)

---

### 🤖 Tab 2 — Computer Vision Detector

Simulates AI-powered satellite/drone image analysis.

1. Click any preset image (road crack, slope failure, pothole)
2. The AI engine runs object detection and draws bounding boxes
3. Detected hazards are **automatically added to the GIS map**
4. A work order is auto-generated in the Dispatch Desk

---

### 👮 Tab 3 — Role Analytics

Switch roles using the header role selector:

| Role | View |
|---|---|
| **DMA Command** | All hazards, relocation authorization, population metrics |
| **Field Responder** | Active work orders, en-route status, field actions |
| **Shelter Coordinator** | Shelter occupancy, supply levels (water/rations/medical) |

---

### 🔧 Tab 4 — Dispatch Desk

Manage field deployment of rescue teams.

1. Select a pending **Work Order**
2. Choose an available **Responder** (Police / Fire / Medical / NGO)
3. Click **Deploy Team** — animated progress bar shows transit in real time
4. Once complete, the hazard risk is automatically reduced on the map

---

### 📊 Tab 5 — 10-Step Pipeline

Visual tracker of the full disaster response lifecycle:

```
PREDICT → DETECT → ASSESS → PRIORITIZE → ALERT →
COORDINATE → RELOCATE → MONITOR → REROUTE → RE-OPTIMIZE
```

Steps advance automatically as you trigger disasters, deploy teams, and resolve incidents.

---

### 🎮 Tab 6 — Demo Control Portal

The simulation control room. Requires **command authentication**.

#### Trigger a Disaster Scenario:
1. Select **Location** (Chennai / Wayanad / Joshimath)
2. Select **Disaster Type** (Flood, Landslide, Cloudburst, Earthquake, Wildfire, Tsunami, Gas Leak, Hailstorm)
3. Select **Intensity** (Low / Medium / Severe)
4. Click **TRIGGER DISASTER SIMULATION**

#### Register Resources:
- **Add Shelter** — Register a new relief camp with GPS coordinates and capacity
- **Add Responder** — Add police, fire, medical, or NGO units to the registry
- **Broadcast** — Send emergency announcements to all role views
- **Clear Hazard** — Manually mark a threat as resolved

#### Geo Provisioning Desk:
- Search any location (college, hospital, landmark, road junction)
- Deploy it as a **Hazard Zone** or **Safe Shelter** on the live map

---

## 🔐 Authentication

The platform has a **Command Officer authentication** system to prevent unauthorized map modifications.

| Credential | Value |
|---|---|
| **Command PIN** | `SIH2026` |

To authenticate:
1. Click the 🔒 **COMMAND LOCK** button in the top-right header
2. Enter the PIN `SIH2026`
3. Click **Authenticate**
4. The button turns green (🔓 COMMAND LOCK OPEN)

> **Note:** The authenticated session is persisted in `localStorage` and survives page refresh within the same browser.

To log out, click **COMMAND LOCK OPEN** to re-lock access.

---

## 🌐 External APIs Used

All APIs are **free and require no API key**.

| API | Endpoint | Purpose |
|---|---|---|
| **OpenStreetMap Tiles** | `tile.openstreetmap.org` | Street map background tiles |
| **Esri World Imagery** | `server.arcgisonline.com` | Satellite map tiles |
| **Nominatim (OSM)** | `nominatim.openstreetmap.org` | Geocoding address → coordinates |
| **Photon (komoot)** | `photon.komoot.io` | Fuzzy geocoding for Indian institutions |
| **OSRM** | `router.project-osrm.org` | Road-network evacuation route computation |

> **Geocoding rate limits:** Nominatim limits to 1 request/second per IP. The app handles this gracefully with fallback to Photon when Nominatim is rate-limited.

---

## 📁 Project Structure

```
sih-internal/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Top navigation bar, auth, clock, MQTT ticker
│   │   ├── TabGisMap.tsx         # Leaflet map, OSRM routing, GEO Command Desk
│   │   ├── TabRoleViews.tsx      # DMA / Field / Shelter role dashboards
│   │   ├── TabComputerVision.tsx # AI image analysis simulation
│   │   ├── TabDispatchDesk.tsx   # Work order & responder deployment
│   │   ├── TabPipeline.tsx       # 10-step pipeline visual tracker
│   │   ├── TabDemoControls.tsx   # Demo simulation engine & provisioning desk
│   │   ├── SidebarSimulator.tsx  # (Legacy) location simulator sidebar
│   │   └── References.tsx        # Footer with references & citations
│   ├── hooks/
│   │   ├── useLocalStorage.ts    # Typed localStorage persistence hook
│   │   └── useGeocoder.ts        # Smart multi-source geocoder (Nominatim + Photon)
│   ├── App.tsx                   # Root component, global state, all handlers
│   ├── mockData.ts               # Seed data: markers, shelters, responders, weather
│   ├── types.ts                  # TypeScript interfaces for all data models
│   ├── index.css                 # Global Tailwind + custom animations
│   └── main.tsx                  # React DOM entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 💾 Data Persistence

All application state is stored in the **browser's localStorage** using `dp-*` prefixed keys.

| Key | What's stored |
|---|---|
| `dp-markers` | All hazard markers and shelters (including custom-plotted ones) |
| `dp-shelters` | Shelter occupancy, water, rations, medical kit levels |
| `dp-responders` | All field responder units and their deployment status |
| `dp-workOrders` | All work orders and their resolution history |
| `dp-announcements` | All broadcast bulletins and emergency notices |
| `dp-systemAlert` | Whether a disaster is currently active |
| `dp-weather` | Current weather telemetry data |
| `dp-isAuthenticated` | Command officer authentication state |
| `dp-simLocation` | Currently selected simulation location |
| `dp-pipelineStep` | Current active step in the 10-step pipeline |

> **Schema Version:** Defined as `dp-v4` in `App.tsx`. Bump this when the data shape changes to auto-wipe stale persisted data.

---

## 👥 Team

**Team CodeNova** — SIH 2026

| Role | Description |
|---|---|
| Project Lead | Platform architecture, GIS integration, simulation engine |
| Frontend Dev | React/TypeScript UI, Leaflet map integration |
| AI/ML Engineer | Computer vision detection pipeline, risk scoring logic |
| Data Engineer | Disaster data modeling, mock datasets, geocoding pipeline |

**Hackathon:** Smart India Hackathon 2026  
**PS Theme:** Disaster Management  
**PS Category:** Software  

---

## 📚 References & Data Sources

- [OpenStreetMap](https://www.openstreetmap.org/) — Map tiles and geocoding data
- [OSRM Project](http://project-osrm.org/) — Open Source Routing Machine
- [Photon by komoot](https://photon.komoot.io/) — Fuzzy geocoding engine
- [NDMA India](https://ndma.gov.in/) — National Disaster Management Authority guidelines
- [IMD India](https://mausam.imd.gov.in/) — India Meteorological Department alert system
- [ISRO Bhuvan](https://bhuvan.nrsc.gov.in/) — Indian geospatial reference
- [Leaflet.js](https://leafletjs.com/) — Open-source JavaScript mapping library
- [React](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — Build tooling

---

<div align="center">

**Built with ❤️ by Team CodeNova for Smart India Hackathon 2026**

*"Technology in service of lives."*

</div>
