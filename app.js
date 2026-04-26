const params = new URLSearchParams(window.location.search);
const requestedLevel = Number(params.get("nivel"));
const DEFAULT_LEVEL = 4;
let level = Number.isInteger(requestedLevel) ? requestedLevel : DEFAULT_LEVEL;

const challengeContent = document.querySelector("#challenge-content");
const challengeShell = document.querySelector(".challenge-shell");
const selectorWrap = document.querySelector(".selector-wrap");
const gameStageBg = document.querySelector(".game-stage-bg");
let selectorButtons = [...document.querySelectorAll(".selector-chip")];
let totalChallenges = level === 4 ? 5 : 1;
const completedChallenges = new Set();
let scenarioModal = null;
let availableLevels = [];
let levelDataByNumber = new Map();
let currentLevelData = null;

let challengeTitles = {
  1: "Camino del robot",
  2: "Depura el programa",
  3: "Programa al robot",
  4: "Patrones de algoritmo",
  5: "Mision mapa del robot",
};

const challengeTypeRenderers = {
  "secuenciacion-guiada": () => renderPathChallenge(),
  "depuracion-inicial": () => renderBalanceChallengeV2(),
  "programacion-por-bloques": () => renderRobotChallengeV2(),
  "patrones-de-comandos": () => renderPatternChallengeV2(),
  "mapa-en-grilla": () => renderCoordinatesChallenge(),
};

const levelBackgrounds = [
  "assets/learnia-games-bg.png",
  "assets/learnia-games-bg-2.png",
  "assets/learnia-games-bg-3.png",
];
const ROBOT_IMAGE_SRC = "articulos-622.jpeg";
const robotDirectionRotations = {
  0: 180,
  1: -90,
  2: 0,
  3: 90,
};

function renderRobotMarker(direction = 2) {
  const rotation = robotDirectionRotations[direction] ?? 0;
  return `<img class="robot-marker" src="${ROBOT_IMAGE_SRC}" alt="Robot" style="--robot-rotation: ${rotation}deg" />`;
}

function directionBetweenKeys(fromKey, toKey) {
  if (!fromKey || !toKey) return 2;
  const [fromRow, fromCol] = fromKey.split("-").map(Number);
  const [toRow, toCol] = toKey.split("-").map(Number);
  if (toRow < fromRow) return 0;
  if (toCol > fromCol) return 1;
  if (toRow > fromRow) return 2;
  if (toCol < fromCol) return 3;
  return 2;
}

function directionForRouteKey(route, key) {
  const index = route.indexOf(key);
  if (index === -1) return 2;
  if (route[index + 1]) return directionBetweenKeys(key, route[index + 1]);
  if (route[index - 1]) return directionBetweenKeys(route[index - 1], key);
  return 2;
}

async function loadLevelSection(levelNumber, section = 1) {
  const url = `contenido/nivel-${levelNumber}-seccion-${section}.json`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

async function discoverLevelsFromJson() {
  const discovered = [];
  const dataByLevel = new Map();
  const maxProbeLevel = 40;
  let missesAfterFirstMatch = 0;

  for (let probe = 1; probe <= maxProbeLevel; probe += 1) {
    const levelData = await loadLevelSection(probe, 1);
    if (levelData) {
      discovered.push(probe);
      dataByLevel.set(probe, levelData);
      missesAfterFirstMatch = 0;
      continue;
    }

    if (discovered.length) {
      missesAfterFirstMatch += 1;
      if (missesAfterFirstMatch >= 8) break;
    }
  }

  return { discovered, dataByLevel };
}

function getChallengesFromData(levelData) {
  return Array.isArray(levelData?.desafios) ? levelData.desafios : [];
}

function syncLevelHeading() {
  document.querySelectorAll("[data-current-level]").forEach((node) => {
    node.textContent = String(level);
  });
  document.title = `Be Tech | Nivel ${level}`;
}

function syncLevelBackground() {
  if (!gameStageBg || !levelBackgrounds.length) return;
  const backgroundIndex = Math.floor(Math.max(level - 1, 0) / 3) % levelBackgrounds.length;
  gameStageBg.src = levelBackgrounds[backgroundIndex];
}

function buildSelectorButtons() {
  if (!selectorWrap) return;

  const challenges = getChallengesFromData(currentLevelData);
  if (challenges.length <= 1) {
    selectorWrap.classList.add("is-hidden");
    selectorButtons = [];
    return;
  }

  selectorWrap.classList.remove("is-hidden");
  selectorWrap.innerHTML = challenges
    .map(
      (_, index) => `
        <button class="selector-chip ${index === 0 ? "is-active" : ""}" type="button" data-challenge="${index + 1}" aria-label="Desafio ${index + 1}">
          <strong>${index + 1}</strong>
        </button>
      `,
    )
    .join("");

  selectorButtons = [...selectorWrap.querySelectorAll(".selector-chip")];
}

function mapChallengeTitles(levelData) {
  const challenges = getChallengesFromData(levelData);
  if (!challenges.length) return;

  challengeTitles = Object.fromEntries(
    challenges.map((challenge, index) => [index + 1, challenge.titulo || `Desafio ${index + 1}`]),
  );
}

function closeScenarioModal() {
  if (!scenarioModal) return;
  scenarioModal.hidden = true;
  document.body.classList.remove("has-scenario-modal");
}

function goToScenario(id) {
  selectorButtons.forEach((chip) => chip.classList.remove("is-active"));
  document.querySelector(`[data-challenge="${id}"]`)?.classList.add("is-active");
  openChallenge(id);
}

function createScenarioModal() {
  const modal = document.createElement("div");
  modal.className = "scenario-modal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "scenario-modal-title");
  modal.innerHTML = `
    <div class="scenario-modal-backdrop" data-close-scenario-modal></div>
    <div class="scenario-modal-panel" tabindex="-1">
      <div data-scenario-modal-content></div>
    </div>
  `;

  modal.addEventListener("click", (event) => {
    const closeControl = event.target.closest("[data-close-scenario-modal]");
    if (closeControl) {
      closeScenarioModal();
      return;
    }

    const nextControl = event.target.closest("[data-next-scenario]");
    if (!nextControl) return;
    const nextScenario = Number(nextControl.dataset.nextScenario);
    closeScenarioModal();
    goToScenario(nextScenario);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeScenarioModal();
    }
  });

  document.body.append(modal);
  return modal;
}

function showScenarioCompleteModal(id) {
  if (!scenarioModal) scenarioModal = createScenarioModal();

  const nextScenario = id < totalChallenges ? id + 1 : null;
  const title = challengeTitles[id] || `Escenario ${id}`;
  const content = scenarioModal.querySelector("[data-scenario-modal-content]");
  content.innerHTML = `
    <p class="challenge-kicker">Escenario completado</p>
    <h2 id="scenario-modal-title">Buen trabajo</h2>
    <p>${nextScenario
      ? `Completaste el escenario ${id}: ${title}. Ya puedes pasar al siguiente escenario.`
      : `Completaste todos los escenarios de este grado.`}</p>
    <div class="scenario-modal-actions">
      ${nextScenario
        ? `<button class="primary-action" type="button" data-next-scenario="${nextScenario}">Pasar al siguiente escenario</button>`
        : `<a class="primary-action" href="index.html">Volver a grados</a>`}
      <button class="secondary-action" type="button" data-close-scenario-modal>Quedarme aqui</button>
    </div>
  `;

  scenarioModal.hidden = false;
  document.body.classList.add("has-scenario-modal");
  scenarioModal.querySelector(".scenario-modal-panel")?.focus();
}

function completeChallenge(id) {
  if (!totalChallenges || id > totalChallenges) return;

  completedChallenges.add(id);
  document.querySelector(`[data-challenge="${id}"]`)?.classList.add("is-complete");
  window.setTimeout(() => showScenarioCompleteModal(id), 450);
}

function wireSelectorButtons() {
  selectorButtons.forEach((button) => {
    const challengeId = Number(button.dataset.challenge);

    if (challengeId > totalChallenges) {
      button.classList.add("is-disabled");
      button.setAttribute("aria-disabled", "true");
    }

    button.addEventListener("click", () => {
      if (challengeId > totalChallenges) {
        showLocked(challengeId);
        return;
      }

      selectorButtons.forEach((chip) => chip.classList.remove("is-active"));
      button.classList.add("is-active");
      openChallenge(challengeId);
    });
  });
}

function openChallenge(id) {
  challengeShell?.classList.add("is-open");

  const challengeData = getChallengesFromData(currentLevelData)[id - 1];
  if (challengeData) {
    const renderer = challengeTypeRenderers[challengeData.tipo];
    if (renderer) {
      renderer();
      return;
    }
  }

  if (id === 1) renderPathChallenge();
  if (id === 2) renderBalanceChallengeV2();
  if (id === 3) renderRobotChallengeV2();
  if (id === 4) renderPatternChallengeV2();
  if (id === 5) renderCoordinatesChallenge();
}

