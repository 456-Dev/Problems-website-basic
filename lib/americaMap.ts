// Builds the road-trip map at build time (server only): lower-48 state outlines
// as SVG paths, plus every stop projected onto the same Albers projection.
import { geoAlbers, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import us from "us-atlas/states-10m.json";
import { stops } from "./america";

export const MAP_W = 960;
export const MAP_H = 560;

export type MapData = { states: string; nation: string; pts: [number, number][] };

export function buildMap(): MapData {
  const topo = us as unknown as Topology<{ states: GeometryCollection }>;
  const all = feature(topo, topo.objects.states);
  // drop Alaska, Hawaii and the territories: the drive never left the lower 48
  const far = new Set(["02", "15", "60", "66", "69", "72", "78"]);
  const lower = { ...all, features: all.features.filter((f) => !far.has(String(f.id))) };

  const projection = geoAlbers().fitExtent([[12, 12], [MAP_W - 12, MAP_H - 12]], lower);
  const path = geoPath(projection);

  const inner = mesh(topo, topo.objects.states, (a, b) => a !== b && !far.has(String(a.id)) && !far.has(String(b.id)));
  const round = (n: number) => Math.round(n * 10) / 10;

  return {
    states: path(inner) ?? "",
    nation: path(lower) ?? "",
    pts: stops.map((s) => {
      const p = projection(s.ll)!;
      return [round(p[0]), round(p[1])];
    }),
  };
}
