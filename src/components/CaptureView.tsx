import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, RotateCcw, Box, Home, Zap, Layers, Check } from 'lucide-react';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import { Project } from '../types';

interface CaptureViewProps {
  onClose: () => void;
}

export default function CaptureView({ onClose }: CaptureViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<'mode' | 'capture' | 'review'>('mode');
  const [mode, setMode] = useState<'object' | 'room'>('object');
  const [project, setProject] = useState<Project | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [overlap, setOverlap] = useState(0); // 0 to 100
  const [isCapturing, setIsCapturing] = useState(false);
  const [ghostImage, setGhostImage] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'offline' | 'failed'>('idle');

  useEffect(() => {
    if (step === 'capture') {
      startCamera();
      const interval = setInterval(() => {
        // Simulate overlap change
        setOverlap(prev => (prev + (Math.random() * 20)) % 100);
      }, 500);
      return () => {
        stopCamera();
        clearInterval(interval);
      };
    }
  }, [step]);

  const dataUrlToBlob = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      // Removed alert as per guidelines, but keeping functional error handling
      onClose();
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const handleStartProject = async (selectedMode: 'object' | 'room') => {
    setMode(selectedMode);
    const name = `Scan ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newProject = await api.createProject(name, selectedMode);
    setProject(newProject);
    setStep('capture');
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !project) return;
    
    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setGhostImage(dataUrl);
    setPhotos(prev => [...prev, dataUrl]); // Store all photos for batch upload
    
    // Just update UI count locally, real upload happens on Finish
    setProject(prev => prev ? { ...prev, photoCount: prev.photoCount + 1 } : null);
    
    setTimeout(() => setIsCapturing(false), 200);
  };

  const handleFinish = async () => {
    if (!project) return;
    
    if (photos.length < 5) {
      alert("Please take at least 5 photos for a minimal reconstruction.");
      return;
    }

    try {
      setProcessingState('uploading');
      
      // Upload all photos sequentially
      for (const photo of photos) {
        const blob = dataUrlToBlob(photo);
        await api.uploadPhoto(project.id, blob);
      }

      setProcessingState('processing');
      await api.finishScan(project.id);
      
      setProcessingState('done');
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error("Finish error:", err);
      if (err.message === 'COLAB_OFFLINE') {
        setProcessingState('offline');
      } else {
        setProcessingState('failed');
      }
    }
  };

  if (step === 'mode') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col p-6 pt-16">
        <button onClick={onClose} className="absolute top-6 left-6 text-zinc-500 hover:text-white">
          <X size={24} id="close-mode-btn" />
        </button>
        
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-display font-bold mb-2">Choose Mode</h2>
          <p className="text-zinc-500 text-sm">Select the best algorithm for your subject</p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto w-full">
          <CaptureModeCard 
            icon={<Box size={32} />}
            title="Object Mode"
            description="Best for furniture, products, and isolated items. Orbit around the subject."
            onClick={() => handleStartProject('object')}
          />
          <CaptureModeCard 
            icon={<Home size={32} />}
            title="Room Mode"
            description="Best for interiors and layouts. Walk through the space naturally."
            onClick={() => handleStartProject('room')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      {/* Viewfinder */}
      <div className="relative flex-1 bg-zinc-900 overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Ghost Overlay */}
        <AnimatePresence>
          {ghostImage && (
            <motion.img
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 2 }}
              src={ghostImage}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen"
            />
          )}
        </AnimatePresence>

        {/* UI Overlays */}
        <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-start">
          <button onClick={onClose} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white">
            <X size={20} id="close-capture-inner-btn" />
          </button>
          
          <div className="flex flex-col items-end gap-2">
            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mr-2">Overlap</span>
              <div className="inline-flex w-24 h-1.5 bg-white/10 rounded-full overflow-hidden align-middle">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${overlap}%` }}
                  className={cn(
                    "h-full transition-colors",
                    overlap > 60 ? "bg-emerald-400" : overlap > 40 ? "bg-amber-400" : "bg-red-400"
                  )}
                />
              </div>
            </div>
            {overlap > 60 && <p className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded uppercase tracking-widest">Optimal</p>}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute inset-x-0 bottom-0 p-8 pb-12 flex flex-col items-center gap-8">
          <div className="flex items-end gap-12">
            <button className="flex flex-col items-center gap-1 text-white/40 mb-4 transition-colors hover:text-white">
              <Layers size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Ghost</span>
            </button>

            <button 
              onClick={capturePhoto}
              className="relative group"
              id="capture-button"
            >
              <div className="absolute -inset-2 bg-white/20 rounded-full blur group-active:scale-125 transition-transform" />
              <div className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent group-active:scale-95 transition-transform">
                <div className={cn("w-16 h-16 rounded-full transition-all", isCapturing ? "bg-white/40" : "bg-white")} />
              </div>
            </button>

            <button 
              onClick={handleFinish}
              className="flex flex-col items-center gap-1 text-white/40 mb-4 transition-colors hover:text-white"
              id="finish-btn"
            >
              <Check size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Finish</span>
            </button>
          </div>

          <div className="flex gap-4">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Photos</span>
              <span className="text-xl font-display font-bold leading-none">{project?.photoCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Processing Overlay */}
      <AnimatePresence>
        {processingState !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-8 text-center"
          >
            {processingState === 'uploading' && (
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Uploading Photos</h3>
                  <p className="text-white/50 text-sm">Sending data to the processing server...</p>
                </div>
              </div>
            )}

            {processingState === 'processing' && (
              <div className="flex flex-col items-center gap-6 max-w-xs">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-white/10 p-6 rounded-full"
                >
                  <Box size={48} className="text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Generating Model</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Generating your 3D model. This takes 5–15 minutes. Don't close this screen.
                  </p>
                </div>
              </div>
            )}

            {processingState === 'done' && (
              <div className="flex flex-col items-center gap-6">
                <div className="bg-emerald-500 p-6 rounded-full">
                  <Check size={48} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-emerald-400">Model Ready</h3>
                  <p className="text-white/50 text-sm">Opening viewer...</p>
                </div>
              </div>
            )}

            {processingState === 'offline' && (
              <div className="flex flex-col items-center gap-6">
                <div className="bg-amber-500/20 p-6 rounded-full border border-amber-500/50">
                  <Zap size={48} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Engine Offline</h3>
                  <p className="text-white/50 text-sm mb-6">Processing engine is offline. Start the Colab notebook and tap Retry.</p>
                  <button 
                    onClick={handleFinish}
                    className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            )}

            {processingState === 'failed' && (
              <div className="flex flex-col items-center gap-6">
                <div className="bg-red-500/20 p-6 rounded-full border border-red-500/50">
                  <RotateCcw size={48} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest mb-2">Reconstruction Failed</h3>
                  <p className="text-white/50 text-sm mb-6 leading-relaxed">
                    Try again with more photos, better lighting, and slower movement around the subject.
                  </p>
                  <button 
                    onClick={() => {
                      setProcessingState('idle');
                      onClose();
                    }}
                    className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function CaptureModeCard({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full glass-touch p-6 rounded-3xl text-left flex items-start gap-5 hover:bg-zinc-800 transition-colors active:scale-95"
    >
      <div className="bg-white/5 p-4 rounded-2xl text-white">
        {icon}
      </div>
      <div>
        <h3 className="font-display font-bold text-xl mb-1">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