function showLocked(id) {
  selectorButtons.forEach((chip) => chip.classList.remove("is-active"));
  document.querySelector(`[data-challenge="${id}"]`)?.classList.add("is-active");
  challengeShell?.classList.add("is-open");
  challengeContent.innerHTML = `
    <article class="challenge-card">
      <p class="challenge-kicker">Proximamente</p>
      <h2>Desafio ${id}</h2>
      <p>Este espacio queda reservado para las siguientes secciones.</p>
    </article>
  `;
}

function setMessage(text, tone = "") {
  const message = challengeContent.querySelector("[data-message]");
  if (!message) return;
  message.textContent = text;
  message.className = `challenge-message ${tone}`;
}

function renderHeader(id, instruction) {
  return `
    <header class="challenge-header">
      <p class="challenge-kicker">Desafio ${id}</p>
      <h2>${challengeTitles[id]}</h2>
      <p>${instruction}</p>
    </header>
  `;
}

function getChallengeInstruction(id, fallbackText) {
  const challenge = getChallengesFromData(currentLevelData)[id - 1];
  return challenge?.consigna || fallbackText;
}

const commandSymbols = {
  Avanzar: "⬆️",
  "Girar der.": "↪️",
  "Girar izq.": "↩️",
  Saltar: "↗️",
  Repetir: "🔁",
};

function renderCommand(command) {
  return `
    <span class="command-symbol" aria-hidden="true">${commandSymbols[command] || "?"}</span>
    <span class="command-label">${command}</span>
  `;
}

function renderCommandButton(command, className = "instruction-chip") {
  return `
    <button class="${className}" type="button" data-value="${command}" aria-label="${command}">
      ${renderCommand(command)}
    </button>
  `;
}

function renderSequenceStep(command) {
  return `<span class="sequence-slot command-card" aria-label="${command}">${renderCommand(command)}</span>`;
}

function renderSequenceBlank(index, selectedBlank, label = "Elegir accion") {
  return `
    <button class="sequence-slot command-card ${index === selectedBlank ? "is-selected" : ""}" type="button" data-blank="${index}" aria-label="${label}">
      <span class="command-placeholder">${index + 1}</span>
    </button>
  `;
}

function findFirstSequenceIssue(blanks, expected) {
  return blanks.find((blank) => blank.dataset.value !== expected[Number(blank.dataset.blank)]);
}

function countAdvancesBefore(commands, stepIndex) {
  return commands
    .slice(0, stepIndex)
    .filter((command) => command === "Avanzar")
    .length;
}

function renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact = false }) {
  return `
    <div class="sequence-panel command-workbench">
      <section class="command-section command-steps" aria-label="Pasos a hacer">
        <div class="command-section-title">
          <span>1</span>
          <strong>Pasos a hacer</strong>
        </div>
        <div class="sequence-track ${compact ? "compact-sequence" : ""}" data-track>
          ${stepsMarkup}
        </div>
      </section>
      <section class="command-section command-actions-bank" aria-label="Acciones">
        <div class="command-section-title">
          <span>2</span>
          <strong>Acciones</strong>
        </div>
        <div class="instruction-bank ${compact ? "compact-bank" : ""}">
          ${actionsMarkup}
        </div>
      </section>
    </div>
  `;
}

