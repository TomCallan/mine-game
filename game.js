// ===========================================================
// MINER'S HAVEN - PHASER 3 GAME SIMULATION ENGINE & RENDERER
// ===========================================================

let phaserGame = null;
let sceneInstance = null;

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
    isPaused: false,
    totalOresSold: 0,
    bestOreSold: 0
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
      switchGate: true,
      loopGate: true,
      crossoverBelt: true,
      splitter: true,
      merger: true,
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
        produces: { item: 'uraniumOre', rate: 1400 }
      },
      geodeDriller: {
        id: 'geodeDriller', name: 'Crystalline Geode Driller', category: 'extractor', rarity: 'legendary', cost: 2500000, priceGrowth: 1.16,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 2, h: 2 }, layer: 'machine', color: '#7e22ce', speed: 40,
        tags: ['dropper', 'crystal'], attributes: { resonance: 99 },
        ports: [{ dx: 2, dy: 0.5, kind: 'output', color: '#a855f7', dropSide: null }],
        produces: { item: 'crystalOre', rate: 1000 }
      },
      antimatterSiphon: {
        id: 'antimatterSiphon', name: 'Antimatter Siphon', category: 'extractor', rarity: 'mythic', cost: 45000000, priceGrowth: 1.18,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 3, h: 3 }, layer: 'machine', color: '#be185d', speed: 40,
        tags: ['dropper', 'antimatter'], attributes: { containment: 100 },
        ports: [{ dx: 3, dy: 1, kind: 'output', color: '#ec4899', dropSide: null }],
        produces: { item: 'antimatterPellet', rate: 1800 }
      },
      temporalFluxBorer: {
        id: 'temporalFluxBorer', name: 'Temporal Flux Borer', category: 'extractor', rarity: 'legendary', cost: 8000000, priceGrowth: 1.17,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 2, h: 1 }, layer: 'machine', color: '#0e7490', speed: 40,
        tags: ['dropper', 'temporal'], attributes: { timeWarp: true },
        ports: [{ dx: 2, dy: 0, kind: 'output', color: '#06b6d4', dropSide: null }],
        produces: { item: 'timeCrystalOre', rate: 1200 }
      },
      algaeVat: {
        id: 'algaeVat', name: 'Bioluminescent Algae Vat', category: 'extractor', rarity: 'rare', cost: 12000, priceGrowth: 1.12,
        unlockMethod: 'shop', size: { w: 2, h: 2 }, layer: 'machine', color: '#047857', speed: 40,
        tags: ['dropper', 'wet'], attributes: { moisture: 100 },
        ports: [{ dx: 2, dy: 0.5, kind: 'output', color: '#10b981', dropSide: null }],
        produces: { item: 'glowAlgaeOre', rate: 1000 }
      },
      voidHarvester: {
        id: 'voidHarvester', name: 'Cosmic Void Harvester', category: 'extractor', rarity: 'mythic', cost: 150000000, priceGrowth: 1.20,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 3, h: 2 }, layer: 'machine', color: '#1e1b4b', speed: 40,
        tags: ['dropper', 'void'], attributes: { singularity: true },
        ports: [{ dx: 3, dy: 0.5, kind: 'output', color: '#312e81', dropSide: null }],
        produces: { item: 'voidShardOre', rate: 2500 }
      },

      // --- CONVEYORS & UTILITY GATES ---
      belt: {
        id: 'belt', name: 'Standard Conveyor', category: 'belt', rarity: 'common', cost: 25, priceGrowth: 1.05,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#4a5568', speed: 90,
        tags: ['transport'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#7fd0ff', dropSide: 0 }]
      },
      halfBelt: {
        id: 'halfBelt', name: '0.5x1 Narrow Belt', category: 'belt', rarity: 'common', cost: 20, priceGrowth: 1.05,
        unlockMethod: 'shop', size: { w: 0.5, h: 1 }, layer: 'belt', color: '#475569', speed: 90,
        tags: ['transport', 'narrow'], attributes: {}, isHalfBelt: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#7fd0ff', dropSide: 0 }]
      },
      fastBelt: {
        id: 'fastBelt', name: '2x Fast Conveyor', category: 'belt', rarity: 'uncommon', cost: 150, priceGrowth: 1.08,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#2563eb', speed: 180,
        tags: ['transport', 'speed'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#7fd0ff', dropSide: 0 }]
      },
      ultraBelt: {
        id: 'ultraBelt', name: 'Overclocked Mag-Belt', category: 'belt', rarity: 'rare', cost: 850, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#d97706', speed: 320,
        tags: ['transport', 'speed'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#fbbf24', dropSide: 0 }]
      },
      switchGate: {
        id: 'switchGate', name: 'Diverter Switch Gate', category: 'belt', rarity: 'uncommon', cost: 350, priceGrowth: 1.08,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#0891b2', speed: 120,
        tags: ['transport', 'logic', 'gate'], attributes: {}, isSwitchGate: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#e8a030', dropSide: 0 }]
      },
      loopGate: {
        id: 'loopGate', name: 'Loop Counter Gate', category: 'belt', rarity: 'rare', cost: 1200, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#059669', speed: 120,
        tags: ['transport', 'logic', 'loop'], attributes: {}, isLoopGate: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#34d399', dropSide: 0 }]
      },
      filterSorter: {
        id: 'filterSorter', name: 'Smart Status Sorter', category: 'belt', rarity: 'rare', cost: 2500, priceGrowth: 1.12,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#b45309', speed: 120,
        tags: ['transport', 'logic', 'filter'], attributes: {}, isFilterSorter: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#f59e0b', dropSide: 0 }]
      },
      crossoverBelt: {
        id: 'crossoverBelt', name: 'Conveyor Cross-Overpass', category: 'belt', rarity: 'uncommon', cost: 450, priceGrowth: 1.08,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#334155', speed: 120,
        tags: ['transport', 'utility', 'cross'], attributes: {}, isCrossover: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#94a3b8', dropSide: 0 }]
      },
      splitter: {
        id: 'splitter', name: 'Dual Splitter', category: 'belt', rarity: 'uncommon', cost: 300, priceGrowth: 1.08,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#6d28d9', speed: 90,
        tags: ['transport', 'splitter'], attributes: {}, isSplitter: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#c084fc', dropSide: 0 }]
      },
      tripleSplitter: {
        id: 'tripleSplitter', name: '3-Way Splitter', category: 'belt', rarity: 'rare', cost: 1800, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#7c3aed', speed: 120,
        tags: ['transport', 'splitter'], attributes: {}, isSplitter3: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#c084fc', dropSide: 0 }]
      },
      merger: {
        id: 'merger', name: 'Conveyor Merger', category: 'belt', rarity: 'uncommon', cost: 300, priceGrowth: 1.08,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#4338ca', speed: 90,
        tags: ['transport', 'merger'], attributes: {}, isMerger: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#818cf8', dropSide: 0 }]
      },
      heavyMerger: {
        id: 'heavyMerger', name: '3-Way Heavy Merger', category: 'belt', rarity: 'rare', cost: 2200, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'belt', color: '#3730a3', speed: 200,
        tags: ['transport', 'merger'], attributes: {}, isMerger: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#818cf8', dropSide: 0 }]
      },
      magLevRail: {
        id: 'magLevRail', name: 'Mag-Lev Express Rail', category: 'belt', rarity: 'legendary', cost: 1500000, priceGrowth: 1.15,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#0ea5e9', speed: 450,
        tags: ['transport', 'maglev'], attributes: {},
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#38bdf8', dropSide: 0 }]
      },
      phaseShiftBelt: {
        id: 'phaseShiftBelt', name: 'Phase Shift Belt', category: 'belt', rarity: 'exotic', cost: 450000, priceGrowth: 1.14,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#ec4899', speed: 120,
        tags: ['transport', 'phase'], attributes: {}, phasePassable: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#f472b6', dropSide: 0 }]
      },
      gravityInverter: {
        id: 'gravityInverter', name: 'Graviton Inverter Rail', category: 'belt', rarity: 'legendary', cost: 1200000, priceGrowth: 1.15,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#8b5cf6', speed: 150,
        tags: ['transport', 'gravity'], attributes: {}, invertGravity: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#a78bfa', dropSide: 0 }]
      },
      cryoStorageBelt: {
        id: 'cryoStorageBelt', name: 'Cryo-Buffer Conveyor', category: 'belt', rarity: 'rare', cost: 25000, priceGrowth: 1.12,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#06b6d4', speed: 40,
        tags: ['transport', 'cryo'], attributes: {}, cryoPreserve: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#67e8f9', dropSide: 0 }]
      },
      quantumLink: {
        id: 'quantumLink', name: 'Quantum Link Terminal', category: 'belt', rarity: 'mythic', cost: 25000000, priceGrowth: 1.18,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'belt', color: '#10b981', speed: 600,
        tags: ['transport', 'teleport'], attributes: {}, isTeleport: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#34d399', dropSide: 0 }]
      },

      // --- UPGRADERS ---
      upgrader1x1: {
        id: 'upgrader1x1', name: 'Basic Refiner (2.0x)', category: 'upgrader', rarity: 'common', cost: 200, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'machine', color: '#059669', speed: 60,
        tags: ['upgrader', 'multiplier'], attributes: {}, multiplier: 2.0, maxUses: 1,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#34d399', dropSide: 0 }]
      },
      upgraderHalf: {
        id: 'upgraderHalf', name: '0.5x1 Micro Refiner (1.5x)', category: 'upgrader', rarity: 'common', cost: 150, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 0.5, h: 1 }, layer: 'machine', color: '#10b981', speed: 60,
        tags: ['upgrader', 'narrow'], attributes: {}, multiplier: 1.5, maxUses: 1, isHalf: true,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#34d399', dropSide: 0 }]
      },
      upgrader2x1: {
        id: 'upgrader2x1', name: '2x1 Dual-Lane Refiner (3.0x)', category: 'upgrader', rarity: 'rare', cost: 3500, priceGrowth: 1.12,
        unlockMethod: 'shop', size: { w: 2, h: 1 }, layer: 'machine', color: '#047857', speed: 60,
        tags: ['upgrader', 'multiplier'], attributes: {}, multiplier: 3.0, maxUses: 1,
        ports: [
          { dx: 0, dy: 0, kind: 'conveyor', color: '#34d399', dropSide: 0 },
          { dx: 1, dy: 0, kind: 'conveyor', color: '#34d399', dropSide: 0 }
        ]
      },
      freonSprayer: {
        id: 'freonSprayer', name: 'Freon Cooling Chamber', category: 'upgrader', rarity: 'rare', cost: 8500, priceGrowth: 1.12,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'machine', color: '#0284c7', speed: 60,
        tags: ['upgrader', 'extinguisher'], attributes: {}, multiplier: 1.8, appliesWet: 8, extinguishes: true, maxUses: 2,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#38bdf8', dropSide: 0 }]
      },
      pyroRefiner: {
        id: 'pyroRefiner', name: 'Pyro Superheater (3.5x)', category: 'upgrader', rarity: 'epic', cost: 22000, priceGrowth: 1.13,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'machine', color: '#b91c1c', speed: 60,
        tags: ['upgrader', 'flaming'], attributes: {}, multiplier: 3.5, appliesFlaming: true, maxUses: 2,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#f87171', dropSide: 0 }]
      },
      leadDecontaminator: {
        id: 'leadDecontaminator', name: 'Lead Radiation Scrubber', category: 'upgrader', rarity: 'epic', cost: 45000, priceGrowth: 1.14,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'machine', color: '#475569', speed: 60,
        tags: ['upgrader', 'decontamination'], attributes: {}, multiplier: 2.5, removesRadioactive: true, maxUses: 2,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#94a3b8', dropSide: 0 }]
      },
      stellarSparkler: {
        id: 'stellarSparkler', name: 'Stellar Sparkler Infuser', category: 'upgrader', rarity: 'legendary', cost: 650000, priceGrowth: 1.15,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'machine', color: '#ca8a04', speed: 60,
        tags: ['upgrader', 'sparkling'], attributes: {}, appliesSparkling: true, multiplier: 2.5, maxUses: 2,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#facc15', dropSide: 0 }]
      },
      upgraderPlasma: {
        id: 'upgraderPlasma', name: 'Plasma Injector (+$500)', category: 'upgrader', rarity: 'epic', cost: 60000, priceGrowth: 1.14,
        unlockMethod: 'shop', size: { w: 1, h: 1 }, layer: 'machine', color: '#7c3aed', speed: 60,
        tags: ['upgrader', 'flat_add'], attributes: {}, flatAdd: 500, maxUses: 2,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#a78bfa', dropSide: 0 }]
      },
      oreCrystallizer: {
        id: 'oreCrystallizer', name: 'Ore Crystallizer (2.2x)', category: 'upgrader', rarity: 'legendary', cost: 1800000, priceGrowth: 1.15,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 2, h: 1 }, layer: 'machine', color: '#9333ea', speed: 60,
        tags: ['upgrader', 'crystallizer'], attributes: {}, multiplier: 2.2, appliesCrystalline: true, maxUses: 2,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#c084fc', dropSide: 0 }]
      },
      probabilityAmp: {
        id: 'probabilityAmp', name: 'Quantum Probability Amp', category: 'upgrader', rarity: 'exotic', cost: 750000, priceGrowth: 1.14,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 1, h: 1 }, layer: 'machine', color: '#16a34a', speed: 60,
        tags: ['upgrader', 'lucky'], attributes: {}, multiplier: 1.8, appliesLucky: true, maxUses: 2,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#4ade80', dropSide: 0 }]
      },
      entropyStabilizer: {
        id: 'entropyStabilizer', name: 'Entropy Stabilizer (3.0x)', category: 'upgrader', rarity: 'exotic', cost: 3200000, priceGrowth: 1.16,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 2, h: 1 }, layer: 'machine', color: '#0284c7', speed: 60,
        tags: ['upgrader', 'cleanse'], attributes: {}, multiplier: 3.0, nullifiesBadStatuses: true, maxUses: 2,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#38bdf8', dropSide: 0 }]
      },
      resonanceHarmonizer: {
        id: 'resonanceHarmonizer', name: 'Resonance Harmonizer (4.5x)', category: 'upgrader', rarity: 'legendary', cost: 12000000, priceGrowth: 1.16,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 2, h: 2 }, layer: 'machine', color: '#e11d48', speed: 60,
        tags: ['upgrader', 'synergy'], attributes: {}, multiplier: 4.5, sparklingSynergy: true, maxUses: 2,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#fb7185', dropSide: 0 }]
      },
      matterReplicator: {
        id: 'matterReplicator', name: 'Matter Replicator', category: 'upgrader', rarity: 'mythic', cost: 65000000, priceGrowth: 1.18,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 2, h: 1 }, layer: 'machine', color: '#4f46e5', speed: 60,
        tags: ['upgrader', 'replicator'], attributes: {}, duplicatesOre: true, multiplier: 1.5, maxUses: 1,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#818cf8', dropSide: 0 }]
      },
      oreTransmuter: {
        id: 'oreTransmuter', name: 'Ore Transmuter', category: 'upgrader', rarity: 'legendary', cost: 18000000, priceGrowth: 1.17,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 2, h: 2 }, layer: 'machine', color: '#ea580c', speed: 60,
        tags: ['upgrader', 'transmute'], attributes: {}, transmutesOre: true, multiplier: 2.5, maxUses: 1,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#fb923c', dropSide: 0 }]
      },
      shardOfLife: {
        id: 'shardOfLife', name: 'Shard of Life (6.0x)', category: 'upgrader', rarity: 'mythic', cost: 200000000, priceGrowth: 1.20,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 2, h: 2 }, layer: 'machine', color: '#15803d', speed: 60,
        tags: ['upgrader', 'mythic'], attributes: {}, multiplier: 6.0, empowersAdjacent: true, maxUses: 3,
        ports: [{ dx: 0, dy: 0, kind: 'conveyor', color: '#22c55e', dropSide: 0 }]
      },

      // --- SELLERS / SMELTERS ---
      seller: {
        id: 'seller', name: 'Standard Furnace (1.0x)', category: 'seller', rarity: 'common', cost: 100, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 2, h: 2 }, layer: 'machine', color: '#991b1b', speed: 40,
        tags: ['seller'], attributes: {}, consumes: true,
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#ffcf5c', dropSide: null }]
      },
      blastSmelter: {
        id: 'blastSmelter', name: 'Industrial Blast Smelter (2.0x)', category: 'seller', rarity: 'uncommon', cost: 1200, priceGrowth: 1.10,
        unlockMethod: 'shop', size: { w: 2, h: 2 }, layer: 'machine', color: '#b91c1c', speed: 40,
        tags: ['seller', 'multiplier'], attributes: {}, consumes: true, sellerBonus: 2.0,
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#f87171', dropSide: null }]
      },
      cryoSmelter: {
        id: 'cryoSmelter', name: 'Cryo-Quench Smelter (3.0x Wet)', category: 'seller', rarity: 'rare', cost: 15000, priceGrowth: 1.12,
        unlockMethod: 'shop', size: { w: 2, h: 2 }, layer: 'machine', color: '#0369a1', speed: 40,
        tags: ['seller', 'cryo'], attributes: {}, consumes: true, sellerBonus: 1.5, wetBonus: 3.0, flamePenalty: 0.5,
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#38bdf8', dropSide: null }]
      },
      pyroSmelter: {
        id: 'pyroSmelter', name: 'Thermobaric Smelter (4.0x Fire)', category: 'seller', rarity: 'rare', cost: 28000, priceGrowth: 1.13,
        unlockMethod: 'shop', size: { w: 2, h: 2 }, layer: 'machine', color: '#c2410c', speed: 40,
        tags: ['seller', 'flame'], attributes: {}, consumes: true, sellerBonus: 1.5, flameBonus: 4.0, wetDestroys: true,
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#fb923c', dropSide: null }]
      },
      dimensionalVault: {
        id: 'dimensionalVault', name: 'Dimensional Vault (3.5x)', category: 'seller', rarity: 'rare', cost: 45000, priceGrowth: 1.13,
        unlockMethod: 'shop', size: { w: 2, h: 2 }, layer: 'machine', color: '#4338ca', speed: 40,
        tags: ['seller', 'batch'], attributes: {}, consumes: true, sellerBonus: 3.5,
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#818cf8', dropSide: null }]
      },
      catalyticConverter: {
        id: 'catalyticConverter', name: 'Catalytic Converter (4.0x Rad)', category: 'seller', rarity: 'epic', cost: 180000, priceGrowth: 1.14,
        unlockMethod: 'shop', size: { w: 2, h: 2 }, layer: 'machine', color: '#15803d', speed: 40,
        tags: ['seller', 'radioactive'], attributes: {}, consumes: true, sellerBonus: 2.5, radioactiveBonus: 4.0,
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#4ade80', dropSide: null }]
      },
      prismaticSmelter: {
        id: 'prismaticSmelter', name: 'Prismatic Gem Smelter (5.5x)', category: 'seller', rarity: 'legendary', cost: 4500000, priceGrowth: 1.15,
        unlockMethod: 'goldenCrate', crateOnly: true, size: { w: 2, h: 2 }, layer: 'machine', color: '#a16207', speed: 40,
        tags: ['seller', 'sparkling'], attributes: {}, consumes: true, sellerBonus: 3.0, sparklingBonus: 5.5,
        ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#fde047', dropSide: null }]
      },
      singularitySmelter: {
        id: 'singularitySmelter', name: 'Singularity Smelter (7.0x)', category: 'seller', rarity: 'mythic', cost: 35000000, priceGrowth: 1.18,
        unlockMethod: 'exoticCrate', crateOnly: true, size: { w: 3, h: 3 }, layer: 'machine', color: '#581c87', speed: 40,
        tags: ['seller', 'singularity'], attributes: {}, consumes: true, sellerBonus: 7.0, vacuumRadius: 1.5,
        ports: [{ dx: 0, dy: 1, kind: 'input', color: '#c084fc', dropSide: null }]
      },
      soulForge: {
        id: 'soulForge', name: 'Soul Forge (8.0x High Risk)', category: 'seller', rarity: 'mythic', cost: 95000000, priceGrowth: 1.20,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 3, h: 3 }, layer: 'machine', color: '#450a0a', speed: 40,
        tags: ['seller', 'high_risk'], attributes: {}, consumes: true, sellerBonus: 8.0, penaltyRisk: 0.10,
        ports: [{ dx: 0, dy: 1, kind: 'input', color: '#ef4444', dropSide: null }]
      },
      supernovaCrucible: {
        id: 'supernovaCrucible', name: 'Supernova Fusion Crucible (12.0x)', category: 'seller', rarity: 'mythic', cost: 500000000, priceGrowth: 1.22,
        unlockMethod: 'prestigeCrate', crateOnly: true, size: { w: 3, h: 3 }, layer: 'machine', color: '#7c2d12', speed: 40,
        tags: ['seller', 'supernova'], attributes: {}, consumes: true, sellerBonus: 5.0, supernovaBonus: 12.0, minSupernovaValue: 10000,
        ports: [{ dx: 0, dy: 1, kind: 'input', color: '#fdba74', dropSide: null }]
      }
    }
  },

  camera: {
    x: 0,
    y: 0,
    zoom: 1.0
  },

  stats: {
    totalOresCreated: 0,
    totalOresSold: 0,
    buildingsPlaced: 0,
    cratesOpened: 0
  },

  activeSaveSlot: 0
};

