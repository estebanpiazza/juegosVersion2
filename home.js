const levelCardsContainer = document.querySelector(".level-cards");

if (levelCardsContainer) {
  const levelThemes = ["card-blue", "card-cyan", "card-yellow", "card-pink"];
  const levelIcons = ["🧩", "🚀", "⭐", "🎲", "💡", "🏆", "🔢", "🧠", "🔍", "🎯"];
  const configuredLevels = [4, 5, 6, 7, 8, 9, 10];

  function getLevelHref(levelNumber) {
    if (levelNumber === 4) return `etapas.html?nivel=${levelNumber}`;
    if (levelNumber === 5) return `etapas.html?nivel=${levelNumber}`;
    if (levelNumber === 6) return `etapas.html?nivel=${levelNumber}`;
    if (levelNumber >= 7 && levelNumber <= 10) return `scratch-nivel.html?nivel=${levelNumber}`;
    return `niveles.html?nivel=${levelNumber}`;
  }

  function renderLevelCards(levels) {
    levelCardsContainer.innerHTML = levels
      .map((levelNumber, index) => {
        const themeClass = levelThemes[index % levelThemes.length];
        const icon = levelIcons[index % levelIcons.length];
        const href = getLevelHref(levelNumber);
        const label = levelNumber === 4 ? `NIVEL ${levelNumber}` : `Nivel ${levelNumber}`;
        return `
          <a class="level-card ${themeClass}" href="${href}">
            <span class="card-emoji" aria-hidden="true">${icon}</span>
            <strong>${label}</strong>
          </a>
        `;
      })
      .join("");
  }

  renderLevelCards(configuredLevels);
}

// ── Import & play ──────────────────────────────────────
const homeImportFile = document.getElementById("home-import-file");
if (homeImportFile) {
  homeImportFile.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data || !data.grilla) throw new Error("formato inválido");
        localStorage.setItem("betech-preview-level", JSON.stringify(data));
        window.open("jugar-nivel.html?preview=true", "_blank");
      } catch {
        // Replace with inline message to avoid popup blockers
        const label = homeImportFile.closest("label");
        if (label) {
          const prev = label.querySelector(".gen-entry-sub");
          if (prev) { prev.textContent = "⚠ Archivo inválido. Intentá con otro JSON."; }
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });
}