function renderPathChallenge() {
  const routePath = ["5-0", "4-0", "3-0", "3-1", "3-2", "2-2", "1-2", "1-3", "1-4"];
  const routeCells = new Set(["5-0", "4-0", "3-0", "3-1", "3-2", "2-2", "1-2", "1-3", "1-4"]);
  const steps = ["Avanzar", "Avanzar", null, "Avanzar", "Avanzar", null, "Avanzar", "Avanzar", null, "Avanzar", "Avanzar"];
  const expected = {
    2: "Girar der.",
    5: "Girar izq.",
    8: "Girar der.",
  };
  let selectedBlank = 2;
  let isAnimating = false;
  const stepsMarkup = steps.map((step, index) => step
    ? renderSequenceStep(step)
    : renderSequenceBlank(index, selectedBlank)).join("");
  const actionsMarkup = ["Girar der.", "Girar izq.", "Saltar", "Repetir"]
    .map((command) => renderCommandButton(command))
    .join("");

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(1, getChallengeInstruction(1, "Mira el camino celeste y completa los giros para que el robot vaya desde INICIO hasta META."))}
      <div class="path-layout">
        <div class="path-map" data-path-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Completa los pasos 3, 6 y 9 para seguir el camino celeste.</p>
    </article>
  `;

  const pathMap = challengeContent.querySelector("[data-path-map]");
  const checkButton = challengeContent.querySelector("[data-check]");
  const resetButton = challengeContent.querySelector("[data-reset]");
  const mapCells = new Map();

  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const key = `${row}-${col}`;
      const cell = document.createElement("div");
      cell.className = "path-map-cell";
      cell.dataset.key = key;
      if (routeCells.has(key)) cell.classList.add("is-route");
      if (key === "5-0") {
        cell.classList.add("is-start");
        cell.textContent = "IN";
      }
      if (key === "1-4") {
        cell.classList.add("is-goal");
        cell.textContent = "META";
      }
      cell.dataset.baseText = cell.textContent;
      mapCells.set(key, cell);
      pathMap.append(cell);
    }
  }

  function paintRobot(key) {
    mapCells.forEach((cell) => {
      cell.classList.remove("is-robot");
      cell.textContent = cell.dataset.baseText || "";
    });

    const robotCell = mapCells.get(key);
    if (!robotCell) return;
    robotCell.classList.add("is-robot");
    robotCell.innerHTML = renderRobotMarker(directionForRouteKey(routePath, key));
  }

  async function runRobotAnimation(routeLimit = routePath.length - 1) {
    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;

    for (const key of routePath.slice(0, routeLimit + 1)) {
      paintRobot(key);
      await new Promise((resolve) => setTimeout(resolve, 260));
    }

    isAnimating = false;
    checkButton.disabled = false;
    resetButton.disabled = false;
  }

  paintRobot(routePath[0]);

  const blanks = [...challengeContent.querySelectorAll("[data-blank]")];

  blanks.forEach((blank) => {
    blank.addEventListener("click", () => {
      blanks.forEach((item) => item.classList.remove("is-selected"));
      blank.classList.add("is-selected");
      selectedBlank = Number(blank.dataset.blank);
    });
  });

  challengeContent.querySelectorAll(".instruction-chip").forEach((button) => {
    button.addEventListener("click", () => {
      if (isAnimating) return;
      const target = blanks.find((blank) => Number(blank.dataset.blank) === selectedBlank);
      if (!target) return;
      const command = button.dataset.value;
      target.innerHTML = renderCommand(command);
      target.dataset.value = command;
      target.classList.remove("is-wrong");
      const next = blanks.find((blank) => !blank.dataset.value);
      blanks.forEach((item) => item.classList.remove("is-selected"));
      if (next) {
        next.classList.add("is-selected");
        selectedBlank = Number(next.dataset.blank);
      }
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    if (isAnimating) return;

    blanks.forEach((blank) => blank.classList.remove("is-wrong"));
    const issue = findFirstSequenceIssue(blanks, expected);
    if (!issue) {
      setMessage("Muy bien. Mira como el robot recorre el camino.", "is-good");
      runRobotAnimation().then(() => {
        setMessage("Excelente. El robot sigue el camino y llega a la meta.", "is-success");
        completeChallenge(1);
      });
      return;
    }

    const stepIndex = Number(issue.dataset.blank);
    const stepNumber = stepIndex + 1;
    const routeLimit = countAdvancesBefore(steps, stepIndex);
    issue.classList.add("is-wrong", "is-selected");
    blanks.forEach((blank) => {
      if (blank !== issue) blank.classList.remove("is-selected");
    });
    selectedBlank = stepIndex;
    setMessage(issue.dataset.value
      ? `Hasta ahi va bien. Ajusta el paso ${stepNumber}: ese giro no coincide con el camino.`
      : `Buen progreso. El robot llega hasta ahi; completa el paso ${stepNumber} para seguir.`,
    issue.dataset.value ? "is-error" : "is-good");
    runRobotAnimation(routeLimit);
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    if (isAnimating) return;
    blanks.forEach((blank, index) => {
      blank.innerHTML = `<span class="command-placeholder">${Number(blank.dataset.blank) + 1}</span>`;
      delete blank.dataset.value;
      blank.classList.remove("is-wrong");
      blank.classList.toggle("is-selected", index === 0);
    });
    paintRobot(routePath[0]);
    selectedBlank = Number(blanks[0].dataset.blank);
    setMessage("Completa los pasos 3, 6 y 9 para seguir el camino celeste.");
  });
}

function renderBalanceChallenge() {
  const originalProgram = ["Girar izq.", "Avanzar", "Avanzar"];
  const fixedStep = 0;
  const expectedFix = "Girar der.";
  const start = { row: 5, col: 0, dir: 0 };
  const goal = { row: 5, col: 2 };
  const obstacle = new Set(["4-0"]);
  let program = [...originalProgram];
  let selectedLine = fixedStep;

  challengeContent.innerHTML = `
    <article class="challenge-card challenge-card-debug">
      ${renderHeader(2, getChallengeInstruction(2, "Corrige el programa para que el robot salga de IN y llegue a META."))}
      <section class="debug-reference" aria-label="Referencia visual">
        <h3>Mapa de referencia</h3>
        <div class="debug-legend">
          <span><i class="legend-dot legend-start"></i> Inicio</span>
          <span><i class="legend-dot legend-goal"></i> Meta</span>
          <span><i class="legend-dot legend-obstacle"></i> Bloque</span>
          <span><i class="legend-dot legend-trail"></i> Recorrido</span>
        </div>
      </section>
      <p class="challenge-note">Objetivo: solo la linea 1 esta editable. Las otras dos ya estan bien.</p>
      <div class="debug-layout">
        <div class="debug-map" data-debug-map></div>
        <div class="debug-program">
          <p class="debug-program-title">Programa del robot</p>
          <div class="debug-list" data-debug-list></div>
          <div class="debug-options">
            <button type="button" data-value="Avanzar">${renderCommand("Avanzar")}</button>
            <button type="button" data-value="Girar der.">${renderCommand("Girar der.")}</button>
            <button type="button" data-value="Girar izq.">${renderCommand("Girar izq.")}</button>
          </div>
        </div>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Pista: la linea 1 debe girar hacia META, no hacia afuera.</p>
    </article>
  `;

  const debugList = challengeContent.querySelector("[data-debug-list]");
  const debugMap = challengeContent.querySelector("[data-debug-map]");

  function keyOf(row, col) {
    return `${row}-${col}`;
  }

  function simulateProgram() {
    const robot = { ...start };
    const trail = [keyOf(robot.row, robot.col)];

    for (let i = 0; i < program.length; i += 1) {
      const command = program[i];
      if (command === "Girar izq.") robot.dir = (robot.dir + 3) % 4;
      if (command === "Girar der.") robot.dir = (robot.dir + 1) % 4;

      if (command === "Avanzar") {
        const next = { row: robot.row, col: robot.col, dir: robot.dir };
        if (robot.dir === 0) next.row -= 1;
        if (robot.dir === 1) next.col += 1;
        if (robot.dir === 2) next.row += 1;
        if (robot.dir === 3) next.col -= 1;

        if (next.row < 0 || next.row > 5 || next.col < 0 || next.col > 5) {
          return { ok: false, failedStep: i + 1, reason: "out", trail, robot };
        }

        if (obstacle.has(keyOf(next.row, next.col))) {
          trail.push(keyOf(next.row, next.col));
          return { ok: false, failedStep: i + 1, reason: "obstacle", trail, robot: next };
        }

        robot.row = next.row;
        robot.col = next.col;
        trail.push(keyOf(robot.row, robot.col));
      }
    }

    const reachedGoal = robot.row === goal.row && robot.col === goal.col;
    return { ok: reachedGoal, failedStep: null, reason: reachedGoal ? "goal" : "wrong-end", trail, robot };
  }

  function renderMap(result, showTrail = true, showRobot = true) {
    debugMap.innerHTML = "";
    const trailSet = new Set(showTrail ? result.trail : []);
    const robotKey = showRobot ? keyOf(result.robot.row, result.robot.col) : null;
    const trailIndex = new Map();
    result.trail.forEach((key, index) => {
      if (!trailIndex.has(key)) trailIndex.set(key, index);
    });

    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const key = keyOf(row, col);
        const cell = document.createElement("div");
        cell.className = "debug-map-cell";

        if (trailSet.has(key)) cell.classList.add("is-trail");
        if (obstacle.has(key)) {
          cell.classList.add("is-obstacle");
          cell.textContent = "X";
        }
        if (row === start.row && col === start.col) {
          cell.classList.add("is-start");
          cell.textContent = "IN";
        }
        if (row === goal.row && col === goal.col) {
          cell.classList.add("is-goal");
          cell.textContent = "META";
        }
        if (key === robotKey) {
          cell.classList.add("is-robot");
          cell.innerHTML = renderRobotMarker(result.robot.dir);
        } else if (trailSet.has(key) && !obstacle.has(key) && !(row === start.row && col === start.col) && !(row === goal.row && col === goal.col)) {
          cell.textContent = String(trailIndex.get(key));
        }

        debugMap.append(cell);
      }
    }
  }

  function renderProgram() {
    debugList.innerHTML = program.map((step, index) => `
      <button class="debug-line ${index === selectedLine ? "is-selected" : ""} ${index === fixedStep ? "is-editable" : "is-locked"}" type="button" data-line="${index}">
        <strong>${index + 1}.</strong> ${renderCommand(step)}
        <small>${index === fixedStep ? "Editar" : "Bloqueada"}</small>
      </button>
    `).join("");

    debugList.querySelectorAll("[data-line]").forEach((button) => {
      button.addEventListener("click", () => {
        const line = Number(button.dataset.line);
        if (line !== fixedStep) {
          setMessage("Esa linea ya esta bien. Cambia solo la linea 1.", "is-good");
          return;
        }
        selectedLine = line;
        renderProgram();
      });
    });
  }

  challengeContent.querySelectorAll(".debug-options button").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.dataset.value;
      program[selectedLine] = command;
      renderProgram();
      renderMap(simulateProgram(), true, true);
      setMessage(command === expectedFix
        ? "Bien: ahora prueba el programa completo."
        : "Prueba el programa y mira donde termina el robot.",
      command === expectedFix ? "is-good" : "");
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    const result = simulateProgram();
    renderMap(result, true, true);

    if (result.ok && program[fixedStep] === expectedFix) {
      setMessage("Muy bien. El robot evita el bloque rojo y termina en META.", "is-success");
      completeChallenge(2);
      return;
    }

    if (result.reason === "obstacle") {
      setMessage(`En el paso ${result.failedStep} toca el bloque rojo. Corrige la linea 1.`, "is-error");
      return;
    }

    if (result.reason === "out") {
      setMessage(`En el paso ${result.failedStep} el robot se sale del tablero.`, "is-error");
      return;
    }

    setMessage("No llega a META. Corrige la linea 1 para que gire hacia la derecha.", "is-error");
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    program = [...originalProgram];
    selectedLine = fixedStep;
    renderProgram();
    renderMap({ trail: [keyOf(start.row, start.col)], robot: { ...start } }, true, true);
    setMessage("Pista: la linea 1 debe girar hacia META, no hacia afuera.");
  });

  renderProgram();
  renderMap({ trail: [keyOf(start.row, start.col)], robot: { ...start } }, true, true);
}

function renderRobotChallenge() {
  const start = { row: 5, col: 0, dir: 1 };
  const treasure = { row: 1, col: 4 };
  const obstacles = new Set(["4-2", "3-2", "2-2", "2-3"]);
  const solution = ["F", "F", "F", "F", "L", "F", "F", "F", "F"];
  let program = [];
  let robot = { ...start };
  let visitedCells = [];
  let isRunning = false;
  const commandLabels = {
    F: "Avanzar",
    L: "Girar izq.",
    R: "Girar der.",
  };

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(3, getChallengeInstruction(3, "Programa al robot para llegar a la estrella sin chocar con los bloques."))}
      <p class="challenge-note">Objetivo: arma hasta 10 instrucciones. El robot deja marcado el recorrido mientras ejecuta.</p>
      <div class="robot-layout">
        <div class="robot-grid"></div>
        <div class="program-panel">
          <div class="program-meta">
            <strong data-program-count>0/10</strong>
            <button class="secondary-action" type="button" data-hint>Pista</button>
          </div>
          <div class="command-bank">
            <button type="button" data-command="F">${renderCommand("Avanzar")}</button>
            <button type="button" data-command="L">${renderCommand("Girar izq.")}</button>
            <button type="button" data-command="R">${renderCommand("Girar der.")}</button>
          </div>
          <div class="program-list" data-program></div>
          <div class="challenge-actions">
            <button class="primary-action" type="button" data-run>Ejecutar</button>
            <button class="secondary-action" type="button" data-undo>Quitar ultimo</button>
            <button class="secondary-action" type="button" data-clear>Limpiar</button>
          </div>
          <p class="challenge-message" data-message>Camino: avanza por abajo hasta quedar debajo de la estrella, gira a la izquierda y sube.</p>
        </div>
      </div>
    </article>
  `;

  const grid = challengeContent.querySelector(".robot-grid");
  const programNode = challengeContent.querySelector("[data-program]");
  const countNode = challengeContent.querySelector("[data-program-count]");
  const runButton = challengeContent.querySelector("[data-run]");
  const clearButton = challengeContent.querySelector("[data-clear]");
  const undoButton = challengeContent.querySelector("[data-undo]");
  const hintButton = challengeContent.querySelector("[data-hint]");
  const commandButtons = [...challengeContent.querySelectorAll("[data-command]")];

  function cellKey(row, col) {
    return `${row}-${col}`;
  }

  function renderGrid() {
    grid.innerHTML = "";
    const trailSet = new Set(visitedCells);
    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const key = cellKey(row, col);
        const cell = document.createElement("div");
        cell.className = "robot-cell";
        if (trailSet.has(key)) {
          cell.classList.add("is-trail");
          cell.textContent = ".";
        }
        if (obstacles.has(key)) {
          cell.classList.add("is-obstacle");
          cell.textContent = "X";
        }
        if (row === treasure.row && col === treasure.col) {
          cell.classList.add("is-treasure");
          cell.textContent = "*";
        }
        if (row === start.row && col === start.col) cell.classList.add("is-start");
        if (row === robot.row && col === robot.col) {
          cell.classList.add("is-robot");
          cell.innerHTML = renderRobotMarker(robot.dir);
        }
        grid.append(cell);
      }
    }
  }

  function renderProgram() {
    programNode.innerHTML = program.length
      ? program.map((cmd, index) => `<span>${index + 1}. ${renderCommand(commandLabels[cmd])}</span>`).join("")
      : "<em>Sin instrucciones</em>";
    countNode.textContent = `${program.length}/10`;
  }

  function setRunningState(running) {
    isRunning = running;
    runButton.disabled = running;
    clearButton.disabled = running;
    undoButton.disabled = running;
    hintButton.disabled = running;
    commandButtons.forEach((button) => {
      button.disabled = running;
    });
  }

  function isSolutionPrefix() {
    return program.every((command, index) => command === solution[index]);
  }

  function step(command) {
    if (command === "L") robot.dir = (robot.dir + 3) % 4;
    if (command === "R") robot.dir = (robot.dir + 1) % 4;
    if (command === "F") {
      const next = { row: robot.row, col: robot.col, dir: robot.dir };
      if (robot.dir === 0) next.row -= 1;
      if (robot.dir === 1) next.col += 1;
      if (robot.dir === 2) next.row += 1;
      if (robot.dir === 3) next.col -= 1;

      if (next.row < 0 || next.row > 5 || next.col < 0 || next.col > 5 || obstacles.has(cellKey(next.row, next.col))) {
        return false;
      }
      robot = next;
      visitedCells.push(cellKey(robot.row, robot.col));
    }
    return true;
  }

  challengeContent.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      if (isRunning) return;
      if (program.length >= 10) {
        setMessage("Llegaste al maximo de 10 instrucciones. Ejecuta o limpia el programa.", "is-error");
        return;
      }
      program.push(button.dataset.command);
      robot = { ...start };
      visitedCells = [];
      renderGrid();
      renderProgram();
    });
  });

  undoButton.addEventListener("click", () => {
    if (isRunning) return;
    if (!program.length) return;
    program.pop();
    visitedCells = [];
    robot = { ...start };
    renderGrid();
    renderProgram();
  });

  clearButton.addEventListener("click", () => {
    if (isRunning) return;
    program = [];
    robot = { ...start };
    visitedCells = [];
    renderGrid();
    renderProgram();
    setMessage("Programa limpio. Vuelve a intentarlo.");
  });

  hintButton.addEventListener("click", () => {
    if (isRunning) return;
    if (!isSolutionPrefix()) {
      setMessage("Hay una instruccion que se desvia del camino sugerido. Quita la ultima o limpia el programa.", "is-error");
      return;
    }
    if (program.length >= solution.length) {
      setMessage("Ya tienes el camino sugerido completo. Ejecutalo.", "is-good");
      return;
    }
    program.push(solution[program.length]);
    robot = { ...start };
    visitedCells = [];
    renderGrid();
    renderProgram();
    setMessage(`Agregue una pista: ${commandLabels[program[program.length - 1]]}.`, "is-good");
  });

  runButton.addEventListener("click", async () => {
    if (isRunning) return;
    if (!program.length) {
      setMessage("Primero agrega instrucciones antes de ejecutar.", "is-error");
      return;
    }

    setRunningState(true);
    robot = { ...start };
    visitedCells = [cellKey(robot.row, robot.col)];
    renderGrid();

    for (let i = 0; i < program.length; i += 1) {
      const command = program[i];
      await new Promise((resolve) => setTimeout(resolve, 240));
      const ok = step(command);
      if (!ok) {
        renderGrid();
        setRunningState(false);
        setMessage(`El robot choco en el paso ${i + 1}. Revisa ese bloque del programa.`, "is-error");
        return;
      }
      renderGrid();
    }

    setRunningState(false);
    if (robot.row === treasure.row && robot.col === treasure.col) {
      setMessage("Tesoro encontrado. Tu algoritmo funciona.", "is-success");
      completeChallenge(3);
    } else {
      setMessage("El robot ejecuto el programa, pero no llego al tesoro.", "is-good");
    }
  });

  renderGrid();
  renderProgram();
}

