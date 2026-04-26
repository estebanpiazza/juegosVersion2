# Guia base para niveles 4 a 10

Este documento sirve como base de diseno para desarrollar los niveles de primer grado a septimo grado dentro del juego. No define niveles finales ni consignas cerradas; organiza la progresion pedagogica, la dificultad, el storytelling y los tipos de desafios que conviene usar.

## Mapeo general

| Nivel del juego | Grado escolar | Rol dentro de la progresion |
| --- | --- | --- |
| Nivel 4 | 1er grado | Primer contacto con algoritmos visuales, secuencias y grillas simples. |
| Nivel 5 | 2do grado | Secuencias mas largas, repeticion simple y rutas con objetivos intermedios. |
| Nivel 6 | 3er grado | Repeticion como herramienta, patrones, eventos simples y primeros condicionales visuales. |
| Nivel 7 | 4to grado | Condicionales if/else, clasificacion, depuracion con mas de un error y procedimientos simples. |
| Nivel 8 | 5to grado | Variables como estado, contadores, bucles con condicion y logica booleana inicial. |
| Nivel 9 | 6to grado | Funciones, descomposicion, datos simples, condicionales combinados y estrategias de prueba. |
| Nivel 10 | 7mo grado | Integracion: disenar, probar, optimizar y justificar soluciones con varios conceptos juntos. |

## Storytelling general

La historia puede funcionar como una aventura de tecnologia progresiva: el alumno acompana a un robot aprendiz que debe recuperar energia, ordenar sistemas y reconstruir una red inteligente. Cada grado representa una zona nueva del mundo, con problemas mas complejos.

El objetivo narrativo no deberia ser solo decorativo. Cada concepto puede aparecer como una herramienta nueva que el robot aprende:

- Secuencia: el robot aprende a seguir instrucciones en orden.
- Depuracion: el robot aprende a detectar y corregir fallas.
- Repeticion: el robot descubre que puede ahorrar pasos repitiendo acciones.
- Condicional: el robot empieza a tomar decisiones segun lo que ve.
- Variables: el robot recuerda informacion, cuenta objetos o guarda energia.
- Funciones: el robot crea "rutinas" reutilizables para resolver partes del problema.
- Optimizacion: el robot compara soluciones y busca una forma mas clara o eficiente.

### Arco narrativo sugerido

| Nivel | Zona narrativa | Conflicto narrativo | Herramienta nueva |
| --- | --- | --- | --- |
| 4 | Taller del robot | El robot se activa y necesita aprender a moverse. | Instrucciones en orden. |
| 5 | Ciudad de rutas | Hay que entregar baterias siguiendo caminos mas largos. | Repetir pasos y dividir recorridos. |
| 6 | Jardin de patrones | Los sistemas funcionan con ritmos y ciclos. | Bucles y eventos simples. |
| 7 | Fabrica logica | Las maquinas clasifican objetos y toman decisiones. | Condicionales if/else. |
| 8 | Central de energia | El robot debe controlar energia, contadores y sensores. | Variables y condiciones de parada. |
| 9 | Laboratorio de datos | Hay informacion que ordenar, comparar y transformar. | Funciones, tablas y estrategias. |
| 10 | Mision final | Se integran todos los sistemas para abrir la red principal. | Proyecto/desafio integrador. |

## Principios de progresion

La dificultad deberia subir por combinacion de factores, no solamente por hacer grillas mas grandes.

- Aumentar cantidad de pasos: de 3-5 instrucciones a programas de 15+ instrucciones.
- Reducir ayuda visual: primero camino marcado, luego hitos, luego solo objetivo final.
- Agregar restricciones: maximo de bloques, bloques obligatorios, energia limitada, intentos limitados.
- Agregar abstraccion: pasar de acciones concretas a repetir, decidir, contar y reutilizar rutinas.
- Aumentar depuracion: de un error visible a varios errores, errores de orden o errores de logica.
- Aumentar toma de decisiones: primero elegir entre dos comandos, luego construir una estrategia completa.
- Cambiar feedback: primero pistas directas, luego simulacion paso a paso, luego pistas por estado del sistema.

## Tipos de desafio

### Tipos ya alineados con el nivel 4 actual

Estos tipos ya aparecen en `contenido/nivel-4-seccion-1.json` y/o tienen renderers asociados en `app.js`.

