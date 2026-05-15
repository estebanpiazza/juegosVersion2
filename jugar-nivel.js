/* ======================================================
   Be Tech – Motor de Juego (jugar-nivel.html)
   ====================================================== */

const PREVIEW_KEY = "betech-preview-level";
const ROBOT_IMG   = "dise%C3%B1o%20de%20niveles/DESAFIO%206/cara%20Nano.png";

// ── Themes ─────────────────────────────────────────────
// Cada tema define las imágenes para el icono del header, enemigos e ítems.
// Agregar nuevas temáticas aquí según se diseñen.
const THEMES = {
  "virus": {
    icon:  "dise%C3%B1o%20de%20niveles/DESAFIO%206/Virus%20tecnologico.png",
    enemy: "dise%C3%B1o%20de%20niveles/DESAFIO%206/Virus%20tecnologico.png",
    item:  "dise%C3%B1o%20de%20niveles/DESAFIO%206/BATERIA.png",
  },
  "clima": {
    icon:  "assets/Alerta%20de%20lluvia.png",
    enemy: "assets/charco.png",
    item:  "assets/Alerta%20de%20lluvia.png",
  },
};

function getTheme(temaId) {
  return THEMES[temaId] || {};
}

/** Pone el contenido visual correcto en una celda según su tipo y temática. */
function setCellContent(el, type, temaId) {
  // Limpiar contenido previo (excepto el robot)
  const robotImg = el.querySelector(".play-robot-img");
  el.innerHTML = "";
  if (robotImg) el.appendChild(robotImg);

  const theme = getTheme(temaId);
  if (type === "enemy") {
    if (theme.enemy) {
      const img = document.createElement("img");
      img.src = theme.enemy;
      img.alt = "Enemigo";
      img.className = "play-cell-img";
      el.appendChild(img);
    } else {
      el.insertAdjacentText("beforeend", "👾");
    }
  } else if (type === "item") {
    if (theme.item) {
      const img = document.createElement("img");
      img.src = theme.item;
      img.alt = "Ítem";
      img.className = "play-cell-img";
      el.appendChild(img);
    } else {
      el.insertAdjacentText("beforeend", "🔋");
    }
  } else if (type === "goal") {
    const imgGoal = document.createElement("img");
    imgGoal.src = "tarjetas%20movimiento/Vamos.png";
    imgGoal.alt = "Meta";
    imgGoal.className = "play-cell-img";
    el.appendChild(imgGoal);
  } else if (type === "start") {
    const imgStart = document.createElement("img");
    imgStart.src = "tarjetas%20movimiento/Entrada.png";
    imgStart.alt = "Entrada";
    imgStart.className = "play-cell-img play-cell-img--start";
    el.appendChild(imgStart);
  }
}

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

// Direction: 0=↑ 1=→ 2=↓ 3=←
const DIR_DELTA = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const DIR_ROTATION = ["-90deg", "0deg", "90deg", "180deg"];

// ── DOM refs ───────────────────────────────────────────
const gridEl      = document.getElementById("play-grid");
const slotsEl     = document.getElementById("play-slots");
const bankEl      = document.getElementById("play-card-bank");
const checkBtn    = document.getElementById("play-check");
const resetBtn    = document.getElementById("play-reset");
const modalEl     = document.getElementById("play-modal");
const modalWin    = document.getElementById("modal-win");
const modalFail   = document.getElementById("modal-fail");
const titleEl     = document.getElementById("play-title");
const metaEl      = document.getElementById("play-meta");
const consignaEl  = document.getElementById("play-consigna");
const themeIconEl = document.getElementById("play-theme-icon");

// ── Game state ─────────────────────────────────────────
let levelData     = null;
let cellEls       = {};       // "row-col" → DOM element
let slotEls       = [];       // DOM elements for algorithm slots
let selectedSlot  = 0;        // currently active slot index
let isAnimating   = false;
let collectedItems = new Set();

