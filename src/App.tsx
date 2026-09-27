import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Sliders,
  Check,
  Eye,
  RotateCcw,
  Building,
  PanelRightClose,
  PanelRightOpen,
  Camera,
  Sun,
  Flame,
  Glasses,
  Radio,
  Cpu,
} from 'lucide-react';
import { OfficeModel3D, HoveredFloorData } from './components/OfficeModel3D';
import { SensorViewer3D } from './components/SensorViewer3D';
import { CabinControlsPanel } from './components/CabinControlsPanel';
import { ModelViewControls, AudioToggleHeaderButton } from './components/ModelViewControls';
import { AIInsightPanel } from './components/AIInsightPanel';
import { CleanPowerGridBackdrop } from './components/CleanPowerGridBackdrop';
import { SchneiderGlobalFleetModal } from './components/SchneiderGlobalFleetModal';
import { INITIAL_CABINS } from './data/initialCabins';
import { CabinData } from './types/building';
import {
  playExpandCollapseSound,
  playFloorSwitchSound,
  setAmbientVentilationDrone,
} from './utils/audio';
import { fetchLiveWeatherData, WeatherData } from './utils/weather';

import sensorHeroImg from './assets/images/gridsense_sensor_hero_1790481999539.jpg';
import facadeImg from './assets/images/smart_building_facade_1790482020320.jpg';

