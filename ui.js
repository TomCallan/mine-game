// ===========================================================
// MINER'S HAVEN - UI INTERACTION, SHOP, CRATES & METAGAME ENGINE
// ===========================================================

let currentMainTab = 'shop'; // 'shop' | 'inventory' | 'relics' | 'meta'
let currentCategory = 'all';
let hotbarItems = ['extractor', 'belt', 'fastBelt', 'upgrader1x1', 'switchGate', 'seller'];

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
      if (obj.status.flaming) activeEffects.push('Flaming');
      if (obj.status.radioactive) activeEffects.push('Radioactive');
      if (obj.status.wet > 0) activeEffects.push(`Wet (${Math.ceil(obj.status.wet)}s)`);
      if (obj.status.sparkling) activeEffects.push('Sparkling');
      if (obj.status.crystalline) activeEffects.push('Crystalline');
      if (obj.status.lucky) activeEffects.push('Lucky (2x Next Upgrade)');
      if (obj.status.duplicated) activeEffects.push('Duplicated');
      if (obj.status.timeAged) activeEffects.push('Time-Aged');
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

// Context Menu Card
function openContextMenu(building, screenX, screenY) {
  activeContextBuilding = building;
  selectedEntity = { type: 'building', id: building.id };
  const def = STATE.defs.buildingDefs[building.defId];
  if (!def) return;
  const fp = getFootprint(def, building.rot);

  const menu = document.getElementById('contextMenu');
  if (!menu) return;

  document.getElementById('ctxTitle').textContent = def.name;
  document.getElementById('ctxSub').textContent = `${def.category.toUpperCase()} • ${fp.w}x${fp.h} Tile • ${def.rarity ? def.rarity.toUpperCase() : 'COMMON'}`;
  document.getElementById('ctxSwatch').style.background = def.color;

  let stats = [];
  if (def.category === 'extractor') {
    stats.push(`Produces: ${def.produces ? def.produces.item : 'N/A'}`);
    if (def.attributes?.spawnRateMs) stats.push(`Rate: ${def.attributes.spawnRateMs}ms`);
    if (building.fuelTimer) stats.push(`Fuel: ${Math.ceil(building.fuelTimer)}s`);
  } else if (def.category === 'upgrader') {
    if (def.multiplier) stats.push(`Multiplier: ${def.multiplier}x`);
    if (def.flatAdd) stats.push(`Bonus: +$${def.flatAdd}`);
    if (def.energyCost) stats.push(`Energy: ${def.energyCost}`);
  } else if (def.category === 'seller') {
    if (def.sellerBonus) stats.push(`Bonus: ${def.sellerBonus}x`);
  } else if (def.category === 'belt') {
    stats.push(`Speed: ${def.speed || 'N/A'}`);
  }
  const actionsContainer = document.querySelector('.ctx-actions');
  
  // Clean up any old gate controls
  document.getElementById('ctxBtnGateToggle')?.remove();

  if (def.isSwitchGate) {
    const gateBtn = document.createElement('button');
    gateBtn.className = 'ctx-btn';
    gateBtn.id = 'ctxBtnGateToggle';
    gateBtn.textContent = `Route: ${building.activeBranch === 1 ? 'DIVERT (90°)' : 'STRAIGHT (0°)'}`;
    gateBtn.style.color = 'var(--accent-amber)';
    gateBtn.onclick = () => {
      building.activeBranch = (building.activeBranch === 1 ? 0 : 1);
      gateBtn.textContent = `Route: ${building.activeBranch === 1 ? 'DIVERT (90°)' : 'STRAIGHT (0°)'}`;
      showToast(`Switched Route: ${building.activeBranch === 1 ? 'DIVERT' : 'STRAIGHT'}`);
      triggerSaveState();
    };
    actionsContainer.insertBefore(gateBtn, actionsContainer.firstChild);
  } else if (def.isLoopGate) {
    const gateBtn = document.createElement('button');
    gateBtn.className = 'ctx-btn';
    gateBtn.id = 'ctxBtnGateToggle';
    const loops = [1, 2, 3, 5, 10];
    gateBtn.textContent = `Target: ${building.targetLoops || 3} Loops`;
    gateBtn.style.color = '#34d399';
    gateBtn.onclick = () => {
      const cur = building.targetLoops || 3;
      const nxt = loops[(loops.indexOf(cur) + 1) % loops.length];
      building.targetLoops = nxt;
      gateBtn.textContent = `Target: ${nxt} Loops`;
      showToast(`Loop Gate Target: ${nxt} Loops`);
      triggerSaveState();
    };
    actionsContainer.insertBefore(gateBtn, actionsContainer.firstChild);
  } else if (def.isFilterSorter) {
    const gateBtn = document.createElement('button');
    gateBtn.className = 'ctx-btn';
    gateBtn.id = 'ctxBtnGateToggle';
    const modes = ['unrefined', 'valuable', 'wet'];
    gateBtn.textContent = `Filter: ${(building.filterMode || 'unrefined').toUpperCase()}`;
    gateBtn.style.color = '#fbbf24';
    gateBtn.onclick = () => {
      const cur = building.filterMode || 'unrefined';
      const nxt = modes[(modes.indexOf(cur) + 1) % modes.length];
      building.filterMode = nxt;
      gateBtn.textContent = `Filter: ${nxt.toUpperCase()}`;
      showToast(`Filter Mode: ${nxt.toUpperCase()}`);
      triggerSaveState();
    };
    actionsContainer.insertBefore(gateBtn, actionsContainer.firstChild);
  }

  let fuelBtn = document.getElementById('ctxBtnFuel');
  if (def.requiresFuel) {
    if (!fuelBtn) {
      fuelBtn = document.createElement('button');
      fuelBtn.className = 'ctx-btn';
      fuelBtn.id = 'ctxBtnFuel';
      actionsContainer.insertBefore(fuelBtn, actionsContainer.firstChild);
    }
    const pct = building.fuelTimer ? Math.min(100, Math.round((building.fuelTimer / def.attributes.runDurationSec) * 100)) : 0;
    fuelBtn.textContent = `Fuel: ${pct}%`;
    fuelBtn.style.background = `linear-gradient(90deg, rgba(232,160,48,0.2) ${pct}%, transparent ${pct}%)`;
  } else if (fuelBtn) {
    fuelBtn.remove();
  }

  const wallsSection = document.getElementById('ctxWallsSection');
  if (def.category === 'belt') {
    wallsSection.style.display = 'block';
    if (!building.walls) building.walls = [false, false, false, false];
    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById(`ctxWall${i}`);
      if (btn) {
        if (building.walls[i]) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    }
  } else {
    wallsSection.style.display = 'none';
  }

  const menuW = 260, menuH = 300;
  let posX = screenX + 16;
  if (posX + menuW > window.innerWidth) posX = screenX - menuW - 16;
  let posY = Math.min(window.innerHeight - menuH - 16, Math.max(16, screenY - 40));
  menu.style.left = posX + 'px';
  menu.style.top = posY + 'px';
  menu.classList.add('open');
}