| Tipo | Uso principal | Conceptos |
| --- | --- | --- |
| `secuenciacion-guiada` | Completar pasos faltantes sobre un camino marcado. | Orden, direccion, lectura de instrucciones. |
| `depuracion-inicial` | Encontrar y reemplazar una linea incorrecta. | Bug, prueba, correccion. |
| `programacion-por-bloques` | Construir una ruta con bloques de accion. | Algoritmo, secuencia, orientacion, repeticion inicial. |
| `patrones-de-comandos` | Completar una serie repetida de comandos. | Patron, ciclo, anticipacion. |
| `mapa-en-grilla` | Ubicar puntos o planear rutas en coordenadas simples. | Filas, columnas, posicion, ruta. |

### Tipos propuestos para niveles futuros

Estos nombres son sugerencias de diseno. No implican que ya esten implementados.

| Tipo propuesto | Concepto central | Ideal para |
| --- | --- | --- |
| `repeticion-obligatoria` | Usar repetir para ahorrar bloques. | Niveles 5-6. |
| `repeticion-anidada` | Repetir dentro de repetir. | Niveles 6-8. |
| `evento-respuesta` | Hacer algo cuando ocurre un evento. | Niveles 6-7. |
| `condicional-si-entonces` | Si pasa X, hacer Y. | Niveles 6-7. |
| `condicional-si-sino` | Elegir entre dos caminos. | Niveles 7-8. |
| `sensor-obstaculo` | Decidir segun una lectura del entorno. | Niveles 7-9. |
| `variable-contador` | Contar pasos, objetos, energia o intentos. | Niveles 8-10. |
| `bucle-hasta` | Repetir hasta llegar a una condicion. | Niveles 8-10. |
| `funcion-rutina` | Crear una rutina reutilizable. | Niveles 7-10. |
| `tabla-datos` | Leer o completar datos simples. | Niveles 8-10. |
| `optimizacion-programa` | Resolver con menos bloques o menos energia. | Niveles 8-10. |
| `desafio-integrador` | Combinar conceptos en una mision completa. | Nivel 10. |

## Progresion por grado

### Nivel 4 - Primer grado

Foco: entender que un algoritmo es una lista de pasos en orden.

Conceptos:

- Secuencia.
- Direccion: avanzar, girar derecha, girar izquierda.
- Orden de instrucciones.
- Patron visual simple.
- Ubicacion en grilla basica.
- Depuracion de un error evidente.

Tipos de desafios recomendados:

- Secuenciacion guiada con camino marcado.
- Completar comandos faltantes.
- Depurar una linea incorrecta.
- Programacion por bloques con pocos comandos.
- Mapa en grilla con coordenadas A-F / 1-6.

Dificultad sugerida:

- Grillas 5x5 o 6x6.
- 3 a 8 acciones.
- 1 error por desafio.
- Feedback muy directo y visual.

Storytelling:

- El robot se despierta en el taller.
- Aprende a moverse, cargar energia y llegar a una meta.
- Cada desafio desbloquea una pieza: motor, bateria, mapa, antena.

### Nivel 5 - Segundo grado

Foco: construir secuencias mas largas y empezar a reconocer repeticiones utiles.

Conceptos:

- Secuencias con mas pasos.
- Repetir 2, 3 o 4 veces.
- Objetivos intermedios.
- Descomposicion simple: primero llave, despues puerta, despues meta.
- Depuracion de orden: una instruccion correcta en lugar incorrecto.

Tipos de desafios recomendados:

- Programacion por bloques con limite de bloques.
- Repeticion obligatoria.
- Rutas con hitos.
- Depuracion con dos posibles errores, pero uno solo real.
- Grillas con obstaculos y recompensas.

Dificultad sugerida:

- Grillas 6x6 o 7x7.
- 8 a 12 acciones reales.
- Uso obligatorio de un bloque repetir.
- Menos camino marcado; mas objetivos visibles.

Storytelling:

- El robot entra a la ciudad de rutas.
- Debe repartir baterias o mensajes en varios puntos.
- La repeticion aparece como "atajo inteligente" para no escribir tantos pasos.

### Nivel 6 - Tercer grado

Foco: usar repeticion de forma consciente e introducir decisiones visuales simples.

Conceptos:

- Bucles simples.
- Patrones mas largos.
- Eventos: cuando se abre una puerta, cuando se toca una ficha, cuando se presiona un boton.
- Primer condicional: si hay obstaculo, girar.
- Comparacion de soluciones: funciona vs. funciona con menos bloques.

