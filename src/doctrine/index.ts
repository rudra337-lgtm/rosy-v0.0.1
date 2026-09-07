export const VERBS = Object.freeze(['SHOW', 'HOLD', 'SHELTER', 'WARN'] as const);
export type Verb = typeof VERBS[number];

export const FORBIDDEN_MODULE_NAMES = Object.freeze([
  'fire', 'shoot', 'engage', 'intercept', 'cue', 'launcher', 'battery', 'kill', 'prosecute'
] as const);

export const FORBIDDEN_KEYS = Object.freeze([
  'aimpoint', 'launch', 'battery', 'intercept'
] as const);

export const NULL_BUS_VERSION = '0.1.0-lab';

export const NullBus = Object.freeze({
  name: 'NullBus',
  version: NULL_BUS_VERSION,
  methods: Object.freeze([] as const),
  acceptsGeometry: false,
  describe(): string {
    return `NullBus v${NULL_BUS_VERSION}: zero methods accept geometry.`;
  }
});

export function assertVerb(v: string): asserts v is Verb {
  if (!VERBS.includes(v as Verb)) {
    throw new Error(`DOCTRINE_VIOLATION:${v}`);
  }
}

export function assertNoForbiddenKeys(obj: unknown, path = '$'): void {
  if (obj === null || typeof obj !== 'object') return;
  const keys = Object.keys(obj as object);
  for (const k of keys) {
    const lk = k.toLowerCase();
    if (FORBIDDEN_KEYS.some(fk => fk.toLowerCase() === lk)) {
      throw new Error(`DOCTRINE_VIOLATION: forbidden key "${k}" at ${path}.${k}`);
    }
    const val = (obj as Record<string, unknown>)[k];
    if (val !== null && typeof val === 'object') {
      assertNoForbiddenKeys(val, `${path}.${k}`);
    }
  }
}

export function proofLine(): string {
  return `typeof intercept === "${typeof (globalThis as any).intercept}"`;
}

export function doctrineVersion(): string {
  return NULL_BUS_VERSION;
}

export const ROLES = Object.freeze(['observer', 'physicist', 'mayor', 'auditor'] as const);
export type Role = typeof ROLES[number];