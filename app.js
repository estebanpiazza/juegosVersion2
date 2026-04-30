const params = new URLSearchParams(window.location.search);
const requestedLevel = Number(params.get("nivel"));
const DEFAULT_LEVEL = 4;
let level = Number.isInteger(requestedLevel) ? requestedLevel : DEFAULT_LEVEL;

const challengeContent = document.querySelector("#challenge-content");
const challengeShell = document.querySelector(".challenge-shell");
const selectorWrap = document.querySelector(".selector-wrap");
const gamestágeBg = document.querySelector(".game-stage-bg");
let selectorButtons = [...document.querySelectorAll(".selector-chip")];
let totalChallenges = level === 4 ? 5 : 1;
const completedChallenges = new Set();
let scenarioModal = null;
let availableLevels = [];
let levelDataByNumber = new Map();
let currentLevelData = null;
let activeChallengeId = 1;

let challengeTitles = {
  1: "Camino del robot",
  2: "Depura el programa",
  3: "Programa al robot",
  4: "Patrones de algoritmo",
  5: "Mision mapa del robot",
};

const challengeTypeRenderers = {
  "secuenciacion-guiada": (id) => renderPathChallenge(id),
  "depuracion-inicial": (id) => renderBalanceChallengeV2(id),
  "programacion-por-bloques": (id) => renderRobotChallengeV2(id),
  "patrones-de-comandos": (id) => renderPatternChallengeV2(id),
  "mapa-en-grilla": (id) => renderCoordinatesChallenge(id),
  "repeticion-obligatoria": (id) => renderRepeatRequiredChallenge(id),
  "laberinto-flechas": (id) => renderArrowMazeChallenge(id),
  "ordenar-algoritmo": (id) => renderOrderAlgorithmChallenge(id),
  "clasificacion-reglas": (id) => renderSortingRulesChallenge(id),
  "memoria-secuencia": (id) => renderSequenceMemoryChallenge(id),
  "elige-comando": (id) => renderChooseCommandChallenge(id),
  "parejas-robot": (id) => renderMatchingPairsChallenge(id),
  "conteo-baterias": (id) => renderBatteryCountChallenge(id),
  "laberinto-baterias": (id) => renderBatteryMazeChallenge(id),
  "espejo-patron": (id) => renderMirrorPatternChallenge(id),
  "evento-accion": (id) => renderEventActionChallenge(id),
  "intruso-secuencia": (id) => renderOddOneOutChallenge(id),
  "codigo-simbolos": (id) => renderSymbolCodeChallenge(id),
  "ruta-colores": (id) => renderColorRouteChallenge(id),
  "orden-tamano": (id) => renderSizeOrderChallenge(id),
  "encuentra-bug": (id) => renderFindBugChallenge(id),
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
  if (Array.isArray(levelData?.desafios)) return levelData.desafios;
  return Array.isArray(levelData?.desafíos) ? levelData.desafíos : [];
}

function syncLevelHeading() {
  document.querySelectorAll("[data-current-level]").forEach((node) => {
    node.textContent = String(level);
  });
  document.title = `Be Tech | Nivel ${level}`;
}

