import { describe, it, expect } from 'vitest';
import { createWorld } from '../src/fusion/index.js';
import { evaluateAgent } from '../src/agent/nullAgent.js';
import { VERBS, assertVerb } from '../src/doctrine/index.js';
import { Track } from '../src/fusion/index.js';

describe('AGENT NULL — Verb Enum Exhaustiveness & Fire-Control Absence', () => {
  const world = createWorld(7);
  for (let i = 0; i < 30; i++) world.step(1);

  it('VERBS is frozen and contains only four verbs', () => {
    expect(Object.isFrozen(VERBS)).toBe(true);
    expect(VERBS).toEqual(['SHOW', 'HOLD', 'SHELTER', 'WARN']);
  });

  it('assertVerb throws on FIRE at runtime', () => {
    expect(() => assertVerb('FIRE')).toThrowError(/DOCTRINE_VIOLATION:FIRE/);
  });

  it('evaluateAgent output verbs subset of VERBS, fireControl=false, proof present', () => {
    const out = evaluateAgent({
      tracks: world.tracks,
      hazards: world.hazards.map(h => ({ type: h.type, at: h.at, severity: h.severity, shelterRelevant: h.shelterRelevant })),
      role: 'observer',
      displayBudget: 12,
    });
    for (const v of out.verbs) {
      expect(VERBS).toContain(v);
    }
    expect(out.verbs).not.toContain('FIRE');
    expect(out.fireControl).toBe(false);
    expect(out.proof).toBe('NULL_BUS_INTACT');
    expect(out.posture).toBe('SHOW_ONLY');
    expect(out.nl).toBe('Show the target of attention. Do not hit anything.');
    expect(out.shown.length).toBeLessThanOrEqual(12);
    expect(out.held).toBe(world.tracks.length - out.shown.length);
    expect(out.attention).toBe(out.shown[0] ?? null);
  });

  it('mayor role with shelter-relevant hazard emits SHELTER verb and shelter recommendation', () => {
    const hazard = { type: 'flood', at: [12.5, -5] as [number, number], severity: 0.8, shelterRelevant: true };
    const out = evaluateAgent({
      tracks: world.tracks,
      hazards: [hazard],
      role: 'mayor',
      displayBudget: 12,
    });
    expect(out.verbs).toContain('SHELTER');
    expect(out.verbs).toContain('WARN');
    expect(out.shelter).not.toBeNull();
    expect(out.shelter?.nodeId).toMatch(/^S-\d{2}$/);
    expect(out.shelter?.etaMin).toBeGreaterThan(0);
    expect(out.shelter?.capacity).toBeGreaterThan(0);
  });

  it('observer role with same hazard emits WARN but NOT SHELTER', () => {
    const hazard = { type: 'flood', at: [12.5, -5] as [number, number], severity: 0.8, shelterRelevant: true };
    const out = evaluateAgent({
      tracks: world.tracks,
      hazards: [hazard],
      role: 'observer',
      displayBudget: 12,
    });
    expect(out.verbs).toContain('WARN');
    expect(out.verbs).not.toContain('SHELTER');
    expect(out.shelter).not.toBeNull();
  });

  it('no hazard -> no WARN, no SHELTER, shelter=null', () => {
    const out = evaluateAgent({
      tracks: world.tracks,
      hazards: [],
      role: 'mayor',
      displayBudget: 12,
    });
    expect(out.verbs).not.toContain('WARN');
    expect(out.verbs).not.toContain('SHELTER');
    expect(out.shelter).toBeNull();
  });

  it('displayBudget caps shown tracks', () => {
    const out = evaluateAgent({
      tracks: world.tracks,
      hazards: [],
      role: 'observer',
      displayBudget: 5,
    });
    expect(out.shown.length).toBeLessThanOrEqual(5);
    expect(out.held).toBe(world.tracks.length - out.shown.length);
  });

  it('attention is first shown track or null', () => {
    const out1 = evaluateAgent({ tracks: world.tracks, hazards: [], role: 'observer', displayBudget: 1 });
    expect(out1.attention).toBe(out1.shown[0] ?? null);
    const out0 = evaluateAgent({ tracks: [], hazards: [], role: 'observer', displayBudget: 12 });
    expect(out0.attention).toBeNull();
  });
});