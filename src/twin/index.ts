export interface ShelterNode {
  id: string;
  x: number;
  y: number;
  capacity: number;
  open: boolean;
  suppliesDays: number;
}
export interface Hospital {
  id: string;
  x: number;
  y: number;
  powerIsland: boolean;
}
export interface Bridge {
  id: string;
  from: [number, number];
  to: [number, number];
}

export interface CityTwin {
  name: string;
  arrayPos: [number, number];
  shelters: ShelterNode[];
  hospitals: Hospital[];
  bridges: Bridge[];
  floodPolygon: [number, number][];
  oldTown: [number, number];
}

export const CITY: CityTwin = {
  name: 'MERIDIAN BAY',
  arrayPos: [0, 0],
  shelters: [
    { id: 'S-01', x: 10.2, y: -3.1, capacity: 2400, open: true, suppliesDays: 14 },
    { id: 'S-02', x: 14.8, y: -2.5, capacity: 1800, open: true, suppliesDays: 10 },
    { id: 'S-03', x: 18.4, y: -6.2, capacity: 3200, open: true, suppliesDays: 21 },
    { id: 'S-04', x: 22.1, y: -1.8, capacity: 1500, open: true, suppliesDays: 7 },
    { id: 'S-05', x: 12.5, y: -9.8, capacity: 2800, open: true, suppliesDays: 14 },
    { id: 'S-06', x: 16.2, y: -10.5, capacity: 2200, open: true, suppliesDays: 10 },
    { id: 'S-07', x: 20.8, y: -8.3, capacity: 1900, open: true, suppliesDays: 14 },
    { id: 'S-08', x: 9.6, y: -12.1, capacity: 3500, open: true, suppliesDays: 21 },
    { id: 'S-09', x: 13.7, y: -13.4, capacity: 1600, open: true, suppliesDays: 7 },
    { id: 'S-10', x: 17.9, y: -11.7, capacity: 2100, open: true, suppliesDays: 10 },
    { id: 'S-11', x: 11.3, y: -5.6, capacity: 2600, open: true, suppliesDays: 14 },
    { id: 'S-12', x: 15.4, y: -7.2, capacity: 2900, open: true, suppliesDays: 14 },
  ],
  hospitals: [
    { id: 'H-01', x: 11.8, y: -4.2, powerIsland: true },
    { id: 'H-02', x: 19.2, y: -3.7, powerIsland: true },
    { id: 'H-03', x: 14.5, y: -11.0, powerIsland: true },
  ],
  bridges: [
    { id: 'BR-1', from: [10.5, -4.0], to: [13.2, -4.0] },
    { id: 'BR-2', from: [16.0, -7.5], to: [18.5, -7.5] },
  ],
  floodPolygon: [
    [9.8, -2.0],
    [13.0, -1.5],
    [14.5, -4.5],
    [15.8, -7.2],
    [14.0, -10.0],
    [11.0, -9.5],
    [9.5, -6.0],
  ],
  oldTown: [13, -5],
};

export function nearestOpenShelter(
  from: [number, number],
  city = CITY
): { node: ShelterNode; distKm: number; etaMin: number } | null {
  let best: { node: ShelterNode; distKm: number } | null = null;
  for (const s of city.shelters) {
    if (!s.open) continue;
    const d = Math.hypot(s.x - from[0], s.y - from[1]);
    if (!best || d < best.distKm) best = { node: s, distKm: d };
  }
  if (!best) return null;
  const walkKmh = 5;
  return { node: best.node, distKm: best.distKm, etaMin: Math.round((best.distKm / walkKmh) * 60) };
}

export function hazardShelterRecommendation(
  hazardAt: [number, number],
  city = CITY
): { nodeId: string; etaMin: number; capacity: number; reason: string } | null {
  const rec = nearestOpenShelter(hazardAt, city);
  if (!rec) return null;
  return {
    nodeId: rec.node.id,
    etaMin: rec.etaMin,
    capacity: rec.node.capacity,
    reason: `Nearest open shelter to hazard centroid (${hazardAt[0].toFixed(1)}, ${hazardAt[1].toFixed(1)})`
  };
}