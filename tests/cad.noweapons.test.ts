import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CAD, totalMassKg } from '../src/cad/model.js';

const CAD_PATH = resolve(process.cwd(), 'cad/palladium-null-array.cad.json');
const raw = readFileSync(CAD_PATH, 'utf-8');
const parsed = JSON.parse(raw);

describe('CAD — No Weapons Interface', () => {
  it('interfaces.weapons is explicitly null', () => {
    expect(parsed.interfaces.weapons).toBeNull();
  });

  it('interfaces has exactly the four declared keys', () => {
    expect(Object.keys(parsed.interfaces).sort()).toEqual(['data_out', 'ptp_clock', 'rf_in', 'weapons']);
  });

  it('compliance declares no transmitter, no exciter, receive-only doctrine', () => {
    expect(parsed.compliance.transmitter).toBe('none');
    expect(parsed.compliance.exciter).toBe('absent');
    expect(parsed.compliance.doctrine).toBe('receive-only');
  });

  it('no part name/id contains forbidden module words (word-boundary)', () => {
    const forbidden = ['fire', 'shoot', 'engage', 'intercept', 'cue', 'launcher', 'battery', 'kill', 'prosecute'];
    const re = new RegExp(`\\b(${forbidden.join('|')})\\b`, 'i');
    for (const p of parsed.parts) {
      expect(re.test(p.id)).toBe(false);
      expect(re.test(p.name)).toBe(false);
    }
  });

  it('massEstimateKg equals sum of part masses', () => {
    const sum = parsed.parts.reduce((s: number, p: any) => s + p.massKg, 0);
    expect(sum).toBe(parsed.massEstimateKg);
  });

  it('CAD model export matches JSON and has weapons === null', () => {
    expect(CAD.interfaces.weapons).toBeNull();
    expect(totalMassKg()).toBe(parsed.massEstimateKg);
  });
});