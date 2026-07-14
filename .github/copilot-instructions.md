# Be Tech – Juegos v2: Guía interna para agregar niveles

Este archivo es la fuente de verdad para agregar desafíos y niveles nuevos al proyecto. Basarse **siempre** en nivel 4 como referencia de implementación correcta.

---

## Arquitectura del proyecto

| Archivo principal | Rol |
|---|---|
| `nivel.html` + `app.js` | Motor de los desafíos interactivos (mini-juegos, tipo y consigna) |
| `jugar-nivel.html` + `jugar-nivel.js` | Motor de grilla/laberinto: Nano navega celdas con tarjetas |
| `generador.html` + `generador.js` | Editor visual para crear archivos JSON de grilla |
| `etapas.html` + `etapas.js` | Vista de etapas/secciones por nivel |
| `index.html` + `home.js` | Home principal |
| `niveles.html` | Selector de niveles de grilla (`niveles/`) |
| `niveles-ods.html` | Selector de niveles ODS (`niveles-ods/`) |

### Flujo de carga

- `nivel.html?nivel=4&desafio=1` → `app.js` carga `contenido/nivel-4-seccion-1.json`, busca el desafio por número/id y llama al renderer según `tipo`.
- `jugar-nivel.html?file=nivel-4-desafio-1.json&carpeta=niveles` → `jugar-nivel.js` carga el JSON de grilla y renderiza el laberinto.

---

## Dos tipos de nivel: challenge vs. laberinto

### Tipo 1 — Challenge / Mini-juego (`contenido/`)

Archivo: `contenido/nivel-N-seccion-1.json`

```json
{
  "grado": 4,
  "seccion": 1,
  "objetivo": "Descripción del objetivo pedagógico del bloque.",
  "desafios": [
    {
      "id": "n4-rework-d1",
      "titulo": "Nombre corto",
      "tipo": "tipo-de-renderer",
      "consigna": "Texto visible al alumno. Frases cortas, entusiastas, con ¡!",
      "objetivo": "Qué aprende el alumno con este desafío.",
      "interaccion": "Cómo interactúa físicamente el alumno."
    }
  ]
}
```

**Reglas de consigna:**
- Empezar con frase de impacto: `¡A ensamblar!`, `¡Alerta!`, `¡Misión...!`
- Tono: entusiasta, cálido, sin tecnicismos para primaria.
- Longitud: 1-2 oraciones máximo.
- Incluir siempre la acción esperada del alumno.

**ID de desafío:** formato `nN-rework-dNN` (nivel 4) o `nN-dNN` (niveles 5+).

---

### Tipo 2 — Laberinto / Grilla (`niveles/` o `niveles-ods/`)

Archivo: `niveles/nivel-4-desafio-1.json`

```json
{
  "autor": "Nombre",
  "tematica": "Texto del header del juego",
  "tema": "virus",
  "nivel": 4,
  "desafio": 1,
  "consigna": "Texto corto con contexto narrativo del laberinto.",
  "grilla": {
    "filas": 3,
    "columnas": 3,
    "celdas": {
      "fila-columna": "tipo-de-celda"
    },
    "robotDireccionInicial": 1
  },
  "algoritmo": {
    "totalSlots": 5,
    "pistas": [
      { "slot": 0, "card": "avanzar" }
    ],
    "tarjetasDisponibles": ["avanzar", "derecha", "izquierda"]
  }
}
```

---

## Reglas de grilla/laberinto

### Tipos de celda

| Tipo | Efecto en juego |
|---|---|
| `empty` | Celda vacía, transitable (fondo blanco) |
| `path` | Camino marcado, transitable |
| `enemy` | Obstáculo — el robot falla si entra |
| `item` | Ítem coleccionable, transitable |
| `start` | Posición inicial del robot (exactamente 1) |
| `goal` | Meta (exactamente 1) |

**Obligatorio:** exactamente 1 `start` y 1 `goal` por grilla.

### Dirección inicial del robot

| Valor | Dirección |
|---|---|
| `0` | ↑ Arriba |
| `1` | → Derecha |
| `2` | ↓ Abajo |
| `3` | ← Izquierda |

### Coordenadas de celda

Formato: `"fila-columna"` con índice 0.  
Ejemplo: `"1-2"` = fila 1 (segunda desde arriba), columna 2 (tercera desde la izquierda).

### Tamaño de grilla por nivel