function closeContextMenu() {
  const menu = document.getElementById('contextMenu');
  if (menu) menu.classList.remove('open');
  activeContextBuilding = null;
}

function getGameTarget() {
  return document.getElementById('game-container') || window.canvas || document.body;
}

function initContextMenuListeners() {
  document.getElementById('closeCtxBtn')?.addEventListener('click', closeContextMenu);
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && document.getElementById('contextMenu')?.classList.contains('open')) {
      const rect = document.getElementById('contextMenu').getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        closeContextMenu();
      }
    }
  });

  document.getElementById('ctxBtnRotate')?.addEventListener('click', () => {
    if (activeContextBuilding) {
      rotateBuildingInPlace(activeContextBuilding);
      openContextMenu(activeContextBuilding, parseFloat(document.getElementById('contextMenu').style.left), parseFloat(document.getElementById('contextMenu').style.top));
    }
  });

  document.getElementById('ctxBtnMove')?.addEventListener('click', () => {
    if (activeContextBuilding) {
      const b = activeContextBuilding;
      closeContextMenu();
      enterMovingMode(b);
    }
  });

  document.getElementById('ctxBtnDelete')?.addEventListener('click', () => {
    if (activeContextBuilding) {
      deleteBuilding(activeContextBuilding);
      closeContextMenu();
    }
  });

  for (let i = 0; i < 4; i++) {
    document.getElementById(`ctxWall${i}`)?.addEventListener('click', () => {
      if (activeContextBuilding && activeContextBuilding.walls) {
        activeContextBuilding.walls[i] = !activeContextBuilding.walls[i];
        openContextMenu(activeContextBuilding, parseFloat(document.getElementById('contextMenu').style.left), parseFloat(document.getElementById('contextMenu').style.top));
      }
    });
  }

  const target = getGameTarget();
  target.addEventListener('dblclick', (e) => {
    if (mode !== 'idle') return;
    const world = screenToWorld(e.clientX, e.clientY);
    const cell = worldToCell(world.x, world.y);
    const b = findBuildingAtCell(cell.col, cell.row);
    if (b) openContextMenu(b, e.clientX, e.clientY);
  });

  target.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (mode !== 'idle') {
      cancelMode();
      return;
    }
    // Right-click on building opens context menu; otherwise cancel
    const world = screenToWorld(e.clientX, e.clientY);
    const cell = worldToCell(world.x, world.y);
    const b = findBuildingAtCell(cell.col, cell.row);
    if (b) {
      openContextMenu(b, e.clientX, e.clientY);
    } else {
      closeContextMenu();
    }
  });
}

// Meta Currency Header Updating
function updateMetaStatusBar() {
  const c = document.getElementById('metaCash');
  const p = document.getElementById('metaPoints');
  const k = document.getElementById('metaKeys');
  const s = document.getElementById('metaShards');
  const d = document.getElementById('metaDust');
  if (c) c.textContent = `$${(STATE.run.money || 0).toLocaleString()}`;
  if (p) p.textContent = STATE.meta.prestigePoints;
  if (k) k.textContent = STATE.meta.prestigeKeys;
  if (s) s.textContent = STATE.meta.shards;
  if (d) d.textContent = STATE.meta.prestigeDust;
}

// Hotbar Rendering
function renderHotbar() {
  const container = document.getElementById('hotbarSlots');
  if (!container) return;
  container.innerHTML = '';

  hotbarItems.forEach((defId, idx) => {
    const slot = document.createElement('div');
    slot.className = 'hotbar-slot';
    if (mode === 'placing' && placingState && placingState.defId === defId) {
      slot.classList.add('active');
    }
    if (!defId || !STATE.defs.buildingDefs[defId]) {
      slot.classList.add('empty');
    }

    const keySpan = document.createElement('span');
    keySpan.className = 'hotbar-key';
    keySpan.textContent = idx + 1;
    slot.appendChild(keySpan);

    if (defId && STATE.defs.buildingDefs[defId]) {
      const def = STATE.defs.buildingDefs[defId];
      const qty = getInventoryQty(defId);

      // Qty badge top-right
      const qtyBadge = document.createElement('span');
      qtyBadge.className = 'hotbar-qty';
      qtyBadge.textContent = qty;
      slot.appendChild(qtyBadge);

      const swatch = document.createElement('div');
      swatch.className = 'hotbar-swatch';
      swatch.style.background = def.color;
      slot.appendChild(swatch);

      const label = document.createElement('div');
      label.className = 'hotbar-label';
      // Truncate name
      const shortName = def.name.length > 12 ? def.name.slice(0, 11) + '…' : def.name;
      label.textContent = shortName;
      slot.appendChild(label);
    } else {
      const label = document.createElement('div');
      label.className = 'hotbar-label';
      label.textContent = 'Empty';
      slot.appendChild(label);
    }

    slot.addEventListener('click', () => {
      if (defId && STATE.defs.buildingDefs[defId]) {
        if (mode === 'placing' && placingState && placingState.defId === defId) {
          cancelMode();
        } else {
          enterPlacingMode(defId);
        }
        renderHotbar();
      }
    });

    container.appendChild(slot);
  });

  updateMetaStatusBar();
}

