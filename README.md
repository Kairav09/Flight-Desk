# ✈️ FlightDesk — Real-Time Flight Status Tracker

> Every gate. Every delay. Every update — before the airport tells you.

**FlightDesk** is a modern, real-time flight status tracking platform built with **React.js** and powered by the **AeroDataBox API**. It delivers a premium, aviation-grade dashboard experience for passengers and airport staff to monitor live departures, track routes on an interactive map, and browse flight schedules — all through a stunning dark-themed interface.

🔗 **Live Demo:** [flight-desk-seven.vercel.app](https://flight-desk-seven.vercel.app)

---

## 📸 Screenshots

| Landing Page | Dashboard |
|---|---|
| ![Landing](https://img.shields.io/badge/Page-Landing-0f172a?style=for-the-badge) | ![Dashboard](https://img.shields.io/badge/Page-Dashboard-0f172a?style=for-the-badge) |

| Live Flights | Route Map |
|---|---|
| ![Flights](https://img.shields.io/badge/Page-Flights-0f172a?style=for-the-badge) | ![Route Map](https://img.shields.io/badge/Page-Route_Map-0f172a?style=for-the-badge) |

---

## ✨ Features

- **📊 Live Dashboard** — Real-time flight departures with status indicators, search, and multi-filter support
- **🗺️ Interactive Route Map** — Leaflet.js-powered map with curved flight paths, airport markers, and hub switching
- **📅 Flight Schedule** — Heatmap calendar with day-by-day flight activity and a detailed departure timeline
- **✈️ Advanced Flight Table** — Sortable columns, pagination, airport/direction toggling, and column-level sorting
- **🔔 Notification Center** — Flight alerts with mark-as-read and dismissal functionality
- **👤 User Profiles** — Editable profile with avatar initials and session management
- **🔐 Authentication** — Full login/signup flow with validation, error feedback, and localStorage persistence
- **📱 Fully Responsive** — Optimized for desktop, tablet, and mobile with a collapsible mobile navigation
- **🌙 Dark Theme** — Premium navy/amber design system with glassmorphism effects and micro-animations

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React.js (Hooks, JSX, Function Components) |
| **Build Tool** | Vite |
| **Styling** | CSS |
| **Map Integration** | Leaflet.js |
| **Flight Data API** | AeroDataBox (via RapidAPI) |
| **Routing** | React Router v6 |
| **Persistence** | localStorage (session, cache, user data) |
| **Deployment** | Vercel |
| **Version Control** | Git + GitHub |

---

## 📁 Project Structure

```
source/
├── public/              # Static assets (favicon)
├── src/
│   ├── assets/          # Images (logo, login background)
│   ├── pages/           # Page components
│   │   ├── Landing.jsx      # Public landing page
│   │   ├── Auth.jsx         # Login & signup
│   │   ├── Dashboard.jsx    # Main flight dashboard
│   │   ├── Flights.jsx      # Advanced flight table
│   │   ├── RouteMap.jsx     # Interactive route map
│   │   ├── Schedule.jsx     # Heatmap calendar + timeline
│   │   ├── Profile.jsx      # User profile editor
│   │   └── Notifications.jsx # Notification center
│   ├── styles/          # Modular CSS files (one per page)
│   ├── utils/           # Data files (airport coordinates)
│   ├── App.jsx          # Router configuration
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles & design tokens
├── vercel.json          # SPA rewrite rules for Vercel
├── vite.config.js       # Vite build configuration
└── package.json         # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Kairav09/Flight-Desk.git
cd Flight-Desk/source

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

The optimized output will be in the `dist/` folder.

---

## 🔑 API Configuration

FlightDesk uses the **AeroDataBox API** (via RapidAPI) for live flight data. The free tier provides 200 requests/month.

If the API quota is exhausted, the app automatically falls back to realistic mock data to ensure the UI always remains functional.

---

## 👥 Team & Contributions

**Course:** Front End Development Frameworks and UI Engineering (25CS1201E) — 2025-26, Term-3 | **Section:** 10

### Kairav Vashi — 2520030582 (Team Lead)
- **CO3 — React Component Model:** All React components, hooks (`useState`, `useEffect`, `useCallback`), controlled inputs, component composition
- **CO4 — State Architecture & API Integration:** State co-location, derived state, async data flow, caching, container-presenter pattern, API layer, localStorage persistence
- **CO5 — Routing, Forms, Accessibility & Performance:** SPA routing, protected routes, form validation, `useMemo`, lazy map init, key-based rendering, semantic HTML

### U. Pranav Varma — 2520030351
- **CO1 — Foundations of Front-End Engineering:** Project scaffolding, folder structure, declarative UI, unidirectional data flow, Virtual DOM
- **CO2 — JavaScript & TypeScript Engineering:** ES6+ features, closures, async/await, functional patterns, auth logic, validation utilities
- **CO6 — Build Systems, Testing, CI/CD & Deployment:** Vite config, tree-shaking, Vercel CI/CD pipeline, Lighthouse audits, linting

---
