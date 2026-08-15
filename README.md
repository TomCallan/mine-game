# 🏭 Miner's Haven Clone

A high-performance, real-time 2D factory building game built with HTML5 Canvas, Vanilla CSS, and Modular JavaScript. Inspired by *Miner's Haven*, players build automated production lines using **Droppers (Mines)**, **Conveyors**, **Upgraders**, **Decontaminators/Coolers**, and **Smelters/Furnaces**.

---

## 🚀 Key Features

* **Interactive Machine & Object Creator**: Integrated 12x12 pixel art sprite editor and data configurator to design, paint, and register your own custom Extractors, Belts, Upgraders, and Sellers directly in-game.
* **Ore Status Effects & Hazards**:
  * **🔥 Flaming**: Magma/blast furnace ores burn up and explode after 4 seconds unless doused.
  * **💧 Wet**: Freon cooling spray extinguishes fire and grants 6s Fire Immunity.
  * **☢️ Radioactive**: Uranium ores generate high profits ($150) but require Lead Shielding.
  * **✨ Sparkling**: Stellar Prisms grant glittering sparkles that boost all downstream upgraders by +0.5x.
* **Fuel Extractor Mechanics**: Thermal Mines take **Coal Fuel Ores** into input ports and mine **Super Diamond Ores** ($300 base value) for 8 seconds per Coal consumed.
* **Loot Box Crate Shop**: Unbox Regular ($250), Golden ($1,000), and Exotic ($5,000) Crates via an animated CS-GO style roulette wheel to unlock rare and exotic machines.
* **Mobile-First Touch & Gestures**: Single-finger camera panning, pinch-to-zoom, double-tap context cards, and responsive mobile HUD/Hotbar overlays.
* **Live Disk Save Engine**: Asynchronously saves game state to `savegame.json` on disk and `localStorage` every 5 seconds and on every build action.

---

## 🧠 Data Structure Architecture

