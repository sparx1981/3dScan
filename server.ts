import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Mock API for 3D Projects
  const projects = new Map();

  app.get("/api/projects", (req, res) => {
    res.json(Array.from(projects.values()));
  });

  app.post("/api/projects", (req, res) => {
    const { name, mode } = req.body;
    const id = Math.random().toString(36).substring(7);
    const newProject = {
      id,
      name,
      mode,
      status: 'uploading',
      photoCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.set(id, newProject);
    res.json(newProject);
  });

  app.post("/api/projects/:id/upload", (req, res) => {
    const project = projects.get(req.params.id);
    if (!project) return res.status(404).send("Not found");
    
    project.photoCount += 1;
    project.updatedAt = new Date().toISOString();
    
    // Auto-transition to processing after 5 photos in this demo
    if (project.photoCount >= 5 && project.status === 'uploading') {
      project.status = 'queued';
      setTimeout(() => {
        project.status = 'processing';
        project.updatedAt = new Date().toISOString();
        
        setTimeout(() => {
          project.status = 'complete';
          project.updatedAt = new Date().toISOString();
        }, 15000); // 15s processing simulation
      }, 5000); // 5s queue simulation
    }
    
    res.json(project);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