// ===========================================================
// CORE GRID & TRANSFORMATION MATH
// ===========================================================

let idCounters = {};
function genId(prefix) {
  if (!idCounters[prefix]) idCounters[prefix] = 0;
  return `${prefix}_${++idCounters[prefix]}_${Date.now()}`;
}

function dirVector(rot) {
  switch (rot % 4) {
    case 0: return { x: 1, y: 0 };
    case 1: return { x: 0, y: 1 };
    case 2: return { x: -1, y: 0 };
    case 3: return { x: 0, y: -1 };
    default: return { x: 1, y: 0 };
  }
}

function getFootprint(def, rot) {
  let w = def.size.w, h = def.size.h;
  if (rot % 2 === 1) { const t = w; w = h; h = t; }

  const ports = (def.ports || []).map(p => {
    let px = p.dx, py = p.dy;
    switch (rot % 4) {
      case 0: break;
      case 1: px = def.size.h - 1 - p.dy; py = p.dx; break;
      case 2: px = def.size.w - 1 - p.dx; py = def.size.h - 1 - p.dy; break;
      case 3: px = p.dy; py = def.size.w - 1 - p.dx; break;
    }
    const dropSide = p.dropSide !== null && p.dropSide !== undefined ? (p.dropSide + rot) % 4 : null;
    return { ...p, dx: px, dy: py, dropSide };
  });

  return { w, h, ports };
}

function worldToCell(wx, wy) {
  const cs = STATE.config.grid.cellSize;
  let placingDef = null;
  let activeRot = 0;

  if (mode === 'placing' && placingState) {
    placingDef = STATE.defs.buildingDefs[placingState.defId];
    activeRot = placingState.rot || 0;
  } else if (mode === 'moving' && movingState) {
    const b = findBuildingById(movingState.buildingId);
    if (b) {
      placingDef = STATE.defs.buildingDefs[b.defId];
      activeRot = movingState.rot || 0;
    }
  }

  if (placingDef && (placingDef.isHalfBelt || placingDef.isHalf)) {
    const fp = getFootprint(placingDef, activeRot);
    let col = Math.floor(wx / cs);
    let row = Math.floor(wy / cs);
    const subX = (wx % cs + cs) % cs / cs;
    const subY = (wy % cs + cs) % cs / cs;

    if (fp.w < 1) col += (subX >= 0.5 ? 0.5 : 0);
    if (fp.h < 1) row += (subY >= 0.5 ? 0.5 : 0);
    return { col, row };
  }

  return {
    col: Math.floor(wx / cs),
    row: Math.floor(wy / cs)
  };
}

function cellToWorld(col, row) {
  const cs = STATE.config.grid.cellSize;
  return { x: col * cs, y: row * cs };
}

function screenToWorld(sx, sy) {
  if (sceneInstance && sceneInstance.cameras && sceneInstance.cameras.main) {
    const p = sceneInstance.cameras.main.getWorldPoint(sx, sy);
    return { x: p.x, y: p.y };
  }
  const zoom = STATE.camera.zoom;
  return {
    x: sx / zoom + STATE.camera.x,
    y: sy / zoom + STATE.camera.y
  };
}

function worldToScreen(wx, wy) {
  if (sceneInstance && sceneInstance.cameras && sceneInstance.cameras.main) {
    const cam = sceneInstance.cameras.main;
    return {
      x: (wx - cam.scrollX) * cam.zoom,
      y: (wy - cam.scrollY) * cam.zoom
    };
  }
  const zoom = STATE.camera.zoom;
  return {
    x: (wx - STATE.camera.x) * zoom,
    y: (wy - STATE.camera.y) * zoom
  };
}

