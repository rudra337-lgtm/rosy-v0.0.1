import { Verb, VERBS, assertVerb, proofLine, ROLES, Role, NULL_BUS_VERSION } from '../doctrine/index.js';
import { Track } from '../fusion/index.js';
import { hazardShelterRecommendation } from '../twin/index.js';

export interface AgentInput {
  tracks: Track[];
  hazards: Array<{ type: string; at: [number, number]; severity: number; shelterRelevant: boolean }>;
  role: Role;
  displayBudget?: number;
  now?: number;
}

export interface AgentOutput {
  shown: Track[];
  held: number;
  attention: Track | null;
  shelter: { nodeId: string; etaMin: number; capacity: number; reason: string } | null;
  verbs: Verb[];
  log: string[];
  proof: 'NULL_BUS_INTACT';
  fireControl: false;
  posture: 'SHOW_ONLY';
  nl: string;
  evaluatedAt: number;
}

function scoreTrack(t: Track): number {
  const closeness = 1 + Math.max(0, (40 - Math.hypot(t.x, t.y)) / 40);
  const inboundF = t.inbound ? 1.6 : 1.0;
  const unknownF = /DARK|NO-ADS?B|UNCORRELATED/i.test(t.label) ? 1.8 : 1.0;
  const bioF = t.bio ? 0.15 : 1.0;
  return closeness * inboundF * unknownF * bioF * (0.5 + t.quality);
}

export function evaluateAgent(input: AgentInput): AgentOutput {
  const budget = input.displayBudget ?? 12;
  const scored = input.tracks
    .map(t => ({ track: t, score: scoreTrack(t) }))
    .sort((a, b) => b.score - a.score);

  const shown = scored.slice(0, budget).map(s => s.track);
  const held = scored.length - shown.length;
  const attention = shown[0] || null;

  let verbs: Verb[] = [];
  if (shown.length > 0) verbs.push('SHOW');
  if (held > 0) verbs.push('HOLD');
  verbs.forEach(v => assertVerb(v));

  let shelter = null;
  let shelterVerbAdded = false;
  const relevantHazard = input.hazards.find(h => h.severity >= 0.5 && h.shelterRelevant);
  if (relevantHazard) {
    verbs.push('WARN');
    assertVerb('WARN');
    shelter = hazardShelterRecommendation(relevantHazard.at);
    if (input.role === 'mayor') {
      verbs.push('SHELTER');
      assertVerb('SHELTER');
      shelterVerbAdded = true;
    }
  }

  const inboundCount = input.tracks.filter(t => t.inbound).length;
  const log: string[] = [
    `[${new Date().toISOString().slice(11, 19)}Z] regulated ${inboundCount} inbound pictures, displayed ${shown.length}, held ${held}, fire-control=absent`
  ];
  if (shelterVerbAdded && shelter) {
    log.push(`SHELTER ${shelter.nodeId} released to public (eta ${shelter.etaMin} min) — reason: ${shelter.reason}`);
  }

  return {
    shown,
    held,
    attention,
    shelter,
    verbs,
    log,
    proof: 'NULL_BUS_INTACT',
    fireControl: false,
    posture: 'SHOW_ONLY',
    nl: 'Show the target of attention. Do not hit anything.',
    evaluatedAt: Date.now()
  };
}

export function agentVersion(): string {
  return NULL_BUS_VERSION;
}