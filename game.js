// ===========================================================
// MINER'S HAVEN - GAME SIMULATION ENGINE & RENDERER (V2 OVERHAUL)
// ===========================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ===========================================================
// STATE SCHEMA & ARCHITECTURE
// ===========================================================

const STATE = {
  config: {
    grid: { cols: 24, rows: 24, cellSize: 64 },
    maxOres: 300,
    beltAcceleration: 3,
    groundFriction: 2.5,
    oreGroundLifespan: 3,

    prestigeThresholdLifetime: 1e10, // $10 Billion
    prestigeKeyLogBase: 10,
    inventoryBaseCapacity: 40,

    crateDuplicateShardValue: {
      regular: 1,
      golden: 4,
      exotic: 15,
      prestige: 50
    }
  },

  run: {
    money: 1000,
    lifetimeEarnings: 0,
    buildings: [],
    ores: [],
    timeScale: 1.0,
    isPaused: false
  },

  shop: {
    stock: {},
    dynamicPriceLevel: {}
  },

  inventory: {
    capacity: 40,
    items: {
      extractor: { qty: 2, permanent: false, source: 'starter' },
      belt: { qty: 10, permanent: false, source: 'starter' },
      upgrader1x1: { qty: 1, permanent: false, source: 'starter' },
      seller: { qty: 1, permanent: false, source: 'starter' }
    },
    permanentItems: {},
    consumables: {}
  },

  meta: {
    prestigePoints: 0,
    prestigeKeys: 0,
    blueprintUnlocks: {
      extractor: true,
      belt: true,
      fastBelt: true,
      halfBelt: true,
      upgrader1x1: true,
      upgraderHalf: true,
      seller: true,
      coalExtractor: true
    },
    relics: {},
    shards: 0,
    prestigeDust: 0,
    collection: {}
  },

  defs: {
    itemDefs: {
      ore: { id: 'ore', name: 'Standard Ore', color: '#ffb03b', size: 14, baseValue: 5, shape: 'circle' },
      megaOre: { id: 'megaOre', name: 'Mega Ore', color: '#ff4757', size: 22, baseValue: 25, shape: 'diamond' },
      magmaOre: { id: 'magmaOre', name: 'Magma Ore', color: '#ff4757', size: 18, baseValue: 50, shape: 'diamond', defaultStatus: { flaming: true } },
      uraniumOre: { id: 'uraniumOre', name: 'Uranium Ore', color: '#2ecc71', size: 16, baseValue: 150, shape: 'circle', defaultStatus: { radioactive: true } },
      coalOre: { id: 'coalOre', name: 'Coal Fuel Ore', color: '#334155', size: 16, baseValue: 15, shape: 'square', isFuel: true },
      superDiamondOre: { id: 'superDiamondOre', name: 'Super Diamond Ore', color: '#38bdf8', size: 24, baseValue: 300, shape: 'diamond', defaultStatus: { sparkling: true } },
      
      // New Ore Types
      crystalOre: { id: 'crystalOre', name: 'Crystal Ore', color: '#a855f7', size: 16, baseValue: 200, shape: 'diamond', defaultStatus: { sparkling: true, crystalline: true } },
      antimatterPellet: { id: 'antimatterPellet', name: 'Antimatter Pellet', color: '#ec4899', size: 20, baseValue: 1500, shape: 'diamond' },
      timeCrystalOre: { id: 'timeCrystalOre', name: 'Time Crystal Ore', color: '#06b6d4', size: 18, baseValue: 800, shape: 'diamond', defaultStatus: { timeAged: true } },
      glowAlgaeOre: { id: 'glowAlgaeOre', name: 'Glow Algae Ore', color: '#10b981', size: 14, baseValue: 120, shape: 'circle', defaultStatus: { wet: 10 } },
      voidShardOre: { id: 'voidShardOre', name: 'Void Shard Ore', color: '#312e81', size: 22, baseValue: 12000, shape: 'diamond', defaultStatus: { nullified: true } }
    },

    buildingDefs: {
      // --- CORE EXTRACTORS ---
      extractor: {
        id: 'extractor', name: 'Standard Extractor', category: 'extractor', rarity: 'common', cost: 100, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 3, h: 1 }, layer: 'machine', color: '#3d6a8f', speed: 40,
        tags: ['dropper', 'starter'], attributes: { spawnRateMs: 1000 },
        ports: [{ dx: 3, dy: 0, kind: 'output', color: '#ffcf5c', dropSide: null }],
        produces: { item: 'ore', rate: 1000 }
      },
      coalExtractor: {
        id: 'coalExtractor', name: 'Coal Mine (Fuel)', category: 'extractor', rarity: 'common', cost: 450, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 3, h: 1 }, layer: 'machine', color: '#1e293b', speed: 40,
        tags: ['dropper', 'fuel_provider'], attributes: { fuelType: 'coal' },
        ports: [{ dx: 3, dy: 0, kind: 'output', color: '#475569', dropSide: null }],
        produces: { item: 'coalOre', rate: 1200 }
      },
      megaExtractor: {
        id: 'megaExtractor', name: '2x2 Mega Extractor', category: 'extractor', rarity: 'rare', cost: 4500, priceGrowth: 1.12,
        unlockMethod: 'shop', size: { w: 2, h: 2 }, layer: 'machine', color: '#2b7873', speed: 40,
        tags: ['dropper', 'heavy_machinery'], attributes: { spawnRateMs: 1500 },
        ports: [{ dx: 2, dy: 0.5, kind: 'output', color: '#ff4757', dropSide: null }],
        produces: { item: 'megaOre', rate: 1500 }
      },
      volcanoDropper: {
        id: 'volcanoDropper', name: 'Volcano Mine', category: 'extractor', rarity: 'epic', cost: 18000, priceGrowth: 1.13,
        unlockMethod: 'shop', size: { w: 3, h: 1 }, layer: 'machine', color: '#881337', speed: 40,
        tags: ['dropper', 'flaming'], attributes: { temperature: 1200 },
        ports: [{ dx: 3, dy: 0, kind: 'output', color: '#ff4757', dropSide: null }],
        produces: { item: 'magmaOre', rate: 1200 }
      },
      thermalExtractor: {
        id: 'thermalExtractor', name: 'Fueled Thermal Mine', category: 'extractor', rarity: 'epic', cost: 85000, priceGrowth: 1.14,
        unlockMethod: 'shop', size: { w: 3, h: 2 }, layer: 'machine', color: '#c2410c', speed: 40,
        tags: ['dropper', 'fuel_consuming'], attributes: { fuelRequired: 'coal', runDurationSec: 8 },
        requiresFuel: true,
        ports: [
          { dx: 0, dy: 0.5, kind: 'input', color: '#334155', dropSide: null },
          { dx: 3, dy: 0.5, kind: 'output', color: '#38bdf8', dropSide: null }
        ],
        produces: { item: 'superDiamondOre', rate: 800 }
      },
      uraniumMine: {
        id: 'uraniumMine', name: 'Uranium Centrifuge', category: 'extractor', rarity: 'exotic', cost: 350000, priceGrowth: 1.15,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 2, h: 2 }, layer: 'machine', color: '#14532d', speed: 40,
        tags: ['dropper', 'radioactive'], attributes: { radiationSv: 50 },
        ports: [{ dx: 2, dy: 0.5, kind: 'output', color: '#2ecc71', dropSide: null }],
        produces: { item: 'uraniumOre', rate: 1600 }
      },

      // --- NEW EXTRACTORS ---
      geodeDriller: {
        id: 'geodeDriller', name: 'Crystal Geode Driller', category: 'extractor', rarity: 'rare', cost: 9000, priceGrowth: 1.12,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 3, h: 2 }, layer: 'machine', color: '#a855f7', speed: 40,
        tags: ['dropper', 'crystal'], attributes: {},
        ports: [{ dx: 3, dy: 0.5, kind: 'output', color: '#c084fc', dropSide: null }],
        produces: { item: 'crystalOre', rate: 1100 }
      },
      antimatterSiphon: {
        id: 'antimatterSiphon', name: 'Antimatter Siphon', category: 'extractor', rarity: 'legendary', cost: 2500000, priceGrowth: 1.15,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 2, h: 2 }, layer: 'machine', color: '#ec4899', speed: 40,
        tags: ['dropper', 'antimatter'], attributes: {},
        ports: [{ dx: 2, dy: 0.5, kind: 'output', color: '#f472b6', dropSide: null }],
        produces: { item: 'antimatterPellet', rate: 1400 }
      },
      temporalFluxBorer: {
        id: 'temporalFluxBorer', name: 'Temporal Flux Borer', category: 'extractor', rarity: 'exotic', cost: 1400000, priceGrowth: 1.14,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 3, h: 3 }, layer: 'machine', color: '#06b6d4', speed: 40,
        tags: ['dropper', 'temporal'], attributes: {},
        ports: [{ dx: 3, dy: 1, kind: 'output', color: '#67e8f9', dropSide: null }],
        produces: { item: 'timeCrystalOre', rate: 1000 }
      },
      algaeVat: {
        id: 'algaeVat', name: 'Bioluminescent Algae Vat', category: 'extractor', rarity: 'epic', cost: 65000, priceGrowth: 1.13,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 2, h: 1 }, layer: 'machine', color: '#10b981', speed: 40,
        tags: ['dropper', 'algae'], attributes: {},
        ports: [{ dx: 2, dy: 0, kind: 'output', color: '#34d399', dropSide: null }],
        produces: { item: 'glowAlgaeOre', rate: 900 }
      },
      voidHarvester: {
        id: 'voidHarvester', name: 'Void Fragment Harvester', category: 'extractor', rarity: 'mythic', cost: 25000000, priceGrowth: 1.16,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 4, h: 2 }, layer: 'machine', color: '#312e81', speed: 40,
        tags: ['dropper', 'void'], attributes: {},
        ports: [{ dx: 4, dy: 0.5, kind: 'output', color: '#818cf8', dropSide: null }],
        produces: { item: 'voidShardOre', rate: 1600 }
      },

      // --- CORE CONVEYORS & LOGISTICS ---
      belt: {
        id: 'belt', name: 'Conveyor Belt', category: 'belt', rarity: 'common', cost: 15, priceGrowth: 1.08,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#4b4f58', speed: 90,
        tags: ['transport'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#ffcf5c', dropSide: 0 }]
      },
      halfBelt: {
        id: 'halfBelt', name: 'Half-Width Belt', category: 'belt', rarity: 'uncommon', cost: 35, priceGrowth: 1.09,
        unlockMethod: 'shop', size: { w: 0.5, h: 1 }, layer: 'belt', color: '#334155', isHalfBelt: true, speed: 90,
        tags: ['transport', 'narrow'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#94a3b8', dropSide: 0 }]
      },
      fastBelt: {
        id: 'fastBelt', name: 'Fast Conveyor', category: 'belt', rarity: 'uncommon', cost: 120, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#3a7ca5', speed: 180,
        tags: ['transport'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#7fd0ff', dropSide: 0 }]
      },
      splitter: {
        id: 'splitter', name: 'Belt Splitter', category: 'belt', rarity: 'rare', cost: 1100, priceGrowth: 1.11,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#e67e22', isSplitter: true, speed: 100,
        tags: ['routing'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#f39c12', dropSide: 0 }]
      },
      merger: {
        id: 'merger', name: 'Belt Merger', category: 'belt', rarity: 'rare', cost: 1100, priceGrowth: 1.11,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#27ae60', isMerger: true, speed: 100,
        tags: ['routing'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#2ecc71', dropSide: 0 }]
      },
      ultraBelt: {
        id: 'ultraBelt', name: 'Ultra Conveyor', category: 'belt', rarity: 'epic', cost: 8000, priceGrowth: 1.12,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#d97706', speed: 320,
        tags: ['transport'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#fbbf24', dropSide: 0 }]
      },

      // --- NEW LOGISTICS MACHINES ---
      magLevRail: {
        id: 'magLevRail', name: 'Magnetic Levitation Rail', category: 'belt', rarity: 'epic', cost: 30000, priceGrowth: 1.12,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#6366f1', speed: 450,
        tags: ['transport', 'maglev'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#818cf8', dropSide: 0 }]
      },
      phaseShiftBelt: {
        id: 'phaseShiftBelt', name: 'Phase-Shift Conveyor', category: 'belt', rarity: 'exotic', cost: 220000, priceGrowth: 1.13,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#8b5cf6', speed: 250,
        tags: ['transport', 'intangible'], attributes: {}, passesThrough: true,
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#c084fc', dropSide: 0 }]
      },
      gravityInverter: {
        id: 'gravityInverter', name: 'Gravity Inverter Belt', category: 'belt', rarity: 'rare', cost: 4500, priceGrowth: 1.11,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#e11d48', speed: 120,
        tags: ['transport', 'gravity'], attributes: {}, gravityInvert: true,
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#fb7185', dropSide: 0 }]
      },
      cryoStorageBelt: {
        id: 'cryoStorageBelt', name: 'Cryo-Storage Conveyor', category: 'belt', rarity: 'rare', cost: 7500, priceGrowth: 1.11,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#0284c7', speed: 40,
        tags: ['transport', 'freeze'], attributes: {}, freezesOres: true,
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#38bdf8', dropSide: 0 }]
      },
      quantumLink: {
        id: 'quantumLink', name: 'Quantum Entanglement Link', category: 'belt', rarity: 'legendary', cost: 1800000, priceGrowth: 1.14,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#d946ef', speed: 200,
        tags: ['transport', 'teleport'], attributes: {}, isTeleporter: true,
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#f0abfc', dropSide: 0 }]
      },

      // --- CORE UPGRADERS ---
      upgrader1x1: {
        id: 'upgrader1x1', name: '1x1 Upgrader', category: 'upgrader', rarity: 'common', cost: 300, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#d35400', multiplier: 2.0, energyCost: 10, speed: 90,
        tags: ['multiplier'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#e67e22', dropSide: 0 }]
      },
      upgraderHalf: {
        id: 'upgraderHalf', name: 'Half Upgrader', category: 'upgrader', rarity: 'uncommon', cost: 550, priceGrowth: 1.11,
        unlockMethod: 'shop', size: { w: 0.5, h: 1 }, layer: 'belt', color: '#8e44ad', multiplier: 1.5, energyCost: 5, isHalf: true, speed: 90,
        tags: ['multiplier', 'narrow'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#9b59b6', dropSide: 0 }]
      },
      freonSprayer: {
        id: 'freonSprayer', name: 'Freon Cooling Sprayer', category: 'upgrader', rarity: 'uncommon', cost: 2200, priceGrowth: 1.11,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#0284c7', extinguishes: true, appliesWet: 6, cooldownEnergy: 50, speed: 90,
        tags: ['cooling', 'extinguisher'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#38bdf8', dropSide: 0 }]
      },
      upgrader2x1: {
        id: 'upgrader2x1', name: '2x1 Wide Upgrader', category: 'upgrader', rarity: 'rare', cost: 8500, priceGrowth: 1.12,
        unlockMethod: 'shop', size: { w: 2, h: 1 }, layer: 'belt', color: '#c0392b', multiplier: 3.0, energyCost: 20, speed: 90,
        tags: ['multiplier'], attributes: {},
        ports: [
          { dx: 0, dy: 0, kind: 'through', color: '#e74c3c', dropSide: 0 },
          { dx: 1, dy: 0, kind: 'through', color: '#e74c3c', dropSide: 0 }
        ]
      },
      pyroRefiner: {
        id: 'pyroRefiner', name: 'Pyro Blast Furnace', category: 'upgrader', rarity: 'rare', cost: 14000, priceGrowth: 1.12,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#b91c1c', multiplier: 3.5, appliesFlaming: true, speed: 90,
        tags: ['multiplier', 'flaming'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#f87171', dropSide: 0 }]
      },
      leadDecontaminator: {
        id: 'leadDecontaminator', name: 'Lead Decontaminator', category: 'upgrader', rarity: 'epic', cost: 40000, priceGrowth: 1.13,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#475569', removesRadioactive: true, multiplier: 2.5, speed: 90,
        tags: ['decontaminator', 'multiplier'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#94a3b8', dropSide: 0 }]
      },
      stellarSparkler: {
        id: 'stellarSparkler', name: 'Stellar Prism', category: 'upgrader', rarity: 'exotic', cost: 750000, priceGrowth: 1.13,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#eab308', appliesSparkling: true, speed: 90,
        tags: ['sparkles', 'buff'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#fde047', dropSide: 0 }]
      },
      upgraderPlasma: {
        id: 'upgraderPlasma', name: 'Plasma Supercharger', category: 'upgrader', rarity: 'epic', cost: 800000, priceGrowth: 1.14,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#ff0055', flatAdd: 500, energyCost: 35, speed: 100,
        tags: ['flat_boost', 'plasma'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#ff0055', dropSide: 0 }]
      },

      // --- NEW UPGRADERS & UTILITY MACHINES ---
      oreCrystallizer: {
        id: 'oreCrystallizer', name: 'Ore Crystallizer', category: 'upgrader', rarity: 'rare', cost: 22000, priceGrowth: 1.12,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#06b6d4', multiplier: 2.2, appliesCrystalline: true, speed: 90,
        tags: ['multiplier', 'crystal'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#67e8f9', dropSide: 0 }]
      },
      probabilityAmp: {
        id: 'probabilityAmp', name: 'Probability Amplifier', category: 'upgrader', rarity: 'exotic', cost: 750000, priceGrowth: 1.13,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#f59e0b', multiplier: 1.8, appliesLucky: true, speed: 90,
        tags: ['multiplier', 'lucky'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#fbbf24', dropSide: 0 }]
      },
      entropyStabilizer: {
        id: 'entropyStabilizer', name: 'Entropy Stabilizer', category: 'upgrader', rarity: 'epic', cost: 110000, priceGrowth: 1.13,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#14b8a6', multiplier: 3.0, nullifiesBadStatuses: true, speed: 90,
        tags: ['multiplier', 'stabilizer'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#2dd4bf', dropSide: 0 }]
      },
      resonanceHarmonizer: {
        id: 'resonanceHarmonizer', name: 'Resonance Harmonizer', category: 'upgrader', rarity: 'legendary', cost: 1600000, priceGrowth: 1.14,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#eab308', multiplier: 4.5, sparklingSynergy: true, speed: 90,
        tags: ['multiplier', 'synergy'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#fde047', dropSide: 0 }]
      },
      matterReplicator: {
        id: 'matterReplicator', name: 'Matter Replicator', category: 'upgrader', rarity: 'mythic', cost: 12000000, priceGrowth: 1.15,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 2, h: 1 }, layer: 'belt', color: '#a855f7', duplicatesOre: true, maxDuplicateCount: 1, speed: 90,
        tags: ['duplicator'], attributes: {},
        ports: [
          { dx: 0, dy: 0, kind: 'through', color: '#c084fc', dropSide: 0 },
          { dx: 1, dy: 0, kind: 'through', color: '#c084fc', dropSide: 0 }
        ]
      },
      oreTransmuter: {
        id: 'oreTransmuter', name: 'Ore Transmuter', category: 'upgrader', rarity: 'epic', cost: 250000, priceGrowth: 1.13,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#f43f5e', multiplier: 2.5, transmutation: true, speed: 90,
        tags: ['transmuter'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'through', color: '#fb7185', dropSide: 0 }]
      },
      shardOfLife: {
        id: 'shardOfLife', name: 'Shard of Life', category: 'upgrader', rarity: 'mythic', cost: 40000000, priceGrowth: 1.16,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 2, h: 2 }, layer: 'belt', color: '#22c55e', multiplier: 6.0, auraRadius: 2, speed: 90,
        tags: ['aura', 'multiplier'], attributes: {},
        ports: [
          { dx: 0, dy: 0, kind: 'through', color: '#4ade80', dropSide: 0 },
          { dx: 1, dy: 0, kind: 'through', color: '#4ade80', dropSide: 0 }
        ]
      },

      // --- CORE SELLERS ---
      seller: {
        id: 'seller', name: 'Seller', category: 'seller', rarity: 'common', cost: 0, priceGrowth: 1.00,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'machine', color: '#7a4fa0', consumes: true,
        tags: ['furnace', 'starter'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'input', color: '#9ad1ff', dropSide: null }]
      },
      blastSmelter: {
        id: 'blastSmelter', name: 'Blast Smelter (2.0x)', category: 'seller', rarity: 'exotic', cost: 275000, priceGrowth: 1.14,
        unlockMethod: 'shop', size: { w: 2, h: 2 }, layer: 'machine', color: '#581c87', consumes: true, sellerBonus: 2.0,
        tags: ['furnace', 'heavy_machinery'], attributes: {},
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#a855f7', dropSide: null }]
      },

      // --- NEW SELLERS ---
      dimensionalVault: {
        id: 'dimensionalVault', name: 'Dimensional Vault', category: 'seller', rarity: 'exotic', cost: 1400000, priceGrowth: 1.14,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 2, h: 2 }, layer: 'machine', color: '#4c1d95', consumes: true, sellerBonus: 3.5, batchThreshold: 5,
        tags: ['vault', 'batch_seller'], attributes: {},
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#818cf8', dropSide: null }]
      },
      catalyticConverter: {
        id: 'catalyticConverter', name: 'Catalytic Converter', category: 'seller', rarity: 'rare', cost: 95000, priceGrowth: 1.12,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 2, h: 1 }, layer: 'machine', color: '#84cc16', consumes: true, sellerBonus: 2.5, radioactiveBonus: 4.0,
        tags: ['furnace', 'radioactive_bonus'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'input', color: '#a3e635', dropSide: null }]
      },
      soulForge: {
        id: 'soulForge', name: 'Soul Forge', category: 'seller', rarity: 'legendary', cost: 6500000, priceGrowth: 1.15,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 3, h: 2 }, layer: 'machine', color: '#7f1d1d', consumes: true, sellerBonus: 8.0, penaltyRisk: 0.10,
        tags: ['furnace', 'high_risk'], attributes: {},
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#f87171', dropSide: null }]
      }
    },

    relicDefs: {
      warehouseCharter: { id: 'warehouseCharter', name: 'Warehouse Charter I', desc: '+10 permanent inventory capacity', effect: { inventoryCap: 10 } },
      starterBelts: { id: 'starterBelts', name: 'Starter Belt License', desc: 'Start each run with 8 Conveyor Belts', effect: { startingItems: { belt: 8 } } },
      sellerPermit: { id: 'sellerPermit', name: 'Seller Permit', desc: 'Start each run with 1 Seller', effect: { startingItems: { seller: 1 } } },
      crateMagnet: { id: 'crateMagnet', name: 'Crate Magnet', desc: '+3% crate blueprint odds', effect: { crateLuck: 0.03 } },
      salvageToolkit: { id: 'salvageToolkit', name: 'Salvage Toolkit', desc: 'Demolished items always return full stock to inventory', effect: { salvage100: true } },
      insuranceSeal: { id: 'insuranceSeal', name: 'Insurance Seal', desc: 'Mark 1 placed machine per run as prestige-safe', effect: { maxInsured: 1 } },
      exoticPermit: { id: 'exoticPermit', name: 'Exotic Handling Permit', desc: 'First exotic item placed each run has free cost', effect: { freeFirstExotic: true } },
      vaultArchivist: { id: 'vaultArchivist', name: 'Vault Archivist', desc: '+20% Prestige Dust from Prestige Crates', effect: { prestigeCrateBonus: 0.20 } }
    },

    crateDefs: {
      regular: { id: 'regular', name: 'Regular Crate', currency: 'money', cost: 250 },
      golden: { id: 'golden', name: 'Golden Crate', currency: 'money', cost: 1000 },
      exotic: { id: 'exotic', name: 'Exotic Crate', currency: 'money', cost: 5000 },
      prestige: { id: 'prestige', name: 'Prestige Crate', currency: 'prestigeKeys', cost: 1 }
    }
  },

  // Backward compatibility getters
  get world() {
    return {
      get money() { return STATE.run.money; },
      set money(v) { STATE.run.money = v; },
      get buildings() { return STATE.run.buildings; },
      set buildings(v) { STATE.run.buildings = v; },
      get ores() { return STATE.run.ores; },
      set ores(v) { STATE.run.ores = v; }
    };
  },
  get unlockedBuildingIds() {
    return Object.keys(STATE.meta.blueprintUnlocks).filter(k => STATE.meta.blueprintUnlocks[k]);
  },
  get buildingDefs() {
    return STATE.defs.buildingDefs;
  },
  get itemDefs() {
    return STATE.defs.itemDefs;
  },

  camera: { x: 0, y: 0, zoom: 1, minZoom: 0.25, maxZoom: 4 },
  nextId: 1
};

STATE.camera.x = (STATE.config.grid.cols * STATE.config.grid.cellSize) / 2;
STATE.camera.y = (STATE.config.grid.rows * STATE.config.grid.cellSize) / 2;

function genId(prefix) {
  return `${prefix}_${STATE.nextId++}`;
}

// ===========================================================
// HELPER & MANAGEMENT SYSTEMS (SHOP, INVENTORY, PRESTIGE, CRATES)
// ===========================================================

function getShopItemPrice(defId) {
  const def = STATE.defs.buildingDefs[defId];
  if (!def) return 0;
  const owned = STATE.shop.stock[defId]?.ownedCount || 0;
  const growth = def.priceGrowth || 1.10;
  return Math.round(def.cost * Math.pow(growth, owned));
}

function buyShopItem(defId, qty = 1) {
  const def = STATE.defs.buildingDefs[defId];
  if (!def) return false;
  if (!STATE.meta.blueprintUnlocks[defId]) {
    showToast(`${def.name} blueprint is locked. Open Crates to unlock.`);
    return false;
  }
  const price = getShopItemPrice(defId);
  if (STATE.run.money < price * qty) {
    showToast(`Need $${(price * qty).toLocaleString()} to buy ${qty}x ${def.name}.`);
    return false;
  }

  STATE.run.money -= price * qty;
  if (!STATE.shop.stock[defId]) {
    STATE.shop.stock[defId] = { defId, currentPrice: price, ownedCount: 0 };
  }
  STATE.shop.stock[defId].ownedCount += qty;

  addToInventory(defId, qty, false, 'shop');
  showToast(`Purchased ${qty}x ${def.name}!`);
  triggerSaveState();
  return true;
}

function addToInventory(defId, qty = 1, isPermanent = false, source = 'shop') {
  if (isPermanent) {
    if (!STATE.inventory.permanentItems[defId]) {
      STATE.inventory.permanentItems[defId] = { qty: 0, permanent: true, source };
    }
    STATE.inventory.permanentItems[defId].qty += qty;
  } else {
    if (!STATE.inventory.items[defId]) {
      STATE.inventory.items[defId] = { qty: 0, permanent: false, source };
    }
    STATE.inventory.items[defId].qty += qty;
  }
  triggerSaveState();
}

function removeFromInventory(defId, qty = 1) {
  if (STATE.inventory.items[defId] && STATE.inventory.items[defId].qty >= qty) {
    STATE.inventory.items[defId].qty -= qty;
    return true;
  } else if (STATE.inventory.permanentItems[defId] && STATE.inventory.permanentItems[defId].qty >= qty) {
    STATE.inventory.permanentItems[defId].qty -= qty;
    return true;
  }
  return false;
}

function getInventoryQty(defId) {
  const standard = STATE.inventory.items[defId]?.qty || 0;
  const perm = STATE.inventory.permanentItems[defId]?.qty || 0;
  return standard + perm;
}

function canPlaceFromInventory(defId) {
  return getInventoryQty(defId) > 0;
}

// Prestige Calculator & Execution
function calculatePrestigePayout(lifetimeEarnings) {
  const threshold = STATE.config.prestigeThresholdLifetime || 1e10;
  if (lifetimeEarnings < threshold) {
    return { canPrestige: false, pointsGained: 0, keysGained: 0 };
  }
  const pointsGained = Math.floor(Math.pow(lifetimeEarnings / threshold, 0.5));
  const keysGained = Math.max(1, 1 + Math.floor(Math.log10(lifetimeEarnings / threshold)));
  return { canPrestige: true, pointsGained, keysGained };
}

function executePrestigeReset() {
  const payout = calculatePrestigePayout(STATE.run.lifetimeEarnings);
  if (!payout.canPrestige) return false;

  STATE.meta.prestigePoints += payout.pointsGained;
  STATE.meta.prestigeKeys += payout.keysGained;

  // Reset active run state
  STATE.run.money = 1000;
  STATE.run.lifetimeEarnings = 0;
  STATE.run.buildings = [];
  STATE.run.ores = [];
  STATE.run.timeScale = 1.0;
  STATE.run.isPaused = false;

  // Apply starting relic inventory grants
  if (STATE.meta.relics.starterBelts) addToInventory('belt', 8, false, 'relic');
  if (STATE.meta.relics.sellerPermit) addToInventory('seller', 1, false, 'relic');

  showToast(`Prestige Complete! Gained +${payout.pointsGained} Points & +${payout.keysGained} Keys!`);
  triggerSaveState();
  return true;
}

// Crate Reward Resolution Engine
function openCrate(tier) {
  const crateDef = STATE.defs.crateDefs[tier];
  if (!crateDef) return null;

  if (crateDef.currency === 'money') {
    if (STATE.run.money < crateDef.cost) {
      showToast(`Need $${crateDef.cost} cash for ${crateDef.name}.`);
      return null;
    }
    STATE.run.money -= crateDef.cost;
  } else if (crateDef.currency === 'prestigeKeys') {
    if (STATE.meta.prestigeKeys < crateDef.cost) {
      showToast(`Need ${crateDef.cost} Prestige Key for ${crateDef.name}.`);
      return null;
    }
    STATE.meta.prestigeKeys -= crateDef.cost;
  }

  // Roll rewards from weighted tables
  const rand = Math.random();
  let reward = null;

  if (tier === 'regular') {
    if (rand < 0.72) {
      const ids = ['extractor', 'belt', 'fastBelt', 'upgrader1x1', 'freonSprayer'];
      const id = ids[Math.floor(Math.random() * ids.length)];
      addToInventory(id, 2, false, 'crate');
      reward = { type: 'item', id, qty: 2, label: `2x ${STATE.defs.buildingDefs[id].name}` };
    } else if (rand < 0.92) {
      const ids = ['halfBelt', 'splitter', 'merger', 'upgraderHalf'];
      const id = ids[Math.floor(Math.random() * ids.length)];
      addToInventory(id, 1, true, 'crate');
      reward = { type: 'permanent', id, qty: 1, label: `1x Permanent ${STATE.defs.buildingDefs[id].name}` };
    } else if (rand < 0.99) {
      const ids = ['coalExtractor', 'megaExtractor', 'pyroRefiner'];
      const id = ids[Math.floor(Math.random() * ids.length)];
      if (!STATE.meta.blueprintUnlocks[id]) {
        STATE.meta.blueprintUnlocks[id] = true;
        reward = { type: 'blueprint', id, label: `Blueprint: ${STATE.defs.buildingDefs[id].name}` };
      } else {
        STATE.meta.shards += 1;
        reward = { type: 'shards', qty: 1, label: `Duplicate Blueprint -> +1 Shard` };
      }
    } else {
      const rId = 'warehouseCharter';
      STATE.meta.relics[rId] = true;
      reward = { type: 'relic', id: rId, label: `Relic Unlocked: ${STATE.defs.relicDefs[rId].name}` };
    }
  } else if (tier === 'golden') {
    if (rand < 0.45) {
      const ids = ['geodeDriller', 'magLevRail', 'gravityInverter', 'cryoStorageBelt', 'oreCrystallizer'];
      const id = ids[Math.floor(Math.random() * ids.length)];
      addToInventory(id, 1, true, 'crate');
      reward = { type: 'permanent', id, qty: 1, label: `1x Permanent ${STATE.defs.buildingDefs[id].name}` };
    } else if (rand < 0.80) {
      const ids = ['volcanoDropper', 'thermalExtractor', 'upgrader2x1', 'geodeDriller'];
      const id = ids[Math.floor(Math.random() * ids.length)];
      if (!STATE.meta.blueprintUnlocks[id]) {
        STATE.meta.blueprintUnlocks[id] = true;
        reward = { type: 'blueprint', id, label: `Blueprint: ${STATE.defs.buildingDefs[id].name}` };
      } else {
        STATE.meta.shards += 4;
        reward = { type: 'shards', qty: 4, label: `Duplicate Blueprint -> +4 Shards` };
      }
    } else if (rand < 0.95) {
      const rId = 'starterBelts';
      STATE.meta.relics[rId] = true;
      reward = { type: 'relic', id: rId, label: `Relic Unlocked: ${STATE.defs.relicDefs[rId].name}` };
    } else {
      STATE.meta.shards += 10;
      reward = { type: 'shards', qty: 10, label: `Meta Currency Bundle: +10 Shards` };
    }
  } else if (tier === 'exotic') {
    if (rand < 0.35) {
      const ids = ['algaeVat', 'entropyStabilizer', 'oreTransmuter', 'dimensionalVault', 'catalyticConverter'];
      const id = ids[Math.floor(Math.random() * ids.length)];
      addToInventory(id, 1, true, 'crate');
      reward = { type: 'permanent', id, qty: 1, label: `1x Permanent ${STATE.defs.buildingDefs[id].name}` };
    } else if (rand < 0.70) {
      const ids = ['algaeVat', 'entropyStabilizer', 'oreTransmuter', 'dimensionalVault', 'catalyticConverter'];
      const id = ids[Math.floor(Math.random() * ids.length)];
      if (!STATE.meta.blueprintUnlocks[id]) {
        STATE.meta.blueprintUnlocks[id] = true;
        reward = { type: 'blueprint', id, label: `Blueprint: ${STATE.defs.buildingDefs[id].name}` };
      } else {
        STATE.meta.shards += 15;
        reward = { type: 'shards', qty: 15, label: `Duplicate Blueprint -> +15 Shards` };
      }
    } else if (rand < 0.90) {
      const rId = 'salvageToolkit';
      STATE.meta.relics[rId] = true;
      reward = { type: 'relic', id: rId, label: `Relic Unlocked: ${STATE.defs.relicDefs[rId].name}` };
    } else {
      STATE.meta.shards += 25;
      reward = { type: 'shards', qty: 25, label: `Shard Bundle: +25 Shards` };
    }
  } else if (tier === 'prestige') {
    if (rand < 0.45) {
      const ids = ['antimatterSiphon', 'temporalFluxBorer', 'phaseShiftBelt', 'quantumLink', 'probabilityAmp', 'resonanceHarmonizer', 'matterReplicator', 'voidHarvester', 'soulForge', 'shardOfLife'];
      const id = ids[Math.floor(Math.random() * ids.length)];
      if (!STATE.meta.blueprintUnlocks[id]) {
        STATE.meta.blueprintUnlocks[id] = true;
        reward = { type: 'blueprint', id, label: `Prestige Blueprint: ${STATE.defs.buildingDefs[id].name}` };
      } else {
        STATE.meta.prestigeDust += 50;
        reward = { type: 'prestigeDust', qty: 50, label: `Duplicate Prestige Blueprint -> +50 Dust` };
      }
    } else if (rand < 0.70) {
      const ids = ['antimatterSiphon', 'quantumLink', 'matterReplicator', 'soulForge', 'shardOfLife'];
      const id = ids[Math.floor(Math.random() * ids.length)];
      addToInventory(id, 1, true, 'crate');
      reward = { type: 'permanent', id, qty: 1, label: `1x Mythic Copy: ${STATE.defs.buildingDefs[id].name}` };
    } else if (rand < 0.90) {
      const rIds = ['insuranceSeal', 'exoticPermit', 'vaultArchivist'];
      const rId = rIds[Math.floor(Math.random() * rIds.length)];
      STATE.meta.relics[rId] = true;
      reward = { type: 'relic', id: rId, label: `Relic Unlocked: ${STATE.defs.relicDefs[rId].name}` };
    } else {
      STATE.meta.prestigeDust += 100;
      reward = { type: 'prestigeDust', qty: 100, label: `Prestige Dust Cache: +100 Dust` };
    }
  }

  triggerSaveState();
  return reward;
}

// Transient UI State Variables
let mode = 'idle';
let placingState = null;
let movingState = null;
let isBeltDragging = false;
let beltDragStart = null;
let selectedEntity = null;
let mouseScreen = { x: 0, y: 0 };
let currentCategory = 'all';
let hotbarItems = ['extractor', 'belt', 'fastBelt', 'upgrader1x1', 'freonSprayer', 'seller'];

function setMode(m) {
  mode = m;
  canvas.className = `mode-${mode}`;
  updateInspectorPanel();
}
function cancelMode() {
  placingState = null; movingState = null; isBeltDragging = false; beltDragStart = null; setMode('idle');
}

// Save & Migration System
function triggerSaveState() {
  try {
    const jsonStr = JSON.stringify(STATE, null, 2);
    localStorage.setItem('miners_haven_save', jsonStr);
    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr
    }).catch(err => console.error('Save API error:', err));
  } catch (e) {
    console.error('Save state error:', e);
  }
}

function migrateSavedState(savedState) {
  if (!savedState) return;

  if (savedState.world) {
    if (typeof savedState.world.money === 'number') STATE.run.money = savedState.world.money;
    if (Array.isArray(savedState.world.buildings)) STATE.run.buildings = savedState.world.buildings;
  }
  if (savedState.run) Object.assign(STATE.run, savedState.run);
  if (savedState.shop) Object.assign(STATE.shop, savedState.shop);
  if (savedState.inventory) Object.assign(STATE.inventory, savedState.inventory);
  if (savedState.meta) Object.assign(STATE.meta, savedState.meta);

  if (Array.isArray(savedState.unlockedBuildingIds)) {
    savedState.unlockedBuildingIds.forEach(id => { STATE.meta.blueprintUnlocks[id] = true; });
  }

  // Ensure default unlocks exist
  ['extractor', 'belt', 'fastBelt', 'halfBelt', 'upgrader1x1', 'upgraderHalf', 'seller', 'coalExtractor'].forEach(id => {
    STATE.meta.blueprintUnlocks[id] = true;
  });
}

function loadSavedGame() {
  fetch('/savegame.json')
    .then(res => res.json())
    .then(savedState => {
      migrateSavedState(savedState);
    })
    .catch(() => {
      const local = localStorage.getItem('miners_haven_save');
      if (local) {
        try {
          const savedState = JSON.parse(local);
          migrateSavedState(savedState);
        } catch(e) {}
      }
    })
    .finally(() => {
      if (typeof renderHotbar === 'function') renderHotbar();
      if (typeof renderInventoryGrid === 'function') renderInventoryGrid();
    });
}

// Math & Grid Utilities
function screenToWorld(sx, sy) {
  const cam = STATE.camera;
  return {
    x: (sx - canvas.width / 2) / cam.zoom + cam.x,
    y: (sy - canvas.height / 2) / cam.zoom + cam.y
  };
}

function worldToScreen(wx, wy) {
  const cam = STATE.camera;
  return {
    x: (wx - cam.x) * cam.zoom + canvas.width / 2,
    y: (wy - cam.y) * cam.zoom + canvas.height / 2
  };
}

function clampCamera() {
  const cs = STATE.config.grid.cellSize;
  const maxW = STATE.config.grid.cols * cs;
  const maxH = STATE.config.grid.rows * cs;
  STATE.camera.x = Math.max(0, Math.min(maxW, STATE.camera.x));
  STATE.camera.y = Math.max(0, Math.min(maxH, STATE.camera.y));
}

function rotatePointCW(x, y, w, h) {
  return { x: h - 1 - y, y: x };
}

function getFootprint(def, rot) {
  const r = ((rot % 4) + 4) % 4;
  let w = def.size.w, h = def.size.h;
  let ports = (def.ports || []).map(p => ({ ...p }));

  for (let i = 0; i < r; i++) {
    for (const p of ports) {
      const rp = rotatePointCW(p.dx, p.dy, w, h);
      p.dx = rp.x; p.dy = rp.y;
      if (p.dropSide !== null && p.dropSide !== undefined) {
        p.dropSide = (p.dropSide + 1) % 4;
      }
    }
    const t = w; w = h; h = t;
  }
  return { w, h, ports };
}

function dirVector(dir) {
  switch (dir) {
    case 0: return { x: 1, y: 0 };
    case 1: return { x: 0, y: 1 };
    case 2: return { x: -1, y: 0 };
    case 3: return { x: 0, y: -1 };
    default: return { x: 0, y: 0 };
  }
}

function clampedOrigin(w, h, rawCol, rawRow) {
  const grid = STATE.config.grid;
  return {
    col: Math.min(grid.cols - w, Math.max(0, rawCol)),
    row: Math.min(grid.rows - h, Math.max(0, rawRow))
  };
}

function worldToCell(wx, wy, defId) {
  const cs = STATE.config.grid.cellSize;
  const def = defId ? STATE.defs.buildingDefs[defId] : (placingState ? STATE.defs.buildingDefs[placingState.defId] : null);

  let col = Math.floor(wx / cs);
  let row = Math.floor(wy / cs);

  if (def && def.isHalfBelt) {
    const subX = (wx / cs) - col;
    const subCol = subX >= 0.5 ? 0.5 : 0;
    col += subCol;
  }
  return { col, row };
}

let toastTimer = null;
function showToast(msg) {
  let toast = document.getElementById('gameToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gameToast';
    toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#ef476f; color:#fff; font-weight:800; padding:10px 20px; border-radius:8px; z-index:200; box-shadow:0 6px 20px rgba(0,0,0,0.5); font-size:13px; font-family:system-ui;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 2200);
}

function getCellOccupants(col, row, excludeId) {
  const occupants = [];
  const eps = 0.0001;
  for (const b of STATE.run.buildings) {
    if (excludeId && b.id === excludeId) continue;
    const def = STATE.defs.buildingDefs[b.defId];
    if (!def) continue;
    const fp = getFootprint(def, b.rot);
    if (col >= b.col - eps && col < b.col + fp.w - eps && row >= b.row - eps && row < b.row + fp.h - eps) {
      const localDx = Math.floor(col - b.col), localDy = Math.floor(row - b.row);
      const port = fp.ports.find(p => Math.abs(p.dx - localDx) < 0.5 && Math.abs(p.dy - localDy) < 0.5) || null;
      occupants.push({ building: b, def, fp, isPort: !!port, port });
    }
  }
  return occupants;
}

function wouldOverlapAt(defId, col, row, w, h, excludeId) {
  const gridW = STATE.config.grid.cols;
  const gridH = STATE.config.grid.rows;
  const def = STATE.defs.buildingDefs[defId];

  if (col < 0 || row < 0 || col + w > gridW || row + h > gridH) return true;

  const eps = 0.0001;
  for (const b of STATE.run.buildings) {
    if (b.id === excludeId) continue;
    const bDef = STATE.defs.buildingDefs[b.defId];
    if (!bDef) continue;
    const fp = getFootprint(bDef, b.rot);

    if (col < b.col + fp.w - eps && col + w > b.col + eps &&
        row < b.row + fp.h - eps && row + h > b.row + eps) {
      if ((def.layer === 'belt' && bDef.layer === 'machine') || (def.layer === 'machine' && bDef.layer === 'belt')) continue;
      if (def.id === bDef.id && Math.abs(col - b.col) < eps && Math.abs(row - b.row) < eps) {
        deleteBuilding(b);
        continue;
      }
      return true;
    }
  }
  return false;
}

function findBuildingAtCell(col, row) {
  for (let i = STATE.run.buildings.length - 1; i >= 0; i--) {
    const b = STATE.run.buildings[i];
    const def = STATE.defs.buildingDefs[b.defId];
    if (!def) continue;
    const fp = getFootprint(def, b.rot);
    if (col >= b.col && col < b.col + fp.w && row >= b.row && row < b.row + fp.h) return b;
  }
  return null;
}

function findBuildingById(id) {
  return STATE.run.buildings.find(b => b.id === id) || null;
}

// Building Placement & Demolition with Inventory Integration
function tryPlaceBuilding(defId, col, row, rot) {
  const def = STATE.defs.buildingDefs[defId];
  if (!def) return false;
  if (!STATE.meta.blueprintUnlocks[defId]) {
    showToast(`${def.name} blueprint is locked.`);
    return false;
  }
  if (!canPlaceFromInventory(defId)) {
    showToast(`No ${def.name} available in inventory! Buy from Shop.`);
    return false;
  }
  const fp = getFootprint(def, rot);
  if (wouldOverlapAt(defId, col, row, fp.w, fp.h, null)) return false;

  removeFromInventory(defId, 1);
  STATE.run.buildings.push({
    id: genId('bldg'), defId, col, row, rot,
    fuelTimer: 0,
    lastProduced: performance.now()
  });
  triggerSaveState();
  if (typeof renderInventoryGrid === 'function') renderInventoryGrid();
  if (typeof renderHotbar === 'function') renderHotbar();
  return true;
}

function tryMoveBuilding(building, col, row, rot) {
  const def = STATE.defs.buildingDefs[building.defId];
  const fp = getFootprint(def, rot);
  if (wouldOverlapAt(building.defId, col, row, fp.w, fp.h, building.id)) return false;
  building.col = col; building.row = row; building.rot = rot;
  triggerSaveState();
  return true;
}

function rotateBuildingInPlace(building) {
  const def = STATE.defs.buildingDefs[building.defId];
  const newRot = (building.rot + 1) % 4;
  const fp = getFootprint(def, newRot);
  const origin = clampedOrigin(fp.w, fp.h, building.col, building.row);
  if (wouldOverlapAt(building.defId, origin.col, origin.row, fp.w, fp.h, building.id)) return false;
  building.col = origin.col; building.row = origin.row; building.rot = newRot;
  triggerSaveState();
  return true;
}

function deleteBuilding(building) {
  addToInventory(building.defId, 1, building.isPermanent || false, 'salvage');
  const idx = STATE.run.buildings.findIndex(b => b.id === building.id);
  if (idx >= 0) STATE.run.buildings.splice(idx, 1);
  if (selectedEntity && selectedEntity.type === 'building' && selectedEntity.id === building.id) {
    selectedEntity = null;
  }
  showToast(`Demolished ${STATE.defs.buildingDefs[building.defId]?.name || 'Building'} -> Returned to Inventory`);
  triggerSaveState();
  if (typeof renderInventoryGrid === 'function') renderInventoryGrid();
  if (typeof renderHotbar === 'function') renderHotbar();
}

// Mouse & Dragging Controls
function getBeltDragPath(startCell, endCell) {
  const dCol = endCell.col - startCell.col;
  const dRow = endCell.row - startCell.row;
  const cells = [];
  let rot = 0;

  if (Math.abs(dCol) >= Math.abs(dRow)) {
    rot = dCol >= 0 ? 0 : 2;
    const step = dCol >= 0 ? 1 : -1;
    for (let c = startCell.col; dCol >= 0 ? c <= endCell.col : c >= endCell.col; c += step) {
      cells.push({ col: c, row: startCell.row });
    }
  } else {
    rot = dRow >= 0 ? 1 : 3;
    const step = dRow >= 0 ? 1 : -1;
    for (let r = startCell.row; dRow >= 0 ? r <= endCell.row : r >= endCell.row; r += step) {
      cells.push({ col: startCell.col, row: r });
    }
  }
  return { cells, rot };
}

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const before = screenToWorld(e.clientX, e.clientY);
  const zoomFactor = Math.pow(1.0015, -e.deltaY);
  const cam = STATE.camera;
  cam.zoom = Math.min(cam.maxZoom, Math.max(cam.minZoom, cam.zoom * zoomFactor));
  const after = screenToWorld(e.clientX, e.clientY);
  cam.x += before.x - after.x; cam.y += before.y - after.y;
  clampCamera();
}, { passive: false });

function handleClickAction(screenX, screenY) {
  const world = screenToWorld(screenX, screenY);
  if (mode === 'placing') {
    const def = STATE.defs.buildingDefs[placingState.defId];
    const fp = getFootprint(def, placingState.rot);
    const raw = worldToCell(world.x, world.y);
    const origin = clampedOrigin(fp.w, fp.h, raw.col, raw.row);
    tryPlaceBuilding(placingState.defId, origin.col, origin.row, placingState.rot);
  } else if (mode === 'moving') {
    const building = findBuildingById(movingState.buildingId);
    if (building) {
      const def = STATE.defs.buildingDefs[building.defId];
      const fp = getFootprint(def, movingState.rot);
      const raw = worldToCell(world.x, world.y);
      const origin = clampedOrigin(fp.w, fp.h, raw.col, raw.row);
      tryMoveBuilding(building, origin.col, origin.row, movingState.rot);
    }
    cancelMode();
  } else if (mode === 'inspecting') {
    selectEntityAt(world.x, world.y);
  }
}

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (typeof closeContextMenu === 'function') closeContextMenu();
  const world = screenToWorld(e.clientX, e.clientY);
  const cell = worldToCell(world.x, world.y);

  if (mode === 'placing' && placingState) {
    const def = STATE.defs.buildingDefs[placingState.defId];
    if (def && def.layer === 'belt') {
      isBeltDragging = true;
      beltDragStart = cell;
    }
  }

  isDragging = true; dragMoved = false;
  canvas.classList.add('dragging');
  lastMouse = { x: e.clientX, y: e.clientY };
});

let isDragging = false;
let dragMoved = false;
let lastMouse = { x: 0, y: 0 };

canvas.addEventListener('mousemove', (e) => {
  mouseScreen = { x: e.clientX, y: e.clientY };
  if (!isDragging) return;
  const dx = e.clientX - lastMouse.x, dy = e.clientY - lastMouse.y;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
  if (mode !== 'placing') {
    STATE.camera.x -= dx / STATE.camera.zoom;
    STATE.camera.y -= dy / STATE.camera.zoom;
    clampCamera();
  }
  lastMouse = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', (e) => {
  if (e.button !== 0) return;
  if (mode === 'placing' && placingState) {
    if (isBeltDragging && beltDragStart) {
      const world = screenToWorld(e.clientX, e.clientY);
      const endCell = worldToCell(world.x, world.y);
      const line = getBeltDragPath(beltDragStart, endCell);
      line.cells.forEach(c => { tryPlaceBuilding(placingState.defId, c.col, c.row, line.rot); });
    } else {
      handleClickAction(e.clientX, e.clientY);
    }
  } else if (isDragging && !dragMoved) {
    handleClickAction(e.clientX, e.clientY);
  }
  isBeltDragging = false; beltDragStart = null; isDragging = false;
  canvas.classList.remove('dragging');
});

// Mobile Touch Interactions
let touchStartDist = 0;
let lastTouchPos = { x: 0, y: 0 };
let lastTapTime = 0;

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    const t = e.touches[0];
    lastTouchPos = { x: t.clientX, y: t.clientY };
    mouseScreen = { x: t.clientX, y: t.clientY };

    const now = performance.now();
    if (now - lastTapTime < 300) {
      const world = screenToWorld(t.clientX, t.clientY);
      const cell = worldToCell(world.x, world.y);
      const b = findBuildingAtCell(cell.col, cell.row);
      if (b && typeof openContextMenu === 'function') {
        openContextMenu(b, t.clientX, t.clientY);
      }
    }
    lastTapTime = now;

    if (mode === 'placing' && placingState) {
      const world = screenToWorld(t.clientX, t.clientY);
      const cell = worldToCell(world.x, world.y);
      const def = STATE.defs.buildingDefs[placingState.defId];
      if (def && def.layer === 'belt') {
        isBeltDragging = true;
        beltDragStart = cell;
      }
    }
    isDragging = true; dragMoved = false;
  } else if (e.touches.length === 2) {
    const t1 = e.touches[0], t2 = e.touches[1];
    touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && isDragging) {
    const t = e.touches[0];
    mouseScreen = { x: t.clientX, y: t.clientY };
    const dx = t.clientX - lastTouchPos.x, dy = t.clientY - lastTouchPos.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;

    if (mode !== 'placing') {
      STATE.camera.x -= dx / STATE.camera.zoom;
      STATE.camera.y -= dy / STATE.camera.zoom;
      clampCamera();
    }
    lastTouchPos = { x: t.clientX, y: t.clientY };
  } else if (e.touches.length === 2 && touchStartDist > 0) {
    const t1 = e.touches[0], t2 = e.touches[1];
    const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const zoomRatio = currentDist / touchStartDist;
    STATE.camera.zoom = Math.min(STATE.camera.maxZoom, Math.max(STATE.camera.minZoom, STATE.camera.zoom * (1 + (zoomRatio - 1) * 0.1)));
    touchStartDist = currentDist;
    clampCamera();
  }
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (e.touches.length === 0) {
    if (mode === 'placing' && placingState) {
      if (isBeltDragging && beltDragStart) {
        const world = screenToWorld(lastTouchPos.x, lastTouchPos.y);
        const endCell = worldToCell(world.x, world.y);
        const line = getBeltDragPath(beltDragStart, endCell);
        line.cells.forEach(c => { tryPlaceBuilding(placingState.defId, c.col, c.row, line.rot); });
      } else {
        handleClickAction(lastTouchPos.x, lastTouchPos.y);
      }
    } else if (isDragging && !dragMoved) {
      handleClickAction(lastTouchPos.x, lastTouchPos.y);
    }
    isBeltDragging = false; beltDragStart = null; isDragging = false; touchStartDist = 0;
  }
}, { passive: true });

