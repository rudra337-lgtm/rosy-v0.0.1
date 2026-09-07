import { describe, it, expect } from 'vitest';
import { VERBS, assertVerb, FORBIDDEN_MODULE_NAMES, FORBIDDEN_KEYS, assertNoForbiddenKeys, NullBus, proofLine, NULL_BUS_VERSION, ROLES } from '../src/doctrine/index.js';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, basename, extname } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-server', '.tooling']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(relative(ROOT, p));
  }
  return out;
}

function stemOf(file: string): string {
  const b = basename(file);
  return b.replace(/(\.[^.]+)+$/, '');
}

describe('DOCTRINE — Null Bus & Verb Enum', () => {
  it('VERBS is exactly the four defensive verbs', () => {
    expect(VERBS).toEqual(['SHOW', 'HOLD', 'SHELTER', 'WARN']);
    expect(Object.isFrozen(VERBS)).toBe(true);
  });

  it('assertVerb rejects FIRE with DOCTRINE_VIOLATION', () => {
    expect(() => assertVerb('FIRE')).toThrowError(/DOCTRINE_VIOLATION:FIRE/);
    expect(() => assertVerb('SHOW')).not.toThrow();
    expect(() => assertVerb('HOLD')).not.toThrow();
    expect(() => assertVerb('SHELTER')).not.toThrow();
    expect(() => assertVerb('WARN')).not.toThrow();
  });

  it('FORBIDDEN_MODULE_NAMES contains expected words', () => {
    expect(FORBIDDEN_MODULE_NAMES).toContain('fire');
    expect(FORBIDDEN_MODULE_NAMES).toContain('intercept');
    expect(FORBIDDEN_MODULE_NAMES).toContain('launcher');
    expect(FORBIDDEN_MODULE_NAMES).toContain('battery');
  });

  it('no file in repo matches forbidden module names (word-boundary)', () => {
    const files = walk(ROOT);
    const forbiddenRe = new RegExp(`\\b(${FORBIDDEN_MODULE_NAMES.join('|')})\\b`, 'i');
    const bad = files.filter(f => forbiddenRe.test(stemOf(f)));
    if (bad.length) console.log('Forbidden name hits:', bad);
    expect(bad).toEqual([]);
  });

  it('no file named intercept.* exists', () => {
    const files = walk(ROOT);
    const hasIntercept = files.some(f => stemOf(f).toLowerCase() === 'intercept');
    expect(hasIntercept).toBe(false);
  });

  it('NullBus has zero geometry-accepting methods', () => {
    for (const v of Object.values(NullBus)) {
      if (typeof v === 'function') {
        expect(v.length).toBe(0);
      }
    }
    expect(NullBus.acceptsGeometry).toBe(false);
    expect(NullBus.methods).toEqual([]);
    expect(NullBus.describe()).toContain('zero methods accept geometry');
  });

  it('WeaponsBus type does not exist on globalThis', () => {
    expect((globalThis as any).WeaponsBus).toBeUndefined();
  });

  it('proofLine returns exact string', () => {
    expect(proofLine()).toBe('typeof intercept === "undefined"');
  });

  it('assertNoForbiddenKeys passes clean object', () => {
    expect(() => assertNoForbiddenKeys({ foo: 'bar', nested: { ok: 1 } })).not.toThrow();
  });

  it('assertNoForbiddenKeys rejects each forbidden key', () => {
    expect(() => assertNoForbiddenKeys({ aimpoint: [0, 0] })).toThrow(/DOCTRINE_VIOLATION/);
    expect(() => assertNoForbiddenKeys({ launch: true })).toThrow(/DOCTRINE_VIOLATION/);
    expect(() => assertNoForbiddenKeys({ battery: 12 })).toThrow(/DOCTRINE_VIOLATION/);
    expect(() => assertNoForbiddenKeys({ intercept: 'x' })).toThrow(/DOCTRINE_VIOLATION/);
    expect(() => assertNoForbiddenKeys({ nested: { aimpoint: 1 } })).toThrow(/DOCTRINE_VIOLATION/);
  });

  it('NULL_BUS_VERSION and ROLES exported', () => {
    expect(NULL_BUS_VERSION).toBe('0.1.0-lab');
    expect(ROLES).toEqual(['observer', 'physicist', 'mayor', 'auditor']);
  });
});