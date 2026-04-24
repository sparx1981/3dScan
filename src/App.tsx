import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import CaptureView from './components/CaptureView';
import ModelViewer from './components/ModelViewer';
import HelpModal from './components/HelpModal';
import { HelpCircle } from 'lucide-react';
import { Project } from './types';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'capture' | 'viewer'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleStartCapture = () => setView('capture');
  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    setView('viewer');
  };
  const handleCloseBackToDashboard = () => setView('dashboard');

  return (
    <div className="antialiased font-sans bg-[#0a0a0a] text-[#e0e0e0] h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto relative">
        {view === 'dashboard' && (
          <>
            <Dashboard 
              onStartNewScan={handleStartCapture} 
              onOpenProject={handleOpenProject} 
            />
            <button 
              id="help-trigger"
              onClick={() => setShowHelp(true)}
              className="fixed bottom-6 right-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-zinc-400 hover:text-white shadow-2xl transition-all active:scale-95 z-40"
            >
              <HelpCircle size={24} />
            </button>
          </>
        )}
        
        {view === 'capture' && (
          <CaptureView onClose={handleCloseBackToDashboard} />
        )}
        
        {view === 'viewer' && selectedProject && (
          <ModelViewer 
            project={selectedProject} 
            onClose={handleCloseBackToDashboard} 
          />
        )}
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