function renderPatternChallenge() {
  const answers = ["Avanzar", "Avanzar", "Girar der."];
  let selectedBlank = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(4, getChallengeInstruction(4, "Completa el patron de instrucciones que se repite."))}
      <p class="challenge-note">El bloque se repite de a tres: Avanzar, Avanzar, Girar der.</p>
      <div class="pattern-row">
        <span data-group="1">Avanzar</span><span data-group="1">Avanzar</span><span data-group="1">Girar der.</span>
        <span data-group="2">Avanzar</span>
        <button type="button" class="pattern-blank is-selected" data-blank="0">?</button>
        <span data-group="2">Girar der.</span>
        <button type="button" class="pattern-blank" data-blank="1">?</button>
        <span data-group="3">Avanzar</span>
        <button type="button" class="pattern-blank" data-blank="2">?</button>
      </div>
      <div class="option-bank">
        <button type="button">Avanzar</button>
        <button type="button">Girar der.</button>
        <button type="button">Girar izq.</button>
        <button type="button">Saltar</button>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Pista: se repite el bloque Avanzar, Avanzar, Girar der.</p>
    </article>
  `;

  const blanks = [...challengeContent.querySelectorAll(".pattern-blank")];

  blanks.forEach((blank) => {
    blank.addEventListener("click", () => {
      blanks.forEach((item) => item.classList.remove("is-selected"));
      blank.classList.add("is-selected");
      selectedBlank = Number(blank.dataset.blank);
    });
  });

  challengeContent.querySelectorAll(".option-bank button").forEach((button) => {
    button.addEventListener("click", () => {
      blanks[selectedBlank].textContent = button.textContent;
      blanks[selectedBlank].dataset.value = button.textContent;
      blanks[selectedBlank].classList.remove("is-wrong", "is-correct");
      const next = blanks.find((blank) => !blank.dataset.value);
      blanks.forEach((item) => item.classList.remove("is-selected"));
      if (next) {
        next.classList.add("is-selected");
        selectedBlank = Number(next.dataset.blank);
      } else {
        blanks[selectedBlank].classList.add("is-selected");
      }
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    if (blanks.some((blank) => !blank.dataset.value)) {
      setMessage("Completa los tres huecos antes de comprobar.", "is-error");
      return;
    }

    const values = blanks.map((blank) => blank.dataset.value);
    if (values.every((value, index) => value === answers[index])) {
      blanks.forEach((blank) => {
        blank.classList.remove("is-wrong");
        blank.classList.add("is-correct");
      });
      setMessage("Perfecto. Reconociste el patron del algoritmo.", "is-success");
      completeChallenge(4);
    } else {
      const firstWrongIndex = values.findIndex((value, index) => value !== answers[index]);
      blanks.forEach((blank, index) => {
        blank.classList.toggle("is-wrong", values[index] !== answers[index]);
        blank.classList.toggle("is-selected", index === firstWrongIndex);
      });
      selectedBlank = firstWrongIndex;
      setMessage(`Revisa el hueco ${firstWrongIndex + 1}. El patron vuelve siempre al mismo bloque de tres.`, "is-error");
    }
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    blanks.forEach((blank, index) => {
      blank.textContent = "?";
      delete blank.dataset.value;
      blank.classList.toggle("is-selected", index === 0);
      blank.classList.remove("is-correct", "is-wrong");
    });
    selectedBlank = 0;
    setMessage("Pista: se repite el bloque Avanzar, Avanzar, Girar der.");
  });
}

function renderBalanceChallengeV2() {
  const route = ["5-0", "5-1", "5-2", "4-2", "3-2", "3-3", "3-4"];
  const routeCells = new Set(route);
  const obstacles = new Set(["4-1", "4-3", "2-1", "2-4"]);
  const steps = ["Avanzar", "Avanzar", null, "Avanzar", "Avanzar", null, "Avanzar", "Avanzar"];
  const expected = {
    2: "Girar izq.",
    5: "Girar der.",
  };
  let selectedBlank = 2;
  let isAnimating = false;
  const stepsMarkup = steps.map((step, index) => step
    ? renderSequenceStep(step)
    : renderSequenceBlank(index, selectedBlank, "Elegir giro")).join("");
  const actionsMarkup = ["Girar izq.", "Girar der.", "Avanzar"]
    .map((command) => renderCommandButton(command))
    .join("");

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(2, getChallengeInstruction(2, "Completa los giros para esquivar los bloques rojos y llegar a META."))}
      <div class="visual-sequence-layout">
        <div class="path-map visual-map" data-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Observa el camino celeste: faltan dos giros para rodear los bloques.</p>
    </article>
  `;

  const map = challengeContent.querySelector("[data-map]");
  const checkButton = challengeContent.querySelector("[data-check]");
  const resetButton = challengeContent.querySelector("[data-reset]");
  const cells = new Map();
  const blanks = [...challengeContent.querySelectorAll("[data-blank]")];

  function keyOf(row, col) {
    return `${row}-${col}`;
  }

  function buildMap() {
    map.innerHTML = "";
    cells.clear();

    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const key = keyOf(row, col);
        const cell = document.createElement("div");
        cell.className = "path-map-cell";
        if (routeCells.has(key)) cell.classList.add("is-route");
        if (obstacles.has(key)) {
          cell.classList.add("is-obstacle");
          cell.textContent = "X";
        }
        if (key === route[0]) {
          cell.classList.add("is-start");
          cell.textContent = "IN";
        }
        if (key === route[route.length - 1]) {
          cell.classList.add("is-goal");
          cell.textContent = "META";
        }
        cell.dataset.baseText = cell.textContent;
        cells.set(key, cell);
        map.append(cell);
      }
    }
  }

  function paintRobot(key) {
    cells.forEach((cell) => {
      cell.classList.remove("is-robot", "is-trail");
      cell.textContent = cell.dataset.baseText || "";
    });

    for (const routeKey of route.slice(0, route.indexOf(key) + 1)) {
      cells.get(routeKey)?.classList.add("is-trail");
    }

    const robotCell = cells.get(key);
    if (!robotCell) return;
    robotCell.classList.add("is-robot");
    robotCell.innerHTML = renderRobotMarker(directionForRouteKey(route, key));
  }

  async function animateRoute(routeLimit = route.length - 1) {
    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;

    for (const key of route.slice(0, routeLimit + 1)) {
      paintRobot(key);
      await new Promise((resolve) => setTimeout(resolve, 230));
    }

    isAnimating = false;
    checkButton.disabled = false;
    resetButton.disabled = false;
  }

  blanks.forEach((blank) => {
    blank.addEventListener("click", () => {
      if (isAnimating) return;
      blanks.forEach((item) => item.classList.remove("is-selected"));
      blank.classList.add("is-selected");
      selectedBlank = Number(blank.dataset.blank);
    });
  });

  challengeContent.querySelectorAll(".instruction-chip").forEach((button) => {
    button.addEventListener("click", () => {
      if (isAnimating) return;
      const target = blanks.find((blank) => Number(blank.dataset.blank) === selectedBlank);
      if (!target) return;
      const command = button.dataset.value;
      target.innerHTML = renderCommand(command);
      target.dataset.value = command;
      target.classList.remove("is-wrong");
      const next = blanks.find((blank) => !blank.dataset.value);
      blanks.forEach((item) => item.classList.remove("is-selected"));
      if (next) {
        next.classList.add("is-selected");
        selectedBlank = Number(next.dataset.blank);
      } else {
        target.classList.add("is-selected");
      }
    });
  });

  checkButton.addEventListener("click", () => {
    if (isAnimating) return;

    blanks.forEach((blank) => blank.classList.remove("is-wrong"));
    const issue = findFirstSequenceIssue(blanks, expected);
    if (issue) {
      const stepIndex = Number(issue.dataset.blank);
      const routeLimit = countAdvancesBefore(steps, stepIndex);
      issue.classList.add("is-wrong", "is-selected");
      blanks.forEach((blank) => {
        if (blank !== issue) blank.classList.remove("is-selected");
      });
      selectedBlank = stepIndex;
      setMessage(issue.dataset.value
        ? "Hasta ahi va bien. Ese giro no sigue el camino celeste."
        : `Buen progreso. El robot llega hasta ahi; completa el paso ${stepIndex + 1} para seguir.`,
      issue.dataset.value ? "is-error" : "is-good");
      animateRoute(routeLimit);
      return;
    }

    setMessage("Muy bien. Ahora mira al robot recorrer la ruta.", "is-good");
    animateRoute().then(() => {
      setMessage("Ruta corregida. El robot llego a META.", "is-success");
      completeChallenge(2);
    });
  });

  resetButton.addEventListener("click", () => {
    if (isAnimating) return;
    blanks.forEach((blank, index) => {
      blank.innerHTML = `<span class="command-placeholder">${Number(blank.dataset.blank) + 1}</span>`;
      delete blank.dataset.value;
      blank.classList.remove("is-wrong");
      blank.classList.toggle("is-selected", index === 0);
    });
    selectedBlank = Number(blanks[0].dataset.blank);
    buildMap();
    paintRobot(route[0]);
    setMessage("Observa el camino celeste: faltan dos giros para rodear los bloques.");
  });

  buildMap();
  paintRobot(route[0]);
}

