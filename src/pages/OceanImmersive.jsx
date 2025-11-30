// src/pages/OceanImmersive.jsx
import React, { useRef, useMemo, Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Link } from "react-router-dom";
import MiniGameOverlay from "../components/MiniGameOverlay";
import InfoToast from "../components/InfoToast";

const OCEAN = "#0b3d5a";
const SURFACE = "#2aa7c7";

/* ===================== Challenge Mode config ===================== */

const CHALLENGE_STEPS = [
  {
    id: "plastic",
    title: "Floating Plastics Detected",
    prompt: "A gyre is funneling debris toward your reef. What’s your first action?",
    options: [
      { label: "Deploy cleanup drones", impact: -2, explain: "Removes surface plastics quickly." },
      { label: "Wait for currents to shift", impact: +1, explain: "Debris accumulates while you wait." },
    ],
  },
  {
    id: "runoff",
    title: "Coastal Runoff Spike",
    prompt: "Heavy rainfall flushed nutrients into the bay. Choose a mitigation:",
    options: [
      { label: "Open spillway & aerate", impact: -1, explain: "Improves oxygen, disperses bloom risk." },
      { label: "Close access & monitor only", impact: +1, explain: "Hypoxia risk increases." },
    ],
  },
  {
    id: "oil",
    title: "Minor Oil Sheen Offshore",
    prompt: "A small slick approaches. Best response now?",
    options: [
      { label: "Deploy booms & skimmers", impact: -2, explain: "Contains and removes oil quickly." },
      { label: "Issue advisory only", impact: +2, explain: "Sheen reaches habitat, stressing wildlife." },
    ],
  },
];

const POLLUTION_BASE = 0;       // lower is better
const POLLUTION_FAIL = 3;       // at/above -> fail
const POLLUTION_WIN = -2;       // at/under -> win

/* ===================== Simple non-freezing visuals ===================== */
function WaterTintOverlay({ active, level }) {
  if (!active) return null;
  // alpha scales with pollution level (0 → clear, 3+ → murky)
  const alpha = Math.max(0, Math.min(0.45, level * 0.12));
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[55]"
      style={{ backgroundColor: `rgba(60, 42, 28, ${alpha})` }}
    />
  );
}