| Nivel | Grilla recomendada | Slots algoritmo |
|---|---|---|
| Nivel 4 (1er grado) | 3×3 a 4×4 | 2–5 |
| Nivel 5 (2do grado) | 4×4 a 5×5 | 5–9 |
| Nivel 6 (3er grado) | 4×4 a 6×6 | 7–12 |
| ODS | 4×4 | 7–10 |

### Slots y pistas

- `totalSlots`: cantidad total de casillas en el algoritmo.
- `pistas`: casillas pre-rellenas (bloqueadas con 🔒). No abusar — máximo 2 en nivel 4.
- `tarjetasDisponibles`: las tarjetas que aparecen en el banco del jugador.

### Tarjetas disponibles (card IDs)

| ID | Label | Uso |
|---|---|---|
| `avanzar` | Avanzar | Mover 1 celda hacia adelante |
| `derecha` | Derecha | Girar 90° a la derecha |
| `izquierda` | Izquierda | Girar 90° a la izquierda |
| `repetir-x2` | Repetir ×2 | Repetir bloque 2 veces |
| `repetir-x3` | Repetir ×3 | Repetir bloque 3 veces |
| `repetir-x4` | Repetir ×4 | Repetir bloque 4 veces |
| `repetir-x5` | Repetir ×5 | Repetir bloque 5 veces |
| `parentesis-abre` | ( Abre | Inicio de bloque repetición |
| `parentesis-cierra` | ) Cierra | Fin de bloque repetición |

**Aliases aceptados en JSON:** `girar_derecha` → `derecha`, `girar_izquierda` → `izquierda`.

**Nivel 4:** usar solo `avanzar`, `derecha`, `izquierda`. No usar repetición todavía.  
**Nivel 5:** puede incluir `repetir-x2`, `repetir-x3`.  
**Nivel 6+:** puede usar repetición anidada con paréntesis.

---

## Temas visuales para grilla (`tema`)

| Valor `tema` | Imagen enemy | Imagen ítem | Uso narrativo |
|---|---|---|---|
| `virus` | Virus tecnologico.png | BATERIA.png | Nano esquiva virus |
| `clima` | charco.png | Alerta de lluvia.png | Lluvia, charcos |
| `escuela` | (ninguna, emoji 👾) | (ninguna) | Desafíos escolares |
| `ods-educacion` | enemigo-bloqueo.svg | ods-educacion.svg | ODS 4 Educación |
| `ods-agua` | contaminacion.svg | ods-agua.svg | ODS 6 Agua |
| `ods-energia` | derroche-energia.svg | ods-energia.svg | ODS 7 Energía |
| `ods-ciudad` | trafico.svg | ods-ciudad.svg | ODS 11 Ciudad |
| `ods-reciclaje` | basura.svg | ods-reciclaje.svg | ODS 12 Reciclaje |
| `ods-clima` | humo.svg | ods-clima.svg | ODS 13 Clima |

Para agregar un tema nuevo: registrarlo en el objeto `THEMES` de `jugar-nivel.js`.

---

## Tipos de challenge y sus renderers (app.js)

Cada `tipo` en el JSON mapea a una función render en `app.js` via `challengeTypeRenderers`.

### Nivel 4 — renderers existentes y correctos

| Tipo | Renderer | Descripción |
|---|---|---|
| `armado-nano` | `renderNanoAssemblyChallenge` | Armar a Nano arrastrando piezas |
| `clasificar-tecnologia` | `renderTechnologySortChallenge` | Clasificar tecnología vs. otros |
| `buscar-piezas` | `renderHiddenPartsChallenge` | Buscar 5 piezas ocultas (estilo Wally) |
| `elige-flecha-avanzar` | `renderN4ProgrammingCarpetChallenge` | Elegir tarjeta avanzar |
| `elige-flecha-derecha` | `renderN4ProgrammingCarpetChallenge` | Elegir tarjeta girar derecha |
| `elige-flecha-izquierda` | `renderN4ProgrammingCarpetChallenge` | Elegir tarjeta girar izquierda |
| `secuencia-tarjetas-n4` | `renderN4ProgrammingCarpetChallenge` | Secuencia con tarjetas en alfombra |
| `recuperar-destornillador-alfombra` | `renderN4ProgrammingCarpetChallenge` | Ruta en alfombra a destornillador |
| `alerta-lluvia-alfombra` | `renderN4ProgrammingCarpetChallenge` | Ruta en alfombra bajo lluvia |
| `recuperar-tesoro-alfombra` | `renderN4ProgrammingCarpetChallenge` | Ruta en alfombra al tesoro |
| `arrastrar-derecha` | `renderDragRightChallenge` | Arrastrar pieza al lado derecho |
| `patron-color` | `renderColorPatternChallenge` | Completar patrón de colores |
| `patron-formas-cinta` | `renderConveyorShapePatternChallenge` | Cinta transportadora con formas |
| `patron-hardware` | `renderHardwarePatternChallenge` | Patrón de piezas hardware |
| `debug-luces` | `renderLightDebugChallenge` | Encontrar luz incorrecta |
| `reparar-color` | `renderColorRepairChallenge` | Reparar color en secuencia AB |
| `patron-sonidos` | `renderSoundPatternChallenge` | Repetir patrón de sonidos |