Everything in the simulation is managed inside a single, JSON-serializable `STATE` object defined in [`game.js`](file:///C:/Users/TomCa/Documents/mine-game/game.js).

```js
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

  unlockedBuildingIds: ['extractor', 'belt', 'fastBelt', 'halfBelt', 'upgrader1x1', 'seller', 'coalExtractor'],

  itemDefs: { /* Ore definitions */ },
  buildingDefs: { /* Machine definitions */ },

  world: {
    buildings: [
      { id: 'bldg_1', defId: 'extractor', col: 4, row: 2, rot: 0, fuelTimer: 0, lastProduced: 12450.2 }
    ],
    ores: [
      { id: 'ore_1', itemType: 'ore', x: 288, y: 160, vx: 40, vy: 0, size: 14, color: '#ffb03b', value: 25, status: { flaming: false } }
    ],
    money: 1000
  }
};
```

---

## 🏷️ The Attribute & Metadata System

Every building definition in `STATE.buildingDefs` adheres to an extensible schema designed for easy expansion and moddability.

### Building Definition Schema

```typescript
interface BuildingDefinition {
  id: string;                 // Unique identifier (e.g. 'volcanoDropper')
  name: string;               // Display name (e.g. 'Volcano Mine')
  category: 'extractor' | 'belt' | 'upgrader' | 'seller';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'exotic';
  cost: number;               // Purchase cost in dollars ($)
  size: { w: number, h: number }; // Tile footprint (supports fractional sizes like 0.5)
  layer: 'machine' | 'belt';  // Determines if belts can overlap under machines
  color: string;              // Base swatch / renderer fill color
  speed?: number;             // Conveyor transport speed (px/sec)

  // Status & Mechanics Flags
  multiplier?: number;        // Value multiplier (e.g. 2.0x)
  flatAdd?: number;           // Flat value addition (e.g. +$50)
  energyCost?: number;        // Energy/Heat added to ore (explodes if > 100)
  cooldownEnergy?: number;    // Energy/Heat removed from ore
  extinguishes?: boolean;     // Removes flaming status & resets energy
  appliesWet?: number;        // Seconds of wet/fire immunity granted
  appliesFlaming?: boolean;   // Sets ore on fire
  removesRadioactive?: boolean; // Cleanses radiation hazard
  appliesSparkling?: boolean;// Grants sparkling status (+0.5x upgrader buff)
  consumes?: boolean;         // Marks building as a Seller / Furnace
  sellerBonus?: number;       // Sale multiplier bonus (e.g. 2.0x)
  requiresFuel?: boolean;     // Indicates machine requires fuel input

  // Extensible Tags & Attributes
  tags: string[];             // Classifiers (e.g. ['dropper', 'flaming', 'heavy_machinery'])
  attributes: Record<string, any>; // Dynamic key-value dictionary for future mechanics
  
  ports: PortDefinition[];    // Input, Output, and Through ports
  produces?: { item: string, rate: number }; // Ore output definition
}
```

---

## ➕ How to Add New Attributes & Custom Objects

### 1. Adding a New Attribute to Existing Objects

To add a new attribute (such as `conductivity`, `magnetic`, `temperatureTolerance`, or `decayRate`), simply add it to the `attributes` dictionary or root definition in [`game.js`](file:///C:/Users/TomCa/Documents/mine-game/game.js):

```js
STATE.buildingDefs.magneticConveyor = {
  id: 'magneticConveyor',
  name: 'Magnetic Belt',
  category: 'belt',
  rarity: 'epic',
  cost: 450,
  size: { w: 1, h: 1 },
  layer: 'belt',
  color: '#6366f1',
  speed: 250,
  tags: ['transport', 'magnetic'],
  attributes: {
    magneticPullStrength: 150,
    conductivity: 2.5
  },
  ports: [{ dx: 0, dy: 0, kind: 'through', color: '#818cf8', dropSide: 0 }]
};
```

### 2. Consuming Attributes in the Simulation Loop

In [`game.js`](file:///C:/Users/TomCa/Documents/mine-game/game.js), check your custom attribute inside `updateOrePhysics(dt)` or `updateProduction(dt)`:

```js
if (def.attributes && def.attributes.magneticPullStrength) {
  const pull = def.attributes.magneticPullStrength;
  ore.vx += pull * dt;
}
```

### 3. Adding Custom Machines In-Game

You can also use the in-game **🎨 Object Creator**:
1. Open the Inventory (`E` key or `📦 Inventory`).
2. Click **🎨 Object Creator**.
3. Paint your 12x12 pixel art sprite.
4. Select Category (`Extractor`, `Belt`, `Upgrader`, `Seller`), cost, dimensions, and stats.
5. Click **✨ Save & Register New Item**. The item is automatically assigned to `STATE.buildingDefs` and saved to disk.

---

## 📦 Inventory Catalog of Included Objects

| Object Name | Category | Rarity | Size | Cost | Special Attributes & Mechanics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard Extractor** | Extractor | ⚪ Common | 3x1 | $100 | Mines Standard Ore ($5 base value, 1000ms rate) |
| **Coal Mine** | Extractor | ⚪ Common | 3x1 | $300 | Mines Coal Fuel Ore (used to fuel Thermal Mines) |
| **2x2 Mega Extractor** | Extractor | 🔵 Rare | 2x2 | $500 | Mines Mega Ore ($25 base value, 1500ms rate) |
| **Volcano Mine** | Extractor | 🟣 Epic | 3x1 | $600 | Mines Magma Ore ($50 base value, drops **🔥 Flaming**) |
| **Fueled Thermal Mine** | Extractor | 🔵 Rare | 3x2 | $1,200 | Takes Coal input to mine Super Diamond Ores ($300 value) |
| **Uranium Centrifuge** | Extractor | 🟡 Exotic | 2x2 | $2,000 | Mines Uranium Ore ($150 base value, drops **☢️ Radioactive**) |
| **Conveyor Belt** | Conveyor | ⚪ Common | 1x1 | $10 | 90 px/s standard transport speed |
| **Half-Width Belt** | Conveyor | 🟢 Uncommon | 0.5x1 | $15 | 90 px/s half-tile narrow conveyor |
| **Fast Conveyor** | Conveyor | 🟢 Uncommon | 1x1 | $30 | 180 px/s high-speed conveyor |
| **Belt Splitter (1→2)** | Conveyor | 🔵 Rare | 1x1 | $40 | Alternates ores left and right |
| **Belt Merger (3→1)** | Conveyor | 🔵 Rare | 1x1 | $40 | Merges 3 input paths into 1 output direction |
| **Ultra Conveyor** | Conveyor | 🟣 Epic | 1x1 | $100 | 320 px/s ultra-fast conveyor |
| **1x1 Upgrader** | Upgrader | ⚪ Common | 1x1 | $150 | 2.0x value multiplier (+10 energy) |
| **Half Upgrader** | Upgrader | 🟢 Uncommon | 0.5x1 | $100 | 1.5x value multiplier (+5 energy, 0.5 tile width) |
| **Freon Cooling Sprayer** | Upgrader | 🟢 Uncommon | 1x1 | $250 | Extinguishes fire, grants **💧 Wet** (6s Fire Immunity) |
| **2x1 Wide Upgrader** | Upgrader | 🔵 Rare | 2x1 | $400 | 3.0x value multiplier (+20 energy) |
| **Pyro Blast Furnace** | Upgrader | 🔵 Rare | 1x1 | $400 | 3.5x value multiplier, sets ore on **🔥 Flaming** status |
| **Lead Decontaminator** | Upgrader | 🟣 Epic | 1x1 | $500 | Cleanses **☢️ Radioactive** status while multiplying value 2.5x |
| **Stellar Prism** | Upgrader | 🟡 Exotic | 1x1 | $750 | Applies **✨ Sparkling** status (+0.5x upgrader multiplier buff) |
| **Plasma Supercharger** | Upgrader | 🟣 Epic | 1x1 | $800 | +$50 flat value boost (+35 energy) |
| **Quantum Vault** | Upgrader | 🟡 Exotic | 1x1 | $1,500 | 4.0x value multiplier (15% risk of ore destruction) |
| **Seller** | Seller | ⚪ Common | 1x1 | $0 | Standard ore selling furnace |
| **Blast Smelter** | Seller | 🟡 Exotic | 2x2 | $1,500 | 2x2 heavy smelter granting **2.0x sale bonus** |

---

## 🛠️ Local Development & Deployment

### Running Locally

```bash
# Start Node hot-reloading dev server
node server.js
```
Open **`http://localhost:8080`** in your browser.

### GitHub Repository & Deployment

```bash
git remote add origin git@github.com:TomCallan/mine-game.git
git branch -M main
git push -u origin main
```