// Main Window Renderer (Shop, Inventory, Relics, Meta)
function renderInventoryGrid() {
  updateMetaStatusBar();
  const grid = document.getElementById('invGrid');
  const searchInput = document.getElementById('invSearchInput');
  const subHeader = document.getElementById('invSubHeader');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  if (!grid) return;
  grid.innerHTML = '';

  if (subHeader) {
    subHeader.style.display = (currentMainTab === 'shop' || currentMainTab === 'inventory') ? 'flex' : 'none';
  }

  // --- TAB 1: SHOP TAB ---
  if (currentMainTab === 'shop') {
    Object.values(STATE.defs.buildingDefs).forEach(def => {
      if (def.crateOnly && !STATE.meta.blueprintUnlocks[def.id]) return;
      if (currentCategory !== 'all' && def.category !== currentCategory) return;
      if (search && !def.name.toLowerCase().includes(search) && !def.id.toLowerCase().includes(search)) return;

      const isUnlocked = !!STATE.meta.blueprintUnlocks[def.id];
      const price = getShopItemPrice(def.id);
      const ownedQty = getInventoryQty(def.id);
      const rarity = def.rarity || 'common';

      const card = document.createElement('div');
      card.className = `inv-card rarity-${rarity} ${isUnlocked ? '' : 'locked'}`;

      const top = document.createElement('div');
      top.className = 'inv-card-top';

      const swatch = document.createElement('div');
      swatch.className = 'inv-card-swatch';
      swatch.style.background = def.color;
      top.appendChild(swatch);

      const titleBox = document.createElement('div');
      titleBox.className = 'inv-card-info';
      const title = document.createElement('div');
      title.className = 'inv-card-title';
      title.textContent = isUnlocked ? def.name : `Locked Blueprint: ${def.name}`;
      titleBox.appendChild(title);

      const badge = document.createElement('span');
      badge.className = `inv-card-badge rarity-badge-${rarity}`;
      badge.textContent = `${rarity.toUpperCase()} • ${def.size.w}x${def.size.h}`;
      titleBox.appendChild(badge);

      top.appendChild(titleBox);
      card.appendChild(top);

      const desc = document.createElement('div');
      desc.className = 'inv-card-desc';
      const descText = getDefDescription(def);
      desc.textContent = descText;
      card.appendChild(desc);

      const priceTag = document.createElement('div');
      priceTag.className = 'inv-card-price';
      priceTag.textContent = isUnlocked ? `1x: $${price.toLocaleString()} | 10x: $${(price*10).toLocaleString()} | 100x: $${(price*100).toLocaleString()}` : `Cost: $${price.toLocaleString()}`;
      card.appendChild(priceTag);

      if (!isUnlocked) {
        const lockedBtn = document.createElement('button');
        lockedBtn.className = 'inv-card-place-btn locked-btn';
        lockedBtn.textContent = 'Blueprint Locked';
        lockedBtn.disabled = true;
        card.appendChild(lockedBtn);
      } else {
        const batchRow = document.createElement('div');
        batchRow.className = 'buy-batch-row';
        batchRow.style.display = 'flex';
        batchRow.style.gap = '4px';

        [1, 10, 100].forEach(qty => {
          const btn = document.createElement('button');
          btn.className = 'inv-card-place-btn buy-batch-btn';
          btn.style.flex = '1';
          btn.textContent = `${qty}x`;
          btn.disabled = STATE.run.money < (price * qty);
          btn.addEventListener('click', () => {
            if (buyShopItem(def.id, qty)) {
              renderInventoryGrid();
              renderHotbar();
            }
          });
          batchRow.appendChild(btn);
        });
        card.appendChild(batchRow);
      }
      grid.appendChild(card);
    });
  }
  // --- TAB 2: INVENTORY TAB ---
  else if (currentMainTab === 'inventory') {
    Object.values(STATE.defs.buildingDefs).forEach(def => {
      const standardQty = STATE.inventory.items[def.id]?.qty || 0;
      const permQty = STATE.inventory.permanentItems[def.id]?.qty || 0;
      const totalQty = standardQty + permQty;

      if (totalQty <= 0) return; // Only show owned items
      if (currentCategory !== 'all' && def.category !== currentCategory) return;
      if (search && !def.name.toLowerCase().includes(search)) return;

      const rarity = def.rarity || 'common';
      const card = document.createElement('div');
      card.className = `inv-card rarity-${rarity}`;
      card.style.position = 'relative';

      if (permQty > 0) {
        const permBadge = document.createElement('div');
        permBadge.className = 'inv-card-perm-badge';
        permBadge.textContent = 'Permanent';
        card.appendChild(permBadge);
      }

      const stockBadge = document.createElement('div');
      stockBadge.className = 'inv-card-stock';
      stockBadge.textContent = `x${totalQty}`;
      card.appendChild(stockBadge);

      const top = document.createElement('div');
      top.className = 'inv-card-top';

      const swatch = document.createElement('div');
      swatch.className = 'inv-card-swatch';
      swatch.style.background = def.color;
      top.appendChild(swatch);

      const titleBox = document.createElement('div');
      titleBox.className = 'inv-card-info';
      const title = document.createElement('div');
      title.className = 'inv-card-title';
      title.textContent = def.name;
      titleBox.appendChild(title);

      const badge = document.createElement('span');
      badge.className = `inv-card-badge rarity-badge-${rarity}`;
      badge.textContent = `${rarity.toUpperCase()} • ${def.size.w}x${def.size.h}`;
      titleBox.appendChild(badge);

      top.appendChild(titleBox);
      card.appendChild(top);

      const desc = document.createElement('div');
      desc.className = 'inv-card-desc';
      desc.textContent = getDefDescription(def);
      card.appendChild(desc);

      const actions = document.createElement('div');
      actions.className = 'inv-card-actions';

      const placeBtn = document.createElement('button');
      placeBtn.className = 'inv-card-place-btn';
      placeBtn.textContent = 'Place Machine';
      placeBtn.addEventListener('click', () => {
        closeInventoryModal();
        enterPlacingMode(def.id);
        renderHotbar();
      });
      actions.appendChild(placeBtn);

      const slotBox = document.createElement('div');
      slotBox.className = 'inv-slot-selector';
      const slotBtns = document.createElement('div');
      slotBtns.className = 'inv-slot-btns';

      for (let sIdx = 0; sIdx < 6; sIdx++) {
        const sBtn = document.createElement('button');
        sBtn.className = 'inv-slot-btn';
        if (hotbarItems[sIdx] === def.id) sBtn.classList.add('equipped');
        sBtn.textContent = sIdx + 1;
        sBtn.title = `Equip to Hotbar Slot ${sIdx + 1}`;
        sBtn.addEventListener('click', () => {
          hotbarItems[sIdx] = def.id;
          renderHotbar();
          renderInventoryGrid();
        });
        slotBtns.appendChild(sBtn);
      }
      slotBox.appendChild(slotBtns);
      actions.appendChild(slotBox);

      card.appendChild(actions);
      grid.appendChild(card);
    });
  }
  // --- TAB 3: RELICS TAB ---
  else if (currentMainTab === 'relics') {
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';

    Object.values(STATE.defs.relicDefs).forEach(relic => {
      const isUnlocked = !!STATE.meta.relics[relic.id];
      const card = document.createElement('div');
      card.className = 'relic-card';
      if (!isUnlocked) card.style.opacity = '0.4';

      const title = document.createElement('div');
      title.className = 'relic-card-title';
      title.textContent = isUnlocked ? relic.name : `[Locked] ${relic.name}`;
      card.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'relic-card-desc';
      desc.textContent = relic.desc;
      card.appendChild(desc);

      if (isUnlocked) {
        const activeTag = document.createElement('div');
        activeTag.className = 'relic-active-tag';
        activeTag.textContent = 'Active Passive';
        card.appendChild(activeTag);
      }
      grid.appendChild(card);
    });
  }
  // --- TAB 4: META / PRESTIGE TAB ---
  else if (currentMainTab === 'meta') {
    const metaContainer = document.createElement('div');
    metaContainer.style.cssText = 'padding: 20px; color: #fff; display: flex; flex-direction: column; gap: 20px;';

    const payout = calculatePrestigePayout(STATE.run.lifetimeEarnings);
    metaContainer.innerHTML = `
      <div style="background: rgba(0,0,0,0.25); padding: 16px; border-radius: 12px; border: 1px solid rgba(168,85,247,0.2);">
        <h3 style="margin: 0 0 10px 0; color: #e9d5ff; font-size:15px;">Prestige Meta Progression</h3>
        <p style="font-size: 12px; color: #8b9ab5; margin-bottom: 12px;">Reset your factory to earn permanent Prestige Points &amp; Keys.</p>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size:13px;">
          <div>Lifetime Earnings: <strong style="color:#fbbf24;font-family:monospace;">${'$' + (STATE.run.lifetimeEarnings || 0).toLocaleString()}</strong></div>
          <div>Requirement: <strong style="color:#f472b6;font-family:monospace;">$10,000,000,000</strong></div>
        </div>
        <div style="margin-top: 14px; display: flex; gap: 16px; font-size:13px;">
          <div>Pending Points: <strong style="color:#c084fc;font-family:monospace;">+${payout.pointsGained}</strong></div>
          <div>Pending Keys: <strong style="color:#fbbf24;font-family:monospace;">+${payout.keysGained}</strong></div>
        </div>
        <button id="tabPrestigeTriggerBtn" class="prestige-confirm-btn" style="margin-top: 16px; width:auto; padding: 10px 24px; font-size:13px;" ${payout.canPrestige ? '' : 'disabled'}>
          ${payout.canPrestige ? 'Prestige Factory Now' : 'Lifetime Earnings Below $10B Threshold'}
        </button>
      </div>
    `;
    grid.appendChild(metaContainer);

    document.getElementById('tabPrestigeTriggerBtn')?.addEventListener('click', openPrestigeModal);
  }
}

