const SCRATCH_STARTER_PROJECT = "scratch/nano-starter.sb3";

const SCRATCH_BLOCKS = {
  forward: {
    label: "Avanzar",
    color: "blue",
    asset: "tarjetas movimiento/AVANZAR.png",
  },
  left: {
    label: "Girar izquierda",
    color: "orange",
    asset: "tarjetas movimiento/IZQUIERDA.png",
  },
  right: {
    label: "Girar derecha",
    color: "orange",
    asset: "tarjetas movimiento/DERECHA.png",
  },
};

const NANO_ASSETS = {
  north: "nano assets/norte.png",
  east: "nano assets/este.png",
  south: "nano assets/sur.png",
  west: "nano assets/oeste.png",
};

const DIRECTIONS = ["north", "east", "south", "west"];
const DELTAS = {
  north: [-1, 0],
  east: [0, 1],
  south: [1, 0],
  west: [0, -1],
};

const SCRATCH_CHALLENGES = {
  7: {
    kicker: "Nivel 7 - Desafio 1",
    title: "Mision energia en la manta",
    objectiveTitle: "Lleva a Nano al cargador",
    objective:
      "Nano encontro un charco en la manta. Usa bloques de avance y giro para llegar a la estacion de carga sin salirse del camino.",
    concept: "Secuencia y giros",
    deliverable: "Programa de 7 bloques ejecutado en orden.",
    rows: 4,
    cols: 5,
    start: { row: 3, col: 0, dir: "east" },
    goal: { row: 1, col: 3 },
    hazards: [
      { row: 3, col: 2, type: "water" },
      { row: 2, col: 3, type: "water" },
    ],
    route: [
      [3, 0],
      [3, 1],
      [2, 1],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
    solution: ["forward", "left", "forward", "forward", "right", "forward", "forward"],
  },
  8: {
    kicker: "Nivel 8 - demo",
    title: "Central de energia",
    objectiveTitle: "Carga la bateria de Nano",
    objective:
      "Primer prototipo de mision con bloques. En este nivel despues sumaremos contadores de energia.",
    concept: "Variables y contador",
    deliverable: "Mision base lista para extender.",
  },
  9: {
    kicker: "Nivel 9 - demo",
    title: "Laboratorio de rutinas",
    objectiveTitle: "Crea una rutina segura",
    objective:
      "Primer prototipo de mision con bloques. En este nivel despues sumaremos bloques propios.",
    concept: "Bloques propios",
    deliverable: "Mision base lista para extender.",
  },
  10: {
    kicker: "Nivel 10 - demo",
    title: "Mision final",
    objectiveTitle: "Integra los sistemas de Nano",
    objective:
      "Primer prototipo de mision con bloques. En este nivel despues combinaremos variables, condiciones y rutinas.",
    concept: "Proyecto integrador",
    deliverable: "Mision base lista para extender.",
  },
};

const params = new URLSearchParams(window.location.search);
const requestedLevel = Number(params.get("nivel"));
const level = SCRATCH_CHALLENGES[requestedLevel] ? requestedLevel : 7;
const challenge = { ...SCRATCH_CHALLENGES[7], ...SCRATCH_CHALLENGES[level] };
let program = Array(challenge.solution.length).fill(null);
let running = false;

function setText(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function keyOf(row, col) {
  return `${row}-${col}`;
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function decoratePage() {
  document.title = `Be Tech | ${challenge.title}`;
  setText("[data-scratch-kicker]", challenge.kicker);
  setText("[data-scratch-title]", challenge.title);
  setText("[data-scratch-objective-title]", challenge.objectiveTitle);
  setText("[data-scratch-objective]", challenge.objective);
  setText("[data-scratch-concept]", challenge.concept);
  setText("[data-scratch-deliverable]", challenge.deliverable);

  document.querySelectorAll("[data-scratch-level-link]").forEach((link) => {
    link.classList.toggle("is-active", Number(link.dataset.scratchLevelLink) === level);
  });

  document.querySelector(".scratch-download")?.setAttribute("href", SCRATCH_STARTER_PROJECT);
}

function setMessage(text, tone = "") {
  const node = document.querySelector("[data-scratch-message]");
  if (!node) return;
  node.className = `scratch-run-message ${tone}`.trim();
  node.textContent = text;
}

function renderGrid(robotState = challenge.start, trail = []) {
  const grid = document.querySelector("[data-scratch-grid]");
  if (!grid) return;

  const hazards = new Map(challenge.hazards.map((item) => [keyOf(item.row, item.col), item]));
  const routeKeys = new Set(challenge.route.map(([row, col]) => keyOf(row, col)));
  const trailKeys = new Set(trail.map(([row, col]) => keyOf(row, col)));
  const goalKey = keyOf(challenge.goal.row, challenge.goal.col);
  const robotKey = keyOf(robotState.row, robotState.col);

  grid.style.setProperty("--scratch-rows", challenge.rows);
  grid.style.setProperty("--scratch-cols", challenge.cols);
  grid.innerHTML = "";

  for (let row = 0; row < challenge.rows; row += 1) {
    for (let col = 0; col < challenge.cols; col += 1) {
      const key = keyOf(row, col);
      const cell = document.createElement("div");
      cell.className = "scratch-cell";
      cell.dataset.key = key;
      if (routeKeys.has(key)) cell.classList.add("is-route");
      if (trailKeys.has(key)) cell.classList.add("is-trail");
      if (hazards.has(key)) {
        cell.classList.add("is-hazard");
        cell.innerHTML = `<img class="scratch-hazard" src="assets/charco.png" alt="Charco" />`;
      }
      if (key === goalKey) {
        cell.classList.add("is-goal");
        cell.innerHTML = `<img class="scratch-goal" src="nivel 5/CONSIGNA 7 - NIVEL 5/ESTACION DE CARGA USB.png" alt="Estacion de carga" />`;
      }
      if (key === robotKey) {
        cell.classList.add("is-nano");
        cell.innerHTML += `<img class="scratch-nano-sprite" src="${NANO_ASSETS[robotState.dir]}" alt="Nano" />`;
      }
      grid.appendChild(cell);
    }
  }
}

function renderBlockButton(blockId, index = null) {
  const block = SCRATCH_BLOCKS[blockId];
  const label = block?.label || "Bloque";
  const button = document.createElement("button");
  button.className = `scratch-block scratch-block-${block?.color || "blue"}`;
  button.type = "button";
  button.draggable = index === null;
  button.dataset.block = blockId;
  if (index !== null) button.dataset.index = String(index);
  button.innerHTML = `
    <img src="${block?.asset || ""}" alt="" aria-hidden="true" />
    <span>${label}</span>
  `;
  return button;
}

function renderPalette() {
  const palette = document.querySelector("[data-scratch-palette]");
  if (!palette) return;
  palette.innerHTML = "";

  Object.keys(SCRATCH_BLOCKS).forEach((blockId) => {
    const button = renderBlockButton(blockId);
    button.addEventListener("click", () => addBlock(blockId));
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", blockId);
      event.dataTransfer?.setData("application/x-betech-block", blockId);
    });
    palette.appendChild(button);
  });
}

function renderProgram() {
  const track = document.querySelector("[data-scratch-program]");
  if (!track) return;
  track.innerHTML = "";

  program.forEach((blockId, index) => {
    const slot = document.createElement("button");
    slot.className = "scratch-slot";
    slot.type = "button";
    slot.dataset.index = String(index);
    slot.setAttribute("aria-label", `Bloque ${index + 1}`);

    if (blockId) {
      const block = SCRATCH_BLOCKS[blockId];
      slot.classList.add("is-filled", "scratch-block", `scratch-block-${block.color}`);
      slot.innerHTML = `
        <img src="${block.asset}" alt="" aria-hidden="true" />
        <span>${block.label}</span>
      `;
    } else {
      slot.innerHTML = `<span>${index + 1}</span>`;
    }

    slot.addEventListener("click", () => {
      if (running) return;
      if (!program[index]) return;
      program[index] = null;
      renderProgram();
      setMessage("Bloque quitado. Puedes poner otro en ese espacio.");
    });

    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("is-drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drag-over"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("is-drag-over");
      const blockId = event.dataTransfer?.getData("application/x-betech-block") || event.dataTransfer?.getData("text/plain");
      if (blockId && SCRATCH_BLOCKS[blockId]) setBlock(index, blockId);
    });

    track.appendChild(slot);
  });
}