function renderRobotChallengeV2() {
  const route = ["5-0", "5-1", "5-2", "5-3", "4-3", "3-3", "3-4", "3-5"];
  const routeCells = new Set(route);
  const batteries = new Set(["5-2", "3-3"]);
  const obstacles = new Set(["4-1", "4-2", "2-4", "4-5"]);
  const expected = {
    0: "Avanzar",
    1: "Avanzar",
    2: "Avanzar",
    3: "Girar izq.",
    4: "Avanzar",
    5: "Avanzar",
    6: "Girar der.",
    7: "Avanzar",
    8: "Avanzar",
  };
  const expectedCommands = Array.from({ length: 9 }, (_, index) => expected[index]);
  let selectedBlank = 0;
  let isAnimating = false;
  const stepsMarkup = Array.from({ length: 9 }, (_, index) => renderSequenceBlank(index, selectedBlank)).join("");
  const actionsMarkup = ["Avanzar", "Girar izq.", "Girar der."]
    .map((command) => renderCommandButton(command))
    .join("");

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(3, getChallengeInstruction(3, "Arma la secuencia para juntar las baterias y llegar a META."))}
      <div class="visual-sequence-layout">
        <div class="robot-grid visual-map" data-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Ejecutar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Sigue la ruta celeste: pasa por B1, despues por B2 y termina en META.</p>
    </article>
  `;

  const map = challengeContent.querySelector("[data-map]");
  const checkButton = challengeContent.querySelector("[data-check]");
  const resetButton = challengeContent.querySelector("[data-reset]");
  const blanks = [...challengeContent.querySelectorAll("[data-blank]")];
  const cells = new Map();

  function cellKey(row, col) {
    return `${row}-${col}`;
  }

  function renderGrid() {
    map.innerHTML = "";
    cells.clear();

    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const key = cellKey(row, col);
        const cell = document.createElement("div");
        cell.className = "robot-cell";
        if (routeCells.has(key)) cell.classList.add("is-route");
        if (obstacles.has(key)) {
          cell.classList.add("is-obstacle");
          cell.textContent = "X";
        }
        if (batteries.has(key)) {
          cell.classList.add("is-treasure");
          cell.textContent = key === "5-2" ? "B1" : "B2";
        }
        if (key === route[0]) {
          cell.classList.add("is-start");
          cell.textContent = "IN";
        }
        if (key === route[route.length - 1]) {
          cell.classList.add("is-goal");
          cell.textContent = "META";
        }
        cell.dataset.baseText = cell.textContent;
        cells.set(key, cell);
        map.append(cell);
      }
    }
  }

  function paintRobot(key) {
    cells.forEach((cell) => {
      cell.classList.remove("is-robot", "is-trail");
      cell.textContent = cell.dataset.baseText || "";
    });

    for (const routeKey of route.slice(0, route.indexOf(key) + 1)) {
      cells.get(routeKey)?.classList.add("is-trail");
    }

    const robotCell = cells.get(key);
    if (!robotCell) return;
    robotCell.classList.add("is-robot");
    robotCell.innerHTML = renderRobotMarker(directionForRouteKey(route, key));
  }

  async function animateRoute(routeLimit = route.length - 1) {
    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;

    for (const key of route.slice(0, routeLimit + 1)) {
      paintRobot(key);
      await new Promise((resolve) => setTimeout(resolve, 210));
    }

    isAnimating = false;
    checkButton.disabled = false;
    resetButton.disabled = false;
  }

  blanks.forEach((blank) => {
    blank.addEventListener("click", () => {
      if (isAnimating) return;
      blanks.forEach((item) => item.classList.remove("is-selected"));
      blank.classList.add("is-selected");
      selectedBlank = Number(blank.dataset.blank);
    });
  });

  challengeContent.querySelectorAll(".instruction-chip").forEach((button) => {
    button.addEventListener("click", () => {
      if (isAnimating) return;
      const target = blanks[selectedBlank];
      const command = button.dataset.value;
      target.innerHTML = renderCommand(command);
      target.dataset.value = command;
      target.classList.remove("is-wrong");
      const next = blanks.find((blank) => !blank.dataset.value);
      blanks.forEach((item) => item.classList.remove("is-selected"));
      if (next) {
        next.classList.add("is-selected");
        selectedBlank = Number(next.dataset.blank);
      } else {
        target.classList.add("is-selected");
      }
    });
  });

  checkButton.addEventListener("click", () => {
    if (isAnimating) return;

    blanks.forEach((blank) => blank.classList.remove("is-wrong"));
    const issue = findFirstSequenceIssue(blanks, expected);
    if (issue) {
      const stepIndex = Number(issue.dataset.blank);
      const routeLimit = countAdvancesBefore(expectedCommands, stepIndex);
      issue.classList.add("is-wrong", "is-selected");
      blanks.forEach((blank) => {
        if (blank !== issue) blank.classList.remove("is-selected");
      });
      selectedBlank = stepIndex;
      setMessage(issue.dataset.value
        ? "Hasta ahi va bien. La secuencia se desvia en la tarjeta marcada."
        : `Buen progreso. El robot llega hasta ahi; completa el paso ${stepIndex + 1} para seguir.`,
      issue.dataset.value ? "is-error" : "is-good");
      animateRoute(routeLimit);
      return;
    }

    setMessage("Secuencia lista. El robot va por las baterias.", "is-good");
    animateRoute().then(() => {
      setMessage("Baterias cargadas y META alcanzada.", "is-success");
      completeChallenge(3);
    });
  });

  resetButton.addEventListener("click", () => {
    if (isAnimating) return;
    blanks.forEach((blank, index) => {
      blank.innerHTML = `<span class="command-placeholder">${index + 1}</span>`;
      delete blank.dataset.value;
      blank.classList.remove("is-wrong");
      blank.classList.toggle("is-selected", index === 0);
    });
    selectedBlank = 0;
    renderGrid();
    paintRobot(route[0]);
    setMessage("Sigue la ruta celeste: pasa por B1, despues por B2 y termina en META.");
  });

  renderGrid();
  paintRobot(route[0]);
}

function renderPatternChallengeV2() {
  const scenes = [
    {
      title: "Camino de baldosas",
      theme: "tiles",
      hint: "Completa el piso: azul, azul, amarilla.",
      pattern: ["tile-blue", "tile-blue", "tile-yellow"],
      sequence: ["tile-blue", "tile-blue", null, "tile-blue", null, "tile-yellow", "tile-blue", "tile-blue", null],
      answers: ["tile-yellow", "tile-blue", "tile-yellow"],
      options: ["tile-blue", "tile-yellow", "tile-pink"],
    },
    {
      title: "Fabrica de cajas",
      theme: "factory",
      hint: "La cinta repite dos cajas chicas y una grande.",
      pattern: ["box-small", "box-small", "box-large"],
      sequence: ["box-small", null, "box-large", "box-small", "box-small", null, null, "box-small", "box-large"],
      answers: ["box-small", "box-large", "box-small"],
      options: ["box-small", "box-large", "box-tall"],
    },
    {
      title: "Luces del semaforo",
      theme: "lights",
      hint: "El semaforo repite verde, verde, rojo.",
      pattern: ["light-green", "light-green", "light-red"],
      sequence: ["light-green", "light-green", null, "light-green", null, "light-red", null, "light-green", "light-red"],
      answers: ["light-red", "light-green", "light-green"],
      options: ["light-green", "light-red", "light-yellow"],
    },
    {
      title: "Robot pintor",
      theme: "paint",
      hint: "El robot pinta, pinta y gira.",
      pattern: ["paint-dot", "paint-dot", "turn-right"],
      sequence: ["paint-dot", null, "turn-right", "paint-dot", "paint-dot", null, null, "paint-dot", "turn-right"],
      answers: ["paint-dot", "turn-right", "paint-dot"],
      options: ["paint-dot", "turn-right", "turn-left"],
    },
    {
      title: "Tren de vagones",
      theme: "train",
      hint: "El tren repite circulo, circulo, estrella.",
      pattern: ["wagon-circle", "wagon-circle", "wagon-star"],
      sequence: ["wagon-circle", "wagon-circle", null, "wagon-circle", null, "wagon-star", null, "wagon-circle", "wagon-star"],
      answers: ["wagon-star", "wagon-circle", "wagon-circle"],
      options: ["wagon-circle", "wagon-star", "wagon-square"],
    },
    {
      title: "Huerta de semillas",
      theme: "garden",
      hint: "El cantero repite semilla, semilla, flor.",
      pattern: ["seed", "seed", "flower"],
      sequence: ["seed", null, "flower", "seed", "seed", null, null, "seed", "flower"],
      answers: ["seed", "flower", "seed"],
      options: ["seed", "flower", "leaf"],
    },
    {
      title: "Pasos del robot",
      theme: "commands",
      hint: "El robot repite adelante, adelante, giro.",
      pattern: ["cmd-forward", "cmd-forward", "cmd-turn"],
      sequence: ["cmd-forward", "cmd-forward", null, "cmd-forward", null, "cmd-turn", null, "cmd-forward", "cmd-turn"],
      answers: ["cmd-turn", "cmd-forward", "cmd-forward"],
      options: ["cmd-forward", "cmd-turn", "cmd-jump"],
    },
  ];
  scenes.splice(0, scenes.length, {
    title: "Pasos del robot",
    theme: "commands",
    hint: "Completa el patron: avanzar, avanzar y girar.",
    pattern: ["cmd-forward", "cmd-forward", "cmd-turn"],
    sequence: ["cmd-forward", "cmd-forward", null, "cmd-forward", null, "cmd-turn", null, "cmd-forward", "cmd-turn"],
    answers: ["cmd-turn", "cmd-forward", "cmd-forward"],
    options: ["cmd-forward", "cmd-turn", "cmd-jump"],
  });
  const labels = {
    "tile-blue": "Azul",
    "tile-yellow": "Amarilla",
    "tile-pink": "Rosa",
    "box-small": "Chica",
    "box-large": "Grande",
    "box-tall": "Alta",
    "light-green": "Verde",
    "light-red": "Roja",
    "light-yellow": "Amarilla",
    "paint-dot": "Pintar",
    "turn-right": "Girar der.",
    "turn-left": "Girar izq.",
    "wagon-circle": "Circulo",
    "wagon-star": "Estrella",
    "wagon-square": "Cuadro",
    seed: "Semilla",
    flower: "Flor",
    leaf: "Hoja",
    "cmd-forward": "Avanzar",
    "cmd-turn": "Girar",
    "cmd-jump": "Saltar",
  };
  let sceneIndex = 0;
  let selectedBlank = 0;
  const completedScenes = new Set();

  function itemMarkup(kind) {
    return `<span class="pattern-item kind-${kind}"><i></i><strong>${labels[kind]}</strong></span>`;
  }

  function blankMarkup(blankIndex, isSelected) {
    return `
      <button type="button" class="pattern-blank graphic-blank ${isSelected ? "is-selected" : ""}" data-blank="${blankIndex}">
        ?
      </button>
    `;
  }

  function renderScene() {
    const scene = scenes[sceneIndex];
    selectedBlank = 0;
    let blankIndex = 0;

    challengeContent.innerHTML = `
      <article class="challenge-card">
        <header class="challenge-header">
          <p class="challenge-kicker">Desafio 4</p>
          <h2>${scene.title}</h2>
          <p>${scene.hint}</p>
        </header>
        <div class="pattern-visual-layout pattern-scene pattern-theme-${scene.theme}">
          ${scenes.length > 1 ? `
            <div class="pattern-progress" aria-label="Escenarios completados">
              ${scenes.map((item, index) => `
                <button class="${index === sceneIndex ? "is-active" : ""} ${completedScenes.has(index) ? "is-done" : ""}" type="button" data-scene="${index}">
                  ${index + 1}
                </button>
              `).join("")}
            </div>
          ` : ""}
          <section class="pattern-section pattern-model-section" aria-labelledby="pattern-model-title">
            <h3 id="pattern-model-title">Patron</h3>
            <div class="pattern-preview" aria-label="Bloque que se repite">
              ${scene.pattern.map(itemMarkup).join("")}
            </div>
          </section>
          <section class="pattern-section pattern-complete-section" aria-labelledby="pattern-complete-title">
            <h3 id="pattern-complete-title">A completar</h3>
            <div class="pattern-row graphic-pattern-row">
              ${scene.sequence.map((kind) => {
    if (kind) return itemMarkup(kind);
    const markup = blankMarkup(blankIndex, blankIndex === 0);
    blankIndex += 1;
    return markup;
  }).join("")}
            </div>
          </section>
          <section class="pattern-section pattern-actions-section" aria-labelledby="pattern-actions-title">
            <h3 id="pattern-actions-title">Acciones</h3>
            <div class="option-bank compact-bank graphic-options">
              ${scene.options.map((kind) => `
                <button type="button" data-option="${kind}">
                  ${itemMarkup(kind)}
                </button>
              `).join("")}
            </div>
          </section>
        </div>
        <div class="challenge-actions">
          <button class="primary-action" type="button" data-check>Comprobar</button>
          <button class="secondary-action" type="button" data-reset>Reiniciar</button>
        </div>
        <p class="challenge-message" data-message>${scene.hint}</p>
      </article>
    `;

    wireScene();
  }

  function wireScene() {
    const scene = scenes[sceneIndex];
    const blanks = [...challengeContent.querySelectorAll(".pattern-blank")];

    challengeContent.querySelectorAll("[data-scene]").forEach((button) => {
      button.addEventListener("click", () => {
        sceneIndex = Number(button.dataset.scene);
        renderScene();
      });
    });

    blanks.forEach((blank) => {
      blank.addEventListener("click", () => {
        blanks.forEach((item) => item.classList.remove("is-selected"));
        blank.classList.add("is-selected");
        selectedBlank = Number(blank.dataset.blank);
      });
    });

    challengeContent.querySelectorAll("[data-option]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = blanks[selectedBlank];
        if (!target) return;
        const kind = button.dataset.option;
        target.innerHTML = itemMarkup(kind);
        target.dataset.value = kind;
        target.classList.remove("is-wrong", "is-correct");
        const next = blanks.find((blank) => !blank.dataset.value);
        blanks.forEach((item) => item.classList.remove("is-selected"));
        if (next) {
          next.classList.add("is-selected");
          selectedBlank = Number(next.dataset.blank);
        } else {
          target.classList.add("is-selected");
        }
      });
    });

    challengeContent.querySelector("[data-check]").addEventListener("click", () => {
      if (blanks.some((blank) => !blank.dataset.value)) {
        setMessage("Completa los tres espacios antes de comprobar.", "is-error");
        return;
      }

      const values = blanks.map((blank) => blank.dataset.value);
      const firstWrongIndex = values.findIndex((value, index) => value !== scene.answers[index]);
      if (firstWrongIndex !== -1) {
        blanks.forEach((blank, index) => {
          blank.classList.toggle("is-wrong", values[index] !== scene.answers[index]);
          blank.classList.toggle("is-selected", index === firstWrongIndex);
        });
        selectedBlank = firstWrongIndex;
        setMessage("Ese objeto rompe el patron del escenario. Mira el bloque modelo.", "is-error");
        return;
      }

      blanks.forEach((blank) => blank.classList.add("is-correct"));
      completedScenes.add(sceneIndex);
      setMessage(`Escenario ${sceneIndex + 1} listo.`, "is-success");

      if (completedScenes.size === scenes.length) {
        completeChallenge(4);
        return;
      }

      window.setTimeout(() => {
        sceneIndex = scenes.findIndex((_, index) => !completedScenes.has(index));
        renderScene();
      }, 650);
    });

    challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
      blanks.forEach((blank, index) => {
        blank.textContent = "?";
        delete blank.dataset.value;
        blank.classList.remove("is-correct", "is-wrong");
        blank.classList.toggle("is-selected", index === 0);
      });
      selectedBlank = 0;
      setMessage(scene.hint);
    });
  }

  renderScene();
}

function renderCoordinatesChallenge() {
  const objects = [
    { id: "inicio", label: "Inicio", icon: "🏁", target: "B2" },
    { id: "bateria", label: "Bateria", icon: "🔋", target: "D2" },
    { id: "llave", label: "Llave", icon: "🗝️", target: "D5" },
    { id: "meta", label: "Meta", icon: "⭐", target: "F5" },
  ];
  let selected = objects[0].id;
  const placed = {};

  challengeContent.innerHTML = `
    <article class="challenge-card challenge-card-coords">
      ${renderHeader(5, getChallengeInstruction(5, "Ubica puntos del mapa para planear la ruta del robot desde inicio hasta la meta."))}
      <div class="coord-layout">
        <div class="coord-bank"></div>
        <div class="coord-grid"></div>
      </div>
      <p class="challenge-message" data-message>Primero ubica Inicio en B2.</p>
    </article>
  `;

  const bank = challengeContent.querySelector(".coord-bank");
  const grid = challengeContent.querySelector(".coord-grid");

  function renderBank() {
    bank.innerHTML = objects.map((object) => `
      <button type="button" class="${object.id === selected ? "is-selected" : ""}" data-object="${object.id}">
        <span>${object.icon}</span>
        <strong>${object.label}</strong>
        <em>${object.target}</em>
      </button>
    `).join("");

    bank.querySelectorAll("[data-object]").forEach((button) => {
      button.addEventListener("click", () => {
        selected = button.dataset.object;
        renderBank();
        const object = objects.find((item) => item.id === selected);
        setMessage(`Ubica ${object.label} en ${object.target}.`);
      });
    });
  }

  function renderGrid() {
    grid.innerHTML = "";
    const cols = ["A", "B", "C", "D", "E", "F"];
    for (let row = 1; row <= 6; row += 1) {
      for (const col of cols) {
        const coord = `${col}${row}`;
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "coord-cell";
        cell.dataset.coord = coord;
        cell.textContent = coord;
        const placedObject = objects.find((object) => placed[object.id] === coord);
        if (placedObject) {
          cell.classList.add("has-object");
          cell.textContent = placedObject.icon;
        }
        cell.addEventListener("click", () => {
          const object = objects.find((item) => item.id === selected);
          if (coord !== object.target) {
            setMessage(`Revisa: ${object.label} va en ${object.target}.`, "is-error");
            return;
          }
          placed[object.id] = coord;
          cell.classList.add("has-object");
          cell.textContent = object.icon;
          const next = objects.find((item) => !placed[item.id]);
          if (next) {
            selected = next.id;
            renderBank();
            renderGrid();
            setMessage(`Bien. Ahora ubica ${next.label} en ${next.target}.`, "is-good");
          } else {
            renderBank();
            renderGrid();
            setMessage("Ruta lista. Tu mapa del robot quedo completo.", "is-success");
            completeChallenge(5);
          }
        });
        grid.append(cell);
      }
    }
  }

  renderBank();
  renderGrid();
}

const graphicLabels = {
  "tile-blue": "Azul",
  "tile-yellow": "Amarilla",
  "tile-pink": "Rosa",
  "light-green": "Verde",
  "light-red": "Roja",
  "light-yellow": "Amarilla",
};

function renderLevelHeader(title, instruction) {
  return `
    <header class="challenge-header">
      <p class="challenge-kicker">Nivel ${level}</p>
      <h2>${title}</h2>
      <p>${instruction}</p>
    </header>
  `;
}

function renderGraphicToken(kind) {
  return `<span class="pattern-item kind-${kind}"><i></i><strong>${graphicLabels[kind] || kind}</strong></span>`;
}

function renderGraphicPatternLevel(config) {
  let selectedBlank = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderLevelHeader(config.title, config.hint)}
      <div class="pattern-visual-layout pattern-scene pattern-theme-${config.theme}">
        <div class="pattern-preview" aria-label="Bloque modelo">
          ${config.pattern.map(renderGraphicToken).join("")}
        </div>
        <div class="pattern-row graphic-pattern-row">
          ${config.sequence.map((kind, index) => kind
    ? renderGraphicToken(kind)
    : `<button type="button" class="pattern-blank graphic-blank ${index === 0 ? "is-selected" : ""}" data-blank="${index}">?</button>`).join("")}
        </div>
        <div class="option-bank compact-bank graphic-options">
          ${config.options.map((kind) => `<button type="button" data-option="${kind}">${renderGraphicToken(kind)}</button>`).join("")}
        </div>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>${config.hint}</p>
    </article>
  `;

  const blanks = [...challengeContent.querySelectorAll(".pattern-blank")];
  blanks.forEach((blank, index) => {
    blank.dataset.blank = String(index);
    blank.classList.toggle("is-selected", index === 0);
    blank.addEventListener("click", () => {
      blanks.forEach((item) => item.classList.remove("is-selected"));
      blank.classList.add("is-selected");
      selectedBlank = index;
    });
  });

  challengeContent.querySelectorAll("[data-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = blanks[selectedBlank];
      const kind = button.dataset.option;
      target.innerHTML = renderGraphicToken(kind);
      target.dataset.value = kind;
      target.classList.remove("is-wrong", "is-correct");
      const next = blanks.find((blank) => !blank.dataset.value);
      blanks.forEach((item) => item.classList.remove("is-selected"));
      if (next) {
        next.classList.add("is-selected");
        selectedBlank = blanks.indexOf(next);
      } else {
        target.classList.add("is-selected");
      }
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    if (blanks.some((blank) => !blank.dataset.value)) {
      setMessage("Completa todos los espacios antes de comprobar.", "is-error");
      return;
    }
    const values = blanks.map((blank) => blank.dataset.value);
    const firstWrong = values.findIndex((value, index) => value !== config.answers[index]);
    if (firstWrong !== -1) {
      blanks.forEach((blank, index) => {
        blank.classList.toggle("is-wrong", values[index] !== config.answers[index]);
        blank.classList.toggle("is-selected", index === firstWrong);
      });
      selectedBlank = firstWrong;
      setMessage("Ese objeto rompe el patron visual.", "is-error");
      return;
    }
    blanks.forEach((blank) => blank.classList.add("is-correct"));
    setMessage("Patron completo.", "is-success");
    completeChallenge(1);
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    blanks.forEach((blank, index) => {
      blank.textContent = "?";
      delete blank.dataset.value;
      blank.classList.remove("is-correct", "is-wrong");
      blank.classList.toggle("is-selected", index === 0);
    });
    selectedBlank = 0;
    setMessage(config.hint);
  });
}

