# No AI’ Sky

[English](GUIDE.en.md) · [Español](GUIDE.md) · [Languages / Idiomas](LANGUAGES.md)

A Three.js and Vite space exploration demo with an illustrated retro sci-fi style. Each seed generates nine worlds: seven support landing and two giants support orbital exploration. Features include flight, cloud-covered atmospheric transitions, third-person walking, scanning and optional combat.

**Languages: English and Spanish.** The EN / ES switch changes the interface without restarting gameplay and saves the preference. English is the default when no preference is saved.

## Run locally

Recommended environment: Node.js 20.19+ and a WebGL2 browser with hardware acceleration.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Other commands:

```sh
npm test
npm run build
npm run preview
```

Models are served from `public/models`. Gameplay requires no AI services, accounts or external asset CDNs.

## Your first trip

1. Select a rocky world in the menu. You can change the seed before starting.
2. Click **Comenzar el viaje** (Start your journey), then press **E** to travel to the destination.
3. After passing through the clouds, press **E** to land automatically at a safe location.
4. Press **E** to leave the ship. Explore with **WASD** and scan with **F**.
5. Drag over the scene to rotate the camera; use the mouse wheel to adjust its distance.
6. Return within 20 units of the ship and press **E** to board. **R** takes off; while flying over a planet, **R** returns to orbit.
7. Open the **Atlas** to choose another destination. Gas and ice giants have no landing surface.

## Controls

| Action | Control |
| --- | --- |
| Steer the ship | Mouse or arrow keys; center the cursor to stop turning |
| Accelerate / brake | W / S |
| Turn the ship | A / D |
| Walk relative to the camera | WASD |
| Rotate the walking camera | Drag over the scene or use arrow keys |
| Zoom the walking camera | Mouse wheel |
| Boost / run | Shift |
| Travel / land / leave ship / board | E |
| Take off / return to orbit | R |
| Scan | F |
| Open Atlas | Tab or Atlas button |
| Select an orbital destination | 1–9 |
| Fire in orbital combat | Left click / Space |
| Start three enemy waves | B |
| Toggle ship camera | V |
| Hide interface | C; Escape restores it |
| Pause | Escape |

Touch devices have a joystick and action buttons; dragging over the scene rotates the walking camera. The music button enables or mutes local music and sound effects. Pointer lock is not requested.

## Worlds and star

| Orbital order | Type | Appearance | Exploration |
| --- | --- | --- | --- |
| 1 | Volcanic | Violet ink, orange lava, caldera and basalt columns | Landing |
| 2 | Toxic | Sulfur, yellow haze and cone formations | Landing |
| 3 | Arid | Ochre, blue and large eroded arches | Landing |
| 4 | Verdant | Terracotta ground, coral mushrooms and turquoise sky | Landing |
| 5 | Oceanic | Blue water, pale islands and coral arches | Landing |
| 6 | Gas giant | Warm bands, stylized storm and rings | Orbit |
| 7 | Crystalline | Lavender, turquoise veins and mineral spires | Landing |
| 8 | Ice giant | Blue bands and rings | Orbit |
| 9 | Glacial | Pale ice, blue fractures and crystals | Landing |

The central star has an animated photosphere, spots, corona and plasma arcs. Planets share an approximately common orbital plane; outer planets have longer periods. An asteroid belt separates the inner worlds from the first giant. Moons orbit their planets but are not landing destinations. The two innermost worlds have no moons.

Solar warnings appear within 2900 units of the center. Exposure increases inward and competes with hull cooling. Temperatures above 110 °C damage shields; crossing 1150 units triggers automatic evasion. Automatic travel routes go around the star. Distances and thresholds are gameplay choices, not a physical solar-system simulation.

## Visual direction

Inspired by 1970s space book covers: large shapes, limited palettes, violet shadows, soft reflections and selective glow.

- Planet shaders draw readable continents, bands, ice plates and fissures specific to each biome.
- Faceted terrain uses broad strata, two distant ridgelines and clustered formations distinctive to each world.
- Procedurally painted clouds share one texture and use 54 instanced planes in one draw call.
- Astronauts wear cream, orange and ink-blue suits, with a retro backpack attached to the skeleton. The player character blends Idle, Walk and Run animations.
- The imported ship has an enamel finish, turquoise cockpit, animated exhaust and landing gear.
- The over-the-shoulder walking camera provides smooth tracking, zoom and terrain clearance. Camera collision against every decorative object is not guaranteed.

The geometry budget includes 8500 grass clumps and 450 flowers for nearby vegetation, a 180-segment near terrain grid and 64 × 40-segment planets. Geometry and materials are shared, and repeated objects use instancing. There are no volumetric clouds or ray tracing. No target browser frame rate has been measured.

## Latest visual improvements — September 8, 2026

- **Water:** animated shoreline foam and a stylized sun reflection. These are shader effects, not reflections of nearby scene objects.
- **Lava:** dark moving crust, incandescent fissures and a slow pulsing glow replace the flat orange material. The effect uses the existing water mesh and updates with game time.
- **Cliffs:** surface color blends toward the biome's rock color on steeper slopes, making exposed rock easier to distinguish from flatter terrain.
- **Auroras:** animated turquoise and lavender curtains on glacial and crystalline worlds. Each eligible surface adds one lightweight ribbon mesh; other biomes add none. The curtains are decorative geometry, not volumetric lighting.

These changes preserve the illustrated retro sci-fi palette and existing gameplay. The most recent code validation passed 19 tests and the production build; no browser visual review or FPS measurement was performed. This documentation-only update does not rerun gameplay checks.

