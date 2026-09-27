import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const SensorViewer3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Realistic lights for crystal black & gold sensor
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(6, 8, 8);
    scene.add(keyLight);

    const goldRim = new THREE.DirectionalLight(0xd4af37, 2.2);
    goldRim.position.set(-6, -4, -6);
    scene.add(goldRim);

    const frontFill = new THREE.DirectionalLight(0xe8c872, 0.8);
    frontFill.position.set(0, 4, 6);
    scene.add(frontFill);

    // Build GridSense Sensor Unit Group
    const sensorGroup = new THREE.Group();
    scene.add(sensorGroup);

    // 1. Crystal Obsidian Main Bezel / Disk
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x08090d,
      roughness: 0.15,
      metalness: 0.85,
    });
    const bodyGeo = new THREE.CylinderGeometry(3.0, 3.2, 0.7, 64);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    sensorGroup.add(body);

    // 2. Brushed 24K Gold Chamfer Ring
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.9,
    });
    const goldRingGeo = new THREE.TorusGeometry(3.18, 0.12, 32, 100);
    const goldRing = new THREE.Mesh(goldRingGeo, goldMat);
    sensorGroup.add(goldRing);

    // 3. Inner Smoky Crystalline Optical Lens with Gold-Refracting Glassmorphism
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e2c40,
      roughness: 0.04,
      metalness: 0.12,
      transmission: 0.88,
      thickness: 0.75,
      transparent: true,
      opacity: 0.94,
      ior: 1.55,
      reflectivity: 0.95,
    });
    const innerLensGeo = new THREE.CylinderGeometry(1.68, 1.68, 0.22, 64);
    const innerLens = new THREE.Mesh(innerLensGeo, glassMat);
    innerLens.rotation.x = Math.PI / 2;
    innerLens.position.z = 0.36;
    sensorGroup.add(innerLens);

    // 3b. Concentric Optical Fresnel Grooves (catches bright golden specular highlights)
    const grooveMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0x8a6d14,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.95,
    });
    const grooveRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.022, 16, 64), grooveMat);
    grooveRing1.position.z = 0.39;
    sensorGroup.add(grooveRing1);

    const grooveRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.022, 16, 64), grooveMat);
    grooveRing2.position.z = 0.40;
    sensorGroup.add(grooveRing2);

    // 4. Schneider Optical Core with Higher-Contrast 'Golden Glow' Emission Shader
    // Requirement: ensures the sensor remains distinctly visible against the dark obsidian housing
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x241704,
      roughness: 0.18,
      metalness: 0.75,
      emissive: 0xffa500, // Vibrant Golden Glow emission
      emissiveIntensity: 1.65, // High contrast against dark obsidian
    });
    const coreGeo = new THREE.SphereGeometry(0.85, 36, 36);
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.z = 0.44;
    core.scale.set(1, 1, 0.42);
    sensorGroup.add(core);

    // 4b. Radiant Internal Gold Optical Emitter (Beams warm golden light through crystalline glass)
    const coreInternalLight = new THREE.PointLight(0xffbe3b, 3.6, 6.0, 1.8);
    coreInternalLight.position.set(0, 0, 0.52);
    sensorGroup.add(coreInternalLight);

    // 5. Polished 24K Gold Central Aperture Bezel
    const coreRingGeo = new THREE.TorusGeometry(0.88, 0.06, 24, 64);
    const coreRing = new THREE.Mesh(coreRingGeo, goldMat);
    coreRing.position.z = 0.46;
    sensorGroup.add(coreRing);

    // 5b. High-Contrast Laser Focal Dot with Golden Glow Emission
    const focalDotMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffb700,
      emissiveIntensity: 2.2,
      roughness: 0.05,
    });
    const focalDot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 24), focalDotMat);
    focalDot.rotation.x = Math.PI / 2;
    focalDot.position.z = 0.53;
    sensorGroup.add(focalDot);

    // 6. Halo Status LED Ring (Schneider Electric signature gold/amber pulse ring)
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const haloRingGeo = new THREE.TorusGeometry(1.68, 0.04, 16, 64);
    const haloRing = new THREE.Mesh(haloRingGeo, haloMat);
    haloRing.position.z = 0.42;
    sensorGroup.add(haloRing);

    // Interactive mouse drag rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotY = 0.4;
    let targetRotX = 0.25;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotY += deltaX * 0.008;
      targetRotX += deltaY * 0.008;
      targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation loop
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Gentle ambient drift when not dragging
      if (!isDragging) {
        targetRotY += 0.003;
      }

      sensorGroup.rotation.y += (targetRotY - sensorGroup.rotation.y) * 0.05;
      sensorGroup.rotation.x += (targetRotX - sensorGroup.rotation.x) * 0.05;

      // Halo gentle breathing
      const pulse = 0.98 + 0.04 * Math.sin(elapsed * 2.5);
      haloRing.scale.set(pulse, pulse, 1);

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[460px] flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-md border border-amber-500/20 rounded-full text-[11px] text-amber-300/80 tracking-wide font-mono uppercase pointer-events-none">
        Drag to Rotate 360° · Schneider Optical Core
      </div>
    </div>
  );
};
