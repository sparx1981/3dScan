import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion } from 'motion/react';
import { X, Maximize2, Ruler, Box, Share2, Download, Layers, Zap } from 'lucide-react';
import { Project } from '../types';
import { cn } from '../lib/utils';

interface ModelViewerProps {
  project: Project;
  onClose: () => void;
}

export default function ModelViewer({ project, onClose }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(75, (width / height) || 1, 0.1, 1000);
    camera.position.set(3, 3, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width || window.innerWidth, height || window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const secondaryLight = new THREE.PointLight(0x4f46e5, 1);
    secondaryLight.position.set(-10, -5, -10);
    scene.add(secondaryLight);

    // Mock Geometry
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x111111
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const grid = new THREE.GridHelper(20, 20, 0xffffff, 0x333333);
    grid.position.y = -2;
    (grid.material as THREE.Material).opacity = 0.05;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    function handleResize() {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    // Wait for container to have size if it's 0 (common in some React lifecycle cases)
    if (width === 0 || height === 0) {
      setTimeout(handleResize, 100);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col">
      <header className="px-12 py-8 flex justify-between items-center bg-[#0a0a0a] border-b sophisticated-border absolute top-0 inset-x-0 z-10">
        <div className="flex items-center gap-8">
          <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div>
            <h2 className="font-serif italic text-2xl text-white leading-tight">{project.name}</h2>
            <p className="tracking-ultra text-white/40 mt-0.5">Asset Inspection Protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-white/40 hover:text-white transition-all active:scale-95">
            <Share2 size={18} />
          </button>
          <button className="bg-white text-black px-8 py-2.5 rounded-sm font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl">
            <Download size={14} />
            <span>Generate Export</span>
          </button>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 w-full h-full" />

      <footer className="absolute bottom-12 inset-x-0 flex justify-center pointer-events-none">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border sophisticated-border p-2 flex gap-2 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <ViewerTool icon={<Maximize2 size={18} />} active label="Inspect" />
          <ViewerTool icon={<Ruler size={18} />} label="Measure" />
          <ViewerTool icon={<Layers size={18} />} label="Structure" />
          <ViewerTool icon={<Zap size={18} />} label="Analysis" />
        </div>
      </footer>
    </div>
  );
}

function ViewerTool({ icon, active, label }: { icon: React.ReactNode, active?: boolean, label: string }) {
  return (
    <button className={cn(
      "w-12 h-12 flex items-center justify-center transition-all group relative",
      active ? "bg-white text-black" : "text-white/30 hover:text-white hover:bg-white/10"
    )}>
      {icon}
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border sophisticated-border text-white tracking-ultra px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {label}
      </span>
    </button>
  );
}
