# Findings & Game Economy Architecture

## 1. Progression Tiers & Economy Roadmap

| Tier | Name | Cash Range | Core Theme | Key Machines | Target Milestones |
|------|------|------------|------------|--------------|-------------------|
| **Tier 1** | Starter Industrial | $0 – $50,000 | Basic mechanical extraction & 1-lane refiner loops | `extractor`, `belt`, `upgrader1x1`, `seller`, `fastBelt`, `upgrader2x1` | Reach $50K, buy 1st Mega Extractor & Fast Belt network |
| **Tier 2** | Chemical & Thermal | $50,000 – $10,000,000 | Fuel logistics, temperature quenching & looping sorters | `thermalExtractor`, `freonSprayer`, `pyroRefiner`, `teslaBeam`, `blastSmelter`, `cryoSmelter`, `filterSorter` | Build coal-fed automated loop; hit $10M |
| **Tier 3** | Nuclear & Sub-Atomic | $10,000,000 – $1,000,000,000 | Radioactive isotope enrichment, laser scanning & multi-loop colliders | `uraniumMine`, `leadDecontaminator`, `laserScanner`, `quantumLooper`, `catalyticConverter`, `prismaticSmelter` | 20-pass quantum loop line; reach $1 Billion |
| **Tier 4** | Cosmic & Singularity | $1,000,000,000 – $10,000,000,000+ | Antimatter harvesting, celestial resonance, Rebirth / Prestige | `antimatterSiphon`, `voidHarvester`, `supernovaCrucible`, `singularitySmelter`, `shardOfLife` | Hit $10B threshold; perform Prestige Rebirth for Keys & Mythics |

## 2. Status Effects & Multiplier Synergy Matrix

- **🔥 Flaming**: Applied by `pyroRefiner`, `volcanoDropper`. Gives 4.0x bonus in `pyroSmelter`. Extinguished by `freonSprayer` into Quenched bonus.
- **💧 Wet / Quenched**: Applied by `freonSprayer`, `algaeVat`. Gives 3.0x bonus in `cryoSmelter`. Protects ores from heat destruction.
- **☢️ Radioactive**: Applied by `uraniumMine`. Gives 4.0x payout in `catalyticConverter`. Can be safely scrubbed by `leadDecontaminator` into pure enriched metal (+2.5x).
- **✨ Sparkling**: Applied by `stellarSparkler`, `teslaBeam`. Increases all subsequent upgrader multipliers by +0.5x.
- **💎 Crystalline**: Applied by `oreCrystallizer`, `laserScanner`. Increases all subsequent upgrader multipliers by +0.75x.
- **✨💎 Prismatic Synergy**: When both Sparkling and Crystalline are active, `prismaticSmelter` pays out **5.5x**, and `resonanceHarmonizer` multiplies by **4.5x** with a **1.5x synergy multiplier**!
- **🌟 Supernova Multi-Status Fusion**: When an ore carrying 2 or more statuses enters `supernovaCrucible`, it triggers a **12.0x Supernova Payout**!