function syncLevelBackground() {
  if (!gamestágeBg || !levelBackgrounds.length) return;
  const backgroundIndex = Math.floor(Math.max(level - 1, 0) / 3) % levelBackgrounds.length;
  gamestágeBg.src = levelBackgrounds[backgroundIndex];
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
        <button class="selector-chip ${index === 0 ? "is-active" : ""}" type="button" data-challenge="${index + 1}" aria-label="desafío ${index + 1}">
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
    challenges.map((challenge, index) => [index + 1, challenge.titulo || `desafío ${index + 1}`]),
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
    <p class="challenge-kicker">Logro desbloqueado</p>
    <h2 id="scenario-modal-title">Lo hiciste genial</h2>
    <p>${nextScenario
      ? `Completaste el nivel. Tu robot ya está listo para el próximo desafío.`
      : `Completaste todos los desafíos de este grado. Gran recorrido.`}</p>
    <div class="scenario-modal-actions">
      ${nextScenario
        ? `<button class="primary-action" type="button" data-next-scenario="${nextScenario}">Ir al siguiente desafío</button>`
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
  stopSpeech();
  activeChallengeId = id;
  challengeShell?.classList.add("is-open");

  const challengeData = getChallengesFromData(currentLevelData)[id - 1];
  if (challengeData) {
    const renderer = challengeTypeRenderers[challengeData.tipo];
    if (renderer) {
      renderer(id);
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
  stopSpeech();
  selectorButtons.forEach((chip) => chip.classList.remove("is-active"));
  document.querySelector(`[data-challenge="${id}"]`)?.classList.add("is-active");
  challengeShell?.classList.add("is-open");
  challengeContent.innerHTML = `
    <article class="challenge-card">
      <p class="challenge-kicker">Proximamente</p>
      <h2>desafío ${id}</h2>
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

function resetSpeechButton(button) {
  if (!button) return;
  button.classList.remove("is-speaking");
  button.disabled = false;
  const label = button.querySelector("[data-speech-label]");
  if (label) label.textContent = "Escuchar consigna";
}

let activeSpeechButton = null;

function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  resetSpeechButton(activeSpeechButton);
  activeSpeechButton = null;
}

function getSpanishVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang === "es-AR")
    || voices.find((voice) => voice.lang?.startsWith("es"))
    || null;
}

function speakInstruction(text, button) {
  const cleanText = text?.trim();
  if (!cleanText) return;

  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    setMessage("Tu navegador no tiene lectura de voz disponible.", "is-error");
    return;
  }

  window.speechSynthesis.cancel();
  resetSpeechButton(activeSpeechButton);

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const spanishVoice = getSpanishVoice();
  utterance.lang = spanishVoice?.lang || "es-AR";
  utterance.rate = 0.92;
  utterance.pitch = 1;
  if (spanishVoice) utterance.voice = spanishVoice;

  activeSpeechButton = button;
  button.classList.add("is-speaking");
  button.disabled = true;
  const buttonLabel = button.querySelector("[data-speech-label]");
  if (buttonLabel) buttonLabel.textContent = "Escuchando";

  utterance.addEventListener("end", () => {
    resetSpeechButton(button);
    if (activeSpeechButton === button) activeSpeechButton = null;
  });

  utterance.addEventListener("error", () => {
    resetSpeechButton(button);
    if (activeSpeechButton === button) activeSpeechButton = null;
  });

  window.speechSynthesis.speak(utterance);
}

function renderChallengeHeader(kicker, title, instruction) {
  return `
    <header class="challenge-header">
      <p class="challenge-kicker">${kicker}</p>
      <div class="challenge-title-row">
        <h2>${title}</h2>
        <button class="listen-consigna" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">
          <span aria-hidden="true" class="listen-consigna-icon">&#128266;</span>
          <span data-speech-label>Escuchar consigna</span>
        </button>
      </div>
      <p data-consigna-text>${instruction}</p>
    </header>
  `;
}

challengeContent?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-speak-consigna]");
  if (!button) return;
  const header = button.closest(".challenge-header");
  const instruction = header?.querySelector("[data-consigna-text]")?.textContent;
  speakInstruction(instruction, button);
});

function renderHeader(id, instruction) {
  const headerId = Number.isInteger(id) ? id : activeChallengeId;
  return renderChallengeHeader(`desafío ${headerId}`, challengeTitles[headerId], instruction);
}

function getChallengeInstruction(id, fallbackText) {
  const challengeId = Number.isInteger(id) ? id : activeChallengeId;
  const challenge = getChallengesFromData(currentLevelData)[challengeId - 1];
  const baseInstruction = challenge?.consigna || fallbackText;
  const reminders = [];

  if (id === 2 || id === 3) {
    reminders.push("Si hay agua, evita pasar por ahi para no dañar al robot.");
  }

  if (id === 3 || id === 5) {
    reminders.push("Agarra la bateria y la recarga para que el robot no se quede sin energia.");
  }

  if (!reminders.length) return baseInstruction;
  return `${baseInstruction} ${reminders.join(" ")}`;
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

function renderInlineCommand(command) {
  return `${commandSymbols[command] || "?"} ${command}`;
}

function renderCommandButton(command, className = "instruction-chip") {
  return `
    <button class="${className}" type="button" data-value="${command}" aria-label="${command}">
      ${renderCommand(command)}
    </button>
  `;
}

function renderSequenceStep(command) {
  return `<span class="sequence-slot command-card" data-value="${command}" aria-label="${command}">${renderCommand(command)}</span>`;
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

function renderPathChallenge(id = 1) {
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
      ${renderHeader(id, getChallengeInstruction(id, "Mira el camino celeste y completa los giros para que el robot vaya desde INICIO hasta 🏁."))}
      <div class="path-layout">
        <div class="path-map" data-path-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Empeza por los pasos 3, 6 y 9. La ruta celeste te da una buena pista.</p>
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
        cell.textContent = "🏁";
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
      setMessage("Muy bien, tu plan ya tiene forma. Miremos al robot en accion.", "is-good");
      runRobotAnimation().then(() => {
        setMessage("Excelente trabajo. El robot siguio tu camino y llego a la bandera 🏁.", "is-success");
        completeChallenge(id);
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
      ? `Vas muy bien hasta ahi. Probemos otro giro en el paso ${stepNumber}.`
      : `Buen avance. El robot ya llega hasta ahi; agrega el paso ${stepNumber} para seguir.`,
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
    setMessage("Todo listo para volver a probar. Empeza por los pasos 3, 6 y 9.");
  });
}

function renderBalanceChallenge(id = 2) {
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
      ${renderHeader(id, getChallengeInstruction(id, "Corrige el programa para que el robot salga de IN y llegue a 🏁 sin meterse al agua."))}
      <section class="debug-reference" aria-label="Referencia visual">
        <h3>Mapa de referencia</h3>
        <div class="debug-legend">
          <span><i class="legend-dot legend-start"></i> Inicio</span>
          <span><i class="legend-dot legend-goal"></i> Bandera 🏁</span>
          <span><i class="legend-dot legend-obstacle"></i> Agua</span>
          <span><i class="legend-dot legend-trail"></i> Recorrido</span>
        </div>
      </section>
      <p class="challenge-note">Objetivo: solo la linea 1 está editable. Las otras dos ya están bien.</p>
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
      <p class="challenge-message" data-message>Probemos la linea 1: necesita apuntar hacia 🏁.</p>
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
          cell.textContent = "💧";
        }
        if (row === start.row && col === start.col) {
          cell.classList.add("is-start");
          cell.textContent = "IN";
        }
        if (row === goal.row && col === goal.col) {
          cell.classList.add("is-goal");
          cell.textContent = "🏁";
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
          setMessage("Esa linea ya ayuda al robot. Hoy solo necesitamos ajustar la linea 1.", "is-good");
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
        ? "Bien pensado. Ahora probemos el programa completo."
        : "Probalo en el mapa y fijate que aprende el robot con ese cambio.",
      command === expectedFix ? "is-good" : "");
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    const result = simulateProgram();
    renderMap(result, true, true);

    if (result.ok && program[fixedStep] === expectedFix) {
      setMessage("Gran arreglo. El robot esquivo el bloque rojo y llego a 🏁.", "is-success");
      completeChallenge(id);
      return;
    }

    if (result.reason === "obstacle") {
      setMessage(`Casi. En el paso ${result.failedStep} toca el bloque rojo; probemos otro giro en la linea 1.`, "is-error");
      return;
    }

    if (result.reason === "out") {
      setMessage(`Uy, en el paso ${result.failedStep} el robot se sale del tablero. Lo podemos encaminar desde la linea 1.`, "is-error");
      return;
    }

    setMessage("Todavia no llega a 🏁, pero estás cerca. La linea 1 necesita girar hacia la derecha.", "is-error");
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    program = [...originalProgram];
    selectedLine = fixedStep;
    renderProgram();
    renderMap({ trail: [keyOf(start.row, start.col)], robot: { ...start } }, true, true);
    setMessage("Volvemos al inicio. Probemos la linea 1 para que mire hacia 🏁.");
  });

  renderProgram();
  renderMap({ trail: [keyOf(start.row, start.col)], robot: { ...start } }, true, true);
}

function renderRobotChallenge(id = 3) {
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
      ${renderHeader(id, getChallengeInstruction(id, "Programa al robot para llegar a la estrella sin chocar con los bloques."))}
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
          <p class="challenge-message" data-message>Una pista: avanza por abajo, queda debajo de la estrella, gira y sube.</p>
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
        setMessage("Ya usaste las 10 instrucciones. Proba ejecutarlo o limpia para armar otro plan.", "is-error");
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
    setMessage("Programa limpio. Listo para probar una idea nueva.");
  });

  hintButton.addEventListener("click", () => {
    if (isRunning) return;
    if (!isSolutionPrefix()) {
      setMessage("Hay un pasito que se fue de la ruta. Quita el ultimo o limpia y lo armamos mejor.", "is-error");
      return;
    }
    if (program.length >= solution.length) {
      setMessage("Ya tienes el camino armado. Dale ejecutar y mira que pasa.", "is-good");
      return;
    }
    program.push(solution[program.length]);
    robot = { ...start };
    visitedCells = [];
    renderGrid();
    renderProgram();
    setMessage(`Te agregue una pista: ${commandLabels[program[program.length - 1]]}. Vas construyendo el camino.`, "is-good");
  });

  runButton.addEventListener("click", async () => {
    if (isRunning) return;
    if (!program.length) {
      setMessage("Primero agrega alguna instruccion. El robot necesita un plan para empezar.", "is-error");
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
        setMessage(`Casi. En el paso ${i + 1} el robot choco; revisa ese bloque y vuelve a probar.`, "is-error");
        return;
      }
      renderGrid();
    }

    setRunningState(false);
    if (robot.row === treasure.row && robot.col === treasure.col) {
      setMessage("Tesoro encontrado. Tu algoritmo funciono de maravilla.", "is-success");
      completeChallenge(id);
    } else {
      setMessage("El robot siguio tu programa. Falta poquito para llegar al tesoro.", "is-good");
    }
  });

  renderGrid();
  renderProgram();
}

function renderPatternChallenge(id = 4) {
  const answers = ["Avanzar", "Avanzar", "Girar der."];
  let selectedBlank = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Completa el patron de instrucciones que se repite."))}
      <p class="challenge-note">El bloque se repite de a tres: Avanzar, Avanzar, Girar der.</p>
      <div class="pattern-row">
        <span data-group="1">${renderInlineCommand("Avanzar")}</span><span data-group="1">${renderInlineCommand("Avanzar")}</span><span data-group="1">${renderInlineCommand("Girar der.")}</span>
        <span data-group="2">${renderInlineCommand("Avanzar")}</span>
        <button type="button" class="pattern-blank is-selected" data-blank="0">?</button>
        <span data-group="2">${renderInlineCommand("Girar der.")}</span>
        <button type="button" class="pattern-blank" data-blank="1">?</button>
        <span data-group="3">${renderInlineCommand("Avanzar")}</span>
        <button type="button" class="pattern-blank" data-blank="2">?</button>
      </div>
      <div class="option-bank">
        <button type="button" data-value="Avanzar">${renderInlineCommand("Avanzar")}</button>
        <button type="button" data-value="Girar der.">${renderInlineCommand("Girar der.")}</button>
        <button type="button" data-value="Girar izq.">${renderInlineCommand("Girar izq.")}</button>
        <button type="button" data-value="Saltar">${renderInlineCommand("Saltar")}</button>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Mira el ritmo: Avanzar, Avanzar y Girar der. Se repite como una cancion.</p>
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
      const command = button.dataset.value;
      blanks[selectedBlank].textContent = renderInlineCommand(command);
      blanks[selectedBlank].dataset.value = command;
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
      setMessage("Faltan algunos huecos. Completa los tres y lo probamos juntos.", "is-error");
      return;
    }

    const values = blanks.map((blank) => blank.dataset.value);
    if (values.every((value, index) => value === answers[index])) {
      blanks.forEach((blank) => {
        blank.classList.remove("is-wrong");
        blank.classList.add("is-correct");
      });
      setMessage("Muy buen ojo. Encontraste el patron del algoritmo.", "is-success");
      completeChallenge(id);
    } else {
      const firstWrongIndex = values.findIndex((value, index) => value !== answers[index]);
      blanks.forEach((blank, index) => {
        blank.classList.toggle("is-wrong", values[index] !== answers[index]);
        blank.classList.toggle("is-selected", index === firstWrongIndex);
      });
      selectedBlank = firstWrongIndex;
      setMessage(`Buen intento. Mira el hueco ${firstWrongIndex + 1}: el patron vuelve al mismo bloque de tres.`, "is-error");
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
    setMessage("Volvemos a mirar el ritmo: Avanzar, Avanzar y Girar der.");
  });
}

function renderBalanceChallengeV2(id = 2) {
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
      ${renderHeader(id, getChallengeInstruction(id, "Completa los giros para esquivar el agua y llegar a 🏁."))}
      <div class="visual-sequence-layout">
        <div class="path-map visual-map" data-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Mira la ruta celeste: con dos giros bien elegidos el robot rodea el agua.</p>
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
          cell.textContent = "💧";
        }
        if (key === route[0]) {
          cell.classList.add("is-start");
          cell.textContent = "IN";
        }
        if (key === route[route.length - 1]) {
          cell.classList.add("is-goal");
          cell.textContent = "🏁";
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
        ? "Vas bien hasta ahi. Ese giro hace que el robot salga de la ruta celeste.."
        : `Buen avance. El robot llega hasta ahi; agrega el paso ${stepIndex + 1} para continuar.`,
      issue.dataset.value ? "is-error" : "is-good");
      animateRoute(routeLimit);
      return;
    }

    setMessage("Muy bien, la ruta quedo armada. Mira al robot probar tu idea.", "is-good");
    animateRoute().then(() => {
      setMessage("Ruta lograda. El robot llego a 🏁 gracias a tu plan.", "is-success");
      completeChallenge(id);
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
    setMessage("Nuevo intento. Mira la ruta celeste y busca los dos giros.");
  });

  buildMap();
  paintRobot(route[0]);
}

function renderRobotChallengeV2(id = 3) {
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
      ${renderHeader(id, getChallengeInstruction(id, "Arma la secuencia para juntar las baterias y llegar a 🏁."))}
      <div class="visual-sequence-layout">
        <div class="robot-grid visual-map" data-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Ejecutar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Sigue la ruta celeste: junta las pilas de energia y termina en 🏁.</p>
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
          cell.textContent = "💧";
        }
        if (batteries.has(key)) {
          cell.classList.add("is-treasure");
          cell.textContent = key === "5-2" ? "🔋" : "⚡";
        }
        if (key === route[0]) {
          cell.classList.add("is-start");
          cell.textContent = "IN";
        }
        if (key === route[route.length - 1]) {
          cell.classList.add("is-goal");
          cell.textContent = "🏁";
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
        ? "Vas bien hasta ahi. La tarjeta marcada hace que el robot se desvie."
        : `Buen avance. El robot llega hasta ahi; agrega el paso ${stepIndex + 1} para seguir.`,
      issue.dataset.value ? "is-error" : "is-good");
      animateRoute(routeLimit);
      return;
    }

    setMessage("Secuencia lista. Vamos a ver al robot juntar las baterias.", "is-good");
    animateRoute().then(() => {
      setMessage("Baterias cargadas y 🏁 alcanzada. Gran estrategia.", "is-success");
      completeChallenge(id);
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
    setMessage("Arrancamos de nuevo. Recarga energia y despues llega a 🏁.");
  });

  renderGrid();
  paintRobot(route[0]);
}

function renderRepeatRequiredChallenge(id = 1) {
  const route = ["5-0", "5-1", "5-2", "5-3", "4-3", "3-3", "2-3", "2-4", "2-5"];
  const routeCells = new Set(route);
  const batteries = new Set(["5-3", "2-3"]);
  const obstacles = new Set(["4-1", "4-2", "3-1", "1-4"]);
  const expected = {
    0: "Repetir 3",
    1: "Girar izq.",
    2: "Repetir 3",
    3: "Girar der.",
    4: "Repetir 2",
  };
  const compactSteps = Array.from({ length: 5 }, (_, index) => expected[index]);
  let selectedBlank = 0;
  let isAnimating = false;

  function tokenMarkup(command) {
    const repeatMatch = command.match(/^Repetir (\d)$/);
    if (repeatMatch) {
      return `
        <span class="command-symbol" aria-hidden="true">x${repeatMatch[1]}</span>
        <span class="command-label">Repetir</span>
      `;
    }
    return renderCommand(command);
  }

  function renderRepeatButton(command) {
    return `
      <button class="instruction-chip" type="button" data-value="${command}" aria-label="${command}">
        ${tokenMarkup(command)}
      </button>
    `;
  }

  function renderRepeatBlank(index) {
    return `
      <button class="sequence-slot command-card ${index === selectedBlank ? "is-selected" : ""}" type="button" data-blank="${index}" aria-label="Elegir bloque">
        <span class="command-placeholder">${index + 1}</span>
      </button>
    `;
  }

  function countMovesBeforeStep(stepIndex) {
    return compactSteps.slice(0, stepIndex).reduce((total, command) => {
      const repeatMatch = command.match(/^Repetir (\d)$/);
      if (repeatMatch) return total + Number(repeatMatch[1]);
      return command === "Avanzar" ? total + 1 : total;
    }, 0);
  }

  const stepsMarkup = Array.from({ length: 5 }, (_, index) => renderRepeatBlank(index)).join("");
  const actionsMarkup = ["Repetir 2", "Repetir 3", "Girar izq.", "Girar der.", "Avanzar"]
    .map(renderRepeatButton)
    .join("");

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Usa bloques repetir para que el robot junte energia y llegue a la bandera con pocos pasos."))}
      <p class="challenge-note">Objetivo: arma un programa corto. Los bloques x2 y x3 reemplazan varios avanzar seguidos.</p>
      <div class="visual-sequence-layout">
        <div class="robot-grid visual-map" data-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Ejecutar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Busca los tramos largos: primero hay tres pasos rectos, despues otros tres y al final dos.</p>
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
          cell.textContent = "🔋";
        }
        if (key === route[0]) {
          cell.classList.add("is-start");
          cell.textContent = "IN";
        }
        if (key === route[route.length - 1]) {
          cell.classList.add("is-goal");
          cell.textContent = "OK";
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
      await new Promise((resolve) => setTimeout(resolve, 220));
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
      target.innerHTML = tokenMarkup(command);
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
      issue.classList.add("is-wrong", "is-selected");
      blanks.forEach((blank) => {
        if (blank !== issue) blank.classList.remove("is-selected");
      });
      selectedBlank = stepIndex;
      setMessage(issue.dataset.value
        ? "Ese bloque cambia el recorrido. Mira el tramo marcado y prueba otro bloque corto."
        : `Falta el bloque ${stepIndex + 1}. El mapa te muestra cuantos avanzar conviene repetir.`,
      issue.dataset.value ? "is-error" : "is-good");
      animateRoute(countMovesBeforeStep(stepIndex));
      return;
    }

    setMessage("Programa compacto listo. Vamos a ejecutar los bloques repetir.", "is-good");
    animateRoute().then(() => {
      setMessage("Excelente: resolviste una ruta larga con un programa corto.", "is-success");
      completeChallenge(id);
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
    setMessage("Nuevo intento. Conviene reemplazar tramos rectos por repetir.");
  });

  renderGrid();
  paintRobot(route[0]);
}

function renderArrowMazeChallenge(id = 1) {
  const route = ["5-0", "4-0", "4-1", "4-2", "3-2", "2-2", "2-3", "1-3", "1-4", "1-5"];
  const routeCells = new Set(route);
  const obstacles = new Set(["5-2", "5-4", "4-4", "3-0", "3-1", "3-4", "2-0", "2-5", "1-1", "0-3"]);
  const signals = new Set(["4-2", "2-3"]);
  const expected = [
    "Avanzar",
    "Girar der.",
    "Avanzar",
    "Avanzar",
    "Girar izq.",
    "Avanzar",
    "Avanzar",
    "Girar der.",
    "Avanzar",
    "Girar izq.",
    "Avanzar",
    "Girar der.",
    "Avanzar",
    "Avanzar",
  ];
  const startDirection = 0;
  let selectedBlank = 0;
  let isAnimating = false;

  const stepsMarkup = expected.map((_, index) => renderSequenceBlank(index, selectedBlank)).join("");
  const actionsMarkup = ["Avanzar", "Girar izq.", "Girar der."]
    .map((command) => renderCommandButton(command))
    .join("");

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Arma la secuencia con Avanzar, Girar derecha y Girar izquierda para cruzar el laberinto, activar antenas y llegar a la salida."))}
      <p class="challenge-note">Objetivo: el robot solo se mueve con Avanzar. Usa los giros para orientarlo antes de seguir.</p>
      <div class="visual-sequence-layout">
        <div class="robot-grid visual-map" data-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Ejecutar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Mira la ruta celeste: cuando el camino cambia, gira al robot y despues avanza.</p>
    </article>
  `;

  const map = challengeContent.querySelector("[data-map]");
  const blanks = [...challengeContent.querySelectorAll("[data-blank]")];
  const checkButton = challengeContent.querySelector("[data-check]");
  const resetButton = challengeContent.querySelector("[data-reset]");
  const cells = new Map();

  function buildMap() {
    map.innerHTML = "";
    cells.clear();
    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const key = `${row}-${col}`;
        const cell = document.createElement("div");
        cell.className = "robot-cell";
        if (routeCells.has(key)) cell.classList.add("is-route");
        if (obstacles.has(key)) {
          cell.classList.add("is-obstacle");
          cell.textContent = "X";
        }
        if (signals.has(key)) {
          cell.classList.add("is-treasure");
          cell.textContent = "🔋";
        }
        if (key === route[0]) {
          cell.classList.add("is-start");
          cell.textContent = "IN";
        }
        if (key === route[route.length - 1]) {
          cell.classList.add("is-goal");
          cell.textContent = "OK";
        }
        cell.dataset.baseText = cell.textContent;
        cells.set(key, cell);
        map.append(cell);
      }
    }
  }

  function paintRobot(key, direction = directionForRouteKey(route, key)) {
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
    robotCell.innerHTML = renderRobotMarker(direction);
  }

  function getNextState(state, command) {
    const [row, col] = state.key.split("-").map(Number);
    if (command === "Girar der.") {
      return { key: state.key, direction: (state.direction + 1) % 4 };
    }
    if (command === "Girar izq.") {
      return { key: state.key, direction: (state.direction + 3) % 4 };
    }
    if (command !== "Avanzar") return state;

    const deltas = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    const [rowDelta, colDelta] = deltas[state.direction];
    return {
      key: `${row + rowDelta}-${col + colDelta}`,
      direction: state.direction,
    };
  }

  async function animateCommands(commands = expected) {
    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;

    let state = { key: route[0], direction: startDirection };
    paintRobot(state.key, state.direction);
    await new Promise((resolve) => setTimeout(resolve, 180));

    for (const command of commands) {
      state = getNextState(state, command);
      paintRobot(state.key, state.direction);
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
      const value = button.dataset.value;
      target.innerHTML = renderCommand(value);
      target.dataset.value = value;
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
      const previewCommands = blanks
        .slice(0, stepIndex + (issue.dataset.value ? 1 : 0))
        .map((blank) => blank.dataset.value)
        .filter(Boolean);
      issue.classList.add("is-wrong", "is-selected");
      blanks.forEach((blank) => {
        if (blank !== issue) blank.classList.remove("is-selected");
      });
      selectedBlank = stepIndex;
      setMessage(issue.dataset.value
        ? "Ese comando cambia la orientacion o el avance del robot. Mira hacia donde queda mirando y prueba otro."
        : `Buen avance. Falta completar el paso ${stepIndex + 1} para seguir.`,
      issue.dataset.value ? "is-error" : "is-good");
      animateCommands(previewCommands);
      return;
    }

    setMessage("Programa listo. Vamos a ver al robot girar y avanzar por el laberinto.", "is-good");
    animateCommands().then(() => {
      setMessage("Excelente: cruzaste el laberinto girando al robot antes de avanzar.", "is-success");
      completeChallenge(id);
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
    buildMap();
    paintRobot(route[0], startDirection);
    setMessage("Nuevo intento. Gira cuando cambia el camino y usa Avanzar para moverte.");
  });

  buildMap();
  paintRobot(route[0], startDirection);
}

function renderOrderAlgorithmChallenge(id = 1) {
  const steps = [
    { id: "motor", label: "Encender motor", icon: "ON", cue: "Motor" },
    { id: "avanzar", label: "Ir al banco", icon: "&#129302;", cue: "Banco" },
    { id: "bateria", label: "Tomar bateria", icon: "&#128267;", cue: "Bateria" },
    { id: "girar", label: "Girar a salida", icon: "&#8618;", cue: "Giro" },
    { id: "salir", label: "Llegar a OK", icon: "OK", cue: "Salida" },
  ];
  const bank = [steps[2], steps[0], steps[4], steps[1], steps[3]];
  const placed = Array(steps.length).fill(null);

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Mira el recorrido del taller y ordena las tarjetas para que el robot pueda salir paso a paso."))}
      <p class="challenge-note">Objetivo: toca una tarjeta para ponerla en el primer espacio libre. Toca una pieza colocada para quitarla.</p>
      <div class="algorithm-layout">
        <div class="algorithm-scene" aria-label="Recorrido visual del robot">
          ${steps.map((step, index) => `
            <div class="algorithm-scene-step">
              <span class="algorithm-scene-icon">${step.icon}</span>
              <small>${step.cue}</small>
            </div>
            ${index < steps.length - 1 ? '<span class="algorithm-scene-arrow" aria-hidden="true">-&gt;</span>' : ""}
          `).join("")}
        </div>
        <div class="algorithm-bank" data-bank></div>
        <div class="algorithm-slots" data-slots></div>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Primero el robot necesita encenderse; despues puede moverse y tomar energia.</p>
    </article>
  `;

  const bankNode = challengeContent.querySelector("[data-bank]");
  const slotsNode = challengeContent.querySelector("[data-slots]");

  function render() {
    const used = new Set(placed.filter(Boolean).map((step) => step.id));
    bankNode.innerHTML = bank.map((step) => `
      <button class="algorithm-card ${used.has(step.id) ? "is-used" : ""}" type="button" data-card="${step.id}" ${used.has(step.id) ? "disabled" : ""}>
        <span class="algorithm-card-icon" aria-hidden="true">${step.icon}</span>
        <span>${step.label}</span>
      </button>
    `).join("");
    slotsNode.innerHTML = placed.map((step, index) => `
      <button class="algorithm-slot ${step ? "has-card" : ""}" type="button" data-slot="${index}">
        <strong>${index + 1}</strong>
        ${step
          ? `<span class="algorithm-slot-card"><span class="algorithm-card-icon" aria-hidden="true">${step.icon}</span><span>${step.label}</span></span>`
          : `<span class="algorithm-slot-empty"><span>${steps[index].cue}</span><small>Toca una tarjeta</small></span>`}
      </button>
    `).join("");

    bankNode.querySelectorAll("[data-card]").forEach((button) => {
      button.addEventListener("click", () => {
        const firstEmpty = placed.findIndex((item) => !item);
        if (firstEmpty === -1) {
          setMessage("Ya completaste todos los espacios. Comprobemos el orden.", "is-good");
          return;
        }
        placed[firstEmpty] = bank.find((step) => step.id === button.dataset.card);
        render();
      });
    });

    slotsNode.querySelectorAll("[data-slot]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.slot);
        if (!placed[index]) return;
        placed[index] = null;
        render();
      });
    });
  }

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    if (placed.some((step) => !step)) {
      setMessage("Todavia quedan espacios vacios. Completa el algoritmo antes de probar.", "is-error");
      return;
    }
    const firstWrong = placed.findIndex((step, index) => step.id !== steps[index].id);
    slotsNode.querySelectorAll("[data-slot]").forEach((slot, index) => {
      slot.classList.toggle("is-wrong", index === firstWrong);
    });
    if (firstWrong !== -1) {
      setMessage(`Revisa el paso ${firstWrong + 1}. El robot necesita una accion anterior para que esa funcione.`, "is-error");
      return;
    }
    setMessage("Algoritmo ordenado. El robot ya tiene una rutina clara.", "is-success");
    completeChallenge(id);
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    placed.fill(null);
    render();
    setMessage("Tarjetas listas para ordenar otra vez.");
  });

  render();
}

function renderSortingRulesChallenge(id = 1) {
  const items = [
    { label: "Bateria azul", target: "energia" },
    { label: "Llave chica", target: "herramientas" },
    { label: "Alarma roja", target: "alertas" },
    { label: "Rayo verde", target: "energia" },
    { label: "Pinza", target: "herramientas" },
  ];
  const bins = [
    { id: "energia", label: "Energia" },
    { id: "herramientas", label: "Herramientas" },
    { id: "alertas", label: "Alertas" },
  ];
  let current = 0;
  const sorted = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Clasifica cada tarjeta segun la regla: energia, herramienta o alerta."))}
      <p class="challenge-note">Objetivo: mira la tarjeta marcada y elige el deposito correcto.</p>
      <div class="sort-layout">
        <div class="sort-current" data-current></div>
        <div class="sort-bins">
          ${bins.map((bin) => `<button type="button" data-bin="${bin.id}">${bin.label}</button>`).join("")}
        </div>
        <div class="sort-progress" data-progress></div>
      </div>
      <p class="challenge-message" data-message>Empieza por la tarjeta marcada. La palabra te da la pista de su deposito.</p>
    </article>
  `;

  const currentNode = challengeContent.querySelector("[data-current]");
  const progressNode = challengeContent.querySelector("[data-progress]");

  function renderSort() {
    const item = items[current];
    currentNode.innerHTML = item
      ? `<strong>${item.label}</strong><span>${current + 1}/${items.length}</span>`
      : "<strong>Todo ordenado</strong><span>OK</span>";
    progressNode.innerHTML = items.map((item, index) => `
      <span class="${sorted.has(index) ? "is-done" : index === current ? "is-current" : ""}">${item.label}</span>
    `).join("");
  }

  challengeContent.querySelectorAll("[data-bin]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = items[current];
      if (!item) return;
      if (button.dataset.bin !== item.target) {
        setMessage("Casi. Mira si la tarjeta habla de energia, herramienta o alerta.", "is-error");
        return;
      }
      sorted.add(current);
      current += 1;
      renderSort();
      if (sorted.size === items.length) {
        setMessage("Clasificacion completa. Separaste todas las tarjetas por regla.", "is-success");
        completeChallenge(id);
      } else {
        setMessage("Bien. Vamos con la siguiente tarjeta.", "is-good");
      }
    });
  });

  renderSort();
}

