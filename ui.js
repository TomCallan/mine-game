// ===========================================================
// MINER'S HAVEN - UI INTERACTION, CRATE SHOP & CREATOR ENGINE
// ===========================================================

let activeContextBuilding = null;

// Context Menu Card
function openContextMenu(building, screenX, screenY) {
  activeContextBuilding = building;
  selectedEntity = { type: 'building', id: building.id };
  const def = STATE.buildingDefs[building.defId];
  if (!def) return;
  const fp = getFootprint(def, building.rot);

  const menu = document.getElementById('contextMenu');
  if (!menu) return;

  document.getElementById('ctxTitle').textContent = def.name;
  document.getElementById('ctxSub').textContent = `${def.category.toUpperCase()} • ${fp.w}x${fp.h} Tile • ${def.rarity ? def.rarity.toUpperCase() : 'COMMON'}`;
  document.getElementById('ctxSwatch').style.background = def.color;

  let stats = `Cost: $${def.cost || 0} | Speed: ${def.speed || 'N/A'}`;
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
  closeContextMenu();
  if (mode !== 'idle') { cancelMode(); }
  else openInventoryModal();
});

// Hotbar & Inventory Catalog
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

    const keySpan = document.createElement('span');
    keySpan.className = 'hotbar-key';
    keySpan.textContent = idx + 1;
    slot.appendChild(keySpan);

    if (defId && STATE.buildingDefs[defId]) {
      const def = STATE.buildingDefs[defId];
      const swatch = document.createElement('div');
      swatch.className = 'hotbar-swatch';
      swatch.style.background = def.color;
      slot.appendChild(swatch);

      const label = document.createElement('div');
      label.className = 'hotbar-label';
      label.textContent = def.name;
      slot.appendChild(label);
    } else {
      const label = document.createElement('div');
      label.className = 'hotbar-label';
      label.textContent = 'Empty';
      slot.appendChild(label);
    }

    slot.addEventListener('click', () => {
      if (defId && STATE.buildingDefs[defId]) {
        enterPlacingMode(defId);
        renderHotbar();
      }
    });

    container.appendChild(slot);
  });
}

function renderInventoryGrid() {
  const grid = document.getElementById('invGrid');
  const searchInput = document.getElementById('invSearchInput');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  if (!grid) return;
  grid.innerHTML = '';

  Object.values(STATE.buildingDefs).forEach(def => {
    if (currentCategory !== 'all' && def.category !== currentCategory) return;
    if (search && !def.name.toLowerCase().includes(search) && !def.id.toLowerCase().includes(search)) return;

    const isUnlocked = STATE.unlockedBuildingIds.includes(def.id);
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
    title.textContent = isUnlocked ? def.name : `Locked: ${def.name}`;
    titleBox.appendChild(title);

    const badge = document.createElement('span');
    badge.className = `inv-card-badge rarity-badge-${rarity}`;
    badge.textContent = `${rarity.toUpperCase()} • ${def.size.w}x${def.size.h} • $${def.cost || 0}`;
    titleBox.appendChild(badge);

    top.appendChild(titleBox);
    card.appendChild(top);

    const desc = document.createElement('div');
    desc.className = 'inv-card-desc';
    let stats = `Cost: $${def.cost || 0} | Speed: ${def.speed || 'N/A'}`;
    if (def.multiplier) stats += ` | ${def.multiplier}x Multiplier`;
    if (def.flatAdd) stats += ` | +$${def.flatAdd} Flat`;
    if (def.consumes) stats = 'Sells ores for cash bonus';
    if (def.produces) stats = `Produces ${def.produces.item} every ${def.produces.rate}ms`;
    if (!isUnlocked) stats = 'Locked: Open Crates in the Crate Shop to unlock.';
    desc.textContent = stats;
    card.appendChild(desc);

    const actions = document.createElement('div');
    actions.className = 'inv-card-actions';

    const placeBtn = document.createElement('button');
    placeBtn.className = `inv-card-place-btn ${isUnlocked ? '' : 'locked-btn'}`;
    placeBtn.textContent = isUnlocked ? `Place ($${def.cost || 0})` : 'Locked';
    placeBtn.addEventListener('click', () => {
      if (!isUnlocked) {
        showToast('Open Crates to unlock this item!');
        return;
      }
      closeInventoryModal();
      enterPlacingMode(def.id);
      renderHotbar();
    });
    actions.appendChild(placeBtn);

    if (isUnlocked) {
      const slotBox = document.createElement('div');
      slotBox.className = 'inv-slot-selector';

      const slotLabel = document.createElement('span');
      slotLabel.className = 'inv-slot-label';
      slotLabel.textContent = 'Slot:';
      slotBox.appendChild(slotLabel);

      const slotBtns = document.createElement('div');
      slotBtns.className = 'inv-slot-btns';

      for (let sIdx = 0; sIdx < 6; sIdx++) {
        const sBtn = document.createElement('button');
        sBtn.className = 'inv-slot-btn';
        if (hotbarItems[sIdx] === def.id) sBtn.classList.add('equipped');
        sBtn.textContent = sIdx + 1;
        sBtn.title = `Equip ${def.name} to Hotbar Slot ${sIdx + 1}`;
        sBtn.addEventListener('click', () => {
          hotbarItems[sIdx] = def.id;
          renderHotbar();
          renderInventoryGrid();
        });
        slotBtns.appendChild(sBtn);
      }

      slotBox.appendChild(slotBtns);
      actions.appendChild(slotBox);
    }

    card.appendChild(actions);
    grid.appendChild(card);
  });
}

