import { describe, it, expect } from 'vitest';
import {
  C, wavelengthM, frequencyHz, dopplerShiftHz, ellipseSumM, ellipsePoint2D,
  tdoaRangeDiffM, tdoaSeconds, radioHorizonKm, freeSpacePathLossDb,
  illuminatorSnrDb, gnssIntegrity, seismicIntensity, tsunamiEtaMin,
  orbitalPeriodMin, orbitalVelocityKms, debrisRangeRateKms
} from '../src/physics/index.js';

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

describe('PHYSICS — Open Receive-Only Identities', () => {
  it('wavelength * frequency = c', () => {
    const f = 2.4e9;
    const lam = wavelengthM(f);
    expect(lam * f / C).toBeCloseTo(1, 12);
  });

  it('round-trip frequency(wavelength(f)) = f', () => {
    const f = 5.8e9;
    expect(frequencyHz(wavelengthM(f))).toBeCloseTo(f, 6);
  });

  it('dopplerShiftHz zero at zero velocity', () => {
    expect(dopplerShiftHz(1e9, 0)).toBe(0);
  });

  it('doppler sign: receding positive v gives negative shift', () => {
    const shift = dopplerShiftHz(1e9, 1000);
    expect(shift).toBeLessThan(0);
    expect(Math.abs(shift)).toBeCloseTo(3335.64, 1);
  });

  it('ellipseSumM constant on ellipse', () => {
    const f1: [number, number] = [-3, 0];
    const f2: [number, number] = [3, 0];
    const a = 5;
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      const p = ellipsePoint2D(a, 3, t);
      const sum = ellipseSumM(f1, f2, p);
      expect(sum).toBeCloseTo(2 * a, 9);
    }
  });

  it('tdoa round-trip', () => {
    const dt = 12.345e-6;
    const d = tdoaRangeDiffM(dt);
    expect(tdoaSeconds(d)).toBeCloseTo(dt, 12);
  });

  it('radioHorizonKm monotonic and zero at zero', () => {
    expect(radioHorizonKm(0)).toBe(0);
    expect(radioHorizonKm(10)).toBeGreaterThan(radioHorizonKm(5));
    expect(radioHorizonKm(100)).toBeGreaterThan(radioHorizonKm(50));
    expect(radioHorizonKm(100, 0)).toBeCloseTo(41.2, 1);
  });

  it('freeSpacePathLossDb ~72.45 dB at 100 MHz / 1 km', () => {
    expect(freeSpacePathLossDb(100e6, 1)).toBeCloseTo(72.45, 0.1);
  });

  it('illuminatorSnrDb decreases ~6 dB per doubling of range', () => {
    const snr1 = illuminatorSnrDb({ ptW: 50e3, gtDb: 10, fHz: 100e6, rangeKm: 50, bandwidthHz: 8e6 });
    const snr2 = illuminatorSnrDb({ ptW: 50e3, gtDb: 10, fHz: 100e6, rangeKm: 100, bandwidthHz: 8e6 });
    expect(snr1 - snr2).toBeCloseTo(6.02, 0.05);
  });

  it('gnssIntegrity: healthy -> no RAIM alert (seed 7)', () => {
    const rng = mulberry32(7);
    const { raimAlert } = gnssIntegrity(rng, 1.0);
    expect(raimAlert).toBe(false);
  });

  it('gnssIntegrity: degraded -> RAIM alert (seed 7)', () => {
    const rng = mulberry32(7);
    const { raimAlert } = gnssIntegrity(rng, 0.02);
    expect(raimAlert).toBe(true);
  });

  it('seismicIntensity decreases with distance', () => {
    const i1 = seismicIntensity(6.0, 10);
    const i2 = seismicIntensity(6.0, 100);
    const i3 = seismicIntensity(6.0, 500);
    expect(i1).toBeGreaterThan(i2);
    expect(i2).toBeGreaterThan(i3);
    expect(i3).toBeGreaterThanOrEqual(0);
  });

  it('tsunamiEtaMin linear in distance', () => {
    const t1 = tsunamiEtaMin(100, 2000);
    const t2 = tsunamiEtaMin(200, 2000);
    expect(t2 / t1).toBeCloseTo(2, 3);
  });

  it('orbitalPeriodMin(15.5) ≈ 92.9 min', () => {
    expect(orbitalPeriodMin(15.5)).toBeCloseTo(92.903, 1);
  });

  it('orbitalVelocityKms(400 km) ~ 7.67 km/s', () => {
    expect(orbitalVelocityKms(400)).toBeCloseTo(7.67, 0.05);
  });

  it('debrisRangeRateKms returns sensible value', () => {
    const rr = debrisRangeRateKms(550, 30);
    expect(rr).toBeGreaterThan(0);
    expect(rr).toBeLessThan(8);
  });
});