### Nivel 5 — renderers existentes

| Tipo | Renderer |
|---|---|
| `n5-clasificar-robots` | `renderN5RobotSortChallenge` |
| `n5-seleccionar-energia` | `renderN5TapSelectionChallenge` |
| `n5-camino-carga` | `renderN5ChargingPathChallenge` |
| `n5-armado-nano` | `renderN5NanoAssemblyChallenge` |
| `n5-programables` | `renderN5TapSelectionChallenge` |
| `n5-herramienta-programar` | `renderN5ProgrammingToolChallenge` |
| `n5-secuencia-avanzar` | `renderN5LinearCommandChallenge` |
| `n5-lavado-manos` | `renderN5HandwashingOrderChallenge` |
| `n5-debug-choque` | `renderN5DebugCrashChallenge` |
| `n5-maquina-autonoma` | `renderN5AutonomousMachineChallenge` |

### Nivel 6 — renderers existentes

| Tipo | Renderer |
|---|---|
| `n6-direccion-inicial` | `renderN6InitialDirectionChallenge` |
| `n6-condicional-meteoritos` | `renderN6MeteorConditionChallenge` |
| `n6-repeticion-estrellas` | `renderN6StarRepetitionChallenge` |
| `n6-ruta-antena` | `renderN6AntennaRouteChallenge` |
| `n6-desvio-crater` | `renderN6CraterDetourChallenge` |
| `n6-debug-satelite` | `renderN6SatelliteDebugChallenge` |
| `n6-repeticion-paneles` | `renderN6SolarRepetitionChallenge` |
| `n6-patron-asteroides` | `renderN6AsteroidPatternChallenge` |

### Tipos genéricos (usables en cualquier nivel)

| Tipo | Renderer |
|---|---|
| `secuenciacion-guiada` | `renderPathChallenge` |
| `depuracion-inicial` | `renderBalanceChallengeV2` |
| `programacion-por-bloques` | `renderRobotChallengeV2` |
| `patrones-de-comandos` | `renderPatternChallengeV2` |
| `mapa-en-grilla` | `renderCoordinatesChallenge` |
| `repeticion-obligatoria` | `renderRepeatRequiredChallenge` |
| `laberinto-flechas` | `renderDesignD6ArrowMazeChallenge` |
| `ordenar-algoritmo` | `renderOrderAlgorithmChallenge` |
| `clasificacion-reglas` | `renderSortingRulesChallenge` |
| `memoria-secuencia` | `renderSequenceMemoryChallenge` |
| `elige-comando` | `renderChooseCommandChallenge` |
| `parejas-robot` | `renderMatchingPairsChallenge` |
| `conteo-baterias` | `renderBatteryCountChallenge` |
| `laberinto-baterias` | `renderBatteryMazeChallenge` |
| `espejo-patron` | `renderMirrorPatternChallenge` |
| `evento-accion` | `renderEventActionChallenge` |
| `intruso-secuencia` | `renderOddOneOutChallenge` |
| `codigo-simbolos` | `renderSymbolCodeChallenge` |
| `ruta-colores` | `renderColorRouteChallenge` |
| `orden-tamano` | `renderSizeOrderChallenge` |
| `encuentra-bug` | `renderFindBugChallenge` |

**Si el tipo no existe en `challengeTypeRenderers`, el desafío no se renderiza.** Siempre verificar que el tipo esté registrado antes de agregar el JSON.

---

## Cómo agregar un desafío challenge nuevo

