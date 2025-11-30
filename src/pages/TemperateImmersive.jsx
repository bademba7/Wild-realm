// src/pages/TemperateImmersive.jsx
import React, { useRef, useMemo, Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Link } from "react-router-dom";
import MiniGameOverlay from "../components/MiniGameOverlay";
import InfoToast from "../components/InfoToast";

// GLB asset paths for temperate forest
const MODEL_PATHS = {
  tree: "/models/temperate/tree.glb",
  rock: "/models/temperate/rock.glb",
  grass: "/models/temperate/grass_tuft.glb",
  mushroom: "/models/temperate/mushroom.glb",
};

// Preload common assets
useGLTF.preload(MODEL_PATHS.tree);
useGLTF.preload(MODEL_PATHS.rock);
useGLTF.preload(MODEL_PATHS.grass);
useGLTF.preload(MODEL_PATHS.mushroom);

/** Theme */
const FOREST = "#0f1a12";        // deep forest green
const CANOPY = "#284d2a";        // canopy tint

/** Challenge steps (simple, non-freezing like ocean version) */
const CHALLENGE_STEPS = [
  {
    id: "litter",
    title: "Trail Litter Found",
    prompt: "Visitors left trash near the creek. What’s your first response?",
    options: [
      { label: "Organize a quick cleanup", impact: -1, explain: "Removes hazards for wildlife fast." },
      { label: "Log it for later", impact: +1, explain: "Animals may ingest plastics meanwhile." },
    ],
  },
  {
    id: "runoff",
    title: "Fertilizer Runoff",
    prompt: "Rain washed farm fertilizer into the stream. Mitigate now?",
    options: [
      { label: "Install silt fences & buffer plants", impact: -2, explain: "Reduces nutrients into water." },
      { label: "Post a warning sign only", impact: +1, explain: "Algae & low oxygen risk increase." },
    ],
  },
  {
    id: "invasive",
    title: "Invasive Plant Spread",
    prompt: "A patch of garlic mustard spreads under oaks.",
    options: [
      { label: "Pull & bag invasives this week", impact: -2, explain: "Protects native understory." },
      { label: "Monitor for a month", impact: +2, explain: "Spread accelerates and displaces natives." },
    ],
  },
];
const POLLUTION_BASE = 0;
const POLLUTION_FAIL = 3;
const POLLUTION_WIN = -2;

/** Light, fog, ambience */
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[8, 18, -6]} intensity={0.7} color={"#ffd4a8"} />
      <directionalLight position={[-10, 6, 10]} intensity={0.2} color={"#c9f0c0"} />
    </>
  );
}

function UnderstoryFog() {
  return null; // fog is attached on Canvas creation for perf-consistency
}

/** Gentle leaf dust motes */
function DustMotes({ count = 60 }) {
  const ref = useRef();
  const pos = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3 + 0] = (Math.random() - 0.5) * 200;
      p[i * 3 + 1] = Math.random() * 25 - 8;
      p[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    return p;
  }, [count]);

  useFrame((_, d) => {
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 0] += Math.sin(arr[i + 2] * 0.01) * 0.02 * d * 60;
      arr[i + 1] += (Math.sin(arr[i + 0] * 0.005) * 0.01 + 0.005) * d * 60;
      if (arr[i + 1] > 20) arr[i + 1] = -8;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={pos} count={pos.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={"#fff7"} transparent opacity={0.55} />
    </points>
  );
}

/** Ground + patches */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.5, 0]}>
      <planeGeometry args={[600, 600]} />
      <meshStandardMaterial color={"#2b3a2a"} roughness={1} />
    </mesh>
  );
}

function Log({ x = 0, z = 0, len = 6, r = 0.4 }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(s.clock.getElapsedTime() * 0.07 + x * 0.1) * 0.02;
  });
  return (
    <mesh ref={ref} position={[x, -5.2, z]} rotation={[0, Math.random() * Math.PI, Math.PI * 0.03]}>
      <cylinderGeometry args={[r, r, len, 12]} />
      <meshStandardMaterial color={"#5a4634"} roughness={0.9} />
    </mesh>
  );
}

function Tree({ x = 0, z = 0, h = 10 }) {
  return (
    <group position={[x, -5.5, z]}>
      <mesh position={[0, h * 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.45, h, 8]} />
        <meshStandardMaterial color={"#6b4e31"} />
      </mesh>
      <mesh position={[0, h + 1.6, 0]}>
        <coneGeometry args={[2.4, 5.2, 8]} />
        <meshStandardMaterial color={"#244f2a"} />
      </mesh>
    </group>
  );
}