Tipos de desafios recomendados:

- Patrones de comandos con huecos.
- Repeticion obligatoria.
- Evento-respuesta.
- Condicional si-entonces con apoyo visual.
- Depuracion de bucles: cantidad de repeticiones incorrecta.

Dificultad sugerida:

- Grillas 7x7.
- Programas de 10 a 14 acciones.
- 1 bucle por solucion.
- Condicionales con una sola condicion clara.

Storytelling:

- El robot llega al jardin de patrones.
- Hay luces, puertas y caminos que se activan con ritmos.
- El mundo ensena que algunas acciones se repiten y otras dependen de lo que sucede.

### Nivel 7 - Cuarto grado

Foco: tomar decisiones con if/else y organizar soluciones en pequenas rutinas.

Conceptos:

- Condicional si/sino.
- Clasificacion por atributos: color, forma, tamano, destino.
- Procedimientos simples: crear una rutina para un patron frecuente.
- Depuracion de condiciones.
- Lectura de estados: abierto/cerrado, encendido/apagado, lleno/vacio.

Tipos de desafios recomendados:

- Clasificacion en fabrica.
- Condicional si-sino.
- Funcion-rutina inicial.
- Sensor-obstaculo.
- Depuracion de reglas: condicion incorrecta o accion equivocada.

Dificultad sugerida:

- Grillas 7x7 u 8x8.
- 2 caminos posibles.
- 2 o 3 atributos visuales.
- Programas con una rutina reutilizable.

Storytelling:

- El robot trabaja en una fabrica logica.
- Debe clasificar cajas, activar maquinas y elegir rutas segun reglas.
- El conflicto central es decidir bien, no solo moverse bien.

### Nivel 8 - Quinto grado

Foco: guardar informacion y controlar procesos con variables, contadores y condiciones.

Conceptos:

- Variable como memoria del sistema.
- Contador: energia, piezas, intentos, pasos, puntos.
- Bucle hasta: repetir hasta llenar energia, llegar a meta o juntar 3 piezas.
- Logica booleana inicial: y, o, no.
- Optimizacion basica.

Tipos de desafios recomendados:

- Variable-contador.
- Bucle-hasta.
- Circuitos de switches.
- Sensor-obstaculo con energia limitada.
- Optimizacion de programa.

Dificultad sugerida:

- Grillas 8x8.
- Programas de 12 a 18 acciones.
- Restricciones de energia o cantidad maxima de bloques.
- Estados persistentes que cambian durante la ejecucion.

Storytelling:

- El robot llega a la central de energia.
- Tiene que administrar recursos y no solo completar rutas.
- La variable se presenta como "lo que el robot recuerda".

### Nivel 9 - Sexto grado

Foco: descomponer problemas, reutilizar funciones y trabajar con datos simples.

Conceptos:

- Funcion o rutina reutilizable.
- Parametros iniciales de forma visual: rutina con direccion, color o cantidad.
- Tablas de datos simples.
- Condicionales combinados.
- Estrategia de prueba: probar, observar, ajustar.
- Depuracion de logica, no solo de comandos.

Tipos de desafios recomendados:

- Funcion-rutina.
- Tabla-datos.
- Condicionales combinados.
- Memoria de pares con reglas.
- Diagnostico de programas: elegir por que falla.

Dificultad sugerida:

- Grillas 8x8 o 9x9.
- 2 rutinas reutilizables.
- 2 condiciones que interactuan.
- Informacion parcial que se debe leer antes de programar.

Storytelling:

- El robot entra al laboratorio de datos.
- Debe interpretar registros, ordenar informacion y reparar procesos.
- La historia puede pedirle que no solo ejecute, sino que explique la estrategia.

### Nivel 10 - Septimo grado

Foco: integrar conceptos y resolver misiones mas abiertas con prueba, depuracion y optimizacion.

Conceptos:

- Secuencia, repeticion, condicional, variable y funcion combinadas.
- Diseno de algoritmo.
- Casos de prueba.
- Optimizacion.
- Abstraccion: reconocer partes repetidas del problema.
- Justificacion de solucion: por que este programa funciona.

Tipos de desafios recomendados:

- Desafio integrador.
- Optimizacion de programa.
- Debug avanzado.
- Bucle hasta con sensores.
- Mini proyecto guiado por etapas.

