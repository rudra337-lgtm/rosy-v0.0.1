import { TRACK_KINDS, Domain } from './fusion.types.js';
import { tsunamiEtaMin } from '../physics/index.js';
import { CITY, ShelterNode } from '../twin/index.js';

export interface Rng {
  (): number;
  int(max: number): number;
  gauss(): number;
}

export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  const fn = () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  fn.int = (max: number) => Math.floor(fn() * max);
  fn.gauss = () => {
    const u1 = fn(), u2 = fn();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  return fn;
}

export interface Track {
  id: string;
  kind: string;
  domain: Domain;
  x: number;
  y: number;
  headingDeg: number;
  speedKmh: number;
  altM: number;
  quality: number;
  label: string;
  inbound: boolean;
  rcs: number;
  bio: boolean;
  lastSeen: number;
  modelProb: { cv: number; ct: number };
}

export interface WorldControls {
  adsbDensity: number;
  aisDensity: number;
  gnssHealth: number;
  seismicRate: number;
  openData: {
    adsb: boolean;
    ais: boolean;
    metar: boolean;
    usgs: boolean;
    firms: boolean;
    tle: boolean;
  };
  simSpeed: number;
}

export interface Hazard {
  id: string;
  type: 'flood' | 'wildfire' | 'seismic' | 'tsunami' | 'gnss';
  at: [number, number];
  severity: number;
  since: number;
  shelterRelevant: boolean;
}

export interface World {
  t: number;
  tracks: Track[];
  hazards: Hazard[];
  controls: WorldControls;
  step: (dtS: number) => void;
  seed: number;
}

const KIND_DEFAULTS: Record<string, Partial<Track>> = {
  airliner: { domain: 'AIR', speedKmh: 850, altM: 11000, rcs: 100, label: 'ADS-B', bio: false },
  ga: { domain: 'AIR', speedKmh: 240, altM: 3000, rcs: 2, label: 'ADS-B', bio: false },
  uav: { domain: 'AIR', speedKmh: 80, altM: 500, rcs: 0.05, label: 'UNCORRELATED', bio: false },
  bird: { domain: 'AIR', speedKmh: 40, altM: 200, rcs: 0.01, label: 'BIO', bio: true },
  weather: { domain: 'AIR', speedKmh: 30, altM: 5000, rcs: 50, label: 'METAR', bio: false },
  cargo: { domain: 'SEA', speedKmh: 22, altM: 0, rcs: 500, label: 'AIS', bio: false },
  fishing: { domain: 'SEA', speedKmh: 10, altM: 0, rcs: 50, label: 'AIS', bio: false },
  train: { domain: 'GROUND', speedKmh: 90, altM: 0, rcs: 200, label: 'SCHED', bio: false },
  seismic: { domain: 'GROUND', speedKmh: 0, altM: 0, rcs: 0, label: 'SEISMIC', bio: false },
  debris: { domain: 'NEAR-SPACE', speedKmh: 27000, altM: 550000, rcs: 1, label: 'TLE', bio: false },
  gnss_anomaly: { domain: 'NEAR-SPACE', speedKmh: 3800, altM: 20200000, rcs: 0, label: 'RAIM', bio: false },
  wildfire: { domain: 'GROUND', speedKmh: 0, altM: 0, rcs: 0, label: 'FIRMS', bio: false },
};

function randomEdge(rng: Rng, margin = 58): [number, number] {
  const side = rng.int(4);
  const d = 60 + rng() * 10;
  let x = 0, y = 0;
  switch (side) {
    case 0: x = -d; y = (rng() - 0.5) * 120; break;
    case 1: x = d; y = (rng() - 0.5) * 120; break;
    case 2: x = (rng() - 0.5) * 120; y = -d; break;
    case 3: x = (rng() - 0.5) * 120; y = d; break;
  }
  return [x, y];
}

