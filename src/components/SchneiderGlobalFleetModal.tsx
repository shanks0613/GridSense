import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Cpu,
  CheckCircle2,
  Zap,
  Sliders,
  Download,
  X,
  Radio,
  Server,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface OfficeSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  timezone: string;
  gatewayStatus: 'connected' | 'degraded' | 'offline';
  gatewayIp: string;
  gatewayType: string;
  latencyMs: number;
  netZeroScore: number;
  totalLoadKw: number;
  sensorCount: number;
}

interface SensorDevice {
  id: string;
  serialNumber: string;
  name: string;
  floor: number;
  roomId: string;
  status: 'online' | 'standby' | 'calibrating' | 'offline';
  ipAddress: string;
  macAddress: string;
  protocol: 'BACnet/IP' | 'Matter' | 'Modbus TCP' | 'EcoStruxure MQTT';
  telemetry: {
    occupancy: number;
    lux: number;
    co2: number;
    temperature: number;
  };
  circuits: {
    lights: boolean;
    hvac: boolean;
    smartGlass: boolean;
    outlets: boolean;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeOfficeId: string;
  onSelectOffice: (officeId: string) => void;
  onSensorInstalled?: (sensor: any) => void;
}

export const SchneiderGlobalFleetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeOfficeId,
  onSelectOffice,
  onSensorInstalled,
}) => {
  const [offices, setOffices] = useState<OfficeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'fleet' | 'install' | 'control'>('fleet');
  
  // Install Wizard State
  const [installTargetOffice, setInstallTargetOffice] = useState(activeOfficeId || 'paris-hq');
  const [sensorName, setSensorName] = useState('Executive Suite Multi-Sensor Pod');
  const [sensorFloor, setSensorFloor] = useState<number>(2);
  const [sensorRoom, setSensorRoom] = useState('boardroom');
  const [sensorSerial, setSensorSerial] = useState(`GS-9000-SCH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [sensorProtocol, setSensorProtocol] = useState<'BACnet/IP' | 'Matter' | 'Modbus TCP' | 'EcoStruxure MQTT'>('BACnet/IP');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccessReport, setInstallSuccessReport] = useState<any | null>(null);

  // Quick Hardware Control State
  const [controlOffice, setControlOffice] = useState(activeOfficeId || 'paris-hq');
  const [officeSensors, setOfficeSensors] = useState<SensorDevice[]>([]);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  // New Office Form
  const [showAddOffice, setShowAddOffice] = useState(false);
  const [newOfficeName, setNewOfficeName] = useState('');
  const [newOfficeCity, setNewOfficeCity] = useState('');
  const [newOfficeCountry, setNewOfficeCountry] = useState('');

  // Fetch offices list
  const fetchOffices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/offices');
      if (res.ok) {
        const data = await res.json();
        setOffices(data.offices || []);
      }
    } catch (e) {
      console.error('Error fetching offices:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sensors for control tab (Dual endpoint fallback to resolve any 404 error)
  const fetchControlOfficeSensors = async (officeId: string) => {
    try {
      const res = await fetch(`/api/offices/${officeId}/sensors`);
      if (res.ok) {
        const data = await res.json();
        setOfficeSensors(data.sensors || []);
        return;
      }
      // Fallback to /api/offices/:id
      const fallbackRes = await fetch(`/api/offices/${officeId}`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        setOfficeSensors(data.office?.sensors || []);
      }
    } catch (e) {
      console.error('Error fetching office sensors:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOffices();
      fetchControlOfficeSensors(controlOffice);
    }
  }, [isOpen, controlOffice]);

  if (!isOpen) return null;

  // Handle sensor installation
  const handleInstallSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInstalling(true);
    setInstallSuccessReport(null);

    try {
      const payload = {
        name: sensorName,
        floor: sensorFloor,
        roomId: sensorRoom,
        serialNumber: sensorSerial,
        protocol: sensorProtocol,
      };

      const res = await fetch(`/api/offices/${installTargetOffice}/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setInstallSuccessReport(data);
        if (onSensorInstalled) {
          onSensorInstalled(data.sensor);
        }
        fetchOffices();
        fetchControlOfficeSensors(installTargetOffice);
      }
    } catch (e) {
      console.error('Sensor install error:', e);
    } finally {
      setIsInstalling(false);
    }
  };

  // Handle live circuit toggle
  const handleToggleHardware = async (roomId: string, component: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/offices/${controlOffice}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          component,
          state: !currentState,
        }),
      });

      if (res.ok) {
        setLastActionStatus(`Circuit updated: ${roomId} ${component} is now ${!currentState ? 'ON' : 'OFF'}`);
        fetchControlOfficeSensors(controlOffice);
        setTimeout(() => setLastActionStatus(null), 4000);
      }
    } catch (e) {
      console.error('Hardware control toggle error:', e);
    }
  };

  // Handle Add Office
  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficeName || !newOfficeCity || !newOfficeCountry) return;

    try {
      const res = await fetch('/api/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOfficeName,
          city: newOfficeCity,
          country: newOfficeCountry,
        }),
      });

      if (res.ok) {
        setShowAddOffice(false);
        setNewOfficeName('');
        setNewOfficeCity('');
        setNewOfficeCountry('');
        fetchOffices();
      }
    } catch (e) {
      console.error('Office creation error:', e);
    }
  };

  // Export EcoStruxure config
  const handleExportConfig = (officeId: string) => {
    window.location.href = `/api/offices/${officeId}/export-config`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141418]/85 backdrop-blur-xl animate-fade-in font-sans text-[#f4f4f5]">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#1e1e24] border border-[#3a3a44] shadow-[0_25px_70px_rgba(0,0,0,0.6),0_0_30px_rgba(224,109,59,0.15)] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-[#2d2d36] flex items-center justify-between bg-gradient-to-r from-[#24242c] via-[#1e1e24] to-[#24242c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e06d3b]/25 to-[#b84c1e]/40 border border-[#e06d3b]/50 flex items-center justify-center text-[#ff8a50] shadow-[0_0_20px_rgba(224,109,59,0.3)]">
              <Globe className="w-5 h-5 text-[#ff8a50]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-white">
                  Schneider Electric Global Fleet & Direct Sensor Deployment
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#e06d3b]/15 text-[#ff8a50] border border-[#e06d3b]/35">
                  Direct Gateway Live
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Install GridSense multi-sensors in any office worldwide and command live electrical circuits via EcoStruxure BACnet/Matter gateways.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#a1a1aa] hover:text-white bg-[#25252d] hover:bg-[#2e2e38] border border-[#3a3a44] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-[#2d2d36] flex items-center gap-3 bg-[#1e1e24]">
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'fleet'
                ? 'text-[#ff8a50] border-b-2 border-[#e06d3b] bg-[#e06d3b]/15'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#ff8a50]" />
            <span>Worldwide Offices ({offices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'install'
                ? 'text-[#ff8a50] border-b-2 border-[#e06d3b] bg-[#e06d3b]/15'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-[#ff8a50]" />
            <span>Install Sensor In Office</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('control')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'control'
                ? 'text-[#ff8a50] border-b-2 border-[#e06d3b] bg-[#e06d3b]/15'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-[#ff8a50]" />
            <span>Worldwide Hardware Control</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: FLEET OVERVIEW */}
          {activeTab === 'fleet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Schneider Corporate Facilities</h3>
                  <p className="text-xs text-[#a1a1aa]">Select an office to link with the 3D campus twin or deploy a new office location.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddOffice(!showAddOffice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(224,109,59,0.3)]"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>Onboard New Office</span>
                </button>
              </div>

              {/* Add New Office Form */}
              {showAddOffice && (
                <form onSubmit={handleCreateOffice} className="p-4 rounded-2xl bg-[#25252d] border border-[#3a3a44] space-y-3">
                  <h4 className="text-xs font-bold text-[#ff8a50] uppercase tracking-wider">Register New Worldwide Facility</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-[#a1a1aa] mb-1">Office Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Zurich Tech Campus"
                        value={newOfficeName}
                        onChange={(e) => setNewOfficeName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#1e1e24] border border-[#32323c] text-white text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#a1a1aa] mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Zurich"
                        value={newOfficeCity}
                        onChange={(e) => setNewOfficeCity(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#1e1e24] border border-[#32323c] text-white text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#a1a1aa] mb-1">Country</label>
                      <input
                        type="text"
                        placeholder="e.g. Switzerland"
                        value={newOfficeCountry}
                        onChange={(e) => setNewOfficeCountry(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#1e1e24] border border-[#32323c] text-white text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddOffice(false)}
                      className="px-3 py-1 rounded-lg text-xs text-[#a1a1aa] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#d95d2c] to-[#e06d3b] hover:brightness-110"
                    >
                      Confirm Registration
                    </button>
                  </div>
                </form>
              )}

              {/* Office Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offices.map((office) => {
                  const isActive = activeOfficeId === office.id;
                  return (
                    <div
                      key={office.id}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#2a2422] border-[#e06d3b] shadow-[0_0_25px_rgba(224,109,59,0.25)]'
                          : 'bg-[#25252d] hover:bg-[#2a2a34] border-[#32323c] hover:border-[#e06d3b]/40'
                      }`}
                      onClick={() => onSelectOffice(office.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-white">{office.name}</h4>
                            {isActive && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#e06d3b]/20 text-[#ff8a50] border border-[#e06d3b]/40">
                                ACTIVE 3D
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#a1a1aa] mt-0.5">{office.address}</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#e06d3b]/15 text-[#ff8a50] border border-[#e06d3b]/30 text-[10px] font-mono">
                          <Radio className="w-3 h-3 text-[#ff8a50] animate-pulse" />
                          <span>{office.latencyMs}ms</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#2d2d36] text-xs">
                        <div>
                          <span className="text-[10px] text-[#a1a1aa] uppercase font-mono">Gateway</span>
                          <div className="font-mono text-[#d4d4d8] truncate text-[11px]">{office.gatewayIp}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#a1a1aa] uppercase font-mono">Sensors</span>
                          <div className="font-semibold text-white">{office.sensorCount} Units Linked</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#a1a1aa] uppercase font-mono">Net-Zero Score</span>
                          <div className="font-bold text-[#ff8a50]">{office.netZeroScore}/100</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportConfig(office.id);
                          }}
                          className="flex items-center gap-1 text-[11px] text-[#a1a1aa] hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Gateway Config</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInstallTargetOffice(office.id);
                            setActiveTab('install');
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#ff8a50] hover:text-white transition-colors"
                        >
                          <span>+ Add Sensor Here</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INSTALL SENSOR WIZARD */}
          {activeTab === 'install' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-4 rounded-2xl bg-[#e06d3b]/10 border border-[#e06d3b]/30 text-[#f4f4f5] text-xs flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#ff8a50] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">One-Click Hardware Installation</h4>
                  <p className="mt-0.5 text-[#a1a1aa]">
                    Pair a physical or virtual GridSense multi-sensor to any Schneider office worldwide.
                    The backend instantly provisions TLS 1.3 certificates, runs radar frequency sweeps, and maps control relays.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInstallSensor} className="p-6 rounded-2xl bg-[#25252d] border border-[#3a3a44] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#d4d4d8] mb-1.5">Target Schneider Facility</label>
                    <select
                      value={installTargetOffice}
                      onChange={(e) => setInstallTargetOffice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e24] border border-[#32323c] text-white text-xs cursor-pointer"
                    >
                      {offices.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#d4d4d8] mb-1.5">Sensor Name / Identifier</label>
                    <input
                      type="text"
                      value={sensorName}
                      onChange={(e) => setSensorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e24] border border-[#32323c] text-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#d4d4d8] mb-1.5">Floor Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSensorFloor(1)}
                        className={`py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          sensorFloor === 1
                            ? 'bg-gradient-to-r from-[#d95d2c] to-[#e06d3b] text-white border-[#ff8a50] font-bold'
                            : 'bg-[#1e1e24] border-[#32323c] text-[#d4d4d8]'
                        }`}
                      >
                        Floor 1 (Ground)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSensorFloor(2)}
                        className={`py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          sensorFloor === 2
                            ? 'bg-gradient-to-r from-[#d95d2c] to-[#e06d3b] text-white border-[#ff8a50] font-bold'
                            : 'bg-[#1e1e24] border-[#32323c] text-[#d4d4d8]'
                        }`}
                      >
                        Floor 2 (Upper)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#d4d4d8] mb-1.5">Room Zone / Cabin</label>
                    <select
                      value={sensorRoom}
                      onChange={(e) => setSensorRoom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e24] border border-[#32323c] text-white text-xs cursor-pointer"
                    >
                      <option value="boardroom">Executive Boardroom</option>
                      <option value="workstation">Open Innovation Workstations</option>
                      <option value="living-room">Central Atrium & Living Room</option>
                      <option value="kitchen">Smart Kitchen & Bistro</option>
                      <option value="terrace">Sky Terrace Observation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#d4d4d8] mb-1.5">Communication Protocol</label>
                    <select
                      value={sensorProtocol}
                      onChange={(e) => setSensorProtocol(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e24] border border-[#32323c] text-white text-xs cursor-pointer"
                    >
                      <option value="BACnet/IP">BACnet/IP (Schneider SpaceLogic Native)</option>
                      <option value="Matter">Matter over Thread (Wireless Mesh)</option>
                      <option value="Modbus TCP">Modbus TCP (Industrial Energy Bus)</option>
                      <option value="EcoStruxure MQTT">EcoStruxure MQTT Cloud Bridge</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#d4d4d8] mb-1.5">Hardware Serial Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sensorSerial}
                        onChange={(e) => setSensorSerial(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#1e1e24] border border-[#32323c] text-white text-xs font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setSensorSerial(`GS-9000-SCH-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="px-2.5 py-2 rounded-xl bg-[#1e1e24] hover:bg-[#282832] border border-[#32323c] text-xs text-[#ff8a50]"
                        title="Generate Random Serial"
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2d2d36] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                    <ShieldCheck className="w-4 h-4 text-[#ff8a50]" />
                    <span>Auto-calibrates 60GHz radar & NDIR optics</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isInstalling}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] hover:brightness-110 shadow-[0_0_25px_rgba(224,109,59,0.35)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isInstalling ? (
                      <>
                        <Activity className="w-4 h-4 text-white animate-spin" />
                        <span>Commissioning Hardware...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-white" />
                        <span>Install & Commission Sensor</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Commissioning Success Report */}
              {installSuccessReport && (
                <div className="p-4 rounded-2xl bg-[#e06d3b]/15 border border-[#e06d3b]/40 text-[#f4f4f5] text-xs space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#ff8a50]" />
                    <span>{installSuccessReport.message}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono bg-[#1e1e24] p-3 rounded-xl border border-[#32323c]">
                    <div>
                      <span className="text-[#a1a1aa]">Assigned IP:</span> {installSuccessReport.sensor.ipAddress}
                    </div>
                    <div>
                      <span className="text-[#a1a1aa]">MAC Address:</span> {installSuccessReport.sensor.macAddress}
                    </div>
                    <div>
                      <span className="text-[#a1a1aa]">Radar Doppler:</span> {installSuccessReport.commissioningReport.hardwareSelfTest.radarDopplerMmWave}
                    </div>
                    <div>
                      <span className="text-[#a1a1aa]">NDIR CO₂ Optical:</span> {installSuccessReport.commissioningReport.hardwareSelfTest.ndirOpticalCO2}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WORLDWIDE HARDWARE CONTROL */}
          {activeTab === 'control' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Live Worldwide Facility Circuits</h3>
                  <p className="text-xs text-[#a1a1aa]">Directly command lighting relays, HVAC cooling, and smart glass across any Schneider office.</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#a1a1aa]">Select Facility:</span>
                  <select
                    value={controlOffice}
                    onChange={(e) => setControlOffice(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#25252d] border border-[#3a3a44] text-white text-xs cursor-pointer"
                  >
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {lastActionStatus && (
                <div className="p-2.5 rounded-xl bg-[#e06d3b]/15 border border-[#e06d3b]/40 text-[#ff8a50] text-xs font-mono flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-[#ff8a50] animate-pulse" />
                  <span>{lastActionStatus}</span>
                </div>
              )}

              {/* Connected sensors in this office */}
              <div className="space-y-3">
                {officeSensors.length === 0 ? (
                  <div className="p-8 text-center text-[#a1a1aa] border border-dashed border-[#3a3a44] rounded-2xl">
                    No sensors commissioned in this office yet. Switch to "Install Sensor" tab to deploy one.
                  </div>
                ) : (
                  officeSensors.map((s) => (
                    <div key={s.id} className="p-4 rounded-xl bg-[#25252d] border border-[#32323c] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-white">{s.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e06d3b]/20 text-[#ff8a50] border border-[#e06d3b]/35">
                            {s.protocol}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#a1a1aa] mt-1 font-mono">
                          <span>Floor {s.floor} · {s.roomId.toUpperCase()}</span>
                          <span>IP: {s.ipAddress}</span>
                          <span>Serial: {s.serialNumber}</span>
                        </div>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleHardware(s.roomId, 'lights', s.circuits.lights)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            s.circuits.lights
                              ? 'bg-[#e06d3b] text-white shadow-[0_0_12px_rgba(224,109,59,0.4)]'
                              : 'bg-[#1e1e24] text-[#a1a1aa] hover:text-white border border-[#32323c]'
                          }`}
                        >
                          Lights: {s.circuits.lights ? 'ON' : 'OFF'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleHardware(s.roomId, 'hvac', s.circuits.hvac)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            s.circuits.hvac
                              ? 'bg-[#c2572b] text-white shadow-[0_0_12px_rgba(194,87,43,0.4)]'
                              : 'bg-[#1e1e24] text-[#a1a1aa] hover:text-white border border-[#32323c]'
                          }`}
                        >
                          HVAC: {s.circuits.hvac ? 'ACTIVE' : 'STANDBY'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleHardware(s.roomId, 'smartGlass', s.circuits.smartGlass)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            s.circuits.smartGlass
                              ? 'bg-[#8c7264] text-white shadow-[0_0_12px_rgba(140,114,100,0.4)]'
                              : 'bg-[#1e1e24] text-[#a1a1aa] hover:text-white border border-[#32323c]'
                          }`}
                        >
                          Glass: {s.circuits.smartGlass ? 'FROSTED' : 'CLEAR'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2d2d36] bg-[#1a1a20] flex items-center justify-between text-xs text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#ff8a50]" />
            <span>Schneider EcoStruxure Building Operation 4.2 Real-Time REST Interface</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-[#25252d] hover:bg-[#2d2d36] border border-[#3a3a44] transition-colors cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