// Entity Selection & Inspector Panel
function selectEntityAt(wx, wy) {
  const cell = worldToCell(wx, wy);
  const b = findBuildingAtCell(cell.col, cell.row);
  if (b) { selectedEntity = { type: 'building', id: b.id }; updateInspectorPanel(); return; }
  for (let i = STATE.run.ores.length - 1; i >= 0; i--) {
    const o = STATE.run.ores[i];
    const dx = o.x - wx, dy = o.y - wy;
    if (dx * dx + dy * dy <= (o.size / 2) * (o.size / 2)) {
      selectedEntity = { type: 'ore', id: o.id };
      updateInspectorPanel(); return;
    }
  }
  selectedEntity = null; updateInspectorPanel();
}

function getSelectedEntityObject() {
  if (!selectedEntity) return null;
  if (selectedEntity.type === 'ore') return STATE.run.ores.find(o => o.id === selectedEntity.id) || null;
  return findBuildingById(selectedEntity.id);
}

function updateInspectorPanel() {
  const panel = document.getElementById('inspectorPanel');
  const title = document.getElementById('inspectorTitle');
  const body = document.getElementById('inspectorBody');
  if (!panel || !title || !body) return;

  if (mode !== 'inspecting' || !selectedEntity) { panel.classList.remove('open'); return; }
  const obj = getSelectedEntityObject();
  if (!obj) { selectedEntity = null; panel.classList.remove('open'); return; }
  panel.classList.add('open');

  const typeLabel = selectedEntity.type === 'ore' ? 'Ore' : (STATE.defs.buildingDefs[obj.defId] ? STATE.defs.buildingDefs[obj.defId].name : 'Building');
  title.textContent = `${typeLabel} — ${obj.id}`;

  if (selectedEntity.type === 'ore') {
    let activeEffects = [];
    if (obj.status) {
      if (obj.status.flaming) activeEffects.push('🔥 Flaming');
      if (obj.status.radioactive) activeEffects.push('☢️ Radioactive');
      if (obj.status.wet > 0) activeEffects.push(`💧 Wet (${Math.ceil(obj.status.wet)}s)`);
      if (obj.status.sparkling) activeEffects.push('✨ Sparkling');
      if (obj.status.crystalline) activeEffects.push('💎 Crystalline');
      if (obj.status.lucky) activeEffects.push('🍀 Lucky (2x Next Upgrade)');
      if (obj.status.duplicated) activeEffects.push('👯 Duplicated');
      if (obj.status.timeAged) activeEffects.push('⏳ Time-Aged');
    }
    const inspectData = {
      id: obj.id, itemType: obj.itemType, value: `$${obj.value.toLocaleString()}`,
      statusEffects: activeEffects.length ? activeEffects : ['Normal'],
      position: { x: Math.round(obj.x), y: Math.round(obj.y) }
    };
    body.textContent = JSON.stringify(inspectData, null, 2);
  } else {
    body.textContent = JSON.stringify(obj, null, 2);
  }
}

