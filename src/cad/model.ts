import cadJson from '../../cad/palladium-null-array.cad.json';

export interface CadPart {
  id: string;
  name: string;
  geometry: { type: string; params: Record<string, number> };
  material: string;
  massKg: number;
  notes: string;
}

export interface CadInterface {
  rf_in: { type: string; note: string };
  ptp_clock: { type: string; note: string };
  data_out: { type: string; note: string };
  weapons: null;
}

export interface CadSignage {
  id: string;
  text: string;
  position: [number, number, number];
}

export interface CadCompliance {
  transmitter: 'none';
  exciter: 'absent';
  doctrine: 'receive-only';
}

export interface CadModel {
  schema: string;
  name: string;
  units: 'meters';
  massEstimateKg: number;
  materials: string[];
  parts: CadPart[];
  interfaces: CadInterface;
  signage: CadSignage[];
  compliance: CadCompliance;
}

export const CAD: CadModel = cadJson as CadModel;

export function totalMassKg(): number {
  return CAD.parts.reduce((s, p) => s + p.massKg, 0);
}

export function findPart(id: string): CadPart | undefined {
  return CAD.parts.find(p => p.id === id);
}

export function cadVersion(): string {
  return CAD.schema;
}