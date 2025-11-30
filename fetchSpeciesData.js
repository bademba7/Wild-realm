// Script to fetch species data from iNaturalist API for each biome
// Run this with: node fetchSpeciesData.js

import fs from 'fs';
import https from 'https';

console.log('Starting iNaturalist species data fetch...');
console.log('This will take a few minutes.\n');

// Define geographic bounds for each biome
const BIOME_CONFIGS = {
  rainforest: {
    name: "Rainforest",
    bounds: { swlat: -10, swlng: -75, nelat: 5, nelng: -50 },
    center: { lat: -3.4653, lng: -62.2159 },
    zoom: 10,
    taxa: ['Mammalia', 'Aves', 'Reptilia', 'Amphibia']
  },
  savannah: {
    name: "Savannah",
    bounds: { swlat: -5, swlng: 30, nelat: 5, nelng: 40 },
    center: { lat: -2.1540, lng: 34.6857 },
    zoom: 10,
    taxa: ['Mammalia', 'Aves']
  },
  tundra: {
    name: "Tundra",
    bounds: { swlat: 65, swlng: -140, nelat: 75, nelng: -100 },
    center: { lat: 68.3587, lng: -133.7469 },
    zoom: 8,
    taxa: ['Mammalia', 'Aves']
  },
  desert: {
    name: "Desert",
    bounds: { swlat: 20, swlng: -10, nelat: 35, nelng: 15 },
    center: { lat: 31.0522, lng: -7.9898 },
    zoom: 9,
    taxa: ['Mammalia', 'Reptilia']
  },
  wetlands: {
    name: "Wetlands",
    bounds: { swlat: 25, swlng: -81.5, nelat: 26.5, nelng: -80 },
    center: { lat: 25.8584, lng: -80.8773 },
    zoom: 10,
    taxa: ['Aves', 'Reptilia']
  },
  ocean: {
    name: "Ocean",
    bounds: { swlat: -10, swlng: 110, nelat: 5, nelng: 125 },
    center: { lat: -8.7832, lng: 115.1668 },
    zoom: 9,
    taxa: ['Actinopterygii']
  }
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function fetchBiomeSpecies(biomeKey, config) {
  console.log(`Fetching ${config.name}...`);
  const allSpecies = [];
  
  for (const taxon of config.taxa) {
    const url = `https://api.inaturalist.org/v1/observations/species_counts?` +
      `swlat=${config.bounds.swlat}&swlng=${config.bounds.swlng}` +
      `&nelat=${config.bounds.nelat}&nelng=${config.bounds.nelng}` +
      `&iconic_taxa=${taxon}&quality_grade=research&per_page=8`;
    
    try {
      const response = await httpsGet(url);
      
      if (response.results) {
        for (const result of response.results) {
          const t = result.taxon;
          if (t.default_photo) {
            allSpecies.push({
              id: t.id,
              name: t.preferred_common_name || t.name,
              scientificName: t.name,
              imageUrl: t.default_photo.large_url || t.default_photo.medium_url,
              status: t.conservation_status?.status_name || 'Least Concern',
              count: result.count
            });
          }
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }
  
  const topSpecies = allSpecies.sort((a, b) => b.count - a.count).slice(0, 15);
  
  const species = topSpecies.map((sp, i) => {
    const latRange = config.bounds.nelat - config.bounds.swlat;
    const lngRange = config.bounds.nelng - config.bounds.swlng;
    const lat = config.bounds.swlat + (Math.random() * latRange);
    const lng = config.bounds.swlng + (Math.random() * lngRange);
    
    return {
      id: sp.id,
      name: sp.name,
      scientificName: sp.scientificName,
      position: { lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) },
      imageUrl: sp.imageUrl,
      status: sp.status,
      population: `${sp.count} observations on iNaturalist`,
      description: `A species found in the ${config.name.toLowerCase()}.`,
      diet: "See iNaturalist for details",
      habitat: config.name,
      threats: "Habitat loss, climate change"
    };
  });
  
  console.log(`  Found ${species.length} species\n`);
  
  return { biome: config.name, center: config.center, zoom: config.zoom, species };
}

async function fetchAllBiomes() {
  for (const [key, config] of Object.entries(BIOME_CONFIGS)) {
    try {
      const data = await fetchBiomeSpecies(key, config);
      const filename = `src/data/${key}Species.json`;
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log(`✓ Saved ${filename}`);
    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
    }
  }
  console.log('\n✓ Done!');
}

fetchAllBiomes().catch(console.error);