# Idiomas / Languages

[Documentación española](GUIDE.md) · [English documentation](GUIDE.en.md)

## Estado / Status

**ES:** Inglés y español disponibles mediante un único interruptor EN / ES. La preferencia se guarda en `no-ai-sky:language`; el valor inicial es inglés. La capa de presentación traduce textos, diálogos y etiquetas accesibles, conserva sus originales españoles y no modifica datos de juego ni descubrimientos. Los nombres y semillas se protegen de la traducción.

**EN:** English and Spanish are available through one EN / ES switch. The preference is stored under `no-ai-sky:language`; English is the initial default. The presentation layer translates text, dialogs and accessible labels, retains original Spanish strings and does not modify game state or discoveries. Names and seeds are protected from translation.

Implementation: `src/i18n/catalog.js`, `src/i18n/index.js`. Tests: `tests/i18n.test.js`. Browser review remains unperformed at the user's request.

## Cobertura / Coverage

| Español | English |
| --- | --- |
| Menú inicial, semilla, tarjetas y botones | Start menu, seed field, cards and buttons |
| Instrumentos, ubicación, destino y entorno | Instruments, location, destination and environment |
| Manual, pausa, Atlas y recuperación de la nave | Help, pause, Atlas and ship recovery |
| Interacciones a pie y en vuelo | Walking and flight interactions |
| Avisos de combate, escaneo y descubrimiento | Combat, scan and discovery notifications |
| Entrada atmosférica, aterrizaje y salida | Atmospheric entry, landing and departure |
| Alertas solares, temperatura y presión | Solar, temperature and pressure warnings |
| Tipos de mundo, atmósferas, vida y recursos | World types, atmospheres, life and resources |
| Carga, errores, botones táctiles y sonido | Loading, errors, touch buttons and sound |
| Textos accesibles, títulos y etiquetas HTML | Accessible text, tooltips and HTML language labels |

## Glosario / Glossary

| Español | English |
| --- | --- |
| Comenzar el viaje | Start your journey |
| Semilla | Seed |
| Sistema | System |
| Atlas | Atlas |
| Manual del viajero | Traveler's guide |
| Continuar | Continue |
| Volver al hangar | Return to hangar |
| Destino | Destination |
| Espacio profundo | Deep space |
| Pulso interplanetario | Interplanetary pulse |
| Entrada atmosférica | Atmospheric entry |
| Aterrizar | Land |
| Salir de la nave | Leave ship |
| Subir a la nave | Board ship |
| Despegar | Take off |
| Volver al espacio | Return to space |
| Exploración a pie | On-foot exploration |
| Escanear | Scan |
| Descubierto por ti | Discovered by you |
| Sin explorar | Unexplored |
| Hallazgos catalogados | Discoveries catalogued |
| Casco | Hull |
| Escudos | Shields |
| Propulsión | Boost |
| Sobrecalentamiento | Overheating |
| Radiación solar | Solar radiation |
| Evasión solar automática | Automatic solar evasion |
| Presión extrema | Extreme pressure |
| Gigante sin superficie sólida | Giant with no solid surface |
| Mundo volcánico | Volcanic world |
| Mundo tóxico | Toxic world |
| Mundo árido | Arid world |
| Mundo exuberante | Verdant world |
| Mundo oceánico | Oceanic world |
| Gigante gaseoso | Gas giant |
| Mundo cristalino | Crystalline world |
| Gigante de hielo | Ice giant |
| Mundo glacial | Glacial world |
| Cobre / Ferrita / Azufre | Copper / Ferrite / Sulfur |
| Obsidiana / Perla abisal | Obsidian / Abyssal pearl |
| Cuarzo resonante / Cristal de escarcha | Resonant quartz / Frost crystal |
| Arrastrar / Cámara / Correr | Drag / Camera / Run |

## Mantenimiento / Maintenance

**ES:** Añadir nuevas frases al catálogo central. La interfaz observa cambios de texto y atributos, sin reescribir HTML ni reemplazar eventos de botones. Mantener estables las semillas, nombres e identificadores. Las pruebas verifican traducciones dinámicas, metadatos, nombres protegidos y almacenamiento restringido.

**EN:** Add new phrases to the central catalog. The interface observes text and attribute updates without rewriting HTML or replacing button handlers. Keep seeds, names and IDs stable. Tests verify dynamic translations, metadata, protected names and restricted storage.
