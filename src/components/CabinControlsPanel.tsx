import React, { useState } from 'react';
import { CabinData } from '../types/building';
import {
  Lightbulb,
  Fan,
  Shield,
  Zap,
  Users,
  Layers,
  CheckCircle2,
  FileDown,
  Building,
} from 'lucide-react';
import { FacilityReportModal } from './FacilityReportModal';

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
  const [reportModalOpen, setReportModalOpen] = useState(false);

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

  return (
    <>
      <aside
        className="w-full lg:w-84 xl:w-92 h-full flex flex-col bg-[#1e1e24]/95 backdrop-blur-2xl border-l border-[#3a3a44] shrink-0 z-20 shadow-2xl overflow-hidden font-sans text-[#f4f4f5]"
        aria-label="Cabin controls and monitoring"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#2d2d36] bg-gradient-to-r from-[#282832]/60 via-[#1e1e24] to-transparent shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#e06d3b] shadow-[0_0_10px_rgba(224,109,59,0.8)] animate-pulse" />
              <h2 className="font-semibold text-sm tracking-wide text-white">
                Cabin Electrical Hub
              </h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#2a2a34] border border-[#3e3e4c] text-[#ff8a50] tabular-nums">
              {totalWatts}W Live
            </span>
          </div>
          <p className="text-xs text-[#a1a1aa] mt-1">
            Interactive load control across Ground and Upper architectural decks.
          </p>

          {/* Global Quick Action Strip */}
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            <button
              type="button"
              onClick={() => onBatchAction('all-lights-on')}
              className="px-2 py-1.5 rounded-md text-[11px] font-medium bg-[#e06d3b]/15 hover:bg-[#e06d3b]/25 border border-[#e06d3b]/35 text-[#ff8a50] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#ff8a50]" />
              <span>All On</span>
            </button>
            <button
              type="button"
              onClick={() => onBatchAction('all-lights-off')}
              className="px-2 py-1.5 rounded-md text-[11px] font-medium bg-[#2a2a34] hover:bg-[#32323e] border border-[#3a3a48] text-[#d4d4d8] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#71717a]" />
              <span>All Off</span>
            </button>
            <button
              type="button"
              onClick={() => onBatchAction('eco-mode')}
              className="px-2 py-1.5 rounded-md text-[11px] font-medium bg-[#c2572b]/20 hover:bg-[#c2572b]/30 border border-[#c2572b]/40 text-[#ff8a50] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#ff8a50]" />
              <span>Eco Mode</span>
            </button>
          </div>

          {/* Generate Facility Report Button - Opens Format Selector Modal */}
          <div className="mt-3 pt-2.5 border-t border-[#2d2d36]">
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer bg-gradient-to-r from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] hover:brightness-110 border border-[#e06d3b]/60 text-white shadow-[0_0_15px_rgba(224,109,59,0.25)]"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>
                Generate Facility Report{' '}
                <strong className="font-mono text-white/90 font-normal">
                  ({selectedCabinId ? cabins[selectedCabinId]?.name.split(' ')[0] : 'All Cabins'})
                </strong>
              </span>
            </button>
          </div>
        </div>

        {/* Aggregate Bar */}
        <div className="px-4 py-2.5 bg-[#25252d] border-b border-[#2d2d36] flex items-center justify-between text-xs text-[#d4d4d8]">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#ff8a50]" />
            <span>Active Lights: <strong className="text-white">{activeLightsCount} / {Object.keys(cabins).length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#d4d4d8]" />
            <span>Occupancy: <strong className="text-white">{totalOccupants} pers</strong></span>
          </div>
        </div>

        {/* Cabins Scrollable List */}
        <div
          onWheel={(e) => e.stopPropagation()}
          className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-[#2d2d36] overscroll-contain touch-pan-y"
        >
          {cabinList.map((cabin) => {
            const isSelected = selectedCabinId === cabin.id;
            return (
              <div
                key={cabin.id}
                onClick={() => onSelectCabin(isSelected ? null : cabin.id)}
                className={`pt-2.5 transition-all rounded-lg p-3 cursor-pointer ${
                  isSelected
                    ? 'bg-[#2a2422] border border-[#e06d3b] shadow-[0_0_15px_rgba(224,109,59,0.2)]'
                    : 'bg-[#25252d]/60 hover:bg-[#25252d] border border-transparent'
                }`}
              >
                {/* Cabin Header Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">
                      {cabin.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e1e24] text-[#ff8a50] border border-[#3e3e4c]">
                      Floor {cabin.floor}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-white font-semibold tabular-nums">
                    {cabin.components.power ? cabin.metrics.powerWatts : 0}W
                  </span>
                </div>

                {/* Telemetry Metrics strip */}
                <div className="grid grid-cols-4 gap-1 mt-2 text-[10px] font-mono text-[#a1a1aa] bg-[#1a1a20] p-1.5 rounded border border-[#2d2d36]">
                  <div>
                    <span className="text-[#71717a]">Radar:</span>{' '}
                    <strong className="text-[#ff8a50]">{cabin.metrics.occupancy}p</strong>
                  </div>
                  <div>
                    <span className="text-[#71717a]">CO₂:</span>{' '}
                    <strong className="text-white">{cabin.metrics.co2}</strong>
                  </div>
                  <div>
                    <span className="text-[#71717a]">Lux:</span>{' '}
                    <strong className="text-white">{cabin.metrics.lux}</strong>
                  </div>
                  <div>
                    <span className="text-[#71717a]">Temp:</span>{' '}
                    <strong className="text-white">{cabin.metrics.temperature}°C</strong>
                  </div>
                </div>

                {/* Component Circuit Controls (4 Switches) */}
                <div
                  className="grid grid-cols-4 gap-1.5 mt-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 1. Lights Switch */}
                  <button
                    type="button"
                    onClick={() => onToggleComponent(cabin.id, 'lights')}
                    className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all text-center ${
                      cabin.components.lights
                        ? 'bg-[#e06d3b]/25 border-[#e06d3b] text-white shadow-[0_0_10px_rgba(224,109,59,0.3)]'
                        : 'bg-[#1e1e24] border-[#32323c] text-[#71717a] hover:text-[#d4d4d8]'
                    }`}
                    title="Toggle Lighting Circuit"
                  >
                    <Lightbulb
                      className={`w-4 h-4 mb-1 ${
                        cabin.components.lights ? 'text-[#ff8a50]' : 'text-[#71717a]'
                      }`}
                    />
                    <span className="text-[10px] font-medium leading-none">
                      {cabin.components.lights ? 'Light ON' : 'Light OFF'}
                    </span>
                  </button>

                  {/* 2. HVAC Switch */}
                  <button
                    type="button"
                    onClick={() => onToggleComponent(cabin.id, 'hvac')}
                    className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all text-center ${
                      cabin.components.hvac
                        ? 'bg-[#c2572b]/25 border-[#c2572b] text-white shadow-[0_0_10px_rgba(194,87,43,0.3)]'
                        : 'bg-[#1e1e24] border-[#32323c] text-[#71717a] hover:text-[#d4d4d8]'
                    }`}
                    title="Toggle Climate Control"
                  >
                    <Fan
                      className={`w-4 h-4 mb-1 ${
                        cabin.components.hvac ? 'text-[#f07e48] animate-spin' : 'text-[#71717a]'
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
                        ? 'bg-[#8c7264]/30 border-[#a88d7d] text-white'
                        : 'bg-[#1e1e24] border-[#32323c] text-[#71717a] hover:text-[#d4d4d8]'
                    }`}
                    title="Toggle 3D Smart Partition Frosting"
                  >
                    <Shield
                      className={`w-4 h-4 mb-1 ${
                        cabin.components.smartGlass ? 'text-[#d4c4be]' : 'text-[#71717a]'
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
                        ? 'bg-[#ff8a50]/20 border-[#ff8a50]/60 text-white shadow-[0_0_10px_rgba(255,138,80,0.25)]'
                        : 'bg-[#1e1e24] border-[#32323c] text-[#71717a] hover:text-[#d4d4d8]'
                    }`}
                    title="Toggle Auxiliary Power"
                  >
                    <Zap
                      className={`w-4 h-4 mb-1 ${
                        cabin.components.power ? 'text-[#ff8a50]' : 'text-[#71717a]'
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
        <div className="p-3 border-t border-[#2d2d36] bg-[#1a1a20] text-[11px] text-[#a1a1aa] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#ff8a50]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Schneider EcoStruxure Connected</span>
          </div>
          <span className="font-mono text-[#71717a]">Mesh v4.2</span>
        </div>
      </aside>

      {/* Facility Report Export Format Modal */}
      <FacilityReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        cabins={cabins}
        selectedCabinId={selectedCabinId}
        activeFloorFilter={activeFloorFilter}
      />
    </>
  );
};
