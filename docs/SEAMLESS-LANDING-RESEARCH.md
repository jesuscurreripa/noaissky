# Investigación: aterrizaje continuo

Fecha: 8 de septiembre de 2026. Alcance: arquitectura para este juego en Three.js;
las decisiones de implementación siguientes son propuestas, no funcionalidades terminadas.

## Diagnóstico del proyecto

`main.js:enterAtmosphere` activa una cubierta opaca, crea `createSurface`, oculta
`universe.group` y lleva nave/cámara a una posición local prefijada. El ascenso
invierte el cambio y se dispara a 1.100 m. `retro-planet.js` pinta continentes con
ruido en dirección esférica, mientras `surface.js` genera otro relieve mediante
`terrainHeight(x,z)`. Por tanto, una montaña vista desde órbita no identifica un
lugar aterrizable de la superficie.

Los cambios actuales aportan renderizado relativo, conversión de marcos y LOD CPU,
pero todavía conservan esa separación. Ampliar el plano o ocultar el cambio con
nubes no satisface el requisito de continuidad espacial.

## Qué debe mantenerse continuo

1. Posición, orientación y velocidad físicas durante el descenso.
2. Identidad geográfica: costa, montaña y lugar de aterrizaje coinciden.
3. Cobertura geométrica: siempre existe una representación disponible.
4. Colisión: el suelo no desaparece ni cambia bajo el jugador por una decisión visual.
5. Tiempo: la generación no detiene la simulación ni requiere un modo bloqueante.

Se pueden usar varios pases y representaciones visuales. La condición es que todos
procedan del mismo planeta y conserven el estado del jugador al intercambiarse.

## Arquitectura propuesta

### Planeta esférico y relieve único

Empezar por un solo planeta con seis caras de cubo proyectadas sobre una esfera.
Cada cara tiene un quadtree, con identificador `(planetId, face, level, x, y)`.
El muestreo recibe una dirección planetocéntrica normalizada, independiente de la
cara: `P = center + orientation * direction * (radius + height(seed,direction))`.
Así pueden coincidir los bordes de caras y los samples compartidos entre niveles.
Biomas, agua, normales y colisión deben derivar de este mismo dominio.

Esta elección de cube-sphere es una recomendación para reutilizar el quadtree,
no una afirmación sobre la implementación de No Man's Sky. Hay alternativas como
HEALPix; el trabajo de DLR describe partición esférica, LOD y carga asíncrona [1].
Un heightfield radial no puede representar cuevas ni voladizos. Añadir vóxeles
sería una decisión posterior con otro coste de malla y colisión. La presentación
de Hello Games describe una cadena basada en vóxeles, poligonización, texturas,
población y simulación [2]; esa complejidad no es requisito para aterrizar.

### Coordenadas y dinámica

Una unidad física consistente en metros. Centros de cuerpos en doubles y posiciones
planetocéntricas cerca del planeta; vértices de cada chunk relativos a su centro.
Restar el origen de cámara antes de subir valores a GPU. Mantener el helper actual
como base, evitando atributos Float32 con posiciones globales enormes.

El vector vertical es radial. Gravedad, cámara, navegación y controles usan una
base tangente que cambia suavemente al recorrer el planeta. Transformar también
velocidades al cambiar de marco: un cuerpo en órbita o rotación aporta velocidad
lineal y el término de rotación `omega × offset`. Cambiar solo posiciones no basta.
Para la primera demostración conviene un planeta estático; después reincorporar
órbita y rotación verificando conservación del movimiento relativo.

### LOD y continuidad de malla

Seleccionar detalle con error geométrico proyectado, presupuesto y límites de
resolución física cerca del suelo. Usar histéresis para evitar subdividir/fusionar
continuamente alrededor del umbral. Mantener cada padre hasta que sus cuatro hijos
estén preparados; sustituir familias localmente en lugar de esperar a todo el
conjunto visible, como hace ahora el prototipo.