function wouldOverlapAt(def, col, row, rot, ignoreBuildingId = null) {
  const fp = getFootprint(def, rot);
  const grid = STATE.config.grid;
  if (col < 0 || row < 0 || col + fp.w > grid.cols || row + fp.h > grid.rows) {
    return true;
  }
  for (const b of STATE.run.buildings) {
    if (ignoreBuildingId && b.id === ignoreBuildingId) continue;
    const bDef = STATE.defs.buildingDefs[b.defId];
    if (!bDef) continue;
    const bfp = getFootprint(bDef, b.rot);
    if (col < b.col + bfp.w && col + fp.w > b.col &&
        row < b.row + bfp.h && row + fp.h > b.row) {
      return true;
    }
  }
  return false;
}

function clampedOrigin(w, h, col, row) {
  const grid = STATE.config.grid;
  return {
    col: Math.max(0, Math.min(grid.cols - w, col)),
    row: Math.max(0, Math.min(grid.rows - h, row))
  };
}

function findBuildingAtCell(col, row) {
  for (const b of STATE.run.buildings) {
    const def = STATE.defs.buildingDefs[b.defId];
    if (!def) continue;
    const fp = getFootprint(def, b.rot);
    if (col >= b.col && col < b.col + fp.w && row >= b.row && row < b.row + fp.h) {
      return b;
    }
  }
  return null;
}

function findBuildingById(id) {
  return STATE.run.buildings.find(b => b.id === id);
}

function getCellOccupants(col, row) {
  const results = [];
  for (const b of STATE.run.buildings) {
    const def = STATE.defs.buildingDefs[b.defId];
    if (!def) continue;
    const fp = getFootprint(def, b.rot);
    if (col >= b.col && col < b.col + fp.w && row >= b.row && row < b.row + fp.h) {
      results.push({ building: b, def, isPort: false });
    }
    for (const p of fp.ports) {
      if (Math.floor(b.col + p.dx) === Math.floor(col) && Math.floor(b.row + p.dy) === Math.floor(row)) {
        results.push({ building: b, def, isPort: true, port: p });
      }
    }
  }
  return results;
}

function getTransportPortAt(col, row) {
  for (const b of STATE.run.buildings) {
    const def = STATE.defs.buildingDefs[b.defId];
    if (!def) continue;
    const fp = getFootprint(def, b.rot);
    if (def.category === 'belt' || def.category === 'upgrader') {
      if (col >= b.col && col < b.col + fp.w && row >= b.row && row < b.row + fp.h) {
        return { building: b, def, port: fp.ports[0] || { dropSide: b.rot } };
      }
    }
    for (const p of fp.ports) {
      if (Math.floor(b.col + p.dx) === Math.floor(col) && Math.floor(b.row + p.dy) === Math.floor(row)) {
        return { building: b, def, port: p };
      }
    }
  }
  return null;
}

// ===========================================================
// INTERACTION MODES & PLACEMENT LOGIC
// ===========================================================

let mode = 'idle';
let placingState = null;
let movingState = null;
let selectedEntity = null;
let activeContextBuilding = null;
let mouseScreen = { x: 0, y: 0 };
let isBeltDragging = false;
let beltDragStart = null;
let placementFlashTime = 0;

function setMode(newMode) {
  mode = newMode;
  const container = document.getElementById('game-container');
  if (container) {
    container.classList.remove('mode-placing', 'mode-moving', 'mode-inspecting');
    if (mode === 'placing') container.classList.add('mode-placing');
    else if (mode === 'moving') container.classList.add('mode-moving');
    else if (mode === 'inspecting') container.classList.add('mode-inspecting');
  }
  if (typeof updateModeBadge === 'function') updateModeBadge();
}

function cancelMode() {
  placingState = null;
  movingState = null;
  isBeltDragging = false;
  beltDragStart = null;
  setMode('idle');
}

function enterPlacingMode(defId) {
  if (!STATE.defs.buildingDefs[defId]) return;
  placingState = { defId, rot: 0 };
  setMode('placing');
}

function enterMovingMode(building) {
  movingState = { buildingId: building.id, rot: building.rot };
  setMode('moving');
}

function enterInspectMode() {
  setMode('inspecting');
}

function tryPlaceBuilding(defId, col, row, rot) {
  const def = STATE.defs.buildingDefs[defId];
  if (!def) return false;

  const currentQty = getInventoryQty(defId);
  if (currentQty <= 0) {
    showToast(`Out of inventory: ${def.name}`, 'warn');
    return false;
  }

  if (wouldOverlapAt(def, col, row, rot)) {
    showToast('Cannot place: Space occupied or out of bounds', 'warn');
    return false;
  }

  const building = {
    id: genId('b'),
    defId,
    col,
    row,
    rot,
    createdAt: Date.now(),
    walls: [false, false, false, false],
    fuelTimer: def.requiresFuel ? (def.attributes.runDurationSec || 8) : 0,
    activeBranch: 0,
    targetLoops: 3,
    filterMode: 'unrefined'
  };

  STATE.run.buildings.push(building);
  removeFromInventory(defId, 1);
  STATE.stats.buildingsPlaced++;
  placementFlashTime = 0.25;

  if (sceneInstance && sceneInstance.spawnPlacementBurst) {
    const cs = STATE.config.grid.cellSize;
    const fp = getFootprint(def, rot);
    sceneInstance.spawnPlacementBurst((col + fp.w / 2) * cs, (row + fp.h / 2) * cs, def.color);
  }

  if (typeof renderHotbar === 'function') renderHotbar();
  triggerSaveState();
  return true;
}

function tryMoveBuilding(building, newCol, newRow, newRot) {
  const def = STATE.defs.buildingDefs[building.defId];
  if (!def) return false;

  if (wouldOverlapAt(def, newCol, newRow, newRot, building.id)) {
    showToast('Cannot move: Space occupied', 'warn');
    return false;
  }

  building.col = newCol;
  building.row = newRow;
  building.rot = newRot;
  triggerSaveState();
  return true;
}

function demolishBuilding(building) {
  const idx = STATE.run.buildings.findIndex(b => b.id === building.id);
  if (idx === -1) return;

  STATE.run.buildings.splice(idx, 1);
  addToInventory(building.defId, 1);
  if (selectedEntity && selectedEntity.type === 'building' && selectedEntity.id === building.id) {
    selectedEntity = null;
  }

  if (sceneInstance && sceneInstance.spawnDemolishBurst) {
    const cs = STATE.config.grid.cellSize;
    const def = STATE.defs.buildingDefs[building.defId];
    const fp = getFootprint(def || { size: { w: 1, h: 1 }, ports: [] }, building.rot);
    sceneInstance.spawnDemolishBurst((building.col + fp.w / 2) * cs, (building.row + fp.h / 2) * cs);
  }

  if (typeof renderHotbar === 'function') renderHotbar();
  triggerSaveState();
}

function deleteBuilding(building) {
  return demolishBuilding(building);
}

function rotateBuildingInPlace(building) {
  if (!building) return false;
  const def = STATE.defs.buildingDefs[building.defId];
  if (!def) return false;

  const nextRot = (building.rot + 1) % 4;
  if (wouldOverlapAt(def, building.col, building.row, nextRot, building.id)) {
    return false;
  }

  building.rot = nextRot;
  triggerSaveState();
  return true;
}

function handleClickAction(worldX, worldY) {
  if (mode === 'placing' && placingState) {
    const def = STATE.defs.buildingDefs[placingState.defId];
    const fp = getFootprint(def, placingState.rot);
    const raw = worldToCell(worldX, worldY);
    const origin = clampedOrigin(fp.w, fp.h, raw.col, raw.row);
    tryPlaceBuilding(placingState.defId, origin.col, origin.row, placingState.rot);
  } else if (mode === 'moving' && movingState) {
    const building = findBuildingById(movingState.buildingId);
    if (building) {
      const def = STATE.defs.buildingDefs[building.defId];
      const fp = getFootprint(def, movingState.rot);
      const raw = worldToCell(worldX, worldY);
      const origin = clampedOrigin(fp.w, fp.h, raw.col, raw.row);
      tryMoveBuilding(building, origin.col, origin.row, movingState.rot);
    }
    cancelMode();
  } else if (mode === 'inspecting') {
    selectEntityAt(worldX, worldY);
  } else if (mode === 'idle') {
    // Interactive In-World Machine Toggling
    const cell = worldToCell(worldX, worldY);
    const b = findBuildingAtCell(cell.col, cell.row);
    if (b) {
      const def = STATE.defs.buildingDefs[b.defId];
      if (def) {
        if (def.isSwitchGate) {
          b.activeBranch = (b.activeBranch === 1 ? 0 : 1);
          showToast(`Switch Gate: ${b.activeBranch === 0 ? 'STRAIGHT (0°)' : 'DIVERT (90°)'}`, 'info');
          triggerSaveState();
          return;
        }
        if (def.isLoopGate) {
          const loopSteps = [1, 2, 3, 5, 10];
          const cur = b.targetLoops || 3;
          const nxt = loopSteps[(loopSteps.indexOf(cur) + 1) % loopSteps.length];
          b.targetLoops = nxt;
          showToast(`Loop Gate: Target ${nxt} Loops`, 'info');
          triggerSaveState();
          return;
        }
        if (def.isFilterSorter) {
          const modes = ['unrefined', 'valuable', 'wet'];
          const cur = b.filterMode || 'unrefined';
          const nxt = modes[(modes.indexOf(cur) + 1) % modes.length];
          b.filterMode = nxt;
          showToast(`Filter Sorter: ${nxt.toUpperCase()}`, 'info');
          triggerSaveState();
          return;
        }
      }
    }
  }
}

function selectEntityAt(worldX, worldY) {
  const cell = worldToCell(worldX, worldY);
  const b = findBuildingAtCell(cell.col, cell.row);
  if (b) {
    selectedEntity = { type: 'building', id: b.id };
    if (typeof updateInspector === 'function') updateInspector(b);
    return;
  }
  for (const ore of STATE.run.ores) {
    const dx = ore.x - worldX, dy = ore.y - worldY;
    if (dx * dx + dy * dy < (ore.size * 1.5) ** 2) {
      selectedEntity = { type: 'ore', id: ore.id };
      if (typeof updateInspector === 'function') updateInspector(ore);
      return;
    }
  }
  selectedEntity = null;
}

// ===========================================================
// SIMULATION ENGINE & ORE PHYSICS
// ===========================================================

let extractorTimers = {};
const explosions = [];
const particles = [];
const salesHistory = [];

function triggerExplosion(x, y, radius = 50) {
  explosions.push({ x, y, maxRadius: radius, currentRadius: 0, alpha: 1.0 });
  if (sceneInstance && sceneInstance.spawnExplosionBurst) {
    sceneInstance.spawnExplosionBurst(x, y);
  }
}