function pickKind(rng: Rng, controls: WorldControls): string {
  const roll = rng();
  if (controls.openData.adsb) {
    if (roll < 0.45) return 'airliner';
    if (roll < 0.55) return 'ga';
    if (roll < 0.60) return 'uav';
    if (roll < 0.70) return 'bird';
    if (roll < 0.75) return 'weather';
  }
  if (controls.openData.ais) {
    if (roll < 0.85) return 'cargo';
    if (roll < 0.92) return 'fishing';
  }
  if (roll < 0.95) return 'train';
  if (roll < 0.97 && controls.openData.tle) return 'debris';
  if (roll < 0.985 && controls.gnssHealth < 0.35) return 'gnss_anomaly';
  if (roll < 0.99 && controls.openData.firms) return 'wildfire';
  return 'bird';
}

function spawnTrack(rng: Rng, controls: WorldControls, idSeq: number): Track {
  const kind = pickKind(rng, controls);
  const def = KIND_DEFAULTS[kind];
  const [x, y] = randomEdge(rng);
  const heading = Math.atan2(-x, -y) * 180 / Math.PI + (rng() - 0.5) * 40;
  const speed = (def.speedKmh || 0) * (0.8 + rng() * 0.4);
  const track: Track = {
    id: `${kind.toUpperCase().slice(0,3)}-${idSeq.toString().padStart(3, '0')}`,
    kind,
    domain: def.domain!,
    x, y,
    headingDeg: (heading + 360) % 360,
    speedKmh: speed,
    altM: def.altM || 0,
    quality: 0.5 + rng() * 0.5,
    label: def.label || 'UNKNOWN',
    inbound: false,
    rcs: def.rcs || 1,
    bio: def.bio || false,
    lastSeen: 0,
    modelProb: { cv: 0.8, ct: 0.2 },
  };
  updateDerived(track);
  return track;
}

function updateDerived(t: Track): void {
  const vx = Math.cos(t.headingDeg * Math.PI / 180) * t.speedKmh / 3600;
  const vy = Math.sin(t.headingDeg * Math.PI / 180) * t.speedKmh / 3600;
  t.inbound = (t.x * vx + t.y * vy) < 0;
  t.lastSeen = 0;
}

function stepTrack(t: Track, dtS: number, rng: Rng): void {
  const turn = (rng() - 0.5) * 0.02;
  t.headingDeg = (t.headingDeg + turn * 180 / Math.PI + 360) % 360;
  t.modelProb.ct = Math.min(0.6, t.modelProb.ct + Math.abs(turn) * 5);
  t.modelProb.cv = 1 - t.modelProb.ct;
  const vx = Math.cos(t.headingDeg * Math.PI / 180) * t.speedKmh / 3600;
  const vy = Math.sin(t.headingDeg * Math.PI / 180) * t.speedKmh / 3600;
  t.x += vx * dtS;
  t.y += vy * dtS;
  t.quality = Math.max(0.05, Math.min(1, t.quality + (rng() - 0.48) * 0.02));
  updateDerived(t);
}

function targetCounts(controls: WorldControls): Record<string, number> {
  const ad = controls.adsbDensity;
  const ai = controls.aisDensity;
  return {
    airliner: Math.round(4 + ad * 12),
    ga: Math.round(2 + ad * 4),
    uav: ad > 0.7 ? 1 : 0,
    bird: 3,
    weather: ad > 0.5 ? 2 : 0,
    cargo: Math.round(3 + ai * 9),
    fishing: Math.round(1 + ai * 4),
    train: 2,
    debris: controls.openData.tle ? 2 : 0,
    gnss_anomaly: controls.gnssHealth < 0.35 ? 1 : 0,
    wildfire: 0,
  };
}

function countByKind(tracks: Track[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const t of tracks) c[t.kind] = (c[t.kind] || 0) + 1;
  return c;
}

let hazardSeq = 0;
let floodActive = false;
let floodTimer = 0;
let tsunamiActive = false;
let tsunamiHazard: Hazard | null = null;
let wildfireHazards: Hazard[] = [];

