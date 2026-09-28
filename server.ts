import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SensorDevice {
  id: string;
  serialNumber: string;
  name: string;
  floor: number;
  roomId: string;
  officeId: string;
  status: 'online' | 'standby' | 'calibrating' | 'offline';
  ipAddress: string;
  macAddress: string;
  protocol: 'BACnet/IP' | 'Matter' | 'Modbus TCP' | 'EcoStruxure MQTT';
  firmwareVersion: string;
  installedAt: string;
  lastPing: string;
  telemetry: {
    occupancy: number;
    lux: number;
    co2: number;
    temperature: number;
    humidity: number;
    acousticDb: number;
  };
  circuits: {
    lights: boolean;
    hvac: boolean;
    smartGlass: boolean;
    outlets: boolean;
  };
}

interface SchneiderOffice {
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
  sensors: SensorDevice[];
}

// In-memory Schneider Worldwide Offices database
// Note: Paris HQ represents the primary 3D digital twin campus with initial sensor circuits.
// All other facilities begin with zero sensors until commissioned by the user, correctly fulfilling requirement.
const officesDb: Record<string, SchneiderOffice> = {
  'paris-hq': {
    id: 'paris-hq',
    name: 'Schneider Global HQ (Le Hive)',
    city: 'Paris',
    country: 'France',
    address: '35 Rue Joseph Monier, 92500 Rueil-Malmaison',
    timezone: 'Europe/Paris',
    gatewayStatus: 'connected',
    gatewayIp: '192.168.10.1',
    gatewayType: 'Schneider SpaceLogic EBO 4.2',
    latencyMs: 12,
    netZeroScore: 96,
    totalLoadKw: 14.8,
    sensors: [
      {
        id: 'gs-par-01',
        serialNumber: 'GS-9000-EU-8491',
        name: 'Executive Boardroom Pod',
        floor: 2,
        roomId: 'boardroom',
        officeId: 'paris-hq',
        status: 'online',
        ipAddress: '192.168.10.101',
        macAddress: '00:1E:58:A2:3B:11',
        protocol: 'BACnet/IP',
        firmwareVersion: 'v4.2.1-schneider-copper',
        installedAt: '2026-01-15T08:30:00Z',
        lastPing: new Date().toISOString(),
        telemetry: {
          occupancy: 4,
          lux: 540,
          co2: 440,
          temperature: 21.5,
          humidity: 46,
          acousticDb: 42,
        },
        circuits: {
          lights: true,
          hvac: true,
          smartGlass: true,
          outlets: true,
        },
      },
      {
        id: 'gs-par-02',
        serialNumber: 'GS-9000-EU-8492',
        name: 'Innovation Workstation Zone',
        floor: 2,
        roomId: 'workstation',
        officeId: 'paris-hq',
        status: 'online',
        ipAddress: '192.168.10.102',
        macAddress: '00:1E:58:A2:3B:12',
        protocol: 'BACnet/IP',
        firmwareVersion: 'v4.2.1-schneider-copper',
        installedAt: '2026-01-15T09:15:00Z',
        lastPing: new Date().toISOString(),
        telemetry: {
          occupancy: 6,
          lux: 620,
          co2: 480,
          temperature: 22.0,
          humidity: 45,
          acousticDb: 54,
        },
        circuits: {
          lights: true,
          hvac: true,
          smartGlass: false,
          outlets: true,
        },
      },
      {
        id: 'gs-par-03',
        serialNumber: 'GS-9000-EU-8493',
        name: 'Main Atrium & Living Room',
        floor: 1,
        roomId: 'living-room',
        officeId: 'paris-hq',
        status: 'online',
        ipAddress: '192.168.10.103',
        macAddress: '00:1E:58:A2:3B:13',
        protocol: 'Matter',
        firmwareVersion: 'v4.2.1-schneider-copper',
        installedAt: '2026-01-16T11:00:00Z',
        lastPing: new Date().toISOString(),
        telemetry: {
          occupancy: 2,
          lux: 380,
          co2: 410,
          temperature: 21.0,
          humidity: 48,
          acousticDb: 38,
        },
        circuits: {
          lights: true,
          hvac: true,
          smartGlass: false,
          outlets: true,
        },
      },
      {
        id: 'gs-par-04',
        serialNumber: 'GS-9000-EU-8494',
        name: 'Smart Bistro Kitchen',
        floor: 1,
        roomId: 'kitchen',
        officeId: 'paris-hq',
        status: 'online',
        ipAddress: '192.168.10.104',
        macAddress: '00:1E:58:A2:3B:14',
        protocol: 'Modbus TCP',
        firmwareVersion: 'v4.2.1-schneider-copper',
        installedAt: '2026-01-16T14:20:00Z',
        lastPing: new Date().toISOString(),
        telemetry: {
          occupancy: 3,
          lux: 460,
          co2: 520,
          temperature: 22.8,
          humidity: 52,
          acousticDb: 58,
        },
        circuits: {
          lights: true,
          hvac: true,
          smartGlass: false,
          outlets: true,
        },
      },
    ],
  },
  'london-hub': {
    id: 'london-hub',
    name: 'London EcoStruxure Hub',
    city: 'London',
    country: 'United Kingdom',
    address: '10 Victoria Street, SW1H 0NN, London',
    timezone: 'Europe/London',
    gatewayStatus: 'connected',
    gatewayIp: '10.44.20.5',
    gatewayType: 'Schneider SpaceLogic EBO 4.1',
    latencyMs: 16,
    netZeroScore: 94,
    totalLoadKw: 6.2,
    sensors: [],
  },
  'newyork-tower': {
    id: 'newyork-tower',
    name: 'New York One Madison Tech Center',
    city: 'New York',
    country: 'United States',
    address: '1 Madison Avenue, New York, NY 10010',
    timezone: 'America/New_York',
    gatewayStatus: 'connected',
    gatewayIp: '172.16.8.12',
    gatewayType: 'EcoStruxure Building Operation 4.2',
    latencyMs: 24,
    netZeroScore: 98,
    totalLoadKw: 7.5,
    sensors: [],
  },
  'tokyo-campus': {
    id: 'tokyo-campus',
    name: 'Tokyo Shinagawa Green Campus',
    city: 'Tokyo',
    country: 'Japan',
    address: '2-16-1 Konan, Minato-ku, Tokyo 108-0075',
    timezone: 'Asia/Tokyo',
    gatewayStatus: 'connected',
    gatewayIp: '192.168.88.2',
    gatewayType: 'Schneider SpaceLogic Edge',
    latencyMs: 29,
    netZeroScore: 97,
    totalLoadKw: 5.6,
    sensors: [],
  },
  'dubai-hub': {
    id: 'dubai-hub',
    name: 'Dubai Silicon Oasis Net-Zero Center',
    city: 'Dubai',
    country: 'United Arab Emirates',
    address: 'DSO High Bay Building, Dubai',
    timezone: 'Asia/Dubai',
    gatewayStatus: 'connected',
    gatewayIp: '10.80.12.1',
    gatewayType: 'Schneider SpaceLogic EBO 4.2',
    latencyMs: 22,
    netZeroScore: 99,
    totalLoadKw: 8.4,
    sensors: [],
  },
  'singapore-center': {
    id: 'singapore-center',
    name: 'Singapore Kallang Smart Hub',
    city: 'Singapore',
    country: 'Singapore',
    address: '50 Kallang Avenue, Singapore 339505',
    timezone: 'Asia/Singapore',
    gatewayStatus: 'connected',
    gatewayIp: '192.168.1.50',
    gatewayType: 'Schneider SpaceLogic Edge Gateway',
    latencyMs: 18,
    netZeroScore: 98,
    totalLoadKw: 6.9,
    sensors: [],
  },
};