function renderLevel6Lights() {
  renderGraphicPatternLevel({
    title: "Luces del semaforo",
    theme: "lights",
    hint: "Completa la secuencia de luces: verde, verde, rojo.",
    pattern: ["light-green", "light-green", "light-red"],
    sequence: ["light-green", "light-green", null, "light-green", null, "light-red", null, "light-green", "light-red"],
    answers: ["light-red", "light-green", "light-green"],
    options: ["light-green", "light-red", "light-yellow"],
  });
}

function renderLevel7Factory() {
  const items = [
    { id: "caja-azul", label: "Caja azul", target: "azul" },
    { id: "caja-amarilla", label: "Caja amarilla", target: "amarillo" },
    { id: "caja-rosa", label: "Caja rosa", target: "rosa" },
    { id: "caja-azul-2", label: "Caja azul", target: "azul" },
  ];
  let current = 0;
  const sorted = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderLevelHeader("Fabrica de cajas", getChallengeInstruction(1, "Clasifica cada caja en el deposito del mismo color."))}
      <div class="factory-layout">
        <div class="factory-belt">
          ${items.map((item, index) => `<button class="factory-box box-${item.target} ${index === current ? "is-current" : ""}" type="button" data-item="${index}">${item.label}</button>`).join("")}
        </div>
        <div class="factory-bins">
          <button type="button" data-bin="azul">Deposito azul</button>
          <button type="button" data-bin="amarillo">Deposito amarillo</button>
          <button type="button" data-bin="rosa">Deposito rosa</button>
        </div>
      </div>
      <p class="challenge-message" data-message>Selecciona el deposito de la caja marcada.</p>
    </article>
  `;

  function renderFactory() {
    challengeContent.querySelectorAll("[data-item]").forEach((box, index) => {
      box.classList.toggle("is-current", index === current && !sorted.has(index));
      box.classList.toggle("is-done", sorted.has(index));
    });
  }

  challengeContent.querySelectorAll("[data-bin]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = items[current];
      if (!item || sorted.has(current)) return;
      if (button.dataset.bin !== item.target) {
        setMessage("Ese deposito no coincide con la caja.", "is-error");
        return;
      }
      sorted.add(current);
      current += 1;
      renderFactory();
      if (sorted.size === items.length) {
        setMessage("Todas las cajas quedaron ordenadas.", "is-success");
        completeChallenge(1);
      } else {
        setMessage("Bien. Ahora clasifica la siguiente caja.", "is-good");
      }
    });
  });
}

function renderLevel8Circuit() {
  const target = [true, false, true, true];
  const state = [false, false, false, false];

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderLevelHeader("Circuito de energia", getChallengeInstruction(1, "Activa los switches para copiar el patron de luces objetivo."))}
      <div class="circuit-layout">
        <div class="circuit-row" aria-label="Objetivo">
          ${target.map((isOn) => `<span class="circuit-light ${isOn ? "is-on" : ""}"></span>`).join("")}
        </div>
        <div class="circuit-row" data-current>
          ${state.map((_, index) => `<button class="circuit-switch" type="button" data-switch="${index}"><span></span></button>`).join("")}
        </div>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
      </div>
      <p class="challenge-message" data-message>Copia el patron de luces de arriba.</p>
    </article>
  `;

  function renderCircuit() {
    challengeContent.querySelectorAll("[data-switch]").forEach((button, index) => {
      button.classList.toggle("is-on", state[index]);
    });
  }

  challengeContent.querySelectorAll("[data-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.switch);
      state[index] = !state[index];
      renderCircuit();
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    if (state.every((value, index) => value === target[index])) {
      setMessage("Circuito encendido correctamente.", "is-success");
      completeChallenge(1);
    } else {
      setMessage("Todavia no copia el objetivo.", "is-error");
    }
  });

  renderCircuit();
}

