# LegacyVault — Frontend

Single-page web application for **LegacyVault**, built with React 18 and Vite.

## Tech Stack
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Deployment Platform:** Vercel

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (optional for local development):
```bash
cp .env.example .env
```
Default local API base URL: `http://localhost:8080/api`

### 3. Run Development Server
```bash
npm run dev
```
The application will start at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
Build output is generated in `dist/`.

## Deployment to Vercel
- **Root Directory:** `frontend` (or repository root if deploying this repo independently)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:**
  - `VITE_API_BASE_URL`: URL of your deployed backend (e.g. `https://legacyvault-backend.onrender.com/api`)
- Client-side route rewrites are pre-configured in `vercel.json`.
