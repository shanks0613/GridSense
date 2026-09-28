import React, { useState, useRef, useEffect } from 'react';
import cleanBackdropImg from '../assets/images/clean_energy_backdrop_1790606804362.jpg';

interface CleanPowerGridBackdropProps {
  className?: string;
}

/**
 * CleanPowerGridBackdrop Component
 * 
 * Cinematic clean energy background in Deep Slate & Electric Copper:
 * - Clarity fixed to exactly 26% so the video blends seamlessly with the backdrop images
 * - Background clarity bar completely removed as requested
 * - Kinetic SVG electrical grid: rotating wind turbines, high-voltage transmission towers,
 *   catenary cables, and traveling current pulses in Electric Copper & Warm Bronze.
 * - STRICT COMPLIANCE: No blue, no black, no green, no golden, no yellow.
 */
export const CleanPowerGridBackdrop: React.FC<CleanPowerGridBackdropProps> = ({
  className = '',
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fixed clarity set exactly to 26% as specified by user
  const clarity = 26;

  // Keep video playing reliably
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.muted = true;
      vid.playsInline = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, []);

  // Visual parameters calibrated for 26% clarity for seamless image blending
  const opacityVal = clarity / 100; // 0.26
  const brightnessVal = 0.75 + (clarity / 100) * 0.55; // ~0.893
  const contrastVal = 0.9 + (clarity / 100) * 0.35; // ~0.991
  const vignetteOpacity = 0.55;

  return (
    <div
      className={`absolute inset-0 rounded-3xl overflow-hidden pointer-events-none select-none z-0 ${className}`}
      data-testid="clean-power-grid-backdrop"
    >
      {/* 1. PHOTOREALISTIC HIGH-RES POSTER (Visible immediately, blended at 26%) */}
      <img
        src={cleanBackdropImg}
        alt="Clean Power Grid Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          opacity: opacityVal,
          filter: `brightness(${brightnessVal}) contrast(${contrastVal}) saturate(1.1)`,
          transition: 'opacity 0.2s ease-out',
        }}
      />

      {/* 2. LOCAL HTML5 VIDEO (Blended seamlessly at 26% opacity with screen mix-blend) */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen"
        style={{
          opacity: videoLoaded ? opacityVal * 0.9 : 0,
          filter: `brightness(${brightnessVal}) contrast(${contrastVal})`,
          transition: 'opacity 0.2s ease-out',
        }}
      >
        <source src="/videos/clean_energy_grid.mp4" type="video/mp4" />
        <source src="/videos/sample_energy.mp4" type="video/mp4" />
      </video>

      {/* 3. VECTOR TRANSMISSION GRID (Deep Slate & Electric Copper currents) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        style={{
          opacity: 0.38,
        }}
      >
        <defs>
          <linearGradient id="powerCableCopperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c2572b" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#e06d3b" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#f07e48" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ff8a50" stopOpacity="0.85" />
          </linearGradient>

          <filter id="copperPylonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.0" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- Wind Turbine 1 (West High Ridge) --- */}
        <g transform="translate(140, 260)" opacity="0.85">
          {/* Aerodynamic Mast */}
          <polygon points="-4,220 4,220 2,0 -2,0" fill="#e2e8f0" opacity="0.8" />
          <circle cx="0" cy="0" r="5.5" fill="#e06d3b" />
          {/* Animated 3-Blade Rotor */}
          <g
            className="origin-center"
            style={{
              animation: 'spin 5.5s linear infinite',
              transformOrigin: '0px 0px',
            }}
          >
            <path d="M 0 0 C -3.5 -30, -5 -80, 0 -130 C 5 -80, 3.5 -30, 0 0" fill="#f8fafc" opacity="0.9" />
            <g transform="rotate(120)">
              <path d="M 0 0 C -3.5 -30, -5 -80, 0 -130 C 5 -80, 3.5 -30, 0 0" fill="#f8fafc" opacity="0.9" />
            </g>
            <g transform="rotate(240)">
              <path d="M 0 0 C -3.5 -30, -5 -80, 0 -130 C 5 -80, 3.5 -30, 0 0" fill="#f8fafc" opacity="0.9" />
            </g>
          </g>
          <circle cx="0" cy="-2" r="3.5" fill="#f07e48" className="animate-ping" />
        </g>

        {/* --- Wind Turbine 2 (Central Ridge) --- */}
        <g transform="translate(620, 290)" opacity="0.75">
          <polygon points="-3,190 3,190 1.5,0 -1.5,0" fill="#cbd5e1" opacity="0.75" />
          <circle cx="0" cy="0" r="4.5" fill="#e06d3b" />
          <g
            className="origin-center"
            style={{
              animation: 'spin 6.8s linear infinite',
              transformOrigin: '0px 0px',
            }}
          >
            <path d="M 0 0 C -3 -25, -4 -65, 0 -105 C 4 -65, 3 -25, 0 0" fill="#f8fafc" opacity="0.85" />
            <g transform="rotate(120)">
              <path d="M 0 0 C -3 -25, -4 -65, 0 -105 C 4 -65, 3 -25, 0 0" fill="#f8fafc" opacity="0.85" />
            </g>
            <g transform="rotate(240)">
              <path d="M 0 0 C -3 -25, -4 -65, 0 -105 C 4 -65, 3 -25, 0 0" fill="#f8fafc" opacity="0.85" />
            </g>
          </g>
          <circle cx="0" cy="-2" r="3" fill="#ff8a50" className="animate-ping" />
        </g>

        {/* --- Wind Turbine 3 (Far East Plateau) --- */}
        <g transform="translate(1080, 270)" opacity="0.8">
          <polygon points="-3.5,210 3.5,210 1.8,0 -1.8,0" fill="#e2e8f0" opacity="0.8" />
          <circle cx="0" cy="0" r="5" fill="#e06d3b" />
          <g
            className="origin-center"
            style={{
              animation: 'spin 5.0s linear infinite',
              transformOrigin: '0px 0px',
            }}
          >
            <path d="M 0 0 C -2.5 -25, -4 -60, 0 -95 C 4 -60, 2.5 -25, 0 0" fill="#f8fafc" opacity="0.85" />
            <g transform="rotate(120)">
              <path d="M 0 0 C -2.5 -25, -4 -60, 0 -95 C 4 -60, 2.5 -25, 0 0" fill="#f8fafc" opacity="0.85" />
            </g>
            <g transform="rotate(240)">
              <path d="M 0 0 C -2.5 -25, -4 -60, 0 -95 C 4 -60, 2.5 -25, 0 0" fill="#f8fafc" opacity="0.85" />
            </g>
          </g>
          <circle cx="0" cy="-2" r="2.5" fill="#f07e48" className="animate-ping" />
        </g>

        {/* --- High Voltage Transmission Pylon 1 --- */}
        <g transform="translate(390, 150)" stroke="#e06d3b" strokeWidth="2" opacity="0.8" fill="none">
          <line x1="-32" y1="370" x2="-8" y2="40" />
          <line x1="32" y1="370" x2="8" y2="40" />
          <line x1="-8" y1="40" x2="0" y2="0" />
          <line x1="8" y1="40" x2="0" y2="0" />
          <line x1="-65" y1="70" x2="65" y2="70" />
          <line x1="-80" y1="120" x2="80" y2="120" />
          <line x1="-55" y1="170" x2="55" y2="170" />
          <line x1="-18" y1="200" x2="18" y2="260" />
          <line x1="18" y1="200" x2="-18" y2="260" />
          <line x1="-24" y1="270" x2="24" y2="330" />
          <line x1="24" y1="270" x2="-24" y2="330" />
          {/* Ceramic Insulator Strings (Electric Copper) */}
          <line x1="-65" y1="70" x2="-65" y2="86" stroke="#f07e48" strokeWidth="3" />
          <line x1="65" y1="70" x2="65" y2="86" stroke="#f07e48" strokeWidth="3" />
          <line x1="-80" y1="120" x2="-80" y2="136" stroke="#f07e48" strokeWidth="3" />
          <line x1="80" y1="120" x2="80" y2="136" stroke="#f07e48" strokeWidth="3" />
          <circle cx="0" cy="0" r="3.5" fill="#e06d3b" stroke="none" />
        </g>

        {/* --- High Voltage Transmission Pylon 2 --- */}
        <g transform="translate(820, 170)" stroke="#e06d3b" strokeWidth="2" opacity="0.8" fill="none">
          <line x1="-28" y1="350" x2="-7" y2="35" />
          <line x1="28" y1="350" x2="7" y2="35" />
          <line x1="-7" y1="35" x2="0" y2="0" />
          <line x1="7" y1="35" x2="0" y2="0" />
          <line x1="-58" y1="65" x2="58" y2="65" />
          <line x1="-72" y1="110" x2="72" y2="110" />
          <line x1="-48" y1="155" x2="48" y2="155" />
          <line x1="-16" y1="190" x2="16" y2="245" />
          <line x1="16" y1="190" x2="-16" y2="245" />
          <line x1="-72" y1="110" x2="-72" y2="126" stroke="#f07e48" strokeWidth="3" />
          <line x1="72" y1="110" x2="72" y2="126" stroke="#f07e48" strokeWidth="3" />
          <circle cx="0" cy="0" r="3.5" fill="#f07e48" stroke="none" />
        </g>

        {/* --- Catenary Power Transmission Cables --- */}
        <path
          d="M 0 215 Q 160 255 325 245 T 748 260 T 1200 240"
          fill="none"
          stroke="url(#powerCableCopperGrad)"
          strokeWidth="2.5"
          opacity="0.9"
        />
        <path
          d="M 0 260 Q 180 305 310 295 T 740 305 T 1200 285"
          fill="none"
          stroke="url(#powerCableCopperGrad)"
          strokeWidth="2.8"
          opacity="0.95"
        />
        <path
          d="M 0 310 Q 200 355 435 330 T 880 335 T 1200 325"
          fill="none"
          stroke="url(#powerCableCopperGrad)"
          strokeWidth="2.2"
          opacity="0.85"
        />

        {/* --- Kinetic Electrical Current Pulses (Electric Copper & Bronze Glow) --- */}
        <path
          d="M 0 215 Q 160 255 325 245 T 748 260 T 1200 240"
          fill="none"
          stroke="#ff8a50"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="40 500"
          opacity="0.9"
          filter="url(#copperPylonGlow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="540"
            to="0"
            dur="1.7s"
            repeatCount="indefinite"
          />
        </path>

        <path
          d="M 0 260 Q 180 305 310 295 T 740 305 T 1200 285"
          fill="none"
          stroke="#f07e48"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="50 540"
          opacity="0.95"
          filter="url(#copperPylonGlow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="590"
            to="0"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </path>

        <path
          d="M 0 310 Q 200 355 435 330 T 880 335 T 1200 325"
          fill="none"
          stroke="#e06d3b"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="35 450"
          opacity="0.85"
          filter="url(#copperPylonGlow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="490"
            to="0"
            dur="2.1s"
            repeatCount="indefinite"
          />
        </path>
      </svg>

      {/* 4. SOFT ATMOSPHERIC VIGNETTE (Deep Slate #18181c, perfectly blending with the card container) */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#18181c] via-transparent to-[#18181c] pointer-events-none"
        style={{
          opacity: vignetteOpacity,
          transition: 'opacity 0.2s ease-out',
        }}
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(224,109,59,0.08),transparent_75%)] pointer-events-none"
        style={{ opacity: opacityVal }}
      />
    </div>
  );
};