Dificultad sugerida:

- Grillas 9x9 o escenarios por etapas.
- Varias soluciones posibles.
- Restricciones combinadas: energia, bloques, llaves, puertas, sensores.
- Feedback menos directo: mostrar ejecucion y estado final para que el alumno infiera el error.

Storytelling:

- Mision final para reactivar la red principal.
- Cada zona anterior aporta una habilidad.
- El ultimo tramo puede dividirse en etapas: diagnosticar, planear, programar, probar y optimizar.

## Estructura sugerida para cada nivel

Cada nivel podria tener entre 4 y 6 desafios. Una estructura estable ayuda a que el alumno entienda el ritmo:

1. Activacion: desafio corto que presenta el concepto del nivel.
2. Practica guiada: mismo concepto con mas pasos y ayuda visual.
3. Aplicacion: resolver una situacion nueva con menos ayuda.
4. Depuracion: encontrar por que una solucion falla.
5. Mision narrativa: combinar lo aprendido en un problema mas completo.
6. Extra opcional: optimizacion, menor cantidad de bloques o desafio de estrella.

## Plantilla para disenar un desafio

Usar esta plantilla antes de crear el JSON o el renderer:

```txt
Nivel:
Grado:
Titulo:
Tipo:
Concepto principal:
Conceptos secundarios:
Momento narrativo:
Consigna para el alumno:
Objetivo pedagogico:
Pantalla:
Interaccion:
Comandos o piezas disponibles:
Restricciones:
Condicion de exito:
Errores esperados:
Feedback si acierta:
Feedback si falla:
Variantes faciles:
Variantes dificiles:
Notas de implementacion:
```

## Formato JSON recomendado

El nivel 4 actual usa una estructura simple con `grado`, `seccion`, `objetivo` y `desafios`. Para los proximos niveles conviene mantener esa base y sumar campos opcionales, sin romper lo existente.

```json
{
  "grado": 5,
  "seccion": 1,
  "historia": {
    "zona": "Ciudad de rutas",
    "objetivoNarrativo": "Entregar baterias para reactivar los puentes",
    "personaje": "Robot aprendiz"
  },
  "objetivo": "Usar secuencias mas largas y bloques de repeticion para resolver rutas con objetivos intermedios.",
  "conceptos": ["secuencia", "repeticion", "descomposicion", "depuracion"],
  "desafios": [
    {
      "id": "n5-s1-d1",
      "titulo": "Nombre provisorio",
      "tipo": "repeticion-obligatoria",
      "conceptoPrincipal": "repeticion",
      "consigna": "Consigna breve para el alumno.",
      "objetivo": "Objetivo pedagogico.",
      "pantalla": "Descripcion visual.",
      "interaccion": "Que hace el alumno.",
      "restricciones": ["Usar repetir al menos una vez"],
      "feedback": "Como responde el juego.",
      "variantes": ["Version facil", "Version dificil"]
    }
  ]
}
```

## Conceptos que se pueden incorporar

Ademas de repeticion y condicionales, estos conceptos encajan bien con este tipo de juego:

- Secuenciacion.
- Depuracion.
- Patrones.
- Coordenadas y orientacion espacial.
- Descomposicion de problemas.
- Eventos.
- Bucles con cantidad fija.
- Bucles hasta cumplir condicion.
- Condicional if.
- Condicional if/else.
- Sensores o estados del entorno.
- Variables.
- Contadores.
- Logica booleana: y, o, no.
- Funciones o rutinas.
- Parametros visuales.
- Datos en tablas simples.
- Optimizacion.
- Casos de prueba.
- Abstraccion.

## Recomendacion de implementacion gradual

Para no agrandar demasiado el desarrollo, conviene avanzar asi:

1. Consolidar nivel 4 como modelo de estructura: varios desafios por JSON.
2. Crear nivel 5 con tipos existentes y solo una mecanica nueva: repeticion obligatoria.
3. Crear nivel 6 con bucles y un condicional visual simple.
4. Crear nivel 7 con clasificacion y si/sino.
5. Crear nivel 8 con contador o energia.
6. Crear nivel 9 con rutinas reutilizables y datos simples.
7. Crear nivel 10 como integrador, reutilizando mecanicas anteriores antes de crear mecanicas nuevas.

La clave es que cada nivel agregue una idea nueva, pero siga usando ideas anteriores para que la dificultad crezca de manera acumulativa.