function updateHazards(world: World, dtS: number): void {
  const rng = world.rng;
  const c = world.controls;

  if (c.openData.usgs && rng() < c.seismicRate * 0.002 * dtS) {
    const at: [number, number] = [8 + rng() * 18, -12 + rng() * 10];
    const severity = 0.3 + rng() * 0.7;
    world.hazards.push({
      id: `SEIS-${++hazardSeq}`, type: 'seismic', at, severity,
      since: world.t, shelterRelevant: severity > 0.5
    });
    if (severity > 0.92 && !tsunamiActive) {
      tsunamiActive = true;
      const offshore: [number, number] = [at[0] - 15, at[1] - 30];
      tsunamiHazard = {
        id: `TSU-${hazardSeq}`, type: 'tsunami', at: offshore,
        severity: 0.7 + rng() * 0.3, since: world.t, shelterRelevant: true
      };
      world.hazards.push(tsunamiHazard);
    }
  }

  if (c.openData.metar) {
    floodTimer += dtS;
    const period = 600;
    if (!floodActive && floodTimer > period * (0.7 + rng() * 0.6)) {
      floodActive = true; floodTimer = 0;
      world.hazards.push({
        id: `FLD-${++hazardSeq}`, type: 'flood', at: [12.5, -5],
        severity: 0.5 + rng() * 0.4, since: world.t, shelterRelevant: true
      });
    } else if (floodActive && floodTimer > period * (0.2 + rng() * 0.3)) {
      floodActive = false; floodTimer = 0;
    }
  }

  if (c.openData.firms && rng() < 0.0005 * dtS) {
    const at: [number, number] = [10 + rng() * 15, -8 + rng() * 6];
    const h = { id: `WFD-${++hazardSeq}`, type: 'wildfire' as const, at, severity: 0.4 + rng() * 0.5, since: world.t, shelterRelevant: true };
    world.hazards.push(h);
    wildfireHazards.push(h);
  }

  wildfireHazards = wildfireHazards.filter(h => world.t - h.since < 1800);
  world.hazards = world.hazards.filter(h => {
    if (h.type === 'seismic') return world.t - h.since < 600;
    if (h.type === 'tsunami') return world.t - h.since < 3600;
    if (h.type === 'gnss') return world.t - h.since < 300;
    if (h.type === 'flood') return floodActive;
    if (h.type === 'wildfire') return world.t - h.since < 1800;
    return true;
  });

  if (tsunamiHazard && world.t - tsunamiHazard.since > 3600) {
    tsunamiActive = false; tsunamiHazard = null;
  }
  if (c.gnssHealth < 0.3 && rng() < 0.001 * dtS) {
    world.hazards.push({
      id: `GNSS-${++hazardSeq}`, type: 'gnss', at: [0, 0], severity: (0.3 - c.gnssHealth) / 0.3,
      since: world.t, shelterRelevant: false
    });
  }
}

export function createWorld(seed = 20260101): World {
  const rng = mulberry32(seed);
  const controls: WorldControls = {
    adsbDensity: 0.65, aisDensity: 0.55, gnssHealth: 0.88, seismicRate: 0.18,
    openData: { adsb: true, ais: true, metar: true, usgs: true, firms: true, tle: true },
    simSpeed: 4,
  };
  const tracks: Track[] = [];
  const hazards: Hazard[] = [];
  let idSeq = 0;
  let t = 0;

  for (let i = 0; i < 60; i++) {
    const tr = spawnTrack(rng, controls, ++idSeq);
    tracks.push(tr);
  }

  function step(dtS: number): void {
    const simDt = dtS * controls.simSpeed;
    t += simDt;
    for (const tr of tracks) tr.lastSeen += simDt;
    for (const tr of tracks) stepTrack(tr, simDt, rng);
    tracks.sort((a, b) => a.lastSeen - b.lastSeen);
    while (tracks.length > 200) tracks.shift();

    const targets = targetCounts(controls);
    const current = countByKind(tracks);
    for (const [kind, target] of Object.entries(targets)) {
      while ((current[kind] || 0) < target) {
        const tr = spawnTrack(rng, controls, ++idSeq);
        tracks.push(tr);
        current[kind] = (current[kind] || 0) + 1;
      }
    }
    for (const kind of Object.keys(current)) {
      const target = targets[kind] || 0;
      if (current[kind] > target * 1.5 && rng() < 0.05) {
        const idx = tracks.findIndex(t => t.kind === kind);
        if (idx >= 0) { tracks.splice(idx, 1); current[kind]--; }
      }
    }
    updateHazards(world as World, simDt);
  }

  const world: World = { t, tracks, hazards, controls, step, seed, rng };
  return world;
}