1. Abrir `contenido/nivel-N-seccion-1.json`.
2. Agregar un objeto al array `desafios` con los campos `id`, `titulo`, `tipo`, `consigna`, `objetivo`, `interaccion`.
3. Verificar que el `tipo` existe en `challengeTypeRenderers` de `app.js`.
4. Si el tipo es nuevo: implementar la función render en `app.js` y registrarla en `challengeTypeRenderers`.
5. Probar con `nivel.html?nivel=N&desafio=X`.

---

## Cómo agregar un nivel laberinto nuevo

1. Crear el JSON en `niveles/` o `niveles-ods/` con la estructura de grilla.
2. Verificar la solución manualmente: el robot debe poder llegar desde `start` a `goal` con exactamente las tarjetas disponibles y los slots dados.
3. Para niveles ODS: registrar el archivo en `niveles-ods/index.json`.
4. Para niveles normales: registrar en `niveles/index.json` (actualmente vacío, no se usa para navegación).
5. Probar con `jugar-nivel.html?file=nombre.json&carpeta=niveles`.

---

## Validación de laberinto (checklist antes de guardar)

- [ ] Exactamente 1 celda `start` y 1 celda `goal`.
- [ ] Existe al menos 1 camino transitable sin `enemy` de `start` a `goal`.
- [ ] `totalSlots` = cantidad exacta de pasos de la solución óptima (o un poco más si hay slots libres).
- [ ] Las `tarjetasDisponibles` incluyen todas las tarjetas necesarias para la solución.
- [ ] Las `pistas` no revelan toda la solución (dejar al menos 1 slot libre).
- [ ] `robotDireccionInicial` apunta en la dirección correcta para el primer movimiento.
- [ ] Grilla no mayor a 6×6 para nivel 4-5.

---

## Progresión pedagógica por nivel

| Nivel (grado) | Zona narrativa | Concepto central | Tipo de tarjetas |
|---|---|---|---|
| 4 (1°) | Taller del robot | Secuencia, orientación, patrón visual | avanzar, derecha, izquierda |
| 5 (2°) | Ciudad de rutas | Repetición simple, objetivos intermedios | + repetir-x2/x3 |
| 6 (3°) | Jardín de patrones | Bucles, eventos, condicional visual simple | + repetir-x4/x5, parentesis |
| 7 (4°) | Fábrica lógica | Condicionales if/else, clasificación | condicional |
| 8 (5°) | Central de energía | Variables, contadores, bucles con condición | variable |
| 9 (6°) | Laboratorio de datos | Funciones, descomposición | función/rutina |
| 10 (7°) | Misión final | Integración, optimización | todos |

### Reglas de dificultad progresiva

- **Más pasos:** de 3-5 acciones (N4) hasta 15+ (N9-10).
- **Menos ayuda visual:** primero camino marcado, luego solo meta visible.
- **Más restricciones:** máximo bloques, bloques obligatorios, energía limitada.
- **Más abstracción:** de acciones concretas a repetir, decidir, contar.
- **Más depuración:** de 1 error evidente a múltiples errores de lógica.

---

## Estilos y diseño visual

### Paleta de colores (CSS custom properties)

```css
--brand-cyan:   #08DBF7   /* celeste robótica */
--brand-blue:   #0A7ABE   /* azul institucional */
--brand-gray:   #58595B   /* textos principales */
--brand-green:  #25D366   /* éxito / verde */
--brand-orange: #F5920A   /* acento / energía */
--color-error:  #e25353   /* error / fallo */
```

### Tipografía

- **Font:** `"Poppins"` (pesos 600, 700, 800, 900).
- Títulos: `font-weight: 800-900`, mayúsculas o frase corta impactante.
- Consigna: `font-weight: 700`, tamaño legible para niños.

### Layout del juego

- `.game-stage` → contenedor principal del desafío visual.
- `.challenge-shell` → el modal/panel donde vive el challenge; debe verse grande dentro de `.game-stage`.
- `.game-workspace` → wrapper del área de trabajo.
- `.game-stage-bg` → imagen de fondo de la etapa.

### Clases especiales por nivel

- Niveles ODS: `body.is-ods-level` + `body.is-ods-compact` se activan automáticamente si `nivel === "ODS"` o `tema` empieza con `ods-`.
- Desafíos N6 con fondo completo (d4-d7): `body:has(.n6-card-d4)` elimina padding y decoraciones del shell.

### Imágenes de Nano