function ImpactToast({ flash }) {
  if (!flash) return null;
  const { text, good } = flash;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[75]">
      <div className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${good ? 'bg-emerald-400 text-slate-900' : 'bg-rose-400 text-slate-900'}`}>
        {text}
      </div>
    </div>
  );
}
/* ===================== Visuals for Challenge Mode ===================== */
function PollutionField({ level = 0 }) {
  // Render a field of small drifting particles; density scales with level
  const count = Math.min(120, Math.max(10, 20 + level * 20));
  const ref = useRef();
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3 + 0] = (Math.random() - 0.5) * 140;
      p[i * 3 + 1] = WORLD_BOUNDS.yBottom + Math.random() * (WORLD_BOUNDS.yTop - WORLD_BOUNDS.yBottom);
      p[i * 3 + 2] = (Math.random() - 0.5) * 140;
    }
    return p;
  }, [count]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 0] += 0.6 * delta * 30;
      arr[i + 1] += 0.05 * delta * 30;
      if (arr[i + 0] > 70) arr[i + 0] = -70;
      if (arr[i + 1] > WORLD_BOUNDS.yTop) arr[i + 1] = WORLD_BOUNDS.yBottom;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={"#cbd5e1"} transparent opacity={0.6} />
    </points>
  );
}

function ChallengeOverlay({ open, step, level, onChoose, onExit, onReset, outcome }) {
  if (!open) return null;
  const current = CHALLENGE_STEPS[step];
  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {/* HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20 text-sm">
          Pollution Level: <span className={level >= POLLUTION_FAIL ? 'text-red-300' : level <= POLLUTION_WIN ? 'text-emerald-300' : 'text-yellow-300'}>{level}</span>
        </div>
      </div>

      {/* Panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[min(680px,92vw)] pointer-events-auto">
        <div className="rounded-2xl bg-slate-900/95 ring-1 ring-white/10 p-5 shadow-2xl">
          {!outcome ? (
            <>
              <h3 className="text-lg font-semibold">{current.title}</h3>
              <p className="text-white/85 mt-1">{current.prompt}</p>
              <div className="mt-4 grid gap-2">
                {current.options.map((opt, idx) => (
                  <button key={idx} onClick={() => onChoose(opt)} className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-left">
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                <button onClick={onReset} className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10">Reset</button>
                <button onClick={onExit} className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10">Exit Challenge</button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold">{outcome === 'win' ? 'Reef Stabilized 🎉' : 'Ecosystem Stressed 😞'}</h3>
              <p className="text-white/85 mt-1">
                {outcome === 'win'
                  ? 'Your interventions reduced impacts. Biodiversity rebounds and water clears.'
                  : 'High pollution stressed wildlife. Try alternative interventions to improve outcomes.'}
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={onReset} className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10">Try Again</button>
                <button onClick={onExit} className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10">Back to Immersive</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== Underwater ambience ===================== */
function UnderwaterAmbience({ url = "/audio/underwater.mp3", volume = 0.28, lowpassHz = 1200 }) {
  const { camera } = useThree();
  const listenerRef = useRef(null);
  const soundRef = useRef(null);

  useEffect(() => {
    const listener = new THREE.AudioListener();
    listenerRef.current = listener;
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    soundRef.current = sound;

    const loader = new THREE.AudioLoader();
    loader.load(url, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true);

      const ctx = listener.context;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = lowpassHz;
      sound.setFilter(lp);
    });

    return () => {
      if (sound?.isPlaying) sound.stop();
      if (listener) camera.remove(listener);
    };
  }, [camera, url, lowpassHz]);

  useEffect(() => {
    const sound = soundRef.current;
    if (sound) {
      sound.setVolume?.(volume);
    }
  }, [volume]);

  useEffect(() => {
    const start = async () => {
      const listener = listenerRef.current;
      const sound = soundRef.current;
      if (!listener || !sound) return;
      if (listener.context.state === "suspended") await listener.context.resume();
      if (sound.buffer && !sound.isPlaying) sound.play();
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, []);

  return null;
}

/* ===================== Helpers & bounds ===================== */
const WORLD_BOUNDS = { x: 42, yTop: 12, yBottom: -18, z: 42 };
const DESPAWN_MARGIN = 12;
const rand = (min, max) => THREE.MathUtils.randFloat(min, max);

function chooseDirection(weighted) {
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [d, w] of weighted) {
    r -= w; if (r <= 0) return d;
  }
  return weighted[0][0];
}

function spawnFromDirection(direction, depthY = -3.5) {
  const y = depthY + rand(-2, 2);
  const R = WORLD_BOUNDS.x + DESPAWN_MARGIN; // symmetric for z
  let x = 0, z = 0, dir;
  switch (direction) {
    case "deep_to_surface":
      x = rand(-WORLD_BOUNDS.x * 0.7, WORLD_BOUNDS.x * 0.7);
      z = rand(-WORLD_BOUNDS.z * 0.7, WORLD_BOUNDS.z * 0.7);
      dir = new THREE.Vector3(rand(-0.2, 0.2), 1, rand(-0.2, 0.2));
      break;
    case "left_to_right":
      x = -R; z = rand(-WORLD_BOUNDS.z, WORLD_BOUNDS.z);
      dir = new THREE.Vector3(1, rand(-0.08, 0.08), rand(-0.15, 0.15));
      break;
    case "right_to_left":
      x =  R; z = rand(-WORLD_BOUNDS.z, WORLD_BOUNDS.z);
      dir = new THREE.Vector3(-1, rand(-0.08, 0.08), rand(-0.15, 0.15));
      break;
    case "diagonal_up":
      x = -R; z = -R; dir = new THREE.Vector3(1, rand(0.05, 0.25), 1);
      break;
    case "diagonal_down":
      x = -R; z =  R; dir = new THREE.Vector3(1, rand(-0.25, -0.05), -1);
      break;
    default: {
      const face = Math.floor(Math.random() * 4);
      switch (face) {
        case 0: x =  R; z = rand(-WORLD_BOUNDS.z, WORLD_BOUNDS.z); dir = new THREE.Vector3(-1, 0, rand(-0.3, 0.3)); break;
        case 1: x = -R; z = rand(-WORLD_BOUNDS.z, WORLD_BOUNDS.z); dir = new THREE.Vector3( 1, 0, rand(-0.3, 0.3)); break;
        case 2: z =  R; x = rand(-WORLD_BOUNDS.x, WORLD_BOUNDS.x); dir = new THREE.Vector3(rand(-0.3, 0.3), 0, -1); break;
        default: z = -R; x = rand(-WORLD_BOUNDS.x, WORLD_BOUNDS.x); dir = new THREE.Vector3(rand(-0.3, 0.3), 0, 1); break;
      }
    }
  }
  dir.normalize();
  return { position: new THREE.Vector3(x, y, z), direction: dir };
}

/* ===================== Species quick facts (toast) ===================== */
const SPECIES_INFO = {
  turtle: {
    title: "Green Sea Turtle (Chelonia mydas)",
    status: "Endangered",
    blurb: "Grazes seagrass and helps keep meadows healthy. Threats: bycatch, habitat loss, debris.",
    link: "https://www.iucnredlist.org/species/4615/11037468"
  },
  shark: {
    title: "Blacktip Reef Shark (Carcharhinus melanopterus)",
    status: "Near Threatened",
    blurb: "Key mesopredator on coral reefs. Pressures include overfishing and habitat loss.",
    link: "https://www.iucnredlist.org/species/39375/16523699"
  },
  clownfish: {
    title: "Clownfish (Amphiprioninae)",
    status: "Least Concern",
    blurb: "Lives with anemones; reef degradation and warming threaten local populations.",
    link: "https://www.iucnredlist.org/search?query=Amphiprion&searchType=species"
  },
  manta: {
    title: "Manta Ray (Mobula spp.)",
    status: "Vulnerable",
    blurb: "Gentle plankton-feeders; impacted by bycatch, targeted fishing and microplastics.",
    link: "https://www.iucnredlist.org/"
  }
};

/* ===================== Mini‑quiz questions ===================== */
const QUIZ_BANK = {
  turtle: { q: "Diet?", opts: ["Herbivore", "Omnivore", "Carnivore"], correct: "Herbivore" },
  shark: { q: "Conservation status?", opts: ["Least Concern", "Near Threatened", "Endangered"], correct: "Near Threatened" },
  clownfish: { q: "Lives with…", opts: ["Coral", "Anemones", "Kelp"], correct: "Anemones" },
  manta: { q: "Feeding style?", opts: ["Bites prey", "Filter feeds", "Ambush"], correct: "Filter feeds" },
};

/* ===================== GLTF animal models ===================== */
function useWander({ baseY, turnJitter, bobAmp, bobFreq, minSpeed, maxSpeed, entryWeights, startAt }) {
  const ref = useRef();
  const vel = useRef(new THREE.Vector3(1, 0, 0));
  const initialized = useRef(false);
  const hasSpawned = useRef(false);
  const startAtRef = useMemo(() => (startAt ?? rand(0, 5)), [startAt]); // default or caller-provided
  const offscreen = useRef(false);
  const goneUntil = useRef(0);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;

    // spawn gating
    if (t < startAtRef && !hasSpawned.current) { ref.current.visible = false; return; }
    if (!hasSpawned.current) { ref.current.visible = true; hasSpawned.current = true; }

    // init position/velocity
    if (!initialized.current) {
      const entry = chooseDirection(entryWeights);
      const spawn = spawnFromDirection(entry, baseY);
      ref.current.position.copy(spawn.position);
      vel.current.copy(spawn.direction.multiplyScalar(rand(minSpeed, maxSpeed)));
      initialized.current = true;
    }

    // offscreen wait-and-respawn
    if (offscreen.current) {
      if (t >= goneUntil.current) {
        const entry = chooseDirection(entryWeights);
        const spawn = spawnFromDirection(entry, baseY);
        ref.current.position.copy(spawn.position);
        vel.current.copy(spawn.direction.multiplyScalar(rand(minSpeed, maxSpeed)));
        offscreen.current = false;
      } else return;
    }

    // steering + bob
    const headingNoise = (Math.sin(t * 0.8) + Math.sin(t * 1.1 + 1.7)) * 0.5 * turnJitter;
    const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), headingNoise * delta);
    vel.current.applyQuaternion(rot);
    vel.current.setLength(THREE.MathUtils.clamp(vel.current.length(), minSpeed, maxSpeed));

    const bob = Math.sin(t * bobFreq) * bobAmp * delta;
    const y = THREE.MathUtils.clamp((ref.current.position.y + bob), WORLD_BOUNDS.yBottom, WORLD_BOUNDS.yTop);
    ref.current.position.set(ref.current.position.x, y, ref.current.position.z);

    // integrate
    ref.current.position.addScaledVector(vel.current, delta);

    // face velocity
    const forward = new THREE.Vector3(0, 0, 1);
    const dir = vel.current.clone().normalize();
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(forward, dir);
    ref.current.quaternion.slerp(targetQuat, 0.18);

    // bounds check -> offscreen state
    const p = ref.current.position;
    if (Math.abs(p.x) > WORLD_BOUNDS.x + DESPAWN_MARGIN ||
        Math.abs(p.z) > WORLD_BOUNDS.z + DESPAWN_MARGIN ||
        p.y > WORLD_BOUNDS.yTop + 2 || p.y < WORLD_BOUNDS.yBottom - 2) {
      offscreen.current = true;
      goneUntil.current = t + rand(1.0, 3.0);
    }
  });

  return ref;
}

function TurtleModel({ onFound, spawnDelay = 0 }) {
  const { scene } = useGLTF("/models/green_turtle.glb");
  const ref = useWander({
    baseY: -3.6,
    turnJitter: 0.25,
    bobAmp: 0.12,
    bobFreq: 0.7,
    minSpeed: 0.55,
    maxSpeed: 1.0,
    entryWeights: [["deep_to_surface", 6], ["left_to_right", 2], ["right_to_left", 2], ["diagonal_up", 1]],
    startAt: spawnDelay,
  });
  return (
    <group ref={ref} rotation={[Math.PI, 0, 0]} scale={0.25}
      onPointerDown={(e) => { e.stopPropagation(); onFound?.("turtle"); }}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/green_turtle.glb");

function SharkModel({ onFound, spawnDelay = 4 }) {
  const { scene } = useGLTF("/models/blacktip_shark.glb");
  const ref = useWander({
    baseY: -3.8,
    turnJitter: 0.45,
    bobAmp: 0.08,
    bobFreq: 1.1,
    minSpeed: 1.0,
    maxSpeed: 1.6,
    entryWeights: [["left_to_right", 5], ["right_to_left", 5], ["diagonal_up", 1], ["diagonal_down", 1]],
    startAt: spawnDelay,
  });
  return (
    <group ref={ref} rotation={[Math.PI, 0, 0]} scale={0.35}
      onPointerDown={(e) => { e.stopPropagation(); onFound?.("shark"); }}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/blacktip_shark.glb");

function ClownfishModel({ onFound, spawnDelay = 7.5 }) {
  const { scene } = useGLTF("/models/clownfish.glb");
  const ref = useWander({
    baseY: -3.2,
    turnJitter: 0.7,
    bobAmp: 0.1,
    bobFreq: 1.5,
    minSpeed: 0.9,
    maxSpeed: 1.4,
    entryWeights: [["left_to_right", 4], ["right_to_left", 4], ["diagonal_up", 2]],
    startAt: spawnDelay,
  });
  return (
    <group ref={ref} rotation={[Math.PI, 0, 0]} scale={0.16}
      onPointerDown={(e) => { e.stopPropagation(); onFound?.("clownfish"); }}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/clownfish.glb");

function MantaRayModel({ onFound, spawnDelay = 11 }) {
  const { scene } = useGLTF("/models/manta_ray.glb");
  const ref = useWander({
    baseY: -3.0,
    turnJitter: 0.2,
    bobAmp: 0.15,
    bobFreq: 0.8,
    minSpeed: 0.6,
    maxSpeed: 1.0,
    entryWeights: [["diagonal_up", 4], ["deep_to_surface", 3], ["left_to_right", 2], ["right_to_left", 2]],
    startAt: spawnDelay,
  });
  return (
    <group ref={ref} rotation={[Math.PI, 0, 0]} scale={0.75}
      onPointerDown={(e) => { e.stopPropagation(); onFound?.("manta"); }}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/manta_ray.glb");

/* ===================== Environment pieces ===================== */
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 20, -5]} intensity={0.6} color={SURFACE} />
      <directionalLight position={[-8, 5, 8]} intensity={0.15} color="#7dd3fc" />
    </>
  );
}

function WaterSurface() {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) ref.current.rotation.z = Math.sin(t * 0.15) * 0.03;
  });
  return (
    <mesh ref={ref} position={[0, 10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[500, 500]} />
      <meshPhysicalMaterial color={SURFACE} transparent opacity={0.18} roughness={0.85} />
    </mesh>
  );
}

function Seabed() {
  return (
    <mesh position={[0, -20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color={"#073047"} />
    </mesh>
  );
}

function Bubbles({ count = 28 }) {
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3 + 0] = (Math.random() - 0.5) * 60;
      p[i * 3 + 1] = Math.random() * 30 - 12;
      p[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return p;
  }, [count]);
  const ref = useRef();
  useFrame((_, delta) => {
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] += 2.5 * delta;
      if (arr[i] > 12) arr[i] = -12 - Math.random() * 10;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color={"#a5f3fc"} transparent opacity={0.75} />
    </points>
  );
}

function Plankton({ count = 45 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3 + 0] = (Math.random() - 0.5) * 120;
      p[i * 3 + 1] = WORLD_BOUNDS.yBottom + Math.random() * (WORLD_BOUNDS.yTop - WORLD_BOUNDS.yBottom);
      p[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    return p;
  }, [count]);
  useFrame((_, delta) => {
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 0] += (Math.sin(arr[i + 2] * 0.02) * 0.02 + 0.01) * delta * 30;
      arr[i + 1] += 0.02 * delta * 30;
      arr[i + 2] += (Math.cos(arr[i + 0] * 0.02) * 0.02 + 0.005) * delta * 30;
      if (arr[i + 0] > 60) arr[i + 0] = -60;
      if (arr[i + 0] < -60) arr[i + 0] = 60;
      if (arr[i + 1] > WORLD_BOUNDS.yTop) arr[i + 1] = WORLD_BOUNDS.yBottom;
      if (arr[i + 2] > 60) arr[i + 2] = -60;
      if (arr[i + 2] < -60) arr[i + 2] = 60;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#bbf7d0" transparent opacity={0.45} />
    </points>
  );
}

function KelpBlade({ x = 0, z = 0, height = 6, color = "#1f8b6e" }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(t * 0.6 + (x + z) * 0.12) * 0.15;
  });
  return (
    <mesh ref={ref} position={[x, WORLD_BOUNDS.yBottom + 0.2, z]}>
      <boxGeometry args={[0.12, height, 0.12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function KelpPatch({ count = 24, area = 30 }) {
  const blades = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({ x: (Math.random() - 0.5) * area, z: (Math.random() - 0.5) * area, h: 5 + Math.random() * 4 });
    }
    return arr;
  }, [count, area]);
  return (
    <group>
      {blades.map((b, i) => <KelpBlade key={i} x={b.x} z={b.z} height={b.h} />)}
    </group>
  );
}

function SardineSchool({ count = 320, bandY = -6.0, color = "#93c5fd", spread = 70 }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * spread,
        y: bandY + (Math.random() - 0.5) * 2.5,
        z: (Math.random() - 0.5) * spread,
        speed: 0.6 + Math.random() * 0.6,
        amp: 1.0 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        size: 0.09 + Math.random() * 0.14,
      });
    }
    return arr;
  }, [count, bandY, spread]);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    data.forEach((f, i) => {
      const x = f.x + Math.sin(t * f.speed + f.phase) * f.amp * 1.6;
      const y = f.y + Math.sin(t * (f.speed * 1.9) + f.phase) * 0.25;
      const z = f.z + Math.cos(t * f.speed + f.phase) * f.amp * 1.1;
      dummy.position.set(x, y, z);
      const dx = Math.cos(t * f.speed + f.phase);
      const dz = -Math.sin(t * f.speed + f.phase);
      dummy.lookAt(x + dx, y, z + dz);
      dummy.scale.setScalar(f.size);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <capsuleGeometry args={[1, 2, 2, 6]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
    </instancedMesh>
  );
}

/* ===================== Page component ===================== */
export default function OceanImmersive() {
  const [muted, setMuted] = useState(false);

  // Mini‑game state
  const [miniActive, setMiniActive] = useState(false);
  const [targets, setTargets] = useState([
    { id: "turtle", label: "Green Turtle", state: "hidden" },
    { id: "shark", label: "Reef Shark", state: "hidden" },
    { id: "clownfish", label: "Clownfish", state: "hidden" },
    { id: "manta", label: "Manta Ray", state: "hidden" },
  ]);
  const [startTime, setStartTime] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);

  // Challenge Mode state
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeStep, setChallengeStep] = useState(0);
  const [pollutionLevel, setPollutionLevel] = useState(POLLUTION_BASE);
  const [challengeOutcome, setChallengeOutcome] = useState(null);
  const [flash, setFlash] = useState(null);

  // Always start in normal immersive mode on mount
  useEffect(() => {
    setMiniActive(false);
    setTargets([
      { id: "turtle", label: "Green Turtle", state: "hidden" },
      { id: "shark", label: "Reef Shark", state: "hidden" },
      { id: "clownfish", label: "Clownfish", state: "hidden" },
      { id: "manta", label: "Manta Ray", state: "hidden" },
    ]);
    setStartTime(null);
    setFinishedAt(null);
  }, []);

  // Toast state
  const [toast, setToast] = useState({ open: false, title: "", status: "", blurb: "", link: "" });
  // Mini‑quiz state (mini-game only)
  const [quiz, setQuiz] = useState({ open: false, id: null, question: "", options: [], correct: "" });
  const [points, setPoints] = useState(0);
  const showInfo = (id) => {
    const s = SPECIES_INFO[id];
    if (!s) return;
    setToast({ open: true, ...s });
    window.clearTimeout(showInfo._t);
    showInfo._t = window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 6000);
  };

  function startMiniGame() {
    setTargets((t) => t.map((x) => ({ ...x, state: "hidden" })));
    setStartTime(Date.now());
    setFinishedAt(null);
    setPoints(0);
    setMiniActive(true);
  }

  function resetMiniGame() {
    // keep mini-game active and restart timers/progress
    setTargets((t) => t.map((x) => ({ ...x, state: "hidden" })));
    setStartTime(Date.now());
    setFinishedAt(null);
    setPoints(0);
    setMiniActive(true);
  }

  function stopMiniGame() {
    setMiniActive(false);
  }

  function startChallenge() {
    // Turn off mini-game if active
    setMiniActive(false);
    setChallengeActive(true);
    setChallengeStep(0);
    setPollutionLevel(POLLUTION_BASE);
    setChallengeOutcome(null);
  }
  function exitChallenge() {
    setChallengeActive(false);
    setChallengeOutcome(null);
  }
  function resetChallenge() {
    setChallengeStep(0);
    setPollutionLevel(POLLUTION_BASE);
    setChallengeOutcome(null);
  }
  function applyImpactAndAdvance(impact) {
    setPollutionLevel((prev) => {
      const newLevel = prev + impact;
      // If this was the last step, determine outcome now
      if (challengeStep + 1 >= CHALLENGE_STEPS.length) {
        const outcome = newLevel <= POLLUTION_WIN ? 'win' : (newLevel >= POLLUTION_FAIL ? 'fail' : 'fail');
        setChallengeOutcome(outcome);
      } else {
        setChallengeStep((s) => s + 1);
      }
      return newLevel;
    });
  }

  function chooseChallengeOption(opt) {
    // Show a quick flash and apply impact immediately
    setFlash({ text: (opt.impact <= 0 ? 'Good action: ' : 'Harmful action: ') + opt.label + (opt.impact < 0 ? ' (-' + Math.abs(opt.impact) + ')' : ' (+' + opt.impact + ')'), good: opt.impact < 0 });
    setTimeout(() => setFlash(null), 900);
    applyImpactAndAdvance(opt.impact);
  }

  const reportFound = (id) => {
    // Always show knowledge card
    showInfo(id);

    // If mini‑game active, open a 1‑question quiz for this species
    if (miniActive) {
      const item = QUIZ_BANK[id];
      if (item) {
        setQuiz({ open: true, id, question: item.q, options: item.opts, correct: item.correct });
      }
    }

    if (!miniActive) return;
    setTargets(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, state: "found" } : t));
      const allFound = next.every(t => t.state === "found");
      if (allFound && !finishedAt) setFinishedAt(Date.now());
      return next;
    });
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  function handleQuizAnswer(selected) {
    if (selected === quiz.correct) setPoints((p) => p + 1);
    setQuiz({ open: false, id: null, question: '', options: [], correct: '' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400/15 ring-1 ring-cyan-400/30">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="text-cyan-300">
              <circle cx="12" cy="12" r="9" fill="currentColor" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Wild Realms</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-pressed={muted}
            onClick={() => setMuted((m) => !m)}
            className="rounded-full px-3 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10"
            title={muted ? "Unmute ambience" : "Mute ambience"}
          >
            {muted ? "Unmute 🔈" : "Mute 🔇"}
          </button>

          {/* Mini‑Game controls */}
          {miniActive ? (
            <>
              <button
                type="button"
                onClick={stopMiniGame}
                className="rounded-full bg-sky-300/20 px-4 py-2 text-sm font-semibold ring-1 ring-sky-300/40 hover:bg-sky-300/30"
              >
                Exit Mini‑Game
              </button>
              <button
                type="button"
                onClick={resetMiniGame}
                className="rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/15"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={startChallenge}
                className="rounded-full bg-amber-300 text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-amber-200"
              >
                Challenge Mode
              </button>
            </>
          ) : challengeActive ? (
            <>
              <button
                type="button"
                onClick={exitChallenge}
                className="rounded-full bg-amber-300/20 px-4 py-2 text-sm font-semibold ring-1 ring-amber-300/40 hover:bg-amber-300/30"
              >
                Exit Challenge
              </button>
              <button
                type="button"
                onClick={resetChallenge}
                className="rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/15"
              >
                Reset
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startMiniGame}
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-300"
              >
                Start Mini‑Game
              </button>
              <button
                type="button"
                onClick={startChallenge}
                className="rounded-full bg-amber-300 text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-amber-200"
              >
                Challenge Mode
              </button>
            </>
          )}

          <Link to="/biomes" className="rounded-full px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">
            Back to Biomes
          </Link>
        </div>
      </header>

      {/* 3D Canvas */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-10">
        <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl" style={{ height: 'min(88vh, 1000px)' }}>
          <Canvas camera={{ position: [0, 0, 8], fov: 55 }} gl={{ antialias: true, alpha: false }}
            onCreated={({ scene }) => { scene.background = new THREE.Color(OCEAN); scene.fog = new THREE.Fog(OCEAN, 2, 80); }}>
            <Suspense fallback={null}>
              <UnderwaterAmbience url="/audio/underwater.mp3" volume={muted ? 0 : 0.28} lowpassHz={1200} />
              <SceneLighting />
              <Environment preset="sunset" />

              {/* Environment */}
              <WaterSurface />
              <Seabed />
              {challengeActive && <PollutionField level={pollutionLevel} />}
              <Bubbles count={isMobile ? 12 : 28} />
              <Plankton count={isMobile ? 20 : 45} />
              <KelpPatch count={28} area={36} />

              {/* Schools */}
              <SardineSchool count={320} bandY={-6.0} color="#93c5fd" spread={70} />
              <SardineSchool count={260} bandY={-8.5} color="#60a5fa" spread={80} />

              {/* Animals with click handlers */}
              <TurtleModel onFound={reportFound} />
              <SharkModel onFound={reportFound} />
              <ClownfishModel onFound={reportFound} />
              <MantaRayModel onFound={reportFound} />

              <OrbitControls enablePan={false} minDistance={4} maxDistance={18} maxPolarAngle={Math.PI * 0.6} />
            </Suspense>
          </Canvas>
          {/* Non-freezing screen tint to indicate murkiness */}
          <WaterTintOverlay active={challengeActive} level={pollutionLevel} />
        </div>
      </main>

      {/* Quick mini‑quiz modal */}
      {quiz.open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-6" role="dialog" aria-modal="true">
          <div className="max-w-sm w-full rounded-2xl bg-slate-900 ring-1 ring-white/10 p-5">
            <h3 className="text-lg font-semibold mb-2">Quick Check</h3>
            <p className="text-white/85 mb-4">{quiz.question}</p>
            <div className="grid gap-2">
              {quiz.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleQuizAnswer(opt)}
                  className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-left"
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-white/70">
              <span>Score: {points} pts</span>
              <button
                className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10"
                onClick={() => setQuiz({ open: false, id: null, question: '', options: [], correct: '' })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impact feedback for challenge choices */}
      <ImpactToast flash={flash} />

      {/* Mini‑game overlay (renders above Canvas) */}
      {miniActive && (
        <MiniGameOverlay
          open={true}
          targets={targets}
          startTime={startTime}
          finishedAt={finishedAt}
          onClose={stopMiniGame}
          onReset={resetMiniGame}
          points={points}
          complete={finishedAt !== null}
        />
      )}

      {challengeActive && (
        <ChallengeOverlay
          open={challengeActive}
          step={challengeStep}
          level={pollutionLevel}
          onChoose={chooseChallengeOption}
          onExit={exitChallenge}
          onReset={resetChallenge}
          outcome={challengeOutcome}
        />
      )}

      {/* Info toast for any animal click */}
      <InfoToast
        open={toast.open}
        title={toast.title}
        status={toast.status}
        blurb={toast.blurb}
        link={toast.link}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      {/* Footer */}
      <footer className="mt-auto mx-auto flex w-full max-w-7xl items-center justify-between px-6 pb-10 pt-6 text-sm text-white/75">
        <div>© {new Date().getFullYear()} Wild Realms • Built for learning & analysis</div>
      </footer>
    </div>
  );
}