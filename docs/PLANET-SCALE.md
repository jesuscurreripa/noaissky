# Escala planetaria y terreno CPU

Este documento describe la base inicial y el terreno del modo clásico. El prototipo
esférico posterior fue retirado de la navegación; sus notas están en [CONTINUOUS-FLIGHT.md](CONTINUOUS-FLIGHT.md).

La escena orbital emplea una escala de presentación de 1 unidad = 1 km. La
superficie usa 1 unidad = 1 m. No se multiplican las velocidades ni las órbitas
existentes: `large-world.js` hace explícita la conversión entre ambos marcos.

`createPlanetFrame(planet, normal)` construye una base tangente en el punto de
entrada, incluso en los polos. `toPlanet` convierte coordenadas locales a una
posición planetocéntrica en metros; `fromPlanet` permite el recorrido inverso
en el hemisferio del marco. `toSystem` añade el centro orbital actual en metros.
El ascenso utiliza la posición local recorrida para calcular la normal de salida.
La posición de los planetas sigue evolucionando por el sistema orbital existente.

## Precisión

Las posiciones de simulación permanecen en números JavaScript de doble precisión.
`renderRelative` resta la posición de la cámara a las raíces de la escena durante
el renderizado y restaura exactamente sus posiciones al terminar, incluso si hay
una excepción. Cámara, luces, objetivos de sombras y geometría comparten origen.
La lógica de colisión, navegación y marcadores sigue usando las coordenadas CPU.
Los vértices de terreno son relativos al centro de cada chunk antes de convertirse
a Float32. No se deben almacenar coordenadas astronómicas en atributos de vértices.

Esto reduce la pérdida de precisión de las matrices GPU; no ofrece precisión
arbitraria. Para galaxias mayores que el rango útil de doubles habrá que añadir
sectores enteros más desplazamientos locales. El helper presupone raíces con
traslación y cámara independiente o hija directa de la escena, como en main.js.

## Terreno

`terrain-quadtree.js` sustituye las dos mallas fijas por un quadtree seleccionado
en CPU según la distancia a los límites de cada nodo y la altura del visitante.

- Región de 131.072 m por lado, con hojas mínimas de 128 m.
- Hasta 256 hojas; cada hoja tiene una cuadrícula de 16 × 16 celdas.
- Hasta 8 geometrías nuevas por actualización, después de la carga inicial.
- La cobertura anterior permanece visible hasta completar el nuevo conjunto.
- Durante esa preparación pueden coexistir hasta dos conjuntos de hojas.
- Faldones verticales ocultan grietas entre niveles diferentes; no hay geomorphing.
- Las geometrías retiradas se liberan; el material es compartido.
- `surface.terrain.stats` expone hojas, residentes, pendientes y triángulos visibles.

El mismo `terrainHeight` determinista alimenta terreno, aterrizaje y movimiento.
La colisión usa la función continua; la malla es una aproximación por triángulos.
La región navegable tiene un margen respecto al borde del árbol. El ascenso por
altitud sigue activo y el límite lateral anterior de 3,4 km se amplía a unos 59 km.

## Límites de esta primera integración

La superficie renderizada sigue siendo una carta plana; el marco esférico conecta
sus coordenadas con la órbita. No es todavía un planeta esférico continuo con seis
caras de quadtree, gravedad radial y transición sin cambio de escena. Cada entrada
reutiliza el bioma y relieve de la semilla; falta terreno global georreferenciado.
Vegetación, recursos, fauna y horizonte siguen concentrados alrededor del aterrizaje.
El agua cubre la región ampliada, pero el mapa de profundidad costera conserva su
ventana central de 8 km. Fuera de ella el sombreado costero es aproximado.

La generación se ejecuta en el hilo principal con presupuesto por número de chunks,
no por milisegundos. Todavía no se utiliza Worker, balance 2:1, error en píxeles ni
caché persistente. El frustum culling de Three.js opera sobre los bounds de cada mesh.

## Verificación

`npm test` incluye cobertura sin solapes, presupuesto, precisión y restauración del
origen, conversiones en polos, reemplazo progresivo y liberación de geometrías.
`npm run build` verifica el empaquetado. La validación visual en WebGL es necesaria
para evaluar popping, faldones y tiempos de generación en cada dispositivo.
