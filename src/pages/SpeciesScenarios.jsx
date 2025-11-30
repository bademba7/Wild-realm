import React, { useState } from 'react';
import { Link, useParams, useLocation } from "react-router-dom";

export default function SpeciesScenarios() {
  const { biomeName } = useParams();
  const location = useLocation();
  const species = location.state?.species;

  const [populationPercentage, setPopulationPercentage] = useState(100);
  const [scenarioHistory, setScenarioHistory] = useState([]);

  const scenarios = [
    {
      id: 'poaching',
      name: 'Poaching',
      description: 'Illegal hunting reduces population',
      effect: -15,
      color: 'bg-red-500'
    },
    {
      id: 'habitat-loss',
      name: 'Habitat Loss',
      description: 'Deforestation and land conversion',
      effect: -20,
      color: 'bg-orange-500'
    },
    {
      id: 'climate-change',
      name: 'Climate Change',
      description: 'Altered weather patterns affect food sources',
      effect: -10,
      color: 'bg-yellow-500'
    },
    {
      id: 'conservation',
      name: 'Conservation Efforts',
      description: 'Protected areas and anti-poaching patrols',
      effect: +25,
      color: 'bg-green-500'
    },
    {
      id: 'breeding-program',
      name: 'Breeding Program',
      description: 'Captive breeding and reintroduction',
      effect: +15,
      color: 'bg-blue-500'
    },
    {
      id: 'disease',
      name: 'Disease Outbreak',
      description: 'Infectious disease spreads through population',
      effect: -25,
      color: 'bg-purple-500'
    }
  ];

  const applyScenario = (scenario) => {
    const newPopulation = Math.max(0, Math.min(100, populationPercentage + scenario.effect));
    setPopulationPercentage(newPopulation);
    
    setScenarioHistory([
      {
        scenario: scenario.name,
        effect: scenario.effect,
        timestamp: new Date().toLocaleTimeString()
      },
      ...scenarioHistory
    ]);
  };

  const resetSimulation = () => {
    setPopulationPercentage(100);
    setScenarioHistory([]);
  };

  if (!species) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Species Not Found</h1>
          <Link to={`/biome/${biomeName}`} className="text-emerald-300 hover:underline">
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/15 ring-1 ring-emerald-400/30">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="text-emerald-300">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2m0 2c1.7 0 3.25.53 4.53 1.43C15.37 6.18 13.78 7 12 7S8.63 6.18 7.47 5.43A7.98 7.98 0 0 1 12 4m-7.46 6c.15-1.08.53-2.09 1.1-2.98C7.04 7.79 9.35 9 12 9s4.96-1.21 6.36-1.98c.57.89.95 1.9 1.1 2.98C17.89 10.65 15.09 11 12 11s-5.89-.35-7.46-1m0 4c1.57.65 4.37 1 7.46 1s5.89-.35 7.46-1a8.03 8.03 0 0 1-1.1 2.98C16.96 16.21 14.65 15 12 15s-4.96 1.21-6.36 1.98A8.03 8.03 0 0 1 4.54 14M12 20c-1.7 0-3.25-.53-4.53-1.43C8.63 17.82 10.22 17 12 17s3.37.82 4.53 1.57A7.98 7.98 0 0 1 12 20Z"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Wild Realms</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to={`/biome/${biomeName}`} className="rounded-full px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">
            Back to Map
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <img
            src={species.imageUrl}
            alt={species.name}
            className="w-full md:w-64 h-48 object-cover rounded-2xl ring-1 ring-white/10"
          />
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-emerald-300">
              {species.name}
            </h1>
            <p className="text-xl text-white/70 italic mt-2">{species.scientificName}</p>
            <p className="mt-4 text-white/85">{species.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                Status: {species.status}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                {species.habitat}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/10 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold">Population Health</h2>
            <span className="text-3xl font-bold text-emerald-300">{populationPercentage}%</span>
          </div>
          <div className="h-8 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                populationPercentage > 70 ? 'bg-green-500' :
                populationPercentage > 40 ? 'bg-yellow-500' :
                populationPercentage > 20 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${populationPercentage}%` }}
            />
          </div>
          <p className="text-sm text-white/60 mt-2">
            {populationPercentage === 0 ? 'Population extinct' :
             populationPercentage < 20 ? 'Critical - Immediate intervention needed' :
             populationPercentage < 40 ? 'Endangered - Population declining' :
             populationPercentage < 70 ? 'Vulnerable - Monitor closely' :
             'Stable - Population thriving'}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Scenarios</h2>
            <button
              onClick={resetSimulation}
              className="rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-white/15 hover:bg-white/15"
            >
              Reset Simulation
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => applyScenario(scenario)}
                disabled={populationPercentage === 0}
                className="group relative rounded-xl bg-white/[0.06] p-5 ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/[0.08] text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold">{scenario.name}</h3>
                  <span className={`rounded-full ${scenario.color} px-3 py-1 text-sm font-bold text-white`}>
                    {scenario.effect > 0 ? '+' : ''}{scenario.effect}%
                  </span>
                </div>
                <p className="text-sm text-white/70">{scenario.description}</p>
              </button>
            ))}
          </div>
        </div>

        {scenarioHistory.length > 0 && (
          <div className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/10">
            <h2 className="text-2xl font-bold mb-4">Simulation History</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scenarioHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm py-2 border-b border-white/10">
                  <span className="text-white/85">{entry.scenario}</span>
                  <div className="flex items-center gap-3">
                    <span className={entry.effect > 0 ? 'text-green-400' : 'text-red-400'}>
                      {entry.effect > 0 ? '+' : ''}{entry.effect}%
                    </span>
                    <span className="text-white/50 text-xs">{entry.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}