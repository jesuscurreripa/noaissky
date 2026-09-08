# No AI’ Sky

[English documentation](GUIDE.en.md) · [Español](GUIDE.md) · [Idiomas / Languages](LANGUAGES.md)

Demo de exploración espacial en Three.js y Vite, con estética retro sci-fi ilustrada. Cada semilla genera nueve mundos: siete admiten aterrizaje y dos gigantes se exploran desde órbita. Incluye vuelo, descenso entre nubes, exploración a pie en tercera persona, escaneo y combate opcional.

**Idiomas: inglés y español.** El interruptor EN / ES cambia la interfaz sin reiniciar la partida y guarda la preferencia. El idioma inicial es inglés si no existe una elección guardada.

## Ejecutar

Entorno recomendado: Node.js 20.19+ y navegador con WebGL2 y aceleración gráfica.

```sh
npm install
npm run dev
```

Abre la dirección local que muestra Vite. Otros comandos:

```sh
npm test
npm run build
npm run preview
```

Los modelos se sirven desde `public/models`. Durante el juego no se necesitan servicios de IA, cuentas ni CDN externos.

## Primer viaje

1. Selecciona un mundo rocoso en el menú. Puedes cambiar la semilla antes de comenzar.
2. Pulsa **Comenzar el viaje** y **E** para viajar al destino.
3. Tras atravesar las nubes, pulsa **E** para aterrizar automáticamente en una zona segura.
4. Pulsa **E** para salir de la nave. Explora con **WASD** y escanea con **F**.
5. Arrastra sobre el escenario para girar la cámara; usa la rueda para cambiar la distancia.
6. Vuelve a menos de 20 unidades de la nave y pulsa **E** para subir. **R** despega; en vuelo planetario, **R** vuelve a órbita.
7. Usa el **Atlas** para escoger otro destino. Los gigantes gaseoso y de hielo no tienen una superficie de aterrizaje.

## Controles

| Acción | Control |
| --- | --- |
| Orientar la nave | Ratón o flechas; centra el cursor para dejar de girar |
| Acelerar / frenar | W / S |
| Girar la nave | A / D |
| Caminar respecto a la cámara | WASD |
| Girar cámara a pie | Arrastrar sobre el escenario o flechas |
| Acercar / alejar cámara a pie | Rueda del ratón |
| Propulsión / correr | Shift |
| Viajar / aterrizar / salir / subir | E |
| Despegar / volver a órbita | R |
| Escanear | F |
| Abrir Atlas | Tab o botón Atlas |
| Seleccionar destino en órbita | 1–9 |
| Disparar en combate orbital | Clic izquierdo / espacio |
| Iniciar tres oleadas enemigas | B |
| Alternar cámara de la nave | V |
| Ocultar interfaz | C; Escape la restaura |
| Pausar | Escape |

En dispositivos táctiles: joystick y botones de acción; arrastrar sobre el escenario gira la cámara a pie. El botón musical activa o silencia la música y los efectos locales. No se solicita bloqueo del puntero.

## Mundos y estrella

| Orden orbital | Tipo | Aspecto | Visita |
| --- | --- | --- | --- |
| 1 | Volcánico | Tinta violeta, lava naranja, caldera y columnas de basalto | Aterrizaje |
| 2 | Tóxico | Azufre, bruma amarilla y formaciones cónicas | Aterrizaje |
| 3 | Árido | Ocre, azul y grandes arcos erosionados | Aterrizaje |
| 4 | Exuberante | Suelo terracota, hongos coral y cielo turquesa | Aterrizaje |
| 5 | Oceánico | Agua azul, islas claras y arcos de coral | Aterrizaje |
| 6 | Gigante gaseoso | Bandas cálidas, tormenta estilizada y anillos | Órbita |
| 7 | Cristalino | Lavanda, vetas turquesa y agujas minerales | Aterrizaje |
| 8 | Gigante de hielo | Bandas azuladas y anillos | Órbita |
| 9 | Glacial | Hielo claro, fracturas azules y cristales | Aterrizaje |

La estrella central tiene fotosfera animada, manchas, corona y arcos de plasma. Los planetas orbitan aproximadamente en un plano común; los exteriores tienen periodos mayores. El cinturón de asteroides separa los mundos interiores del primer gigante. Las lunas orbitan sus planetas, pero no son destinos de aterrizaje. Los dos mundos más interiores no tienen lunas.