Elegir una estrategia coherente: bordes cosidos con balance 2:1 y morphing, o una
adaptación estudiada de CDLOD. Los faldones actuales son una protección inicial,
no resuelven los saltos de altura. CDLOD ofrece una referencia de quadtrees de
rejillas y transiciones continuas basadas en distancia 3D [3]. Geometry Clipmaps
es otra referencia para rejillas reutilizables y transiciones progresivas [4].
Ambos requieren adaptación al dominio esférico; no basta con copiar sus fórmulas.

Aplicar frustum culling y horizon culling con bounds conservadores que incluyan
el relieve. Cesium documenta cómo descartar terreno oculto por el propio globo [5].

### Generación, recursos y colisión

Propuesta: Workers para alturas, normales y buffers transferibles; cola priorizada
por visibilidad, distancia y trayectoria prevista. Versionar solicitudes para
descartar resultados de trabajos obsoletos. Limitar memoria con caché LRU y cargas
GPU por tiempo, además del número de chunks. Medir percentiles del tiempo de frame.

Mantener un anillo de colisión de resolución estable alrededor de nave y personaje.
No reducir su precisión porque la cámara mire hacia otro lado. Usar consultas
barridas o subpasos para evitar atravesar el terreno a gran velocidad. Los detalles
visuales nuevos deben converger al suelo físico sin mover repentinamente al jugador.
Vegetación y recursos se generan por celdas deterministas con IDs persistentes.

### Profundidad, atmósfera y océano

El origen relativo corrige precisión espacial, no la precisión del depth buffer.
La versión instalada de Three.js dispone de `reversedDepthBuffer`; necesita
`EXT_clip_control`. Evaluarlo por dispositivo y preparar alternativa con profundidad
logarítmica o pases cercanos/lejanos compatibles. La documentación advierte del
coste potencial de `gl_FragDepth` para profundidad logarítmica [6]. Auditar shaders
personalizados y postprocesado: activar una opción no garantiza su compatibilidad.

Usar una atmósfera dependiente de altitud y rayos de visión en el mismo marco del
planeta. Bruneton proporciona implementación y demostración que admiten cámara
dentro y fuera de la atmósfera [7]. No hace falta adoptar todo el modelo físico
para el estilo artístico del juego, pero sí eliminar el cielo plano como sustituto
geométrico y hacer que océano, horizonte e iluminación respeten la curvatura.

## Orden de trabajo y aceptación

1. Planeta estático sin decoración: cube-sphere, un relieve y vuelo libre continuo.
2. LOD estable y colisión radial: aterrizar, caminar, despegar, cruzar polos y caras.
3. Workers, caché, cancelación y métricas: repetir descenso rápido con caché fría.
4. Materiales, agua y atmósfera coherentes; después población y cuerpos en movimiento.

Demostración exigida: elegir una montaña desde órbita, aterrizar allí, alejarse y
regresar a las mismas coordenadas. Sin cubierta opaca obligatoria, recolocación a
un punto prefijado ni pausa de generación. Pruebas de costuras en todas las caras,
conservación de estado al cambiar origen, colisión a máxima velocidad y memoria
estable tras varios recorridos. Fijar objetivos de FPS después de medir hardware
objetivo, sin prometerlos a partir de una compilación correcta.

## Fuentes primarias

[1] [DLR / UC Davis: Spherical Terrain Rendering using HEALPix](https://drops.dagstuhl.de/storage/01oasics/oasics-vol027-vluds2012-irtg1131/OASIcs.VLUDS.2011.13/OASIcs.VLUDS.2011.13.pdf).

[2] [GDC 2017: Continuous World Generation in No Man's Sky, Innes McKendrick](https://www.gdcvault.com/play/1024265/Continuous_World_Generation_in__No_Man_s_Sky_). Se consultó la descripción oficial; no se atribuyen detalles no verificados del vídeo.

[3] [Filip Strugar: CDLOD, artículo y código del autor](https://github.com/fstrugar/CDLOD).

[4] [Asirvatham y Hoppe: GPU-Based Geometry Clipmaps](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-2-terrain-rendering-using-gpu-based-geometry).

[5] [Cesium: Horizon Culling](https://cesium.com/blog/2013/04/25/horizon-culling/).

[6] [Three.js: WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html).

[7] [Eric Bruneton: Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/).
