# 🏭 Miner's Haven — Factory Idle Simulation & Economy Tycoon

A high-performance, real-time 2D industrial factory automation game built with **Phaser 3**, **Vanilla CSS**, and **Modular JavaScript**. Inspired by the beloved mechanics of *Miner's Haven*, players design complex, automated production loops using **Extractors**, **Conveyors**, **Multi-Pass Upgraders**, **Side-Mounted Tesla & Laser Beam Emitters**, **Status Sorters & Loop Gates**, **Orbital Supply Crates**, and **Multi-Status Supernova Smelters**.

---

## 🌟 Highlights & Core Mechanics

### 🚀 1. Phaser 3 Simulation & Multi-Layer Vector Engine
* **Camera Controls**: Ultra-smooth cursor-anchored mouse wheel zoom (`0.25x` to `3.0x`) and delta drag-panning across an infinite factory floor (`-4000` to `+8000`).
* **Pre-Placement Directional Indicators**:
  * **Conveyors**: Continuous chevron arrows (`>>>`) animated in the drop direction on every tile during drag placement.
  * **Extractors**: High-contrast ejection nozzle with outward-firing trajectory arrows into neighboring cells.
  * **Inline Upgraders**: Cyan intake bracket `[`, amber exit bracket `]`, and internal flow direction arrows.
  * **Side-Mounted Beams**: Turret emitter with projected scanning beam line and impact scan circles on target belt tiles.
  * **Smelters / Furnaces**: Suction hoppers with inward vacuum chevrons and glowing thermal cores.

---

### 🗺️ 2. Four-Tier Progression Roadmap & Economy Curve

```
[ Tier 1: Starter Industrial ] ──▶ [ Tier 2: Chemical & Thermal ] ──▶ [ Tier 3: Nuclear & Sub-Atomic ] ──▶ [ Tier 4: Cosmic Singularity ]
      $0 – $50,000                       $50,000 – $10,000,000              $10,000,000 – $1,000,000,000          $1B – $10B+ (Rebirth Ready)
```

1. **Tier 1: Starter Industrial ($0 – $50K)**:
   * Starter Iron & Coal extraction, 2-pass refiner loops, fast conveyors, directional switch gates, and basic blast furnaces.
2. **Tier 2: Chemical & Thermal ($50K – $10M)**:
   * Coal-fueled Thermal Mines, Freon Cooling Chambers, Pyro Superheaters, side-mounted Tesla Induction Beams, and Cryo-Quench Smelters.
3. **Tier 3: Nuclear & Sub-Atomic ($10M – $1B)**:
   * Uranium Centrifuges, Lead Radiation Scrubbers, Precision Laser Scanners, Neutron Collimators, 20-pass Quantum Loop Colliders, and Prismatic Gem Smelters.
4. **Tier 4: Cosmic Singularity ($1B – $10B+ / Rebirth)**:
   * Antimatter Siphons, Cosmic Void Harvesters, Celestial Prism Refineries, Shards of Life, Singularity Vacuum Smelters, and 12.0x Supernova Fusion Crucibles.

---

### ⚡ 3. Multi-Pass Upgrader Traversal & Side-Mounted Beams
* **Full-Length Traversal Requirement**:
  * Ores must travel the complete internal distance through multi-tile machines (`upgrader2x1`, `freonSprayer`, `quantumLooper`, `celestialRefinery`, `shardOfLife`) before receiving an upgrade.
* **Exit-and-Re-Entry Loop Stacking**:
  * Ores can loop through the same machine up to its maximum allowance (5x–10x for standard/exotic, 20x for Quantum Loop Colliders), exponentially compounding value with every loop cycle.
* **Side-Mounted Upgrader Cannons**:
  * **Tesla Induction Beam** (`teslaBeam`): 3.2x multiplier + Sparkling status.
  * **Plasma Arc Injector** (`plasmaArc`): +$1,000 flat addition + 1.5x multiplier.
  * **Precision Laser Scanner** (`laserScanner`): 4.0x multiplier + Crystalline status.
  * **Neutron Collimator** (`neutronCollimator`): 5.5x multiplier + Sparkling status.

---

