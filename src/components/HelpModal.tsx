import React, { useState } from 'react';
import { X, BookOpen, ScrollText, Zap, Info, ChevronRight, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'user' | 'dev' | 'release'>('user');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl h-[80vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <header className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="bg-white/5 p-2 rounded-xl text-white">
              <BookOpen size={20} />
            </div>
            <h2 className="text-xl font-display font-bold">Help & Resources</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-zinc-800 p-4 space-y-2 overflow-y-auto hidden md:block">
            <TabButton 
              active={activeTab === 'user'} 
              onClick={() => setActiveTab('user')} 
              icon={<Info size={16} />} 
              label="User Guide" 
            />
            <TabButton 
              active={activeTab === 'dev'} 
              onClick={() => setActiveTab('dev')} 
              icon={<Zap size={16} />} 
              label="Developer Suite" 
            />
            <TabButton 
              active={activeTab === 'release'} 
              onClick={() => setActiveTab('release')} 
              icon={<ScrollText size={16} />} 
              label="Release Notes" 
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'user' && <UserDocumentation />}
            {activeTab === 'dev' && <DeveloperSuite />}
            {activeTab === 'release' && <ReleaseNotes />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
        active ? "bg-white text-black shadow-lg shadow-white/5" : "text-zinc-400 hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <ChevronRight size={14} className="ml-auto" />}
    </button>
  );
}

function UserDocumentation() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <section>
        <h3 className="text-white font-display font-bold text-2xl mb-4">Getting Started</h3>
        <p className="text-zinc-400 leading-relaxed mb-6">
          Welcome to the 3D Scan PWA. Follow these steps to create your first high-quality 3D reconstruction.
        </p>
        
        <div className="space-y-6">
          <DocStep 
            number="1" 
            title="Choose Your Mode" 
            desc="Select 'Object Mode' for isolated items like furniture or products. Use 'Room Mode' for interiors and layouts." 
          />
          <DocStep 
            number="2" 
            title="Establish Coverage" 
            desc="Move your camera steadily around your subject. The overlap meter must be in the Green zone for optimal results." 
          />
          <DocStep 
            number="3" 
            title="Monitor Overlap" 
            desc="Ensure at least 60% overlap between consecutive frames. Use the Ghosting overlay to align your next shot." 
          />
          <DocStep 
            number="4" 
            title="Cloud Processing" 
            desc="Tap 'Finish' once you have at least 5 photos. Your model will process in the background and notify you when ready." 
          />
        </div>
      </section>
    </div>
  );
}

function DocStep({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-white/5 border border-zinc-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
        {number}
      </div>
      <div>
        <h4 className="text-white font-display font-bold mb-1">{title}</h4>
        <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function DeveloperSuite() {
  const codeSnippet = `const project = await api.createProject("My Scan", "object");
await api.uploadPhoto(project.id, imageBlob);`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <section>
        <h3 className="text-white font-display font-bold text-2xl mb-4">REST API Integration</h3>
        <p className="text-zinc-400 text-sm mb-4">Interact with the reconstruction engine programmatically.</p>
        
        <div className="bg-black rounded-2xl p-6 border border-zinc-800 relative group">
          <pre className="text-emerald-400 font-mono text-sm overflow-x-auto">
            {codeSnippet}
          </pre>
          <button 
            onClick={() => navigator.clipboard.writeText(codeSnippet)}
            className="absolute top-4 right-4 p-2 bg-zinc-800 text-zinc-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
          >
            <Copy size={16} />
          </button>
        </div>
      </section>

      <section>
        <h4 className="text-white font-display font-bold mb-2">Endpoints</h4>
        <ul className="space-y-4">
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono text-xs font-bold uppercase py-1">POST</span>
            <span className="text-zinc-300 text-sm">/api/projects - Create session</span>
          </li>
          <li className="flex gap-3">
            <span className="text-blue-400 font-mono text-xs font-bold uppercase py-1">POST</span>
            <span className="text-zinc-300 text-sm">/api/projects/:id/upload - Add photo data</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

function ReleaseNotes() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-white font-display font-bold">2026-04-24</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>
        <ul className="space-y-4 list-disc list-inside text-zinc-400 text-sm leading-relaxed ml-2">
          <li>Initial v1.0 MVP release with Sophisticated Dark theme.</li>
          <li>Implemented standard Object and Room capture modes.</li>
          <li>Fixed 3D Viewer black-screen issue caused by missing icon imports.</li>
          <li>Improved mobile responsiveness and scrolling across Dashboard and App.</li>
          <li>Integrated Three.js interactive model viewer for STL/OBJ inspection.</li>
          <li>Simulated asynchronous background processing with Express server backend.</li>
        </ul>
      </div>
    </div>
  );
}