function addBlock(blockId) {
  if (running) return;
  const index = program.findIndex((item) => !item);
  if (index === -1) {
    setMessage("El programa ya esta completo. Toca un bloque para cambiarlo.", "is-soft");
    return;
  }
  setBlock(index, blockId);
}

function setBlock(index, blockId) {
  if (running) return;
  program[index] = blockId;
  renderProgram();
  setMessage(`Bloque ${SCRATCH_BLOCKS[blockId].label.toLowerCase()} agregado.`);
}

function resetMission(clearProgram = false) {
  if (clearProgram) {
    program = Array(challenge.solution.length).fill(null);
    renderProgram();
  }
  renderGrid(challenge.start, []);
  setMessage(clearProgram ? "Programa reiniciado. Arma una nueva secuencia." : "Nano volvio al inicio.");
}

function turn(currentDirection, command) {
  const index = DIRECTIONS.indexOf(currentDirection);
  if (command === "left") return DIRECTIONS[(index + 3) % DIRECTIONS.length];
  if (command === "right") return DIRECTIONS[(index + 1) % DIRECTIONS.length];
  return currentDirection;
}

function nextState(state, command) {
  if (command === "left" || command === "right") {
    return { ...state, dir: turn(state.dir, command) };
  }

  const [dr, dc] = DELTAS[state.dir];
  return { ...state, row: state.row + dr, col: state.col + dc };
}