function openInventoryModal(tab = null) {
  closeCrateModal();
  closePrestigeModal();
  closeSavesModal();
  if (tab) {
    currentMainTab = tab;
    document.querySelectorAll('#invMainTabs .inv-main-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tab);
    });
  }
  document.getElementById('inventoryModal')?.classList.add('open');
  renderInventoryGrid();
}

function closeInventoryModal() {
  document.getElementById('inventoryModal')?.classList.remove('open');
}

// Prestige Modal Logic
function openPrestigeModal() {
  closeInventoryModal();
  closeCrateModal();
  closeSavesModal();
  const modal = document.getElementById('prestigeModal');
  if (!modal) return;

  const earnings = STATE.run.lifetimeEarnings || 0;
  const payout = calculatePrestigePayout(earnings);

  const earningsEl = document.getElementById('pModalEarnings');
  const pointsEl = document.getElementById('pModalPoints');
  const keysEl = document.getElementById('pModalKeys');
  if (earningsEl) earningsEl.textContent = `$${earnings.toLocaleString()}`;
  if (pointsEl) pointsEl.textContent = `+${payout.pointsGained}`;
  if (keysEl) keysEl.textContent = `+${payout.keysGained}`;

  const confirmBtn = document.getElementById('btnConfirmPrestige');
  if (confirmBtn) {
    confirmBtn.disabled = !payout.canPrestige;
    confirmBtn.textContent = payout.canPrestige ? 'CONFIRM FACTORY RESET & PRESTIGE' : 'EARNINGS BELOW $10B THRESHOLD';
  }

  modal.classList.add('open');
}

function closePrestigeModal() {
  document.getElementById('prestigeModal')?.classList.remove('open');
}

// Crate Shop Modal & Roulette Animation
function openCrateModal() {
  closeInventoryModal();
  closePrestigeModal();
  closeSavesModal();
  document.getElementById('crateModal')?.classList.add('open');
}

function closeCrateModal() {
  document.getElementById('crateModal')?.classList.remove('open');
}

function openSavesModal() {
  closeInventoryModal();
  closeCrateModal();
  closePrestigeModal();
  document.getElementById('savesModal')?.classList.add('open');
  renderSaveSlots();
}

function closeSavesModal() {
  document.getElementById('savesModal')?.classList.remove('open');
}

function buyAndOpenCrateUI(crateTier) {
  const reward = buyAndOpenCrate(crateTier);
  if (!reward) return;

  renderInventoryGrid();
  renderHotbar();
  startUnboxingAnimation(reward);
}

function startUnboxingAnimation(reward) {
  const overlay = document.getElementById('unboxingOverlay');
  const track = document.getElementById('rouletteTrack');
  if (!overlay || !track) return;

  const ITEM_W = 100; // px per roulette item (must match .roulette-item width in CSS)
  const WIN_INDEX = 24; // which slot holds the winner
  const TOTAL = 32;

  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';

  // Build pool of visually plausible filler items
  const allDefs = Object.values(STATE.defs.buildingDefs);
  const winDef = reward.id && STATE.defs.buildingDefs[reward.id] ? STATE.defs.buildingDefs[reward.id] : null;

  function makeItem(def, isWinner, customLabel, customColor) {
    const el = document.createElement('div');
    el.className = 'roulette-item';
    if (isWinner) el.classList.add('roulette-winner');

    const swatch = document.createElement('div');
    swatch.className = 'roulette-item-swatch';
    swatch.style.background = def ? def.color : (customColor || '#e8a030');
    el.appendChild(swatch);

    const name = document.createElement('div');
    name.className = 'roulette-item-name';
    name.textContent = def ? def.name : (customLabel || 'Reward');
    el.appendChild(name);

    const rarity = document.createElement('div');
    rarity.className = 'roulette-item-rarity';
    const r = def ? (def.rarity || 'common') : 'exotic';
    rarity.textContent = r.toUpperCase();
    rarity.style.color = getRarityColor(r);
    el.appendChild(rarity);
    return el;
  }

  for (let i = 0; i < TOTAL; i++) {
    const isWinner = (i === WIN_INDEX);
    if (isWinner) {
      if (winDef) {
        track.appendChild(makeItem(winDef, true));
      } else {
        track.appendChild(makeItem(null, true, reward.label, '#e8a030'));
      }
    } else {
      const def = allDefs[Math.floor(Math.random() * allDefs.length)];
      track.appendChild(makeItem(def, false));
    }
  }

  overlay.classList.add('open');

  // Remove any old result card
  document.getElementById('rouletteResult')?.remove();

  // After paint, calculate the scroll position to land WIN_INDEX centered
  requestAnimationFrame(() => {
    const containerW = overlay.querySelector('.roulette-container')?.offsetWidth || 500;
    const targetLeft = -(WIN_INDEX * ITEM_W) + (containerW / 2) - (ITEM_W / 2);

    setTimeout(() => {
      track.style.transition = 'transform 4s cubic-bezier(0.05, 1, 0.2, 1)';
      track.style.transform = `translateX(${targetLeft}px)`;
    }, 80);

    setTimeout(() => {
      // Show result card below the roulette
      const resultCard = document.createElement('div');
      resultCard.id = 'rouletteResult';
      resultCard.className = 'roulette-result-card';

      const rewardType = reward.type === 'permanent' ? 'PERMANENT COPY' :
                         reward.type === 'blueprint' ? 'BLUEPRINT UNLOCKED' :
                         reward.type === 'item' ? 'ITEM GRANTED' :
                         reward.type === 'relic' ? 'RELIC UNLOCKED' :
                         reward.type === 'shards' ? 'SHARDS EARNED' :
                         reward.type === 'prestigeDust' ? 'PRESTIGE DUST' : 'REWARD';

      if (winDef) {
        resultCard.innerHTML = `
          <div class="rr-type">${rewardType}</div>
          <div class="rr-swatch" style="background:${winDef.color}"></div>
          <div class="rr-name">${winDef.name}</div>
          <div class="rr-rarity" style="color:${getRarityColor(winDef.rarity)}">${(winDef.rarity || 'COMMON').toUpperCase()} &bull; ${winDef.size.w}x${winDef.size.h}</div>
          <div class="rr-desc">${getDefDescription(winDef)}</div>
        `;
      } else {
        resultCard.innerHTML = `
          <div class="rr-type">${rewardType}</div>
          <div class="rr-name">${reward.label}</div>
        `;
      }

      const closeBtn = document.createElement('button');
      closeBtn.className = 'rr-close-btn';
      closeBtn.textContent = 'COLLECT';
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('open');
        resultCard.remove();
      });
      resultCard.appendChild(closeBtn);

      overlay.appendChild(resultCard);

      showToast(`Reward Granted: ${reward.label}`);
      renderHotbar();
      renderInventoryGrid();
    }, 4500);
  });
}

