import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, LayoutGrid, Settings, Box, Trash2, Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';
import { cn, formatDate } from '../lib/utils';

interface DashboardProps {
  onStartNewScan: () => void;
  onOpenProject: (project: Project) => void;
}

export default function Dashboard({ onStartNewScan, onOpenProject }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
    const interval = setInterval(loadProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <nav className="flex items-center justify-between px-6 md:px-12 py-6 md:py-8 border-b sophisticated-border sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm">
            <div className="w-4 h-4 border-2 border-black rotate-45"></div>
          </div>
          <span className="text-xl tracking-[0.2em] font-light uppercase text-white">RECON</span>
        </div>
        <div className="hidden md:flex space-x-10 tracking-ultra text-white/50">
          <button className="hover:text-white transition-colors">Archive</button>
          <button className="hover:text-white transition-colors">Settings</button>
          <button className="hover:text-white transition-colors text-white">Project List</button>
        </div>
      </nav>

      <div className="flex-1 px-6 md:px-12 py-12 md:py-16 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <div className="max-w-2xl">
            <h2 className="tracking-ultra text-white/40 mb-4">Capturing Reality</h2>
            <h1 className="font-serif text-5xl md:text-7xl italic font-light text-white leading-tight">
              Elegance <br className="hidden md:block"/> <span className="md:ml-20">in Reconstruction.</span>
            </h1>
          </div>
          <button
            id="btn-new-scan"
            onClick={onStartNewScan}
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-black px-8 py-4 md:py-3 rounded-sm font-medium hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
          >
            <Plus size={18} />
            <span className="uppercase text-xs tracking-widest font-bold">New Scan</span>
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 pb-32">
          <AnimatePresence mode="popLayout">
            {projects.map((project) => (
              <motion.div
                layout
                id={`project-${project.id}`}
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => project.status === 'complete' && onOpenProject(project)}
                className={cn(
                  "group relative flex flex-col cursor-pointer",
                  project.status !== 'complete' && "cursor-default"
                )}
              >
                <div className="aspect-[4/3] bg-white/[0.02] border sophisticated-border flex items-center justify-center relative overflow-hidden">
                  {project.status === 'complete' ? (
                    <Box className="w-16 h-16 text-white/10 group-hover:text-white/30 transition-all duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-px bg-white/20 animate-pulse" />
                      <span className="tracking-ultra text-white/30">
                        {project.status === 'complete' ? 'Simulation Ready' : project.status}
                      </span>
                    </div>
                  )}
                  
                  <div className="absolute top-6 right-6">
                    <StatusBadge status={project.status} />
                  </div>
                </div>

                <div className="pt-6 border-t sophisticated-border mt-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif italic text-xl text-white group-hover:translate-x-1 transition-transform">{project.name}</h3>
                    <span className="tracking-ultra text-white/40">
                      {project.mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-white/30 tracking-ultra text-[9px]">
                    <div className="flex items-center gap-2">
                      <Clock size={10} />
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={10} />
                      <span>{project.photoCount} Captures</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {projects.length === 0 && !loading && (
            <div className="col-span-full py-32 flex flex-col items-center text-center border sophisticated-border bg-white/[0.01]">
              <Box size={40} className="mb-6 opacity-10" />
              <h3 className="text-xl font-serif italic text-white/40">The archive is empty</h3>
              <p className="tracking-ultra text-white/20 mt-4 max-w-xs uppercase">
                Initiate capture sequence to populate.
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="px-6 md:px-12 py-8 border-t sophisticated-border flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01] mt-auto">
        <div className="flex items-center space-x-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="tracking-ultra text-white/30">System Operational</span>
        </div>
        <div className="flex space-x-8 tracking-ultra text-white/20">
          <span>Security Protocol 4.1</span>
          <span className="text-white/50">© 2026 RECON GROUP</span>
        </div>
      </footer>
    </div>
  );
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const styles = {
    uploading: "text-blue-400",
    queued: "text-amber-400",
    processing: "text-indigo-400",
    complete: "text-emerald-400",
    failed: "text-red-400",
  };

  return (
    <div className={cn("tracking-ultra text-[8px] flex items-center gap-2", styles[status])}>
      <div className={cn("w-1 h-1 rounded-full bg-current", status === 'uploading' || status === 'processing' ? 'animate-ping' : '')}></div>
      <span>{status}</span>
    </div>
  );
}