function renderSequenceMemoryChallenge(id = 1) {
  const sequence = ["azul", "amarillo", "azul", "rosa"];
  const labels = { azul: "Azul", amarillo: "Amarillo", rosa: "Rosa" };
  const input = [];

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Mira la secuencia de luces, memorizala y repetila en el mismo orden."))}
      <p class="challenge-note">Objetivo: observa el modelo y toca las luces de abajo en el mismo orden.</p>
      <div class="memory-sequence-layout">
        <div class="memory-sequence-preview" data-preview></div>
        <div class="memory-sequence-input" data-input></div>
        <div class="memory-sequence-options">
          ${Object.keys(labels).map((key) => `<button class="memory-light light-${key}" type="button" data-light="${key}">${labels[key]}</button>`).join("")}
        </div>
      </div>
      <div class="challenge-actions">
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Mira el modelo visible arriba y repetilo con las luces de colores.</p>
    </article>
  `;

  const preview = challengeContent.querySelector("[data-preview]");
  const inputNode = challengeContent.querySelector("[data-input]");

  function renderMemory() {
    preview.innerHTML = sequence.map((color, index) => `
      <span class="memory-dot light-${color}">${index + 1}</span>
    `).join("");
    inputNode.innerHTML = sequence.map((_, index) => `
      <span class="memory-dot ${input[index] ? `light-${input[index]}` : ""}">${input[index] ? index + 1 : "?"}</span>
    `).join("");
  }

  challengeContent.querySelectorAll("[data-light]").forEach((button) => {
    button.addEventListener("click", () => {
      if (input.length >= sequence.length) return;
      const color = button.dataset.light;
      input.push(color);
      renderMemory();
      const index = input.length - 1;
      if (color !== sequence[index]) {
        setMessage(`Revisa la luz ${index + 1}. Esa no coincide con el modelo.`, "is-error");
        return;
      }
      if (input.length === sequence.length) {
        if (!input.every((value, inputIndex) => value === sequence[inputIndex])) {
          setMessage("Hay una luz anterior que no coincide. Reinicia y probemos otra vez.", "is-error");
          return;
        }
        setMessage("Secuencia recordada. Muy buen trabajo de memoria y orden.", "is-success");
        completeChallenge(id);
      } else {
        setMessage("Bien. Sigue con la proxima luz.", "is-good");
      }
    });
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    input.length = 0;
    renderMemory();
    setMessage("Volvemos al inicio. Mira el modelo y repetilo otra vez.");
  });

  renderMemory();
}

function renderChooseCommandChallenge(id = 1) {
  const commands = {
    avanzar: { label: "Avanzar", icon: "⬆️" },
    derecha: { label: "Girar derecha", icon: "↪️" },
    izquierda: { label: "Girar izquierda", icon: "↩️" },
    esperar: { label: "Esperar", icon: "⏸️" },
  };
  const scenes = [
    {
      title: "Bateria al frente",
      text: "El robot ve una bateria justo adelante.",
      icon: "🔋",
      answer: "avanzar",
    },
    {
      title: "Pared adelante",
      text: "Hay una pared al frente y la salida queda a la derecha.",
      icon: "🧱",
      answer: "derecha",
    },
    {
      title: "Puerta cerrada",
      text: "La puerta esta cerrada. Primero conviene quedarse quieto.",
      icon: "🚪",
      answer: "esperar",
    },
    {
      title: "Camino a la izquierda",
      text: "El camino libre esta del lado izquierdo.",
      icon: "🟦",
      answer: "izquierda",
    },
  ];
  let sceneIndex = 0;
  const solved = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Mira la situacion y elige el comando que mejor ayuda al robot."))}
      <p class="challenge-note">Objetivo: resolver situaciones cortas. Lee la pista y toca una accion.</p>
      <div class="choose-command-layout">
        <div class="choose-command-scene" data-scene></div>
        <div class="choose-command-options">
          ${Object.entries(commands).map(([key, command]) => `
            <button type="button" data-command-choice="${key}">
              <span>${command.icon}</span>
              <strong>${command.label}</strong>
            </button>
          `).join("")}
        </div>
        <div class="choose-command-progress" data-progress></div>
      </div>
      <p class="challenge-message" data-message>Empecemos por la primera situacion.</p>
    </article>
  `;

  const sceneNode = challengeContent.querySelector("[data-scene]");
  const progressNode = challengeContent.querySelector("[data-progress]");

  function renderScene() {
    const scene = scenes[sceneIndex];
    sceneNode.innerHTML = `
      <span aria-hidden="true">${scene.icon}</span>
      <div>
        <strong>${scene.title}</strong>
        <p>${scene.text}</p>
      </div>
    `;
    progressNode.innerHTML = scenes.map((_, index) => `
      <span class="${index === sceneIndex ? "is-current" : ""} ${solved.has(index) ? "is-done" : ""}">${index + 1}</span>
    `).join("");
  }

  challengeContent.querySelectorAll("[data-command-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const scene = scenes[sceneIndex];
      if (button.dataset.commandChoice !== scene.answer) {
        setMessage("Casi. Mira de nuevo que tiene adelante o hacia donde queda el camino libre.", "is-error");
        return;
      }

      solved.add(sceneIndex);
      if (solved.size === scenes.length) {
        renderScene();
        setMessage("Muy bien. Elegiste el comando correcto en cada situacion.", "is-success");
        completeChallenge(id);
        return;
      }

      sceneIndex = scenes.findIndex((_, index) => !solved.has(index));
      renderScene();
      setMessage("Bien elegido. Vamos con otra situacion.", "is-good");
    });
  });

  renderScene();
}

