// ===========================================================
// MINER'S HAVEN - UI INTERACTION, SHOP, CRATES & METAGAME ENGINE
// ===========================================================

let activeContextBuilding = null;
let currentMainTab = 'shop'; // 'shop' | 'inventory' | 'relics' | 'meta'
currentCategory = 'all';

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

  let stats = `Speed: ${def.speed || 'N/A'}`;
  if (def.multiplier) stats += ` | ${def.multiplier}x Multiplier`;
  if (def.flatAdd) stats += ` | +$${def.flatAdd} Flat`;
  if (def.category === 'upgrader') stats += ` | Integrated Guide Walls`;
  if (building.fuelTimer) stats += ` | Fuel Active: ${Math.ceil(building.fuelTimer)}s`;
  document.getElementById('ctxStats').textContent = stats;

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

  const menuW = 250, menuH = 260;
  let posX = Math.min(window.innerWidth - menuW - 16, Math.max(16, screenX + 12));
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

function initContextMenuListeners() {
  document.getElementById('closeCtxBtn')?.addEventListener('click', closeContextMenu);

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
}

canvas.addEventListener('dblclick', (e) => {
  if (mode !== 'idle') return;
  const world = screenToWorld(e.clientX, e.clientY);
  const cell = worldToCell(world.x, world.y);
  const b = findBuildingAtCell(cell.col, cell.row);
  if (b) openContextMenu(b, e.clientX, e.clientY);
});

canvas.addEventListener('contextmenu', (e) => {
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

// Mode Placers
function enterPlacingMode(defId) {
  if (!STATE.defs.buildingDefs[defId]) return;
  placingState = { defId, rot: 0 };
  setMode('placing');
}
function enterMovingMode(building) {
  movingState = { buildingId: building.id, rot: building.rot };
  setMode('moving');
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
      if (def.crateOnly) return; // Crate-exclusive items do not sell in shop directly
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
      let stats = `Owned in Stock: ${ownedQty}`;
      if (def.multiplier) stats += ` | ${def.multiplier}x Multiplier`;
      if (def.produces) stats += ` | Produces ${def.produces.item}`;
      desc.textContent = stats;
      card.appendChild(desc);

      const priceTag = document.createElement('div');
      priceTag.className = 'inv-card-price';
      priceTag.textContent = `Cost: $${price.toLocaleString()}`;
      card.appendChild(priceTag);

      const buyBtn = document.createElement('button');
      buyBtn.className = `inv-card-place-btn ${isUnlocked ? '' : 'locked-btn'}`;
      buyBtn.textContent = isUnlocked ? `Buy 1x ($${price.toLocaleString()})` : 'Blueprint Locked';
      buyBtn.disabled = !isUnlocked || STATE.run.money < price;

      buyBtn.addEventListener('click', () => {
        if (buyShopItem(def.id, 1)) {
          renderInventoryGrid();
          renderHotbar();
        }
      });
      card.appendChild(buyBtn);
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

function openInventoryModal() {
  document.getElementById('inventoryModal')?.classList.add('open');
  renderInventoryGrid();
}

function closeInventoryModal() {
  document.getElementById('inventoryModal')?.classList.remove('open');
}

// Prestige Modal Logic
function openPrestigeModal() {
  const modal = document.getElementById('prestigeModal');
  if (!modal) return;

  const earnings = STATE.run.lifetimeEarnings || 0;
  const payout = calculatePrestigePayout(earnings);

  document.getElementById('pModalEarnings').textContent = `$${earnings.toLocaleString()}`;
  document.getElementById('pModalPoints').textContent = `+${payout.pointsGained}`;
  document.getElementById('pModalKeys').textContent = `+${payout.keysGained}`;

  const confirmBtn = document.getElementById('btnConfirmPrestige');
  if (confirmBtn) {
    confirmBtn.disabled = !payout.canPrestige;
  }

  modal.style.display = 'flex';
}

function closePrestigeModal() {
  const modal = document.getElementById('prestigeModal');
  if (modal) modal.style.display = 'none';
}

// Crate Shop Modal & Roulette Animation
function openCrateModal() {
  closeInventoryModal();
  document.getElementById('crateModal')?.classList.add('open');
}

function closeCrateModal() {
  document.getElementById('crateModal')?.classList.remove('open');
}

function buyAndOpenCrate(crateTier) {
  const reward = openCrate(crateTier);
  if (!reward) return;

  renderInventoryGrid();
  renderHotbar();
  startUnboxingAnimation(reward);
}

function startUnboxingAnimation(reward) {
  const overlay = document.getElementById('unboxingOverlay');
  const track = document.getElementById('rouletteTrack');
  const title = document.getElementById('rouletteTitle');
  if (!overlay || !track) return;

  if (title) title.textContent = `Unboxing Reward: ${reward.label}`;
  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.left = '0px';

  const allItems = Object.values(STATE.defs.buildingDefs);
  for (let i = 0; i < 30; i++) {
    const item = (i === 24 && reward.id) ? (STATE.defs.buildingDefs[reward.id] || allItems[0]) : allItems[Math.floor(Math.random() * allItems.length)];
    const el = document.createElement('div');
    el.className = `roulette-item rarity-${item.rarity || 'common'}`;

    const swatch = document.createElement('div');
    swatch.style.width = '24px'; swatch.style.height = '24px'; swatch.style.borderRadius = '4px';
    swatch.style.background = item.color;
    el.appendChild(swatch);

    const name = document.createElement('div');
    name.style.fontSize = '9px'; name.style.fontWeight = '800'; name.style.color = '#fff';
    name.textContent = item.name;
    el.appendChild(name);

    track.appendChild(el);
  }

  overlay.classList.add('open');

  setTimeout(() => {
    track.style.transition = 'left 3.5s cubic-bezier(0.1, 1, 0.1, 1)';
    const targetOffset = -(24 * 98 - (document.querySelector('.roulette-container').offsetWidth / 2 - 43));
    track.style.left = `${targetOffset}px`;
  }, 50);

  setTimeout(() => {
    showToast(`Reward Granted: ${reward.label}`);
    renderHotbar();
    renderInventoryGrid();
  }, 3800);
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
    const cam = STATE.camera;
    cam.zoom = Math.min(cam.maxZoom, cam.zoom * 1.25);
    clampCamera();
  });

  document.getElementById('mobileZoomOutBtn')?.addEventListener('click', () => {
    const cam = STATE.camera;
    cam.zoom = Math.max(cam.minZoom, cam.zoom / 1.25);
    clampCamera();
  });

  document.getElementById('mobileCancelBtn')?.addEventListener('click', () => {
    closeContextMenu();
    closeInventoryModal();
    closeCrateModal();
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
  loadSavedGame();

  // Tab Listeners for Main Tabs
  document.querySelectorAll('#invMainTabs .inv-main-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', (e) => {
      document.querySelectorAll('#invMainTabs .inv-main-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentMainTab = e.target.getAttribute('data-tab');
      renderInventoryGrid();
    });
  });

  document.getElementById('openInvBtn')?.addEventListener('click', openInventoryModal);
  document.getElementById('closeInvBtn')?.addEventListener('click', closeInventoryModal);
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
      buyAndOpenCrate(crateKey);
    });
  });

  document.getElementById('invSearchInput')?.addEventListener('input', renderInventoryGrid);

  document.querySelectorAll('#invTabs .inv-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('#invTabs .inv-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-category');
      renderInventoryGrid();
    });
  });

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
    } else if (mode === 'moving' && movingState) {
      movingState.rot = (movingState.rot + 1) % 4;
    }
  }
});

// Initialize UI Engine
initHotbarAndInventory();