// Particle & Physics Effects
let lastFrameTime = performance.now();
const particles = [];
const explosions = [];

function triggerExplosion(x, y, radius = 96) {
  explosions.push({ x, y, maxRadius: radius, currentRadius: 4, alpha: 1.0 });
  for (let k = 0; k < 20; k++) {
    const angle = Math.random() * Math.PI * 2, spd = 50 + Math.random() * 140;
    particles.push({
      x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      life: 0.6, maxLife: 0.6, color: Math.random() > 0.4 ? '#ff4757' : '#ffa502', size: 3 + Math.random() * 5
    });
  }
  for (let j = 0; j < STATE.run.ores.length; j++) {
    const nearOre = STATE.run.ores[j];
    if (!nearOre) continue;
    const dx = nearOre.x - x, dy = nearOre.y - y;
    if (dx * dx + dy * dy <= radius * radius) nearOre.destroyed = true;
  }
}

function updateEffects(dt) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    exp.currentRadius += 180 * dt; exp.alpha -= 1.8 * dt;
    if (exp.alpha <= 0) explosions.splice(i, 1);
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function update(now) {
  const rawDt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  if (STATE.run.isPaused) return;
  const dt = rawDt * (STATE.run.timeScale || 1.0);

  updateProduction(dt);
  updateOrePhysics(dt);
  resolveOreCollisions();
  processConsumption();
  updateEffects(dt);
}