function renderLevel9Memory() {
  const cards = ["A", "B", "C", "A", "B", "C"];
  let first = null;
  let lock = false;
  const matched = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderLevelHeader("Memoria de pares", getChallengeInstruction(1, "Encuentra los pares iguales."))}
      <div class="memory-grid">
        ${cards.map((card, index) => `<button class="memory-card" type="button" data-card="${index}" data-value="${card}">?</button>`).join("")}
      </div>
      <p class="challenge-message" data-message>Da vuelta dos cartas y busca las parejas.</p>
    </article>
  `;

  challengeContent.querySelectorAll("[data-card]").forEach((card) => {
    card.addEventListener("click", () => {
      if (lock) return;
      const index = Number(card.dataset.card);
      if (matched.has(index) || card.classList.contains("is-open")) return;
      card.textContent = card.dataset.value;
      card.classList.add("is-open");
      if (!first) {
        first = card;
        return;
      }
      if (first.dataset.value === card.dataset.value) {
        matched.add(Number(first.dataset.card));
        matched.add(index);
        first.classList.add("is-matched");
        card.classList.add("is-matched");
        first = null;
        if (matched.size === cards.length) {
          setMessage("Encontraste todos los pares.", "is-success");
          completeChallenge(1);
        }
        return;
      }
      lock = true;
      window.setTimeout(() => {
        first.textContent = "?";
        card.textContent = "?";
        first.classList.remove("is-open");
        card.classList.remove("is-open");
        first = null;
        lock = false;
      }, 650);
    });
  });
}

function renderLevel10Lock() {
  const code = "314";
  let input = "";

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderLevelHeader("Candado final", getChallengeInstruction(1, "Lee las columnas y marca el codigo correcto."))}
      <div class="lock-layout">
        <div class="lock-clues">
          <span><i></i><i></i><i></i></span>
          <span><i></i></span>
          <span><i></i><i></i><i></i><i></i></span>
        </div>
        <div class="lock-display" data-display>___</div>
        <div class="lock-pad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => `<button type="button" data-num="${num}">${num}</button>`).join("")}
        </div>
      </div>
      <div class="challenge-actions">
        <button class="secondary-action" type="button" data-reset>Borrar</button>
      </div>
      <p class="challenge-message" data-message>Cada columna muestra un numero del codigo.</p>
    </article>
  `;

  const display = challengeContent.querySelector("[data-display]");
  function renderDisplay() {
    display.textContent = input.padEnd(3, "_");
  }

  challengeContent.querySelectorAll("[data-num]").forEach((button) => {
    button.addEventListener("click", () => {
      if (input.length >= 3) return;
      input += button.dataset.num;
      renderDisplay();
      if (input.length === 3) {
        if (input === code) {
          setMessage("Candado abierto. Nivel final completado.", "is-success");
          completeChallenge(1);
        } else {
          setMessage("Ese codigo no coincide con las columnas.", "is-error");
        }
      }
    });
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    input = "";
    renderDisplay();
    setMessage("Cada columna muestra un numero del codigo.");
  });
}