export default function App() {
  // Navigation View: 'landing' or 'model'
  const [currentView, setCurrentView] = useState<'landing' | 'model'>('landing');

  // 3D Model States
  const [modelLoaded, setModelLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeFloor, setActiveFloor] = useState<'all' | 1 | 2>('all');
  const [selectedCabinId, setSelectedCabinId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [ambientNoiseEnabled, setAmbientNoiseEnabled] = useState(false);
  const [cameraPerspective, setCameraPerspective] = useState<'default' | 'isometric'>('default');
  const [hoveredFloor, setHoveredFloor] = useState<HoveredFloorData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  // VR-ready stereoscopic dual viewport mode
  const [vrMode, setVrMode] = useState(false);

  // OpenWeatherMap real-time meteorological lighting & skybox engine
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('paris');

  React.useEffect(() => {
    let isMounted = true;
    fetchLiveWeatherData(selectedLocation).then((data) => {
      if (isMounted) setWeatherData(data);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedLocation]);

  // Real-Time Sun-Path Shadow Simulation & Day Cycle Mode (User Request 2)
  const [dayCycleEnabled, setDayCycleEnabled] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(13.0); // 13:00 (Peak solar noon)

  // Real-Time Radar Occupancy Density Heatmap Layer (User Request 3)
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  // Animated Day Cycle loop
  React.useEffect(() => {
    if (!dayCycleEnabled) return;
    const interval = setInterval(() => {
      setTimeOfDay((prev) => {
        let next = prev + 0.08;
        if (next > 23.5) next = 5.5; // Loop 5:30 AM to 11:30 PM
        return parseFloat(next.toFixed(2));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [dayCycleEnabled]);

  // Scroll in-and-out text animation observer
  React.useEffect(() => {
    if (currentView !== 'landing') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            entry.target.classList.remove('is-scrolled-past');
          } else {
            if (entry.boundingClientRect.top < 0) {
              entry.target.classList.add('is-scrolled-past');
            } else {
              entry.target.classList.remove('is-visible');
            }
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [currentView]);

  // Prevent page scroll when inside the 3D model digital twin
  React.useEffect(() => {
    if (currentView === 'model') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setAmbientVentilationDrone(false);
      setAmbientNoiseEnabled(false);
    }
    return () => {
      document.body.style.overflow = '';
      setAmbientVentilationDrone(false);
    };
  }, [currentView]);

  const toggleDrawer = () => {
    setDrawerOpen((prev) => {
      const next = !prev;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 60);
      return next;
    });
  };

  const handleTogglePerspective = () => {
    setCameraPerspective((prev) => (prev === 'default' ? 'isometric' : 'default'));
  };

  const handleToggleVrMode = () => {
    setVrMode((prev) => !prev);
  };

  const handleToggleAmbientNoise = () => {
    setAmbientNoiseEnabled((prev) => {
      const next = !prev;
      setAmbientVentilationDrone(next);
      return next;
    });
  };

  const handleToggleDayCycle = () => {
    setDayCycleEnabled((prev) => !prev);
  };

  const handleToggleHeatmap = () => {
    setHeatmapEnabled((prev) => !prev);
  };

  // Cabin electrical components state
  const [cabins, setCabins] = useState<Record<string, CabinData>>(INITIAL_CABINS);

  // Explicit user interaction handlers for sounds (Requirement 3: ONLY on expand/collapse and floor switch)
  const handleToggleExpand = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    playExpandCollapseSound(nextExpanded, audioEnabled);
  };

  const handleSelectFloor = (floor: 'all' | 1 | 2) => {
    setActiveFloor(floor);
    playFloorSwitchSound(audioEnabled);
  };

  const handleToggleAudio = () => {
    setAudioEnabled((prev) => !prev);
  };

  // Toggle individual cabin component
  const handleToggleComponent = (
    cabinId: string,
    component: keyof CabinData['components'],
  ) => {
    setCabins((prev) => {
      const current = prev[cabinId];
      if (!current) return prev;
      const nextVal = !current.components[component];
      return {
        ...prev,
        [cabinId]: {
          ...current,
          components: {
            ...current.components,
            [component]: nextVal,
          },
        },
      };
    });
  };

  // Batch actions
  const handleBatchAction = (action: 'all-lights-on' | 'all-lights-off' | 'eco-mode') => {
    setCabins((prev) => {
      const updated: Record<string, CabinData> = {};
      Object.entries(prev).forEach(([id, c]) => {
        if (action === 'all-lights-on') {
          updated[id] = { ...c, components: { ...c.components, lights: true } };
        } else if (action === 'all-lights-off') {
          updated[id] = { ...c, components: { ...c.components, lights: false } };
        } else {
          const shouldLight = c.metrics.occupancy > 0;
          updated[id] = {
            ...c,
            components: {
              ...c.components,
              lights: shouldLight,
              hvac: true,
              power: true,
            },
          };
        }
      });
      return updated;
    });
  };

  const navigateTo3DModel = () => {
    setCurrentView('model');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const returnToOverview = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Smooth scroll handler working from both Overview and 3D Model views
  const scrollToSection = (sectionId: string) => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Navigation (Strict 3-zone contract) */}
      <header className="sticky top-0 z-40 w-full bg-[#08090d]/90 backdrop-blur-xl border-b border-amber-500/20 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Single text element Brand Wordmark */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={returnToOverview}
              className="text-left group flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-600 to-amber-950 p-[1px] shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <div className="w-full h-full bg-[#0d0e15] rounded-[7px] flex items-center justify-center">
                  <span className="font-display font-extrabold text-amber-400 text-sm">GS</span>
                </div>
              </div>
              <div>
                <span className="font-display font-bold text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  GridSense
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-wider text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Schneider Electric
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Working smoothly from all views) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <button
              type="button"
              onClick={returnToOverview}
              className={`hover:text-amber-300 transition-colors cursor-pointer ${
                currentView === 'landing' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Sensor Hardware
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('kinetic-spatial-section')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              3D Digital Twin
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('architecture')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              EcoStruxure
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('specs')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Specifications
            </button>
          </nav>

          {/* Zone 3: Actions & Conditional Audio FX Toggle */}
          <div className="flex items-center gap-3">
            {/* Conditional UI Element: Audio On/Off toggle button (ONLY in 3D Model view AFTER model is loaded) */}
            {currentView === 'model' && modelLoaded && (
              <AudioToggleHeaderButton
                audioEnabled={audioEnabled}
                onToggleAudio={handleToggleAudio}
                ambientNoiseEnabled={ambientNoiseEnabled}
                onToggleAmbientNoise={handleToggleAmbientNoise}
              />
            )}

            {currentView === 'landing' ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>EcoStruxure™ Connected</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={returnToOverview}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all whitespace-nowrap cursor-pointer"
              >
                <span>← Back to Overview</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {currentView === 'model' ? (
        /* --- 3D INTERACTIVE MODEL DIGITAL TWIN VIEW (STRICT FULLSCREEN, NO SCROLL) --- */
        <main className="relative w-full h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden">
          {/* 3D Scene Viewport with Subtle Glowing Pulse when Assembled */}
          <div
            className={`relative flex-1 h-full bg-[#07070a] overflow-hidden transition-all duration-700 ${
              !expanded ? 'assembled-container-pulse' : ''
            }`}
          >
            {/* Loading Indicator */}
            {!modelLoaded && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#07070a]/95 backdrop-blur-md">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin mb-4" />
                <h3 className="font-display font-semibold text-lg text-amber-200">
                  Initializing Schneider Campus Digital Twin
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Compiling PBR materials, ribbon glazing, eco-towers & exterior studio lighting...
                </p>
              </div>
            )}

            {/* Three.js Office Campus Canvas with VR, Real-Time Shadows & Heatmap */}
            <OfficeModel3D
              expanded={expanded}
              activeFloor={activeFloor}
              cabins={cabins}
              selectedCabinId={selectedCabinId}
              cameraPerspective={cameraPerspective}
              dayCycleEnabled={dayCycleEnabled}
              timeOfDay={timeOfDay}
              heatmapEnabled={heatmapEnabled}
              vrMode={vrMode}
              weatherData={weatherData}
              onSelectCabin={setSelectedCabinId}
              onModelLoaded={() => setModelLoaded(true)}
              onHoverFloor={setHoveredFloor}
            />

            {/* Floating 'AI Insight' Panel (Sustainability Score & Energy Recommendations) */}
            {modelLoaded && (
              <AIInsightPanel
                activeFloor={activeFloor}
                cabins={cabins}
                onApplyOptimization={() => handleBatchAction('eco-mode')}
              />
            )}

            {/* Floating Floor Boundary Tooltip on Hover */}
            {hoveredFloor && (
              <div
                className="pointer-events-none fixed z-50 px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-xl border border-amber-400/80 text-xs text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)] -translate-x-1/2 -translate-y-12 transition-transform duration-75 flex items-center gap-2"
                style={{ left: hoveredFloor.x, top: hoveredFloor.y }}
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-mono font-bold text-amber-300">
                  Floor {hoveredFloor.floor}
                </span>
                <span className="text-slate-300">
                  {hoveredFloor.floor === 1 ? '· Ground Facility Wing' : '· Upper Innovation Deck'}
                </span>
              </div>
            )}

            {/* Top Bar Status Badges in 3D scene */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
              <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-xl border border-amber-500/30 text-xs flex items-center gap-2 shadow-lg">
                <div
                  className={`w-2 h-2 rounded-full ${
                    !expanded
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <span className="text-slate-300 font-mono text-[11px]">
                  Campus State:{' '}
                  <strong className="text-amber-300">
                    {expanded ? 'Kinetic Deconstructed View' : 'Assembled Facility (Glowing)'}
                  </strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 text-[11px]">
                  View:{' '}
                  <strong className="text-white">
                    {activeFloor === 'all' ? 'Entire Complex' : `Floor ${activeFloor}`}
                  </strong>
                </span>
              </div>

              {/* Assembled Indicator Badge */}
              {!expanded && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assembled Twin Aura Active</span>
                </div>
              )}
            </div>

            {/* Floating Day Cycle Sun-Path Shadow Scrubber (Active when Day Cycle is ON) */}
            {dayCycleEnabled && (
              <div className="absolute top-32 left-4 z-20 flex items-center gap-3 px-3 py-2 rounded-xl bg-black/85 backdrop-blur-xl border border-amber-500/35 shadow-xl text-xs pointer-events-auto">
                <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '14s' }} />
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-4 font-mono text-[10px] text-slate-300">
                    <span>Simulated Sun-Path</span>
                    <strong className="text-amber-300">
                      {String(Math.floor(timeOfDay)).padStart(2, '0')}:{String(Math.floor((timeOfDay % 1) * 60)).padStart(2, '0')}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="5.5"
                    max="21.5"
                    step="0.1"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                    className="w-36 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 mt-1"
                    title="Slide to change sun position and examine moving shadows & natural illumination"
                  />
                </div>
              </div>
            )}

            {/* Floating Occupancy Density Heatmap Legend (Active when Heatmap is ON) */}
            {heatmapEnabled && (
              <div className="absolute top-44 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/85 backdrop-blur-xl border border-orange-500/35 shadow-xl text-xs pointer-events-auto">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Radar Density:</span>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">0 pers</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">1 pers</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">2-3 pers</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-500/25 text-red-300 border border-red-500/40 font-bold animate-pulse">4+ pers</span>
                </div>
              </div>
            )}

            {/* Right-Side Toggle Button to collapse/expand Cabin Controls drawer */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={toggleDrawer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/85 hover:bg-black backdrop-blur-xl border border-amber-500/30 text-xs font-medium text-amber-300 transition-all shadow-lg cursor-pointer"
                title={drawerOpen ? 'Maximize Viewport (Hide Panel)' : 'Open Cabin Hub'}
              >
                {drawerOpen ? (
                  <>
                    <PanelRightClose className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Maximize Viewport</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Cabin Hub</span>
                  </>
                )}
              </button>
            </div>

            {/* Conditional UI Elements (Requirement 2): Expand/Collapse and Floor Selector Panel ONLY in 3D Model view and ONLY after loaded */}
            {modelLoaded && (
              <ModelViewControls
                expanded={expanded}
                activeFloor={activeFloor}
                cameraPerspective={cameraPerspective}
                dayCycleEnabled={dayCycleEnabled}
                heatmapEnabled={heatmapEnabled}
                timeOfDay={timeOfDay}
                vrMode={vrMode}
                weatherData={weatherData}
                selectedLocation={selectedLocation}
                onToggleExpand={handleToggleExpand}
                onSelectFloor={handleSelectFloor}
                onTogglePerspective={handleTogglePerspective}
                onToggleDayCycle={handleToggleDayCycle}
                onToggleHeatmap={handleToggleHeatmap}
                onToggleVrMode={handleToggleVrMode}
                onSelectLocation={setSelectedLocation}
              />
            )}
          </div>

          {/* Cabin Electrical Control Drawer (Completely unmounted when hidden so zero column remains) */}
          {drawerOpen && (
            <div className="shrink-0 h-full w-full lg:w-[410px] z-20 overflow-hidden">
              <CabinControlsPanel
                cabins={cabins}
                selectedCabinId={selectedCabinId}
                activeFloorFilter={activeFloor}
                onSelectCabin={setSelectedCabinId}
                onToggleComponent={handleToggleComponent}
                onBatchAction={handleBatchAction}
              />
            </div>
          )}
        </main>
      ) : (
        /* --- LANDING & SCROLL ANIMATION OVERVIEW PAGE --- */
        <main className="flex-1 flex flex-col">
          {/* Hero Section with Interactive Crystal Black & Gold Sensor Showcase */}
          <section id="features" className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-amber-600/10 via-amber-400/5 to-transparent blur-[140px] pointer-events-none rounded-full" />
            <div className="absolute -top-32 right-10 w-[400px] h-[400px] bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
              {/* Section Header with Scroll Text In/Out Effect */}
              <div className="text-center max-w-3xl mx-auto mb-10 scroll-reveal">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Schneider Electric Smart Building Technology</span>
                </div>
                <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] text-balance">
                  GridSense Smart Building Multi-Sensor
                </h1>
                <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed text-balance">
                  Crystal black obsidian housing with 24-karat gold precision chamfers. Unifying
                  sub-millimeter presence radar, NDIR CO₂ atmospheric capture, and autonomous
                  circadian lux balancing into a single architectural fixture.
                </p>

                {/* Primary Hero Actions (Removed duplicate 3D button; links to Kinetic Disassembly section) */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => scrollToSection('kinetic-spatial-section')}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 transition-all shadow-[0_0_30px_rgba(245,158,11,0.45)] group cursor-pointer"
                  >
                    <span>Discover Kinetic Disassembly</span>
                    <ChevronRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('architecture')}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/15 transition-all cursor-pointer"
                  >
                    <span>Explore Hardware Specs</span>
                  </button>
                </div>
              </div>

              {/* 3D Interactive Sensor Viewer Showcase */}
              <div className="relative mt-8 rounded-2xl bg-gradient-to-b from-[#11121b]/80 to-[#090a10]/95 border border-amber-500/25 backdrop-blur-2xl p-4 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden scroll-reveal">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Real-time Telemetry Metrics */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 backdrop-blur-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400 uppercase">Radar Detection</span>
                        <span className="text-xs font-mono text-emerald-400">99.8% Precision</span>
                      </div>
                      <div className="text-2xl font-bold font-display text-white mt-1">mmWave Active</div>
                      <p className="text-xs text-slate-400 mt-1">
                        Detects micro-breathing and subtle finger movements with zero false-offs.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 backdrop-blur-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400 uppercase">CO₂ Air Quality</span>
                        <span className="text-xs font-mono text-amber-400">NDIR Optical</span>
                      </div>
                      <div className="text-2xl font-bold font-display text-white mt-1">420 PPM</div>
                      <p className="text-xs text-slate-400 mt-1">
                        Dual-beam non-dispersive infrared analyzer with 15-year self-calibration.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 backdrop-blur-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400 uppercase">Daylight Harvesting</span>
                        <span className="text-xs font-mono text-amber-300">Closed-Loop</span>
                      </div>
                      <div className="text-2xl font-bold font-display text-white mt-1">650 Lux</div>
                      <p className="text-xs text-slate-400 mt-1">
                        Circadian balance modulating smart luminaire output in response to solar angles.
                      </p>
                    </div>
                  </div>

                  {/* Center Column: 3D Sensor Model */}
                  <div className="lg:col-span-8 flex flex-col items-center justify-center">
                    <SensorViewer3D />
                  </div>
                </div>

                {/* Bottom Banner inside sensor container */}
                <div className="mt-6 pt-4 border-t border-amber-500/15 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Matter over Thread & BACnet/IP Certified</span>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-[11px]">
                    <span>Ultra-low Power: 0.18W</span>
                    <span>Diameter: 86mm</span>
                    <span>Finish: Obsidian & 24K Gold</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Navigate To 3D Model Feature Spotlight (The ONLY Launch 3D Model Button) */}
          <section
            id="kinetic-spatial-section"
            className="relative py-20 bg-gradient-to-b from-transparent via-[#0c0d15]/80 to-transparent border-y border-amber-500/15"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="scroll-reveal">
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-3">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    <span>Schneider Innovation Campus 3D Twin</span>
                  </div>
                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                    Proprietary Kinetic Spatial Disassembly Engine™
                  </h2>
                  <p className="mt-4 text-base text-slate-300 leading-relaxed">
                    Explore the complete Schneider Electric facility inspired by real corporate
                    campus architecture. Featuring continuous ribbon glazing, central entrance
                    porte-cochère, rooftop mechanical chillers, 4 green eco-cylinder cooling towers,
                    and cantilevered viewing decks.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                      <div className="p-1 rounded bg-amber-500/10 text-amber-400 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Granular Circuit & Lighting Control
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Manually toggle lights, HVAC climate fans, smart privacy glass, and outlet
                          power in each cabin with instant real-time 3D visual feedback.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                      <div className="p-1 rounded bg-amber-500/10 text-amber-400 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          OpenWeather™ Real-Time Lighting & VR Ready
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Atmospheric sun and precipitation sync with global Schneider hubs plus
                          side-by-side stereoscopic VR view for cardboard and headset immersion.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* The SOLE primary button to open the 3D model */}
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={navigateTo3DModel}
                      className="flex items-center gap-3 px-7 py-4 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 transition-all shadow-[0_0_35px_rgba(245,158,11,0.5)] cursor-pointer group"
                    >
                      <Maximize2 className="w-5 h-5 text-black transition-transform group-hover:scale-110" />
                      <span className="font-bold tracking-wide">Navigate To 3D Model</span>
                      <ArrowRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1.5" />
                    </button>
                  </div>
                </div>

                {/* Right side: Architectural image card */}
                <div className="relative group rounded-2xl overflow-hidden border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] scroll-reveal">
                  <img
                    src={facadeImg}
                    alt="GridSense Schneider Smart Office Building"
                    className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                    <span className="text-xs font-mono text-amber-300">Schneider Electric Twin</span>
                    <h3 className="font-display font-bold text-xl text-white mt-1">
                      Two-Level Connected Workplace
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Equipped with 8 GridSense multi-sensor units transmitting BACnet telemetry to
                      Schneider EcoStruxure Building Operation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Sensor Architecture & Engineering with Clean Energy Video Backdrop */}
          <section id="architecture" className="relative py-24 max-w-7xl mx-auto px-4 sm:px-6 overflow-hidden">
            {/* Background Video & Animated Electricity / Wind Turbines / Transmission Towers Power Grid */}
            <CleanPowerGridBackdrop />

            <div className="relative z-10 text-center max-w-2xl mx-auto mb-14 scroll-reveal">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded border border-amber-500/20">
                EcoStruxure™ Architecture & Clean Grid
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mt-3">
                Six Dimensions of Sensory Perception
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Replace six isolated building sensors with one seamless crystal obsidian unit wired into renewable energy microgrids.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-xl bg-black/60 border border-amber-500/20 hover:border-amber-500/40 transition-all backdrop-blur-xl group scroll-reveal">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">60GHz Micro-Radar</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Captures true occupancy including breathing and stillness, eliminating the classic
                  dark-room shutoff while employees type or read.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-xl bg-black/60 border border-amber-500/20 hover:border-amber-500/40 transition-all backdrop-blur-xl group scroll-reveal">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">NDIR Dual-Channel CO₂</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Gold-plated optical chamber precisely measuring parts per million, triggering fresh
                  air dampers before cognitive fatigue sets in.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-xl bg-black/60 border border-amber-500/20 hover:border-amber-500/40 transition-all backdrop-blur-xl group scroll-reveal">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">Color-Calibrated Lux</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Spectrally matched to the human photopic eye response curve to orchestrate natural
                  daylight harvesting and DALI-2 luminaire dimming.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-xl bg-black/60 border border-amber-500/20 hover:border-amber-500/40 transition-all backdrop-blur-xl group scroll-reveal">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">Acoustic dB Profiling</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Monitors ambient background sound pressure to identify noise pollution in quiet
                  zones without recording audio speech streams.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-xl bg-black/60 border border-amber-500/20 hover:border-amber-500/40 transition-all backdrop-blur-xl group scroll-reveal">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">Thermal Equilibrium</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Combines calibrated air temperature and relative humidity with thermal radiant
                  surface calculation for ASHRAE Standard 55 compliance.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-xl bg-black/60 border border-amber-500/20 hover:border-amber-500/40 transition-all backdrop-blur-xl group scroll-reveal">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">EcoStruxure Cloud Mesh</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Native encrypted TLS telemetry streaming to Schneider Electric EcoStruxure Building
                  Operation with zero gateway overhead.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Specifications Table */}
          <section id="specs" className="py-16 bg-[#090a10] border-t border-amber-500/15">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-10 scroll-reveal">
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
                  Technical Specifications
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  GridSense Hardware Engineering Data Sheet
                </p>
              </div>

              <div className="rounded-xl overflow-hidden border border-amber-500/25 bg-black/50 backdrop-blur-xl scroll-reveal">
                <table className="w-full text-left text-xs text-slate-300">
                  <tbody className="divide-y divide-white/5 font-mono">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-amber-300 w-1/3">Dimensions</td>
                      <td className="py-3 px-4">86 mm diameter × 22 mm depth (Flush ceiling & wall mount)</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-amber-300">Enclosure Materials</td>
                      <td className="py-3 px-4">Crystal obsidian polycarbonate & 24K gold PVD anodized bezel</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-amber-300">Radar Spectrum</td>
                      <td className="py-3 px-4">60 – 64 GHz mmWave FMCW (Sub-millimeter displacement)</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-amber-300">CO₂ Sensing Range</td>
                      <td className="py-3 px-4">400 – 5,000 ppm (±30 ppm + 3% of reading)</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-amber-300">Illuminance (Lux)</td>
                      <td className="py-3 px-4">0 – 65,535 Lux with ambient color temperature (CCT) detection</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-amber-300">Connectivity</td>
                      <td className="py-3 px-4">Matter over Thread / BACnet/IP over PoE / Modbus RTU</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-amber-300">Power Consumption</td>
                      <td className="py-3 px-4">0.18 W nominal (PoE IEEE 802.3af Class 1 or 24V AC/DC)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      {currentView === 'landing' && (
        <footer className="w-full bg-[#050608] border-t border-amber-500/20 py-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-amber-400 text-sm tracking-tight">
                GridSense
              </span>
              <span>·</span>
              <span>Powered by Schneider Electric EcoStruxure™</span>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-slate-400 font-mono">
              <span>ISO 50001 Energy Compliant</span>
              <span>WELL v2 Ready</span>
              <span>LEED Platinum Building Standard</span>
            </div>

            <div className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} GridSense Technologies. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
