# Scratch BeTech

Este directorio contiene los assets y la preparacion para los niveles 7 a 10.

- `nano-scratch.png`: version reducida de Nano para usar como sprite de Scratch.
- `nano-starter.sb3`: proyecto base con Stage + Nano.
- `editor/`: build web mínimo y publicable del editor, con Nano como proyecto inicial.
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

La app abre primero `scratch/editor/index.html`, que sí forma parte del sitio publicado.
La carpeta de desarrollo `scratch-editor/` permanece ignorada para no subir los 270 MB completos del build.
Si el editor publicable no está disponible, se usa Scratch GUI oficial alojado como respaldo.
