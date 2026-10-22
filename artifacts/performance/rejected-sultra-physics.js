// Keep contact math independent of rendering and reuse the engine's vectors.
// Closest-point distance includes faces, edges, and vertices of each triangle.
export function sphereTriangleContact(sphere, triangle, plane, closest) {
  triangle.getPlane(plane);
  const planeDistance = plane.distanceToPoint(sphere.center);
  if (Math.abs(planeDistance) > sphere.radius + 1e-12) return false;
  triangle.closestPointToPoint(sphere.center, closest);
  const distanceSq = sphere.center.distanceToSquared(closest);
  if (distanceSq > sphere.radius * sphere.radius + 1e-12) return false;
  const hit = sphere._shIntersectDt || (sphere._shIntersectDt = {
    normal: sphere.center.clone(), depth: 0,
  });
  const distance = Math.sqrt(distanceSq);
  // Resolve faces first in the broad-phase query. Otherwise an internal edge
  // between two ground triangles can push the player sideways like a ridge.
  hit.face = Math.abs(distanceSq - planeDistance * planeDistance) < 1e-10;
  if (distance > 1e-10) hit.normal.subVectors(sphere.center, closest).multiplyScalar(1 / distance);
  else hit.normal.copy(plane.normal);
  hit.depth = Math.max(0, sphere.radius - distance);
  return hit;
}

export function resolvePlayerContact(player, hit, normal) {
  normal.copy(hit.normal);
  // Remove only velocity entering the surface. Tangential velocity remains,
  // including when the player touches both a wall and the ground.
  const inwardSpeed = normal.dot(player.velocity);
  if (inwardSpeed < 0) player.velocity.addScaledVector(normal, -inwardSpeed);
  player.position.addScaledVector(normal, hit.depth);
}