// Save Slots UI
async function renderSaveSlots() {
  const grid = document.getElementById('savesGrid');
  if (!grid) return;
  grid.innerHTML = '<div style="color:#fff;">Loading...</div>';
  
  try {
    const slots = await fetchSaveSlots();
    grid.innerHTML = '';
    
    slots.forEach(slotData => {
      const card = document.createElement('div');
      card.className = 'save-slot-card';
      
      const header = document.createElement('div');
      header.className = 'save-slot-number';
      header.textContent = `SLOT ${slotData.slot + 1} ${slotData.slot === STATE.activeSaveSlot ? '(ACTIVE)' : ''}`;
      if (slotData.slot === STATE.activeSaveSlot) header.style.color = 'var(--accent-amber)';
      card.appendChild(header);
      
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'save-slot-name-input';
      nameInput.value = slotData.name || `Save ${slotData.slot + 1}`;
      card.appendChild(nameInput);
      
      const timeStr = slotData.exists ? new Date(slotData.timestamp).toLocaleString() : 'Empty Slot';
      const timeEl = document.createElement('div');
      timeEl.className = 'save-slot-time';
      timeEl.textContent = timeStr;
      card.appendChild(timeEl);
      
      const btnRow = document.createElement('div');
      btnRow.className = 'save-btn-row';
      
      if (slotData.exists) {
        const loadBtn = document.createElement('button');
        loadBtn.className = 'save-btn load';
        loadBtn.textContent = 'Load Game';
        loadBtn.onclick = async () => {
          await loadFromSlot(slotData.slot);
          closeSavesModal();
          showToast('Game Loaded');
        };
        btnRow.appendChild(loadBtn);
      }
      
      const saveBtn = document.createElement('button');
      saveBtn.className = 'save-btn';
      saveBtn.textContent = slotData.exists ? 'Overwrite Save' : 'Save Here';
      saveBtn.onclick = async () => {
        await saveToSlot(slotData.slot, nameInput.value);
        showToast('Game Saved');
        renderSaveSlots();
      };
      btnRow.appendChild(saveBtn);
      
      if (slotData.exists) {
        const delBtn = document.createElement('button');
        delBtn.className = 'save-btn del';
        delBtn.textContent = 'Delete';
        delBtn.onclick = async () => {
          if (confirm('Are you sure you want to delete this save?')) {
            await deleteSlot(slotData.slot);
            renderSaveSlots();
          }
        };
        btnRow.appendChild(delBtn);
      }
      
      card.appendChild(btnRow);
      grid.appendChild(card);
    });
  } catch (e) {
    grid.innerHTML = '<div style="color:red;">Failed to load saves</div>';
  }
}

document.getElementById('openSavesBtn')?.addEventListener('click', openSavesModal);
document.getElementById('closeSavesBtn')?.addEventListener('click', closeSavesModal);
document.getElementById('btnNewGame')?.addEventListener('click', async () => {
  if (confirm('Start a fresh new game? This will reset all layouts, money, inventory, and ALL meta progression (keys, points, relics, and unlocks).')) {
    await newGame();
    closeSavesModal();
    showToast('Started Fresh New Game');
  }
});

function getRarityColor(rarity) {
  const map = {
    common: '#8b9ab5', uncommon: '#4ade80', rare: '#60a5fa',
    epic: '#c084fc', exotic: '#fbbf24', legendary: '#f472b6', mythic: '#f87171'
  };
  return map[rarity] || map.common;
}