function renderMatchingPairsChallenge(id = 1) {
  const cards = [
    { key: "forward", label: "Avanzar", icon: "⬆️" },
    { key: "right", label: "Derecha", icon: "↪️" },
    { key: "battery", label: "Bateria", icon: "🔋" },
    { key: "flag", label: "Meta", icon: "🏁" },
  ].flatMap((item) => [item, item]);
  const order = [0, 4, 1, 5, 2, 6, 3, 7].map((index) => cards[index]);
  let first = null;
  let locked = false;
  const matched = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Encuentra las parejas iguales de comandos y objetos del robot."))}
      <p class="challenge-note">Objetivo: toca dos tarjetas. Si son iguales, quedan abiertas.</p>
      <div class="mini-card-grid mini-card-grid-4" data-pairs>
        ${order.map((card, index) => `
          <button class="mini-flip-card" type="button" data-card="${index}" data-key="${card.key}" data-label="${card.label}" data-icon="${card.icon}">?</button>
        `).join("")}
      </div>
      <p class="challenge-message" data-message>Busca una pareja. Recuerda donde aparece cada dibujo.</p>
    </article>
  `;

  challengeContent.querySelectorAll("[data-card]").forEach((button) => {
    button.addEventListener("click", () => {
      if (locked) return;
      const index = Number(button.dataset.card);
      if (matched.has(index) || button.classList.contains("is-open")) return;
      button.classList.add("is-open");
      button.innerHTML = `<span>${button.dataset.icon}</span><strong>${button.dataset.label}</strong>`;

      if (!first) {
        first = button;
        return;
      }

      if (first.dataset.key === button.dataset.key) {
        matched.add(Number(first.dataset.card));
        matched.add(index);
        first.classList.add("is-matched");
        button.classList.add("is-matched");
        first = null;
        if (matched.size === order.length) {
          setMessage("Todas las parejas encontradas. Muy buena memoria visual.", "is-success");
          completeChallenge(id);
        } else {
          setMessage("Pareja encontrada. Vamos por otra.", "is-good");
        }
        return;
      }

      locked = true;
      setMessage("No son pareja. Mira bien y probamos otra vez.", "is-error");
      window.setTimeout(() => {
        first.classList.remove("is-open");
        button.classList.remove("is-open");
        first.textContent = "?";
        button.textContent = "?";
        first = null;
        locked = false;
      }, 700);
    });
  });
}

function renderBatteryCountChallenge(id = 1) {
  const scenes = [
    { batteries: [true, false, true, false], answer: 2 },
    { batteries: [true, true, false, true], answer: 3 },
    { batteries: [false, true, false, false], answer: 1 },
  ];
  let sceneIndex = 0;
  const solved = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Mira la fila de casilleros: algunos tienen bateria y otros estan vacios. Cuenta solo las baterias y toca el numero que indica cuantas hay."))}
      <p class="challenge-note">Objetivo: distinguir baterias de espacios vacios y elegir la cantidad correcta.</p>
      <div class="count-layout">
        <div class="count-row" data-count-row></div>
        <div class="count-options">
          ${[1, 2, 3, 4].map((num) => `<button type="button" data-count="${num}">${num}</button>`).join("")}
        </div>
        <div class="choose-command-progress" data-progress></div>
      </div>
      <p class="challenge-message" data-message>Cuenta las baterias con calma y despues toca el numero de la respuesta.</p>
    </article>
  `;

  const rowNode = challengeContent.querySelector("[data-count-row]");
  const progressNode = challengeContent.querySelector("[data-progress]");

  function renderScene() {
    const scene = scenes[sceneIndex];
    rowNode.innerHTML = scene.batteries.map((hasBattery) => `
      <span class="${hasBattery ? "has-battery" : ""}">${hasBattery ? "🔋" : "□"}</span>
    `).join("");
    progressNode.innerHTML = scenes.map((_, index) => `
      <span class="${index === sceneIndex ? "is-current" : ""} ${solved.has(index) ? "is-done" : ""}">${index + 1}</span>
    `).join("");
  }

  challengeContent.querySelectorAll("[data-count]").forEach((button) => {
    button.addEventListener("click", () => {
      const answer = Number(button.dataset.count);
      if (answer !== scenes[sceneIndex].answer) {
        setMessage("Casi. Señala con la vista cada bateria y vuelve a contar.", "is-error");
        return;
      }
      solved.add(sceneIndex);
      if (solved.size === scenes.length) {
        renderScene();
        setMessage("Conteo completo. El robot sabe cuanta energia tiene.", "is-success");
        completeChallenge(id);
        return;
      }
      sceneIndex = scenes.findIndex((_, index) => !solved.has(index));
      renderScene();
      setMessage("Correcto. Vamos con otra fila.", "is-good");
    });
  });

  renderScene();
}

