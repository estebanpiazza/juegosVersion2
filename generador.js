/* ======================================================
   Be Tech – Generador de Niveles
   ====================================================== */

const CARD_DEFS = [
  { id: "avanzar",          label: "Avanzar",       img: "tarjetas%20movimiento/AVANZAR.png" },
  { id: "derecha",          label: "Derecha",        img: "tarjetas%20movimiento/DERECHA.png" },
  { id: "izquierda",        label: "Izquierda",      img: "tarjetas%20movimiento/IZQUIERDA.png" },
  { id: "repetir-x2",       label: "Repetir ×2",     img: "tarjetas%20movimiento/Reptir%20x2.png" },
  { id: "repetir-x3",       label: "Repetir ×3",     img: "tarjetas%20movimiento/Reptir%20x3.png" },
  { id: "repetir-x4",       label: "Repetir ×4",     img: "tarjetas%20movimiento/Reptir%20x4.png" },
  { id: "repetir-x5",       label: "Repetir ×5",     img: "tarjetas%20movimiento/Reptir%20x5.png" },
  { id: "parentesis-abre",  label: "( Abre",         img: "tarjetas%20movimiento/parentesis.png" },
  { id: "parentesis-cierra",label: ") Cierra",        img: "tarjetas%20movimiento/parentesis%202.png" },
  { id: "entrada",          label: "Entrada",        img: "tarjetas%20movimiento/Entrada.png" },
  { id: "vamos",            label: "¡Vamos!",        img: "tarjetas%20movimiento/Vamos.png" },
];

const CARD_MAP = Object.fromEntries(CARD_DEFS.map((c) => [c.id, c]));

const CELL_CYCLE = ["empty", "path", "enemy", "item", "start", "goal"];
const CELL_EMOJI = {
  empty:  "",
  path:   "",
  enemy:  "👾",
  item:   "🔋",
  start:  "🤖",
  goal:   "🏁",
};

const PREVIEW_KEY = "betech-preview-level";

// ── State ──────────────────────────────────────────────
const state = {
  rows: 6,
  cols: 6,
  cells: {},        // "row-col" → type
  startCell: null,  // "row-col" | null
  goalCell:  null,
  robotDir:  2,     // 0=↑ 1=→ 2=↓ 3=←
  totalSlots: 8,
  hints: [],        // [{slot, card}]
  availableCards: new Set(["avanzar", "derecha", "izquierda"]),
  activePickerSlot: null,
};

// ── DOM refs ───────────────────────────────────────────
const gridEl         = document.getElementById("gen-grid");
const dirSection     = document.getElementById("gen-dir-section");
const algoSlotsEl    = document.getElementById("gen-algo-slots");
const cardPickerEl   = document.getElementById("gen-card-picker");
const cardsGridEl    = document.getElementById("gen-cards-grid");
const totalSlotsInput = document.getElementById("gen-total-slots");
const rowsInput      = document.getElementById("gen-rows");
const colsInput      = document.getElementById("gen-cols");
const errorEl        = document.getElementById("gen-error");

// ── Init ───────────────────────────────────────────────
buildGrid();
buildAlgoSlots();
buildCardsGrid();

document.getElementById("gen-grid-rebuild").addEventListener("click", () => {
  const r = Math.min(8, Math.max(3, parseInt(rowsInput.value) || 6));
  const c = Math.min(8, Math.max(3, parseInt(colsInput.value) || 6));
  rowsInput.value = r;
  colsInput.value = c;
  state.rows = r;
  state.cols = c;
  // Reset cells
  state.cells = {};
  state.startCell = null;
  state.goalCell  = null;
  buildGrid();
  updateDirSection();
});

totalSlotsInput.addEventListener("change", () => {
  const val = Math.min(16, Math.max(1, parseInt(totalSlotsInput.value) || 8));
  totalSlotsInput.value = val;
  state.totalSlots = val;
  // Remove hints beyond new count
  state.hints = state.hints.filter((h) => h.slot < val);
  buildAlgoSlots();
});

document.querySelectorAll(".gen-dir-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.robotDir = Number(btn.dataset.dir);
    updateDirButtons();
    refreshGrid(); // re-render start cell emoji with direction arrow
  });
});

