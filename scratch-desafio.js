const SCRATCH_LOCAL_EDITOR_URL = "scratch-editor/packages/scratch-gui/build/index.html";
const SCRATCH_WEB_EDITOR_URL = "https://scratchfoundation.github.io/scratch-gui/";
const SCRATCH_STARTER_PROJECT = "scratch/nano-starter.sb3";

const SCRATCH_CHALLENGES = {
  7: {
    title: "Fabrica logica",
    objectiveTitle: "Decisiones para clasificar",
    objective:
      "Programa a Nano para que clasifique objetos usando una regla si/sino. El proyecto debe mostrar claramente que pasa con cada tipo de objeto.",
    concept: "Condicional si/sino",
    deliverable: "Una escena interactiva con al menos dos decisiones.",
  },
  8: {
    title: "Central de energia",
    objectiveTitle: "Energia con contador",
    objective:
      "Crea un proyecto donde Nano junte energia, actualice un contador y cambie de estado cuando llega al objetivo.",
    concept: "Variables y contador",
    deliverable: "Un contador visible que cambie durante el juego.",
  },
  9: {
    title: "Laboratorio de rutinas",
    objectiveTitle: "Rutinas reutilizables",
    objective:
      "Arma un proyecto donde Nano use una rutina propia para repetir una accion importante sin duplicar todo el programa.",
    concept: "Funciones o bloques propios",
    deliverable: "Un bloque propio usado mas de una vez.",
  },
  10: {
    title: "Mision final",
    objectiveTitle: "Proyecto integrador",
    objective:
      "Disena una mision completa para Nano combinando eventos, repeticion, condicionales, variables y una rutina propia.",
    concept: "Integracion de conceptos",
    deliverable: "Un proyecto jugable, probado y listo para compartir.",
  },
};

const params = new URLSearchParams(window.location.search);
const requestedLevel = Number(params.get("nivel"));
const level = SCRATCH_CHALLENGES[requestedLevel] ? requestedLevel : 7;
const challenge = SCRATCH_CHALLENGES[level];

function setText(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function decoratePage() {
  document.title = `Be Tech | Nivel ${level} Scratch`;
  setText("[data-scratch-kicker]", `Nivel ${level}`);
  setText("[data-scratch-title]", challenge.title);
  setText("[data-scratch-objective-title]", challenge.objectiveTitle);
  setText("[data-scratch-objective]", challenge.objective);
  setText("[data-scratch-concept]", challenge.concept);
  setText("[data-scratch-deliverable]", challenge.deliverable);

  document.querySelectorAll("[data-scratch-level-link]").forEach((link) => {
    link.classList.toggle("is-active", Number(link.dataset.scratchLevelLink) === level);
  });
}

function buildEditorUrl(baseUrl) {
  const url = new URL(baseUrl, window.location.href);
  url.searchParams.set("betechLevel", String(level));
  url.searchParams.set("starterProject", new URL(SCRATCH_STARTER_PROJECT, window.location.href).href);
  return url.href;
}

function getEditorOverride() {
  const override = params.get("editor");
  if (!override) return null;
  try {
    return new URL(override, window.location.href).href;
  } catch {
    return null;
  }
}

async function localEditorExists() {
  try {
    const response = await fetch(SCRATCH_LOCAL_EDITOR_URL, {
      method: "HEAD",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function wireEditor() {
  const frame = document.querySelector("[data-scratch-frame]");
  const openLink = document.querySelector("[data-scratch-open]");
  const note = document.querySelector("[data-scratch-note]");
  const editorOverride = getEditorOverride();
  const hasLocalEditor = editorOverride ? true : await localEditorExists();
  const editorUrl = buildEditorUrl(editorOverride || (hasLocalEditor ? SCRATCH_LOCAL_EDITOR_URL : SCRATCH_WEB_EDITOR_URL));

  if (frame) frame.src = editorUrl;
  if (openLink) openLink.href = editorUrl;
  if (note) note.hidden = Boolean(editorOverride || hasLocalEditor);
}

decoratePage();
wireEditor();