function openStandaloneLevel() {
  challengeShell?.classList.add("is-open");
  if (level === 5) renderCoordinatesChallenge();
  if (level === 6) renderLevel6Lights();
  if (level === 7) renderLevel7Factory();
  if (level === 8) renderLevel8Circuit();
  if (level === 9) renderLevel9Memory();
  if (level === 10) renderLevel10Lock();
}

async function initializeLevelPage() {
  const { discovered, dataByLevel } = await discoverLevelsFromJson();
  availableLevels = discovered;
  levelDataByNumber = dataByLevel;

  if (availableLevels.length) {
    level = availableLevels.includes(level) || Number.isInteger(requestedLevel) ? level : availableLevels[0];
    currentLevelData = levelDataByNumber.get(level) || null;
  } else {
    currentLevelData = null;
  }

  const challenges = getChallengesFromData(currentLevelData);
  totalChallenges = challenges.length || (level === 4 ? 5 : 1);
  mapChallengeTitles(currentLevelData);
  syncLevelHeading();
  syncLevelBackground();
  buildSelectorButtons();
  wireSelectorButtons();

  if (challenges.length) {
    openChallenge(1);
    return;
  }

  if (level === 4) {
    openChallenge(1);
    return;
  }

  openStandaloneLevel();
}

if (challengeContent && challengeShell) {
  initializeLevelPage();
}
