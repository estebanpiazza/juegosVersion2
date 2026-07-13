// Editor local de bloques.
const SCRATCH_LOCAL_EDITOR = "scratch-editor/build/index.html";
const EDITOR_BUILD_REV = "20260707-3";

const SCRATCH_NIVELES = {
  7: {
    nivelTitle: "Nivel 7",
    desafios: [
      {
        title: "Mision de bloques",
        objectiveTitle: "Programa a Nano",
        objective:
          "Abri el proyecto y programa a Nano para que llegue a la estacion de carga usando una secuencia de movimientos.",
        concept: "Secuencia",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Giros en la manta",
        objectiveTitle: "Lleva a Nano por la curva",
        objective:
          "Usa bloques de movimiento y giro para que Nano cambie de direccion y llegue a la meta por un camino con curvas.",
        concept: "Giros y direccion",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Repite el camino",
        objectiveTitle: "Usa un bucle",
        objective:
          "En lugar de repetir los mismos bloques, usa un bloque 'repetir' para acortar tu programa y hacerlo mas eficiente.",
        concept: "Bucles (repeticion)",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Toma de decisiones",
        objectiveTitle: "Si o no",
        objective:
          "Usa bloques 'si... entonces' para que Nano reaccione a lo que encuentra en el camino y tome decisiones.",
        concept: "Condicionales",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Proyecto Nano 7",
        objectiveTitle: "Tu mision propia",
        objective:
          "Usa todo lo aprendido en el nivel 7 —secuencias, giros, bucles y condicionales— para crear tu propia mision con Nano.",
        concept: "Proyecto integrador N7",
        starterFile: "scratch/nano-starter.sb3",
      },
    ],
  },
  8: {
    nivelTitle: "Nivel 8",
    desafios: [
      {
        title: "Primera variable",
        objectiveTitle: "Conta la energia de Nano",
        objective:
          "Crea una variable 'energia'. Cada vez que Nano toca un item de energia, suma 1 al contador.",
        concept: "Variables",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Marcador en pantalla",
        objectiveTitle: "Muestra el puntaje",
        objective:
          "Usa la variable 'puntaje' para mostrar en pantalla cuantos puntos lleva Nano en tiempo real.",
        concept: "Variables visibles",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Datos del mundo",
        objectiveTitle: "Temperatura y estado",
        objective:
          "Crea variables para registrar el estado del ambiente de Nano: temperatura, bateria y estado del camino.",
        concept: "Multiples variables",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Condicion de victoria",
        objectiveTitle: "Cuando llega a 10",
        objective:
          "Usa una condicion sobre una variable para que Nano festeje cuando su energia llega a 10 puntos.",
        concept: "Variables + condicional",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Proyecto Nano 8",
        objectiveTitle: "Mision de datos",
        objective:
          "Crea un programa completo donde Nano recolecta items, registra datos con variables y muestra los resultados.",
        concept: "Proyecto integrador N8",
        starterFile: "scratch/nano-starter.sb3",
      },
    ],
  },
  9: {
    nivelTitle: "Nivel 9",
    desafios: [
      {
        title: "Mi primer bloque",
        objectiveTitle: "Crea un bloque propio",
        objective:
          "Usa la seccion 'Mis bloques' para crear tu primer bloque propio y llamarlo desde el programa principal.",
        concept: "Bloques propios (funciones)",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Rutina de carga",
        objectiveTitle: "Bloque con pasos repetidos",
        objective:
          "Crea un bloque 'recargar_energia' con la secuencia que Nano repite cada vez que necesita cargarse.",
        concept: "Funciones con nombre",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Bloques con parametros",
        objectiveTitle: "Bloque flexible",
        objective:
          "Agrega un parametro a tu bloque propio para que Nano pueda moverse diferente cantidad de pasos segun lo que le indiques.",
        concept: "Parametros en funciones",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Divide el programa",
        objectiveTitle: "Organiza en rutinas",
        objective:
          "Divide el programa de Nano en tres bloques propios: 'iniciar', 'recorrer' y 'finalizar'. Llamalos en orden.",
        concept: "Modularizacion",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Proyecto Nano 9",
        objectiveTitle: "Programa organizado",
        objective:
          "Crea un programa completo usando bloques propios bien nombrados. El codigo tiene que ser facil de leer.",
        concept: "Proyecto integrador N9",
        starterFile: "scratch/nano-starter.sb3",
      },
    ],
  },
  10: {
    nivelTitle: "Nivel 10",
    desafios: [
      {
        title: "Mision compleja",
        objectiveTitle: "Todo junto",
        objective:
          "Combina secuencias, bucles y condicionales para que Nano complete un recorrido con obstaculos variables.",
        concept: "Integracion general",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Sistema de energia",
        objectiveTitle: "Variables y eventos",
        objective:
          "Usa variables para controlar la energia de Nano. Si la energia llega a 0, el programa se detiene.",
        concept: "Variables + eventos",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Rutinas avanzadas",
        objectiveTitle: "Bloques con logica",
        objective:
          "Crea bloques propios que usen variables y condicionales internamente para manejar el comportamiento de Nano.",
        concept: "Funciones con estado",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Interaccion y eventos",
        objectiveTitle: "Nano responde",
        objective:
          "Usa eventos de teclado o mouse para que Nano responda a las acciones del usuario durante la mision.",
        concept: "Eventos e interaccion",
        starterFile: "scratch/nano-starter.sb3",
      },
      {
        title: "Proyecto final Nano",
        objectiveTitle: "La gran mision",
        objective:
          "Crea el proyecto final de Nano integrando todo lo aprendido: secuencias, variables, bloques propios, eventos e interaccion.",
        concept: "Proyecto integrador final",
        starterFile: "scratch/nano-starter.sb3",
      },
    ],
  },
};

