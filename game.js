// ===========================================================
// MINER'S HAVEN - GAME SIMULATION ENGINE & RENDERER
// ===========================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Extensible State Schema
const STATE = {
  config: {
    grid: { cols: 24, rows: 24, cellSize: 64 },
    maxOres: 300,
    beltAcceleration: 3,
    groundFriction: 2.5,
    oreGroundLifespan: 3
  },

  timeScale: 1.0,
  isPaused: false,

  unlockedBuildingIds: ['extractor', 'belt', 'fastBelt', 'halfBelt', 'upgrader1x1', 'upgraderHalf', 'seller', 'coalExtractor'],

  itemDefs: {
    ore: { id: 'ore', name: 'Standard Ore', color: '#ffb03b', size: 14, baseValue: 5, shape: 'circle' },
    megaOre: { id: 'megaOre', name: 'Mega Ore', color: '#ff4757', size: 22, baseValue: 25, shape: 'diamond' },
    magmaOre: { id: 'magmaOre', name: 'Magma Ore', color: '#ff4757', size: 18, baseValue: 50, shape: 'diamond', defaultStatus: { flaming: true } },
    uraniumOre: { id: 'uraniumOre', name: 'Uranium Ore', color: '#2ecc71', size: 16, baseValue: 150, shape: 'circle', defaultStatus: { radioactive: true } },
    coalOre: { id: 'coalOre', name: 'Coal Fuel Ore', color: '#334155', size: 16, baseValue: 15, shape: 'square', isFuel: true },
    superDiamondOre: { id: 'superDiamondOre', name: 'Super Diamond Ore', color: '#38bdf8', size: 24, baseValue: 300, shape: 'diamond', defaultStatus: { sparkling: true } }
  },

  buildingDefs: {
    extractor: {
      id: 'extractor', name: 'Standard Extractor', category: 'extractor', rarity: 'common', cost: 100,
      size: { w: 3, h: 1 }, layer: 'machine', color: '#3d6a8f', speed: 40,
      tags: ['dropper', 'starter'], attributes: { spawnRateMs: 1000 },
      ports: [{ dx: 3, dy: 0, kind: 'output', color: '#ffcf5c', dropSide: null }],
      produces: { item: 'ore', rate: 1000 }
    },
    coalExtractor: {
      id: 'coalExtractor', name: 'Coal Mine (Fuel)', category: 'extractor', rarity: 'common', cost: 300,
      size: { w: 3, h: 1 }, layer: 'machine', color: '#1e293b', speed: 40,
      tags: ['dropper', 'fuel_provider'], attributes: { fuelType: 'coal' },
      ports: [{ dx: 3, dy: 0, kind: 'output', color: '#475569', dropSide: null }],
      produces: { item: 'coalOre', rate: 1200 }
    },
    megaExtractor: {
      id: 'megaExtractor', name: '2x2 Mega Extractor', category: 'extractor', rarity: 'rare', cost: 500,
      size: { w: 2, h: 2 }, layer: 'machine', color: '#2b7873', speed: 40,
      tags: ['dropper', 'heavy_machinery'], attributes: { spawnRateMs: 1500 },
      ports: [{ dx: 2, dy: 0.5, kind: 'output', color: '#ff4757', dropSide: null }],
      produces: { item: 'megaOre', rate: 1500 }
    },
    volcanoDropper: {
      id: 'volcanoDropper', name: 'Volcano Mine (Flaming)', category: 'extractor', rarity: 'epic', cost: 600,
      size: { w: 3, h: 1 }, layer: 'machine', color: '#881337', speed: 40,
      tags: ['dropper', 'flaming'], attributes: { temperature: 1200 },
      ports: [{ dx: 3, dy: 0, kind: 'output', color: '#ff4757', dropSide: null }],
      produces: { item: 'magmaOre', rate: 1200 }
    },
    thermalExtractor: {
      id: 'thermalExtractor', name: 'Fueled Thermal Mine', category: 'extractor', rarity: 'rare', cost: 1200,
      size: { w: 3, h: 2 }, layer: 'machine', color: '#c2410c', speed: 40,
      tags: ['dropper', 'fuel_consuming'], attributes: { fuelRequired: 'coal', runDurationSec: 8 },
      requiresFuel: true,
      ports: [
        { dx: 0, dy: 0.5, kind: 'input', color: '#334155', dropSide: null },
        { dx: 3, dy: 0.5, kind: 'output', color: '#38bdf8', dropSide: null }
      ],
      produces: { item: 'superDiamondOre', rate: 800 }
    },
    uraniumMine: {
      id: 'uraniumMine', name: 'Uranium Centrifuge', category: 'extractor', rarity: 'exotic', cost: 2000,
      size: { w: 2, h: 2 }, layer: 'machine', color: '#14532d', speed: 40,
      tags: ['dropper', 'radioactive'], attributes: { radiationSv: 50 },
      ports: [{ dx: 2, dy: 0.5, kind: 'output', color: '#2ecc71', dropSide: null }],
      produces: { item: 'uraniumOre', rate: 1600 }
    },
    belt: {
      id: 'belt', name: 'Conveyor Belt', category: 'belt', rarity: 'common', cost: 10,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#4b4f58', speed: 90,
      tags: ['transport'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#ffcf5c', dropSide: 0 }]
    },
    fastBelt: {
      id: 'fastBelt', name: 'Fast Conveyor', category: 'belt', rarity: 'uncommon', cost: 30,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#3a7ca5', speed: 180,
      tags: ['transport'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#7fd0ff', dropSide: 0 }]
    },
    ultraBelt: {
      id: 'ultraBelt', name: 'Ultra Conveyor', category: 'belt', rarity: 'epic', cost: 100,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#d97706', speed: 320,
      tags: ['transport'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#fbbf24', dropSide: 0 }]
    },
    halfBelt: {
      id: 'halfBelt', name: 'Half-Width Belt', category: 'belt', rarity: 'uncommon', cost: 15,
      size: { w: 0.5, h: 1 }, layer: 'belt', color: '#334155', isHalfBelt: true, speed: 90,
      tags: ['transport', 'narrow'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#94a3b8', dropSide: 0 }]
    },
    splitter: {
      id: 'splitter', name: 'Belt Splitter (1→2)', category: 'belt', rarity: 'rare', cost: 40,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#e67e22', isSplitter: true, speed: 100,
      tags: ['routing'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#f39c12', dropSide: 0 }]
    },
    merger: {
      id: 'merger', name: 'Belt Merger (3→1)', category: 'belt', rarity: 'rare', cost: 40,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#27ae60', isMerger: true, speed: 100,
      tags: ['routing'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#2ecc71', dropSide: 0 }]
    },
    upgrader1x1: {
      id: 'upgrader1x1', name: '1x1 Upgrader', category: 'upgrader', rarity: 'common', cost: 150,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#d35400', multiplier: 2.0, energyCost: 10, speed: 90,
      tags: ['multiplier'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#e67e22', dropSide: 0 }]
    },
    upgrader2x1: {
      id: 'upgrader2x1', name: '2x1 Wide Upgrader', category: 'upgrader', rarity: 'rare', cost: 400,
      size: { w: 2, h: 1 }, layer: 'belt', color: '#c0392b', multiplier: 3.0, energyCost: 20, speed: 90,
      tags: ['multiplier'], attributes: {},
      ports: [
        { dx: 0, dy: 0, kind: 'through', color: '#e74c3c', dropSide: 0 },
        { dx: 1, dy: 0, kind: 'through', color: '#e74c3c', dropSide: 0 }
      ]
    },
    upgraderHalf: {
      id: 'upgraderHalf', name: 'Half Upgrader', category: 'upgrader', rarity: 'uncommon', cost: 100,
      size: { w: 0.5, h: 1 }, layer: 'belt', color: '#8e44ad', multiplier: 1.5, energyCost: 5, isHalf: true, speed: 90,
      tags: ['multiplier', 'narrow'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#9b59b6', dropSide: 0 }]
    },
    freonSprayer: {
      id: 'freonSprayer', name: 'Freon Cooling Sprayer', category: 'upgrader', rarity: 'uncommon', cost: 250,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#0284c7', extinguishes: true, appliesWet: 6, cooldownEnergy: 50, speed: 90,
      tags: ['cooling', 'extinguisher'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#38bdf8', dropSide: 0 }]
    },
    pyroRefiner: {
      id: 'pyroRefiner', name: 'Pyro Blast Furnace (3.5x)', category: 'upgrader', rarity: 'rare', cost: 400,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#b91c1c', multiplier: 3.5, appliesFlaming: true, speed: 90,
      tags: ['multiplier', 'flaming'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#f87171', dropSide: 0 }]
    },
    leadDecontaminator: {
      id: 'leadDecontaminator', name: 'Lead Decontaminator (2.5x)', category: 'upgrader', rarity: 'epic', cost: 500,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#475569', removesRadioactive: true, multiplier: 2.5, speed: 90,
      tags: ['decontaminator', 'multiplier'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#94a3b8', dropSide: 0 }]
    },
    stellarSparkler: {
      id: 'stellarSparkler', name: 'Stellar Prism (Sparkles)', category: 'upgrader', rarity: 'exotic', cost: 750,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#eab308', appliesSparkling: true, speed: 90,
      tags: ['sparkles', 'buff'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#fde047', dropSide: 0 }]
    },
    upgraderPlasma: {
      id: 'upgraderPlasma', name: 'Plasma Supercharger', category: 'upgrader', rarity: 'epic', cost: 800,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#ff0055', flatAdd: 50, energyCost: 35, speed: 100,
      tags: ['flat_boost', 'plasma'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#ff0055', dropSide: 0 }]
    },
    upgraderQuantum: {
      id: 'upgraderQuantum', name: 'Quantum Vault (4.0x)', category: 'upgrader', rarity: 'exotic', cost: 1500,
      size: { w: 1, h: 1 }, layer: 'belt', color: '#5f27cd', multiplier: 4.0, riskChance: 0.15, speed: 90,
      tags: ['multiplier', 'risky'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'through', color: '#341f97', dropSide: 0 }]
    },
    seller: {
      id: 'seller', name: 'Seller', category: 'seller', rarity: 'common', cost: 0,
      size: { w: 1, h: 1 }, layer: 'machine', color: '#7a4fa0', consumes: true,
      tags: ['furnace', 'starter'], attributes: {},
      ports: [{ dx: 0, dy: 0, kind: 'input', color: '#9ad1ff', dropSide: null }]
    },
    blastSmelter: {
      id: 'blastSmelter', name: 'Blast Smelter (2x Bonus)', category: 'seller', rarity: 'exotic', cost: 1500,
      size: { w: 2, h: 2 }, layer: 'machine', color: '#581c87', consumes: true, sellerBonus: 2.0,
      tags: ['furnace', 'heavy_machinery'], attributes: {},
      ports: [{ dx: 0, dy: 0.5, kind: 'input', color: '#a855f7', dropSide: null }]
    }
  },

  camera: { x: 0, y: 0, zoom: 1, minZoom: 0.25, maxZoom: 4 },

  world: {
    buildings: [],
    ores: [],
    money: 1000
  },

  nextId: 1
};

STATE.camera.x = (STATE.config.grid.cols * STATE.config.grid.cellSize) / 2;
STATE.camera.y = (STATE.config.grid.rows * STATE.config.grid.cellSize) / 2;

function genId(prefix) {
  return `${prefix}_${STATE.nextId++}`;
}

// Transient UI State
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

// Save Game Engine
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

function loadSavedGame() {
  fetch('/savegame.json')
    .then(res => res.json())
    .then(savedState => {
      if (savedState && savedState.world) {
        if (typeof savedState.world.money === 'number') STATE.world.money = savedState.world.money;
        if (Array.isArray(savedState.world.buildings)) STATE.world.buildings = savedState.world.buildings;
        if (Array.isArray(savedState.unlockedBuildingIds)) STATE.unlockedBuildingIds = savedState.unlockedBuildingIds;
        if (savedState.buildingDefs) Object.assign(STATE.buildingDefs, savedState.buildingDefs);
        if (savedState.itemDefs) Object.assign(STATE.itemDefs, savedState.itemDefs);
        renderHotbar();
        renderInventoryGrid();
      }
    })
    .catch(() => {
      const local = localStorage.getItem('miners_haven_save');
      if (local) {
        try {
          const savedState = JSON.parse(local);
          if (savedState && savedState.world) {
            if (typeof savedState.world.money === 'number') STATE.world.money = savedState.world.money;
            if (Array.isArray(savedState.world.buildings)) STATE.world.buildings = savedState.world.buildings;
            if (Array.isArray(savedState.unlockedBuildingIds)) STATE.unlockedBuildingIds = savedState.unlockedBuildingIds;
            if (savedState.buildingDefs) Object.assign(STATE.buildingDefs, savedState.buildingDefs);
            if (savedState.itemDefs) Object.assign(STATE.itemDefs, savedState.itemDefs);
            renderHotbar();
            renderInventoryGrid();
          }
        } catch(e) {}
      }
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
  const def = defId ? STATE.buildingDefs[defId] : (placingState ? STATE.buildingDefs[placingState.defId] : null);

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
  for (const b of STATE.world.buildings) {
    if (excludeId && b.id === excludeId) continue;
    const def = STATE.buildingDefs[b.defId];
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
  const def = STATE.buildingDefs[defId];

  if (col < 0 || row < 0 || col + w > gridW || row + h > gridH) return true;

  const eps = 0.0001;
  for (const b of STATE.world.buildings) {
    if (b.id === excludeId) continue;
    const bDef = STATE.buildingDefs[b.defId];
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
  for (let i = STATE.world.buildings.length - 1; i >= 0; i--) {
    const b = STATE.world.buildings[i];
    const def = STATE.buildingDefs[b.defId];
    const fp = getFootprint(def, b.rot);
    if (col >= b.col && col < b.col + fp.w && row >= b.row && row < b.row + fp.h) return b;
  }
  return null;
}
function findBuildingById(id) {
  return STATE.world.buildings.find(b => b.id === id) || null;
}

// Building Placement & Actions
function tryPlaceBuilding(defId, col, row, rot) {
  const def = STATE.buildingDefs[defId];
  if (!def) return false;
  if (!STATE.unlockedBuildingIds.includes(defId)) {
    showToast(`🔒 ${def.name} is locked! Open Crates to unlock.`);
    return false;
  }
  const cost = def.cost || 0;
  if (STATE.world.money < cost) {
    showToast(`❌ Need $${cost} to place ${def.name}!`);
    return false;
  }
  const fp = getFootprint(def, rot);
  if (wouldOverlapAt(defId, col, row, fp.w, fp.h, null)) return false;

  STATE.world.money -= cost;
  STATE.world.buildings.push({
    id: genId('bldg'), defId, col, row, rot,
    fuelTimer: 0,
    lastProduced: performance.now()
  });
  triggerSaveState();
  return true;
}

function tryMoveBuilding(building, col, row, rot) {
  const def = STATE.buildingDefs[building.defId];
  const fp = getFootprint(def, rot);
  if (wouldOverlapAt(building.defId, col, row, fp.w, fp.h, building.id)) return false;
  building.col = col; building.row = row; building.rot = rot;
  triggerSaveState();
  return true;
}

function rotateBuildingInPlace(building) {
  const def = STATE.buildingDefs[building.defId];
  const newRot = (building.rot + 1) % 4;
  const fp = getFootprint(def, newRot);
  const origin = clampedOrigin(fp.w, fp.h, building.col, building.row);
  if (wouldOverlapAt(building.defId, origin.col, origin.row, fp.w, fp.h, building.id)) return false;
  building.col = origin.col; building.row = origin.row; building.rot = newRot;
  triggerSaveState();
  return true;
}

function deleteBuilding(building) {
  const def = STATE.buildingDefs[building.defId];
  if (def && def.cost) {
    STATE.world.money += Math.floor(def.cost * 0.75);
  }
  const idx = STATE.world.buildings.findIndex(b => b.id === building.id);
  if (idx >= 0) STATE.world.buildings.splice(idx, 1);
  if (selectedEntity && selectedEntity.type === 'building' && selectedEntity.id === building.id) {
    selectedEntity = null;
  }
  triggerSaveState();
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
    const def = STATE.buildingDefs[placingState.defId];
    const fp = getFootprint(def, placingState.rot);
    const raw = worldToCell(world.x, world.y);
    const origin = clampedOrigin(fp.w, fp.h, raw.col, raw.row);
    tryPlaceBuilding(placingState.defId, origin.col, origin.row, placingState.rot);
  } else if (mode === 'moving') {
    const building = findBuildingById(movingState.buildingId);
    if (building) {
      const def = STATE.buildingDefs[building.defId];
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
    const def = STATE.buildingDefs[placingState.defId];
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

// Touch Event Handling for Mobile Devices
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
      const def = STATE.buildingDefs[placingState.defId];
      if (def && def.layer === 'belt') {
        isBeltDragging = true;
        beltDragStart = cell;
      }
    }
    isDragging = true;
    dragMoved = false;
  } else if (e.touches.length === 2) {
    const t1 = e.touches[0], t2 = e.touches[1];
    touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && isDragging) {
    const t = e.touches[0];
    mouseScreen = { x: t.clientX, y: t.clientY };
    const dx = t.clientX - lastTouchPos.x;
    const dy = t.clientY - lastTouchPos.y;
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

// Selection Logic
function selectEntityAt(wx, wy) {
  const cell = worldToCell(wx, wy);
  const b = findBuildingAtCell(cell.col, cell.row);
  if (b) { selectedEntity = { type: 'building', id: b.id }; updateInspectorPanel(); return; }
  for (let i = STATE.world.ores.length - 1; i >= 0; i--) {
    const o = STATE.world.ores[i];
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
  if (selectedEntity.type === 'ore') return STATE.world.ores.find(o => o.id === selectedEntity.id) || null;
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

  const typeLabel = selectedEntity.type === 'ore' ? 'Ore' : (STATE.buildingDefs[obj.defId] ? STATE.buildingDefs[obj.defId].name : 'Building');
  title.textContent = `${typeLabel} — ${obj.id}`;

  if (selectedEntity.type === 'ore') {
    let activeEffects = [];
    if (obj.status) {
      if (obj.status.flaming) activeEffects.push('🔥 Flaming (Explodes in 4s!)');
      if (obj.status.radioactive) activeEffects.push('☢️ Radioactive (Hazardous!)');
      if (obj.status.wet > 0) activeEffects.push(`💧 Wet (${Math.ceil(obj.status.wet)}s Fire Immunity)`);
      if (obj.status.sparkling) activeEffects.push('✨ Sparkling (+0.5x Multiplier!)');
    }
    const inspectData = {
      id: obj.id, itemType: obj.itemType, value: `$${obj.value}`, energy: obj.energy || 0,
      statusEffects: activeEffects.length ? activeEffects : ['Normal'],
      position: { x: Math.round(obj.x), y: Math.round(obj.y) }
    };
    body.textContent = JSON.stringify(inspectData, null, 2);
  } else {
    body.textContent = JSON.stringify(obj, null, 2);
  }
}

// Simulation & Physics Engine
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
  for (let j = 0; j < STATE.world.ores.length; j++) {
    const nearOre = STATE.world.ores[j];
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
  if (STATE.isPaused) return;
  const dt = rawDt * (STATE.timeScale || 1.0);

  updateProduction(dt);
  updateOrePhysics(dt);
  resolveOreCollisions();
  processConsumption();
  updateEffects(dt);
}

function updateProduction(dt) {
  for (const b of STATE.world.buildings) {
    if (movingState && movingState.buildingId === b.id) continue;
    const def = STATE.buildingDefs[b.defId];
    if (!def.produces) continue;

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
  if (STATE.world.ores.length >= STATE.config.maxOres) return;
  const fp = getFootprint(def, building.rot);
  const outPort = fp.ports.find(p => p.kind === 'output');
  if (!outPort) return;
  const itemDef = STATE.itemDefs[def.produces.item] || STATE.itemDefs['ore'];
  const cs = STATE.config.grid.cellSize;

  const portX = (building.col + outPort.dx + 0.5) * cs;
  const portY = (building.row + outPort.dy + 0.5) * cs;

  STATE.world.ores.push({
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

  for (let i = STATE.world.ores.length - 1; i >= 0; i--) {
    const ore = STATE.world.ores[i];
    if (!ore || ore.destroyed) continue;

    if (!ore.status) ore.status = {};

    // 1. Wet Status
    if (ore.status.wet > 0) {
      ore.status.wet = Math.max(0, ore.status.wet - dt);
      if (ore.status.flaming) { ore.status.flaming = false; ore.status.flameTime = 0; }
    }

    // 2. Flaming Status
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

    // 3. Radioactive Status
    if (ore.status.radioactive) {
      if (Math.random() < 0.25) {
        particles.push({
          x: ore.x + (Math.random() - 0.5) * 10, y: ore.y + (Math.random() - 0.5) * 10,
          vx: 0, vy: -12, life: 0.4, maxLife: 0.4, color: '#2ecc71', size: 3
        });
      }
    }

    // 4. Sparkling Status
    if (ore.status.sparkling) {
      if (Math.random() < 0.3) {
        particles.push({
          x: ore.x + (Math.random() - 0.5) * 8, y: ore.y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
          life: 0.35, maxLife: 0.35, color: '#ffcf5c', size: 3
        });
      }
    }

    const cell = worldToCell(ore.x, ore.y);
    const transport = getTransportPortAt(cell.col, cell.row);
    let targetVx = 0, targetVy = 0, blend;

    if (transport) {
      ore.groundTime = 0;
      const b = transport.building;
      const def = transport.def;

      // Fuel Extractor input port handling!
      if (def.requiresFuel && transport.port.kind === 'input' && ore.isFuel) {
        b.fuelTimer = (b.fuelTimer || 0) + (def.attributes.runDurationSec || 8);
        ore.destroyed = true;
        showToast(`⛽ Fuel Loaded! Thermal Mine running for ${Math.round(b.fuelTimer)}s!`);
        continue;
      }

      if (def.riskChance && !ore.quantumChecked) {
        ore.quantumChecked = true;
        if (Math.random() < def.riskChance) {
          ore.destroyed = true; triggerExplosion(ore.x, ore.y, 40); continue;
        }
      }

      if (!ore.upgradersPassed) ore.upgradersPassed = [];
      if (!ore.upgradersPassed.includes(b.id)) {
        ore.upgradersPassed.push(b.id);
        if (def.extinguishes) { ore.status.flaming = false; ore.status.flameTime = 0; ore.energy = 0; }
        if (def.appliesWet) { ore.status.wet = def.appliesWet; ore.status.flaming = false; }
        if (def.appliesFlaming && !ore.status.wet) { ore.status.flaming = true; ore.status.flameTime = 0; }
        if (def.removesRadioactive) { ore.status.radioactive = false; }
        if (def.appliesSparkling) { ore.status.sparkling = true; }

        let effectiveMulti = def.multiplier || 1.0;
        if (def.multiplier && ore.status.sparkling) effectiveMulti += 0.5;
        if (def.multiplier) { ore.value = Math.round(ore.value * effectiveMulti); ore.upgraded = true; }
        if (def.flatAdd) { ore.value += def.flatAdd; ore.upgraded = true; }
        if (def.isDiminishing) {
          const passCount = ore.upgradersPassed.filter(id => id === b.id).length;
          const multi = passCount === 1 ? 3.0 : (passCount === 2 ? 1.8 : (passCount === 3 ? 1.2 : 1.05));
          ore.value = Math.round(ore.value * multi); ore.upgraded = true;
        }
        if (def.energyCost) ore.energy = (ore.energy || 0) + def.energyCost;
        if (def.cooldownEnergy) ore.energy = Math.max(0, (ore.energy || 0) - def.cooldownEnergy);

        if (ore.energy > (ore.maxEnergy || 100)) {
          ore.destroyed = true; triggerExplosion(ore.x, ore.y, 110); continue;
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
      const speed = def.speed || 0;
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

  STATE.world.ores = STATE.world.ores.filter(o => !o.destroyed);
  if (selectedEntity && selectedEntity.type === 'ore') {
    if (!STATE.world.ores.some(o => o.id === selectedEntity.id)) selectedEntity = null;
  }
}

function resolveOreCollisions() {
  const list = STATE.world.ores;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
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
  for (const ore of STATE.world.ores) {
    if (ore.destroyed) continue;
    const cell = worldToCell(ore.x, ore.y);
    const occupants = getCellOccupants(cell.col, cell.row);
    const sellerAcc = occupants.find(o => o.def.consumes && o.isPort && o.port.kind === 'input');
    if (sellerAcc) {
      let soldVal = ore.value;
      if (sellerAcc.def.sellerBonus) soldVal = Math.round(soldVal * sellerAcc.def.sellerBonus);
      STATE.world.money += soldVal;
      ore.destroyed = true;
    }
  }
}

// Rendering System
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
    const def = STATE.buildingDefs[placingState.defId];
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
    const def = STATE.buildingDefs[building.defId];
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

  const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
  const arrowDist = 18 * STATE.camera.zoom;
  const arrows = [
    { dir: 0, x: p2.x + arrowDist, y: cy, char: '▶' },
    { dir: 1, x: cx, y: p2.y + arrowDist, char: '▼' },
    { dir: 2, x: p1.x - arrowDist, y: cy, char: '◀' },
    { dir: 3, x: cx, y: p1.y - arrowDist, char: '▲' }
  ];

  ctx.font = `bold ${Math.max(12, 14 * STATE.camera.zoom)}px system-ui`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  arrows.forEach(arr => {
    ctx.fillStyle = arr.dir === rot ? '#ff9f6b' : 'rgba(255,255,255,0.4)';
    ctx.fillText(arr.char, arr.x, arr.y);
  });
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
  for (const b of STATE.world.buildings) {
    const def = STATE.buildingDefs[b.defId];
    const fp = getFootprint(def, b.rot);
    const p1 = worldToScreen(b.col * cs, b.row * cs);
    const p2 = worldToScreen((b.col + fp.w) * cs, (b.row + fp.h) * cs);
    const isSelected = selectedEntity && selectedEntity.type === 'building' && selectedEntity.id === b.id;

    ctx.save();
    if (isSelected) drawSelectionGlowAndGizmo(p1, p2, b.rot);

    if (def.isHalfBelt) {
      ctx.fillStyle = '#1e293b'; ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      ctx.fillStyle = def.color;
      if (b.rot % 2 === 0) {
        const h = (p2.y - p1.y) * 0.5; ctx.fillRect(p1.x, p1.y + h * 0.5, p2.x - p1.x, h);
      } else {
        const w = (p2.x - p1.x) * 0.5; ctx.fillRect(p1.x + w * 0.5, p1.y, w, p2.y - p1.y);
      }
    } else {
      ctx.fillStyle = def.color; ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    }

    ctx.strokeStyle = isSelected ? '#7fd0ff' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

    if (b.walls) drawBeltWalls(b, p1, p2);
    if (def.category === 'upgrader') drawUpgraderGuideWalls(b, p1, p2);

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

function drawUpgraderGuideWalls(b, p1, p2) {
  const wallThick = Math.max(3, 5 * STATE.camera.zoom);
  ctx.fillStyle = '#334155'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
  if (b.rot % 2 === 0) {
    ctx.fillRect(p1.x, p1.y, p2.x - p1.x, wallThick); ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, wallThick);
    ctx.fillRect(p1.x, p2.y - wallThick, p2.x - p1.x, wallThick); ctx.strokeRect(p1.x, p2.y - wallThick, p2.x - p1.x, wallThick);
  } else {
    ctx.fillRect(p1.x, p1.y, wallThick, p2.y - p1.y); ctx.strokeRect(p1.x, p1.y, wallThick, p2.y - p1.y);
    ctx.fillRect(p2.x - wallThick, p1.y, wallThick, p2.y - p1.y); ctx.strokeRect(p2.x - wallThick, p1.y, wallThick, p2.y - p1.y);
  }
}

function drawBeltWalls(b, p1, p2) {
  if (!b.walls) return;
  const wallThick = Math.max(3, 4 * STATE.camera.zoom);
  ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
  if (b.walls[0]) { ctx.fillRect(p2.x - wallThick, p1.y, wallThick, p2.y - p1.y); ctx.strokeRect(p2.x - wallThick, p1.y, wallThick, p2.y - p1.y); }
  if (b.walls[1]) { ctx.fillRect(p1.x, p2.y - wallThick, p2.x - p1.x, wallThick); ctx.strokeRect(p1.x, p2.y - wallThick, p2.x - p1.x, wallThick); }
  if (b.walls[2]) { ctx.fillRect(p1.x, p1.y, wallThick, p2.y - p1.y); ctx.strokeRect(p1.x, p1.y, wallThick, p2.y - p1.y); }
  if (b.walls[3]) { ctx.fillRect(p1.x, p1.y, p2.x - p1.x, wallThick); ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, wallThick); }
}

function drawOres() {
  const lifespan = STATE.config.oreGroundLifespan;
  for (const o of STATE.world.ores) {
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

    if (o.status) {
      if (o.status.flaming) { ctx.shadowColor = '#ff4757'; ctx.shadowBlur = 18 * STATE.camera.zoom; }
      else if (o.status.radioactive) { ctx.shadowColor = '#2ecc71'; ctx.shadowBlur = 16 * STATE.camera.zoom; }
      else if (o.status.sparkling) { ctx.shadowColor = '#ffcf5c'; ctx.shadowBlur = 14 * STATE.camera.zoom; }
      else if (o.status.wet > 0) { ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 12 * STATE.camera.zoom; }
      else if (o.energy && o.energy > 0) {
        const energyRatio = Math.min(1.0, o.energy / (o.maxEnergy || 100));
        ctx.shadowColor = energyRatio > 0.7 ? '#ff0055' : '#ffa502';
        ctx.shadowBlur = (8 + energyRatio * 16) * STATE.camera.zoom;
      } else if (o.upgraded) {
        ctx.shadowColor = o.color || '#ffcf5c'; ctx.shadowBlur = 10 * STATE.camera.zoom;
      }
    }

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
  const money = `$${(STATE.world.money || 0).toLocaleString()}`;
  const bldgCount = STATE.world.buildings.length;
  const oreCount = STATE.world.ores.length;
  let hudText = `💰 Cash: ${money}  |  🏭 Buildings: ${bldgCount}  |  💎 Active Ores: ${oreCount}/${STATE.config.maxOres}\n[Controls] Click+Drag: Pan | Scroll: Zoom | E: Inventory | R: Rotate | 1-6: Hotbar`;

  if (mode === 'placing' && placingState) {
    const def = STATE.buildingDefs[placingState.defId];
    hudText += `\n📍 PLACING: ${def ? def.name : ''} ($${def ? def.cost : 0}) [R: Rotate | Esc: Cancel]`;
  } else if (mode === 'moving') {
    hudText += `\n🚚 MOVING BUILDING [R: Rotate | Esc: Cancel]`;
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

// Periodic live saving every 5 seconds
setInterval(triggerSaveState, 5000);

// Main Game Loop
function loop(now) { update(now); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
