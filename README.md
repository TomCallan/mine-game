# 🏭 Miner's Haven Clone — Major Progression & Metagame Overhaul

A high-performance, real-time 2D factory building game built with HTML5 Canvas, Vanilla CSS, and Modular JavaScript. Inspired by *Miner's Haven*, players build automated production lines using **Extractors (Mines)**, **Conveyors**, **Upgraders**, **Decontaminators/Coolers**, **Crates**, **Relics**, and **Sellers/Smelters**.

---

## 🚀 Key Features

* **3 Progression Layers**: Explicit separation of **Run State** (cash, placed buildings, ores), **Inventory** (purchased stock & permanent crate unlocks), and **Meta Progression** (Prestige Points, Prestige Keys, Blueprints, Relics, Shards, Dust).
* **Shop vs. Inventory Separation**: Buy items from the shop with cash to store in inventory. Placing on the canvas consumes inventory stock; demolishing returns items to inventory.
* **Prestige Metagame Engine**: Prestige at $\ge \$10\text{B}$ lifetime earnings to earn permanent **Prestige Points** and **Prestige Keys**.
  - $\text{Prestige Points} = \lfloor (\frac{\text{Lifetime Earnings}}{10^{10}})^{0.5} \rfloor$
  - $\text{Prestige Keys} = \max(1, 1 + \lfloor \log_{10}(\frac{\text{Lifetime Earnings}}{10^{10}}) \rfloor)$
* **4-Tiered Crate Unboxing**: Unbox **Regular** ($250), **Golden** ($1,000), **Exotic** ($5,000), and **Prestige** (1 Key) Crates via an animated roulette wheel.
  - Duplicate standard blueprints convert to **Shards**.
  - Duplicate prestige rewards convert to **Prestige Dust**.
* **20 New Objects & Status Mechanics**:
  - **Ore Statuses**: `flaming`, `wet`, `radioactive`, `sparkling`, `lucky` (2x next upgrade multiplier), `crystalline` (+0.75x upgrader buff), `nullified` (cleanses hazards), `duplicated` (anti-infinite duplication loop flag), `timeAged` (travel time scaling).
  - **New Extractors**: Crystal Geode Driller, Antimatter Siphon, Temporal Flux Borer, Bioluminescent Algae Vat, Void Fragment Harvester.
  - **New Logistics**: MagLev Rail, Phase-Shift Conveyor, Gravity Inverter Belt, Cryo-Storage Conveyor, Quantum Entanglement Link.
  - **New Upgraders & Sellers**: Ore Crystallizer, Probability Amplifier, Entropy Stabilizer, Resonance Harmonizer, Matter Replicator, Ore Transmuter, Shard of Life, Dimensional Vault, Catalytic Converter, Soul Forge.
* **Passive Relic System**: Collect account-wide passive relics (`warehouseCharter`, `starterBelts`, `sellerPermit`, `crateMagnet`, `salvageToolkit`, `insuranceSeal`, `exoticPermit`, `vaultArchivist`) displayed in a dedicated UI tab.
* **Mobile-First Touch Architecture**:
  - **48x48 CSS px** minimum touch targets with `touch-action: manipulation`.
  - **Full-Screen Mobile Panels & Tall Bottom Sheets** (`overscroll-behavior: contain`) preventing nested scrolling conflicts.
  - **Tap-to-Select & Tap-to-Place** placement model with on-screen mobile toolbar controls (Rotate, Inspect, Zoom, Cancel).
  - Bottom-heavy thumb-friendly HUD.
* **Interactive Custom Object Creator**: Integrated 12x12 pixel art sprite editor and configurator to create custom Extractors, Belts, Upgraders, and Sellers directly in-game.
* **Live Save & Migration Engine**: Saves game state asynchronously to `savegame.json` on disk and `localStorage`. Includes backward-compatibility migration for older save formats (`STATE.world.*`).

---

## 🧠 Data Structure Architecture