function renderBatteryMazeChallenge(id = 1) {
  const route = ["5-5", "5-4", "4-4", "3-4", "3-3", "3-2", "2-2", "1-2", "1-1", "0-1"];
  const obstacles = new Set(["5-2", "4-0", "4-2", "4-5", "3-0", "2-4", "1-4", "0-3"]);
  const batteries = new Set(["4-4", "3-2", "1-1"]);
  const expected = [
    "Avanzar",
    "Girar der.",
    "Avanzar",
    "Avanzar",
    "Girar izq.",
    "Avanzar",
    "Avanzar",
    "Girar der.",
    "Avanzar",
    "Avanzar",
    "Girar izq.",
    "Avanzar",
    "Girar der.",
    "Avanzar",
  ];
  const commandOptions = ["Avanzar", "Girar der.", "Girar izq."];
  let selectedBlank = 0;
  let isAnimating = false;
  const cells = new Map();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "El robot empieza mirando hacia la izquierda. Arma la secuencia con Avanzar, Girar derecha y Girar izquierda para juntar las baterias y llegar a OK."))}
      <p class="challenge-note">Objetivo: usa comandos del robot, no flechas del mapa. Primero avanza a la izquierda y despues gira cuando cambie el camino.</p>
      <div class="visual-sequence-layout">
        <div class="robot-grid visual-map" data-map></div>
        ${renderCommandSequencePanel({
    stepsMarkup: expected.map((_, index) => `<button class="sequence-slot command-card ${index === 0 ? "is-selected" : ""}" type="button" data-blank="${index}"><span class="command-placeholder">${index + 1}</span></button>`).join(""),
    actionsMarkup: commandOptions.map((value) => renderCommandButton(value)).join(""),
    compact: true,
  })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Ejecutar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>El robot arranca abajo a la derecha mirando hacia la izquierda.</p>
    </article>
  `;

  const map = challengeContent.querySelector("[data-map]");
  const blanks = [...challengeContent.querySelectorAll("[data-blank]")];
  const checkButton = challengeContent.querySelector("[data-check]");
  const resetButton = challengeContent.querySelector("[data-reset]");

  function buildMap() {
    map.innerHTML = "";
    cells.clear();
    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const key = `${row}-${col}`;
        const cell = document.createElement("div");
        cell.className = "robot-cell";
        if (route.includes(key)) cell.classList.add("is-route");
        if (obstacles.has(key)) {
          cell.classList.add("is-obstacle");
          cell.textContent = "X";
        }
        if (batteries.has(key)) {
          cell.classList.add("is-treasure");
          cell.textContent = "🔋";
        }
        if (key === route[0]) {
          cell.classList.add("is-start");
          cell.textContent = "IN";
        }
        if (key === route[route.length - 1]) {
          cell.classList.add("is-goal");
          cell.textContent = "OK";
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
    route.slice(0, route.indexOf(key) + 1).forEach((routeKey) => cells.get(routeKey)?.classList.add("is-trail"));
    const robotCell = cells.get(key);
    if (robotCell) {
      robotCell.classList.add("is-robot");
      robotCell.innerHTML = renderRobotMarker(directionForRouteKey(route, key));
    }
  }

  async function animate(routeLimit = route.length - 1) {
    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;
    for (const key of route.slice(0, routeLimit + 1)) {
      paintRobot(key);
      await new Promise((resolve) => setTimeout(resolve, 190));
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
      target.innerHTML = renderCommand(button.dataset.value);
      target.dataset.value = button.dataset.value;
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
    const issueIndex = blanks.findIndex((blank, index) => blank.dataset.value !== expected[index]);
    blanks.forEach((blank, index) => blank.classList.toggle("is-wrong", index === issueIndex));
    if (issueIndex !== -1) {
      selectedBlank = issueIndex;
      blanks.forEach((blank, index) => blank.classList.toggle("is-selected", index === issueIndex));
      const routeLimit = countAdvancesBefore(expected, issueIndex);
      setMessage("Ese comando no sigue el camino seguro. Revisa si toca avanzar o girar.", "is-error");
      animate(routeLimit);
      return;
    }
    setMessage("Ruta lista. El robot va a recoger las baterias.", "is-good");
    animate().then(() => {
      setMessage("Laberinto superado y baterias recogidas.", "is-success");
      completeChallenge(id);
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
    buildMap();
    paintRobot(route[0]);
    setMessage("Nuevo intento. Usa avanzar y girar para seguir el camino seguro.");
  });

  buildMap();
  paintRobot(route[0]);
}

function renderMirrorPatternChallenge(id = 1) {
  const left = ["🔋", "⭐", "🔑", "🏁"];
  const answer = [...left].reverse();
  const filled = Array(answer.length).fill(null);
  let selected = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Completa el lado derecho como si fuera un espejo del patron."))}
      <p class="challenge-note">Objetivo: el primer espacio de la derecha copia el ultimo dibujo de la izquierda.</p>
      <div class="mirror-layout">
        <div class="mirror-row">
          ${left.map((item) => `<span>${item}</span>`).join("")}
          <strong>|</strong>
          ${answer.map((_, index) => `<button type="button" class="${index === 0 ? "is-selected" : ""}" data-mirror="${index}">?</button>`).join("")}
        </div>
        <div class="mirror-options">
          ${left.map((item) => `<button type="button" data-token="${item}">${item}</button>`).join("")}
        </div>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Mira el espejo: el orden se da vuelta.</p>
    </article>
  `;

  const blanks = [...challengeContent.querySelectorAll("[data-mirror]")];
  blanks.forEach((blank) => {
    blank.addEventListener("click", () => {
      blanks.forEach((item) => item.classList.remove("is-selected"));
      blank.classList.add("is-selected");
      selected = Number(blank.dataset.mirror);
    });
  });

  challengeContent.querySelectorAll("[data-token]").forEach((button) => {
    button.addEventListener("click", () => {
      filled[selected] = button.dataset.token;
      blanks[selected].textContent = button.dataset.token;
      blanks[selected].classList.remove("is-wrong");
      const next = filled.findIndex((item) => !item);
      blanks.forEach((item) => item.classList.remove("is-selected"));
      selected = next === -1 ? selected : next;
      blanks[selected].classList.add("is-selected");
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    const firstWrong = filled.findIndex((item, index) => item !== answer[index]);
    blanks.forEach((blank, index) => blank.classList.toggle("is-wrong", index === firstWrong));
    if (firstWrong !== -1) {
      setMessage("Casi. Recuerda que el espejo invierte el orden.", "is-error");
      return;
    }
    setMessage("Espejo completo. Encontraste el patron invertido.", "is-success");
    completeChallenge(id);
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    filled.fill(null);
    blanks.forEach((blank, index) => {
      blank.textContent = "?";
      blank.classList.remove("is-wrong");
      blank.classList.toggle("is-selected", index === 0);
    });
    selected = 0;
    setMessage("Volvemos a empezar. El lado derecho va al reves.");
  });
}

function renderEventActionChallenge(id = 1) {
  const scenes = [
    { event: "Si ves bateria", icon: "🔋", answer: "tomar", action: "Tomar" },
    { event: "Si ves agua", icon: "💧", answer: "saltar", action: "Saltar" },
    { event: "Si ves bandera", icon: "🏁", answer: "parar", action: "Parar" },
    { event: "Si ves pared", icon: "🧱", answer: "girar", action: "Girar" },
  ];
  let current = 0;
  const done = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Elige que accion debe hacer el robot cuando aparece cada evento."))}
      <p class="challenge-note">Objetivo: unir una condicion simple con una accion.</p>
      <div class="event-layout">
        <div class="event-card" data-event></div>
        <div class="event-options">
          ${["Tomar", "Saltar", "Parar", "Girar"].map((label) => `<button type="button" data-event-action="${label.toLowerCase()}">${label}</button>`).join("")}
        </div>
        <div class="choose-command-progress" data-progress></div>
      </div>
      <p class="challenge-message" data-message>Lee el evento y elige la accion que corresponde.</p>
    </article>
  `;

  const eventNode = challengeContent.querySelector("[data-event]");
  const progressNode = challengeContent.querySelector("[data-progress]");

  function renderEvent() {
    const scene = scenes[current];
    eventNode.innerHTML = `<span>${scene.icon}</span><strong>${scene.event}</strong>`;
    progressNode.innerHTML = scenes.map((_, index) => `<span class="${index === current ? "is-current" : ""} ${done.has(index) ? "is-done" : ""}">${index + 1}</span>`).join("");
  }

  challengeContent.querySelectorAll("[data-event-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.eventAction !== scenes[current].answer) {
        setMessage("Casi. Piensa que necesita hacer el robot con ese objeto.", "is-error");
        return;
      }
      done.add(current);
      if (done.size === scenes.length) {
        renderEvent();
        setMessage("Eventos resueltos. Ya armaste reglas si-entonces simples.", "is-success");
        completeChallenge(id);
        return;
      }
      current = scenes.findIndex((_, index) => !done.has(index));
      renderEvent();
      setMessage("Correcto. Vamos con otro evento.", "is-good");
    });
  });

  renderEvent();
}

function renderOddOneOutChallenge(id = 1) {
  const scenes = [
    { items: ["⬆️", "⬆️", "⬆️", "↪️"], answer: 3 },
    { items: ["🔋", "🔋", "⭐", "🔋"], answer: 2 },
    { items: ["💧", "💧", "🧱", "💧"], answer: 2 },
  ];
  let current = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Encuentra la tarjeta intrusa que rompe el grupo."))}
      <p class="challenge-note">Objetivo: tocar el dibujo que es distinto a los demas.</p>
      <div class="mini-card-grid mini-card-grid-4" data-odd></div>
      <p class="challenge-message" data-message>Busca el elemento que no pertenece al grupo.</p>
    </article>
  `;

  const oddNode = challengeContent.querySelector("[data-odd]");

  function renderOdd() {
    oddNode.innerHTML = scenes[current].items.map((item, index) => `<button class="mini-choice-card" type="button" data-odd="${index}">${item}</button>`).join("");
    oddNode.querySelectorAll("[data-odd]").forEach((button) => {
      button.addEventListener("click", () => {
        if (Number(button.dataset.odd) !== scenes[current].answer) {
          setMessage("Ese se parece a los demas. Busca el diferente.", "is-error");
          return;
        }
        current += 1;
        if (current >= scenes.length) {
          setMessage("Intrusos encontrados. Muy buena comparacion.", "is-success");
          completeChallenge(id);
          return;
        }
        renderOdd();
        setMessage("Correcto. Ahora busca el intruso del nuevo grupo.", "is-good");
      });
    });
  }

  renderOdd();
}

function renderSymbolCodeChallenge(id = 1) {
  const clues = [
    { icon: "🔋", count: 2 },
    { icon: "⭐", count: 1 },
    { icon: "🔑", count: 3 },
  ];
  const code = clues.map((item) => item.count).join("");
  let input = "";

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Cuenta los simbolos y arma el codigo del robot."))}
      <p class="challenge-note">Objetivo: cada grupo da un numero del codigo.</p>
      <div class="symbol-code-layout">
        <div class="symbol-clues">
          ${clues.map((clue) => `<span>${Array.from({ length: clue.count }, () => clue.icon).join("")}</span>`).join("")}
        </div>
        <div class="lock-display" data-display>___</div>
        <div class="lock-pad">
          ${[1, 2, 3, 4, 5, 6].map((num) => `<button type="button" data-num="${num}">${num}</button>`).join("")}
        </div>
      </div>
      <div class="challenge-actions">
        <button class="secondary-action" type="button" data-reset>Borrar</button>
      </div>
      <p class="challenge-message" data-message>Cuenta cada grupo de izquierda a derecha.</p>
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
          setMessage("Codigo correcto. Contaste los simbolos en orden.", "is-success");
          completeChallenge(id);
        } else {
          setMessage("Ese codigo no coincide. Borra y vuelve a contar los grupos.", "is-error");
        }
      }
    });
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    input = "";
    renderDisplay();
    setMessage("Codigo limpio. Cuenta otra vez.");
  });
}

