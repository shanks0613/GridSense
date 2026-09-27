import React, { useState } from 'react';
import { CabinData } from '../types/building';
import {
  Lightbulb,
  Fan,
  Shield,
  Zap,
  Users,
  Thermometer,
  Wind,
  Sun,
  Activity,
  Layers,
  CheckCircle2,
  FileDown,
  Check,
} from 'lucide-react';

interface CabinControlsPanelProps {
  cabins: Record<string, CabinData>;
  selectedCabinId: string | null;
  activeFloorFilter: 'all' | 1 | 2;
  onSelectCabin: (id: string | null) => void;
  onToggleComponent: (cabinId: string, component: keyof CabinData['components']) => void;
  onBatchAction: (action: 'all-lights-on' | 'all-lights-off' | 'eco-mode') => void;
}

export const CabinControlsPanel: React.FC<CabinControlsPanelProps> = ({
  cabins,
  selectedCabinId,
  activeFloorFilter,
  onSelectCabin,
  onToggleComponent,
  onBatchAction,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const cabinList = Object.values(cabins).filter(
    (c) => activeFloorFilter === 'all' || c.floor === activeFloorFilter,
  );

  // Compute aggregate building stats
  const totalWatts = Object.values(cabins).reduce(
    (sum, c) => sum + (c.components.power ? c.metrics.powerWatts : 12),
    0,
  );
  const totalOccupants = Object.values(cabins).reduce((sum, c) => sum + c.metrics.occupancy, 0);
  const activeLightsCount = Object.values(cabins).filter((c) => c.components.lights).length;

  // Generate Facility Report JSON document for download
  const handleGenerateFacilityReport = () => {
    const targetCabin = selectedCabinId ? cabins[selectedCabinId] : cabinList[0] || Object.values(cabins)[0];
    if (!targetCabin) return;

    const reportDocument = {
      reportHeader: {
        documentTitle: 'Schneider Electric GridSense Facility & Cabin Telemetry Report',
        systemPlatform: 'EcoStruxure™ Building Operation IoT Mesh',
        facilityName: 'Schneider Electric GridSense Corporate Innovation Campus',
        generatedTimestamp: new Date().toISOString(),
        reportId: `GS-RPT-${Date.now().toString(36).toUpperCase()}`,
        certification: 'ISO 50001 Energy Management & ASHRAE 55 Certified',
      },
      facilityAggregateMetrics: {
        activeElectricalDemandWatts: totalWatts,
        totalBuildingOccupants: totalOccupants,
        activeLightingCircuits: `${activeLightsCount} / ${Object.keys(cabins).length}`,
        hvacClimateSystemState: 'Autonomous Variable Air Volume (VAV) Active',
        solarDaylightHarvestingStatus: 'Closed-Loop Lux Modulation Enabled',
      },
      cabinTelemetrySummary: {
        cabinId: targetCabin.id,
        cabinName: targetCabin.name,
        architecturalFloorLevel: `Floor ${targetCabin.floor} (${targetCabin.floor === 1 ? 'Ground Wing' : 'Upper Deck'})`,
        spatialClassification: targetCabin.type,
        specificationNotes: targetCabin.description,
        electricalComponentStatus: {
          circadianLighting: targetCabin.components.lights ? 'ACTIVE (100% Luminaire Output)' : 'OFF (Standby 0W)',
          hvacClimateAirFlow: targetCabin.components.hvac ? 'ENABLED (Optimal Air Exchange)' : 'INACTIVE',
          smartPrivacyElectrochromicGlass: targetCabin.components.smartGlass ? 'OPAQUE (Privacy Mode)' : 'TRANSPARENT (Clear Daylight)',
          dedicatedCircuitPower: targetCabin.components.power ? 'ENERGIZED (Live Load)' : 'DISCONNECTED (Eco Safe)',
        },
        environmentalMetrics: {
          ambientTemperatureCelsius: targetCabin.metrics.temperature,
          carbonDioxideConcentrationPPM: targetCabin.metrics.co2,
          ambientIlluminanceLux: targetCabin.metrics.lux,
          activePowerConsumptionWatts: targetCabin.components.power ? targetCabin.metrics.powerWatts : 0,
          occupancyCountPersons: targetCabin.metrics.occupancy,
          occupancySensorTechnology: '60GHz mmWave FMCW Micro-Radar Telemetry',
        },
        regulatoryComplianceAuditing: {
          wellStandardAirQuality: targetCabin.metrics.co2 <= 600 ? 'OPTIMAL' : 'ACCEPTABLE',
          ashraeStandard55ThermalComfort: targetCabin.metrics.temperature >= 21 && targetCabin.metrics.temperature <= 24 ? 'COMPLIANT' : 'REVIEW_REQUIRED',
          circadianLuxAdequacy: targetCabin.metrics.lux >= 500 ? 'MEETS_RECOMMENDATIONS' : 'SUPPLEMENTAL_LIGHT_REQUIRED',
        },
      },
    };

    const jsonString = JSON.stringify(reportDocument, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gridsense-facility-report-${targetCabin.id}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 2500);
  };

  return (
    <aside
      onWheel={(e) => e.stopPropagation()}
      className="w-full lg:w-[410px] flex flex-col bg-[#0b0c11]/90 backdrop-blur-2xl border-l border-amber-500/20 text-slate-200 h-full overflow-hidden shadow-2xl overscroll-contain select-text"
    >
      {/* Header */}
      <div className="p-4 border-b border-amber-500/15 bg-gradient-to-r from-amber-950/20 via-black/40 to-transparent shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />
            <h2 className="font-semibold text-sm tracking-wide text-amber-200">
              Cabin Electrical Hub
            </h2>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/60 border border-amber-500/25 text-amber-400 tabular-nums">
            {totalWatts}W Live
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Interactive load control across Ground and Upper architectural sections.
        </p>

        {/* Global Quick Action Strip */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <button
            type="button"
            onClick={() => onBatchAction('all-lights-on')}
            className="px-2 py-1.5 rounded-md text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>All On</span>
          </button>
          <button
            type="button"
            onClick={() => onBatchAction('all-lights-off')}
            className="px-2 py-1.5 rounded-md text-[11px] font-medium bg-slate-900/60 hover:bg-slate-800/70 border border-white/10 text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-slate-400" />
            <span>All Off</span>
          </button>
          <button
            type="button"
            onClick={() => onBatchAction('eco-mode')}
            className="px-2 py-1.5 rounded-md text-[11px] font-medium bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Eco Mode</span>
          </button>
        </div>

        {/* Generate Facility Report Button (User Request 1) */}
        <div className="mt-3 pt-2.5 border-t border-white/10">
          <button
            type="button"
            onClick={handleGenerateFacilityReport}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer ${
              downloadSuccess
                ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 hover:border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            }`}
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-cyan-400 animate-bounce" />
                <span>Facility Report Downloaded (.JSON)</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-amber-400" />
                <span>
                  Generate Facility Report{' '}
                  <strong className="font-mono text-amber-300 font-normal">
                    ({selectedCabinId ? cabins[selectedCabinId]?.name.split(' ')[0] : 'Selected Cabin'})
                  </strong>
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Aggregate Bar */}
      <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400/80" />
          <span>Active Lights: <strong className="text-amber-200">{activeLightsCount} / {Object.keys(cabins).length}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>Occupancy: <strong className="text-slate-200">{totalOccupants} pers</strong></span>
        </div>
      </div>

      {/* Cabins Scrollable List */}
      <div
        onWheel={(e) => e.stopPropagation()}
        className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-white/5 overscroll-contain touch-pan-y"
      >
        {cabinList.map((cabin) => {
          const isSelected = selectedCabinId === cabin.id;
          return (
            <div
              key={cabin.id}
              onClick={() => onSelectCabin(isSelected ? null : cabin.id)}
              className={`pt-2.5 transition-all rounded-lg p-3 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/10 border border-amber-500/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                  : 'bg-black/35 hover:bg-black/55 border border-white/5 hover:border-amber-500/25'
              }`}
            >
              {/* Cabin Title Row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      Floor {cabin.floor}
                    </span>
                    <h3 className="text-xs font-semibold text-slate-100 tracking-tight">
                      {cabin.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {cabin.description}
                  </p>
                </div>
                <div
                  className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: cabin.floorColor }}
                  title="Floor Material Finish"
                />
              </div>

              {/* Environmental Telemetry Chips */}
              <div className="grid grid-cols-4 gap-1.5 mt-2.5 text-[10px] font-mono text-slate-300">
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                  <Thermometer className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{cabin.metrics.temperature}°C</span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                  <Wind className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{cabin.metrics.co2}ppm</span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                  <Sun className="w-3 h-3 text-yellow-400 shrink-0" />
                  <span>{cabin.metrics.lux}lx</span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                  <Zap className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>{cabin.components.power ? cabin.metrics.powerWatts : 0}W</span>
                </div>
              </div>

              {/* Interactive Electrical Component Switches */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                {/* 1. Lights Switch */}
                <button
                  type="button"
                  onClick={() => onToggleComponent(cabin.id, 'lights')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all text-center ${
                    cabin.components.lights
                      ? 'bg-amber-500/25 border-amber-400/60 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-black/40 border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle 3D Room Lighting Fixture"
                >
                  <Lightbulb
                    className={`w-4 h-4 mb-1 ${
                      cabin.components.lights ? 'text-amber-300 animate-pulse' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[10px] font-medium leading-none">
                    {cabin.components.lights ? 'Lights ON' : 'Lights OFF'}
                  </span>
                </button>

                {/* 2. HVAC Switch */}
                <button
                  type="button"
                  onClick={() => onToggleComponent(cabin.id, 'hvac')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all text-center ${
                    cabin.components.hvac
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                      : 'bg-black/40 border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle Climate Control"
                >
                  <Fan
                    className={`w-4 h-4 mb-1 ${
                      cabin.components.hvac ? 'text-cyan-300 animate-spin' : 'text-slate-500'
                    }`}
                    style={{ animationDuration: '3s' }}
                  />
                  <span className="text-[10px] font-medium leading-none">
                    {cabin.components.hvac ? 'HVAC ON' : 'HVAC OFF'}
                  </span>
                </button>

                {/* 3. Smart Glass Switch */}
                <button
                  type="button"
                  onClick={() => onToggleComponent(cabin.id, 'smartGlass')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all text-center ${
                    cabin.components.smartGlass
                      ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                      : 'bg-black/40 border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle 3D Smart Partition Frosting"
                >
                  <Shield
                    className={`w-4 h-4 mb-1 ${
                      cabin.components.smartGlass ? 'text-purple-300' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[10px] font-medium leading-none">
                    {cabin.components.smartGlass ? 'Frosted' : 'Clear'}
                  </span>
                </button>

                {/* 4. Power Outlets */}
                <button
                  type="button"
                  onClick={() => onToggleComponent(cabin.id, 'power')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all text-center ${
                    cabin.components.power
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-black/40 border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                  title="Toggle Auxiliary Power"
                >
                  <Zap
                    className={`w-4 h-4 mb-1 ${
                      cabin.components.power ? 'text-cyan-300' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[10px] font-medium leading-none">
                    {cabin.components.power ? 'Power ON' : 'Power OFF'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-white/10 bg-black/60 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Schneider EcoStruxure Connected</span>
        </div>
        <span className="font-mono text-slate-400">Mesh v4.2</span>
      </div>
    </aside>
  );
};