Everything in the simulation is managed inside a central, JSON-serializable `STATE` object defined in [`game.js`](file:///home/administrator/mine-game/game.js):

```js
const STATE = {
  config: {
    grid: { cols: 24, rows: 24, cellSize: 64 },
    maxOres: 300,
    beltAcceleration: 3,
    groundFriction: 2.5,
    oreGroundLifespan: 3,
    prestigeThresholdLifetime: 1e10,
    prestigeKeyLogBase: 10,
    inventoryBaseCapacity: 40
  },

  run: {
    money: 1000,
    lifetimeEarnings: 0,
    buildings: [],
    ores: [],
    timeScale: 1.0,
    isPaused: false
  },

  shop: { stock: {}, dynamicPriceLevel: {} },

  inventory: {
    capacity: 40,
    items: {},
    permanentItems: {},
    consumables: {}
  },

  meta: {
    prestigePoints: 0,
    prestigeKeys: 0,
    blueprintUnlocks: {},
    relics: {},
    shards: 0,
    prestigeDust: 0,
    collection: {}
  },

  defs: { itemDefs: {}, buildingDefs: {}, relicDefs: {}, crateDefs: {} }
};
```

---

## 📦 Objects & Machines Catalog

| Object Name | Category | Rarity | Size | Cost | Growth Rate | Mechanics & Attributes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard Extractor** | Extractor | ⚪ Common | 3x1 | $100 | 1.10x | Mines Standard Ore ($5 base value) |
| **Coal Mine** | Extractor | ⚪ Common | 3x1 | $450 | 1.10x | Mines Coal Fuel Ore |
| **2x2 Mega Extractor** | Extractor | 🔵 Rare | 2x2 | $4,500 | 1.12x | Mines Mega Ore ($25 base value) |
| **Volcano Mine** | Extractor | 🟣 Epic | 3x1 | $18,000 | 1.13x | Mines Magma Ore (drops **🔥 Flaming**) |
| **Crystal Geode Driller** | Extractor | 🔵 Rare | 3x2 | $9,000 | 1.12x | Crate-only; mines Crystal Ore |
| **Fueled Thermal Mine** | Extractor | 🟣 Epic | 3x2 | $85,000 | 1.14x | Consumes Coal to mine Super Diamond Ore ($300 value) |
| **Bioluminescent Algae Vat** | Extractor | 🟣 Epic | 2x1 | $65,000 | 1.13x | Crate-only; produces Glow Algae Ore |
| **Uranium Centrifuge** | Extractor | 🟡 Exotic | 2x2 | $350,000 | 1.15x | Prestige Crate; mines Uranium Ore (**☢️ Radioactive**) |
| **Temporal Flux Borer** | Extractor | 🟡 Exotic | 3x3 | $1,400,000 | 1.14x | Prestige Crate; produces Time Crystal Ore (**⏳ Time-Aged**) |
| **Antimatter Siphon** | Extractor | 🔴 Legendary | 2x2 | $2,500,000 | 1.15x | Prestige Crate; produces Antimatter Pellets |
| **Void Fragment Harvester** | Extractor | 🔮 Mythic | 4x2 | $25,000,000 | 1.16x | Prestige Crate; produces Void Shard Ore |
| **Conveyor Belt** | Conveyor | ⚪ Common | 1x1 | $15 | 1.08x | 90 px/s standard transport speed |
| **Half-Width Belt** | Conveyor | 🟢 Uncommon | 0.5x1 | $35 | 1.09x | 90 px/s half-tile conveyor |
| **Fast Conveyor** | Conveyor | 🟢 Uncommon | 1x1 | $120 | 1.10x | 180 px/s high-speed conveyor |
| **Gravity Inverter Belt** | Conveyor | 🔵 Rare | 1x1 | $4,500 | 1.11x | Crate-only; inverts ore exit direction |
| **Cryo-Storage Conveyor** | Conveyor | 🔵 Rare | 1x1 | $7,500 | 1.11x | Crate-only; buffers/freezes ores |
| **Belt Splitter / Merger** | Routing | 🔵 Rare | 1x1 | $1,100 | 1.11x | Alternates / merges ore paths |
| **Ultra Conveyor** | Conveyor | 🟣 Epic | 1x1 | $8,000 | 1.12x | 320 px/s ultra-fast conveyor |
| **Magnetic Levitation Rail**| Conveyor | 🟣 Epic | 1x1 | $30,000 | 1.12x | 450 px/s maglev conveyor |
| **Phase-Shift Conveyor** | Conveyor | 🟡 Exotic | 1x1 | $220,000 | 1.13x | Prestige Crate; ores pass through intangibly |
| **Quantum Entanglement Link**| Utility | 🔴 Legendary | 1x1 | $1,800,000 | 1.14x | Prestige Crate; teleport link pair system |
| **1x1 Upgrader** | Upgrader | ⚪ Common | 1x1 | $300 | 1.10x | 2.0x multiplier (+10 energy) |
| **Half Upgrader** | Upgrader | 🟢 Uncommon | 0.5x1 | $550 | 1.11x | 1.5x multiplier (+5 energy) |
| **Freon Cooling Sprayer** | Upgrader | 🟢 Uncommon | 1x1 | $2,200 | 1.11x | Extinguishes fire, grants **💧 Wet** |
| **2x1 Wide Upgrader** | Upgrader | 🔵 Rare | 2x1 | $8,500 | 1.12x | 3.0x multiplier (+20 energy) |
| **Pyro Blast Furnace** | Upgrader | 🔵 Rare | 1x1 | $14,000 | 1.12x | 3.5x multiplier, sets ore **🔥 Flaming** |
| **Ore Crystallizer** | Upgrader | 🔵 Rare | 1x1 | $22,000 | 1.12x | 2.2x multiplier, grants **💎 Crystalline** |
| **Lead Decontaminator** | Upgrader | 🟣 Epic | 1x1 | $40,000 | 1.13x | Cleanses **☢️ Radioactive** status, 2.5x multiplier |
| **Entropy Stabilizer** | Upgrader | 🟣 Epic | 1x1 | $110,000 | 1.13x | Cleanses bad statuses, 3.0x multiplier |
| **Ore Transmuter** | Upgrader | 🟣 Epic | 1x1 | $250,000 | 1.13x | Transmutes ore types, 2.5x multiplier |
| **Probability Amplifier** | Upgrader | 🟡 Exotic | 1x1 | $750,000 | 1.13x | 1.8x multiplier, grants **🍀 Lucky** (2x next upgrade) |
| **Stellar Prism** | Upgrader | 🟡 Exotic | 1x1 | $750,000 | 1.13x | Grants **✨ Sparkling** status (+0.5x upgrader buff) |
| **Plasma Supercharger** | Upgrader | 🟣 Epic | 1x1 | $800,000 | 1.14x | +$500 flat value boost |
| **Resonance Harmonizer** | Upgrader | 🔴 Legendary | 1x1 | $1,600,000 | 1.14x | 4.5x multiplier with Sparkling synergy |
| **Matter Replicator** | Upgrader | 🔮 Mythic | 2x1 | $12,000,000 | 1.15x | Duplicates ores safely (**👯 Duplicated** flag) |
| **Shard of Life** | Upgrader | 🔮 Mythic | 2x2 | $40,000,000 | 1.16x | 6.0x multiplier aura support upgrader |
| **Seller** | Seller | ⚪ Common | 1x1 | $0 | 1.00x | Standard selling furnace |
| **Catalytic Converter** | Seller | 🔵 Rare | 2x1 | $95,000 | 1.12x | 2.5x bonus (4.0x on Radioactive ores) |
| **Blast Smelter** | Seller | 🟡 Exotic | 2x2 | $275,000 | 1.14x | Heavy smelter with 2.0x sale bonus |
| **Dimensional Vault** | Seller | 🟡 Exotic | 2x2 | $1,400,000 | 1.14x | Batch seller (3.5x bonus after batch threshold) |
| **Soul Forge** | Seller | 🔴 Legendary | 3x2 | $6,500,000 | 1.15x | 8.0x sale bonus with high risk of ore loss |

---

## 🛠️ Local Development & Server Setup

```bash
# Start dev server
node server.js
```
Open **`http://localhost:8080`** in your browser.
