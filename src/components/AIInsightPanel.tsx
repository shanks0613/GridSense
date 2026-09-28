import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  TrendingDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { CabinData } from '../types/building';

interface AIInsightPanelProps {
  activeFloor: 'all' | 1 | 2;
  cabins: Record<string, CabinData>;
  onApplyOptimization: () => void;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({
  activeFloor,
  cabins,
  onApplyOptimization,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [applied, setApplied] = useState(false);

  // Filter cabins for active floor
  const floorCabins = Object.values(cabins).filter(
    (c) => activeFloor === 'all' || c.floor === activeFloor
  );

  // Analyze floor telemetry:
  // 1. Wasted energy detection: lights ON in unoccupied rooms (occupancy === 0)
  const emptyRoomsWithLights = floorCabins.filter(
    (c) => c.components.lights && c.metrics.occupancy === 0
  );

  // 2. High lux daylight harvesting opportunity (lux > 550 and lights on)
  const daylightHarvestingCandidates = floorCabins.filter(
    (c) => c.components.lights && c.metrics.lux > 550
  );

  // 3. Air quality / HVAC need
  const highCo2Rooms = floorCabins.filter((c) => c.metrics.co2 > 650);

  // Dynamic Sustainability Score (0 - 100)
  let score = 96;
  if (emptyRoomsWithLights.length > 0) {
    score -= emptyRoomsWithLights.length * 7;
  }
  if (daylightHarvestingCandidates.length > 0) {
    score -= daylightHarvestingCandidates.length * 3;
  }
  if (highCo2Rooms.length > 0) {
    score -= highCo2Rooms.length * 4;
  }
  score = Math.max(62, Math.min(100, score));

  let grade = 'A+ (Net Zero Ready)';
  let gradeColor = 'text-[#ff8a50]';
  let badgeBg = 'bg-[#e06d3b]/15 border-[#e06d3b]/40';
  if (score < 80) {
    grade = 'B (Action Required)';
    gradeColor = 'text-[#e03b24]';
    badgeBg = 'bg-[#e03b24]/15 border-[#e03b24]/40';
  } else if (score < 90) {
    grade = 'A- (High Efficiency)';
    gradeColor = 'text-[#f07e48]';
    badgeBg = 'bg-[#f07e48]/15 border-[#f07e48]/40';
  }

  const handleApply = () => {
    onApplyOptimization();
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
    }, 2800);
  };

  return (
    <div className="absolute top-16 right-4 lg:right-auto lg:left-4 z-20 w-80 sm:w-88 rounded-2xl bg-[#1e1e24]/95 backdrop-blur-2xl border border-[#3a3a44] shadow-[0_15px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(224,109,59,0.15)] pointer-events-auto transition-all font-sans text-[#f4f4f5]">
      {/* Panel Header */}
      <div
        className="p-3.5 flex items-center justify-between cursor-pointer border-b border-[#2d2d36] select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e06d3b]/25 to-[#b84c1e]/40 border border-[#e06d3b]/50 flex items-center justify-center text-[#ff8a50] shadow-[0_0_12px_rgba(224,109,59,0.25)]">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-xs text-white tracking-wide">
                EcoStruxure™ AI Insight
              </h3>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#e06d3b]/15 text-[#ff8a50] border border-[#e06d3b]/30">
                Live
              </span>
            </div>
            <p className="text-[10px] text-[#a1a1aa]">
              {activeFloor === 'all' ? 'Campus Aggregate' : `Floor ${activeFloor} Telemetry`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${badgeBg} ${gradeColor}`}>
            {score}/100
          </div>
          <button
            type="button"
            className="text-[#a1a1aa] hover:text-white transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {!collapsed && (
        <div className="p-3.5 space-y-3 text-xs">
          {/* Sustainability Score Gauge & Rating */}
          <div className="p-2.5 rounded-xl bg-[#25252d] border border-[#32323c] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${score > 88 ? 'text-[#ff8a50]' : 'text-[#e03b24]'}`} />
              <div>
                <span className="text-[10px] font-mono text-[#a1a1aa] uppercase">Sustainability Rating</span>
                <div className={`font-semibold text-xs ${gradeColor}`}>{grade}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#a1a1aa]">Peak Load</span>
              <div className="font-mono text-xs text-[#ff8a50] font-semibold">
                {floorCabins.reduce((s, c) => s + (c.components.power ? c.metrics.powerWatts : 12), 0)}W
              </div>
            </div>
          </div>

          {/* AI Energy Efficiency Recommendations */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#a1a1aa] uppercase">
              <span>Smart Recommendation</span>
              <TrendingDown className="w-3 h-3 text-[#ff8a50]" />
            </div>

            {emptyRoomsWithLights.length > 0 ? (
              <div className="p-2.5 rounded-lg bg-[#e03b24]/10 border border-[#e03b24]/30 text-[#fca5a5] text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#e03b24] shrink-0 mt-0.5" />
                <div>
                  <strong>{emptyRoomsWithLights.length} unoccupied room(s)</strong> have active luminaires.
                  Turn off circuits to save ~{emptyRoomsWithLights.length * 45}W immediately.
                </div>
              </div>
            ) : daylightHarvestingCandidates.length > 0 ? (
              <div className="p-2.5 rounded-lg bg-[#e06d3b]/10 border border-[#e06d3b]/30 text-[#fed7aa] text-[11px] flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-[#ff8a50] shrink-0 mt-0.5" />
                <div>
                  Daylight harvesting at <strong>{daylightHarvestingCandidates[0].metrics.lux} Lux</strong>.
                  Closed-loop DALI-2 auto-dimming can reduce load by 28%.
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#282832] border border-[#3a3a46] text-[#d4d4d8] text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#ff8a50] shrink-0 mt-0.5" />
                <div>
                  Floor operating at optimal ASHRAE-55 and Net-Zero thermal efficiency.
                </div>
              </div>
            )}
          </div>

          {/* One-Click Apply Action */}
          <button
            type="button"
            onClick={handleApply}
            className={`w-full py-2 px-3 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              applied
                ? 'bg-[#e06d3b]/30 border border-[#e06d3b] text-white shadow-[0_0_15px_rgba(224,109,59,0.35)]'
                : 'bg-gradient-to-r from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] hover:brightness-110 text-white shadow-[0_0_15px_rgba(224,109,59,0.3)]'
            }`}
          >
            {applied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>AI Optimization Applied</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Apply AI Eco-Optimization</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
