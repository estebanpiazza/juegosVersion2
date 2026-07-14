const stageParams = new URLSearchParams(window.location.search);
const stageLevel = Number(stageParams.get("nivel")) || 4;
const stageCards = document.querySelector("[data-stage-cards]");

document.querySelectorAll("[data-stage-level]").forEach((node) => {
  node.textContent = String(stageLevel);
});

async function loadStageData(levelNumber) {
  try {
    const response = await fetch(`contenido/nivel-${levelNumber}-seccion-1.json`, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function fallbackStages() {
  return Array.from({ length: 5 }, (_, index) => ({
    titulo: `Desafio ${index + 1}`,
    consigna: "Entrar a esta etapa.",
  }));
}

function getStageDisplayNumber(stage, index) {
  const explicitNumber = Number(stage?.numero || stage?.actividad || stage?.desafio);
  if (Number.isFinite(explicitNumber) && explicitNumber > 0) return explicitNumber;

  const idMatch = String(stage?.id || "").match(/d(\d+)$/i);
  if (idMatch) return Number(idMatch[1]);

  return index + 1;
}

function renderStageCards(stages) {
  if (!stageCards) return;
  stageCards.innerHTML = stages
    .map((stage, index) => {
      const internalNumber = index + 1;
      const displayNumber = getStageDisplayNumber(stage, index);
      const title = stage.titulo || `Desafio ${displayNumber}`;
      return `
        <a class="stage-node" href="nivel.html?nivel=${stageLevel}&desafio=${displayNumber}" aria-label="Entrar a ${title}">
          <span>${displayNumber}</span>
        </a>
      `;
    })
    .join("");
}

stageCards?.addEventListener("click", (event) => {
  const stageLink = event.target.closest(".stage-node");
  if (!stageLink) return;
  event.preventDefault();
  stageCards.querySelectorAll(".stage-node").forEach((node) => {
    node.classList.toggle("is-entering", node === stageLink);
    node.classList.toggle("is-dimmed", node !== stageLink);
  });
  document.body.classList.add("stage-is-entering");
  window.setTimeout(() => {
    window.location.href = stageLink.href;
  }, 520);
});

loadStageData(stageLevel).then((data) => {
  const stages = Array.isArray(data?.desafios) && data.desafios.length ? data.desafios : fallbackStages();
  renderStageCards(stages);
});