function renderColorRouteChallenge(id = 1) {
  const tiles = [
    { key: "0-0", color: "rosa" },
    { key: "0-1", color: "verde", step: 4 },
    { key: "0-2", color: "azul", step: 5 },
    { key: "1-0", color: "verde", step: 2 },
    { key: "1-1", color: "rosa", step: 3 },
    { key: "1-2", color: "verde" },
    { key: "2-0", color: "azul", step: 1 },
    { key: "2-1", color: "azul" },
    { key: "2-2", color: "rosa" },
  ];
  const routeLength = tiles.filter((tile) => tile.step).length;
  let nextStep = 1;
  const completed = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Busca las baldosas numeradas y toca el camino en orden: 1, 2, 3, 4 y 5."))}
      <p class="challenge-note">Objetivo: seguir una ruta en una grilla usando los numeros como guia.</p>
      <div class="color-route-layout">
        <div class="color-route-grid" data-route-grid>
          ${tiles.map((tile) => `
            <button class="route-color-${tile.color}" type="button" data-step="${tile.step || ""}" data-tile="${tile.key}">
              ${tile.step || ""}
            </button>
          `).join("")}
        </div>
        <div class="choose-command-progress" data-progress></div>
      </div>
      <div class="challenge-actions">
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Empieza por la baldosa 1 y sigue hasta la 5.</p>
    </article>
  `;

  const progressNode = challengeContent.querySelector("[data-progress]");

  function renderRoute() {
    challengeContent.querySelectorAll("[data-tile]").forEach((button) => {
      const step = Number(button.dataset.step);
      button.classList.toggle("is-done", completed.has(step));
      button.classList.toggle("is-next", step === nextStep);
      button.classList.remove("is-wrong");
    });
    progressNode.innerHTML = Array.from({ length: routeLength }, (_, index) => {
      const step = index + 1;
      return `<span class="${step === nextStep ? "is-current" : ""} ${completed.has(step) ? "is-done" : ""}">${step}</span>`;
    }).join("");
  }

  challengeContent.querySelectorAll("[data-tile]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.step);
      if (!step || completed.has(step)) return;
      if (step !== nextStep) {
        button.classList.add("is-wrong");
        setMessage(`Todavia no toca esa baldosa. Busca primero el numero ${nextStep}.`, "is-error");
        return;
      }
      completed.add(step);
      nextStep += 1;
      renderRoute();
      if (completed.size === routeLength) {
        setMessage("Ruta completa. Seguiste las baldosas numeradas en orden.", "is-success");
        completeChallenge(id);
      } else {
        setMessage(`Bien. Ahora busca la baldosa ${nextStep}.`, "is-good");
      }
    });
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    nextStep = 1;
    completed.clear();
    renderRoute();
    setMessage("Ruta limpia. Empieza otra vez por la baldosa 1.");
  });

  renderRoute();
}

function renderSizeOrderChallenge(id = 1) {
  const sizes = [
    { id: "small", label: "Chica", icon: "🔋", order: 0 },
    { id: "medium", label: "Mediana", icon: "🔋", order: 1 },
    { id: "large", label: "Grande", icon: "🔋", order: 2 },
  ];
  const bank = [sizes[1], sizes[2], sizes[0]];
  const placed = [];

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Ordena las baterias de chica a grande."))}
      <p class="challenge-note">Objetivo: tocar las tarjetas en orden creciente.</p>
      <div class="size-order-layout">
        <div class="size-bank" data-size-bank></div>
        <div class="size-slots" data-size-slots></div>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Primero la chica, despues la mediana y al final la grande.</p>
    </article>
  `;

  const bankNode = challengeContent.querySelector("[data-size-bank]");
  const slotsNode = challengeContent.querySelector("[data-size-slots]");

  function renderSize() {
    const used = new Set(placed.map((item) => item.id));
    bankNode.innerHTML = bank.map((item) => `
      <button class="size-card size-${item.id}" type="button" data-size="${item.id}" ${used.has(item.id) ? "disabled" : ""}>
        <span>${item.icon}</span><strong>${item.label}</strong>
      </button>
    `).join("");
    slotsNode.innerHTML = [0, 1, 2].map((_, index) => `
      <span>${placed[index] ? placed[index].label : index + 1}</span>
    `).join("");
    bankNode.querySelectorAll("[data-size]").forEach((button) => {
      button.addEventListener("click", () => {
        if (placed.length >= 3) return;
        placed.push(sizes.find((item) => item.id === button.dataset.size));
        renderSize();
      });
    });
  }

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    if (placed.length < 3) {
      setMessage("Faltan baterias por ordenar.", "is-error");
      return;
    }
    if (placed.every((item, index) => item.order === index)) {
      setMessage("Orden correcto. Las baterias quedaron de chica a grande.", "is-success");
      completeChallenge(id);
    } else {
      setMessage("Casi. Mira el tamaño de cada bateria y vuelve a ordenar.", "is-error");
    }
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    placed.length = 0;
    renderSize();
    setMessage("Volvemos a ordenar de chica a grande.");
  });

  renderSize();
}