| Variable | Ruta |
|---|---|
| Cabeza Nano (robot en grilla) | `nuevos/No lograste/cabeza Nano.png` |
| Nano celebrando (win) | `nuevos/No lograste/lograste.png` |
| Nano triste (fail) | `nuevos/No lograste/noloraste.png` |
| Nano Norte | `nano assets/norte.png` |
| Nano Este | `nano assets/este.png` |
| Nano Sur | `nano assets/sur.png` |
| Nano Oeste | `nano assets/oeste.png` |

### Assets de diseño de niveles

| Carpeta | Uso |
|---|---|
| `diseño de niveles/DESAFIO 1/` | Fondo DESAFIO 1.png, piezas |
| `diseño de niveles/DESAFIO 2/` | Fondo DESAFIO 2.jpg |
| `diseño de niveles/DESAFIO 3/` | Fondo DESAFIO 3.png |
| `diseño de niveles/DESAFIO 4/` | Fondo DESAFIO 4.png |
| `diseño de niveles/DESAFIO 6/` | Fondo DESAFIO 6.png, Virus, BATERIA |
| `nuevos/CONSIGNA N/` | Assets por consigna individual |
| `tarjetas movimiento/` | Tarjetas: AVANZAR.png, DERECHA.png, IZQUIERDA.png, etc. |
| `assets/ods/` | SVGs de ODS: ods-educacion.svg, etc. |

---

## Ejemplos de referencia correcta (Nivel 4)

### Laberinto mínimo (3×3, tema virus, 2 slots)
```json
{
  "autor": "BeTech",
  "tematica": "Escuela",
  "tema": "virus",
  "nivel": 4,
  "desafio": 1,
  "consigna": "¡Cuidado con los virus! Nano debe esquivarlos para llegar a tiempo. ¿Hacia dónde tiene que girar?",
  "grilla": {
    "filas": 3,
    "columnas": 3,
    "celdas": {
      "0-0": "enemy", "0-1": "enemy", "0-2": "enemy",
      "1-0": "start", "1-1": "path",  "1-2": "goal",
      "2-0": "enemy", "2-1": "enemy", "2-2": "enemy"
    },
    "robotDireccionInicial": 1
  },
  "algoritmo": {
    "totalSlots": 2,
    "pistas": [],
    "tarjetasDisponibles": ["avanzar", "girar_derecha", "derecha"]
  }
}
```

### Challenge challenge tipo alfombra (nivel 4, secuencia)
```json
{
  "id": "n4-rework-d16",
  "titulo": "Recupera el destornillador",
  "tipo": "recuperar-destornillador-alfombra",
  "consigna": "¡AYUDA A NANO! Nano necesita usar el destornillador. Observa los pasos de Nano: avanzar, avanzar y girar.",
  "objetivo": "Programar a Nano sobre la alfombra para conseguir el destornillador.",
  "interaccion": "Completar el algoritmo con Avanzar, Avanzar, Derecha, Avanzar y Avanzar."
}
```

---

## Errores comunes a evitar

1. **Tipo no registrado:** agregar un `tipo` en el JSON sin implementar su renderer → el desafío no aparece.
2. **Grilla sin solución:** crear un laberinto donde no hay camino de `start` a `goal` → el juego no es completable.
3. **totalSlots insuficiente:** si la solución óptima tiene 5 pasos, `totalSlots` no puede ser 3.
4. **tarjetasDisponibles incompletas:** si la solución requiere `izquierda` pero no está en el banco → bloqueado.
5. **Celdas vacías en el camino:** celdas `empty` son transitables; celdas `enemy` no lo son. No confundir.
6. **Repetición en nivel 4:** no usar `repetir-x*` en desafíos de nivel 4; ese concepto es de nivel 5+.
7. **Más de 1 start o goal:** causa comportamiento inesperado del motor.
8. **ID duplicado:** dos desafíos con el mismo `id` en el mismo JSON → solo se carga el primero.

---

## Convenciones de código

- Los renderers se nombran `renderXxxChallenge(id)` donde `Xxx` describe el tipo de desafío.
- Las constantes de assets van al inicio de `app.js` como `const DESIGN_DX_ASSET_BASE = "..."`.
- Los fondos de stage se declaran como `const DESIGN_DX_STAGE_BACKGROUND`.
- Para sonido: usar `soundContext` y `soundMaster` de `app.js` (Web Audio API).
- No usar `alert()` ni `confirm()`. Todo el feedback es visual dentro del DOM.
- URLs de assets con espacios: usar `encodeURIComponent` o `%20` directamente en las constantes.
