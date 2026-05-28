# Scratch BeTech

Este directorio contiene los assets y la preparacion para los niveles 7 a 10.

- `nano-scratch.png`: version reducida de Nano para usar como sprite de Scratch.
- `nano-starter.sb3`: proyecto base con Stage + Nano.
- `setup-nano-fork.ps1`: clona `scratchfoundation/scratch-editor` y cambia el proyecto inicial de `scratch-gui` para que arranque con Nano.

Uso sugerido:

```powershell
.\scratch\setup-nano-fork.ps1
cd scratch-editor
npm install
npm start
```

Durante desarrollo, abrir la pantalla con:

```txt
scratch-desafio.html?nivel=7&editor=http://localhost:8601/
```

La app intenta abrir primero `scratch-editor/packages/scratch-gui/build/index.html`.
Si esa build todavia no existe, usa el editor web de Scratch GUI como fallback.
