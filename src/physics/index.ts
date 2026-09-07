export const C = 299_792_458;
export const K_BOLTZMANN = 1.380_649e-23;
export const G = 6.67430e-11;
export const MU_EARTH = 398_600.4418;
export const R_EARTH_KM = 6371;
export const SEA_LEVEL_PRESSURE = 101325;

export function wavelengthM(fHz: number): number {
  return C / fHz;
}
export function frequencyHz(lambdaM: number): number {
  return C / lambdaM;
}
export function dopplerShiftHz(fHz: number, vRadialMps: number): number {
  return -(vRadialMps / C) * fHz + 0; // +0 normalizes -0 to +0
}

export function ellipseSumM(f1: [number, number], f2: [number, number], p: [number, number]): number {
  const d1 = Math.hypot(p[0] - f1[0], p[1] - f1[1]);
  const d2 = Math.hypot(p[0] - f2[0], p[1] - f2[1]);
  return d1 + d2;
}

export function ellipsePoint2D(a: number, c: number, t: number): [number, number] {
  const b = Math.sqrt(Math.max(0, a * a - c * c));
  return [a * Math.cos(t), b * Math.sin(t)];
}

export function tdoaRangeDiffM(dtSeconds: number): number {
  return C * dtSeconds;
}
export function tdoaSeconds(rangeDiffM: number): number {
  return rangeDiffM / C;
}

export function radioHorizonKm(h1m: number, h2m = 0): number {
  if (h1m <= 0 && h2m <= 0) return 0;
  return 4.12 * (Math.sqrt(Math.max(0, h1m)) + Math.sqrt(Math.max(0, h2m)));
}

export function freeSpacePathLossDb(fHz: number, rangeKm: number): number {
  const lambda = wavelengthM(fHz);
  const r = rangeKm * 1000;
  return 20 * Math.log10(4 * Math.PI * r / lambda);
}

export function illuminatorSnrDb({
  ptW = 50_000,
  gtDb = 10,
  fHz = 100e6,
  rangeKm,
  bandwidthHz = 8e6,
  noiseFigureDb = 4,
  tK = 290,
}: {
  ptW?: number;
  gtDb?: number;
  fHz?: number;
  rangeKm: number;
  bandwidthHz?: number;
  noiseFigureDb?: number;
  tK?: number;
}): number {
  const fspl = freeSpacePathLossDb(fHz, rangeKm);
  const prDbW = 10 * Math.log10(ptW) + gtDb - fspl;
  const nDbW = 10 * Math.log10(K_BOLTZMANN * tK * bandwidthHz) + noiseFigureDb;
  return prDbW - nDbW;
}

export interface GnssIntegrityResult {
  sats: Array<{ svid: number; cn0: number; residual: number }>;
  raimAlert: boolean;
}
export function gnssIntegrity(rng: () => number, health: number): GnssIntegrityResult {
  const sigma = 0.6 / Math.max(health, 0.02);
  const sats = Array.from({ length: 8 }, (_, i) => {
    const u1 = rng(), u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return {
      svid: i + 1,
      cn0: Math.max(20, 44 + (rng() - 0.5) * 4 - (1 - health) * 12),
      residual: z * sigma
    };
  });
  const raimAlert = sats.some(s => Math.abs(s.residual) > 4.0);
  return { sats, raimAlert };
}

export function seismicIntensity(mag: number, distKm: number): number {
  const d = Math.max(1, distKm);
  return Math.max(0, mag - 1.4 * Math.log10(d + 5));
}

export function tsunamiEtaMin(distKm: number, depthM = 2000): number {
  const v = Math.sqrt(9.81 * depthM);
  return (distKm * 1000) / v / 60;
}

export function orbitalPeriodMin(meanMotionRevPerDay: number): number {
  return 1440 / meanMotionRevPerDay;
}

export function orbitalVelocityKms(altKm: number): number {
  return Math.sqrt(MU_EARTH / (R_EARTH_KM + altKm));
}

export function debrisRangeRateKms(altKm: number, aspectDeg: number): number {
  const v = orbitalVelocityKms(altKm);
  return v * Math.sin((aspectDeg * Math.PI) / 180);
}

export const physicsReferences = [
  'Skolnik, Radar Handbook (3rd ed.) — Ch. 2, 3, 12 (public excerpts)',
  'Barton, Modern Radar System Analysis — Ch. 1-4',
  'ICAO Annex 10 Vol I–IV — open standards',
  'ITU-R P.525 (free-space), P.526 (diffraction), P.838 (rain)',
  'NASA Orbital Debris Quarterly News (public)',
  'USGS Earthquake Hazards Program — intensity models',
  'NOAA Tsunami Travel Time models (open)'
];

export interface VaultClockErrorResult {
  errorSec: number;
  confidenceLevel: number;
  source: string;
  timestamp: number;
}

export function vaultClockErrorSec(): VaultClockErrorResult {
  const errorSec = 50e-9;
  const confidenceLevel = 0.95;
  const source = 'PTP IEEE 1588v2 grandmaster';
  const timestamp = Date.now();
  return { errorSec, confidenceLevel, source, timestamp };
}