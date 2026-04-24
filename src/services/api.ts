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
    const formData = new FormData();
    formData.append('image', blob, 'photo.jpg');
    
    const res = await fetch(`/api/projects/${projectId}/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async finishScan(projectId: string): Promise<Project> {
    const res = await fetch(`/api/projects/${projectId}/finish`, {
      method: 'POST'
    });
    
    if (res.status === 503) {
      throw new Error('COLAB_OFFLINE');
    }
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'PROCESSING_FAILED');
    }
    
    return res.json();
  }
};