/** ------------ GLB-based assets: trees, rocks, mushrooms, grass ------------ */

// Helper to scatter instance transforms
const randFloat = (a, b) => THREE.MathUtils.randFloat(a, b);

function TreeRingGLB({ count = 24, radius = 85, url = MODEL_PATHS.tree }) {
  const { scene } = useGLTF(url);
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      arr.push({
        x: Math.cos(ang) * (radius + randFloat(-3, 3)),
        z: Math.sin(ang) * (radius + randFloat(-3, 3)),
        s: randFloat(0.8, 1.2),
        ry: randFloat(0, Math.PI * 2),
      });
    }
    return arr;
  }, [count, radius]);
  return (
    <group>
      {items.map((t, i) => (
        <primitive
          key={i}
          object={scene.clone(true)}
          position={[t.x, -5.5, t.z]}
          scale={t.s}
          rotation={[0, t.ry, 0]}
        />
      ))}
    </group>
  );
}

function TreeClusterGLB({ x = 0, z = 0, count = 6, radius = 7, url = MODEL_PATHS.tree }) {
  const { scene } = useGLTF(url);
  const items = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      ox: randFloat(-radius, radius),
      oz: randFloat(-radius, radius),
      s: randFloat(0.7, 1.15),
      ry: randFloat(0, Math.PI * 2),
    }));
  }, [count, radius]);
  return (
    <group position={[x, -5.5, z]}>
      {items.map((t, i) => (
        <primitive
          key={i}
          object={scene.clone(true)}
          position={[t.ox, 0, t.oz]}
          scale={t.s}
          rotation={[0, t.ry, 0]}
        />
      ))}
    </group>
  );
}

function RockScatterGLB({ count = 12, spread = 120, url = MODEL_PATHS.rock }) {
  const { scene } = useGLTF(url);
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = randFloat(-spread, spread);
      const z = randFloat(-spread, spread);
      if (Math.abs(x) < 6 && Math.abs(z) < 10) { i--; continue; } // keep path clear
      arr.push({ x, z, s: randFloat(0.6, 1.4), ry: randFloat(0, Math.PI * 2) });
    }
    return arr;
  }, [count, spread]);
  return (
    <group>
      {items.map((r, i) => (
        <primitive
          key={i}
          object={scene.clone(true)}
          position={[r.x, -5.4, r.z]}
          scale={r.s}
          rotation={[0, r.ry, 0]}
        />
      ))}
    </group>
  );
}

function MushroomScatterGLB({ count = 20, spread = 80, url = MODEL_PATHS.mushroom }) {
  const { scene } = useGLTF(url);
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = randFloat(-spread, spread);
      const z = randFloat(-spread, spread);
      if (Math.abs(x) < 6 && Math.abs(z) < 10) { i--; continue; }
      arr.push({ x, z, s: randFloat(0.4, 0.75), ry: randFloat(0, Math.PI * 2) });
    }
    return arr;
  }, [count, spread]);
  return (
    <group>
      {items.map((m, i) => (
        <primitive
          key={i}
          object={scene.clone(true)}
          position={[m.x, -5.45, m.z]}
          scale={m.s}
          rotation={[0, m.ry, 0]}
        />
      ))}
    </group>
  );
}

function GrassScatterGLB({ count = 450, spread = 120, url = MODEL_PATHS.grass }) {
  const { scene } = useGLTF(url);
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = randFloat(-spread, spread);
      const z = randFloat(-spread, spread);
      if (Math.abs(x) < 6 && Math.abs(z) < 10) { i--; continue; }
      arr.push({ x, z, s: randFloat(0.6, 1.1), ry: randFloat(0, Math.PI * 2), phase: randFloat(0, Math.PI * 2) });
    }
    return arr;
  }, [count, spread]);



  return (
    <group>
      {items.map((g, i) => (
        <primitive
          key={i}
          object={scene.clone(true)}
          position={[g.x, -5.5, g.z]}
          scale={g.s}
          rotation={[0, g.ry, 0]}
        />
      ))}
    </group>
  );
}