function getDefDescription(def) {
  if (!def) return '';
  const parts = [];

  // Machine-specific overrides
  const specificDescriptions = {
    extractor: 'Extracts Standard Ore ($5 base value) onto conveyor networks.',
    coalExtractor: 'Mines Coal Fuel Ore ($15 base value). Provides fuel for fueled machines.',
    megaExtractor: 'Heavy 2x2 drill. Produces high-density Mega Ore ($25 base value).',
    volcanoDropper: 'Volcanic thermal vent. Spawns superheated Magma Ore ($50 base value, Flaming status).',
    thermalExtractor: 'High-tech fueled drill. Consumes Coal to extract lucrative Super Diamond Ore ($300 base value, Sparkling).',
    uraniumMine: 'Centrifuge drill. Extracts unstable Uranium Ore ($150 base value, Radioactive status).',
    geodeDriller: 'Crystalline bore. Extracts Crystal Ore ($200 base value, Sparkling & Crystalline).',
    antimatterSiphon: 'Particle collider siphon. Extracts Antimatter Pellets ($1,500 base value).',
    temporalFluxBorer: 'Time-distortion drill. Extracts Time Crystal Ore ($800 base value, Time-Aged).',
    algaeVat: 'Bio-luminescent harvester. Produces Glow Algae Ore ($120 base value, Wet status).',
    voidHarvester: 'Cosmic rift harvester. Extracts rare Void Shard Ore ($12,000 base value).',
    // Logistics & Gates
    belt: 'Standard industrial conveyor belt (90 speed). Moves ores smoothly along direction.',
    halfBelt: 'Narrow 0.5x1 conveyor belt. Ideal for compact routing and tight spaces.',
    fastBelt: 'High-speed conveyor belt (180 speed, 2x standard).',
    switchGate: 'Interactive Diverter Gate. Toggles between Straight (0°) and Divert (90°). Click directly on canvas to switch loop paths!',
    loopGate: 'Loop Counter Gate. Directs ores into the upgrade loop until they reach Target Loops (default 3x), then automatically fires them to the seller! Click to change loops.',
    filterSorter: 'Smart Sorter Gate. Diverts unrefined, flaming, or radioactive ores to treatment loops while sending clean ores straight. Click to cycle filter mode.',
    crossoverBelt: 'Cross-Overpass Belt. Allows North-South and East-West conveyor lines to cross each other without mixing!',
    splitter: 'Directs incoming ores alternatingly between left and right outputs.',
    tripleSplitter: '3-Way Splitter. Distributes incoming ores sequentially across Left, Straight, and Right outputs.',
    merger: 'Merges ores from multiple conveyor inputs into a single unified stream.',
    heavyMerger: 'Heavy 3-Way Merger (200 speed). Merges up to 3 conveyor inputs into 1 boosted output line.',
    ultraBelt: 'Overclocked magnetic conveyor belt (320 speed). Rapid transport.',
    magLevRail: 'Frictionless magnetic levitation rail (450 speed). Instantaneous logistics.',
    phaseShiftBelt: 'Phase-shifted belt. Allows other machines to overlap and pass through.',
    gravityInverter: 'Inverts ore gravity physics, altering conveyor movement.',
    cryoStorageBelt: 'Deep-freeze conveyor. Slows ore speed (40 speed) and prevents volatile reactions.',
    quantumLink: 'Quantum entanglement terminal. Teleports ores directly to linked exit.',

    // Upgraders
    upgrader1x1: 'Compact 2.0x value multiplier with integrated guide walls (Max 1 use).',
    upgraderHalf: 'Space-saving 0.5x1 upgrader. Applies 1.5x value multiplier (Max 1 use).',
    upgrader2x1: 'Wide 2x1 dual-lane upgrader. Applies 3.0x value multiplier (Max 1 use).',
    freonSprayer: 'Cryogenic freon spray. Extinguishes flaming ores and applies Wet status.',
    pyroRefiner: 'Blast furnace refiner. Applies 3.5x multiplier and ignites ores with Flaming status.',
    leadDecontaminator: 'Radiation scrubber. Safely cleans Radioactive status and applies 2.5x multiplier.',
    stellarSparkler: 'Prismatic crystal. Imbues ores with the Sparkling status buff (Max 2 uses).',
    upgraderPlasma: 'High-energy plasma injector. Adds +$500 flat bonus value to passing ores (Max 2 uses).',
    oreCrystallizer: 'Crystalline resonance chamber. Applies 2.2x multiplier and Crystalline status.',
    probabilityAmp: 'Quantum probability booster. Applies 1.8x multiplier and grants Lucky status.',
    entropyStabilizer: 'Cleanses and neutralizes all negative status effects with 3.0x multiplier.',
    resonanceHarmonizer: 'Harmonic booster. 4.5x multiplier with special synergy on Sparkling ores.',
    matterReplicator: 'Splits passing ores into duplicates, doubling throughput.',
    oreTransmuter: 'Transmutes low-tier mineral ores into high-value exotic ores with 2.5x multiplier.',
    shardOfLife: 'Mythic aura generator. 6.0x multiplier and empowers adjacent machinery (Max 3 uses).',

    // Sellers & Smelters
    seller: 'Standard furnace (1.0x payout). Collects and incinerates ores, adding their cash value to your funds.',
    blastSmelter: 'High-efficiency industrial smelter. Sells ores with a +100% bonus (2.0x total payout).',
    cryoSmelter: 'Cryo-Quench Smelter. 3.0x payout for Wet or Extinguished ores. (-50% penalty on Flaming ores).',
    pyroSmelter: 'Thermobaric Smelter. 4.0x payout for Flaming/Superheated ores. (Wet ores are destroyed).',
    dimensionalVault: 'Stores ores in batches of 5, selling them together with a 3.5x payout bonus.',
    catalyticConverter: 'Chemical furnace. 2.5x base sell payout, boosted to 4.0x for Radioactive ores.',
    prismaticSmelter: 'Refines mineral crystals into gemstones. Massive 5.5x payout for Sparkling/Crystalline ores.',
    singularitySmelter: 'Gravitational black hole (7.0x payout). Vacuum field pulls all nearby ores within 1.5 tiles inward.',
    soulForge: 'Forbidden crucible. Massive 8.0x sell payout with a 10% risk of ore destruction.',
    supernovaCrucible: 'Stellar fusion crucible. Unlocks massive 12.0x payout for ores over $10,000 with 2+ active status buffs.'
  };

  if (specificDescriptions[def.id]) {
    return specificDescriptions[def.id];
  }

  // Dynamic fallback for custom/generated machines
  if (def.produces) parts.push(`Produces ${def.produces.item.replace(/([A-Z])/g, ' $1').trim()} every ${def.produces.rate || 1000}ms`);
  if (def.multiplier) parts.push(`${def.multiplier}x multiplier`);
  if (def.flatAdd) parts.push(`+$${def.flatAdd.toLocaleString()} flat bonus`);
  if (def.sellerBonus) parts.push(`${def.sellerBonus}x sell payout`);
  if (def.speed) parts.push(`${def.speed} speed`);
  if (def.extinguishes) parts.push('Extinguishes fire');
  if (def.appliesWet) parts.push(`Applies Wet (${def.appliesWet}s)`);
  if (def.appliesFlaming) parts.push('Ignites Flaming');
  if (def.removesRadioactive) parts.push('Decontaminates radiation');
  if (def.appliesSparkling) parts.push('Grants Sparkling');
  if (def.duplicatesOre) parts.push('Duplicates ores');
  if (def.requiresFuel) parts.push('Requires Coal fuel');
  if (def.consumes && def.category === 'seller') parts.push('Sells ores for cash');
  
  return parts.length > 0 ? parts.join(' \u2022 ') : `${def.category.toUpperCase()} machine`;
}


