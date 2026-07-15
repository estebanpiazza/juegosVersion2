const params = new URLSearchParams(window.location.search);
const requestedLevel = Number(params.get("nivel") || Number.NaN);
const requestedChallenge = Number(params.get("desafio") || Number.NaN);
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
let activeChallengeId = 1;
const SOUND_VOLUME_KEY = "betech-sound-volume";
const MUSIC_VOLUME_KEY = "betech-music-volume";
const SOUND_VOLUME_DEFAULT_FIX_KEY = "betech-sound-volume-default-fixed";
const MUSIC_VOLUME_DEFAULT_FIX_KEY = "betech-music-volume-default-fixed";
const LEVEL_RATINGS_KEY = "betech-level-ratings";
const DEFAULT_SOUND_VOLUME = 0.45;
const DEFAULT_MUSIC_VOLUME = 0.28;
const MUSIC_BAR_SECONDS = 2.4;
const COMPLETION_MODAL_DELAY_MS = 2000;
const LEVEL_RATING_OPTIONS = [
  { value: 1, emoji: "&#128542;", label: "No me gusto" },
  { value: 2, emoji: "&#128528;", label: "Mas o menos" },
  { value: 3, emoji: "&#128578;", label: "Estuvo bien" },
  { value: 4, emoji: "&#128516;", label: "Me gusto" },
  { value: 5, emoji: "&#128525;", label: "Me encanto" },
];
let soundContext = null;
let soundMaster = null;
let musicMaster = null;
let soundVolume = readStoredSoundVolume();
let musicVolume = readStoredMusicVolume();
let lastToneAt = 0;
let musicStarted = false;
let musicTimer = null;
let nextMusicTime = 0;
let musicStep = 0;
const audioAssetBufferCache = new Map();

let challengeTitles = {
  1: "Camino del robot",
  2: "Depura el programa",
  3: "Programa al robot",
  4: "Patrones de algoritmo",
  5: "Mision mapa del robot",
};

const challengeTypeRenderers = {
  "armado-nano": (id) => renderNanoAssemblyChallenge(id),
  "clasificar-tecnologia": (id) => renderTechnologySortChallenge(id),
  "buscar-piezas": (id) => renderHiddenPartsChallenge(id),
  "elige-flecha-avanzar": (id) => renderN4ProgrammingCarpetChallenge(id),
  "elige-flecha-derecha": (id) => renderN4ProgrammingCarpetChallenge(id),
  "elige-flecha-izquierda": (id) => renderN4ProgrammingCarpetChallenge(id),
  "arrastrar-derecha": (id) => renderDragRightChallenge(id),
  "patron-color": (id) => renderColorPatternChallenge(id),
  "secuencia-tarjetas-n4": (id) => renderN4ProgrammingCarpetChallenge(id),
  "patron-formas-cinta": (id) => renderConveyorShapePatternChallenge(id),
  "patron-hardware": (id) => renderHardwarePatternChallenge(id),
  "debug-luces": (id) => renderLightDebugChallenge(id),
  "reparar-color": (id) => renderColorRepairChallenge(id),
  "patron-sonidos": (id) => renderSoundPatternChallenge(id),
  "recuperar-destornillador-alfombra": (id) => renderN4ProgrammingCarpetChallenge(id),
  "alerta-lluvia-alfombra": (id) => renderN4ProgrammingCarpetChallenge(id),
  "recuperar-tesoro-alfombra": (id) => renderN4ProgrammingCarpetChallenge(id),
  "secuencia-despertar-n4": (id) => renderN4WakeUpSequenceChallenge(id),
  "secuencia-cordones-n4": (id) => renderN4ShoelaceSequenceChallenge(id),
  "secuencia-cepillado-n4": (id) => renderN4ToothbrushingSequenceChallenge(id),
  "parejas-situaciones-n4": (id) => renderN4SituationPairsChallenge(id),
  "camino-escuela-n4": (id) => renderN4SchoolPathChallenge(id),
  "completar-camino-escuela-n4": (id) => renderN4MissingSchoolStepsChallenge(id),
  "depurar-casillero-n4": (id) => renderN4LockerDebugChallenge(id),
  "clave-conteo-n4": (id) => renderN4CountingCodeChallenge(id),
  "cuatro-avances-n4": (id) => renderN4FourStepsChallenge(id),
  "repetir-cuatro-n4": (id) => renderN4RepeatFourChallenge(id),
  "laberinto-baterias-n4": (id) => renderN4BatteryLabyrinthChallenge(id),
  "secuenciacion-guiada": (id) => renderPathChallenge(id),
  "depuracion-inicial": (id) => renderBalanceChallengeV2(id),
  "programacion-por-bloques": (id) => renderRobotChallengeV2(id),
  "patrones-de-comandos": (id) => renderPatternChallengeV2(id),
  "mapa-en-grilla": (id) => renderCoordinatesChallenge(id),
  "n5-clasificar-robots": (id) => renderN5RobotSortChallenge(id),
  "n5-seleccionar-energia": (id) => renderN5TapSelectionChallenge(id, getN5EnergyConfig()),
  "n5-camino-carga": (id) => renderN5ChargingPathChallenge(id),
  "n5-armado-nano": (id) => renderN5NanoAssemblyChallenge(id),
  "n5-programables": (id) => renderN5TapSelectionChallenge(id, getN5ProgrammableConfig()),
  "n5-herramienta-programar": (id) => renderN5ProgrammingToolChallenge(id),
  "n5-secuencia-avanzar": (id) => renderN5LinearCommandChallenge(id),
  "n5-lavado-manos": (id) => renderN5HandwashingOrderChallenge(id),
  "n5-debug-choque": (id) => renderN5DebugCrashChallenge(id),
  "n5-maquina-autonoma": (id) => renderN5AutonomousMachineChallenge(id),
  "n6-direccion-inicial": (id) => renderN6InitialDirectionChallenge(id),
  "n6-condicional-meteoritos": (id) => renderN6MeteorConditionChallenge(id),
  "n6-repeticion-estrellas": (id) => renderN6StarRepetitionChallenge(id),
  "n6-ruta-antena": (id) => renderN6AntennaRouteChallenge(id),
  "n6-desvio-crater": (id) => renderN6CraterDetourChallenge(id),
  "n6-debug-satelite": (id) => renderN6SatelliteDebugChallenge(id),
  "n6-repeticion-paneles": (id) => renderN6SolarRepetitionChallenge(id),
  "n6-patron-asteroides": (id) => renderN6AsteroidPatternChallenge(id),
  "n6-recoleccion-capsulas": (id) => renderN6CapsuleCollectionChallenge(id),
  "repeticion-obligatoria": (id) => renderRepeatRequiredChallenge(id),
  "laberinto-flechas": (id) => renderDesignD6ArrowMazeChallenge(id),
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
  "assets/fondo.jpeg",
];
const NANO_HEAD_IMAGE_SRC = `nuevos/No%20lograste/cabeza%20Nano.png?v=${Date.now()}`;
const NANO_DIRECTION_ASSET_BASE = "nano%20assets";
const NANO_DIRECTION_FILES = {
  up: "norte.png",
  right: "este.png",
  down: "sur.png",
  left: "oeste.png",
};
const N4_PROGRAM_DIRECTIONS = ["up", "right", "down", "left"];
const MODAL_SUCCESS_ROBOT_IMAGE_SRC = `nuevos/No%20lograste/lograste.png?v=${Date.now()}`;
const MODAL_FAILURE_ROBOT_IMAGE_SRC = `nuevos/No%20lograste/noloraste.png?v=${Date.now()}`;
const ROBOT_IMAGE_SRC = NANO_HEAD_IMAGE_SRC;
const DESIGN_D1_ASSET_BASE = "dise%C3%B1o%20de%20niveles/DESAFIO%201";
const DESIGN_D1_ROBOT_IMAGE_SRC = NANO_HEAD_IMAGE_SRC;
const DESIGN_D2_ASSET_BASE = "dise%C3%B1o%20de%20niveles/DESAFIO%202";
const DESIGN_D2_ROBOT_IMAGE_SRC = NANO_HEAD_IMAGE_SRC;
const DESIGN_D3_ASSET_BASE = "dise%C3%B1o%20de%20niveles/DESAFIO%203";
const DESIGN_D3_ROBOT_IMAGE_SRC = NANO_HEAD_IMAGE_SRC;
const DESIGN_D4_ASSET_BASE = "dise%C3%B1o%20de%20niveles/DESAFIO%204";
const DESIGN_D6_ASSET_BASE = "dise%C3%B1o%20de%20niveles/DESAFIO%206";
const DESIGN_D6_ROBOT_IMAGE_SRC = NANO_HEAD_IMAGE_SRC;
const DESIGN_D1_STAGE_BACKGROUND = `${DESIGN_D1_ASSET_BASE}/DESAFIO%201.png`;
const DESIGN_D2_STAGE_BACKGROUND = `${DESIGN_D2_ASSET_BASE}/DESAFIO%202.jpg`;
const DESIGN_D3_STAGE_BACKGROUND = `${DESIGN_D3_ASSET_BASE}/DESAFIO%203.png`;
const DESIGN_D4_STAGE_BACKGROUND = `${DESIGN_D4_ASSET_BASE}/DESAFIO%204.png`;
const DESIGN_D6_STAGE_BACKGROUND = `${DESIGN_D6_ASSET_BASE}/DESAFIO%206.png`;
const N4_NEW_ASSET_BASE = "nuevos";
const N4_ASSET_FOLDER_BY_CHALLENGE = {
  10: "consigna 10",
  16: "CONSIGNA 16,18,19",
  18: "CONSIGNA 16,18,19",
  19: "CONSIGNA 16,18,19",
};

function n4Asset(challengeNumber, fileName) {
  const folder = N4_ASSET_FOLDER_BY_CHALLENGE[challengeNumber] || `CONSIGNA ${challengeNumber}`;
  return `${N4_NEW_ASSET_BASE}/${encodeURIComponent(folder)}/${encodeURIComponent(fileName)}`;
}

function n4Block2Asset(fileName) {
  return n4Block2ChallengeAsset(1, fileName);
}

const N4_BLOCK2_ASSET_FOLDER_BY_CHALLENGE = {
  12: "CONSIGNA 12 - BLOQUE - NIVEL 4",
};

function n4Block2ChallengeAsset(challengeNumber, fileName) {
  const folder = N4_BLOCK2_ASSET_FOLDER_BY_CHALLENGE[challengeNumber]
    || `CONSIGNA ${challengeNumber} - BLOQUE 2 - NIVEL 4`;
  return `${N4_NEW_ASSET_BASE}/${encodeURIComponent(folder)}/${encodeURIComponent(fileName)}`;
}

function nanoDirectionAsset(fileName) {
  return `${NANO_DIRECTION_ASSET_BASE}/${encodeURIComponent(fileName)}`;
}

function normalizeNanoDirection(direction) {
  const normalized = String(direction || "up").toLowerCase();
  const aliases = {
    arriba: "up",
    norte: "up",
    up: "up",
    derecha: "right",
    este: "right",
    right: "right",
    abajo: "down",
    sur: "down",
    down: "down",
    izquierda: "left",
    oeste: "left",
    left: "left",
  };
  return aliases[normalized] || "up";
}

function getNanoDirectionAsset(direction) {
  const normalized = normalizeNanoDirection(direction);
  return nanoDirectionAsset(NANO_DIRECTION_FILES[normalized] || NANO_DIRECTION_FILES.up);
}

function renderNanoDirectionImage(className, direction, alt = "Nano") {
  const normalized = normalizeNanoDirection(direction);
  return `<img class="${className}" src="${getNanoDirectionAsset(normalized)}" alt="${alt}" data-nano-direction="${normalized}" data-nano-fallbacks="${NANO_HEAD_IMAGE_SRC}" />`;
}

document.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.nanoFallbacks) return;
  const fallbacks = image.dataset.nanoFallbacks.split("|").filter(Boolean);
  if (!fallbacks.length) return;
  const [nextSource, ...remainingSources] = fallbacks;
  image.dataset.nanoFallbacks = remainingSources.join("|");
  image.classList.toggle("is-fallback-nano-head", remainingSources.length === 0);
  image.src = nextSource;
}, true);

const N5_ASSET_BASE = "nivel%205";
const N5_ASSET_FOLDER_BY_CHALLENGE = {
  1: "CONSIGNA 1- N5",
  2: "CONSIGNA 2",
  3: "CONSIGNA 3",
  4: "CONSIGNA 4",
  5: "CONSIGNA 5",
  6: "CONSIGNA 6 - NIVEL 5",
  7: "CONSIGNA 7 - NIVEL 5",
  8: "CONSIGNA 8",
  9: "CONSIGNA 9 - NIVEL 5",
  10: "Consigna 10",
};

function n5Asset(challengeNumber, fileName) {
  const folder = N5_ASSET_FOLDER_BY_CHALLENGE[challengeNumber] || `CONSIGNA ${challengeNumber}`;
  return `${N5_ASSET_BASE}/${encodeURIComponent(folder)}/${encodeURIComponent(fileName)}`;
}

const N6_ASSET_BASE = "nivel%206";
const N6_ASSET_FOLDER_BY_CHALLENGE = {
  1: "Consigna 1- NIVEL 6",
  2: "CONSIGNA 2 NIVEL 6",
  3: "CONSIGNA 3 - NIVEL 6",
  4: "CONSIGNA 4 - NIVEL 6",
  5: "CONSIGNA 5 - NIVEL 6",
  6: "CONSIGNA 6 - Nivel 6",
  7: "CONSIGNA 7 - NIVEL 6",
  8: "CONSIGNA 8 - NIVEL 6",
  9: "CONSIGNA 9 - NIVEL 6",
};

function n6Asset(challengeNumber, fileName) {
  const folder = N6_ASSET_FOLDER_BY_CHALLENGE[challengeNumber] || `consigna ${challengeNumber}`;
  return `${N6_ASSET_BASE}/${encodeURIComponent(folder)}/${encodeURIComponent(fileName)}`;
}

function renderRobotMarker() {
  return `<img class="robot-marker" src="${ROBOT_IMAGE_SRC}" alt="Nano" style="--robot-rotation: 0deg" />`;
}

function renderDesignRobotMarker() {
  return `<img class="robot-marker design-d1-robot" src="${DESIGN_D1_ROBOT_IMAGE_SRC}" alt="Nano" />`;
}

function renderDesignRainRobotMarker() {
  return `<img class="robot-marker design-d2-robot" src="${DESIGN_D2_ROBOT_IMAGE_SRC}" alt="Nano" />`;
}

function renderDesignEnergyRobotMarker(direction = "up") {
  return renderNanoDirectionImage("robot-marker design-d3-robot", N4_PROGRAM_DIRECTIONS[direction] || direction);
}

function renderDesignD6RobotMarker() {
  return `<img class="robot-marker design-d6-robot" src="${DESIGN_D6_ROBOT_IMAGE_SRC}" alt="Nano" />`;
}

function readStoredSoundVolume() {
  const rawValue = window.localStorage?.getItem(SOUND_VOLUME_KEY);
  if (rawValue === null || rawValue === undefined) return DEFAULT_SOUND_VOLUME;
  const stored = Number(rawValue);
  if (stored === 0 && !window.localStorage?.getItem(SOUND_VOLUME_DEFAULT_FIX_KEY)) {
    window.localStorage?.setItem(SOUND_VOLUME_DEFAULT_FIX_KEY, "true");
    return DEFAULT_SOUND_VOLUME;
  }
  return Number.isFinite(stored) ? Math.min(Math.max(stored, 0), 1) : DEFAULT_SOUND_VOLUME;
}

function readStoredMusicVolume() {
  const rawValue = window.localStorage?.getItem(MUSIC_VOLUME_KEY);
  if (rawValue === null || rawValue === undefined) return DEFAULT_MUSIC_VOLUME;
  const stored = Number(rawValue);
  if (stored === 0 && !window.localStorage?.getItem(MUSIC_VOLUME_DEFAULT_FIX_KEY)) {
    window.localStorage?.setItem(MUSIC_VOLUME_DEFAULT_FIX_KEY, "true");
    return DEFAULT_MUSIC_VOLUME;
  }
  return Number.isFinite(stored) ? Math.min(Math.max(stored, 0), 1) : DEFAULT_MUSIC_VOLUME;
}

function setSoundVolume(value) {
  soundVolume = Math.min(Math.max(Number(value) || 0, 0), 1);
  window.localStorage?.setItem(SOUND_VOLUME_KEY, String(soundVolume));
  if (soundMaster) soundMaster.gain.value = soundVolume;
  document.querySelectorAll("[data-sound-volume]").forEach((slider) => {
    slider.value = String(Math.round(soundVolume * 100));
  });
  document.querySelectorAll("[data-sound-value]").forEach((label) => {
    label.textContent = `${Math.round(soundVolume * 100)}%`;
  });
}

function setMusicVolume(value) {
  musicVolume = Math.min(Math.max(Number(value) || 0, 0), 1);
  window.localStorage?.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
  if (musicMaster) musicMaster.gain.value = musicVolume;
  document.querySelectorAll("[data-music-volume]").forEach((slider) => {
    slider.value = String(Math.round(musicVolume * 100));
  });
  document.querySelectorAll("[data-music-value]").forEach((label) => {
    label.textContent = `${Math.round(musicVolume * 100)}%`;
  });
}

function getStoredLevelRatings() {
  try {
    const stored = window.localStorage?.getItem(LEVEL_RATINGS_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function ratingKeyFor(challengeId) {
  return `nivel-${level}-desafio-${challengeId}`;
}

function readLevelRating(challengeId) {
  const ratings = getStoredLevelRatings();
  const value = Number(ratings[ratingKeyFor(challengeId)]?.value);
  return Number.isFinite(value) ? value : null;
}

function saveLevelRating(challengeId, value) {
  const ratings = getStoredLevelRatings();
  ratings[ratingKeyFor(challengeId)] = {
    level,
    challenge: challengeId,
    value,
    savedAt: new Date().toISOString(),
  };
  window.localStorage?.setItem(LEVEL_RATINGS_KEY, JSON.stringify(ratings));
}

function ensureMusicMaster(context) {
  if (!context || musicMaster) return;
  musicMaster = context.createGain();
  musicMaster.gain.value = musicVolume;
  musicMaster.connect(context.destination);
}

function getSoundContext() {
  if (!soundContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    soundContext = new AudioContextClass();
    soundMaster = soundContext.createGain();
    soundMaster.gain.value = soundVolume;
    soundMaster.connect(soundContext.destination);
  }

  ensureMusicMaster(soundContext);

  if (soundContext.state === "suspended") {
    soundContext.resume();
  }

  return soundContext;
}

function scheduleMusicNote(context, start, frequency, duration, gain = 0.035, type = "triangle") {
  if (!musicMaster || musicVolume <= 0) return;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.035);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(envelope);
  envelope.connect(musicMaster);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function scheduleBackgroundMusic() {
  if (!musicStarted) return;
  const context = getSoundContext();
  if (!context || !musicMaster) return;

  const melody = [392, 493.88, 587.33, 659.25, 587.33, 493.88, 440, 523.25];
  const bass = [130.81, 146.83, 164.81, 196];
  const stepDuration = MUSIC_BAR_SECONDS / melody.length;

  while (nextMusicTime < context.currentTime + 1.2) {
    const step = musicStep % melody.length;
    scheduleMusicNote(context, nextMusicTime, melody[step], stepDuration * 1.85, 0.024, "triangle");

    if (step % 2 === 0) {
      scheduleMusicNote(context, nextMusicTime, bass[Math.floor(step / 2) % bass.length], stepDuration * 3.35, 0.018, "sine");
    }

    if (step === 0 || step === 4) {
      scheduleMusicNote(context, nextMusicTime + stepDuration * 0.35, melody[(step + 2) % melody.length] * 1.5, stepDuration * 2, 0.012, "sine");
    }

    nextMusicTime += stepDuration;
    musicStep += 1;
  }

  window.clearTimeout(musicTimer);
  musicTimer = window.setTimeout(scheduleBackgroundMusic, 450);
}

function startBackgroundMusic() {
  const context = getSoundContext();
  if (!context || !musicMaster || musicStarted) return;
  musicStarted = true;
  nextMusicTime = context.currentTime + 0.04;
  scheduleBackgroundMusic();
}

function playTone({ frequency = 440, endFrequency = null, duration = 0.12, delay = 0, type = "sine", gain = 0.18 }) {
  if (soundVolume <= 0) return;
  const context = getSoundContext();
  if (!context || !soundMaster) return;

  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), start + duration);

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(envelope);
  envelope.connect(soundMaster);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playSound(name) {
  const now = performance.now();
  if (name === "tap" && now - lastToneAt < 45) return;
  lastToneAt = now;

  if (name === "win") {
    playTone({ frequency: 523.25, duration: 0.11, gain: 0.16 });
    playTone({ frequency: 659.25, duration: 0.11, delay: 0.09, gain: 0.16 });
    playTone({ frequency: 783.99, duration: 0.18, delay: 0.18, gain: 0.17 });
    playTone({ frequency: 1046.5, duration: 0.24, delay: 0.31, gain: 0.13 });
    return;
  }

  if (name === "lose") {
    playTone({ frequency: 240, endFrequency: 120, duration: 0.22, type: "sawtooth", gain: 0.13 });
    playTone({ frequency: 170, endFrequency: 90, duration: 0.18, delay: 0.15, type: "triangle", gain: 0.11 });
    return;
  }

  if (name === "move") {
    playTone({ frequency: 210, endFrequency: 285, duration: 0.075, type: "square", gain: 0.08 });
    return;
  }

  if (name === "place") {
    playTone({ frequency: 360, duration: 0.08, type: "triangle", gain: 0.12 });
    playTone({ frequency: 540, duration: 0.08, delay: 0.055, type: "triangle", gain: 0.11 });
    return;
  }

  playTone({ frequency: 520, endFrequency: 680, duration: 0.055, type: "sine", gain: 0.07 });
}

function getAudioAssetBuffer(src, context) {
  if (!context) return Promise.reject(new Error("AudioContext unavailable"));
  if (!audioAssetBufferCache.has(src)) {
    const request = fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error(`Audio asset not found: ${src}`);
        return response.arrayBuffer();
      })
      .then((buffer) => context.decodeAudioData(buffer));

    audioAssetBufferCache.set(src, request);
  }

  return audioAssetBufferCache.get(src).catch((error) => {
    audioAssetBufferCache.delete(src);
    throw error;
  });
}

function playAudioBuffer(buffer, volumeMultiplier = 1) {
  const context = getSoundContext();
  if (!context || !soundMaster || !buffer) return Promise.resolve(false);

  return new Promise((resolve) => {
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = Math.max(0, Math.min(1.5, volumeMultiplier));
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(soundMaster);
    source.addEventListener("ended", () => {
      source.disconnect();
      gain.disconnect();
      resolve(true);
    }, { once: true });
    source.start();
  });
}

function playHtmlAudioAsset(src, volumeMultiplier = 1) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (played) => {
      if (settled) return;
      settled = true;
      resolve(played);
    };

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = Math.max(0, Math.min(1, soundVolume * volumeMultiplier));
    audio.addEventListener("ended", () => finish(true), { once: true });
    audio.addEventListener("error", () => finish(false), { once: true });
    const playback = audio.play();
    if (playback?.catch) playback.catch(() => finish(false));
  });
}

async function playAudioAsset(src, volumeMultiplier = 1) {
  const context = getSoundContext();
  if (context?.state === "suspended") {
    await context.resume().catch(() => {});
  }

  try {
    const buffer = await getAudioAssetBuffer(src, context);
    return await playAudioBuffer(buffer, volumeMultiplier);
  } catch {
    return playHtmlAudioAsset(src, volumeMultiplier);
  }
}

function playRobotMoveSound() {
  playSound("move");
}

function initializeSoundControls() {
  const topbar = document.querySelector(".game-topbar");
  if (!topbar || topbar.querySelector("[data-sound-control]")) return;

  const controlGroup = document.createElement("div");
  controlGroup.className = "sound-controls";
  controlGroup.dataset.soundControl = "true";
  controlGroup.innerHTML = `
    <button class="sound-toggle" type="button" aria-expanded="false" aria-controls="sound-panel" data-sound-toggle>
      <span class="side-control-icon" aria-hidden="true">&#9835;</span>
      <span class="side-control-label">Audio</span>
    </button>
    <div class="sound-panel" id="sound-panel" hidden>
      <div class="sound-control">
        <span class="sound-control-icon" aria-hidden="true">&#128266;</span>
        <label class="sound-control-label" for="sound-volume">Efectos</label>
        <input id="sound-volume" type="range" min="0" max="100" step="1" data-sound-volume aria-label="Volumen de efectos de sonido" />
        <span class="sound-control-value" data-sound-value></span>
      </div>
      <div class="sound-control">
        <span class="sound-control-icon" aria-hidden="true">&#9835;</span>
        <label class="sound-control-label" for="music-volume">Musica</label>
        <input id="music-volume" type="range" min="0" max="100" step="1" data-music-volume aria-label="Volumen de musica de fondo" />
        <span class="sound-control-value" data-music-value></span>
      </div>
    </div>
  `;

  topbar.append(controlGroup);
  const soundToggle = controlGroup.querySelector("[data-sound-toggle]");
  const soundPanel = controlGroup.querySelector("#sound-panel");
  const setSoundPanelOpen = (isOpen) => {
    if (!soundToggle || !soundPanel) return;
    soundToggle.setAttribute("aria-expanded", String(isOpen));
    soundPanel.hidden = !isOpen;
    controlGroup.classList.toggle("is-open", isOpen);
  };

  soundToggle?.addEventListener("click", () => {
    const isOpen = soundToggle.getAttribute("aria-expanded") === "true";
    setSoundPanelOpen(!isOpen);
    playSound("tap");
  });
  document.addEventListener("click", (event) => {
    if (!controlGroup.contains(event.target)) setSoundPanelOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSoundPanelOpen(false);
  });

  setSoundVolume(soundVolume);
  setMusicVolume(musicVolume);
  controlGroup.querySelector("[data-sound-volume]")?.addEventListener("input", (event) => {
    setSoundVolume(Number(event.target.value) / 100);
    playSound("tap");
  });
  controlGroup.querySelector("[data-music-volume]")?.addEventListener("input", (event) => {
    setMusicVolume(Number(event.target.value) / 100);
    startBackgroundMusic();
  });

  const startMusic = () => startBackgroundMusic();
  window.addEventListener("pointerdown", startMusic, { once: true });
  window.addEventListener("keydown", startMusic, { once: true });
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
  return [];
}

function syncLevelHeading() {
  document.querySelectorAll("[data-current-level]").forEach((node) => {
    node.textContent = String(level);
  });
  const backLink = document.querySelector(".back-link");
  if (backLink) {
    backLink.href = level === 4 || level === 5 || level === 6 ? `etapas.html?nivel=${level}` : "index.html";
  }
  document.title = `Be Tech | Nivel ${level}`;
}

function syncLevelBackground() {
  applyStageBackground(levelBackgrounds[0]);
}

function applyStageBackground(backgroundSrc) {
  if (!gameStageBg) return;
  const nextBackground = backgroundSrc || levelBackgrounds[0];
  if (!nextBackground) return;
  gameStageBg.src = nextBackground;
  gameStageBg.style.opacity = "1";
  gameStageBg.style.objectFit = "cover";
}

function resolveChallengeBackground(challengeData, challengeId) {
  const challengeType = challengeData?.tipo;
  if (challengeType) {
    switch (challengeType) {
      case "armado-nano":
        return n4Asset(1, "Ffondo.png");
      case "clasificar-tecnologia":
        return n4Asset(2, "Taller Mecanico.jpg");
      case "buscar-piezas":
        return n4Asset(3, "FONDO.jpg");
      case "elige-flecha-avanzar":
        return n4Asset(4, "FONDO.jpeg");
      case "elige-flecha-derecha":
        return n4Asset(5, "FONDO.jpeg");
      case "elige-flecha-izquierda":
        return n4Asset(6, "FONDO.jpeg");
      case "arrastrar-derecha":
        return n4Asset(7, "FONDO.jpg");
      case "secuencia-tarjetas-n4":
        return n4Asset(8, "FONDO.jpeg");
      case "patron-color":
        return n4Asset(9, "Fondo.png");
      case "patron-formas-cinta":
        return n4Asset(10, "FONDO.png");
      case "patron-hardware":
        return n4Asset(11, "FONDO 11.jpg");
      case "debug-luces":
        return n4Asset(12, "FONDO 12.png");
      case "reparar-color":
        return n4Asset(13, "Fondo.png");
      case "patron-sonidos":
        return n4Asset(14, "FONDO 14.jpg");
      case "recuperar-destornillador-alfombra":
        return "assets/fondo%20taller.jpg";
      case "alerta-lluvia-alfombra":
        return n4Asset(18, "CONSIGNA 18.png");
      case "recuperar-tesoro-alfombra":
        return n4Asset(19, "CONSIGNA 19.png");
      case "secuencia-despertar-n4":
        return n4Block2Asset("FONDO.png");
      case "secuencia-cordones-n4":
        return n4Block2Asset("FONDO.png");
      case "secuencia-cepillado-n4":
        return n4Block2ChallengeAsset(3, "FONDO.png");
      case "parejas-situaciones-n4":
        return n4Block2ChallengeAsset(5, "FONDO.jpg");
      case "camino-escuela-n4":
        return n4Block2ChallengeAsset(6, "FONDO.png");
      case "completar-camino-escuela-n4":
        return n4Block2ChallengeAsset(7, "FONDO.png");
      case "depurar-casillero-n4":
        return n4Block2ChallengeAsset(8, "FONDO .png");
      case "clave-conteo-n4":
        return n4Block2ChallengeAsset(9, "FONDO.jpg");
      case "cuatro-avances-n4":
        return n4Block2ChallengeAsset(11, "FONDO.png");
      case "repetir-cuatro-n4":
        return n4Block2ChallengeAsset(12, "FONDO.png");
      case "laberinto-baterias-n4":
        return n4Block2ChallengeAsset(14, "FONDO.jpg");
      case "n5-clasificar-robots":
        return n5Asset(1, "Fondo consigna 1.jpg");
      case "n5-seleccionar-energia":
        return n5Asset(2, "Fondo.png");
      case "n5-camino-carga":
        return n5Asset(3, "FONDO.jpeg");
      case "n5-armado-nano":
        return n4Asset(1, "Ffondo.png");
      case "n5-programables":
        return n5Asset(5, "ChatGPT Image 20 jun 2026, 11_04_07 p.m..png");
      case "n5-herramienta-programar":
        return n5Asset(6, "FONDO.jpg");
      case "n5-secuencia-avanzar":
        return n5Asset(7, "FONDO.jpg");
      case "n5-lavado-manos":
        return n5Asset(8, "FONDO.png");
      case "n5-debug-choque":
        return n5Asset(9, "Fondo.png");
      case "n5-maquina-autonoma":
        return n5Asset(10, "Fondo.png");
      case "n6-direccion-inicial":
        return n6Asset(1, "Fondo.png");
      case "n6-condicional-meteoritos":
        return n6Asset(2, "FONDO.png");
      case "n6-repeticion-estrellas":
        return n6Asset(3, "Fondo.png");
      case "n6-ruta-antena":
        return n6Asset(4, "FONDO.png");
      case "n6-desvio-crater":
        return n6Asset(5, "Fondo.png");
      case "n6-debug-satelite":
        return n6Asset(6, "Fondo.png");
      case "n6-repeticion-paneles":
        return n6Asset(6, "Fondo.png");
      case "n6-patron-asteroides":
        return n6Asset(8, "Fondo.png");
      case "n6-recoleccion-capsulas":
        return n6Asset(9, "Fondo.png");
      case "secuenciacion-guiada":
        return DESIGN_D1_STAGE_BACKGROUND;
      case "depuracion-inicial":
        return DESIGN_D2_STAGE_BACKGROUND;
      case "programacion-por-bloques":
        return DESIGN_D3_STAGE_BACKGROUND;
      case "patrones-de-comandos":
        return DESIGN_D4_STAGE_BACKGROUND;
      case "laberinto-flechas":
        return DESIGN_D6_STAGE_BACKGROUND;
      default:
        return levelBackgrounds[0];
    }
  }

  switch (challengeId) {
    case 1:
      return DESIGN_D1_STAGE_BACKGROUND;
    case 2:
      return DESIGN_D2_STAGE_BACKGROUND;
    case 3:
      return DESIGN_D3_STAGE_BACKGROUND;
    case 4:
      return DESIGN_D4_STAGE_BACKGROUND;
    default:
      return levelBackgrounds[0];
  }
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
      (challenge, index) => {
        const internalNumber = index + 1;
        const explicitNumber = Number(challenge?.numero || challenge?.actividad || challenge?.desafio);
        const idMatch = String(challenge?.id || "").match(/d(\d+)$/i);
        const displayNumber = Number.isFinite(explicitNumber) && explicitNumber > 0
          ? explicitNumber
          : idMatch ? Number(idMatch[1]) : internalNumber;

        return `
        <button class="selector-chip ${index === 0 ? "is-active" : ""}" type="button" data-challenge="${internalNumber}" aria-label="desafio ${displayNumber}">
          <strong>${displayNumber}</strong>
        </button>
      `;
      },
    )
    .join("");

  selectorButtons = [...selectorWrap.querySelectorAll(".selector-chip")];
}

function mapChallengeTitles(levelData) {
  const challenges = getChallengesFromData(levelData);
  if (!challenges.length) return;

  challengeTitles = Object.fromEntries(
    challenges.map((challenge, index) => [index + 1, challenge.titulo || `desafio ${index + 1}`]),
  );
}

function getChallengeDisplayNumber(id) {
  const challenge = getChallengesFromData(currentLevelData)[id - 1];
  const explicitNumber = Number(challenge?.numero || challenge?.actividad || challenge?.desafio);
  if (Number.isFinite(explicitNumber) && explicitNumber > 0) return explicitNumber;

  const idMatch = String(challenge?.id || "").match(/d(\d+)$/i);
  if (idMatch) return Number(idMatch[1]);

  return id;
}

function resolveChallengeInternalNumber(requestedNumber) {
  const challenges = getChallengesFromData(currentLevelData);
  const matchingIndex = challenges.findIndex((challenge, index) => {
    const explicitNumber = Number(challenge?.numero || challenge?.actividad || challenge?.desafio);
    if (Number.isFinite(explicitNumber) && explicitNumber > 0) return explicitNumber === requestedNumber;
    const idMatch = String(challenge?.id || "").match(/d(\d+)$/i);
    return idMatch ? Number(idMatch[1]) === requestedNumber : index + 1 === requestedNumber;
  });
  if (matchingIndex !== -1) return matchingIndex + 1;
  return Math.min(Math.max(requestedNumber, 1), totalChallenges);
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

function renderLevelRating(challengeId, nextScenario) {
  const savedRating = readLevelRating(challengeId);
  const prompt = nextScenario ? "Que te parecio este desafio?" : "Que te parecio este nivel?";
  const buttons = LEVEL_RATING_OPTIONS.map((option) => {
    const isSelected = option.value === savedRating;
    return `
      <button class="level-rating-button ${isSelected ? "is-selected" : ""}" type="button" data-rating-value="${option.value}" aria-label="${option.label}" aria-pressed="${isSelected ? "true" : "false"}">
        <span class="level-rating-emoji" aria-hidden="true">${option.emoji}</span>
        <span>${option.label}</span>
      </button>
    `;
  }).join("");

  return `
    <section class="level-rating" aria-labelledby="level-rating-title" data-rating-challenge="${challengeId}">
      <h3 id="level-rating-title">${prompt}</h3>
      <div class="level-rating-scale" role="group" aria-label="${prompt}">
        ${buttons}
      </div>
      <p class="level-rating-status" data-rating-status>${savedRating ? "Gracias por contarme." : "Elegi un emoji para responder."}</p>
    </section>
  `;
}

const FINAL_SUCCESS_ASSET_DIR = "nuevos/LO%20LOGRASTE";
const FINAL_FAILURE_ASSET_DIR = "tarjetas%20finalizacion%20nivel/NO%20LO%20LOGRASTE";
const FINAL_SUCCESS_RATING_OPTIONS = [
  { value: 1, label: "No me gusto", asset: "No%20me%20gusto.png" },
  { value: 2, label: "Mas o menos", asset: "Maso.png" },
  { value: 3, label: "Estuvo bien", asset: "bien.png" },
  { value: 5, label: "Me encanto", asset: "Me%20encanto.png" },
];
const FINAL_FAILURE_RATING_OPTIONS = [
  { value: 1, label: "No me gusto", asset: "No%20me%20gust%C3%B3.png" },
  { value: 2, label: "Mas o menos", asset: "Maso.png" },
  { value: 3, label: "Estuvo bien", asset: "bien.png" },
  { value: 5, label: "Me encanto", asset: "Me%20encanto.png" },
];

function finalSuccessAsset(fileName) {
  return `${FINAL_SUCCESS_ASSET_DIR}/${fileName}`;
}

function finalFailureAsset(fileName) {
  return `${FINAL_FAILURE_ASSET_DIR}/${fileName}`;
}

function renderFinalSuccessRating(challengeId) {
  const savedRating = readLevelRating(challengeId);

  return `
    <section class="final-rating final-rating-success" aria-labelledby="final-rating-title" data-rating-challenge="${challengeId}">
      <img class="final-rating-bg" src="${finalSuccessAsset("Cuadro%20Gris.png")}" alt="" aria-hidden="true" />
      <img class="final-rating-title" id="final-rating-title" src="${finalSuccessAsset("Te%20gusto.png")}" alt="Te gusto esta mision?" />
      <div class="final-rating-scale" role="group" aria-label="Te gusto esta mision?">
        ${FINAL_SUCCESS_RATING_OPTIONS.map((option) => {
          const isSelected = option.value === savedRating;
          return `
            <button class="final-rating-button ${isSelected ? "is-selected" : ""}" type="button" data-rating-value="${option.value}" aria-label="${option.label}" aria-pressed="${isSelected ? "true" : "false"}">
              <img src="${finalSuccessAsset(option.asset)}" alt="" aria-hidden="true" />
            </button>
          `;
        }).join("")}
      </div>
      <p class="final-rating-status" data-rating-status>${savedRating ? "Gracias por contarme." : "Elegi una opcion para responder."}</p>
    </section>
  `;
}

function renderFinalFailureRating(challengeId) {
  const savedRating = readLevelRating(challengeId);

  return `
    <section class="final-rating" aria-labelledby="final-rating-title" data-rating-challenge="${challengeId}">
      <img class="final-rating-title" id="final-rating-title" src="${finalFailureAsset("te%20gusto.png")}" alt="Te gusto esta mision?" />
      <div class="final-rating-scale" role="group" aria-label="Te gusto esta mision?">
        ${FINAL_FAILURE_RATING_OPTIONS.map((option) => {
          const isSelected = option.value === savedRating;
          return `
            <button class="final-rating-button ${isSelected ? "is-selected" : ""}" type="button" data-rating-value="${option.value}" aria-label="${option.label}" aria-pressed="${isSelected ? "true" : "false"}">
              <img src="${finalFailureAsset(option.asset)}" alt="" aria-hidden="true" />
            </button>
          `;
        }).join("")}
      </div>
      <p class="final-rating-status" data-rating-status>${savedRating ? "Gracias por contarme." : "Elegi una opcion para responder."}</p>
    </section>
  `;
}

function renderFinalSuccessCard(id, nextScenario) {
  const nextAction = nextScenario
    ? `<button class="final-action final-action-next" type="button" data-next-scenario="${nextScenario}" aria-label="Siguiente mision">
        <img src="${finalSuccessAsset("Boton%20turqeuza.png")}" alt="" aria-hidden="true" />
      </button>`
    : `<a class="final-action final-action-next" href="index.html" aria-label="Volver a grados">
        <span>Volver a grados</span>
      </a>`;

  return `
    <article class="final-success-card" aria-labelledby="scenario-modal-title">
      <img class="final-success-bg" src="${finalSuccessAsset("Fondo.png")}" alt="" aria-hidden="true" />
      <img class="final-success-title" src="${finalSuccessAsset("LO%20LOGRASTE.png")}" alt="" aria-hidden="true" />
      <img class="final-success-robot" src="${MODAL_SUCCESS_ROBOT_IMAGE_SRC}" alt="" aria-hidden="true" />
      <h2 class="sr-only" id="scenario-modal-title">Lo lograste</h2>
      <img class="final-success-subtitle" src="${finalSuccessAsset("Desafio.png")}" alt="Desafio completado" />
      <div class="final-success-divider" aria-hidden="true"></div>
      ${renderFinalSuccessRating(id)}
      <div class="final-success-actions">
        <button class="final-action final-action-replay" type="button" data-replay-scenario="${id}" aria-label="Volver a intentar">
          <img src="${finalSuccessAsset("Boton%20azul.png")}" alt="" aria-hidden="true" />
        </button>
        ${nextAction}
      </div>
    </article>
  `;
}

function renderFinalFailureCard(id) {
  return `
    <article class="final-success-card final-failure-card" aria-labelledby="scenario-modal-title">
      <img class="final-success-bg" src="${finalFailureAsset("No%20lo%20lograste.png")}" alt="" aria-hidden="true" />
      <img class="final-success-title final-failure-title" src="${finalFailureAsset("UPSS.png")}" alt="" aria-hidden="true" />
      <img class="final-success-robot final-failure-robot" src="${MODAL_FAILURE_ROBOT_IMAGE_SRC}" alt="" aria-hidden="true" />
      <h2 class="sr-only" id="scenario-modal-title">Ups, casi lo logras</h2>
      <img class="final-success-subtitle final-failure-subtitle" src="${finalFailureAsset("Sigue%20jugando.png")}" alt="Sigue jugando" />
      <div class="final-success-divider" aria-hidden="true"></div>
      ${renderFinalFailureRating(id)}
      <div class="final-success-actions">
        <button class="final-action final-action-replay" type="button" data-replay-scenario="${id}" aria-label="Volver a intentar">
          <img src="${finalFailureAsset("Boton%20azul.png")}" alt="" aria-hidden="true" />
        </button>
        <a class="final-action final-action-next" href="index.html" aria-label="Volver al inicio">
          <img src="${finalFailureAsset("Boton%20turquesa.png")}" alt="" aria-hidden="true" />
        </a>
      </div>
    </article>
  `;
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
    const ratingControl = event.target.closest("[data-rating-value]");
    if (ratingControl) {
      const ratingSection = ratingControl.closest("[data-rating-challenge]");
      const challengeId = Number(ratingSection?.dataset.ratingChallenge);
      const ratingValue = Number(ratingControl.dataset.ratingValue);
      if (Number.isFinite(challengeId) && Number.isFinite(ratingValue)) {
        saveLevelRating(challengeId, ratingValue);
        ratingSection.querySelectorAll("[data-rating-value]").forEach((button) => {
          const isSelected = button === ratingControl;
          button.classList.toggle("is-selected", isSelected);
          button.setAttribute("aria-pressed", String(isSelected));
        });
        const status = ratingSection.querySelector("[data-rating-status]");
        if (status) status.textContent = "Gracias por contarme.";
      }
      return;
    }

    const closeControl = event.target.closest("[data-close-scenario-modal]");
    if (closeControl) {
      closeScenarioModal();
      return;
    }

    const nextControl = event.target.closest("[data-next-scenario]");
    if (nextControl) {
      const nextScenario = Number(nextControl.dataset.nextScenario);
      closeScenarioModal();
      goToScenario(nextScenario);
      return;
    }

    const replayControl = event.target.closest("[data-replay-scenario]");
    if (!replayControl) return;
    const replayScenario = Number(replayControl.dataset.replayScenario);
    closeScenarioModal();
    openChallenge(replayScenario);
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
  const content = scenarioModal.querySelector("[data-scenario-modal-content]");
  content.innerHTML = renderFinalSuccessCard(id, nextScenario);

  scenarioModal.hidden = false;
  document.body.classList.add("has-scenario-modal");
  scenarioModal.querySelector(".scenario-modal-panel")?.focus();
}

function showScenarioFailureModal(id) {
  if (!scenarioModal) scenarioModal = createScenarioModal();

  const content = scenarioModal.querySelector("[data-scenario-modal-content]");
  content.innerHTML = renderFinalFailureCard(id);

  scenarioModal.hidden = false;
  document.body.classList.add("has-scenario-modal");
  scenarioModal.querySelector(".scenario-modal-panel")?.focus();
}

function shouldShowFailureModal(text) {
  return !/(faltan|todavia|primero agrega|ya usaste|proba ejecutarlo|navegador no tiene|proximamente)/i.test(text);
}

function completeChallenge(id, delayMs = COMPLETION_MODAL_DELAY_MS) {
  if (!totalChallenges || id > totalChallenges) return;

  completedChallenges.add(id);
  document.querySelector(`[data-challenge="${id}"]`)?.classList.add("is-complete");
  window.setTimeout(() => showScenarioCompleteModal(id), delayMs);
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
  applyStageBackground(resolveChallengeBackground(challengeData, id));
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
  syncLevelBackground();
  selectorButtons.forEach((chip) => chip.classList.remove("is-active"));
  document.querySelector(`[data-challenge="${id}"]`)?.classList.add("is-active");
  challengeShell?.classList.add("is-open");
  challengeContent.innerHTML = `
    <article class="challenge-card">
      <p class="challenge-kicker">Proximamente</p>
      <h2>desafio ${id}</h2>
      <p>Este espacio queda reservado para las siguientes secciones.</p>
    </article>
  `;
}

function setMessage(text, tone = "") {
  const message = challengeContent.querySelector("[data-message]");
  if (!message) return;
  message.textContent = text;
  message.className = `challenge-message ${tone}`;
  if (tone === "is-success") playSound("win");
  if (tone.includes("is-error")) {
    playSound("lose");
    if (!tone.includes("is-soft-error") && shouldShowFailureModal(text) && scenarioModal?.hidden !== false) {
      window.setTimeout(() => {
        if (scenarioModal?.hidden === false) return;
        showScenarioFailureModal(activeChallengeId);
      }, 450);
    }
  }
}

function resetSpeechButton(button) {
  if (!button) return;
  button.classList.remove("is-speaking");
  button.disabled = false;
  const label = button.querySelector("[data-speech-label]");
  if (label) label.textContent = "ESCUCHAR CONSIGNA";
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

function cleanInstructionForSpeech(text) {
  return (text || "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/ð[^\s.,;:!?)]*/g, "")
    .replace(/(?:âœ¨|âš™|ï¸)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function speakInstruction(text, button) {
  const cleanText = cleanInstructionForSpeech(text);
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
        <button class="listen-consigna" type="button" data-speak-consigna aria-label="ESCUCHAR CONSIGNA" title="ESCUCHAR CONSIGNA">
          <span aria-hidden="true" class="listen-consigna-icon">&#128266;</span>
          <span data-speech-label>ESCUCHAR CONSIGNA</span>
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

document.addEventListener("click", (event) => {
  const interactive = event.target.closest("button, a, [role='button']");
  if (!interactive || interactive.closest("[data-sound-control]")) return;

  if (
    interactive.matches(".instruction-chip, .algorithm-card, .graphic-options button, .command-bank button, .option-bank button, .coord-bank button, .mini-choice-card, .event-card, .size-card, .lock-pad button")
    || interactive.hasAttribute("data-card")
    || interactive.hasAttribute("data-command")
    || interactive.hasAttribute("data-value")
    || interactive.hasAttribute("data-num")
  ) {
    playSound("place");
    return;
  }

  playSound("tap");
});

function enableMissingPieceDrag(container) {
  if (!container || container.dataset.dragPiecesEnabled) return;
  container.dataset.dragPiecesEnabled = "true";

  const missingPieceSourceSelector = ".instruction-chip, .option-bank button, .graphic-options button";
  const coordinateSourceSelector = ".coord-bank button";
  const n4SourceSelector = ".n4-drag-source";
  const sourceSelector = `${missingPieceSourceSelector}, ${coordinateSourceSelector}, ${n4SourceSelector}`;
  const blankTargetSelector = "[data-blank]";
  const coordinateTargetSelector = ".coord-cell";
  const n4TargetSelector = ".n4-drop-target";
  const dragThreshold = 7;
  let dragState = null;
  let highlightedTarget = null;

  function clearHighlightedTarget() {
    highlightedTarget?.classList.remove("is-drag-over");
    highlightedTarget = null;
  }

  function suppressNextNativeClick() {
    const suppress = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    document.addEventListener("click", suppress, { capture: true, once: true });
    window.setTimeout(() => document.removeEventListener("click", suppress, { capture: true }), 0);
  }

  function createDragGhost(source, event) {
    const ghost = source.cloneNode(true);
    const sourceRect = source.getBoundingClientRect();
    ghost.classList.add("piece-drag-ghost");
    if (source.matches(n4SourceSelector)) {
      ghost.classList.add("n4-piece-drag-ghost");
    }
    ghost.style.width = `${sourceRect.width}px`;
    ghost.style.height = `${sourceRect.height}px`;
    ghost.style.left = "0px";
    ghost.style.top = "0px";
    ghost.style.right = "auto";
    ghost.style.bottom = "auto";
    ghost.style.margin = "0";
    document.body.append(ghost);
    moveDragGhost(ghost, event.clientX, event.clientY);
    return ghost;
  }

  function moveDragGhost(ghost, clientX, clientY) {
    ghost.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
  }

  function targetFromPoint(clientX, clientY, source) {
    const targetSelector = source.matches(coordinateSourceSelector)
      ? coordinateTargetSelector
      : source.matches(n4SourceSelector)
        ? n4TargetSelector
        : blankTargetSelector;

    // Cuando la pieza queda por encima del target, elementFromPoint puede devolver
    // la propia pieza. elementsFromPoint permite buscar el primer drop target real.
    const stack = document.elementsFromPoint
      ? document.elementsFromPoint(clientX, clientY)
      : [document.elementFromPoint(clientX, clientY)];

    let target = null;
    let fallbackTarget = null;
    const sourcePieceId = source.matches(n4SourceSelector) ? source.dataset.piece : null;

    for (const element of stack) {
      if (!element || element === source || element.classList?.contains("piece-drag-ghost")) continue;
      const maybeTarget = element.closest?.(targetSelector);
      if (!maybeTarget) continue;

      if (!fallbackTarget) fallbackTarget = maybeTarget;

      if (!sourcePieceId || maybeTarget.dataset?.target === sourcePieceId) {
        target = maybeTarget;
        break;
      }
    }

    if (!target) target = fallbackTarget;

    return target && container.contains(target) && !target.disabled ? target : null;
  }

  function updateDropTarget(event) {
    const nextTarget = targetFromPoint(event.clientX, event.clientY, dragState.source);
    if (nextTarget === highlightedTarget) return nextTarget;
    clearHighlightedTarget();
    highlightedTarget = nextTarget;
    highlightedTarget?.classList.add("is-drag-over");
    return nextTarget;
  }

  function cleanupDrag() {
    dragState?.ghost?.remove();
    document.body.classList.remove("is-dragging-piece");
    clearHighlightedTarget();
    dragState = null;
  }

  function dispatchClick(element) {
    element.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    }));
  }

  function dropPiece(source, target) {
    if (source.matches(n4SourceSelector)) {
      dispatchClick(source);
      dispatchClick(target);
    } else if (source.matches(coordinateSourceSelector)) {
      dispatchClick(source);
      dispatchClick(target);
    } else {
      dispatchClick(target);
      dispatchClick(source);
    }
    playSound("place");
  }

  container.addEventListener("pointerdown", (event) => {
    const source = event.target.closest(sourceSelector);
    if (!source || !container.contains(source) || source.disabled || event.button > 0) return;

    dragState = {
      source,
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false,
      ghost: null,
    };

    const handlePointerMove = (moveEvent) => {
      if (!dragState) return;
      const distanceX = moveEvent.clientX - dragState.startX;
      const distanceY = moveEvent.clientY - dragState.startY;
      const distance = Math.hypot(distanceX, distanceY);

      if (!dragState.isDragging && distance < dragThreshold) return;

      if (!dragState.isDragging) {
        dragState.isDragging = true;
        dragState.ghost = createDragGhost(dragState.source, moveEvent);
        dragState.source.classList.add("is-drag-source");
        document.body.classList.add("is-dragging-piece");
      }

      moveEvent.preventDefault();
      moveDragGhost(dragState.ghost, moveEvent.clientX, moveEvent.clientY);
      updateDropTarget(moveEvent);
    };

    const handlePointerUp = (upEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);

      if (!dragState) return;
      const { source, isDragging } = dragState;
      source.classList.remove("is-drag-source");

      if (isDragging) {
        upEvent.preventDefault();
        const target = updateDropTarget(upEvent);
        if (target) dropPiece(source, target);
        suppressNextNativeClick();
      }

      cleanupDrag();
    };

    const handlePointerCancel = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      dragState?.source.classList.remove("is-drag-source");
      cleanupDrag();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
  });
}

enableMissingPieceDrag(challengeContent);

function renderHeader(id, instruction) {
  const headerId = Number.isInteger(id) ? id : activeChallengeId;
  return renderChallengeHeader(`desafio ${getChallengeDisplayNumber(headerId)}`, challengeTitles[headerId], formatChallengeInstructionMarkup(headerId, instruction));
}

function formatChallengeInstructionMarkup(id, instruction) {
  if (id === 13) {
    return instruction.replace(
      /(¡?\s*Atenci[óo]n\s*!?)/i,
      '<span class="n4-color-repair-title-line">$1</span>',
    );
  }

  if (id === 12) {
    return instruction.replace(
      /(¡?Alerta en el c[óo]digo!?)/i,
      '<span class="n4-light-debug-title-line">$1</span>',
    );
  }

  if (id === 11) {
    return instruction.replace(
      /(Nano ordena sus piezas:\s*tornillo,\s*tuerca,\s*tornillo\.\.\.)\s*(Toca la herramienta que sigue en la fila)/i,
      '<span class="n4-hardware-title-line">$1</span><span class="n4-hardware-subtitle-line">$2</span>',
    );
  }

  if (id !== 10) return instruction;

  return instruction.replace(
    /(Cuadrado,\s*c[íi]rculo,\s*cuadrado\.\.\.)/i,
    '<span class="consigna-strike">$1</span>',
  );
}

function getChallengeInstruction(id, fallbackText) {
  const challengeId = Number.isInteger(id) ? id : activeChallengeId;
  const challenge = getChallengesFromData(currentLevelData)[challengeId - 1];
  const baseInstruction = challenge?.consigna || fallbackText;
  if (baseInstruction.trim().toUpperCase() === "VER") return baseInstruction;
  if (String(challenge?.id || "").startsWith("n4-rework-")) return baseInstruction;
  if (String(challenge?.id || "").startsWith("n5-")) return baseInstruction;
  if (String(challenge?.id || "").startsWith("n6-")) return baseInstruction;
  const reminders = [];
  const normalizedInstruction = baseInstruction
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if ((id === 2 || id === 3) && !/(agua|charco)/.test(normalizedInstruction)) {
    reminders.push("Si hay agua, evita pasar por ahi para no danar al robot.");
  }

  if ((id === 3 || id === 5) && !/(bateria|energia|pila)/.test(normalizedInstruction)) {
    reminders.push("Agarra la bateria y la recarga para que el robot no se quede sin energia.");
  }

  if (!reminders.length) return baseInstruction;
  return `${baseInstruction} ${reminders.join(" ")}`;
}

const commandAssets = {
  Avanzar: "tarjetas%20movimiento/AVANZAR.png",
  "Girar der.": "tarjetas%20movimiento/DERECHA.png",
  "Girar derecha": "tarjetas%20movimiento/DERECHA.png",
  "Girar izq.": "tarjetas%20movimiento/IZQUIERDA.png",
  "Girar izquierda": "tarjetas%20movimiento/IZQUIERDA.png",
};

const orangeCommandAssets = {
  Avanzar: "tarjetas%20movimiento/AVANZAR.png",
  "Girar der.": "assets/Naranja%202.png",
  "Girar derecha": "assets/Naranja%202.png",
  "Girar izq.": "assets/naranja%201.png",
  "Girar izquierda": "assets/naranja%201.png",
};

const commandImageClasses = {
  Avanzar: "command-image-avanzar",
  "Girar der.": "command-image-turn-right",
  "Girar derecha": "command-image-turn-right",
  "Girar izq.": "command-image-turn-left",
  "Girar izquierda": "command-image-turn-left",
};

function renderCommand(command, variant = "default") {
  const asset = variant === "orange" ? orangeCommandAssets[command] : commandAssets[command];
  const imageClass = commandImageClasses[command] || "";
  const variantClass = variant === "orange" ? "command-image-orange" : "";
  if (asset) {
    return `
      <span class="command-symbol" aria-hidden="true">
        <img class="command-image ${imageClass} ${variantClass}" src="${asset}" alt="" />
      </span>
      <span class="command-label">${command}</span>
    `;
  }

  return `
    <span class="command-label command-label-only">${command}</span>
  `;
}

function renderInlineCommand(command) {
  return `<span class="inline-command">${renderCommand(command)}</span>`;
}

function renderCommandButton(command, className = "instruction-chip", variant = "default") {
  return `
    <button class="${className}" type="button" data-value="${command}" aria-label="${command}">
      ${renderCommand(command, variant)}
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

function renderNanoAssemblyChallenge(id = 1) {
  const facePiece = { id: "cara", label: "Cara", file: "Cara.png", x: 50, y: 38.1, w: 8, h: 7, hitW: 14, hitH: 12 };
  const pieces = [
    { id: "cabeza",         label: "Cabeza",          file: "cabeza.png",           x: 50,   y: 36.5, w: 18,  h: 14,   hitW: 24, hitH: 20, sx: 64, sy: 40, sw: 9.5 },
    { id: "torzo",          label: "Torzo",            file: "Torzo.png",             x: 50.2, y: 54.4, w: 16.2,h: 24.1, hitW: 27, hitH: 33, sx: 23, sy: 71, sw: 7.2, ox: -0.6, oy: 1.2 },
    { id: "brazo-izquierdo",label: "Brazo izquierdo",  file: "Brazo izquierdo.png",   x: 41.8, y: 51.2, w: 11.1,h: 14.9, hitW: 18, hitH: 22, sx: 34, sy: 60, sw: 6.8, dx: -8 },
    { id: "brazo-derecho",  label: "Brazo derecho",    file: "Brazo derecho.png",     x: 57.5, y: 55,   w: 10,  h: 22,   hitW: 16, hitH: 27, sx: 69, sy: 64, sw: 6.8, dx: -7, dy: 4 },
    { id: "mano-izquierda", label: "Mano izquierda",   file: "Mano izquierdo.png",   x: 38.3, y: 47.2, w: 10,  h: 11,   hitW: 16, hitH: 16, sx: 30, sy: 42, sw: 5.6, dx: -10, dy: 3 },
    { id: "mano-derecha",   label: "Mano derecha",     file: "Mano drecha.png",       x: 59.5, y: 67,   w: 9,   h: 11,   hitW: 15, hitH: 16, sx: 79, sy: 69, sw: 5.6, dy: 20 },
    { id: "pierna-izquierda",label: "Pierna izquierda",file: "Pierna izquierda.png", x: 45.9, y: 74.8, w: 9.6, h: 27,   hitW: 14, hitH: 30, sx: 21, sy: 35, sw: 6.4 },
    { id: "pierna-derecha", label: "Pierna derecha",   file: "Pierna derecha.png",   x: 54.1, y: 74.8, w: 9.6, h: 27,   hitW: 14, hitH: 30, sx: 78, sy: 35, sw: 6.4 },
  ];
  const placed = new Set();
  let selectedPiece = null;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-assembly-card">
      <header class="challenge-header n4-assembly-header">
        <p class="challenge-kicker">desafio ${id}</p>
        <div class="challenge-title-row">
          <h2>${challengeTitles[id] || "A ensamblar"}</h2>
          <button class="listen-consigna" type="button" data-speak-consigna aria-label="ESCUCHAR CONSIGNA" title="ESCUCHAR CONSIGNA">
            <span aria-hidden="true" class="listen-consigna-icon">&#128266;</span>
            <span data-speech-label>ESCUCHAR CONSIGNA</span>
          </button>
        </div>
        <p data-consigna-text>${getChallengeInstruction(id, "¡A ensamblar! ¡Hola! Nano está desarmado. Observa las piezas y arrástralas a su lugar para armarlo. ¡Tú puedes!")}</p>
      </header>
      <div class="n4-assembly-layout n4-assembly-layout-single">
        <section class="n4-assembly-stage" aria-label="Silueta de Nano">
          <img class="n4-nano-silhouette" src="${n4Asset(1, "Silueta.png")}" alt="Silueta de Nano" />

          ${pieces.map((piece) => `
            <button class="n4-piece n4-piece-floating n4-drag-source" type="button" data-piece="${piece.id}" data-label="${piece.label}" aria-label="${piece.label}" style="--sx:${piece.sx}%;--sy:${piece.sy}%;--sw:${piece.sw}%;">
              <img src="${n4Asset(1, piece.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}

          <div class="n4-assembly-target-layer" aria-hidden="true">
            ${pieces.map((piece) => `
              <button class="n4-assembly-target n4-drop-target" type="button" data-target="${piece.id}" data-label="${piece.label}" style="--x:${piece.x}%;--y:${piece.y}%;--hit-w:${piece.hitW || piece.w}%;--hit-h:${piece.hitH || piece.h}%;--img-w:${(piece.w / (piece.hitW || piece.w)) * 100}%;--img-h:${(piece.h / (piece.hitH || piece.h)) * 100}%;--img-ox:${piece.ox || 0}%;--img-oy:${piece.oy || 0}%;--target-offset-x:${piece.dx || 0}px;--target-offset-y:${piece.dy || 0}px;" aria-label="Lugar de ${piece.label}"></button>
            `).join("")}
            <div class="n4-assembly-target n4-face-reveal-target" data-face-reveal style="--x:${facePiece.x}%;--y:${facePiece.y}%;--hit-w:${facePiece.hitW || facePiece.w}%;--hit-h:${facePiece.hitH || facePiece.h}%;--img-w:${(facePiece.w / (facePiece.hitW || facePiece.w)) * 100}%;--img-h:${(facePiece.h / (facePiece.hitH || facePiece.h)) * 100}%;--img-ox:${facePiece.ox || 0}%;--img-oy:${facePiece.oy || 0}%;"></div>
          </div>
        </section>
      </div>
      <p class="challenge-message" data-message>Elegí una pieza y llevala al lugar que coincide con la silueta.</p>
    </article>
  `;

  function clearSelection() {
    challengeContent.querySelectorAll(".n4-piece").forEach((piece) => piece.classList.remove("is-selected"));
    challengeContent.querySelectorAll(".n4-assembly-target").forEach((target) => target.classList.remove("is-available"));
  }

  function revealFaceAndComplete() {
    const faceTarget = challengeContent.querySelector("[data-face-reveal]");
    const card = challengeContent.querySelector(".n4-assembly-card");
    faceTarget?.classList.add("is-filled", "is-face-on");
    if (faceTarget) {
      faceTarget.innerHTML = `<img src="${n4Asset(1, facePiece.file)}" alt="${facePiece.label}" />`;
    }
    card?.classList.add("is-nano-powered");
    playSound("success");
    setMessage("Nano se prendió. La cara apareció sola.", "is-success");
    completeChallenge(id);
  }

  function placePiece(target) {
    if (!selectedPiece || placed.has(target.dataset.target)) return;
    const piece = pieces.find((item) => item.id === selectedPiece.dataset.piece);
    if (!piece) return;

    if (target.dataset.target !== piece.id) {
      target.classList.add("is-wrong");
      window.setTimeout(() => target.classList.remove("is-wrong"), 480);
      clearSelection();
      selectedPiece = null;
      setMessage("Casi. Esa pieza vuelve a su lugar. Probá otra zona de la silueta.", "is-error is-soft-error");
      return;
    }

    placed.add(piece.id);
    target.classList.add("is-filled");
    target.innerHTML = `<img src="${n4Asset(1, piece.file)}" alt="${piece.label}" />`;
    selectedPiece.disabled = true;
    selectedPiece.setAttribute("aria-disabled", "true");
    selectedPiece.classList.remove("n4-drag-source");
    selectedPiece.hidden = true;
    selectedPiece = null;
    clearSelection();
    playSound("success");

    if (placed.size === pieces.length) {
      revealFaceAndComplete();
    } else {
      setMessage(`Muy bien. Ya van ${placed.size} de ${pieces.length} piezas.`, "is-good");
    }
  }

  challengeContent.querySelectorAll(".n4-piece").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.hidden) return;
      selectedPiece = button;
      clearSelection();
      button.classList.add("is-selected");
      challengeContent.querySelectorAll(".n4-assembly-target:not(.is-filled)").forEach((target) => target.classList.add("is-available"));
      setMessage(`Ahora buscá el lugar de ${button.dataset.label || "esa pieza"}.`, "is-good");
    });
  });

  challengeContent.querySelectorAll(".n4-drop-target").forEach((target) => {
    target.addEventListener("click", () => placePiece(target));
  });
}

function renderTechnologySortChallenge(id = 2) {
  const items = [
    { id: "cable", label: "Cable USB", file: "Cable usb.png", kind: "tech", x: 25, y: 52.5, w: 9.6 },
    { id: "oso", label: "Oso", file: "OSO.png", kind: "toy", x: 38, y: 51.5, w: 7.6, dy: -10 },
    { id: "placa", label: "Parte de compu", file: "PARTE DE LA COMPU.png", kind: "tech", x: 53, y: 52.8, w: 8.6 },
    { id: "pelota", label: "Pelota", file: "PEÑOTA.png", kind: "toy", x: 67, y: 51.7, w: 7.8 },
    { id: "robot", label: "Robot", file: "ROBOT.png", kind: "tech", x: 80.5, y: 51.6, w: 7.7, dy: -10 },
    { id: "consola", label: "Consola", file: "CONSOLA - CONSIGNA 2 - NIVEL 4.png", kind: "tech", x: 29, y: 62.2, w: 10.5, dy: -10 },
    { id: "auriculares", label: "Auriculares", file: "AURICULARES.png", kind: "tech", x: 43.5, y: 63.4, w: 8.2, dy: -10 },
    { id: "auto", label: "Auto", file: "AUTO.png", kind: "toy", x: 58, y: 62.8, w: 7.1, dy: -10 },
    { id: "patito", label: "Patito", file: "PATITO.png", kind: "toy", x: 71.5, y: 63.2, w: 6.5, dy: -10 },
  ];
  const needed = items.filter((item) => item.kind === "tech");
  const placedTech = new Set();
  const parkedToys = new Set();
  let selectedItem = null;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-sort-card">
      ${renderHeader(id, getChallengeInstruction(id, "¡Caja de Herramientas! Nano necesita ordenar. Arrastra las piezas de tecnología a la caja. ¡A limpiar!"))}
      <div class="n4-sort-scene">
        <div class="n4-sort-items" aria-label="Objetos del taller">
          ${items.map((item) => `
            <button class="n4-sort-item n4-drag-source" type="button" data-item="${item.id}" data-kind="${item.kind}" data-label="${item.label}" aria-label="${item.label}" style="--x:${item.x}%;--y:${item.y}%;--w:${item.w}%;--item-offset-y:${item.dy || 0}px;">
              <img src="${n4Asset(2, item.file)}" alt="" aria-hidden="true" />
              <span>${item.label}</span>
            </button>
          `).join("")}
        </div>
        <button class="n4-sort-bin n4-sort-bin-tech n4-drop-target" type="button" data-bin="tech" aria-label="Caja de tecnologia">
          <img src="${n4Asset(2, "caja de tecnologia.png")}" alt="" aria-hidden="true" />
          <strong data-count>0/${needed.length}</strong>
        </button>
        <button class="n4-sort-bin n4-sort-bin-toy n4-drop-target" type="button" data-bin="toy" aria-label="Caja de juguetes">
          <img src="${n4Asset(2, "caja de juguetes.png")}" alt="" aria-hidden="true" />
        </button>
      </div>
      <p class="challenge-message" data-message>Seleccioná solo tecnologia: cables, partes y piezas de robot.</p>
    </article>
  `;

  function clearSelection() {
    challengeContent.querySelectorAll(".n4-sort-item").forEach((item) => item.classList.remove("is-selected"));
  }

  function sendToBox(targetKind) {
    if (!selectedItem || selectedItem.disabled) return;

    const itemKind = selectedItem.dataset.kind;
    const itemId = selectedItem.dataset.item;

    if (itemKind === "tech" && targetKind === "tech") {
      placedTech.add(itemId);
      selectedItem.classList.add("is-collected");
      selectedItem.disabled = true;
      selectedItem.hidden = true;
      challengeContent.querySelector("[data-count]").textContent = `${placedTech.size}/${needed.length}`;
      playSound("success");

      if (placedTech.size === needed.length) {
        setMessage("Caja ordenada. Dejaste los juguetes fuera y guardaste la tecnologia.", "is-success");
        completeChallenge(id);
      } else {
        setMessage(`Bien guardado. Faltan ${needed.length - placedTech.size} piezas tecnologicas.`, "is-good");
      }
    } else if (itemKind === "toy" && targetKind === "toy") {
      parkedToys.add(itemId);
      selectedItem.classList.add("is-collected");
      selectedItem.disabled = true;
      selectedItem.hidden = true;
      setMessage("Perfecto. Ese objeto va en la caja de juguetes.", "is-good");
      playSound("success");
    } else {
      selectedItem.classList.add("is-wrong");
      window.setTimeout(() => selectedItem.classList.remove("is-wrong"), 520);
      setMessage("Ups. Ese objeto no va en esa caja.", "is-error");
    }

    selectedItem = null;
    clearSelection();
  }

  challengeContent.querySelectorAll(".n4-sort-item").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      selectedItem = button;
      clearSelection();
      button.classList.add("is-selected");
    });
  });

  challengeContent.querySelectorAll(".n4-sort-bin").forEach((bin) => {
    bin.addEventListener("click", () => sendToBox(bin.dataset.bin));
  });
}

function renderHiddenPartsChallenge(id = 3) {
  const parts = [
    { id: "bateria", label: "Bateria", file: "Bateria.png" },
    { id: "chip", label: "Chip", file: "chip.png" },
    { id: "engranaje", label: "Engranaje", file: "engranaje.png" },
    { id: "tornillos", label: "Tornillos", file: "tornillos.png" },
    { id: "cable", label: "Cable", file: "cable.png" },
  ];
  const totalRounds = 3;
  let currentRound = 1;
  let found = new Set();
  let lastRoundPositions = new Map();

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-hidden-card">
      ${renderHeader(id, getChallengeInstruction(id, "El taller está desordenado. Busca bien y toca las cinco piezas escondidas de Nano. ¡Encuéntralas todas!"))}
      <p class="n4-hidden-round" data-round>Ronda 1 de ${totalRounds}</p>
      <div class="n4-hidden-scene">
      </div>
      <p class="challenge-message" data-message></p>
    </article>
  `;

  const scene = challengeContent.querySelector(".n4-hidden-scene");
  const roundLabel = challengeContent.querySelector("[data-round]");

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function distanceBetween(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function makeRandomPositions() {
    const positions = new Map();

    parts.forEach((part) => {
      let candidate = null;
      let minDistance = 18;

      for (let attempt = 0; attempt < 160; attempt += 1) {
        const next = {
          x: randomBetween(12, 88),
          y: randomBetween(18, 82),
        };
        const previous = lastRoundPositions.get(part.id);
        const farFromOthers = [...positions.values()].every((position) => distanceBetween(position, next) >= minDistance);
        const movedEnough = !previous || distanceBetween(previous, next) >= 16;

        if (farFromOthers && movedEnough) {
          candidate = next;
          break;
        }

        if (attempt === 90) minDistance = 14;
      }

      positions.set(part.id, candidate || {
        x: randomBetween(12, 88),
        y: randomBetween(18, 82),
      });
    });

    lastRoundPositions = positions;
    return positions;
  }

  function renderRound() {
    found = new Set();
    const positions = makeRandomPositions();
    roundLabel.textContent = `Ronda ${currentRound} de ${totalRounds}`;
    scene.innerHTML = parts.map((part) => {
      const position = positions.get(part.id);
      return `
        <button class="n4-hidden-part" type="button" data-part="${part.id}" style="--x:${position.x.toFixed(2)}%;--y:${position.y.toFixed(2)}%;" aria-label="${part.label}">
          <img src="${n4Asset(3, part.file)}" alt="" aria-hidden="true" />
        </button>
      `;
    }).join("");

    setMessage(`Ronda ${currentRound}/${totalRounds}: encontra bateria, chip, engranaje, tornillos y cable. Van 0 de ${parts.length}.`);

    scene.querySelectorAll(".n4-hidden-part").forEach((button) => {
      button.addEventListener("click", () => {
        if (found.has(button.dataset.part)) return;
        found.add(button.dataset.part);
        button.classList.add("is-found");
        playSound("success");

        if (found.size === parts.length) {
          if (currentRound === totalRounds) {
            setMessage("Encontraste todas las piezas en las 3 rondas.", "is-success");
            completeChallenge(id);
            return;
          }

          const completedRound = currentRound;
          currentRound += 1;
          setMessage(`Ronda ${completedRound} lista. Preparando una nueva ubicacion...`, "is-good");
          window.setTimeout(renderRound, 850);
          return;
        }

        setMessage(`Muy buen ojo. Ronda ${currentRound}/${totalRounds}: van ${found.size} de ${parts.length}.`, "is-good");
      });
    });
  }

  renderRound();
}

function renderArrowChoiceChallenge(id, correct) {
  const challengeNumber = correct === "avanzar" ? 4 : correct === "derecha" ? 5 : 6;
  const options = correct === "avanzar"
    ? [
      { id: "izquierda", label: "Izquierda", file: "IZQUIERDA.png" },
      { id: "avanzar", label: "Avanzar", file: "AVANZAR.png" },
      { id: "derecha", label: "Derecha", file: "DERECHA.png" },
    ]
    : [
      { id: "izquierda", label: "Izquierda", file: "IZQUIERDA.png" },
      { id: "derecha", label: "Derecha", file: "DERECHA.png" },
    ];

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-arrow-card">
      ${renderHeader(id, getChallengeInstruction(id, "Observa a Nano y toca la tarjeta correcta."))}
      <div class="n4-arrow-scene">
        <div class="n4-arrow-route">
          <img src="${n4Asset(challengeNumber, "Entrada.png")}" alt="Entrada" />
          ${renderNanoDirectionImage("n4-arrow-nano", correct === "derecha" ? "right" : correct === "izquierda" ? "left" : "up")}
          <img src="${n4Asset(challengeNumber, "Vamos.png")}" alt="Llegada" />
        </div>
        <div class="n4-arrow-options" aria-label="Tarjetas">
          ${options.map((option) => `
            <button class="n4-arrow-option" type="button" data-choice="${option.id}" aria-label="${option.label}">
              <img src="${n4Asset(challengeNumber, option.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>Miralo con calma y elegí la tarjeta que corresponde.</p>
    </article>
  `;

  challengeContent.querySelectorAll(".n4-arrow-option").forEach((button) => {
    button.addEventListener("click", () => {
      challengeContent.querySelectorAll(".n4-arrow-option").forEach((option) => option.classList.remove("is-wrong", "is-correct"));
      if (button.dataset.choice === correct) {
        button.classList.add("is-correct");
        setMessage("Esa es la tarjeta correcta. Nano ya sabe para donde ir.", "is-success");
        completeChallenge(id);
      } else {
        button.classList.add("is-wrong");
        setMessage("Casi. Mirá otra vez hacia donde tiene que ir Nano.", "is-error");
      }
    });
  });
}

function renderCarpetArrowChoiceChallenge(id, correct) {
  const challengeNumber = correct === "avanzar" ? 4 : correct === "derecha" ? 5 : 6;
  const labels = {
    avanzar: "Avanzar",
    derecha: "Derecha",
    izquierda: "Izquierda",
  };
  const files = {
    avanzar: "AVANZAR.png",
    derecha: "DERECHA.png",
    izquierda: "IZQUIERDA.png",
  };
  const routes = {
    avanzar: {
      start: { row: 4, col: 2, facing: "up" },
      targets: [
        { row: 3, col: 2, expected: "avanzar" },
        { row: 2, col: 2, expected: "avanzar" },
      ],
      goal: { row: 1, col: 2 },
      prompt: "Arma el camino hacia adelante con las tarjetas de avance.",
      success: "Muy bien. Nano siguio el camino hacia adelante.",
    },
    derecha: {
      start: { row: 3, col: 1, facing: "right" },
      targets: [
        { row: 3, col: 2, expected: "derecha" },
        { row: 3, col: 3, expected: "derecha" },
      ],
      goal: { row: 3, col: 4 },
      prompt: "Arma el camino hacia la derecha de Nano.",
      success: "Perfecto. Nano reconocio el camino de la derecha.",
    },
    izquierda: {
      start: { row: 3, col: 4, facing: "left" },
      targets: [
        { row: 3, col: 3, expected: "izquierda" },
        { row: 3, col: 2, expected: "izquierda" },
      ],
      goal: { row: 3, col: 1 },
      prompt: "Arma el camino hacia la izquierda de Nano.",
      success: "Excelente. Nano giro su atencion hacia la izquierda.",
    },
  };
  const route = routes[correct] || routes.avanzar;
  const options = correct === "avanzar"
    ? [
      { id: "izquierda", label: "Izquierda", file: "IZQUIERDA.png" },
      { id: "avanzar", label: "Avanzar", file: "AVANZAR.png" },
      { id: "derecha", label: "Derecha", file: "DERECHA.png" },
    ]
    : [
      { id: "izquierda", label: "Izquierda", file: "IZQUIERDA.png" },
      { id: "derecha", label: "Derecha", file: "DERECHA.png" },
    ];
  const startKey = `${route.start.row}-${route.start.col}`;
  const goalKey = `${route.goal.row}-${route.goal.col}`;
  const targetByKey = new Map(route.targets.map((target, index) => [`${target.row}-${target.col}`, { ...target, index }]));
  const routeKeys = new Set([startKey, goalKey, ...route.targets.map((target) => `${target.row}-${target.col}`)]);
  let selectedPiece = null;
  let completed = false;

  function renderCarpetCell(row, col) {
    const key = `${row}-${col}`;
    const target = targetByKey.get(key);

    if (key === startKey) {
      return `
        <div class="n4-carpet-cell n4-carpet-start is-route" style="--row:${row + 1};--col:${col + 1};">
          <img class="n4-carpet-start-badge" src="${n4Asset(challengeNumber, "Entrada.png")}" alt="" aria-hidden="true" />
          ${renderNanoDirectionImage("n4-carpet-nano", route.start.facing)}
        </div>
      `;
    }

    if (key === goalKey) {
      return `
        <div class="n4-carpet-cell n4-carpet-goal is-route" style="--row:${row + 1};--col:${col + 1};">
          <img src="${n4Asset(challengeNumber, "Vamos.png")}" alt="Llegada" />
        </div>
      `;
    }

    if (target) {
      return `
        <button class="n4-carpet-cell n4-carpet-drop n4-drop-target is-route" type="button" data-step="${target.index}" data-expected="${target.expected}" style="--row:${row + 1};--col:${col + 1};" aria-label="Casillero ${target.index + 1}: ${labels[target.expected]}">
          <span>${target.index + 1}</span>
        </button>
      `;
    }

    return `<div class="n4-carpet-cell ${routeKeys.has(key) ? "is-route" : ""}" style="--row:${row + 1};--col:${col + 1};"></div>`;
  }

  const gridMarkup = Array.from({ length: 36 }, (_, index) => {
    const row = Math.floor(index / 6);
    const col = index % 6;
    return renderCarpetCell(row, col);
  }).join("");

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-arrow-card">
      ${renderHeader(id, getChallengeInstruction(id, "Observa a Nano y toca la tarjeta correcta."))}
      <div class="n4-arrow-scene">
        <div class="n4-carpet-layout">
          <div class="n4-carpet-map" aria-label="Alfombra cuadriculada">
            <div class="n4-carpet-grid">
              ${gridMarkup}
            </div>
          </div>
        </div>
        <div class="n4-arrow-options" aria-label="Tarjetas">
          ${options.map((option) => `
            <button class="n4-arrow-option n4-carpet-option n4-drag-source" type="button" data-piece="${option.id}" aria-label="${option.label}">
              <img src="${n4Asset(challengeNumber, option.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>${route.prompt}</p>
    </article>
  `;

  function clearSelection() {
    challengeContent.querySelectorAll(".n4-carpet-option").forEach((button) => button.classList.remove("is-selected"));
  }

  function filledTargets() {
    return [...challengeContent.querySelectorAll(".n4-carpet-drop")].filter((target) => target.dataset.value === target.dataset.expected);
  }

  function placePiece(target) {
    if (completed || target.disabled) return;
    if (!selectedPiece) {
      setMessage("Primero elegi una tarjeta para ponerla en el caminito.", "is-error");
      return;
    }

    const chosen = selectedPiece.dataset.piece;
    const expected = target.dataset.expected;

    if (chosen !== expected) {
      const wrongPiece = selectedPiece;
      target.classList.add("is-wrong");
      wrongPiece.classList.add("is-wrong");
      window.setTimeout(() => {
        target.classList.remove("is-wrong");
        wrongPiece.classList.remove("is-wrong");
      }, 520);
      setMessage(`Casi. Ese casillero necesita ${labels[expected].toLowerCase()}.`, "is-error");
      return;
    }

    target.dataset.value = chosen;
    target.disabled = true;
    target.classList.add("is-filled", "is-correct");
    target.innerHTML = `<img src="${n4Asset(challengeNumber, files[chosen])}" alt="${labels[chosen]}" />`;
    playSound("success");

    if (filledTargets().length === route.targets.length) {
      completed = true;
      clearSelection();
      selectedPiece = null;
      setMessage(route.success, "is-success");
      completeChallenge(id);
      return;
    }

    setMessage("Bien. Segui completando el camino.", "is-good");
  }

  challengeContent.querySelectorAll(".n4-carpet-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (completed) return;
      selectedPiece = button;
      clearSelection();
      button.classList.add("is-selected");
      setMessage(`Tarjeta ${labels[button.dataset.piece].toLowerCase()} lista para colocar.`, "is-good");
    });
  });

  challengeContent.querySelectorAll(".n4-carpet-drop").forEach((target) => {
    target.addEventListener("click", () => placePiece(target));
  });
}

const N4_PROGRAM_CARDS = {
  avanzar: { label: "Avanzar", file: "AVANZAR.png" },
  derecha: { label: "Derecha", file: "DERECHA.png" },
  izquierda: { label: "Izquierda", file: "IZQUIERDA.png" },
};
const N4_PROGRAM_DELTAS = [[-1, 0], [0, 1], [1, 0], [0, -1]];

function getN4ProgrammingConfig(id) {
  const configs = {
    4: {
      assetChallenge: 4,
      rows: 4,
      cols: 4,
      start: { row: 2, col: 1, dir: 1 },
      goal: { row: 2, col: 2 },
      route: ["2-1", "2-2"],
      solution: ["avanzar"],
      availableCards: ["avanzar"],
      fallbackInstruction: "Nano ya esta mirando hacia el camino. Coloca la tarjeta Avanzar para que llegue a la meta.",
      initialMessage: "Completa el timeline con la tarjeta Avanzar.",
      missingMessage: "Falta colocar la tarjeta Avanzar.",
      failureMessage: "Casi. Nano solo necesita avanzar.",
      successMessage: "Muy bien. Nano avanzo hacia la meta.",
    },
    5: {
      assetChallenge: 5,
      rows: 4,
      cols: 4,
      start: { row: 2, col: 1, dir: 0 },
      goal: { row: 2, col: 2 },
      route: ["2-1", "2-2"],
      solution: ["derecha", "avanzar"],
      availableCards: ["avanzar", "derecha", "izquierda"],
      fallbackInstruction: "Nano está mirando hacia la derecha, ¡listo para doblar! Observa su posición y elige la tarjeta que apunta hacia el mismo lado para que no se pierda",
      initialMessage: "Primero gira a la derecha, despues avanza.",
      missingMessage: "Completa los dos pasos del algoritmo.",
      failureMessage: "Revisa el orden: para doblar a la derecha, primero va Derecha y despues Avanzar.",
      successMessage: "Perfecto. Nano doblo a la derecha y siguio el camino.",
    },
    6: {
      assetChallenge: 6,
      rows: 4,
      cols: 4,
      start: { row: 2, col: 2, dir: 0 },
      goal: { row: 2, col: 1 },
      route: ["2-2", "2-1"],
      solution: ["izquierda", "avanzar"],
      availableCards: ["avanzar", "derecha", "izquierda"],
      startAsset: "Mecanico.png",
      startAlt: "Mecanico",
      startAssetClass: "play-cell-img--landmark",
      goalAsset: "Plaza.png",
      goalAlt: "Plaza",
      goalAssetClass: "play-cell-img--landmark",
      fallbackInstruction: "¡Giro a la vista! ¡Llegamos a un cruce! Nano quiere ir a la plaza. Toca la flecha que apunta a la izquierda para doblar.",
      initialMessage: "Primero gira a la izquierda, despues avanza.",
      missingMessage: "Completa los dos pasos del algoritmo.",
      failureMessage: "Revisa el orden: para ir a la izquierda, primero va Izquierda y despues Avanzar.",
      successMessage: "Excelente. Nano doblo a la izquierda y llego al camino.",
    },
    8: {
      assetChallenge: 8,
      rows: 5,
      cols: 5,
      start: { row: 3, col: 1, dir: 0 },
      goal: { row: 2, col: 2 },
      route: ["3-1", "2-1", "2-2"],
      solution: ["avanzar", "derecha", "avanzar"],
      availableCards: ["avanzar", "derecha", "izquierda"],
      fallbackInstruction: "¡A programar! Nano avanza, pero tiene que girar. Observa el camino y elige la tarjeta correcta para completar la instrucción. ¡Buena suerte!",
      initialMessage: "Completa el timeline para que Nano avance, gire a la derecha y avance otra vez.",
      missingMessage: "Completa los tres pasos del algoritmo.",
      failureMessage: "Casi. El camino es Avanzar, Derecha y Avanzar.",
      successMessage: "Excelente. Completaste el camino de la alfombra.",
    },
    14: {
      assetChallenge: 16,
      cardAssetChallenge: 4,
      markerAssetChallenge: 4,
      rows: 5,
      cols: 5,
      start: { row: 3, col: 1, dir: 0 },
      goal: { row: 1, col: 3 },
      route: ["3-1", "2-1", "1-1", "1-2", "1-3"],
      solution: ["avanzar", "avanzar", "derecha", "avanzar", "avanzar"],
      availableCards: ["avanzar", "derecha", "izquierda"],
      goalAsset: "destornillado.png",
      goalAlt: "Destornillador",
      cardClass: "n4-screwdriver-card",
      fallbackInstruction: "¡AYUDA A NANO! Nano necesita usar el destornillador ayudalo a conseguirlo. Observa los pasos de Nano: avanzar, avanzar y girar.",
      initialMessage: "Observa los pasos de Nano: avanzar, avanzar y girar.",
      missingMessage: "Completa los pasos de Nano para conseguir el destornillador.",
      failureMessage: "Casi. Observa los pasos: avanzar, avanzar y girar.",
      successMessage: "Muy bien. Nano consiguio el destornillador.",
    },
    15: {
      assetChallenge: 16,
      cardAssetChallenge: 4,
      markerAssetChallenge: 4,
      rows: 5,
      cols: 5,
      start: { row: 3, col: 1, dir: 0 },
      goal: { row: 1, col: 3 },
      route: ["3-1", "2-1", "1-1", "1-2", "1-3"],
      solution: ["avanzar", "avanzar", "derecha", "avanzar", "avanzar"],
      availableCards: ["avanzar", "derecha", "izquierda"],
      goalAsset: "destornillado.png",
      goalAlt: "Destornillador",
      cardClass: "n4-screwdriver-card",
      fallbackInstruction: "¡AYUDA A NANO! Nano necesita usar el destornillador ayudalo a conseguirlo. Observa los pasos de Nano: avanzar, avanzar y girar.",
      initialMessage: "Observa los pasos de Nano: avanzar, avanzar y girar.",
      missingMessage: "Completa los pasos de Nano para conseguir el destornillador.",
      failureMessage: "Casi. Observa los pasos: avanzar, avanzar y girar.",
      successMessage: "Muy bien. Nano consiguio el destornillador.",
    },
    16: {
      assetChallenge: 18,
      cardAssetChallenge: 4,
      markerAssetChallenge: 4,
      rows: 6,
      cols: 6,
      start: { row: 5, col: 0, dir: 1 },
      goal: { row: 3, col: 4 },
      route: ["5-0", "5-1", "5-2", "4-2", "3-2", "3-3", "3-4"],
      solution: ["avanzar", "avanzar", "izquierda", "avanzar", "avanzar", "derecha", "avanzar", "avanzar"],
      availableCards: ["avanzar", "derecha", "izquierda"],
      goalAssetChallenge: 4,
      goalAlt: "Llegada",
      cardClass: "n4-rain-park-card",
      fallbackInstruction: "¡Alerta de lluvia! Nano no sabe cómo llegar. Aplica la lógica y elige las tarjetas para completar el algoritmo.",
      initialMessage: "Aplica la lógica y elige las tarjetas para completar el algoritmo.",
      missingMessage: "Completa el algoritmo para ayudar a Nano a avanzar y girar.",
      failureMessage: "Casi. Nano debe avanzar y girar siguiendo el camino.",
      successMessage: "Muy bien. Nano llego al final del recorrido.",
    },
  };

  return configs[id] || configs[4];
}

function renderN4ProgrammingCarpetChallenge(id = 4) {
  const config = getN4ProgrammingConfig(id);
  const routeSet = new Set(config.route);
  const obstacleSet = new Set(config.obstacles || []);
  const itemByKey = new Map((config.items || []).map((item) => [`${item.row}-${item.col}`, item]));
  const goalKey = `${config.goal.row}-${config.goal.col}`;
  const startKey = `${config.start.row}-${config.start.col}`;
  let selectedSlot = 0;
  let isAnimating = false;
  let robotState = { ...config.start };

  function cardAsset(cardId) {
    const card = N4_PROGRAM_CARDS[cardId];
    return card ? n4Asset(config.cardAssetChallenge || config.assetChallenge, card.file) : "";
  }

  function renderProgramCell(row, col) {
    const key = `${row}-${col}`;
    const isStart = key === startKey;
    const isGoal = key === goalKey;
    const isRoute = routeSet.has(key);
    const isObstacle = obstacleSet.has(key);
    const item = itemByKey.get(key);
    const cellType = isStart ? "start" : isGoal ? "goal" : isObstacle ? "obstacle" : item ? "item" : isRoute ? "path" : "empty";
    const goalClass = config.goalAssetClass || (config.goalAsset ? "play-cell-img--goal-item" : "");
    const startClass = config.startAssetClass || "";
    const goalMarkup = config.goalIcon
      ? `<span class="play-cell-icon play-cell-icon--goal" aria-label="${config.goalAlt || "Meta"}">${config.goalIcon}</span>`
      : `<img class="play-cell-img ${goalClass}" src="${config.goalAsset ? n4Asset(config.assetChallenge, config.goalAsset) : n4Asset(config.goalAssetChallenge || config.assetChallenge, "Vamos.png")}" alt="${config.goalAlt || "Llegada"}" />`;
    const startMarkup = config.startAsset
      ? `<img class="play-cell-img play-cell-img--start ${startClass}" src="${n4Asset(config.startAssetChallenge || config.assetChallenge, config.startAsset)}" alt="${config.startAlt || "Entrada"}" />`
      : `<img class="play-cell-img play-cell-img--start ${startClass}" src="${n4Asset(config.markerAssetChallenge || config.assetChallenge, "Entrada.png")}" alt="${config.startAlt || "Entrada"}" />`;
    const itemMarkup = item
      ? item.asset
        ? `<img class="play-cell-img play-cell-img--item" src="${item.asset}" alt="${item.label || "Item"}" />`
        : `<span class="play-cell-icon play-cell-icon--item" aria-label="${item.label || "Item"}">${item.icon || "•"}</span>`
      : "";
    const obstacleMarkup = config.obstacleIcon
      ? `<span class="play-cell-icon play-cell-icon--obstacle" aria-label="Obstaculo">${config.obstacleIcon}</span>`
      : `<img class="play-cell-img play-cell-img--obstacle" src="${config.obstacleAsset || "assets/charco.png"}" alt="Charco" />`;
    const content = [
      isObstacle ? obstacleMarkup : "",
      itemMarkup,
      isStart ? startMarkup : "",
      isGoal ? goalMarkup : "",
    ].join("");

    return `
      <div class="play-cell n4-program-cell ${isRoute ? "is-route" : ""}" data-n4-cell="${key}" data-base-type="${cellType}" role="gridcell">
        ${content}
      </div>
    `;
  }

  function renderProgramSlot(index) {
    return `
      <button class="play-slot n4-play-slot" type="button" data-slot="${index}" aria-label="Paso ${index + 1}">
        <span class="play-slot-num">${index + 1}</span>
        <span class="play-slot-q">?</span>
      </button>
    `;
  }

  function renderProgramCard(cardId) {
    const card = N4_PROGRAM_CARDS[cardId];
    if (!card) return "";

    return `
      <button class="play-card n4-play-card" type="button" data-card="${cardId}" aria-label="${card.label}">
        <img src="${cardAsset(cardId)}" alt="" aria-hidden="true" />
        <span>${card.label}</span>
      </button>
    `;
  }

  const gridMarkup = Array.from({ length: config.rows * config.cols }, (_, index) => {
    const row = Math.floor(index / config.cols);
    const col = index % config.cols;
    return renderProgramCell(row, col);
  }).join("");
  const slotsMarkup = Array.from({ length: config.solution.length }, (_, index) => renderProgramSlot(index)).join("");
  const cardsMarkup = config.availableCards.map(renderProgramCard).join("");

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-program-card ${config.cardClass || ""}">
      ${renderHeader(id, getChallengeInstruction(id, config.fallbackInstruction))}
      <div class="n4-program-play" data-n4-program>
        <main class="play-main n4-play-main">
          <section class="play-maze-panel n4-play-maze-panel" aria-label="Alfombra cuadriculada">
            <div class="play-grid n4-play-grid" role="grid" aria-label="Camino de Nano" style="grid-template-columns: repeat(${config.cols}, 1fr); grid-template-rows: repeat(${config.rows}, 1fr);">
              ${gridMarkup}
            </div>
          </section>
          <div class="play-right-panel n4-play-right-panel">
            <section class="play-section n4-play-section" aria-label="Tu algoritmo">
              <div class="play-section-title">
                <span class="play-section-num">1</span>
                <span class="play-section-label">Tu algoritmo</span>
              </div>
              <div class="play-algo-slots n4-play-slots" role="list" aria-label="Timeline del algoritmo" style="--slot-count:${config.solution.length};">
                ${slotsMarkup}
              </div>
            </section>
            <section class="play-section n4-play-section" aria-label="Tarjetas de programacion">
              <div class="play-section-title">
                <span class="play-section-num">2</span>
                <span class="play-section-label">Tarjetas de programacion</span>
              </div>
              <div class="play-card-bank n4-play-card-bank" role="list" aria-label="Tarjetas disponibles">
                ${cardsMarkup}
              </div>
            </section>
          </div>
        </main>
        <footer class="play-footer n4-play-footer">
          <button class="play-check-btn n4-play-check" type="button">COMPROBAR</button>
          <button class="play-reset-btn n4-play-reset" type="button">REINICIAR</button>
        </footer>
      </div>
      <p class="challenge-message" data-message>${config.initialMessage}</p>
    </article>
  `;

  const programRoot = challengeContent.querySelector("[data-n4-program]");
  const slots = [...programRoot.querySelectorAll(".n4-play-slot")];
  const cardButtons = [...programRoot.querySelectorAll(".n4-play-card")];
  const checkButton = programRoot.querySelector(".n4-play-check");
  const resetButton = programRoot.querySelector(".n4-play-reset");

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function setSelectedSlot(index) {
    slots.forEach((slot) => slot.classList.remove("is-selected"));
    selectedSlot = Math.max(0, Math.min(index, slots.length - 1));
    slots[selectedSlot]?.classList.add("is-selected");
  }

  function selectNextFreeSlot(afterIndex) {
    for (let index = afterIndex + 1; index < slots.length; index += 1) {
      if (!slots[index].dataset.card) {
        setSelectedSlot(index);
        return;
      }
    }
    setSelectedSlot(afterIndex);
  }

  function clearSlot(slot) {
    if (!slot) return;
    const index = Number(slot.dataset.slot);
    delete slot.dataset.card;
    slot.classList.remove("is-wrong");
    slot.innerHTML = `
      <span class="play-slot-num">${index + 1}</span>
      <span class="play-slot-q">?</span>
    `;
  }

  function fillSlot(slot, cardId) {
    const card = N4_PROGRAM_CARDS[cardId];
    if (!slot || !card) return;
    const index = Number(slot.dataset.slot);
    slot.dataset.card = cardId;
    slot.classList.remove("is-wrong");
    slot.innerHTML = `
      <span class="play-slot-num">${index + 1}</span>
      <img src="${cardAsset(cardId)}" alt="${card.label}" />
    `;
    selectNextFreeSlot(index);
  }

  function getCell(row, col) {
    return programRoot.querySelector(`[data-n4-cell="${row}-${col}"]`);
  }

  function placeRobot(animateTurn = false) {
    programRoot.querySelectorAll(".play-cell").forEach((cell) => {
      cell.classList.remove("is-robot", "is-turning");
      cell.querySelectorAll(".play-robot-img").forEach((node) => node.remove());
    });

    const cell = getCell(robotState.row, robotState.col);
    if (!cell) return;
    cell.classList.add("is-robot");
    cell.classList.toggle("is-turning", animateTurn);
    cell.insertAdjacentHTML("beforeend", `
      ${renderNanoDirectionImage("play-robot-img n4-program-robot", N4_PROGRAM_DIRECTIONS[robotState.dir])}
    `);
  }

  function resetRobot() {
    robotState = { ...config.start };
    programRoot.querySelectorAll(".play-cell").forEach((cell) => {
      cell.classList.remove("is-trail", "is-robot", "is-turning", "is-wrong");
      cell.querySelectorAll(".play-robot-img").forEach((node) => node.remove());
    });
    placeRobot();
  }

  function getSlotValues() {
    return slots.map((slot) => slot.dataset.card || null);
  }

  function clearWrongSlots() {
    slots.forEach((slot) => slot.classList.remove("is-wrong"));
  }

  async function runSimulation(commands) {
    resetRobot();
    await wait(100);

    for (const command of commands) {
      const currentCell = getCell(robotState.row, robotState.col);
      currentCell?.classList.add("is-trail");

      if (command === "derecha" || command === "izquierda") {
        robotState.dir = command === "derecha"
          ? (robotState.dir + 1) % 4
          : (robotState.dir + 3) % 4;
        placeRobot(true);
        await wait(190);
        continue;
      }

      if (command === "avanzar") {
        const [rowDelta, colDelta] = N4_PROGRAM_DELTAS[robotState.dir];
        const nextRow = robotState.row + rowDelta;
        const nextCol = robotState.col + colDelta;
        if (nextRow < 0 || nextRow >= config.rows || nextCol < 0 || nextCol >= config.cols) {
          currentCell?.classList.add("is-wrong");
          return false;
        }
        if (obstacleSet.has(`${nextRow}-${nextCol}`)) {
          getCell(nextRow, nextCol)?.classList.add("is-wrong");
          return false;
        }
        robotState = { ...robotState, row: nextRow, col: nextCol };
        placeRobot();
        await wait(190);
      }
    }

    return `${robotState.row}-${robotState.col}` === goalKey;
  }

  async function checkProgram() {
    if (isAnimating) return;
    const values = getSlotValues();
    clearWrongSlots();

    const firstMissing = values.findIndex((value) => !value);
    if (firstMissing >= 0) {
      setSelectedSlot(firstMissing);
      setMessage(config.missingMessage, "is-error is-soft-error");
      return;
    }

    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;
    const reachedGoal = await runSimulation(values);
    const firstWrong = values.findIndex((value, index) => value !== config.solution[index]);
    isAnimating = false;
    checkButton.disabled = false;
    resetButton.disabled = false;

    if (firstWrong >= 0 || !reachedGoal) {
      const slotToMark = firstWrong >= 0 ? firstWrong : values.length - 1;
      slots[slotToMark]?.classList.add("is-wrong");
      setSelectedSlot(slotToMark);
      setMessage(config.failureMessage, "is-error is-soft-error");
      return;
    }

    setMessage(config.successMessage, "is-success");
    completeChallenge(id);
  }

  function resetProgram() {
    if (isAnimating) return;
    slots.forEach(clearSlot);
    clearWrongSlots();
    setSelectedSlot(0);
    resetRobot();
    setMessage(config.initialMessage);
  }

  slots.forEach((slot, index) => {
    slot.addEventListener("click", () => {
      if (isAnimating) return;
      if (selectedSlot === index && slot.dataset.card) {
        clearSlot(slot);
      }
      setSelectedSlot(index);
    });
  });

  cardButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (isAnimating) return;
      fillSlot(slots[selectedSlot], button.dataset.card);
    });
  });

  checkButton.addEventListener("click", checkProgram);
  resetButton.addEventListener("click", resetProgram);
  setSelectedSlot(0);
  resetRobot();
}

function renderDragRightChallenge(id = 7) {
  let selectedPiece = null;
  let completed = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-side-card">
      ${renderHeader(id, getChallengeInstruction(id, "Nano debe guardar su tuerca lejos de la ventana. Arrastra la pieza hacia el lado derecho de la pantalla"))}
      <div class="n4-side-scene">
        <button class="n4-side-box n4-side-box-left n4-side-toy-box n4-drop-target" type="button" data-side="left" aria-label="Caja de juguetes izquierda">
          <img src="${n4Asset(2, "caja de juguetes.png")}" alt="" aria-hidden="true" />
        </button>
        <button class="n4-side-box n4-side-box-right n4-drop-target" type="button" data-side="right" aria-label="Caja de tecnologia derecha">
          <img src="${n4Asset(2, "caja de tecnologia.png")}" alt="" aria-hidden="true" />
        </button>
        <img class="n4-side-nano" src="${n4Asset(7, "Robot Nano.png")}" alt="Nano" />
        <button class="n4-side-piece n4-drag-source" type="button" data-piece="engranaje" aria-label="Engranaje">
          <img src="${n4Asset(7, "Engranaje.png")}" alt="" aria-hidden="true" />
        </button>
      </div>
      <p class="challenge-message" data-message>La ventana marca el lado derecho. Llevá la pieza hasta esa caja.</p>
    </article>
  `;

  function clearSelection() {
    challengeContent.querySelectorAll(".n4-side-piece").forEach((item) => item.classList.remove("is-selected"));
  }

  const sideMessage = challengeContent.querySelector("[data-message]");
  if (sideMessage) {
    sideMessage.textContent = "La ventana marca el lado derecho. Lleva la pieza hasta esa caja.";
  }

  challengeContent.querySelector(".n4-side-piece").addEventListener("click", (event) => {
    if (completed) return;
    selectedPiece = event.currentTarget;
    clearSelection();
    selectedPiece.classList.add("is-selected");
    setMessage("Ahora tocá o soltá la pieza en una caja.", "is-good");
  });

  challengeContent.querySelectorAll(".n4-side-box").forEach((box) => {
    box.addEventListener("click", () => {
      if (!selectedPiece || completed) return;
      if (box.dataset.side !== "right") {
        box.classList.add("is-wrong");
        window.setTimeout(() => box.classList.remove("is-wrong"), 520);
        setMessage("Ese es el lado izquierdo. Buscá la caja que está cerca de la ventana.", "is-error");
        return;
      }

      completed = true;
      box.classList.add("is-filled");
      box.insertAdjacentHTML("beforeend", `<img class="n4-side-placed-piece" src="${n4Asset(7, "Engranaje.png")}" alt="Engranaje" />`);
      selectedPiece.hidden = true;
      selectedPiece.style.display = "none";
      selectedPiece.disabled = true;
      selectedPiece.classList.remove("n4-drag-source");
      selectedPiece.classList.remove("is-selected");
      setMessage("Perfecto. La pieza quedó cerca de la ventana, del lado derecho.", "is-success");
      completeChallenge(id);
    });
  });
}

function renderColorPatternChallenge(id = 9) {
  const rounds = [
    { sequence: ["naranja", "azul", "naranja"], correct: "azul", message: "El ritmo es naranja, azul, naranja... ¿cual sigue?" },
    { sequence: ["verde", "turquesa", "verde"], correct: "turquesa", message: "El ritmo es verde, turquesa, verde... ¿cual sigue?" },
    { sequence: ["azul", "naranja", "azul"], correct: "naranja", message: "El ritmo es azul, naranja, azul... ¿cual sigue?" },
  ];
  const colors = [
    { id: "verde", label: "Verde", file: "verde.png" },
    { id: "naranja", label: "Naranja", file: "naranja.png" },
    { id: "azul", label: "Azul", file: "azul.png" },
    { id: "turquesa", label: "Turquesa", file: "turquesa.png" },
  ];
  let currentRound = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-color-card">
      ${renderHeader(id, getChallengeInstruction(id, "¡Las luces de Nano brillan con ritmo! Rojo, azul, rojo... Observa bien y toca el color que sigue."))}
      <div class="n4-color-scene">
        <div class="n4-color-pattern" aria-label="Patron de luces" data-color-pattern></div>
        <div class="n4-color-options" aria-label="Colores">
          ${colors.map((color) => `
            <button class="n4-color-option" type="button" data-color="${color.id}" aria-label="${color.label}">
              <img src="${n4Asset(9, color.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message></p>
    </article>
  `;

  function renderRound() {
    const round = rounds[currentRound];
    const pattern = challengeContent.querySelector("[data-color-pattern]");
    if (pattern) {
      pattern.innerHTML = `
        ${round.sequence.map((color) => `<img src="${n4Asset(9, `${color}.png`)}" alt="${color}" />`).join("")}
        <img class="n4-color-question" src="${n4Asset(9, "Signo.png")}" alt="Color faltante" />
      `;
    }
    challengeContent.querySelectorAll(".n4-color-option").forEach((option) => option.classList.remove("is-wrong", "is-correct"));
    setMessage(`Ronda ${currentRound + 1}/3: ${round.message}`);
  }

  challengeContent.querySelectorAll(".n4-color-option").forEach((button) => {
    button.addEventListener("click", () => {
      const round = rounds[currentRound];
      challengeContent.querySelectorAll(".n4-color-option").forEach((option) => option.classList.remove("is-wrong", "is-correct"));
      if (button.dataset.color === round.correct) {
        button.classList.add("is-correct");
        if (currentRound === rounds.length - 1) {
          setMessage("Exacto. Completaste las tres rondas de luces.", "is-success");
          completeChallenge(id);
          return;
        }

        currentRound += 1;
        setMessage("Exacto. Vamos con otra ronda.", "is-good");
        window.setTimeout(renderRound, 650);
      } else {
        button.classList.add("is-wrong");
        setMessage("Todavia no. Mira como se alternan las luces.", "is-error");
      }
    });
  });

  renderRound();
}

function renderConveyorShapePatternChallenge(id = 10) {
  const rounds = [
    { sequence: ["amarilla", "azul", "amarilla"], correct: "azul" },
    { sequence: ["verde", "naranja", "verde"], correct: "naranja" },
    { sequence: ["turquesa", "violeta", "turquesa"], correct: "violeta" },
  ];
  const pieces = [
    { id: "azul", label: "Azul", file: "CAJA AZUL.png" },
    { id: "amarilla", label: "Amarilla", file: "CAJA AMARILLA.png" },
    { id: "turquesa", label: "Turquesa", file: "CAJA TURQUESA.png" },
    { id: "naranja", label: "Naranja", file: "CAJA NARANJA.png" },
    { id: "verde", label: "Verde", file: "CAJA VERDE.png" },
    { id: "violeta", label: "Violeta", file: "CAJA VIOLETA.png" },
  ];
  let selectedPiece = null;
  let currentRound = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-shape-card">
      ${renderHeader(id, getChallengeInstruction(id, "¡Por la cinta pasan formas geométricas! Cuadrado, círculo, cuadrado... Arrastra la forma que falta para completar la serie."))}
      <div class="n4-shape-scene">
        <div class="n4-shape-belt-wrap" aria-label="Cinta transportadora">
          <img class="n4-shape-belt" src="${n4Asset(10, "banda tranportadora.png")}" alt="" aria-hidden="true" />
          <div class="n4-shape-series" aria-label="Serie" data-shape-series></div>
        </div>
        <div class="n4-shape-options" aria-label="Inventario de piezas">
          ${pieces.map((piece) => `
            <button class="n4-shape-option n4-drag-source" type="button" data-piece="${piece.id}" aria-label="Caja ${piece.label}">
              <img src="${n4Asset(10, piece.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>La serie es ABAB. Elegi la pieza correcta para completar el ultimo lugar.</p>
    </article>
  `;

  function renderRound() {
    const round = rounds[currentRound];
    const series = challengeContent.querySelector("[data-shape-series]");
    if (series) {
      series.innerHTML = `
        ${round.sequence.map((color) => `<img src="${n4Asset(10, `CAJA ${color.toUpperCase()}.png`)}" alt="${color}" />`).join("")}
        <button class="n4-shape-missing n4-drop-target" type="button" data-expected="${round.correct}" aria-label="Pieza faltante"></button>
      `;
      series.querySelector(".n4-shape-missing")?.addEventListener("click", (event) => {
        placeInGap(event.currentTarget);
      });
    }
    selectedPiece = null;
    clearSelection();
    challengeContent.querySelectorAll(".n4-shape-option").forEach((option) => {
      option.hidden = false;
      option.disabled = false;
      option.classList.remove("is-wrong", "is-correct");
    });
    setMessage(`Ronda ${currentRound + 1}/3: completa la serie de la cinta.`);
  }

  function clearSelection() {
    challengeContent.querySelectorAll(".n4-shape-option").forEach((item) => item.classList.remove("is-selected"));
  }

  function placeInGap(target) {
    if (!selectedPiece) return;

    if (selectedPiece.dataset.piece !== target.dataset.expected) {
      target.classList.add("is-wrong");
      selectedPiece.classList.add("is-wrong");
      window.setTimeout(() => {
        target.classList.remove("is-wrong");
        selectedPiece?.classList.remove("is-wrong");
      }, 520);
      setMessage("Casi. Revisa la secuencia: se repite en patron AB.", "is-error");
      return;
    }

    target.classList.add("is-correct", "is-filled");
    target.innerHTML = `<img src="${selectedPiece.querySelector("img")?.getAttribute("src") || ""}" alt="Pieza correcta" />`;
    selectedPiece.hidden = true;
    selectedPiece.disabled = true;
    clearSelection();
    selectedPiece = null;
    if (currentRound === rounds.length - 1) {
      setMessage("Perfecto. Completaste las tres series de la cinta.", "is-success");
      completeChallenge(id);
      return;
    }

    currentRound += 1;
    setMessage("Perfecto. Vamos con otra ronda.", "is-good");
    window.setTimeout(renderRound, 700);
  }

  challengeContent.querySelectorAll(".n4-shape-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      selectedPiece = button;
      clearSelection();
      button.classList.add("is-selected");
    });
  });

  renderRound();
}

function renderHardwarePatternChallenge(id = 11) {
  const piecesById = {
    tornillo: { id: "tornillo", label: "Tornillo", file: "Tornillo.png" },
    tuerca: { id: "tuerca", label: "Tuerca", file: "tuerca.png" },
    destornillador: { id: "destornillador", label: "Destornillador", file: "destornillado.png" },
  };
  const rounds = [
    { sequence: ["tornillo", "tuerca", "tornillo", "tuerca", "tornillo"], correct: "tuerca" },
    { sequence: ["tuerca", "tornillo", "tuerca", "tornillo", "tuerca"], correct: "tornillo" },
    { sequence: ["destornillador", "tornillo", "destornillador", "tornillo", "destornillador"], correct: "tornillo" },
  ];
  const options = [
    piecesById.destornillador,
    piecesById.tuerca,
    piecesById.tornillo,
  ];
  let currentRound = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-hardware-card">
      ${renderHeader(id, getChallengeInstruction(id, "Nano ordena sus piezas: tornillo, tuerca, tornillo... Toca la herramienta que sigue en la fila"))}
      <div class="n4-hardware-scene" aria-label="Patron de piezas de taller">
        <img class="n4-hardware-bg" src="${n4Asset(11, "FONDO 11.jpg")}" alt="" aria-hidden="true" />
        <div class="n4-hardware-row" aria-label="Fila de piezas" data-hardware-row></div>
        <div class="n4-hardware-options" aria-label="Piezas disponibles">
          ${options.map((piece) => `
            <button class="n4-hardware-option is-${piece.id}" type="button" data-piece="${piece.id}" aria-label="${piece.label}">
              <img src="${n4Asset(11, piece.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>El patron alterna tornillo y tuerca. Toca la pieza que sigue.</p>
    </article>
  `;

  function renderRound() {
    const round = rounds[currentRound];
    const row = challengeContent.querySelector("[data-hardware-row]");
    if (row) {
      row.innerHTML = `
        ${round.sequence.map((pieceId) => {
          const piece = piecesById[pieceId];
          return `<img class="n4-hardware-piece is-${piece.id}" src="${n4Asset(11, piece.file)}" alt="${piece.label}" />`;
        }).join("")}
        <img class="n4-hardware-question" src="${n4Asset(11, "Signo.png")}" alt="Pieza faltante" />
      `;
    }
    challengeContent.querySelectorAll(".n4-hardware-option").forEach((option) => option.classList.remove("is-wrong", "is-correct"));
    setMessage(`Ronda ${currentRound + 1}/3: toca la pieza que sigue en el patron.`);
  }

  challengeContent.querySelectorAll(".n4-hardware-option").forEach((button) => {
    button.addEventListener("click", () => {
      const round = rounds[currentRound];
      challengeContent.querySelectorAll(".n4-hardware-option").forEach((option) => {
        option.classList.remove("is-wrong", "is-correct");
      });

      if (button.dataset.piece === round.correct) {
        button.classList.add("is-correct");
        const question = challengeContent.querySelector(".n4-hardware-question");
        question?.classList.add("is-solved");
        const piece = piecesById[round.correct];
        if (question) {
          question.setAttribute("src", n4Asset(11, piece.file));
          question.setAttribute("alt", piece.label);
          question.classList.add(`is-${piece.id}`);
        }
        if (currentRound === rounds.length - 1) {
          setMessage("Exacto. Completaste las tres rondas de patrones.", "is-success");
          completeChallenge(id);
          return;
        }

        currentRound += 1;
        setMessage("Exacto. Vamos con otra ronda.", "is-good");
        window.setTimeout(renderRound, 700);
        return;
      }

      button.classList.add("is-wrong");
      setMessage("Casi. Mira la serie y busca como se repite.", "is-error");
    });
  });

  renderRound();
}

function renderLightDebugChallenge(id = 12) {
  const correct = "intruso";
  const lights = [
    { id: correct, label: "Verde", color: "verde", file: "VERDE 1.png" },
    { id: "verde-b", label: "Verde", color: "verde", file: "VERDE 2.png" },
    { id: "naranja-a", label: "Naranja", color: "naranja", file: "NARANJA 3.png" },
    { id: "azul-a", label: "Azul", color: "azul", file: "AZUL 4.png" },
  ];
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-light-debug-card">
      ${renderHeader(id, getChallengeInstruction(id, "¡Alerta en el código! Hay un error en las luces. Observa el patrón, encuentra al intruso y ¡tócalo para sacarlo!"))}
      <div class="n4-light-debug-scene" aria-label="Patron de luces con un intruso">
        <img class="n4-light-debug-bg" src="${n4Asset(12, "FONDO 12.png")}" alt="" aria-hidden="true" />
        <div class="n4-light-debug-code" aria-label="Secuencia de luces">
          ${lights.map((light, index) => `
            <button class="n4-light-debug-step is-${light.color}" type="button" data-light="${light.id}" aria-label="${light.label} ${index + 1}">
              <span class="n4-light-debug-beam">
                <img src="${n4Asset(12, light.file)}" alt="" aria-hidden="true" />
              </span>
              <strong>${index + 1}</strong>
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>El codigo correcto empieza con celeste: celeste, verde, naranja, azul. Toca la primera luz verde para sacarla.</p>
    </article>
  `;

  challengeContent.querySelectorAll(".n4-light-debug-step").forEach((button) => {
    button.addEventListener("click", () => {
      if (solved) return;

      challengeContent.querySelectorAll(".n4-light-debug-step").forEach((step) => {
        step.classList.remove("is-wrong", "is-correct", "is-removed");
      });

      if (button.dataset.light !== correct) {
        button.classList.add("is-wrong");
        setMessage("Todavia no. Esa luz esta bien ubicada. El error esta en el primer lugar: deberia ser celeste.", "is-error");
        return;
      }

      solved = true;
      button.classList.add("is-correct", "is-removed");
      setMessage("Bug encontrado. El primer lugar era el que debia ser celeste.", "is-success");
      completeChallenge(id);
    });
  });
}

function renderColorRepairChallenge(id = 13) {
  const slots = [
    { id: "slot-1", expected: "verde", current: "verde", label: "Verde" },
    { id: "slot-2", expected: "azul", current: "naranja", label: "Naranja" },
    { id: "slot-3", expected: "verde", current: "verde", label: "Verde" },
    { id: "slot-4", expected: "azul", current: "azul", label: "Azul" },
  ];
  const options = [
    { id: "verde", label: "Verde", file: "verde.png" },
    { id: "naranja", label: "Naranja", file: "naranja.png" },
    { id: "azul", label: "Azul", file: "azul.png" },
    { id: "turquesa", label: "Turquesa", file: "turquesa.png" },
  ];
  const slotById = new Map(slots.map((slot) => [slot.id, { ...slot }]));
  let repairTarget = null;
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-color-repair-card">
      ${renderHeader(id, getChallengeInstruction(id, "¡Atencion! Una falla en el sistema y se cambiaron algunos colores. ¿Podras repararlo?"))}
      <div class="n4-color-repair-scene" aria-label="Reparacion de colores">
        <img class="n4-color-repair-bg" src="${n4Asset(13, "Fondo.png")}" alt="" aria-hidden="true" />
        <img class="n4-color-repair-alert" src="${n4Asset(13, "Atencion.png")}" alt="" aria-hidden="true" />
        <div class="n4-color-repair-slots" aria-label="Secuencia de colores">
          ${slots.map((slot, index) => `
            <button class="n4-color-repair-slot is-${slot.current} ${slot.current !== slot.expected ? "is-bug" : ""}" type="button" data-slot="${slot.id}" aria-label="Posicion ${index + 1}: ${slot.label}">
              <img src="${n4Asset(13, `${slot.current}.png`)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
        <div class="n4-color-repair-options" aria-label="Colores para reparar">
          ${options.map((option) => `
            <button class="n4-color-repair-option is-${option.id}" type="button" data-color="${option.id}" aria-label="${option.label}">
              <img src="${n4Asset(13, option.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>Encuentra el color equivocado en la serie y sacalo para repararlo.</p>
    </article>
  `;

  function clearMarks() {
    challengeContent.querySelectorAll(".n4-color-repair-slot, .n4-color-repair-option").forEach((node) => {
      node.classList.remove("is-wrong", "is-correct", "is-selected");
    });
  }

  challengeContent.querySelectorAll(".n4-color-repair-slot").forEach((button) => {
    button.addEventListener("click", () => {
      if (solved) return;
      clearMarks();
      const slot = slotById.get(button.dataset.slot);
      if (!slot) return;

      if (slot.current === slot.expected) {
        button.classList.add("is-wrong");
        setMessage("Todavia no. Ese color ya esta bien. Busca el que rompe el patron verde, azul, verde, azul.", "is-error");
        return;
      }

      repairTarget = slot.id;
      slot.current = "";
      button.classList.add("is-empty", "is-selected");
      button.innerHTML = "<span>?</span>";
      setMessage("Intruso fuera. Ahora toca el color correcto para completar el patron.", "is-good");
    });
  });

  challengeContent.querySelectorAll(".n4-color-repair-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (solved) return;
      clearMarks();

      if (!repairTarget) {
        button.classList.add("is-wrong");
        setMessage("Primero toca el color equivocado de la fila para sacarlo.", "is-error is-soft-error");
        return;
      }

      const slot = slotById.get(repairTarget);
      const targetButton = challengeContent.querySelector(`[data-slot="${repairTarget}"]`);

      if (button.dataset.color !== slot.expected) {
        button.classList.add("is-wrong");
        targetButton?.classList.add("is-selected");
        setMessage("Todavia no. Para que la serie sea verde, azul, verde, azul, falta el azul.", "is-error");
        return;
      }

      solved = true;
      slot.current = slot.expected;
      button.classList.add("is-correct");
      if (targetButton) {
        targetButton.className = "n4-color-repair-slot is-azul is-correct";
        targetButton.innerHTML = `<img src="${n4Asset(13, "azul.png")}" alt="" aria-hidden="true" />`;
      }
      setMessage("Sistema reparado. El patron de colores vuelve a estar en orden.", "is-success");
      completeChallenge(id);
    });
  });
}

function renderSoundPatternChallenge(id = 14) {
  const sounds = [
    { id: "verde", label: "Verde", wave: "ONDA VERDE.png", audio: "TIMBRE 1.mp3" },
    { id: "naranja", label: "Naranja", wave: "ONDA NARANJA.png", audio: "TIMBRE 2.mp3" },
    { id: "azul", label: "Azul", wave: "ONDA AZUL.png", audio: "TIMBRE 3.mp3" },
    { id: "turquesa", label: "Turquesa", wave: "ONDA TURQEUSA.png", audio: "TIMBRE 4.mp3" },
  ];
  const sequence = sounds.map((sound) => sound.id);
  const soundById = new Map(sounds.map((sound) => [sound.id, sound]));
  const fallbackFrequencies = {
    verde: 392,
    naranja: 494,
    azul: 587,
    turquesa: 740,
  };
  let progress = 0;
  let solved = false;
  let isPlayingPattern = false;
  let playbackRun = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-sound-card">
      ${renderHeader(id, getChallengeInstruction(id, "¡Nano nos habla! Toca los botones de sonido de izquierda a derecha."))}
      <div class="n4-sound-scene" aria-label="Patron de sonidos de Nano">
        <img class="n4-sound-bg" src="${n4Asset(14, "FONDO 14.jpg")}" alt="" aria-hidden="true" />
        <button class="n4-sound-replay" type="button" data-sound-replay aria-label="Escuchar patron de sonidos">
          <span aria-hidden="true">&#9658;</span>
          <span>ESCUCHAR PATRON</span>
        </button>
        <div class="n4-sound-pattern" aria-label="Ondas del patron">
          ${sounds.map((sound, index) => `
            <div class="n4-sound-wave is-${sound.id}" data-sound-display="${sound.id}" data-step="${index}" aria-label="Sonido ${index + 1}: ${sound.label}">
              <img src="${n4Asset(14, sound.wave)}" alt="" aria-hidden="true" />
            </div>
          `).join("")}
        </div>
        <div class="n4-sound-options" aria-label="Botones de sonido">
          ${sounds.map((sound) => `
            <button class="n4-sound-option is-${sound.id}" type="button" data-sound="${sound.id}" aria-label="Sonido ${sound.label}">
              <span aria-hidden="true">&#128266;</span>
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>Toca los botones de abajo de izquierda a derecha.</p>
    </article>
  `;

  const replayButton = challengeContent.querySelector("[data-sound-replay]");
  const optionButtons = [...challengeContent.querySelectorAll("[data-sound]")];
  const waves = [...challengeContent.querySelectorAll("[data-sound-display]")];

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function resetAttempt() {
    progress = 0;
    optionButtons.forEach((button) => button.classList.remove("is-correct", "is-wrong", "is-active"));
    waves.forEach((wave) => wave.classList.remove("is-active", "is-done"));
  }

  async function playFallbackTone(soundId) {
    playTone({
      frequency: fallbackFrequencies[soundId] || 520,
      duration: 0.42,
      type: "triangle",
      gain: 0.34,
    });
    await delay(440);
  }

  async function playOne(soundId, source = "pattern") {
    const sound = soundById.get(soundId);
    if (!sound) return;
    const wave = challengeContent.querySelector(`[data-sound-display="${soundId}"]`);
    const button = challengeContent.querySelector(`[data-sound="${soundId}"]`);
    wave?.classList.add("is-active");
    if (source === "input") button?.classList.add("is-active");
    const fallbackTone = playFallbackTone(soundId);
    await playAudioAsset(n4Asset(14, sound.audio), 1.15);
    await fallbackTone;
    await delay(120);
    wave?.classList.remove("is-active");
    button?.classList.remove("is-active");
  }

  async function playPattern() {
    if (isPlayingPattern || solved) return;
    resetAttempt();
    isPlayingPattern = true;
    playbackRun += 1;
    const run = playbackRun;
    replayButton.disabled = true;
    optionButtons.forEach((button) => { button.disabled = true; });
    setMessage("Escucha con atencion el patron de Nano.", "is-good");

    for (const soundId of sequence) {
      if (run !== playbackRun) return;
      await playOne(soundId);
      await delay(180);
    }

    if (run !== playbackRun) return;
    isPlayingPattern = false;
    replayButton.disabled = false;
    optionButtons.forEach((button) => { button.disabled = false; });
    setMessage("Ahora toca los botones en el mismo orden.", "is-good");
  }

  replayButton?.addEventListener("click", playPattern);

  optionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (solved || isPlayingPattern) return;
      const soundId = button.dataset.sound;
      const expected = sequence[progress];
      optionButtons.forEach((option) => option.classList.remove("is-wrong", "is-active"));
      await playOne(soundId, "input");

      if (soundId !== expected) {
        button.classList.add("is-wrong");
        resetAttempt();
        setMessage("Ese sonido no va ahi. Escucha el patron y proba otra vez desde el principio.", "is-error");
        return;
      }

      button.classList.add("is-correct");
      waves[progress]?.classList.add("is-done");
      progress += 1;

      if (progress < sequence.length) {
        setMessage(`Bien. Sigue con el sonido ${progress + 1}.`, "is-good");
        return;
      }

      solved = true;
      playbackRun += 1;
      optionButtons.forEach((option) => { option.disabled = true; });
      replayButton.disabled = true;
      setMessage("Excelente. Repetiste igual el patron de sonidos de Nano.", "is-success");
      completeChallenge(id);
    });
  });
}

function renderN4SequenceCardsChallengeLegacy(id = 8) {
  const expected = "DERECHA.png";
  const options = [
    { id: "AVANZAR.png", label: "Avanzar", file: "AVANZAR.png" },
    { id: "DERECHA.png", label: "Derecha", file: "DERECHA.png" },
    { id: "IZQUIERDA.png", label: "Izquierda", file: "IZQUIERDA.png" },
  ];
  let selectedCard = null;
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-seq-card">
      ${renderHeader(id, getChallengeInstruction(id, "Nano avanza y despues necesita girar. Completa la secuencia con la tarjeta correcta."))}
      <div class="n4-seq-scene">
        <div class="n4-seq-route" aria-label="Secuencia del recorrido">
          <img src="${n4Asset(8, "Entrada.png")}" alt="Entrada" />
          <img src="${n4Asset(8, "AVANZAR.png")}" alt="Avanzar" />
          <button class="n4-seq-missing n4-drop-target" type="button" aria-label="Tarjeta faltante"></button>
          <img src="${n4Asset(8, "AVANZAR.png")}" alt="Avanzar" />
          <img src="${n4Asset(8, "Vamos.png")}" alt="Llegada" />
        </div>
        <div class="n4-seq-options" aria-label="Tarjetas disponibles">
          ${options.map((option) => `
            <button class="n4-seq-option n4-drag-source" type="button" data-card="${option.id}" aria-label="${option.label}">
              <img src="${n4Asset(8, option.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>Completa el hueco con la tarjeta que hace que Nano doble bien.</p>
    </article>
  `;

  function clearSelection() {
    challengeContent.querySelectorAll(".n4-seq-option").forEach((item) => item.classList.remove("is-selected"));
  }

  function tryPlace(target) {
    if (!selectedCard || solved) return;

    if (selectedCard.dataset.card !== expected) {
      selectedCard.classList.add("is-wrong");
      target.classList.add("is-wrong");
      window.setTimeout(() => {
        selectedCard?.classList.remove("is-wrong");
        target.classList.remove("is-wrong");
      }, 520);
      setMessage("Casi. Revisa el recorrido: en ese paso Nano debe girar a la derecha.", "is-error");
      return;
    }

    solved = true;
    target.classList.add("is-filled", "is-correct");
    target.innerHTML = `<img src="${selectedCard.querySelector("img")?.getAttribute("src") || ""}" alt="Tarjeta correcta" />`;
    selectedCard.disabled = true;
    selectedCard.hidden = true;
    clearSelection();
    selectedCard = null;
    setMessage("Excelente. Completaste la secuencia del algoritmo.", "is-success");
    completeChallenge(id);
  }

  challengeContent.querySelectorAll(".n4-seq-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled || solved) return;
      selectedCard = button;
      clearSelection();
      button.classList.add("is-selected");
    });
  });

  challengeContent.querySelector(".n4-seq-missing")?.addEventListener("click", (event) => {
    tryPlace(event.currentTarget);
  });
}

function renderN4SequenceCardsChallenge(id = 8) {
  const expected = "DERECHA.png";
  const labels = {
    "AVANZAR.png": "Avanzar",
    "DERECHA.png": "Derecha",
    "IZQUIERDA.png": "Izquierda",
  };
  const options = [
    { id: "AVANZAR.png", label: "Avanzar", file: "AVANZAR.png" },
    { id: "DERECHA.png", label: "Derecha", file: "DERECHA.png" },
    { id: "IZQUIERDA.png", label: "Izquierda", file: "IZQUIERDA.png" },
  ];
  const start = { row: 4, col: 1, facing: "up" };
  const goal = { row: 2, col: 3 };
  const fixedCards = [
    { row: 3, col: 1, card: "AVANZAR.png" },
    { row: 2, col: 2, card: "AVANZAR.png" },
  ];
  const target = { row: 2, col: 1, expected };
  const startKey = `${start.row}-${start.col}`;
  const goalKey = `${goal.row}-${goal.col}`;
  const targetKey = `${target.row}-${target.col}`;
  const fixedByKey = new Map(fixedCards.map((card) => [`${card.row}-${card.col}`, card]));
  const routeKeys = new Set([startKey, goalKey, targetKey, ...fixedCards.map((card) => `${card.row}-${card.col}`)]);
  let selectedCard = null;
  let solved = false;

  function renderCell(row, col) {
    const key = `${row}-${col}`;
    const fixedCard = fixedByKey.get(key);

    if (key === startKey) {
      return `
        <div class="n4-carpet-cell n4-carpet-start is-route" style="--row:${row + 1};--col:${col + 1};">
          <img class="n4-carpet-start-badge" src="${n4Asset(8, "Entrada.png")}" alt="" aria-hidden="true" />
          ${renderNanoDirectionImage("n4-carpet-nano", start.facing)}
        </div>
      `;
    }

    if (key === goalKey) {
      return `
        <div class="n4-carpet-cell n4-carpet-goal is-route" style="--row:${row + 1};--col:${col + 1};">
          <img src="${n4Asset(8, "Vamos.png")}" alt="Llegada" />
        </div>
      `;
    }

    if (key === targetKey) {
      return `
        <button class="n4-carpet-cell n4-carpet-drop n4-drop-target is-route" type="button" data-expected="${target.expected}" style="--row:${row + 1};--col:${col + 1};" aria-label="Tarjeta faltante: ${labels[target.expected]}">
          <span>?</span>
        </button>
      `;
    }

    if (fixedCard) {
      return `
        <div class="n4-carpet-cell n4-carpet-fixed is-route" style="--row:${row + 1};--col:${col + 1};">
          <img src="${n4Asset(8, fixedCard.card)}" alt="${labels[fixedCard.card]}" />
        </div>
      `;
    }

    return `<div class="n4-carpet-cell ${routeKeys.has(key) ? "is-route" : ""}" style="--row:${row + 1};--col:${col + 1};"></div>`;
  }

  const gridMarkup = Array.from({ length: 36 }, (_, index) => {
    const row = Math.floor(index / 6);
    const col = index % 6;
    return renderCell(row, col);
  }).join("");

  challengeContent.innerHTML = `
    <article class="challenge-card n4-card n4-seq-card">
      ${renderHeader(id, getChallengeInstruction(id, "Nano avanza y despues necesita girar. Completa la secuencia con la tarjeta correcta."))}
      <div class="n4-seq-scene n4-seq-carpet-scene">
        <div class="n4-carpet-layout">
          <div class="n4-carpet-map" aria-label="Alfombra cuadriculada">
            <div class="n4-carpet-grid">
              ${gridMarkup}
            </div>
          </div>
        </div>
        <div class="n4-seq-options" aria-label="Tarjetas disponibles">
          ${options.map((option) => `
            <button class="n4-seq-option n4-drag-source" type="button" data-piece="${option.id}" aria-label="${option.label}">
              <img src="${n4Asset(8, option.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>Completa la alfombra: despues de avanzar, Nano necesita girar a la derecha.</p>
    </article>
  `;

  function clearSelection() {
    challengeContent.querySelectorAll(".n4-seq-option").forEach((item) => item.classList.remove("is-selected"));
  }

  function placeCard(dropTarget) {
    if (!selectedCard || solved) return;
    const chosen = selectedCard.dataset.piece;

    if (chosen !== dropTarget.dataset.expected) {
      const wrongCard = selectedCard;
      wrongCard.classList.add("is-wrong");
      dropTarget.classList.add("is-wrong");
      window.setTimeout(() => {
        wrongCard.classList.remove("is-wrong");
        dropTarget.classList.remove("is-wrong");
      }, 520);
      setMessage("Casi. En esa esquina Nano necesita la tarjeta de girar a la derecha.", "is-error");
      return;
    }

    solved = true;
    dropTarget.dataset.value = chosen;
    dropTarget.disabled = true;
    dropTarget.classList.add("is-filled", "is-correct");
    dropTarget.innerHTML = `<img src="${n4Asset(8, chosen)}" alt="${labels[chosen]}" />`;
    selectedCard.disabled = true;
    selectedCard.hidden = true;
    clearSelection();
    selectedCard = null;
    setMessage("Excelente. Completaste el camino de la alfombra.", "is-success");
    completeChallenge(id);
  }

  challengeContent.querySelectorAll(".n4-seq-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled || solved) return;
      selectedCard = button;
      clearSelection();
      button.classList.add("is-selected");
      setMessage(`Tarjeta ${labels[button.dataset.piece].toLowerCase()} lista para colocar.`, "is-good");
    });
  });

  challengeContent.querySelector(".n4-carpet-drop")?.addEventListener("click", (event) => {
    placeCard(event.currentTarget);
  });
}

function renderN5Header(id, fallbackInstruction) {
  return renderHeader(id, getChallengeInstruction(id, fallbackInstruction));
}

function getN5ChallengeBackground(id) {
  const backgrounds = {
    1: n5Asset(1, "Fondo consigna 1.jpg"),
    2: n5Asset(2, "Fondo.png"),
    3: n5Asset(3, "FONDO.jpeg"),
    4: n4Asset(1, "Ffondo.png"),
    5: n5Asset(5, "ChatGPT Image 20 jun 2026, 11_04_07 p.m..png"),
    6: n5Asset(6, "FONDO.jpg"),
    7: n5Asset(7, "FONDO.jpg"),
    8: n5Asset(8, "FONDO.png"),
    9: n5Asset(9, "CONSIGNA 9.jpg"),
    10: n5Asset(10, "Fondo.png"),
  };
  return backgrounds[id] || levelBackgrounds[0];
}

function n5CardStyle(id) {
  return `style="--n5-bg: url('${getN5ChallengeBackground(id)}')"`;
}

function renderN5ImageButton(item, challengeNumber, extraClass = "") {
  return `
    <button class="n5-image-option ${extraClass}" type="button" data-id="${item.id}" aria-label="${item.label}" style="--x:${item.x || 50}%;--y:${item.y || 50}%;--w:${item.w || 14}%;--h:${item.h || item.w || 14}%;--item-offset-x:${item.dx || 0}px;--item-offset-y:${item.dy || 0}px;">
      <img src="${n5Asset(challengeNumber, item.file)}" alt="" aria-hidden="true" />
      <span>${item.label}</span>
    </button>
  `;
}

function renderN5RobotSortChallenge(id = 1) {
  const items = [
    { id: "perro", label: "Perro robot", file: "perro robot.png", kind: "robot", x: 91, y: 86, w: 10 },
    { id: "codo", label: "Codo mecanico", file: "Codo mecanico.png", kind: "robot", x: 58, y: 79, w: 12 },
    { id: "drone", label: "Drone", file: "Drone.png", kind: "robot", x: 43, y: 78, w: 15 },
    { id: "robot-turquesa", label: "Robot turquesa", file: "Robot tirquesa.png", kind: "robot", x: 25, y: 85, w: 10 },
    { id: "robot-naranja", label: "Robot naranja", file: "Roboto Naranja.png", kind: "robot", x: 82, y: 75, w: 8 },
    { id: "auto", label: "Auto", file: "AUTO.png", kind: "toy", x: 13, y: 58, w: 8 },
    { id: "muneca", label: "Muneca", file: "MUÑECA.png", kind: "toy", x: 7, y: 57, w: 9 },
    { id: "dinosaurio", label: "Dinosaurio", file: "DINOSAURIO.png", kind: "toy", x: 75, y: 86, w: 11 },
    { id: "oso", label: "Oso", file: "OSO.png", kind: "toy", x: 50, y: 87, w: 8 },
    { id: "patito", label: "Patito", file: "PATITO.png", kind: "toy", x: 7, y: 88, w: 8 },
    { id: "pelota", label: "Pelota", file: "PEÑOTA.png", kind: "toy", x: 93, y: 51, w: 10 },
  ];
  const robots = items.filter((item) => item.kind === "robot");
  const toys = items.filter((item) => item.kind === "toy");
  const sorted = new Set();
  let selectedItem = null;
  let dragState = null;
  let highlightedZone = null;

  challengeContent.innerHTML = `
    <article class="challenge-card n5-card n5-sort-card" ${n5CardStyle(id)}>
      ${renderN5Header(id, "¡A ordenar el taller! Coloca los Robots en el estante azul y los demás objetos en el baúl.")}
      <div class="n5-stage n5-sort-layout">
        <button class="n5-drop-zone n5-drop-zone-robot" type="button" data-zone="robot" aria-label="Estante azul">
          <strong>Estante azul</strong>
          <span data-robot-count>0/${robots.length}</span>
        </button>
        <div class="n5-object-field" aria-label="Objetos para clasificar">
          ${items.map((item) => renderN5ImageButton(item, 1)).join("")}
        </div>
        <button class="n5-drop-zone n5-drop-zone-toy" type="button" data-zone="toy" aria-label="Baul de juguetes">
          <strong>Baul de juguetes</strong>
          <span data-toy-count>0/${toys.length}</span>
        </button>
      </div>
      <p class="challenge-message" data-message>Arrastrá cada objeto al estante azul o al baúl de juguetes.</p>
    </article>
  `;

  function clearSelection() {
    challengeContent.querySelectorAll(".n5-image-option").forEach((button) => button.classList.remove("is-selected"));
  }

  function updateCounters() {
    const sortedRobots = [...sorted].filter((itemId) => items.find((item) => item.id === itemId)?.kind === "robot").length;
    const sortedToys = [...sorted].filter((itemId) => items.find((item) => item.id === itemId)?.kind === "toy").length;
    challengeContent.querySelector("[data-robot-count]").textContent = `${sortedRobots}/${robots.length}`;
    challengeContent.querySelector("[data-toy-count]").textContent = `${sortedToys}/${toys.length}`;
  }

  function placeItem(button, zone) {
    if (!button || button.disabled) return;
    const kind = button.dataset.kind || items.find((item) => item.id === button.dataset.id)?.kind;
    if (kind !== zone) {
      button.classList.add("is-wrong");
      window.setTimeout(() => button.classList.remove("is-wrong"), 520);
      setMessage("Probá en el otro contenedor.", "is-error");
      selectedItem = null;
      clearSelection();
      return;
    }

    sorted.add(button.dataset.id);
    button.classList.add("is-correct");
    button.disabled = true;
    button.hidden = true;
    button.style.display = "none";
    button.classList.remove("is-selected", "is-drag-source");
    selectedItem = null;
    clearSelection();
    playSound("success");
    updateCounters();

    if (sorted.size === items.length) {
      setMessage("Taller ordenado: robots al estante y objetos al baul.", "is-success");
      completeChallenge(id);
    } else {
      setMessage(`Bien. Faltan ${items.length - sorted.size} objetos por ordenar.`, "is-good");
    }
  }

  function placeSelected(zone) {
    placeItem(selectedItem, zone);
  }

  function clearDragHighlight() {
    highlightedZone?.classList.remove("is-drag-over");
    highlightedZone = null;
  }

  function zoneFromPoint(clientX, clientY) {
    const stack = document.elementsFromPoint
      ? document.elementsFromPoint(clientX, clientY)
      : [document.elementFromPoint(clientX, clientY)];
    const zone = stack
      .map((element) => element?.closest?.(".n5-drop-zone"))
      .find((element) => element && challengeContent.contains(element));
    return zone || null;
  }

  function moveGhost(clientX, clientY) {
    if (!dragState?.ghost) return;
    dragState.ghost.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
  }

  function updateDragZone(event) {
    const nextZone = zoneFromPoint(event.clientX, event.clientY);
    if (nextZone === highlightedZone) return nextZone;
    clearDragHighlight();
    highlightedZone = nextZone;
    highlightedZone?.classList.add("is-drag-over");
    return nextZone;
  }

  function cleanupDrag() {
    dragState?.ghost?.remove();
    dragState?.source?.classList.remove("is-drag-source");
    clearDragHighlight();
    dragState = null;
  }

  challengeContent.querySelectorAll(".n5-image-option").forEach((button) => {
    const item = items.find((entry) => entry.id === button.dataset.id);
    button.dataset.kind = item?.kind || "";
    button.addEventListener("click", () => {
      if (button.disabled) return;
      selectedItem = button;
      clearSelection();
      button.classList.add("is-selected");
      setMessage(`Elegiste ${item?.label || "un objeto"}. Ahora tocá su destino.`, "is-good");
    });
    button.addEventListener("pointerdown", (event) => {
      if (button.disabled || event.button > 0) return;
      dragState = {
        source: button,
        startX: event.clientX,
        startY: event.clientY,
        isDragging: false,
        ghost: null,
      };

      const handleMove = (moveEvent) => {
        if (!dragState) return;
        const distance = Math.hypot(moveEvent.clientX - dragState.startX, moveEvent.clientY - dragState.startY);
        if (!dragState.isDragging && distance < 7) return;
        if (!dragState.isDragging) {
          dragState.isDragging = true;
          dragState.ghost = button.cloneNode(true);
          dragState.ghost.classList.add("piece-drag-ghost", "n5-drag-ghost");
          const rect = button.getBoundingClientRect();
          dragState.ghost.style.width = `${rect.width}px`;
          dragState.ghost.style.height = `${rect.height}px`;
          document.body.append(dragState.ghost);
          button.classList.add("is-drag-source");
        }
        moveEvent.preventDefault();
        moveGhost(moveEvent.clientX, moveEvent.clientY);
        updateDragZone(moveEvent);
      };

      const handleUp = (upEvent) => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleCancel);
        if (!dragState) return;
        if (dragState.isDragging) {
          upEvent.preventDefault();
          const zone = updateDragZone(upEvent);
          if (zone) placeItem(button, zone.dataset.zone);
          document.addEventListener("click", (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopImmediatePropagation();
          }, { capture: true, once: true });
        }
        cleanupDrag();
      };

      const handleCancel = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleCancel);
        cleanupDrag();
      };

      window.addEventListener("pointermove", handleMove, { passive: false });
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleCancel);
    });
  });

  challengeContent.querySelectorAll(".n5-drop-zone").forEach((zone) => {
    zone.addEventListener("click", () => placeSelected(zone.dataset.zone));
  });
}

function getN5EnergyConfig() {
  const itemOffset = { dx: -50 };
  return {
    challengeNumber: 2,
    message: "Encontrá en el taller los objetos que usan enchufe o pilas.",
    success: "Encontraste todos los objetos que necesitan energia.",
    items: [
      { id: "dron", label: "Dron", file: "Dron.png", correct: true, x: 20.2, y: 46.8, w: 18.5, ...itemOffset },
      { id: "linterna", label: "Linterna", file: "linterna.png", correct: true, x: 36, y: 46.3, w: 11, ...itemOffset },
      { id: "parlante", label: "Parlante", file: "Parlante.png", correct: true, x: 49.4, y: 44.2, w: 15.5, ...itemOffset, dy: -10 },
      { id: "scooter", label: "Scooter", file: "Scooter.png", correct: true, x: 73, y: 43.4, w: 20, ...itemOffset, dx: -65 },
      { id: "ventilador", label: "Ventilador", file: "Ventilador.png", correct: true, x: 88.4, y: 44.4, w: 13.5, ...itemOffset, dy: 10 },
      { id: "compu", label: "Computadora", file: "Compu.png", correct: true, x: 23.5, y: 71.5, w: 20.5, ...itemOffset, dy: 10 },
      { id: "tablet", label: "Tablet", file: "Tablet.png", correct: true, x: 40.6, y: 77.5, w: 10.8, ...itemOffset },
      { id: "vr", label: "Visor de realidad virtual", file: "VR .png", correct: true, x: 51.3, y: 75.7, w: 14.5, ...itemOffset },
      { id: "switch", label: "Consola portatil", file: "Switch.png", correct: true, x: 63.8, y: 74, w: 12.2, ...itemOffset },
      { id: "joystick", label: "Joystick", file: "Joystick.png", correct: true, x: 64.3, y: 82.5, w: 8.8, ...itemOffset },
      { id: "consola", label: "Consola", file: "Consola.png", correct: true, x: 73.5, y: 77.8, w: 14.2, ...itemOffset },
    ],
  };
}

function getN5ProgrammableConfig() {
  return {
    challengeNumber: 5,
    message: "Tocá las maquinas que pueden recibir tus ordenes.",
    success: "Encontraste los amigos programables de Nano.",
    items: [
      { id: "dron", label: "Dron", file: "DRON.png", correct: true, x: 18, y: 30, w: 18 },
      { id: "tablet", label: "Tablet", file: "TABLET.png", correct: true, x: 10, y: 56, w: 10 },
      { id: "scaner", label: "Scaner", file: "SCANER.png", correct: true, x: 36, y: 60, w: 11 },
      { id: "celular", label: "Celular", file: "CELULAR.png", correct: true, x: 44, y: 58, w: 6 },
      { id: "computadora", label: "Computadora", file: "COMPUTADORA.png", correct: true, x: 61, y: 45, w: 13 },
      { id: "auto", label: "Auto", file: "AUTO.png", correct: true, x: 85, y: 30, w: 22 },
      { id: "planta", label: "Planta", file: "PLANTA.png", correct: false, x: 4, y: 57, w: 9 },
      { id: "mochila", label: "Mochila", file: "MOCHILA.png", correct: false, x: 32, y: 43, w: 8 },
      { id: "destornilladores", label: "Destornilladores", file: "DESTORNILLADORES.png", correct: false, x: 48, y: 37, w: 14 },
      { id: "caja", label: "Caja", file: "CAJA.png", correct: false, x: 78, y: 51, w: 10 },
      { id: "martillo", label: "Martillo", file: "MARTILLO.png", correct: false, x: 56, y: 60, w: 9 },
      { id: "bicicleta", label: "Bicicleta", file: "BICICLETA.png", correct: false, x: 84, y: 79, w: 23 },
    ],
  };
}

function renderN5TapSelectionChallenge(id, config) {
  const selected = new Set();
  const correctItems = config.items.filter((item) => item.correct);

  challengeContent.innerHTML = `
    <article class="challenge-card n5-card n5-tap-card n5-tap-card-${config.challengeNumber}" ${n5CardStyle(config.challengeNumber)}>
      ${renderN5Header(id, config.message)}
      <div class="n5-stage n5-object-field n5-object-field-large" aria-label="Opciones">
        ${config.items.map((item) => renderN5ImageButton(item, config.challengeNumber)).join("")}
      </div>
      <p class="challenge-message" data-message>${config.message}</p>
    </article>
  `;

  challengeContent.querySelectorAll(".n5-image-option").forEach((button) => {
    const item = config.items.find((entry) => entry.id === button.dataset.id);
    button.addEventListener("click", () => {
      if (!item || button.disabled) return;
      if (!item.correct) {
        button.classList.add("is-wrong");
        window.setTimeout(() => button.classList.remove("is-wrong"), 520);
        setMessage("Ese no corresponde. Buscá otro.", "is-error");
        return;
      }

      selected.add(item.id);
      button.classList.add("is-correct");
      button.disabled = true;
      playSound("success");
      if (selected.size === correctItems.length) {
        setMessage(config.success, "is-success");
        completeChallenge(id);
      } else {
        setMessage(`Muy bien. Faltan ${correctItems.length - selected.size}.`, "is-good");
      }
    });
  });
}

function renderN5ChargingPathChallenge(id = 3) {
  const expected = ["avanzar", "avanzar", "derecha", "avanzar", "avanzar", "avanzar"];
  const cards = [
    { id: "avanzar", label: "Avanzar", file: "AVANZAR.png" },
    { id: "derecha", label: "Derecha", file: "DERECHA.png" },
    { id: "izquierda", label: "Izquierda", file: "IZQUIERDA.png" },
  ];
  let selectedSlot = 0;
  const slots = Array(expected.length).fill(null);
  const start = { row: 4, col: 0, dir: 0 };
  const goal = { row: 2, col: 3 };
  const pathCells = ["4-0", "3-0", "2-0", "2-1", "2-2", "2-3"];

  challengeContent.innerHTML = `
    <article class="challenge-card n5-card n5-path-card" ${n5CardStyle(id)}>
      ${renderN5Header(id, "¡Alerta de energía! Guía a Nano hasta su estación de carga.")}
      <div class="n5-stage n5-path-layout n5-path-layout-carpet">
        <div class="n4-carpet-layout">
          <div class="n4-carpet-map n5-carpet-map" aria-label="Alfombra de camino">
            <div class="n4-carpet-grid">
          ${Array.from({ length: 25 }, (_, index) => {
            const row = Math.floor(index / 5);
            const col = index % 5;
            const key = `${row}-${col}`;
            let content = "";
            if (key === `${start.row}-${start.col}`) content = renderNanoDirectionImage("n5-grid-nano n5-carpet-nano", N4_PROGRAM_DIRECTIONS[start.dir]);
            if (key === `${goal.row}-${goal.col}`) content = `<img class="n5-grid-item" src="${n5Asset(3, "ESTACION DE CARGA USB.png")}" alt="Estacion de carga" />`;
            if (key === "1-2") content = `<img class="n5-grid-item" src="${n5Asset(3, "VASO.png")}" alt="Vaso" />`;
            if (key === "3-2") content = `<img class="n5-grid-item" src="${n5Asset(3, "PIZZA.png")}" alt="Pizza" />`;
            const isPath = pathCells.includes(key);
            return `<div class="play-cell n4-program-cell ${isPath ? "is-route" : ""}" data-key="${key}">${content}</div>`;
          }).join("")}
            </div>
          </div>
        </div>
        <div class="n5-program-panel">
          <div class="n5-slots" data-slots>
            ${expected.map((_, index) => `<button class="n5-slot ${index === 0 ? "is-selected" : ""}" type="button" data-slot="${index}" aria-label="Paso ${index + 1}">${index + 1}</button>`).join("")}
          </div>
          <div class="n5-card-bank">
            ${cards.map((card) => `
              <button class="n5-command-card" type="button" data-card="${card.id}" aria-label="${card.label}">
                <img src="${n5Asset(7, card.file)}" alt="" aria-hidden="true" />
                <span>${card.label}</span>
              </button>
            `).join("")}
          </div>
          <button class="n5-run-button" type="button" data-check-path>Comprobar</button>
        </div>
      </div>
      <p class="challenge-message" data-message>Armá el camino: subí, girá a la derecha y avanzá hasta la carga.</p>
    </article>
  `;

  function renderSlots() {
    challengeContent.querySelectorAll(".n5-slot").forEach((slot) => {
      const index = Number(slot.dataset.slot);
      const card = slots[index];
      slot.classList.toggle("is-selected", index === selectedSlot);
      slot.innerHTML = card
        ? `<img src="${n5Asset(7, cards.find((item) => item.id === card)?.file || "AVANZAR.png")}" alt="" aria-hidden="true" />`
        : String(index + 1);
    });
  }

  challengeContent.querySelectorAll(".n5-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      selectedSlot = Number(slot.dataset.slot);
      renderSlots();
    });
  });

  challengeContent.querySelectorAll(".n5-command-card").forEach((card) => {
    card.addEventListener("click", () => {
      slots[selectedSlot] = card.dataset.card;
      selectedSlot = Math.min(selectedSlot + 1, slots.length - 1);
      renderSlots();
    });
  });

  challengeContent.querySelector("[data-check-path]").addEventListener("click", () => {
    const isCorrect = expected.every((card, index) => slots[index] === card);
    if (!isCorrect) {
      setMessage("Revisá la secuencia. Nano tiene que llegar a la estacion USB.", "is-error");
      showScenarioFailureModal(id);
      return;
    }
    animateChargingPath();
  });

  async function animateChargingPath() {
    const nano = challengeContent.querySelector(".n5-carpet-nano");
    const checkButton = challengeContent.querySelector("[data-check-path]");
    if (!nano || !checkButton) {
      setMessage("Nano llego a la estacion de carga.", "is-success");
      completeChallenge(id);
      return;
    }

    checkButton.disabled = true;
    setMessage("Secuencia correcta. Nano avanza hacia la carga.", "is-good");

    const robotState = { ...start };
    const setNanoDirection = () => {
      const direction = N4_PROGRAM_DIRECTIONS[robotState.dir];
      nano.src = getNanoDirectionAsset(direction);
      nano.dataset.nanoDirection = direction;
      nano.dataset.nanoFallbacks = NANO_HEAD_IMAGE_SRC;
      nano.classList.remove("is-fallback-nano-head");
    };

    for (const command of expected) {
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      if (command === "derecha" || command === "izquierda") {
        robotState.dir = command === "derecha"
          ? (robotState.dir + 1) % 4
          : (robotState.dir + 3) % 4;
        setNanoDirection();
        playSound("move");
        continue;
      }

      if (command === "avanzar") {
        const [rowDelta, colDelta] = N4_PROGRAM_DELTAS[robotState.dir];
        robotState.row += rowDelta;
        robotState.col += colDelta;
        setNanoDirection();
        challengeContent.querySelector(`[data-key="${robotState.row}-${robotState.col}"]`)?.append(nano);
        playRobotMoveSound();
      }
    }
    setMessage("Nano llego a la estacion de carga.", "is-success");
    completeChallenge(id);
  }
}

function renderN5NanoAssemblyChallenge(id = 4) {
  const assemblyAsset = (fileName) => n4Asset(1, fileName);
  const facePiece = { id: "cara", label: "Cara", file: "Cara.png", x: 50, y: 38.1, w: 8, h: 7, hitW: 14, hitH: 12 };
  const pieces = [
    { id: "cabeza", label: "Cabeza", file: "cabeza.png", x: 50, y: 36.5, w: 18, h: 14, hitW: 24, hitH: 20, sx: 64, sy: 40, sw: 9.5 },
    { id: "torzo", label: "Torzo", file: "Torzo.png", x: 50.2, y: 54.4, w: 16.2, h: 24.1, hitW: 27, hitH: 33, sx: 23, sy: 71, sw: 7.2, ox: -0.6, oy: 1.2 },
    { id: "brazo-izquierdo", label: "Brazo izquierdo", file: "Brazo izquierdo.png", x: 41.8, y: 51.2, w: 11.1, h: 14.9, hitW: 18, hitH: 22, sx: 34, sy: 60, sw: 6.8 },
    { id: "brazo-derecho", label: "Brazo derecho", file: "Brazo derecho.png", x: 57.5, y: 55, w: 10, h: 22, hitW: 16, hitH: 27, sx: 69, sy: 64, sw: 6.8 },
    { id: "mano-izquierda", label: "Mano izquierda", file: "Mano izquierdo.png", x: 38.3, y: 47.2, w: 10, h: 11, hitW: 16, hitH: 16, sx: 30, sy: 42, sw: 5.6 },
    { id: "mano-derecha", label: "Mano derecha", file: "Mano drecha.png", x: 59.5, y: 67, w: 9, h: 11, hitW: 15, hitH: 16, sx: 79, sy: 69, sw: 5.6 },
    { id: "pierna-izquierda", label: "Pierna izquierda", file: "Pierna izquierda.png", x: 45.9, y: 74.8, w: 9.6, h: 27, hitW: 14, hitH: 30, sx: 21, sy: 35, sw: 6.4 },
    { id: "pierna-derecha", label: "Pierna derecha", file: "Pierna derecha.png", x: 54.1, y: 74.8, w: 9.6, h: 27, hitW: 14, hitH: 30, sx: 78, sy: 35, sw: 6.4 },
  ];
  const placed = new Set();
  let selectedPiece = null;

  challengeContent.innerHTML = `
    <article class="challenge-card n5-card n5-assembly-card" ${n5CardStyle(id)}>
      ${renderN5Header(id, "¡Ayuda a Nano a estar listo! Arrastra cada pieza a su lugar correcto.")}
      <div class="n5-stage n5-assembly-layout">
        <section class="n5-assembly-stage n4-assembly-stage" aria-label="Silueta de Nano">
          <img class="n4-nano-silhouette" src="${assemblyAsset("Silueta.png")}" alt="Silueta de Nano" />
          ${pieces.map((piece) => `
            <button class="n4-piece n4-piece-floating n4-drag-source" type="button" data-piece="${piece.id}" data-label="${piece.label}" aria-label="${piece.label}" style="--sx:${piece.sx}%;--sy:${piece.sy}%;--sw:${piece.sw}%;">
              <img src="${assemblyAsset(piece.file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
          <div class="n4-assembly-target-layer" aria-hidden="true">
            ${pieces.map((piece) => `
              <button class="n4-assembly-target n4-drop-target" type="button" data-target="${piece.id}" data-label="${piece.label}" style="--x:${piece.x}%;--y:${piece.y}%;--hit-w:${piece.hitW || piece.w}%;--hit-h:${piece.hitH || piece.h}%;--img-w:${(piece.w / (piece.hitW || piece.w)) * 100}%;--img-h:${(piece.h / (piece.hitH || piece.h)) * 100}%;--img-ox:${piece.ox || 0}%;--img-oy:${piece.oy || 0}%;" aria-label="Lugar de ${piece.label}"></button>
            `).join("")}
            <div class="n4-assembly-target n4-face-reveal-target" data-face-reveal style="--x:${facePiece.x}%;--y:${facePiece.y}%;--hit-w:${facePiece.hitW || facePiece.w}%;--hit-h:${facePiece.hitH || facePiece.h}%;--img-w:${(facePiece.w / (facePiece.hitW || facePiece.w)) * 100}%;--img-h:${(facePiece.h / (facePiece.hitH || facePiece.h)) * 100}%;"></div>
          </div>
        </section>
      </div>
      <p class="challenge-message" data-message>Elegí una pieza y llevala al lugar que coincide con la silueta.</p>
    </article>
  `;

  function clearSelection() {
    challengeContent.querySelectorAll(".n4-piece").forEach((piece) => piece.classList.remove("is-selected"));
    challengeContent.querySelectorAll(".n4-assembly-target").forEach((target) => target.classList.remove("is-available"));
  }

  function revealFaceAndComplete() {
    const faceTarget = challengeContent.querySelector("[data-face-reveal]");
    faceTarget?.classList.add("is-filled", "is-face-on");
    if (faceTarget) {
      faceTarget.innerHTML = `<img src="${assemblyAsset(facePiece.file)}" alt="${facePiece.label}" />`;
    }
    playSound("success");
    setMessage("Nano quedo armado y listo para seguir.", "is-success");
    completeChallenge(id);
  }

  function placePiece(target) {
    if (!selectedPiece || placed.has(target.dataset.target)) return;
    const piece = pieces.find((item) => item.id === selectedPiece.dataset.piece);
    if (!piece) return;

    if (target.dataset.target !== piece.id) {
      target.classList.add("is-wrong");
      window.setTimeout(() => target.classList.remove("is-wrong"), 480);
      selectedPiece = null;
      clearSelection();
      setMessage("Casi. Esa pieza va en otro lugar.", "is-error is-soft-error");
      return;
    }

    placed.add(piece.id);
    target.classList.add("is-filled");
    target.innerHTML = `<img src="${assemblyAsset(piece.file)}" alt="${piece.label}" />`;
    selectedPiece.disabled = true;
    selectedPiece.hidden = true;
    selectedPiece = null;
    clearSelection();
    playSound("success");

    if (placed.size === pieces.length) {
      revealFaceAndComplete();
    } else {
      setMessage(`Muy bien. Ya van ${placed.size} de ${pieces.length} piezas.`, "is-good");
    }
  }

  challengeContent.querySelectorAll(".n4-piece").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.hidden) return;
      selectedPiece = button;
      clearSelection();
      button.classList.add("is-selected");
      challengeContent.querySelectorAll(".n4-assembly-target:not(.is-filled)").forEach((target) => target.classList.add("is-available"));
      setMessage(`Ahora buscá el lugar de ${button.dataset.label || "esa pieza"}.`, "is-good");
    });
  });

  challengeContent.querySelectorAll(".n4-drop-target").forEach((target) => {
    target.addEventListener("click", () => placePiece(target));
  });
}

function renderN5ProgrammingToolChallenge(id = 6) {
  const itemOffset = { dx: -40, dy: 0 };
  const slots = [
    { x: 31, y: 35, ...itemOffset },
    { x: 50, y: 35, ...itemOffset },
    { x: 69, y: 35, ...itemOffset },
    { x: 31, y: 66, ...itemOffset },
    { x: 50, y: 66, ...itemOffset },
    { x: 69, y: 66, ...itemOffset },
  ];
  const rounds = [
    [
      { id: "program-card-avanzar", label: "Tarjeta de programacion", correct: true, files: ["AVANZAR.png"] },
      { id: "program-card-derecha", label: "Tarjeta de programacion", correct: true, files: ["DERECHA.png"] },
      { id: "program-card-izquierda", label: "Tarjeta de programacion", correct: true, files: ["IZQUIERDA.png"] },
      { id: "destornillador", label: "Destornillador", correct: false, files: ["destornillado.png"] },
      { id: "dinosaurio", label: "Dinosaurio", correct: false, files: ["DINOSAURIO.png"] },
      { id: "tuerca", label: "Tuerca", correct: false, files: ["tuerca.png"] },
    ],
    [
      { id: "program-card-avanzar", label: "Tarjeta de programacion", correct: true, files: ["AVANZAR.png"] },
      { id: "program-card-derecha", label: "Tarjeta de programacion", correct: true, files: ["DERECHA.png"] },
      { id: "program-card-izquierda", label: "Tarjeta de programacion", correct: true, files: ["IZQUIERDA.png"] },
      { id: "patito", label: "Patito", correct: false, files: ["PATITO.png"] },
      { id: "destornillador", label: "Destornillador", correct: false, files: ["destornillado.png"] },
      { id: "tuerca", label: "Tuerca", correct: false, files: ["tuerca.png"] },
    ],
    [
      { id: "program-card-avanzar", label: "Tarjeta de programacion", correct: true, files: ["AVANZAR.png"] },
      { id: "program-card-derecha", label: "Tarjeta de programacion", correct: true, files: ["DERECHA.png"] },
      { id: "program-card-izquierda", label: "Tarjeta de programacion", correct: true, files: ["IZQUIERDA.png"] },
      { id: "oso", label: "Oso", correct: false, files: ["OSO.png"] },
      { id: "patito", label: "Patito", correct: false, files: ["PATITO.png"] },
      { id: "destornillador", label: "Destornillador", correct: false, files: ["destornillado.png"] },
    ],
  ];
  let currentRound = 0;
  let selectedCorrectThisRound = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card n5-card n5-tool-card" ${n5CardStyle(6)}>
      ${renderN5Header(id, "¿Qué herramienta usamos en el taller para programar a Nano?")}
      <div class="n5-stage n5-tool-stage">
        <div class="n5-tool-grid" data-tool-grid></div>
      </div>
      <p class="challenge-message" data-message></p>
    </article>
  `;

  const grid = challengeContent.querySelector("[data-tool-grid]");

  function shuffled(items) {
    return items
      .map((item) => ({ item, order: Math.random() }))
      .sort((a, b) => a.order - b.order)
      .map(({ item }) => item);
  }

  function renderRound() {
    selectedCorrectThisRound = new Set();
    const options = shuffled(rounds[currentRound]).map((option, index) => ({
      ...option,
      ...slots[index],
    }));

    grid.innerHTML = options.map((option) => `
      <button class="n5-tool-option" type="button" data-id="${option.id}" aria-label="${option.label}" style="--x:${option.x}%;--y:${option.y}%;--tool-offset-x:${option.dx || 0}px;--tool-offset-y:${option.dy || 0}px;">
        <span class="n5-tool-images">
          ${option.files.map((file) => `<img src="${n5Asset(6, file)}" alt="" aria-hidden="true" />`).join("")}
        </span>
        <strong>${option.label}</strong>
      </button>
    `).join("");

    setMessage(`Ronda ${currentRound + 1}/3: tocá las 3 tarjetas que sirven para darle instrucciones a Nano.`);

    grid.querySelectorAll(".n5-tool-option").forEach((button) => {
      const option = options.find((item) => item.id === button.dataset.id);
      button.addEventListener("click", () => {
        if (!option?.correct) {
          button.classList.add("is-wrong");
          window.setTimeout(() => button.classList.remove("is-wrong"), 520);
          setMessage("Eso ayuda a construir o jugar, pero no a programar.", "is-error");
          return;
        }

        selectedCorrectThisRound.add(option.id);
        button.classList.add("is-correct");
        button.disabled = true;

        const correctCount = options.filter((item) => item.correct).length;
        if (selectedCorrectThisRound.size < correctCount) {
          setMessage(`Bien. Faltan ${correctCount - selectedCorrectThisRound.size} tarjetas de programacion en esta ronda.`, "is-good");
          return;
        }

        if (currentRound === rounds.length - 1) {
          setMessage("Exacto: programamos con tarjetas de instrucciones.", "is-success");
          completeChallenge(id);
          return;
        }

        currentRound += 1;
        setMessage("Muy bien. Las piezas se reordenan para otra ronda.", "is-good");
        window.setTimeout(renderRound, 760);
      });
    });
  }

  renderRound();
}

function renderN5LinearCommandChallenge(id = 7) {
  const expected = ["AVANZAR.png", "AVANZAR.png", "AVANZAR.png"];
  const options = ["AVANZAR.png", "DERECHA.png", "IZQUIERDA.png", "RETROCEDER.png"];
  const chosenSequence = [];
  const nanoPath = [
    { x: 8, y: 18 },
    { x: 30, y: 18 },
    { x: 53, y: 18 },
    { x: 76, y: 18 },
  ];
  let isAnimating = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n5-card n5-linear-card" ${n5CardStyle(7)}>
      ${renderN5Header(id, "Ordena las flechas para dar 3 pasos hacia el cargador.")}
      <div class="n5-stage n5-linear-scene">
        <img class="n5-linear-nano" src="${n5Asset(7, "Nano.png")}" alt="" aria-hidden="true" style="--nano-x:${nanoPath[0].x}%;--nano-y:${nanoPath[0].y}%;" />
        <img class="n5-linear-goal" src="${n4Asset(3, "Bateria.png")}" alt="" aria-hidden="true" />
        <div class="n5-card-bank">
          ${options.map((file) => `
            <button class="n5-command-card" type="button" data-file="${file}">
              <img src="${n5Asset(7, file)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>Completá los tres casilleros con la flecha Avanzar.</p>
    </article>
  `;

  const commandCards = [...challengeContent.querySelectorAll(".n5-command-card")];
  const nano = challengeContent.querySelector(".n5-linear-nano");

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function setControlsDisabled(disabled) {
    commandCards.forEach((card) => {
      card.disabled = disabled;
    });
  }

  async function animateNanoToCharger() {
    isAnimating = true;
    setControlsDisabled(true);
    setMessage("Muy bien. Secuencia lista: tres pasos de avanzar.", "is-good");

    for (let index = 1; index < nanoPath.length; index += 1) {
      await wait(260);
      if (nano) {
        nano.style.setProperty("--nano-x", `${nanoPath[index].x}%`);
        nano.style.setProperty("--nano-y", `${nanoPath[index].y}%`);
      }
      playRobotMoveSound();
    }

    await wait(280);
    setMessage("Secuencia correcta.", "is-success");
    completeChallenge(id, 3000);
  }

  commandCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (isAnimating) return;
      const nextStep = chosenSequence.length;
      const selectedFile = card.dataset.file;

      if (selectedFile !== expected[nextStep]) {
        chosenSequence.length = 0;
        setMessage("Revisá la secuencia: Nano necesita avanzar 3 veces.", "is-error");
        return;
      }

      chosenSequence.push(selectedFile);
      if (chosenSequence.length < expected.length) {
        setMessage(`Bien. Faltan ${expected.length - chosenSequence.length} pasos de avanzar.`, "is-good");
        return;
      }

      animateNanoToCharger();
    });
  });
}

function renderN5HandwashingOrderChallenge(id = 8) {
  const steps = [
    { id: "mojar", label: "Mojarse las manos", file: "MOJARSE LAS MANOS.png" },
    { id: "enjabonar", label: "Enjabonar las manos", file: "ENJABONAR LAS MANOS.png" },
    { id: "enjuagar", label: "Enjuagarse las manos", file: "ENJAGUARSE LAS MANOS.png" },
    { id: "secar", label: "Secarse las manos", file: "SECARSE LAS MANOS.png" },
  ];
  const slots = Array(steps.length).fill(null);
  let selectedSlot = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card n5-card n5-order-card" ${n5CardStyle(8)}>
      ${renderN5Header(id, "¡El orden importa! Ordena los pasos desde el principio hasta el final.")}
      <div class="n5-stage n5-order-layout">
        <div class="n5-bath-bg"><img src="${n5Asset(8, "FONDO BAÑO.png")}" alt="" aria-hidden="true" /></div>
        <div class="n5-order-slots">
          ${steps.map((_, index) => `<button class="n5-order-slot ${index === 0 ? "is-selected" : ""}" type="button" data-slot="${index}"><strong>${index + 1}</strong></button>`).join("")}
        </div>
        <div class="n5-order-bank">
          ${steps.slice().reverse().map((step) => `
            <button class="n5-order-card-option" type="button" data-step="${step.id}" aria-label="${step.label}">
              <img src="${n5Asset(8, step.file)}" alt="" aria-hidden="true" />
              <span>${step.label}</span>
            </button>
          `).join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>Ubicá las imagenes en los casilleros 1, 2, 3 y 4.</p>
    </article>
  `;

  function renderSlots() {
    challengeContent.querySelectorAll(".n5-order-slot").forEach((slot) => {
      const index = Number(slot.dataset.slot);
      const step = steps.find((item) => item.id === slots[index]);
      slot.classList.toggle("is-selected", index === selectedSlot);
      slot.innerHTML = step
        ? `<img src="${n5Asset(8, step.file)}" alt="" aria-hidden="true" /><span>${step.label}</span>`
        : `<strong>${index + 1}</strong>`;
    });
  }

  function maybeComplete() {
    if (slots.some((slot) => !slot)) return;
    const isCorrect = steps.every((step, index) => slots[index] === step.id);
    if (!isCorrect) {
      setMessage("El orden todavia no cierra. Pensá qué va primero.");
      return;
    }
    setMessage("Orden perfecto: mojar, enjabonar, enjuagar y secar.", "is-success");
    completeChallenge(id);
  }

  challengeContent.querySelectorAll(".n5-order-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      selectedSlot = Number(slot.dataset.slot);
      renderSlots();
    });
  });

  challengeContent.querySelectorAll(".n5-order-card-option").forEach((option) => {
    option.addEventListener("click", () => {
      slots[selectedSlot] = option.dataset.step;
      selectedSlot = Math.min(selectedSlot + 1, slots.length - 1);
      renderSlots();
      maybeComplete();
    });
  });
}

function renderN4WakeUpSequenceChallenge(id) {
  const steps = [
    { id: "alarma", label: "El despertador suena", file: "Despertador suena.png" },
    { id: "bostezo", label: "Nano bosteza", file: "Nano bosteza.png" },
    { id: "de-pie", label: "Nano se pone de pie", file: "Nano parado.png" },
  ];
  const bankOrder = [steps[1], steps[0], steps[2]];
  const slots = Array(steps.length).fill(null);
  let selectedSlot = 0;
  let selectedStep = null;
  let solved = false;

  const stepById = (stepId) => steps.find((step) => step.id === stepId);
  const stepMarkup = (step, compact = false) => `
    <span class="n4-b2-d1-step-art${compact ? " is-compact" : ""}">
      <img src="${n4Block2Asset(step.file)}" alt="" aria-hidden="true" />
      ${step.id === "alarma" ? `
        <span class="n4-b2-d1-alarm-motion" aria-hidden="true">
          <img src="${n4Block2Asset("nota.png")}" alt="" />
          <img src="${n4Block2Asset("alarma.png")}" alt="" />
        </span>
      ` : ""}
    </span>
    <span class="n4-b2-d1-step-label">${step.label}</span>
  `;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d1-card">
      ${renderChallengeHeader(
        "BLOQUE 2 · DESAFÍO 1",
        "¡RING, RING!",
        getChallengeInstruction(id, "Ayuda a Nano a ordenar los pasos para despertarse e ir al colegio."),
      )}
      <section class="n4-b2-d1-layout" aria-label="Ordenar la secuencia para despertarse">
        <div class="n4-b2-d1-slots" aria-label="Secuencia ordenada">
          ${steps.map((_, index) => `
            <button class="n4-b2-d1-slot${index === 0 ? " is-selected" : ""}" type="button" data-wake-slot="${index}" aria-label="Paso ${index + 1}, vacío">
              <strong>${index + 1}</strong>
              <span class="n4-b2-d1-placeholder">Arrastrá una imagen aquí</span>
            </button>
          `).join("")}
        </div>
        <div class="n4-b2-d1-bank" aria-label="Imágenes desordenadas">
          ${bankOrder.map((step) => `
            <button class="n4-b2-d1-option" type="button" draggable="true" data-wake-step="${step.id}" aria-label="${step.label}">
              ${stepMarkup(step, true)}
            </button>
          `).join("")}
        </div>
      </section>
      <p class="challenge-message n4-b2-d1-message" data-message>Ordená las tres imágenes desde lo que ocurre primero hasta lo que ocurre al final.</p>
    </article>
  `;

  const slotNodes = [...challengeContent.querySelectorAll("[data-wake-slot]")];
  const optionNodes = [...challengeContent.querySelectorAll("[data-wake-step]")];

  function renderState() {
    slotNodes.forEach((slot, index) => {
      const step = stepById(slots[index]);
      slot.classList.toggle("is-selected", index === selectedSlot && !solved);
      slot.classList.remove("is-drag-over");
      slot.setAttribute("aria-label", step ? `Paso ${index + 1}: ${step.label}` : `Paso ${index + 1}, vacío`);
      slot.innerHTML = step
        ? `<strong>${index + 1}</strong>${stepMarkup(step)}`
        : `<strong>${index + 1}</strong><span class="n4-b2-d1-placeholder">Arrastrá una imagen aquí</span>`;
    });

    optionNodes.forEach((option) => {
      const isPlaced = slots.includes(option.dataset.wakeStep);
      option.classList.toggle("is-placed", isPlaced);
      option.classList.toggle("is-selected", option.dataset.wakeStep === selectedStep && !isPlaced);
      option.setAttribute("aria-pressed", String(option.dataset.wakeStep === selectedStep && !isPlaced));
    });
  }

  function placeStep(stepId, slotIndex) {
    if (solved || !stepById(stepId)) return;
    const previousIndex = slots.indexOf(stepId);
    if (previousIndex !== -1) slots[previousIndex] = null;
    slots[slotIndex] = stepId;
    selectedStep = null;
    slotNodes.forEach((slot) => slot.classList.remove("is-wrong"));

    const nextEmpty = slots.findIndex((value) => !value);
    selectedSlot = nextEmpty === -1 ? slotIndex : nextEmpty;
    renderState();

    if (slots.some((value) => !value)) {
      setMessage("Bien. Ahora ubicá la imagen que sigue.", "is-good");
      return;
    }

    const firstWrong = steps.findIndex((step, index) => slots[index] !== step.id);
    if (firstWrong !== -1) {
      slotNodes[firstWrong].classList.add("is-wrong");
      selectedSlot = firstWrong;
      renderState();
      slotNodes[firstWrong].classList.add("is-wrong");
      setMessage(`Revisá el paso ${firstWrong + 1}. ¿Qué ocurre antes?`, "is-error is-soft-error");
      return;
    }

    solved = true;
    slotNodes.forEach((slot) => slot.classList.add("is-correct"));
    renderState();
    setMessage("¡Secuencia completa! Suena el despertador, Nano bosteza y después se pone de pie.", "is-success");
    completeChallenge(id);
  }

  slotNodes.forEach((slot) => {
    slot.addEventListener("click", () => {
      if (solved) return;
      const slotIndex = Number(slot.dataset.wakeSlot);
      if (selectedStep) {
        placeStep(selectedStep, slotIndex);
        return;
      }
      selectedSlot = slotIndex;
      renderState();
    });
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("is-drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drag-over"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      placeStep(event.dataTransfer?.getData("text/plain"), Number(slot.dataset.wakeSlot));
    });
  });

  optionNodes.forEach((option) => {
    option.addEventListener("click", () => {
      if (solved) return;
      const stepId = option.dataset.wakeStep;
      if (slots.includes(stepId)) {
        selectedSlot = slots.indexOf(stepId);
        renderState();
        return;
      }
      selectedStep = selectedStep === stepId ? null : stepId;
      if (selectedStep) placeStep(selectedStep, selectedSlot);
      else renderState();
    });
    option.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", option.dataset.wakeStep);
      option.classList.add("is-dragging");
    });
    option.addEventListener("dragend", () => option.classList.remove("is-dragging"));
  });
}

function renderN4ShoelaceSequenceChallenge(id) {
  const orderedFileNumbers = [5, 3, 4, 9, 6, 2, 8, 7, 1];
  const steps = orderedFileNumbers.map((fileNumber, index) => ({
    id: `cordon-${fileNumber}`,
    label: `Paso ${index + 1} para atar los cordones`,
    file: `CORDON ${fileNumber}.png`,
  }));
  const bankOrder = [steps[5], steps[1], steps[8], steps[3], steps[0], steps[6], steps[2], steps[7], steps[4]];
  const slots = Array(steps.length).fill(null);
  let selectedSlot = 0;
  let solved = false;

  const stepById = (stepId) => steps.find((step) => step.id === stepId);
  const imageMarkup = (step) => `<img src="${n4Block2ChallengeAsset(2, step.file)}" alt="" aria-hidden="true" />`;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d2-card">
      ${renderChallengeHeader(
        "BLOQUE 2 · DESAFÍO 2",
        "CORDONES EN ORDEN",
        getChallengeInstruction(id, "Nano se puso sus zapatillas favoritas, pero los cordones están sueltos. Observa los pasos y ordénalos para que no se tropiece."),
      )}
      <section class="n4-b2-d2-layout" aria-label="Ordenar los pasos para atar los cordones">
        <div class="n4-b2-d2-slots" aria-label="Secuencia ordenada">
          ${steps.map((_, index) => `
            <button class="n4-b2-d2-slot${index === 0 ? " is-selected" : ""}" type="button" data-lace-slot="${index}" aria-label="Paso ${index + 1}, vacío">
              <strong>${index + 1}</strong>
              <span>?</span>
            </button>
          `).join("")}
        </div>
        <div class="n4-b2-d2-bank" aria-label="Pasos desordenados">
          ${bankOrder.map((step) => `
            <button class="n4-b2-d2-option" type="button" draggable="true" data-lace-step="${step.id}" aria-label="${step.label}">
              ${imageMarkup(step)}
            </button>
          `).join("")}
        </div>
      </section>
      <p class="challenge-message n4-b2-d2-message" data-message>Ordená las nueve imágenes desde el primer movimiento hasta el nudo terminado.</p>
    </article>
  `;

  const slotNodes = [...challengeContent.querySelectorAll("[data-lace-slot]")];
  const optionNodes = [...challengeContent.querySelectorAll("[data-lace-step]")];

  function renderState() {
    slotNodes.forEach((slot, index) => {
      const step = stepById(slots[index]);
      slot.classList.toggle("is-selected", index === selectedSlot && !solved);
      slot.classList.remove("is-drag-over");
      slot.setAttribute("aria-label", step ? `Paso ${index + 1}: ${step.label}` : `Paso ${index + 1}, vacío`);
      slot.innerHTML = step
        ? `<strong>${index + 1}</strong>${imageMarkup(step)}`
        : `<strong>${index + 1}</strong><span>?</span>`;
    });
    optionNodes.forEach((option) => {
      const isPlaced = slots.includes(option.dataset.laceStep);
      option.classList.toggle("is-placed", isPlaced);
      option.disabled = solved;
    });
  }

  function placeStep(stepId, slotIndex) {
    if (solved || !stepById(stepId)) return;
    const previousIndex = slots.indexOf(stepId);
    if (previousIndex !== -1) slots[previousIndex] = null;
    slots[slotIndex] = stepId;
    slotNodes.forEach((slot) => slot.classList.remove("is-wrong"));
    const nextEmpty = slots.findIndex((value) => !value);
    selectedSlot = nextEmpty === -1 ? slotIndex : nextEmpty;
    renderState();

    if (slots.some((value) => !value)) {
      setMessage(`Paso ubicado. Faltan ${slots.filter((value) => !value).length}.`, "is-good");
      return;
    }

    const wrongIndexes = steps
      .map((step, index) => slots[index] === step.id ? -1 : index)
      .filter((index) => index !== -1);
    if (wrongIndexes.length) {
      wrongIndexes.forEach((index) => slotNodes[index].classList.add("is-wrong"));
      selectedSlot = wrongIndexes[0];
      renderState();
      wrongIndexes.forEach((index) => slotNodes[index].classList.add("is-wrong"));
      setMessage(`Revisá desde el paso ${wrongIndexes[0] + 1}: todavía hay movimientos fuera de orden.`, "is-error is-soft-error");
      return;
    }

    solved = true;
    slotNodes.forEach((slot) => slot.classList.add("is-correct"));
    renderState();
    setMessage("¡Cordones atados! Los nueve movimientos quedaron en el orden correcto.", "is-success");
    completeChallenge(id);
  }

  slotNodes.forEach((slot) => {
    slot.addEventListener("click", () => {
      if (solved) return;
      selectedSlot = Number(slot.dataset.laceSlot);
      renderState();
    });
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("is-drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drag-over"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      placeStep(event.dataTransfer?.getData("text/plain"), Number(slot.dataset.laceSlot));
    });
  });

  optionNodes.forEach((option) => {
    option.addEventListener("click", () => {
      if (solved) return;
      const stepId = option.dataset.laceStep;
      if (slots.includes(stepId)) {
        selectedSlot = slots.indexOf(stepId);
        renderState();
        return;
      }
      placeStep(stepId, selectedSlot);
    });
    option.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", option.dataset.laceStep);
      option.classList.add("is-dragging");
    });
    option.addEventListener("dragend", () => option.classList.remove("is-dragging"));
  });
}

function renderN4ToothbrushingSequenceChallenge(id) {
  const orderedFileNumbers = [1, 4, 6, 2, 3, 5, 7, 8];
  const labels = [
    "Tomar el cepillo",
    "Abrir la canilla",
    "Mojar el cepillo",
    "Colocar la pasta",
    "Cepillar los dientes",
    "Enjuagar la boca",
    "Cerrar la canilla",
    "Guardar el cepillo limpio",
  ];
  const steps = orderedFileNumbers.map((fileNumber, index) => ({
    id: `cepillado-${fileNumber}`,
    label: labels[index],
    file: `PASO ${fileNumber}.png`,
  }));
  const bankOrder = [steps[3], steps[1], steps[5], steps[7], steps[4], steps[2], steps[6], steps[0]];
  const slots = Array(steps.length).fill(null);
  let selectedSlot = 0;
  let solved = false;

  const stepById = (stepId) => steps.find((step) => step.id === stepId);
  const imageMarkup = (step) => `<img src="${n4Block2ChallengeAsset(3, step.file)}" alt="" aria-hidden="true" />`;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d3-card">
      ${renderChallengeHeader(
        "BLOQUE 2 · DESAFÍO 3",
        "¡A LAVARSE LOS DIENTES!",
        getChallengeInstruction(id, "Para que queden limpios hay que seguir un orden. Ordena las imágenes."),
      )}
      <section class="n4-b2-d3-layout" aria-label="Ordenar el paso a paso del cepillado de dientes">
        <div class="n4-b2-d3-slots" aria-label="Secuencia ordenada">
          ${steps.map((_, index) => `
            <button class="n4-b2-d3-slot${index === 0 ? " is-selected" : ""}" type="button" data-brush-slot="${index}" aria-label="Paso ${index + 1}, vacío">
              <strong>${index + 1}</strong>
              <span>?</span>
            </button>
          `).join("")}
        </div>
        <div class="n4-b2-d3-bank" aria-label="Imágenes desordenadas">
          ${bankOrder.map((step) => `
            <button class="n4-b2-d3-option" type="button" draggable="true" data-brush-step="${step.id}" aria-label="${step.label}">
              ${imageMarkup(step)}
            </button>
          `).join("")}
        </div>
      </section>
      <p class="challenge-message n4-b2-d3-message" data-message>Ordená las ocho imágenes desde que tomás el cepillo hasta que lo guardás limpio.</p>
    </article>
  `;

  const slotNodes = [...challengeContent.querySelectorAll("[data-brush-slot]")];
  const optionNodes = [...challengeContent.querySelectorAll("[data-brush-step]")];

  function renderState() {
    slotNodes.forEach((slot, index) => {
      const step = stepById(slots[index]);
      slot.classList.toggle("is-selected", index === selectedSlot && !solved);
      slot.classList.remove("is-drag-over");
      slot.setAttribute("aria-label", step ? `Paso ${index + 1}: ${step.label}` : `Paso ${index + 1}, vacío`);
      slot.innerHTML = step
        ? `<strong>${index + 1}</strong>${imageMarkup(step)}`
        : `<strong>${index + 1}</strong><span>?</span>`;
    });
    optionNodes.forEach((option) => {
      const isPlaced = slots.includes(option.dataset.brushStep);
      option.classList.toggle("is-placed", isPlaced);
      option.disabled = solved;
    });
  }

  function placeStep(stepId, slotIndex) {
    if (solved || !stepById(stepId)) return;
    const previousIndex = slots.indexOf(stepId);
    if (previousIndex !== -1) slots[previousIndex] = null;
    slots[slotIndex] = stepId;
    slotNodes.forEach((slot) => slot.classList.remove("is-wrong"));
    const nextEmpty = slots.findIndex((value) => !value);
    selectedSlot = nextEmpty === -1 ? slotIndex : nextEmpty;
    renderState();

    if (slots.some((value) => !value)) {
      setMessage(`Paso ubicado. Faltan ${slots.filter((value) => !value).length}.`, "is-good");
      return;
    }

    const wrongIndexes = steps
      .map((step, index) => slots[index] === step.id ? -1 : index)
      .filter((index) => index !== -1);
    if (wrongIndexes.length) {
      wrongIndexes.forEach((index) => slotNodes[index].classList.add("is-wrong"));
      selectedSlot = wrongIndexes[0];
      renderState();
      wrongIndexes.forEach((index) => slotNodes[index].classList.add("is-wrong"));
      setMessage(`Revisá desde el paso ${wrongIndexes[0] + 1}. Recordá cepillarte antes de enjuagarte.`, "is-error is-soft-error");
      return;
    }

    solved = true;
    slotNodes.forEach((slot) => slot.classList.add("is-correct"));
    renderState();
    setMessage("¡Dientes limpios! Seguiste los ocho pasos en el orden correcto.", "is-success");
    completeChallenge(id);
  }

  slotNodes.forEach((slot) => {
    slot.addEventListener("click", () => {
      if (solved) return;
      selectedSlot = Number(slot.dataset.brushSlot);
      renderState();
    });
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("is-drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drag-over"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      placeStep(event.dataTransfer?.getData("text/plain"), Number(slot.dataset.brushSlot));
    });
  });

  optionNodes.forEach((option) => {
    option.addEventListener("click", () => {
      if (solved) return;
      const stepId = option.dataset.brushStep;
      if (slots.includes(stepId)) {
        selectedSlot = slots.indexOf(stepId);
        renderState();
        return;
      }
      placeStep(stepId, selectedSlot);
    });
    option.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", option.dataset.brushStep);
      option.classList.add("is-dragging");
    });
    option.addEventListener("dragend", () => option.classList.remove("is-dragging"));
  });
}

function renderN4SituationPairsChallenge(id) {
  const situations = [
    { id: "calor", label: "Hace calor", file: "calor.png", answer: "agua" },
    { id: "lluvia", label: "Llueve", file: "lluvia.png", answer: "paraguas" },
    { id: "dientes", label: "Dientes sucios", file: "dientes sucios.png", answer: "cepillo" },
    { id: "frio", label: "Hace frío", file: "frio.png", answer: "abrigo" },
  ];
  const solutions = [
    { id: "paraguas", label: "Paraguas", file: "paraguas.png" },
    { id: "agua", label: "Agua", file: "vaso agua.png" },
    { id: "abrigo", label: "Abrigo", file: "campera.png" },
    { id: "cepillo", label: "Cepillo", file: "cepillo de dientes.png" },
  ];
  const solutionById = Object.fromEntries(solutions.map((solution) => [solution.id, solution]));
  const matches = new Map();
  let selectedSolution = null;
  let solved = false;

  const image = (item) => `
    <img src="${n4Block2ChallengeAsset(5, item.file)}" alt="" aria-hidden="true" />
    <strong>${item.label}</strong>
  `;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d5-card">
      ${renderChallengeHeader(
        "BLOQUE 2 · DESAFÍO 5",
        "¡A JUGAR!",
        getChallengeInstruction(id, "Observa la situación y une las parejas correctas."),
      )}
      <section class="n4-b2-d5-layout" aria-label="Unir situaciones cotidianas con sus soluciones">
        <div class="n4-b2-d5-situations">
          ${situations.map((situation, index) => `
            <div class="n4-b2-d5-pair" data-pair="${situation.id}">
              <div class="n4-b2-d5-situation">
                <span class="n4-b2-d5-letter" aria-hidden="true">${String.fromCharCode(65 + index)}</span>
                ${image(situation)}
              </div>
              <button class="n4-b2-d5-slot" type="button" data-pair-slot="${situation.id}" aria-label="Solución para ${situation.label}">
                <span>Elegí la solución</span>
              </button>
            </div>
          `).join("")}
        </div>
        <div class="n4-b2-d5-bank" aria-label="Soluciones disponibles">
          ${solutions.map((solution) => `
            <button class="n4-b2-d5-option" type="button" draggable="true" data-pair-solution="${solution.id}" aria-label="${solution.label}">
              ${image(solution)}
            </button>
          `).join("")}
        </div>
      </section>
      <p class="challenge-message n4-b2-d5-message" data-message>Tocá una solución y después la situación que corresponda, o arrastrala hasta su casillero.</p>
    </article>
  `;

  const messageNode = challengeContent.querySelector("[data-message]");
  const optionNodes = [...challengeContent.querySelectorAll("[data-pair-solution]")];
  const slotNodes = [...challengeContent.querySelectorAll("[data-pair-slot]")];

  const setLocalMessage = (text, state = "") => {
    messageNode.textContent = text;
    messageNode.className = `challenge-message n4-b2-d5-message ${state}`.trim();
  };

  const refreshSelection = () => {
    optionNodes.forEach((option) => {
      option.classList.toggle("is-selected", option.dataset.pairSolution === selectedSolution);
      option.classList.toggle("is-placed", [...matches.values()].includes(option.dataset.pairSolution));
      option.disabled = [...matches.values()].includes(option.dataset.pairSolution);
    });
  };

  const tryMatch = (situationId, solutionId) => {
    if (solved || matches.has(situationId) || !solutionId) return;
    const situation = situations.find((item) => item.id === situationId);
    const slot = challengeContent.querySelector(`[data-pair-slot="${situationId}"]`);
    if (!situation || !slot) return;

    slot.classList.remove("is-wrong");
    if (situation.answer !== solutionId) {
      slot.classList.add("is-wrong");
      setLocalMessage("Esa pareja no va junta. Mirá bien la situación y probá otra vez.", "is-error is-soft-error");
      window.setTimeout(() => slot.classList.remove("is-wrong"), 650);
      return;
    }

    const solution = solutionById[solutionId];
    matches.set(situationId, solutionId);
    selectedSolution = null;
    slot.classList.add("is-correct");
    slot.innerHTML = image(solution);
    slot.setAttribute("aria-label", `${situation.label} se une con ${solution.label}`);
    slot.closest("[data-pair]")?.classList.add("is-complete");
    refreshSelection();

    if (matches.size === situations.length) {
      solved = true;
      setLocalMessage("¡Excelente! Uniste cada situación con la solución correcta.", "is-success");
      completeChallenge(id);
      return;
    }
    setLocalMessage(`¡Muy bien! Ya completaste ${matches.size} de ${situations.length} parejas.`, "is-good");
  };

  optionNodes.forEach((option) => {
    option.addEventListener("click", () => {
      selectedSolution = option.dataset.pairSolution;
      refreshSelection();
      setLocalMessage(`Ahora tocá el casillero que corresponde a ${solutionById[selectedSolution].label}.`, "is-good");
    });
    option.addEventListener("dragstart", (event) => {
      selectedSolution = option.dataset.pairSolution;
      option.classList.add("is-dragging");
      event.dataTransfer?.setData("text/plain", selectedSolution);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      refreshSelection();
    });
    option.addEventListener("dragend", () => option.classList.remove("is-dragging"));
  });

  slotNodes.forEach((slot) => {
    slot.addEventListener("click", () => tryMatch(slot.dataset.pairSlot, selectedSolution));
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("is-drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drag-over"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("is-drag-over");
      const solutionId = event.dataTransfer?.getData("text/plain") || selectedSolution;
      tryMatch(slot.dataset.pairSlot, solutionId);
    });
  });
}

function renderN4SchoolPathChallenge(id) {
  const rows = 6;
  const columns = 6;
  const start = { row: 4, col: 0, direction: 1 };
  const goal = { row: 1, col: 4 };
  const obstacles = [
    { row: 0, col: 3 },
    { row: 2, col: 1 },
    { row: 3, col: 3 },
    { row: 4, col: 5 },
    { row: 5, col: 2 },
  ];
  const obstacleKeys = new Set(obstacles.map(({ row, col }) => `${row}-${col}`));
  const commandLabels = { forward: "Avanzar", left: "Girar a la izquierda", right: "Girar a la derecha" };
  const directions = [
    { row: -1, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
  ];
  const commands = [];
  let running = false;
  let solved = false;

  const asset = (fileName) => n4Block2ChallengeAsset(6, fileName);
  const commandIcon = (command) => `<span class="n4-b2-d6-command-icon is-${command}" aria-hidden="true"></span>`;
  const boardItem = (className, fileName, label, row, col) => `
    <span class="n4-b2-d6-board-item ${className}" style="--row:${row};--col:${col}" aria-label="${label}">
      <img src="${asset(fileName)}" alt="" aria-hidden="true" />
    </span>
  `;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d6-card">
      ${renderChallengeHeader(
        "BLOQUE 2 · DESAFÍO 6",
        "¡LLEGAMOS A LA ESCUELA!",
        getChallengeInstruction(id, "Pero el patio está lleno de mochilas tiradas. Arma el camino con las flechas para que Nano llegue a su aula sin chocar."),
      )}
      <section class="n4-b2-d6-layout" aria-label="Programar el camino de Nano hasta la escuela">
        <div class="n4-b2-d6-board" aria-label="Patio de seis por seis casilleros">
          <img class="n4-b2-d6-grid" src="${asset("CUADRICULA.png")}" alt="" aria-hidden="true" />
          <div class="n4-b2-d6-grid-items">
            ${boardItem("is-school", "Escuela.png", "Escuela", goal.row, goal.col)}
            ${obstacles.map(({ row, col }) => boardItem("is-backpack", "Mochila.png", "Mochila", row, col)).join("")}
            ${boardItem("is-nano", "Nano derecha.png", "Nano", start.row, start.col)}
          </div>
        </div>
        <div class="n4-b2-d6-program">
          <div class="n4-b2-d6-algorithm">
            <img src="${asset("ESPACIO DE TU ALGORITMO.png")}" alt="" aria-hidden="true" />
            <div class="n4-b2-d6-sequence" data-school-sequence aria-label="Tu algoritmo"></div>
            <button class="n4-b2-d6-run" type="button" data-school-run aria-label="Ejecutar algoritmo">
              <img src="${asset("Vamos.png")}" alt="" aria-hidden="true" />
              <span>¡Vamos!</span>
            </button>
          </div>
          <div class="n4-b2-d6-bank">
            <img src="${asset("ESPACIO DE TARJETAS DE PROGRAMACIÓN.png")}" alt="" aria-hidden="true" />
            <div class="n4-b2-d6-actions" aria-label="Tarjetas de programación">
              ${["left", "right", "forward"].map((command) => `
                <button type="button" data-school-command="${command}" aria-label="${commandLabels[command]}">
                  ${commandIcon(command)}
                  <span>${commandLabels[command]}</span>
                </button>
              `).join("")}
              <button class="n4-b2-d6-clear" type="button" data-school-clear aria-label="Borrar todo el algoritmo">Borrar</button>
            </div>
          </div>
        </div>
      </section>
      <p class="challenge-message n4-b2-d6-message" data-message>Elegí las flechas en orden y tocá la bandera para probar tu algoritmo.</p>
    </article>
  `;

  const nano = challengeContent.querySelector(".n4-b2-d6-board-item.is-nano");
  const sequenceNode = challengeContent.querySelector("[data-school-sequence]");
  const runButton = challengeContent.querySelector("[data-school-run]");
  const commandButtons = [...challengeContent.querySelectorAll("[data-school-command]")];
  const clearButton = challengeContent.querySelector("[data-school-clear]");

  function setNano(position) {
    nano.style.setProperty("--row", position.row);
    nano.style.setProperty("--col", position.col);
    nano.style.setProperty("--nano-turn", `${(position.direction - 1) * 90}deg`);
  }

  function renderSequence() {
    sequenceNode.innerHTML = Array.from({ length: 12 }, (_, index) => {
      const command = commands[index];
      return `<button class="n4-b2-d6-slot${command ? " is-filled" : ""}" type="button" data-school-slot="${index}" ${command ? `aria-label="Paso ${index + 1}: ${commandLabels[command]}. Tocar para borrar"` : `aria-label="Paso ${index + 1}, vacío"`}>
        ${command ? commandIcon(command) : "<span>?</span>"}
      </button>`;
    }).join("");
    sequenceNode.querySelectorAll("[data-school-slot]").forEach((slot) => {
      slot.addEventListener("click", () => {
        if (running || solved) return;
        const index = Number(slot.dataset.schoolSlot);
        if (index >= commands.length) return;
        commands.splice(index, 1);
        renderSequence();
        setNano(start);
        setMessage("Quitaste una tarjeta. Podés seguir armando el camino.", "is-good");
      });
    });
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function runAlgorithm() {
    if (running || solved) return;
    if (!commands.length) {
      setMessage("Primero agregá algunas flechas al algoritmo.", "is-error is-soft-error");
      return;
    }
    running = true;
    runButton.disabled = true;
    commandButtons.forEach((button) => { button.disabled = true; });
    clearButton.disabled = true;
    let position = { ...start };
    setNano(position);
    await wait(250);

    let failure = "";
    for (const command of commands) {
      if (command === "left") position.direction = (position.direction + 3) % 4;
      if (command === "right") position.direction = (position.direction + 1) % 4;
      if (command === "forward") {
        position.row += directions[position.direction].row;
        position.col += directions[position.direction].col;
      }
      setNano(position);
      await wait(420);
      if (position.row < 0 || position.row >= rows || position.col < 0 || position.col >= columns) {
        failure = "Nano salió del patio. Revisá el giro o la cantidad de avances.";
        break;
      }
      if (obstacleKeys.has(`${position.row}-${position.col}`)) {
        failure = "¡Cuidado! Nano chocó con una mochila. Cambiá el camino y probá otra vez.";
        nano.classList.add("is-colliding");
        await wait(450);
        nano.classList.remove("is-colliding");
        break;
      }
    }

    if (!failure && position.row === goal.row && position.col === goal.col) {
      solved = true;
      nano.classList.add("is-at-school");
      setMessage("¡Excelente! Nano llegó a la escuela sin chocar.", "is-success");
      completeChallenge(id);
      return;
    }
    if (!failure) failure = "Nano todavía no llegó a la escuela. Agregá o cambiá algunas flechas.";
    setMessage(failure, "is-error is-soft-error");
    running = false;
    runButton.disabled = false;
    commandButtons.forEach((button) => { button.disabled = false; });
    clearButton.disabled = false;
  }

  commandButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (running || solved) return;
      if (commands.length >= 12) {
        setMessage("El algoritmo ya tiene doce pasos. Probalo o borrá alguna tarjeta.", "is-error is-soft-error");
        return;
      }
      commands.push(button.dataset.schoolCommand);
      renderSequence();
      setNano(start);
      setMessage(`Agregaste ${commandLabels[button.dataset.schoolCommand].toLowerCase()}.`, "is-good");
    });
  });
  clearButton.addEventListener("click", () => {
    if (running || solved) return;
    commands.length = 0;
    renderSequence();
    setNano(start);
    setMessage("Algoritmo borrado. Armá un camino nuevo.", "is-good");
  });
  runButton.addEventListener("click", runAlgorithm);
  renderSequence();
  setNano(start);
}

function renderN4MissingSchoolStepsChallenge(id) {
  const start = { row: 3, col: 4, direction: 3 };
  const goal = { row: 1, col: 1 };
  const directions = [
    { row: -1, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
  ];
  const commandLabels = { forward: "Avanzar", left: "Girar a la izquierda", right: "Girar a la derecha" };
  const missingIndexes = [2, 3, 5];
  const expected = ["forward", "forward", "forward", "right", "forward", "forward"];
  const sequence = ["forward", "forward", null, null, "forward", null];
  let running = false;
  let solved = false;

  const asset = (fileName) => n4Block2ChallengeAsset(7, fileName);
  const commandIcon = (command) => {
    const fileName = command === "forward" ? "AVANZAR.png" : "tarjetas accion.png";
    return `<span class="n4-b2-d6-command-icon is-${command}" style="background-image:url('${asset(fileName)}')" aria-hidden="true"></span>`;
  };
  const boardItem = (className, fileName, label, row, col) => `
    <span class="n4-b2-d6-board-item ${className}" style="--row:${row};--col:${col}" aria-label="${label}">
      <img src="${asset(fileName)}" alt="" aria-hidden="true" />
    </span>
  `;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d6-card n4-b2-d7-card">
      ${renderChallengeHeader(
        "BLOQUE 2 · DESAFÍO 7",
        "¡UPS! FALTAN PASOS",
        getChallengeInstruction(id, "Observa el camino y selecciona en orden las fichas que faltan para que Nano llegue al objetivo."),
      )}
      <section class="n4-b2-d6-layout" aria-label="Completar el algoritmo para llegar a la escuela">
        <div class="n4-b2-d6-board" aria-label="Patio de seis por seis casilleros">
          <img class="n4-b2-d6-grid" src="${asset("CUADRICULA.png")}" alt="" aria-hidden="true" />
          <div class="n4-b2-d6-grid-items">
            ${boardItem("is-school", "Escuela.png", "Escuela", goal.row, goal.col)}
            ${boardItem("is-nano", "Nano derecha.png", "Nano", start.row, start.col)}
          </div>
        </div>
        <div class="n4-b2-d6-program">
          <div class="n4-b2-d6-algorithm n4-b2-d7-algorithm">
            <img src="${asset("ESPACIO DE TU ALGORITMO.png")}" alt="" aria-hidden="true" />
            <img class="n4-b2-d7-entry" src="${asset("Entrada.png")}" alt="Inicio" />
            <div class="n4-b2-d6-sequence n4-b2-d7-sequence" data-missing-sequence aria-label="Algoritmo incompleto"></div>
            <button class="n4-b2-d6-run n4-b2-d7-run" type="button" data-missing-run aria-label="Ejecutar algoritmo">
              <img src="${asset("Vamos.png")}" alt="" aria-hidden="true" />
              <span>¡Vamos!</span>
            </button>
          </div>
          <div class="n4-b2-d6-bank">
            <img src="${asset("ESPACIO DE TARJETAS DE PROGRAMACIÓN.png")}" alt="" aria-hidden="true" />
            <div class="n4-b2-d6-actions n4-b2-d7-actions" aria-label="Tarjetas de programación">
              ${["left", "right", "forward"].map((command) => `
                <button type="button" data-missing-command="${command}" aria-label="${commandLabels[command]}">
                  ${commandIcon(command)}
                  <span>${commandLabels[command]}</span>
                </button>
              `).join("")}
              <button class="n4-b2-d6-clear" type="button" data-missing-clear aria-label="Borrar las respuestas">Borrar</button>
            </div>
          </div>
        </div>
      </section>
      <p class="challenge-message n4-b2-d6-message" data-message>Completá los tres espacios vacíos en orden y tocá la bandera.</p>
    </article>
  `;

  const nano = challengeContent.querySelector(".n4-b2-d6-board-item.is-nano");
  const sequenceNode = challengeContent.querySelector("[data-missing-sequence]");
  const runButton = challengeContent.querySelector("[data-missing-run]");
  const commandButtons = [...challengeContent.querySelectorAll("[data-missing-command]")];
  const clearButton = challengeContent.querySelector("[data-missing-clear]");

  function setNano(position) {
    nano.style.setProperty("--row", position.row);
    nano.style.setProperty("--col", position.col);
    nano.style.setProperty("--nano-turn", `${(position.direction - 3) * 90}deg`);
  }

  function nextEmptyIndex() {
    return missingIndexes.find((index) => !sequence[index]);
  }

  function renderSequence() {
    sequenceNode.innerHTML = sequence.map((command, index) => {
      const isMissing = missingIndexes.includes(index);
      return `<button class="n4-b2-d6-slot${command ? " is-filled" : ""}${isMissing ? " is-answer" : " is-fixed"}" type="button" data-missing-slot="${index}" ${!isMissing ? "disabled" : ""} aria-label="Paso ${index + 1}: ${command ? commandLabels[command] : "vacío"}${isMissing && command ? ". Tocar para borrar" : ""}">
        ${command ? commandIcon(command) : "<span>?</span>"}
      </button>`;
    }).join("");
    sequenceNode.querySelectorAll(".is-answer.is-filled").forEach((slot) => {
      slot.addEventListener("click", () => {
        if (running || solved) return;
        sequence[Number(slot.dataset.missingSlot)] = null;
        renderSequence();
        setNano(start);
        setMessage("Quitaste una ficha. Elegí nuevamente los pasos que faltan.", "is-good");
      });
    });
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function runAlgorithm() {
    if (running || solved) return;
    if (sequence.some((command) => !command)) {
      setMessage("Todavía hay espacios vacíos en el algoritmo.", "is-error is-soft-error");
      return;
    }
    running = true;
    runButton.disabled = true;
    commandButtons.forEach((button) => { button.disabled = true; });
    clearButton.disabled = true;
    let position = { ...start };
    setNano(position);
    await wait(250);

    let failed = false;
    for (const command of sequence) {
      if (command === "left") position.direction = (position.direction + 3) % 4;
      if (command === "right") position.direction = (position.direction + 1) % 4;
      if (command === "forward") {
        position.row += directions[position.direction].row;
        position.col += directions[position.direction].col;
      }
      setNano(position);
      await wait(420);
      if (position.row < 0 || position.row >= 6 || position.col < 0 || position.col >= 6) {
        failed = true;
        break;
      }
    }

    const exactAnswer = sequence.every((command, index) => command === expected[index]);
    if (!failed && exactAnswer && position.row === goal.row && position.col === goal.col) {
      solved = true;
      nano.classList.add("is-at-school");
      setMessage("¡Muy bien! Completaste los pasos y Nano llegó a la puerta.", "is-success");
      completeChallenge(id);
      return;
    }

    setMessage(failed
      ? "Nano salió del patio. Revisá las fichas que agregaste."
      : "Nano todavía no llega a la puerta. Revisá el orden de las tres fichas.", "is-error is-soft-error");
    running = false;
    runButton.disabled = false;
    commandButtons.forEach((button) => { button.disabled = false; });
    clearButton.disabled = false;
  }

  commandButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (running || solved) return;
      const emptyIndex = nextEmptyIndex();
      if (emptyIndex === undefined) {
        setMessage("Ya completaste los tres espacios. Tocá la bandera para probar.", "is-good");
        return;
      }
      sequence[emptyIndex] = button.dataset.missingCommand;
      renderSequence();
      const remaining = missingIndexes.filter((index) => !sequence[index]).length;
      setMessage(remaining ? `Ficha ubicada. Faltan ${remaining}.` : "Algoritmo completo. ¡Ahora tocá la bandera!", "is-good");
    });
  });
  clearButton.addEventListener("click", () => {
    if (running || solved) return;
    missingIndexes.forEach((index) => { sequence[index] = null; });
    renderSequence();
    setNano(start);
    setMessage("Respuestas borradas. Completá nuevamente los tres espacios.", "is-good");
  });
  runButton.addEventListener("click", runAlgorithm);
  renderSequence();
  setNano(start);
}

function renderN4LockerDebugChallenge(id) {
  const start = { row: 2, col: 0 };
  const locker = { row: 2, col: 3 };
  const asset = (fileName) => n4Block2ChallengeAsset(8, fileName);
  let fixed = false;

  const forwardIcon = () => `<span class="n4-b2-d6-command-icon is-forward" style="background-image:url('${asset("AVANZAR.png")}')" aria-hidden="true"></span>`;
  const boardItem = (className, fileName, label, row, col) => `
    <span class="n4-b2-d6-board-item ${className}" style="--row:${row};--col:${col}" aria-label="${label}">
      <img src="${asset(fileName)}" alt="" aria-hidden="true" />
    </span>
  `;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d6-card n4-b2-d8-card">
      <div class="n4-b2-d8-heading">
        <img class="n4-b2-d8-alert" src="${asset("alerta roja.png")}" alt="Alerta roja" />
        ${renderChallengeHeader(
          "BLOQUE 2 · DESAFÍO 8",
          "¡CUIDADO!",
          getChallengeInstruction(id, "Hay una ficha intrusa que hará que Nano choque contra el casillero. Encuentra la ficha equivocada y ¡tócala para sacarla!"),
        )}
      </div>
      <section class="n4-b2-d6-layout" aria-label="Encontrar la ficha que provoca el choque">
        <div class="n4-b2-d6-board" aria-label="Pasillo de seis por seis casilleros">
          <img class="n4-b2-d6-grid" src="${asset("CUADRICULA.png")}" alt="" aria-hidden="true" />
          <div class="n4-b2-d6-grid-items">
            ${boardItem("is-locker", "CASILLERO.png", "Casillero", locker.row, locker.col)}
            ${boardItem("is-nano", "Nano derecha.png", "Nano", start.row, start.col)}
          </div>
        </div>
        <div class="n4-b2-d6-program">
          <div class="n4-b2-d6-algorithm n4-b2-d8-algorithm">
            <img src="${asset("ESPACIO DE TU ALGORITMO.png")}" alt="" aria-hidden="true" />
            <img class="n4-b2-d8-entry" src="${asset("Entrada.png")}" alt="Inicio" />
            <div class="n4-b2-d8-sequence" aria-label="Algoritmo con una ficha intrusa">
              ${[0, 1, 2].map((index) => `
                <button class="n4-b2-d6-slot is-filled n4-b2-d8-token${index === 2 ? " is-intruder" : ""}" type="button" data-locker-token="${index}" aria-label="Paso ${index + 1}: avanzar">
                  ${forwardIcon()}
                </button>
              `).join("")}
            </div>
            <span class="n4-b2-d8-go" aria-hidden="true"><img src="${asset("Vamos.png")}" alt="" /></span>
          </div>
          <div class="n4-b2-d6-bank n4-b2-d8-bank">
            <img src="${asset("ESPACIO DE TARJETAS DE PROGRAMACIÓN.png")}" alt="" aria-hidden="true" />
            <div class="n4-b2-d8-bank-cards" aria-hidden="true">
              <span class="n4-b2-d8-turn-card">↶</span>
              <span class="n4-b2-d8-turn-card">↷</span>
              <span class="n4-b2-d8-forward-card">${forwardIcon()}</span>
            </div>
          </div>
        </div>
      </section>
      <p class="challenge-message n4-b2-d6-message" data-message>Tocá la ficha que hará que Nano choque contra el casillero.</p>
    </article>
  `;

  const nano = challengeContent.querySelector(".n4-b2-d6-board-item.is-nano");
  const tokens = [...challengeContent.querySelectorAll("[data-locker-token]")];

  function setNanoColumn(column) {
    nano.style.setProperty("--row", start.row);
    nano.style.setProperty("--col", column);
    nano.style.setProperty("--nano-turn", "0deg");
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function removeIntruder(token) {
    fixed = true;
    tokens.forEach((item) => { item.disabled = true; });
    token.classList.add("is-removed");
    token.setAttribute("aria-label", "Ficha intrusa eliminada");
    setMessage("¡Encontraste la ficha intrusa! Nano probará el programa corregido.", "is-good");
    await wait(500);
    setNanoColumn(1);
    await wait(430);
    setNanoColumn(2);
    await wait(500);
    nano.classList.add("is-at-locker");
    setMessage("¡Excelente! Quitaste el avance sobrante y Nano se detuvo antes del casillero.", "is-success");
    completeChallenge(id);
  }

  tokens.forEach((token) => {
    token.addEventListener("click", () => {
      if (fixed) return;
      if (Number(token.dataset.lockerToken) !== 2) {
        token.classList.add("is-wrong-choice");
        setMessage("Esa ficha es necesaria. Nano todavía debe avanzar un poco más.", "is-error is-soft-error");
        window.setTimeout(() => token.classList.remove("is-wrong-choice"), 550);
        return;
      }
      removeIntruder(token);
    });
  });
  setNanoColumn(start.col);
}

function renderN4CountingCodeChallenge(id) {
  const groups = [
    { id: "lapiceras", label: "Lapiceras", count: 6, file: "Lapicera.png" },
    { id: "tablets", label: "Tablets", count: 4, file: "Tablet.png" },
    { id: "drones", label: "Drones", count: 2, file: "Dron.png" },
    { id: "mochilas", label: "Mochilas", count: 3, file: "Mochila.png" },
  ];
  const answers = Array(groups.length).fill(null);
  let activeGroup = 0;
  let solved = false;
  const asset = (fileName) => n4Block2ChallengeAsset(9, fileName);

  const groupItems = (group, groupIndex) => Array.from({ length: group.count }, (_, itemIndex) => `
    <img src="${asset(group.file)}" alt="" aria-hidden="true" style="--item:${itemIndex}" />
  `).join("");

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d9-card">
      ${renderChallengeHeader(
        "BLOQUE 2 · DESAFÍO 9",
        "LA CLAVE DEL CASILLERO",
        getChallengeInstruction(id, "Nano olvidó su clave. Observa los dibujos, cuenta cuántos hay en cada grupo y toca los números en orden para armar el código. ¡Tú puedes!"),
      )}
      <section class="n4-b2-d9-scene" aria-label="Contar objetos para descubrir la clave">
        <img class="n4-b2-d9-panels" src="${asset("PANTALLAS.png")}" alt="" aria-hidden="true" />
        <div class="n4-b2-d9-groups">
          ${groups.map((group, index) => `
            <div class="n4-b2-d9-group${index === 0 ? " is-active" : ""}" data-code-group="${index}" aria-label="Grupo ${index + 1}: ${group.label}">
              <span class="sr-only">Contá los elementos del grupo de ${group.label}.</span>
              <div class="n4-b2-d9-items is-count-${group.count}">${groupItems(group, index)}</div>
              <button class="n4-b2-d9-answer" type="button" data-code-answer="${index}" aria-label="Respuesta para ${group.label}, vacía"><span>?</span></button>
            </div>
          `).join("")}
        </div>
        <div class="n4-b2-d9-keypad" aria-label="Números del uno al diez">
          ${Array.from({ length: 10 }, (_, index) => index + 1).map((number) => `
            <button type="button" data-code-number="${number}" aria-label="Número ${number}">
              <img src="${asset(`P${number}.png`)}" alt="" aria-hidden="true" />
            </button>
          `).join("")}
        </div>
      </section>
      <p class="challenge-message n4-b2-d9-message" data-message>Contá las lapiceras y elegí el primer número de la clave.</p>
    </article>
  `;

  const groupNodes = [...challengeContent.querySelectorAll("[data-code-group]")];
  const answerNodes = [...challengeContent.querySelectorAll("[data-code-answer]")];
  const numberButtons = [...challengeContent.querySelectorAll("[data-code-number]")];

  function renderAnswers() {
    groupNodes.forEach((groupNode, index) => {
      const answerNode = answerNodes[index];
      const value = answers[index];
      groupNode.classList.toggle("is-active", index === activeGroup && !solved);
      groupNode.classList.toggle("is-complete", value !== null);
      answerNode.innerHTML = value === null
        ? "<span>?</span>"
        : `<img src="${asset(`P${value}.png`)}" alt="" aria-hidden="true" />`;
      answerNode.setAttribute("aria-label", value === null
        ? `Respuesta para ${groups[index].label}, vacía`
        : `Respuesta para ${groups[index].label}: ${value}. Tocar para cambiar`);
      answerNode.disabled = solved || value === null;
    });
  }

  function chooseNumber(number, button) {
    if (solved) return;
    const group = groups[activeGroup];
    if (!group) return;
    if (number !== group.count) {
      const wrongGroupIndex = activeGroup;
      button.classList.add("is-wrong");
      groupNodes[wrongGroupIndex].classList.add("is-wrong");
      setMessage(`Volvé a contar los elementos del grupo de ${group.label.toLowerCase()}.`, "is-error is-soft-error");
      window.setTimeout(() => {
        button.classList.remove("is-wrong");
        groupNodes[wrongGroupIndex]?.classList.remove("is-wrong");
      }, 550);
      return;
    }

    answers[activeGroup] = number;
    groupNodes[activeGroup].classList.add("is-correct");
    activeGroup += 1;
    renderAnswers();
    if (activeGroup === groups.length) {
      solved = true;
      groupNodes.forEach((node) => node.classList.remove("is-active"));
      numberButtons.forEach((item) => { item.disabled = true; });
      answerNodes.forEach((item) => { item.disabled = true; });
      setMessage("¡Código correcto: 6, 4, 2, 3! Abriste el casillero.", "is-success");
      completeChallenge(id);
      return;
    }
    setMessage(`¡Bien! Ahora contá ${groups[activeGroup].label.toLowerCase()}.`, "is-good");
  }

  numberButtons.forEach((button) => {
    button.addEventListener("click", () => chooseNumber(Number(button.dataset.codeNumber), button));
  });

  answerNodes.forEach((answerNode) => {
    answerNode.addEventListener("click", () => {
      if (solved) return;
      const index = Number(answerNode.dataset.codeAnswer);
      if (answers[index] === null) return;
      for (let resetIndex = index; resetIndex < answers.length; resetIndex += 1) answers[resetIndex] = null;
      activeGroup = index;
      groupNodes.forEach((node) => node.classList.remove("is-correct"));
      renderAnswers();
      setMessage(`Volvé a contar ${groups[index].label.toLowerCase()} y elegí el número.`, "is-good");
    });
  });

  renderAnswers();
}

function renderN4FourStepsChallenge(id) {
  const start = { row: 0, col: 2 };
  const goal = { row: 4, col: 2 };
  const commands = [];
  const labels = { left: "Girar a la izquierda", right: "Girar a la derecha", forward: "Avanzar" };
  let running = false;
  let solved = false;
  const asset = (fileName) => n4Block2ChallengeAsset(11, fileName);
  const commandFile = { left: "naranja 1.png", right: "Naranja 2.png", forward: "AVANZAR.png" };
  const commandIcon = (command) => `<img src="${asset(commandFile[command])}" alt="" aria-hidden="true" />`;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d6-card n4-b2-d11-card">
      ${renderChallengeHeader(
        "BLOQUE 2 · DESAFÍO 11",
        "EL PASILLO ES MUY LARGO",
        getChallengeInstruction(id, "Nano tiene que dar 4 pasos iguales y se está cansando, guíalo para llegar al final del camino."),
      )}
      <section class="n4-b2-d6-layout n4-b2-d11-layout" aria-label="Programar cuatro pasos para llegar al final del camino">
        <div class="n4-b2-d6-board" aria-label="Pasillo de seis por seis casilleros">
          <img class="n4-b2-d6-grid" src="${asset("CUADRICULA.png")}" alt="" aria-hidden="true" />
          <div class="n4-b2-d6-grid-items">
            <span class="n4-b2-d6-board-item is-goal" style="--row:${goal.row};--col:${goal.col}" aria-label="Meta">
              <img src="${asset("Vamos.png")}" alt="" aria-hidden="true" />
            </span>
            <span class="n4-b2-d6-board-item is-nano" style="--row:${start.row};--col:${start.col}" aria-label="Nano">
              <img src="${asset("Nano arriba.png")}" alt="" aria-hidden="true" />
              <span class="n4-b2-d11-sweat" aria-hidden="true">💧</span>
            </span>
          </div>
        </div>
        <div class="n4-b2-d11-program">
          <div class="n4-b2-d11-algorithm">
            <img class="n4-b2-d11-panel" src="${asset("TU ALGORITMO.png")}" alt="" aria-hidden="true" />
            <img class="n4-b2-d11-entry" src="${asset("Entrada.png")}" alt="Inicio" />
            <div class="n4-b2-d11-sequence" data-four-sequence aria-label="Tu algoritmo"></div>
            <button class="n4-b2-d11-run" type="button" data-four-run aria-label="Ejecutar algoritmo">
              <img src="${asset("Vamos.png")}" alt="" aria-hidden="true" />
            </button>
          </div>
          <div class="n4-b2-d11-bank">
            <img class="n4-b2-d11-panel" src="${asset("TARJETAS DE PROGRAMACION.png")}" alt="" aria-hidden="true" />
            <div class="n4-b2-d11-actions" aria-label="Tarjetas de programación">
              ${["right", "left", "forward"].map((command) => `
                <button type="button" data-four-command="${command}" aria-label="${labels[command]}">${commandIcon(command)}</button>
              `).join("")}
              <button class="n4-b2-d11-clear" type="button" data-four-clear>Borrar</button>
            </div>
          </div>
        </div>
      </section>
      <p class="challenge-message n4-b2-d6-message" data-message>Elegí cuatro tarjetas para llevar a Nano hasta la meta.</p>
    </article>
  `;

  const nano = challengeContent.querySelector(".n4-b2-d6-board-item.is-nano");
  const sequenceNode = challengeContent.querySelector("[data-four-sequence]");
  const runButton = challengeContent.querySelector("[data-four-run]");
  const commandButtons = [...challengeContent.querySelectorAll("[data-four-command]")];
  const clearButton = challengeContent.querySelector("[data-four-clear]");

  function setNanoRow(row, step = 0) {
    nano.style.setProperty("--row", row);
    nano.style.setProperty("--col", start.col);
    nano.classList.toggle("is-tired", step >= 3);
  }

  function renderSequence() {
    sequenceNode.innerHTML = Array.from({ length: 4 }, (_, index) => {
      const command = commands[index];
      return `<button class="n4-b2-d11-slot${command ? " is-filled" : ""}" type="button" data-four-slot="${index}" aria-label="Paso ${index + 1}: ${command ? labels[command] : "vacío"}">
        ${command ? commandIcon(command) : "<span>?</span>"}
      </button>`;
    }).join("");
    sequenceNode.querySelectorAll("[data-four-slot]").forEach((slot) => {
      slot.addEventListener("click", () => {
        if (running || solved) return;
        const index = Number(slot.dataset.fourSlot);
        if (index >= commands.length) return;
        commands.splice(index, 1);
        renderSequence();
        setNanoRow(start.row);
        setMessage("Quitaste una tarjeta. Completá nuevamente los cuatro pasos.", "is-good");
      });
    });
  }

  function setControlsDisabled(disabled) {
    runButton.disabled = disabled;
    commandButtons.forEach((button) => { button.disabled = disabled; });
    clearButton.disabled = disabled;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function runAlgorithm() {
    if (running || solved) return;
    if (commands.length < 4) {
      setMessage(`Todavía faltan ${4 - commands.length} tarjetas.`, "is-error is-soft-error");
      return;
    }
    const wrongIndexes = commands.map((command, index) => command === "forward" ? -1 : index).filter((index) => index !== -1);
    if (wrongIndexes.length) {
      wrongIndexes.forEach((index) => sequenceNode.querySelector(`[data-four-slot="${index}"]`)?.classList.add("is-wrong"));
      setMessage("El camino es recto: revisá las tarjetas de giro.", "is-error is-soft-error");
      return;
    }

    running = true;
    setControlsDisabled(true);
    setNanoRow(start.row);
    await wait(250);
    for (let step = 1; step <= 4; step += 1) {
      setNanoRow(start.row + step, step);
      setMessage(step < 4 ? `Nano avanzó ${step} de 4 pasos${step >= 3 ? "… ¡ya falta poco!" : "."}` : "¡Nano llegó a la meta!", step < 4 ? "is-good" : "is-success");
      await wait(step >= 3 ? 620 : 430);
    }
    solved = true;
    nano.classList.add("is-at-goal");
    completeChallenge(id);
  }

  commandButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (running || solved) return;
      if (commands.length >= 4) {
        setMessage("Ya colocaste cuatro tarjetas. Tocá la bandera para probar.", "is-good");
        return;
      }
      commands.push(button.dataset.fourCommand);
      renderSequence();
      setMessage(commands.length < 4 ? `Tarjeta ubicada. Faltan ${4 - commands.length}.` : "¡Cuatro pasos listos! Tocá la bandera.", "is-good");
    });
  });

  clearButton.addEventListener("click", () => {
    if (running || solved) return;
    commands.length = 0;
    renderSequence();
    setNanoRow(start.row);
    setMessage("Algoritmo borrado. Elegí cuatro tarjetas.", "is-good");
  });
  runButton.addEventListener("click", runAlgorithm);
  renderSequence();
  setNanoRow(start.row);
}

function renderN4RepeatFourChallenge(id) {
  const start = { row: 0, col: 2 };
  const goal = { row: 4, col: 2 };
  const choices = [];
  const labels = { forward: "Avanzar", left: "Girar a la izquierda", repeat3: "Repetir tres veces", repeat4: "Repetir cuatro veces" };
  const files = { forward: "AVANZAR.png", left: "naranja 1.png", repeat3: "Reptir x3.png", repeat4: "Reptir x4.png" };
  let running = false;
  let solved = false;
  const asset = (fileName) => n4Block2ChallengeAsset(12, fileName);
  const choiceIcon = (choice) => `<img src="${asset(files[choice])}" alt="" aria-hidden="true" />`;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d6-card n4-b2-d12-card">
      ${renderChallengeHeader(
        "BLOQUE 2 · DESAFÍO 12",
        "¡BUSQUEMOS LA MANERA MÁS RÁPIDA!",
        getChallengeInstruction(id, "Reemplaza las flechas usando la tarjeta de repetición."),
      )}
      <section class="n4-b2-d6-layout n4-b2-d12-layout" aria-label="Simplificar cuatro avances con una repetición">
        <div class="n4-b2-d6-board" aria-label="Pasillo de seis por seis casilleros">
          <img class="n4-b2-d6-grid" src="${asset("CUADRICULA.png")}" alt="" aria-hidden="true" />
          <div class="n4-b2-d6-grid-items">
            <span class="n4-b2-d6-board-item is-goal" style="--row:${goal.row};--col:${goal.col}" aria-label="Meta">
              <img src="${asset("Vamos.png")}" alt="" aria-hidden="true" />
            </span>
            <span class="n4-b2-d6-board-item is-nano" style="--row:${start.row};--col:${start.col}" aria-label="Nano">
              <img src="${asset("Nano arriba.png")}" alt="" aria-hidden="true" />
            </span>
          </div>
        </div>
        <div class="n4-b2-d12-program">
          <div class="n4-b2-d12-algorithm">
            <img class="n4-b2-d12-panel" src="${asset("tU ALGORITMO.png")}" alt="" aria-hidden="true" />
            <img class="n4-b2-d12-entry" src="${asset("Entrada.png")}" alt="Inicio" />
            <div class="n4-b2-d12-sequence" data-repeat-sequence aria-label="Algoritmo abreviado"></div>
            <button class="n4-b2-d12-run" type="button" data-repeat-run aria-label="Ejecutar algoritmo">
              <img src="${asset("Vamos.png")}" alt="" aria-hidden="true" />
            </button>
          </div>
          <div class="n4-b2-d12-bank">
            <img class="n4-b2-d12-panel" src="${asset("Tarjeta de programacion.png")}" alt="" aria-hidden="true" />
            <div class="n4-b2-d12-actions" aria-label="Tarjetas de programación">
              ${["forward", "left", "repeat3", "repeat4"].map((choice) => `
                <button type="button" data-repeat-choice="${choice}" aria-label="${labels[choice]}">${choiceIcon(choice)}</button>
              `).join("")}
              <button class="n4-b2-d12-clear" type="button" data-repeat-clear>Borrar</button>
            </div>
          </div>
        </div>
      </section>
      <p class="challenge-message n4-b2-d6-message" data-message>Elegí una acción y cuántas veces debe repetirse.</p>
    </article>
  `;

  const nano = challengeContent.querySelector(".n4-b2-d6-board-item.is-nano");
  const sequenceNode = challengeContent.querySelector("[data-repeat-sequence]");
  const runButton = challengeContent.querySelector("[data-repeat-run]");
  const choiceButtons = [...challengeContent.querySelectorAll("[data-repeat-choice]")];
  const clearButton = challengeContent.querySelector("[data-repeat-clear]");

  function setNanoRow(row) {
    nano.style.setProperty("--row", row);
    nano.style.setProperty("--col", start.col);
  }

  function renderSequence() {
    sequenceNode.innerHTML = Array.from({ length: 2 }, (_, index) => {
      const choice = choices[index];
      return `<button class="n4-b2-d12-slot${choice ? " is-filled" : ""}" type="button" data-repeat-slot="${index}" aria-label="Paso ${index + 1}: ${choice ? labels[choice] : "vacío"}">
        ${choice ? choiceIcon(choice) : "<span>?</span>"}
      </button>`;
    }).join("");
    sequenceNode.querySelectorAll("[data-repeat-slot]").forEach((slot) => {
      slot.addEventListener("click", () => {
        if (running || solved) return;
        const index = Number(slot.dataset.repeatSlot);
        if (index >= choices.length) return;
        choices.splice(index, 1);
        renderSequence();
        setNanoRow(start.row);
        setMessage("Quitaste una tarjeta. Armá nuevamente el código corto.", "is-good");
      });
    });
  }

  function setControlsDisabled(disabled) {
    runButton.disabled = disabled;
    choiceButtons.forEach((button) => { button.disabled = disabled; });
    clearButton.disabled = disabled;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function runAlgorithm() {
    if (running || solved) return;
    if (choices.length < 2) {
      setMessage(`Todavía falta${choices.length ? " una tarjeta" : "n dos tarjetas"}.`, "is-error is-soft-error");
      return;
    }
    const correct = choices[0] === "forward" && choices[1] === "repeat4";
    if (!correct) {
      const wrongIndex = choices[0] !== "forward" ? 0 : 1;
      sequenceNode.querySelector(`[data-repeat-slot="${wrongIndex}"]`)?.classList.add("is-wrong");
      setMessage(wrongIndex === 0
        ? "Primero elegí la acción que Nano debe repetir en el camino recto."
        : "Contá los cuatro casilleros y revisá el multiplicador.", "is-error is-soft-error");
      return;
    }

    running = true;
    setControlsDisabled(true);
    const repeatSlot = sequenceNode.querySelector('[data-repeat-slot="1"]');
    repeatSlot?.classList.add("is-running");
    setNanoRow(start.row);
    await wait(250);
    for (let step = 1; step <= 4; step += 1) {
      setNanoRow(start.row + step);
      setMessage(step < 4 ? `Repetición ${step} de 4.` : "¡Código corto y recorrido completo!", step < 4 ? "is-good" : "is-success");
      await wait(440);
    }
    repeatSlot?.classList.remove("is-running");
    solved = true;
    nano.classList.add("is-at-goal");
    completeChallenge(id);
  }

  choiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (running || solved) return;
      if (choices.length >= 2) {
        setMessage("Ya elegiste dos tarjetas. Tocá la bandera para probar.", "is-good");
        return;
      }
      choices.push(button.dataset.repeatChoice);
      renderSequence();
      setMessage(choices.length === 1 ? "Ahora elegí cuántas veces debe repetirse." : "Código listo. Tocá la bandera.", "is-good");
    });
  });

  clearButton.addEventListener("click", () => {
    if (running || solved) return;
    choices.length = 0;
    renderSequence();
    setNanoRow(start.row);
    setMessage("Código borrado. Elegí una acción y un multiplicador.", "is-good");
  });
  runButton.addEventListener("click", runAlgorithm);
  renderSequence();
  setNanoRow(start.row);
}

function renderN4BatteryLabyrinthChallenge(id) {
  const rows = 6;
  const columns = 6;
  const start = { row: 5, col: 0, direction: 0 };
  const goal = { row: 1, col: 5 };
  const batteries = [{ row: 4, col: 2 }, { row: 2, col: 3 }];
  const viruses = [
    { row: 0, col: 3 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 5 },
    { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 4 }, { row: 4, col: 4 },
    { row: 5, col: 2 }, { row: 5, col: 4 },
  ];
  const virusKeys = new Set(viruses.map(({ row, col }) => `${row}-${col}`));
  const directions = [
    { row: -1, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 0, col: -1 },
  ];
  const labels = { left: "Girar a la izquierda", right: "Girar a la derecha", forward: "Avanzar" };
  const files = { left: "naranja 1.png", right: "Naranja 2.png", forward: "AVANZAR.png" };
  const commands = [];
  let running = false;
  let solved = false;
  const asset = (fileName) => n4Block2ChallengeAsset(14, fileName);
  const commandIcon = (command) => `<img src="${asset(files[command])}" alt="" aria-hidden="true" />`;
  const boardItem = (className, fileName, label, row, col, extra = "") => `
    <span class="n4-b2-d6-board-item ${className}" style="--row:${row};--col:${col}" aria-label="${label}" ${extra}>
      <img src="${asset(fileName)}" alt="" aria-hidden="true" />
    </span>
  `;

  challengeContent.innerHTML = `
    <article class="challenge-card n4-b2-d6-card n4-b2-d14-card">
      <div class="n4-b2-d14-heading">
        <img class="n4-b2-d14-virus-title" src="${asset("Virus tecnologico.png")}" alt="Virus tecnológico" />
        ${renderChallengeHeader(
          "BLOQUE 2 · DESAFÍO 14",
          "¡MISIÓN LABERINTO!",
          getChallengeInstruction(id, "Crea tu propia secuencia: ayuda a Nano a pasar por las baterías para cargar energía y encuentra la salida sin tocar los obstáculos. ¡A jugar!"),
        )}
      </div>
      <section class="n4-b2-d6-layout n4-b2-d14-layout" aria-label="Programar la ruta por las baterías hasta la salida">
        <div class="n4-b2-d6-board" aria-label="Laberinto de seis por seis casilleros">
          <img class="n4-b2-d6-grid" src="${asset("CUADRICULA.png")}" alt="" aria-hidden="true" />
          <div class="n4-b2-d6-grid-items">
            ${boardItem("is-goal", "Vamos.png", "Salida", goal.row, goal.col)}
            ${batteries.map(({ row, col }, index) => boardItem("is-battery", "BATERIA.png", `Batería ${index + 1}`, row, col, `data-lab-battery="${row}-${col}"`)).join("")}
            ${viruses.map(({ row, col }) => boardItem("is-virus", "Virus tecnologico.png", "Virus tecnológico", row, col)).join("")}
            ${boardItem("is-nano", "Nano derecha.png", "Nano", start.row, start.col)}
          </div>
        </div>
        <div class="n4-b2-d14-program">
          <div class="n4-b2-d14-algorithm">
            <img class="n4-b2-d14-panel" src="${asset("CUADRO DE ALGORITMO.png")}" alt="" aria-hidden="true" />
            <img class="n4-b2-d14-entry" src="${asset("Entrada.png")}" alt="Inicio" />
            <div class="n4-b2-d14-sequence" data-lab-sequence aria-label="Tu algoritmo"></div>
            <button class="n4-b2-d14-run" type="button" data-lab-run aria-label="Ejecutar algoritmo">
              <img src="${asset("Vamos.png")}" alt="" aria-hidden="true" />
            </button>
          </div>
          <div class="n4-b2-d14-bank">
            <img class="n4-b2-d14-panel" src="${asset("CUADRO DE TARJETAS DE PROGRAMACION.png")}" alt="" aria-hidden="true" />
            <div class="n4-b2-d14-actions" aria-label="Tarjetas de programación">
              ${["left", "right", "forward"].map((command) => `
                <button type="button" data-lab-command="${command}" aria-label="${labels[command]}">${commandIcon(command)}</button>
              `).join("")}
              <button class="n4-b2-d14-clear" type="button" data-lab-clear>Borrar</button>
            </div>
          </div>
        </div>
      </section>
      <p class="challenge-message n4-b2-d6-message" data-message>Armá una ruta de hasta doce pasos que pase por las dos baterías.</p>
    </article>
  `;

  const nano = challengeContent.querySelector(".n4-b2-d6-board-item.is-nano");
  const batteryNodes = [...challengeContent.querySelectorAll("[data-lab-battery]")];
  const sequenceNode = challengeContent.querySelector("[data-lab-sequence]");
  const runButton = challengeContent.querySelector("[data-lab-run]");
  const commandButtons = [...challengeContent.querySelectorAll("[data-lab-command]")];
  const clearButton = challengeContent.querySelector("[data-lab-clear]");

  function setNano(position) {
    nano.style.setProperty("--row", position.row);
    nano.style.setProperty("--col", position.col);
    nano.style.setProperty("--nano-turn", `${(position.direction - 1) * 90}deg`);
  }

  function resetBoard() {
    setNano(start);
    nano.classList.remove("is-colliding", "is-at-goal");
    batteryNodes.forEach((node) => node.classList.remove("is-collected"));
  }

  function renderSequence() {
    sequenceNode.innerHTML = Array.from({ length: 12 }, (_, index) => {
      const command = commands[index];
      return `<button class="n4-b2-d14-slot${command ? " is-filled" : ""}" type="button" data-lab-slot="${index}" aria-label="Paso ${index + 1}: ${command ? labels[command] : "vacío"}">
        ${command ? commandIcon(command) : "<span>?</span>"}
      </button>`;
    }).join("");
    sequenceNode.querySelectorAll("[data-lab-slot]").forEach((slot) => {
      slot.addEventListener("click", () => {
        if (running || solved) return;
        const index = Number(slot.dataset.labSlot);
        if (index >= commands.length) return;
        commands.splice(index, 1);
        renderSequence();
        resetBoard();
        setMessage("Quitaste una tarjeta. Seguí armando la ruta.", "is-good");
      });
    });
  }

  function setControlsDisabled(disabled) {
    runButton.disabled = disabled;
    commandButtons.forEach((button) => { button.disabled = disabled; });
    clearButton.disabled = disabled;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function runAlgorithm() {
    if (running || solved) return;
    if (!commands.length) {
      setMessage("Primero agregá tarjetas al algoritmo.", "is-error is-soft-error");
      return;
    }
    running = true;
    setControlsDisabled(true);
    resetBoard();
    const collected = new Set();
    let position = { ...start };
    await wait(250);
    let failure = "";

    for (const command of commands) {
      if (command === "left") position.direction = (position.direction + 3) % 4;
      if (command === "right") position.direction = (position.direction + 1) % 4;
      if (command === "forward") {
        position.row += directions[position.direction].row;
        position.col += directions[position.direction].col;
      }
      setNano(position);
      await wait(390);
      if (position.row < 0 || position.row >= rows || position.col < 0 || position.col >= columns) {
        failure = "Nano salió del laberinto. Revisá la cantidad de avances.";
        break;
      }
      const key = `${position.row}-${position.col}`;
      if (virusKeys.has(key)) {
        failure = "¡Nano tocó un virus! Cambiá el recorrido para esquivarlo.";
        nano.classList.add("is-colliding");
        break;
      }
      const batteryNode = batteryNodes.find((node) => node.dataset.labBattery === key);
      if (batteryNode && !collected.has(key)) {
        collected.add(key);
        batteryNode.classList.add("is-collected");
        setMessage(`¡Batería cargada! Llevás ${collected.size} de ${batteries.length}.`, "is-good");
      }
    }

    if (!failure && position.row === goal.row && position.col === goal.col && collected.size === batteries.length) {
      solved = true;
      nano.classList.add("is-at-goal");
      setMessage("¡Misión cumplida! Nano cargó las dos baterías y llegó a la salida.", "is-success");
      completeChallenge(id);
      return;
    }
    if (!failure && position.row === goal.row && position.col === goal.col) {
      failure = "Llegaste a la salida, pero todavía falta recoger una batería.";
    }
    if (!failure) failure = "Nano todavía no llegó a la salida. Revisá o completá la secuencia.";
    setMessage(failure, "is-error is-soft-error");
    running = false;
    setControlsDisabled(false);
  }

  commandButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (running || solved) return;
      if (commands.length >= 12) {
        setMessage("Ya usaste los doce espacios. Probá el recorrido o quitá una ficha.", "is-error is-soft-error");
        return;
      }
      commands.push(button.dataset.labCommand);
      renderSequence();
      resetBoard();
      setMessage(`Paso ${commands.length} agregado.`, "is-good");
    });
  });
  clearButton.addEventListener("click", () => {
    if (running || solved) return;
    commands.length = 0;
    renderSequence();
    resetBoard();
    setMessage("Algoritmo borrado. Creá una ruta nueva.", "is-good");
  });
  runButton.addEventListener("click", runAlgorithm);
  renderSequence();
  resetBoard();
}

function renderN5DebugCrashChallenge(id = 9) {
  let fixed = false;
  const steps = [
    { id: "step-1", asset: "AVANZAR.png", label: "Avanzar" },
    { id: "step-2", asset: "IZQUIERDA.png", label: "Girar a la izquierda incorrecto", bug: true },
    { id: "step-3", asset: "AVANZAR.png", label: "Avanzar" },
    { id: "step-4", asset: "DERECHA.png", label: "Girar a la derecha" },
    { id: "step-5", asset: "AVANZAR.png", label: "Avanzar" },
    { id: "step-6", asset: "AVANZAR.png", label: "Avanzar" },
  ];
  challengeContent.innerHTML = `
    <article class="challenge-card n5-card n5-debug-card" ${n5CardStyle(9)}>
      ${renderN5Header(id, "¡Alerta de choque! Toca la tarjeta equivocada para salvar a Nano.")}
      <div class="n5-stage n5-debug-scene">
        <img class="n5-debug-alert" src="${n5Asset(9, "ALERTA DE CHOQUE.png")}" alt="Alerta de choque" />
        <div class="n5-debug-board" aria-hidden="true">
          <span class="n5-debug-board-label">Tin.bot</span>
          <img class="n5-debug-furniture is-tv" src="${n5Asset(9, "TV.png")}" alt="" />
          <img class="n5-debug-furniture is-librero" src="${n5Asset(9, "Librero.png")}" alt="" />
          <img class="n5-debug-furniture is-sofa" src="${n5Asset(9, "Sofa.png")}" alt="" />
          <img class="n5-debug-nano" src="${n5Asset(9, "Nano.png")}" alt="" />
        </div>
        <div class="n5-debug-code" aria-label="Secuencia de tarjetas">
          ${steps
            .map(
              (step, index) => `
                <button class="n5-debug-token${step.bug ? " is-bug" : ""}" type="button" data-debug-token data-step="${step.id}" data-step-number="${index + 1}" ${step.bug ? "data-bug" : ""} aria-label="${step.label}">
                  <span class="n5-debug-step">${index + 1}</span>
                  <img src="${n5Asset(9, step.asset)}" alt="" aria-hidden="true" />
                </button>
              `
            )
            .join("")}
        </div>
      </div>
      <p class="challenge-message" data-message>Hay una flecha de avance que haría chocar a Nano. Tocá la tarjeta equivocada.</p>
    </article>
  `;

  challengeContent.querySelectorAll("[data-debug-token]").forEach((token) => {
    token.addEventListener("click", (event) => {
      if (fixed) return;
      if (!event.currentTarget.matches("[data-bug]")) {
        event.currentTarget.classList.add("is-wrong-choice");
        setMessage("Esa tarjeta está bien. Busca la tarjeta equivocada de la secuencia.", "is-soft-error");
        return;
      }
      fixed = true;
      const bugToken = event.currentTarget;
      bugToken.classList.remove("is-bug");
      bugToken.classList.add("is-correct");
      bugToken.removeAttribute("data-bug");
      bugToken.setAttribute("aria-label", "Girar a la derecha corregido");
      const stepNumber = bugToken.dataset.stepNumber || "2";
      bugToken.innerHTML = `
        <span class="n5-debug-step">${stepNumber}</span>
        <img src="${n5Asset(9, "DERECHA.png")}" alt="" aria-hidden="true" />
      `;
      challengeContent.querySelector(".n5-debug-nano")?.classList.add("is-safe");
      setMessage("Bug corregido: Nano gira y esquiva el mueble.", "is-success");
      completeChallenge(id);
    });
  });

  challengeContent.querySelector("[data-bug]")?.addEventListener("keydown", (event) => {
    if (fixed) return;
    if (event.key === "Enter" || event.key === " ") {
      event.currentTarget.click();
    }
  });
}

function renderN5AutonomousMachineChallenge(id = 10) {
  let answered = false;
  const options = [
    {
      id: "manual",
      letter: "A",
      label: "Escoba",
      frame: "Opcion A.png",
      image: "Escoba.png",
      correct: false,
    },
    {
      id: "robot",
      letter: "B",
      label: "Aspiradora robot",
      frame: "Opcion B.png",
      image: "aspiradora robot .png",
      correct: true,
    },
  ];

  challengeContent.innerHTML = `
    <article class="challenge-card n5-card n5-autonomy-card" ${n5CardStyle(10)}>
      ${renderN5Header(id, "¿Cuál de estas máquinas trabaja completamente sola?")}
      <div class="n5-stage n5-autonomy-layout" aria-label="Opciones de maquinas">
        ${options.map((option) => `
          <button class="n5-autonomy-option n5-autonomy-option-${option.letter.toLowerCase()}" type="button" data-option="${option.id}" aria-label="Opcion ${option.letter}: ${option.label}">
            <img class="n5-autonomy-frame" src="${n5Asset(10, option.frame)}" alt="" aria-hidden="true" />
            <span class="n5-autonomy-scene">
              <img class="n5-autonomy-object ${option.correct ? "is-robot-vacuum" : "is-manual-broom"}" src="${n5Asset(10, option.image)}" alt="" aria-hidden="true" />
            </span>
            <img class="n5-autonomy-feedback is-correct-feedback" src="${n5Asset(10, "CORRECTO.png")}" alt="" aria-hidden="true" />
            <img class="n5-autonomy-feedback is-wrong-feedback" src="${n5Asset(10, "INCORRECTO.png")}" alt="" aria-hidden="true" />
          </button>
        `).join("")}
      </div>
      <p class="challenge-message" data-message>Tocá la tarjeta que trabaja sola.</p>
    </article>
  `;

  challengeContent.querySelectorAll(".n5-autonomy-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (answered) return;
      const option = options.find((item) => item.id === button.dataset.option);
      if (!option) return;

      challengeContent.querySelectorAll(".n5-autonomy-option").forEach((item) => {
        item.classList.remove("is-correct", "is-wrong");
      });

      if (!option.correct) {
        button.classList.add("is-wrong");
        setMessage("Esa necesita una persona que la use. Buscá la máquina que se mueve sola.", "is-error is-soft-error");
        return;
      }

      answered = true;
      button.classList.add("is-correct");
      setMessage("Correcto. La aspiradora robot trabaja sola.", "is-success");
      completeChallenge(id);
    });
  });
}

function renderN6SpaceHeader(id, fallbackInstruction, titleAsset = null) {
  const instruction = getChallengeInstruction(id, fallbackInstruction);
  const titleMarkup = titleAsset
    ? `<img class="n6-title-asset" src="${titleAsset}" alt="" aria-hidden="true" />`
    : "";

  return `
    <header class="challenge-header n6-space-header">
      ${titleMarkup}
      <div class="n6-title-copy">
        <p class="challenge-kicker">desafio ${getChallengeDisplayNumber(id)}</p>
        <div class="challenge-title-row">
          <h2>${challengeTitles[id]}</h2>
          <button class="listen-consigna" type="button" data-speak-consigna aria-label="ESCUCHAR CONSIGNA" title="ESCUCHAR CONSIGNA">
            <span aria-hidden="true" class="listen-consigna-icon">&#128266;</span>
            <span data-speech-label>ESCUCHAR CONSIGNA</span>
          </button>
        </div>
        <p data-consigna-text>${instruction}</p>
      </div>
    </header>
  `;
}

function renderN6InitialDirectionChallenge(id = 1) {
  const options = [
    { id: "avanzar", label: "Avanzar", card: "Tarjeta avanzar.png", icon: "AVANZAR.png" },
    { id: "izquierda", label: "Girar a la izquierda", card: "GIRAR IZQUIERDA.png", icon: "IZQUIERDA.png" },
    { id: "derecha", label: "Girar a la derecha", card: "GIRAR DERECHA.png", icon: "DERECHA.png" },
  ];
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n6-card n6-card-d1">
      <header class="n6-d1-header">
        <h2>¡MISIÓN ESPACIAL!</h2>
        <p data-consigna-text>${getChallengeInstruction(id, "Observa el camino hacia el mineral brillante y elige el primer paso para empezar el recorrido.")}</p>
        <button class="n6-d1-listen" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">&#128266;</button>
      </header>
      <section class="n6-d1-board" aria-label="Camino hacia el mineral">
        <img class="n6-d1-grid-frame" src="${n6Asset(1, "Cuadricula.png")}" alt="" aria-hidden="true" />
        <img class="n6-d1-nano" src="${n6Asset(1, "cara Derecha.png")}" alt="Nano astronauta" />
        <img class="n6-d1-mineral" src="${n6Asset(1, "Mineral.png")}" alt="Mineral brillante" />
      </section>
      <img class="n6-d1-panels-bg" src="${n6Asset(1, "tablero.png")}" alt="" aria-hidden="true" />
      <section class="n6-d1-algorithm" aria-label="Algoritmo">
        <h3>ALGORITMO</h3>
        <div class="n6-d1-slots">
          ${Array.from({ length: 5 }, (_, index) => `
            <div class="n6-d1-slot" data-algorithm-slot="${index}"><span>?</span></div>
          `).join("")}
        </div>
      </section>
      <section class="n6-d1-options-panel" aria-label="Tarjetas de programación">
        <div class="n6-d1-options">
          ${options.map((option) => `
            <button class="n6-direction-option" type="button" data-choice="${option.id}" aria-label="${option.label}">
              <span class="n6-option-card">
                <img class="n6-option-card-base" src="${n6Asset(1, option.card)}" alt="" aria-hidden="true" />
                <img class="n6-option-card-icon" src="${n6Asset(1, option.icon)}" alt="" aria-hidden="true" />
              </span>
            </button>
          `).join("")}
        </div>
      </section>
      <p class="challenge-message n6-d1-message" data-message></p>
    </article>
  `;

  challengeContent.querySelectorAll(".n6-direction-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (solved) return;
      challengeContent.querySelectorAll(".n6-direction-option").forEach((option) => {
        option.classList.remove("is-correct", "is-wrong");
      });

      if (button.dataset.choice === "avanzar") {
        solved = true;
        button.classList.add("is-correct");
        const firstSlot = challengeContent.querySelector('[data-algorithm-slot="0"]');
        firstSlot.innerHTML = `<img src="${n6Asset(1, "AVANZAR.png")}" alt="Avanzar" />`;
        firstSlot.classList.add("is-filled", "is-correct");
        challengeContent.querySelector(".n6-d1-nano")?.classList.add("is-advancing");
        challengeContent.querySelectorAll(".n6-direction-option").forEach((option) => {
          option.disabled = true;
        });
        setMessage("Correcto. El primer paso es avanzar hacia el mineral.", "is-success");
        completeChallenge(id);
        return;
      }

      button.classList.add("is-wrong");
      setMessage("Casi. Nano ya está mirando hacia el camino, así que el primer paso es avanzar.", "is-error is-soft-error");
    });
  });
}

function renderN6MeteorConditionChallenge(id = 2) {
  const cards = [
    { id: "avanzar", label: "Avanzar", base: "Tarjeta avanzar.png", icon: "AVANZAR.png" },
    { id: "girar", label: "Girar", base: "GIRAR.png", icon: "DERECHA.png" },
    { id: "detenerse", label: "Detenerse", base: "DETENERSE.png", icon: "Tarjeta de detenerse.png" },
    { id: "saltar", label: "Saltar", base: "SALTAR.png", icon: "tarjeta SALTAR.png" },
  ];
  let selectedCard = null;
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n6-card n6-card-d2">
      <header class="challenge-header n6-d2-header">
        <img class="n6-d2-alert" src="${n6Asset(2, "alerta roja.png")}" alt="¡Alerta roja!" />
        <div class="n6-d2-instruction">
          <h2>UNA LLUVIA DE METEORITOS PASA<br />FRENTE A NANO.</h2>
          <p data-consigna-text>${getChallengeInstruction(id, "Selecciona la acción exacta para que espere seguro en su nave.")}</p>
          <button class="n6-d2-listen" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">&#128266;</button>
        </div>
      </header>
      <img class="n6-d2-ship" src="${n6Asset(2, "NAVE CON ASTRONAUTA.png")}" alt="Nave con Nano astronauta" />
      <img class="n6-d2-panels-bg" src="${n6Asset(2, "Pantallas.png")}" alt="" aria-hidden="true" />
      <section class="n6-condition-panel" aria-label="Regla condicional">
        <img class="n6-meteor-card" src="${n6Asset(2, "tarjeta de Me teorito.png")}" alt="Lluvia de meteoritos" />
        <button class="n6-answer-slot n4-drop-target" type="button" data-expected="detenerse" aria-label="Espacio para la accion">
          <img src="${n6Asset(2, "Signo.png")}" alt="" aria-hidden="true" />
        </button>
      </section>
      <section class="n6-d2-bank" aria-label="Tarjetas de accion">
        ${cards.map((card) => `
          <button class="n6-action-card n4-drag-source" type="button" data-piece="${card.id}" aria-label="${card.label}">
            <span class="n6-d2-option-card">
              <img class="n6-d2-option-base" src="${n6Asset(2, card.base)}" alt="" aria-hidden="true" />
              <img class="n6-d2-option-icon" src="${n6Asset(2, card.icon)}" alt="" aria-hidden="true" />
            </span>
            <span>${card.label}</span>
          </button>
        `).join("")}
      </section>
      <p class="challenge-message" data-message></p>
    </article>
  `;

  const slot = challengeContent.querySelector(".n6-answer-slot");

  function clearSelection() {
    challengeContent.querySelectorAll(".n6-action-card").forEach((button) => {
      button.classList.remove("is-selected");
    });
  }

  function placeCard(target = slot) {
    if (solved || !selectedCard) {
      setMessage("Primero elegí una tarjeta de accion.", "is-error is-soft-error");
      return;
    }

    const card = cards.find((item) => item.id === selectedCard.dataset.piece);
    if (!card) return;

    if (card.id !== target.dataset.expected) {
      const wrongCard = selectedCard;
      wrongCard.classList.add("is-wrong");
      target.classList.add("is-wrong");
      window.setTimeout(() => {
        wrongCard.classList.remove("is-wrong");
        target.classList.remove("is-wrong");
      }, 520);
      setMessage("Hay peligro al frente. Nano tiene que quedarse quieto y esperar seguro.", "is-error is-soft-error");
      return;
    }

    solved = true;
    target.classList.add("is-filled", "is-correct");
    target.innerHTML = `
      <span class="n6-d2-placed-card">
        <img class="n6-d2-option-base" src="${n6Asset(2, card.base)}" alt="" aria-hidden="true" />
        <img class="n6-d2-option-icon" src="${n6Asset(2, card.icon)}" alt="" aria-hidden="true" />
        <span class="sr-only">${card.label}</span>
      </span>
    `;
    selectedCard.disabled = true;
    selectedCard.hidden = true;
    selectedCard = null;
    clearSelection();
    setMessage("Exacto. Si hay meteoritos, entonces Nano debe detenerse.", "is-success");
    completeChallenge(id);
  }

  challengeContent.querySelectorAll(".n6-action-card").forEach((button) => {
    button.addEventListener("click", () => {
      if (solved || button.disabled) return;
      selectedCard = button;
      clearSelection();
      button.classList.add("is-selected");
      setMessage(`Tarjeta ${button.textContent.trim().toLowerCase()} lista para colocar.`, "is-good");
    });
  });

  slot.addEventListener("click", () => placeCard(slot));
}

function renderN6StarRepetitionChallenge(id = 3) {
  const cards = [
    { id: "avanzar", label: "Avanzar", base: "Tarjeta avanzar.png", icon: "AVANZAR.png" },
    { id: "girar", label: "Girar", base: "GIRAR.png", icon: "IZQUIERDA.png" },
    { id: "repetir", label: "Repetición x4", base: "REPETICION X4.png", icon: "Reptir x4.png" },
    { id: "bateria", label: "Batería baja", base: "Bateria baja.png", icon: "TARJETA BATERIA BAJA.png" },
  ];
  let selectedCard = null;
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n6-card n6-card-d3">
      <header class="challenge-header n6-d3-header">
        <div class="n6-d3-instruction">
          <h2>¡SÚPER RECOLECCIÓN!</h2>
          <p data-consigna-text>${getChallengeInstruction(id, "Hay muchas estrellas flotando en fila. Elige el bloque que te ayuda a recogerlas todas juntas con un solo movimiento.")}</p>
          <button class="n6-d3-listen" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">&#128266;</button>
        </div>
      </header>

      <section class="n6-d3-board" aria-label="Nano y cuatro estrellas en fila">
        <img class="n6-d3-grid-frame" src="${n6Asset(3, "Cuadricula.png")}" alt="" aria-hidden="true" />
        <img class="n6-d3-nano" src="${n6Asset(3, "Abajo.png")}" alt="Nano mirando hacia las estrellas" />
        ${Array.from({ length: 4 }, (_, index) => `
          <img class="n6-d3-star n6-d3-star-${index + 1}" src="${n6Asset(3, "Estrella.png")}" alt="Estrella ${index + 1}" />
        `).join("")}
      </section>

      <img class="n6-d3-panels-bg" src="${n6Asset(3, "tablero.png")}" alt="" aria-hidden="true" />

      <section class="n6-d3-algorithm" aria-label="Algoritmo">
        <div class="n6-d3-slots">
          <button class="n6-d3-slot n4-drop-target" type="button" data-algorithm-slot="0" data-expected="repetir" aria-label="Primer espacio del algoritmo"><span>?</span></button>
          ${Array.from({ length: 4 }, (_, index) => `
            <div class="n6-d3-slot" data-algorithm-slot="${index + 1}"><span>?</span></div>
          `).join("")}
        </div>
      </section>

      <section class="n6-d3-bank" aria-label="Tarjetas de programación">
        ${cards.map((card) => `
          <button class="n6-d3-action-card n4-drag-source" type="button" data-piece="${card.id}" aria-label="${card.label}">
            <span class="n6-d3-option-card">
              <img class="n6-d3-option-base" src="${n6Asset(3, card.base)}" alt="" aria-hidden="true" />
              <img class="n6-d3-option-icon" src="${n6Asset(3, card.icon)}" alt="" aria-hidden="true" />
            </span>
            <span class="sr-only">${card.label}</span>
          </button>
        `).join("")}
      </section>

      <p class="challenge-message" data-message></p>
    </article>
  `;

  const slot = challengeContent.querySelector(".n6-d3-slot.n4-drop-target");

  function clearSelection() {
    challengeContent.querySelectorAll(".n6-d3-action-card").forEach((button) => {
      button.classList.remove("is-selected");
    });
  }

  function placeCard(target = slot) {
    if (solved || !selectedCard) {
      if (!solved) setMessage("Primero elegí una tarjeta de programación.", "is-error is-soft-error");
      return;
    }

    const card = cards.find((item) => item.id === selectedCard.dataset.piece);
    if (!card) return;

    if (card.id !== target.dataset.expected) {
      const wrongCard = selectedCard;
      wrongCard.classList.add("is-wrong");
      target.classList.add("is-wrong");
      window.setTimeout(() => {
        wrongCard.classList.remove("is-wrong");
        target.classList.remove("is-wrong");
      }, 520);
      setMessage("Esa tarjeta no repite la acción. Buscá el bloque que indica cuatro repeticiones.", "is-error is-soft-error");
      return;
    }

    solved = true;
    target.classList.add("is-filled", "is-correct");
    target.innerHTML = `
      <span class="n6-d3-placed-card">
        <img class="n6-d3-option-base" src="${n6Asset(3, card.base)}" alt="" aria-hidden="true" />
        <img class="n6-d3-option-icon" src="${n6Asset(3, card.icon)}" alt="" aria-hidden="true" />
        <span class="sr-only">${card.label}</span>
      </span>
    `;
    selectedCard.hidden = true;
    selectedCard = null;
    clearSelection();
    challengeContent.querySelectorAll(".n6-d3-action-card").forEach((button) => {
      button.disabled = true;
    });
    challengeContent.querySelector(".n6-card-d3")?.classList.add("is-collecting");
    setMessage("¡Muy bien! Repetición x4 permite recoger las cuatro estrellas.", "is-success");
    completeChallenge(id, 3600);
  }

  challengeContent.querySelectorAll(".n6-d3-action-card").forEach((button) => {
    button.addEventListener("click", () => {
      if (solved || button.disabled) return;
      selectedCard = button;
      clearSelection();
      button.classList.add("is-selected");
      setMessage(`Tarjeta ${button.getAttribute("aria-label").toLowerCase()} lista para colocar.`, "is-good");
    });
  });

  slot.addEventListener("click", () => placeCard(slot));
}

function renderN6AntennaRouteChallenge(id = 4) {
  const commands = [
    { id: "avanzar", label: "Avanzar", base: "Tarjeta avanzar.png", icon: "AVANZAR.png" },
    { id: "izquierda", label: "Girar a la izquierda", base: "GIRAR IZQUIERDA.png", icon: "IZQUIERDA.png" },
    { id: "derecha", label: "Girar a la derecha", base: "GIRAR DERECHA.png", icon: "DERECHA.png" },
  ];
  const expectedRoute = ["avanzar", "avanzar", "derecha", "avanzar", "izquierda", "avanzar", "avanzar", "izquierda", "avanzar", "avanzar"];
  const programmedRoute = [];
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n6-card n6-card-d4">
      <header class="challenge-header n6-d4-header">
        <div class="n6-d4-instruction">
          <h2>¡AYUDA A NANO A COMPLETAR LA ANTENA ESPACIAL!</h2>
          <p data-consigna-text>${getChallengeInstruction(id, "Encuentra las piezas que necesita para terminar de armarla.")}</p>
          <button class="n6-d4-listen" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">&#128266;</button>
        </div>
      </header>

      <section class="n6-d4-board" aria-label="Cuadrícula con Nano y las piezas de la antena">
        <img class="n6-d4-grid-frame" src="${n6Asset(4, "Cuadricula.png")}" alt="" aria-hidden="true" />
        <img class="n6-d4-nano" src="${n6Asset(4, "cara Derecha.png")}" alt="Nano" />
        <img class="n6-d4-piece n6-d4-wrench" src="${n6Asset(4, "llave.png")}" alt="Llave para la antena" />
        <img class="n6-d4-piece n6-d4-nut" src="${n6Asset(4, "tuerca.png")}" alt="Tuerca para la antena" />
      </section>

      <img class="n6-d4-panels-bg" src="${n6Asset(4, "tablero.png")}" alt="" aria-hidden="true" />

      <section class="n6-d4-algorithm" aria-label="Algoritmo de diez pasos">
        <div class="n6-d4-algorithm-heading">
          <h3>ALGORITMO</h3>
          <button class="n6-d4-clear" type="button" data-clear-route aria-label="Borrar algoritmo">Borrar</button>
        </div>
        <div class="n6-d4-slots">
          ${Array.from({ length: 10 }, (_, index) => `
            <button class="n6-d4-slot" type="button" data-route-slot="${index}" aria-label="Paso ${index + 1}, vacío"><span>?</span></button>
          `).join("")}
        </div>
      </section>

      <section class="n6-d4-bank" aria-label="Tarjetas de programación">
        ${commands.map((command) => `
          <button class="n6-d4-action-card" type="button" data-command="${command.id}" aria-label="${command.label}">
            <span class="n6-d4-option-card">
              <img class="n6-d4-option-base" src="${n6Asset(4, command.base)}" alt="" aria-hidden="true" />
              <img class="n6-d4-option-icon" src="${n6Asset(4, command.icon)}" alt="" aria-hidden="true" />
            </span>
            <span class="sr-only">${command.label}</span>
          </button>
        `).join("")}
      </section>

      <p class="challenge-message n6-d4-message" data-message></p>
    </article>
  `;

  const slots = [...challengeContent.querySelectorAll(".n6-d4-slot")];
  const actionButtons = [...challengeContent.querySelectorAll(".n6-d4-action-card")];
  const clearButton = challengeContent.querySelector("[data-clear-route]");

  function renderProgram() {
    slots.forEach((slot, index) => {
      const command = commands.find((item) => item.id === programmedRoute[index]);
      slot.classList.toggle("is-filled", Boolean(command));
      slot.classList.remove("is-wrong");
      if (!command) {
        slot.innerHTML = "<span>?</span>";
        slot.setAttribute("aria-label", `Paso ${index + 1}, vacío`);
        return;
      }
      slot.innerHTML = `<img src="${n6Asset(4, command.icon)}" alt="" aria-hidden="true" />`;
      slot.setAttribute("aria-label", `Paso ${index + 1}, ${command.label}. Tocar para borrar desde aquí.`);
    });
    clearButton.disabled = programmedRoute.length === 0 || solved;
  }

  function animateSuccessfulRoute() {
    const card = challengeContent.querySelector(".n6-card-d4");
    const nano = challengeContent.querySelector(".n6-d4-nano");
    const positions = [
      [18.9, 48.4], [31.5, 48.4], [44.3, 48.4], [44.3, 48.4], [44.3, 60.2],
      [44.3, 60.2], [57, 60.2], [69.7, 60.2], [69.7, 60.2], [69.7, 48.4], [69.7, 36.7],
    ];
    const collectedAt = new Map([[4, ".n6-d4-wrench"], [10, ".n6-d4-nut"]]);
    card?.classList.add("is-running");
    positions.slice(1).forEach(([left, top], index) => {
      window.setTimeout(() => {
        nano.style.left = `${left}%`;
        nano.style.top = `${top}%`;
        slots[index]?.classList.add("is-executed");
        const pieceSelector = collectedAt.get(index + 1);
        if (pieceSelector) challengeContent.querySelector(pieceSelector)?.classList.add("is-collected");
      }, (index + 1) * 390);
    });
  }

  function validateProgram() {
    if (programmedRoute.length < expectedRoute.length || solved) return;
    const firstError = programmedRoute.findIndex((command, index) => command !== expectedRoute[index]);
    if (firstError !== -1) {
      slots[firstError]?.classList.add("is-wrong");
      setMessage(`Revisá el paso ${firstError + 1}. Nano todavía no puede recoger las dos piezas.`, "is-error is-soft-error");
      window.setTimeout(() => slots[firstError]?.classList.remove("is-wrong"), 850);
      return;
    }

    solved = true;
    actionButtons.forEach((button) => { button.disabled = true; });
    slots.forEach((slot) => { slot.disabled = true; });
    clearButton.disabled = true;
    animateSuccessfulRoute();
    setMessage("¡Excelente! Nano encontró la llave y la tuerca para completar la antena.", "is-success");
    completeChallenge(id, 4700);
  }

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (solved) return;
      if (programmedRoute.length >= expectedRoute.length) programmedRoute.length = 0;
      programmedRoute.push(button.dataset.command);
      renderProgram();
      playSound("tap");
      if (programmedRoute.length === expectedRoute.length) validateProgram();
      else setMessage(`Paso ${programmedRoute.length} agregado. Faltan ${expectedRoute.length - programmedRoute.length}.`, "is-good");
    });
  });

  slots.forEach((slot, index) => {
    slot.addEventListener("click", () => {
      if (solved || index >= programmedRoute.length) return;
      programmedRoute.splice(index);
      renderProgram();
      setMessage("Podés continuar el algoritmo desde ese paso.", "is-good");
    });
  });

  clearButton.addEventListener("click", () => {
    if (solved) return;
    programmedRoute.length = 0;
    renderProgram();
    setMessage("Algoritmo borrado. Volvé a elegir los movimientos de Nano.", "is-good");
  });

  renderProgram();
}

function renderN6CraterDetourChallenge(id = 5) {
  const commands = [
    { id: "avanzar", label: "Avanzar", base: "Tarjeta avanzar.png", icon: "AVANZAR.png" },
    { id: "derecha", label: "Girar a la derecha", base: "GIRAR DERECHA.png", icon: "DERECHA.png" },
    { id: "izquierda", label: "Girar a la izquierda", base: "GIRAR IZQUIERDA.png", icon: "IZQUIERDA.png" },
  ];
  const safeRoute = ["avanzar", "avanzar", "avanzar", "avanzar", "derecha", "avanzar", "avanzar", "avanzar", "avanzar"];
  const programmedRoute = [];
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n6-card n6-card-d5">
      <header class="challenge-header n6-d4-header">
        <div class="n6-d4-instruction">
          <h2>¡UN CRÁTER GIGANTE BLOQUEA EL PASO!</h2>
          <p data-consigna-text>${getChallengeInstruction(id, "Observa el suelo lunar seguro y elige los movimientos para armar un desvío perfecto.")}</p>
          <button class="n6-d4-listen" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">&#128266;</button>
        </div>
      </header>

      <section class="n6-d4-board" aria-label="Cuadrícula lunar con un cráter que bloquea el camino">
        <img class="n6-d4-grid-frame" src="${n6Asset(5, "Cuadricula.png")}" alt="Cráter gigante en el centro de la cuadrícula" />
        <img class="n6-d4-nano n6-d5-nano" src="${n6Asset(5, "FRENTE.png")}" alt="Nano" />
        <img class="n6-d5-radar" src="${n6Asset(5, "RADAR.png")}" alt="Radar de destino" />
      </section>

      <img class="n6-d4-panels-bg" src="${n6Asset(5, "tablero.png")}" alt="" aria-hidden="true" />

      <section class="n6-d4-algorithm" aria-label="Algoritmo para rodear el cráter">
        <div class="n6-d4-algorithm-heading">
          <h3>ALGORITMO</h3>
          <button class="n6-d4-clear" type="button" data-clear-route aria-label="Borrar algoritmo">Borrar</button>
        </div>
        <div class="n6-d4-slots">
          ${Array.from({ length: 10 }, (_, index) => `
            <button class="n6-d4-slot" type="button" data-route-slot="${index}" aria-label="Paso ${index + 1}, vacío"><span>?</span></button>
          `).join("")}
        </div>
      </section>

      <section class="n6-d4-bank" aria-label="Tarjetas de movimiento reutilizables">
        ${commands.map((command) => `
          <button class="n6-d4-action-card" type="button" data-command="${command.id}" aria-label="${command.label}">
            <span class="n6-d4-option-card">
              <img class="n6-d4-option-base" src="${n6Asset(5, command.base)}" alt="" aria-hidden="true" />
              <img class="n6-d4-option-icon" src="${n6Asset(5, command.icon)}" alt="" aria-hidden="true" />
            </span>
            <span class="sr-only">${command.label}</span>
          </button>
        `).join("")}
      </section>

      <p class="challenge-message n6-d4-message" data-message></p>
    </article>
  `;

  const slots = [...challengeContent.querySelectorAll(".n6-d4-slot")];
  const actionButtons = [...challengeContent.querySelectorAll(".n6-d4-action-card")];
  const clearButton = challengeContent.querySelector("[data-clear-route]");

  function renderProgram() {
    slots.forEach((slot, index) => {
      const command = commands.find((item) => item.id === programmedRoute[index]);
      slot.classList.toggle("is-filled", Boolean(command));
      slot.classList.remove("is-wrong");
      if (!command) {
        slot.innerHTML = "<span>?</span>";
        slot.setAttribute("aria-label", `Paso ${index + 1}, vacío`);
        return;
      }
      slot.innerHTML = `<img src="${n6Asset(5, command.icon)}" alt="" aria-hidden="true" />`;
      slot.setAttribute("aria-label", `Paso ${index + 1}, ${command.label}. Tocar para borrar desde aquí.`);
    });
    clearButton.disabled = programmedRoute.length === 0 || solved;
  }

  function simulateRoute(route) {
    const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    let row = 4;
    let column = 0;
    let direction = 0;
    let collisionAt = -1;
    const positions = [{ row, column }];

    route.forEach((command, index) => {
      if (command === "derecha") direction = (direction + 1) % 4;
      if (command === "izquierda") direction = (direction + 3) % 4;
      if (command === "avanzar") {
        row += directions[direction][0];
        column += directions[direction][1];
      }
      const outside = row < 0 || row > 4 || column < 0 || column > 5;
      const crater = row >= 1 && row <= 3 && column >= 1 && column <= 4;
      if (collisionAt === -1 && (outside || crater)) collisionAt = index;
      positions.push({ row, column });
    });

    return { row, column, collisionAt, positions, reachedRadar: row === 0 && column === 4 && collisionAt === -1 };
  }

  function animateSafeRoute(positions) {
    const nano = challengeContent.querySelector(".n6-d5-nano");
    const radar = challengeContent.querySelector(".n6-d5-radar");
    const columnCenters = [20.75, 32.55, 44.34, 55.85, 67.43, 79.42];
    const rowCenters = [24.59, 35.41, 46.6, 57.82, 69.61];
    positions.slice(1).forEach(({ row, column }, index) => {
      window.setTimeout(() => {
        nano.style.left = `${columnCenters[column]}%`;
        nano.style.top = `${rowCenters[row]}%`;
        slots[index]?.classList.add("is-executed");
        if (index === positions.length - 2) radar?.classList.add("is-reached");
      }, (index + 1) * 390);
    });
  }

  function validateProgram() {
    const result = simulateRoute(programmedRoute);
    if (result.reachedRadar) {
      solved = true;
      actionButtons.forEach((button) => { button.disabled = true; });
      slots.forEach((slot) => { slot.disabled = true; });
      clearButton.disabled = true;
      animateSafeRoute(result.positions);
      setMessage("¡Desvío perfecto! Nano rodeó el cráter y llegó al radar.", "is-success");
      completeChallenge(id, 4400);
      return;
    }

    if (programmedRoute.length < 10) return;
    const firstError = result.collisionAt !== -1
      ? result.collisionAt
      : programmedRoute.findIndex((command, index) => command !== safeRoute[index]);
    const errorIndex = firstError === -1 ? programmedRoute.length - 1 : firstError;
    slots[errorIndex]?.classList.add("is-wrong");
    const feedback = result.collisionAt !== -1
      ? `En el paso ${errorIndex + 1}, Nano entra al cráter o sale de la cuadrícula.`
      : "Nano todavía no llegó al radar. Revisá el desvío desde el primer giro.";
    setMessage(feedback, "is-error is-soft-error");
    window.setTimeout(() => slots[errorIndex]?.classList.remove("is-wrong"), 900);
  }

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (solved) return;
      if (programmedRoute.length >= 10) programmedRoute.length = 0;
      programmedRoute.push(button.dataset.command);
      renderProgram();
      playSound("tap");
      validateProgram();
      if (!solved && programmedRoute.length < 10) {
        setMessage(`Paso ${programmedRoute.length} agregado. Podés usar hasta ${10 - programmedRoute.length} más.`, "is-good");
      }
    });
  });

  slots.forEach((slot, index) => {
    slot.addEventListener("click", () => {
      if (solved || index >= programmedRoute.length) return;
      programmedRoute.splice(index);
      renderProgram();
      setMessage("Ruta corregida. Continuá desde ese paso.", "is-good");
    });
  });

  clearButton.addEventListener("click", () => {
    if (solved) return;
    programmedRoute.length = 0;
    renderProgram();
    setMessage("Algoritmo borrado. Buscá el camino libre alrededor del cráter.", "is-good");
  });

  renderProgram();
}

function renderN6SatelliteDebugChallenge(id = 6) {
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n6-card n6-card-d6">
      <header class="challenge-header n6-d4-header">
        <div class="n6-d4-instruction n6-d6-instruction">
          <h2>NANO VA DIRECTO CONTRA UN SATÉLITE.</h2>
          <p data-consigna-text>${getChallengeInstruction(id, "Observa las opciones y elige la ficha incorrecta para ayudarlo a evitar el choque.")}</p>
          <button class="n6-d4-listen" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">&#128266;</button>
        </div>
      </header>

      <section class="n6-d4-board n6-d6-board" aria-label="Nano frente a un satélite">
        <img class="n6-d4-grid-frame" src="${n6Asset(6, "Cuadricula.png")}" alt="" aria-hidden="true" />
        <img class="n6-d4-nano n6-d6-nano" src="${n6Asset(6, "cara Derecha.png")}" alt="Nano" />
        <img class="n6-d6-satellite" src="${n6Asset(6, "RADAR.png")}" alt="Satélite que bloquea el camino" />
      </section>

      <section class="n6-d6-code-panel" aria-label="Secuencia que debe ser corregida">
        <img class="n6-d6-panel-frame" src="${n6Asset(6, "Pantalla.png")}" alt="" aria-hidden="true" />
        <div class="n6-d6-sequence">
          <img class="n6-d6-start" src="${n6Asset(6, "Entrada.png")}" alt="Inicio" />
          ${Array.from({ length: 3 }, (_, index) => `
            <button class="n6-d6-command" type="button" data-debug-step="${index}" aria-label="Paso ${index + 1}: Avanzar${index === 1 ? ". Tocar para revisar" : ""}">
              <img src="${n6Asset(6, "AVANZAR.png")}" alt="Avanzar" />
            </button>
          `).join("")}
          <img class="n6-d6-finish" src="${n6Asset(6, "Vamos.png")}" alt="Ejecutar" />
        </div>

        <div class="n6-d6-replace-menu" data-replace-menu hidden>
          <p>Reemplazar el paso 2 por:</p>
          <div>
            <button type="button" data-replacement="derecha"><span aria-hidden="true">↷</span> Girar a la derecha</button>
            <button type="button" data-replacement="izquierda"><span aria-hidden="true">↶</span> Girar a la izquierda</button>
            <button type="button" data-replacement="avanzar"><span aria-hidden="true">→</span> Avanzar</button>
          </div>
        </div>
      </section>

      <p class="challenge-message n6-d6-message" data-message></p>
    </article>
  `;

  const commandButtons = [...challengeContent.querySelectorAll(".n6-d6-command")];
  const incorrectCommand = commandButtons[1];
  const replaceMenu = challengeContent.querySelector("[data-replace-menu]");

  function closeMenu() {
    replaceMenu.hidden = true;
    incorrectCommand.classList.remove("is-selected");
  }

  commandButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (solved) return;
      if (index !== 1) {
        button.classList.add("is-wrong");
        setMessage("Esa ficha puede quedarse. Revisá cuál avance acerca demasiado a Nano al satélite.", "is-error is-soft-error");
        window.setTimeout(() => button.classList.remove("is-wrong"), 700);
        return;
      }

      const willOpen = replaceMenu.hidden;
      replaceMenu.hidden = !willOpen;
      incorrectCommand.classList.toggle("is-selected", willOpen);
      if (willOpen) setMessage("Encontraste la ficha incorrecta. Elegí el movimiento que evita el choque.", "is-good");
    });
  });

  challengeContent.querySelectorAll("[data-replacement]").forEach((button) => {
    button.addEventListener("click", () => {
      if (solved) return;
      const replacement = button.dataset.replacement;
      if (replacement !== "derecha") {
        button.classList.add("is-wrong");
        setMessage("Ese cambio no crea el desvío seguro. Nano necesita girar hacia abajo.", "is-error is-soft-error");
        window.setTimeout(() => button.classList.remove("is-wrong"), 650);
        return;
      }

      solved = true;
      closeMenu();
      incorrectCommand.classList.add("is-correct");
      incorrectCommand.innerHTML = `<span class="n6-d6-turn-icon" aria-hidden="true">↷</span><span class="sr-only">Girar a la derecha</span>`;
      incorrectCommand.setAttribute("aria-label", "Paso 2 corregido: Girar a la derecha");
      commandButtons.forEach((command) => { command.disabled = true; });
      challengeContent.querySelector(".n6-card-d6")?.classList.add("is-running");
      setMessage("¡Muy bien! Nano gira a la derecha y evita el satélite.", "is-success");
      completeChallenge(id, 3000);
    });
  });
}

function renderN6SolarRepetitionChallenge(id = 7) {
  const repetitions = [2, 3, 4, 5];
  let selectedValue = null;
  let draggedValue = null;
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n6-card n6-card-d7">
      <header class="challenge-header n6-d4-header">
        <div class="n6-d4-instruction n6-d7-instruction">
          <h2>¡ENERGÍA BAJA!</h2>
          <p data-consigna-text>${getChallengeInstruction(id, "Nano Astronauta debe encender los paneles solares de la base espacial. Cuenta cuántos hay y elige el bloque de repetición correcto.")}</p>
          <button class="n6-d4-listen" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">&#128266;</button>
        </div>
      </header>

      <section class="n6-d4-board n6-d7-board" aria-label="Nano y cuatro paneles solares apagados">
        <img class="n6-d4-grid-frame" src="${n6Asset(7, "Cuadricula.png")}" alt="" aria-hidden="true" />
        <img class="n6-d4-nano n6-d7-nano" src="${n6Asset(7, "cara Derecha.png")}" alt="Nano" />
        ${Array.from({ length: 4 }, (_, index) => `
          <img class="n6-d7-solar n6-d7-solar-${index + 1}" src="${n6Asset(7, "Paneles del Solar.png")}" alt="Panel solar ${index + 1} apagado" data-solar-panel />
        `).join("")}
      </section>

      <img class="n6-d4-panels-bg" src="${n6Asset(7, "tablero.png")}" alt="" aria-hidden="true" />

      <section class="n6-d7-algorithm" aria-label="Algoritmo de repetición">
        <div class="n6-d7-program">
          <img src="${n6Asset(7, "Entrada.png")}" alt="Inicio" />
          <button class="n6-d7-repeat-target" type="button" data-repeat-target aria-label="Espacio para el bloque de repetición"><span>?</span></button>
          <img src="${n6Asset(7, "AVANZAR.png")}" alt="Avanzar" />
          <img class="n6-d7-panel-command" src="${n6Asset(7, "tarjeta de panel encendida.png")}" alt="Encender panel" />
          <img src="${n6Asset(7, "Vamos.png")}" alt="Ejecutar" />
        </div>
      </section>

      <section class="n6-d7-bank" aria-label="Opciones de repetición">
        ${repetitions.map((value) => `
          <button class="n6-d7-repeat-card" type="button" draggable="true" data-repeat-value="${value}" aria-label="Repetición x${value}">
            <span class="n6-d7-card-art">
              <img class="n6-d7-card-base" src="${n6Asset(7, `REPETICION X${value}.png`)}" alt="" aria-hidden="true" />
              <img class="n6-d7-card-icon" src="${n6Asset(7, `Reptir x${value}.png`)}" alt="" aria-hidden="true" />
            </span>
            <span class="sr-only">Repetición x${value}</span>
          </button>
        `).join("")}
      </section>

      <p class="challenge-message n6-d7-message" data-message></p>
    </article>
  `;

  const target = challengeContent.querySelector("[data-repeat-target]");
  const cards = [...challengeContent.querySelectorAll(".n6-d7-repeat-card")];

  function clearSelection() {
    cards.forEach((card) => card.classList.remove("is-selected"));
  }

  function tryPlace(value) {
    if (solved || !value) return;
    const numericValue = Number(value);
    if (numericValue !== 4) {
      const wrongCard = cards.find((card) => Number(card.dataset.repeatValue) === numericValue);
      wrongCard?.classList.add("is-wrong");
      target.classList.add("is-wrong");
      setMessage(`Hay cuatro paneles. Repetición x${numericValue} no alcanza la cantidad correcta.`, "is-error is-soft-error");
      window.setTimeout(() => {
        wrongCard?.classList.remove("is-wrong");
        target.classList.remove("is-wrong");
      }, 700);
      return;
    }

    solved = true;
    const correctCard = cards.find((card) => Number(card.dataset.repeatValue) === 4);
    target.classList.add("is-filled", "is-correct");
    target.innerHTML = correctCard.querySelector(".n6-d7-card-art").outerHTML;
    cards.forEach((card) => { card.disabled = true; });
    correctCard.hidden = true;
    clearSelection();
    challengeContent.querySelector(".n6-card-d7")?.classList.add("is-running");

    const panels = [...challengeContent.querySelectorAll("[data-solar-panel]")];
    panels.forEach((panel, index) => {
      window.setTimeout(() => {
        panel.src = n6Asset(7, "Paneles del Solar encendido.png");
        panel.alt = `Panel solar ${index + 1} encendido`;
        panel.classList.add("is-on");
      }, 600 + (index * 560));
    });

    setMessage("¡Correcto! Repetición x4 enciende los cuatro paneles solares.", "is-success");
    completeChallenge(id, 3600);
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (solved) return;
      selectedValue = Number(card.dataset.repeatValue);
      clearSelection();
      card.classList.add("is-selected");
      setMessage(`Repetición x${selectedValue} seleccionada. Tocá el espacio con el signo de pregunta.`, "is-good");
    });

    card.addEventListener("dragstart", (event) => {
      if (solved) return;
      draggedValue = Number(card.dataset.repeatValue);
      event.dataTransfer?.setData("text/plain", String(draggedValue));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
      card.classList.add("is-dragging");
    });

    card.addEventListener("dragend", () => {
      draggedValue = null;
      card.classList.remove("is-dragging");
      target.classList.remove("is-drag-over");
    });
  });

  target.addEventListener("click", () => {
    if (solved) return;
    if (!selectedValue) {
      setMessage("Primero elegí una tarjeta de repetición.", "is-error is-soft-error");
      return;
    }
    tryPlace(selectedValue);
  });

  target.addEventListener("dragover", (event) => {
    if (solved) return;
    event.preventDefault();
    target.classList.add("is-drag-over");
  });

  target.addEventListener("dragleave", () => target.classList.remove("is-drag-over"));
  target.addEventListener("drop", (event) => {
    if (solved) return;
    event.preventDefault();
    target.classList.remove("is-drag-over");
    const droppedValue = Number(event.dataTransfer?.getData("text/plain")) || draggedValue;
    tryPlace(droppedValue);
  });
}

function renderN6AsteroidPatternChallenge(id = 8) {
  const commands = [
    { id: "derecha", label: "Girar a la derecha", card: "GIRAR DERECHA.png", icon: "DERECHA.png" },
    { id: "avanzar", label: "Avanzar", card: "Tarjeta avanzar.png", icon: "AVANZAR.png" },
    { id: "izquierda", label: "Girar a la izquierda", card: "GIRAR IZQUIERDA.png", icon: "IZQUIERDA.png" },
  ];
  const expected = ["avanzar", "derecha"];
  const placed = [null, null];
  let selectedCommand = null;
  let draggedCommand = null;
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n6-card n6-card-d8">
      <header class="challenge-header n6-d4-header">
        <div class="n6-d4-instruction n6-d8-instruction">
          <h2>¡CAMPO DE ASTEROIDES!</h2>
          <p data-consigna-text>${getChallengeInstruction(id, "El camino seguro es muy largo. Elige la combinación exacta que Nano debe repetir para cruzar sin salirse de la ruta en zigzag.")}</p>
          <button class="n6-d4-listen" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">&#128266;</button>
        </div>
      </header>

      <section class="n6-d8-board" aria-label="Ruta en zigzag entre asteroides">
        <img class="n6-d8-grid" src="${n6Asset(8, "Cuadricula.png")}" alt="" aria-hidden="true" />
        <img class="n6-d8-ship" src="${n6Asset(8, "Nave de astronauta.png")}" alt="Nave de Nano" />
        <img class="n6-d8-base" src="${n6Asset(8, "Base espacial.png")}" alt="Base espacial de destino" />
        ${[
          [18, 26, 7], [51, 27, 7], [31, 44, 10], [18, 61, 7],
          [67, 61, 7], [48, 77, 10], [31, 91, 7], [67, 91, 7],
        ].map(([x, y, size], index) => `
          <img class="n6-d8-asteroid n6-d8-asteroid-${index + 1}" src="${n6Asset(8, "asteroide.png")}" alt="Asteroide" style="--x:${x}%;--y:${y}%;--size:${size}%" />
        `).join("")}
      </section>

      <section class="n6-d8-program-panel" aria-label="Bloque de repetición por cuatro">
        <div class="n6-d8-program">
          <img class="n6-d8-start" src="${n6Asset(8, "Entrada.png")}" alt="Inicio" />
          <span class="n6-d8-repeat-open" aria-hidden="true">(</span>
          <div class="n6-d8-repeat-slots">
            ${expected.map((command, index) => `
              <button class="n6-d8-slot" type="button" data-pattern-slot="${index}" data-expected="${command}" aria-label="Paso ${index + 1}, vacío"><span>?</span></button>
            `).join("")}
          </div>
          <span class="n6-d8-repeat-close" aria-hidden="true">)</span>
          <span class="n6-d8-repeat-count" aria-label="Repetir cuatro veces">x4</span>
          <img class="n6-d8-finish" src="${n6Asset(8, "Vamos.png")}" alt="Ejecutar" />
        </div>
      </section>

      <section class="n6-d8-bank" aria-label="Tarjetas de movimiento">
        ${commands.map((command) => `
          <button class="n6-d8-command" type="button" draggable="true" data-pattern-command="${command.id}" aria-label="${command.label}">
            <span class="n6-d8-command-art">
              <img class="n6-d8-command-base" src="${n6Asset(8, command.card)}" alt="" aria-hidden="true" />
              <img class="n6-d8-command-icon" src="${n6Asset(8, command.icon)}" alt="" aria-hidden="true" />
            </span>
            <span>${command.label}</span>
          </button>
        `).join("")}
      </section>

      <p class="challenge-message n6-d8-message" data-message></p>
    </article>
  `;

  const card = challengeContent.querySelector(".n6-card-d8");
  const slots = [...challengeContent.querySelectorAll(".n6-d8-slot")];
  const commandButtons = [...challengeContent.querySelectorAll(".n6-d8-command")];

  function commandById(commandId) {
    return commands.find((command) => command.id === commandId);
  }

  function clearSelection() {
    commandButtons.forEach((button) => button.classList.remove("is-selected"));
    selectedCommand = null;
  }

  function renderSlot(index) {
    const slot = slots[index];
    const command = commandById(placed[index]);
    slot.classList.toggle("is-filled", Boolean(command));
    slot.classList.remove("is-wrong");
    if (!command) {
      slot.innerHTML = "<span>?</span>";
      slot.setAttribute("aria-label", `Paso ${index + 1}, vacío`);
      return;
    }
    slot.innerHTML = `<img src="${n6Asset(8, command.icon)}" alt="${command.label}" />`;
    slot.setAttribute("aria-label", `Paso ${index + 1}: ${command.label}. Tocar para quitar.`);
  }

  function finishIfComplete() {
    if (placed.some((command) => !command)) return;
    const firstError = placed.findIndex((command, index) => command !== expected[index]);
    if (firstError !== -1) {
      slots[firstError].classList.add("is-wrong");
      setMessage(firstError === 0
        ? "El patrón debe comenzar avanzando por el tramo seguro."
        : "Después de avanzar, Nano debe girar a la derecha para seguir el zigzag.", "is-error is-soft-error");
      window.setTimeout(() => slots[firstError]?.classList.remove("is-wrong"), 850);
      return;
    }

    solved = true;
    slots.forEach((slot) => { slot.disabled = true; slot.classList.add("is-correct"); });
    commandButtons.forEach((button) => { button.disabled = true; });
    clearSelection();
    card.classList.add("is-running");
    setMessage("¡Patrón correcto! Nano repite avanzar y girar a la derecha para cruzar el campo.", "is-success");
    completeChallenge(id, 4300);
  }

  function placeCommand(index, commandId) {
    if (solved || !commandById(commandId)) return;
    placed[index] = commandId;
    renderSlot(index);
    clearSelection();
    playSound("place");
    finishIfComplete();
    if (!solved && placed.some((command) => !command)) {
      setMessage("Primer movimiento colocado. Ahora completa la combinación que se repite.", "is-good");
    }
  }

  commandButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (solved) return;
      commandButtons.forEach((item) => item.classList.remove("is-selected"));
      selectedCommand = button.dataset.patternCommand;
      button.classList.add("is-selected");
      setMessage(`${commandById(selectedCommand).label} seleccionado. Tocá uno de los espacios del bloque.`, "is-good");
    });
    button.addEventListener("dragstart", (event) => {
      if (solved) return;
      draggedCommand = button.dataset.patternCommand;
      event.dataTransfer?.setData("text/plain", draggedCommand);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
      button.classList.add("is-dragging");
    });
    button.addEventListener("dragend", () => {
      draggedCommand = null;
      button.classList.remove("is-dragging");
      slots.forEach((slot) => slot.classList.remove("is-drag-over"));
    });
  });

  slots.forEach((slot, index) => {
    slot.addEventListener("click", () => {
      if (solved) return;
      if (selectedCommand) {
        placeCommand(index, selectedCommand);
        return;
      }
      if (placed[index]) {
        placed[index] = null;
        renderSlot(index);
        setMessage("Tarjeta quitada. Elegí otra para corregir la combinación.", "is-good");
        return;
      }
      setMessage("Primero elegí o arrastrá una tarjeta de movimiento.", "is-error is-soft-error");
    });
    slot.addEventListener("dragover", (event) => {
      if (solved) return;
      event.preventDefault();
      slot.classList.add("is-drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drag-over"));
    slot.addEventListener("drop", (event) => {
      if (solved) return;
      event.preventDefault();
      slot.classList.remove("is-drag-over");
      placeCommand(index, event.dataTransfer?.getData("text/plain") || draggedCommand);
    });
  });
}

function renderN6CapsuleCollectionChallenge(id = 9) {
  const commands = [
    { id: "derecha", label: "Girar a la derecha", card: "GIRAR DERECHA.png", icon: "DERECHA.png" },
    { id: "avanzar", label: "Avanzar", card: "Tarjeta avanzar.png", icon: "AVANZAR.png" },
    { id: "recoger", label: "Recoger cápsula", card: null, icon: "Capsula.png" },
    { id: "izquierda", label: "Girar a la izquierda", card: "GIRAR IZQUIERDA.png", icon: "IZQUIERDA.png" },
  ];
  const expected = ["avanzar", "recoger", "izquierda"];
  const placed = [null, null, null];
  let selectedCommand = null;
  let draggedCommand = null;
  let solved = false;

  challengeContent.innerHTML = `
    <article class="challenge-card n6-card n6-card-d9">
      <header class="challenge-header n6-d4-header">
        <div class="n6-d4-instruction n6-d9-instruction">
          <h2>¡MISIÓN DE RECOLECCIÓN!</h2>
          <p data-consigna-text>${getChallengeInstruction(id, "Hay cuatro cápsulas de investigación perdidas en órbita. Elige los bloques ordenados para que Nano logre recogerlas todas.")}</p>
          <button class="n6-d4-listen" type="button" data-speak-consigna aria-label="Escuchar consigna" title="Escuchar consigna">&#128266;</button>
        </div>
      </header>

      <section class="n6-d9-board" aria-label="Recorrido cuadrado con cuatro cápsulas de investigación">
        <img class="n6-d9-grid" src="${n6Asset(9, "Cuadricula.png")}" alt="" aria-hidden="true" />
        ${[
          [72, 74], [72, 28], [23, 28], [23, 74],
        ].map(([x, y], index) => `
          <img class="n6-d9-capsule n6-d9-capsule-${index + 1}" src="${n6Asset(9, "Capsula.png")}" alt="Cápsula de investigación ${index + 1}" style="--x:${x}%;--y:${y}%" data-capsule />
        `).join("")}
        <img class="n6-d9-nano" src="${n6Asset(9, "cara Derecha.png")}" alt="Nano astronauta" />
      </section>

      <img class="n6-d9-panels-bg" src="${n6Asset(9, "tablero.png")}" alt="" aria-hidden="true" />

      <section class="n6-d9-program-panel" aria-label="Algoritmo de repetición por cuatro">
        <div class="n6-d9-program-heading">
          <span>REPETICIÓN</span><strong>x4</strong>
        </div>
        <div class="n6-d9-program">
          <span class="n6-d9-repeat-open" aria-hidden="true">(</span>
          <div class="n6-d9-repeat-slots">
            ${expected.map((command, index) => `
              <button class="n6-d9-slot" type="button" data-capsule-slot="${index}" data-expected="${command}" aria-label="Paso ${index + 1}, vacío"><span>?</span></button>
            `).join("")}
          </div>
          <span class="n6-d9-repeat-close" aria-hidden="true">)</span>
        </div>
      </section>

      <section class="n6-d9-bank" aria-label="Tarjetas para ordenar">
        ${commands.map((command) => `
          <button class="n6-d9-command ${command.id === "recoger" ? "is-capsule-command" : ""}" type="button" draggable="true" data-capsule-command="${command.id}" aria-label="${command.label}">
            <span class="n6-d9-command-art">
              ${command.card ? `<img class="n6-d9-command-base" src="${n6Asset(9, command.card)}" alt="" aria-hidden="true" />` : `<span class="n6-d9-command-base n6-d9-capsule-card-base" aria-hidden="true"></span>`}
              <img class="n6-d9-command-icon" src="${n6Asset(9, command.icon)}" alt="" aria-hidden="true" />
            </span>
            <span>${command.label}</span>
          </button>
        `).join("")}
      </section>

      <p class="challenge-message n6-d9-message" data-message></p>
    </article>
  `;

  const card = challengeContent.querySelector(".n6-card-d9");
  const slots = [...challengeContent.querySelectorAll(".n6-d9-slot")];
  const commandButtons = [...challengeContent.querySelectorAll(".n6-d9-command")];
  const capsules = [...challengeContent.querySelectorAll("[data-capsule]")];

  function commandById(commandId) {
    return commands.find((command) => command.id === commandId);
  }

  function clearSelection() {
    commandButtons.forEach((button) => button.classList.remove("is-selected"));
    selectedCommand = null;
  }

  function commandMarkup(command) {
    if (command.id === "recoger") {
      return `<img class="is-capsule-icon" src="${n6Asset(9, command.icon)}" alt="${command.label}" />`;
    }
    return `<img src="${n6Asset(9, command.icon)}" alt="${command.label}" />`;
  }

  function renderSlot(index) {
    const slot = slots[index];
    const command = commandById(placed[index]);
    slot.classList.toggle("is-filled", Boolean(command));
    slot.classList.remove("is-wrong");
    if (!command) {
      slot.innerHTML = "<span>?</span>";
      slot.setAttribute("aria-label", `Paso ${index + 1}, vacío`);
      return;
    }
    slot.innerHTML = commandMarkup(command);
    slot.setAttribute("aria-label", `Paso ${index + 1}: ${command.label}. Tocar para quitar.`);
  }

  function finishIfComplete() {
    if (placed.some((command) => !command)) return;
    const firstError = placed.findIndex((command, index) => command !== expected[index]);
    if (firstError !== -1) {
      slots[firstError].classList.add("is-wrong");
      const hints = [
        "Nano primero debe avanzar hasta cada cápsula.",
        "Cuando llega al vértice, la segunda acción es recoger la cápsula.",
        "Después de recogerla, debe girar a la izquierda para continuar el cuadrado.",
      ];
      setMessage(hints[firstError], "is-error is-soft-error");
      window.setTimeout(() => slots[firstError]?.classList.remove("is-wrong"), 850);
      return;
    }

    solved = true;
    slots.forEach((slot) => { slot.disabled = true; slot.classList.add("is-correct"); });
    commandButtons.forEach((button) => { button.disabled = true; });
    clearSelection();
    card.classList.add("is-running");
    capsules.forEach((capsule, index) => {
      window.setTimeout(() => {
        capsule.classList.add("is-collected");
        capsule.alt = `Cápsula de investigación ${index + 1} recogida`;
      }, 650 + (index * 720));
    });
    setMessage("¡Secuencia correcta! Nano repite las tres acciones y recoge las cuatro cápsulas.", "is-success");
    completeChallenge(id, 4300);
  }

  function placeCommand(index, commandId) {
    if (solved || !commandById(commandId)) return;
    placed[index] = commandId;
    renderSlot(index);
    clearSelection();
    playSound("place");
    finishIfComplete();
    if (!solved && placed.some((command) => !command)) {
      setMessage(`Paso ${index + 1} colocado. Completá los espacios restantes del bucle.`, "is-good");
    }
  }

  commandButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (solved) return;
      commandButtons.forEach((item) => item.classList.remove("is-selected"));
      selectedCommand = button.dataset.capsuleCommand;
      button.classList.add("is-selected");
      setMessage(`${commandById(selectedCommand).label} seleccionado. Tocá el espacio donde debe ir.`, "is-good");
    });
    button.addEventListener("dragstart", (event) => {
      if (solved) return;
      draggedCommand = button.dataset.capsuleCommand;
      event.dataTransfer?.setData("text/plain", draggedCommand);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
      button.classList.add("is-dragging");
    });
    button.addEventListener("dragend", () => {
      draggedCommand = null;
      button.classList.remove("is-dragging");
      slots.forEach((slot) => slot.classList.remove("is-drag-over"));
    });
  });

  slots.forEach((slot, index) => {
    slot.addEventListener("click", () => {
      if (solved) return;
      if (selectedCommand) {
        placeCommand(index, selectedCommand);
        return;
      }
      if (placed[index]) {
        placed[index] = null;
        renderSlot(index);
        setMessage("Tarjeta quitada. Podés corregir este paso.", "is-good");
        return;
      }
      setMessage("Primero elegí o arrastrá una tarjeta.", "is-error is-soft-error");
    });
    slot.addEventListener("dragover", (event) => {
      if (solved) return;
      event.preventDefault();
      slot.classList.add("is-drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drag-over"));
    slot.addEventListener("drop", (event) => {
      if (solved) return;
      event.preventDefault();
      slot.classList.remove("is-drag-over");
      placeCommand(index, event.dataTransfer?.getData("text/plain") || draggedCommand);
    });
  });
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
  const actionsMarkup = ["Girar der.", "Girar izq."]
    .map((command) => renderCommandButton(command, "instruction-chip", "orange"))
    .join("");
  const instruction = getChallengeInstruction(id, "El robot avanza, pero tiene que girar. Observa el camino y elige la tarjeta correcta para completar la instruccion.");

  challengeContent.innerHTML = `
    <article class="challenge-card design-challenge-v1">
      <header class="challenge-header design-d1-header">
        <img class="design-d1-title-image" src="${DESIGN_D1_ASSET_BASE}/Titulo%20y%20aonsigna.png" alt="Secuencia de comandos. A programar. El robot avanza, pero tiene que girar. Observa el camino y elige la tarjeta correcta para completar la instruccion. Buena suerte." />
        <p class="sr-only" data-consigna-text>${instruction}</p>
      </header>
      <div class="visual-sequence-layout">
        <div class="path-map visual-map" data-path-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
      </div>
      <img class="design-d1-logo" src="${DESIGN_D1_ASSET_BASE}/Logo.png" alt="BeTech" />
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
    robotCell.innerHTML = renderDesignRobotMarker();
  }

  async function runRobotAnimation(routeLimit = routePath.length - 1) {
    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;

    for (const [index, key] of routePath.slice(0, routeLimit + 1).entries()) {
      paintRobot(key);
      if (index > 0) playRobotMoveSound();
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
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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

    setMessage("Todavia no llega a 🏁, pero estas cerca. La linea 1 necesita girar hacia la derecha.", "is-error");
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
      if (command === "F") playRobotMoveSound();
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
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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
      blanks[selectedBlank].innerHTML = renderInlineCommand(command);
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
    .map((command) => renderCommandButton(command, "instruction-chip", "orange"))
    .join("");

  const instruction = getChallengeInstruction(id, "Completa los giros para esquivar el agua y llegar a la bandera sin tocar los charcos.");

  challengeContent.innerHTML = `
    <article class="challenge-card rain-challenge-card design-challenge-v2">
      <div class="rain-masthead design-d2-masthead">
        <img class="rain-alert-title design-d2-title" src="${DESIGN_D2_ASSET_BASE}/titulo.png" alt="Alerta de lluvia" />
        <img class="design-d2-consigna" src="${DESIGN_D2_ASSET_BASE}/cuadro%20de%20consigna.png" alt="El robot no sabe como llegar. Aplica la logica y elige las tarjetas para completar el algoritmo." />
        <p class="sr-only">${instruction}</p>
      </div>
      <div class="rain-accessible-header" hidden>
        ${renderHeader(id, instruction)}
      </div>
      <div class="visual-sequence-layout rain-play-layout">
        <div class="path-map visual-map" data-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
        <div class="rain-helper" aria-hidden="true">
          <img class="design-d2-helper" src="${DESIGN_D2_ASSET_BASE}/Nano%20con%20dialogo.png" alt="" />
        </div>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
      </div>
      <img class="design-d2-logo" src="${DESIGN_D2_ASSET_BASE}/logo.png" alt="BeTech" />
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
        }
        if (key === route[0]) {
          cell.classList.add("is-start");
        }
        if (key === route[route.length - 1]) {
          cell.classList.add("is-goal");
          cell.innerHTML = `<img class="rain-goal" src="tarjetas%20movimiento/Vamos.png" alt="" />`;
        }
        cell.dataset.baseHtml = cell.innerHTML;
        cells.set(key, cell);
        map.append(cell);
      }
    }
  }

  function paintRobot(key) {
    cells.forEach((cell) => {
      cell.classList.remove("is-robot", "is-trail");
      cell.innerHTML = cell.dataset.baseHtml || "";
    });

    for (const routeKey of route.slice(0, route.indexOf(key) + 1)) {
      cells.get(routeKey)?.classList.add("is-trail");
    }

    const robotCell = cells.get(key);
    if (!robotCell) return;
    robotCell.classList.add("is-robot");
    robotCell.innerHTML = renderDesignRainRobotMarker();
  }

  async function animateRoute(routeLimit = route.length - 1) {
    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;

    for (const [index, key] of route.slice(0, routeLimit + 1).entries()) {
      paintRobot(key);
      if (index > 0) playRobotMoveSound();
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
  const instruction = getChallengeInstruction(id, "Nano te necesita. Crea la secuencia exacta: pasa por la bateria para obtener energia, llega al tesoro y esquiva los obstaculos.");
  const stepsMarkup = Array.from({ length: 9 }, (_, index) => renderDesignD3Blank(index)).join("");
  const actionsMarkup = ["Girar izq.", "Girar der.", "Avanzar"]
    .map((command) => renderDesignD3Button(command))
    .join("");

  function renderDesignD3Command(command) {
    if (command === "Avanzar") {
      return `
        <span class="command-symbol" aria-hidden="true">
          <img class="command-image design-d3-command-image" src="${DESIGN_D3_ASSET_BASE}/Avanzar.png" alt="" />
        </span>
        <span class="command-label">${command}</span>
      `;
    }

    const turnClass = command === "Girar izq." ? "is-turn-left" : "is-turn-right";
    return `
      <span class="command-symbol" aria-hidden="true">
        <span class="design-d3-command-sprite ${turnClass}"></span>
      </span>
      <span class="command-label">${command}</span>
    `;
  }

  function renderDesignD3Button(command) {
    return `
      <button class="instruction-chip" type="button" data-value="${command}" aria-label="${command}">
        ${renderDesignD3Command(command)}
      </button>
    `;
  }

  function renderDesignD3Blank(index) {
    return `
      <button class="sequence-slot command-card ${index === selectedBlank ? "is-selected" : ""}" type="button" data-blank="${index}" aria-label="Elegir accion">
        <span class="command-placeholder">${index + 1}</span>
      </button>
    `;
  }

  challengeContent.innerHTML = `
    <article class="challenge-card design-challenge-v3">
      <div class="design-d3-masthead">
        <img class="design-d3-helper" src="${DESIGN_D3_ASSET_BASE}/Nano%20cono%20bateria.png" alt="" />
        <img class="design-d3-title" src="${DESIGN_D3_ASSET_BASE}/titulo%20y%20consigna.png" alt="Mision laberinto. Nano te necesita. Crea la secuencia exacta: pasa por la bateria para obtener energia, llega al tesoro y esquiva los obstaculos." />
        <p class="sr-only">${instruction}</p>
      </div>
      <div class="visual-sequence-layout">
        <div class="path-map visual-map design-d3-map" data-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
      </div>
      <img class="design-d3-logo" src="${DESIGN_D3_ASSET_BASE}/logo.png" alt="BeTech" />
      <p class="challenge-message" data-message>Sigue la ruta celeste: junta las pilas de energia y termina en 🏁.</p>
    </article>
  `;

  const map = challengeContent.querySelector("[data-map]");
  const checkButton = challengeContent.querySelector("[data-check]");
  const resetButton = challengeContent.querySelector("[data-reset]");
  const blanks = [...challengeContent.querySelectorAll("[data-blank]")];
  const cells = new Map();
  const collectedBatteries = new Set();

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
        cell.className = "path-map-cell";
        if (routeCells.has(key)) cell.classList.add("is-route");
        if (obstacles.has(key)) {
          cell.classList.add("is-obstacle");
          cell.innerHTML = `<img class="design-d3-puddle" src="${DESIGN_D3_ASSET_BASE}/charco.png" alt="" />`;
        }
        if (batteries.has(key)) {
          cell.classList.add("is-treasure");
          const energyAsset = key === "5-2" ? "BATERIA.png" : "rayo.png";
          cell.innerHTML = `<img class="design-d3-energy" src="${DESIGN_D3_ASSET_BASE}/${energyAsset}" alt="" />`;
        }
        if (key === route[0]) {
          cell.classList.add("is-start");
        }
        if (key === route[route.length - 1]) {
          cell.classList.add("is-goal");
          cell.innerHTML = `<img class="design-d3-goal" src="tarjetas%20movimiento/Vamos.png" alt="" />`;
        }
        cell.dataset.baseHtml = cell.innerHTML;
        cells.set(key, cell);
        map.append(cell);
      }
    }
  }

  function paintRobot(key) {
    if (batteries.has(key)) collectedBatteries.add(key);

    cells.forEach((cell, cellKeyValue) => {
      cell.classList.remove("is-robot", "is-trail");
      const hasCollectedBattery = collectedBatteries.has(cellKeyValue);
      cell.classList.toggle("is-treasure", batteries.has(cellKeyValue) && !hasCollectedBattery);
      cell.innerHTML = hasCollectedBattery ? "" : cell.dataset.baseHtml || "";
    });

    for (const routeKey of route.slice(0, route.indexOf(key) + 1)) {
      cells.get(routeKey)?.classList.add("is-trail");
    }

    const robotCell = cells.get(key);
    if (!robotCell) return;
    robotCell.classList.add("is-robot");
    robotCell.innerHTML = renderDesignEnergyRobotMarker(directionForRouteKey(route, key));
  }

  async function animateRoute(routeLimit = route.length - 1) {
    isAnimating = true;
    checkButton.disabled = true;
    resetButton.disabled = true;
    collectedBatteries.clear();

    for (const [index, key] of route.slice(0, routeLimit + 1).entries()) {
      paintRobot(key);
      if (index > 0) playRobotMoveSound();
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
      target.innerHTML = renderDesignD3Command(command);
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
    collectedBatteries.clear();
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
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
      </div>
      <p class="challenge-message" data-message>Busca los tramos largos: primero hay tres pasos rectos, despues otros tres y al final dos.</p>
    </article>
  `;

  const map = challengeContent.querySelector("[data-map]");
  const checkButton = challengeContent.querySelector("[data-check]");
  const resetButton = challengeContent.querySelector("[data-reset]");
  const blanks = [...challengeContent.querySelectorAll("[data-blank]")];
  const cells = new Map();
  const collectedBatteries = new Set();

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
    if (batteries.has(key)) collectedBatteries.add(key);

    cells.forEach((cell, cellKeyValue) => {
      cell.classList.remove("is-robot", "is-trail");
      const hasCollectedBattery = collectedBatteries.has(cellKeyValue);
      cell.classList.toggle("is-treasure", batteries.has(cellKeyValue) && !hasCollectedBattery);
      cell.textContent = hasCollectedBattery ? "" : cell.dataset.baseText || "";
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
    collectedBatteries.clear();

    for (const [index, key] of route.slice(0, routeLimit + 1).entries()) {
      paintRobot(key);
      if (index > 0) playRobotMoveSound();
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
    collectedBatteries.clear();
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
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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
      const previousKey = state.key;
      state = getNextState(state, command);
      paintRobot(state.key, state.direction);
      if (command === "Avanzar" && state.key !== previousKey) playRobotMoveSound();
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

function renderDesignD6ArrowMazeChallenge(id = 1) {
  const route = ["5-0", "5-1", "5-2", "4-2", "3-2", "3-3", "2-3", "1-3", "1-4", "1-5"];
  const routeCells = new Set(route);
  const obstacles = new Set(["5-4", "4-4", "3-0", "3-1", "3-4", "2-0", "2-5", "1-1", "0-3", "0-5"]);
  const batteries = new Set(["3-3"]);
  const expected = [
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
    "Avanzar",
    "Girar der.",
    "Avanzar",
    "Avanzar",
  ];
  const startDirection = 0;
  let selectedBlank = 0;
  let isAnimating = false;
  const collectedBatteries = new Set();
  const instruction = getChallengeInstruction(id, "Crea tu propia secuencia: ayuda a Nano a pasar por la bateria para cargar energia y encuentra la salida sin tocar los obstaculos.");

  function renderDesignD6Command(command) {
    const commandClass = command === "Avanzar"
      ? "is-forward"
      : command === "Girar izq."
        ? "is-turn-left"
        : "is-turn-right";

    return `
      <span class="command-symbol" aria-hidden="true">
        <span class="design-d6-command-sprite ${commandClass}"></span>
      </span>
      <span class="command-label">${command}</span>
    `;
  }

  function renderDesignD6Button(command) {
    return `
      <button class="instruction-chip" type="button" data-value="${command}" aria-label="${command}">
        ${renderDesignD6Command(command)}
      </button>
    `;
  }

  function renderDesignD6Blank(index) {
    return `
      <button class="sequence-slot command-card ${index === selectedBlank ? "is-selected" : ""}" type="button" data-blank="${index}" aria-label="Elegir accion">
        <span class="command-placeholder">${index + 1}</span>
      </button>
    `;
  }

  const stepsMarkup = expected.map((_, index) => renderDesignD6Blank(index)).join("");
  const actionsMarkup = ["Girar izq.", "Girar der.", "Avanzar"].map(renderDesignD6Button).join("");

  challengeContent.innerHTML = `
    <article class="challenge-card design-challenge-v6">
      <div class="design-d6-masthead">
        <img class="design-d6-title" src="${DESIGN_D6_ASSET_BASE}/TITULO%20Y%20CONSIGNA.png" alt="Mision laberinto. Crea tu propia secuencia: ayuda a Nano a pasar por la bateria para cargar energia y encuentra la salida sin tocar los obstaculos. A jugar!" />
        <p class="sr-only">${instruction}</p>
      </div>
      <div class="visual-sequence-layout design-d6-layout">
        <div class="path-map visual-map design-d6-map" data-map></div>
        ${renderCommandSequencePanel({ stepsMarkup, actionsMarkup, compact: true })}
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
      </div>
      <img class="design-d6-logo" src="${DESIGN_D6_ASSET_BASE}/LOGO.png" alt="BeTech" />
      <p class="challenge-message" data-message>Primero gira a Nano hacia el camino verde. Despues avanza, carga la bateria y llega a la salida.</p>
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
        cell.className = "path-map-cell";
        if (routeCells.has(key)) cell.classList.add("is-route");
        if (obstacles.has(key)) {
          cell.classList.add("is-obstacle");
          cell.innerHTML = `<img class="design-d6-virus" src="${DESIGN_D6_ASSET_BASE}/Virus%20tecnologico.png" alt="" />`;
        }
        if (batteries.has(key)) {
          cell.classList.add("is-treasure");
          cell.innerHTML = `<img class="design-d6-energy" src="${DESIGN_D6_ASSET_BASE}/BATERIA.png" alt="" />`;
        }
        if (key === route[0]) cell.classList.add("is-start");
        if (key === route[route.length - 1]) cell.classList.add("is-goal");
        cell.dataset.baseHtml = cell.innerHTML;
        cells.set(key, cell);
        map.append(cell);
      }
    }
  }

  function paintRobot(key) {
    if (batteries.has(key)) collectedBatteries.add(key);

    cells.forEach((cell, cellKeyValue) => {
      cell.classList.remove("is-robot", "is-trail");
      const hasCollectedBattery = collectedBatteries.has(cellKeyValue);
      cell.classList.toggle("is-treasure", batteries.has(cellKeyValue) && !hasCollectedBattery);
      cell.innerHTML = hasCollectedBattery ? "" : cell.dataset.baseHtml || "";
    });

    const routeIndex = route.indexOf(key);
    if (routeIndex >= 0) {
      for (const routeKey of route.slice(0, routeIndex + 1)) {
        cells.get(routeKey)?.classList.add("is-trail");
      }
    }

    const robotCell = cells.get(key);
    if (!robotCell) return;
    robotCell.classList.add("is-robot");
    robotCell.innerHTML = renderDesignD6RobotMarker();
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
    collectedBatteries.clear();

    let state = { key: route[0], direction: startDirection };
    paintRobot(state.key);
    await new Promise((resolve) => setTimeout(resolve, 180));

    for (const command of commands) {
      const previousKey = state.key;
      state = getNextState(state, command);
      paintRobot(state.key);
      if (command === "Avanzar" && state.key !== previousKey) playRobotMoveSound();
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
      target.innerHTML = renderDesignD6Command(value);
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
        ? "Ese comando cambia el camino de Nano. Mira la tarjeta marcada y prueba otra."
        : `Buen avance. Falta completar el paso ${stepIndex + 1} para seguir.`,
      issue.dataset.value ? "is-error" : "is-good");
      animateCommands(previewCommands);
      return;
    }

    setMessage("Programa listo. Vamos a ver a Nano girar, cargar energia y salir.", "is-good");
    animateCommands().then(() => {
      setMessage("Excelente: Nano cruzo el laberinto, cargo energia y encontro la salida.", "is-success");
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
    selectedBlank = 0;
    collectedBatteries.clear();
    buildMap();
    paintRobot(route[0]);
    setMessage("Nuevo intento. Gira primero hacia el camino verde y usa Avanzar para moverte.");
  });

  buildMap();
  paintRobot(route[0]);
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
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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
    { label: "Lata", icon: "🥫", target: "metal" },
    { label: "Tornillo", icon: "🔩", target: "metal" },
    { label: "Bollo de papel", icon: "📄", target: "papel" },
    { label: "Caja de carton", icon: "📦", target: "papel" },
    { label: "Botella de plastico", icon: "🧴", target: "plastico" },
    { label: "Tapitas de plastico", icon: "🔵", target: "plastico" },
  ];
  const bins = [
    { id: "papel", label: "Papel", color: "azul" },
    { id: "plastico", label: "Plastico", color: "amarillo" },
    { id: "metal", label: "Metal", color: "verde" },
  ];
  let current = 0;
  const sorted = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Mira el objeto y elige el contenedor donde va guardado: papel, plastico o metal."))}
      <p class="challenge-note">Objetivo: mira el objeto marcado y elige el tacho correcto.</p>
      <div class="sort-layout">
        <div class="sort-current" data-current></div>
        <div class="sort-bins">
          ${bins.map((bin) => `
            <button class="sort-bin sort-bin-${bin.color}" type="button" data-bin="${bin.id}">
              <span aria-hidden="true">♻</span>
              <strong>${bin.label}</strong>
            </button>
          `).join("")}
        </div>
        <div class="sort-progress" data-progress></div>
      </div>
      <p class="challenge-message" data-message>Empieza por el objeto marcado. Piensa de que material esta hecho.</p>
    </article>
  `;

  const currentNode = challengeContent.querySelector("[data-current]");
  const progressNode = challengeContent.querySelector("[data-progress]");

  function renderSort() {
    const item = items[current];
    currentNode.innerHTML = item
      ? `<span class="sort-current-icon" aria-hidden="true">${item.icon}</span><strong>${item.label}</strong><span>${current + 1}/${items.length}</span>`
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
        setMessage("Casi. Mira si el objeto es papel, plastico o metal.", "is-error");
        return;
      }
      sorted.add(current);
      current += 1;
      renderSort();
      if (sorted.size === items.length) {
        setMessage("Reciclaje completo. Separaste todos los objetos por material.", "is-success");
        completeChallenge(id);
      } else {
        setMessage("Bien. Vamos con el siguiente objeto.", "is-good");
      }
    });
  });

  renderSort();
}

function renderSequenceMemoryChallenge(id = 1) {
  const sequence = ["azul", "amarillo", "azul", "verde"];
  const labels = { azul: "Azul", amarillo: "Naranja", verde: "Verde" };
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
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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
    avanzar: { label: "Avanzar", command: "Avanzar" },
    derecha: { label: "Girar derecha", command: "Girar derecha" },
    izquierda: { label: "Girar izquierda", command: "Girar izquierda" },
    esperar: { label: "Esperar" },
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
              ${command.command ? renderCommand(command.command) : `<strong>${command.label}</strong>`}
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
    { key: "forward", label: "Avanzar", command: "Avanzar" },
    { key: "right", label: "Derecha", command: "Girar derecha" },
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
          <button class="mini-flip-card" type="button" data-card="${index}" data-key="${card.key}" data-label="${card.label}" data-icon="${card.icon || ""}" data-command-card="${card.command || ""}">?</button>
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
      button.innerHTML = button.dataset.commandCard
        ? renderCommand(button.dataset.commandCard)
        : `<span>${button.dataset.icon}</span><strong>${button.dataset.label}</strong>`;

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
        setMessage("Casi. Senala con la vista cada bateria y vuelve a contar.", "is-error");
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
  const collectedBatteries = new Set();

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
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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
    if (batteries.has(key)) collectedBatteries.add(key);

    cells.forEach((cell, cellKeyValue) => {
      cell.classList.remove("is-robot", "is-trail");
      const hasCollectedBattery = collectedBatteries.has(cellKeyValue);
      cell.classList.toggle("is-treasure", batteries.has(cellKeyValue) && !hasCollectedBattery);
      cell.textContent = hasCollectedBattery ? "" : cell.dataset.baseText || "";
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
    collectedBatteries.clear();
    for (const [index, key] of route.slice(0, routeLimit + 1).entries()) {
      paintRobot(key);
      if (index > 0) playRobotMoveSound();
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
    collectedBatteries.clear();
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
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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
  const problems = [
    { id: "lluvia", event: "Llueve", icon: "\uD83C\uDF27\uFE0F", detail: "Paisaje con lluvia", answer: "paraguas" },
    { id: "frio", event: "Hace fr\u00edo", icon: "\uD83E\uDD76", detail: "Ni\u00f1o temblando de fr\u00edo", answer: "abrigo" },
    { id: "dientes", event: "Dientes sucios", icon: "\uD83E\uDDB7", detail: "Boca con dientes sucios", answer: "cepillo" },
    { id: "calor", event: "Hace calor", icon: "\uD83E\uDD75", detail: "Ni\u00f1o sudando por el calor", answer: "agua" },
  ];
  const solutions = [
    { id: "paraguas", label: "Paraguas", icon: "\u2602\uFE0F" },
    { id: "abrigo", label: "Abrigo", icon: "\uD83E\uDDE5" },
    { id: "cepillo", label: "Cepillo", icon: "\uD83E\uDEA5" },
    { id: "agua", label: "Agua", icon: "\uD83D\uDCA7" },
  ];
  const solutionsById = Object.fromEntries(solutions.map((solution) => [solution.id, solution]));
  const pairs = new Map();
  let selectedProblem = 0;

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Observa la situaci\u00f3n y une las parejas correctas."))}
      <p class="challenge-note">Objetivo: unir cada problema visual con su soluci\u00f3n.</p>
      <div class="match-layout" data-match-layout>
        <div class="match-column match-problems" data-problems aria-label="Problemas visuales"></div>
        <div class="match-column match-solutions" data-solutions aria-label="Soluciones"></div>
      </div>
      <div class="choose-command-progress" data-progress></div>
      <p class="challenge-message" data-message>Toca un problema y despu\u00e9s su soluci\u00f3n.</p>
    </article>
  `;

  const problemsNode = challengeContent.querySelector("[data-problems]");
  const solutionsNode = challengeContent.querySelector("[data-solutions]");
  const progressNode = challengeContent.querySelector("[data-progress]");

  function renderPairs() {
    const usedSolutions = new Set(pairs.values());
    problemsNode.innerHTML = problems.map((problem, index) => {
      const matchedSolution = pairs.get(problem.id);
      return `
        <button class="match-card ${selectedProblem === index ? "is-selected" : ""} ${matchedSolution ? "is-matched" : ""}" type="button" data-problem="${index}">
          <span aria-hidden="true">${problem.icon}</span>
          <div>
            <strong>${problem.event}</strong>
            <p>${problem.detail}</p>
            <small>${matchedSolution ? solutionsById[matchedSolution].label : "Sin unir"}</small>
          </div>
        </button>
      `;
    }).join("");
    solutionsNode.innerHTML = solutions.map((solution) => `
      <button class="match-card match-solution ${usedSolutions.has(solution.id) ? "is-matched" : ""}" type="button" data-solution="${solution.id}">
        <span aria-hidden="true">${solution.icon}</span>
        <strong>${solution.label}</strong>
      </button>
    `).join("");
    progressNode.innerHTML = problems.map((_, index) => `<span class="${pairs.has(problems[index].id) ? "is-done" : selectedProblem === index ? "is-current" : ""}">${index + 1}</span>`).join("");

    problemsNode.querySelectorAll("[data-problem]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedProblem = Number(button.dataset.problem);
        renderPairs();
        setMessage("Ahora toca la soluci\u00f3n que corresponde.", "is-good");
      });
    });
    solutionsNode.querySelectorAll("[data-solution]").forEach((button) => {
      button.addEventListener("click", () => {
        const problem = problems[selectedProblem];
        if (!problem) return;
        if (button.dataset.solution !== problem.answer) {
          setMessage("Casi. Esa soluci\u00f3n no corresponde a este problema visual.", "is-error");
          return;
        }
        pairs.set(problem.id, button.dataset.solution);
        const next = problems.findIndex((candidate) => !pairs.has(candidate.id));
        selectedProblem = next === -1 ? selectedProblem : next;
        renderPairs();
        if (pairs.size === problems.length) {
          setMessage("Parejas completas. Uniste cada problema con su soluci\u00f3n.", "is-success");
          completeChallenge(id);
          return;
        }
        setMessage("Correcto. Seguimos con otra pareja.", "is-good");
      });
    });
  }

  renderPairs();
}

function renderEventActionChallengeLegacy(id = 1) {
  const scenes = [
    { event: "Llueve", icon: "🌧️", detail: "Paisaje con lluvia", answer: "paraguas" },
    { event: "Hace frio", icon: "🥶", detail: "Nino temblando de frio", answer: "abrigo" },
    { event: "Dientes sucios", icon: "🦷", detail: "Boca con dientes sucios", answer: "cepillo" },
    { event: "Hace calor", icon: "🥵", detail: "Nino sudando por el calor", answer: "agua" },
  ];
  const solutions = [
    { id: "paraguas", label: "Paraguas", icon: "☂️" },
    { id: "abrigo", label: "Abrigo", icon: "🧥" },
    { id: "cepillo", label: "Cepillo", icon: "🪥" },
    { id: "agua", label: "Agua", icon: "💧" },
  ];
  let current = 0;
  const done = new Set();

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Observa la situacion y une la pareja correcta."))}
      <p class="challenge-note">Objetivo: elegir la solucion que corresponde a cada problema visual.</p>
      <div class="event-layout">
        <div class="event-card" data-event></div>
        <div class="event-options">
          ${solutions.map((solution) => `
            <button type="button" data-event-action="${solution.id}">
              <span aria-hidden="true">${solution.icon}</span>
              <strong>${solution.label}</strong>
            </button>
          `).join("")}
        </div>
        <div class="choose-command-progress" data-progress></div>
      </div>
      <p class="challenge-message" data-message>Mira el problema y elige la solucion correcta.</p>
    </article>
  `;

  const eventNode = challengeContent.querySelector("[data-event]");
  const progressNode = challengeContent.querySelector("[data-progress]");

  function renderEvent() {
    const scene = scenes[current];
    eventNode.innerHTML = `
      <span aria-hidden="true">${scene.icon}</span>
      <div>
        <strong>${scene.event}</strong>
        <p>${scene.detail}</p>
      </div>
    `;
    progressNode.innerHTML = scenes.map((_, index) => `<span class="${index === current ? "is-current" : ""} ${done.has(index) ? "is-done" : ""}">${index + 1}</span>`).join("");
  }

  challengeContent.querySelectorAll("[data-event-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.eventAction !== scenes[current].answer) {
        setMessage("Casi. Piensa que solucion ayuda en esta situacion.", "is-error");
        return;
      }
      done.add(current);
      if (done.size === scenes.length) {
        renderEvent();
        setMessage("Parejas completas. Encontraste cada solucion correcta.", "is-success");
        completeChallenge(id);
        return;
      }
      current = scenes.findIndex((_, index) => !done.has(index));
      renderEvent();
      setMessage("Correcto. Vamos con otra situacion.", "is-good");
    });
  });

  renderEvent();
}

function renderOddOneOutChallenge(id = 1) {
  const scenes = [
    { items: ["Avanzar", "Girar derecha", "Avanzar", "Avanzar"], answer: 1, commands: true, iconOnly: true },
    { items: ["🪛", "🔋", "🔋", "🔋"], answer: 0 },
    { items: ["🚧", "🚧", "🕵️", "🚧"], answer: 2 },
    { items: ["😊", "😊", "😊", "😠"], answer: 3 },
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
    const scene = scenes[current];
    oddNode.innerHTML = scene.items.map((item, index) => `
      <button class="mini-choice-card ${scene.iconOnly ? "is-icon-only" : ""}" type="button" data-odd="${index}">
        ${scene.commands ? renderCommand(item) : item}
      </button>
    `).join("");
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
    { icon: "⚙️", count: 1 },
    { icon: "🪛", count: 3 },
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
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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
    { id: "small", label: "Mercurio", icon: "🌑", order: 0 },
    { id: "medium", label: "La Tierra", icon: "🌍", order: 1 },
    { id: "large", label: "Saturno", icon: "🪐", order: 2 },
  ];
  const bank = [sizes[2], sizes[0], sizes[1]];
  const placed = [];

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Ordena los planetas del mas chico al mas grande."))}
      <p class="challenge-note">Objetivo: toca primero Mercurio, luego la Tierra y finalmente Saturno.</p>
      <div class="size-order-layout">
        <div class="size-bank" data-size-bank></div>
        <div class="size-slots" data-size-slots></div>
      </div>
      <div class="challenge-actions">
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
      </div>
      <p class="challenge-message" data-message>Primero el planeta chico, despues el mediano y al final el grande.</p>
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
      setMessage("Orden correcto. Mercurio, la Tierra y Saturno quedaron de chico a grande.", "is-success");
      completeChallenge(id);
    } else {
      setMessage("Casi. Mira el tamano de cada planeta y vuelve a ordenar.", "is-error");
    }
  });

  challengeContent.querySelector("[data-reset]").addEventListener("click", () => {
    placed.length = 0;
    renderSize();
    setMessage("Volvemos a ordenar los planetas de chico a grande.");
  });

  renderSize();
}

function renderFindBugChallenge(id = 1) {
  const program = [
    { label: "Avanzar", command: "Avanzar", bug: false },
    { label: "Avanzar", command: "Avanzar", bug: false },
    { label: "Girar derecha", command: "Girar derecha", bug: true },
    { label: "Avanzar", command: "Avanzar", bug: false },
  ];

  challengeContent.innerHTML = `
    <article class="challenge-card">
      ${renderHeader(id, getChallengeInstruction(id, "Nano quiere llegar a su base, pero hay una flecha equivocada en el camino."))}
      <p class="challenge-note">Objetivo: para llegar a la base necesita cuatro pasos rectos. Toca la ficha que rompe el camino.</p>
      <div class="bug-program">
        ${program.map((step, index) => `
          <button type="button" data-bug="${step.bug}" data-index="${index}">
            ${renderCommand(step.command)}
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
        setMessage("Esa flecha ayuda a Nano a avanzar. Busca la que lo hace girar.", "is-error");
        return;
      }
      button.classList.add("is-correct");
      button.innerHTML = renderCommand("Avanzar");
      setMessage("Bug encontrado. Cambiaste el giro por avanzar y Nano puede llegar a su base.", "is-success");
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
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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
      options: ["cmd-forward", "cmd-turn", "turn-left"],
    },
  ];
  scenes.splice(0, scenes.length, {
    title: "Pasos del robot",
    theme: "commands",
      hint: "Mira el ritmo del robot: avanzar, avanzar y girar.",
    pattern: ["cmd-forward", "cmd-forward", "cmd-turn"],
    sequence: ["cmd-forward", "cmd-forward", null, "cmd-forward", null, "cmd-turn", null, "cmd-forward", "cmd-turn"],
    answers: ["cmd-turn", "cmd-forward", "cmd-forward"],
    options: ["turn-left", "cmd-turn", "cmd-forward"],
  });
  const labels = {
    "tile-blue": "Azul",
    "tile-yellow": "Amarilla",
    "tile-pink": "Rosa",
    "box-small": "Chica",
    "box-large": "Grande",
    "box-tall": "Alta",
    "light-green": "Verde",
    "light-red": "Azul",
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
  };
  const commandItems = {
    "cmd-forward": "Avanzar",
    "cmd-turn": "Girar der.",
    "turn-right": "Girar der.",
    "turn-left": "Girar izq.",
  };
  let sceneIndex = 0;
  let selectedBlank = 0;
  const completedScenes = new Set();

  function itemMarkup(kind) {
    if (commandItems[kind]) {
      return `
        <span class="pattern-item kind-${kind} command-pattern-item design-d4-token" aria-label="${labels[kind]}">
          <span class="design-d4-token-art" aria-hidden="true"></span>
          <strong>${labels[kind]}</strong>
        </span>
      `;
    }

    return `<span class="pattern-item kind-${kind}"><i></i><strong>${labels[kind]}</strong></span>`;
  }

  function blankMarkup(blankIndex, isSelected) {
    return `
      <button type="button" class="pattern-blank graphic-blank design-d4-blank ${isSelected ? "is-selected" : ""}" data-blank="${blankIndex}">
        ?
      </button>
    `;
  }

  function renderScene() {
    const scene = scenes[sceneIndex];
    selectedBlank = 0;
    let blankIndex = 0;

    challengeContent.innerHTML = `
      <article class="challenge-card design-challenge-v4">
        <div class="design-d4-masthead">
          <img class="design-d4-speech" src="${DESIGN_D4_ASSET_BASE}/Burbubja%20de%20dialogo.png" alt="Observa los pasos Nano: avanzar, avanzar y girar." />
          <img class="design-d4-title" src="${DESIGN_D4_ASSET_BASE}/titulo%20y%20consigna.png" alt="A descubrir el patron. Completa la serie logica y elige las tarjetas correctas para terminar el algoritmo." />
          <p class="sr-only">${scene.hint}</p>
        </div>
        <div class="pattern-visual-layout pattern-scene pattern-theme-${scene.theme} design-d4-layout">
          ${scenes.length > 1 ? `
            <div class="pattern-progress" aria-label="Escenarios completados">
              ${scenes.map((item, index) => `
                <button class="${index === sceneIndex ? "is-active" : ""} ${completedScenes.has(index) ? "is-done" : ""}" type="button" data-scene="${index}">
                  ${index + 1}
                </button>
              `).join("")}
            </div>
          ` : ""}
          <img class="design-d4-robot" src="${DESIGN_D4_ASSET_BASE}/Robto%20Nano.png" alt="" />
          <section class="pattern-section pattern-model-section design-d4-pattern-panel" aria-labelledby="pattern-model-title">
            <h3 id="pattern-model-title">Patron</h3>
            <div class="pattern-preview" aria-label="Bloque que se repite">
              ${scene.pattern.map(itemMarkup).join("")}
            </div>
          </section>
          <section class="pattern-section pattern-complete-section design-d4-sequence-panel" aria-labelledby="pattern-complete-title">
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
          <section class="pattern-section pattern-actions-section design-d4-options-panel" aria-labelledby="pattern-actions-title">
            <h3 id="pattern-actions-title">Tarjetas de programacion</h3>
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
          <button class="primary-action" type="button" data-check>COMPROBAR</button>
          <button class="secondary-action" type="button" data-reset>REINICIAR</button>
        </div>
        <img class="design-d4-logo" src="${DESIGN_D4_ASSET_BASE}/Logo.png" alt="BeTech" />
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
    { id: "bateria", label: "Bateria", icon: "🔋", target: "D2" },
    { id: "llave", label: "Recarga de energia", icon: "⚡", target: "D5" },
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
  "light-red": "Azul",
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
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
        <button class="secondary-action" type="button" data-reset>REINICIAR</button>
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
        <button class="primary-action" type="button" data-check>COMPROBAR</button>
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

function isScratchStandaloneLevel(levelNumber) {
  return levelNumber >= 7 && levelNumber <= 10;
}

function redirectToScratchLevel() {
  window.location.replace(`scratch-nivel.html?nivel=${level}`);
}

function openStandaloneLevel() {
  challengeShell?.classList.add("is-open");
  if (isScratchStandaloneLevel(level)) {
    redirectToScratchLevel();
    return;
  }
  if (level === 5) renderCoordinatesChallenge();
  if (level === 6) renderLevel6Lights();
  if (level === 7) renderLevel7Factory();
  if (level === 8) renderLevel8Circuit();
  if (level === 9) renderLevel9Memory();
  if (level === 10) renderLevel10Lock();
}

async function initializeLevelPage() {
  initializeSoundControls();
  if (isScratchStandaloneLevel(level)) {
    redirectToScratchLevel();
    return;
  }
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

  const initialChallenge = Number.isInteger(requestedChallenge)
    ? resolveChallengeInternalNumber(requestedChallenge)
    : 1;

  if (challenges.length) {
    openChallenge(initialChallenge);
    return;
  }

  if (level === 4) {
    openChallenge(initialChallenge);
    return;
  }

  openStandaloneLevel();
}

if (challengeContent && challengeShell) {
  initializeLevelPage();
}
