import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CabinData } from '../types/building';
import { WeatherData } from '../utils/weather';

export interface HoveredFloorData {
  floor: 1 | 2;
  x: number;
  y: number;
}

interface OfficeModel3DProps {
  expanded: boolean;
  activeFloor: 'all' | 1 | 2;
  cabins: Record<string, CabinData>;
  selectedCabinId: string | null;
  cameraPerspective: 'default' | 'isometric';
  dayCycleEnabled: boolean;
  timeOfDay: number;
  heatmapEnabled: boolean;
  vrMode: boolean;
  weatherData: WeatherData | null;
  onSelectCabin: (id: string | null) => void;
  onModelLoaded: () => void;
  onHoverFloor?: (data: HoveredFloorData | null) => void;
}

/**
 * Procedural radial gradient texture for occupancy heatmap.
 * Strictly compliant: Electric Copper & Rust tones, NO blue, NO green, NO golden, NO yellow.
 */
function createRadialHeatTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
    grad.addColorStop(0, colorHex + 'f5');
    grad.addColorStop(0.35, colorHex + 'b0');
    grad.addColorStop(0.7, colorHex + '40');
    grad.addColorStop(1, colorHex + '00');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Second-order spring physics simulation for organic architectural transitions
 */
interface SpringVal {
  current: number;
  velocity: number;
}

function updateSpring(spring: SpringVal, target: number, stiffness = 130, damping = 16, dt = 0.016): number {
  const force = -stiffness * (spring.current - target) - damping * spring.velocity;
  spring.velocity += force * dt;
  spring.current += spring.velocity * dt;
  return spring.current;
}