function openInventoryModal() {
  document.getElementById('inventoryModal')?.classList.add('open');
  renderInventoryGrid();
}

function closeInventoryModal() {
  document.getElementById('inventoryModal')?.classList.remove('open');
}

// Crate Loot Box & Unboxing System
const CRATE_TYPES = {
  regular: {
    id: 'regular', name: 'Regular Crate', cost: 250, icon: '📦',
    rarities: { common: 0.6, uncommon: 0.3, rare: 0.1 }
  },
  gold: {
    id: 'gold', name: 'Golden Crate', cost: 1000, icon: '👑',
    rarities: { uncommon: 0.4, rare: 0.4, epic: 0.2 }
  },
  exotic: {
    id: 'exotic', name: 'Exotic Crate', cost: 5000, icon: '🌌',
    rarities: { rare: 0.2, epic: 0.5, exotic: 0.3 }
  }
};

function openCrateModal() {
  closeInventoryModal();
  document.getElementById('crateModal')?.classList.add('open');
}

function closeCrateModal() {
  document.getElementById('crateModal')?.classList.remove('open');
}

function buyAndOpenCrate(crateTypeKey) {
  const crate = CRATE_TYPES[crateTypeKey];
  if (!crate) return;

  if (STATE.world.money < crate.cost) {
    showToast(`Need $${crate.cost} to open ${crate.name}!`);
    return;
  }

  STATE.world.money -= crate.cost;
  triggerSaveState();

  // Determine unlocked item based on crate rarity weights
  const rand = Math.random();
  let selectedRarity = 'common';
  let cumulative = 0;

  for (const [rarity, weight] of Object.entries(crate.rarities)) {
    cumulative += weight;
    if (rand <= cumulative) {
      selectedRarity = rarity;
      break;
    }
  }

  // Pick an item of selected rarity
  const candidates = Object.values(STATE.buildingDefs).filter(def => (def.rarity || 'common') === selectedRarity);
  const pickedDef = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : STATE.buildingDefs['belt'];

  if (!STATE.unlockedBuildingIds.includes(pickedDef.id)) {
    STATE.unlockedBuildingIds.push(pickedDef.id);
  }

  triggerSaveState();
  startUnboxingAnimation(pickedDef);
}

function startUnboxingAnimation(rewardDef) {
  const overlay = document.getElementById('unboxingOverlay');
  const track = document.getElementById('rouletteTrack');
  if (!overlay || !track) return;

  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.left = '0px';

  const allItems = Object.values(STATE.buildingDefs);
  const itemsCount = 30;
  for (let i = 0; i < itemsCount; i++) {
    const item = (i === 24) ? rewardDef : allItems[Math.floor(Math.random() * allItems.length)];
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
    showToast(`Unlocked: ${rewardDef.name} (${(rewardDef.rarity || 'common').toUpperCase()})`);
    hotbarItems[0] = rewardDef.id;
    renderHotbar();
    renderInventoryGrid();
  }, 3800);
}

// Interactive Object Creator
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

      STATE.itemDefs[customOreKey] = {
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

    STATE.buildingDefs[customId] = newDef;
    if (!STATE.unlockedBuildingIds.includes(customId)) STATE.unlockedBuildingIds.push(customId);
    hotbarItems[0] = customId;
    renderHotbar();
    renderInventoryGrid();
    triggerSaveState();

    document.getElementById('customCreatorModal')?.classList.remove('open');
    showToast(`Created custom ${name} (Equipped to Hotbar Slot 1)`);
  });
}

function initHotbarAndInventory() {
  renderHotbar();
  initContextMenuListeners();
  initCustomObjectCreator();
  loadSavedGame();

  document.getElementById('openInvBtn')?.addEventListener('click', openInventoryModal);
  document.getElementById('closeInvBtn')?.addEventListener('click', closeInventoryModal);
  document.getElementById('openCrateBtn')?.addEventListener('click', openCrateModal);
  document.getElementById('closeCrateBtn')?.addEventListener('click', closeCrateModal);

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
}

// Hotkey Listeners
window.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
    if (e.key === 'Escape') {
      document.activeElement.blur();
      closeInventoryModal();
      closeCrateModal();
    }
    return;
  }

  if (e.key === 'Escape') {
    closeContextMenu();
    closeInventoryModal();
    closeCrateModal();
    cancelMode();
    renderHotbar();
  } else if (e.key === 'e' || e.key === 'E') {
    const modal = document.getElementById('inventoryModal');
    if (modal && modal.classList.contains('open')) closeInventoryModal();
    else openInventoryModal();
  } else if (e.key >= '1' && e.key <= '6') {
    const slotIdx = parseInt(e.key, 10) - 1;
    const itemDefId = hotbarItems[slotIdx];
    if (itemDefId && STATE.buildingDefs[itemDefId]) {
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

// Initialize UI
initHotbarAndInventory();
