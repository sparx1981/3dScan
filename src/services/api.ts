import { Project } from "./types";

export const api = {
  async getProjects(): Promise<Project[]> {
    const res = await fetch("/api/projects");
    return res.json();
  },
  
  async createProject(name: string, mode: 'object' | 'room'): Promise<Project> {
    const res = await fetch("/api/projects", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mode })
    });
    return res.json();
  },
  
  async uploadPhoto(projectId: string, blob: Blob): Promise<Project> {
    // In a real app, we'd send the blob. For this demo, we just notify the server.
    const res = await fetch(`/api/projects/${projectId}/upload`, {
      method: 'POST'
    });
    return res.json();
  }
};