function updateProduction(dt) {
  for (const b of STATE.run.buildings) {
    if (movingState && movingState.buildingId === b.id) continue;
    const def = STATE.defs.buildingDefs[b.defId];
    if (!def || !def.produces) continue;

    if (def.requiresFuel) {
      if ((b.fuelTimer || 0) > 0) {
        b.fuelTimer = Math.max(0, b.fuelTimer - dt);
        b.prodTimer = (b.prodTimer || 0) + dt * 1000;
        if (b.prodTimer >= def.produces.rate) {
          b.prodTimer %= def.produces.rate;
          spawnOreFromBuilding(b, def);
        }
      }
    } else {
      b.prodTimer = (b.prodTimer || 0) + dt * 1000;
      if (b.prodTimer >= def.produces.rate) {
        b.prodTimer %= def.produces.rate;
        spawnOreFromBuilding(b, def);
      }
    }
  }
}

function spawnOreFromBuilding(building, def) {
  if (STATE.run.ores.length >= STATE.config.maxOres) return;
  const fp = getFootprint(def, building.rot);
  const outPort = fp.ports.find(p => p.kind === 'output');
  if (!outPort) return;
  const itemDef = STATE.defs.itemDefs[def.produces.item] || STATE.defs.itemDefs['ore'];
  const cs = STATE.config.grid.cellSize;

  const portX = (building.col + outPort.dx + 0.5) * cs;
  const portY = (building.row + outPort.dy + 0.5) * cs;

  STATE.run.ores.push({
    id: genId('ore'),
    itemType: itemDef.id,
    x: portX, y: portY,
    vx: 0, vy: 0,
    size: itemDef.size,
    color: itemDef.color,
    shape: itemDef.shape || 'circle',
    value: Math.round(itemDef.baseValue * (0.8 + Math.random() * 0.4)),
    energy: 0,
    maxEnergy: 100,
    isFuel: !!itemDef.isFuel,
    status: itemDef.defaultStatus ? JSON.parse(JSON.stringify(itemDef.defaultStatus)) : {},
    upgradersPassed: []
  });
}