document.getElementById("gen-download-btn").addEventListener("click", downloadJSON);
document.getElementById("gen-preview-btn").addEventListener("click", previewLevel);

// Close picker when clicking outside
document.addEventListener("click", (e) => {
  if (state.activePickerSlot !== null && !cardPickerEl.contains(e.target)) {
    const slotEl = algoSlotsEl.querySelector(`[data-slot="${state.activePickerSlot}"]`);
    if (slotEl && slotEl.contains(e.target)) return; // let slot handler run first
    closePicker();
  }
});

// ── Grid builder ───────────────────────────────────────
function buildGrid() {
  gridEl.innerHTML = "";
  gridEl.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const key = `${r}-${c}`;
      if (!state.cells[key]) state.cells[key] = "empty";
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "gen-cell";
      cell.dataset.key = key;
      cell.setAttribute("aria-label", `Celda ${r + 1}-${c + 1}`);
      applyCell(cell, state.cells[key]);
      cell.addEventListener("click", () => onCellClick(key, cell));
      gridEl.appendChild(cell);
    }
  }
}

function refreshGrid() {
  gridEl.querySelectorAll(".gen-cell").forEach((cell) => {
    applyCell(cell, state.cells[cell.dataset.key]);
  });
}

function applyCell(el, type) {
  el.dataset.type = type;
  const dir = state.robotDir;
  const dirArrows = ["↑", "→", "↓", "←"];
  if (type === "start") {
    el.textContent = dirArrows[dir];
    el.title = `Inicio (robot mira ${["arriba","derecha","abajo","izquierda"][dir]})`;
  } else {
    el.textContent = CELL_EMOJI[type] || "";
    el.title = type.charAt(0).toUpperCase() + type.slice(1);
  }
}

function onCellClick(key, el) {
  const current = state.cells[key];
  const currentIdx = CELL_CYCLE.indexOf(current);
  let nextIdx = (currentIdx + 1) % CELL_CYCLE.length;
  let next = CELL_CYCLE[nextIdx];

  // Enforce single start / goal
  if (next === "start" && state.startCell && state.startCell !== key) {
    // Clear old start
    state.cells[state.startCell] = "empty";
    const oldEl = gridEl.querySelector(`[data-key="${state.startCell}"]`);
    if (oldEl) applyCell(oldEl, "empty");
    state.startCell = null;
  }
  if (next === "goal" && state.goalCell && state.goalCell !== key) {
    state.cells[state.goalCell] = "empty";
    const oldEl = gridEl.querySelector(`[data-key="${state.goalCell}"]`);
    if (oldEl) applyCell(oldEl, "empty");
    state.goalCell = null;
  }

  // Update tracking
  if (current === "start") state.startCell = null;
  if (current === "goal")  state.goalCell  = null;

  state.cells[key] = next;
  if (next === "start") state.startCell = key;
  if (next === "goal")  state.goalCell  = key;

  applyCell(el, next);
  updateDirSection();
}

function updateDirSection() {
  dirSection.hidden = !state.startCell;
  updateDirButtons();
}

function updateDirButtons() {
  document.querySelectorAll(".gen-dir-btn").forEach((btn) => {
    btn.classList.toggle("is-active", Number(btn.dataset.dir) === state.robotDir);
  });
}