const params = new URLSearchParams(window.location.search);
const editorOverride = params.get("editor");
const requestedNivel = Number(params.get("nivel"));
const nivel = SCRATCH_NIVELES[requestedNivel] ? requestedNivel : 7;
const nivelData = SCRATCH_NIVELES[nivel];
const requestedDesafio = Number(params.get("desafio"));
const desafio =
  requestedDesafio >= 1 && requestedDesafio <= nivelData.desafios.length
    ? requestedDesafio
    : 1;
const challenge = nivelData.desafios[desafio - 1];

function setText(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function decoratePage() {
  document.title = `Be Tech | ${challenge.title}`;
  setText("[data-scratch-kicker]", nivelData.nivelTitle);
  setText("[data-scratch-title]", challenge.title);
  setText("[data-scratch-counter]", `Desafio ${desafio} de ${nivelData.desafios.length}`);
  setText("[data-scratch-objective-title]", challenge.objectiveTitle);
  setText("[data-scratch-objective]", challenge.objective);
  setText("[data-scratch-concept]", challenge.concept);

  document.querySelectorAll("[data-scratch-starter]").forEach((el) => {
    el.setAttribute("href", challenge.starterFile);
  });
}

function renderNav() {
  const nav = document.querySelector("[data-scratch-desafio-nav]");
  if (!nav) return;
  nav.innerHTML = "";

  nivelData.desafios.forEach((_, index) => {
    const num = index + 1;
    const a = document.createElement("a");
    a.href = `scratch-nivel.html?nivel=${nivel}&desafio=${num}`;
    a.textContent = String(num);
    a.setAttribute("aria-label", `Desafio ${num}`);
    a.classList.toggle("is-active", num === desafio);
    nav.appendChild(a);
  });
}

function buildFallback() {
  return `
    <div class="scratch-editor-fallback">
      <div class="scratch-nivel-steps">
        <div class="scratch-nivel-step">
          <span class="scratch-nivel-step-num">1</span>
          <div>
            <strong>Descarga el proyecto inicial</strong>
            <a class="scratch-action scratch-action-primary" href="${challenge.starterFile}" download>Descargar .sb3</a>
          </div>
        </div>
        <div class="scratch-nivel-step">
          <span class="scratch-nivel-step-num">2</span>
          <div>
            <strong>Abri el editor online</strong>
            <a class="scratch-action scratch-action-secondary" href="https://scratch.mit.edu/projects/editor/" target="_blank" rel="noopener noreferrer">Abrir editor ↗</a>
          </div>
        </div>
        <div class="scratch-nivel-step">
          <span class="scratch-nivel-step-num">3</span>
          <div>
            <strong>Carga el proyecto en el editor</strong>
            <p>Archivo &rarr; Cargar desde tu computadora &rarr; elegí el .sb3</p>
          </div>
        </div>
        <div class="scratch-nivel-step">
          <span class="scratch-nivel-step-num">4</span>
          <div>
            <strong>Cuando termines: exporta y entrega</strong>
            <p>Archivo &rarr; Guardar en tu computadora &rarr; enviaselo al docente</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function loadEditor() {
  const panel = document.querySelector("[data-scratch-editor-panel]");
  if (!panel) return;

  const src = editorOverride || SCRATCH_LOCAL_EDITOR;
  const editorSrc = withEditorLocale(src);

  // Verificar si el editor local está disponible antes de cargar el iframe.
  // Evita el error 404 visible dentro del iframe.
  fetch(editorSrc, { method: "HEAD", cache: "no-store" })
    .then((res) => {
      if (res.ok) {
        loadIframe(panel, editorSrc);
      } else {
        panel.innerHTML = buildFallback();
      }
    })
    .catch(() => {
      panel.innerHTML = buildFallback();
    });
}

function withEditorLocale(src) {
  try {
    const url = new URL(src, window.location.href);
    url.searchParams.set("locale", "es");
    url.searchParams.set("bt", EDITOR_BUILD_REV);
    return url.pathname.replace(/^\//, "") + url.search + url.hash;
  } catch {
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}locale=es&bt=${EDITOR_BUILD_REV}`;
  }
}