// Object Creator Logic
function initCustomObjectCreator() {
  const canvasEl = document.getElementById('pixelCanvas');
  if (!canvasEl) return;
  const pixelCtx = canvasEl.getContext('2d');
  const gridSize = 12;
  const cellSize = canvasEl.width / gridSize;
  let activeColor = '#7fd0ff';
  let activeTool = 'pencil';
  let isDrawing = false;

  const pixels = Array(gridSize).fill(null).map(() => Array(gridSize).fill('#1e293b'));

  function renderPixels() {
    pixelCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        pixelCtx.fillStyle = pixels[r][c];
        pixelCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        pixelCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        pixelCtx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }
  renderPixels();

  const paletteColors = ['#3d6a8f', '#7fd0ff', '#ffcf5c', '#ff4757', '#2ecc71', '#8e44ad', '#d35400', '#ffffff', '#4b4f58', '#000000'];
  const paletteRow = document.getElementById('paletteRow');
  if (paletteRow) {
    paletteRow.innerHTML = '';
    paletteColors.forEach(col => {
      const swatch = document.createElement('div');
      swatch.className = 'palette-color';
      swatch.style.background = col;
      if (col === activeColor) swatch.classList.add('active');
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.palette-color').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        activeColor = col;
        activeTool = 'pencil';
      });
      paletteRow.appendChild(swatch);
    });
  }

  document.getElementById('toolPencil')?.addEventListener('click', () => { activeTool = 'pencil'; updateToolsUI(); });
  document.getElementById('toolEraser')?.addEventListener('click', () => { activeTool = 'eraser'; updateToolsUI(); });
  document.getElementById('toolClear')?.addEventListener('click', () => {
    for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) pixels[r][c] = '#1e293b';
    renderPixels();
  });

  function updateToolsUI() {
    document.getElementById('toolPencil')?.classList.toggle('active', activeTool === 'pencil');
    document.getElementById('toolEraser')?.classList.toggle('active', activeTool === 'eraser');
  }

  function paintPixel(e) {
    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const c = Math.floor(x / (rect.width / gridSize));
    const r = Math.floor(y / (rect.height / gridSize));
    if (c >= 0 && c < gridSize && r >= 0 && r < gridSize) {
      pixels[r][c] = activeTool === 'eraser' ? '#1e293b' : activeColor;
      renderPixels();
    }
  }

  canvasEl.addEventListener('mousedown', (e) => { isDrawing = true; paintPixel(e); });
  canvasEl.addEventListener('mousemove', (e) => { if (isDrawing) paintPixel(e); });
  window.addEventListener('mouseup', () => { isDrawing = false; });

  const catSelect = document.getElementById('custCategory');
  function updateCategoryPanels() {
    const cat = catSelect ? catSelect.value : 'extractor';
    const extPanel = document.getElementById('custSettingsExtractor');
    const beltPanel = document.getElementById('custSettingsBelt');
    const upgPanel = document.getElementById('custSettingsUpgrader');
    const selPanel = document.getElementById('custSettingsSeller');
    if (extPanel) extPanel.style.display = cat === 'extractor' ? 'block' : 'none';
    if (beltPanel) beltPanel.style.display = cat === 'belt' ? 'block' : 'none';
    if (upgPanel) upgPanel.style.display = cat === 'upgrader' ? 'block' : 'none';
    if (selPanel) selPanel.style.display = cat === 'seller' ? 'block' : 'none';
  }
  catSelect?.addEventListener('change', updateCategoryPanels);
  updateCategoryPanels();

  document.getElementById('openCreatorBtn')?.addEventListener('click', () => {
    closeInventoryModal();
    updateCategoryPanels();
    document.getElementById('customCreatorModal')?.classList.add('open');
  });
  document.getElementById('closeCreatorBtn')?.addEventListener('click', () => {
    document.getElementById('customCreatorModal')?.classList.remove('open');
  });

  document.getElementById('btnSaveCustomItem')?.addEventListener('click', () => {
    const name = document.getElementById('custName').value || 'Custom Machine';
    const category = document.getElementById('custCategory').value || 'extractor';
    const cost = parseInt(document.getElementById('custCost').value, 10) || 100;
    const w = parseFloat(document.getElementById('custWidth').value) || 1;
    const h = parseFloat(document.getElementById('custHeight').value) || 1;

    const customId = `custom_${Date.now()}`;
    let newDef = {
      id: customId,
      name,
      category,
      rarity: 'epic',
      cost,
      priceGrowth: 1.12,
      unlockMethod: 'shop',
      size: { w, h },
      layer: category === 'extractor' || category === 'seller' ? 'machine' : 'belt',
      color: activeColor,
      isCustom: true,
      tags: ['custom'],
      attributes: {}
    };

    if (category === 'extractor') {
      const oreName = document.getElementById('custOreName').value || `${name} Ore`;
      const oreShape = document.getElementById('custOreShape').value || 'circle';
      const oreVal = parseInt(document.getElementById('custOreValue').value, 10) || 25;
      const spawnRate = parseInt(document.getElementById('custSpawnRate').value, 10) || 1000;
      const customOreKey = `ore_${customId}`;

      STATE.defs.itemDefs[customOreKey] = {
        id: customOreKey, name: oreName, color: activeColor, size: 14 + (w > 1 ? 4 : 0), baseValue: oreVal, shape: oreShape
      };
      newDef.speed = 40;
      newDef.ports = [{ dx: w, dy: Math.floor(h / 2), kind: 'output', color: activeColor, dropSide: null }];
      newDef.produces = { item: customOreKey, rate: spawnRate };
    } else if (category === 'belt') {
      const speed = parseInt(document.getElementById('custSpeed').value, 10) || 180;
      newDef.speed = speed;
      newDef.ports = [{ dx: 0, dy: 0, kind: 'through', color: activeColor, dropSide: 0 }];
    } else if (category === 'upgrader') {
      const multi = parseFloat(document.getElementById('custMulti').value) || 1;
      const flat = parseInt(document.getElementById('custFlat').value, 10) || 0;
      const energy = parseInt(document.getElementById('custEnergy').value, 10) || 0;
      newDef.speed = 90;
      if (multi > 1) newDef.multiplier = multi;
      if (flat > 0) newDef.flatAdd = flat;
      if (energy > 0) newDef.energyCost = energy;
      newDef.ports = [{ dx: 0, dy: 0, kind: 'through', color: activeColor, dropSide: 0 }];
    } else if (category === 'seller') {
      newDef.consumes = true;
      newDef.ports = [{ dx: 0, dy: 0, kind: 'input', color: activeColor, dropSide: null }];
    }

    STATE.defs.buildingDefs[customId] = newDef;
    STATE.meta.blueprintUnlocks[customId] = true;
    addToInventory(customId, 1, false, 'creator');
    hotbarItems[0] = customId;
    renderHotbar();
    renderInventoryGrid();
    triggerSaveState();

    document.getElementById('customCreatorModal')?.classList.remove('open');
    showToast(`Created custom ${name} (Added to Inventory)`);
  });
}

