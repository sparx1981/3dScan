# 3D Scan PWA - Product Specification

> **Last Updated:** 2026-04-24 | **Changed:** Fixed 3D viewer rendering and improved mobile responsiveness.

## Overview
3D Scan PWA is a mobile-first Progressive Web App designed to capture objects and rooms using standard RGB cameras and reconstruct them into 3D models via cloud photogrammetry.

## Architecture and File Structure
- `node_modules/`: Project dependencies.
- `src/`:
  - `components/`: UI components (Dashboard, CaptureView, ModelViewer).
  - `services/`: API client services.
  - `lib/`: Utility functions and formatting.
  - `types.ts`: Global TypeScript interfaces.
  - `App.tsx`: Main view router and state manager.
  - `index.css`: Global styles and typography (Inter + Space Grotesk).
- `server.ts`: Express backend simulating the reconstruction pipeline.
- `package.json`: Build scripts and dependencies.

## Core Features
- **Express Backend Simulation**: Handles project states (uploading -> queued -> processing -> complete).
- **Hybrid Viewfinder**: 
  - Real-time overlap meter with color-coded feedback (Red/Amber/Green).
  - Transient ghosting overlay for frame alignment.
- **Three.js Model Viewer**: Orbit-controlled 3D viewer with grid helpers.

## API Surface
### Projects API
- `GET /api/projects`: List all reconstructions.
- `POST /api/projects`: Initialize a new scan session.
- `POST /api/projects/:id/upload`: Simulate photo ingestion and trigger state machine.