function loadIframe(panel, src) {
  const frame = document.createElement("iframe");
  frame.title = "Editor de bloques";
  frame.setAttribute("allow", "microphone; camera");
  frame.src = src;

  frame.addEventListener(
    "load",
    () => {
      // Ocultar marca y titulo del editor.
      try {
        const doc = frame.contentDocument;
        if (doc && doc.head) {
          const style = doc.createElement("style");
          style.textContent = `
            /* Ocultar marca y titulo del editor */
            [class*="menu-bar_menu-bar"] {
              background-color: #07D4F0 !important;
            }

            #logo_img,
            img[alt="Scratch"],
            [class*="scratchLogo"],
            [class*="scratch-logo"],
            [class*="project-title"],
            [class*="share-button"],
            [class*="community-button"],
            [class*="project-page"],
            [class*="see-community"],
            [class*="account-info-group"],
            [class*="account-nav-menu"],
            [class*="login-dropdown"],
            [class*="mystuff-button"],
            [class*="backpack_backpack-container"],
            [class*="backpack_backpack-header"],
            [class*="backpack_backpack-list"],
            [id*="account-nav"] { display: none !important; }
          `;
          doc.head.appendChild(style);
          hideEditorChromeActions(doc);
        }
      } catch (_) { /* guard por si cambia el origen */ }
    },
    { once: true },
  );

  panel.appendChild(frame);
}

function hideEditorChromeActions(doc) {
  const labels = [
    "Compartir",
    "Ver pagina del proyecto",
    "Ver página del proyecto",
    "Share",
    "See project page",
    "scratch-cat",
    "Iniciar sesion",
    "Iniciar sesión",
    "Entrar",
    "Sign in",
    "Log in",
  ];
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const normalizedLabels = labels.map(normalize);

  const hideMatchingActions = () => {
    doc.querySelectorAll("button, a, [role='button'], [class*='account-info-group'], [class*='account-nav-menu']").forEach((el) => {
      const text = normalize(`${el.textContent} ${el.getAttribute("aria-label")}`);
      if (normalizedLabels.some((label) => text.includes(label))) {
        el.style.setProperty("display", "none", "important");
      }
    });
  };

  hideMatchingActions();

  if (doc.body && "MutationObserver" in window) {
    const observer = new MutationObserver(hideMatchingActions);
    observer.observe(doc.body, { childList: true, subtree: true });
  }

  let attempts = 0;
  const retry = window.setInterval(() => {
    hideMatchingActions();
    attempts += 1;
    if (attempts >= 12) window.clearInterval(retry);
  }, 250);
}

function wireFloatingPanel() {
  const panel = document.querySelector("[data-scratch-floating-panel]");
  const handle = document.querySelector("[data-scratch-floating-handle]");
  const toggle = document.querySelector("[data-scratch-floating-toggle]");
  const fixedToggle = document.querySelector("[data-scratch-consigna-button]");
  if (!panel || !handle || !toggle) return;

  const setCollapsed = (collapsed) => {
    panel.classList.toggle("is-collapsed", collapsed);
    toggle.textContent = collapsed ? "+" : "−";
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Mostrar consigna" : "Ocultar consigna");
    fixedToggle?.setAttribute("aria-expanded", String(!collapsed));
  };

  const togglePanel = () => {
    setCollapsed(!panel.classList.contains("is-collapsed"));
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePanel();
  });

  fixedToggle?.addEventListener("click", togglePanel);

  handle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    const rect = panel.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    handle.setPointerCapture?.(event.pointerId);

    const movePanel = (moveEvent) => {
      const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth - 8);
      const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight - 8);
      const left = Math.min(Math.max(8, moveEvent.clientX - offsetX), maxLeft);
      const top = Math.min(Math.max(8, moveEvent.clientY - offsetY), maxTop);
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    };

    const stopMove = () => {
      window.removeEventListener("pointermove", movePanel);
      window.removeEventListener("pointerup", stopMove);
      window.removeEventListener("pointercancel", stopMove);
    };

    window.addEventListener("pointermove", movePanel);
    window.addEventListener("pointerup", stopMove);
    window.addEventListener("pointercancel", stopMove);
  });
}

decoratePage();
renderNav();
wireFloatingPanel();
loadEditor();