function renderFindBugChallenge(id = 1) {
  const program = [
    { label: "Avanzar", icon: "⬆️", bug: false },
    { label: "Avanzar", icon: "⬆️", bug: false },
    { label: "Girar izquierda", icon: "↩️", bug: true },
    { label: "Avanzar", icon: "⬆️", bug: false },
  ];

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Encuentra la tarjeta que rompe el programa del robot."))}
      <p class="challenge-note">Objetivo: el robot necesitaba girar a la derecha, pero hay un bug escondido.</p>
      <div class="bug-program">
        ${program.map((step, index) => `
          <button type="button" data-bug="${step.bug}" data-index="${index}">
            <span>${step.icon}</span>
            <strong>${index + 1}. ${step.label}</strong>
          </button>
        `).join("")}
      </div>
      <p class="challenge-message" data-message>Lee las tarjetas y toca la que parece incorrecta.</p>
    </article>
  `;

  challengeContent.querySelectorAll("[data-bug]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.bug !== "true") {
        button.classList.add("is-wrong");
        setMessage("Esa tarjeta ayuda al robot. Busca el giro que va para el lado equivocado.", "is-error");
        return;
      }
      button.classList.add("is-correct");
      button.innerHTML = "<span>↪️</span><strong>3. Girar derecha</strong>";
      setMessage("Bug encontrado y corregido. Ahora el programa mira hacia la salida.", "is-success");
      completeChallenge(id);
    });
  });
}

function renderEnergySwitchesChallenge(id = 1) {
  const target = [true, false, true, true, false];
  const state = [false, false, false, false, false];

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Copia el tablero de energia: prende solo los switches que coinciden con las luces de arriba."))}
      <p class="challenge-note">Objetivo: compara arriba y abajo. Cada switch cambia entre prendido y apagado.</p>
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
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Prende abajo los mismos lugares que estan prendidos arriba.</p>
    </article>
  `;

  function renderSwitches() {
    challengeContent.querySelectorAll("[data-switch]").forEach((button, index) => {
      button.classList.toggle("is-on", state[index]);
    });
  }

  challengeContent.querySelectorAll("[data-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.switch);
      state[index] = !state[index];
      renderSwitches();
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    if (state.every((value, index) => value === target[index])) {
      setMessage("Tablero copiado. La energia quedo sincronizada.", "is-success");
      completeChallenge(id);
      return;
    }
    setMessage("Todavia no coincide. Compara cada lugar de izquierda a derecha.", "is-error");
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    state.fill(false);
    renderSwitches();
    setMessage("Switches apagados. Vuelve a copiar el patron de arriba.");
  });

  renderSwitches();
}