/** --- Motion helpers: ground walk vs. air glide (less "swimmy") --- */
const WORLD = { x: 45, yTop: 10, yBottom: -4, z: 45 };
const DESPAWN = 10;
const rand = (a, b) => THREE.MathUtils.randFloat(a, b);

function choose(weights) {
  const sum = weights.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * sum;
  for (const [v, w] of weights) { r -= w; if (r <= 0) return v; }
  return weights[0][0];
}
function spawnFrom(direction, baseY = -2.5) {
  const R = WORLD.x + DESPAWN;
  let x = 0, z = 0, dir;
  switch (direction) {
    case "deep_to_surface":
      x = rand(-WORLD.x * 0.6, WORLD.x * 0.6);
      z = rand(-WORLD.z * 0.6, WORLD.z * 0.6);
      dir = new THREE.Vector3(rand(-0.2, 0.2), 0, rand(-0.2, 0.2));
      break;
    case "left_to_right":
      x = -R; z = rand(-WORLD.z, WORLD.z); dir = new THREE.Vector3(1, 0, rand(-0.2, 0.2)); break;
    case "right_to_left":
      x =  R; z = rand(-WORLD.z, WORLD.z); dir = new THREE.Vector3(-1, 0, rand(-0.2, 0.2)); break;
    case "diagonal":
      x = -R; z = -R; dir = new THREE.Vector3(1, 0, 1); break;
    default:
      x = rand(-R, R); z = -R; dir = new THREE.Vector3(rand(-0.3, 0.3), 0, 1);
  }
  dir.normalize();
  return { position: new THREE.Vector3(x, baseY, z), direction: dir };
}

// Ground walkers: keep y locked near base, slight step bob, yaw-only rotation
function useGroundWalk({ baseY, turnJitter = 0.1, stepAmp = 0.02, stepFreq = 2.6, minSpeed = 0.6, maxSpeed = 1.2, entries, startAt }) {
  const ref = useRef();
  const vel = useRef(new THREE.Vector3(1, 0, 0));
  const started = useRef(false);
  const hasSpawned = useRef(false);
  const startDelay = useMemo(() => (startAt ?? rand(0, 5)), [startAt]);
  const offscreen = useRef(false);
  const returnAt = useRef(0);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    if (t < startDelay && !hasSpawned.current) { ref.current.visible = false; return; }
    if (!hasSpawned.current) { ref.current.visible = true; hasSpawned.current = true; }

    if (!started.current) {
      const entry = choose(entries);
      const s = spawnFrom(entry, baseY);
      ref.current.position.copy(s.position);
      vel.current.copy(s.direction.multiplyScalar(rand(minSpeed, maxSpeed)));
      started.current = true;
    }
    if (offscreen.current) {
      if (t >= returnAt.current) {
        const entry = choose(entries);
        const s = spawnFrom(entry, baseY);
        ref.current.position.copy(s.position);
        vel.current.copy(s.direction.multiplyScalar(rand(minSpeed, maxSpeed)));
        offscreen.current = false;
      } else { return; }
    }

    // small random yaw jitter (no banking)
    const yawDelta = (Math.sin(t * 0.8) + Math.sin(t * 1.3 + 1.2)) * 0.5 * turnJitter * dt;
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), yawDelta);
    vel.current.applyQuaternion(yawQuat);
    vel.current.setLength(THREE.MathUtils.clamp(vel.current.length(), minSpeed, maxSpeed));

    // forward integrate (XZ only), y sticks to base with step bob
    ref.current.position.addScaledVector(vel.current, dt);
    ref.current.position.y = baseY + Math.sin(t * stepFreq) * stepAmp;

    // face direction using yaw only
    const dir = vel.current.clone().normalize();
    const yaw = Math.atan2(dir.x, dir.z);
    ref.current.rotation.set(0, yaw, 0);

    const p = ref.current.position;
    if (Math.abs(p.x) > WORLD.x + DESPAWN || Math.abs(p.z) > WORLD.z + DESPAWN) {
      offscreen.current = true;
      returnAt.current = t + rand(1.2, 3.0);
    }
  });
  return ref;
}