## Generation and limitations

Seeds, names, placement, heights and decoration are procedural. The player ship, astronauts, enemies and rocks are reused external assets; wildlife uses geometric parts. Sterile worlds do not display meadows or animals.

Each visit creates an approximately 8 × 8 km terrain region. Space and local terrain are connected through cloud transitions; they do not form one continuous terrain sphere. Leaving the regional flight boundary returns the ship to orbit. Planetary orbits freeze during surface visits and pauses to preserve departure placement; when returning, the ship points away from the planet.

Discoveries and scans are saved per seed in `localStorage`; there is no complete position or session save. Clearing browser data removes those records. Multiplayer, construction, survival inventory and missions are not included.

Displayed speeds use adapted game units: planetary flight 540 / 900 boosted; space flight 560 / 1600; walking 10 / 30 running. These do not represent a uniform physical scale.

## Code and validation

| Area | Main files |
| --- | --- |
| State, controls, UI and combat | `src/main.js` |
| Seeds, world types and terrain | `src/world/procedural.js` |
| Orbits, moons and asteroids | `src/world/universe.js` |
| Star and safe routes | `src/world/solar.js` |
| Surface and vegetation | `src/world/surface.js`, `src/world/meadow.js` |
| Art treatment and illustrated planets | `src/world/art-direction.js`, `src/world/retro-planet.js` |
| Landscapes and clouds | `src/world/retro-landmarks.js`, `src/world/painted-horizon.js`, `src/world/painted-clouds.js` |
| Models and astronauts | `src/world/asset-library.js`, `src/world/retro-explorer.js`, `src/world/player-ship.js` |
| Cameras and transitions | `src/world/walking-camera.js`, `src/world/flight-transition.js` |
| Postprocessing | `src/world/postprocessing.js` |
| Auroras | `src/world/aurora.js` |
| Combat and effects | `src/world/dogfight.js`, `src/world/combat-effects.js` |
| Living skies and render budget | `src/world/living-sky.js`, `src/world/render-budget.js` |
| Languages | `src/i18n/index.js`, `src/i18n/catalog.js` |
| Audio | `src/audio/game-audio.js` |

The latest code revision passed 19 automated tests and the Vite production build. Tests cover determinism, terrain heights, planetary departure, solar routes, the walking camera, languages, audio mixing, interception and adaptive resolution. Building does not visually validate shaders. Recent graphics changes have not been reviewed in a browser at the user's request. Vite reports a Three.js chunk exceeding 500 kB after minification and before gzip; this size warning does not prevent building.

## Credits

- [Rusty Spaceship – Orange, Sousinho](https://sketchfab.com/3d-models/rusty-spaceship-orange-18541ebed6ce44a9923f9b8dc30d87f5), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Obtained from [Domenicobrz's repository](https://github.com/Domenicobrz/Threlte-in-practice-spaceship/), commit `f1f149de47bd7d15044c0f6fe651b6ffe7a19689`. Textures optimized to WebP, up to 2048 px; orientation, scale, materials, exhaust and landing gear adapted. License: `public/licenses/rusty-spaceship.txt`.
- [Ultimate Space Kit, Quaternius](https://quaternius.com/packs/ultimatespacekit.html), CC0. Two astronauts, two enemy ships and three rocks, bundled locally as GLB. Suits and finishes adapted; backpack added in code. License: `public/licenses/quaternius.txt`.
- Rendering by Three.js; development server and builds by Vite.


## Audio

Ambient music and nine local effects: lasers, impacts, explosions, scanning, landing, takeoff, travel, engine and rocket roar. Audio loads when enabled; the engine responds to speed and music pauses in menus or when gameplay pauses. Playback begins after a user interaction. The music button remembers the mute preference.

Total size: 702289 bytes (approximately 702 kB), using 64 kbps MP3. Effects by [Kenney](https://kenney.nl/assets/sci-fi-sounds) and [Outer Space Loop by wipics](https://opengameart.org/content/outer-space-loop), both CC0. Credits and modifications: `public/licenses/audio.txt`. Implementation: `src/audio/game-audio.js`. Audio and graphics have not been reviewed in a browser.

## Combat and living worlds

Patrols make attack passes, break away at close range, lead the player's movement and fire three-shot bursts when aligned. Steering avoids nearby planets and the star. B still starts optional combat waves.

Impacts and explosions use a reusable pool of 320 instanced sparks and eight shield waves; enemy engines have glowing exhaust. Living skies include animated flocks; sterile worlds have ash or snow particles. Explorers turn and wave when approached, while wildlife moves away from the player.

Rendering gradually adapts internal resolution after sustained frame-rate drops, excluding loading stalls. This is a performance safeguard, not a measured or guaranteed frame rate. New modules: `dogfight.js`, `combat-effects.js`, `living-sky.js`, `render-budget.js`. Validation: 19 tests and production build; no browser review.

## Landmarks and landing assistance

Each solid planet now has three named destinations with markers and distinct
terrain: calderas, canyons, ruins or ice/crystal formations. **L** cycles the marked
destination; its HUD indicator is also clickable. Scan nearby sites with **F** to
save their discovery. Marked volcanic and toxic basins drain 6 shield points every
two seconds near the ground, down to a minimum of 1. Leave the basin to recover.

Hold **X** to brake and override boost. The landing prompt shows the expected pad
and estimated stopping distance. A green ring marks touchdown. **E** checks the
hull footprint, slope, water, obstacles and hazards; if no nearby safe site exists,
the ship stays in flight. The approach clears terrain and known structures before
a vertical touchdown. Thrusters produce ground dust at low altitude.
