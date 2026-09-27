import { CabinData } from '../types/building';

export const INITIAL_CABINS: Record<string, CabinData> = {
  // Floor 1: Ground Floor
  'living-room': {
    id: 'living-room',
    name: 'Executive Lounge & Living Room',
    floor: 1,
    type: 'living',
    description: 'Casual collaboration space with natural daylight harvesting and adaptive dimming.',
    wallColor: '#FFF8F0', // warm cream
    floorColor: '#C19A6B', // oak wood floor
    position: [-3.8, 1.4, 3.2],
    size: [6.8, 2.7, 5.8],
    components: {
      lights: true,
      hvac: true,
      smartGlass: false,
      power: true,
    },
    metrics: {
      temperature: 21.8,
      occupancy: 4,
      co2: 435,
      lux: 620,
      powerWatts: 245,
    },
  },
  'kitchen': {
    id: 'kitchen',
    name: 'Gourmet Cafeteria & Pantry',
    floor: 1,
    type: 'kitchen',
    description: 'High-efficiency smart culinary zone with air purification and ventilation extractors.',
    wallColor: '#F9F9F9', // soft white
    floorColor: '#D6CFC7', // light tile floor
    position: [-3.8, 1.4, -3.2],
    size: [6.8, 2.7, 5.8],
    components: {
      lights: true,
      hvac: true,
      smartGlass: false,
      power: true,
    },
    metrics: {
      temperature: 22.1,
      occupancy: 2,
      co2: 480,
      lux: 540,
      powerWatts: 420,
    },
  },
  'hallway-f1': {
    id: 'hallway-f1',
    name: 'Main Atrium, Reception & Stairs',
    floor: 1,
    type: 'hallway',
    description: 'Welcoming double-height reception featuring central architectural staircase.',
    wallColor: '#D8D0C8', // neutral greige
    floorColor: '#7B5B3A', // dark wood floor
    position: [1.8, 1.4, 3.2],
    size: [4.4, 2.7, 5.8],
    components: {
      lights: true,
      hvac: true,
      smartGlass: false,
      power: true,
    },
    metrics: {
      temperature: 21.4,
      occupancy: 1,
      co2: 410,
      lux: 480,
      powerWatts: 160,
    },
  },
  'bathroom-f1': {
    id: 'bathroom-f1',
    name: 'Executive Restroom & Wellness',
    floor: 1,
    type: 'bathroom',
    description: 'Touchless sanitation fixtures with automated occupancy-based LED illumination.',
    wallColor: '#D4EDE1', // pale mint
    floorColor: '#F0F0F0', // white tile floor
    position: [1.8, 1.4, -3.2],
    size: [4.4, 2.7, 5.8],
    components: {
      lights: false,
      hvac: true,
      smartGlass: true,
      power: true,
    },
    metrics: {
      temperature: 21.0,
      occupancy: 0,
      co2: 395,
      lux: 120,
      powerWatts: 45,
    },
  },

  // Floor 2: Upper Floor
  'bedroom': {
    id: 'bedroom',
    name: 'Executive Quiet Suite & Pods',
    floor: 2,
    type: 'bedroom',
    description: 'Acoustically isolated private cabin for executive focus and deep rest.',
    wallColor: '#B0C4D8', // soft blue-grey
    floorColor: '#A0785A', // medium wood floor
    position: [-3.8, 4.4, 3.2],
    size: [6.8, 2.7, 5.8],
    components: {
      lights: true,
      hvac: true,
      smartGlass: true,
      power: true,
    },
    metrics: {
      temperature: 20.9,
      occupancy: 1,
      co2: 415,
      lux: 380,
      powerWatts: 110,
    },
  },
  'boardroom': {
    id: 'boardroom',
    name: 'Smart Conference Boardroom',
    floor: 2,
    type: 'boardroom',
    description: 'High-definition telepresence boardroom with dynamic circadian lighting scenes.',
    wallColor: '#FFF8F0', // warm cream
    floorColor: '#C19A6B', // oak wood floor
    position: [1.8, 4.4, 3.2],
    size: [4.4, 2.7, 5.8],
    components: {
      lights: true,
      hvac: true,
      smartGlass: false,
      power: true,
    },
    metrics: {
      temperature: 21.6,
      occupancy: 6,
      co2: 560,
      lux: 650,
      powerWatts: 380,
    },
  },
  'workstation': {
    id: 'workstation',
    name: 'Open Engineering Workstations',
    floor: 2,
    type: 'workstation',
    description: 'Ergonomic task spaces with localized sensor beam tracking and glare management.',
    wallColor: '#F9F9F9', // soft white
    floorColor: '#D6CFC7', // light tile floor
    position: [-3.8, 4.4, -3.2],
    size: [6.8, 2.7, 5.8],
    components: {
      lights: true,
      hvac: true,
      smartGlass: false,
      power: true,
    },
    metrics: {
      temperature: 22.0,
      occupancy: 8,
      co2: 590,
      lux: 710,
      powerWatts: 590,
    },
  },
  'gallery-f2': {
    id: 'gallery-f2',
    name: 'Upper Mezzanine & Sky Gallery',
    floor: 2,
    type: 'terrace',
    description: 'Connecting walkway overlooking the central atrium with panoramic architectural glass.',
    wallColor: '#D8D0C8', // neutral greige
    floorColor: '#7B5B3A', // dark wood floor
    position: [1.8, 4.4, -3.2],
    size: [4.4, 2.7, 5.8],
    components: {
      lights: true,
      hvac: false,
      smartGlass: false,
      power: true,
    },
    metrics: {
      temperature: 21.7,
      occupancy: 2,
      co2: 425,
      lux: 460,
      powerWatts: 95,
    },
  },
};
