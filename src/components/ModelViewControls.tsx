import React, { useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Building2,
  Compass,
  Sun,
  Moon,
  Activity,
  Glasses,
  CloudRain,
  Cloud,
  CloudLightning,
  CloudSun,
  MapPin,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { WeatherData, PRESET_FACILITIES } from '../utils/weather';

interface ModelViewControlsProps {
  expanded: boolean;
  activeFloor: 'all' | 1 | 2;
  cameraPerspective: 'default' | 'isometric';
  dayCycleEnabled: boolean;
  heatmapEnabled: boolean;
  timeOfDay: number;
  vrMode: boolean;
  weatherData: WeatherData | null;
  selectedLocation: string;
  onToggleExpand: () => void;
  onSelectFloor: (floor: 'all' | 1 | 2) => void;
  onTogglePerspective: () => void;
  onToggleDayCycle: () => void;
  onToggleHeatmap: () => void;
  onToggleVrMode: () => void;
  onSelectLocation: (locationKey: string) => void;
}

export const ModelViewControls: React.FC<ModelViewControlsProps> = ({
  expanded,
  activeFloor,
  cameraPerspective,
  dayCycleEnabled,
  heatmapEnabled,
  timeOfDay,
  vrMode,
  weatherData,
  selectedLocation,
  onToggleExpand,
  onSelectFloor,
  onTogglePerspective,
  onToggleDayCycle,
  onToggleHeatmap,
  onToggleVrMode,
  onSelectLocation,
}) => {
  const [weatherMenuOpen, setWeatherMenuOpen] = useState(false);

  // Format simulated sun-path hour into standard clock string (e.g. 14:30)
  const hours = Math.floor(timeOfDay);
  const minutes = Math.floor((timeOfDay % 1) * 60);
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const isNight = timeOfDay < 6.0 || timeOfDay > 19.5;

  const getWeatherIcon = (cond?: WeatherData['condition']) => {
    switch (cond) {
      case 'rain':
        return <CloudRain className="w-3.5 h-3.5 text-cyan-400" />;
      case 'thunderstorm':
        return <CloudLightning className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
      case 'clouds':
      case 'fog':
        return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
      default:
        return <CloudSun className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2 w-auto max-w-[98vw] pointer-events-auto">
      {/* 1. Floor Selector Panel */}
      <div className="flex items-center p-1 rounded-xl bg-black/90 backdrop-blur-2xl border border-amber-500/35 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
        <button
          type="button"
          onClick={() => onSelectFloor('all')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeFloor === 'all'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">All Floors</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFloor(1)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeFloor === 1
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          Floor 1 (Ground)
        </button>

        <button
          type="button"
          onClick={() => onSelectFloor(2)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeFloor === 2
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          Floor 2 (Upper)
        </button>
      </div>

      {/* 2. Real-Time Meteorological Weather Sync (OpenWeatherMap / Open-Meteo) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setWeatherMenuOpen(!weatherMenuOpen)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border border-cyan-500/35 bg-black/90 hover:bg-black text-cyan-200 backdrop-blur-2xl shadow-xl transition-all cursor-pointer"
          title="OpenWeather Real-Time Meteorological Lighting Sync"
        >
          {getWeatherIcon(weatherData?.condition)}
          <span className="font-mono text-white text-[11px]">
            {weatherData ? `${weatherData.tempC}°C` : 'Live Weather'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            · {weatherData?.city.split(' ')[0]}
          </span>
        </button>

        {weatherMenuOpen && (
          <div className="absolute bottom-12 left-0 w-64 p-2.5 rounded-xl bg-black/95 backdrop-blur-2xl border border-cyan-500/40 shadow-2xl z-40 text-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px] font-mono text-cyan-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Schneider Global Hubs
              </span>
              <span>OpenWeather</span>
            </div>
            <div className="space-y-1">
              {Object.entries(PRESET_FACILITIES).map(([key, fac]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onSelectLocation(key);
                    setWeatherMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    selectedLocation === key
                      ? 'bg-cyan-500/20 text-cyan-200 font-semibold border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate">{fac.city}</span>
                  <span className="font-mono text-[10px] text-slate-400">{fac.country}</span>
                </button>
              ))}
            </div>
            {weatherData && (
              <div className="pt-1.5 border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Sky: {weatherData.conditionLabel}</span>
                <span>Wind: {weatherData.windSpeedKmH} km/h</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Real-time Sun-Path & Day Cycle Toggle (Shadow Capture & Lux Simulation) */}
      <button
        type="button"
        onClick={onToggleDayCycle}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-2xl shadow-xl cursor-pointer ${
          dayCycleEnabled
            ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
            : 'bg-black/90 hover:bg-black border-amber-500/35 text-slate-300 hover:text-white'
        }`}
        title="Toggle Real-Time Sun-Path Shadow Simulation & Circadian Lux Cycle"
      >
        {isNight ? (
          <Moon className={`w-3.5 h-3.5 ${dayCycleEnabled ? 'text-blue-300 animate-pulse' : 'text-slate-400'}`} />
        ) : (
          <Sun className={`w-3.5 h-3.5 ${dayCycleEnabled ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '10s' }} />
        )}
        <div className="flex items-center gap-1.5 whitespace-nowrap font-medium">
          <span>Day Cycle</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${dayCycleEnabled ? 'bg-amber-400/25 text-amber-300' : 'bg-white/10 text-slate-400'}`}>
            {dayCycleEnabled ? timeFormatted : '13:00'}
          </span>
        </div>
      </button>

      {/* 4. Real-Time Occupancy Heat Map Layer Overlay */}
      <button
        type="button"
        onClick={onToggleHeatmap}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-2xl shadow-xl cursor-pointer ${
          heatmapEnabled
            ? 'bg-gradient-to-r from-red-500/25 via-amber-500/25 to-blue-500/25 border-orange-400 text-orange-200 shadow-[0_0_22px_rgba(249,115,22,0.45)]'
            : 'bg-black/90 hover:bg-black border-amber-500/35 text-slate-300 hover:text-white'
        }`}
        title="Toggle GridSense Radar Occupancy Density Heatmap Layer"
      >
        <Activity className={`w-3.5 h-3.5 ${heatmapEnabled ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`} />
        <span className="whitespace-nowrap font-medium">
          {heatmapEnabled ? 'Heatmap: Active' : 'Occupancy Heatmap'}
        </span>
      </button>

      {/* 5. VR-Ready Stereoscopic Dual Viewport Mode (Standard VR / Google Cardboard) */}
      <button
        type="button"
        onClick={onToggleVrMode}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-2xl shadow-xl cursor-pointer ${
          vrMode
            ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.45)]'
            : 'bg-black/90 hover:bg-black border-amber-500/35 text-slate-300 hover:text-white'
        }`}
        title="Toggle Stereoscopic Dual Viewport VR Mode for Cardboard / VR Headsets"
      >
        <Glasses className={`w-3.5 h-3.5 ${vrMode ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
        <span className="whitespace-nowrap font-medium">
          {vrMode ? 'VR Mode Active' : 'VR View'}
        </span>
      </button>

      {/* 6. Camera Perspective Toggle (Isometric Top-Down / Orbital Perspective) */}
      <button
        type="button"
        onClick={onTogglePerspective}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-2xl shadow-xl cursor-pointer ${
          cameraPerspective === 'isometric'
            ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
            : 'bg-black/90 hover:bg-black border-amber-500/35 text-slate-300 hover:text-white'
        }`}
        title="Toggle 45° Top-Down Axonometric Isometric View for Architectural Building Analysis"
      >
        <Compass
          className={`w-3.5 h-3.5 ${
            cameraPerspective === 'isometric' ? 'text-amber-400 animate-spin' : 'text-slate-400'
          }`}
          style={{ animationDuration: '8s' }}
        />
        <span className="whitespace-nowrap font-medium">
          {cameraPerspective === 'isometric' ? 'Perspective View' : 'Isometric View'}
        </span>
      </button>

      {/* 7. Expand/Collapse Button */}
      <button
        type="button"
        onClick={onToggleExpand}
        className={`group relative flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all shadow-2xl backdrop-blur-2xl border cursor-pointer ${
          expanded
            ? 'bg-amber-400 hover:bg-amber-300 text-black border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.7)]'
            : 'bg-black/90 hover:bg-black text-amber-300 border-amber-500/60 hover:border-amber-400 shadow-[0_0_25px_rgba(212,175,55,0.35)]'
        }`}
      >
        {expanded ? (
          <>
            <Minimize2 className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="whitespace-nowrap">Assemble Digital Twin</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-4 h-4 transition-transform group-hover:scale-110 text-amber-400" />
            <span className="whitespace-nowrap">Expand · Kinetic Spatial Reveal</span>
          </>
        )}
        <span
          className={`ml-1 text-[9px] px-1.5 py-0.5 rounded font-mono ${
            expanded ? 'bg-black/25 text-black' : 'bg-amber-500/20 text-amber-200'
          }`}
        >
          {expanded ? 'Deconstructed' : 'Assembled'}
        </span>
      </button>
    </div>
  );
};

export const AudioToggleHeaderButton: React.FC<{
  audioEnabled: boolean;
  onToggleAudio: () => void;
  ambientNoiseEnabled: boolean;
  onToggleAmbientNoise: () => void;
}> = ({ audioEnabled, onToggleAudio, ambientNoiseEnabled, onToggleAmbientNoise }) => {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/85 backdrop-blur-xl border border-amber-500/30 shadow-lg">
      {/* 1. Interactive Sound FX Toggle */}
      <button
        type="button"
        onClick={onToggleAudio}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
          audioEnabled
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title={audioEnabled ? 'Sound FX Enabled (Expand & Floor clicks)' : 'Sound FX Muted'}
      >
        {audioEnabled ? (
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-slate-500" />
        )}
        <span className="font-mono text-[10px] tracking-tight">FX</span>
      </button>

      <div className="w-[1px] h-4 bg-white/10" />

      {/* 2. Industrial HVAC Ventilation Ambient Drone Toggle */}
      <button
        type="button"
        onClick={onToggleAmbientNoise}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
          ambientNoiseEnabled
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title={
          ambientNoiseEnabled
            ? 'HVAC Ambient Ventilation Drone: Active'
            : 'HVAC Ambient Ventilation Drone: Off'
        }
      >
        <Wind
          className={`w-3.5 h-3.5 ${
            ambientNoiseEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
          }`}
        />
        <span className="font-mono text-[10px] tracking-tight">HVAC Drone</span>
      </button>
    </div>
  );
};