function getTransportPortAt(col, row) {
  const occupants = getCellOccupants(col, row);
  const belt = occupants.find(o => o.def.layer === 'belt' && o.isPort);
  if (belt) return belt;
  return occupants.find(o => o.isPort && o.port.dropSide !== null && o.port.dropSide !== undefined) || null;
}

function updateOrePhysics(dt) {
  const cs = STATE.config.grid.cellSize;
  const worldW = STATE.config.grid.cols * cs;
  const worldH = STATE.config.grid.rows * cs;
  const cfg = STATE.config;

  for (let i = STATE.run.ores.length - 1; i >= 0; i--) {
    const ore = STATE.run.ores[i];
    if (!ore || ore.destroyed) continue;

    if (!ore.status) ore.status = {};

    // 1. Status Timers & Reactions
    if (ore.status.wet > 0) {
      ore.status.wet = Math.max(0, ore.status.wet - dt);
      if (ore.status.flaming) { ore.status.flaming = false; ore.status.flameTime = 0; }
    }

    if (ore.status.flaming) {
      if (ore.status.wet > 0) {
        ore.status.flaming = false;
      } else {
        ore.status.flameTime = (ore.status.flameTime || 0) + dt;
        if (Math.random() < 0.35) {
          particles.push({
            x: ore.x + (Math.random() - 0.5) * 8, y: ore.y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 15, vy: -25 - Math.random() * 20,
            life: 0.3, maxLife: 0.3, color: Math.random() > 0.4 ? '#ff4757' : '#ffa502', size: 3
          });
        }
        if (ore.status.flameTime >= 4.0) {
          ore.destroyed = true;
          triggerExplosion(ore.x, ore.y, 60);
          continue;
        }
      }
    }

    if (ore.status.timeAged) {
      ore.travelTime = (ore.travelTime || 0) + dt;
      if (ore.travelTime <= 10) {
        ore.value += Math.round(50 * dt);
      }
    }

    const cell = worldToCell(ore.x, ore.y);
    const transport = getTransportPortAt(cell.col, cell.row);
    let targetVx = 0, targetVy = 0, blend;

    if (transport) {
      ore.groundTime = 0;
      const b = transport.building;
      const def = transport.def;

      // Fuel Extractor input port handling
      if (def.requiresFuel && transport.port.kind === 'input' && ore.isFuel) {
        b.fuelTimer = (b.fuelTimer || 0) + (def.attributes.runDurationSec || 8);
        ore.destroyed = true;
        showToast(`Fuel Loaded! Thermal Mine running for ${Math.round(b.fuelTimer)}s.`);
        continue;
      }

      if (!ore.upgradersPassed) ore.upgradersPassed = [];
      if (!ore.upgradersPassed.includes(b.id)) {
        ore.upgradersPassed.push(b.id);

        if (def.extinguishes) { ore.status.flaming = false; ore.status.flameTime = 0; ore.energy = 0; }
        if (def.appliesWet) { ore.status.wet = def.appliesWet; ore.status.flaming = false; }
        if (def.appliesFlaming && !ore.status.wet) { ore.status.flaming = true; ore.status.flameTime = 0; }
        if (def.removesRadioactive) { ore.status.radioactive = false; }
        if (def.appliesSparkling) { ore.status.sparkling = true; }
        if (def.appliesCrystalline) { ore.status.crystalline = true; }
        if (def.appliesLucky) { ore.status.lucky = true; }
        if (def.nullifiesBadStatuses) {
          ore.status.flaming = false;
          ore.status.radioactive = false;
        }

        // Multiplier & Lucky Calculation
        let effectiveMulti = def.multiplier || 1.0;
        if (def.multiplier && ore.status.sparkling) effectiveMulti += 0.5;
        if (def.multiplier && ore.status.crystalline) effectiveMulti += 0.75;
        if (def.multiplier && def.sparklingSynergy && ore.status.sparkling) effectiveMulti *= 1.5;

        if (ore.status.lucky && def.multiplier) {
          effectiveMulti *= 2.0;
          ore.status.lucky = false; // Consumed lucky
        }

        if (def.multiplier) { ore.value = Math.round(ore.value * effectiveMulti); ore.upgraded = true; }
        if (def.flatAdd) { ore.value += def.flatAdd; ore.upgraded = true; }

        // Matter Replicator Duplication
        if (def.duplicatesOre && !ore.status.duplicated && STATE.run.ores.length < STATE.config.maxOres) {
          ore.status.duplicated = true;
          STATE.run.ores.push({
            id: genId('ore'),
            itemType: ore.itemType,
            x: ore.x + 12, y: ore.y + 12,
            vx: ore.vx * 0.8, vy: ore.vy * 0.8,
            size: ore.size,
            color: ore.color,
            shape: ore.shape,
            value: ore.value,
            energy: ore.energy,
            status: { ...ore.status, duplicated: true },
            upgradersPassed: [...ore.upgradersPassed]
          });
        }
      }

      let currentDropSide = transport.port.dropSide;
      if (def.isSplitter) {
        if (ore.splitterBuildingId !== b.id) {
          ore.splitterBuildingId = b.id; b.splitCount = (b.splitCount || 0) + 1;
          currentDropSide = (b.rot + (b.splitCount % 2 === 0 ? 0 : 1)) % 4;
        } else { currentDropSide = (b.rot + (b.splitCount % 2 === 0 ? 0 : 1)) % 4; }
      } else if (def.isMerger) { currentDropSide = b.rot; }

      if (b.walls) {
        const bLeft = b.col * cs, bRight = (b.col + 1) * cs;
        const bTop = b.row * cs, bBottom = (b.row + 1) * cs;
        const r = ore.size / 2;
        if (b.walls[0] && ore.x > bRight - r) { ore.x = bRight - r; if (ore.vx > 0) ore.vx = 0; }
        if (b.walls[1] && ore.y > bBottom - r) { ore.y = bBottom - r; if (ore.vy > 0) ore.vy = 0; }
        if (b.walls[2] && ore.x < bLeft + r) { ore.x = bLeft + r; if (ore.vx < 0) ore.vx = 0; }
        if (b.walls[3] && ore.y < bTop + r) { ore.y = bTop + r; if (ore.vy < 0) ore.vy = 0; }
      }

      const dv = dirVector(currentDropSide !== null && currentDropSide !== undefined ? currentDropSide : b.rot);
      const speed = def.speed || 90;
      targetVx = dv.x * speed; targetVy = dv.y * speed;
      blend = 1 - Math.exp(-cfg.beltAcceleration * dt);
    } else {
      ore.groundTime = (ore.groundTime || 0) + dt;
      if (cfg.oreGroundLifespan > 0 && ore.groundTime >= cfg.oreGroundLifespan) {
        ore.destroyed = true; continue;
      }
      blend = 1 - Math.exp(-cfg.groundFriction * dt);
    }

    ore.vx += (targetVx - ore.vx) * blend;
    ore.vy += (targetVy - ore.vy) * blend;
    ore.x += ore.vx * dt; ore.y += ore.vy * dt;

    const r = ore.size / 2;
    if (ore.x < r) { ore.x = r; ore.vx = Math.max(0, ore.vx); }
    if (ore.x > worldW - r) { ore.x = worldW - r; ore.vx = Math.min(0, ore.vx); }
    if (ore.y < r) { ore.y = r; ore.vy = Math.max(0, ore.vy); }
    if (ore.y > worldH - r) { ore.y = worldH - r; ore.vy = Math.min(0, ore.vy); }
  }

  STATE.run.ores = STATE.run.ores.filter(o => !o.destroyed);
  if (selectedEntity && selectedEntity.type === 'ore') {
    if (!STATE.run.ores.some(o => o.id === selectedEntity.id)) selectedEntity = null;
  }
}

