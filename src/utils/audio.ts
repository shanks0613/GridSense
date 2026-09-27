import { Howl } from 'howler';

/**
 * Procedurally generates a studio-grade clean 16-bit PCM WAV audio Data URI for Howler.js.
 * 100% offline, zero network dependencies, instant zero-latency playback.
 */
function createWavDataUri(sampleRate: number, durationSec: number, generator: (t: number) => number): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write PCM audio data
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, generator(t)));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  // Convert buffer to base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * 1. EXPAND SOUND: Award-winning Cinematic Sci-Fi Kinetic Spatial Riser
 * Features:
 * - Sub-bass foundational power sweep (55Hz -> 160Hz)
 * - Multi-tier harmonic golden chord bloom (261Hz, 329Hz, 392Hz, 523Hz, 659Hz)
 * - Pneumatic air release whoosh
 * - Crisp tactile titanium mechanical latch lock at expansion peak
 */
const expandSoundUri = createWavDataUri(22050, 0.6, (t) => {
  const normT = t / 0.6;
  const env = Math.sin(Math.min(Math.PI, normT * Math.PI * 1.05)) * Math.exp(-normT * 1.2);

  // Sub bass power sweep
  const subFreq = 55 + 110 * Math.pow(normT, 1.8);
  const subBass = Math.sin(2 * Math.PI * subFreq * t) * 0.45;

  // Harmonic chord bloom (C major triad + 9th harmonic shimmer)
  const f1 = 261.63 + 180 * normT;
  const f2 = 329.63 + 220 * normT;
  const f3 = 392.00 + 260 * normT;
  const f4 = 523.25 + 320 * normT;
  const harmonic =
    Math.sin(2 * Math.PI * f1 * t) * 0.35 +
    Math.sin(2 * Math.PI * f2 * t) * 0.28 +
    Math.sin(2 * Math.PI * f3 * t) * 0.22 +
    Math.sin(2 * Math.PI * f4 * t) * 0.18;

  // Pneumatic whoosh (filtered white noise)
  const noise = (Math.random() * 2 - 1) * Math.sin(normT * Math.PI) * 0.22;

  // Crisp titanium mechanical latch click at the peak (t around 0.48s)
  let latchClick = 0;
  if (t > 0.46 && t < 0.52) {
    const clickT = t - 0.48;
    latchClick = (Math.random() * 2 - 1) * Math.exp(-Math.abs(clickT) * 180) * 0.55;
    latchClick += Math.sin(2 * Math.PI * 1850 * clickT) * Math.exp(-Math.abs(clickT) * 140) * 0.4;
  }

  return (subBass + harmonic + noise) * env + latchClick;
});

/**
 * 2. COLLAPSE SOUND: Heavy Precision Magnetic Lock & Kinetic Hydraulic Compression
 * Features:
 * - Reverse cinematic suction whoosh
 * - Resonant mechanical servo decrescendo
 * - Solid architectural magnetic slam / lock thud
 */
const collapseSoundUri = createWavDataUri(22050, 0.45, (t) => {
  const normT = t / 0.45;
  const env = Math.exp(-normT * 3.8);

  // Descending servo glide
  const freq = 620 - 460 * Math.pow(normT, 0.7);
  const tone = Math.sin(2 * Math.PI * freq * t) * 0.5;

  // Heavy sub-bass compression thud at the lock moment (t < 0.15)
  const thudFreq = 50 * Math.exp(-t * 8);
  const thud = Math.sin(2 * Math.PI * thudFreq * t) * Math.exp(-t * 14) * 0.65;

  // Magnetic snap click
  const snap = t < 0.05 ? (Math.random() * 2 - 1) * Math.exp(-t * 160) * 0.55 : 0;

  // Metallic ring
  const ring = Math.sin(2 * Math.PI * 1420 * t) * Math.exp(-t * 22) * 0.3;

  return (tone * env + thud + snap + ring) * 0.9;
});

/**
 * 3. FLOOR SWITCH SOUND: High-end Crystal Gold Acoustic Chime
 */
const floorSwitchSoundUri = createWavDataUri(22050, 0.28, (t) => {
  const env = Math.exp(-t * 12);
  const chime =
    Math.sin(2 * Math.PI * 987.77 * t) * 0.5 + // B5
    Math.sin(2 * Math.PI * 1479.98 * t) * 0.35 + // F#6
    Math.sin(2 * Math.PI * 1975.53 * t) * 0.2; // B6
  return chime * env;
});

/**
 * 4. INDUSTRIAL HVAC DRONE: 2.0s seamless loop of filtered air rush and 55Hz acoustic motor hum
 */
const ventilationDroneUri = createWavDataUri(22050, 2.0, (t) => {
  // Low-frequency 55Hz motor hum + 110Hz second harmonic
  const motor = Math.sin(2 * Math.PI * 55 * t) * 0.35 + Math.sin(2 * Math.PI * 110 * t) * 0.15;
  // Filtered airflow white noise
  const noise = (Math.random() * 2 - 1) * 0.12;
  // Subtle modulation
  const mod = 1 + 0.08 * Math.sin(2 * Math.PI * 1.5 * t);
  return (motor + noise) * mod * 0.25;
});

let expandHowl: Howl | null = null;
let collapseHowl: Howl | null = null;
let floorHowl: Howl | null = null;
let ventilationHowl: Howl | null = null;

try {
  expandHowl = new Howl({
    src: [expandSoundUri],
    volume: 0.85,
  });
  collapseHowl = new Howl({
    src: [collapseSoundUri],
    volume: 0.85,
  });
  floorHowl = new Howl({
    src: [floorSwitchSoundUri],
    volume: 0.65,
  });
  ventilationHowl = new Howl({
    src: [ventilationDroneUri],
    loop: true,
    volume: 0.16,
  });
} catch (e) {
  console.warn('Audio initialization deferred:', e);
}

/**
 * Trigger Expand / Collapse Sound
 * Requirement 3: MUST only trigger on explicit user interaction click
 */
export function playExpandCollapseSound(isExpanding: boolean, audioEnabled: boolean) {
  if (!audioEnabled) return;
  try {
    if (isExpanding) {
      if (expandHowl) {
        expandHowl.stop();
        expandHowl.play();
      }
    } else {
      if (collapseHowl) {
        collapseHowl.stop();
        collapseHowl.play();
      }
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Trigger Floor Switch Sound
 * Requirement 3: MUST only trigger on explicit user interaction click
 */
export function playFloorSwitchSound(audioEnabled: boolean) {
  if (!audioEnabled) return;
  try {
    if (floorHowl) {
      floorHowl.stop();
      floorHowl.play();
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

/**
 * Toggle Industrial HVAC Ventilation Drone
 */
export function setAmbientVentilationDrone(enable: boolean) {
  try {
    if (!ventilationHowl) return;
    if (enable) {
      if (!ventilationHowl.playing()) {
        ventilationHowl.play();
        ventilationHowl.fade(0, 0.18, 1200);
      }
    } else {
      if (ventilationHowl.playing()) {
        ventilationHowl.fade(0.18, 0, 800);
        setTimeout(() => {
          ventilationHowl?.stop();
        }, 850);
      }
    }
  } catch (err) {
    console.warn('Ambient drone error:', err);
  }
}
