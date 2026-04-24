const params = new URLSearchParams(window.location.search);
const requestedLevel = Number(params.get("nivel"));
const level = Number.isInteger(requestedLevel) && requestedLevel >= 4 && requestedLevel <= 10 ? requestedLevel : 4;

const challengeContent = document.querySelector("#challenge-content");
const challengeShell = document.querySelector(".challenge-shell");
const selectorWrap = document.querySelector(".selector-wrap");
const selectorButtons = [...document.querySelectorAll(".selector-chip")];

document.querySelectorAll("[data-current-level]").forEach((node) => {
  node.textContent = String(level);
});

document.title = `Be Tech | Nivel ${level}`;

const challengeTitles = {
  1: "Camino del robot",
  2: "Depura el programa",
  3: "Programa al robot",
  4: "Patrones de algoritmo",
  5: "Mision mapa del robot",
};

selectorButtons.forEach((button) => {
  const challengeId = Number(button.dataset.challenge);

  if (level !== 4 || challengeId > 5) {
    button.classList.add("is-disabled");
    button.setAttribute("aria-disabled", "true");
  }

  button.addEventListener("click", () => {
    if (level !== 4 || challengeId > 5) {
      showLocked(challengeId);
      return;
    }

    selectorButtons.forEach((chip) => chip.classList.remove("is-active"));
    button.classList.add("is-active");
    openChallenge(challengeId);
  });
});

function openChallenge(id) {
  challengeShell?.classList.add("is-open");

  if (id === 1) renderPathChallenge();
  if (id === 2) renderBalanceChallenge();
  if (id === 3) renderRobotChallenge();
  if (id === 4) renderPatternChallenge();
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

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(1, "Mira el camino celeste y completa los giros para que el robot vaya desde INICIO hasta META.")}
      <div class="path-layout">
        <div class="path-map" data-path-map></div>
        <div>
          <div class="sequence-track" data-track>
            ${steps.map((step, index) => step
    ? `<span class="sequence-slot">${step}</span>`
    : `<button class="sequence-slot ${index === selectedBlank ? "is-selected" : ""}" type="button" data-blank="${index}">Elegir accion</button>`).join("")}
          </div>
          <div class="instruction-bank">
            <button class="instruction-chip" type="button">Girar der.</button>
            <button class="instruction-chip" type="button">Girar izq.</button>
            <button class="instruction-chip" type="button">Saltar</button>
            <button class="instruction-chip" type="button">Repetir</button>
          </div>
        </div>
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
    robotCell.textContent = "🤖";
  }

  async function runRobotAnimation() {
    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;

    for (const key of routePath) {
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
      target.textContent = button.textContent;
      target.dataset.value = button.textContent;
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

    if (blanks.some((blank) => !blank.dataset.value)) {
      setMessage("Completa los tres pasos faltantes antes de comprobar.", "is-error");
      return;
    }

    const isOk = blanks.every((blank) => blank.dataset.value === expected[Number(blank.dataset.blank)]);
    if (isOk) {
      setMessage("Muy bien. Mira como el robot recorre el camino.", "is-good");
      runRobotAnimation().then(() => {
        setMessage("Excelente. El robot sigue el camino y llega a la meta.", "is-success");
      });
      return;
    }

    const wrong = blanks.find((blank) => blank.dataset.value !== expected[Number(blank.dataset.blank)]);
    const stepNumber = Number(wrong.dataset.blank) + 1;
    setMessage(`Ajusta el paso ${stepNumber}: ese giro no coincide con el camino.`, "is-error");
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    if (isAnimating) return;
    blanks.forEach((blank, index) => {
      blank.textContent = "Elegir accion";
      delete blank.dataset.value;
      blank.classList.toggle("is-selected", index === 0);
    });
    paintRobot(routePath[0]);
    selectedBlank = Number(blanks[0].dataset.blank);
    setMessage("Completa los pasos 3, 6 y 9 para seguir el camino celeste.");
  });
}