function resolveOreCollisions() {
  const list = STATE.run.ores;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const minDist = (a.size + b.size) / 2;
      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = (minDist - dist) / 2;
        const nx = dx / dist, ny = dy / dist;
        a.x -= nx * overlap; a.y -= ny * overlap;
        b.x += nx * overlap; b.y += ny * overlap;
      }
    }
  }
}

function processConsumption() {
  const cs = STATE.config.grid.cellSize;
  for (const ore of STATE.run.ores) {
    if (ore.destroyed) continue;
    const cell = worldToCell(ore.x, ore.y);
    const occupants = getCellOccupants(cell.col, cell.row);
    const sellerAcc = occupants.find(o => o.def.consumes && o.isPort && o.port.kind === 'input');
    if (sellerAcc) {
      let soldVal = ore.value;
      if (sellerAcc.def.sellerBonus) soldVal = Math.round(soldVal * sellerAcc.def.sellerBonus);
      if (sellerAcc.def.radioactiveBonus && ore.status && ore.status.radioactive) {
        soldVal = Math.round(soldVal * sellerAcc.def.radioactiveBonus);
      }
      if (sellerAcc.def.penaltyRisk && Math.random() < sellerAcc.def.penaltyRisk) {
        soldVal = 0; // Soul Forge penalty reset
        showToast('Soul Forge destroyed an ore!');
      }

      STATE.run.money += soldVal;
      STATE.run.lifetimeEarnings += soldVal;
      ore.destroyed = true;
    }
  }
}

