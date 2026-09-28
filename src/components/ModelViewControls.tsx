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
import {
  WeatherData,
  PRESET_FACILITIES,
  WEATHER_PRESETS,
  WeatherPresetType,
} from '../utils/weather';

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
  activeWeatherPreset?: WeatherPresetType;
  onToggleExpand: () => void;
  onSelectFloor: (floor: 'all' | 1 | 2) => void;
  onTogglePerspective: () => void;
  onToggleDayCycle: () => void;
  onToggleHeatmap: () => void;
  onToggleVrMode: () => void;
  onSelectLocation: (locationKey: string) => void;
  onSelectWeatherPreset?: (preset: WeatherPresetType) => void;
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
  activeWeatherPreset = 'live',
  onToggleExpand,
  onSelectFloor,
  onTogglePerspective,
  onToggleDayCycle,
  onToggleHeatmap,
  onToggleVrMode,
  onSelectLocation,
  onSelectWeatherPreset,
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
        return <CloudRain className="w-3.5 h-3.5 text-[#ff8a50]" />;
      case 'thunderstorm':
        return <CloudLightning className="w-3.5 h-3.5 text-[#e06d3b] animate-pulse" />;
      case 'clouds':
      case 'fog':
        return <Cloud className="w-3.5 h-3.5 text-[#d4d4d8]" />;
      default:
        return <CloudSun className="w-3.5 h-3.5 text-[#ff8a50]" />;
    }
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2 w-auto max-w-[98vw] pointer-events-auto font-sans">
      {/* 1. Floor Selector Panel with Physical Elevation Highlights */}
      <div className="flex items-center p-1 rounded-xl bg-[#1e1e24]/95 backdrop-blur-2xl border border-[#3a3a44] shadow-[0_10px_35px_rgba(0,0,0,0.4),0_0_20px_rgba(224,109,59,0.15)]">
        <button
          type="button"
          onClick={() => onSelectFloor('all')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            activeFloor === 'all'
              ? 'bg-gradient-to-r from-[#d95d2c] to-[#e06d3b] text-white font-semibold shadow-[0_0_15px_rgba(224,109,59,0.45)]'
              : 'text-[#d4d4d8] hover:text-white hover:bg-white/5'
          }`}
          title="Overview: Assemble All Levels in Full Dual-Deck Architecture"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">All Floors</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFloor(1)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeFloor === 1
              ? 'bg-gradient-to-r from-[#d95d2c] to-[#e06d3b] text-white font-semibold shadow-[0_0_15px_rgba(224,109,59,0.45)]'
              : 'text-[#d4d4d8] hover:text-white hover:bg-white/5'
          }`}
          title="Highlight Floor 1: Elevates Upper Deck smoothly with spring physics and isolates Ground Wing"
        >
          Floor 1 (Ground)
        </button>

        <button
          type="button"
          onClick={() => onSelectFloor(2)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeFloor === 2
              ? 'bg-gradient-to-r from-[#d95d2c] to-[#e06d3b] text-white font-semibold shadow-[0_0_15px_rgba(224,109,59,0.45)]'
              : 'text-[#d4d4d8] hover:text-white hover:bg-white/5'
          }`}
          title="Highlight Floor 2: Lifts roof canopy with spring physics and isolates Upper Deck"
        >
          Floor 2 (Upper)
        </button>
      </div>

      {/* 2. Keyless Real-Time Meteorological Weather Sync & Simulation */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setWeatherMenuOpen(!weatherMenuOpen)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border border-[#3a3a44] bg-[#1e1e24]/95 hover:bg-[#25252d] text-[#ff8a50] backdrop-blur-2xl shadow-xl transition-all cursor-pointer"
          title="Keyless Meteorological Climate & Lighting Sync (No API Key Required)"
        >
          {getWeatherIcon(weatherData?.condition)}
          <span className="font-mono text-white text-[11px]">
            {weatherData ? `${weatherData.tempC}°C` : 'Live Weather'}
          </span>
          <span className="text-[10px] text-[#a1a1aa] font-mono hidden sm:inline">
            · {weatherData?.city.split(' ')[0]}
          </span>
          {weatherData?.isManualOverride && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a50]" title="Manual Simulation" />
          )}
        </button>

        {weatherMenuOpen && (
          <div className="absolute bottom-12 left-0 w-72 p-3 rounded-xl bg-[#1e1e24]/98 backdrop-blur-2xl border border-[#3a3a44] shadow-2xl z-40 text-xs space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#2d2d36] text-[10px] font-mono text-[#ff8a50]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Schneider Global Hubs
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#25252d] border border-[#3a3a44] text-[#d4d4d8]">
                Keyless Sync
              </span>
            </div>

            {/* Global Hubs */}
            <div className="space-y-1">
              {Object.entries(PRESET_FACILITIES).map(([key, fac]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onSelectLocation(key);
                    if (onSelectWeatherPreset) onSelectWeatherPreset('live');
                    setWeatherMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    selectedLocation === key && activeWeatherPreset === 'live'
                      ? 'bg-[#e06d3b]/20 text-[#ff8a50] font-semibold border border-[#e06d3b]/30'
                      : 'text-[#d4d4d8] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate">{fac.city}</span>
                  <span className="font-mono text-[10px] text-[#a1a1aa]">{fac.country}</span>
                </button>
              ))}
            </div>

            {/* Quick Meteorological Simulation Controls */}
            {onSelectWeatherPreset && (
              <div className="pt-2 border-t border-[#2d2d36] space-y-1.5">
                <div className="text-[10px] font-mono text-[#ff8a50] uppercase tracking-wider flex items-center justify-between">
                  <span>Atmosphere Simulation</span>
                  <span className="text-[#a1a1aa] text-[9px]">1-Click Demo</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {WEATHER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectWeatherPreset(p.id);
                        setWeatherMenuOpen(false);
                      }}
                      className={`px-2 py-1.5 rounded text-[11px] text-left transition-colors truncate ${
                        activeWeatherPreset === p.id
                          ? 'bg-[#e06d3b]/25 border border-[#e06d3b]/50 text-[#ff8a50] font-semibold'
                          : 'bg-[#25252d] text-[#d4d4d8] hover:bg-[#2d2d36] hover:text-white border border-[#3a3a44]'
                      }`}
                    >
                      {p.label.split(' ')[0]} {p.label.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {weatherData && (
              <div className="pt-1.5 border-t border-[#2d2d36] text-[10px] font-mono text-[#a1a1aa] flex items-center justify-between">
                <span>Sky: {weatherData.conditionLabel}</span>
                <span>Wind: {weatherData.windSpeedKmH} km/h</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Sun-Path & Day Cycle Toggle */}
      <button
        type="button"
        onClick={onToggleDayCycle}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-2xl shadow-xl cursor-pointer ${
          dayCycleEnabled
            ? 'bg-[#e06d3b]/25 border-[#e06d3b] text-[#ff8a50] shadow-[0_0_20px_rgba(224,109,59,0.35)]'
            : 'bg-[#1e1e24]/95 hover:bg-[#25252d] border-[#3a3a44] text-[#d4d4d8] hover:text-white'
        }`}
        title="Toggle Real-Time Sun-Path Shadow Simulation & Circadian Lux Cycle"
      >
        {isNight ? (
          <Moon className={`w-3.5 h-3.5 ${dayCycleEnabled ? 'text-[#ff8a50] animate-pulse' : 'text-[#71717a]'}`} />
        ) : (
          <Sun className={`w-3.5 h-3.5 ${dayCycleEnabled ? 'text-[#ff8a50] animate-spin' : 'text-[#71717a]'}`} style={{ animationDuration: '10s' }} />
        )}
        <div className="flex items-center gap-1.5 whitespace-nowrap font-medium">
          <span>Day Cycle</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${dayCycleEnabled ? 'bg-[#e06d3b]/30 text-white' : 'bg-white/10 text-[#a1a1aa]'}`}>
            {dayCycleEnabled ? timeFormatted : '13:00'}
          </span>
        </div>
      </button>

      {/* 4. Occupancy Heatmap Layer Toggle */}
      <button
        type="button"
        onClick={onToggleHeatmap}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-2xl shadow-xl cursor-pointer ${
          heatmapEnabled
            ? 'bg-gradient-to-r from-[#d95d2c]/30 to-[#b84c1e]/30 border-[#e06d3b] text-[#ff8a50] shadow-[0_0_22px_rgba(224,109,59,0.35)]'
            : 'bg-[#1e1e24]/95 hover:bg-[#25252d] border-[#3a3a44] text-[#d4d4d8] hover:text-white'
        }`}
        title="Toggle GridSense Radar Occupancy Density Heatmap Layer"
      >
        <Activity className={`w-3.5 h-3.5 ${heatmapEnabled ? 'text-[#ff8a50] animate-pulse' : 'text-[#71717a]'}`} />
        <span className="whitespace-nowrap font-medium">
          {heatmapEnabled ? 'Heatmap: Active' : 'Occupancy Heatmap'}
        </span>
      </button>

      {/* 5. VR-Ready Stereoscopic Dual Viewport Mode */}
      <button
        type="button"
        onClick={onToggleVrMode}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-2xl shadow-xl cursor-pointer ${
          vrMode
            ? 'bg-[#e06d3b]/25 border-[#e06d3b] text-[#ff8a50] shadow-[0_0_20px_rgba(224,109,59,0.35)]'
            : 'bg-[#1e1e24]/95 hover:bg-[#25252d] border-[#3a3a44] text-[#d4d4d8] hover:text-white'
        }`}
        title="Toggle Stereoscopic Dual Viewport VR Mode for Cardboard / VR Headsets"
      >
        <Glasses className={`w-3.5 h-3.5 ${vrMode ? 'text-[#ff8a50] animate-pulse' : 'text-[#71717a]'}`} />
        <span className="whitespace-nowrap font-medium">
          {vrMode ? 'VR Mode Active' : 'VR View'}
        </span>
      </button>

      {/* 6. Camera Perspective Toggle */}
      <button
        type="button"
        onClick={onTogglePerspective}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-2xl shadow-xl cursor-pointer ${
          cameraPerspective === 'isometric'
            ? 'bg-[#e06d3b]/25 border-[#e06d3b] text-[#ff8a50] shadow-[0_0_20px_rgba(224,109,59,0.35)]'
            : 'bg-[#1e1e24]/95 hover:bg-[#25252d] border-[#3a3a44] text-[#d4d4d8] hover:text-white'
        }`}
        title="Toggle 45° Top-Down Axonometric Isometric View for Architectural Analysis"
      >
        <Compass
          className={`w-3.5 h-3.5 ${
            cameraPerspective === 'isometric' ? 'text-[#ff8a50] animate-spin' : 'text-[#71717a]'
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
            ? 'bg-gradient-to-r from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] text-white border-[#ff8a50] shadow-[0_0_30px_rgba(224,109,59,0.5)]'
            : 'bg-[#1e1e24]/95 hover:bg-[#25252d] text-[#ff8a50] border-[#e06d3b]/60 hover:border-[#ff8a50] shadow-[0_0_25px_rgba(224,109,59,0.25)]'
        }`}
      >
        {expanded ? (
          <>
            <Minimize2 className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="whitespace-nowrap">Assemble Digital Twin</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-4 h-4 transition-transform group-hover:scale-110 text-[#ff8a50]" />
            <span className="whitespace-nowrap">Expand · Kinetic Spatial Reveal</span>
          </>
        )}
        <span
          className={`ml-1 text-[9px] px-1.5 py-0.5 rounded font-mono ${
            expanded ? 'bg-[#1e1e24]/60 text-white' : 'bg-[#e06d3b]/20 text-[#ff8a50]'
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
  audioError?: string | null;
}> = ({ audioEnabled, onToggleAudio, ambientNoiseEnabled, onToggleAmbientNoise }) => {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1e1e24]/90 backdrop-blur-xl border border-[#3a3a44] shadow-lg">
      {/* 1. Interactive Sound FX Toggle */}
      <button
        type="button"
        onClick={onToggleAudio}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
          audioEnabled
            ? 'bg-[#e06d3b]/20 text-[#ff8a50] border border-[#e06d3b]/40'
            : 'text-[#a1a1aa] hover:text-white'
        }`}
        title={audioEnabled ? 'Sound FX Enabled (Expand & Floor clicks)' : 'Sound FX Muted'}
      >
        {audioEnabled ? (
          <Volume2 className="w-3.5 h-3.5 text-[#ff8a50]" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-[#71717a]" />
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
            ? 'bg-[#c2572b]/25 text-[#ff8a50] border border-[#c2572b]/50 shadow-[0_0_12px_rgba(194,87,43,0.3)]'
            : 'text-[#a1a1aa] hover:text-white'
        }`}
        title={
          ambientNoiseEnabled
            ? 'HVAC Ambient Ventilation Drone: Active'
            : 'HVAC Ambient Ventilation Drone: Off'
        }
      >
        <Wind
          className={`w-3.5 h-3.5 ${
            ambientNoiseEnabled ? 'text-[#ff8a50] animate-pulse' : 'text-[#71717a]'
          }`}
        />
        <span className="font-mono text-[10px] tracking-tight">HVAC Drone</span>
      </button>
    </div>
  );
};