// ── Algorithm editor ───────────────────────────────────
function buildAlgoSlots() {
  algoSlotsEl.innerHTML = "";
  for (let i = 0; i < state.totalSlots; i++) {
    const hint = state.hints.find((h) => h.slot === i);
    const slotEl = document.createElement("div");
    slotEl.className = "gen-slot" + (hint ? " is-hint" : "");
    slotEl.dataset.slot = i;
    slotEl.setAttribute("role", "listitem");
    slotEl.setAttribute("aria-label", hint ? `Pista ${i + 1}: ${hint.card}` : `Casilla vacía ${i + 1}`);

    const numEl = document.createElement("span");
    numEl.className = "gen-slot-num";
    numEl.textContent = i + 1;
    slotEl.appendChild(numEl);

    if (hint) {
      const card = CARD_MAP[hint.card];
      if (card) {
        const img = document.createElement("img");
        img.className = "gen-slot-img";
        img.src = card.img;
        img.alt = card.label;
        slotEl.appendChild(img);

        const lbl = document.createElement("span");
        lbl.className = "gen-slot-label";
        lbl.textContent = card.label;
        slotEl.appendChild(lbl);
      }
      // Clear button
      const clrBtn = document.createElement("button");
      clrBtn.type = "button";
      clrBtn.className = "gen-slot-clear";
      clrBtn.textContent = "✕";
      clrBtn.title = "Quitar pista";
      clrBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.hints = state.hints.filter((h) => h.slot !== i);
        buildAlgoSlots();
      });
      slotEl.appendChild(clrBtn);
    } else {
      const emptyTxt = document.createElement("span");
      emptyTxt.className = "gen-slot-empty-text";
      emptyTxt.textContent = "Vacía";
      slotEl.appendChild(emptyTxt);
    }

    slotEl.addEventListener("click", () => onSlotClick(i, slotEl));
    algoSlotsEl.appendChild(slotEl);
  }
}

function onSlotClick(index, slotEl) {
  if (state.activePickerSlot === index) {
    closePicker();
    return;
  }
  closePicker();
  state.activePickerSlot = index;
  openPickerFor(slotEl);
}

function openPickerFor(slotEl) {
  cardPickerEl.innerHTML = "";
  cardPickerEl.hidden = false;

  CARD_DEFS.forEach((card) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "gen-card-picker-item";
    item.title = card.label;

    const img = document.createElement("img");
    img.src = card.img;
    img.alt = card.label;
    item.appendChild(img);

    const lbl = document.createElement("span");
    lbl.textContent = card.label;
    item.appendChild(lbl);

    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const slot = state.activePickerSlot;
      state.hints = state.hints.filter((h) => h.slot !== slot);
      state.hints.push({ slot, card: card.id });
      closePicker();
      buildAlgoSlots();
    });

    cardPickerEl.appendChild(item);
  });

  // Position below the slot (fixed = viewport coords)
  const rect = slotEl.getBoundingClientRect();
  const pickerW = 230;
  let left = rect.left;
  if (left + pickerW > window.innerWidth - 8) left = window.innerWidth - pickerW - 8;
  if (left < 8) left = 8;
  cardPickerEl.style.top  = `${rect.bottom + 6}px`;
  cardPickerEl.style.left = `${left}px`;
  document.body.appendChild(cardPickerEl);
}

function closePicker() {
  cardPickerEl.hidden = true;
  cardPickerEl.innerHTML = "";
  state.activePickerSlot = null;
}

// ── Available cards ─────────────────────────────────────
function buildCardsGrid() {
  cardsGridEl.innerHTML = "";
  CARD_DEFS.forEach((card) => {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "gen-card-toggle" + (state.availableCards.has(card.id) ? " is-active" : "");
    toggle.title = card.label;
    toggle.setAttribute("aria-pressed", state.availableCards.has(card.id) ? "true" : "false");

    const img = document.createElement("img");
    img.src = card.img;
    img.alt = card.label;
    toggle.appendChild(img);

    const lbl = document.createElement("span");
    lbl.textContent = card.label;
    toggle.appendChild(lbl);

    toggle.addEventListener("click", () => {
      if (state.availableCards.has(card.id)) {
        state.availableCards.delete(card.id);
        toggle.classList.remove("is-active");
        toggle.setAttribute("aria-pressed", "false");
      } else {
        state.availableCards.add(card.id);
        toggle.classList.add("is-active");
        toggle.setAttribute("aria-pressed", "true");
      }
    });

    cardsGridEl.appendChild(toggle);
  });
}

// ── Validation ─────────────────────────────────────────
function validate() {
  if (!state.startCell) return "Falta la celda de Inicio (🤖).";
  if (!state.goalCell)  return "Falta la celda de Meta (🏁).";
  const pathCells = Object.values(state.cells).filter((t) => t === "path" || t === "start" || t === "goal" || t === "item");
  if (pathCells.length < 2) return "El laberinto necesita al menos algunas celdas de Camino.";
  if (state.availableCards.size === 0) return "Seleccioná al menos una tarjeta disponible para el jugador.";
  return null;
}