function isBlocked(state) {
  const outside = state.row < 0 || state.col < 0 || state.row >= challenge.rows || state.col >= challenge.cols;
  const hazard = challenge.hazards.some((item) => item.row === state.row && item.col === state.col);
  return outside || hazard;
}

async function runProgram() {
  if (running) return;
  if (program.some((item) => !item)) {
    setMessage("Faltan bloques en el programa antes de ejecutar.", "is-error");
    return;
  }

  running = true;
  document.body.classList.add("is-running-scratch");
  let state = { ...challenge.start };
  const trail = [[state.row, state.col]];
  renderGrid(state, trail);
  setMessage("Ejecutando el programa de Nano...", "is-soft");

  for (const command of program) {
    await sleep(420);
    state = nextState(state, command);
    if (command === "forward") trail.push([state.row, state.col]);
    renderGrid(state, trail);

    if (isBlocked(state)) {
      setMessage("Nano encontro un problema. Revisa los giros antes del charco.", "is-error");
      running = false;
      document.body.classList.remove("is-running-scratch");
      return;
    }
  }

  const solved = state.row === challenge.goal.row && state.col === challenge.goal.col;
  setMessage(
    solved
      ? "Mision cumplida. Nano llego a la estacion de carga."
      : "El programa se ejecuto, pero Nano todavia no llego al cargador.",
    solved ? "is-success" : "is-error",
  );
  running = false;
  document.body.classList.remove("is-running-scratch");
}

function wireControls() {
  document.querySelector("[data-scratch-run]")?.addEventListener("click", runProgram);
  document.querySelector("[data-scratch-reset]")?.addEventListener("click", () => {
    if (running) return;
    resetMission(true);
  });
}

decoratePage();
renderPalette();
renderProgram();
renderGrid();
wireControls();