El aviso solar aparece dentro de 2900 unidades del centro. La exposición aumenta hacia dentro y se combina con refrigeración del casco. Por encima de 110 °C se dañan los escudos; al cruzar 1150 unidades se activa la evasión automática. Las rutas automáticas rodean la estrella. La escala y los umbrales son decisiones de juego, no una simulación física del sistema solar.

## Estilo gráfico

Dirección inspirada en portadas espaciales de los años setenta: grandes formas, paletas limitadas, sombras violetas, reflejos suaves y brillo usado como acento.

- Planetas con continentes legibles, bandas, placas de hielo y grietas dibujadas por shaders según el bioma.
- Terreno facetado con estratos amplios, dos crestas lejanas y formaciones agrupadas específicas de cada mundo.
- Nubes pintadas proceduralmente en una textura compartida, con 54 planos instanciados en una llamada de dibujo.
- Astronautas crema, naranja y azul tinta; mochila retro unida al esqueleto. El personaje del jugador alterna Idle, Walk y Run.
- Nave importada con acabado esmaltado, cabina turquesa, propulsor animado y tren de aterrizaje.
- Cámara a pie sobre el hombro, con seguimiento suave, zoom y protección frente al terreno. No hay garantía de colisión de cámara contra todos los objetos decorativos.

El presupuesto incluye 8500 matas y 450 flores para la vegetación cercana, malla de terreno próxima de 180 segmentos y planetas de 64 × 40 segmentos. Se comparten geometrías y materiales y se usan instancias. No hay nubes volumétricas ni trazado de rayos. No se ha medido una tasa de FPS objetivo en navegador.

## Últimas mejoras visuales — 8 de septiembre de 2026

- **Agua:** espuma costera animada y reflejo solar estilizado. Son efectos de shader, no reflejos de los objetos cercanos de la escena.
- **Lava:** costra oscura en movimiento, grietas incandescentes y un brillo de pulsación lenta sustituyen el material naranja uniforme. El efecto usa la malla de agua existente y se anima con el tiempo del juego.
- **Acantilados:** el color del terreno se mezcla con el de la roca del bioma en pendientes pronunciadas, diferenciándolas de las zonas llanas.
- **Auroras:** cortinas animadas turquesa y lavanda en mundos glaciales y cristalinos. Cada superficie compatible añade una sola malla ligera; los demás biomas no la añaden. Son geometría decorativa, no iluminación volumétrica.

Estos cambios mantienen la paleta retro sci-fi ilustrada y la jugabilidad existente. La última validación de código pasó 19 pruebas y la compilación de producción; no se realizó revisión visual en navegador ni medición de FPS. Esta actualización exclusivamente documental no vuelve a ejecutar comprobaciones del juego.

## Generación y límites

Semilla, nombres, distribución, alturas y decoración son procedurales. Los modelos del jugador, astronautas, enemigos y rocas son recursos externos reutilizados; la fauna usa piezas geométricas. Los mundos estériles no muestran praderas ni animales.

Cada visita crea una región de terreno aproximada de 8 × 8 km. El espacio y el terreno local se conectan mediante transiciones con nubes; no forman una esfera de terreno continua. Salir de la región de vuelo devuelve a órbita. Las órbitas planetarias se congelan durante la estancia en superficie y la pausa para conservar la salida; al regresar, la nave apunta alejándose del planeta.

Los descubrimientos y escaneos se guardan por semilla en `localStorage`; no hay guardado completo de la posición o de una partida. Borrar datos del navegador elimina esos registros. No incluye multijugador, construcción, inventario de supervivencia ni misiones.

Los indicadores de velocidad son unidades de juego adaptadas: nave planetaria 540 / 900 con propulsión; espacial 560 / 1600; a pie 10 / 30 al correr. No representan una escala física uniforme.

## Código y validación