// Robot runtime state
let robotPos = null;  // "row-col"
let robotDir = 0;

// ── Load level ─────────────────────────────────────────
(function init() {
  const params  = new URLSearchParams(window.location.search);
  const preview = params.get("preview") === "true";

  if (preview) {
    try {
      const raw = localStorage.getItem(PREVIEW_KEY);
      if (!raw) throw new Error("Sin datos");
      levelData = JSON.parse(raw);
    } catch {
      document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif;color:#0A7ABE">
        <h2>No se encontró el nivel de previsualización.</h2>
        <p>Volvé al generador y hacé clic en "Probar nivel".</p>
        <a href="generador.html">← Volver al generador</a>
      </div>`;
      return;
    }
  } else {
    const file   = params.get("file");
    const carpeta = params.get("carpeta") || "contenido";
    if (file) {
      fetch(`${carpeta}/${encodeURIComponent(file)}`)
        .then((r) => r.json())
        .then((data) => { levelData = data; renderLevel(); })
        .catch(() => showLoadError());
      return;
    } else {
      showLoadError();
      return;
    }
  }

  renderLevel();
})();

function showLoadError() {
  document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif;color:#0A7ABE">
    <h2>No se encontró el nivel.</h2>
    <a href="index.html">← Inicio</a>
  </div>`;
}

// ── Render level ───────────────────────────────────────
function renderLevel() {
  if (!levelData) return;

  const { grilla, algoritmo } = levelData;

  // Title & meta
  if (levelData.tematica) titleEl.textContent = `¡${levelData.tematica}!`;
  if (levelData.autor)   metaEl.textContent  = `Nivel ${levelData.nivel} · Desafío ${levelData.desafio} · ${levelData.autor}`;
  if (levelData.consigna && consignaEl) {
    consignaEl.textContent = levelData.consigna;
    consignaEl.hidden = false;
  }

  // Theme icon en el header
  if (themeIconEl) {
    const theme = getTheme(levelData.tema);
    if (theme.icon) {
      themeIconEl.src    = theme.icon;
      themeIconEl.alt    = levelData.tema || "";
      themeIconEl.hidden = false;
    } else {
      themeIconEl.hidden = true;
    }
  }

  // Build grid
  gridEl.style.gridTemplateColumns = `repeat(${grilla.columnas}, 1fr)`;
  gridEl.style.gridTemplateRows    = `repeat(${grilla.filas}, 1fr)`;
  gridEl.style.height = "100%";
  gridEl.innerHTML = "";
  cellEls = {};

  for (let r = 0; r < grilla.filas; r++) {
    for (let c = 0; c < grilla.columnas; c++) {
      const key  = `${r}-${c}`;
      const type = (grilla.celdas && grilla.celdas[key]) || "empty";
      const el   = document.createElement("div");
      el.className = "play-cell";
      el.dataset.type    = type;
      el.dataset.baseType = type;
      el.dataset.key     = key;
      el.setAttribute("role", "gridcell");
      setCellContent(el, type, levelData.tema);
      cellEls[key] = el;
      gridEl.appendChild(el);

      if (type === "start") {
        robotPos = key;
        robotDir = grilla.robotDireccionInicial ?? 2;
      }
    }
  }

  placeRobot(robotPos);

  // Build algorithm slots
  buildSlots(algoritmo);

  // Build card bank
  buildBank(algoritmo.tarjetasDisponibles || []);

  // Events
  checkBtn.addEventListener("click", onCheck);
  resetBtn.addEventListener("click", onReset);

  // Modal buttons
  document.getElementById("modal-win-next").addEventListener("click", () => {
    window.location.href = "niveles.html";
  });
  document.getElementById("modal-win-retry").addEventListener("click", () => { hideModal(); onReset(); });
  document.getElementById("modal-fail-home").addEventListener("click", () => {
    window.location.href = "index.html";
  });
  document.getElementById("modal-fail-retry").addEventListener("click", () => { hideModal(); onReset(); });

  // Rating buttons (feedback visual)
  modalEl.querySelectorAll(".modal-rating-grid").forEach(grid => {
    grid.querySelectorAll(".modal-rating-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        grid.querySelectorAll(".modal-rating-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });
  });
}

// ── Slots ──────────────────────────────────────────────
function buildSlots(algoritmo) {
  slotsEl.innerHTML = "";
  slotEls = [];
  const total = algoritmo.totalSlots || 8;
  const hints = algoritmo.pistas || [];

  for (let i = 0; i < total; i++) {
    const hint = hints.find((h) => h.slot === i);
    const el   = document.createElement("div");
    el.className = "play-slot" + (hint ? " is-hint" : "");
    el.dataset.slot = i;
    el.setAttribute("role", "listitem");

    const numEl = document.createElement("span");
    numEl.className = "play-slot-num";
    numEl.textContent = i + 1;
    el.appendChild(numEl);

    if (hint) {
      const card = CARD_MAP[hint.card];
      if (card) {
        el.dataset.card = hint.card;
        const img = document.createElement("img");
        img.src = card.img;
        img.alt = card.label;
        el.appendChild(img);
      }
      const lockEl = document.createElement("span");
      lockEl.className = "play-slot-lock";
      lockEl.textContent = "🔒";
      el.appendChild(lockEl);
    } else {
      const q = document.createElement("span");
      q.className = "play-slot-q";
      q.textContent = "?";
      el.appendChild(q);
    }

    if (!hint) {
      el.addEventListener("click", () => onSlotClick(i));
    }

    slotEls.push(el);
    slotsEl.appendChild(el);
  }

  // Select first free slot
  selectedSlot = 0;
  selectNextFreeSlot(-1);
}

function onSlotClick(index) {
  if (isAnimating) return;
  const el = slotEls[index];
  if (el.classList.contains("is-hint")) return;

  // If already selected and has a card, clear it
  if (el.classList.contains("is-selected") && el.dataset.card) {
    clearSlot(index);
    return;
  }

  // Otherwise just select it
  setSelectedSlot(index);
}

function setSelectedSlot(index) {
  slotEls.forEach((s) => s.classList.remove("is-selected"));
  selectedSlot = index;
  if (slotEls[index]) slotEls[index].classList.add("is-selected");
}

function selectNextFreeSlot(after) {
  for (let i = after + 1; i < slotEls.length; i++) {
    const el = slotEls[i];
    if (!el.classList.contains("is-hint") && !el.dataset.card) {
      setSelectedSlot(i);
      return;
    }
  }
  // No free slot after; keep last selected
}

function clearSlot(index) {
  const el = slotEls[index];
  if (!el || el.classList.contains("is-hint")) return;
  delete el.dataset.card;
  el.innerHTML = "";
  const numEl = document.createElement("span");
  numEl.className = "play-slot-num";
  numEl.textContent = index + 1;
  el.appendChild(numEl);
  const q = document.createElement("span");
  q.className = "play-slot-q";
  q.textContent = "?";
  el.appendChild(q);
  el.classList.remove("is-wrong");
  setSelectedSlot(index);
}

// ── Card bank ──────────────────────────────────────────
function buildBank(cardIds) {
  bankEl.innerHTML = "";
  cardIds.forEach((id) => {
    const card = CARD_MAP[id];
    if (!card) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "play-card";
    btn.dataset.card = id;
    btn.setAttribute("role", "listitem");
    btn.setAttribute("aria-label", card.label);

    const img = document.createElement("img");
    img.src = card.img;
    img.alt = card.label;
    btn.appendChild(img);

    const lbl = document.createElement("span");
    lbl.textContent = card.label;
    btn.appendChild(lbl);

    btn.addEventListener("click", () => onCardClick(id));
    bankEl.appendChild(btn);
  });
}

function onCardClick(cardId) {
  if (isAnimating) return;
  const el = slotEls[selectedSlot];
  if (!el || el.classList.contains("is-hint")) return;

  const card = CARD_MAP[cardId];
  if (!card) return;

  el.dataset.card = cardId;
  el.classList.remove("is-wrong");
  // Rebuild slot content
  el.innerHTML = "";
  const numEl = document.createElement("span");
  numEl.className = "play-slot-num";
  numEl.textContent = selectedSlot + 1;
  el.appendChild(numEl);
  const img = document.createElement("img");
  img.src = card.img;
  img.alt = card.label;
  el.appendChild(img);

  selectNextFreeSlot(selectedSlot);
}

// ── Robot rendering ────────────────────────────────────
function placeRobot(pos) {
  // Remove robot from all cells
  Object.values(cellEls).forEach((cell) => {
    cell.classList.remove("is-robot");
    if (cell.querySelector(".play-robot-img")) {
      cell.querySelector(".play-robot-img").remove();
    }
  });

  if (!pos || !cellEls[pos]) return;
  const cell = cellEls[pos];
  cell.classList.add("is-robot");
  const img = document.createElement("img");
  img.className = "play-robot-img";
  img.src = ROBOT_IMG;
  img.alt = "Robot";
  img.style.setProperty("--robot-rotation", DIR_ROTATION[robotDir]);
  cell.appendChild(img);
}

function markTrail(pos) {
  if (cellEls[pos]) cellEls[pos].classList.add("is-trail");
}

// ── Simulation ─────────────────────────────────────────
function getSlotValues() {
  return slotEls.map((el) => el.dataset.card || null);
}

function expandRepeatBlocks(slots) {
  const result = [];
  let i = 0;
  while (i < slots.length) {
    const cmd = slots[i];
    if (!cmd) { i++; continue; }

    if (cmd.startsWith("repetir-x")) {
      const count = parseInt(cmd.split("repetir-x")[1], 10);
      // Expect next slot to be parentesis-abre
      if (slots[i + 1] === "parentesis-abre") {
        let depth = 1;
        let j = i + 2;
        while (j < slots.length && depth > 0) {
          if (slots[j] === "parentesis-abre")  depth++;
          if (slots[j] === "parentesis-cierra") depth--;
          j++;
        }
        // inner: slots[i+2 .. j-2]
        const inner = slots.slice(i + 2, j - 1).filter(Boolean);
        const expanded = expandRepeatBlocks(inner);
        for (let k = 0; k < count; k++) result.push(...expanded);
        i = j;
      } else {
        // orphan repeat — skip
        i++;
      }
    } else if (cmd === "parentesis-abre" || cmd === "parentesis-cierra") {
      // orphan bracket — skip
      i++;
    } else {
      result.push(cmd);
      i++;
    }
  }
  return result;
}

function applyCommand(cmd) {
  // Returns: "ok" | "off-grid" | "enemy" | "path" | "item" | "start" | "goal" | "empty"
  // Solo "off-grid" y "enemy" causan falla. Las celdas vacías (blancas) son válidas.
  if (cmd === "derecha") {
    robotDir = (robotDir + 1) % 4;
    return "ok";
  }
  if (cmd === "izquierda") {
    robotDir = (robotDir + 3) % 4;
    return "ok";
  }
  if (cmd === "avanzar") {
    const [r, c] = robotPos.split("-").map(Number);
    const [dr, dc] = DIR_DELTA[robotDir];
    const nr = r + dr;
    const nc = c + dc;
    const { filas, columnas } = levelData.grilla;
    if (nr < 0 || nr >= filas || nc < 0 || nc >= columnas) return "off-grid";
    const newPos = `${nr}-${nc}`;
    const type = levelData.grilla.celdas[newPos] || "empty";
    if (type === "enemy") return "enemy";
    robotPos = newPos;
    return type; // "path" | "item" | "start" | "goal" | "empty"
  }
  // entrada, vamos, etc. → no-op
  return "ok";
}

async function runSimulation() {
  isAnimating = true;
  checkBtn.disabled = true;
  resetBtn.disabled = true;

  const rawSlots   = getSlotValues();
  const instructions = expandRepeatBlocks(rawSlots);

  // Reset visual
  Object.values(cellEls).forEach((cell) => {
    cell.classList.remove("is-trail");
  });
  collectedItems.clear();
  robotPos = levelData.grilla.robotDireccionInicial !== undefined
    ? findStartCell()
    : robotPos;
  robotDir = levelData.grilla.robotDireccionInicial ?? 2;
  placeRobot(robotPos);
  await sleep(120);

  let failReason = null;

  for (const cmd of instructions) {
    markTrail(robotPos);
    const result = applyCommand(cmd);
    placeRobot(robotPos);
    await sleep(210);

    if (result === "off-grid") {
      failReason = "El robot salió de la grilla. Revisá la secuencia de movimientos.";
      break;
    }
    if (result === "enemy") {
      failReason = "¡El robot chocó con un enemigo! Esquivalo con otro camino.";
      break;
    }
    if (result === "item") {
      collectedItems.add(robotPos);
      const cell = cellEls[robotPos];
      if (cell) { cell.textContent = "✅"; cell.classList.add("is-collected"); }
    }
  }

  const goal = findGoalCell();
  const itemCells = findItemCells();

  if (!failReason) {
    if (robotPos !== goal) {
      failReason = "El robot no llegó a la meta 🏁. ¡Seguí intentando!";
    } else if (itemCells.length > 0 && collectedItems.size < itemCells.length) {
      failReason = `Al robot le faltó recoger ${itemCells.length - collectedItems.size} ítem(s) 🔋.`;
    }
  }

  isAnimating = false;
  checkBtn.disabled = false;
  resetBtn.disabled = false;

  if (failReason) {
    showModal(false, failReason);
  } else {
    showModal(true);
  }
}

function findStartCell() {
  const { celdas } = levelData.grilla;
  return Object.keys(celdas).find((k) => celdas[k] === "start") || null;
}

function findGoalCell() {
  const { celdas } = levelData.grilla;
  return Object.keys(celdas).find((k) => celdas[k] === "goal") || null;
}

function findItemCells() {
  const { celdas } = levelData.grilla;
  return Object.keys(celdas).filter((k) => celdas[k] === "item");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Handlers ───────────────────────────────────────────
function onCheck() {
  if (isAnimating) return;
  // Clear wrong markers
  slotEls.forEach((el) => el.classList.remove("is-wrong"));
  // Reset robot to start
  resetRobotPosition();
  runSimulation();
}

function onReset() {
  if (isAnimating) return;
  slotEls.forEach((el) => {
    if (el.classList.contains("is-hint")) return;
    el.classList.remove("is-wrong", "is-selected");
    if (el.dataset.card) clearSlot(Number(el.dataset.slot));
  });
  resetRobotPosition();
  placeRobot(robotPos);
  selectNextFreeSlot(-1);
}

function resetRobotPosition() {
  robotPos = findStartCell();
  robotDir = levelData.grilla.robotDireccionInicial ?? 2;
  collectedItems.clear();
  Object.values(cellEls).forEach((cell) => {
    cell.classList.remove("is-trail", "is-robot", "is-collected");
    const robotImg = cell.querySelector(".play-robot-img");
    if (robotImg) robotImg.remove();
    const baseType = cell.dataset.baseType;
    setCellContent(cell, baseType, levelData.tema);
    cell.dataset.type = baseType;
  });
}

// ── Modal ──────────────────────────────────────────────
function showModal(success) {
  modalWin.hidden  = !success;
  modalFail.hidden = success;
  modalEl.hidden   = false;
  // Reset rating selection
  modalEl.querySelectorAll(".modal-rating-btn").forEach(b => b.classList.remove("selected"));
}

function hideModal() {
  modalEl.hidden   = true;
  modalWin.hidden  = true;
  modalFail.hidden = true;
}
