# Estética de construcción espacial

Investigación y aplicación: 9 de septiembre de 2026.

## Criterios investigados

- **Silueta y biseles:** una figura de construcción se reconoce por las piezas rígidas, proporciones compactas, encajes y bordes que captan luz. RoundedBoxGeometry permite biselar las piezas. Se usa un segmento por bisel para contener el número de triángulos. [Documentación oficial de Three.js](https://threejs.org/docs/pages/RoundedBoxGeometry.html).
- **Plástico:** MeshStandardMaterial usa el flujo metalness/roughness. Se eligieron metalness 0 y roughness entre 0.32 y 0.5, colores sólidos y las luces existentes. El visor es opaco para evitar problemas de orden de transparencias. Un mapa de entorno podría mejorar los reflejos; esta implementación no añade esa dependencia. [Material PBR](https://threejs.org/docs/pages/MeshStandardMaterial.html).
- **Repetición eficiente:** InstancedMesh reduce llamadas de dibujo cuando se comparte geometría y material. Las nubes usan dos lotes (486 bloques y 162 salientes); las montañas lejanas usan uno (192 bloques). Sus límites espaciales se calculan después de colocar las instancias. [Instancing y límites espaciales](https://threejs.org/docs/pages/InstancedMesh.html).
- **Gestión de recursos:** las instancias también necesitan liberar sus recursos propios, además de geometrías y materiales. La limpieza común ahora llama a dispose en InstancedMesh. [Método dispose](https://threejs.org/docs/pages/InstancedMesh.html).

Estas fuentes explican las herramientas de renderizado; las proporciones, colores y construcción de las figuras son decisiones artísticas propias, sin modelos ni logotipos de LEGO.

## Aplicación en el juego

El astronauta y los cuatro exploradores usan un modelo procedural con casco, visor, torso, panel de controles, mochila, piernas y brazos pivotantes, y manos abiertas tipo pinza. Tiene poses de reposo, caminar, correr, salto y saludo. Se eliminó la descarga de los dos astronautas GLB del inicio; sus archivos permanecen disponibles en el proyecto.

Las nubes pasan de carteles transparentes a volúmenes opacos biselados. Se desplaza el grupo completo suavemente, conservando un patrón determinista por planeta.

El terreno conserva el quadtree de CPU y el campo de alturas continuo. Las juntas se calculan en coordenadas del mundo para no moverse al cambiar de LOD. De cerca, los chunks de 128 m añaden placas con bisel y salientes bajos dentro de su mismo buffer, sin una llamada de dibujo por pieza. Los detalles geométricos no se generan en chunks lejanos; las juntas se atenúan según su tamaño en pantalla para reducir aliasing. El horizonte se compone de masas de bloques escalonadas.

Las pendientes son placas inclinadas, no escaleras de colisión. Los salientes decorativos miden 0.1 m y los biseles 0.045 m; no cambian la altura física del jugador. El campo analítico y la triangulación del terreno siguen teniendo la aproximación preexistente entre muestras. Las nuevas piezas conservan su respuesta PBR, sin recibir el acabado ilustrado anterior.

## Validación y límites

48 pruebas de código pasan y Vite genera el build. Las pruebas nuevas cubren el origen y tamaño de la figura, cambios de pose, determinismo de las nubes, volumen opaco, presupuesto de instancias, alturas de detalle, límite de triángulos y liberación de recursos. Las pruebas anteriores de caminar, saltar y quadtree siguen pasando.

No se abrió el navegador ni se midieron FPS/GPU. La apariencia, posibles solapamientos de animación y transiciones visuales de LOD necesitan la revisión del usuario. El build mantiene la advertencia de tamaño del bundle de Three.js. La ampliación descrita abajo extiende el acabado al resto de las superficies; luces, cielo, auroras y partículas conservan su función de efectos atmosféricos.


## Ampliación: líquidos y resto de superficies

Investigación adicional: [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) documenta el coste adicional por píxel de transmisión y clearcoat; [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html) distingue relieve de iluminación, geometría y emisión. Se usa PBR estándar, sin una segunda captura de escena para refracción. El gradiente de relieve sigue el enfoque del [shader de bump de Three.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl.js).

- Agua: placas azules/turquesas opacas y brillantes, juntas y salientes mediante relieve de iluminación. La variación temporal de brillo representa el movimiento del líquido sin desplazar la retícula ni cambiar la altura física del agua.
- Lava: placas oscuras con emisión naranja y pulsación lenta en juntas. El brillo no añade luces dinámicas por baldosa.
- Líquido tóxico: conserva el color de su planeta, brillo plástico y emisión verde moderada.
- El mapa de profundidad costera se usa solo dentro de su dominio de 8 km; fuera de él se utiliza el acabado profundo. Su resolución sigue siendo aproximada.
- Rocas y fauna usan cajas redondeadas; hongos y cactus usan tallos y copas de piezas. Flores cilíndricas y menor flexión de hierba refuerzan el aspecto moldeado. Cristales, vegetación, construcciones, naves y asteroides reciben material no metálico con relieve procedural; se conservan los detalles de sus mapas de color.
- Planetas y lunas incorporan juntas filtradas para que el acabado continúe desde la órbita. Cielo, estrellas, fuego de motores, auroras y partículas son iluminación/atmósfera y no reciben retícula de superficies.

La retícula de objetos usa proyección mezclada en tres ejes para evitar exigir UV a todas las geometrías. Los líquidos usan coordenadas locales del plano, coincidentes con la carta de terreno. Las derivadas en pantalla atenúan juntas y salientes subpíxel; los shaders se distinguen en la caché por tipo de acabado. Los hooks de animación previos se conservan.

Validación: 51 pruebas pasan, incluyendo idempotencia del acabado, compatibilidad con hooks, uniforms de tiempo, variantes agua/lava/tóxico, liberación del mapa costero e inclusión de shaders de Three.js. El build funciona. Estas comprobaciones no ejecutan los shaders en GPU ni certifican FPS o resultado visual; se mantiene la revisión visual a cargo del usuario.
