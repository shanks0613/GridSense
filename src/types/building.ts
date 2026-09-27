export type RoomType =
  | 'living'
  | 'kitchen'
  | 'bedroom'
  | 'bathroom'
  | 'hallway'
  | 'boardroom'
  | 'workstation'
  | 'terrace';

export interface RoomElectricalState {
  lights: boolean;
  hvac: boolean;
  smartGlass: boolean;
  power: boolean;
}

export interface RoomMetrics {
  temperature: number; // in Celsius
  occupancy: number; // person count
  co2: number; // ppm
  lux: number; // ambient light lux
  powerWatts: number; // current power draw in watts
}

export interface CabinData {
  id: string;
  name: string;
  floor: 1 | 2;
  type: RoomType;
  description: string;
  wallColor: string;
  floorColor: string;
  position: [number, number, number];
  size: [number, number, number];
  components: RoomElectricalState;
  metrics: RoomMetrics;
}

export interface BuildingState {
  expanded: boolean;
  activeFloor: 'all' | 1 | 2;
  selectedCabinId: string | null;
  cabins: Record<string, CabinData>;
}
