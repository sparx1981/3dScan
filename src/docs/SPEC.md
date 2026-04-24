# 3D Scan PWA - Product Specification

> **Last Updated:** 2026-04-24 | **Changed:** Replaced mock processing with Google Colab COLMAP integration. Added batch upload and model loading.

## Overview
3D Scan PWA is a mobile-first Progressive Web App designed to capture objects and rooms using standard RGB cameras and reconstruct them into 3D models via cloud photogrammetry using a Google Colab backend.

## Architecture and File Structure
- `node_modules/`: Project dependencies.
- `src/`:
  - `components/`: UI components (Dashboard, CaptureView, ModelViewer).
  - `services/`: API client services.
  - `lib/`: Utility functions and formatting.
  - `types.ts`: Global TypeScript interfaces.
  - `App.tsx`: Main view router and state manager.
  - `index.css`: Global styles and typography (Inter + Space Grotesk).
- `server.ts`: Express backend proxying images to Google Colab.
- `package.json`: Build scripts and dependencies.
- `RECON_COLAB.ipynb`: (External) Photogrammetry engine running COLMAP/Open3D.

## Core Features
- **GPU-Powered Reconstruction**: Real-time COLMAP photogrammetry via free Google Colab T4 GPUs.
- **Batch Upload System**: Sequential photo transmission with progress tracking.
- **Hybrid Viewfinder**: 
  - Real-time overlap meter with color-coded feedback (Red/Amber/Green).
  - Transient ghosting overlay for frame alignment.
- **Three.js OBJ Viewer**: Loads real `.obj` meshes with automated centring and scaling.

## API Surface
### Projects API
- `GET /api/projects`: List all reconstructions.
- `POST /api/projects`: Initialize a new scan session.
- `POST /api/projects/:id/upload`: Store actual JPEG binaries to `/tmp/scans`.
- `POST /api/projects/:id/finish`: Trigger the Colab pipeline and wait for the model URL.
- `GET /api/colab-status`: Health check for the ngrok processing engine.

## Data Models
```typescript
export interface Project {
  id: string;
  name: string;
  mode: 'object' | 'room';
  status: 'uploading' | 'queued' | 'processing' | 'complete' | 'failed';
  photoCount: number;
  createdAt: string;
  updatedAt: string;
  modelUrl?: string;
  errorMessage?: string;
}
```

## Build and Deployment
1. Start the Colab notebook and copy the ngrok URL.
2. Update `.env` with `COLAB_NGROK_URL`.
3. Run `npm run dev` to start the local bridge.
