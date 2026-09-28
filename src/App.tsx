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
import {
  fetchLiveWeatherData,
  WeatherData,
  WeatherPresetType,
  WEATHER_SIMULATIONS,
  PRESET_FACILITIES,
} from './utils/weather';

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
  const [cabins, setCabins] = useState<Record<string, CabinData>>(INITIAL_CABINS);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [hoveredFloor, setHoveredFloor] = useState<HoveredFloorData | null>(null);

  // Advanced Visual Settings
  const [cameraPerspective, setCameraPerspective] = useState<'default' | 'isometric'>('default');
  const [dayCycleEnabled, setDayCycleEnabled] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(13.0); // 13:00 default noon sun
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [vrMode, setVrMode] = useState(false);

  // Global Schneider Fleet & Sensor Installer Modal
  const [fleetModalOpen, setFleetModalOpen] = useState(false);
  const [activeOfficeId, setActiveOfficeId] = useState('paris-hq');

  // Keyless Real-Time Meteorological Lighting & Skybox Engine
  const [selectedLocation, setSelectedLocation] = useState<string>('paris');
  const [weatherPreset, setWeatherPreset] = useState<WeatherPresetType>('live');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Fetch weather data whenever selected location or preset changes
  React.useEffect(() => {
    let isCancelled = false;

    if (weatherPreset !== 'live') {
      const sim = WEATHER_SIMULATIONS[weatherPreset];
      const facility = PRESET_FACILITIES[selectedLocation] || PRESET_FACILITIES['paris'];
      setWeatherData({
        tempC: sim.tempC,
        condition: sim.condition,
        conditionLabel: sim.conditionLabel,
        cloudCover: sim.cloudCover,
        windSpeedKmH: sim.windSpeedKmH,
        humidity: sim.humidity,
        isDay: sim.isDay,
        city: facility.city,
        country: facility.country,
        isManualOverride: true,
      });
      return;
    }

    const loadWeather = async () => {
      setWeatherLoading(true);
      try {
        const data = await fetchLiveWeatherData(selectedLocation);
        if (!isCancelled) {
          setWeatherData(data);
        }
      } catch (err) {
        console.warn('Weather sync fell back gracefully:', err);
      } finally {
        if (!isCancelled) {
          setWeatherLoading(false);
        }
      }
    };

    loadWeather();
    const intervalId = setInterval(loadWeather, 10 * 60 * 1000);
    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [selectedLocation, weatherPreset]);

  // Handle expanding/collapsing 3D Model
  const handleToggleExpand = () => {
    const nextState = !expanded;
    setExpanded(nextState);
    if (audioEnabled) {
      playExpandCollapseSound(nextState, audioEnabled);
    }
  };

  // Handle Floor Selection in 3D Model (Triggers spring physics isolation)
  const handleSelectFloor = (floor: 'all' | 1 | 2) => {
    setActiveFloor(floor);
    if (audioEnabled) {
      playFloorSwitchSound(audioEnabled);
    }
    // Deselect room if not on current floor
    if (floor !== 'all' && selectedCabinId && cabins[selectedCabinId]?.floor !== floor) {
      setSelectedCabinId(null);
    }
  };

  // Toggle Camera Perspective Mode
  const handleTogglePerspective = () => {
    setCameraPerspective((prev) => (prev === 'default' ? 'isometric' : 'default'));
    if (audioEnabled) {
      playFloorSwitchSound(audioEnabled);
    }
  };

  // Toggle Day Cycle Sun-Path Simulation
  const handleToggleDayCycle = () => {
    setDayCycleEnabled((prev) => !prev);
    if (audioEnabled) {
      playFloorSwitchSound(audioEnabled);
    }
  };

  // Toggle Heatmap Layer
  const handleToggleHeatmap = () => {
    setHeatmapEnabled((prev) => !prev);
    if (audioEnabled) {
      playFloorSwitchSound(audioEnabled);
    }
  };

  // Toggle VR Stereoscopic Mode
  const handleToggleVrMode = () => {
    setVrMode((prev) => !prev);
    if (audioEnabled) {
      playFloorSwitchSound(audioEnabled);
    }
  };

  // Toggle Audio Sound FX
  const handleToggleAudio = () => {
    setAudioEnabled((prev) => !prev);
  };

  // Toggle HVAC Ventilation Ambient Drone
  const handleToggleAmbientNoise = () => {
    const next = !ambientNoiseEnabled;
    setAmbientNoiseEnabled(next);
    setAmbientVentilationDrone(next);
  };

  // Toggle Drawer open/close
  const toggleDrawer = () => {
    setDrawerOpen((prev) => !prev);
  };

  // Toggle individual cabin component
  const handleToggleComponent = (cabinId: string, component: keyof CabinData['components']) => {
    setCabins((prev) => {
      const cabin = prev[cabinId];
      if (!cabin) return prev;

      const nextVal = !cabin.components[component];
      const updatedComponents = {
        ...cabin.components,
        [component]: nextVal,
      };

      // Modulate power wattage dynamically
      let deltaWatts = 0;
      if (component === 'lights') deltaWatts = nextVal ? 45 : -45;
      if (component === 'hvac') deltaWatts = nextVal ? 120 : -120;
      if (component === 'smartGlass') deltaWatts = nextVal ? 15 : -15;
      if (component === 'power') deltaWatts = nextVal ? 80 : -80;

      const updatedMetrics = {
        ...cabin.metrics,
        powerWatts: Math.max(0, cabin.metrics.powerWatts + deltaWatts),
      };

      return {
        ...prev,
        [cabinId]: {
          ...cabin,
          components: updatedComponents,
          metrics: updatedMetrics,
        },
      };
    });
  };

  // Batch actions
  const handleBatchAction = (action: 'all-lights-on' | 'all-lights-off' | 'eco-mode') => {
    setCabins((prev) => {
      const nextCabins = { ...prev };
      Object.keys(nextCabins).forEach((id) => {
        const c = nextCabins[id];
        if (action === 'all-lights-on') {
          c.components.lights = true;
          c.metrics.powerWatts = Math.max(c.metrics.powerWatts, 110);
        } else if (action === 'all-lights-off') {
          c.components.lights = false;
          c.metrics.powerWatts = Math.max(12, c.metrics.powerWatts - 45);
        } else if (action === 'eco-mode') {
          c.components.lights = false;
          c.components.hvac = true;
          c.components.smartGlass = false;
          c.components.power = true;
          c.metrics.powerWatts = 42;
        }
      });
      return nextCabins;
    });
  };

  // Navigation handlers
  const navigateTo3DModel = () => {
    setCurrentView('model');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnToOverview = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    if (currentView === 'model') {
      setCurrentView('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll In and Out Text Observer Effect
  React.useEffect(() => {
    if (currentView !== 'landing') return;

    const handleScrollReveal = () => {
      const elements = document.querySelectorAll('.scroll-reveal');
      const windowHeight = window.innerHeight;

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top;
        const elementBottom = rect.bottom;

        if (elementTop < windowHeight * 0.88 && elementBottom > 50) {
          el.classList.add('is-visible');
          el.classList.remove('is-scrolled-past');
        } else if (elementBottom <= 50) {
          el.classList.remove('is-visible');
          el.classList.add('is-scrolled-past');
        } else {
          el.classList.remove('is-visible');
          el.classList.remove('is-scrolled-past');
        }
      });
    };

    window.addEventListener('scroll', handleScrollReveal, { passive: true });
    handleScrollReveal();
    return () => window.removeEventListener('scroll', handleScrollReveal);
  }, [currentView]);

  return (
    <div className="min-h-screen bg-[#18181c] text-[#f4f4f5] flex flex-col font-sans selection:bg-[#e06d3b]/30 selection:text-[#ff8a50]">
      {/* Top Bar Navigation (Deep Slate & Electric Copper) */}
      <header className="sticky top-0 z-40 w-full bg-[#1e1e24]/95 backdrop-blur-2xl border-b border-[#3a3a44] shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Single text element Brand Wordmark */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={returnToOverview}
              className="text-left group flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] p-[1px] shadow-[0_0_15px_rgba(224,109,59,0.35)]">
                <div className="w-full h-full bg-[#1e1e24] rounded-[7px] flex items-center justify-center">
                  <span className="font-display font-extrabold text-[#ff8a50] text-sm">GS</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-lg tracking-tight text-white group-hover:text-[#ff8a50] transition-colors">
                  GridSense
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-wider text-[#ff8a50] bg-[#e06d3b]/15 px-2 py-0.5 rounded border border-[#e06d3b]/35">
                  Schneider Electric
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#d4d4d8]">
            <button
              type="button"
              onClick={returnToOverview}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentView === 'landing' ? 'text-[#ff8a50] font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Sensor Hardware
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('kinetic-spatial-section')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              3D Digital Twin
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('architecture')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Clean Power Grid
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('specs')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Specifications
            </button>
          </nav>

          {/* Zone 3: Actions & Global Sensor Deployment Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFleetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-[#ff8a50] bg-[#25252d] hover:bg-[#2c2c36] border border-[#e06d3b]/40 transition-all shadow-[0_0_15px_rgba(224,109,59,0.15)] cursor-pointer"
              title="Open Global Office Sensor Installation Backend"
            >
              <div className="w-2 h-2 rounded-full bg-[#ff8a50] animate-pulse" />
              <span>Global Fleet & Sensors</span>
            </button>

            {/* Audio On/Off toggle button in 3D Model view */}
            {currentView === 'model' && modelLoaded && (
              <AudioToggleHeaderButton
                audioEnabled={audioEnabled}
                onToggleAudio={handleToggleAudio}
                ambientNoiseEnabled={ambientNoiseEnabled}
                onToggleAmbientNoise={handleToggleAmbientNoise}
              />
            )}

            {currentView === 'landing' ? (
              <button
                type="button"
                onClick={navigateTo3DModel}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(224,109,59,0.4)] cursor-pointer"
              >
                <span>Launch 3D Twin →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={returnToOverview}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#d4d4d8] bg-white/5 hover:bg-white/10 border border-white/10 transition-all whitespace-nowrap cursor-pointer"
              >
                <span>← Back to Overview</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {currentView === 'model' ? (
        /* --- 3D INTERACTIVE MODEL DIGITAL TWIN VIEW --- */
        <main className="relative w-full h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#18181c]">
          {/* 3D Scene Viewport */}
          <div
            className={`relative flex-1 h-full bg-[#18181c] overflow-hidden transition-all duration-700 ${
              !expanded ? 'assembled-container-pulse' : ''
            }`}
          >
            {/* Loading Indicator */}
            {!modelLoaded && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#18181c]/95 backdrop-blur-md">
                <div className="w-12 h-12 rounded-full border-2 border-[#e06d3b]/20 border-t-[#e06d3b] animate-spin mb-4" />
                <h3 className="font-display font-semibold text-lg text-white">
                  Initializing Schneider Campus Digital Twin
                </h3>
                <p className="text-xs text-[#a1a1aa] mt-1">
                  Compiling PBR materials, ribbon glazing, eco-towers & exterior studio lighting...
                </p>
              </div>
            )}

            {/* Three.js Office Campus Canvas with Spring Floor Transitions & Real-Time Shadows */}
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

            {/* Floating 'AI Insight' Panel */}
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
                className="pointer-events-none fixed z-50 px-3 py-1.5 rounded-lg bg-[#1e1e24]/95 backdrop-blur-xl border border-[#e06d3b]/80 text-xs text-white shadow-[0_0_20px_rgba(224,109,59,0.5)] -translate-x-1/2 -translate-y-12 transition-transform duration-75 flex items-center gap-2"
                style={{ left: hoveredFloor.x, top: hoveredFloor.y }}
              >
                <div className="w-2 h-2 rounded-full bg-[#ff8a50] animate-ping" />
                <span className="font-mono font-bold text-[#ff8a50]">
                  Floor {hoveredFloor.floor}
                </span>
                <span className="text-[#d4d4d8]">
                  {hoveredFloor.floor === 1 ? '· Ground Facility Wing' : '· Upper Innovation Deck'}
                </span>
              </div>
            )}

            {/* Top Bar Status Badges in 3D scene */}
            <div className="absolute top-16 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
              <div className="px-3 py-1.5 rounded-lg bg-[#1e1e24]/90 backdrop-blur-xl border border-[#3a3a44] text-xs flex items-center gap-2 shadow-lg">
                <div
                  className={`w-2 h-2 rounded-full ${
                    !expanded
                      ? 'bg-[#e06d3b] animate-ping'
                      : 'bg-[#ff8a50] animate-pulse'
                  }`}
                />
                <span className="text-[#d4d4d8] font-mono text-[11px]">
                  Campus State:{' '}
                  <strong className="text-white">
                    {expanded ? 'Kinetic Deconstructed View' : 'Assembled Facility'}
                  </strong>
                </span>
                <span className="text-[#3a3a44]">|</span>
                <span className="text-[#a1a1aa] text-[11px]">
                  Active Deck:{' '}
                  <strong className="text-[#ff8a50]">
                    {activeFloor === 'all' ? 'Dual-Deck Facility' : `Floor ${activeFloor}`}
                  </strong>
                </span>
              </div>

              {!expanded && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#e06d3b]/15 border border-[#e06d3b]/35 text-[11px] font-mono text-[#ff8a50]">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff8a50]" />
                  <span>Spring Floor Isolation Active</span>
                </div>
              )}
            </div>

            {/* Floating Day Cycle Sun-Path Shadow Scrubber */}
            {dayCycleEnabled && (
              <div className="absolute top-28 left-4 z-20 flex items-center gap-3 px-3 py-2 rounded-xl bg-[#1e1e24]/90 backdrop-blur-xl border border-[#3a3a44] shadow-xl text-xs pointer-events-auto">
                <Sun className="w-4 h-4 text-[#ff8a50] animate-spin" style={{ animationDuration: '14s' }} />
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-4 font-mono text-[10px] text-[#d4d4d8]">
                    <span>Simulated Sun-Path</span>
                    <strong className="text-white">
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
                    className="w-36 h-1.5 bg-[#2a2a34] rounded-lg appearance-none cursor-pointer accent-[#e06d3b] mt-1"
                    title="Slide to change sun position and examine moving shadows & natural illumination"
                  />
                </div>
              </div>
            )}

            {/* Floating Occupancy Density Heatmap Legend (Deep Slate & Electric Copper) */}
            {heatmapEnabled && (
              <div className="absolute top-44 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1e1e24]/90 backdrop-blur-xl border border-[#3a3a44] shadow-xl text-xs pointer-events-auto">
                <span className="text-[10px] font-mono text-[#a1a1aa] uppercase">Radar Density:</span>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-[#2a2a34] text-[#a1a1aa] border border-[#3a3a44]">0 pers</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#b87355]/25 text-[#f4d0c2] border border-[#b87355]/40">1 pers</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#e06d3b]/25 text-[#fed7aa] border border-[#e06d3b]/40">2-3 pers</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#e03b24]/30 text-white border border-[#e03b24]/50 font-bold animate-pulse">4+ pers</span>
                </div>
              </div>
            )}

            {/* Right-Side Toggle Button to collapse/expand Cabin Controls drawer */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={toggleDrawer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e24]/90 hover:bg-[#25252d] backdrop-blur-xl border border-[#3a3a44] text-xs font-medium text-[#ff8a50] transition-all shadow-lg cursor-pointer"
                title={drawerOpen ? 'Maximize Viewport (Hide Panel)' : 'Open Cabin Hub'}
              >
                {drawerOpen ? (
                  <>
                    <PanelRightClose className="w-3.5 h-3.5 text-[#ff8a50]" />
                    <span className="hidden sm:inline">Maximize Viewport</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="w-3.5 h-3.5 text-[#ff8a50]" />
                    <span>Open Cabin Hub</span>
                  </>
                )}
              </button>
            </div>

            {/* Floor Selector and 3D Viewport Controls */}
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
                activeWeatherPreset={weatherPreset}
                onToggleExpand={handleToggleExpand}
                onSelectFloor={handleSelectFloor}
                onTogglePerspective={handleTogglePerspective}
                onToggleDayCycle={handleToggleDayCycle}
                onToggleHeatmap={handleToggleHeatmap}
                onToggleVrMode={handleToggleVrMode}
                onSelectLocation={setSelectedLocation}
                onSelectWeatherPreset={setWeatherPreset}
              />
            )}
          </div>

          {/* Cabin Electrical Control Drawer with Facility Report Modal */}
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
        /* --- LANDING & SCROLL OVERVIEW PAGE --- */
        <main className="flex-1 flex flex-col">
          {/* Hero Section with Interactive Multi-Sensor Showcase */}
          <section id="features" className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden">
            {/* Ambient Background Glows in Electric Copper & Deep Slate */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-[#e06d3b]/15 via-[#b84c1e]/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
            <div className="absolute -top-32 right-10 w-[400px] h-[400px] bg-[#d95d2c]/10 blur-[120px] pointer-events-none rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
              {/* Section Header */}
              <div className="text-center max-w-3xl mx-auto mb-10 scroll-reveal">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#e06d3b]/15 border border-[#e06d3b]/35 text-[#ff8a50] text-xs font-mono mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff8a50]" />
                  <span>Schneider Electric Smart Building Technology</span>
                </div>
                <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] text-balance">
                  GridSense Smart Building Multi-Sensor
                </h1>
                <p className="mt-4 text-base sm:text-lg text-[#d4d4d8] leading-relaxed text-balance">
                  Deep Slate titanium housing with radiant electric copper chamfers. Unifying
                  sub-millimeter presence radar, NDIR CO₂ atmospheric capture, and autonomous
                  circadian lux balancing into a single architectural fixture.
                </p>

                {/* Primary Hero Actions */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={navigateTo3DModel}
                    className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] hover:brightness-110 transition-all shadow-[0_0_35px_rgba(224,109,59,0.45)] group cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4 text-white transition-transform group-hover:scale-110" />
                    <span>Open 3D Digital Twin</span>
                    <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setFleetModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium text-[#ff8a50] bg-[#222228] hover:bg-[#2a2a32] border border-[#e06d3b]/40 transition-all shadow-[0_0_20px_rgba(224,109,59,0.2)] cursor-pointer"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#ff8a50] animate-pulse" />
                    <span>Deploy Sensor Worldwide</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('architecture')}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium text-[#d4d4d8] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer"
                  >
                    <span>View Clean Power Grid</span>
                  </button>
                </div>
              </div>

              {/* 3D Interactive Sensor Viewer Showcase */}
              <div className="relative mt-8 rounded-2xl bg-gradient-to-b from-[#222228]/85 to-[#1a1a20]/95 border border-[#3a3a44] backdrop-blur-2xl p-4 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(224,109,59,0.1)] overflow-hidden scroll-reveal">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Real-time Telemetry Metrics */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="p-4 rounded-xl bg-[#26262e]/70 border border-[#383844] backdrop-blur-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-[#a1a1aa] uppercase">Radar Detection</span>
                        <span className="text-xs font-mono text-[#ff8a50] font-semibold">99.8% Precision</span>
                      </div>
                      <div className="text-2xl font-bold font-display text-white mt-1">mmWave Active</div>
                      <p className="text-xs text-[#a1a1aa] mt-1">
                        Detects micro-breathing and subtle finger movements with zero false-offs.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#26262e]/70 border border-[#383844] backdrop-blur-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-[#a1a1aa] uppercase">CO₂ Air Quality</span>
                        <span className="text-xs font-mono text-[#f07e48] font-semibold">NDIR Optical</span>
                      </div>
                      <div className="text-2xl font-bold font-display text-white mt-1">420 PPM</div>
                      <p className="text-xs text-[#a1a1aa] mt-1">
                        Dual-beam non-dispersive infrared analyzer with 15-year self-calibration.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#26262e]/70 border border-[#383844] backdrop-blur-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-[#a1a1aa] uppercase">Daylight Harvesting</span>
                        <span className="text-xs font-mono text-[#ff8a50] font-semibold">Closed-Loop</span>
                      </div>
                      <div className="text-2xl font-bold font-display text-white mt-1">650 Lux</div>
                      <p className="text-xs text-[#a1a1aa] mt-1">
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
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#a1a1aa]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ff8a50] animate-pulse" />
                    <span className="text-white">Matter over Thread & BACnet/IP Certified</span>
                  </div>
                  <div className="flex items-center gap-6 font-mono text-[11px] text-[#ff8a50]">
                    <span>Ultra-low Power: 0.18W</span>
                    <span>Diameter: 86mm</span>
                    <span>Finish: Deep Slate & Electric Copper</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Navigate To 3D Model Feature Spotlight */}
          <section
            id="kinetic-spatial-section"
            className="relative py-20 bg-gradient-to-b from-transparent via-[#222228]/80 to-transparent border-y border-[#32323c]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="scroll-reveal">
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-[#ff8a50] uppercase tracking-wider mb-3">
                    <Building className="w-3.5 h-3.5 text-[#ff8a50]" />
                    <span>Schneider Innovation Campus 3D Twin</span>
                  </div>
                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                    Proprietary Kinetic Spatial Disassembly Engine™
                  </h2>
                  <p className="mt-4 text-base text-[#d4d4d8] leading-relaxed">
                    Explore the complete Schneider Electric facility inspired by modern corporate
                    campus architecture. Featuring continuous ribbon glazing, central entrance
                    porte-cochère, rooftop mechanical chillers, 4 high-efficiency cooling towers,
                    and cantilevered viewing decks.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#25252d] border border-[#32323c]">
                      <div className="p-1 rounded bg-[#e06d3b]/15 text-[#ff8a50] mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Granular Circuit & Lighting Control
                        </h4>
                        <p className="text-xs text-[#a1a1aa] mt-0.5">
                          Manually toggle lights, HVAC climate fans, smart privacy glass, and outlet
                          power in each cabin with instant real-time 3D visual feedback.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#25252d] border border-[#32323c]">
                      <div className="p-1 rounded bg-[#e06d3b]/15 text-[#ff8a50] mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Spring-Based Level Isolation & Fading
                        </h4>
                        <p className="text-xs text-[#a1a1aa] mt-0.5">
                          Click Floor 1 or Floor 2 to smoothly elevate upper levels with tactile spring physics,
                          isolate active workspaces, and ghost out non-selected levels for pristine visibility.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={navigateTo3DModel}
                      className="flex items-center gap-3 px-7 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] hover:brightness-110 transition-all shadow-[0_0_35px_rgba(224,109,59,0.45)] cursor-pointer group"
                    >
                      <Maximize2 className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
                      <span className="font-bold tracking-wide">Navigate To 3D Model</span>
                      <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1.5" />
                    </button>
                  </div>
                </div>

                {/* Right side: Architectural image card */}
                <div className="relative group rounded-2xl overflow-hidden border border-[#3a3a44] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(224,109,59,0.15)] scroll-reveal">
                  <img
                    src={facadeImg}
                    alt="GridSense Schneider Smart Office Building"
                    className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18181c]/95 via-[#18181c]/30 to-transparent flex flex-col justify-end p-6">
                    <span className="text-xs font-mono text-[#ff8a50]">Schneider Electric Twin</span>
                    <h3 className="font-display font-bold text-xl text-white mt-1">
                      Two-Level Connected Workplace
                    </h3>
                    <p className="text-xs text-[#d4d4d8] mt-1">
                      Equipped with 8 GridSense multi-sensor units transmitting BACnet telemetry to
                      Schneider EcoStruxure Building Operation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Sensor Architecture & Engineering with Clean Energy Video Backdrop (Fixed 26% Clarity) */}
          <section id="architecture" className="relative py-24 max-w-7xl mx-auto px-4 sm:px-6 overflow-hidden">
            <CleanPowerGridBackdrop />

            <div className="relative z-10 text-center max-w-2xl mx-auto mb-14 scroll-reveal">
              <span className="text-xs font-mono uppercase tracking-wider text-[#ff8a50] bg-[#e06d3b]/15 px-3 py-1 rounded border border-[#e06d3b]/35">
                EcoStruxure™ Architecture & Clean Grid
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mt-3">
                Six Dimensions of Sensory Perception
              </h2>
              <p className="text-sm text-[#d4d4d8] mt-2">
                Replace six isolated building sensors with one seamless Deep Slate titanium unit wired into renewable energy microgrids.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-[#222228]/50 hover:bg-[#25252d]/75 border border-[#32323c] hover:border-[#e06d3b]/40 transition-all backdrop-blur-sm group scroll-reveal shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-[#e06d3b]/15 border border-[#e06d3b]/35 flex items-center justify-center text-[#ff8a50] mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">60GHz Micro-Radar</h3>
                <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                  Captures true occupancy including breathing and stillness, eliminating the classic
                  dark-room shutoff while employees type or read.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-[#222228]/50 hover:bg-[#25252d]/75 border border-[#32323c] hover:border-[#e06d3b]/40 transition-all backdrop-blur-sm group scroll-reveal shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-[#d95d2c]/15 border border-[#d95d2c]/35 flex items-center justify-center text-[#ff8a50] mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">NDIR Dual-Channel CO₂</h3>
                <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                  Precision optical chamber accurately measuring parts per million, triggering fresh
                  air dampers before cognitive fatigue sets in.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-[#222228]/50 hover:bg-[#25252d]/75 border border-[#32323c] hover:border-[#e06d3b]/40 transition-all backdrop-blur-sm group scroll-reveal shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-[#b84c1e]/15 border border-[#b84c1e]/35 flex items-center justify-center text-[#ff8a50] mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">Color-Calibrated Lux</h3>
                <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                  Spectrally matched to human photopic eye response curve to orchestrate natural
                  daylight harvesting and DALI-2 luminaire dimming.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-[#222228]/50 hover:bg-[#25252d]/75 border border-[#32323c] hover:border-[#e06d3b]/40 transition-all backdrop-blur-sm group scroll-reveal shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-[#c2572b]/15 border border-[#c2572b]/35 flex items-center justify-center text-[#ff8a50] mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">Acoustic dB Profiling</h3>
                <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                  Monitors ambient background sound pressure to identify noise pollution in quiet
                  zones without recording audio speech streams.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl bg-[#222228]/50 hover:bg-[#25252d]/75 border border-[#32323c] hover:border-[#e06d3b]/40 transition-all backdrop-blur-sm group scroll-reveal shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-[#e06d3b]/15 border border-[#e06d3b]/35 flex items-center justify-center text-[#ff8a50] mb-4 group-hover:scale-110 transition-transform">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">Thermal Equilibrium</h3>
                <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                  Combines calibrated air temperature and relative humidity with thermal radiant
                  surface calculation for ASHRAE Standard 55 compliance.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl bg-[#222228]/50 hover:bg-[#25252d]/75 border border-[#32323c] hover:border-[#e06d3b]/40 transition-all backdrop-blur-sm group scroll-reveal shadow-xl">
                <div className="w-10 h-10 rounded-lg bg-[#b84c1e]/15 border border-[#b84c1e]/35 flex items-center justify-center text-[#ff8a50] mb-4 group-hover:scale-110 transition-transform">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-white">EcoStruxure Cloud Mesh</h3>
                <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
                  Native encrypted TLS telemetry streaming to Schneider Electric EcoStruxure Building
                  Operation with zero gateway overhead.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Specifications Table */}
          <section id="specs" className="py-16 bg-[#1a1a20] border-t border-[#2d2d36]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-10 scroll-reveal">
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
                  Technical Specifications
                </h2>
                <p className="text-xs text-[#a1a1aa] mt-1">
                  GridSense Hardware Engineering Data Sheet
                </p>
              </div>

              <div className="rounded-xl overflow-hidden border border-[#3a3a44] bg-[#222228]/80 backdrop-blur-xl scroll-reveal">
                <table className="w-full text-left text-xs text-[#f4f4f5]">
                  <tbody className="divide-y divide-white/5 font-mono">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#ff8a50] w-1/3">Dimensions</td>
                      <td className="py-3 px-4">86 mm diameter × 22 mm depth (Flush ceiling & wall mount)</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#ff8a50]">Enclosure Materials</td>
                      <td className="py-3 px-4">Deep Slate polycarbonate & precision laser-etched electric copper bezel</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#ff8a50]">Radar Spectrum</td>
                      <td className="py-3 px-4">60 – 64 GHz mmWave FMCW (Sub-millimeter displacement)</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#ff8a50]">CO₂ Sensing Range</td>
                      <td className="py-3 px-4">400 – 5,000 ppm (±30 ppm + 3% of reading)</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#ff8a50]">Illuminance (Lux)</td>
                      <td className="py-3 px-4">0 – 65,535 Lux with ambient color temperature (CCT) detection</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#ff8a50]">Connectivity</td>
                      <td className="py-3 px-4">Matter over Thread / BACnet/IP over PoE / Modbus RTU</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#ff8a50]">Power Consumption</td>
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
        <footer className="w-full bg-[#141418] border-t border-[#2d2d36] py-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a1a1aa]">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-[#ff8a50] text-sm tracking-tight">
                GridSense
              </span>
              <span>·</span>
              <span>Powered by Schneider Electric EcoStruxure™</span>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-[#a1a1aa] font-mono">
              <span>ISO 50001 Energy Compliant</span>
              <span>WELL v2 Ready</span>
              <span>LEED Platinum Building Standard</span>
            </div>

            <div className="text-[11px] text-[#71717a]">
              © {new Date().getFullYear()} GridSense Technologies. All rights reserved.
            </div>
          </div>
        </footer>
      )}

      {/* Schneider Electric Global Office Fleet & Sensor Installation Wizard Modal */}
      <SchneiderGlobalFleetModal
        isOpen={fleetModalOpen}
        onClose={() => setFleetModalOpen(false)}
        activeOfficeId={activeOfficeId}
        onSelectOffice={(id) => {
          setActiveOfficeId(id);
          const locationMap: Record<string, string> = {
            'paris-hq': 'paris',
            'ny-hub': 'newyork',
            'london-lab': 'london',
            'tokyo-rd': 'tokyo',
            'dubai-expo': 'dubai',
            'singapore-campus': 'singapore',
          };
          if (locationMap[id]) {
            setSelectedLocation(locationMap[id]);
          }
        }}
      />
    </div>
  );
}
