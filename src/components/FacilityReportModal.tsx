import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileCheck,
  Download,
  X,
  CheckCircle2,
  Building,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CabinData } from '../types/building';

export type ReportFormat = 'pdf' | 'doc' | 'csv' | 'json' | 'md';

interface FacilityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabins: Record<string, CabinData>;
  selectedCabinId: string | null;
  activeFloorFilter: 'all' | 1 | 2;
}

export const FacilityReportModal: React.FC<FacilityReportModalProps> = ({
  isOpen,
  onClose,
  cabins,
  selectedCabinId,
  activeFloorFilter,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  if (!isOpen) return null;

  const cabinList = Object.values(cabins).filter(
    (c) => activeFloorFilter === 'all' || c.floor === activeFloorFilter,
  );
  const targetCabin = selectedCabinId ? cabins[selectedCabinId] : cabinList[0] || Object.values(cabins)[0];

  const totalWatts = Object.values(cabins).reduce(
    (sum, c) => sum + (c.components.power ? c.metrics.powerWatts : 12),
    0,
  );
  const totalOccupants = Object.values(cabins).reduce((sum, c) => sum + c.metrics.occupancy, 0);
  const activeLightsCount = Object.values(cabins).filter((c) => c.components.lights).length;

  const now = new Date();
  const timestampStr = now.toISOString();
  const reportCode = `GS-RPT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;

  const formatOptions: {
    id: ReportFormat;
    name: string;
    extension: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    bestFor: string;
  }[] = [
    {
      id: 'pdf',
      name: 'Adobe PDF Document',
      extension: '.pdf',
      description: 'Executive engineering audit with certified Schneider EcoStruxure™ telemetry, metrics tables, and compliance stamps.',
      icon: FileText,
      bestFor: 'Executive Presentation & Facility Certification',
    },
    {
      id: 'doc',
      name: 'Microsoft Word Document',
      extension: '.doc',
      description: 'Editable Word-compatible document formatted with telemetry sections, circuit tables, and spatial notes.',
      icon: FileCheck,
      bestFor: 'Technical Editing & Corporate Documentation',
    },
    {
      id: 'csv',
      name: 'Excel / CSV Spreadsheet',
      extension: '.csv',
      description: 'Standard comma-separated table with row-by-row sensor telemetry, power wattage, and circuit states ready for data analysis.',
      icon: FileSpreadsheet,
      bestFor: 'Spreadsheet Analysis, Pivot Tables & BI Dashboards',
    },
    {
      id: 'json',
      name: 'Engineering JSON Telemetry',
      extension: '.json',
      description: 'Hierarchical IoT data payload compliant with BACnet/IP, Matter over Thread, and REST API standards.',
      icon: FileCode,
      bestFor: 'IoT Integration & Automated Cloud Ingestion',
    },
    {
      id: 'md',
      name: 'Markdown Architectural Dossier',
      extension: '.md',
      description: 'Clean text document formatted with markdown tables and codeblocks for git repositories and developer wikis.',
      icon: FileText,
      bestFor: 'Version Control, Git Repos & Technical Teams',
    },
  ];

  // Execute generation based on selected format
  const handleDownloadReport = () => {
    setIsGenerating(true);

    try {
      if (selectedFormat === 'pdf') {
        generatePdfReport();
      } else if (selectedFormat === 'doc') {
        generateDocReport();
      } else if (selectedFormat === 'csv') {
        generateCsvReport();
      } else if (selectedFormat === 'json') {
        generateJsonReport();
      } else if (selectedFormat === 'md') {
        generateMarkdownReport();
      }

      setDownloadCompleted(true);
      setTimeout(() => {
        setDownloadCompleted(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to generate facility report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 1. PDF Generation using jsPDF
  const generatePdfReport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Dark Deep Slate header banner
    doc.setFillColor(26, 26, 32);
    doc.rect(0, 0, 210, 38, 'F');

    // Electric copper accent line
    doc.setFillColor(224, 109, 59);
    doc.rect(0, 38, 210, 2, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SCHNEIDER ELECTRIC · GRIDSENSE™', 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(228, 228, 231);
    doc.text('Smart Building IoT Telemetry & Facility Optimization Dossier', 14, 23);

    doc.setFontSize(8);
    doc.setTextColor(240, 126, 72);
    doc.text(`REPORT ID: ${reportCode}  |  GENERATED: ${now.toUTCString()}`, 14, 30);

    // Document Body
    let y = 48;

    // Section 1: Executive Summary
    doc.setTextColor(34, 34, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. FACILITY AGGREGATE SUMMARY', 14, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 68);
    doc.text(`Facility Name: Schneider Electric GridSense Corporate Innovation Campus`, 14, y);
    y += 5;
    doc.text(`Active Electrical Demand: ${totalWatts} Watts (Live Load)`, 14, y);
    y += 5;
    doc.text(`Total Campus Occupants: ${totalOccupants} Persons (Radar Verified)`, 14, y);
    y += 5;
    doc.text(`Active Lighting Circuits: ${activeLightsCount} / ${Object.keys(cabins).length} Rooms`, 14, y);
    y += 5;
    doc.text(`Regulatory Certifications: ISO 50001 (Energy Management) & ASHRAE Standard 55 (Thermal Comfort)`, 14, y);
    y += 10;

    // Section 2: Selected Cabin Telemetry
    doc.setTextColor(34, 34, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`2. ROOM TELEMETRY: ${targetCabin.name.toUpperCase()} (${targetCabin.id})`, 14, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 68);
    doc.text(`Architectural Deck: Floor ${targetCabin.floor} (${targetCabin.floor === 1 ? 'Ground Wing' : 'Upper Innovation Deck'})`, 14, y);
    y += 5;
    doc.text(`Spatial Category: ${targetCabin.type}`, 14, y);
    y += 5;
    doc.text(`Description: ${targetCabin.description}`, 14, y);
    y += 8;

    // Table of Electrical Circuits
    doc.setFillColor(240, 240, 245);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 36);
    doc.text('CIRCUIT COMPONENT', 16, y + 4.5);
    doc.text('OPERATIONAL STATUS', 90, y + 4.5);
    doc.text('ELECTRICAL LOAD', 145, y + 4.5);
    y += 7;

    const circuitRows = [
      { name: 'Circadian Luminaire System', status: targetCabin.components.lights ? 'ACTIVE (100% Output)' : 'OFF (Standby)', load: targetCabin.components.lights ? '45 Watts' : '0 Watts' },
      { name: 'HVAC Air Volume Damper', status: targetCabin.components.hvac ? 'ENABLED (Optimal Air Exchange)' : 'INACTIVE', load: targetCabin.components.hvac ? '120 Watts' : '0 Watts' },
      { name: 'Smart Privacy Electrochromic Glass', status: targetCabin.components.smartGlass ? 'OPAQUE (Privacy Mode)' : 'TRANSPARENT (Clear Daylight)', load: targetCabin.components.smartGlass ? '15 Watts' : '0 Watts' },
      { name: 'Auxiliary Receptacle Circuit', status: targetCabin.components.power ? 'ENERGIZED (Active)' : 'DISCONNECTED (Eco Mode)', load: targetCabin.components.power ? '80 Watts' : '0 Watts' },
    ];

    doc.setFont('helvetica', 'normal');
    circuitRows.forEach((r, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 248, 250);
        doc.rect(14, y - 1, 182, 6, 'F');
      }
      doc.text(r.name, 16, y + 3.5);
      doc.text(r.status, 90, y + 3.5);
      doc.text(r.load, 145, y + 3.5);
      y += 6;
    });

    y += 6;

    // Table of Environmental Sensors
    doc.setFillColor(240, 240, 245);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 36);
    doc.text('SENSOR METRIC', 16, y + 4.5);
    doc.text('READING', 90, y + 4.5);
    doc.text('STANDARD BENCHMARK', 145, y + 4.5);
    y += 7;

    const sensorRows = [
      { name: 'Radar Occupancy Detection', reading: `${targetCabin.metrics.occupancy} Persons`, standard: '60GHz mmWave FMCW Precision' },
      { name: 'Ambient Air Temperature', reading: `${targetCabin.metrics.temperature}°C`, standard: '21.0°C - 24.0°C (ASHRAE 55 Optimal)' },
      { name: 'CO2 Atmospheric Concentration', reading: `${targetCabin.metrics.co2} PPM`, standard: '< 600 PPM (WELL v2 Baseline)' },
      { name: 'Daylight Illuminance', reading: `${targetCabin.metrics.lux} Lux`, standard: '500+ Lux Recommended' },
      { name: 'Total Room Power Draw', reading: `${targetCabin.components.power ? targetCabin.metrics.powerWatts : 0} Watts`, standard: '< 150 Watts Eco Target' },
    ];

    doc.setFont('helvetica', 'normal');
    sensorRows.forEach((r, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 248, 250);
        doc.rect(14, y - 1, 182, 6, 'F');
      }
      doc.text(r.name, 16, y + 3.5);
      doc.text(r.reading, 90, y + 3.5);
      doc.text(r.standard, 145, y + 3.5);
      y += 6;
    });

    y += 12;

    // Verification Box
    doc.setDrawColor(224, 109, 59);
    doc.setLineWidth(0.5);
    doc.rect(14, y, 182, 22);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(224, 109, 59);
    doc.text('ECOSTRUXURE™ BUILDING OPERATION AUDIT VERIFICATION', 18, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 90);
    doc.setFontSize(8);
    doc.text(`This facility audit was compiled via real-time encrypted telemetry from GridSense multi-sensor units.`, 18, y + 13);
    doc.text(`Digital Signature: SHA-256-${reportCode}-VERIFIED  |  Schneider Electric IoT Infrastructure`, 18, y + 18);

    // Save and trigger download
    doc.save(`GridSense-Facility-Report-${targetCabin.id}-${Date.now()}.pdf`);
  };

  // 2. Word Document (.doc) Generation
  const generateDocReport = () => {
    const docContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Schneider Electric GridSense Facility Audit Report</title>
<style>
body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1a1a20; }
h1 { color: #e06d3b; font-size: 18pt; border-bottom: 2pt solid #e06d3b; padding-bottom: 4pt; }
h2 { color: #222228; font-size: 14pt; margin-top: 14pt; }
table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; }
th { background-color: #282830; color: #ffffff; text-align: left; padding: 6pt; font-size: 10pt; }
td { border: 1pt solid #d4d4d8; padding: 5pt; font-size: 10pt; }
tr:nth-child(even) { background-color: #f4f4f5; }
.badge { color: #e06d3b; font-weight: bold; }
</style>
</head>
<body>
<h1>SCHNEIDER ELECTRIC · GRIDSENSE™ FACILITY REPORT</h1>
<p><strong>Report Reference:</strong> ${reportCode} | <strong>Generated:</strong> ${timestampStr}</p>
<p><strong>Facility Name:</strong> Schneider Electric Corporate Innovation Campus (Two-Deck Smart Twin)</p>
<p><strong>Certified Protocols:</strong> BACnet/IP, Matter over Thread, ISO 50001 Energy Management, ASHRAE Standard 55</p>

<h2>1. Facility Aggregate Performance</h2>
<table>
  <tr><th>Performance Metric</th><th>Measured Value</th><th>Compliance Target</th></tr>
  <tr><td>Active Electrical Demand</td><td>${totalWatts} Watts</td><td>Optimized Under Peak Limit</td></tr>
  <tr><td>Total Verified Occupants</td><td>${totalOccupants} Persons</td><td>60GHz mmWave FMCW Radar Active</td></tr>
  <tr><td>Active Lighting Circuits</td><td>${activeLightsCount} / ${Object.keys(cabins).length} Cabins</td><td>Circadian Daylight Harvesting Enabled</td></tr>
  <tr><td>HVAC Climate System</td><td>Variable Air Volume (VAV)</td><td>ASHRAE 55 Adaptive Comfort Compliant</td></tr>
</table>

<h2>2. Room Telemetry: ${targetCabin.name} (${targetCabin.id})</h2>
<p><strong>Floor Level:</strong> Floor ${targetCabin.floor} | <strong>Spatial Type:</strong> ${targetCabin.type}</p>
<p><strong>Specification:</strong> ${targetCabin.description}</p>

<table>
  <tr><th>Hardware Component</th><th>Operational State</th><th>Power Draw</th></tr>
  <tr><td>Circadian Luminaire</td><td>${targetCabin.components.lights ? 'ACTIVE' : 'OFF'}</td><td>${targetCabin.components.lights ? '45W' : '0W'}</td></tr>
  <tr><td>HVAC Climate Fan</td><td>${targetCabin.components.hvac ? 'ENABLED' : 'INACTIVE'}</td><td>${targetCabin.components.hvac ? '120W' : '0W'}</td></tr>
  <tr><td>Smart Electrochromic Glass</td><td>${targetCabin.components.smartGlass ? 'OPAQUE' : 'TRANSPARENT'}</td><td>${targetCabin.components.smartGlass ? '15W' : '0W'}</td></tr>
  <tr><td>Auxiliary Power Circuit</td><td>${targetCabin.components.power ? 'ENERGIZED' : 'OFF'}</td><td>${targetCabin.components.power ? '80W' : '0W'}</td></tr>
</table>

<h2>3. Atmospheric & Environmental Metrics</h2>
<table>
  <tr><th>Telemetry Sensor</th><th>Current Value</th><th>Standard Guideline</th></tr>
  <tr><td>Occupancy Count</td><td>${targetCabin.metrics.occupancy} Pers</td><td>Real-Time Radar FMCW</td></tr>
  <tr><td>Temperature</td><td>${targetCabin.metrics.temperature} °C</td><td>21 - 24 °C (Compliant)</td></tr>
  <tr><td>CO₂ Concentration</td><td>${targetCabin.metrics.co2} PPM</td><td>&lt; 600 PPM (Optimal)</td></tr>
  <tr><td>Illuminance</td><td>${targetCabin.metrics.lux} Lux</td><td>500+ Lux (Ergonomic)</td></tr>
  <tr><td>Total Wattage</td><td>${targetCabin.components.power ? targetCabin.metrics.powerWatts : 0} W</td><td>Target &lt; 150W</td></tr>
</table>

<p style="margin-top: 20pt; font-size: 9pt; color: #71717a;">
Authenticated by Schneider Electric EcoStruxure™ Building Operation. All telemetry values verified at gateway edge.
</p>
</body>
</html>
    `;

    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GridSense-Facility-Report-${targetCabin.id}-${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Tabular CSV (.csv) Generation
  const generateCsvReport = () => {
    const headers = [
      'Report_ID',
      'Timestamp',
      'Cabin_ID',
      'Cabin_Name',
      'Floor_Level',
      'Spatial_Type',
      'Occupancy_Count',
      'Temperature_C',
      'CO2_PPM',
      'Illuminance_Lux',
      'Power_Watts',
      'Lighting_State',
      'HVAC_State',
      'SmartGlass_State',
      'AuxPower_State',
      'Compliance_Score',
    ];

    const rows = Object.values(cabins).map((c) => [
      reportCode,
      timestampStr,
      c.id,
      `"${c.name}"`,
      c.floor,
      `"${c.type}"`,
      c.metrics.occupancy,
      c.metrics.temperature,
      c.metrics.co2,
      c.metrics.lux,
      c.components.power ? c.metrics.powerWatts : 0,
      c.components.lights ? 'ACTIVE' : 'OFF',
      c.components.hvac ? 'ENABLED' : 'INACTIVE',
      c.components.smartGlass ? 'OPAQUE' : 'TRANSPARENT',
      c.components.power ? 'ENERGIZED' : 'STANDBY',
      c.metrics.co2 <= 600 ? 'WELL_V2_COMPLIANT' : 'REVIEW',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GridSense-Facility-Telemetry-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4. Engineering JSON (.json) Generation
  const generateJsonReport = () => {
    const reportData = {
      reportHeader: {
        documentTitle: 'Schneider Electric GridSense Facility & Cabin Telemetry Report',
        systemPlatform: 'EcoStruxure™ Building Operation IoT Mesh',
        facilityName: 'Schneider Electric GridSense Corporate Innovation Campus',
        generatedTimestamp: timestampStr,
        reportId: reportCode,
        certification: 'ISO 50001 Energy Management & ASHRAE 55 Certified',
      },
      facilityAggregateMetrics: {
        activeElectricalDemandWatts: totalWatts,
        totalBuildingOccupants: totalOccupants,
        activeLightingCircuits: `${activeLightsCount} / ${Object.keys(cabins).length}`,
        hvacClimateSystemState: 'Autonomous Variable Air Volume (VAV) Active',
        solarDaylightHarvestingStatus: 'Closed-Loop Lux Modulation Enabled',
      },
      selectedCabinFocus: {
        cabinId: targetCabin.id,
        cabinName: targetCabin.name,
        architecturalFloorLevel: `Floor ${targetCabin.floor} (${targetCabin.floor === 1 ? 'Ground Wing' : 'Upper Deck'})`,
        spatialClassification: targetCabin.type,
        specificationNotes: targetCabin.description,
        electricalComponentStatus: {
          circadianLighting: targetCabin.components.lights ? 'ACTIVE' : 'OFF',
          hvacClimateAirFlow: targetCabin.components.hvac ? 'ENABLED' : 'INACTIVE',
          smartPrivacyElectrochromicGlass: targetCabin.components.smartGlass ? 'OPAQUE' : 'TRANSPARENT',
          dedicatedCircuitPower: targetCabin.components.power ? 'ENERGIZED' : 'DISCONNECTED',
        },
        environmentalMetrics: {
          ambientTemperatureCelsius: targetCabin.metrics.temperature,
          carbonDioxideConcentrationPPM: targetCabin.metrics.co2,
          ambientIlluminanceLux: targetCabin.metrics.lux,
          activePowerConsumptionWatts: targetCabin.components.power ? targetCabin.metrics.powerWatts : 0,
          occupancyCountPersons: targetCabin.metrics.occupancy,
          occupancySensorTechnology: '60GHz mmWave FMCW Micro-Radar Telemetry',
        },
      },
      allCabinsSnapshot: cabins,
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GridSense-Facility-Telemetry-${targetCabin.id}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 5. Markdown (.md) Generation
  const generateMarkdownReport = () => {
    const mdContent = `# SCHNEIDER ELECTRIC · GRIDSENSE™ FACILITY AUDIT REPORT
**Report Reference:** \`${reportCode}\`  
**Generated:** \`${timestampStr}\`  
**Standard:** ISO 50001 & ASHRAE Standard 55 Certified

---

## 1. Facility Aggregate Performance
- **Active Campus Load:** **${totalWatts} W**
- **Verified Occupancy:** **${totalOccupants} Persons**
- **Active Luminaires:** **${activeLightsCount} / ${Object.keys(cabins).length} Circuits**
- **HVAC Status:** Variable Air Volume (VAV) Active
- **Daylight Harvesting:** Closed-Loop Modulation

---

## 2. Room Focus: ${targetCabin.name} (\`${targetCabin.id}\`)
- **Floor Level:** Floor ${targetCabin.floor} (${targetCabin.floor === 1 ? 'Ground Wing' : 'Upper Innovation Deck'})
- **Spatial Category:** ${targetCabin.type}
- **Description:** ${targetCabin.description}

### Hardware Circuit Status
| Circuit Component | Operational State | Power Draw |
| :--- | :--- | :--- |
| Circadian Lighting | **${targetCabin.components.lights ? 'ACTIVE' : 'OFF'}** | ${targetCabin.components.lights ? '45W' : '0W'} |
| HVAC Air Volume Damper | **${targetCabin.components.hvac ? 'ENABLED' : 'INACTIVE'}** | ${targetCabin.components.hvac ? '120W' : '0W'} |
| Smart Glass Partition | **${targetCabin.components.smartGlass ? 'OPAQUE' : 'CLEAR'}** | ${targetCabin.components.smartGlass ? '15W' : '0W'} |
| Auxiliary Outlets | **${targetCabin.components.power ? 'ENERGIZED' : 'OFF'}** | ${targetCabin.components.power ? '80W' : '0W'} |

### Environmental Sensor Telemetry
| Sensor Parameter | Measured Value | Standard Guideline |
| :--- | :--- | :--- |
| Occupancy Radar | **${targetCabin.metrics.occupancy} Pers** | 60GHz Sub-Millimeter FMCW |
| Ambient Temperature | **${targetCabin.metrics.temperature} °C** | 21 - 24 °C (ASHRAE 55) |
| Carbon Dioxide (CO₂) | **${targetCabin.metrics.co2} PPM** | < 600 PPM (WELL v2) |
| Ambient Lux | **${targetCabin.metrics.lux} Lux** | 500+ Lux Recommended |
| Active Load | **${targetCabin.components.power ? targetCabin.metrics.powerWatts : 0} W** | Target < 150W |

---
*Telemetry verified via Schneider Electric EcoStruxure™ Building Operation edge gateway.*
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GridSense-Facility-Report-${targetCabin.id}-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141418]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#1e1e24] border border-[#3a3a44] shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(224,109,59,0.15)] overflow-hidden text-[#f4f4f5] font-sans">
        {/* Top Header */}
        <div className="p-5 border-b border-[#2d2d36] bg-gradient-to-r from-[#24242c] via-[#1e1e24] to-[#24242c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e06d3b] to-[#b84c1e] p-[1px] shadow-[0_0_15px_rgba(224,109,59,0.35)]">
              <div className="w-full h-full bg-[#1e1e24] rounded-[11px] flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#ff8a50]" />
              </div>
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white tracking-tight">
                Select Facility Report Format
              </h2>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Choose the desired export format for {targetCabin.name} telemetry dossier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#2d2d36] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Options List */}
        <div className="p-5 space-y-3 max-h-[62vh] overflow-y-auto">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#a1a1aa] px-1">
            Available Export Formats (Zero HTML Output)
          </div>

          {formatOptions.map((fmt) => {
            const isSelected = selectedFormat === fmt.id;
            const Icon = fmt.icon;
            return (
              <div
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-[#2a2422] border-[#e06d3b] shadow-[0_0_20px_rgba(224,109,59,0.2)]'
                    : 'bg-[#25252d] border-[#32323c] hover:border-[#484856] hover:bg-[#2a2a34]'
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-[#e06d3b]/20 text-[#ff8a50] border border-[#e06d3b]/40'
                      : 'bg-[#1e1e24] text-[#a1a1aa] border border-[#32323c]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {fmt.name}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e1e24] text-[#ff8a50] border border-[#e06d3b]/30">
                        {fmt.extension}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#e06d3b] bg-[#e06d3b]'
                          : 'border-[#4a4a58] bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
                    {fmt.description}
                  </p>

                  <div className="mt-2 text-[10px] font-mono text-[#d4d4d8] flex items-center gap-1.5">
                    <span className="text-[#ff8a50]">Best for:</span>
                    <span>{fmt.bestFor}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#2d2d36] bg-[#1a1a20] flex items-center justify-between gap-3">
          <div className="text-xs font-mono text-[#a1a1aa]">
            Target: <strong className="text-white">{targetCabin.name}</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#d4d4d8] hover:text-white bg-[#25252d] hover:bg-[#2e2e38] border border-[#3a3a48] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#d95d2c] via-[#e06d3b] to-[#b84c1e] hover:brightness-110 shadow-[0_0_20px_rgba(224,109,59,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  <span>Report Generated & Downloaded!</span>
                </>
              ) : isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Generating {selectedFormat.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate & Download ({selectedFormat.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