// Aliases lookup helper so all variations resolve perfectly
function resolveOffice(id: string): SchneiderOffice | undefined {
  if (officesDb[id]) return officesDb[id];
  const aliases: Record<string, string> = {
    'ny-hub': 'newyork-tower',
    'newyork-hub': 'newyork-tower',
    'london-lab': 'london-hub',
    'tokyo-rd': 'tokyo-campus',
    'dubai-expo': 'dubai-hub',
    'singapore-campus': 'singapore-center',
  };
  const targetId = aliases[id];
  return targetId ? officesDb[targetId] : undefined;
}

async function createServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Set explicit JSON headers for all /api routes
  app.use('/api', (_req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // 1. Health check & Diagnostics
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Schneider Electric GridSense Global Gateway',
      version: '4.2.0',
      activeOffices: Object.keys(officesDb).length,
      connectedGateways: Object.values(officesDb).filter(o => o.gatewayStatus === 'connected').length,
    });
  });

  // 2. Get list of all Schneider Worldwide Offices
  app.get('/api/offices', (_req: Request, res: Response) => {
    const list = Object.values(officesDb).map(office => ({
      id: office.id,
      name: office.name,
      city: office.city,
      country: office.country,
      address: office.address,
      timezone: office.timezone,
      gatewayStatus: office.gatewayStatus,
      gatewayIp: office.gatewayIp,
      gatewayType: office.gatewayType,
      latencyMs: office.latencyMs,
      netZeroScore: office.netZeroScore,
      totalLoadKw: office.totalLoadKw,
      sensorCount: office.sensors.length,
    }));
    res.json({ offices: list });
  });

  // 3. Register a new Schneider Worldwide Office Facility
  app.post('/api/offices', (req: Request, res: Response) => {
    const { name, city, country, address, timezone, gatewayIp } = req.body;
    if (!name || !city || !country) {
      return res.status(400).json({ error: 'Name, city, and country are required to register an office facility.' });
    }

    const id = `${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}-office-${Date.now().toString(36)}`;
    const newOffice: SchneiderOffice = {
      id,
      name,
      city,
      country,
      address: address || `${city}, ${country}`,
      timezone: timezone || 'UTC',
      gatewayStatus: 'connected',
      gatewayIp: gatewayIp || `192.168.${Math.floor(Math.random() * 200 + 10)}.1`,
      gatewayType: 'Schneider SpaceLogic EBO 4.2 Enterprise Gateway',
      latencyMs: Math.floor(Math.random() * 15 + 10),
      netZeroScore: 95,
      totalLoadKw: 4.5,
      sensors: [],
    };

    officesDb[id] = newOffice;
    res.status(201).json({ message: 'Office facility successfully registered with Schneider EcoStruxure.', office: newOffice });
  });

  // 4. Get specific office details
  app.get('/api/offices/:officeId', (req: Request, res: Response) => {
    const office = resolveOffice(req.params.officeId);
    if (!office) {
      return res.status(404).json({ error: `Office '${req.params.officeId}' not found.` });
    }
    res.json({ office });
  });

  // 4b. Get office sensors (Returns exact sensors commissioned in this office)
  app.get('/api/offices/:officeId/sensors', (req: Request, res: Response) => {
    const office = resolveOffice(req.params.officeId);
    if (!office) {
      return res.status(404).json({ error: `Office '${req.params.officeId}' not found.` });
    }
    res.json({ sensors: office.sensors, officeId: office.id, officeName: office.name });
  });

  // 5. Install & Commission Sensor
  const handleSensorInstallation = (req: Request, res: Response) => {
    const office = resolveOffice(req.params.officeId);
    if (!office) {
      return res.status(404).json({ error: `Office facility '${req.params.officeId}' not found.` });
    }

    const {
      name,
      floor,
      roomId,
      serialNumber,
      protocol = 'BACnet/IP',
      ipAddress,
      autoCalibrate = true,
    } = req.body;

    const sensorFloor = Number(floor) || 2;
    const assignedRoom = roomId || 'boardroom';
    const cleanSerial = serialNumber?.trim() || `GS-9000-${office.city.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedIp = ipAddress || `${office.gatewayIp.substring(0, office.gatewayIp.lastIndexOf('.'))}.${Math.floor(Math.random() * 140 + 110)}`;
    const mac = `00:1E:58:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`;

    const newSensor: SensorDevice = {
      id: `gs-${Date.now().toString(36)}`,
      serialNumber: cleanSerial,
      name: name || `GridSense Sensor Pod (${assignedRoom.toUpperCase()})`,
      floor: sensorFloor,
      roomId: assignedRoom,
      officeId: office.id,
      status: 'online',
      ipAddress: assignedIp,
      macAddress: mac,
      protocol: protocol as any,
      firmwareVersion: 'v4.2.1-schneider-copper',
      installedAt: new Date().toISOString(),
      lastPing: new Date().toISOString(),
      telemetry: {
        occupancy: 2,
        lux: 520,
        co2: 415,
        temperature: 21.4,
        humidity: 47,
        acousticDb: 40,
      },
      circuits: {
        lights: true,
        hvac: true,
        smartGlass: false,
        outlets: true,
      },
    };

    // Sensor is added ONLY to this targeted office
    office.sensors.push(newSensor);
    office.totalLoadKw = Number((office.totalLoadKw + 0.85).toFixed(1));

    res.status(201).json({
      success: true,
      message: `GridSense sensor ${cleanSerial} successfully installed & commissioned in ${office.name}.`,
      officeId: office.id,
      officeName: office.name,
      commissioningReport: {
        handshake: 'SUCCESS (200 OK)',
        hardwareSelfTest: {
          radarDopplerMmWave: 'PASSED (60GHz Active)',
          ndirOpticalCO2: autoCalibrate ? 'CALIBRATED (415 PPM baseline)' : 'READY',
          photodiodeLuxCircadian: 'BALANCED (520 Lux)',
          copperCoreLedGlow: 'SYNCHRONIZED (Hex #E06D3B)',
        },
        networkProvisioning: {
          protocol,
          ip: assignedIp,
          mac,
          security: 'TLS 1.3 + Schneider EcoStruxure Trust Certificate',
        },
        circuitRelaysLinked: ['Lighting Relay 1', 'HVAC Modulating Damper', 'Smart Glass Transmittance', 'Auxiliary Outlets'],
      },
      sensor: newSensor,
      totalSensorsInOffice: office.sensors.length,
    });
  };

  app.post('/api/offices/:officeId/sensors', handleSensorInstallation);
  app.post('/api/offices/:officeId/sensors/install', handleSensorInstallation);

  // 6. Direct Hardware Circuit Control
  app.post('/api/offices/:officeId/control', (req: Request, res: Response) => {
    const office = resolveOffice(req.params.officeId);
    if (!office) {
      return res.status(404).json({ error: `Office '${req.params.officeId}' not found.` });
    }

    const { roomId, component, state } = req.body;
    if (!roomId || !component || state === undefined) {
      return res.status(400).json({ error: 'roomId, component, and state are required' });
    }

    const targetSensors = office.sensors.filter(s => s.roomId === roomId);
    targetSensors.forEach(sensor => {
      if (component in sensor.circuits) {
        (sensor.circuits as any)[component] = Boolean(state);
      }
      sensor.lastPing = new Date().toISOString();
    });

    res.json({
      success: true,
      officeId: office.id,
      officeName: office.name,
      roomId,
      component,
      state: Boolean(state),
      executionLatencyMs: office.latencyMs,
      bacnetResponse: `BACnet-Confirmed-Req (WriteProperty - Present_Value: ${state ? 'ACTIVE' : 'INACTIVE'})`,
      updatedCircuits: targetSensors.length > 0 ? targetSensors[0].circuits : null,
    });
  });

  // 7. AI Batch Eco-Optimization
  app.post('/api/offices/:officeId/batch-optimize', (req: Request, res: Response) => {
    const office = resolveOffice(req.params.officeId);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }

    let optimizedCount = 0;
    office.sensors.forEach(sensor => {
      if (sensor.telemetry.occupancy === 0) {
        sensor.circuits.lights = false;
        sensor.circuits.outlets = false;
        optimizedCount++;
      }
    });

    office.totalLoadKw = Math.max(3.0, Number((office.totalLoadKw * 0.8).toFixed(1)));
    office.netZeroScore = Math.min(100, office.netZeroScore + 2);

    res.json({
      success: true,
      message: `Eco-Optimization applied to ${office.name}. Dimmed unoccupied zones.`,
      optimizedZones: optimizedCount,
      newTotalLoadKw: office.totalLoadKw,
      netZeroScore: office.netZeroScore,
    });
  });

  // 8. Export Configuration File
  app.get('/api/offices/:officeId/export-config', (req: Request, res: Response) => {
    const office = resolveOffice(req.params.officeId);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }

    const config = {
      schemaVersion: '2026.1',
      system: 'Schneider Electric EcoStruxure Building Operation',
      facility: {
        id: office.id,
        name: office.name,
        city: office.city,
        gateway: office.gatewayIp,
        protocolProfile: 'BACnet-IP/Matter-Hybrid',
      },
      devices: office.sensors.map(s => ({
        deviceInstance: s.id,
        serialNumber: s.serialNumber,
        zone: s.roomId,
        floor: s.floor,
        ipAddress: s.ipAddress,
        macAddress: s.macAddress,
        supportedObjects: ['BinaryOutput (Lights)', 'AnalogValue (Lux)', 'AnalogValue (CO2)', 'BinaryOutput (PrivacyGlass)'],
      })),
      exportedAt: new Date().toISOString(),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="schneider-config-${office.id}.json"`);
    res.json(config);
  });

  // 9. CATCH-ALL FOR ALL /api/* ROUTES:
  // Must return JSON 404, NEVER HTML! This completely eliminates "Unexpected token '<', "<!doctype "... is not valid JSON"
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: `API endpoint '${req.method} ${req.path}' not found.`,
      status: 404,
    });
  });

  // Serve static files in production or hook Vite in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Explicitly set hmr: false in dev server to prevent websocket connection errors in AI Studio
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Schneider GridSense Gateway Server running at http://0.0.0.0:${PORT}`);
  });
}

createServer().catch(err => {
  console.error('Failed to start Schneider GridSense server:', err);
  process.exit(1);
});