function renderPatternChallengeV2(id = 4) {
  const scenes = [
    {
      title: "Camino de baldosas",
      theme: "tiles",
      hint: "Mira el ritmo del piso: azul, azul y amarilla.",
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
      hint: "Mira el ritmo del robot: avanzar, avanzar y girar.",
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
    "cmd-turn": "Girar der.",
    "cmd-jump": "Saltar",
  };
  const commandItems = {
    "cmd-forward": "Avanzar",
    "cmd-turn": "Girar der.",
    "cmd-jump": "Saltar",
    "turn-right": "Girar der.",
    "turn-left": "Girar izq.",
  };
  let sceneIndex = 0;
  let selectedBlank = 0;
  const completedScenes = new Set();

  function itemMarkup(kind) {
    if (commandItems[kind]) {
      return `<span class="pattern-item kind-${kind} command-pattern-item">${renderCommand(commandItems[kind])}</span>`;
    }

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
        ${renderChallengeHeader(`desafío ${id}`, challengeTitles[id] || scene.title, scene.hint)}
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
        setMessage("Faltan espacios por completar. Agregalos y vemos como queda.", "is-error");
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
        setMessage("Buen intento. Mira el bloque modelo y prueba otra pieza en la tarjeta marcada.", "is-error");
        return;
      }

      blanks.forEach((blank) => blank.classList.add("is-correct"));
      completedScenes.add(sceneIndex);
      setMessage(`Escena ${sceneIndex + 1} resuelta. Muy buen trabajo detectando el patron.`, "is-success");

      if (completedScenes.size === scenes.length) {
        completeChallenge(id);
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

function renderCoordinatesChallenge(id = 5) {
  const objects = [
    { id: "inicio", label: "Inicio", icon: "🏁", target: "B2" },
    { id: "bateria", label: "Batería", icon: "🔋", target: "D2" },
    { id: "llave", label: "Recarga de energía", icon: "⚡", target: "D5" },
    { id: "meta", label: "Bandera", icon: "🏁", target: "F5" },
  ];
  let selected = objects[0].id;
  const placed = {};

  challengeContent.innerHTML = `
    <article class="challenge-card challenge-card-coords">
      ${renderHeader(id, getChallengeInstruction(id, "Ubica puntos del mapa para planear la ruta del robot desde inicio hasta la bandera 🏁."))}
      <div class="coord-layout">
        <div class="coord-bank"></div>
        <div class="coord-grid"></div>
      </div>
      <p class="challenge-message" data-message>Empecemos por el inicio: ubicalo en B2.</p>
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
        setMessage(`Ahora busca ${object.label}: va en ${object.target}.`);
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
          cell.classList.add("has-object", `object-${placedObject.id}`);
          cell.textContent = placedObject.icon;
        }
        cell.addEventListener("click", () => {
          const object = objects.find((item) => item.id === selected);
          if (coord !== object.target) {
            setMessage(`Casi. ${object.label} va en ${object.target}; busca esa coordenada en el mapa.`, "is-error");
            return;
          }
          placed[object.id] = coord;
          cell.classList.add("has-object", `object-${object.id}`);
          cell.textContent = object.icon;
          const next = objects.find((item) => !placed[item.id]);
          if (next) {
            selected = next.id;
            renderBank();
            renderGrid();
            setMessage(`Muy bien. Ya quedo ese punto; ahora ubica ${next.label} en ${next.target}.`, "is-good");
          } else {
            renderBank();
            renderGrid();
            setMessage("Mapa completo. Planeaste toda la ruta del robot.", "is-success");
            completeChallenge(id);
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
  return renderChallengeHeader(`Nivel ${level}`, title, instruction);
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
      setMessage("Todavia quedan espacios vacios. Completalos y lo probamos.", "is-error");
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
      setMessage("Buen intento. La tarjeta marcada no sigue el patron; mira el modelo otra vez.", "is-error");
      return;
    }
    blanks.forEach((blank) => blank.classList.add("is-correct"));
    setMessage("Patron completo. Muy buen ojo para encontrar la repeticion.", "is-success");
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
    hint: "Mira el ritmo de luces: verde, verde y rojo.",
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
      ${renderLevelHeader("Fabrica de cajas", "Clasifica cada caja en el deposito del mismo color.")}
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
      <p class="challenge-message" data-message>Mira la caja marcada y llevala al deposito del mismo color.</p>
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
        setMessage("Casi. Esa caja necesita el deposito de su mismo color.", "is-error");
        return;
      }
      sorted.add(current);
      current += 1;
      renderFactory();
      if (sorted.size === items.length) {
        setMessage("Todas las cajas quedaron ordenadas. Excelente trabajo de clasificacion.", "is-success");
        completeChallenge(1);
      } else {
        setMessage("Bien hecho. Vamos con la siguiente caja.", "is-good");
      }
    });
  });
}

function renderLevel8Circuit() {
  const target = [true, false, true, true];
  const state = [false, false, false, false];

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderLevelHeader("Circuito de energia", "Activa los switches para copiar el patron de luces objetivo.")}
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
      <p class="challenge-message" data-message>Enciende los switches para copiar las luces de arriba.</p>
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
      setMessage("Circuito encendido. Copiaste el patron perfecto.", "is-success");
      completeChallenge(1);
    } else {
      setMessage("Todavia no coincide. Mira las luces de arriba y prueba otro switch.", "is-error");
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
      ${renderLevelHeader("Memoria de pares", "Encuentra los pares iguales.")}
      <div class="memory-grid">
        ${cards.map((card, index) => `<button class="memory-card" type="button" data-card="${index}" data-value="${card}">?</button>`).join("")}
      </div>
      <p class="challenge-message" data-message>Da vuelta dos cartas y busca las parejas iguales.</p>
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
          setMessage("Encontraste todos los pares. Memoria de campeon.", "is-success");
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
      ${renderLevelHeader("Candado final", "Lee las columnas y marca el codigo correcto.")}
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
      <p class="challenge-message" data-message>Cada columna te da un numero del codigo.</p>
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
          setMessage("Candado abierto. Completaste el nivel final, gran trabajo.", "is-success");
          completeChallenge(1);
        } else {
          setMessage("Casi. Ese codigo no coincide con las columnas; vuelve a contar con calma.", "is-error");
        }
      }
    });
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    input = "";
    renderDisplay();
    setMessage("Codigo limpio. Mira cada columna y vuelve a intentarlo.");
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
