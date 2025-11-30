import React, { useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import rainforestSpeciesData from '../data/rainforestSpecies.json';
import desertSpeciesData from '../data/desertSpecies.json';
import tundraSpeciesData from '../data/tundraSpecies.json';
import savannahSpeciesData from '../data/savannahSpecies.json';
import wetlandsSpeciesData from '../data/wetlandsSpecies.json';
import oceanSpeciesData from '../data/oceanSpecies.json';

// Configuration for all biomes
const BIOME_DATA = {
  rainforest: {
    name: "Rainforest",
    description: "Explore the world's largest tropical rainforest",
    center: { lat: -3.4653, lng: -62.2159 },
    zoom: 6,
    location: "Amazon Basin, Brazil",
    color: "text-emerald-300",
    climate: "Tropical",
    climateDesc: "Hot & humid year-round",
    biodiversity: "Very High",
    biodiversityDesc: "50% of the world's species",
    rainfall: "2000–10000mm",
    rainfallDesc: "Consistent rainfall all year",
  },
  desert: {
    name: "Desert",
    description: "Harsh but beautiful arid ecosystems with unique species.",
    center: { lat: 23.4162, lng: 25.6628 },
    zoom: 5,
    location: "Sahara Desert, Africa",
    color: "text-amber-300",
  },
  tundra: {
    name: "Tundra",
    description: "Cold, treeless plains found in polar regions.",
    center: { lat: 69.6492, lng: 18.9553 },
    zoom: 4,
    location: "Arctic Circle, Norway",
    color: "text-cyan-300",
  },
  savannah: {
    name: "Savannah",
    description: "Grasslands dotted with trees, rich in large mammals.",
    center: { lat: -2.3333, lng: 34.8333 },
    zoom: 5,
    location: "Serengeti, Tanzania",
    color: "text-yellow-300",
  },
  wetlands: {
    name: "Wetlands",
    description: "Marshes and swamps teeming with aquatic biodiversity.",
    center: { lat: 29.7648, lng: -91.6540 },
    zoom: 7,
    location: "Louisiana, USA",
    color: "text-teal-300",
  },
  ocean: {
    name: "Ocean",
    description: "The Earth's vast marine ecosystems covering 70% of the surface.",
    center: { lat: 0, lng: -160 },
    zoom: 3,
    location: "Pacific Ocean",
    color: "text-blue-300",
  },
};

const SPECIES_BY_BIOME = {
  rainforest: rainforestSpeciesData,
  desert: desertSpeciesData,
  tundra: tundraSpeciesData,
  savannah: savannahSpeciesData,
  wetlands: wetlandsSpeciesData,
  ocean: oceanSpeciesData,
};

const GOOGLE_MAPS_API_KEY = "AIzaSyB-oUdRv_4EckOv_p1FhwGUON4EpUzq8KA";

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const options = {
  mapTypeId: 'satellite',
  streetViewControl: false,
  fullscreenControl: true,
  mapTypeControl: true,
  zoomControl: true,
};

export default function BiomeMap() {
  const { biomeName } = useParams();
  const biome = BIOME_DATA[biomeName];
  const [selectedSpecies, setSelectedSpecies] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry'],
  });

  // If biome not found, show error
  if (!biome) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Biome Not Found</h1>
          <Link to="/biomes" className="text-emerald-300 hover:underline">
            Back to Biomes
          </Link>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error loading maps</h1>
          <p className="text-white/70">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading map...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Header */}
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
          <Link to="/biomes" className="rounded-full px-4 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">
            Back to Biomes
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full flex-1 px-6 py-8 flex flex-col">
        {/* Title Section */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className={biome.color}>{biome.name}</span> Ecosystem
          </h1>
          <p className="mt-2 text-lg text-white/85">{biome.description}</p>
          <p className="mt-1 text-sm text-white/60">📍 {biome.location}</p>
          <p className="mt-2 text-xs text-white/50">Note: Street View may not be available in remote rainforest areas. Navigate to nearby cities for Street View.</p>
        </div>

        {/* Google Map Container */}
        <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl" style={{ height: "600px", width: "100%" }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={biome.center}
            zoom={biome.zoom}
            options={options}
          >
            {/* Render species markers with custom icons */}
            {rainforestSpeciesData.species.map((species) => (
              <Marker
                key={species.id}
                position={species.position}
                onClick={() => setSelectedSpecies(species)}
                title={species.name}
                icon={{
                  url: species.imageUrl,
                  scaledSize: { width: 60, height: 60 },
                  anchor: { x: 30, y: 30 },
                }}
              />
            ))}

            {/* Info window for selected species */}
            {selectedSpecies && (
              <InfoWindow
                position={selectedSpecies.position}
                onCloseClick={() => setSelectedSpecies(null)}
              >
                <div style={{ maxWidth: '300px' }}>
                  <img 
                    src={selectedSpecies.imageUrl} 
                    alt={selectedSpecies.name}
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                  />
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1f2937' }}>
                    {selectedSpecies.name}
                  </h3>
                  <p style={{ fontSize: '12px', fontStyle: 'italic', margin: '0 0 8px 0', color: '#6b7280' }}>
                    {selectedSpecies.scientificName}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 8px 0', color: selectedSpecies.status.includes('Endangered') ? '#dc2626' : selectedSpecies.status.includes('Threatened') ? '#f59e0b' : '#10b981' }}>
                    Status: {selectedSpecies.status}
                  </p>
                  <p style={{ fontSize: '13px', margin: '0 0 8px 0', color: '#374151' }}>
                    {selectedSpecies.description}
                  </p>
                  <div style={{ fontSize: '12px', color: '#4b5563' }}>
                    <p style={{ margin: '4px 0' }}><strong>Diet:</strong> {selectedSpecies.diet}</p>
                    <p style={{ margin: '4px 0' }}><strong>Habitat:</strong> {selectedSpecies.habitat}</p>
                    <p style={{ margin: '4px 0' }}><strong>Population:</strong> {selectedSpecies.population}</p>
                  </div>
                  <Link
                    to={`/biome/${biomeName}/species/${selectedSpecies.id}/scenarios`}
                    state={{ species: selectedSpecies }}
                    style={{
                      display: 'block',
                      marginTop: '12px',
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    View Scenarios →
                  </Link>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto mx-auto flex w-full max-w-7xl items-center justify-between px-6 pb-10 pt-6 text-sm text-white/75">
        <div>© {new Date().getFullYear()} Wild Realms • Built for learning & analysis</div>
        <div className="flex gap-4">
          <a className="hover:text-white" href="#privacy">Privacy</a>
          <a className="hover:text-white" href="#terms">Terms</a>
          <Link className="hover:text-white" to="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
}