// Air gliders (owls): gentle height band, mild bob, bank slightly when turning
function useAirGlide({ baseY = 1.2, yAmp = 0.4, yFreq = 0.6, turnJitter = 0.2, bankAmt = 0.12, minSpeed = 0.8, maxSpeed = 1.6, entries, startAt }) {
  const ref = useRef();
  const vel = useRef(new THREE.Vector3(1, 0, 0));
  const started = useRef(false);
  const hasSpawned = useRef(false);
  const startDelay = useMemo(() => (startAt ?? rand(0, 5)), [startAt]);
  const offscreen = useRef(false);
  const returnAt = useRef(0);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    if (t < startDelay && !hasSpawned.current) { ref.current.visible = false; return; }
    if (!hasSpawned.current) { ref.current.visible = true; hasSpawned.current = true; }

    if (!started.current) {
      const entry = choose(entries);
      const s = spawnFrom(entry, baseY);
      ref.current.position.copy(s.position);
      vel.current.copy(s.direction.multiplyScalar(rand(minSpeed, maxSpeed)));
      started.current = true;
    }
    if (offscreen.current) {
      if (t >= returnAt.current) {
        const entry = choose(entries);
        const s = spawnFrom(entry, baseY);
        ref.current.position.copy(s.position);
        vel.current.copy(s.direction.multiplyScalar(rand(minSpeed, maxSpeed)));
        offscreen.current = false;
      } else { return; }
    }

    // gentle steering + small bank
    const yawDelta = (Math.sin(t * 0.6) + Math.sin(t * 1.1 + 0.7)) * 0.5 * turnJitter * dt;
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), yawDelta);
    vel.current.applyQuaternion(yawQuat);
    vel.current.setLength(THREE.MathUtils.clamp(vel.current.length(), minSpeed, maxSpeed));

    // vertical glide band
    const y = THREE.MathUtils.clamp(baseY + Math.sin(t * yFreq) * yAmp, WORLD.yBottom, WORLD.yTop);
    ref.current.position.y = y;
    ref.current.position.addScaledVector(vel.current, dt);

    const dir = vel.current.clone().normalize();
    const yaw = Math.atan2(dir.x, dir.z);
    const bank = THREE.MathUtils.clamp(-yawDelta * 12, -bankAmt, bankAmt);
    ref.current.rotation.set(bank, yaw, 0);

    const p = ref.current.position;
    if (Math.abs(p.x) > WORLD.x + DESPAWN || Math.abs(p.z) > WORLD.z + DESPAWN || p.y > WORLD.yTop + 1 || p.y < WORLD.yBottom - 1) {
      offscreen.current = true;
      returnAt.current = t + rand(1.2, 3.2);
    }
  });
  return ref;
}

/** Species info + quiz */
const SPECIES_INFO = {
  deer: {
    title: "White-tailed Deer (Odocoileus virginianus)",
    status: "Least Concern",
    blurb: "Key herbivore; shape understory. Overabundance can hinder tree regeneration.",
    link: "https://www.iucnredlist.org/species/42394/22162006",
  },
  fox: {
    title: "Red Fox (Vulpes vulpes)",
    status: "Least Concern",
    blurb: "Omnivorous mesopredator controlling rodents; adapts well to edges.",
    link: "https://www.iucnredlist.org/species/23062/46190249",
  },
  owl: {
    title: "Great Horned Owl (Bubo virginianus)",
    status: "Least Concern",
    blurb: "Nocturnal apex bird; keeps small mammal populations in check.",
    link: "https://www.iucnredlist.org/species/22689055/93335852",
  },
  bear: {
    title: "American Black Bear (Ursus americanus)",
    status: "Least Concern",
    blurb: "Omnivore; seed disperser via fruit consumption; human conflict risks.",
    link: "https://www.iucnredlist.org/species/41687/114251609",
  },
};
const QUIZ_BANK = {
  deer: { q: "Primary diet?", opts: ["Herbivore", "Carnivore", "Insectivore"], correct: "Herbivore" },
  fox: { q: "Trophic role?", opts: ["Producer", "Mesopredator", "Detritivore"], correct: "Mesopredator" },
  owl: { q: "Active mostly…", opts: ["Day", "Night", "Dawn only"], correct: "Night" },
  bear: { q: "Eats mostly…", opts: ["Only meat", "Only plants", "Both plants & meat"], correct: "Both plants & meat" },
};


