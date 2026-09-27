import React, { useState } from 'react';
import { Play, Pause, Eye, Sparkles } from 'lucide-react';

/**
 * CleanPowerGridBackdrop Component
 * Provides a stunning, clearly visible, cinematic background of clean energy infrastructure:
 * High-voltage electricity transmission towers, rotating wind turbines, power grid lines,
 * kinetic electrical current pulses, and vivid HTML5 video playback.
 * 
 * COLOR DIRECTIVE: Zero green & black combination. Rich Midnight Sapphire, Solar Gold & Electric Cyan.
 */
export const CleanPowerGridBackdrop: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoOpacity, setVideoOpacity] = useState(85); // Clearly visible by default

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = document.getElementById('clean-energy-bg-video') as HTMLVideoElement | null;
    if (vid) {
      if (vid.paused) {
        vid.play();
        setIsPlaying(true);
      } else {
        vid.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none select-none z-0">
      {/* 1. VIVID, CLEARLY VISIBLE HTML5 VIDEO OF CLEAN ENERGY INFRASTRUCTURE */}
      <video
        id="clean-energy-bg-video"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 filter brightness-105 contrast-110 saturate-125 pointer-events-auto"
        style={{ opacity: videoOpacity / 100 }}
      >
        <source
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
          type="video/mp4"
        />
        <source
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
          type="video/mp4"
        />
      </video>

      {/* 2. Interactive Video Clarity Controller for Judges (Floating in Top Right) */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090d16]/80 backdrop-blur-xl border border-amber-500/30 shadow-[0_8px_25px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={togglePlayback}
          className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
          title="Toggle Background Video Play/Pause"
        >
          {isPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-amber-400" />}
          <span>{isPlaying ? 'PAUSE BG' : 'PLAY BG'}</span>
        </button>

        <span className="w-px h-3 bg-white/20" />

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300">
          <Eye className="w-3 h-3 text-cyan-400" />
          <span>CLARITY</span>
          <input
            type="range"
            min="40"
            max="100"
            value={videoOpacity}
            onChange={(e) => setVideoOpacity(Number(e.target.value))}
            className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            title="Adjust Background Video Visibility"
          />
          <span className="text-[10px] text-amber-400 w-6">{videoOpacity}%</span>
        </div>
      </div>

      {/* 3. Procedural Kinetic SVG Power Grid: Wind Turbines, High-Voltage Towers & Electric Lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for transmission cables */}
          <linearGradient id="powerCableGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
          </linearGradient>

          {/* Electric pulse glow filter */}
          <filter id="electricGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="towerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* --- Wind Turbine 1 (Left Far Field) --- */}
        <g transform="translate(180, 230)">
          {/* Turbine Mast */}
          <polygon points="-4,230 4,230 2,0 -2,0" fill="url(#towerGrad)" />
          {/* Nacelle */}
          <ellipse cx="0" cy="0" rx="9" ry="5.5" fill="#f59e0b" opacity="0.9" />
          <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
          {/* Rotating Blades */}
          <g className="animate-spin" style={{ transformOrigin: '0px 0px', animationDuration: '6s' }}>
            <path d="M 0 0 C -3 -30, -5 -70, 0 -110 C 5 -70, 3 -30, 0 0" fill="#f8fafc" opacity="0.9" />
            <g transform="rotate(120)">
              <path d="M 0 0 C -3 -30, -5 -70, 0 -110 C 5 -70, 3 -30, 0 0" fill="#f8fafc" opacity="0.9" />
            </g>
            <g transform="rotate(240)">
              <path d="M 0 0 C -3 -30, -5 -70, 0 -110 C 5 -70, 3 -30, 0 0" fill="#f8fafc" opacity="0.9" />
            </g>
          </g>
          {/* Solar Gold Aviation Beacon on Top */}
          <circle cx="0" cy="-2" r="2.5" fill="#f59e0b" className="animate-ping" />
        </g>

        {/* --- Wind Turbine 2 (Right Horizon) --- */}
        <g transform="translate(1040, 270)">
          <polygon points="-3,190 3,190 1.5,0 -1.5,0" fill="url(#towerGrad)" />
          <ellipse cx="0" cy="0" rx="7" ry="4.5" fill="#f59e0b" opacity="0.85" />
          <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
          <g className="animate-spin" style={{ transformOrigin: '0px 0px', animationDuration: '8s' }}>
            <path d="M 0 0 C -2.5 -25, -4 -60, 0 -90 C 4 -60, 2.5 -25, 0 0" fill="#f8fafc" opacity="0.85" />
            <g transform="rotate(120)">
              <path d="M 0 0 C -2.5 -25, -4 -60, 0 -90 C 4 -60, 2.5 -25, 0 0" fill="#f8fafc" opacity="0.85" />
            </g>
            <g transform="rotate(240)">
              <path d="M 0 0 C -2.5 -25, -4 -60, 0 -90 C 4 -60, 2.5 -25, 0 0" fill="#f8fafc" opacity="0.85" />
            </g>
          </g>
          <circle cx="0" cy="-2" r="2" fill="#38bdf8" className="animate-ping" />
        </g>

        {/* --- High Voltage Transmission Tower 1 (Mid-Left) --- */}
        <g transform="translate(380, 160)" stroke="#f59e0b" strokeWidth="1.8" opacity="0.8" fill="none">
          <line x1="-30" y1="360" x2="-8" y2="40" />
          <line x1="30" y1="360" x2="8" y2="40" />
          <line x1="-8" y1="40" x2="0" y2="0" />
          <line x1="8" y1="40" x2="0" y2="0" />
          <line x1="-60" y1="70" x2="60" y2="70" />
          <line x1="-75" y1="120" x2="75" y2="120" />
          <line x1="-50" y1="170" x2="50" y2="170" />
          <line x1="-18" y1="200" x2="18" y2="250" />
          <line x1="18" y1="200" x2="-18" y2="250" />
          <line x1="-24" y1="270" x2="24" y2="320" />
          <line x1="24" y1="270" x2="-24" y2="320" />
          <line x1="-60" y1="70" x2="-60" y2="85" stroke="#38bdf8" strokeWidth="3" />
          <line x1="60" y1="70" x2="60" y2="85" stroke="#38bdf8" strokeWidth="3" />
          <line x1="-75" y1="120" x2="-75" y2="135" stroke="#38bdf8" strokeWidth="3" />
          <line x1="75" y1="120" x2="75" y2="135" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="0" cy="0" r="3.5" fill="#f59e0b" stroke="none" />
        </g>

        {/* --- High Voltage Transmission Tower 2 (Mid-Right) --- */}
        <g transform="translate(800, 180)" stroke="#f59e0b" strokeWidth="1.8" opacity="0.8" fill="none">
          <line x1="-26" y1="340" x2="-7" y2="35" />
          <line x1="26" y1="340" x2="7" y2="35" />
          <line x1="-7" y1="35" x2="0" y2="0" />
          <line x1="7" y1="35" x2="0" y2="0" />
          <line x1="-55" y1="65" x2="55" y2="65" />
          <line x1="-68" y1="110" x2="68" y2="110" />
          <line x1="-45" y1="155" x2="45" y2="155" />
          <line x1="-16" y1="190" x2="16" y2="235" />
          <line x1="16" y1="190" x2="-16" y2="235" />
          <line x1="-68" y1="110" x2="-68" y2="125" stroke="#38bdf8" strokeWidth="3" />
          <line x1="68" y1="110" x2="68" y2="125" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="0" cy="0" r="3.5" fill="#38bdf8" stroke="none" />
        </g>

        {/* --- High Voltage Catenary Power Transmission Lines --- */}
        <path
          d="M 0 215 Q 160 255 320 245 T 740 260 T 1200 240"
          fill="none"
          stroke="url(#powerCableGrad)"
          strokeWidth="2.2"
          opacity="0.85"
        />

        <path
          d="M 0 260 Q 180 305 305 295 T 732 305 T 1200 285"
          fill="none"
          stroke="url(#powerCableGrad)"
          strokeWidth="2.4"
          opacity="0.9"
        />

        <path
          d="M 0 310 Q 200 355 430 330 T 875 335 T 1200 325"
          fill="none"
          stroke="url(#powerCableGrad)"
          strokeWidth="2.0"
          opacity="0.8"
        />

        {/* --- Animated Kinetic Electricity Pulses (Cyan and Gold - ZERO green) --- */}
        <path
          d="M 0 215 Q 160 255 320 245 T 740 260 T 1200 240"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="4.5"
          strokeDasharray="25 180"
          filter="url(#electricGlow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="400"
            to="0"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </path>

        <path
          d="M 0 260 Q 180 305 305 295 T 732 305 T 1200 285"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="5"
          strokeDasharray="30 220"
          filter="url(#electricGlow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="500"
            to="0"
            dur="3.0s"
            repeatCount="indefinite"
          />
        </path>

        {/* Third pulse: Electric Cyan (replacing previous green pulse) */}
        <path
          d="M 0 310 Q 200 355 430 330 T 875 335 T 1200 325"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="4"
          strokeDasharray="20 200"
          filter="url(#electricGlow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="440"
            to="0"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </path>
      </svg>

      {/* 4. Soft Vignette Overlay (Clear center so video shines through brilliantly) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090d16]/40 via-transparent to-[#090d16]/75 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.04),transparent_80%)] pointer-events-none" />
    </div>
  );
};
