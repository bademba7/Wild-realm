# 🌍 Wild Realms — Immersive Ecosystem Experience

Wild Realms is an interactive 3D educational project built with **React**, **Three.js**, and **React-Three-Fiber**.  
The goal is to let users explore different biomes, learn about species, play mini-games, and understand environmental challenges.

---

## 🚀 Features

### 🐠 Immersive Biomes
- Ocean Biome (3D marine life, movement, underwater ambience)
- Temperate Forest Biome (animals, trees, grass, fog, realistic ambience)
- Fully dynamic spawning + animations

### 🎮 Mini-Game
- Players search for specific species
- When clicked, animals show:
  - Fun facts
  - Conservation status
  - A mini-quiz for learning
- Completion time + score tracking

### ⚠️ Challenge Mode
- Scenario-based environmental threats
- Users choose responses
- Pollution / impact level changes
- Dynamic "win" or "ecosystem stressed" result

---

## 🛠️ Tech Stack

- **React + Vite**
- **React Three Fiber** (3D rendering)
- **Three.js**
- **Drei** (GLTF loader, environment presets, orbit controls)
- **TailwindCSS**
- **GLB Models** for animals, plants, and world assets
- **Custom movement physics** for ground animals and flying species
- **Audio ambience** per biome

---

## 📚 How It Works (Step-by-Step)

### 1️⃣ **Biome Selection**
User chooses a biome (Ocean, Forest).

### 2️⃣ **Immersive 3D View**
Canvas loads:
- Background color
- Fog
- Trees / coral / rocks
- Grass or water ambience
- Animal models spawn with natural movement

### 3️⃣ **Interactions**
Clicking on an animal opens:
- Info card (species name, status, facts)
- Mini-quiz question

### 4️⃣ **Mini-Game**
- Start button activates target tracking
- Find all required animals
- Get a completion message + points

### 5️⃣ **Challenge Mode**
- Player is given a real-world environmental problem
- Must pick the correct solution
- Pollution level goes up/down
- Win or fail screen appears

---

## 🎥 Demo Video

_A full project walkthrough video is included in this repository._

## 🎥 Project Demo Video

[![Watch the video](https://img.youtube.com/vi/ABC123XYZ/hqdefault.jpg)]https://youtu.be/dGtDJbhKGV8

---

## 📦 Installation

```bash
git clone https://github.com/bademba7/Wild-realm.git
cd Wild-realm
npm install
npm run dev
🧑‍💻 Contributors
	•	Abdoulaye Bademba Diallo
	•	CS 440 Group 4 – Fall 2025
