# Prototipo de vuelo continuo — retirado de la navegación

Por petición del usuario, el juego utiliza únicamente la navegación clásica.
El controlador experimental y su interfaz se han retirado del juego. Las notas
siguientes documentan el prototipo anterior, no opciones disponibles en el hangar.
Se conservan los módulos matemáticos y de terreno esférico para investigación.

## Recorrido

- **E**, en vuelo: apunta con la nave y desciende al punto de intersección del morro
  con la esfera de referencia. Si el morro no intersecta el planeta, usa el punto
  situado debajo de la nave. La aproximación al relieve ocurre en vuelo continuo.
- **Espacio** detiene la nave y cancela la asistencia. **W/S** regula velocidad;
  **flechas** orientan; **A/D** produce alabeo; **Shift** aumenta el límite de velocidad.
- Arrastra sobre la escena para orientar la nave. Esto también cancela la asistencia.
- **E**, después de aterrizar: salir de la nave. **WASD** camina, **Shift** corre.
  Arrastrar gira la vista y la rueda ajusta la distancia de cámara.
- **E**, a menos de 24 m de la nave: volver a subir. **R** despega y asciende.
- **F** guarda una dirección geográfica durante esta sesión; **G**, en vuelo,
  regresa a ella y aterriza. No se utiliza una posición de llegada prefijada.
- **Esc** pausa. **H** abre el diagnóstico. **Volver al hangar** libera esta sesión.

El ascenso asistido termina a una altura aproximada del 35% del radio. No cambia
la escena ni traslada la nave a otra representación. Puede cancelarse en cualquier
momento. La palabra «órbita» describe aquí la región de vuelo, no una órbita kepleriana.

## Geometría y coordenadas

`planet-field.js` define seis bases de cubo y una función de altura determinista
sobre direcciones unitarias planetocéntricas. No depende de cara, LOD o cámara.
El radio es el del sistema existente convertido de kilómetros a metros. El mismo
campo define el relieve visible, el suelo físico y las coordenadas del punto guardado.

`planet-chunk.js` produce en CPU rejillas de 16 × 16 celdas. Los vértices Float32
son relativos al centro del chunk. Las posiciones planetocéntricas y de cámara
permanecen en doubles. Las normales se calculan con diferencias del mismo campo,
con independencia del tamaño del chunk. Las caras comparten muestras en sus bordes.

Al subdividir, cada chunk parte de la interpolación triangular exacta del padre y
pasa a su geometría fina durante aproximadamente un tercio de segundo. Faldones
radiales cubren diferencias de resolución entre vecinos. La fusión hacia padres
sigue siendo discreta; no hay todavía balance 2:1 ni una malla cosida sin faldones.

## Selección y streaming

`spherical-terrain.js` mantiene seis raíces como cobertura inicial, selecciona LOD
por tamaño proyectado de celda, aplica histéresis y prioriza caras y nodos cercanos.
Incluye descarte conservador por frustum y horizonte. La geometría del padre sigue
visible hasta que llegan los cuatro hijos; nunca se espera a regenerar el planeta.

Un Worker genera un chunk por solicitud y devuelve buffers transferibles. Solo
hay una solicitud en vuelo; las pendientes se vuelven a priorizar cada actualización.
Las raíces se generan al iniciar la sesión, no durante el descenso. Las respuestas
obsoletas pueden reutilizarse en la caché y se expulsan si dejan de ser necesarias.

Configuración inicial: hasta 300 hojas seleccionadas, LOD máximo 14 y objetivo de
480 chunks residentes. La llegada de una respuesta puede añadir un chunk transitorio
antes de la siguiente expulsión. El Worker termina y las geometrías/materiales se
liberan al salir. Las mallas de nave y personaje se devuelven al modo clásico.

## Renderizado y movimiento

`seamless-flight.js` conserva una única escena durante vuelo, aterrizaje, caminar
y ascenso. Los estados cambian los controles. La nave no se recoloca a coordenadas
locales prefijadas ni existe un modo bloqueante de generación o una cubierta opaca.
La corrección final de contacto se limita a menos de 15 cm del punto objetivo.

El modo utiliza su propio renderer con profundidad logarítmica, incluido el shader
de escape de la nave. `renderRelative` mantiene el origen de render en la cámara.
La atmósfera es una aproximación de densidad exponencial integrada en doce muestras
por rayo; no es una implementación completa del modelo de Bruneton.

El movimiento es asistido y cinemático. El eje vertical y la colisión son radiales;
no hay dinámica orbital, gravedad newtoniana ni rotación del planeta. La nave usa
subpasos de como máximo 12 m de desplazamiento para consultar el campo de altura.
La colisión permanece disponible aunque el Worker aún no haya refinado la malla.
La malla gruesa es una aproximación del campo, por lo que puede diferir del suelo
físico mientras el detalle llega. El personaje sigue el campo de altura global.

## Alcance y límites

Es la primera sección funcional del plan de investigación: un cuerpo estático
explorable desde arriba hasta el suelo. No sustituye todavía todo el sistema solar
por cuerpos continuos. El mapa global nuevo no coincide con el shader decorativo
del hangar ni con el relieve del modo clásico; sí coincide entre todas las alturas
dentro del modo continuo.

No incluye agua geométrica, vegetación, recursos persistentes, cuevas o población.
Las zonas bajas tienen un color distinto, pero siguen siendo suelo. El lugar
marcado con F se conserva solo hasta salir al hangar. Tampoco hay promesa de FPS:
el diagnóstico muestra geometría y caché, no un rendimiento garantizado.

## Validación

`npm test` verifica las doce costuras del cubo, orientación y colisión en los polos,
continuidad y determinismo del campo, correspondencia entre padres e hijos y carga
con giros entre caras bajo presupuesto. `npm run build` empaqueta el Worker aparte.
Las pruebas de navegador complementan estas comprobaciones con el recorrido visible
órbita → aterrizaje → personaje → nave → ascenso y los mensajes de WebGL.