function initMobileToolbarListeners() {
  document.getElementById('mobileRotateBtn')?.addEventListener('click', () => {
    if (mode === 'placing' && placingState) {
      placingState.rot = (placingState.rot + 1) % 4;
      showToast(`Rotated Placement [${placingState.rot * 90}°]`);
    } else if (mode === 'moving' && movingState) {
      movingState.rot = (movingState.rot + 1) % 4;
      showToast(`Rotated Moving [${movingState.rot * 90}°]`);
    } else if (activeContextBuilding) {
      rotateBuildingInPlace(activeContextBuilding);
      showToast('Rotated Machine');
    } else {
      showToast('Select a machine or enter placing mode to rotate.');
    }
  });

  document.getElementById('mobileInspectBtn')?.addEventListener('click', (e) => {
    const btn = document.getElementById('mobileInspectBtn');
    if (mode === 'inspecting') {
      cancelMode();
      btn?.classList.remove('active');
      showToast('Inspector Mode Off');
    } else {
      setMode('inspecting');
      btn?.classList.add('active');
      showToast('Inspector Mode On: Tap machine or ore');
    }
  });

  document.getElementById('mobileZoomInBtn')?.addEventListener('click', () => {
    if (sceneInstance && sceneInstance.cameras && sceneInstance.cameras.main) {
      const cur = sceneInstance.cameras.main.zoom;
      sceneInstance.cameras.main.setZoom(Math.min(2.5, cur * 1.25));
    }
  });

  document.getElementById('mobileZoomOutBtn')?.addEventListener('click', () => {
    if (sceneInstance && sceneInstance.cameras && sceneInstance.cameras.main) {
      const cur = sceneInstance.cameras.main.zoom;
      sceneInstance.cameras.main.setZoom(Math.max(0.35, cur / 1.25));
    }
  });

  document.getElementById('mobileCancelBtn')?.addEventListener('click', () => {
    closeContextMenu();
    closeInventoryModal();
    closeCrateModal();
    closeSavesModal();
    closePrestigeModal();
    cancelMode();
    document.getElementById('mobileInspectBtn')?.classList.remove('active');
    renderHotbar();
    showToast('Selection Cancelled');
  });
}

function initHotbarAndInventory() {
  renderHotbar();
  initContextMenuListeners();
  initCustomObjectCreator();
  initMobileToolbarListeners();
  if (typeof loadSavedState === 'function') loadSavedState();

  // Tab Listeners for Main Tabs (Shop, Inventory, Relics, Prestige)
  const mainTabsContainer = document.getElementById('invMainTabs');
  if (mainTabsContainer) {
    mainTabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.inv-main-tab');
      if (!btn) return;
      document.querySelectorAll('#invMainTabs .inv-main-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentMainTab = btn.getAttribute('data-tab') || 'shop';
      renderInventoryGrid();
    });
  }

  document.getElementById('openInvBtn')?.addEventListener('click', () => openInventoryModal('shop'));
  document.getElementById('closeInvBtn')?.addEventListener('click', closeInventoryModal);
  document.getElementById('openSavesBtn')?.addEventListener('click', openSavesModal);
  document.getElementById('closeSavesBtn')?.addEventListener('click', closeSavesModal);
  document.getElementById('openCrateBtn')?.addEventListener('click', openCrateModal);
  document.getElementById('closeCrateBtn')?.addEventListener('click', closeCrateModal);
  document.getElementById('openPrestigeBtn')?.addEventListener('click', openPrestigeModal);
  document.getElementById('closePrestigeBtn')?.addEventListener('click', closePrestigeModal);

  document.getElementById('btnConfirmPrestige')?.addEventListener('click', () => {
    if (executePrestigeReset()) {
      closePrestigeModal();
      renderHotbar();
      renderInventoryGrid();
    }
  });

  document.querySelectorAll('.crate-buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const crateKey = e.target.getAttribute('data-crate');
      buyAndOpenCrateUI(crateKey);
    });
  });

  document.getElementById('invSearchInput')?.addEventListener('input', renderInventoryGrid);

  // Category Sub-tabs (All, Extractors, Conveyors, Upgraders, Sellers)
  const categoryTabsContainer = document.getElementById('invTabs');
  if (categoryTabsContainer) {
    categoryTabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.inv-tab');
      if (!btn) return;
      document.querySelectorAll('#invTabs .inv-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category') || 'all';
      renderInventoryGrid();
    });
  }

  // Inspector close
  document.getElementById('inspectorClose')?.addEventListener('click', () => {
    selectedEntity = null;
    updateInspectorPanel();
  });
}

// Global Key Listeners
window.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
    if (e.key === 'Escape') {
      document.activeElement.blur();
      closeInventoryModal();
      closeCrateModal();
      closePrestigeModal();
    }
    return;
  }

  if (e.key === 'Escape') {
    closeContextMenu();
    closeInventoryModal();
    closeCrateModal();
    closePrestigeModal();
    cancelMode();
    renderHotbar();
  } else if (e.key === 'e' || e.key === 'E') {
    const modal = document.getElementById('inventoryModal');
    if (modal && modal.classList.contains('open')) closeInventoryModal();
    else openInventoryModal();
  } else if (e.key >= '1' && e.key <= '6') {
    const slotIdx = parseInt(e.key, 10) - 1;
    const itemDefId = hotbarItems[slotIdx];
    if (itemDefId && STATE.defs.buildingDefs[itemDefId]) {
      enterPlacingMode(itemDefId);
      renderHotbar();
    }
  } else if (e.key === 'r' || e.key === 'R') {
    if (mode === 'placing' && placingState) {
      placingState.rot = (placingState.rot + 1) % 4;
      showToast(`Placing Rotation: ${placingState.rot * 90}°`, 'info');
    } else if (mode === 'moving' && movingState) {
      movingState.rot = (movingState.rot + 1) % 4;
      showToast(`Moving Rotation: ${movingState.rot * 90}°`, 'info');
    } else {
      // Rotate building hovered under mouse cursor, or active selected/context building
      const world = screenToWorld(mouseScreen.x, mouseScreen.y);
      const cell = worldToCell(world.x, world.y);
      const hoveredB = findBuildingAtCell(cell.col, cell.row);
      const targetB = hoveredB || (selectedEntity && selectedEntity.type === 'building' ? findBuildingById(selectedEntity.id) : null) || activeContextBuilding;
      if (targetB) {
        if (rotateBuildingInPlace(targetB)) {
          const def = STATE.defs.buildingDefs[targetB.defId];
          showToast(`Rotated ${def ? def.name : 'Machine'} to ${targetB.rot * 90}°`, 'info');
        } else {
          showToast('Cannot rotate: footprint obstructed', 'warn');
        }
      } else {
        showToast('Hover over a machine to rotate [R]', 'info');
      }
    }
  }
});

// Initialize UI Engine
initHotbarAndInventory();