export const OfficeModel3D: React.FC<OfficeModel3DProps> = ({
  expanded,
  activeFloor,
  cabins,
  selectedCabinId,
  cameraPerspective,
  dayCycleEnabled,
  timeOfDay,
  heatmapEnabled,
  vrMode,
  weatherData,
  onSelectCabin,
  onModelLoaded,
  onHoverFloor,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // References for spring physics animation
  const springsRef = useRef({
    expansion: { current: 0, velocity: 0 },
    upperLift: { current: 0, velocity: 0 },
    roofLift: { current: 0, velocity: 0 },
    groundOpacity: { current: 1.0, velocity: 0 },
    upperOpacity: { current: 1.0, velocity: 0 },
    floor1Highlight: { current: 0, velocity: 0 },
    floor2Highlight: { current: 0, velocity: 0 },
    cameraY: { current: 3.2, velocity: 0 },
    cameraDist: { current: 34, velocity: 0 },
  });

  const animTargetsRef = useRef({
    targetExpansion: 0,
    targetUpperLift: 0,
    targetRoofLift: 0,
    targetGroundOpacity: 1.0,
    targetUpperOpacity: 1.0,
    targetFloor1Highlight: 0,
    targetFloor2Highlight: 0,
    cameraTargetY: 3.2,
    cameraTargetDistance: 34,
    isExpanded: false,
    isIsometric: false,
    transitioningPerspective: false,
    dayCycle: false,
    time: 13.0,
    heatmap: false,
    vrMode: false,
    weatherCondition: 'clear',
    thunderTimer: 0,
    activeFloor: 'all' as 'all' | 1 | 2,
  });

  // Meshes & Lights
  const groupsRef = useRef<{
    root: THREE.Group;
    groundFloor: THREE.Group;
    upperFloor: THREE.Group;
    roof: THREE.Group;
    extRoofMat: THREE.MeshStandardMaterial;
    frontWall: THREE.Group;
    backWall: THREE.Group;
    leftWing: THREE.Group;
    rightWing: THREE.Group;
    organicCanopy: THREE.Group;
    assembledGlowLine: THREE.Line;
    floor1Highlight: THREE.Line;
    floor1PlaneHighlight: THREE.Mesh;
    floor2Highlight: THREE.Line;
    floor2PlaneHighlight: THREE.Mesh;
    floorFocusLight: THREE.SpotLight;
    sunLight: THREE.DirectionalLight;
    ambientLight: THREE.AmbientLight;
    hemiLight: THREE.HemisphereLight;
    frontSoftLight: THREE.DirectionalLight;
    entranceMainGlow: THREE.PointLight;
    roomLights: Record<string, THREE.PointLight>;
    roomMarkers: Record<string, THREE.Mesh>;
    smartGlasses: Record<string, THREE.MeshStandardMaterial>;
    roomPickers: Record<string, THREE.Mesh>;
    heatmapPlanes: Record<string, THREE.Mesh>;
    rainParticles?: THREE.Points;
  } | null>(null);

  // Sync camera perspective mode
  useEffect(() => {
    animTargetsRef.current.isIsometric = cameraPerspective === 'isometric';
    animTargetsRef.current.transitioningPerspective = true;
    const t = setTimeout(() => {
      animTargetsRef.current.transitioningPerspective = false;
    }, 1200);
    return () => clearTimeout(t);
  }, [cameraPerspective]);

  // Sync VR Mode state
  useEffect(() => {
    animTargetsRef.current.vrMode = vrMode;
  }, [vrMode]);

  // Sync floor isolation & spring target parameters
  useEffect(() => {
    animTargetsRef.current.targetExpansion = expanded ? 1.0 : 0.0;
    animTargetsRef.current.isExpanded = expanded;
    animTargetsRef.current.activeFloor = activeFloor;

    if (expanded) {
      animTargetsRef.current.targetUpperLift = 0;
      animTargetsRef.current.targetRoofLift = 0;
      animTargetsRef.current.targetGroundOpacity = 1.0;
      animTargetsRef.current.targetUpperOpacity = 1.0;
      animTargetsRef.current.targetFloor1Highlight = 0;
      animTargetsRef.current.targetFloor2Highlight = 0;
      animTargetsRef.current.cameraTargetY = 5.2;
      animTargetsRef.current.cameraTargetDistance = 48;
    } else {
      if (activeFloor === 1) {
        // Floor 1 transition:
        // - Upper floor springs vertically upward (+6.8) and non-selected floor fades out to 0.16
        // - Roof springs vertically upward (+14.5) and fades out to 0.12
        // - Ground floor remains 100% solid and highlighted with Electric Copper perimeter & spotlight
        animTargetsRef.current.targetUpperLift = 6.8;
        animTargetsRef.current.targetRoofLift = 14.5;
        animTargetsRef.current.targetGroundOpacity = 1.0;
        animTargetsRef.current.targetUpperOpacity = 0.16;
        animTargetsRef.current.targetFloor1Highlight = 1.0;
        animTargetsRef.current.targetFloor2Highlight = 0.0;
        animTargetsRef.current.cameraTargetY = 1.8;
        animTargetsRef.current.cameraTargetDistance = 24;
      } else if (activeFloor === 2) {
        // Floor 2 transition:
        // - Roof springs vertically upward (+13.5) and fades out to 0.12
        // - Non-selected Ground floor fades out to 0.18
        // - Upper floor remains 100% solid and highlighted with Electric Copper perimeter & spotlight
        animTargetsRef.current.targetUpperLift = 0.0;
        animTargetsRef.current.targetRoofLift = 13.5;
        animTargetsRef.current.targetGroundOpacity = 0.18;
        animTargetsRef.current.targetUpperOpacity = 1.0;
        animTargetsRef.current.targetFloor1Highlight = 0.0;
        animTargetsRef.current.targetFloor2Highlight = 1.0;
        animTargetsRef.current.cameraTargetY = 4.6;
        animTargetsRef.current.cameraTargetDistance = 24;
      } else {
        // All floors: return to assembled dual-deck presentation
        animTargetsRef.current.targetUpperLift = 0.0;
        animTargetsRef.current.targetRoofLift = 0.0;
        animTargetsRef.current.targetGroundOpacity = 1.0;
        animTargetsRef.current.targetUpperOpacity = 1.0;
        animTargetsRef.current.targetFloor1Highlight = 0.0;
        animTargetsRef.current.targetFloor2Highlight = 0.0;
        animTargetsRef.current.cameraTargetY = 3.2;
        animTargetsRef.current.cameraTargetDistance = 34;
      }
    }
  }, [expanded, activeFloor]);

  // Sync Day Cycle and Sun-Path parameters
  useEffect(() => {
    animTargetsRef.current.dayCycle = dayCycleEnabled;
    animTargetsRef.current.time = timeOfDay;

    if (!groupsRef.current) return;
    const { sunLight, ambientLight, frontSoftLight, entranceMainGlow } = groupsRef.current;

    const hour = timeOfDay;
    const isDay = hour >= 5.5 && hour <= 19.5;
    const angle = ((hour - 5.5) / 14) * Math.PI;

    // Sun spatial arc
    const sunDist = 52;
    const sunX = Math.cos(angle) * sunDist;
    const sunY = Math.max(1.0, Math.sin(angle) * 46);
    const sunZ = 20 * Math.sin(angle * 0.8) + 12;
    sunLight.position.set(sunX, sunY, sunZ);

    if (isDay) {
      const elevation = Math.sin(angle);
      if (elevation < 0.28) {
        sunLight.color.setHex(0xe06d3b); // Electric copper sunset glow
        sunLight.intensity = 2.4;
        ambientLight.intensity = 0.65;
        ambientLight.color.setHex(0xf4e0d4);
        frontSoftLight.intensity = 1.0;
        entranceMainGlow.intensity = 3.6;
      } else {
        sunLight.color.setHex(0xfff8f0);
        sunLight.intensity = 3.4;
        ambientLight.intensity = 1.15;
        ambientLight.color.setHex(0xffffff);
        frontSoftLight.intensity = 1.4;
        entranceMainGlow.intensity = 2.0;
      }
    } else {
      sunLight.position.set(-18, 30, -22);
      sunLight.color.setHex(0x3a3a44);
      sunLight.intensity = 0.08;
      ambientLight.intensity = 0.06;
      ambientLight.color.setHex(0x222228);
      frontSoftLight.intensity = 0.05;
      entranceMainGlow.intensity = 4.2;
    }
  }, [dayCycleEnabled, timeOfDay]);

  // Sync weather environment
  useEffect(() => {
    if (!groupsRef.current || !sceneRef.current) return;
    const cond = weatherData?.condition || 'clear';
    animTargetsRef.current.weatherCondition = cond;
    const { sunLight, ambientLight, rainParticles } = groupsRef.current;
    const scene = sceneRef.current;

    if (rainParticles) {
      rainParticles.visible = cond === 'rain' || cond === 'thunderstorm';
    }

    if (cond === 'rain') {
      scene.background = new THREE.Color(0x141418);
      scene.fog = new THREE.FogExp2(0x141418, 0.015);
      sunLight.color.setHex(0xd4d4d8);
      sunLight.intensity = 1.4;
      ambientLight.color.setHex(0xa1a1aa);
      ambientLight.intensity = 0.75;
    } else if (cond === 'thunderstorm') {
      scene.background = new THREE.Color(0x101014);
      scene.fog = new THREE.FogExp2(0x101014, 0.018);
      sunLight.color.setHex(0xa1a1aa);
      sunLight.intensity = 0.8;
      ambientLight.color.setHex(0x71717a);
      ambientLight.intensity = 0.6;
    } else if (cond === 'clouds') {
      scene.background = new THREE.Color(0x1a1a20);
      scene.fog = new THREE.FogExp2(0x1a1a20, 0.012);
      sunLight.color.setHex(0xf4f4f5);
      sunLight.intensity = 2.1;
      ambientLight.color.setHex(0xd4d4d8);
      ambientLight.intensity = 0.95;
    } else if (cond === 'fog') {
      scene.background = new THREE.Color(0x202026);
      scene.fog = new THREE.FogExp2(0x202026, 0.024);
      sunLight.color.setHex(0xe4e4e7);
      sunLight.intensity = 1.2;
      ambientLight.color.setHex(0xa1a1aa);
      ambientLight.intensity = 0.85;
    } else {
      // Clear
      scene.background = new THREE.Color(0x18181c);
      scene.fog = new THREE.FogExp2(0x18181c, 0.010);
      sunLight.color.setHex(0xfff8f0);
      sunLight.intensity = 3.2;
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 1.1;
    }
  }, [weatherData]);

  // Sync Occupancy Heatmap overlay
  useEffect(() => {
    animTargetsRef.current.heatmap = heatmapEnabled;
    if (!groupsRef.current) return;
    const { heatmapPlanes } = groupsRef.current;

    Object.entries(heatmapPlanes).forEach(([id, plane]) => {
      plane.visible = heatmapEnabled;
      const cabin = cabins[id];
      if (cabin && plane.material instanceof THREE.MeshBasicMaterial) {
        const occ = cabin.metrics.occupancy;
        let hex = '#4a4a55';
        if (occ >= 4) hex = '#e03b24';
        else if (occ >= 2) hex = '#e06d3b';
        else if (occ === 1) hex = '#b87355';

        plane.material.map = createRadialHeatTexture(hex);
        plane.material.needsUpdate = true;
      }
    });
  }, [heatmapEnabled, cabins]);

  // Sync cabins electrical component state (Lights, Smart Glass)
  useEffect(() => {
    if (!groupsRef.current) return;
    const { roomLights, smartGlasses, roomMarkers } = groupsRef.current;

    Object.entries(cabins).forEach(([id, cabin]) => {
      const light = roomLights[id];
      const marker = roomMarkers[id];
      const isLit = cabin.components.lights;

      if (light) {
        light.intensity = isLit ? 5.2 : 0.0;
        light.color.setHex(isLit ? 0xfff2e6 : 0x000000);
        light.distance = 18;
      }

      if (marker && marker.material instanceof THREE.MeshStandardMaterial) {
        marker.material.color.setHex(isLit ? 0xe06d3b : 0x3a302a);
        marker.material.emissive.setHex(isLit ? 0xff8a50 : 0x1a120c);
        marker.material.emissiveIntensity = isLit ? 2.4 : 0.2;
      }

      const glassMat = smartGlasses[id];
      if (glassMat) {
        glassMat.opacity = cabin.components.smartGlass ? 0.95 : 0.35;
        glassMat.roughness = cabin.components.smartGlass ? 0.7 : 0.1;
      }
    });
  }, [cabins]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- 1. Scene setup (Deep Slate & Electric Copper) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181c);
    scene.fog = new THREE.FogExp2(0x18181c, 0.010);
    sceneRef.current = scene;

    // --- 2. Camera setup ---
    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(24, 20, 36);
    cameraRef.current = camera;

    // --- 3. Renderer setup ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 4. Controls setup ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 10;
    controls.maxDistance = 85;
    controls.target.set(0, 3.2, 0);
    controlsRef.current = controls;

    // --- 5. Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8f0, 3.2);
    sunLight.position.set(24, 42, 24);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 140;
    sunLight.shadow.camera.left = -36;
    sunLight.shadow.camera.right = 36;
    sunLight.shadow.camera.top = 36;
    sunLight.shadow.camera.bottom = -36;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.radius = 3.5;
    scene.add(sunLight);

    const frontSoftLight = new THREE.DirectionalLight(0xfff2e6, 1.35);
    frontSoftLight.position.set(0, 22, 34);
    scene.add(frontSoftLight);

    const fillLight = new THREE.DirectionalLight(0xf4f4f6, 1.1);
    fillLight.position.set(-26, 22, -24);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4d4d8, 0.85);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const entranceMainGlow = new THREE.PointLight(0xe06d3b, 3.8, 20, 1.6);
    entranceMainGlow.position.set(0, 2.7, 9.6);
    entranceMainGlow.castShadow = false;
    scene.add(entranceMainGlow);

    const entranceGroundGlow = new THREE.PointLight(0xf07e48, 2.6, 14, 1.8);
    entranceGroundGlow.position.set(0, 0.9, 8.8);
    scene.add(entranceGroundGlow);

    // --- 6. Ground Terrain & Paved Forecourt (Deep Slate) ---
    const floorPlaneGeo = new THREE.PlaneGeometry(180, 180);
    const floorPlaneMat = new THREE.MeshStandardMaterial({
      color: 0x202026,
      roughness: 0.88,
      metalness: 0.1,
    });
    const floorPlane = new THREE.Mesh(floorPlaneGeo, floorPlaneMat);
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.position.y = 0;
    floorPlane.receiveShadow = true;
    scene.add(floorPlane);

    const podiumGeo = new THREE.BoxGeometry(40, 0.35, 28);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x282830,
      roughness: 0.8,
      metalness: 0.1,
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.set(0, 0.18, 0);
    podium.receiveShadow = true;
    podium.castShadow = true;
    scene.add(podium);

    const driveGeo = new THREE.BoxGeometry(34, 0.05, 8.0);
    const driveMat = new THREE.MeshStandardMaterial({
      color: 0x32323c,
      roughness: 0.6,
      metalness: 0.2,
    });
    const drive = new THREE.Mesh(driveGeo, driveMat);
    drive.position.set(0, 0.38, 8.5);
    drive.receiveShadow = true;
    scene.add(drive);

    const forecourtBollardMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a44,
      roughness: 0.4,
      metalness: 0.8,
    });
    const forecourtCopperMat = new THREE.MeshStandardMaterial({
      color: 0xe06d3b,
      roughness: 0.25,
      metalness: 0.95,
    });
    for (let hx = -16; hx <= 16; hx += 2.2) {
      if (Math.abs(hx) > 3.2) {
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.7), forecourtBollardMat);
        pedestal.position.set(hx, 0.6, 12.0);
        pedestal.castShadow = true;
        scene.add(pedestal);

        const copperFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16), forecourtCopperMat);
        copperFinial.position.set(hx, 0.9, 12.0);
        copperFinial.castShadow = true;
        scene.add(copperFinial);
      }
    }

    // Weather Rain Particles (Silver/Copper drops)
    const rainCount = 1200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 60;
      rainPositions[i * 3 + 1] = Math.random() * 45;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xd4d4d8,
      size: 0.15,
      transparent: true,
      opacity: 0.75,
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    rainParticles.visible = false;
    scene.add(rainParticles);

    // Electric copper perimeter laser border line
    const glowLinePoints = [
      new THREE.Vector3(-20, 0.37, -14),
      new THREE.Vector3(20, 0.37, -14),
      new THREE.Vector3(20, 0.37, 14),
      new THREE.Vector3(-20, 0.37, 14),
      new THREE.Vector3(-20, 0.37, -14),
    ];
    const glowLineGeo = new THREE.BufferGeometry().setFromPoints(glowLinePoints);
    const glowLineMat = new THREE.LineBasicMaterial({
      color: 0xe06d3b,
      transparent: true,
      opacity: 0.45,
    });
    const assembledGlowLine = new THREE.Line(glowLineGeo, glowLineMat);
    scene.add(assembledGlowLine);

    // --- 7. Architectural Materials (Deep Slate & Electric Copper) ---
    const extWallMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f6,
      roughness: 0.65,
      metalness: 0.1,
    });
    const silverCladMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.5,
      metalness: 0.25,
    });
    const extRoofMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a44,
      roughness: 0.7,
      metalness: 0.2,
    });
    const ribbonGlassMat = new THREE.MeshStandardMaterial({
      color: 0x25252d,
      roughness: 0.1,
      metalness: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const copperEnergyMat = new THREE.MeshStandardMaterial({
      color: 0xe06d3b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const titaniumTowerMat = new THREE.MeshStandardMaterial({
      color: 0x303038,
      roughness: 0.4,
      metalness: 0.8,
    });
    const copperTrimMat = new THREE.MeshStandardMaterial({
      color: 0xc2572b,
      roughness: 0.3,
      metalness: 0.9,
    });

    const roomMaterials: Record<string, { wallMat: THREE.MeshStandardMaterial; floorMat: THREE.MeshStandardMaterial }> = {
      'living-room': {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x5c4232, roughness: 0.7, metalness: 0.1 }),
      },
      kitchen: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xf0f0f2, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.7, metalness: 0.1 }),
      },
      bedroom: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xe4e4e7, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x483a34, roughness: 0.7, metalness: 0.1 }),
      },
      bathroom: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xe4e4e7, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.7, metalness: 0.1 }),
      },
      hallway: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.7, metalness: 0.1 }),
      },
      boardroom: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x3b2a24, roughness: 0.7, metalness: 0.1 }),
      },
      workstation: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x474750, roughness: 0.7, metalness: 0.1 }),
      },
      terrace: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xe4e4e7, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x303038, roughness: 0.7, metalness: 0.1 }),
      },
    };

    // Store base material opacity info for recursive fading
    const tagMaterialBase = (mat: THREE.Material) => {
      mat.userData = mat.userData || {};
      mat.userData.baseOpacity = mat.opacity;
      mat.userData.originallyTransparent = mat.transparent;
    };

    // --- 8. Building Hierarchy ---
    const root = new THREE.Group();
    scene.add(root);

    const groundFloor = new THREE.Group();
    const upperFloor = new THREE.Group();
    const roof = new THREE.Group();
    const frontWall = new THREE.Group();
    const backWall = new THREE.Group();
    const leftWing = new THREE.Group();
    const rightWing = new THREE.Group();
    const organicCanopy = new THREE.Group();

    root.add(groundFloor);
    root.add(upperFloor);
    root.add(roof);
    root.add(frontWall);
    root.add(backWall);
    root.add(leftWing);
    root.add(rightWing);
    root.add(organicCanopy);

    // Ground Floor Concrete Slab & Highlighting
    const groundSlabMat = new THREE.MeshStandardMaterial({
      color: 0x2e2e38,
      roughness: 0.8,
      metalness: 0.2,
    });
    tagMaterialBase(groundSlabMat);
    const groundSlab = new THREE.Mesh(new THREE.BoxGeometry(29.6, 0.4, 17.6), groundSlabMat);
    groundSlab.position.set(0, 0.2, 0);
    groundSlab.receiveShadow = true;
    groundFloor.add(groundSlab);

    // Floor 1 Boundary & Floor Plane Highlights (Electric Copper)
    const f1Points = [
      new THREE.Vector3(-14.6, 0.42, -8.6),
      new THREE.Vector3(14.6, 0.42, -8.6),
      new THREE.Vector3(14.6, 0.42, 8.6),
      new THREE.Vector3(-14.6, 0.42, 8.6),
      new THREE.Vector3(-14.6, 0.42, -8.6),
    ];
    const floor1Highlight = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(f1Points),
      new THREE.LineBasicMaterial({ color: 0xe06d3b, transparent: true, opacity: 0 }),
    );
    groundFloor.add(floor1Highlight);

    const f1PlaneGeo = new THREE.PlaneGeometry(29.2, 17.2);
    const f1PlaneMat = new THREE.MeshBasicMaterial({
      color: 0xf07e48,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const floor1PlaneHighlight = new THREE.Mesh(f1PlaneGeo, f1PlaneMat);
    floor1PlaneHighlight.rotation.x = -Math.PI / 2;
    floor1PlaneHighlight.position.set(0, 0.39, 0);
    groundFloor.add(floor1PlaneHighlight);

    // Floor 2 Boundary & Floor Plane Highlights (Electric Copper)
    const f2Points = [
      new THREE.Vector3(-14.6, 3.4, -8.6),
      new THREE.Vector3(14.6, 3.4, -8.6),
      new THREE.Vector3(14.6, 3.4, 8.6),
      new THREE.Vector3(-14.6, 3.4, 8.6),
      new THREE.Vector3(-14.6, 3.4, -8.6),
    ];
    const floor2Highlight = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(f2Points),
      new THREE.LineBasicMaterial({ color: 0xff8a50, transparent: true, opacity: 0 }),
    );
    upperFloor.add(floor2Highlight);

    const f2PlaneGeo = new THREE.PlaneGeometry(29.2, 17.2);
    const f2PlaneMat = new THREE.MeshBasicMaterial({
      color: 0xf07e48,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const floor2PlaneHighlight = new THREE.Mesh(f2PlaneGeo, f2PlaneMat);
    floor2PlaneHighlight.rotation.x = -Math.PI / 2;
    floor2PlaneHighlight.position.set(0, 3.39, 0);
    upperFloor.add(floor2PlaneHighlight);

    const floorFocusLight = new THREE.SpotLight(0xfff2e6, 0, 50, Math.PI / 3, 0.45, 1.2);
    floorFocusLight.position.set(0, 24, 0);
    scene.add(floorFocusLight);
    scene.add(floorFocusLight.target);

    const roomLights: Record<string, THREE.PointLight> = {};
    const roomMarkers: Record<string, THREE.Mesh> = {};
    const smartGlasses: Record<string, THREE.MeshStandardMaterial> = {};
    const roomPickers: Record<string, THREE.Mesh> = {};
    const heatmapPlanes: Record<string, THREE.Mesh> = {};

    // Helper: Build an individual Cabin interior
    const createCabin = (
      cabinId: string,
      floorGroup: THREE.Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
    ) => {
      const cabinGroup = new THREE.Group();
      cabinGroup.position.set(x, y, z);
      floorGroup.add(cabinGroup);

      const mats = roomMaterials[cabinId] || roomMaterials['living-room'];
      tagMaterialBase(mats.floorMat);
      tagMaterialBase(mats.wallMat);

      const floorTile = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.1, 0.1, d - 0.1),
        mats.floorMat,
      );
      floorTile.position.set(0, 0.05, 0);
      floorTile.receiveShadow = true;
      cabinGroup.add(floorTile);

      const occCount = cabins[cabinId]?.metrics.occupancy || 0;
      let heatHex = '#4a4a55';
      if (occCount >= 4) heatHex = '#e03b24';
      else if (occCount >= 2) heatHex = '#e06d3b';
      else if (occCount === 1) heatHex = '#b87355';

      const heatMat = new THREE.MeshBasicMaterial({
        map: createRadialHeatTexture(heatHex),
        transparent: true,
        opacity: heatmapEnabled ? 0.78 : 0.0,
        depthWrite: false,
      });
      const heatMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.15, d - 0.15), heatMat);
      heatMesh.rotation.x = -Math.PI / 2;
      heatMesh.position.set(0, 0.08, 0);
      heatMesh.visible = heatmapEnabled;
      cabinGroup.add(heatMesh);
      heatmapPlanes[cabinId] = heatMesh;

      const wallThick = 0.16;
      const backWallPart = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, wallThick),
        mats.wallMat,
      );
      backWallPart.position.set(0, h / 2, -d / 2 + wallThick / 2);
      backWallPart.receiveShadow = true;
      backWallPart.castShadow = true;
      cabinGroup.add(backWallPart);

      const sideWallPart = new THREE.Mesh(
        new THREE.BoxGeometry(wallThick, h, d),
        mats.wallMat,
      );
      sideWallPart.position.set(-w / 2 + wallThick / 2, h / 2, 0);
      sideWallPart.receiveShadow = true;
      sideWallPart.castShadow = true;
      cabinGroup.add(sideWallPart);

      const smartGlassMat = new THREE.MeshStandardMaterial({
        color: 0x8c7264,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: cabins[cabinId]?.components.smartGlass ? 0.95 : 0.35,
      });
      tagMaterialBase(smartGlassMat);
      smartGlasses[cabinId] = smartGlassMat;

      const glassWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThick, h * 0.85, d * 0.65),
        smartGlassMat,
      );
      glassWall.position.set(w / 2 - wallThick / 2, h * 0.85 / 2, -d * 0.15);
      glassWall.castShadow = true;
      cabinGroup.add(glassWall);

      // Cabin Ceiling Light
      const pLight = new THREE.PointLight(0xfff2e6, cabins[cabinId]?.components.lights ? 5.2 : 0, 18, 1.4);
      pLight.position.set(0, h - 0.25, 0);
      cabinGroup.add(pLight);
      roomLights[cabinId] = pLight;

      // Status Indicator Sensor Beacon (Electric Copper)
      const markerMat = new THREE.MeshStandardMaterial({
        color: cabins[cabinId]?.components.lights ? 0xe06d3b : 0x3a302a,
        emissive: cabins[cabinId]?.components.lights ? 0xff8a50 : 0x1a120c,
        emissiveIntensity: cabins[cabinId]?.components.lights ? 2.4 : 0.2,
        roughness: 0.2,
      });
      tagMaterialBase(markerMat);
      const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), markerMat);
      marker.position.set(0, h - 0.04, 0);
      cabinGroup.add(marker);
      roomMarkers[cabinId] = marker;

      // Invisible Raycast Picker
      const picker = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      picker.position.set(0, h / 2, 0);
      picker.userData = { cabinId };
      cabinGroup.add(picker);
      roomPickers[cabinId] = picker;

      // Cabin Furniture Props (Desks, Chairs, Pods)
      const deskMat = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.6 });
      tagMaterialBase(deskMat);
      const desk = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 0.65, d * 0.35), deskMat);
      desk.position.set(0, 0.33, 0);
      desk.castShadow = true;
      desk.receiveShadow = true;
      cabinGroup.add(desk);

      const chairMat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.8 });
      tagMaterialBase(chairMat);
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), chairMat);
      chair.position.set(0, 0.4, 0.8);
      chair.castShadow = true;
      cabinGroup.add(chair);
    };

    // --- Ground Floor Cabins (Floor 1: y = 0.4) ---
    createCabin('living-room', groundFloor, -7.0, 0.4, 3.8, 12.0, 2.7, 7.2);
    createCabin('kitchen', groundFloor, 7.0, 0.4, 3.8, 12.0, 2.7, 7.2);
    createCabin('bedroom', groundFloor, -7.0, 0.4, -4.0, 12.0, 2.7, 6.8);
    createCabin('bathroom', groundFloor, 7.0, 0.4, -4.0, 12.0, 2.7, 6.8);

    // --- Upper Floor Intermediate Slab & Cabins (Floor 2: y = 3.2) ---
    const upperSlabMat = new THREE.MeshStandardMaterial({
      color: 0x32323c,
      roughness: 0.75,
      metalness: 0.25,
    });
    tagMaterialBase(upperSlabMat);
    const upperSlab = new THREE.Mesh(new THREE.BoxGeometry(29.6, 0.4, 17.6), upperSlabMat);
    upperSlab.position.set(0, 3.2, 0);
    upperSlab.castShadow = true;
    upperSlab.receiveShadow = true;
    upperFloor.add(upperSlab);

    createCabin('hallway', upperFloor, -7.0, 3.4, 3.8, 12.0, 2.7, 7.2);
    createCabin('boardroom', upperFloor, 7.0, 3.4, 3.8, 12.0, 2.7, 7.2);
    createCabin('workstation', upperFloor, -7.0, 3.4, -4.0, 12.0, 2.7, 6.8);
    createCabin('terrace', upperFloor, 7.0, 3.4, -4.0, 12.0, 2.7, 6.8);

    // --- Ribbon Glazing Facade Walls ---
    tagMaterialBase(extWallMat);
    tagMaterialBase(silverCladMat);
    tagMaterialBase(ribbonGlassMat);
    tagMaterialBase(copperEnergyMat);
    tagMaterialBase(titaniumTowerMat);
    tagMaterialBase(copperTrimMat);

    // Front Facade
    const fwMesh = new THREE.Mesh(new THREE.BoxGeometry(29.6, 5.8, 0.3), ribbonGlassMat);
    fwMesh.position.set(0, 3.3, 0);
    fwMesh.castShadow = true;
    frontWall.add(fwMesh);
    frontWall.position.set(0, 0, 8.4);

    // Porte-Cochere Canopy (Front Entrance)
    const pcMat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.4, metalness: 0.8 });
    tagMaterialBase(pcMat);
    const porteCochere = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.35, 5.2), pcMat);
    porteCochere.position.set(0, 3.4, 2.5);
    porteCochere.castShadow = true;
    frontWall.add(porteCochere);

    const pcPillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 16), copperTrimMat);
    pcPillar1.position.set(-3.8, 1.6, 4.8);
    pcPillar1.castShadow = true;
    frontWall.add(pcPillar1);

    const pcPillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 16), copperTrimMat);
    pcPillar2.position.set(3.8, 1.6, 4.8);
    pcPillar2.castShadow = true;
    frontWall.add(pcPillar2);

    // Back Facade
    const bwMesh = new THREE.Mesh(new THREE.BoxGeometry(29.6, 5.8, 0.3), extWallMat);
    bwMesh.position.set(0, 3.3, 0);
    bwMesh.castShadow = true;
    backWall.add(bwMesh);
    backWall.position.set(0, 0, -8.4);

    // Left Wing (Solid Clad & Ribbon Glass)
    const lwMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.8, 17.6), silverCladMat);
    lwMesh.position.set(0, 3.3, 0);
    lwMesh.castShadow = true;
    leftWing.add(lwMesh);
    leftWing.position.set(-14.4, 0, 0);

    // Right Wing (Eco-Towers / Vertical Energy Hub)
    rightWing.position.set(14.4, 0, 0);
    const rwMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.8, 17.6), silverCladMat);
    rwMesh.position.set(0, 3.3, 0);
    rwMesh.castShadow = true;
    rightWing.add(rwMesh);

    for (let i = 0; i < 4; i++) {
      const ecoGroup = new THREE.Group();
      ecoGroup.position.set(1.4, 2.2, -5.0 + i * 3.3);

      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 4.5, 32),
        titaniumTowerMat,
      );
      cylinder.castShadow = true;
      cylinder.receiveShadow = true;
      ecoGroup.add(cylinder);

      // Electric Copper Cap
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.92, 0.92, 0.25, 32),
        copperTrimMat,
      );
      cap.position.y = 2.3;
      ecoGroup.add(cap);

      // Electric Copper Conduit Glow Ring
      const conduitRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.035, 16, 32),
        copperEnergyMat,
      );
      conduitRing.rotation.x = Math.PI / 2;
      conduitRing.position.y = 1.6;
      ecoGroup.add(conduitRing);

      rightWing.add(ecoGroup);
    }

    // --- Architectural Upper Roof & Mechanical Plant ---
    roof.position.set(0, 6.25, 0);

    const mainRoofMesh = new THREE.Mesh(new THREE.BoxGeometry(29.6, 0.35, 17.6), extRoofMat);
    mainRoofMesh.position.set(0, 0.175, 0);
    mainRoofMesh.castShadow = true;
    mainRoofMesh.receiveShadow = true;
    roof.add(mainRoofMesh);

    const parapetMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a32,
      roughness: 0.45,
      metalness: 0.8,
    });
    tagMaterialBase(parapetMat);

    const pFront = new THREE.Mesh(new THREE.BoxGeometry(29.6, 0.45, 0.3), parapetMat);
    pFront.position.set(0, 0.4, 8.65);
    pFront.castShadow = true;
    roof.add(pFront);

    const pBack = new THREE.Mesh(new THREE.BoxGeometry(29.6, 0.45, 0.3), parapetMat);
    pBack.position.set(0, 0.4, -8.65);
    pBack.castShadow = true;
    roof.add(pBack);

    const pLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 17.6), parapetMat);
    pLeft.position.set(-14.65, 0.4, 0);
    pLeft.castShadow = true;
    roof.add(pLeft);

    const pRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 17.6), parapetMat);
    pRight.position.set(14.65, 0.4, 0);
    pRight.castShadow = true;
    roof.add(pRight);

    // Copper Coping Trim along parapets
    const trimF = new THREE.Mesh(new THREE.BoxGeometry(29.7, 0.08, 0.36), copperTrimMat);
    trimF.position.set(0, 0.64, 8.65);
    roof.add(trimF);
    const trimB = new THREE.Mesh(new THREE.BoxGeometry(29.7, 0.08, 0.36), copperTrimMat);
    trimB.position.set(0, 0.64, -8.65);
    roof.add(trimB);

    // Photovoltaic Solar Arrays
    const solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x1f1f26,
      roughness: 0.15,
      metalness: 0.9,
    });
    tagMaterialBase(solarPanelMat);

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 2.2), solarPanelMat);
        panel.position.set(-8.0 + col * 4.2, 0.48, 1.8 + row * 2.8);
        panel.rotation.x = -0.12;
        panel.castShadow = true;
        roof.add(panel);

        const frame = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.04, 2.3), copperTrimMat);
        frame.position.copy(panel.position);
        frame.position.y -= 0.03;
        frame.rotation.copy(panel.rotation);
        roof.add(frame);
      }
    }

    // Central Skylight Atrium
    const skylightGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x282830,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      metalness: 0.1,
    });
    tagMaterialBase(skylightGlassMat);
    const skylight = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.3, 4.8), skylightGlassMat);
    skylight.position.set(0, 0.4, -3.2);
    roof.add(skylight);

    // HVAC Chillers
    const chillerMat = new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.4, metalness: 0.5 });
    tagMaterialBase(chillerMat);
    for (let c = 0; c < 3; c++) {
      const chiller = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 1.8), chillerMat);
      chiller.position.set(5.5 + c * 3.2, 0.95, -4.5);
      chiller.castShadow = true;
      roof.add(chiller);
    }

    // Lightning Arrester Mast with Copper Beacon
    const mastMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 4.5, 16), titaniumTowerMat);
    mastMesh.position.set(11.0, 2.6, 2.0);
    mastMesh.castShadow = true;
    roof.add(mastMesh);

    const mastBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xff8a50, emissive: 0xe06d3b, emissiveIntensity: 2.8 })
    );
    mastBeacon.position.set(11.0, 4.9, 2.0);
    roof.add(mastBeacon);

    organicCanopy.position.set(-13.0, 5.8, -6.5);
    const organicGeo = new THREE.BoxGeometry(6.0, 0.25, 5.0);
    const organicMesh = new THREE.Mesh(organicGeo, silverCladMat);
    organicMesh.rotation.z = -0.15;
    organicCanopy.add(organicMesh);

    groupsRef.current = {
      root,
      groundFloor,
      upperFloor,
      roof,
      extRoofMat,
      frontWall,
      backWall,
      leftWing,
      rightWing,
      organicCanopy,
      assembledGlowLine,
      floor1Highlight,
      floor1PlaneHighlight,
      floor2Highlight,
      floor2PlaneHighlight,
      floorFocusLight,
      sunLight,
      ambientLight,
      hemiLight,
      frontSoftLight,
      entranceMainGlow,
      roomLights,
      roomMarkers,
      smartGlasses,
      roomPickers,
      heatmapPlanes,
      rainParticles,
    };

    // --- 9. Raycasting for Clicks and Floor Hover ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const pickables = Object.values(roomPickers);
      const intersects = raycaster.intersectObjects(pickables, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const cabinId = hit.userData.cabinId as string;
        if (cabinId) {
          onSelectCabin(cabinId);
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (onHoverFloor) {
        raycaster.setFromCamera(mouse, camera);
        const pickables = Object.values(roomPickers);
        const intersects = raycaster.intersectObjects(pickables, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const cabinId = hit.userData.cabinId as string;
          const cabin = cabins[cabinId];
          if (cabin) {
            onHoverFloor({
              floor: cabin.floor,
              x: event.clientX,
              y: event.clientY,
            });
            return;
          }
        }
        onHoverFloor(null);
      }
    };

    const handleMouseLeave = () => {
      if (onHoverFloor) {
        onHoverFloor(null);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseleave', handleMouseLeave);

    onModelLoaded();

    // --- 10. Animation Loop with Organic Spring Physics ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    // Helper to recursively modulate group opacity for fading non-selected floors
    const applyGroupFade = (group: THREE.Group, opacityMultiplier: number, excludeMesh?: THREE.Mesh) => {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj !== excludeMesh) {
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => {
                const base = (m.userData && m.userData.baseOpacity !== undefined) ? m.userData.baseOpacity : 1.0;
                const newOp = base * opacityMultiplier;
                m.transparent = newOp < 0.98 || (m.userData && m.userData.originallyTransparent);
                m.opacity = newOp;
              });
            } else {
              const m = obj.material;
              const base = (m.userData && m.userData.baseOpacity !== undefined) ? m.userData.baseOpacity : 1.0;
              const newOp = base * opacityMultiplier;
              m.transparent = newOp < 0.98 || (m.userData && m.userData.originallyTransparent);
              m.opacity = newOp;
            }
          }
        }
      });
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(0.033, clock.getDelta());
      const elapsedTime = clock.getElapsedTime();

      const targets = animTargetsRef.current;
      const springs = springsRef.current;

      // 1. Step Spring Physics
      updateSpring(springs.expansion, targets.targetExpansion, 110, 16, delta);
      updateSpring(springs.upperLift, targets.targetUpperLift, 130, 18, delta);
      updateSpring(springs.roofLift, targets.targetRoofLift, 130, 18, delta);
      updateSpring(springs.groundOpacity, targets.targetGroundOpacity, 120, 16, delta);
      updateSpring(springs.upperOpacity, targets.targetUpperOpacity, 120, 16, delta);
      updateSpring(springs.floor1Highlight, targets.targetFloor1Highlight, 140, 16, delta);
      updateSpring(springs.floor2Highlight, targets.targetFloor2Highlight, 140, 16, delta);
      updateSpring(springs.cameraY, targets.cameraTargetY, 90, 15, delta);
      updateSpring(springs.cameraDist, targets.cameraTargetDistance, 80, 15, delta);

      const t = springs.expansion.current;

      // Camera view transition
      if (targets.isExpanded) {
        const expandedCamPos = new THREE.Vector3(20, 34, 42);
        camera.position.lerp(expandedCamPos, 0.05);
        controls.target.lerp(new THREE.Vector3(0, 4.8, 0), 0.05);
      } else if (targets.isIsometric) {
        const isoTarget = new THREE.Vector3(28, 42, 28);
        camera.position.lerp(isoTarget, 0.06);
        controls.target.lerp(new THREE.Vector3(0, 3.2, 0), 0.06);
      } else if (targets.transitioningPerspective) {
        const defTarget = new THREE.Vector3(24, 20, 36);
        camera.position.lerp(defTarget, 0.06);
      } else {
        controls.target.y = springs.cameraY.current;

        const currentDist = camera.position.distanceTo(controls.target);
        if (Math.abs(currentDist - springs.cameraDist.current) > 0.1) {
          const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
          camera.position.copy(controls.target).addScaledVector(dir, springs.cameraDist.current);
        }
      }

      // Rain animation when precipitating
      if (rainParticles && rainParticles.visible) {
        const positions = rainParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < rainCount; i++) {
          positions[i * 3 + 1] -= 1.8;
          if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 45;
          }
        }
        rainParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Thunderstorm random lightning flash simulation
      if (targets.weatherCondition === 'thunderstorm') {
        targets.thunderTimer += delta;
        if (targets.thunderTimer > 6.0 && Math.random() < 0.035) {
          ambientLight.intensity = 2.4;
          setTimeout(() => {
            ambientLight.intensity = 0.6;
          }, 70);
          targets.thunderTimer = 0;
        }
      }

      // Apply kinetic multi-tier spring transformations & floor isolation fading
      if (groupsRef.current) {
        const {
          groundFloor,
          upperFloor,
          roof,
          extRoofMat,
          frontWall,
          backWall,
          leftWing,
          rightWing,
          organicCanopy,
          assembledGlowLine,
          floor1Highlight,
          floor1PlaneHighlight,
          floor2Highlight,
          floor2PlaneHighlight,
          floorFocusLight,
          roomMarkers,
          heatmapPlanes,
        } = groupsRef.current;

        // Apply smooth spring vertical offsets
        upperFloor.position.y = t * 8.2 + springs.upperLift.current;
        roof.position.y = 6.25 + t * 15.5 + springs.roofLift.current;
        roof.rotation.x = -t * 0.04;
        roof.rotation.z = t * 0.02;

        // Apply smooth spring fading to non-selected floors
        if (!targets.isExpanded) {
          applyGroupFade(groundFloor, springs.groundOpacity.current, floor1PlaneHighlight);
          applyGroupFade(upperFloor, springs.upperOpacity.current, floor2PlaneHighlight);
        } else {
          applyGroupFade(groundFloor, 1.0);
          applyGroupFade(upperFloor, 1.0);
        }

        // Roof fading during floor isolation
        if (extRoofMat) {
          if ((targets.activeFloor === 2 || targets.activeFloor === 1) && !targets.isExpanded) {
            extRoofMat.transparent = true;
            extRoofMat.opacity = 0.12;
          } else {
            extRoofMat.transparent = false;
            extRoofMat.opacity = 1.0;
          }
        }

        // Active Floor Highlights with rhythmic breathing pulse (Electric Copper)
        const pulse = 0.8 + 0.2 * Math.sin(elapsedTime * 4.5);
        if (floor1Highlight && floor1PlaneHighlight) {
          (floor1Highlight.material as THREE.LineBasicMaterial).opacity =
            springs.floor1Highlight.current * pulse * 0.95;
          (floor1PlaneHighlight.material as THREE.MeshBasicMaterial).opacity =
            springs.floor1Highlight.current * pulse * 0.38;
        }

        if (floor2Highlight && floor2PlaneHighlight) {
          (floor2Highlight.material as THREE.LineBasicMaterial).opacity =
            springs.floor2Highlight.current * pulse * 0.95;
          (floor2PlaneHighlight.material as THREE.MeshBasicMaterial).opacity =
            springs.floor2Highlight.current * pulse * 0.38;
        }

        // Dedicated directional Level Focus Light
        if (floorFocusLight) {
          if (targets.activeFloor === 1) {
            floorFocusLight.target.position.set(0, 1.0, 0);
            floorFocusLight.position.set(0, 20, 4);
            floorFocusLight.intensity = springs.floor1Highlight.current * 3.5;
          } else if (targets.activeFloor === 2) {
            floorFocusLight.target.position.set(0, 4.5, 0);
            floorFocusLight.position.set(0, 24, 4);
            floorFocusLight.intensity = springs.floor2Highlight.current * 3.5;
          } else {
            floorFocusLight.intensity = 0;
          }
        }

        organicCanopy.position.y = 5.8 + t * 9.5;
        organicCanopy.rotation.x = t * 0.06;

        frontWall.position.z = 8.4 + t * 10.5;
        backWall.position.z = -8.4 - t * 10.5;
        leftWing.position.x = -14.4 - t * 9.0;
        rightWing.position.x = 14.4 + t * 9.0;

        if (assembledGlowLine) {
          if (!targets.isExpanded) {
            const pulseGlow = 0.35 + 0.35 * Math.sin(elapsedTime * 2.2);
            (assembledGlowLine.material as THREE.LineBasicMaterial).opacity = pulseGlow;
            assembledGlowLine.visible = true;
          } else {
            (assembledGlowLine.material as THREE.LineBasicMaterial).opacity = 0.05;
          }
        }

        // Pulse GridSense status beacon with electric copper glow
        Object.values(roomMarkers).forEach((marker, index) => {
          const pulseMarker = 1.0 + 0.16 * Math.sin(elapsedTime * 3 + index);
          marker.scale.set(pulseMarker, pulseMarker * 0.6, pulseMarker);
        });

        if (targets.heatmap) {
          Object.values(heatmapPlanes).forEach((plane, idx) => {
            if (plane.material instanceof THREE.MeshBasicMaterial) {
              plane.material.opacity = 0.72 + 0.12 * Math.sin(elapsedTime * 2.5 + idx);
            }
          });
        }
      }

      controls.update();

      // VR Dual Viewport Rendering vs Normal Mono Rendering
      if (targets.vrMode) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const halfWidth = Math.floor(width / 2);
        const ipd = 0.08;

        renderer.setScissorTest(true);

        // Left Eye Viewport
        renderer.setViewport(0, 0, halfWidth, height);
        renderer.setScissor(0, 0, halfWidth, height);
        camera.aspect = halfWidth / height;
        camera.updateProjectionMatrix();
        camera.position.x -= ipd / 2;
        renderer.render(scene, camera);
        camera.position.x += ipd / 2;

        // Right Eye Viewport
        renderer.setViewport(halfWidth, 0, halfWidth, height);
        renderer.setScissor(halfWidth, 0, halfWidth, height);
        camera.aspect = halfWidth / height;
        camera.updateProjectionMatrix();
        camera.position.x += ipd / 2;
        renderer.render(scene, camera);
        camera.position.x -= ipd / 2;

        renderer.setScissorTest(false);
      } else {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setViewport(0, 0, container.clientWidth, container.clientHeight);
        renderer.render(scene, camera);
      }
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Active Level Spatial HUD Indicator (Deep Slate & Electric Copper) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#1e1e24]/90 backdrop-blur-xl border border-[#e06d3b]/40 shadow-[0_8px_25px_rgba(224,109,59,0.2)] transition-all">
        <div
          className={`w-2 h-2 rounded-full ${
            activeFloor === 1
              ? 'bg-[#e06d3b] shadow-[0_0_10px_#e06d3b] animate-pulse'
              : activeFloor === 2
              ? 'bg-[#ff8a50] shadow-[0_0_10px_#ff8a50] animate-pulse'
              : 'bg-[#a1a1aa] shadow-[0_0_10px_#a1a1aa]'
          }`}
        />
        <span className="text-xs font-mono font-semibold text-white tracking-wide">
          {activeFloor === 1
            ? 'Active: Floor 1 (Ground Deck — Isolated & Highlighted)'
            : activeFloor === 2
            ? 'Active: Floor 2 (Upper Deck — Isolated & Highlighted)'
            : 'Active: All Floors (Full Dual-Deck Facility)'}
        </span>
      </div>

      {/* VR Stereoscopic Calibration Center Divider & Reticles */}
      {vrMode && (
        <div className="pointer-events-none absolute inset-0 z-30 flex">
          {/* Left Eye Reticle */}
          <div className="w-1/2 h-full flex items-center justify-center relative">
            <div className="w-3 h-3 rounded-full border border-[#e06d3b]/80 bg-[#e06d3b]/20" />
            <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-[#1e1e24]/90 text-[10px] font-mono text-[#d4d4d8] border border-[#e06d3b]/30">
              L · Eye
            </div>
          </div>
          {/* Center Dividing Line */}
          <div className="w-[2px] h-full bg-gradient-to-b from-[#e06d3b]/30 via-white/50 to-[#e06d3b]/30 shadow-[0_0_10px_rgba(224,109,59,0.5)]" />
          {/* Right Eye Reticle */}
          <div className="w-1/2 h-full flex items-center justify-center relative">
            <div className="w-3 h-3 rounded-full border border-[#e06d3b]/80 bg-[#e06d3b]/20" />
            <div className="absolute top-4 right-4 px-2 py-0.5 rounded bg-[#1e1e24]/90 text-[10px] font-mono text-[#d4d4d8] border border-[#e06d3b]/30">
              R · Eye
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