function updateExtractors(dt) {
  const cs = STATE.config.grid.cellSize;
  for (const b of STATE.run.buildings) {
    const def = STATE.defs.buildingDefs[b.defId];
    if (!def || !def.produces) continue;

    if (def.requiresFuel) {
      if (!b.fuelTimer || b.fuelTimer <= 0) continue;
      b.fuelTimer = Math.max(0, b.fuelTimer - dt);
    }

    if (!extractorTimers[b.id]) extractorTimers[b.id] = 0;
    extractorTimers[b.id] += dt * 1000;

    const rate = def.produces.rate || 1000;
    if (extractorTimers[b.id] >= rate) {
      extractorTimers[b.id] -= rate;
      if (STATE.run.ores.length >= STATE.config.maxOres) continue;

      const itemDef = STATE.defs.itemDefs[def.produces.item];
      if (!itemDef) continue;

      const fp = getFootprint(def, b.rot);
      const outPort = fp.ports.find(p => p.kind === 'output');
      if (!outPort) continue;

      const spawnX = (b.col + outPort.dx + 0.5) * cs;
      const spawnY = (b.row + outPort.dy + 0.5) * cs;
      const dv = dirVector(b.rot);

      STATE.run.ores.push({
        id: genId('ore'),
        itemType: itemDef.id,
        x: spawnX,
        y: spawnY,
        vx: dv.x * 60,
        vy: dv.y * 60,
        size: itemDef.size,
        color: itemDef.color,
        shape: itemDef.shape,
        value: itemDef.baseValue,
        energy: 0,
        status: { ...(itemDef.defaultStatus || {}) },
        isFuel: !!itemDef.isFuel,
        upgradersPassed: [],
        upgraderUses: {}
      });
      STATE.stats.totalOresCreated++;
    }
  }
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

    // 1. Elemental Status Effects
    if (ore.status.wet > 0) {
      ore.status.wet = Math.max(0, ore.status.wet - dt);
      if (ore.status.flaming) { ore.status.flaming = false; ore.status.flameTime = 0; }
    }

    if (ore.status.flaming) {
      if (ore.status.wet > 0) {
        ore.status.flaming = false;
      } else {
        ore.status.flameTime = (ore.status.flameTime || 0) + dt;
        if (ore.status.flameTime >= 4.0) {
          ore.destroyed = true;
          triggerExplosion(ore.x, ore.y, 60);
          continue;
        }
      }
    }

    if (ore.status.timeAged) {
      ore.travelTime = (ore.travelTime || 0) + dt;
      if (ore.travelTime <= 10) ore.value += Math.round(50 * dt);
    }

    // 2. Transport Physics & Machine Upgrades
    const cell = worldToCell(ore.x, ore.y);
    const transport = getTransportPortAt(cell.col, cell.row);
    let targetVx = 0, targetVy = 0, blend;

    if (transport) {
      ore.groundTime = 0;
      const b = transport.building;
      const def = transport.def;

      // Fueled extractor loading
      if (def.requiresFuel && transport.port.kind === 'input' && ore.isFuel) {
        b.fuelTimer = (b.fuelTimer || 0) + (def.attributes.runDurationSec || 8);
        ore.destroyed = true;
        showToast(`Fuel Loaded! Running for ${Math.round(b.fuelTimer)}s.`);
        continue;
      }

      // Upgrader processing with maxUses limit allowing loops on the same machine
      if (def.category === 'upgrader') {
        ore.upgraderBuildingUses = ore.upgraderBuildingUses || {};
        const currentUses = ore.upgraderBuildingUses[b.id] || 0;
        const maxAllowed = def.maxUses || 5;

        if (ore.lastUpgraderBuildingId !== b.id && currentUses < maxAllowed) {
          ore.lastUpgraderBuildingId = b.id;
          ore.upgraderBuildingUses[b.id] = currentUses + 1;

          if (def.extinguishes) { ore.status.flaming = false; ore.status.flameTime = 0; ore.energy = 0; ore.extinguished = true; }
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

          let effectiveMulti = def.multiplier || 1.0;
          if (def.multiplier && ore.status.sparkling) effectiveMulti += 0.5;
          if (def.multiplier && ore.status.crystalline) effectiveMulti += 0.75;
          if (def.multiplier && def.sparklingSynergy && ore.status.sparkling) effectiveMulti *= 1.5;

          if (ore.status.lucky && def.multiplier) {
            effectiveMulti *= 2.0;
            ore.status.lucky = false;
          }

          if (def.multiplier) {
            ore.value = Math.round(ore.value * effectiveMulti);
            ore.upgraded = true;
          }
          if (def.flatAdd) {
            ore.value += def.flatAdd;
            ore.upgraded = true;
          }

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
              upgraderBuildingUses: { ...ore.upgraderBuildingUses }
            });
          }
        }
      } else if (ore.lastUpgraderBuildingId) {
        ore.lastUpgraderBuildingId = null;
      }

      // Conveyor & Gate Routing
      let currentDropSide = transport.port.dropSide;
      if (def.isSwitchGate) {
        currentDropSide = (b.activeBranch === 1 ? (b.rot + 1) % 4 : b.rot);
      } else if (def.isLoopGate) {
        ore.loopCounts = ore.loopCounts || {};
        if (ore.lastLoopGate !== b.id) {
          ore.lastLoopGate = b.id;
          ore.loopCounts[b.id] = (ore.loopCounts[b.id] || 0) + 1;
        }
        const targetLoops = b.targetLoops || 3;
        currentDropSide = (ore.loopCounts[b.id] || 1) < targetLoops ? (b.rot + 1) % 4 : b.rot;
      } else if (def.isFilterSorter) {
        const fMode = b.filterMode || 'unrefined';
        let match = false;
        if (fMode === 'unrefined') match = !!(ore.status && (ore.status.flaming || ore.status.radioactive));
        else if (fMode === 'valuable') match = (ore.value >= 1000);
        else if (fMode === 'wet') match = !!(ore.status && ore.status.wet > 0);
        currentDropSide = match ? (b.rot + 1) % 4 : b.rot;
      } else if (def.isCrossover) {
        if (Math.abs(ore.vx) > Math.abs(ore.vy)) {
          currentDropSide = ore.vx >= 0 ? 0 : 2;
        } else {
          currentDropSide = ore.vy >= 0 ? 1 : 3;
        }
      } else if (def.isSplitter3) {
        if (ore.splitter3Id !== b.id) {
          ore.splitter3Id = b.id;
          b.splitCount = (b.splitCount || 0) + 1;
        }
        const branches = [(b.rot + 3) % 4, b.rot, (b.rot + 1) % 4];
        currentDropSide = branches[(b.splitCount || 0) % 3];
      } else if (def.isSplitter) {
        if (ore.splitterBuildingId !== b.id) {
          ore.splitterBuildingId = b.id; b.splitCount = (b.splitCount || 0) + 1;
          currentDropSide = (b.rot + (b.splitCount % 2 === 0 ? 0 : 1)) % 4;
        } else { currentDropSide = (b.rot + (b.splitCount % 2 === 0 ? 0 : 1)) % 4; }
      } else if (def.isMerger) { currentDropSide = b.rot; }

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

    // Side-Placed Beam Upgraders (e.g. Tesla Induction Beam, Laser Scanner placed adjacent to belts)
    for (const b of STATE.run.buildings) {
      const bDef = STATE.defs.buildingDefs[b.defId];
      if (!bDef || !bDef.isSideBeam) continue;

      const dv = dirVector(b.rot);
      const targetCol = b.col + dv.x;
      const targetRow = b.row + dv.y;
      const targetCenterX = (targetCol + 0.5) * cs;
      const targetCenterY = (targetRow + 0.5) * cs;

      const dx = targetCenterX - ore.x;
      const dy = targetCenterY - ore.y;
      if (dx * dx + dy * dy < (cs * 0.58) * (cs * 0.58)) {
        ore.upgraderBuildingUses = ore.upgraderBuildingUses || {};
        const currentUses = ore.upgraderBuildingUses[b.id] || 0;
        const maxAllowed = bDef.maxUses || 6;

        if (ore.lastUpgraderBuildingId !== b.id && currentUses < maxAllowed) {
          ore.lastUpgraderBuildingId = b.id;
          ore.upgraderBuildingUses[b.id] = currentUses + 1;

          if (bDef.appliesSparkling) ore.status.sparkling = true;
          if (bDef.appliesCrystalline) ore.status.crystalline = true;
          if (bDef.multiplier) {
            ore.value = Math.round(ore.value * bDef.multiplier);
            ore.upgraded = true;
          }

          if (sceneInstance && sceneInstance.spawnPlacementBurst) {
            sceneInstance.spawnPlacementBurst(ore.x, ore.y, bDef.color || '#38bdf8');
          }
        }
      }
    }

    // Singularity Gravitational Pull
    for (const b of STATE.run.buildings) {
      const bDef = STATE.defs.buildingDefs[b.defId];
      if (bDef && bDef.vacuumRadius) {
        const centerX = (b.col + bDef.size.w / 2) * cs;
        const centerY = (b.row + bDef.size.h / 2) * cs;
        const dx = centerX - ore.x, dy = centerY - ore.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bDef.vacuumRadius * cs * 2 && dist > 1) {
          const pull = (1 - dist / (bDef.vacuumRadius * cs * 2)) * 140 * dt;
          ore.x += (dx / dist) * pull;
          ore.y += (dy / dist) * pull;
        }
      }
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
  const now = performance.now();

  for (let i = STATE.run.ores.length - 1; i >= 0; i--) {
    const ore = STATE.run.ores[i];
    if (!ore || ore.destroyed) continue;

    let sellerBuilding = null;
    let sDef = null;

    // Check direct collision with any placed seller (entire footprint + 8px suction margin)
    for (const b of STATE.run.buildings) {
      const def = STATE.defs.buildingDefs[b.defId];
      if (!def || def.category !== 'seller') continue;

      const fp = getFootprint(def, b.rot);
      const minX = b.col * cs;
      const maxX = (b.col + fp.w) * cs;
      const minY = b.row * cs;
      const maxY = (b.row + fp.h) * cs;

      if (ore.x >= minX - 8 && ore.x <= maxX + 8 && ore.y >= minY - 8 && ore.y <= maxY + 8) {
        sellerBuilding = b;
        sDef = def;
        break;
      }
    }

    if (sellerBuilding && sDef) {
      let soldVal = ore.value;

      if (sDef.sellerBonus) soldVal = Math.round(soldVal * sDef.sellerBonus);
      if (sDef.wetBonus && ore.status && (ore.status.wet > 0 || ore.extinguished)) {
        soldVal = Math.round(soldVal * sDef.wetBonus);
      }
      if (sDef.flamePenalty && ore.status && ore.status.flaming) {
        soldVal = Math.round(soldVal * sDef.flamePenalty);
      }
      if (sDef.flameBonus && ore.status && ore.status.flaming) {
        soldVal = Math.round(soldVal * sDef.flameBonus);
      }
      if (sDef.wetDestroys && ore.status && ore.status.wet > 0) {
        soldVal = 0;
        showToast('Thermobaric Smelter vaporized wet ore!', 'warn');
      }
      if (sDef.radioactiveBonus && ore.status && ore.status.radioactive) {
        soldVal = Math.round(soldVal * sDef.radioactiveBonus);
      }
      if (sDef.sparklingBonus && ore.status && (ore.status.sparkling || ore.status.crystalline)) {
        soldVal = Math.round(soldVal * sDef.sparklingBonus);
      }
      if (sDef.supernovaBonus && ore.value >= (sDef.minSupernovaValue || 5000)) {
        const effects = Object.keys(ore.status || {}).filter(k => ore.status[k]).length;
        if (effects >= 2) {
          soldVal = Math.round(soldVal * sDef.supernovaBonus);
          showToast(`Supernova Fusion! Sold for $${soldVal.toLocaleString()}!`, 'success');
        }
      }
      if (sDef.penaltyRisk && Math.random() < sDef.penaltyRisk) {
        soldVal = 0;
        showToast('Soul Forge destroyed ore with no payout!', 'warn');
      }

      // Life level & permanent upgrades bonus
      const lifeBonus = 1 + (STATE.meta.prestigeCount || 0) * 0.05;
      soldVal = Math.round(soldVal * lifeBonus);

      STATE.run.money += soldVal;
      STATE.run.lifetimeEarnings += soldVal;
      ore.destroyed = true;

      salesHistory.push({ t: now, val: soldVal });
      if (!STATE.run.bestOreSold || soldVal > STATE.run.bestOreSold) {
        STATE.run.bestOreSold = soldVal;
      }
      STATE.run.totalOresSold = (STATE.run.totalOresSold || 0) + 1;

      // Spawn floating payout text in Phaser scene
      if (sceneInstance && sceneInstance.spawnFloatingPayout && soldVal > 0) {
        sceneInstance.spawnFloatingPayout(ore.x, ore.y, soldVal);
      }
    }
  }

  STATE.run.ores = STATE.run.ores.filter(o => !o.destroyed);

  while (salesHistory.length > 0 && now - salesHistory[0].t > 3000) {
    salesHistory.shift();
  }
}

// ===========================================================
// SAVE / LOAD SYSTEM & SLOTS
// ===========================================================