// Rendering Pipeline
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawBuildings();
  drawOres();
  drawGhostPreview();
  drawEffects();
  drawHUD();
}

function drawGrid() {
  const grid = STATE.config.grid;
  const cs = grid.cellSize;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 0; col <= grid.cols; col++) {
    const sx = worldToScreen(col * cs, 0).x;
    ctx.moveTo(sx, 0); ctx.lineTo(sx, canvas.height);
  }
  for (let row = 0; row <= grid.rows; row++) {
    const sy = worldToScreen(0, row * cs).y;
    ctx.moveTo(0, sy); ctx.lineTo(canvas.width, sy);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  const p1 = worldToScreen(0, 0), p2 = worldToScreen(grid.cols * cs, grid.rows * cs);
  ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
}

function currentGhost() {
  if (mode === 'placing' && placingState) {
    const world = screenToWorld(mouseScreen.x, mouseScreen.y);
    const def = STATE.defs.buildingDefs[placingState.defId];
    if (!def) return null;
    const fp = getFootprint(def, placingState.rot);
    const raw = worldToCell(world.x, world.y);
    const origin = clampedOrigin(fp.w, fp.h, raw.col, raw.row);
    return { def, fp, col: origin.col, row: origin.row };
  }
  if (mode === 'moving' && movingState) {
    const building = findBuildingById(movingState.buildingId);
    if (!building) return null;
    const world = screenToWorld(mouseScreen.x, mouseScreen.y);
    const def = STATE.defs.buildingDefs[building.defId];
    if (!def) return null;
    const fp = getFootprint(def, movingState.rot);
    const raw = worldToCell(world.x, world.y);
    const origin = clampedOrigin(fp.w, fp.h, raw.col, raw.row);
    return { def, fp, col: origin.col, row: origin.row };
  }
  return null;
}