function renderBalanceChallenge() {
  const originalProgram = ["Avanzar", "Avanzar", "Girar der.", "Girar izq.", "Avanzar"];
  const fixedStep = 3;
  const expectedFix = "Girar der.";
  const start = { row: 5, col: 1, dir: 0 };
  const goal = { row: 4, col: 1 };
  const obstacle = new Set(["2-1"]);
  const dirs = ["N", "E", "S", "O"];
  let program = [...originalProgram];
  let selectedLine = fixedStep;

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(2, "Usa el mapa de referencia. El robot debe evitar el bloque rojo y terminar en META. Corrige la linea equivocada.")}
      <div class="debug-layout">
        <div class="debug-map" data-debug-map></div>
        <div>
          <div class="debug-list" data-debug-list></div>
          <div class="debug-options">
            <button type="button">Avanzar</button>
            <button type="button">Girar der.</button>
            <button type="button">Girar izq.</button>
            <button type="button">Saltar</button>
          </div>
        </div>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>Comprobar</button>
        <button class="secondary-action" type="button" data-reset>Reiniciar</button>
      </div>
      <p class="challenge-message" data-message>Pista: mira en el mapa en que paso toca el bloque rojo.</p>
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

  function renderMap(result) {
    debugMap.innerHTML = "";
    const trailSet = new Set(result.trail);
    const robotKey = keyOf(result.robot.row, result.robot.col);

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
          cell.textContent = dirs[result.robot.dir];
        }

        debugMap.append(cell);
      }
    }
  }

  function renderProgram() {
    debugList.innerHTML = program.map((step, index) => `
      <button class="debug-line ${index === selectedLine ? "is-selected" : ""}" type="button" data-line="${index}">
        <strong>${index + 1}.</strong> ${step}
      </button>
    `).join("");

    debugList.querySelectorAll("[data-line]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedLine = Number(button.dataset.line);
        renderProgram();
      });
    });

    renderMap(simulateProgram());
  }

  challengeContent.querySelectorAll(".debug-options button").forEach((button) => {
    button.addEventListener("click", () => {
      program[selectedLine] = button.textContent;
      renderProgram();
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    const result = simulateProgram();
    renderMap(result);

    if (result.ok && program[fixedStep] === expectedFix) {
      setMessage("Muy bien. El robot evita el bloque rojo y termina en META.", "is-success");
      return;
    }

    if (result.reason === "obstacle") {
      setMessage(`Ahora se ve el error: en el paso ${result.failedStep} el robot toca el bloque rojo.`, "is-error");
      return;
    }

    if (result.reason === "out") {
      setMessage(`En el paso ${result.failedStep} el robot se sale del tablero.`, "is-error");
      return;
    }

    setMessage("No llega a META. Revisa la linea 4 y compara con el mapa.", "is-error");
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    program = [...originalProgram];
    selectedLine = fixedStep;
    renderProgram();
    setMessage("Pista: mira en el mapa en que paso toca el bloque rojo.");
  });

  renderProgram();
}

function renderRobotChallenge() {
  const start = { row: 5, col: 0, dir: 1 };
  const treasure = { row: 1, col: 4 };
  const obstacles = new Set(["4-2", "3-2", "2-2", "2-3"]);
  let program = [];
  let robot = { ...start };
  const dirs = ["N", "E", "S", "O"];

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(3, "Arma instrucciones para que el robot llegue al tesoro sin chocar.")}
      <div class="robot-layout">
        <div class="robot-grid"></div>
        <div class="program-panel">
          <div class="command-bank">
            <button type="button" data-command="F">Avanzar</button>
            <button type="button" data-command="L">Girar izq.</button>
            <button type="button" data-command="R">Girar der.</button>
          </div>
          <div class="program-list" data-program></div>
          <div class="challenge-actions">
            <button class="primary-action" type="button" data-run>Ejecutar</button>
            <button class="secondary-action" type="button" data-clear>Limpiar</button>
          </div>
          <p class="challenge-message" data-message>Pista: avanza, gira y rodea los bloques azules.</p>
        </div>
      </div>
    </article>
  `;

  const grid = challengeContent.querySelector(".robot-grid");
  const programNode = challengeContent.querySelector("[data-program]");

  function cellKey(row, col) {
    return `${row}-${col}`;
  }

  function renderGrid() {
    grid.innerHTML = "";
    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const cell = document.createElement("div");
        cell.className = "robot-cell";
        if (obstacles.has(cellKey(row, col))) cell.classList.add("is-obstacle");
        if (row === treasure.row && col === treasure.col) cell.textContent = "★";
        if (row === robot.row && col === robot.col) {
          cell.classList.add("is-robot");
          cell.textContent = dirs[robot.dir];
        }
        grid.append(cell);
      }
    }
  }

  function renderProgram() {
    programNode.innerHTML = program.length ? program.map((cmd, index) => `<span>${index + 1}. ${cmd}</span>`).join("") : "<em>Sin instrucciones</em>";
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
    }
    return true;
  }

  challengeContent.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      program.push(button.dataset.command);
      renderProgram();
    });
  });

  challengeContent.querySelector("[data-clear]").addEventListener("click", () => {
    program = [];
    robot = { ...start };
    renderGrid();
    renderProgram();
    setMessage("Programa limpio. Vuelve a intentarlo.");
  });

  challengeContent.querySelector("[data-run]").addEventListener("click", () => {
    robot = { ...start };
    for (const command of program) {
      const ok = step(command);
      if (!ok) {
        renderGrid();
        setMessage("El robot choco. Revisa el bloque donde cambia el camino.", "is-error");
        return;
      }
    }
    renderGrid();
    if (robot.row === treasure.row && robot.col === treasure.col) {
      setMessage("Tesoro encontrado. Tu algoritmo funciona.", "is-success");
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
      ${renderHeader(4, "Completa el patron de comandos repetido: Avanzar, Avanzar, Girar der.")}
      <div class="pattern-row">
        <span>Avanzar</span><span>Avanzar</span><span>Girar der.</span>
        <button type="button" class="pattern-blank is-selected" data-blank="0">?</button>
        <span>Avanzar</span>
        <button type="button" class="pattern-blank" data-blank="1">?</button>
        <span>Girar der.</span>
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
      const next = blanks.find((blank) => !blank.dataset.value);
      blanks.forEach((item) => item.classList.remove("is-selected"));
      if (next) {
        next.classList.add("is-selected");
        selectedBlank = Number(next.dataset.blank);
      }
    });
  });

  challengeContent.querySelector("[data-check]").addEventListener("click", () => {
    const values = blanks.map((blank) => blank.dataset.value);
    if (values.every((value, index) => value === answers[index])) {
      blanks.forEach((blank) => blank.classList.add("is-correct"));
      setMessage("Perfecto. Reconociste el patron del algoritmo.", "is-success");
    } else {
      setMessage("Todavia no. Busca que comando se repite cada tres pasos.", "is-error");
    }
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    blanks.forEach((blank, index) => {
      blank.textContent = "?";
      delete blank.dataset.value;
      blank.classList.toggle("is-selected", index === 0);
      blank.classList.remove("is-correct");
    });
    selectedBlank = 0;
    setMessage("Pista: se repite el bloque Avanzar, Avanzar, Girar der.");
  });
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
    <article class="challenge-card">
      ${renderHeader(5, "Ubica puntos del mapa para planear la ruta del robot desde inicio hasta la meta.")}
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
          }
        });
        grid.append(cell);
      }
    }
  }

  renderBank();
  renderGrid();
}

if (level === 4) {
  openChallenge(1);
}
