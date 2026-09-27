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
 * Creates a procedural 2D Gaussian radial gradient texture for the thermal occupancy heat map.
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

  // References for animation
  const animStateRef = useRef({
    currentExpansion: 0,
    targetExpansion: 0,
    cameraTargetY: 3.2,
    cameraTargetDistance: 34,
    cameraCurrentY: 3.2,
    isExpanded: false,
    isIsometric: false,
    transitioningPerspective: false,
    dayCycle: false,
    time: 13.0,
    heatmap: false,
    vrMode: false,
    weatherCondition: 'clear',
    thunderTimer: 0,
  });

  // Lights and interactive meshes
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
    floor2Highlight: THREE.Line;
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
    animStateRef.current.isIsometric = cameraPerspective === 'isometric';
    animStateRef.current.transitioningPerspective = true;
    const t = setTimeout(() => {
      animStateRef.current.transitioningPerspective = false;
    }, 1200);
    return () => clearTimeout(t);
  }, [cameraPerspective]);

  // Sync VR Mode state
  useEffect(() => {
    animStateRef.current.vrMode = vrMode;
  }, [vrMode]);

  // Sync expanded state to target expansion and auto-frame camera
  useEffect(() => {
    animStateRef.current.targetExpansion = expanded ? 1.0 : 0.0;
    animStateRef.current.isExpanded = expanded;

    // Direct multi-floor view on expansion without rotation needed
    if (expanded) {
      animStateRef.current.cameraTargetY = 5.2;
      animStateRef.current.cameraTargetDistance = 48;
    } else {
      animStateRef.current.cameraTargetY = activeFloor === 1 ? 2.0 : activeFloor === 2 ? 4.5 : 3.2;
      animStateRef.current.cameraTargetDistance = activeFloor === 'all' ? 34 : 26;
    }
  }, [expanded, activeFloor]);

  // Sync Day Cycle and Sun-Path parameters
  useEffect(() => {
    animStateRef.current.dayCycle = dayCycleEnabled;
    animStateRef.current.time = timeOfDay;

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
        sunLight.color.setHex(0xff9e44);
        sunLight.intensity = 2.4;
        ambientLight.intensity = 0.65;
        ambientLight.color.setHex(0xffdab0);
        frontSoftLight.intensity = 1.0;
        entranceMainGlow.intensity = 3.6;
      } else {
        sunLight.color.setHex(0xfff8ee);
        sunLight.intensity = 3.4;
        ambientLight.intensity = 1.15;
        ambientLight.color.setHex(0xffffff);
        frontSoftLight.intensity = 1.4;
        entranceMainGlow.intensity = 2.0;
      }
    } else {
      sunLight.position.set(-18, 30, -22);
      sunLight.color.setHex(0x2a3e5e);
      sunLight.intensity = 0.08;
      ambientLight.intensity = 0.06;
      ambientLight.color.setHex(0x111827);
      frontSoftLight.intensity = 0.05;
      entranceMainGlow.intensity = 4.2;
    }
  }, [dayCycleEnabled, timeOfDay]);

  // Sync OpenWeatherMap Meteorological Environment and Skybox
  useEffect(() => {
    if (!groupsRef.current || !sceneRef.current) return;
    const cond = weatherData?.condition || 'clear';
    animStateRef.current.weatherCondition = cond;
    const { sunLight, ambientLight, rainParticles } = groupsRef.current;
    const scene = sceneRef.current;

    if (rainParticles) {
      rainParticles.visible = cond === 'rain' || cond === 'thunderstorm';
    }

    if (cond === 'rain') {
      scene.background = new THREE.Color(0x0e141f);
      scene.fog = new THREE.FogExp2(0x0e141f, 0.015);
      sunLight.color.setHex(0xb0c4de);
      sunLight.intensity = 1.4;
      ambientLight.color.setHex(0x8fa3bf);
      ambientLight.intensity = 0.75;
    } else if (cond === 'thunderstorm') {
      scene.background = new THREE.Color(0x070a12);
      scene.fog = new THREE.FogExp2(0x070a12, 0.018);
      sunLight.color.setHex(0x708090);
      sunLight.intensity = 0.8;
      ambientLight.color.setHex(0x5a6a80);
      ambientLight.intensity = 0.6;
    } else if (cond === 'clouds') {
      scene.background = new THREE.Color(0x141822);
      scene.fog = new THREE.FogExp2(0x141822, 0.012);
      sunLight.color.setHex(0xffebd2);
      sunLight.intensity = 2.1;
      ambientLight.color.setHex(0xd0d8e2);
      ambientLight.intensity = 0.95;
    } else if (cond === 'fog') {
      scene.background = new THREE.Color(0x1a202c);
      scene.fog = new THREE.FogExp2(0x1a202c, 0.024);
      sunLight.color.setHex(0xffeedd);
      sunLight.intensity = 1.2;
      ambientLight.color.setHex(0xa0aec0);
      ambientLight.intensity = 0.85;
    } else {
      // Clear
      scene.background = new THREE.Color(0x07080c);
      scene.fog = new THREE.FogExp2(0x07080c, 0.009);
      sunLight.color.setHex(0xfff8ee);
      sunLight.intensity = 3.2;
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 1.1;
    }
  }, [weatherData]);

  // Sync Occupancy Heatmap overlay
  useEffect(() => {
    animStateRef.current.heatmap = heatmapEnabled;
    if (!groupsRef.current) return;
    const { heatmapPlanes } = groupsRef.current;

    Object.entries(heatmapPlanes).forEach(([id, plane]) => {
      plane.visible = heatmapEnabled;
      const cabin = cabins[id];
      if (cabin && plane.material instanceof THREE.MeshBasicMaterial) {
        const occ = cabin.metrics.occupancy;
        let hex = '#3b82f6';
        if (occ >= 4) hex = '#ef4444';
        else if (occ >= 2) hex = '#f59e0b';
        else if (occ === 1) hex = '#06b6d4';

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
        light.color.setHex(isLit ? 0xfff6d6 : 0x000000);
        light.distance = 18;
      }

      if (marker && marker.material instanceof THREE.MeshStandardMaterial) {
        marker.material.color.setHex(isLit ? 0xffd700 : 0x332a10);
        marker.material.emissive.setHex(isLit ? 0xffa500 : 0x110800);
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

    // --- 1. Scene setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080c);
    scene.fog = new THREE.FogExp2(0x07080c, 0.009);
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

    // --- 5. Enhanced Lighting with Real-Time Sun-Path Shadow Capture ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 3.2);
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

    const frontSoftLight = new THREE.DirectionalLight(0xfff6ec, 1.35);
    frontSoftLight.position.set(0, 22, 34);
    scene.add(frontSoftLight);

    const fillLight = new THREE.DirectionalLight(0xdbe9fb, 1.1);
    fillLight.position.set(-26, 22, -24);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcdd6e2, 0.85);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const entranceMainGlow = new THREE.PointLight(0xffbe55, 3.8, 20, 1.6);
    entranceMainGlow.position.set(0, 2.7, 9.6);
    entranceMainGlow.castShadow = false;
    scene.add(entranceMainGlow);

    const entranceGroundGlow = new THREE.PointLight(0xffd47a, 2.6, 14, 1.8);
    entranceGroundGlow.position.set(0, 0.9, 8.8);
    scene.add(entranceGroundGlow);

    // --- 6. Ground Terrain & Paved Forecourt ---
    const floorPlaneGeo = new THREE.PlaneGeometry(180, 180);
    const floorPlaneMat = new THREE.MeshStandardMaterial({
      color: 0x090b0e,
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
      color: 0x141820,
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
      color: 0x222630,
      roughness: 0.6,
      metalness: 0.2,
    });
    const drive = new THREE.Mesh(driveGeo, driveMat);
    drive.position.set(0, 0.38, 8.5);
    drive.receiveShadow = true;
    scene.add(drive);

    const forecourtBollardMat = new THREE.MeshStandardMaterial({
      color: 0x182030,
      roughness: 0.4,
      metalness: 0.8,
    });
    const forecourtGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.95,
    });
    for (let hx = -16; hx <= 16; hx += 2.2) {
      if (Math.abs(hx) > 3.2) {
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.7), forecourtBollardMat);
        pedestal.position.set(hx, 0.6, 12.0);
        pedestal.castShadow = true;
        scene.add(pedestal);

        const goldFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16), forecourtGoldMat);
        goldFinial.position.set(hx, 0.9, 12.0);
        goldFinial.castShadow = true;
        scene.add(goldFinial);
      }
    }

    // Dynamic Weather Rain Particles (1,200 raindrops falling from sky)
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
      color: 0xa5b4fc,
      size: 0.15,
      transparent: true,
      opacity: 0.75,
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    rainParticles.visible = false;
    scene.add(rainParticles);

    // Subtle gold perimeter laser border line (pulses in assembled state)
    const glowLinePoints = [
      new THREE.Vector3(-20, 0.37, -14),
      new THREE.Vector3(20, 0.37, -14),
      new THREE.Vector3(20, 0.37, 14),
      new THREE.Vector3(-20, 0.37, 14),
      new THREE.Vector3(-20, 0.37, -14),
    ];
    const glowLineGeo = new THREE.BufferGeometry().setFromPoints(glowLinePoints);
    const glowLineMat = new THREE.LineBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.45,
    });
    const assembledGlowLine = new THREE.Line(glowLineGeo, glowLineMat);
    scene.add(assembledGlowLine);

    // --- 7. Materials ---
    const extWallMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0e8,
      roughness: 0.65,
      metalness: 0.1,
    });
    const silverCladMat = new THREE.MeshStandardMaterial({
      color: 0xe5e8ed,
      roughness: 0.5,
      metalness: 0.25,
    });
    const extRoofMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.7,
      metalness: 0.2,
    });
    const ribbonGlassMat = new THREE.MeshStandardMaterial({
      color: 0x223042,
      roughness: 0.1,
      metalness: 0.7,
      transparent: true,
      opacity: 0.85,
    });
    const cyanEnergyMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.25,
      metalness: 0.85,
    });
    const titaniumTowerMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.9,
    });

    const roomMaterials: Record<string, { wallMat: THREE.MeshStandardMaterial; floorMat: THREE.MeshStandardMaterial }> = {
      'living-room': {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xfff8f0, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7, metalness: 0.1 }),
      },
      kitchen: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.7, metalness: 0.1 }),
      },
      bedroom: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xe8eef2, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x5a4a42, roughness: 0.7, metalness: 0.1 }),
      },
      bathroom: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xe0f0ea, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.7, metalness: 0.1 }),
      },
      hallway: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xf0efe8, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.7, metalness: 0.1 }),
      },
      boardroom: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xfaf5ed, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7, metalness: 0.1 }),
      },
      workstation: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xedf2f7, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.7, metalness: 0.1 }),
      },
      terrace: {
        wallMat: new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.8, metalness: 0.1 }),
        floorMat: new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.7, metalness: 0.1 }),
      },
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

    const f1Points = [
      new THREE.Vector3(-14.5, 0.4, -8.5),
      new THREE.Vector3(14.5, 0.4, -8.5),
      new THREE.Vector3(14.5, 0.4, 8.5),
      new THREE.Vector3(-14.5, 0.4, 8.5),
      new THREE.Vector3(-14.5, 0.4, -8.5),
    ];
    const floor1Highlight = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(f1Points),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0 }),
    );
    groundFloor.add(floor1Highlight);

    const f2Points = [
      new THREE.Vector3(-14.5, 3.4, -8.5),
      new THREE.Vector3(14.5, 3.4, -8.5),
      new THREE.Vector3(14.5, 3.4, 8.5),
      new THREE.Vector3(-14.5, 3.4, 8.5),
      new THREE.Vector3(-14.5, 3.4, -8.5),
    ];
    const floor2Highlight = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(f2Points),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 }),
    );
    upperFloor.add(floor2Highlight);

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

      const floorTile = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.1, 0.1, d - 0.1),
        mats.floorMat,
      );
      floorTile.position.set(0, 0.05, 0);
      floorTile.receiveShadow = true;
      cabinGroup.add(floorTile);

      const occCount = cabins[cabinId]?.metrics.occupancy || 0;
      let heatHex = '#3b82f6';
      if (occCount >= 4) heatHex = '#ef4444';
      else if (occCount >= 2) heatHex = '#f59e0b';
      else if (occCount === 1) heatHex = '#06b6d4';

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
        color: 0xbad7f2,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: cabins[cabinId]?.components.smartGlass ? 0.95 : 0.35,
      });
      smartGlasses[cabinId] = smartGlassMat;

      const glassWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThick, h * 0.85, d * 0.65),
        smartGlassMat,
      );
      glassWall.position.set(w / 2 - wallThick / 2, (h * 0.85) / 2, 0);
      cabinGroup.add(glassWall);

      // --- Schneider GridSense Ceiling Multi-Sensor Pod with High-Contrast Golden Glow Emission ---
      const sensorPod = new THREE.Group();
      sensorPod.position.set(0, h - 0.08, 0);

      const sensorBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.15, metalness: 0.85 }),
      );
      sensorPod.add(sensorBody);

      // Gold Bezel Ring
      const sensorRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.37, 0.03, 16, 32),
        goldMat,
      );
      sensorRing.rotation.x = Math.PI / 2;
      sensorPod.add(sensorRing);

      // High-Contrast 'Golden Glow' Core Shader Material
      const sensorCoreMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffa500, // Vibrant Golden Glow
        emissiveIntensity: 2.2, // Clearly visible against dark housing
        roughness: 0.1,
        metalness: 0.8,
      });
      const ledGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        sensorCoreMat,
      );
      ledGlow.position.set(0, -0.06, 0);
      ledGlow.scale.set(1, 0.6, 1);
      sensorPod.add(ledGlow);
      roomMarkers[cabinId] = ledGlow;

      // Radiant Golden Downlight Emitter
      const sensorGlowLight = new THREE.PointLight(0xffb800, 1.6, 4.5, 2.0);
      sensorGlowLight.position.set(0, -0.1, 0);
      sensorPod.add(sensorGlowLight);

      cabinGroup.add(sensorPod);

      // Room Point Light (User toggles with maximum contrast)
      const isLit = cabins[cabinId]?.components.lights ?? true;
      const roomLight = new THREE.PointLight(
        isLit ? 0xfff6d6 : 0x000000,
        isLit ? 5.2 : 0.0,
        18,
      );
      roomLight.position.set(0, h - 0.35, 0);
      roomLight.castShadow = true;
      roomLight.shadow.bias = -0.001;
      cabinGroup.add(roomLight);
      roomLights[cabinId] = roomLight;

      // Furniture
      if (cabinId === 'living-room') {
        const sofa = new THREE.Mesh(
          new THREE.BoxGeometry(3.0, 0.5, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x232630, roughness: 0.7 }),
        );
        sofa.position.set(0, 0.25, 0.8);
        sofa.castShadow = true;
        cabinGroup.add(sofa);
      } else if (cabinId === 'kitchen') {
        const island = new THREE.Mesh(
          new THREE.BoxGeometry(3.2, 0.9, 1.2),
          new THREE.MeshStandardMaterial({ color: 0xe8e5df, roughness: 0.4 }),
        );
        island.position.set(0, 0.45, 0);
        island.castShadow = true;
        cabinGroup.add(island);
      } else if (cabinId === 'boardroom') {
        const confTable = new THREE.Mesh(
          new THREE.BoxGeometry(3.6, 0.8, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.5 }),
        );
        confTable.position.set(0, 0.4, 0);
        confTable.castShadow = true;
        cabinGroup.add(confTable);
      } else if (cabinId === 'workstation') {
        const desk = new THREE.Mesh(
          new THREE.BoxGeometry(3.2, 0.75, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x2d303a, roughness: 0.6 }),
        );
        desk.position.set(0, 0.38, -0.4);
        desk.castShadow = true;
        cabinGroup.add(desk);
      } else if (cabinId === 'bedroom') {
        const bed = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 0.55, 2.4),
          new THREE.MeshStandardMaterial({ color: 0xd5d9e2, roughness: 0.8 }),
        );
        bed.position.set(0.4, 0.28, 0);
        bed.castShadow = true;
        cabinGroup.add(bed);
      }

      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }),
      );
      hitBox.position.set(0, h / 2, 0);
      hitBox.userData = { cabinId };
      cabinGroup.add(hitBox);
      roomPickers[cabinId] = hitBox;
    };

    // Floor 1
    createCabin('living-room', groundFloor, -7.5, 0.35, 4.2, 7.0, 2.9, 5.4);
    createCabin('kitchen', groundFloor, 7.5, 0.35, 4.2, 7.0, 2.9, 5.4);
    createCabin('hallway', groundFloor, 0.0, 0.35, 4.2, 6.0, 2.9, 5.4);
    createCabin('bathroom', groundFloor, -7.5, 0.35, -4.2, 7.0, 2.9, 5.4);

    // Floor 2
    createCabin('boardroom', upperFloor, 7.5, 3.35, 4.2, 7.0, 2.9, 5.4);
    createCabin('workstation', upperFloor, -7.5, 3.35, 4.2, 7.0, 2.9, 5.4);
    createCabin('bedroom', upperFloor, -7.5, 3.35, -4.2, 7.0, 2.9, 5.4);
    createCabin('terrace', upperFloor, 7.5, 3.35, -4.2, 7.0, 2.9, 5.4);

    const slabGeo = new THREE.BoxGeometry(29.0, 0.25, 17.0);
    const slabMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.8 });

    const f1Slab = new THREE.Mesh(slabGeo, slabMat);
    f1Slab.position.set(0, 0.25, 0);
    f1Slab.receiveShadow = true;
    groundFloor.add(f1Slab);

    const f2Slab = new THREE.Mesh(slabGeo, slabMat);
    f2Slab.position.set(0, 3.25, 0);
    f2Slab.receiveShadow = true;
    f2Slab.castShadow = true;
    upperFloor.add(f2Slab);

    // Front Facade Wall
    frontWall.position.set(0, 0, 8.4);
    const fwMesh = new THREE.Mesh(new THREE.BoxGeometry(29.0, 6.2, 0.3), extWallMat);
    fwMesh.position.set(0, 3.1, 0);
    fwMesh.castShadow = true;
    fwMesh.receiveShadow = true;
    frontWall.add(fwMesh);

    const ribbonF1 = new THREE.Mesh(new THREE.BoxGeometry(27.0, 1.2, 0.35), ribbonGlassMat);
    ribbonF1.position.set(0, 2.0, 0);
    frontWall.add(ribbonF1);

    const ribbonF2 = new THREE.Mesh(new THREE.BoxGeometry(27.0, 1.2, 0.35), ribbonGlassMat);
    ribbonF2.position.set(0, 4.8, 0);
    frontWall.add(ribbonF2);

    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.8 });
    const canopyMesh = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.3, 5.5), canopyMat);
    canopyMesh.position.set(0, 3.4, 2.8);
    canopyMesh.castShadow = true;
    frontWall.add(canopyMesh);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.4, 16), pillarMat);
    p1.position.set(-3.6, 1.7, 5.0);
    p1.castShadow = true;
    frontWall.add(p1);

    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.4, 16), pillarMat);
    p2.position.set(3.6, 1.7, 5.0);
    p2.castShadow = true;
    frontWall.add(p2);

    // Back Facade Wall
    backWall.position.set(0, 0, -8.4);
    const bwMesh = new THREE.Mesh(new THREE.BoxGeometry(29.0, 6.2, 0.3), extWallMat);
    bwMesh.position.set(0, 3.1, 0);
    bwMesh.castShadow = true;
    bwMesh.receiveShadow = true;
    backWall.add(bwMesh);

    const ribbonBackF1 = new THREE.Mesh(new THREE.BoxGeometry(27.0, 1.2, 0.35), ribbonGlassMat);
    ribbonBackF1.position.set(0, 2.0, 0);
    backWall.add(ribbonBackF1);

    const ribbonBackF2 = new THREE.Mesh(new THREE.BoxGeometry(27.0, 1.2, 0.35), ribbonGlassMat);
    ribbonBackF2.position.set(0, 4.8, 0);
    backWall.add(ribbonBackF2);

    // Left Facade Wing
    leftWing.position.set(-14.4, 0, 0);
    const lwMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.2, 17.0), extWallMat);
    lwMesh.position.set(0, 3.1, 0);
    lwMesh.castShadow = true;
    lwMesh.receiveShadow = true;
    leftWing.add(lwMesh);

    // Right Facade Wing + Green Eco-Cylinder Towers
    rightWing.position.set(14.4, 0, 0);
    const rwMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.2, 17.0), extWallMat);
    rwMesh.position.set(0, 3.1, 0);
    rwMesh.castShadow = true;
    rwMesh.receiveShadow = true;
    rightWing.add(rwMesh);

    for (let i = 0; i < 4; i++) {
      const ecoGroup = new THREE.Group();
      ecoGroup.position.set(1.4, 2.2, -5.0 + i * 3.3);

      // Aerospace Titanium Cylinder
      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 4.5, 32),
        titaniumTowerMat,
      );
      cylinder.castShadow = true;
      cylinder.receiveShadow = true;
      ecoGroup.add(cylinder);

      // Brushed 24K Solar Gold Cap (ZERO green!)
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.92, 0.92, 0.25, 32),
        goldMat,
      );
      cap.position.y = 2.3;
      ecoGroup.add(cap);

      // Electric Cyan Conduit Glow Ring
      const conduitRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.035, 16, 32),
        cyanEnergyMat,
      );
      conduitRing.rotation.x = Math.PI / 2;
      conduitRing.position.y = 1.6;
      ecoGroup.add(conduitRing);

      rightWing.add(ecoGroup);
    }

    // --- Architectural Upper Roof & Mechanical Plant ---
    // When collapsed (t = 0), sits at y = 6.25, completely capping Floor 2 rooms and exterior walls
    roof.position.set(0, 6.25, 0);

    // 1. Main Roof Deck Slab
    const mainRoofMesh = new THREE.Mesh(new THREE.BoxGeometry(29.6, 0.35, 17.6), extRoofMat);
    mainRoofMesh.position.set(0, 0.175, 0);
    mainRoofMesh.castShadow = true;
    mainRoofMesh.receiveShadow = true;
    roof.add(mainRoofMesh);

    // 2. Continuous Perimeter Parapet Coping
    const parapetMat = new THREE.MeshStandardMaterial({
      color: 0x1a2233,
      roughness: 0.45,
      metalness: 0.8,
    });
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

    // Gold Coping Trim along the parapet tops
    const trimF = new THREE.Mesh(new THREE.BoxGeometry(29.7, 0.08, 0.36), goldMat);
    trimF.position.set(0, 0.64, 8.65);
    roof.add(trimF);
    const trimB = new THREE.Mesh(new THREE.BoxGeometry(29.7, 0.08, 0.36), goldMat);
    trimB.position.set(0, 0.64, -8.65);
    roof.add(trimB);

    // 3. High-Efficiency Photovoltaic Solar Arrays
    const solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x0c1e3d,
      roughness: 0.15,
      metalness: 0.9,
    });
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 2.2), solarPanelMat);
        panel.position.set(-8.0 + col * 4.2, 0.48, 1.8 + row * 2.8);
        panel.rotation.x = -0.12;
        panel.castShadow = true;
        roof.add(panel);

        const frame = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.04, 2.3), goldMat);
        frame.position.copy(panel.position);
        frame.position.y -= 0.03;
        frame.rotation.copy(panel.rotation);
        roof.add(frame);
      }
    }

    // 4. Central Architectural Skylight Atrium
    const skylightGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a5f,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      metalness: 0.1,
    });
    const skylight = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.3, 4.8), skylightGlassMat);
    skylight.position.set(0, 0.4, -3.2);
    roof.add(skylight);

    // 5. HVAC Chiller Units
    const chillerMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.5 });
    for (let c = 0; c < 3; c++) {
      const chiller = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 1.8), chillerMat);
      chiller.position.set(5.5 + c * 3.2, 0.95, -4.5);
      chiller.castShadow = true;
      roof.add(chiller);
    }

    // 6. Communications & Lightning Arrester Mast with Gold/Amber Beacon
    const mastMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 4.5, 16), titaniumTowerMat);
    mastMesh.position.set(11.0, 2.6, 2.0);
    mastMesh.castShadow = true;
    roof.add(mastMesh);

    const mastBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffa500, emissiveIntensity: 2.8 })
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
      floor2Highlight,
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

      raycaster.setFromCamera(mouse, camera);
      const pickables = Object.values(roomPickers);
      const intersects = raycaster.intersectObjects(pickables, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const cabinId = hit.userData.cabinId as string;
        const cabin = cabins[cabinId];
        if (cabin) {
          const fl = cabin.floor;
          if (groupsRef.current) {
            (groupsRef.current.floor1Highlight.material as THREE.LineBasicMaterial).opacity =
              fl === 1 ? 0.95 : 0;
            (groupsRef.current.floor2Highlight.material as THREE.LineBasicMaterial).opacity =
              fl === 2 ? 0.95 : 0;
          }
          onHoverFloor?.({ floor: fl, x: event.clientX, y: event.clientY });
          return;
        }
      }

      if (groupsRef.current) {
        (groupsRef.current.floor1Highlight.material as THREE.LineBasicMaterial).opacity = 0;
        (groupsRef.current.floor2Highlight.material as THREE.LineBasicMaterial).opacity = 0;
      }
      onHoverFloor?.(null);
    };

    const handleMouseLeave = () => {
      if (groupsRef.current) {
        (groupsRef.current.floor1Highlight.material as THREE.LineBasicMaterial).opacity = 0;
        (groupsRef.current.floor2Highlight.material as THREE.LineBasicMaterial).opacity = 0;
      }
      onHoverFloor?.(null);
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseleave', handleMouseLeave);

    onModelLoaded();

    // --- 10. Animation Loop ---
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) / 1000;

      const anim = animStateRef.current;
      anim.currentExpansion += (anim.targetExpansion - anim.currentExpansion) * 0.075;
      const t = anim.currentExpansion;

      // Camera view transition
      if (anim.isExpanded) {
        const expandedCamPos = new THREE.Vector3(20, 34, 42);
        camera.position.lerp(expandedCamPos, 0.05);
        controls.target.lerp(new THREE.Vector3(0, 4.8, 0), 0.05);
      } else if (anim.isIsometric) {
        const isoTarget = new THREE.Vector3(28, 42, 28);
        camera.position.lerp(isoTarget, 0.06);
        controls.target.lerp(new THREE.Vector3(0, 3.2, 0), 0.06);
      } else if (anim.transitioningPerspective) {
        const defTarget = new THREE.Vector3(24, 20, 36);
        camera.position.lerp(defTarget, 0.06);
      } else {
        anim.cameraCurrentY += (anim.cameraTargetY - anim.cameraCurrentY) * 0.05;
        controls.target.y = anim.cameraCurrentY;

        const currentDist = camera.position.distanceTo(controls.target);
        if (Math.abs(currentDist - anim.cameraTargetDistance) > 0.2) {
          const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
          const nextDist = currentDist + (anim.cameraTargetDistance - currentDist) * 0.05;
          camera.position.copy(controls.target).addScaledVector(dir, nextDist);
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
      if (anim.weatherCondition === 'thunderstorm') {
        anim.thunderTimer += 0.016;
        if (anim.thunderTimer > 6.0 && Math.random() < 0.035) {
          ambientLight.intensity = 2.4;
          setTimeout(() => {
            ambientLight.intensity = 0.6;
          }, 70);
          anim.thunderTimer = 0;
        }
      }

      // Apply kinetic multi-tier exploded transformations
      if (groupsRef.current) {
        const {
          upperFloor,
          roof,
          extRoofMat,
          frontWall,
          backWall,
          leftWing,
          rightWing,
          organicCanopy,
          assembledGlowLine,
          roomMarkers,
          heatmapPlanes,
        } = groupsRef.current;

        // When collapsed (t=0), upperFloor sits cleanly at y=0 and roof sits at y=6.25 covering Floor 2 completely
        upperFloor.position.y = t * 8.2;
        roof.position.y = 6.25 + t * 15.5;
        roof.rotation.x = -t * 0.04;
        roof.rotation.z = t * 0.02;

        if (extRoofMat) {
          if (anim.activeFloor === 2 && !anim.isExpanded) {
            extRoofMat.transparent = true;
            extRoofMat.opacity = 0.25;
          } else {
            extRoofMat.transparent = false;
            extRoofMat.opacity = 1.0;
          }
        }

        organicCanopy.position.y = 5.8 + t * 9.5;
        organicCanopy.rotation.x = t * 0.06;

        frontWall.position.z = 8.4 + t * 10.5;
        backWall.position.z = -8.4 - t * 10.5;
        leftWing.position.x = -14.4 - t * 9.0;
        rightWing.position.x = 14.4 + t * 9.0;

        if (assembledGlowLine) {
          if (!anim.isExpanded) {
            const pulse = 0.35 + 0.35 * Math.sin(elapsedTime * 2.2);
            (assembledGlowLine.material as THREE.LineBasicMaterial).opacity = pulse;
            assembledGlowLine.visible = true;
          } else {
            (assembledGlowLine.material as THREE.LineBasicMaterial).opacity = 0.05;
          }
        }

        // Pulse Schneider GridSense status beacon with vibrant golden glow
        Object.values(roomMarkers).forEach((marker, index) => {
          const pulse = 1.0 + 0.16 * Math.sin(elapsedTime * 3 + index);
          marker.scale.set(pulse, pulse * 0.6, pulse);
        });

        if (anim.heatmap) {
          Object.values(heatmapPlanes).forEach((plane, idx) => {
            if (plane.material instanceof THREE.MeshBasicMaterial) {
              plane.material.opacity = 0.72 + 0.12 * Math.sin(elapsedTime * 2.5 + idx);
            }
          });
        }
      }

      controls.update();

      // Stereoscopic Dual Viewport VR Rendering Mode vs Normal Mono Rendering
      if (anim.vrMode) {
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

      {/* VR Stereoscopic Calibration Center Divider & Reticles */}
      {vrMode && (
        <div className="pointer-events-none absolute inset-0 z-30 flex">
          {/* Left Eye Reticle */}
          <div className="w-1/2 h-full flex items-center justify-center relative">
            <div className="w-3 h-3 rounded-full border border-purple-400/80 bg-purple-400/20" />
            <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-purple-300 border border-purple-500/30">
              L · Eye
            </div>
          </div>
          {/* Center Dividing Line */}
          <div className="w-[2px] h-full bg-gradient-to-b from-purple-500/30 via-white/50 to-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          {/* Right Eye Reticle */}
          <div className="w-1/2 h-full flex items-center justify-center relative">
            <div className="w-3 h-3 rounded-full border border-purple-400/80 bg-purple-400/20" />
            <div className="absolute top-4 right-4 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-purple-300 border border-purple-500/30">
              R · Eye
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