function drawSelectionGlowAndGizmo(p1, p2, rot = 0) {
  const pad = 8 * STATE.camera.zoom;
  const gx1 = p1.x - pad, gy1 = p1.y - pad;
  const gw = (p2.x - p1.x) + pad * 2, gh = (p2.y - p1.y) + pad * 2;

  ctx.save();
  ctx.fillStyle = 'rgba(127, 208, 255, 0.18)';
  ctx.fillRect(gx1, gy1, gw, gh);

  ctx.strokeStyle = '#7fd0ff';
  ctx.lineWidth = 2 * STATE.camera.zoom;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(gx1, gy1, gw, gh);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawGhostPreview() {
  const ghost = currentGhost();
  if (!ghost) return;
  const { def, fp, col, row } = ghost;
  const cs = STATE.config.grid.cellSize;
  const p1 = worldToScreen(col * cs, row * cs);
  const p2 = worldToScreen((col + fp.w) * cs, (row + fp.h) * cs);

  drawSelectionGlowAndGizmo(p1, p2, placingState ? placingState.rot : 0);
  ctx.fillStyle = hexToRgba(def.color, 0.35);
  ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
  ctx.setLineDash([]);
  drawPorts(fp, col, row);
}

function drawPorts(fp, col, row) {
  const cs = STATE.config.grid.cellSize;
  for (const port of fp.ports) {
    const px = col + port.dx, py = row + port.dy;
    const p1 = worldToScreen(px * cs, py * cs);
    const p2 = worldToScreen((px + 1) * cs, (py + 1) * cs);
    const color = port.color || (port.kind === 'input' ? '#9ad1ff' : '#ffcf5c');

    if (port.kind === 'output') {
      const center = worldToScreen((px + 0.5) * cs, (py + 0.5) * cs);
      const radius = 10 * STATE.camera.zoom;
      ctx.save();
      ctx.fillStyle = hexToRgba(color, 0.45);
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = hexToRgba(color, 0.95); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = hexToRgba(color, 0.4);
      ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      ctx.strokeStyle = hexToRgba(color, 0.9); ctx.lineWidth = 2;
      ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    }
  }
}

function drawBuildings() {
  const cs = STATE.config.grid.cellSize;
  for (const b of STATE.run.buildings) {
    const def = STATE.defs.buildingDefs[b.defId];
    if (!def) continue;
    const fp = getFootprint(def, b.rot);
    const p1 = worldToScreen(b.col * cs, b.row * cs);
    const p2 = worldToScreen((b.col + fp.w) * cs, (b.row + fp.h) * cs);
    const isSelected = selectedEntity && selectedEntity.type === 'building' && selectedEntity.id === b.id;

    ctx.save();
    if (isSelected) drawSelectionGlowAndGizmo(p1, p2, b.rot);

    ctx.fillStyle = def.color; ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.strokeStyle = isSelected ? '#7fd0ff' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

    drawPorts(fp, b.col, b.row);

    if (STATE.camera.zoom > 0.4) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `${Math.max(10, 11 * STATE.camera.zoom)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(def.name, (p1.x + p2.x) / 2, p1.y - 6);
    }
    ctx.restore();
  }
}

function drawOres() {
  const lifespan = STATE.config.oreGroundLifespan;
  for (const o of STATE.run.ores) {
    const s = worldToScreen(o.x, o.y);
    const r = (o.size / 2) * STATE.camera.zoom;
    const isSelected = selectedEntity && selectedEntity.type === 'ore' && selectedEntity.id === o.id;

    let alpha = 1.0;
    if (o.groundTime && lifespan > 0) {
      const remaining = lifespan - o.groundTime;
      if (remaining < 0.8) alpha = Math.max(0, remaining / 0.8);
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = o.color;
    ctx.beginPath();

    if (o.shape === 'diamond') {
      ctx.moveTo(s.x, s.y - r * 1.3); ctx.lineTo(s.x + r * 1.3, s.y);
      ctx.lineTo(s.x, s.y + r * 1.3); ctx.lineTo(s.x - r * 1.3, s.y);
      ctx.closePath(); ctx.fill();
    } else if (o.shape === 'square') {
      ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
    } else {
      ctx.arc(s.x, s.y, Math.max(0.5, r * (alpha < 1 ? 0.6 + 0.4 * alpha : 1)), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = isSelected ? '#7fd0ff' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = isSelected ? 2.5 : 1.2;
    ctx.stroke();
    ctx.restore();
  }
}

function drawEffects() {
  ctx.save();
  for (const exp of explosions) {
    const s = worldToScreen(exp.x, exp.y);
    ctx.strokeStyle = `rgba(255, 71, 87, ${exp.alpha})`;
    ctx.lineWidth = 4 * STATE.camera.zoom;
    ctx.beginPath(); ctx.arc(s.x, s.y, exp.currentRadius * STATE.camera.zoom, 0, Math.PI * 2); ctx.stroke();
  }

  for (const p of particles) {
    const s = worldToScreen(p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(s.x, s.y, (p.size || 3) * STATE.camera.zoom, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawHUD() {
  const hud = document.getElementById('hud');
  if (!hud) return;
  const money = `$${(STATE.run.money || 0).toLocaleString()}`;
  const lifetime = `$${(STATE.run.lifetimeEarnings || 0).toLocaleString()}`;
  const bldgCount = STATE.run.buildings.length;
  const oreCount = STATE.run.ores.length;
  let hudText = `Cash: ${money}  |  Lifetime: ${lifetime}\nPoints: 🌟 ${STATE.meta.prestigePoints} | Keys: 🔑 ${STATE.meta.prestigeKeys} | Shards: 💎 ${STATE.meta.shards} | Dust: 🌌 ${STATE.meta.prestigeDust}\nBuildings: ${bldgCount}  |  Active Ores: ${oreCount}/${STATE.config.maxOres}\n[Controls] Click+Drag: Pan | Scroll: Zoom | E: Shop/Inv | R: Rotate | 1-6: Hotbar`;

  if (mode === 'placing' && placingState) {
    const def = STATE.defs.buildingDefs[placingState.defId];
    const qty = getInventoryQty(placingState.defId);
    hudText += `\nPLACING: ${def ? def.name : ''} (Owned: ${qty}) [R: Rotate | Esc: Cancel]`;
  } else if (mode === 'moving') {
    hudText += `\nMOVING BUILDING [R: Rotate | Esc: Cancel]`;
  }
  hud.textContent = hudText;
}

function hexToRgba(hex, alpha) {
  if (!hex || hex[0] !== '#') return `rgba(100,100,100,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Periodic live save
setInterval(triggerSaveState, 5000);

// Main Animation Loop
function loop(now) { update(now); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
