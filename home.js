const levelCardsContainer = document.querySelector(".level-cards");

if (levelCardsContainer) {
  const levelThemes = ["card-blue", "card-cyan", "card-yellow", "card-pink"];
  const levelIcons = ["🧩", "🚀", "⭐", "🎲", "💡", "🏆", "🔢", "🧠", "🔍", "🎯"];

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

  async function discoverLevels() {
    const discovered = [];
    let missesAfterFirstMatch = 0;
    const maxProbeLevel = 40;

    for (let probe = 1; probe <= maxProbeLevel; probe += 1) {
      const levelData = await loadLevelSection(probe, 1);
      if (levelData) {
        discovered.push(probe);
        missesAfterFirstMatch = 0;
        continue;
      }

      if (discovered.length) {
        missesAfterFirstMatch += 1;
        if (missesAfterFirstMatch >= 8) break;
      }
    }

    return discovered;
  }

  function renderLevelCards(levels) {
    levelCardsContainer.innerHTML = levels
      .map((levelNumber, index) => {
        const themeClass = levelThemes[index % levelThemes.length];
        const icon = levelIcons[index % levelIcons.length];
        return `
          <a class="level-card ${themeClass}" href="nivel.html?nivel=${levelNumber}">
            <span class="card-emoji" aria-hidden="true">${icon}</span>
            <strong>Nivel ${levelNumber}</strong>
          </a>
        `;
      })
      .join("");
  }

  discoverLevels().then((levels) => {
    if (!levels.length) return;
    renderLevelCards(levels);
  });
}
