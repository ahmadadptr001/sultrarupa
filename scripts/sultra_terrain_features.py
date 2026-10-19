"""Smooth coastal retaining walls using the game's original Wall asset.

Coordinates use the game's X/Z plane. ``height_at(x, z)`` must return the
terrain's world-space Y height before the intro scene's X/Z scaling.
"""

import math

from shapely.geometry import Point, Polygon


COAST_FENCE_INSET = 1.0
MAX_FENCE_SEGMENT_LENGTH = 12.0
NATIVE_WALL_LENGTH = 12.15497875213623
FENCE_SEGMENT_OVERLAP = 0.15
FENCE_BASE_OFFSET = 0.05


def _polygons(geometry):
    """Yield every nonempty polygon, including disconnected coastal tips."""
    if isinstance(geometry, Polygon):
        if not geometry.is_empty and geometry.area > 0:
            yield geometry
    elif hasattr(geometry, "geoms"):
        for part in geometry.geoms:
            yield from _polygons(part)


def validate_coast_fence(result, land):
    """Check closure, dimensions and finite heights without external assets.

    Return compact statistics suitable for the terrain build's output. The
    separate SceneCollider strip should use these same segment centers and
    rotations, overlapping adjacent ends just like the visible fence.
    """
    rings = result["rings"]
    segments = result["segments"]
    props = result["props"]
    cores = [prop for prop in props if prop['asset'] == 'Wall']
    if len(segments) != len(cores) or not segments:
        raise ValueError("The coast wall needs one solid core per segment")
    for ring in rings:
        if len(ring) < 4 or ring[0] != ring[-1]:
            raise ValueError("Every coastline fence ring must be closed")
    total_length = 0.0
    for segment, prop in zip(segments, cores):
        if not all(math.isfinite(segment[key]) for key in
                   ("x", "z", "y", "length", "rotation")):
            raise ValueError("Non-finite coastal fence position or height")
        length = segment["length"]
        if length <= 0 or length > MAX_FENCE_SEGMENT_LENGTH + 1e-8:
            raise ValueError("Coastal fence segment exceeds its length limit")
        if not land.covers(Point(segment["x"], segment["z"])):
            raise ValueError("Coastal fence center falls outside the island")
        if prop["scaleXYZ"][2] * NATIVE_WALL_LENGTH < length:
            raise ValueError("Coastal fence has a gap between adjacent props")
        total_length += length
    ring_length = sum(
        math.hypot(b[0] - a[0], b[1] - a[1])
        for ring in rings for a, b in zip(ring, ring[1:])
    )
    if not math.isclose(total_length, ring_length, rel_tol=1e-10, abs_tol=1e-7):
        raise ValueError("Coastal fence segments do not cover the full coast")
    return {"rings": len(rings), "segments": len(segments),
            "length": total_length}


def build_coast_fence(land, height_at):
    """Return closed smooth retaining walls one meter inside shore.

    ``segments`` contains ``x, z, y, length, rotation`` for the caller's solid
    collision boxes. ``props`` uses the original smooth Wall mesh and palette;
    its base extends below the water as in the reference world's sea walls.
    ``rings`` includes the repeated closing vertex and all inset components.
    ``safety_polygon`` is the largest inset polygon for player recovery.

    Preserve each coastline corner before subdividing its straight edges:
    interpolating the whole ring at fixed distances would cut across bays.
    """
    if land.is_empty:
        raise ValueError("Cannot fence an empty island")
    if not land.is_valid:
        land = land.buffer(0)
    # Remove sub-centimeter arc edges created by buffer's rounded corners.
    # An 8 cm tolerance is smaller than the solid collision strip's half-width.
    inset = land.buffer(-COAST_FENCE_INSET).simplify(.08, preserve_topology=True)
    components = sorted(_polygons(inset),
                        key=lambda polygon: polygon.area, reverse=True)
    if not components:
        raise ValueError("Island is too narrow for the coastal fence inset")

    rings = []
    segments = []
    props = []
    for polygon in components:
        ring = [[float(x), float(z)] for x, z in polygon.exterior.coords]
        rings.append(ring)
        for start, end in zip(ring, ring[1:]):
            dx, dz = end[0] - start[0], end[1] - start[1]
            edge_length = math.hypot(dx, dz)
            if edge_length <= 1e-10:
                continue
            count = max(1, math.ceil(edge_length / MAX_FENCE_SEGMENT_LENGTH))
            length = edge_length / count
            rotation = math.atan2(dx, dz)  # Native Wall extends along Z.
            scale_z = (length + FENCE_SEGMENT_OVERLAP) / NATIVE_WALL_LENGTH
            for index in range(count):
                fraction = (index + 0.5) / count
                x, z = start[0] + dx * fraction, start[1] + dz * fraction
                y = float(height_at(x, z)) + FENCE_BASE_OFFSET
                segments.append(dict(x=x, z=z, y=y, length=length,
                                     rotation=rotation))
                top = y + 1.05
                bottom = -4.
                props.append(dict(asset="Wall", x=x, z=z, y=(top+bottom)/2,
                                  rotation=rotation,
                                  scaleXYZ=[2.4833, (top-bottom)/2, scale_z], solid=True))

    result = dict(segments=segments, props=props, rings=rings,
                  safety_polygon=components[0])
    validate_coast_fence(result, land)
    return result
