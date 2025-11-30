import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/welcome.jsx";
import BiomeSelection from "./pages/BiomeSelection.jsx";
import BiomeMap from "./pages/BiomeMap.jsx";
import SpeciesScenarios from "./pages/SpeciesScenarios.jsx";
import OceanImmersive from "./pages/OceanImmersive.jsx";
import TemperateImmersive from "./pages/TemperateImmersive.jsx";

function Methods() {
  return (
    <main className="min-h-screen grid place-items-center">
      Methods (data provenance)
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/biomes" element={<BiomeSelection />} />
        <Route path="/biome/:biomeName" element={<BiomeMap />} />
        <Route path="/biome/:biomeName/species/:speciesId/scenarios" element={<SpeciesScenarios />} />
        <Route path="/methods" element={<Methods />} />
        <Route path="/ocean-immersive" element={<OceanImmersive />} />
        <Route path="/temperate-immersive" element={<TemperateImmersive />} />
      </Routes>
    </BrowserRouter>
  );
}