### 🧪 4. Status Effects & Multiplier Synergy Matrix

* **🔥 Flaming**: Applied by Pyro Superheaters & Volcano Mines. Grants **4.0x payout** in Thermobaric Smelters.
* **💧 Wet / Quenched**: Applied by Freon Sprayers & Algae Vats. Grants **3.0x payout** in Cryo-Quench Smelters and protects high-value ores from thermal destruction.
* **☢️ Radioactive**: Applied by Uranium Centrifuges. Grants **4.0x payout** in Catalytic Converters or can be scrubbed by Lead Scrubbers into pure metal (+2.5x).
* **✨ Sparkling & 💎 Crystalline Resonance**:
  * **Sparkling**: +0.5x to all subsequent machines.
  * **Crystalline**: +0.75x to all subsequent machines.
  * **Prismatic Synergy**: When both are active, `prismaticSmelter` pays out **5.5x**, and `resonanceHarmonizer` multiplies by **4.5x with a 1.5x resonance bonus**!
* **🌟 Supernova Multi-Status Fusion**:
  * When an ore carrying 2 or more distinct status effects enters the `supernovaCrucible`, it triggers a **12.0x Supernova Fusion Payout**!

---

### 📦 5. Orbital Supply Crates (World Spawning)
* **No Paywall Storefront**: Crates are free mystery supply drops that parachute from orbit onto open factory tiles every **~5 minutes**.
* **4 Rarity Tiers**:
  * 🔘 **Regular Crate** (60% spawn chance): Starter blueprints & `$500 – $2,500` bonus cash.
  * 🟡 **Golden Crate** (24% spawn chance): Rare/Epic blueprints & `$5,000 – $25,000` bonus cash.
  * 🟣 **Exotic Crate** (12% spawn chance): Exotic blueprints & `$50,000 – $250,000` bonus cash.
  * 🔵 **Prestige Crate** (4% rare spawn): Mythic blueprints, `$500K – $2.5M` bonus cash, and **+1 Prestige Key**!
* **Interactive World Sprites**: Rendered with shimmering vertical celestial beacon pillars, pulsing ground target rings, and 3D hovering metallic crate boxes. Simply click on a crate in the world to open it!

---

### 💾 6. Named Save Slot Manager & Auto-Save
* **3 Dedicated Save Slots** with editable custom names and timestamps.
* **Dual-Layer Persistence**: Saves synchronously to browser `localStorage` and disk (`/api/save/:slot`).
* **Auto-Save**: Debounced background persistence ensures zero progress loss.

---

## 🎮 Controls & Shortcuts

| Action | Control / Shortcut |
| :--- | :--- |
| **Pan Camera** | Click & Drag canvas (Middle/Right click or Left click while idle) |
| **Zoom In / Out** | Mouse Wheel Scroll (cursor-anchored) |
| **Rotate Building** | `R` key (during placement or when inspecting a placed machine) |
| **Open Shop & Inventory** | `E` key |
| **Hotbar Selection** | `1` – `9` keys |
| **Cancel Placement / Move** | `Escape` or Right-Click |
| **Toggle Switch / Loop Gates** | Left-Click directly on the placed gate in the world |
| **Open World Crates** | Left-Click directly on any landed supply crate |

---

## 🏗️ Architecture & Project Structure

```
mine-game/
├── index.html        # Clean HTML5 layout, HUD milestone tracker, modals
├── styles.css        # Satisfactory engineering corporate dark theme (#0a0c0f, #e8a030)
├── game.js           # Phaser 3 FactoryScene, physics loop, status synergies, saving
├── ui.js             # Hotbar, shop batch buying (1x/10x/100x), inspector, save manager
├── data.json         # Standalone definitions (ores, machines, relics, progression tiers)
├── data.js           # Async data repository loader with fallback
├── server.js         # Node.js HTTP server with save slots API & hot reload
├── task_plan.md      # Manus-style task planning and progress ledger
├── findings.md       # Economy balance curve and status synergy matrix
└── progress.md       # Session history log
```

---

## 🚀 Running Locally

```bash
# 1. Start the game server
node server.js

# 2. Open in your browser
http://localhost:8080
```
