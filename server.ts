import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp directory exists
const UPLOAD_ROOT = '/tmp/scans';
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.id;
    const projectPath = path.join(UPLOAD_ROOT, projectId);
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    cb(null, projectPath);
  },
  filename: (req, file, cb) => {
    const projectPath = path.join(UPLOAD_ROOT, req.params.id);
    const count = fs.readdirSync(projectPath).length + 1;
    cb(null, `photo_${count.toString().padStart(3, '0')}.jpg`);
  }
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Mock API for 3D Projects
  interface Project {
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
  
  const projects = new Map<string, Project>();

  app.get("/api/projects", (req, res) => {
    res.json(Array.from(projects.values()));
  });

  app.post("/api/projects", (req, res) => {
    const { name, mode } = req.body;
    const id = Math.random().toString(36).substring(7);
    const newProject: Project = {
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

  // Proxy to Colab health
  app.get("/api/colab-status", async (req, res) => {
    const colabUrl = process.env.COLAB_NGROK_URL;
    if (!colabUrl) {
      return res.json({ status: "offline", error: "COLAB_NGROK_URL not set" });
    }
    try {
      const response = await fetch(`${colabUrl}/health`, { signal: AbortSignal.timeout(10000) });
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.json({ status: "offline", error: "Could not connect to Colab" });
    }
  });

  app.post("/api/projects/:id/upload", upload.single('image'), (req, res) => {
    const project = projects.get(req.params.id);
    if (!project) return res.status(404).send("Not found");
    
    project.photoCount += 1;
    project.updatedAt = new Date().toISOString();
    
    res.json(project);
  });

  app.post("/api/projects/:id/finish", async (req, res) => {
    const project = projects.get(req.params.id);
    if (!project) return res.status(404).send("Not found");

    const colabUrl = process.env.COLAB_NGROK_URL;
    if (!colabUrl) {
      project.status = 'failed';
      project.errorMessage = 'Processing engine URL not configured';
      return res.status(503).json({ error: "3D processing is currently offline. Please start the Colab notebook and try again." });
    }

    project.status = 'queued';
    project.updatedAt = new Date().toISOString();

    try {
      // Step 1: Check health
      const healthRes = await fetch(`${colabUrl}/health`, { signal: AbortSignal.timeout(10000) });
      if (!healthRes.ok) throw new Error("Offline");

      project.status = 'processing';
      project.updatedAt = new Date().toISOString();

      // Step 2: Prepare images
      const projectPath = path.join(UPLOAD_ROOT, project.id);
      const files = fs.readdirSync(projectPath);
      
      const formData = new FormData();
      for (const file of files) {
        const filePath = path.join(projectPath, file);
        const buffer = fs.readFileSync(filePath);
        formData.append('images', new Blob([buffer]), file);
      }

      // Step 3: POST to Colab
      const processRes = await fetch(`${colabUrl}/process`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(1500000) // 25 minutes
      });

      const result: any = await processRes.json();

      if (result.status === 'complete') {
     project.modelUrl = result.obj_url || result.obj_path;
console.log("Colab result received:", JSON.stringify(result));
        project.status = 'complete';
        project.updatedAt = new Date().toISOString();
        
        // Cleanup
        fs.rmSync(projectPath, { recursive: true, force: true });
        
        res.json(project);
      } else {
        project.status = 'failed';
        project.errorMessage = result.error || 'Unknown error occurred in Colab';
        res.status(500).json({ error: project.errorMessage });
      }
    } catch (err: any) {
      console.error("Processing failure:", err);
      project.status = 'failed';
      project.errorMessage = err.name === 'TimeoutError' ? 'Processing timed out' : 'Connection to processing engine lost';
      res.status(500).json({ error: project.errorMessage });
    }
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