| Área | Archivos principales |
| --- | --- |
| Estado, controles, UI y combate | `src/main.js` |
| Semillas, tipos de mundo y terreno | `src/world/procedural.js` |
| Órbitas, lunas y asteroides | `src/world/universe.js` |
| Estrella y rutas seguras | `src/world/solar.js` |
| Superficie y vegetación | `src/world/surface.js`, `src/world/meadow.js` |
| Arte y planetas ilustrados | `src/world/art-direction.js`, `src/world/retro-planet.js` |
| Paisaje y nubes | `src/world/retro-landmarks.js`, `src/world/painted-horizon.js`, `src/world/painted-clouds.js` |
| Modelos y astronautas | `src/world/asset-library.js`, `src/world/retro-explorer.js`, `src/world/player-ship.js` |
| Cámaras y transiciones | `src/world/walking-camera.js`, `src/world/flight-transition.js` |
| Postprocesado | `src/world/postprocessing.js` |
| Auroras | `src/world/aurora.js` |
| Combate y efectos | `src/world/dogfight.js`, `src/world/combat-effects.js` |
| Cielos vivos y resolución | `src/world/living-sky.js`, `src/world/render-budget.js` |
| Idiomas | `src/i18n/index.js`, `src/i18n/catalog.js` |
| Audio | `src/audio/game-audio.js` |

La última revisión de código pasó 19 pruebas automatizadas y la compilación de Vite. Cubren determinismo, alturas, salida planetaria, rutas solares, cámara a pie, idiomas, mezcla de audio, anticipación de disparos y resolución adaptativa. La compilación no valida visualmente los shaders. Las últimas modificaciones gráficas no se han revisado en navegador por petición del usuario. Vite avisa de un bloque de Three.js superior a 500 kB tras minificar y antes de gzip; el aviso de tamaño no impide compilar.

## Créditos

- [Rusty Spaceship – Orange, Sousinho](https://sketchfab.com/3d-models/rusty-spaceship-orange-18541ebed6ce44a9923f9b8dc30d87f5), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Obtenida del [repositorio de Domenicobrz](https://github.com/Domenicobrz/Threlte-in-practice-spaceship/), commit `f1f149de47bd7d15044c0f6fe651b6ffe7a19689`. Texturas optimizadas a WebP, hasta 2048 px; orientación, escala, materiales, propulsor y tren adaptados. Licencia: `public/licenses/rusty-spaceship.txt`.
- [Ultimate Space Kit, Quaternius](https://quaternius.com/packs/ultimatespacekit.html), CC0. Dos astronautas, dos naves enemigas y tres rocas, incluidos localmente en GLB. Trajes y acabados adaptados; mochila añadida en código. Licencia: `public/licenses/quaternius.txt`.
- Renderizado con Three.js; servidor y compilación con Vite.


## Audio

Música ambiental y nueve efectos locales: disparos, impactos, explosiones, escaneo, aterrizaje, despegue, viaje, motor y rugido de cohete. Se cargan al activar el audio; el motor responde a la velocidad y la música se pausa en el menú o al pausar. El sonido comienza después de una interacción del usuario. El botón musical guarda la preferencia de silencio.

Tamaño total: 702289 bytes (aproximadamente 702 kB), MP3 a 64 kbps. Efectos de [Kenney](https://kenney.nl/assets/sci-fi-sounds) y música [Outer Space Loop, wipics](https://opengameart.org/content/outer-space-loop), ambos CC0. Créditos y modificaciones: `public/licenses/audio.txt`. Implementación: `src/audio/game-audio.js`. Audio y gráficos no se han comprobado en el navegador.

## Combate y mundo vivo

Las patrullas maniobran en pasadas, se apartan al acercarse demasiado, anticipan el movimiento de la nave y disparan ráfagas de tres tiros cuando están alineadas. El comportamiento evita aproximarse a planetas y al sol. B sigue iniciando las oleadas opcionales.

Impactos y explosiones usan un conjunto reutilizable de 320 chispas instanciadas y ocho ondas de escudo; los propulsores enemigos tienen brillo propio. Los cielos habitables incluyen bandadas animadas; los estériles, partículas de ceniza o nieve. Los exploradores miran y saludan al acercarte y la fauna se aparta de ti.

El renderizado adapta gradualmente la resolución interna ante caídas sostenidas de frecuencia, excluyendo pausas de carga del cálculo. Es una protección de rendimiento; no equivale a FPS medidos ni garantizados. Nuevos módulos: `dogfight.js`, `combat-effects.js`, `living-sky.js`, `render-budget.js`. Validación: 19 pruebas y compilación; sin navegador.
