import * as THREE from 'three';

// Orbital presentation uses kilometres; surface simulation uses metres.
export const ORBIT_METERS_PER_UNIT = 1000;
export function createPlanetFrame(planet, normal = new THREE.Vector3(0, 0, 1)) {
  const up = normal.clone().normalize();
  if (up.lengthSq() < .5) up.set(0, 0, 1);
  const east = new THREE.Vector3().crossVectors(Math.abs(up.y) > .99 ? new THREE.Vector3(0,0,1) : new THREE.Vector3(0,1,0), up).normalize();
  const north = new THREE.Vector3().crossVectors(up, east);
  const radius = planet.radius * ORBIT_METERS_PER_UNIT;
  return {
    radius, up, east, north,
    toPlanet(local, target = new THREE.Vector3()) {
      // Tangent chart mapped onto a sphere; y is altitude above sea level.
      return target.copy(up).multiplyScalar(radius).addScaledVector(east, local.x).addScaledVector(north, local.z).normalize().multiplyScalar(radius + local.y);
    },
    fromPlanet(point, target = new THREE.Vector3()) {
      const d = point.dot(up);
      if (d <= 0) throw new RangeError('Position lies outside this planetary chart');
      return target.set(radius * point.dot(east) / d, point.length() - radius, radius * point.dot(north) / d);
    },
    toSystem(local, target = new THREE.Vector3()) {
      return this.toPlanet(local, target).add(new THREE.Vector3(...planet.position).multiplyScalar(ORBIT_METERS_PER_UNIT));
    },
  };
}

// Keep authoritative CPU positions in doubles. Only the render traversal is rebased.
// Restore exact saved values, including when rendering throws.
export function renderRelative(scene, camera, render) {
  const origin = camera.position.clone();
  const roots = [...scene.children];
  if (!camera.parent) roots.push(camera);
  const saved = roots.map(object => object.position.clone());
  try {
    roots.forEach(object => object.position.sub(origin));
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    return render();
  } finally {
    roots.forEach((object, i) => object.position.copy(saved[i]));
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
  }
}