async function fetchSaveSlots() {
  const slots = [
    { slot: 0, name: 'Save Slot 1', timestamp: null, exists: false },
    { slot: 1, name: 'Save Slot 2', timestamp: null, exists: false },
    { slot: 2, name: 'Save Slot 3', timestamp: null, exists: false }
  ];

  try {
    const res = await fetch('/api/saves');
    if (res.ok) {
      const serverSlots = await res.json();
      if (Array.isArray(serverSlots)) {
        serverSlots.forEach(s => {
          if (slots[s.slot]) {
            slots[s.slot] = s;
          }
        });
      }
    }
  } catch (e) {}

  // Check localStorage for offline / fallback slots
  for (let i = 0; i < 3; i++) {
    try {
      const localData = localStorage.getItem(`miners_haven_save_slot_${i}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed && parsed.savedAt) {
          if (!slots[i].exists || new Date(parsed.savedAt) > new Date(slots[i].timestamp || 0)) {
            slots[i] = {
              slot: i,
              name: parsed.slotName || `Save Slot ${i + 1}`,
              timestamp: parsed.savedAt,
              exists: true
            };
          }
        }
      }
    } catch (e) {}
  }

  return slots;
}

async function saveToSlot(slot, name) {
  try {
    STATE.activeSaveSlot = slot;
    const payload = {
      slotName: name || `Save Slot ${slot + 1}`,
      savedAt: new Date().toISOString(),
      state: STATE
    };

    // 1. Instant local persistence
    try {
      localStorage.setItem(`miners_haven_save_slot_${slot}`, JSON.stringify(payload));
      localStorage.setItem('miners_haven_active_slot', String(slot));
    } catch (e) {}

    // 2. Server file persistence
    try {
      await fetch(`/api/save/${slot}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    showToast(`Saved to Slot ${slot + 1} (${payload.slotName})!`, 'success');
    return true;
  } catch (e) {
    showToast('Failed to save slot', 'warn');
  }
  return false;
}

async function loadFromSlot(slot) {
  try {
    let data = null;

    // 1. Try server first
    try {
      const res = await fetch(`/api/load/${slot}`);
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {}

    // 2. Fallback to localStorage
    if (!data || !data.state) {
      try {
        const local = localStorage.getItem(`miners_haven_save_slot_${slot}`);
        if (local) data = JSON.parse(local);
      } catch (e) {}
    }

    if (data && data.state) {
      migrateSavedState(data.state);
      STATE.activeSaveSlot = slot;
      try { localStorage.setItem('miners_haven_active_slot', String(slot)); } catch (e) {}
      showToast(`Loaded Slot ${slot + 1} (${data.slotName || 'Save'})!`, 'success');
      if (typeof renderHotbar === 'function') renderHotbar();
      if (typeof renderInventoryGrid === 'function') renderInventoryGrid();
      return true;
    }
  } catch (e) {
    showToast('Failed to load slot', 'warn');
  }
  return false;
}

async function deleteSlot(slot) {
  try {
    try { localStorage.removeItem(`miners_haven_save_slot_${slot}`); } catch (e) {}
    try { await fetch(`/api/save/${slot}`, { method: 'DELETE' }); } catch (e) {}
    showToast(`Slot ${slot + 1} deleted`, 'info');
    return true;
  } catch (e) {
    showToast('Failed to delete slot', 'warn');
  }
  return false;
}

function newGame() {
  STATE.run = {
    money: 1000,
    lifetimeEarnings: 0,
    buildings: [],
    ores: [],
    timeScale: 1.0,
    isPaused: false,
    totalOresSold: 0,
    bestOreSold: 0
  };
  STATE.shop.stock = {};
  STATE.shop.dynamicPriceLevel = {};
  STATE.inventory = {
    capacity: 40,
    items: {
      extractor: { qty: 2, permanent: false, source: 'starter' },
      belt: { qty: 10, permanent: false, source: 'starter' },
      upgrader1x1: { qty: 1, permanent: false, source: 'starter' },
      seller: { qty: 1, permanent: false, source: 'starter' }
    },
    permanentItems: {},
    consumables: {}
  };
  STATE.meta = {
    prestigePoints: 0,
    prestigeKeys: 0,
    blueprintUnlocks: {
      extractor: true,
      belt: true,
      fastBelt: true,
      halfBelt: true,
      switchGate: true,
      loopGate: true,
      crossoverBelt: true,
      splitter: true,
      merger: true,
      upgrader1x1: true,
      upgraderHalf: true,
      seller: true,
      coalExtractor: true
    },
    relics: {},
    shards: 0,
    prestigeDust: 0,
    collection: {}
  };

  selectedEntity = null;
  cancelMode();
  showToast('Started a fresh new game!', 'info');
  if (typeof renderHotbar === 'function') renderHotbar();
  if (typeof renderInventoryGrid === 'function') renderInventoryGrid();
  triggerSaveState();
}

let autoSaveDebounce = null;
function triggerSaveState() {
  clearTimeout(autoSaveDebounce);
  autoSaveDebounce = setTimeout(() => {
    const slot = STATE.activeSaveSlot || 0;
    const payload = {
      slotName: `Slot ${slot + 1}`,
      savedAt: new Date().toISOString(),
      state: STATE
    };

    try {
      localStorage.setItem(`miners_haven_save_slot_${slot}`, JSON.stringify(payload));
    } catch (e) {}

    fetch(`/api/save/${slot}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }, 400);
}

function loadSavedState() {
  const activeSlot = parseInt(localStorage.getItem('miners_haven_active_slot') || '0', 10);
  STATE.activeSaveSlot = activeSlot;

  loadFromSlot(activeSlot).then(loaded => {
    if (!loaded && activeSlot !== 0) {
      loadFromSlot(0);
    }
  });
}

function loadSavedGame() {
  return loadSavedState();
}

function migrateSavedState(saved) {
  if (!saved) return;
  if (saved.run) {
    STATE.run = { ...STATE.run, ...saved.run };
    if (!STATE.run.buildings) STATE.run.buildings = [];
    if (!STATE.run.ores) STATE.run.ores = [];
  }
  if (saved.shop) STATE.shop = { ...STATE.shop, ...saved.shop };
  if (saved.inventory) STATE.inventory = { ...STATE.inventory, ...saved.inventory };
  if (saved.meta) {
    STATE.meta = { ...STATE.meta, ...saved.meta };
    if (!STATE.meta.blueprintUnlocks) STATE.meta.blueprintUnlocks = {};
  }
  ['extractor', 'belt', 'fastBelt', 'halfBelt', 'switchGate', 'loopGate', 'crossoverBelt', 'splitter', 'merger', 'upgrader1x1', 'upgraderHalf', 'seller', 'coalExtractor'].forEach(id => {
    STATE.meta.blueprintUnlocks[id] = true;
  });
}

// ===========================================================
// INVENTORY & CRATE LOGIC
// ===========================================================

function getInventoryQty(defId) {
  const item = STATE.inventory.items[defId];
  return item ? item.qty : 0;
}

function addToInventory(defId, qty = 1, permanent = false) {
  if (!STATE.inventory.items[defId]) {
    STATE.inventory.items[defId] = { qty: 0, permanent, source: 'reward' };
  }
  STATE.inventory.items[defId].qty += qty;
  if (permanent) {
    STATE.inventory.items[defId].permanent = true;
    if (!STATE.inventory.permanentItems) STATE.inventory.permanentItems = {};
    STATE.inventory.permanentItems[defId] = true;
  }
  if (STATE.meta && STATE.meta.blueprintUnlocks) {
    STATE.meta.blueprintUnlocks[defId] = true;
  }
}

function removeFromInventory(defId, qty = 1) {
  if (!STATE.inventory.items[defId]) return false;
  if (STATE.inventory.items[defId].qty < qty) return false;
  STATE.inventory.items[defId].qty -= qty;
  if (STATE.inventory.items[defId].qty <= 0 && !STATE.inventory.items[defId].permanent) {
    delete STATE.inventory.items[defId];
  }
  return true;
}

function getShopItemPrice(defId) {
  const def = STATE.defs.buildingDefs[defId];
  if (!def) return 0;
  const stock = STATE.shop.stock[defId] || { ownedCount: 0 };
  const growth = def.priceGrowth || 1.10;
  return Math.round(def.cost * Math.pow(growth, stock.ownedCount || 0));
}

function buyShopItem(defId, qty = 1) {
  const def = STATE.defs.buildingDefs[defId];
  if (!def) return false;

  let totalCost = 0;
  const currentCount = (STATE.shop.stock[defId] && STATE.shop.stock[defId].ownedCount) || 0;
  const growth = def.priceGrowth || 1.10;

  for (let i = 0; i < qty; i++) {
    totalCost += Math.round(def.cost * Math.pow(growth, currentCount + i));
  }

  if (STATE.run.money < totalCost) {
    showToast('Insufficient funds!', 'warn');
    return false;
  }

  STATE.run.money -= totalCost;
  if (!STATE.shop.stock[defId]) STATE.shop.stock[defId] = { ownedCount: 0 };
  STATE.shop.stock[defId].ownedCount += qty;

  addToInventory(defId, qty);
  showToast(`Purchased ${qty}x ${def.name}!`);
  if (typeof renderHotbar === 'function') renderHotbar();
  triggerSaveState();
  return true;
}

const CRATES_CONFIG = {
  regular: {
    name: 'Regular Crate', cost: 250,
    pool: [
      { id: 'fastBelt', weight: 40 },
      { id: 'upgrader1x1', weight: 30 },
      { id: 'blastSmelter', weight: 20 },
      { id: 'megaExtractor', weight: 10 }
    ]
  },
  golden: {
    name: 'Golden Crate', cost: 1000,
    pool: [
      { id: 'stellarSparkler', weight: 25, permanent: true },
      { id: 'oreCrystallizer', weight: 25, permanent: true },
      { id: 'geodeDriller', weight: 25, permanent: true },
      { id: 'magLevRail', weight: 25, permanent: true }
    ]
  },
  exotic: {
    name: 'Exotic Crate', cost: 5000,
    pool: [
      { id: 'singularitySmelter', weight: 30, permanent: true },
      { id: 'antimatterSiphon', weight: 30, permanent: true },
      { id: 'phaseShiftBelt', weight: 20, permanent: true },
      { id: 'entropyStabilizer', weight: 20, permanent: true }
    ]
  },
  prestige: {
    name: 'Prestige Crate', costKeys: 1,
    pool: [
      { id: 'shardOfLife', weight: 35, permanent: true },
      { id: 'supernovaCrucible', weight: 35, permanent: true },
      { id: 'voidHarvester', weight: 30, permanent: true }
    ]
  }
};

function openCrate(tier) {
  const crate = CRATES_CONFIG[tier];
  if (!crate) return null;

  const totalWeight = crate.pool.reduce((acc, cur) => acc + cur.weight, 0);
  let roll = Math.random() * totalWeight;
  let chosen = crate.pool[0];

  for (const item of crate.pool) {
    if (roll < item.weight) { chosen = item; break; }
    roll -= item.weight;
  }

  addToInventory(chosen.id, 1, !!chosen.permanent);
  STATE.stats.cratesOpened++;
  triggerSaveState();
  return { id: chosen.id, permanent: !!chosen.permanent };
}

function buyAndOpenCrate(tier) {
  const crate = CRATES_CONFIG[tier];
  if (!crate) return null;

  if (crate.costKeys) {
    if ((STATE.meta.prestigeKeys || 0) < crate.costKeys) {
      showToast('Not enough Prestige Keys!', 'warn');
      return null;
    }
    STATE.meta.prestigeKeys -= crate.costKeys;
  } else if (crate.cost) {
    if (STATE.run.money < crate.cost) {
      showToast('Insufficient funds to purchase crate!', 'warn');
      return null;
    }
    STATE.run.money -= crate.cost;
  }

  return openCrate(tier);
}

// ===========================================================
// PRESTIGE & CUSTOM CREATOR
// ===========================================================

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
  const payout = calculatePrestigePayout(STATE.run.lifetimeEarnings || 0);
  if (!payout.canPrestige) {
    showToast('Lifetime earnings requirement not met for Prestige ($10B)', 'warn');
    return false;
  }

  STATE.meta.prestigePoints += payout.pointsGained;
  STATE.meta.prestigeKeys += payout.keysGained;

  STATE.run.money = 1000;
  STATE.run.lifetimeEarnings = 0;
  STATE.run.buildings = [];
  STATE.run.ores = [];
  STATE.run.timeScale = 1.0;
  STATE.run.isPaused = false;

  showToast(`Prestige Complete! +${payout.pointsGained} Points & +${payout.keysGained} Keys!`, 'success');
  triggerSaveState();
  return true;
}

function buyPrestigeUpgrade(id) {
  showToast('Prestige upgrade unlocked!');
}

function registerCustomItem(item) {
  if (!item || !item.id) return;
  STATE.defs.buildingDefs[item.id] = {
    ...item,
    cost: item.cost || 500,
    priceGrowth: 1.10,
    layer: item.category === 'belt' ? 'belt' : 'machine',
    ports: item.ports || [{ dx: 0, dy: 0, kind: 'conveyor', color: '#ffcf5c', dropSide: 0 }]
  };
  STATE.meta.blueprintUnlocks[item.id] = true;
  addToInventory(item.id, 1);
  showToast(`Registered custom item: ${item.name}!`);
  triggerSaveState();
}

function showToast(msg, type = 'info') {
  let toastEl = document.getElementById('toastNotification');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toastNotification';
    toastEl.style.position = 'fixed';
    toastEl.style.bottom = '90px';
    toastEl.style.left = '50%';
    toastEl.style.transform = 'translateX(-50%)';
    toastEl.style.background = '#141a1f';
    toastEl.style.color = '#e8edf0';
    toastEl.style.border = '1px solid #e8a030';
    toastEl.style.padding = '8px 18px';
    toastEl.style.borderRadius = '4px';
    toastEl.style.fontFamily = 'Inter, sans-serif';
    toastEl.style.fontSize = '13px';
    toastEl.style.fontWeight = '600';
    toastEl.style.zIndex = '9999';
    toastEl.style.pointerEvents = 'none';
    toastEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.style.borderColor = type === 'warn' ? '#ef4444' : (type === 'success' ? '#22c55e' : '#e8a030');
  toastEl.style.opacity = '1';
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => { toastEl.style.opacity = '0'; }, 2400);
}

// Helper color utilities
function hexToNumber(hex) {
  if (!hex || hex[0] !== '#') return 0x3d6a8f;
  return parseInt(hex.slice(1), 16);
}

function hexShift(hex, amount) {
  if (!hex || hex[0] !== '#') return hex;
  let r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
  let g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
  let b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ===========================================================
// PHASER 3 FACTORY SCENE
// ===========================================================

class FactoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FactoryScene' });
  }

  create() {
    sceneInstance = this;
    const cs = STATE.config.grid.cellSize;
    const worldW = STATE.config.grid.cols * cs;
    const worldH = STATE.config.grid.rows * cs;

    // 1. Phaser Camera Setup (Generous bounds for free panning)
    this.cameras.main.setBounds(-4000, -4000, worldW + 8000, worldH + 8000);
    this.cameras.main.centerOn(worldW / 2, worldH / 2);
    this.cameras.main.setZoom(1.0);

    STATE.camera.x = this.cameras.main.scrollX;
    STATE.camera.y = this.cameras.main.scrollY;
    STATE.camera.zoom = 1.0;

    // 2. Phaser Graphics Layers
    this.gridGfx = this.add.graphics();
    this.beltGfx = this.add.graphics();
    this.buildingGfx = this.add.graphics();
    this.oreGfx = this.add.graphics();
    this.previewGfx = this.add.graphics();
    this.effectsGfx = this.add.graphics();

    // 3. Floating Text Group
    this.floatingTexts = [];

    // 4. Reliable Camera Drag-to-Pan & Placement Interaction
    this.isPointerDown = false;
    this.hasDragged = false;
    this.pointerDownPos = { x: 0, y: 0 };

    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        if (mode !== 'idle') cancelMode();
        return;
      }

      this.isPointerDown = true;
      this.hasDragged = false;
      this.pointerDownPos = { x: pointer.x, y: pointer.y };

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const cell = worldToCell(worldPoint.x, worldPoint.y);

      if (mode === 'placing' && placingState) {
        const def = STATE.defs.buildingDefs[placingState.defId];
        if (def && def.layer === 'belt') {
          isBeltDragging = true;
          beltDragStart = cell;
        }
      }
    });

    this.input.on('pointermove', (pointer) => {
      mouseScreen = { x: pointer.x, y: pointer.y };

      if (this.isPointerDown) {
        const dist = Phaser.Math.Distance.Between(this.pointerDownPos.x, this.pointerDownPos.y, pointer.x, pointer.y);
        if (dist > 4) {
          this.hasDragged = true;
        }

        // Camera panning: pan if not belt-dragging or if using middle/right button
        const isMiddleOrRight = pointer.middleButtonDown() || pointer.rightButtonDown();
        const canPan = (!isBeltDragging && mode !== 'placing') || isMiddleOrRight || mode === 'idle' || mode === 'inspecting';

        if (canPan) {
          const dx = (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
          const dy = (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
          this.cameras.main.scrollX -= dx;
          this.cameras.main.scrollY -= dy;
        }
      }

      STATE.camera.x = this.cameras.main.scrollX;
      STATE.camera.y = this.cameras.main.scrollY;
      STATE.camera.zoom = this.cameras.main.zoom;
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      if (isBeltDragging && beltDragStart && placingState) {
        const cell = worldToCell(worldPoint.x, worldPoint.y);
        if (this.hasDragged) {
          this.placeBeltLine(beltDragStart, cell, placingState.defId);
        } else {
          tryPlaceBuilding(placingState.defId, beltDragStart.col, beltDragStart.row, placingState.rot || 0);
        }
        isBeltDragging = false;
        beltDragStart = null;
        this.hasDragged = false;
        return;
      }

      // If it was a click (not a drag-pan), execute in-world click action
      if (!this.hasDragged) {
        handleClickAction(worldPoint.x, worldPoint.y);
      }
      this.hasDragged = false;
    });

    // 5. Cursor-Anchored Smooth Mouse Wheel Zoom
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const zoomFactor = deltaY > 0 ? 0.88 : 1.14;
      const curZoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(curZoom * zoomFactor, 0.25, 3.0);

      if (newZoom !== curZoom) {
        const worldPointBefore = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.cameras.main.setZoom(newZoom);
        const worldPointAfter = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.cameras.main.scrollX += (worldPointBefore.x - worldPointAfter.x);
        this.cameras.main.scrollY += (worldPointBefore.y - worldPointAfter.y);
      }

      STATE.camera.zoom = newZoom;
      STATE.camera.x = this.cameras.main.scrollX;
      STATE.camera.y = this.cameras.main.scrollY;
    });

    // Mobile / Window Resize
    this.scale.on('resize', (gameSize) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
    });

    // Load external data.json
    if (typeof loadGameData === 'function') {
      loadGameData().then(data => {
        if (data) {
          if (data.config) Object.assign(STATE.config, data.config);
          if (data.itemDefs) Object.assign(STATE.defs.itemDefs, data.itemDefs);
          if (data.buildingDefs) Object.assign(STATE.defs.buildingDefs, data.buildingDefs);
          if (data.relicDefs) Object.assign(STATE.defs.relicDefs, data.relicDefs);
          if (data.cratesConfig && typeof CRATES_CONFIG !== 'undefined') Object.assign(CRATES_CONFIG, data.cratesConfig);
          if (typeof renderHotbar === 'function') renderHotbar();
          if (typeof renderInventoryGrid === 'function') renderInventoryGrid();
        }
      });
    }

    // Load initial save
    loadSavedState();
  }

  placeBeltLine(startCell, endCell, defId) {
    const dc = endCell.col - startCell.col;
    const dr = endCell.row - startCell.row;
    const steps = Math.max(Math.abs(dc), Math.abs(dr));
    if (steps === 0) {
      tryPlaceBuilding(defId, startCell.col, startCell.row, placingState ? placingState.rot : 0);
      return;
    }

    const isHorizontal = Math.abs(dc) >= Math.abs(dr);
    const rot = isHorizontal ? (dc >= 0 ? 0 : 2) : (dr >= 0 ? 1 : 3);

    let col = startCell.col, row = startCell.row;
    const stepC = isHorizontal ? (dc > 0 ? 1 : -1) : 0;
    const stepR = !isHorizontal ? (dr > 0 ? 1 : -1) : 0;

    for (let i = 0; i <= steps; i++) {
      if (getInventoryQty(defId) <= 0) break;
      tryPlaceBuilding(defId, col, row, rot);
      col += stepC; row += stepR;
    }
  }

  spawnPlacementBurst(x, y, colorHex) {
    const col = hexToNumber(colorHex || '#e8a030');
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = Phaser.Math.Between(40, 100);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35, maxLife: 0.35,
        color: colorHex || '#e8a030',
        size: 3
      });
    }
  }

  spawnDemolishBurst(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(50, 140);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4, maxLife: 0.4,
        color: '#ef4444',
        size: 3.5
      });
    }
  }

  spawnExplosionBurst(x, y) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 180);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45, maxLife: 0.45,
        color: Math.random() > 0.5 ? '#ff4757' : '#ffa502',
        size: 4
      });
    }
  }

  spawnFloatingPayout(x, y, amount) {
    const text = this.add.text(x, y - 10, `+$${amount.toLocaleString()}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#e8a030',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 45,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: () => { text.destroy(); }
    });
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.1);

    // 1. Simulation Step
    if (!STATE.run.isPaused) {
      updateExtractors(dt * STATE.run.timeScale);
      updateOrePhysics(dt * STATE.run.timeScale);
      resolveOreCollisions();
      processConsumption();
    }

    // 2. Render Layers
    this.renderGrid();
    this.renderBelts(time);
    this.renderBuildings(time);
    this.renderOres();
    this.renderPreviews();
    this.renderEffects(dt);

    // 3. Sync UI HUD
    updateHUD();
  }

  renderGrid() {
    this.gridGfx.clear();
    const grid = STATE.config.grid;
    const cs = grid.cellSize;
    const worldW = grid.cols * cs, worldH = grid.rows * cs;

    // Faint grid lines
    this.gridGfx.lineStyle(1, 0xffffff, 0.04);
    for (let c = 0; c <= grid.cols; c++) {
      this.gridGfx.lineBetween(c * cs, 0, c * cs, worldH);
    }
    for (let r = 0; r <= grid.rows; r++) {
      this.gridGfx.lineBetween(0, r * cs, worldW, r * cs);
    }

    // Outer boundary line
    this.gridGfx.lineStyle(2, 0x2a5060, 0.6);
    this.gridGfx.strokeRect(0, 0, worldW, worldH);
  }

  renderBelts(time) {
    this.beltGfx.clear();
    const cs = STATE.config.grid.cellSize;
    const animTick = (time / 400) % 1;

    for (const b of STATE.run.buildings) {
      const def = STATE.defs.buildingDefs[b.defId];
      if (!def || def.category !== 'belt') continue;

      const fp = getFootprint(def, b.rot);
      const bx = b.col * cs, by = b.row * cs;
      const bw = fp.w * cs, bh = fp.h * cs;
      const cx = bx + bw / 2, cy = by + bh / 2;

      // Base conveyor plate
      this.beltGfx.fillStyle(hexToNumber(def.color || '#2b353e'), 1);
      this.beltGfx.fillRect(bx, by, bw, bh);

      // Lateral rails
      this.beltGfx.lineStyle(1.5, 0x1a2228, 1);
      this.beltGfx.strokeRect(bx, by, bw, bh);

      let primaryDir = b.rot;
      const port = fp.ports && fp.ports[0];
      if (port && port.dropSide !== null && port.dropSide !== undefined) {
        primaryDir = port.dropSide;
      }

      const drawChevronPhaser = (px, py, dir, size, colorHex, alpha = 0.85) => {
        const dv = dirVector(dir);
        const p1x = px - dv.x * (size * 0.5) - dv.y * (size * 0.4);
        const p1y = py - dv.y * (size * 0.5) + dv.x * (size * 0.4);
        const p2x = px + dv.x * (size * 0.5);
        const p2y = py + dv.y * (size * 0.5);
        const p3x = px - dv.x * (size * 0.5) + dv.y * (size * 0.4);
        const p3y = py - dv.y * (size * 0.5) - dv.x * (size * 0.4);

        this.beltGfx.lineStyle(2, hexToNumber(colorHex), alpha);
        this.beltGfx.beginPath();
        this.beltGfx.moveTo(p1x, p1y);
        this.beltGfx.lineTo(p2x, p2y);
        this.beltGfx.lineTo(p3x, p3y);
        this.beltGfx.strokePath();
      };

      if (def.isCrossover) {
        for (let k = 0; k < 2; k++) {
          const offset = ((k / 2 + animTick) % 1) - 0.5;
          drawChevronPhaser(cx + offset * bw * 0.8, cy, 0, 18, '#94a3b8', 0.8);
          drawChevronPhaser(cx, cy + offset * bh * 0.8, 1, 18, '#38bdf8', 0.9);
        }
      } else if (def.isSwitchGate) {
        const straightDir = b.rot;
        const divertDir = (b.rot + 1) % 4;
        const isDiverted = b.activeBranch === 1;

        const inactDir = isDiverted ? straightDir : divertDir;
        drawChevronPhaser(cx, cy, inactDir, 16, '#556677', 0.3);

        const actDir = isDiverted ? divertDir : straightDir;
        for (let k = 0; k < 2; k++) {
          const offset = ((k / 2 + animTick) % 1) - 0.5;
          const dv = dirVector(actDir);
          drawChevronPhaser(cx + dv.x * offset * bw * 0.6, cy + dv.y * offset * bh * 0.6, actDir, 20, '#e8a030', 1.0);
        }
      } else if (def.isLoopGate) {
        const loopDir = (b.rot + 1) % 4;
        for (let k = 0; k < 2; k++) {
          const offset = ((k / 2 + animTick) % 1) - 0.5;
          const dv = dirVector(loopDir);
          drawChevronPhaser(cx + dv.x * offset * bw * 0.6, cy + dv.y * offset * bh * 0.6, loopDir, 18, '#34d399', 0.9);
        }
        drawChevronPhaser(cx, cy, b.rot, 18, '#fbbf24', 0.7);
      } else {
        const numChevrons = def.id === 'ultraBelt' ? 3 : 2;
        const chevronColor = def.id === 'ultraBelt' ? '#fbbf24' : (def.id === 'fastBelt' ? '#7fd0ff' : '#e8edf0');
        for (let k = 0; k < numChevrons; k++) {
          const offset = ((k / numChevrons + animTick) % 1) - 0.5;
          const dv = dirVector(primaryDir);
          drawChevronPhaser(cx + dv.x * offset * bw * 0.8, cy + dv.y * offset * bh * 0.8, primaryDir, 20, chevronColor, 0.9);
        }
      }
    }
  }

  renderBuildings(time) {
    this.buildingGfx.clear();
    const cs = STATE.config.grid.cellSize;

    for (const b of STATE.run.buildings) {
      const def = STATE.defs.buildingDefs[b.defId];
      if (!def || def.category === 'belt') continue;

      const fp = getFootprint(def, b.rot);
      const bx = b.col * cs, by = b.row * cs;
      const bw = fp.w * cs, bh = fp.h * cs;
      const cx = bx + bw / 2, cy = by + bh / 2;
      const isSelected = selectedEntity && selectedEntity.type === 'building' && selectedEntity.id === b.id;

      // Selection glow
      if (isSelected) {
        this.buildingGfx.fillStyle(0x7fd0ff, 0.15);
        this.buildingGfx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
        this.buildingGfx.lineStyle(2, 0xe8a030, 1);
        this.buildingGfx.strokeRect(bx - 4, by - 4, bw + 8, bh + 8);
      }

      // Machine Chassis base plate
      this.buildingGfx.fillStyle(hexToNumber(def.color || '#1e293b'), 1);
      this.buildingGfx.fillRoundedRect(bx, by, bw, bh, 4);

      // Chamfered border
      this.buildingGfx.lineStyle(1.5, isSelected ? 0xe8a030 : hexToNumber(hexShift(def.color, 30)), 0.8);
      this.buildingGfx.strokeRoundedRect(bx, by, bw, bh, 4);

      // Category / Machine Specific Visuals
      if (def.category === 'extractor') {
        const dv = dirVector(b.rot);
        const nozzleX = cx + dv.x * (bw * 0.4);
        const nozzleY = cy + dv.y * (bh * 0.4);

        // Nozzle ring
        this.buildingGfx.fillStyle(0x1e293b, 1);
        this.buildingGfx.fillCircle(nozzleX, nozzleY, 10);
        this.buildingGfx.lineStyle(2, 0xe8a030, 1);
        this.buildingGfx.strokeCircle(nozzleX, nozzleY, 10);

        // Center drill X
        this.buildingGfx.lineStyle(2, hexToNumber(hexShift(def.color, 40)), 0.9);
        this.buildingGfx.lineBetween(cx - 12, cy - 12, cx + 12, cy + 12);
        this.buildingGfx.lineBetween(cx - 12, cy + 12, cx + 12, cy - 12);
        this.buildingGfx.strokeCircle(cx, cy, 6);
      } else if (def.category === 'upgrader') {
        if (def.isSideBeam) {
          const dv = dirVector(b.rot);
          const emitterX = cx + dv.x * (bw * 0.42);
          const emitterY = cy + dv.y * (bh * 0.42);

          // Turret base
          this.buildingGfx.fillStyle(0x0f172a, 1);
          this.buildingGfx.fillCircle(cx, cy, 18);
          this.buildingGfx.lineStyle(2, 0xe8a030, 1);
          this.buildingGfx.strokeCircle(cx, cy, 18);

          // Pulsing Core
          const isLaser = def.id === 'laserScanner';
          const coreColor = isLaser ? 0xa855f7 : 0x06b6d4;
          const pulse = Math.sin(time / 150) * 2;
          this.buildingGfx.fillStyle(coreColor, 1);
          this.buildingGfx.fillCircle(cx, cy, 10 + pulse);
          this.buildingGfx.lineStyle(2, 0xffffff, 0.9);
          this.buildingGfx.strokeCircle(cx, cy, 10 + pulse);

          // Emitter nozzle
          this.buildingGfx.fillStyle(0x1e293b, 1);
          this.buildingGfx.fillCircle(emitterX, emitterY, 8);
          this.buildingGfx.lineStyle(2, 0xffcf5c, 1);
          this.buildingGfx.strokeCircle(emitterX, emitterY, 8);

          // Projecting Scanning Laser Beam onto adjacent conveyor
          const beamTargetX = cx + dv.x * cs;
          const beamTargetY = cy + dv.y * cs;
          const beamColor = isLaser ? 0xc084fc : 0x38bdf8;

          this.buildingGfx.lineStyle(6, beamColor, 0.35 + Math.sin(time / 100) * 0.15);
          this.buildingGfx.lineBetween(emitterX, emitterY, beamTargetX, beamTargetY);
          this.buildingGfx.lineStyle(2, 0xffffff, 0.9);
          this.buildingGfx.lineBetween(emitterX, emitterY, beamTargetX, beamTargetY);

          // Impact scan circle on adjacent conveyor
          this.buildingGfx.lineStyle(2, isLaser ? 0xe879f9 : 0x67e8f9, 0.85);
          this.buildingGfx.strokeCircle(beamTargetX, beamTargetY, 12 + Math.sin(time / 120) * 3);
        } else {
          const flowDir = b.rot;
          const dv = dirVector(flowDir);

          // Cyan intake frame [
          const inX = cx - dv.x * (bw * 0.4);
          const inY = cy - dv.y * (bh * 0.4);
          this.buildingGfx.lineStyle(3, 0x38bdf8, 1);
          if (flowDir === 0 || flowDir === 2) {
            this.buildingGfx.lineBetween(inX, cy - bh * 0.35, inX, cy + bh * 0.35);
          } else {
            this.buildingGfx.lineBetween(cx - bw * 0.35, inY, cx + bw * 0.35, inY);
          }

          // Amber output frame ]
          const outX = cx + dv.x * (bw * 0.4);
          const outY = cy + dv.y * (bh * 0.4);
          this.buildingGfx.lineStyle(3, 0xe8a030, 1);
          if (flowDir === 0 || flowDir === 2) {
            this.buildingGfx.lineBetween(outX, cy - bh * 0.35, outX, cy + bh * 0.35);
          } else {
            this.buildingGfx.lineBetween(cx - bw * 0.35, outY, cx + bw * 0.35, outY);
          }

          // Throughput arrow
          this.buildingGfx.fillStyle(hexToNumber(hexShift(def.color, 50)), 0.9);
          this.buildingGfx.fillTriangle(cx + dv.x * 10, cy + dv.y * 10, cx - dv.y * 8, cy + dv.x * 8, cx + dv.y * 8, cy - dv.x * 8);
        }
      } else if (def.category === 'seller') {
        const inDir = b.rot;
        const dv = dirVector(inDir);
        const mouthX = cx - dv.x * (bw * 0.38);
        const mouthY = cy - dv.y * (bh * 0.38);

        // Suction Hopper Bracket
        this.buildingGfx.lineStyle(3, 0x38bdf8, 1);
        if (inDir === 0 || inDir === 2) {
          this.buildingGfx.lineBetween(mouthX, cy - bh * 0.38, mouthX, cy + bh * 0.38);
        } else {
          this.buildingGfx.lineBetween(cx - bw * 0.38, mouthY, cx + bw * 0.38, mouthY);
        }

        // Glowing Furnace Core
        let coreColor = 0xdc2626;
        if (def.id === 'cryoSmelter') coreColor = 0x0284c7;
        else if (def.id === 'prismaticSmelter') coreColor = 0xeab308;
        else if (def.id === 'singularitySmelter') coreColor = 0x581c87;
        else if (def.id === 'supernovaCrucible') coreColor = 0xea580c;

        this.buildingGfx.fillStyle(coreColor, 1);
        this.buildingGfx.fillCircle(cx, cy, 14);
        this.buildingGfx.lineStyle(2, 0xffffff, 0.8);
        this.buildingGfx.strokeCircle(cx, cy, 14);
      }

      // Fuel progress bar
      if (def.requiresFuel && b.fuelTimer > 0) {
        const maxFuel = def.attributes.runDurationSec || 8;
        const pct = Math.min(1, b.fuelTimer / maxFuel);
        this.buildingGfx.fillStyle(0x000000, 0.6);
        this.buildingGfx.fillRect(bx + 4, by + bh - 8, bw - 8, 4);
        this.buildingGfx.fillStyle(pct > 0.3 ? 0x22c55e : 0xef4444, 1);
        this.buildingGfx.fillRect(bx + 4, by + bh - 8, (bw - 8) * pct, 4);
      }
    }
  }

  renderOres() {
    this.oreGfx.clear();
    const lifespan = STATE.config.oreGroundLifespan;

    for (const o of STATE.run.ores) {
      if (o.destroyed) continue;

      let alpha = 1.0;
      if (o.groundTime && lifespan > 0) {
        const rem = lifespan - o.groundTime;
        if (rem < 0.8) alpha = Math.max(0, rem / 0.8);
      }

      const r = o.size / 2;
      const isSelected = selectedEntity && selectedEntity.type === 'ore' && selectedEntity.id === o.id;

      // Status glow aura
      if (o.status) {
        if (o.status.flaming) {
          this.oreGfx.fillStyle(0xff6b35, 0.3 * alpha);
          this.oreGfx.fillCircle(o.x, o.y, r * 1.8);
        } else if (o.status.radioactive) {
          this.oreGfx.fillStyle(0x4ade80, 0.3 * alpha);
          this.oreGfx.fillCircle(o.x, o.y, r * 1.6);
        } else if (o.status.sparkling) {
          this.oreGfx.fillStyle(0xfde047, 0.35 * alpha);
          this.oreGfx.fillCircle(o.x, o.y, r * 1.7);
        }
      }

      // Ore shape
      const oreCol = hexToNumber(o.color || '#ffb03b');
      this.oreGfx.fillStyle(oreCol, alpha);

      if (o.shape === 'diamond') {
        this.oreGfx.beginPath();
        this.oreGfx.moveTo(o.x, o.y - r * 1.3);
        this.oreGfx.lineTo(o.x + r * 1.3, o.y);
        this.oreGfx.lineTo(o.x, o.y + r * 1.3);
        this.oreGfx.lineTo(o.x - r * 1.3, o.y);
        this.oreGfx.closePath();
        this.oreGfx.fillPath();
      } else if (o.shape === 'square') {
        this.oreGfx.fillRect(o.x - r, o.y - r, r * 2, r * 2);
      } else {
        this.oreGfx.fillCircle(o.x, o.y, r);
      }

      // Highlight glint & outline
      this.oreGfx.lineStyle(1.5, isSelected ? 0xe8a030 : 0x000000, 0.6 * alpha);
      if (o.shape === 'diamond') {
        this.oreGfx.strokePath();
      } else if (o.shape === 'square') {
        this.oreGfx.strokeRect(o.x - r, o.y - r, r * 2, r * 2);
      } else {
        this.oreGfx.strokeCircle(o.x, o.y, r);
      }

      // Top-left glint
      this.oreGfx.fillStyle(0xffffff, 0.4 * alpha);
      this.oreGfx.fillCircle(o.x - r * 0.3, o.y - r * 0.3, Math.max(1.5, r * 0.25));
    }
  }

  renderPreviews() {
    this.previewGfx.clear();
    const cs = STATE.config.grid.cellSize;

    if (mode === 'placing' && placingState) {
      const def = STATE.defs.buildingDefs[placingState.defId];
      if (!def) return;
      const worldPoint = this.cameras.main.getWorldPoint(mouseScreen.x, mouseScreen.y);
      const rot = placingState.rot || 0;
      const fp = getFootprint(def, rot);
      const raw = worldToCell(worldPoint.x, worldPoint.y);
      const origin = clampedOrigin(fp.w, fp.h, raw.col, raw.row);

      const px = origin.col * cs, py = origin.row * cs;
      const pw = fp.w * cs, ph = fp.h * cs;
      const cx = px + pw / 2, cy = py + ph / 2;

      // 1. Ghost Bounding Box
      this.previewGfx.fillStyle(hexToNumber(def.color || '#38bdf8'), 0.4);
      this.previewGfx.fillRoundedRect(px, py, pw, ph, 4);
      this.previewGfx.lineStyle(2, 0xe8a030, 0.9);
      this.previewGfx.strokeRoundedRect(px, py, pw, ph, 4);

      // Helper to draw pre-placement direction chevron
      const drawGhostChevron = (gx, gy, gDir, size, colorHex = 0xffcf5c, alpha = 0.95) => {
        const dv = dirVector(gDir);
        const p1x = gx - dv.x * (size * 0.5) - dv.y * (size * 0.4);
        const p1y = gy - dv.y * (size * 0.5) + dv.x * (size * 0.4);
        const p2x = gx + dv.x * (size * 0.5);
        const p2y = gy + dv.y * (size * 0.5);
        const p3x = gx - dv.x * (size * 0.5) + dv.y * (size * 0.4);
        const p3y = gy - dv.y * (size * 0.5) - dv.x * (size * 0.4);

        this.previewGfx.lineStyle(2.5, colorHex, alpha);
        this.previewGfx.beginPath();
        this.previewGfx.moveTo(p1x, p1y);
        this.previewGfx.lineTo(p2x, p2y);
        this.previewGfx.lineTo(p3x, p3y);
        this.previewGfx.strokePath();
      };

      // 2. High-Contrast Direction of Travel Previews
      if (def.category === 'belt') {
        let beltDir = rot;
        const port = fp.ports && fp.ports[0];
        if (port && port.dropSide !== null && port.dropSide !== undefined) {
          beltDir = port.dropSide;
        }

        if (def.isCrossover) {
          drawGhostChevron(cx - 10, cy, 0, 16, 0xffffff, 0.9);
          drawGhostChevron(cx + 10, cy, 0, 16, 0xffffff, 0.9);
          drawGhostChevron(cx, cy - 10, 1, 16, 0x38bdf8, 0.9);
          drawGhostChevron(cx, cy + 10, 1, 16, 0x38bdf8, 0.9);
        } else if (def.isSwitchGate || def.isLoopGate || def.isFilterSorter) {
          drawGhostChevron(cx, cy, rot, 22, 0xe8a030, 1.0);
          drawGhostChevron(cx, cy, (rot + 1) % 4, 18, 0x38bdf8, 0.8);
        } else if (def.isSplitter || def.isSplitter3) {
          drawGhostChevron(cx, cy, rot, 20, 0xc084fc, 1.0);
          drawGhostChevron(cx, cy, (rot + 1) % 4, 18, 0xc084fc, 0.8);
        } else {
          for (let k = -1; k <= 1; k++) {
            const dv = dirVector(beltDir);
            drawGhostChevron(cx + dv.x * k * 14, cy + dv.y * k * 14, beltDir, 22, 0xfbbf24, 1.0);
          }
        }
      } else if (def.category === 'extractor') {
        const dv = dirVector(rot);
        const nozzleX = cx + dv.x * (pw * 0.42);
        const nozzleY = cy + dv.y * (ph * 0.42);

        // Highlight output ejection nozzle
        this.previewGfx.fillStyle(0x1e293b, 1);
        this.previewGfx.fillCircle(nozzleX, nozzleY, 12);
        this.previewGfx.lineStyle(2.5, 0xe8a030, 1);
        this.previewGfx.strokeCircle(nozzleX, nozzleY, 12);

        // Large animated outward ejection arrow firing into neighboring cell
        const outTargetX = nozzleX + dv.x * 20;
        const outTargetY = nozzleY + dv.y * 20;
        drawGhostChevron(outTargetX, outTargetY, rot, 24, 0xffcf5c, 1.0);
      } else if (def.category === 'upgrader') {
        if (def.isSideBeam) {
          const dv = dirVector(rot);
          const emitterX = cx + dv.x * (pw * 0.42);
          const emitterY = cy + dv.y * (ph * 0.42);
          const beamTargetX = cx + dv.x * cs;
          const beamTargetY = cy + dv.y * cs;

          // Turret ring
          this.previewGfx.fillStyle(0x0f172a, 1);
          this.previewGfx.fillCircle(cx, cy, 16);
          this.previewGfx.lineStyle(2.5, 0xe8a030, 1);
          this.previewGfx.strokeCircle(cx, cy, 16);

          // Emitter dish
          this.previewGfx.fillStyle(0x38bdf8, 1);
          this.previewGfx.fillCircle(emitterX, emitterY, 8);

          // Projected scanning beam line onto adjacent tile
          this.previewGfx.lineStyle(4, 0x38bdf8, 0.6);
          this.previewGfx.lineBetween(emitterX, emitterY, beamTargetX, beamTargetY);
          this.previewGfx.lineStyle(2, 0xffffff, 1);
          this.previewGfx.lineBetween(emitterX, emitterY, beamTargetX, beamTargetY);

          // Target conveyor scan zone
          this.previewGfx.lineStyle(2, 0x38bdf8, 0.9);
          this.previewGfx.strokeCircle(beamTargetX, beamTargetY, 16);
          drawGhostChevron(beamTargetX, beamTargetY, rot, 20, 0x38bdf8, 1.0);
        } else {
          const flowDir = rot;
          const dv = dirVector(flowDir);

          // Cyan intake bracket [
          const inX = cx - dv.x * (pw * 0.42);
          const inY = cy - dv.y * (ph * 0.42);
          this.previewGfx.lineStyle(3.5, 0x38bdf8, 1);
          if (flowDir === 0 || flowDir === 2) {
            this.previewGfx.lineBetween(inX, cy - ph * 0.38, inX, cy + ph * 0.38);
          } else {
            this.previewGfx.lineBetween(cx - pw * 0.38, inY, cx + pw * 0.38, inY);
          }

          // Amber output bracket ]
          const outX = cx + dv.x * (pw * 0.42);
          const outY = cy + dv.y * (ph * 0.42);
          this.previewGfx.lineStyle(3.5, 0xe8a030, 1);
          if (flowDir === 0 || flowDir === 2) {
            this.previewGfx.lineBetween(outX, cy - ph * 0.38, outX, cy + ph * 0.38);
          } else {
            this.previewGfx.lineBetween(cx - pw * 0.38, outY, cx + pw * 0.38, outY);
          }

          // Center forward throughput flow arrows
          drawGhostChevron(cx - dv.x * 12, cy - dv.y * 12, flowDir, 20, 0x38bdf8, 0.9);
          drawGhostChevron(cx + dv.x * 12, cy + dv.y * 12, flowDir, 20, 0xe8a030, 1.0);
        }
      } else if (def.category === 'seller') {
        const inDir = rot;
        const dv = dirVector(inDir);
        const mouthX = cx - dv.x * (pw * 0.4);
        const mouthY = cy - dv.y * (ph * 0.4);

        // Suction Hopper Bracket
        this.previewGfx.lineStyle(3.5, 0x38bdf8, 1);
        if (inDir === 0 || inDir === 2) {
          this.previewGfx.lineBetween(mouthX, cy - ph * 0.4, mouthX, cy + ph * 0.4);
        } else {
          this.previewGfx.lineBetween(cx - pw * 0.4, mouthY, cx + pw * 0.4, mouthY);
        }

        // Inward suction chevrons pulling into core
        drawGhostChevron(cx - dv.x * 16, cy - dv.y * 16, inDir, 22, 0x38bdf8, 1.0);

        // Furnace core indicator
        this.previewGfx.fillStyle(0xdc2626, 0.9);
        this.previewGfx.fillCircle(cx, cy, 14);
      }

      // 3. Port Markers with In/Out Indicators
      for (const p of fp.ports) {
        const portX = (origin.col + p.dx + 0.5) * cs;
        const portY = (origin.row + p.dy + 0.5) * cs;
        const isOut = p.kind === 'output';

        this.previewGfx.fillStyle(isOut ? 0xffcf5c : 0x38bdf8, 0.9);
        this.previewGfx.fillCircle(portX, portY, 8);
        this.previewGfx.lineStyle(2, 0xffffff, 1);
        this.previewGfx.strokeCircle(portX, portY, 8);
      }

      // 4. Multi-tile Belt Drag Line Preview with Direction on Every Tile
      if (isBeltDragging && beltDragStart) {
        const curCell = worldToCell(worldPoint.x, worldPoint.y);
        const dc = curCell.col - beltDragStart.col;
        const dr = curCell.row - beltDragStart.row;
        const steps = Math.max(Math.abs(dc), Math.abs(dr));
        const isHorizontal = Math.abs(dc) >= Math.abs(dr);
        const lineRot = isHorizontal ? (dc >= 0 ? 0 : 2) : (dr >= 0 ? 1 : 3);
        const stepC = isHorizontal ? (dc > 0 ? 1 : -1) : 0;
        const stepR = !isHorizontal ? (dr > 0 ? 1 : -1) : 0;

        let c = beltDragStart.col, r = beltDragStart.row;
        for (let i = 0; i <= steps; i++) {
          const tileX = c * cs, tileY = r * cs;
          const tileCenterX = tileX + cs / 2, tileCenterY = tileY + cs / 2;

          this.previewGfx.fillStyle(0x059669, 0.35);
          this.previewGfx.fillRect(tileX, tileY, cs, cs);
          this.previewGfx.lineStyle(2, 0x34d399, 0.9);
          this.previewGfx.strokeRect(tileX, tileY, cs, cs);

          // Draw direction arrow inside each tile of the line
          drawGhostChevron(tileCenterX, tileCenterY, lineRot, 22, 0xffffff, 1.0);

          c += stepC; r += stepR;
        }
      }
    }
  }

  renderEffects(dt) {
    this.effectsGfx.clear();

    // Explosion Rings
    for (let i = explosions.length - 1; i >= 0; i--) {
      const exp = explosions[i];
      exp.currentRadius += 140 * dt;
      exp.alpha -= 2.2 * dt;
      if (exp.alpha <= 0 || exp.currentRadius >= exp.maxRadius) {
        explosions.splice(i, 1);
        continue;
      }
      this.effectsGfx.lineStyle(3, 0xff4757, exp.alpha);
      this.effectsGfx.strokeCircle(exp.x, exp.y, exp.currentRadius);
    }

    // Ore Burst Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const alpha = Math.max(0, p.life / p.maxLife);
      this.effectsGfx.fillStyle(hexToNumber(p.color || '#e8a030'), alpha);
      this.effectsGfx.fillCircle(p.x, p.y, p.size || 3);
    }
  }
}

// ===========================================================
// INITIALIZE PHASER ENGINE
// ===========================================================

function getLifeLevel(lifetime) {
  if (lifetime < 25000) return 1;
  if (lifetime < 100000) return 2;
  if (lifetime < 500000) return 3;
  if (lifetime < 2500000) return 4;
  if (lifetime < 10000000) return 5;
  if (lifetime < 50000000) return 6;
  if (lifetime < 250000000) return 7;
  return 8 + Math.floor(Math.log10(lifetime / 250000000));
}

function updateHUD() {
  const hudCash = document.getElementById('hudCash');
  const hudRate = document.getElementById('hudRate');
  const hudLife = document.getElementById('hudLife');
  const hudLifetime = document.getElementById('hudLifetime');
  const hudBuildings = document.getElementById('hudBuildings');
  const hudOres = document.getElementById('hudOres');
  const hudModeBadge = document.getElementById('hudModeBadge');

  const lifetime = STATE.run.lifetimeEarnings || 0;
  const currentLife = getLifeLevel(lifetime);

  const rateSum = salesHistory.reduce((acc, cur) => acc + cur.val, 0);
  const incomeRate = Math.round(rateSum / 3);

  if (hudCash) hudCash.textContent = `$${(STATE.run.money || 0).toLocaleString()}`;
  if (hudRate) hudRate.textContent = `+$${incomeRate.toLocaleString()} / s`;
  if (hudLife) hudLife.textContent = `Life ${currentLife}`;
  if (hudLifetime) hudLifetime.textContent = `$${lifetime.toLocaleString()}`;
  if (hudBuildings) hudBuildings.textContent = STATE.run.buildings.length;
  const oreCount = STATE.run.ores.length;
  const maxOres = STATE.config.maxOres;
  if (hudOres) {
    hudOres.textContent = `${oreCount} / ${maxOres}`;
    if (hudOres.classList) hudOres.classList.toggle('warn', oreCount > maxOres * 0.85);
  }

  if (hudModeBadge) {
    if (mode === 'placing' && placingState) {
      const def = STATE.defs.buildingDefs[placingState.defId];
      const qty = getInventoryQty(placingState.defId);
      hudModeBadge.textContent = `Placing: ${def ? def.name : ''} (${qty} left)`;
      hudModeBadge.className = 'hud-mode-badge placing';
    } else if (mode === 'moving') {
      hudModeBadge.textContent = 'Moving';
      hudModeBadge.className = 'hud-mode-badge moving';
    } else if (mode === 'inspecting') {
      hudModeBadge.textContent = 'Inspector';
      hudModeBadge.className = 'hud-mode-badge';
    } else {
      hudModeBadge.textContent = 'Idle';
      hudModeBadge.className = 'hud-mode-badge';
    }
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0a0c0f',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'none'
  },
  scene: [FactoryScene]
};

window.addEventListener('DOMContentLoaded', () => {
  phaserGame = new Phaser.Game(phaserConfig);
  window.phaserGame = phaserGame;
  window.canvas = phaserGame.canvas;
});