function showError(msg) {
  errorEl.textContent = msg || "";
  errorEl.classList.toggle("is-visible", !!msg);
}

// ── JSON builder ───────────────────────────────────────
function buildLevelJSON() {
  const autor    = document.getElementById("gen-autor").value.trim();
  const tematica = document.getElementById("gen-tematica").value.trim();
  const nivel    = Math.max(1, parseInt(document.getElementById("gen-nivel").value) || 1);
  const desafio  = Math.max(1, parseInt(document.getElementById("gen-desafio").value) || 1);
  const consigna = document.getElementById("gen-consigna").value.trim();

  const celdas = {};
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const key = `${r}-${c}`;
      celdas[key] = state.cells[key] || "empty";
    }
  }

  return {
    autor,
    tematica,
    nivel,
    desafio,
    consigna,
    grilla: {
      filas: state.rows,
      columnas: state.cols,
      celdas,
      robotDireccionInicial: state.robotDir,
    },
    algoritmo: {
      totalSlots: state.totalSlots,
      pistas: [...state.hints].sort((a, b) => a.slot - b.slot),
      tarjetasDisponibles: [...state.availableCards],
    },
  };
}

// ── Download ───────────────────────────────────────────
function downloadJSON() {
  const err = validate();
  if (err) { showError(err); return; }
  showError(null);

  const data    = buildLevelJSON();
  const json    = JSON.stringify(data, null, 2);
  const blob    = new Blob([json], { type: "application/json" });
  const url     = URL.createObjectURL(blob);
  const fname   = `nivel-${data.nivel}-desafio-${data.desafio}.json`;
  const anchor  = document.createElement("a");
  anchor.href     = url;
  anchor.download = fname;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// ── Preview ────────────────────────────────────────────
function previewLevel() {
  const err = validate();
  if (err) { showError(err); return; }
  showError(null);

  const data = buildLevelJSON();
  try {
    localStorage.setItem(PREVIEW_KEY, JSON.stringify(data));
  } catch {
    showError("No se pudo guardar en el navegador. Intentá descargar el JSON.");
    return;
  }
  window.open("jugar-nivel.html?preview=true", "_blank");
}

// ── Import from JSON ───────────────────────────────────
document.getElementById("gen-import-file").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      loadFromJSON(data);
    } catch {
      showError("El archivo no es un JSON válido.");
    }
  };
  reader.readAsText(file);
  // Reset so same file can be re-imported
  e.target.value = "";
});

function loadFromJSON(data) {
  if (!data || !data.grilla) {
    showError("El archivo no tiene el formato esperado de nivel.");
    return;
  }
  showError(null);

  // Metadata
  document.getElementById("gen-autor").value    = data.autor    || "";
  document.getElementById("gen-tematica").value = data.tematica || "";
  document.getElementById("gen-nivel").value    = data.nivel    || 1;
  document.getElementById("gen-desafio").value  = data.desafio  || 1;
  document.getElementById("gen-consigna").value = data.consigna || "";

  // Grid
  const { filas, columnas, celdas = {}, robotDireccionInicial } = data.grilla;
  state.rows = Math.min(8, Math.max(3, filas || 6));
  state.cols = Math.min(8, Math.max(3, columnas || 6));
  rowsInput.value = state.rows;
  colsInput.value = state.cols;
  state.cells    = { ...celdas };
  state.startCell = Object.keys(celdas).find((k) => celdas[k] === "start") || null;
  state.goalCell  = Object.keys(celdas).find((k) => celdas[k] === "goal")  || null;
  state.robotDir  = robotDireccionInicial ?? 2;
  buildGrid();
  updateDirSection();

  // Algorithm
  const { totalSlots, pistas = [], tarjetasDisponibles = [] } = data.algoritmo || {};
  state.totalSlots = Math.min(16, Math.max(1, totalSlots || 8));
  totalSlotsInput.value = state.totalSlots;
  state.hints = [...pistas];
  state.availableCards = tarjetasDisponibles.length
    ? new Set(tarjetasDisponibles)
    : new Set(["avanzar", "derecha", "izquierda"]);
  buildAlgoSlots();
  buildCardsGrid();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}