/** GLTF animal models (place your .glb files in /public/models/ … names below) */
function DeerModel({ onFound, spawnDelay = 0 }) {
  const { scene } = useGLTF("/models/deer.glb");
  const ref = useGroundWalk({
    baseY: -5.2, turnJitter: 0.06, stepAmp: 0.008, stepFreq: 2.4,
    minSpeed: 0.6, maxSpeed: 1.1, entries: [["left_to_right", 5], ["right_to_left", 5], ["diagonal", 1]],
    startAt: spawnDelay,
  });
  return (
    <group ref={ref} rotation={[Math.PI, 0, 0]} scale={0.12}
      onPointerDown={(e) => { e.stopPropagation(); onFound?.("deer"); }}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/deer.glb");

function FoxModel({ onFound, spawnDelay = 3.5 }) {
  const { scene } = useGLTF("/models/fox.glb");
  const ref = useGroundWalk({
    baseY: -5.25, turnJitter: 0.12, stepAmp: 0.010, stepFreq: 3.2,
    minSpeed: 0.9, maxSpeed: 1.6, entries: [["left_to_right", 6], ["right_to_left", 6], ["diagonal", 2]],
    startAt: spawnDelay,
  });
  return (
    <group ref={ref} rotation={[Math.PI, 0, 0]} scale={0.12}
      onPointerDown={(e) => { e.stopPropagation(); onFound?.("fox"); }}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/fox.glb");

function OwlModel({ onFound, spawnDelay = 7 }) {
  const { scene } = useGLTF("/models/owl.glb");
  const ref = useAirGlide({
    baseY: 1.2, yAmp: 0.5, yFreq: 0.7, turnJitter: 0.15, bankAmt: 0.1,
    minSpeed: 0.8, maxSpeed: 1.4, entries: [["diagonal", 3], ["left_to_right", 2], ["right_to_left", 2]],
    startAt: spawnDelay,
  });
  return (
    <group ref={ref} rotation={[Math.PI, 0, 0]} scale={0.08}
      onPointerDown={(e) => { e.stopPropagation(); onFound?.("owl"); }}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/owl.glb");

function BearModel({ onFound, spawnDelay = 10.5 }) {
  const { scene } = useGLTF("/models/bear.glb");
  const ref = useGroundWalk({
    baseY: -5.30, turnJitter: 0.05, stepAmp: 0.006, stepFreq: 2.0,
    minSpeed: 0.4, maxSpeed: 0.8, entries: [["left_to_right", 3], ["right_to_left", 3]],
    startAt: spawnDelay,
  });
  return (
    <group ref={ref} rotation={[Math.PI, 0, 0]} scale={0.16}
      onPointerDown={(e) => { e.stopPropagation(); onFound?.("bear"); }}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/bear.glb");

/** Simple “pollution” visual for forest (haze + falling leaves density) */
function PollutionHaze({ level = 0 }) {
  if (level <= 0) return null;
  const alpha = Math.min(0.35, level * 0.1);
  return <div className="pointer-events-none fixed inset-0 z-[55]" style={{ backgroundColor: `rgba(50,40,30,${alpha})` }} />;
}

/** Page */
export default function TemperateImmersive() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio("/audio/forest_ambience.mp3");
    audio.loop = true;
    audio.volume = 0.4;
    if (!muted) audio.play().catch(() => {});
    else audio.pause();
    return () => audio.pause();
  }, [muted]);

  // Mini-game
  const [miniActive, setMiniActive] = useState(false);
  const [targets, setTargets] = useState([
    { id: "deer", label: "Deer", state: "hidden" },
    { id: "fox", label: "Fox", state: "hidden" },
    { id: "owl", label: "Owl", state: "hidden" },
    { id: "bear", label: "Black Bear", state: "hidden" },
  ]);
  const [startTime, setStartTime] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);

  // Challenge
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeStep, setChallengeStep] = useState(0);
  const [pollutionLevel, setPollutionLevel] = useState(POLLUTION_BASE);
  const [challengeOutcome, setChallengeOutcome] = useState(null);

  // Toast + quiz
  const [toast, setToast] = useState({ open: false, title: "", status: "", blurb: "", link: "" });
  const [quiz, setQuiz] = useState({ open: false, id: null, question: "", options: [], correct: "" });
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setMiniActive(false);
    setTargets((t) => t.map(x => ({ ...x, state: "hidden" })));
    setStartTime(null);
    setFinishedAt(null);
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  function showInfo(id) {
    const s = SPECIES_INFO[id];
    if (!s) return;
    setToast({ open: true, ...s });
    clearTimeout(showInfo._t);
    showInfo._t = setTimeout(() => setToast(t => ({ ...t, open: false })), 6000);
  }

  // Mini-game controls
  function startMiniGame() {
    setTargets((t) => t.map((x) => ({ ...x, state: "hidden" })));
    setStartTime(Date.now());
    setFinishedAt(null);
    setPoints(0);
    setMiniActive(true);
  }
  function resetMiniGame() {
    setTargets((t) => t.map((x) => ({ ...x, state: "hidden" })));
    setStartTime(Date.now());
    setFinishedAt(null);
    setPoints(0);
    setMiniActive(true);
  }
  function stopMiniGame() { setMiniActive(false); }

  // Challenge controls
  function startChallenge() {
    setMiniActive(false);
    setChallengeActive(true);
    setChallengeStep(0);
    setPollutionLevel(POLLUTION_BASE);
    setChallengeOutcome(null);
  }
  function exitChallenge() { setChallengeActive(false); setChallengeOutcome(null); }
  function resetChallenge() { setChallengeStep(0); setPollutionLevel(POLLUTION_BASE); setChallengeOutcome(null); }
  function chooseOption(opt) {
    setPollutionLevel(prev => {
      const next = prev + opt.impact;
      if (challengeStep + 1 >= CHALLENGE_STEPS.length) {
        const outcome = next <= POLLUTION_WIN ? "win" : "fail";
        setChallengeOutcome(outcome);
      } else {
        setChallengeStep(s => s + 1);
      }
      return next;
    });
  }

  // report clicks
  function reportFound(id) {
    showInfo(id);
    if (miniActive) {
      const q = QUIZ_BANK[id];
      if (q) setQuiz({ open: true, id, question: q.q, options: q.opts, correct: q.correct });
      setTargets(prev => {
        const next = prev.map(t => (t.id === id ? { ...t, state: "found" } : t));
        const all = next.every(t => t.state === "found");
        if (all && !finishedAt) setFinishedAt(Date.now());
        return next;
      });
    }
  }
  function answerQuiz(opt) {
    if (opt === quiz.correct) setPoints(p => p + 1);
    setQuiz({ open: false, id: null, question: "", options: [], correct: "" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/15 ring-1 ring-emerald-400/30">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="text-emerald-300">
              <circle cx="12" cy="12" r="9" fill="currentColor" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Wild Realms</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMuted(m => !m)}
            className="rounded-full px-3 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10"
          >
            {muted ? "Unmute 🔈" : "Mute 🔇"}
          </button>

          {miniActive ? (
            <>
              <button onClick={stopMiniGame} className="rounded-full bg-sky-300/20 px-4 py-2 text-sm font-semibold ring-1 ring-sky-300/40 hover:bg-sky-300/30">
                Exit Mini-Game
              </button>
              <button onClick={resetMiniGame} className="rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/15">
                Reset
              </button>
              <button onClick={startChallenge} className="rounded-full bg-amber-300 text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-amber-200">
                Challenge Mode
              </button>
            </>
          ) : challengeActive ? (
            <>
              <button onClick={exitChallenge} className="rounded-full bg-amber-300/20 px-4 py-2 text-sm font-semibold ring-1 ring-amber-300/40 hover:bg-amber-300/30">
                Exit Challenge
              </button>
              <button onClick={resetChallenge} className="rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/15">
                Reset
              </button>
            </>
          ) : (
            <>
              <button onClick={startMiniGame} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-300">
                Start Mini-Game
              </button>
              <button onClick={startChallenge} className="rounded-full bg-amber-300 text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-amber-200">
                Challenge Mode
              </button>
            </>
          )}
          <Link to="/biomes" className="rounded-full px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">Back to Biomes</Link>
        </div>
      </header>

      {/* Canvas */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-10">
        <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl" style={{ height: 'min(88vh, 1000px)' }}>
          <Canvas
            camera={{ position: [0, 2.2, 10], fov: 55 }}
            gl={{ antialias: true, alpha: false }}
            onCreated={({ scene }) => {
              scene.background = new THREE.Color(FOREST);
              // If fog is making the scene too hazy, you can disable it or make it lighter.
              // Option A: disable completely
              // scene.fog = null;
              // Option B: keep very light fog (softens distance but doesn't obscure close objects)
              scene.fog = new THREE.Fog(FOREST, 12, 260);
            }}
          >
            <Suspense fallback={null}>
              <SceneLighting />
              <Environment preset="forest" />

              <Ground />

              {/* Dense grass field (auto-sways) */}
              <GrassScatterGLB count={isMobile ? 280 : 450} spread={120} />

              {/* Edge treeline and extra clusters */}
              <TreeRingGLB count={28} radius={85} />
              <TreeClusterGLB x={-60} z={-40} count={7} radius={7} />
              <TreeClusterGLB x={70} z={30} count={6} radius={6} />

              {/* Fallen logs */}
              <Log x={-6} z={-2} len={7} />
              <Log x={8} z={4} len={5} />

              {/* Scattered rocks and small fungi for detail */}
              <RockScatterGLB count={12} spread={120} />
              <MushroomScatterGLB count={20} spread={80} />

              {/* Air dust motes for atmosphere */}
              <DustMotes count={isMobile ? 25 : 60} />

              {/* Animals */}
              <DeerModel onFound={reportFound} />
              <FoxModel onFound={reportFound} />
              <OwlModel onFound={reportFound} />
              <BearModel onFound={reportFound} />

              <OrbitControls enablePan={false} minDistance={5} maxDistance={22} maxPolarAngle={Math.PI * 0.62} />
            </Suspense>
          </Canvas>


          {/* Pollution haze overlay during challenge */}
          {challengeActive && <div className="absolute inset-0"><PollutionHaze level={pollutionLevel} /></div>}
        </div>
      </main>

      {/* Mini-quiz modal */}
      {quiz.open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-6" role="dialog" aria-modal="true">
          <div className="max-w-sm w-full rounded-2xl bg-slate-900 ring-1 ring-white/10 p-5">
            <h3 className="text-lg font-semibold mb-2">Quick Check</h3>
            <p className="text-white/85 mb-4">{quiz.question}</p>
            <div className="grid gap-2">
              {quiz.options.map((opt) => (
                <button key={opt} onClick={() => answerQuiz(opt)} className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-left">
                  {opt}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-white/70">
              <span>Score: {points} pts</span>
              <button className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10" onClick={() => setQuiz({ open: false, id: null, question: "", options: [], correct: "" })}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini-game HUD */}
      {miniActive && (
        <MiniGameOverlay
          open={true}
          targets={targets}
          startTime={startTime}
          finishedAt={finishedAt}
          onClose={() => setMiniActive(false)}
          onReset={resetMiniGame}
          points={points}
          complete={finishedAt !== null}
        />
      )}

      {/* Challenge overlay */}
      {challengeActive && (
        <div className="fixed inset-0 z-[70] pointer-events-none">
          {/* Level HUD */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
            <div className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20 text-sm">
              Impact Level: <span className={pollutionLevel >= POLLUTION_FAIL ? 'text-red-300' : pollutionLevel <= POLLUTION_WIN ? 'text-emerald-300' : 'text-yellow-300'}>{pollutionLevel}</span>
            </div>
          </div>

          {/* Step panel */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[min(680px,92vw)] pointer-events-auto">
            <div className="rounded-2xl bg-slate-900/95 ring-1 ring-white/10 p-5 shadow-2xl">
              {!challengeOutcome ? (
                <>
                  <h3 className="text-lg font-semibold">{CHALLENGE_STEPS[challengeStep].title}</h3>
                  <p className="text-white/85 mt-1">{CHALLENGE_STEPS[challengeStep].prompt}</p>
                  <div className="mt-4 grid gap-2">
                    {CHALLENGE_STEPS[challengeStep].options.map((opt, i) => (
                      <button key={i} onClick={() => chooseOption(opt)} className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-left">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                    <button onClick={resetChallenge} className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10">Reset</button>
                    <button onClick={() => setChallengeActive(false)} className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10">Exit Challenge</button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">{challengeOutcome === "win" ? "Forest Stabilized 🎉" : "Ecosystem Stressed 😞"}</h3>
                  <p className="text-white/85 mt-1">
                    {challengeOutcome === "win"
                      ? "Your actions reduced human impacts. Streams clear, understory rebounds."
                      : "Impacts remained high. Try alternative responses to protect the habitat."}
                  </p>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button onClick={resetChallenge} className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10">Try Again</button>
                    <button onClick={() => setChallengeActive(false)} className="rounded-full px-3 py-1 ring-1 ring-white/20 hover:bg-white/10">Back to Immersive</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info toast */}
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